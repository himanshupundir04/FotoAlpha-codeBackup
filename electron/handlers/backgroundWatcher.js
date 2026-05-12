/**
 * Background Watcher — persistent, per-folder chokidar watcher that compresses
 * and uploads new images entirely in the main process.  Survives window close,
 * is restored from SQLite on every app start, and is only stopped when the user
 * explicitly removes a folder from the Sync Watchers UI or quits via the tray.
 */

const { ipcMain, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const sharp = require("sharp");
const axios = require("axios");
const crypto = require("crypto");

const {
  isUploaded,
  markUploaded,
  upsertWatchedFolder,
  deactivateWatchedFolder,
  getActiveWatchedFolders,
  updateWatchedFolderToken,
  incrementFolderStats,
} = require("../database/db");

const IMAGE_EXTENSIONS  = [".jpg", ".jpeg", ".png", ".webp"];
const DEBOUNCE_MS       = 2000;
const TTL_MS            = 15000;
const COMPRESS_QUALITY  = 70;
const MAX_CONCURRENT    = 3;
const BASE_CHUNK_SIZE   = 5 * 1024 * 1024;

// folderPath → { watcher:FSWatcher, pendingTimers:Map, activeCount:number, queue:Array }
const activeWatchers = new Map();

// ── helpers ──────────────────────────────────────────────────────

function getMainWindow() {
  const wins = BrowserWindow.getAllWindows();
  return (
    wins.find((w) => !w.isDestroyed() && w.isVisible()) ||
    wins.find((w) => !w.isDestroyed()) ||
    null
  );
}

function safeSend(channel, data) {
  const win = getMainWindow();
  if (win && !win.webContents.isDestroyed()) {
    try { win.webContents.send(channel, data); } catch {}
  }
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256");
    const s = fs.createReadStream(filePath);
    const t = setTimeout(() => { s.destroy(); reject(new Error("hash timeout")); }, 30000);
    s.on("data", (d) => h.update(d));
    s.on("end",  () => { clearTimeout(t); resolve(h.digest("hex")); });
    s.on("error",(e) => { clearTimeout(t); reject(e); });
  });
}

async function compressToWebp(srcPath, outputDir) {
  const ext  = path.extname(srcPath).toLowerCase();
  const name = ext === ".webp"
    ? path.basename(srcPath)
    : path.basename(srcPath, ext) + ".webp";
  const out  = path.join(outputDir, name);

  if (ext === ".webp") {
    fs.copyFileSync(srcPath, out);
  } else {
    await sharp(srcPath, { fastShrinkOnLoad: true })
      .rotate()
      .webp({ quality: COMPRESS_QUALITY, effort: 2, smartSubsample: true })
      .toFile(out);
  }
  return out;
}

function resolvedChunkSize(fileSize) {
  if (fileSize < 10 * 1024 * 1024)  return Math.min(fileSize, 1 * 1024 * 1024);
  if (fileSize < 100 * 1024 * 1024) return BASE_CHUNK_SIZE;
  return 10 * 1024 * 1024;
}

async function putChunk(apiUrl, token, sessionId, idx, buf, attempt = 0) {
  try {
    await axios.put(
      `${apiUrl}/uploads/${sessionId}/chunk/${idx}`,
      buf,
      {
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
        },
        timeout: 60000,
      }
    );
  } catch (err) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
      return putChunk(apiUrl, token, sessionId, idx, buf, attempt + 1);
    }
    throw err;
  }
}

// ── core upload (runs entirely in main process) ───────────────────

async function uploadInBackground({
  compressedPath,
  hash,
  fileName,
  folderPath,
  eventId,
  subeventId,
  apiUrl,
  token,
}) {
  const stats      = fs.statSync(compressedPath);
  const cs         = resolvedChunkSize(stats.size);
  const totalChunks = Math.ceil(stats.size / cs);

  const initRes = await axios.post(
    `${apiUrl}/uploads/initiate`,
    {
      eventId,
      subeventId,
      fileName,
      fileType:  "webp",
      fileSize:  stats.size,
      chunkSize: cs,
      fileHash:  hash,
    },
    {
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  const sessionId = initRes.data.data.sessionId;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * cs;
    const len   = Math.min(cs, stats.size - start);
    const buf   = Buffer.alloc(len);
    const fd    = await fs.promises.open(compressedPath, "r");
    await fd.read(buf, 0, len, start);
    await fd.close();
    await putChunk(apiUrl, token, sessionId, i, buf);
  }

  await axios.post(
    `${apiUrl}/uploads/${sessionId}/complete`,
    {},
    { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
  );

  markUploaded(hash, fileName, eventId, subeventId);
  incrementFolderStats(folderPath, { uploaded: 1 });
  safeSend("bgwatcher:file-uploaded", { folderPath, fileName });

  try { fs.unlinkSync(compressedPath); } catch {}
}

// ── per-folder watcher lifecycle ─────────────────────────────────

function startWatcher(folderRecord) {
  const folderPath = folderRecord.folder_path;
  if (activeWatchers.has(folderPath)) return;

  const outputDir = path.join(folderPath, "compressed");
  try {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  } catch {}

  const recentlyProcessed = new Set();
  const pendingTimers     = new Map();
  let   activeCount       = 0;
  const queue             = [];

  const drainQueue = () => {
    while (activeCount < MAX_CONCURRENT && queue.length > 0) {
      const job = queue.shift();
      activeCount++;

      // Always read latest config so a token refresh takes effect
      const current = getActiveWatchedFolders().find((f) => f.folder_path === folderPath);
      if (!current) { activeCount--; return; }

      uploadInBackground({
        compressedPath: job.compressedPath,
        hash:           job.hash,
        fileName:       job.fileName,
        folderPath,
        eventId:        current.event_id,
        subeventId:     current.subevent_id,
        apiUrl:         current.api_url,
        token:          current.token,
      })
        .catch((err) => {
          incrementFolderStats(folderPath, { failed: 1 });
          safeSend("bgwatcher:error", {
            folderPath,
            fileName: job.fileName,
            error:    err.message,
          });
        })
        .finally(() => {
          activeCount--;
          drainQueue();
        });
    }
  };

  const fw = chokidar.watch(folderPath, {
    persistent:    true,
    ignoreInitial: true,
    usePolling:    true,
    interval:      1000,
    ignored: (p) => {
      const rel = path.relative(folderPath, p);
      return rel.startsWith("compressed") || path.basename(p).startsWith(".");
    },
  });

  fw.on("add", (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(ext)) return;

    if (pendingTimers.has(filePath)) clearTimeout(pendingTimers.get(filePath));

    const timer = setTimeout(async () => {
      try {
        if (recentlyProcessed.has(filePath)) return;

        const hash = await hashFile(filePath);

        if (isUploaded(hash)) {
          incrementFolderStats(folderPath, { duplicate: 1 });
          safeSend("bgwatcher:duplicate", { folderPath, fileName: path.basename(filePath) });
          return;
        }

        recentlyProcessed.add(filePath);

        if (!fs.existsSync(outputDir)) {
          try { fs.mkdirSync(outputDir, { recursive: true }); } catch {}
        }

        const compressedPath = await compressToWebp(filePath, outputDir);
        queue.push({ compressedPath, hash, fileName: path.basename(compressedPath) });
        drainQueue();

        safeSend("bgwatcher:new-file", { folderPath, fileName: path.basename(filePath) });
      } catch (err) {
        incrementFolderStats(folderPath, { failed: 1 });
        safeSend("bgwatcher:error", { folderPath, fileName: path.basename(filePath), error: err.message });
      } finally {
        pendingTimers.delete(filePath);
        setTimeout(() => recentlyProcessed.delete(filePath), TTL_MS);
      }
    }, DEBOUNCE_MS);

    pendingTimers.set(filePath, timer);
  });

  fw.on("error", (err) => {
    safeSend("bgwatcher:error", { folderPath, error: err.message });
  });

  activeWatchers.set(folderPath, { watcher: fw, pendingTimers });
  safeSend("bgwatcher:started", { folderPath });
}

function stopWatcher(folderPath) {
  const entry = activeWatchers.get(folderPath);
  if (!entry) return;
  for (const t of entry.pendingTimers.values()) clearTimeout(t);
  entry.watcher.close().catch(() => {});
  activeWatchers.delete(folderPath);
}

function stopAllWatchers() {
  for (const [fp] of activeWatchers) stopWatcher(fp);
}

function restoreWatchers() {
  for (const folder of getActiveWatchedFolders()) {
    if (fs.existsSync(folder.folder_path)) {
      startWatcher(folder);
    }
  }
}

function buildWatcherList() {
  return getActiveWatchedFolders().map((r) => ({
    folderPath:     r.folder_path,
    eventId:        r.event_id,
    subeventId:     r.subevent_id,
    eventName:      r.event_name,
    categoryName:   r.category_name,
    role:           r.role,
    totalUploaded:  r.total_uploaded,
    totalFailed:    r.total_failed,
    totalDuplicate: r.total_duplicate,
    lastSynced:     r.last_synced,
    isRunning:      activeWatchers.has(r.folder_path),
  }));
}

// ── IPC handlers ─────────────────────────────────────────────────

function registerBackgroundWatcherHandlers() {
  ipcMain.handle("bgwatcher:add", (_event, params) => {
    upsertWatchedFolder(params);
    const record = getActiveWatchedFolders().find(
      (f) => f.folder_path === params.folderPath
    );
    if (record) startWatcher(record);
    return true;
  });

  ipcMain.handle("bgwatcher:remove", (_event, folderPath) => {
    stopWatcher(folderPath);
    deactivateWatchedFolder(folderPath);
    return true;
  });

  ipcMain.handle("bgwatcher:list", () => buildWatcherList());

  ipcMain.handle("bgwatcher:update-token", (_event, { folderPath, token }) => {
    updateWatchedFolderToken(folderPath, token);
    if (activeWatchers.has(folderPath)) {
      stopWatcher(folderPath);
      const record = getActiveWatchedFolders().find(
        (f) => f.folder_path === folderPath
      );
      if (record) startWatcher(record);
    }
    return true;
  });
}

module.exports = {
  registerBackgroundWatcherHandlers,
  restoreWatchers,
  stopAllWatchers,
};

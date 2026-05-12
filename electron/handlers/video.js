const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const chokidar = require("chokidar");

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".avi", ".webm"];
const VIDEO_DEBOUNCE_MS = 3000;
const RECENTLY_PROCESSED_TTL = 15000;

const MIME_TYPES = {
  ".mp4":  "video/mp4",
  ".mov":  "video/quicktime",
  ".mkv":  "video/x-matroska",
  ".avi":  "video/x-msvideo",
  ".webm": "video/webm",
};

const { isVideoUploaded, markVideoUploaded } = require("../database/db");

function getVideoHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    const timeout = setTimeout(() => {
      stream.destroy();
      reject(new Error("Hash timeout"));
    }, 30000);
    stream.on("data", (d) => hash.update(d));
    stream.on("end", () => {
      clearTimeout(timeout);
      resolve(hash.digest("hex"));
    });
    stream.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function buildFileRecord(filePath, hash) {
  const ext = path.extname(filePath).toLowerCase();
  const stats = fs.statSync(filePath);
  return {
    id:   filePath,
    name: path.basename(filePath),
    path: filePath,
    size: stats.size,
    hash,
    type: MIME_TYPES[ext] || "video/mp4",
  };
}

let videoFolderWatcher = null;
let videoTimerMap = new Map();
let videoRecentlyProcessed = new Set();

let passthroughQueue = [];
let passthroughCancelled = false;
let passthroughInProgress = false;

function registerVideoHandlers() {
  ipcMain.handle("select-video-folder", async (event) => {
    const { dialog, BrowserWindow } = require("electron");
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("read-video-folder", async (event, folderPath) => {
    if (!folderPath || typeof folderPath !== "string") {
      throw new Error("Invalid folder path");
    }

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => VIDEO_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map((f) => ({
        name: f,
        path: path.join(folderPath, f),
      }));

    event.sender.send("total-video-count", files.length);
    return files;
  });

  ipcMain.handle("read-file-buffer-video", async (_event, filePath) => {
    if (!filePath || typeof filePath !== "string" || filePath.includes("..")) {
      throw new Error("Invalid file path");
    }
    return fs.readFileSync(filePath);
  });

  ipcMain.handle("compress-videos-parallel", async (event, videoPaths) => {
    if (passthroughInProgress) {
      throw new Error("Upload already in progress");
    }
    passthroughInProgress = true;
    passthroughCancelled = false;
    passthroughQueue = [...videoPaths];

    const processNext = async () => {
      if (passthroughCancelled || passthroughQueue.length === 0) {
        passthroughInProgress = false;
        return;
      }

      const videoPath = passthroughQueue.shift();

      try {
        const hash = await getVideoHash(videoPath);
        if (!passthroughCancelled) {
          const record = buildFileRecord(videoPath, hash);
          event.sender.send("compressed-video-ready", record);
        }
      } catch (err) {
        if (!passthroughCancelled && event.sender && !event.sender.isDestroyed()) {
          event.sender.send("watcher-error", {
            filePath: videoPath,
            message: `Video hash failed: ${err.message}`,
          });
        }
      }

      setImmediate(processNext);
    };

    setImmediate(processNext);
    return true;
  });

  ipcMain.handle("cancel-video-compress", async () => {
    passthroughCancelled = true;
    passthroughInProgress = false;
    passthroughQueue.length = 0;
    return true;
  });

  ipcMain.handle("watch-video-folder", async (event, folderPath) => {
    if (!folderPath || typeof folderPath !== "string") {
      throw new Error("Invalid folder path");
    }

    if (videoFolderWatcher) {
      videoFolderWatcher.close();
    }

    for (const timer of videoTimerMap.values()) {
      clearTimeout(timer);
    }
    videoTimerMap = new Map();
    videoRecentlyProcessed = new Set();

    videoFolderWatcher = chokidar.watch(folderPath, {
      persistent: true,
      ignoreInitial: true,
      usePolling: false,
      interval: 1000,
    });

    videoFolderWatcher.on("error", (err) => {
      if (event.sender && !event.sender.isDestroyed()) {
        event.sender.send("watcher-error", {
          filePath: folderPath,
          message: `Video watcher error: ${err.message}`,
        });
      }
    });

    videoFolderWatcher.on("add", (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!VIDEO_EXTENSIONS.includes(ext)) return;

      if (videoTimerMap.has(filePath)) {
        clearTimeout(videoTimerMap.get(filePath));
      }

      const timer = setTimeout(async () => {
        try {
          if (videoRecentlyProcessed.has(filePath)) return;

          const hash = await getVideoHash(filePath);
          if (isVideoUploaded(hash)) return;

          videoRecentlyProcessed.add(filePath);
          const record = buildFileRecord(filePath, hash);
          markVideoUploaded(hash, record.name);

          if (event.sender && !event.sender.isDestroyed()) {
            event.sender.send("compressed-video-ready", record);
          }
        } catch (err) {
          if (event.sender && !event.sender.isDestroyed()) {
            event.sender.send("watcher-error", {
              filePath,
              message: `Video watcher error: ${err.message}`,
            });
          }
        } finally {
          videoTimerMap.delete(filePath);
          setTimeout(() => videoRecentlyProcessed.delete(filePath), RECENTLY_PROCESSED_TTL);
        }
      }, VIDEO_DEBOUNCE_MS);

      videoTimerMap.set(filePath, timer);
    });

    return true;
  });

  ipcMain.handle("stop-watching-video-folder", async () => {
    if (videoFolderWatcher) {
      videoFolderWatcher.close();
      videoFolderWatcher = null;
    }
    return true;
  });
}

module.exports = { registerVideoHandlers };

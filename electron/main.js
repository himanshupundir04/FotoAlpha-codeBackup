const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const chokidar = require("chokidar");
const crypto = require("crypto");
const os = require("os");
const si = require("systeminformation");

const ffmpeg = require("fluent-ffmpeg");
// const ffmpegPath = require("ffmpeg-static");
// const ffprobePath = require("ffprobe-static").path;

let ffmpegPath;
let ffprobePath;

if (app.isPackaged) {
  // ✅ EXE MODE (asar-unpacked)
  ffmpegPath = path.join(
    process.resourcesPath,
    "app.asar.unpacked",
    "node_modules",
    "ffmpeg-static",
    "ffmpeg.exe"
  );

  ffprobePath = path.join(
    process.resourcesPath,
    "app.asar.unpacked",
    "node_modules",
    "ffprobe-static",
    "bin",
    "win32",
    "x64",
    "ffprobe.exe"
  );
} else {
  // ✅ DEV MODE
  ffmpegPath = require("ffmpeg-static");
  ffprobePath = require("ffprobe-static").path;
}

// 🔥 SET PATHS ONCE, AFTER DECISION
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// console.log("🎬 ffmpeg:", ffmpegPath);
// console.log("🎞 ffprobe:", ffprobePath);

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let mainWindow;

const storeFile = path.join(app.getPath("userData"), "data.json");

function ensureFileExists() {
  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify({}));
  }
}

ipcMain.handle("store:set", (event, key, value) => {
  ensureFileExists();
  const data = JSON.parse(fs.readFileSync(storeFile, "utf8"));
  data[key] = value;
  fs.writeFileSync(storeFile, JSON.stringify(data, null, 2));
});

ipcMain.handle("store:get", (event, key) => {
  ensureFileExists();
  const data = JSON.parse(fs.readFileSync(storeFile, "utf8"));
  return data[key];
});

app.whenReady().then(async () => {
  createWindow();
});

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    icon: "icon.ico",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Menu.setApplicationMenu(null);

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "build", "index.html"), {
      baseURLForDataURL: `file://${path.join(__dirname, "..", "build")}/`,
    });
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("getSystemStats", async () => {
  const cpus = os.cpus();

  return {
    cpu: {
      model: cpus[0].model,
      cores: cpus.length,
    },
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
    },
  };
});

let lastTx = null;
let lastTime = null;
let smoothedSpeed = 0;

ipcMain.handle("getNetworkSpeed", async () => {
  const stats = await si.networkStats();

  // pick the active interface only
  const iface = stats.find((i) => i.operstate === "up") || stats[0];
  if (!iface) return 0;

  const now = Date.now();

  if (lastTx === null) {
    lastTx = iface.tx_bytes;
    lastTime = now;
    return 0;
  }

  const byteDiff = iface.tx_bytes - lastTx;
  const timeDiff = (now - lastTime) / 1000;

  lastTx = iface.tx_bytes;
  lastTime = now;

  // ❌ invalid data → return previous stable value
  if (byteDiff < 0 || timeDiff <= 0) {
    return smoothedSpeed.toFixed(2);
  }

  let speedMB = byteDiff / 1024 / 1024 / timeDiff;

  // ❌ clamp unrealistic spikes (adjust if needed)
  if (speedMB > 50) speedMB = 50;

  // ✅ smoothing (EMA)
  smoothedSpeed = smoothedSpeed * 0.7 + speedMB * 0.3;

  return smoothedSpeed.toFixed(2);
});

// ---------- Helpers ----------
const sentImagesPath = path.join(app.getPath("userData"), "sent_images.json");

function getSentImages() {
  if (!fs.existsSync(sentImagesPath)) return [];
  return JSON.parse(fs.readFileSync(sentImagesPath, "utf-8"));
}

function saveSentImage(name, hash) {
  const current = getSentImages();
  current.push({ name, hash });
  fs.writeFileSync(sentImagesPath, JSON.stringify(current, null, 2));
}

function getImageHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function removeSentImageByHash(hash) {
  const entries = getSentImages();
  const updatedEntries = entries.filter((entry) => entry.hash !== hash);
  fs.writeFileSync(sentImagesPath, JSON.stringify(updatedEntries, null, 2));
}

// ---------- IPC Handlers ----------
let folderWatcher = null;
const pendingTimers = new Map(); // Global for cancellation
let isCancelled = false;

ipcMain.handle("cancel-upload-processing", () => {
  console.log("🛑 Cancelling ongoing upload processing...");
  isCancelled = true;

  // Cancel timers
  for (const [filePath, timer] of pendingTimers.entries()) {
    clearTimeout(timer);
    pendingTimers.delete(filePath);
    console.log("clear => => =>", filePath)
  }

  // Stop watching folder
  if (folderWatcher) {
    folderWatcher.close();
    folderWatcher = null;
    console.log("🛑 Folder watcher closed.");
  }

  return true;
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("watch-folder", async (event, folderPath) => {
  const imageExtensions = [".jpg", ".jpeg", ".png"];

  if (folderWatcher) {
    // console.log("🛑 Closing previous watcher");
    folderWatcher.close();
  }

  folderWatcher = chokidar.watch(folderPath, {
    persistent: true,
    ignoreInitial: true,
    usePolling: true,
    interval: 500,
  });

  const recentlyProcessed = new Set();
  const pendingTimers = new Map();

  folderWatcher.on("add", (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    if (!imageExtensions.includes(ext)) {
      return;
    }
    // Debounce by filePath: clear any existing pending timer
    if (pendingTimers.has(filePath)) {
      clearTimeout(pendingTimers.get(filePath));
    }
    // Delay actual processing to wait for file to fully copy/write
    const timer = setTimeout(async () => {
      try {
        if (recentlyProcessed.has(filePath)) {
          return;
        }

        const hash = await getImageHash(filePath);
        const sentHashes = getSentImages().map((entry) => entry.hash);

        if (sentHashes.includes(hash)) {
          return;
        }

        recentlyProcessed.add(filePath);

        const outputDir = path.join(folderPath, "compressed");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        const webpName =
          ext === ".webp"
            ? path.basename(filePath)
            : path.basename(filePath, ext) + ".webp";

        const outputPath = path.join(outputDir, webpName);

        if (ext === ".webp") {
          fs.copyFileSync(filePath, outputPath);
        } else {
          await sharp(filePath)
            .resize({ width: 800 })
            .webp({ quality: 70 })
            .toFile(outputPath);
        }

        const stats = fs.statSync(outputPath);
        const imageMeta = {
          name: webpName,
          path: outputPath,
          size: stats.size,
          lastModified: stats.mtime,
          type: "webp",
          hash,
        };
        event.sender.send("new-image-detected", imageMeta);
        console.log("✅ New Image processed and sent");
      } catch (err) {
      } finally {
        pendingTimers.delete(filePath);
        setTimeout(() => recentlyProcessed.delete(filePath), 10000);
      }
    }, 2000);

    pendingTimers.set(filePath, timer);
  });
  return true;
});

ipcMain.handle("compress-and-read-folder", async (event, folderPath) => {
  isCancelled = false;

  const localCancelCheck = () => isCancelled;
  const imageExtensions = [".jpg", ".jpeg", ".png"];
  const outputDir = path.join(folderPath, "compressed");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const files = fs
    .readdirSync(folderPath)
    .filter((file) =>
      imageExtensions.includes(path.extname(file).toLowerCase()),
    )
    .map((file) => path.join(folderPath, file));

  const totalImages = files.length;
  event.sender.send("total-image-count", totalImages);

  const quality = 70;
  const effort = 2;
  // const CHUNK_SIZE = Math.max(2, Math.floor(os.cpus().length * 0.75));
  const CHUNK_SIZE = os.cpus().length;

  console.log("size", CHUNK_SIZE);

  const chunks = [];
  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    chunks.push(files.slice(i, i + CHUNK_SIZE));
  }
  for (const chunk of chunks) {
    const compressedChunk = await Promise.all(
      chunk.map(async (filePath) => {
        if (localCancelCheck()) {
          console.log("🛑 Skipping file due to cancellation:", filePath);
          return null;
        }
        const startTime = performance.now();
        try {
          const ext = path.extname(filePath).toLowerCase();
          const hash = await getImageHash(filePath);
          const webpName =
            ext === ".webp"
              ? path.basename(filePath)
              : path.basename(filePath, ext) + ".webp";
          const outputPath = path.join(outputDir, webpName);

          if (ext === ".webp") {
            fs.copyFileSync(filePath, outputPath);
          } else {
            await sharp(filePath, { fastShrinkOnLoad: true })
              .rotate()
              .webp({
                quality,
                effort,
                smartSubsample: true,
              })
              .toFile(outputPath);
          }
          const endTime = performance.now(); // End tracking
          console.log(
            `✅ Compressed ${path.basename(filePath)} in ${(
              endTime - startTime
            ).toFixed(2)} ms`,
          );

          const stats = fs.statSync(outputPath);
          return {
            name: webpName,
            path: outputPath,
            size: stats.size,
            lastModified: stats.mtime,
            type: "webp",
            hash,
          };
        } catch (error) {
          console.error("❌ Failed to process file:", filePath, error);
          return null;
        }
      }),
    );
    // event.sender.send(
    //   "compressed-file-ready",
    //   compressedChunk.filter(Boolean)
    // );
    if (!isCancelled) {
      event.sender.send(
        "compressed-file-ready",
        compressedChunk.filter(Boolean),
      );
    } else {
      console.log("Upload is cancelled. Cleaning up files...");
      try {
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
          console.log("🗑️ Deleted entire compressed folder:", outputDir);
        }
      } catch (err) {
        console.error("❌ Failed to delete compressed folder:", err);
      }
      return "cancelled";
    }
  }
  return "done";
});

ipcMain.handle("delete-compressed", async () => {
  if (fs.existsSync(compressedDire)) {
    fs.rmSync(compressedDire, { recursive: true, force: true });
  }
});

ipcMain.handle("read-file-buffer", async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn("read-file-buffer: File does not exist", filePath);
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error("read-file-buffer error:", error);
    throw error;
  }
});

ipcMain.handle("check-file-exists", async (_event, filePath) => {
  return fs.existsSync(filePath);
});

ipcMain.handle("remove-sent-image-by-hash", (event, hash) => {
  removeSentImageByHash(hash);
  return true;
});

ipcMain.handle("get-sent-images", async () => {
  try {
    return getSentImages();
  } catch (error) {
    console.error("Failed to read sent images:", error);
    return [];
  }
});

ipcMain.handle("save-sent-image", async (_event, data) => {
  try {
    saveSentImage(data.name, data.hash);
  } catch (error) {
    console.error("Error saving sent image:", error);
  }
});

ipcMain.handle("delete-file", async (_event, filePath) => {
  // console.log("file pathhh", filePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

 
});

let failedUploads = [];

ipcMain.handle("get-failed-uploads", () => {
  return failedUploads;
});

ipcMain.handle("set-failed-uploads", (event, uploads) => {
  failedUploads = uploads;
});

const compressedDir = path.join(__dirname, "compressed");

async function deleteCompressedFolder() {
  if (fs.existsSync(compressedDir)) {
    fs.rmSync(compressedDir, { recursive: true, force: true });
    console.log("Compressed folder deleted successfully");
  }
}

ipcMain.handle("compress-image-profile", async (event, imagePath) => {
  const compressedDir = path.join(app.getPath("userData"), "compressed");
  // console.log(imagePath)
  if (!fs.existsSync(compressedDir)) fs.mkdirSync(compressedDir);
  const outputFile = path.join(
    compressedDir,
    `compressed-${path.parse(imagePath).name}.webp`,
  );
  await sharp(imagePath)
    .resize({ width: 400, height: 400, fit: "contain" })
    .webp({ quality: 70 })
    .toFile(outputFile);

  return outputFile;
});

ipcMain.handle("compress-image-cover", async (event, imagePath) => {
  const compressedDir = path.join(app.getPath("userData"), "compressed");
  // console.log(imagePath)
  if (!fs.existsSync(compressedDir)) fs.mkdirSync(compressedDir);
  const outputFile = path.join(
    compressedDir,
    `compressed-${path.parse(imagePath).name}.webp`,
  );
  await sharp(imagePath)
    .resize({ width: 1920, height: 1080, fit: "contain" })
    .webp({ quality: 70 })
    .toFile(outputFile);

  return outputFile;
});

// ipcMain.handle("compress-image-cover", async (event, imagePath) => {
//   if (!fs.existsSync(compressedDir)) fs.mkdirSync(compressedDir);
//   const outputFile = path.join(
//     compressedDir,
//     `compressed-${path.parse(imagePath).name}.webp`
//   );

//   await sharp(imagePath)
//     .resize({ width: 1920, height: 1080, fit: "contain" })
//     .webp({ quality: 70 })
//     .toFile(outputFile);

//   return outputFile;
// });

ipcMain.handle("delete-compressed-folder", async () => {
  deleteCompressedFolder();
  return "Folder deleted";
});

ipcMain.handle("read-file", async (event, filePath) => {
  return fs.promises.readFile(filePath);
});

const compressedDire = path.join(__dirname, "compressed_images");

ipcMain.handle("compress-uplaod-image", async (event, imagePaths) => {
  if (!fs.existsSync(compressedDire)) fs.mkdirSync(compressedDire);

  const compressedPaths = [];

  for (const imagePath of imagePaths) {
    const outputFile = path.join(
      compressedDire,
      `${path.parse(imagePath).name}.webp`,
    );
    await sharp(imagePath).webp({ quality: 70 }).toFile(outputFile);
    compressedPaths.push(outputFile);
  }
  return compressedPaths;
});

ipcMain.handle("delete-compressed-folder-upload", async () => {
  if (fs.existsSync(compressedDire)) {
    fs.rmSync(compressedDire, { recursive: true, force: true });
  }
});

//------Upload folder-------

ipcMain.handle("select-folder-upload", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("watch-folder-upload", async (event, folderPath) => {
  const imageExtensions = [".jpg", ".jpeg", ".png"];

  if (folderWatcher) {
    // console.log("🛑 Closing previous watcher");
    folderWatcher.close();
  }

  folderWatcher = chokidar.watch(folderPath, {
    persistent: true,
    ignoreInitial: true,
    usePolling: true,
    interval: 500,
  });

  const recentlyProcessed = new Set();
  const pendingTimers = new Map();

  folderWatcher.on("add", (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    if (!imageExtensions.includes(ext)) {
      return;
    }
    // Debounce by filePath: clear any existing pending timer
    if (pendingTimers.has(filePath)) {
      clearTimeout(pendingTimers.get(filePath));
    }
    // Delay actual processing to wait for file to fully copy/write
    const timer = setTimeout(async () => {
      try {
        if (recentlyProcessed.has(filePath)) {
          return;
        }

        const hash = await getImageHash(filePath);
        const sentHashes = getSentImages().map((entry) => entry.hash);

        if (sentHashes.includes(hash)) {
          return;
        }

        recentlyProcessed.add(filePath);

        const outputDir = path.join(folderPath, "compressed");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        const webpName =
          ext === ".webp"
            ? path.basename(filePath)
            : path.basename(filePath, ext) + ".webp";

        const outputPath = path.join(outputDir, webpName);

        if (ext === ".webp") {
          fs.copyFileSync(filePath, outputPath);
        } else {
          await sharp(filePath)
            .resize({ width: 800 })
            .webp({ quality: 70 })
            .toFile(outputPath);
        }

        const stats = fs.statSync(outputPath);
        const imageMeta = {
          name: webpName,
          path: outputPath,
          size: stats.size,
          lastModified: stats.mtime,
          type: "webp",
          hash,
        };
        event.sender.send("new-image-detected-upload", imageMeta);
        console.log("✅ Image processed and upload:", imageMeta);
      } catch (err) {
      } finally {
        pendingTimers.delete(filePath);
        setTimeout(() => recentlyProcessed.delete(filePath), 10000);
      }
    }, 2000);

    pendingTimers.set(filePath, timer);
  });
  return true;
});

ipcMain.handle("compress-and-read-folder-upload", async (event, folderPath) => {
  isCancelled = false;

  const localCancelCheck = () => isCancelled;
  const imageExtensions = [".jpg", ".jpeg", ".png"];
  const outputDir = path.join(folderPath, "compressed");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const files = fs
    .readdirSync(folderPath)
    .filter((file) =>
      imageExtensions.includes(path.extname(file).toLowerCase()),
    )
    .map((file) => path.join(folderPath, file));

  const totalImages = files.length;
  event.sender.send("total-image-count-upload", totalImages);

  const quality = 70;
  const effort = 2;
  // const CHUNK_SIZE = Math.max(2, Math.floor(os.cpus().length * 0.75));
  const CHUNK_SIZE = os.cpus().length;

  console.log("size upload", CHUNK_SIZE);

  const chunks = [];
  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    chunks.push(files.slice(i, i + CHUNK_SIZE));
  }
  for (const chunk of chunks) {
    const compressedChunk = await Promise.all(
      chunk.map(async (filePath) => {
        if (localCancelCheck()) {
          console.log("🛑 Skipping file due to cancellation:", filePath);
          return null;
        }
        const startTime = performance.now();
        try {
          const ext = path.extname(filePath).toLowerCase();
          const hash = await getImageHash(filePath);
          const webpName =
            ext === ".webp"
              ? path.basename(filePath)
              : path.basename(filePath, ext) + ".webp";
          const outputPath = path.join(outputDir, webpName);

          if (ext === ".webp") {
            fs.copyFileSync(filePath, outputPath);
          } else {
            await sharp(filePath, { fastShrinkOnLoad: true })
              .rotate()
              .webp({
                quality,
                effort,
                smartSubsample: true,
              })
              .toFile(outputPath);
          }
          const endTime = performance.now(); // End tracking
          console.log(
            `✅ Compressed upload ${path.basename(filePath)} in ${(
              endTime - startTime
            ).toFixed(2)} ms`,
          );

          const stats = fs.statSync(outputPath);
          return {
            name: webpName,
            path: outputPath,
            size: stats.size,
            lastModified: stats.mtime,
            type: "webp",
            hash,
          };
        } catch (error) {
          console.error("❌ Failed to process file:", filePath, error);
          return null;
        }
      }),
    );
    // console.log("isCancelled:", isCancelled);
    if (!isCancelled) {
      event.sender.send(
        "compressed-file-ready-upload",
        compressedChunk.filter(Boolean),
      );
    } else {
      console.log("Upload is cancelled upload. Cleaning up files...");
      try {
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
          console.log("🗑️ Deleted entire compressed folder upload:", outputDir);
        }
      } catch (err) {
        console.error("❌ Failed to delete compressed folder:", err);
      }
      return "cancelled";
    }
  }
  return "done";
});

ipcMain.handle("get-sent-images-upload", async () => {
  try {
    return getSentImages();
  } catch (error) {
    console.error("Failed to read sent images:", error);
    return [];
  }
});

ipcMain.handle("remove-sent-image-by-hash-upload", (event, hash) => {
  removeSentImageByHash(hash);
  return true;
});

ipcMain.handle("delete-file-upload", async (_event, filePath) => {
  // console.log("file pathhh", filePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
});

ipcMain.handle("read-file-buffer-upload", async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn("read-file-buffer-upload: File does not exist", filePath);
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error("read-file-buffer-upload error:", error);
    throw error;
  }
});

ipcMain.on("stop-watching-folder", () => {
  if (folderWatcher) {
    folderWatcher.close(); // or however you stop watching
    console.log("Folder watcher stopped.");
  }
});

// portfolio uplaod photo
ipcMain.handle("compress-upload-image", async (event, imagePath) => {
  try {
    const originalDir = path.dirname(imagePath);
    const outputFile = path.join(
      originalDir,
      `${path.parse(imagePath).name}.webp`,
    );

    await sharp(imagePath).webp({ quality: 70 }).toFile(outputFile);

    console.log(
      `✅ Compressed ${path.basename(imagePath)} → ${path.basename(outputFile)}`,
    );

    return {
      success: true,
      outputPath: outputFile,
      name: path.basename(outputFile),
    };
  } catch (err) {
    console.error("❌ Compression failed:", err);
    return { success: false, error: err.message };
  }
});




/*-----------video upload ----------- */
ipcMain.handle("select-video-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// ipcMain.handle("read-video-folder", async (event, folderPath) => {
//   const exts = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

//   const files = fs
//     .readdirSync(folderPath)
//     .filter((f) => exts.includes(path.extname(f).toLowerCase()))
//     .map((f) => ({
//       name: f,
//       path: path.join(folderPath, f),
//     }));

//   // 🔥 Send total immediately
//   event.sender.send("total-video-count", files.length);

//   return files;
// });


// ipcMain.handle("read-file-buffer-video", async (_, filePath) => {
//   return fs.readFileSync(filePath);
// });

// ipcMain.handle("generate-video-thumbnail", async (_, videoPath) => {
//   const folder = path.dirname(videoPath);
//   const thumbDir = path.join(folder, "compressed");

//   if (!fs.existsSync(thumbDir)) {
//     fs.mkdirSync(thumbDir, { recursive: true });
//   }

//   const name = path.basename(videoPath, path.extname(videoPath));
//   const out = path.join(thumbDir, `${name}_thumb.jpg`);

//   if (!fs.existsSync(out)) {
//     await new Promise((res, rej) => {
//       ffmpeg(videoPath)
//         .on("end", res)
//         .on("error", rej)
//         .screenshots({
//           count: 1,
//           folder: thumbDir,
//           filename: `${name}_thumb.jpg`,
//           size: "320x?",
//         });
//     });
//   }

//   return `file:///${out.replace(/\\/g, "/")}`;
// });

// ipcMain.handle("compress-video", async (_, videoPath) => {
//     const CHUNK_SIZE = os.cpus().length;

//   const folder = path.dirname(videoPath);
//   const compressedDir = path.join(folder, "compressed");

//   if (!fs.existsSync(compressedDir)) {
//     fs.mkdirSync(compressedDir, { recursive: true });
//   }

//   const name = path.basename(videoPath, path.extname(videoPath));
//   const out = path.join(compressedDir, `${name}_compressed.mp4`);

//   // 🔹 Compress
//   await new Promise((res, rej) => {
//     ffmpeg(videoPath)
//       .outputOptions([
//         "-vcodec libx264",
//         "-crf 28",
//         "-preset fast",
//         "-vf scale='min(1280,iw)':-2",
//       ])
//       .on("end", res)
//       .on("error", rej)
//       .save(out);
//   });

//   // 🔹 Get size
//   const stats = fs.statSync(out);
//   const size = stats.size;

//   // 🔹 Generate SHA256 hash
//   const buffer = fs.readFileSync(out);
//   const hash = crypto.createHash("sha256").update(buffer).digest("hex");

//   return {
//     name: path.basename(out),
//     path: out,
//     type: "video/mp4",
//     size,
//     hash,
//   };
// });

const MAX_COMPRESS = os.cpus().length;

let activeJobs = 0;
let queue = [];
const runningFFmpeg = new Set();

/* ================= READ VIDEO FOLDER ================= */

ipcMain.handle("read-video-folder", async (event, folderPath) => {
  const exts = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

  const files = fs
    .readdirSync(folderPath)
    .filter((f) => exts.includes(path.extname(f).toLowerCase()))
    .map((f) => ({
      name: f,
      path: path.join(folderPath, f),
    }));

  event.sender.send("total-video-count", files.length);
  return files;
});

/* ================= FILE BUFFER ================= */

ipcMain.handle("read-file-buffer-video", async (_, filePath) => {
  return fs.readFileSync(filePath);
});

/* ================= COMPRESS ================= */


const compressVideo = (videoPath) => {
  if (isCancelled) throw new Error("Cancelled");

  const folder = path.dirname(videoPath);
  const outDir = path.join(folder, "compressed");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const name = path.basename(videoPath, path.extname(videoPath));
  const out = path.join(outDir, `${name}_compressed.mp4`);

  console.log("🎬 Compressing:", name);

  return new Promise((resolve, reject) => {
    const proc = ffmpeg(videoPath)
      .outputOptions([
        "-vcodec libx264",
        "-crf 28",
        "-preset fast",
        "-vf scale='min(1280,iw)':-2",
      ])
      .on("end", () => {
        runningFFmpeg.delete(proc);
        if (isCancelled) return reject("Cancelled");

        const buffer = fs.readFileSync(out);
        const stats = fs.statSync(out);

        resolve({
          id: videoPath,
          name: path.basename(out),
          path: out,
          size: stats.size,
          hash: crypto.createHash("sha256").update(buffer).digest("hex"),
          type: "video/mp4",
        });
      })
      .on("error", (err) => {
        runningFFmpeg.delete(proc);
        reject(err);
      })
      .save(out);

    runningFFmpeg.add(proc);
  });
};

/* ================= QUEUE RUNNER ================= */

const runNext = async (event) => {
  if (isCancelled) return;
  if (queue.length === 0) return;
  if (activeJobs >= MAX_COMPRESS) return;

  const videoPath = queue.shift();
  activeJobs++;

  compressVideo(videoPath)
    .then((compressed) => {
      runningFFmpeg.delete(videoPath);
      if (!isCancelled) {
        event.sender.send("compressed-video-ready", compressed);
      }
    })
    .catch((err) => {
      runningFFmpeg.delete(videoPath);
      if (err !== "Cancelled") console.error("❌ Compression failed:", err);
    })
    .finally(() => {
      activeJobs--;
      // Trigger the next compression immediately
      runNext(event);
    });

  // Trigger additional compressions if slots available
  if (activeJobs < MAX_COMPRESS && queue.length > 0) {
    runNext(event);
  }
};


/* ================= START ================= */

ipcMain.handle("compress-videos-parallel", async (event, videoPaths) => {
  isCancelled = false;
  queue = [...videoPaths];
  activeJobs = 0;

  console.log(`🚀 Start compress (${MAX_COMPRESS} workers)`);

  // Start up to MAX_COMPRESS jobs immediately
  for (let i = 0; i < MAX_COMPRESS; i++) {
    runNext(event);
  }

  return true;
});



/* ================= CANCEL ================= */
ipcMain.handle("cancel-video-compress", async () => {
  console.log("🛑 Cancel compression video");

  isCancelled = true;
  queue.length = 0;

  // kill all running ffmpeg processes
  runningFFmpeg.forEach((proc) => {
    try {
      proc.kill("SIGKILL");
    } catch {}
  });

  runningFFmpeg.clear();
  activeJobs = 0;

  return true;
});

/* ================= DELETE FILE ================= */

ipcMain.handle("delete-local-file", async (_, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error("❌ Delete failed:", err);
    return false;
  }
});

ipcMain.handle("delete-folder", async (_, folderPath) => {
  try {
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log("🧹 Deleted folder:", folderPath);
    }
    return true;
  } catch (err) {
    console.error("❌ Folder delete failed:", err);
    return false;
  }
});



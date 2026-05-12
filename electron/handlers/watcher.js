const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const sharp = require("sharp");
const os = require("os");
const {
  getSentImages,
  getImageHash,
} = require("../utils/files");

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const DEBOUNCE_MS = 2000;
const RECENTLY_PROCESSED_TTL = 10000;
const COMPRESSION_QUALITY = 70;
const COMPRESSION_EFFORT = 2;

const watchersByChannel = new Map();
const watcherTimers = new Map();
const cancelledByChannel = new Map();

function safeSend(event, channel, data) {
  if (event && event.sender && !event.sender.isDestroyed()) {
    event.sender.send(channel, data);
  }
}

function clearWatcherTimersForChannel(channelName) {
  const timers = watcherTimers.get(channelName);
  if (timers) {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
    watcherTimers.delete(channelName);
  }
}

function clearAllWatcherTimers() {
  for (const timers of watcherTimers.values()) {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
  }
  watcherTimers.clear();
}

function validateFolderPath(folderPath) {
  if (!folderPath || typeof folderPath !== "string") {
    throw new Error("Invalid folder path");
  }
}

function compressImageToWebp(filePath, ext, outputDir) {
  const webpName =
    ext === ".webp"
      ? path.basename(filePath)
      : path.basename(filePath, ext) + ".webp";
  const outputPath = path.join(outputDir, webpName);

  if (ext === ".webp") {
    fs.copyFileSync(filePath, outputPath);
    return outputPath;
  }

  return sharp(filePath, { fastShrinkOnLoad: true })
    .rotate()
    .webp({
      quality: COMPRESSION_QUALITY,
      effort: COMPRESSION_EFFORT,
      smartSubsample: true,
    })
    .toFile(outputPath)
    .then(() => outputPath);
}

function createFolderCompressor(event, suffix) {
  const channelNewImage = suffix ? `new-image-detected-${suffix}` : "new-image-detected";
  const channelCompressedReady = suffix ? `compressed-file-ready-${suffix}` : "compressed-file-ready";
  const channelTotalCount = suffix ? `total-image-count-${suffix}` : "total-image-count";

  return async function compressAndReadFolder(folderPath) {
    const channelName = suffix ? `compress-${suffix}` : "compress";
    cancelledByChannel.set(channelName, false);
    validateFolderPath(folderPath);

    const outputDir = path.join(folderPath, "compressed");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const files = fs
      .readdirSync(folderPath)
      .filter((file) =>
        IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())
      )
      .map((file) => path.join(folderPath, file));

    const totalImages = files.length;
    safeSend(event, channelTotalCount, totalImages);

    const CHUNK_SIZE = Math.max(1, os.cpus().length);

    const chunks = [];
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
      chunks.push(files.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
      if (cancelledByChannel.get(channelName)) break;

      const compressedChunk = await Promise.all(
        chunk.map(async (filePath) => {
          if (cancelledByChannel.get(channelName)) return null;
          try {
            const ext = path.extname(filePath).toLowerCase();
            const hash = await getImageHash(filePath);
            const sentHashes = getSentImages().map((entry) => entry.hash);
            const outputPath = path.join(outputDir,
              ext === ".webp"
                ? path.basename(filePath)
                : path.basename(filePath, ext) + ".webp");

            if (sentHashes.includes(hash) && fs.existsSync(outputPath)) {
              const stats = fs.statSync(outputPath);
              return {
                name: path.basename(outputPath),
                path: outputPath,
                size: stats.size,
                lastModified: stats.mtime,
                type: "webp",
                hash,
              };
            }

            await compressImageToWebp(filePath, ext, outputDir);
            const stats = fs.statSync(outputPath);
            return {
              name: path.basename(outputPath),
              path: outputPath,
              size: stats.size,
              lastModified: stats.mtime,
              type: "webp",
              hash,
            };
          } catch (err) {
            safeSend(event, "watcher-error", {
              filePath,
              message: err.message,
            });
            return null;
          }
        })
      );

      if (!cancelledByChannel.get(channelName)) {
        safeSend(event, channelCompressedReady, compressedChunk.filter(Boolean));
      } else {
        try {
          if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true });
          }
        } catch (err) {
          safeSend(event, "watcher-error", {
            filePath: outputDir,
            message: `Failed to delete compressed folder: ${err.message}`,
          });
        }
        return "cancelled";
      }
    }
    return "done";
  };
}

function createImageWatcher(event, suffix) {
  const channelNewImage = suffix ? `new-image-detected-${suffix}` : "new-image-detected";
  const channelName = suffix ? `watch-folder-${suffix}` : "watch-folder";

  return async function watchFolder(folderPath) {
    validateFolderPath(folderPath);

    clearWatcherTimersForChannel(channelName);

    const existing = watchersByChannel.get(channelName);
    if (existing) {
      existing.close();
    }

    const fw = chokidar.watch(folderPath, {
      persistent: true,
      ignoreInitial: true,
      usePolling: true,
      interval: 500,
    });

    watchersByChannel.set(channelName, fw);

    fw.on("error", (err) => {
      safeSend(event, "watcher-error", {
        filePath: folderPath,
        message: `Watcher error: ${err.message}`,
      });
    });

    const recentlyProcessed = new Set();
    const pendingTimers = new Map();
    watcherTimers.set(channelName, pendingTimers);

    fw.on("add", (filePath) => {
      const ext = path.extname(filePath).toLowerCase();

      if (!IMAGE_EXTENSIONS.includes(ext)) {
        return;
      }

      if (pendingTimers.has(filePath)) {
        clearTimeout(pendingTimers.get(filePath));
      }

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

          const outputPath = await compressImageToWebp(filePath, ext, outputDir);

          const stats = fs.statSync(outputPath);
          const imageMeta = {
            name: path.basename(outputPath),
            path: outputPath,
            size: stats.size,
            lastModified: stats.mtime,
            type: "webp",
            hash,
          };
          safeSend(event, channelNewImage, imageMeta);
        } catch (err) {
          safeSend(event, "watcher-error", {
            filePath,
            message: err.message,
          });
        } finally {
          pendingTimers.delete(filePath);
          setTimeout(() => recentlyProcessed.delete(filePath), RECENTLY_PROCESSED_TTL);
        }
      }, DEBOUNCE_MS);

      pendingTimers.set(filePath, timer);
    });

    return true;
  };
}

function registerWatcherHandlers() {
  ipcMain.handle("watch-folder", (event, folderPath) =>
    createImageWatcher(event, "")(folderPath)
  );

  ipcMain.handle("watch-folder-upload", (event, folderPath) =>
    createImageWatcher(event, "upload")(folderPath)
  );

  ipcMain.handle("compress-and-read-folder", (event, folderPath) =>
    createFolderCompressor(event, "")(folderPath)
  );

  ipcMain.handle("compress-and-read-folder-upload", (event, folderPath) =>
    createFolderCompressor(event, "upload")(folderPath)
  );

  ipcMain.handle("cancel-upload-processing", (event) => {
    for (const [channelName] of cancelledByChannel) {
      cancelledByChannel.set(channelName, true);
    }
    clearAllWatcherTimers();

    for (const [channelName, fw] of watchersByChannel) {
      fw.close();
      watchersByChannel.delete(channelName);
    }

    return true;
  });

  ipcMain.on("stop-watching-folder", () => {
    clearAllWatcherTimers();
    for (const [channelName, fw] of watchersByChannel) {
      fw.close();
      watchersByChannel.delete(channelName);
    }
  });

  ipcMain.handle("delete-compressed", async () => {
    const { uploadCompressedDir } = require("./fileOps");
    if (fs.existsSync(uploadCompressedDir)) {
      fs.rmSync(uploadCompressedDir, { recursive: true, force: true });
    }
  });
}

module.exports = { registerWatcherHandlers };

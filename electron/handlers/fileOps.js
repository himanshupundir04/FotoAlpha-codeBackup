const { ipcMain, app } = require("electron");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const crypto = require("crypto");
const {
  getSentImages,
  saveSentImage,
  removeSentImageByHash,
} = require("../utils/files");

const compressedDir = path.join(app.getPath("userData"), "compressed");
const uploadCompressedDir = path.join(app.getPath("userData"), "compressed_images");
const ALLOWED_BASE_DIRS = [app.getPath("userData"), app.getPath("temp"), app.getPath("home")];

let failedUploads = [];

function isValidPath(filePath) {
  if (!filePath || typeof filePath !== "string") return false;
  const resolved = path.resolve(filePath);
  if (resolved !== filePath && filePath.includes("..")) return false;
  return true;
}

function registerFileOpHandlers() {
  ipcMain.handle("select-folder", async (event) => {
    const { dialog, BrowserWindow } = require("electron");
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("select-folder-upload", async (event) => {
    const { dialog, BrowserWindow } = require("electron");
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("read-file-buffer", async (_event, filePath) => {
    if (!isValidPath(filePath)) {
      throw new Error("Invalid file path");
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.promises.readFile(filePath);
  });

  ipcMain.handle("read-file-buffer-upload", async (_event, filePath) => {
    if (!isValidPath(filePath)) {
      throw new Error("Invalid file path");
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.promises.readFile(filePath);
  });

  ipcMain.handle("check-file-exists", async (_event, filePath) => {
    if (!isValidPath(filePath)) return false;
    return fs.existsSync(filePath);
  });

  ipcMain.handle("read-folder", async (_event, folderPath) => {
    if (!isValidPath(folderPath)) return [];
    if (!fs.existsSync(folderPath)) return [];
    try {
      const entries = fs.readdirSync(folderPath, { withFileTypes: true });
      return entries.map((entry) => ({
        name: entry.name,
        path: path.join(folderPath, entry.name),
        isDirectory: entry.isDirectory(),
      }));
    } catch {
      return [];
    }
  });

  ipcMain.handle("delete-file", async (_event, filePath) => {
    if (!isValidPath(filePath)) return;
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
  });

  ipcMain.handle("delete-file-upload", async (_event, filePath) => {
    if (!isValidPath(filePath)) return;
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
  });

  ipcMain.handle("read-file", async (_event, filePath) => {
    if (!isValidPath(filePath)) {
      throw new Error("Invalid file path");
    }
    return fs.promises.readFile(filePath);
  });

  ipcMain.handle("get-sent-images", async () => {
    return getSentImages();
  });

  ipcMain.handle("get-sent-images-upload", async () => {
    return getSentImages();
  });

  ipcMain.handle("save-sent-image", async (_event, data) => {
    saveSentImage(data.name, data.hash);
  });

  ipcMain.handle("remove-sent-image-by-hash", (_event, hash) => {
    removeSentImageByHash(hash);
    return true;
  });

  ipcMain.handle("remove-sent-image-by-hash-upload", (_event, hash) => {
    removeSentImageByHash(hash);
    return true;
  });

  ipcMain.handle("get-failed-uploads", () => {
    return failedUploads;
  });

  ipcMain.handle("set-failed-uploads", (_event, uploads) => {
    failedUploads = uploads;
  });

  ipcMain.handle("compress-image-profile", async (_event, imagePath) => {
    if (!imagePath || typeof imagePath !== "string") {
      throw new Error("Invalid image path");
    }
    if (!fs.existsSync(compressedDir)) fs.mkdirSync(compressedDir);
    const prefix = crypto.randomBytes(4).toString("hex");
    const outputFile = path.join(
      compressedDir,
      `${prefix}-compressed-${path.parse(imagePath).name}.webp`
    );
    await sharp(imagePath)
      .resize({ width: 400, height: 400, fit: "contain" })
      .webp({ quality: 70 })
      .toFile(outputFile);
    return outputFile;
  });

  ipcMain.handle("compress-image-cover", async (_event, imagePath) => {
    if (!imagePath || typeof imagePath !== "string") {
      throw new Error("Invalid image path");
    }
    if (!fs.existsSync(compressedDir)) fs.mkdirSync(compressedDir);
    const prefix = crypto.randomBytes(4).toString("hex");
    const outputFile = path.join(
      compressedDir,
      `${prefix}-compressed-${path.parse(imagePath).name}.webp`
    );
    await sharp(imagePath)
      .resize({ width: 1920, height: 1080, fit: "contain" })
      .webp({ quality: 70 })
      .toFile(outputFile);
    return outputFile;
  });

  ipcMain.handle("delete-compressed-folder", async () => {
    deleteCompressedFolder();
    return "Folder deleted";
  });

  ipcMain.handle("compress-uplaod-image", async (_event, imagePaths) => {
    if (!fs.existsSync(uploadCompressedDir)) fs.mkdirSync(uploadCompressedDir);
    const compressedPaths = [];
    for (const imagePath of imagePaths) {
      if (!imagePath || typeof imagePath !== "string") continue;
      const outputFile = path.join(
        uploadCompressedDir,
        `${path.parse(imagePath).name}.webp`
      );
      await sharp(imagePath).webp({ quality: 70 }).toFile(outputFile);
      compressedPaths.push(outputFile);
    }
    return compressedPaths;
  });

  ipcMain.handle("delete-compressed-folder-upload", async () => {
    if (fs.existsSync(uploadCompressedDir)) {
      fs.rmSync(uploadCompressedDir, { recursive: true, force: true });
    }
  });

  ipcMain.handle("compress-upload-image", async (_event, imagePath) => {
    if (!isValidPath(imagePath)) {
      return { success: false, error: "Invalid image path" };
    }
    try {
      if (!fs.existsSync(compressedDir)) fs.mkdirSync(compressedDir);
      const outputFile = path.join(
        compressedDir,
        `${path.parse(imagePath).name}.webp`
      );
      await sharp(imagePath).webp({ quality: 70 }).toFile(outputFile);
      return {
        success: true,
        outputPath: outputFile,
        name: path.basename(outputFile),
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("delete-local-file", async (_event, filePath) => {
    try {
      if (!isValidPath(filePath)) return false;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle("delete-folder", async (_event, folderPath) => {
    try {
      if (!isValidPath(folderPath)) return false;
      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
      }
      return true;
    } catch (err) {
      return false;
    }
  });
}

function deleteCompressedFolder() {
  if (fs.existsSync(compressedDir)) {
    fs.rmSync(compressedDir, { recursive: true, force: true });
  }
}

module.exports = { registerFileOpHandlers, uploadCompressedDir, deleteCompressedFolder };

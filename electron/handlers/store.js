const { ipcMain, app } = require("electron");
const path = require("path");
const fs = require("fs");

const storeFile = path.join(app.getPath("userData"), "data.json");

let writeQueue = Promise.resolve();

function readStore() {
  try {
    if (!fs.existsSync(storeFile)) return {};
    return JSON.parse(fs.readFileSync(storeFile, "utf8"));
  } catch {
    return {};
  }
}

function enqueueWrite(fn) {
  writeQueue = writeQueue.then(fn, fn);
  return writeQueue;
}

function writeStore(data) {
  return enqueueWrite(() => {
    try {
      fs.writeFileSync(storeFile, JSON.stringify(data, null, 2));
    } catch {}
  });
}

function registerStoreHandlers() {
  ipcMain.handle("store:set", (_event, key, value) => {
    const data = readStore();
    data[key] = value;
    return writeStore(data);
  });

  ipcMain.handle("store:get", (_event, key) => {
    return readStore()[key];
  });

  ipcMain.handle("store:get-all", () => {
    return readStore();
  });

  ipcMain.handle("watcher:store-folder", async (_event, folderPath) => {
    if (!folderPath || typeof folderPath !== "string") return false;
    const data = readStore();
    const folders = Array.isArray(data.watchedFolders) ? data.watchedFolders : [];
    if (!folders.includes(folderPath)) {
      data.watchedFolders = [...folders, folderPath];
      await writeStore(data);
    }
    return true;
  });

  ipcMain.handle("watcher:remove-folder", async (_event, folderPath) => {
    if (!folderPath || typeof folderPath !== "string") return false;
    const data = readStore();
    const folders = Array.isArray(data.watchedFolders) ? data.watchedFolders : [];
    data.watchedFolders = folders.filter((f) => f !== folderPath);
    await writeStore(data);
    return true;
  });

  ipcMain.handle("watcher:get-folders", async () => {
    const data = readStore();
    return Array.isArray(data.watchedFolders) ? data.watchedFolders : [];
  });
}

module.exports = { registerStoreHandlers, storeFile, readStore, writeStore };

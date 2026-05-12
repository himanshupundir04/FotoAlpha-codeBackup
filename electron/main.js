require('dotenv').config();
const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const {
  registerStoreHandlers,
} = require("./handlers/store");
const { registerSystemHandlers }   = require("./handlers/system");
const { registerFileOpHandlers }   = require("./handlers/fileOps");
const { registerWatcherHandlers }  = require("./handlers/watcher");
const { registerVideoHandlers }    = require("./handlers/video");
const { registerUploadEngineHandlers } = require("./handlers/uploadEngine");
const {
  registerBackgroundWatcherHandlers,
  restoreWatchers,
  stopAllWatchers,
} = require("./handlers/backgroundWatcher");
const {
  createTray,
  destroyTray,
  updatePendingCount,
} = require("./tray");

let mainWindow;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Initialise SQLite database before registering any handlers that use it
require("./database/db").getDb();

registerStoreHandlers();
registerSystemHandlers();
registerFileOpHandlers();
registerWatcherHandlers();
registerVideoHandlers();
registerUploadEngineHandlers(process.env.VITE_BASE_URL);
registerBackgroundWatcherHandlers();

ipcMain.handle("tray:get-pending-count", async () => {
  return { pending: 0 };
});

ipcMain.handle("tray:update-pending-count", async (_event, count) => {
  updatePendingCount(count);
  return true;
});

app.whenReady().then(async () => {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
  });

  await createWindow();
  createTray(mainWindow);

  // Restore all previously registered folder watchers from SQLite
  restoreWatchers();
});

async function createWindow() {
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    icon: path.join(__dirname, "..", "public", "Camera.ico"),
    webPreferences: {
      preload:          path.join(__dirname, "preload.js"),
      webSecurity:      !isDev,
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });

  const menu = Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", click: () => mainWindow.webContents.reload() },
        { type: "separator" },
        { label: "Quit", accelerator: "CmdOrCtrl+Q", click: () => { app.isQuitting = true; app.quit(); } },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle DevTools",
          accelerator: "F12",
          click: () => {
            if (mainWindow.webContents.isDevToolsOpened()) {
              mainWindow.webContents.closeDevTools();
            } else {
              mainWindow.webContents.openDevTools();
            }
          },
        },
        { label: "Zoom In",     accelerator: "CmdOrCtrl+Equal", click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: "Zoom Out",    accelerator: "CmdOrCtrl+-",     click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: "Reset Zoom",  accelerator: "CmdOrCtrl+0",     click: () => mainWindow.webContents.setZoomLevel(0) },
        { type: "separator" },
        { label: "Toggle Fullscreen", accelerator: "F11", role: "togglefullscreen" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      // Background watchers keep running — do not call stopAllWatchers() here
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "build", "index.html"), {
      baseURLForDataURL: `file://${path.join(__dirname, "..", "build")}/`,
    });
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Do NOT quit — keep running in tray so background watchers continue
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(() => {});
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
  destroyTray();
  stopAllWatchers();

  const { ipcMain: ipc } = require("electron");
  ipc.emit("stop-watching-video-folder");
  ipcMain.emit("stop-watching-folder");

  for (const [channel] of ipcMain._events || []) {
    ipcMain.removeHandler(channel);
  }
});

module.exports = { createWindow };

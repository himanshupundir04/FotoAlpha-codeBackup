const {
  Tray,
  Menu,
  app,
  nativeImage,
  BrowserWindow,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");

let tray = null;
let isPaused = false;
let pendingUploadCount = 0;
let uploadedCount = 0;

function getStoreData(key) {
  const storeFile = path.join(app.getPath("userData"), "data.json");
  try {
    if (!fs.existsSync(storeFile)) return undefined;
    const data = JSON.parse(fs.readFileSync(storeFile, "utf8"));
    return data[key];
  } catch {
    return undefined;
  }
}

function setStoreData(key, value) {
  const storeFile = path.join(app.getPath("userData"), "data.json");
  try {
    const data = fs.existsSync(storeFile)
      ? JSON.parse(fs.readFileSync(storeFile, "utf8"))
      : {};
    data[key] = value;
    fs.writeFileSync(storeFile, JSON.stringify(data, null, 2));
  } catch {}
}

function createTrayIcon() {
  const isWin = process.platform === "win32";
  const iconPath = isWin
    ? path.join(__dirname, "..", "public", "Camera.ico")
    : path.join(__dirname, "..", "public", "logo192.png");

  if (fs.existsSync(iconPath)) {
    return iconPath.endsWith(".ico")
      ? nativeImage.createFromPath(iconPath)
      : nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  }

  const emptyIcon = nativeImage.createEmpty();
  return emptyIcon;
}

function buildContextMenu() {
  const pauseLabel = isPaused ? "Resume Sync" : "Pause Sync";
  const uploadLabel =
    pendingUploadCount > 0
      ? `Uploads: ${pendingUploadCount} pending`
      : "No pending uploads";

  const template = [
    {
      label: "Open FotoAlpha",
      click: () => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
          windows[0].show();
          windows[0].focus();
        } else {
          const createWindow = require("../main").createWindow;
          if (createWindow) createWindow();
        }
      },
    },
    { type: "separator" },
    {
      label: pauseLabel,
      click: () => {
        isPaused = !isPaused;
        setStoreData("syncPaused", isPaused);
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((win) => {
          win.webContents.send("sync:pause-changed", isPaused);
        });
        buildTrayMenu();
      },
    },
    {
      label: uploadLabel,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ];

  return Menu.buildFromTemplate(template);
}

function buildTrayMenu() {
  if (!tray) return;
  const menu = buildContextMenu();
  tray.setContextMenu(menu);
}

function updatePendingCount(count) {
  pendingUploadCount = count;
  buildTrayMenu();
}

function isSyncPaused() {
  return isPaused;
}

function createTray(mainWindow) {
  if (tray) return tray;

  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip("FotoAlpha");

  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  const storedPaused = getStoreData("syncPaused");
  if (typeof storedPaused === "boolean") {
    isPaused = storedPaused;
  }

  const uploadQueue = getStoreData("uploadQueue") || [];
  const pending =
    uploadQueue.filter(
      (item) =>
        item.status !== "completed" &&
        item.status !== "cancelled" &&
        item.status !== "failed_permanent"
    );
  pendingUploadCount = pending.length;

  buildTrayMenu();

  return tray;
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = {
  createTray,
  destroyTray,
  updatePendingCount,
  isSyncPaused,
  buildTrayMenu,
};

const { contextBridge, ipcRenderer } = require("electron");

function createListener(channel) {
  return {
    on(callback) {
      const handler = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    },
  };
}

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  watchFolder: (folderPath) => ipcRenderer.invoke("watch-folder", folderPath),
  onNewImageDetected: createListener("new-image-detected").on,
  readFolder: (folderPath) => ipcRenderer.invoke("read-folder", folderPath),
  getImagesInFolder: (folderPath) =>
    ipcRenderer.invoke("get-images-in-folder", folderPath),
  compressAndReadFolder: (folderPath) =>
    ipcRenderer.invoke("compress-and-read-folder", folderPath),
  onCompressedFileReady: createListener("compressed-file-ready").on,
  onTotalImageCount: createListener("total-image-count").on,
  readFileAsBuffer: (filePath) =>
    ipcRenderer.invoke("read-file-buffer", filePath),
  deleteFile: (filePath) => ipcRenderer.invoke("delete-file", filePath),
  removeSentImageByHash: (hash) =>
    ipcRenderer.invoke("remove-sent-image-by-hash", hash),
  saveSentImage: (data) => ipcRenderer.invoke("save-sent-image", data),
  getSentImages: () => ipcRenderer.invoke("get-sent-images"),

  setStore: (key, value) => ipcRenderer.invoke("store:set", key, value),
  getStore: (key) => ipcRenderer.invoke("store:get", key),

  compressProfile: (imagePath) =>
    ipcRenderer.invoke("compress-image-profile", imagePath),
  compressCover: (imagePath) =>
    ipcRenderer.invoke("compress-image-cover", imagePath),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  deleteCompressedFolder: () => ipcRenderer.invoke("delete-compressed-folder"),

  compressUpload: (imagePaths) =>
    ipcRenderer.invoke("compress-upload-image", imagePaths),
  deleteCompressedFolderupload: () =>
    ipcRenderer.invoke("delete-compressed-folder-upload"),

  getFailedUploads: () => ipcRenderer.invoke("get-failed-uploads"),
  setFailedUploads: (uploads) =>
    ipcRenderer.invoke("set-failed-uploads", uploads),

  getSystemStats: () => ipcRenderer.invoke("getSystemStats"),
  getNetworkSpeed: () => ipcRenderer.invoke("getNetworkSpeed"),

  selectFolderupload: () => ipcRenderer.invoke("select-folder-upload"),
  watchFolderupload: (folderPath) =>
    ipcRenderer.invoke("watch-folder-upload", folderPath),
  onNewImageDetectedupload: createListener("new-image-detected-upload").on,
  compressAndReadFolderupload: (folderPath) =>
    ipcRenderer.invoke("compress-and-read-folder-upload", folderPath),
  cancelUploadProcessing: () => ipcRenderer.invoke("cancel-upload-processing"),
  deleteCompressed: () => ipcRenderer.invoke("delete-compressed"),
  onTotalImageCountupload: createListener("total-image-count-upload").on,
  onCompressedFileReadyupload: createListener("compressed-file-ready-upload").on,
  getSentImagesupload: () => ipcRenderer.invoke("get-sent-images-upload"),
  deleteFileupload: (filePath) =>
    ipcRenderer.invoke("delete-file-upload", filePath),
  removeSentImageByHashupload: (hash) =>
    ipcRenderer.invoke("remove-sent-image-by-hash-upload", hash),
  readFileAsBufferupload: (filePath) =>
    ipcRenderer.invoke("read-file-buffer-upload", filePath),
  checkFileExists: (filePath) =>
    ipcRenderer.invoke("check-file-exists", filePath),

  stopWatchingFolder: () => ipcRenderer.send("stop-watching-folder"),
  removeListeners: () => {
    ipcRenderer.removeAllListeners("compressed-file-ready");
    ipcRenderer.removeAllListeners("new-image-detected");
    ipcRenderer.removeAllListeners("total-image-count");
    ipcRenderer.removeAllListeners("compressed-file-ready-upload");
    ipcRenderer.removeAllListeners("new-image-detected-upload");
    ipcRenderer.removeAllListeners("total-image-count-upload");
    ipcRenderer.removeAllListeners("compressed-video-ready");
    ipcRenderer.removeAllListeners("total-video-count");
    ipcRenderer.removeAllListeners("watcher-error");
  },

  compressImage: (imagePath) =>
    ipcRenderer.invoke("compress-upload-image", imagePath),

  selectVideoFolder: () => ipcRenderer.invoke("select-video-folder"),
  readVideoFolder: (p) => ipcRenderer.invoke("read-video-folder", p),
  compressVideosParallel: (p) =>
    ipcRenderer.invoke("compress-videos-parallel", p),
  readFileBuffervideo: (p) => ipcRenderer.invoke("read-file-buffer-video", p),

  onCompressedVideo: createListener("compressed-video-ready").on,
  onTotalVideoCount: createListener("total-video-count").on,
  deleteFolder: (filePath) => ipcRenderer.invoke("delete-folder", filePath),
  cancelVideoCompress: () =>
    ipcRenderer.invoke("cancel-video-compress"),
  watchVideoFolder: (folderPath) =>
    ipcRenderer.invoke("watch-video-folder", folderPath),
  stopWatchingVideoFolder: () =>
    ipcRenderer.invoke("stop-watching-video-folder"),
  onWatcherError: createListener("watcher-error").on,

  uploadStart: (params) => ipcRenderer.invoke("upload:start", params),
  uploadCancelFile: (fileId) => ipcRenderer.invoke("upload:cancel-file", fileId),
  uploadCancelAll: () => ipcRenderer.invoke("upload:cancel-all"),
  uploadGetActive: () => ipcRenderer.invoke("upload:get-active"),
  onUploadProgress: createListener("upload:progress").on,
  onUploadComplete: createListener("upload:complete").on,
  onUploadError: createListener("upload:error").on,
  onUploadSessionStarted: createListener("upload:session-started").on,

  uploadInitSession: (params) => ipcRenderer.invoke("upload:init-session", params),
  uploadQueryStatus: (params) => ipcRenderer.invoke("upload:query-status", params),
  uploadComplete: (params) => ipcRenderer.invoke("upload:complete", params),
  uploadCancel: (params) => ipcRenderer.invoke("upload:cancel", params),

  watcherStoreFolder: (folderPath) =>
    ipcRenderer.invoke("watcher:store-folder", folderPath),
  watcherRemoveFolder: (folderPath) =>
    ipcRenderer.invoke("watcher:remove-folder", folderPath),
  watcherGetFolders: () => ipcRenderer.invoke("watcher:get-folders"),

  updateTrayPendingCount: (count) =>
    ipcRenderer.invoke("tray:update-pending-count", count),
  onSyncPauseChanged: createListener("sync:pause-changed").on,

  // ── Background Watcher (persistent, survives window close) ──────
  bgWatcherAdd: (params) => ipcRenderer.invoke("bgwatcher:add", params),
  bgWatcherRemove: (folderPath) => ipcRenderer.invoke("bgwatcher:remove", folderPath),
  bgWatcherList: () => ipcRenderer.invoke("bgwatcher:list"),
  bgWatcherUpdateToken: (params) => ipcRenderer.invoke("bgwatcher:update-token", params),
  onBgWatcherFileUploaded: createListener("bgwatcher:file-uploaded").on,
  onBgWatcherNewFile:      createListener("bgwatcher:new-file").on,
  onBgWatcherDuplicate:    createListener("bgwatcher:duplicate").on,
  onBgWatcherError:        createListener("bgwatcher:error").on,
  onBgWatcherStarted:      createListener("bgwatcher:started").on,
});

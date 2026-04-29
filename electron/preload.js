const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  watchFolder: (folderPath) => ipcRenderer.invoke("watch-folder", folderPath),
  onNewImageDetected: (callback) =>
    ipcRenderer.on("new-image-detected", (event, data) => callback(data)),
  readFolder: (folderPath) => ipcRenderer.invoke("read-folder", folderPath),
  getImagesInFolder: (folderPath) =>
    ipcRenderer.invoke("get-images-in-folder", folderPath),
  compressAndReadFolder: (folderPath) =>
    ipcRenderer.invoke("compress-and-read-folder", folderPath),
  onCompressedFileReady: (callback) =>
    ipcRenderer.on("compressed-file-ready", (event, compressedFile) => {
      callback(compressedFile);
    }),
  onTotalImageCount: (callback) =>
    ipcRenderer.on("total-image-count", (event, count) => callback(count)),
  readFileAsBuffer: (filePath) =>
    ipcRenderer.invoke("read-file-buffer", filePath),
  deleteFile: (filePath) => ipcRenderer.invoke("delete-file", filePath),
  removeSentImageByHash: (hash) =>
    ipcRenderer.invoke("remove-sent-image-by-hash", hash),
  saveSentImage: (data) => ipcRenderer.invoke("save-sent-image", data),
  getSentImages: () => ipcRenderer.invoke("get-sent-images"),
  onToast: (callback) =>
    ipcRenderer.on("show-toast", (event, message) => callback(message)),

  setStore: (key, value) => ipcRenderer.invoke("store:set", key, value),
  getStore: (key) => ipcRenderer.invoke("store:get", key),

  compressProfile: (imagePath) =>
    ipcRenderer.invoke("compress-image-profile", imagePath),
  compressCover: (imagePath) =>
    ipcRenderer.invoke("compress-image-cover", imagePath),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  deleteCompressedFolder: () => ipcRenderer.invoke("delete-compressed-folder"),

  compressUpload: (imagePaths) =>
    ipcRenderer.invoke("compress-uplaod-image", imagePaths),
  deleteCompressedFolderupload: () =>
    ipcRenderer.invoke("delete-compressed-folder-upload"),

  getFailedUploads: () => ipcRenderer.invoke("get-failed-uploads"),
  setFailedUploads: (uploads) =>
    ipcRenderer.invoke("set-failed-uploads", uploads),

  getSystemStats: () => ipcRenderer.invoke("getSystemStats"),
  getNetworkSpeed: () => ipcRenderer.invoke("getNetworkSpeed"),

  //------uplaod folder-------

  selectFolderupload: () => ipcRenderer.invoke("select-folder-upload"),
  watchFolderupload: (folderPath) =>
    ipcRenderer.invoke("watch-folder-upload", folderPath),
  onNewImageDetectedupload: (callback) =>
    ipcRenderer.on("new-image-detected-upload", (event, data) =>
      callback(data),
    ),

  compressAndReadFolderupload: (folderPath) =>
    ipcRenderer.invoke("compress-and-read-folder-upload", folderPath),

  cancelUploadProcessing: () => ipcRenderer.invoke("cancel-upload-processing"),
  deleteCompressed: () => ipcRenderer.invoke("delete-compressed"),
  onTotalImageCountupload: (callback) =>
    ipcRenderer.on("total-image-count-upload", (event, count) =>
      callback(count),
    ),

  onCompressedFileReadyupload: (callback) =>
    ipcRenderer.on("compressed-file-ready-upload", (event, compressedFile) => {
      callback(compressedFile);
    }),
  getSentImagesupload: () => ipcRenderer.invoke("get-sent-images-upload"),

  deleteFileupload: (filePath) =>
    ipcRenderer.invoke("delete-file-upload", filePath),
  removeSentImageByHashupload: (hash) =>
    ipcRenderer.invoke("remove-sent-image-by-hash-upload", hash),

  readFileAsBufferupload: (filePath) =>
    ipcRenderer.invoke("read-file-buffer-upload", filePath),

  checkFileExists: (filePath) =>
    ipcRenderer.invoke("check-file-exists", filePath),

  off: (event, callback) => ipcRenderer.removeListener(event, callback),

  stopWatchingFolder: () => ipcRenderer.send("stop-watching-folder"),
  removeListeners: () => {
    ipcRenderer.removeAllListeners("compressed-file-ready");
    ipcRenderer.removeAllListeners("new-image-detected");
    ipcRenderer.removeAllListeners("total-image-count");
  },

  // portfolio uplaod photo
  compressImage: (imagePath) =>
    ipcRenderer.invoke("compress-upload-image", imagePath),

  /*--------video upload---------- */
  selectVideoFolder: () => ipcRenderer.invoke("select-video-folder"),
  // readVideoFolder: (path) => ipcRenderer.invoke("read-video-folder", path),
  // generateVideoThumbnail: (path) =>
  //   ipcRenderer.invoke("generate-video-thumbnail", path),
  // compressVideo: (path) => ipcRenderer.invoke("compress-video", path),
  // readFileBuffervideo: (path) =>
  //   ipcRenderer.invoke("read-file-buffer-video", path),

  //  compressVideosParallel: (paths) =>
  //   ipcRenderer.invoke("compress-videos-parallel", paths),

  // onCompressedVideo: (cb) =>
  //   ipcRenderer.on("compressed-video-ready", (_, data) => cb(data)),

  // onTotalVideoCount: (callback) =>
  //   ipcRenderer.on("total-video-count", (_, total) => callback(total)),

  readVideoFolder: (p) => ipcRenderer.invoke("read-video-folder", p),
  compressVideosParallel: (p) =>
    ipcRenderer.invoke("compress-videos-parallel", p),
  readFileBuffervideo: (p) => ipcRenderer.invoke("read-file-buffer-video", p),

  onCompressedVideo: (cb) =>
    ipcRenderer.on("compressed-video-ready", (_, data) => cb(data)),
  offCompressedVideo: (cb) =>
    ipcRenderer.removeListener("compressed-video-ready", cb),

  onTotalVideoCount: (cb) =>
    ipcRenderer.on("total-video-count", (_, c) => cb(c)),
  offTotalVideoCount: (cb) =>
    ipcRenderer.removeListener("total-video-count", cb),
  deleteFolder: (filePath) => ipcRenderer.invoke("delete-folder", filePath),
  cancelVideoCompress: () =>
    ipcRenderer.invoke("cancel-video-compress"),
});

// electron/preload.js
window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload script loaded.");
});

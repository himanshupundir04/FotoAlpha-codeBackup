const STORE_KEY = "uploadQueue";
const MAX_RETRIES = 5;
const CLEANUP_INTERVAL_MS = 60000;
const ONLINE_DEBOUNCE_MS = 3000;

let listenersRegistered = false;
let lastOnlineEvent = 0;
let cleanupTimer = null;
let onlineListenerAdded = false;
let storeWriteQueue = Promise.resolve();
let isResuming = false;

let subscribers = {
  onProgress: [],
  onComplete: [],
  onError: [],
  onSessionStarted: [],
};

function notify(event, data) {
  const list = subscribers[event] || [];
  list.forEach((fn) => fn(data));
}

async function refreshTrayBadge() {
  if (!window.electronAPI) return;
  const queue = await getQueue();
  const pending = queue.filter(
    (item) =>
      item.status !== "completed" &&
      item.status !== "cancelled" &&
      item.status !== "failed_permanent"
  );
  window.electronAPI?.updateTrayPendingCount?.(pending.length);
}

function enqueueStoreWrite(fn) {
  storeWriteQueue = storeWriteQueue.then(fn, fn);
  return storeWriteQueue;
}

async function getQueue() {
  if (!window.electronAPI) return [];
  return (await window.electronAPI?.getStore(STORE_KEY)) || [];
}

async function setQueue(queue) {
  if (!window.electronAPI) return;
  await window.electronAPI?.setStore(STORE_KEY, queue);
  refreshTrayBadge();
}

async function healthPing(apiUrl) {
  const base = apiUrl || import.meta.env.VITE_BASE_URL;
  try {
    const axios = (await import("axios")).default;
    const res = await axios.get(`${base}/health`, { timeout: 5000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

function registerListeners() {
  if (listenersRegistered || typeof window === "undefined") return;
  if (!window.electronAPI) return;

  listenersRegistered = true;

  window.electronAPI?.onUploadProgress((data) => {
    notify("onProgress", [data]);
    enqueueStoreWrite(() => updateStoreProgress(data));
  });

  window.electronAPI?.onUploadComplete((data) => {
    notify("onComplete", [data]);
    enqueueStoreWrite(() => removeFromStore(data.fileId));
    refreshTrayBadge();
  });

  window.electronAPI?.onUploadError((data) => {
    notify("onError", [data]);
    enqueueStoreWrite(() => incrementRetry(data.fileId));
  });

  window.electronAPI?.onUploadSessionStarted((data) => {
    notify("onSessionStarted", [data]);
    enqueueStoreWrite(() => updateStoreSessionId(data));
  });
}

async function updateStoreProgress(data) {
  const queue = await getQueue();
  const idx = queue.findIndex((item) => item.fileId === data.fileId);
  if (idx !== -1) {
    queue[idx].uploadedChunks = data.uploadedChunks;
    queue[idx].totalChunks = data.totalChunks;
    queue[idx].status = data.status || "uploading";
    queue[idx].bytesUploaded = data.bytesUploaded;
    await setQueue(queue);
  }
}

async function updateStoreSessionId(data) {
  const queue = await getQueue();
  const idx = queue.findIndex((item) => item.fileId === data.fileId);
  if (idx !== -1) {
    queue[idx].savedSessionId = data.sessionId;
    queue[idx].status = "uploading";
    await setQueue(queue);
  }
}

async function removeFromStore(fileId) {
  const queue = await getQueue();
  const updated = queue.filter((item) => item.fileId !== fileId);
  await setQueue(updated);
}

async function incrementRetry(fileId) {
  const queue = await getQueue();
  const idx = queue.findIndex((item) => item.fileId === fileId);
  if (idx !== -1) {
    queue[idx].retryCount = (queue[idx].retryCount || 0) + 1;
    if (queue[idx].retryCount >= MAX_RETRIES) {
      queue[idx].status = "failed_permanent";
    } else {
      queue[idx].status = "queued";
    }
    await setQueue(queue);
  }
}

function startCleanupTimer() {
  if (cleanupTimer) clearInterval(cleanupTimer);
  cleanupTimer = setInterval(async () => {
    if (!window.electronAPI) return;
    const queue = await getQueue();
    const now = Date.now();
    const cleaned = queue.filter(
      (item) =>
        item.status !== "completed" ||
        now - (item.completedAt || item.createdAt) < 24 * 60 * 60 * 1000
    );
    if (cleaned.length !== queue.length) {
      await setQueue(cleaned);
    }
  }, CLEANUP_INTERVAL_MS);
}

export const desktopUploadService = {
  onProgress(fn) {
    subscribers.onProgress.push(fn);
    return () => {
      subscribers.onProgress = subscribers.onProgress.filter((f) => f !== fn);
    };
  },

  onComplete(fn) {
    subscribers.onComplete.push(fn);
    return () => {
      subscribers.onComplete = subscribers.onComplete.filter((f) => f !== fn);
    };
  },

  onError(fn) {
    subscribers.onError.push(fn);
    return () => {
      subscribers.onError = subscribers.onError.filter((f) => f !== fn);
    };
  },

  onSessionStarted(fn) {
    subscribers.onSessionStarted.push(fn);
    return () => {
      subscribers.onSessionStarted = subscribers.onSessionStarted.filter((f) => f !== fn);
    };
  },

  async uploadFile({
    filePath,
    fileName,
    fileType,
    fileHash,
    fileSize,
    eventId,
    subeventId,
    apiUrl,
    token,
  }) {
    registerListeners();
    if (!window.electronAPI) return null;
    if (!filePath || typeof filePath !== "string") return null;
    try {
      if (!(await window.electronAPI?.checkFileExists?.(filePath))) return null;
    } catch { return null; }

    const fileId = `${Date.now()}_${fileName}`;
    const apiBase = apiUrl || import.meta.env.VITE_BASE_URL;
    const authToken = token || localStorage.getItem("token");

    const queueItem = {
      fileId,
      filePath,
      fileName,
      fileType,
      fileHash,
      fileSize,
      eventId: typeof eventId === "object" ? eventId?.value : eventId,
      subeventId: typeof subeventId === "object" ? subeventId?.value : subeventId,
      apiUrl: apiBase,
      token: authToken,
      uploadedChunks: 0,
      totalChunks: 0,
      completedChunks: [],
      status: "queued",
      retryCount: 0,
      createdAt: Date.now(),
    };

    await enqueueStoreWrite(async () => {
      const queue = await getQueue();
      queue.push(queueItem);
      await setQueue(queue);
    });

    await window.electronAPI?.uploadStart({
      filePath,
      fileName,
      fileType,
      fileHash,
      fileSize,
      eventId: queueItem.eventId,
      subeventId: queueItem.subeventId,
      apiUrl: apiBase,
      token: authToken,
      fileId,
      completedChunks: [],
    });

    return fileId;
  },

  async resumePendingUploads({ apiUrl, token } = {}) {
    registerListeners();
    if (!window.electronAPI) return [];

    if (isResuming) return [];
    isResuming = true;

    try {
      const now = Date.now();
      if (now - lastOnlineEvent < ONLINE_DEBOUNCE_MS) {
        return [];
      }
      lastOnlineEvent = now;

      const apiBase = apiUrl || import.meta.env.VITE_BASE_URL;
      const authToken = token || localStorage.getItem("token");

      const online = await healthPing(apiBase);
      if (!online) return [];

      const queue = await getQueue();
      const pending = queue.filter(
        (item) =>
          item.status === "queued" ||
          item.status === "uploading" ||
          item.status === "initiating"
      );

      if (pending.length === 0) return [];

      const resumed = [];
      let queueModified = false;

      for (const item of pending) {
        if (item.retryCount >= MAX_RETRIES) {
          item.status = "failed_permanent";
          queueModified = true;
          continue;
        }

        let completedChunks = item.completedChunks || [];

        if (item.savedSessionId) {
          try {
            const res = await window.electronAPI?.uploadQueryStatus({
              apiUrl: apiBase,
              token: authToken,
              sessionId: item.savedSessionId,
            });
            completedChunks = res.completedChunks || [];
          } catch (err) {
            item.savedSessionId = null;
            completedChunks = [];
          }
        }

        await window.electronAPI?.uploadStart({
          filePath: item.filePath,
          fileName: item.fileName,
          fileType: item.fileType,
          fileHash: item.fileHash,
          fileSize: item.fileSize,
          eventId: item.eventId,
          subeventId: item.subeventId,
          apiUrl: apiBase,
          token: authToken,
          fileId: item.fileId,
          completedChunks,
        });

        item.status = "uploading";
        queueModified = true;
        resumed.push(item.fileId);
      }

      if (queueModified) {
        await enqueueStoreWrite(() => setQueue(queue));
      }

      return resumed;
    } finally {
      isResuming = false;
    }
  },

  async getPendingUploads() {
    const queue = await getQueue();
    return queue.filter(
      (item) =>
        item.status !== "completed" &&
        item.status !== "cancelled" &&
        item.retryCount < MAX_RETRIES
    );
  },

  async cancelUpload(fileId) {
    if (!window.electronAPI) return;
    await window.electronAPI?.uploadCancelFile(fileId);
    await enqueueStoreWrite(() => removeFromStore(fileId));
  },

  async cancelAll() {
    if (!window.electronAPI) return;
    await window.electronAPI?.uploadCancelAll();
    await setQueue([]);
  },

  async clearInactive() {
    const queue = await getQueue();
    const active = queue.filter(
      (item) => item.status !== "completed" && item.status !== "failed_permanent"
    );
    await setQueue(active);
  },

  async getStoredFolders() {
    if (!window.electronAPI) return [];
    return window.electronAPI?.watcherGetFolders?.() || [];
  },

  async storeWatchedFolder(folderPath) {
    if (!window.electronAPI) return;
    await window.electronAPI?.watcherStoreFolder?.(folderPath);
  },

  init() {
    registerListeners();
    startCleanupTimer();
    refreshTrayBadge();

    if (typeof window !== "undefined" && !onlineListenerAdded) {
      onlineListenerAdded = true;
      window.addEventListener("online", () => {
        if (!isResuming) {
          this.resumePendingUploads();
        }
      });
    }
  },

  destroy() {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
    storeWriteQueue = Promise.resolve();
    isResuming = false;
  },
};

export default desktopUploadService;

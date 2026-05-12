const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_CHUNK_SIZE = 10 * 1024 * 1024;
const MAX_PARALLEL_CHUNKS = 4;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];
const MAX_CONCURRENT_FILES = 3;

function getChunkSize(fileSize) {
  if (fileSize < 10 * 1024 * 1024) return Math.min(fileSize, 1 * 1024 * 1024);
  if (fileSize < 100 * 1024 * 1024) return CHUNK_SIZE;
  return MAX_CHUNK_SIZE;
}

const activeUploads = new Map();

const perWindowState = new Map();

function getWindowState(senderId) {
  if (!perWindowState.has(senderId)) {
    perWindowState.set(senderId, {
      uploadQueue: [],
      activeCount: 0,
      cancelled: false,
    });
  }
  return perWindowState.get(senderId);
}

function registerUploadEngineHandlers(baseURL) {
  ipcMain.handle("upload:init-session", async (_event, { apiUrl, token, eventId, subeventId, fileName, fileType, fileSize, fileHash }) => {
    const endpoint = `${apiUrl || baseURL}/uploads/initiate`;
    const res = await axios.post(
      endpoint,
      { eventId, subeventId, fileName, fileType, fileSize, fileHash, chunkSize: getChunkSize(fileSize) },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.data;
  });

  ipcMain.handle("upload:query-status", async (_event, { apiUrl, token, sessionId }) => {
    const endpoint = `${apiUrl || baseURL}/uploads/${sessionId}/status`;
    const res = await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data;
  });

  ipcMain.handle("upload:complete", async (_event, { apiUrl, token, sessionId }) => {
    const endpoint = `${apiUrl || baseURL}/uploads/${sessionId}/complete`;
    const res = await axios.post(endpoint, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data;
  });

  ipcMain.handle("upload:cancel", async (_event, { apiUrl, token, sessionId }) => {
    const endpoint = `${apiUrl || baseURL}/uploads/${sessionId}`;
    const res = await axios.delete(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data;
  });

  ipcMain.handle("upload:cancel-file", async (event, fileId) => {
    const upload = activeUploads.get(fileId);
    if (upload) {
      upload.cancelled = true;
      if (upload.abortController) {
        upload.abortController.abort();
      }
      activeUploads.delete(fileId);
    }
    return true;
  });

  ipcMain.handle("upload:cancel-all", async (event) => {
    const ws = getWindowState(event.sender.id);
    ws.cancelled = true;
    for (const [fileId, upload] of activeUploads) {
      upload.cancelled = true;
      if (upload.abortController) {
        upload.abortController.abort();
      }
    }
    activeUploads.clear();
    ws.uploadQueue = [];
    ws.activeCount = 0;
    return true;
  });
}

async function uploadChunk(apiUrl, token, sessionId, chunkIndex, chunkBuffer, retryCount = 0) {
  const endpoint = `${apiUrl}/uploads/${sessionId}/chunk/${chunkIndex}`;
  try {
    const res = await axios.put(endpoint, chunkBuffer, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      timeout: 60000,
    });
    return { success: true, data: res.data };
  } catch (err) {
    if (axios.isCancel(err)) {
      return { success: false, cancelled: true };
    }
    if (retryCount < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[retryCount]));
      return uploadChunk(apiUrl, token, sessionId, chunkIndex, chunkBuffer, retryCount + 1);
    }
    return { success: false, error: err.message };
  }
}

async function uploadFileMain(event, { filePath: fp, apiUrl, token, eventId, subeventId, fileType, fileHash, fileId, completedChunks: initialCompleted = [] }) {
  const sender = event.sender;
  if (!fs.existsSync(fp)) {
    sender.send("upload:error", { fileId, error: "File not found" });
    return;
  }

  const stats = fs.statSync(fp);
  const chunkSize = getChunkSize(stats.size);
  const totalChunks = Math.ceil(stats.size / chunkSize);

  let completedChunks = [...initialCompleted];
  let sessionId = null;
  const abortController = new AbortController();

  const uploadState = {
    fileId,
    sessionId: null,
    cancelled: false,
    abortController,
    completedChunks,
    totalChunks,
    chunkSize,
    fileName: path.basename(fp),
    fileSize: stats.size,
  };

  activeUploads.set(fileId, uploadState);

  try {
    const initRes = await axios.post(
      `${apiUrl}/uploads/initiate`,
      {
        eventId,
        subeventId,
        fileName: uploadState.fileName,
        fileType,
        fileSize: stats.size,
        chunkSize,
        fileHash,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: abortController.signal,
      }
    );

    sessionId = initRes.data.data.sessionId;
    uploadState.sessionId = sessionId;

    sender.send("upload:session-started", {
      fileId,
      sessionId,
      totalChunks,
      completedChunks: completedChunks.length,
    });
  } catch (err) {
    activeUploads.delete(fileId);
    if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
      sender.send("upload:error", { fileId, error: `Failed to initiate: ${err.message}` });
    }
    return;
  }

  const pendingChunks = [];
  for (let i = 0; i < totalChunks; i++) {
    if (!completedChunks.includes(i)) {
      pendingChunks.push(i);
    }
  }

  if (pendingChunks.length === 0) {
    sender.send("upload:progress", {
      fileId,
      uploadedChunks: totalChunks,
      totalChunks,
      bytesUploaded: stats.size,
      totalBytes: stats.size,
      status: "assembling",
    });

    try {
      await axios.post(
        `${apiUrl}/uploads/${sessionId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, signal: abortController.signal }
      );
      activeUploads.delete(fileId);
      sender.send("upload:complete", { fileId, sessionId, fileName: uploadState.fileName });
    } catch (err) {
      activeUploads.delete(fileId);
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        sender.send("upload:error", { fileId, error: `Complete failed: ${err.message}` });
      }
    }
    return;
  }

  async function processChunk(chunkIndex) {
    if (uploadState.cancelled) return;

    try {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, stats.size);
      const len = end - start;

      const chunkBuffer = Buffer.alloc(len);
      const fd = await fs.promises.open(fp, "r");
      await fd.read(chunkBuffer, 0, len, start);
      await fd.close();

      const result = await uploadChunk(apiUrl, token, sessionId, chunkIndex, chunkBuffer);

      if (result.success) {
        completedChunks.push(chunkIndex);
        uploadState.completedChunks = completedChunks;

        let bytesUploaded = 0;
        for (const ci of completedChunks) {
          const cs = ci * chunkSize;
          const ce = Math.min(cs + chunkSize, stats.size);
          bytesUploaded += ce - cs;
        }

        sender.send("upload:progress", {
          fileId,
          uploadedChunks: completedChunks.length,
          totalChunks,
          bytesUploaded,
          totalBytes: stats.size,
          chunkIndex,
          status: "uploading",
        });

        if (completedChunks.length === totalChunks) {
          sender.send("upload:progress", {
            fileId,
            uploadedChunks: totalChunks,
            totalChunks,
            bytesUploaded: stats.size,
            totalBytes: stats.size,
            status: "assembling",
          });

          try {
            await axios.post(
              `${apiUrl}/uploads/${sessionId}/complete`,
              {},
              { headers: { Authorization: `Bearer ${token}` }, signal: abortController.signal }
            );
            activeUploads.delete(fileId);
            sender.send("upload:complete", { fileId, sessionId, fileName: uploadState.fileName });
          } catch (err) {
            activeUploads.delete(fileId);
            if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
              sender.send("upload:error", { fileId, error: `Complete failed: ${err.message}` });
            }
          }
        }
      } else if (!result.cancelled) {
        sender.send("upload:error", { fileId, chunkIndex, error: `Chunk ${chunkIndex} failed: ${result.error}` });
      }
    } catch (err) {
      sender.send("upload:error", { fileId, chunkIndex, error: `Chunk ${chunkIndex} read error: ${err.message}` });
    }
  }

  const chunkQueue = [...pendingChunks];
  let running = 0;

  async function runNext() {
    while (running < MAX_PARALLEL_CHUNKS && chunkQueue.length > 0 && !uploadState.cancelled) {
      const idx = chunkQueue.shift();
      running++;
      processChunk(idx).finally(() => {
        running--;
        runNext();
      });
    }
  }

  for (let i = 0; i < Math.min(MAX_PARALLEL_CHUNKS, chunkQueue.length); i++) {
    const idx = chunkQueue.shift();
    running++;
    processChunk(idx).finally(() => {
      running--;
      runNext();
    });
  }
}

function startUploadQueue(event, ws) {
  async function processNext() {
    if (ws.cancelled) return;

    while (ws.activeCount < MAX_CONCURRENT_FILES && ws.uploadQueue.length > 0) {
      const job = ws.uploadQueue.shift();
      ws.activeCount++;
      try {
        await uploadFileMain(event, job);
      } catch (err) {
        if (event.sender && !event.sender.isDestroyed()) {
          event.sender.send("upload:error", { fileId: job.fileId, error: err.message });
        }
      }
      ws.activeCount--;
    }

    if (ws.uploadQueue.length > 0 && ws.activeCount < MAX_CONCURRENT_FILES && !ws.cancelled) {
      setImmediate(processNext);
    }
  }

  processNext();
}

ipcMain.handle("upload:start", async (event, params) => {
  const ws = getWindowState(event.sender.id);
  ws.cancelled = false;
  const { filePath: fp, apiUrl, token, eventId, subeventId, fileType, fileHash, fileId, completedChunks } = params;

  ws.uploadQueue.push({ filePath: fp, apiUrl, token, eventId, subeventId, fileType, fileHash, fileId, completedChunks });
  startUploadQueue(event, ws);
  return { queued: true, fileId };
});

ipcMain.handle("upload:get-active", async () => {
  return Array.from(activeUploads.values()).map((u) => ({
    fileId: u.fileId,
    sessionId: u.sessionId,
    completedChunks: u.completedChunks,
    totalChunks: u.totalChunks,
    fileName: u.fileName,
  }));
});

module.exports = { registerUploadEngineHandlers };

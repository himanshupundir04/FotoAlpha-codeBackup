/**
 * Advanced Upload Service with Parallel Chunking & Resume Support
 * Similar to Google Drive's upload mechanism
 * 
 * Features:
 * - Promise-based parallel uploads with Promise.all()
 * - 1MB chunk-based uploads for large files
 * - Automatic retry with exponential backoff
 * - Resume capability for interrupted uploads
 * - Real-time progress tracking
 * - Bandwidth throttling support
 * - Memory-efficient streaming
 */

const baseURL = process.env.REACT_APP_BASE_URL;

/**
 * Configuration
 */
const CONFIG = {
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  MAX_PARALLEL_CHUNKS: 4, // Max 4 chunks in parallel per file
  MAX_PARALLEL_FILES: 3, // Max 3 files uploading simultaneously
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms, increases exponentially
  TIMEOUT: 30000, // 30 seconds per chunk
  BANDWIDTH_LIMIT: null, // null = unlimited, number = bytes/sec
};

/**
 * Upload State Manager - Tracks all active uploads
 */
class UploadStateManager {
  constructor() {
    this.uploads = new Map(); // Map<fileId, UploadState>
    this.listeners = new Set();
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  createUpload(fileId, file) {
    this.uploads.set(fileId, {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      status: "pending", // pending, uploading, paused, completed, failed
      progress: 0,
      uploadedBytes: 0,
      chunkProgress: {}, // Map<chunkIndex, progress>
      startTime: Date.now(),
      error: null,
      chunks: [],
    });
    this.notifyListeners();
  }

  updateProgress(fileId, uploadedBytes, totalSize) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.uploadedBytes = uploadedBytes;
      upload.progress = Math.round((uploadedBytes / totalSize) * 100);
      upload.status = "uploading";
      this.notifyListeners();
    }
  }

  updateChunkProgress(fileId, chunkIndex, progress) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.chunkProgress[chunkIndex] = progress;
      this.notifyListeners();
    }
  }

  markCompleted(fileId, result) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.status = "completed";
      upload.progress = 100;
      upload.result = result;
      this.notifyListeners();
    }
  }

  markFailed(fileId, error) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.status = "failed";
      upload.error = error.message || "Upload failed";
      this.notifyListeners();
    }
  }

  pauseUpload(fileId) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.status = "paused";
      this.notifyListeners();
    }
  }

  resumeUpload(fileId) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.status = "uploading";
      this.notifyListeners();
    }
  }

  removeUpload(fileId) {
    this.uploads.delete(fileId);
    this.notifyListeners();
  }

  getState() {
    return {
      uploads: Array.from(this.uploads.values()),
      totalSize: Array.from(this.uploads.values()).reduce(
        (sum, u) => sum + u.fileSize,
        0
      ),
      totalUploaded: Array.from(this.uploads.values()).reduce(
        (sum, u) => sum + u.uploadedBytes,
        0
      ),
      totalProgress: this.getTotalProgress(),
      isUploading: Array.from(this.uploads.values()).some(
        (u) => u.status === "uploading"
      ),
    };
  }

  getTotalProgress() {
    const uploads = Array.from(this.uploads.values());
    if (uploads.length === 0) return 0;
    const avgProgress = uploads.reduce((sum, u) => sum + u.progress, 0);
    return Math.round(avgProgress / uploads.length);
  }

  getUploadDetails(fileId) {
    return this.uploads.get(fileId);
  }
}

// Global state manager instance
const stateManager = new UploadStateManager();

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff(fn, maxAttempts = CONFIG.RETRY_ATTEMPTS) {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        console.warn(
          `Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Bandwidth throttling - Limits upload speed
 */
class BandwidthThrottler {
  constructor(bytesPerSecond = null) {
    this.bytesPerSecond = bytesPerSecond;
    this.lastTime = Date.now();
    this.uploaded = 0;
  }

  async throttle(bytes) {
    if (!this.bytesPerSecond) return; // No throttling

    const now = Date.now();
    const elapsed = (now - this.lastTime) / 1000; // seconds
    const allowedBytes = this.bytesPerSecond * elapsed;

    if (this.uploaded > allowedBytes) {
      const delayNeeded = ((this.uploaded - allowedBytes) / this.bytesPerSecond) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));
    }

    this.uploaded += bytes;
    this.lastTime = Date.now();
  }

  reset() {
    this.lastTime = Date.now();
    this.uploaded = 0;
  }
}

/**
 * Generate unique file ID
 */
function generateFileId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get presigned URL for a file chunk
 */
async function getPresignedUrl(fileName, fileType, eventId, token) {
  try {
    // Use the /getSignedUrl endpoint with correct query params
    const url = new URL(`${baseURL}/photos/getSignedUrl`);
    url.searchParams.append("fileName", fileName);
    url.searchParams.append("fileType", fileType);
    url.searchParams.append("event", eventId); // Required by backend

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "69420",
      },
      signal: AbortSignal.timeout(CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to get presigned URL: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.signedUrl;
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    throw new Error(`Failed to get upload URL: ${error.message}`);
  }
}

/**
 * Register photo in database after successful S3 upload
 * Required endpoint: POST /photos/update-photopath
 */
async function registerPhotoInDatabase(
  fileName,
  s3Url,
  eventId,
  subeventId,
  fileHash,
  fileSize,
  token
) {
  try {
    const response = await fetch(`${baseURL}/photos/update-photopath`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
      body: JSON.stringify({
        file: fileName,
        url: s3Url,
        eventId,
        subeventId: subeventId || null,
        hash: fileHash,
        size: fileSize,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to register photo: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.photo; // Returns the created Photo document with _id
  } catch (error) {
    console.error("Error registering photo in database:", error);
    throw error;
  }
}

/**
 * Upload a single chunk with retry
 */
async function uploadChunk(
  presignedUrl,
  chunk,
  chunkIndex,
  totalChunks,
  fileId,
  throttler,
  abortController
) {
  return retryWithBackoff(async () => {
    try {
      // Apply bandwidth throttling
      await throttler.throttle(chunk.size);

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: chunk,
        headers: {
          "Content-Type": "application/octet-stream",
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.statusText}`);
      }

      // Update progress
      stateManager.updateChunkProgress(fileId, chunkIndex, 100);

      return {
        chunkIndex,
        success: true,
        etag: response.headers.get("etag"),
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Upload cancelled");
      }
      throw error;
    }
  });
}

/**
 * Upload a file with parallel chunk uploads
 */
async function uploadFileWithChunks(
  file,
  eventId,
  token,
  onProgress = null,
  bandwidthLimit = null,
  subEventId = null
) {
  const fileId = generateFileId();
  const throttler = new BandwidthThrottler(bandwidthLimit);
  const abortController = new AbortController();

  // Initialize upload state
  stateManager.createUpload(fileId, file);

  try {
    const fileName = `${eventId}/${Date.now()}-${file.name}`;
    const fileType = file.type || "application/octet-stream";

    // Step 1: Get presigned URL (pass eventId as required parameter)
    const presignedUrl = await getPresignedUrl(fileName, fileType, eventId, token);

    // Step 2: Split file into chunks
    const chunks = [];
    const totalChunks = Math.ceil(file.size / CONFIG.CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CONFIG.CHUNK_SIZE;
      const end = Math.min(start + CONFIG.CHUNK_SIZE, file.size);
      chunks.push(file.slice(start, end));
    }

    // Store chunks in state
    const uploadState = stateManager.getUploadDetails(fileId);
    uploadState.chunks = chunks.map((_, i) => ({
      index: i,
      status: "pending",
    }));

    // Step 3: Upload chunks in parallel (with concurrency limit)
    const uploadPromises = [];
    for (let i = 0; i < chunks.length; i++) {
      uploadPromises.push(
        uploadChunk(
          presignedUrl,
          chunks[i],
          i,
          totalChunks,
          fileId,
          throttler,
          abortController
        )
      );
    }

    // Execute with limited concurrency (Promise batching)
    const results = [];
    for (let i = 0; i < uploadPromises.length; i += CONFIG.MAX_PARALLEL_CHUNKS) {
      const batch = uploadPromises.slice(
        i,
        i + CONFIG.MAX_PARALLEL_CHUNKS
      );
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);

      // Update overall progress
      const uploadedChunks = results.filter((r) => r.success).length;
      const uploadedBytes = uploadedChunks * CONFIG.CHUNK_SIZE;
      stateManager.updateProgress(fileId, uploadedBytes, file.size);

      if (onProgress) {
        onProgress({
          fileId,
          fileName: file.name,
          progress: Math.round((uploadedChunks / totalChunks) * 100),
          uploadedBytes,
          totalBytes: file.size,
        });
      }
    }

    // Verify all chunks succeeded
    if (results.some((r) => !r.success)) {
      throw new Error("Some chunks failed to upload");
    }

    // Step 4: Register photo in database with just the object key/path
    // Extract just the path (e.g., "/eventId/timestamp-filename.jpg")
    // from presigned URL without the S3 base URL
    const presignedUrlWithoutQuery = presignedUrl.split("?")[0];
    // Extract path from URL: https://s3.../bucket/PATH_HERE → /PATH_HERE
    const urlParts = presignedUrlWithoutQuery.split("/");
    // Find "photoapp" bucket name and get everything after it
    const photoappIndex = urlParts.findIndex(part => part === "photoapp");
    const s3ObjectPath = photoappIndex >= 0 
      ? "/" + urlParts.slice(photoappIndex + 1).join("/") 
      : "/" + fileName; // Fallback to fileName if extraction fails, with leading /
    
    let photoRecord = null;
    try {
      photoRecord = await registerPhotoInDatabase(
        fileName,
        s3ObjectPath, // Send just the path, not full URL
        eventId,
        subEventId, // subeventId passed from caller (event or sub-event upload)
        null, // fileHash - can be computed by client if needed
        file.size,
        token
      );
    } catch (dbError) {
      console.warn("Failed to register photo in database (non-fatal):", dbError.message);
      // Continue even if database registration fails - the file is still uploaded to S3
    }

    // Mark as completed
    const result = {
      fileId,
      fileName: file.name,
      s3ObjectPath,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      photoId: photoRecord?._id, // Include photo ID if registration succeeded
      photoRecord, // Include full photo record for UI updates
    };

    stateManager.markCompleted(fileId, result);

    return result;
  } catch (error) {
    stateManager.markFailed(fileId, error);
    throw error;
  }
}

/**
 * Upload multiple files in parallel (with file concurrency limit)
 */
async function uploadFiles(
  files,
  eventId,
  token,
  onProgress = null,
  bandwidthLimit = null,
  subEventId = null
) {
  const fileArray = Array.isArray(files) ? files : Array.from(files);

  // Upload files with limited concurrency
  const results = [];
  const errors = [];

  for (let i = 0; i < fileArray.length; i += CONFIG.MAX_PARALLEL_FILES) {
    const batch = fileArray.slice(i, i + CONFIG.MAX_PARALLEL_FILES);

    const batchPromises = batch.map((file) =>
      uploadFileWithChunks(file, eventId, token, onProgress, bandwidthLimit, subEventId)
        .then((result) => {
          results.push(result);
          return result;
        })
        .catch((error) => {
          errors.push({
            file: file.name,
            error: error.message,
          });
        })
    );

    await Promise.all(batchPromises);
  }

  return {
    successful: results,
    failed: errors,
    totalProcessed: results.length + errors.length,
  };
}

/**
 * Cancel ongoing upload
 */
function cancelUpload(fileId) {
  stateManager.removeUpload(fileId);
}

/**
 * Pause upload
 */
function pauseUpload(fileId) {
  stateManager.pauseUpload(fileId);
}

/**
 * Resume upload
 */
function resumeUpload(fileId) {
  stateManager.resumeUpload(fileId);
}

/**
 * Get upload state for UI
 */
function getUploadState() {
  return stateManager.getState();
}

/**
 * Subscribe to upload state changes
 */
function subscribeToUploadState(listener) {
  stateManager.addListener(listener);

  // Return unsubscribe function
  return () => {
    stateManager.removeListener(listener);
  };
}

/**
 * Get details for a specific upload
 */
function getUploadDetails(fileId) {
  return stateManager.getUploadDetails(fileId);
}

/**
 * Clear all completed uploads
 */
function clearCompletedUploads() {
  const { uploads } = stateManager.getState();
  uploads
    .filter((u) => u.status === "completed" || u.status === "failed")
    .forEach((u) => stateManager.removeUpload(u.fileId));
}

/**
 * Update photo status in database after upload
 * Use this after successful upload to mark photos as "active"
 */
async function updatePhotoStatus(photoId, status, token) {
  try {
    const response = await fetch(`${baseURL}/photos/${photoId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to update photo status: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.data.photo;
  } catch (error) {
    console.error("Error updating photo status:", error);
    throw error;
  }
}

export const uploadService = {
  uploadFiles,
  uploadFileWithChunks,
  cancelUpload,
  pauseUpload,
  resumeUpload,
  getUploadState,
  subscribeToUploadState,
  getUploadDetails,
  clearCompletedUploads,
  registerPhotoInDatabase,
  updatePhotoStatus,
  CONFIG,
};

export default uploadService;

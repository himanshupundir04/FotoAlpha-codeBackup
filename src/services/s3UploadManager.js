/**
 * S3 Upload Manager
 * Handles presigned URL generation and direct S3 uploads
 * Manages batch uploads with retry logic and error handling
 * 
 * Features:
 * - Presigned URL generation
 * - Direct S3 uploads without server intermediary
 * - Retry with exponential backoff
 * - Progress tracking
 * - Error recovery
 */

import axios from 'axios';

const baseURL = process.env.REACT_APP_BASE_URL;

class S3UploadManager {
  /**
   * Configuration
   */
  static CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // ms
    RETRY_BACKOFF_MULTIPLIER: 2,
    UPLOAD_TIMEOUT: 60000, // 60 seconds
    MAX_PARALLEL_UPLOADS: 3,
  };

  /**
   * Get presigned URL for uploading file to S3
   * @param {Object} params - { fileName, fileType, event, hash }
   * @returns {Promise<string>} Presigned upload URL
   */
  static async getPresignedUrl(params) {
    try {
      const { fileName, fileType, event, hash } = params;

      if (!fileName || !fileType || !event) {
        throw new Error('Missing required parameters: fileName, fileType, event');
      }

      const response = await axios.get(`${baseURL}/photos/getSignedUrl`, {
        params: {
          fileName,
          fileType,
          event,
          hash: hash || null,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'ngrok-skip-browser-warning': '69420',
        },
      });

      if (!response.data?.signedUrl) {
        throw new Error('Failed to get presigned URL');
      }

      return response.data.signedUrl;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to get presigned URL: ${message}`);
    }
  }

  /**
   * Upload file to S3 using presigned URL
   * @param {Blob} fileBlob - File to upload
   * @param {string} presignedUrl - S3 presigned URL
   * @param {Object} options - { fileName, fileType, onProgress }
   * @returns {Promise<void>}
   */
  static async uploadToS3(fileBlob, presignedUrl, options = {}) {
    const { fileName = 'file', fileType = 'application/octet-stream', onProgress } = options;
    let retryCount = 0;

    while (retryCount < this.CONFIG.MAX_RETRIES) {
      try {
        await this.executeS3Upload(fileBlob, presignedUrl, fileType, onProgress);
        return; // Success
      } catch (error) {
        retryCount++;

        if (retryCount >= this.CONFIG.MAX_RETRIES) {
          throw new Error(`Upload failed after ${this.CONFIG.MAX_RETRIES} retries: ${error.message}`);
        }

        // Exponential backoff
        const delayMs = this.CONFIG.RETRY_DELAY * Math.pow(this.CONFIG.RETRY_BACKOFF_MULTIPLIER, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Execute single S3 upload with progress tracking
   * @param {Blob} fileBlob
   * @param {string} presignedUrl
   * @param {string} fileType
   * @param {Function} onProgress
   */
  static async executeS3Upload(fileBlob, presignedUrl, fileType, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const uploadStartTime = Date.now();

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          const elapsedTime = Date.now() - uploadStartTime;
          const uploadSpeed = elapsedTime > 0 ? event.loaded / (elapsedTime / 1000) : 0; // bytes/sec

          if (onProgress) {
            onProgress({
              progress: percentComplete,
              loaded: event.loaded,
              total: event.total,
              speed: uploadSpeed,
            });
          }
        }
      });

      // Completion handlers
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during S3 upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      // Timeout
      xhr.timeout = this.CONFIG.UPLOAD_TIMEOUT;
      xhr.addEventListener('timeout', () => {
        reject(new Error(`Upload timeout after ${this.CONFIG.UPLOAD_TIMEOUT}ms`));
      });

      // Start upload
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', fileType);
      xhr.send(fileBlob);
    });
  }

  /**
   * Update photo path in backend database
   * @param {Object} photoData - Photo metadata to save
   * @returns {Promise<Object>} Created photo object
   */
  static async updatePhotoPath(photoData) {
    try {
      const {
        file,           // S3 file path
        url,            // S3 URL
        eventId,        // Event ID
        subeventId,     // Sub-event ID (optional)
        hash,           // File hash for duplicate detection
        size,           // File size
        thumbnails,     // Thumbnail URLs
        compressionInfo, // Compression metadata
      } = photoData;

      if (!file || !url || !eventId) {
        throw new Error('Missing required fields: file, url, eventId');
      }

      const response = await axios.post(
        `${baseURL}/photos/update-photopath`,
        {
          file,
          url,
          eventId,
          subeventId,
          hash,
          size,
          thumbnails,
          compressionInfo,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'ngrok-skip-browser-warning': '69420',
          },
        }
      );

      if (!response.data?.photo) {
        throw new Error('Failed to update photo path');
      }

      return response.data.photo;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to update photo path: ${message}`);
    }
  }

  /**
   * Batch upload multiple files with managed concurrency
   * @param {Array} uploadTasks - Array of { blob, fileName, fileType, eventId, ... }
   * @param {Function} progressCallback - Called with progress updates
   * @returns {Promise<Array>} Array of uploaded photo data
   */
  static async batchUpload(uploadTasks, progressCallback) {
    const results = [];
    const errors = [];
    let completedCount = 0;

    // Process in chunks to limit concurrent uploads
    for (let i = 0; i < uploadTasks.length; i += this.CONFIG.MAX_PARALLEL_UPLOADS) {
      const chunk = uploadTasks.slice(i, i + this.CONFIG.MAX_PARALLEL_UPLOADS);

      const chunkPromises = chunk.map(async (task) => {
        try {
          if (progressCallback) {
            progressCallback({
              status: 'uploading',
              currentIndex: uploadTasks.indexOf(task),
              totalFiles: uploadTasks.length,
              fileName: task.fileName,
            });
          }

          // Get presigned URL
          const presignedUrl = await this.getPresignedUrl({
            fileName: task.s3FileName,
            fileType: task.fileType,
            event: task.eventId,
            hash: task.hash,
          });

          // Upload to S3
          await this.uploadToS3(task.blob, presignedUrl, {
            fileName: task.fileName,
            fileType: task.fileType,
            onProgress: (progress) => {
              if (progressCallback) {
                progressCallback({
                  status: 'uploading',
                  fileName: task.fileName,
                  fileProgress: progress.progress,
                  totalFiles: uploadTasks.length,
                });
              }
            },
          });

          // Update photo path in backend
          const photoData = await this.updatePhotoPath({
            file: task.s3FileName,
            url: task.s3Url,
            eventId: task.eventId,
            subeventId: task.subeventId,
            hash: task.hash,
            size: task.size,
            thumbnails: task.thumbnails,
            compressionInfo: task.compressionInfo,
          });

          completedCount++;
          results.push(photoData);

          if (progressCallback) {
            progressCallback({
              status: 'completed',
              completedCount,
              totalFiles: uploadTasks.length,
              fileName: task.fileName,
            });
          }
        } catch (error) {
          errors.push({
            fileName: task.fileName,
            error: error.message,
          });

          if (progressCallback) {
            progressCallback({
              status: 'error',
              fileName: task.fileName,
              error: error.message,
            });
          }
        }
      });

      // Wait for this chunk to complete
      await Promise.allSettled(chunkPromises);
    }

    if (errors.length > 0) {
      throw new Error(`Batch upload completed with ${errors.length} errors: ${errors.map(e => e.error).join(', ')}`);
    }

    return results;
  }

  /**
   * Calculate file hash for duplicate detection
   * @param {Blob} blob
   * @returns {Promise<string>} SHA-256 hash
   */
  static async calculateFileHash(blob) {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
}

export default S3UploadManager;

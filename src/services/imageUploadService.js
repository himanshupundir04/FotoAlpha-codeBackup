/**
 * Image Upload Orchestration Service
 * Coordinates compression, thumbnail generation, and S3 upload
 * Provides high-level API for complete image upload workflow
 * 
 * Workflow:
 * 1. Validate image
 * 2. Compress to WebP (70% quality)
 * 3. Generate thumbnails (small, medium, large)
 * 4. Calculate hash for duplicate detection
 * 5. Upload compressed + thumbnails to S3
 * 6. Update database with photo metadata
 */

import ImageCompressionService from './imageCompressionService';
import ThumbnailGeneratorService from './thumbnailGeneratorService';
import S3UploadManager from './s3UploadManager';

class ImageUploadService {
  /**
   * Process and upload single image
   * @param {File} imageFile - Original image file
   * @param {Object} metadata - { eventId, subeventId, userId }
   * @param {Function} progressCallback - Called with upload progress
   * @returns {Promise<Object>} Upload result with photo data
   */
  static async uploadImage(imageFile, metadata, progressCallback) {
    try {
      const { eventId, subeventId, userId } = metadata;

      if (!eventId) {
        throw new Error('Event ID is required');
      }

      // Step 1: Validate image
      if (progressCallback) {
        progressCallback({ status: 'validating', fileName: imageFile.name });
      }
      ImageCompressionService.validateImage(imageFile);

      // Step 2: Compress image
      if (progressCallback) {
        progressCallback({ status: 'compressing', fileName: imageFile.name });
      }

      const originalSize = imageFile.size;
      const compressedBlob = await ImageCompressionService.compressImage(imageFile, {
        quality: 0.7,
      });
      const compressedSize = compressedBlob.size;
      const compressionRatio = ImageCompressionService.getCompressionRatio(originalSize, compressedSize);

      // Step 3: Generate thumbnails
      if (progressCallback) {
        progressCallback({ status: 'generating_thumbnails', fileName: imageFile.name });
      }

      const thumbnails = await ThumbnailGeneratorService.generateAllThumbnails(
        compressedBlob,
        (progress) => {
          if (progressCallback) {
            progressCallback({
              status: 'generating_thumbnails',
              fileName: imageFile.name,
              currentThumbnail: progress.currentSize,
            });
          }
        }
      );

      // Step 4: Calculate hash for duplicate detection
      if (progressCallback) {
        progressCallback({ status: 'calculating_hash', fileName: imageFile.name });
      }

      const fileHash = await S3UploadManager.calculateFileHash(compressedBlob);

      // Step 5: Generate S3 filenames
      const timestamp = Date.now();
      const compressedFileName = `${eventId}/${timestamp}-${imageFile.name.replace(/\.[^.]*$/, '')}.webp`;
      const s3Url = `/${compressedFileName}`; // Relative URL for storing in DB

      // Step 6: Upload compressed image to S3
      if (progressCallback) {
        progressCallback({ status: 'uploading_s3', fileName: imageFile.name });
      }

      const presignedUrl = await S3UploadManager.getPresignedUrl({
        fileName: compressedFileName,
        fileType: 'image/webp',
        event: eventId,
        hash: fileHash,
      });

      await S3UploadManager.uploadToS3(compressedBlob, presignedUrl, {
        fileName: imageFile.name,
        fileType: 'image/webp',
        onProgress: (progress) => {
          if (progressCallback) {
            progressCallback({
              status: 'uploading_s3',
              fileName: imageFile.name,
              progress: progress.progress,
              speed: progress.speed,
            });
          }
        },
      });

      // Step 7: Upload thumbnails to S3
      const thumbnailUrls = {};
      for (const [sizeKey, thumbnailBlob] of Object.entries(thumbnails)) {
        if (progressCallback) {
          progressCallback({
            status: 'uploading_thumbnail',
            fileName: imageFile.name,
            thumbnailSize: sizeKey,
          });
        }

        const thumbnailFileName = `${eventId}/${timestamp}-thumb-${sizeKey}-${imageFile.name.replace(/\.[^.]*$/, '')}.webp`;
        const thumbnailPresignedUrl = await S3UploadManager.getPresignedUrl({
          fileName: thumbnailFileName,
          fileType: 'image/webp',
          event: eventId,
        });

        await S3UploadManager.uploadToS3(thumbnailBlob, thumbnailPresignedUrl, {
          fileName: `${imageFile.name} (${sizeKey} thumbnail)`,
          fileType: 'image/webp',
        });

        thumbnailUrls[sizeKey] = `/${thumbnailFileName}`;
      }

      // Step 8: Update photo path in backend database
      if (progressCallback) {
        progressCallback({ status: 'updating_database', fileName: imageFile.name });
      }

      const photoData = await S3UploadManager.updatePhotoPath({
        file: compressedFileName,
        url: s3Url,
        eventId,
        subeventId,
        hash: fileHash,
        size: compressedSize,
        thumbnails: thumbnailUrls,
        compressionInfo: {
          originalSize,
          compressedSize,
          compressionRatio,
          originalFormat: imageFile.type,
          compressedFormat: 'image/webp',
          quality: 0.7,
        },
      });

      if (progressCallback) {
        progressCallback({
          status: 'completed',
          fileName: imageFile.name,
          photoId: photoData._id,
        });
      }

      return {
        success: true,
        photo: photoData,
        compression: {
          originalSize: ImageCompressionService.formatFileSize(originalSize),
          compressedSize: ImageCompressionService.formatFileSize(compressedSize),
          ratio: compressionRatio,
        },
      };
    } catch (error) {
      if (progressCallback) {
        progressCallback({
          status: 'error',
          fileName: imageFile.name,
          error: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Process and upload batch of images
   * @param {File[]} imageFiles - Array of image files
   * @param {Object} metadata - { eventId, subeventId, userId }
   * @param {Function} progressCallback - Called with batch progress
   * @returns {Promise<Array>} Array of upload results
   */
  static async uploadBatch(imageFiles, metadata, progressCallback) {
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('No images provided');
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const imageFile = imageFiles[i];

        if (progressCallback) {
          progressCallback({
            batchStatus: 'uploading',
            currentIndex: i + 1,
            totalFiles: imageFiles.length,
            fileName: imageFile.name,
          });
        }

        const result = await this.uploadImage(imageFile, metadata, (progress) => {
          if (progressCallback) {
            progressCallback({
              ...progress,
              batchIndex: i + 1,
              batchTotal: imageFiles.length,
            });
          }
        });

        results.push(result);
      } catch (error) {
        errors.push({
          fileName: imageFiles[i].name,
          error: error.message,
        });

        if (progressCallback) {
          progressCallback({
            batchStatus: 'error',
            fileName: imageFiles[i].name,
            error: error.message,
            currentIndex: i + 1,
            totalFiles: imageFiles.length,
          });
        }
      }
    }

    if (progressCallback) {
      progressCallback({
        batchStatus: 'completed',
        totalFiles: imageFiles.length,
        successCount: results.length,
        errorCount: errors.length,
      });
    }

    if (errors.length > 0) {
      const errorSummary = errors.map(e => `${e.fileName}: ${e.error}`).join('; ');
      throw new Error(`Batch upload completed with errors: ${errorSummary}`);
    }

    return results;
  }

  /**
   * Validate images before upload
   * @param {File[]} files
   * @returns {Object} Validation result
   */
  static validateImages(files) {
    const validation = {
      valid: [],
      invalid: [],
      totalSize: 0,
    };

    files.forEach((file) => {
      try {
        ImageCompressionService.validateImage(file);
        validation.valid.push(file);
        validation.totalSize += file.size;
      } catch (error) {
        validation.invalid.push({
          fileName: file.name,
          error: error.message,
        });
      }
    });

    return validation;
  }

  /**
   * Estimate upload time for batch
   * @param {File[]} files
   * @param {number} uploadSpeedMbps - Upload speed in Mbps
   * @returns {number} Estimated time in seconds
   */
  static estimateUploadTime(files, uploadSpeedMbps = 10) {
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    // Estimate 40% reduction from compression
    const estimatedCompressedBytes = totalBytes * 0.6;
    const bytesPerSecond = (uploadSpeedMbps * 1024 * 1024) / 8;
    return Math.ceil(estimatedCompressedBytes / bytesPerSecond);
  }
}

export default ImageUploadService;

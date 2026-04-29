/**
 * Thumbnail Generator Service
 * Efficiently generates thumbnails for images
 * Used for preview and gallery display
 * 
 * Features:
 * - Multiple thumbnail sizes
 * - Aspect ratio preservation
 * - Quality optimization for thumbnails
 * - Memory-efficient processing
 */

class ThumbnailGeneratorService {
  /**
   * Thumbnail size configurations
   */
  static THUMBNAIL_SIZES = {
    SMALL: { width: 150, height: 150, name: 'small' },    // Gallery preview
    MEDIUM: { width: 300, height: 300, name: 'medium' },  // Album preview
    LARGE: { width: 600, height: 600, name: 'large' },    // Detail view
  };

  /**
   * Generate thumbnail from image blob
   * @param {Blob} imageBlob - Compressed image blob
   * @param {Object} size - Size configuration { width, height, name }
   * @param {number} quality - Quality 0-1 (default 0.8)
   * @returns {Promise<Blob>} Thumbnail blob
   */
  static async generateThumbnail(imageBlob, size = this.THUMBNAIL_SIZES.MEDIUM, quality = 0.8) {
    try {
      const canvas = await this.createCanvasFromBlob(imageBlob);
      return await this.createScaledCanvasBlobWebP(canvas, size, quality);
    } catch (error) {
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  /**
   * Generate multiple thumbnail sizes from single image
   * @param {Blob} imageBlob
   * @param {Function} progressCallback
   * @returns {Promise<Object>} Object with small, medium, large thumbnails
   */
  static async generateAllThumbnails(imageBlob, progressCallback) {
    const thumbnails = {};

    try {
      const canvas = await this.createCanvasFromBlob(imageBlob);

      // Generate each size
      for (const sizeKey of Object.keys(this.THUMBNAIL_SIZES)) {
        const sizeConfig = this.THUMBNAIL_SIZES[sizeKey];

        if (progressCallback) {
          progressCallback({
            currentSize: sizeConfig.name,
            status: 'generating_thumbnail',
          });
        }

        thumbnails[sizeConfig.name] = await this.createScaledCanvasBlobWebP(
          canvas,
          sizeConfig,
          0.8
        );
      }

      return thumbnails;
    } catch (error) {
      throw new Error(`Failed to generate thumbnails: ${error.message}`);
    }
  }

  /**
   * Create canvas from blob
   * @param {Blob} blob
   * @returns {Promise<HTMLCanvasElement>}
   */
  static async createCanvasFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Create scaled canvas and convert to WebP blob
   * Preserves aspect ratio
   * @param {HTMLCanvasElement} sourceCanvas
   * @param {Object} size - { width, height, name }
   * @param {number} quality
   * @returns {Promise<Blob>}
   */
  static async createScaledCanvasBlobWebP(sourceCanvas, size, quality) {
    const scaledCanvas = document.createElement('canvas');
    const ctx = scaledCanvas.getContext('2d', { alpha: false });

    // Calculate dimensions maintaining aspect ratio
    const dimensions = this.calculateDimensions(
      sourceCanvas.width,
      sourceCanvas.height,
      size.width,
      size.height
    );

    scaledCanvas.width = dimensions.width;
    scaledCanvas.height = dimensions.height;

    // Fill with white background (for images with transparency)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);

    // Draw scaled image
    ctx.drawImage(sourceCanvas, 0, 0, dimensions.width, dimensions.height);

    // Convert to WebP blob
    return new Promise((resolve, reject) => {
      scaledCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create thumbnail'));
          } else {
            resolve(blob);
          }
        },
        'image/webp',
        quality
      );
    });
  }

  /**
   * Calculate dimensions maintaining aspect ratio
   * @param {number} srcWidth
   * @param {number} srcHeight
   * @param {number} maxWidth
   * @param {number} maxHeight
   * @returns {Object} { width, height }
   */
  static calculateDimensions(srcWidth, srcHeight, maxWidth, maxHeight) {
    const srcAspect = srcWidth / srcHeight;
    const maxAspect = maxWidth / maxHeight;

    let width, height;

    if (srcAspect > maxAspect) {
      // Image is wider
      width = maxWidth;
      height = Math.round(maxWidth / srcAspect);
    } else {
      // Image is taller
      height = maxHeight;
      width = Math.round(maxHeight * srcAspect);
    }

    return { width, height };
  }

  /**
   * Generate filename for thumbnail
   * @param {string} originalFilename
   * @param {string} size - 'small', 'medium', 'large'
   * @returns {string}
   */
  static generateThumbnailFilename(originalFilename, size) {
    const baseName = originalFilename.replace(/\.[^.]*$/, '');
    const timestamp = Date.now();
    return `${baseName}-thumb-${size}-${timestamp}.webp`;
  }
}

export default ThumbnailGeneratorService;

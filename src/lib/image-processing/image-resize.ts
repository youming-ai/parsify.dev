/**
 * Image Resize Utilities
 * Provides various image resizing algorithms using Canvas API
 */

export interface ResizeOptions {
  file: File;
  width?: number;
  height?: number;
  algorithm?: 'nearest' | 'bilinear' | 'bicubic';
  maintainAspectRatio?: boolean;
  quality?: number;
}

export interface ResizeResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  originalSize?: { width: number; height: number };
  newSize?: { width: number; height: number };
  fileReduction?: number; // percentage reduction
  error?: string;
}

/**
 * Resize image with specified options
 */
export async function resizeImage(options: ResizeOptions): Promise<ResizeResult> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const originalSize = { width: img.width, height: img.height };

        // Calculate new dimensions
        const { width: newWidth, height: newHeight } = calculateNewDimensions(
          img.width,
          img.height,
          options.width,
          options.height,
          options.maintainAspectRatio !== false
        );

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Get context and set image smoothing
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            success: false,
            error: 'Failed to get canvas context'
          });
          return;
        }

        // Set image smoothing based on algorithm
        setImageSmoothing(ctx, options.algorithm || 'bilinear');

        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Calculate file size reduction
        const fileReduction = options.file.size ?
          ((options.file.size - (newWidth * newHeight * 4)) / options.file.size) * 100 : 0;

        // Convert to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({
              success: false,
              error: 'Failed to resize image'
            });
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;

            resolve({
              success: true,
              dataUrl,
              blob,
              originalSize,
              newSize: { width: newWidth, height: newHeight },
              fileReduction
            });
          };
          reader.readAsDataURL(blob);
        }, options.file.type, options.quality || 0.9);

      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Resize failed'
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to load image'
      });
    };

    img.src = URL.createObjectURL(options.file);
  });
}

/**
 * Calculate new dimensions based on resize options
 */
function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  maintainAspectRatio: boolean = true
): { width: number; height: number } {
  if (!targetWidth && !targetHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  if (!maintainAspectRatio) {
    return {
      width: targetWidth || originalWidth,
      height: targetHeight || originalHeight
    };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio)
    };
  }

  if (!targetWidth && targetHeight) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight
    };
  }

  // Both provided - use the one that maintains aspect ratio better
  const calculatedHeight = Math.round((targetWidth! * originalHeight) / originalWidth);
  const calculatedWidth = Math.round((targetHeight! * originalWidth) / originalHeight);

  if (Math.abs(calculatedHeight - targetHeight!) < Math.abs(calculatedWidth - targetWidth!)) {
    return {
      width: calculatedWidth,
      height: targetHeight!
    };
  } else {
    return {
      width: targetWidth!,
      height: calculatedHeight
    };
  }
}

/**
 * Set image smoothing algorithm
 */
function setImageSmoothing(ctx: CanvasRenderingContext2D, algorithm: 'nearest' | 'bilinear' | 'bicubic'): void {
  switch (algorithm) {
    case 'nearest':
      ctx.imageSmoothingEnabled = false;
      break;
    case 'bilinear':
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      break;
    case 'bicubic':
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      break;
  }
}

/**
 * Resize image by width (maintain aspect ratio)
 */
export function resizeByWidth(
  file: File,
  width: number,
  algorithm?: 'nearest' | 'bilinear' | 'bicubic'
): Promise<ResizeResult> {
  return resizeImage({
    file,
    width,
    maintainAspectRatio: true,
    algorithm
  });
}

/**
 * Resize image by height (maintain aspect ratio)
 */
export function resizeByHeight(
  file: File,
  height: number,
  algorithm?: 'nearest' | 'bilinear' | 'bicubic'
): Promise<ResizeResult> {
  return resizeImage({
    file,
    height,
    maintainAspectRatio: true,
    algorithm
  });
}

/**
 * Resize image by percentage
 */
export function resizeByPercentage(
  file: File,
  percentage: number,
  algorithm?: 'nearest' | 'bilinear' | 'bicubic'
): Promise<ResizeResult> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const newWidth = Math.round(img.width * (percentage / 100));
      const newHeight = Math.round(img.height * (percentage / 100));

      resizeImage({
        file,
        width: newWidth,
        height: newHeight,
        maintainAspectRatio: true,
        algorithm
      }).then(resolve);
    };

    img.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to load image'
      });
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Crop image to square (center crop)
 */
export function cropToSquare(file: File): Promise<ResizeResult> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            success: false,
            error: 'Failed to get canvas context'
          });
          return;
        }

        ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({
              success: false,
              error: 'Failed to crop image'
            });
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              success: true,
              dataUrl: reader.result as string,
              blob,
              originalSize: { width: img.width, height: img.height },
              newSize: { width: size, height: size }
            });
          };
          reader.readAsDataURL(blob);
        }, file.type, 0.9);

      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Crop failed'
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to load image'
      });
    };

    img.src = URL.createObjectURL(file);
  });
}

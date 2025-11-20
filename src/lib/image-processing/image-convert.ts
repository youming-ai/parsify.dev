/**
 * Image Conversion Utilities
 * Supports various image format conversions using Canvas API
 */

export interface ImageConvertOptions {
  file: File;
  format: "png" | "jpeg" | "webp" | "bmp" | "gif";
  quality?: number; // 0-1 for JPEG/WebP
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export interface ImageConvertResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  originalFormat?: string;
  convertedFormat?: string;
  originalSize?: number;
  convertedSize?: number;
  error?: string;
}

/**
 * Convert image to different format
 */
export async function convertImage(options: ImageConvertOptions): Promise<ImageConvertResult> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate dimensions
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          options.width,
          options.height,
          options.maintainAspectRatio !== false,
        );

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        // Draw image
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            success: false,
            error: "Failed to get canvas context",
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Get original format
        const originalFormat = options.file.type.split("/")[1] || "unknown";
        const originalSize = options.file.size;

        // Convert to desired format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                success: false,
                error: "Failed to convert image",
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
                originalFormat,
                convertedFormat: options.format,
                originalSize,
                convertedSize: blob.size,
              });
            };
            reader.readAsDataURL(blob);
          },
          `image/${options.format}`,
          options.quality || 0.9,
        );
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : "Conversion failed",
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        error: "Failed to load image",
      });
    };

    img.src = URL.createObjectURL(options.file);
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio if needed
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  maintainAspectRatio: boolean = true,
): { width: number; height: number } {
  if (!targetWidth && !targetHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  if (!maintainAspectRatio) {
    return {
      width: targetWidth || originalWidth,
      height: targetHeight || originalHeight,
    };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  if (!targetWidth && targetHeight) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }

  // Both provided - use the one that maintains aspect ratio better
  const calculatedHeight = Math.round((targetWidth! * originalHeight) / originalWidth);
  const calculatedWidth = Math.round((targetHeight! * originalWidth) / originalHeight);

  if (Math.abs(calculatedHeight - targetHeight!) < Math.abs(calculatedWidth - targetWidth!)) {
    return {
      width: calculatedWidth,
      height: targetHeight!,
    };
  } else {
    return {
      width: targetWidth!,
      height: calculatedHeight,
    };
  }
}

/**
 * Convert image to PNG
 */
export function toPNG(file: File, width?: number, height?: number): Promise<ImageConvertResult> {
  return convertImage({
    file,
    format: "png",
    width,
    height,
    maintainAspectRatio: true,
  });
}

/**
 * Convert image to JPEG
 */
export function toJPEG(
  file: File,
  quality: number = 0.9,
  width?: number,
  height?: number,
): Promise<ImageConvertResult> {
  return convertImage({
    file,
    format: "jpeg",
    quality,
    width,
    height,
    maintainAspectRatio: true,
  });
}

/**
 * Convert image to WebP
 */
export function toWebP(
  file: File,
  quality: number = 0.9,
  width?: number,
  height?: number,
): Promise<ImageConvertResult> {
  return convertImage({
    file,
    format: "webp",
    quality,
    width,
    height,
    maintainAspectRatio: true,
  });
}

/**
 * Convert image to BMP
 */
export function toBMP(file: File, width?: number, height?: number): Promise<ImageConvertResult> {
  return convertImage({
    file,
    format: "bmp",
    width,
    height,
    maintainAspectRatio: true,
  });
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
}

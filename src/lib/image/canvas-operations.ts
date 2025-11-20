/**
 * Canvas Operations Utilities
 *
 * Provides comprehensive image manipulation utilities using Canvas API with:
 * - Format conversion between PNG, JPEG, WebP, GIF
 * - Image resizing with various quality settings
 * - Cropping with aspect ratio support
 * - Color adjustments and filters
 * - Text and image watermarking
 * - Performance optimizations for large images
 * - Memory management and cleanup
 */

import { useCallback, useEffect, useRef } from "react";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  fitType?: "contain" | "cover" | "fill" | "none";
  quality?: number; // 0.0 - 1.0 for JPEG/WebP
}

export interface FilterOptions {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  blur?: number; // 0 to 10
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
  hue?: number; // 0 to 360
}

export interface WatermarkOptions {
  text?: string;
  image?: string | HTMLImageElement;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  opacity?: number; // 0.0 - 1.0
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  padding?: number;
  rotation?: number; // degrees
}

export interface ProcessingOptions {
  format?: "png" | "jpeg" | "webp";
  quality?: number; // 0.0 - 1.0
  preserveTransparency?: boolean;
}

/**
 * Custom hook for canvas operations
 */
export const useCanvasOperations = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);

  /**
   * Initialize offscreen canvas for better performance
   */
  const initializeOffscreenCanvas = useCallback(() => {
    if (typeof OffscreenCanvas !== "undefined") {
      offscreenCanvasRef.current = new OffscreenCanvas(1, 1);
      return offscreenCanvasRef.current;
    }
    return null;
  }, []);

  /**
   * Load image from file, URL, or data URL
   */
  const loadImage = useCallback(async (source: string | File | Blob): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      if (source instanceof File || source instanceof Blob) {
        const url = URL.createObjectURL(source);
        img.src = url;

        // Clean up object URL after loading
        img.onload = () => {
          resolve(img);
          URL.revokeObjectURL(url);
        };
      } else {
        img.src = source;
      }

      // Enable CORS for external images
      if (typeof source === "string" && source.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
    });
  }, []);

  /**
   * Create canvas from image
   */
  const createCanvasFromImage = useCallback(
    (image: HTMLImageElement, targetDimensions?: ImageDimensions): HTMLCanvasElement => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const { width, height } = targetDimensions || image;
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, 0, 0, width, height);
      return canvas;
    },
    [],
  );

  /**
   * Resize image with various options
   */
  const resizeImage = useCallback(
    (image: HTMLImageElement, options: ResizeOptions = {}): HTMLCanvasElement => {
      const {
        width,
        height,
        maintainAspectRatio = true,
        fitType = "contain",
        quality = 0.9,
      } = options;

      const originalWidth = image.naturalWidth;
      const originalHeight = image.naturalHeight;

      let targetWidth = width || originalWidth;
      let targetHeight = height || originalHeight;

      // Calculate dimensions based on fit type
      if (maintainAspectRatio) {
        const aspectRatio = originalWidth / originalHeight;

        switch (fitType) {
          case "contain":
            if (width && height) {
              const containerRatio = width / height;
              if (aspectRatio > containerRatio) {
                targetHeight = width / aspectRatio;
              } else {
                targetWidth = height * aspectRatio;
              }
            } else if (width) {
              targetHeight = width / aspectRatio;
            } else if (height) {
              targetWidth = height * aspectRatio;
            }
            break;

          case "cover":
            if (width && height) {
              const containerRatio = width / height;
              if (aspectRatio > containerRatio) {
                targetWidth = height * aspectRatio;
              } else {
                targetHeight = width / aspectRatio;
              }
            } else if (width) {
              targetHeight = width / aspectRatio;
            } else if (height) {
              targetWidth = height * aspectRatio;
            }
            break;

          case "fill":
            // Use provided dimensions without aspect ratio preservation
            break;

          case "none":
            targetWidth = originalWidth;
            targetHeight = originalHeight;
            break;
        }
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = Math.max(1, Math.floor(targetWidth));
      canvas.height = Math.max(1, Math.floor(targetHeight));

      // High-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Calculate source and destination dimensions
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = originalWidth;
      let sourceHeight = originalHeight;

      if (fitType === "cover" && maintainAspectRatio) {
        // Calculate crop area for cover fit
        const targetRatio = canvas.width / canvas.height;
        const sourceRatio = originalWidth / originalHeight;

        if (sourceRatio > targetRatio) {
          sourceHeight = originalWidth / targetRatio;
          sourceY = (originalHeight - sourceHeight) / 2;
        } else {
          sourceWidth = originalHeight * targetRatio;
          sourceX = (originalWidth - sourceWidth) / 2;
        }
      }

      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      return canvas;
    },
    [],
  );

  /**
   * Crop image to specified area with optional rotation
   */
  const cropImage = useCallback(
    async (
      source: File | HTMLImageElement,
      options: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
        quality?: number;
      },
    ): Promise<{
      file: File;
      dataUrl: string;
      dimensions: ImageDimensions;
    }> => {
      let image: HTMLImageElement;

      if (source instanceof File) {
        image = await loadImage(source);
      } else {
        image = source;
      }

      const { x, y, width, height, rotation = 0, quality = 0.95 } = options;

      // Create temporary canvas for rotation if needed
      let sourceCanvas: HTMLCanvasElement;
      let sourceCtx: CanvasRenderingContext2D;

      if (rotation % 360 !== 0) {
        // Calculate rotated dimensions
        const radians = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));

        const rotatedWidth = image.naturalWidth * cos + image.naturalHeight * sin;
        const rotatedHeight = image.naturalWidth * sin + image.naturalHeight * cos;

        sourceCanvas = document.createElement("canvas");
        sourceCtx = sourceCanvas.getContext("2d")!;
        sourceCanvas.width = rotatedWidth;
        sourceCanvas.height = rotatedHeight;

        // Translate to center, rotate, translate back
        sourceCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
        sourceCtx.rotate(radians);
        sourceCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
      } else {
        sourceCanvas = createCanvasFromImage(image);
      }

      // Create final crop canvas
      const cropCanvas = document.createElement("canvas");
      const cropCtx = cropCanvas.getContext("2d")!;

      cropCanvas.width = Math.max(1, Math.floor(width));
      cropCanvas.height = Math.max(1, Math.floor(height));

      // Draw cropped region
      cropCtx.drawImage(
        sourceCanvas,
        x,
        y,
        width,
        height,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height,
      );

      // Convert to data URL and blob
      const dataUrl = cropCanvas.toDataURL("image/png", quality);
      const blob = await new Promise<Blob>((resolve) => {
        cropCanvas.toBlob((blob) => resolve(blob!), "image/png", quality);
      });

      const fileName =
        source instanceof File
          ? source.name.replace(/\.[^/.]+$/, "_cropped.png")
          : "cropped_image.png";

      const file = new File([blob], fileName, { type: "image/png" });

      return {
        file,
        dataUrl,
        dimensions: { width: cropCanvas.width, height: cropCanvas.height },
      };
    },
    [loadImage, createCanvasFromImage],
  );

  /**
   * Apply filters to image
   */
  const applyFilters = useCallback(
    (
      image: HTMLImageElement | HTMLCanvasElement,
      filters: FilterOptions = {},
    ): HTMLCanvasElement => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = image.width;
      canvas.height = image.height;

      // Apply CSS filters
      const filterString: string[] = [];

      if (filters.brightness) {
        filterString.push(`brightness(${100 + filters.brightness}%)`);
      }

      if (filters.contrast) {
        filterString.push(`contrast(${100 + filters.contrast}%)`);
      }

      if (filters.saturation) {
        filterString.push(`saturate(${100 + filters.saturation}%)`);
      }

      if (filters.blur && filters.blur > 0) {
        filterString.push(`blur(${filters.blur}px)`);
      }

      if (filters.grayscale) {
        filterString.push("grayscale(100%)");
      }

      if (filters.sepia) {
        filterString.push("sepia(100%)");
      }

      if (filters.invert) {
        filterString.push("invert(100%)");
      }

      if (filters.hue) {
        filterString.push(`hue-rotate(${filters.hue}deg)`);
      }

      if (filterString.length > 0) {
        ctx.filter = filterString.join(" ");
      }

      ctx.drawImage(image, 0, 0);

      return canvas;
    },
    [],
  );

  /**
   * Add watermark to image
   */
  const addWatermark = useCallback(
    (
      image: HTMLImageElement | HTMLCanvasElement,
      watermark: WatermarkOptions,
    ): HTMLCanvasElement => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = image.width;
      canvas.height = image.height;

      // Draw original image
      ctx.drawImage(image, 0, 0);

      // Configure watermark styling
      ctx.globalAlpha = watermark.opacity || 0.5;

      if (watermark.image) {
        // Image watermark
        let watermarkImg: HTMLImageElement;

        if (typeof watermark.image === "string") {
          watermarkImg = new Image();
          watermarkImg.src = watermark.image;
        } else {
          watermarkImg = watermark.image;
        }

        // Calculate position and size
        const padding = watermark.padding || 20;
        const maxWidth = canvas.width * 0.3; // Max 30% of image width
        const maxHeight = canvas.height * 0.3; // Max 30% of image height

        let width = watermarkImg.width;
        let height = watermarkImg.height;

        // Scale watermark if too large
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        // Calculate position
        let x = padding;
        let y = padding;

        switch (watermark.position) {
          case "top-right":
            x = canvas.width - width - padding;
            break;
          case "bottom-left":
            y = canvas.height - height - padding;
            break;
          case "bottom-right":
            x = canvas.width - width - padding;
            y = canvas.height - height - padding;
            break;
          case "center":
            x = (canvas.width - width) / 2;
            y = (canvas.height - height) / 2;
            break;
        }

        // Apply rotation if specified
        if (watermark.rotation) {
          ctx.save();
          ctx.translate(x + width / 2, y + height / 2);
          ctx.rotate((watermark.rotation * Math.PI) / 180);
          ctx.drawImage(watermarkImg, -width / 2, -height / 2, width, height);
          ctx.restore();
        } else {
          ctx.drawImage(watermarkImg, x, y, width, height);
        }
      } else if (watermark.text) {
        // Text watermark
        const fontSize = watermark.fontSize || 24;
        const fontFamily = watermark.fontFamily || "Arial, sans-serif";
        const color = watermark.color || "#ffffff";

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const padding = watermark.padding || 20;
        const lines = watermark.text.split("\n");
        const lineHeight = fontSize * 1.2;

        // Calculate position
        let x = canvas.width / 2;
        let y = padding;

        switch (watermark.position) {
          case "top-left":
            ctx.textAlign = "left";
            x = padding;
            break;
          case "top-right":
            ctx.textAlign = "right";
            x = canvas.width - padding;
            break;
          case "bottom-left":
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            x = padding;
            y = canvas.height - padding - (lines.length - 1) * lineHeight;
            break;
          case "bottom-right":
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            x = canvas.width - padding;
            y = canvas.height - padding - (lines.length - 1) * lineHeight;
            break;
          case "center":
            // Center is default
            y = (canvas.height - (lines.length - 1) * lineHeight) / 2;
            break;
        }

        // Apply rotation if specified
        if (watermark.rotation) {
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((watermark.rotation * Math.PI) / 180);

          lines.forEach((line, index) => {
            ctx.fillText(line, 0, (index - lines.length / 2) * lineHeight);
          });

          ctx.restore();
        } else {
          lines.forEach((line, index) => {
            ctx.fillText(line, x, y + index * lineHeight);
          });
        }
      }

      return canvas;
    },
    [],
  );

  /**
   * Convert canvas to specified format
   */
  const convertToFormat = useCallback(
    (
      canvas: HTMLCanvasElement | OffscreenCanvas,
      options: ProcessingOptions = {},
    ): Promise<Blob> => {
      const { format = "png", quality = 0.9, preserveTransparency = true } = options;

      return new Promise((resolve, reject) => {
        try {
          // Handle transparent backgrounds for JPEG
          if (format === "jpeg" && !preserveTransparency) {
            const _ctx = canvas.getContext("2d")!;
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d")!;

            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;

            // Fill white background for JPEG
            tempCtx.fillStyle = "#ffffff";
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(canvas, 0, 0);

            if ("toBlob" in tempCanvas) {
              tempCanvas.toBlob(resolve, `image/${format}`, quality);
            } else {
              reject(new Error("Canvas toBlob not supported"));
            }
          } else {
            if ("toBlob" in canvas) {
              canvas.toBlob(resolve, `image/${format}`, quality);
            } else if (canvas instanceof OffscreenCanvas) {
              canvas
                .convertToBlob({ type: `image/${format}`, quality })
                .then(resolve)
                .catch(reject);
            } else {
              reject(new Error("Canvas toBlob not supported"));
            }
          }
        } catch (error) {
          reject(error);
        }
      });
    },
    [],
  );

  /**
   * Get image dimensions
   */
  const getImageDimensions = useCallback(
    (source: string | File | Blob): Promise<ImageDimensions> => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });

          if (source instanceof File || source instanceof Blob) {
            URL.revokeObjectURL(img.src);
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        if (source instanceof File || source instanceof Blob) {
          img.src = URL.createObjectURL(source);
        } else {
          img.src = source;
        }
      });
    },
    [],
  );

  /**
   * Create thumbnail
   */
  const createThumbnail = useCallback(
    (image: HTMLImageElement, maxSize: number = 200): HTMLCanvasElement => {
      const { width, height } = image;

      // Calculate thumbnail dimensions
      let thumbnailWidth = width;
      let thumbnailHeight = height;

      if (width > height) {
        if (width > maxSize) {
          thumbnailHeight = (maxSize / width) * height;
          thumbnailWidth = maxSize;
        }
      } else {
        if (height > maxSize) {
          thumbnailWidth = (maxSize / height) * width;
          thumbnailHeight = maxSize;
        }
      }

      return resizeImage(image, {
        width: thumbnailWidth,
        height: thumbnailHeight,
        maintainAspectRatio: true,
        fitType: "contain",
      });
    },
    [resizeImage],
  );

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(() => {
    if (offscreenCanvasRef.current) {
      offscreenCanvasRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeOffscreenCanvas();
    return cleanup;
  }, [initializeOffscreenCanvas, cleanup]);

  return {
    loadImage,
    createCanvasFromImage,
    resizeImage,
    cropImage,
    applyFilters,
    addWatermark,
    convertToFormat,
    getImageDimensions,
    createThumbnail,
    canvasRef,
    offscreenCanvasRef,
    cleanup,
  };
};

/**
 * Utility function to calculate crop area maintaining aspect ratio
 */
export const calculateCropArea = (
  originalDimensions: ImageDimensions,
  targetAspectRatio: number,
  cropArea: Partial<CropArea>,
): CropArea => {
  const { width: originalWidth, height: originalHeight } = originalDimensions;
  const { x = 0, y = 0 } = cropArea;

  let { width = originalWidth, height = originalHeight } = cropArea;

  // Calculate dimensions based on aspect ratio
  if (targetAspectRatio > 1) {
    // Landscape orientation
    if (!height) {
      height = width / targetAspectRatio;
    } else if (!width) {
      width = height * targetAspectRatio;
    }
  } else {
    // Portrait orientation
    if (!width) {
      width = height * targetAspectRatio;
    } else if (!height) {
      height = width / targetAspectRatio;
    }
  }

  // Ensure crop area is within image bounds
  const clampedX = Math.max(0, Math.min(x, originalWidth - width));
  const clampedY = Math.max(0, Math.min(y, originalHeight - height));
  const clampedWidth = Math.min(width, originalWidth - clampedX);
  const clampedHeight = Math.min(height, originalHeight - clampedY);

  return {
    x: clampedX,
    y: clampedY,
    width: clampedWidth,
    height: clampedHeight,
  };
};

/**
 * Utility function to get file size estimate
 */
export const estimateFileSize = (
  dimensions: ImageDimensions,
  format: string,
  quality: number = 0.9,
): number => {
  const { width, height } = dimensions;
  const pixels = width * height;

  // Rough estimates based on format and quality
  let bytesPerPixel = 3; // Default for RGB

  switch (format.toLowerCase()) {
    case "png":
      bytesPerPixel = 4; // RGBA
      break;
    case "jpeg":
      bytesPerPixel = quality * 2; // Lossy compression
      break;
    case "webp":
      bytesPerPixel = quality * 2.5; // Better compression
      break;
    default:
      bytesPerPixel = 3;
  }

  return Math.round(pixels * bytesPerPixel);
};

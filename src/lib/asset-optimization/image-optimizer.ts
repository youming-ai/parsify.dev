/**
 * Image optimization utilities for modern web formats and responsive images
 */

import sharp from 'sharp';
import { createHash } from 'crypto';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  size: number;
  hasAlpha: boolean;
  hasProfile: boolean;
}

export interface OptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'png' | 'jpeg';
  width?: number;
  height?: number;
  progressive?: boolean;
  effort?: number; // 1-10 for compression effort
  lossless?: boolean;
}

export interface ResponsiveImageConfig {
  sizes: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  formats: string[];
  quality: number;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  metadata: ImageMetadata;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: ImageDimensions;
}

/**
 * Get image metadata without processing
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    return {
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: imageBuffer.length,
      hasAlpha: metadata.hasAlpha || false,
      hasProfile: metadata.hasProfile || false,
    };
  } catch (error) {
    throw new Error(`Failed to extract image metadata: ${error}`);
  }
}

/**
 * Optimize image for web delivery
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  options: OptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    quality = 80,
    format = 'webp',
    width,
    height,
    progressive = true,
    effort = 6,
    lossless = false,
  } = options;

  try {
    const originalMetadata = await getImageMetadata(imageBuffer);
    let sharpProcessor = sharp(imageBuffer);

    // Apply dimensions if specified
    if (width || height) {
      sharpProcessor = sharpProcessor.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format-specific optimizations
    switch (format) {
      case 'webp':
        sharpProcessor = sharpProcessor.webp({
          quality,
          effort,
          lossless,
          alphaQuality: lossless ? 100 : quality,
          smartSubsample: true,
          nearLossless: !lossless,
        });
        break;

      case 'avif':
        sharpProcessor = sharpProcessor.avif({
          quality,
          effort,
          lossless,
          chromaSubsampling: '4:4:4',
        });
        break;

      case 'png':
        sharpProcessor = sharpProcessor.png({
          quality: Math.round(quality / 10), // PNG quality is 0-9
          progressive,
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
        break;

      case 'jpeg':
        sharpProcessor = sharpProcessor.jpeg({
          quality,
          progressive,
          mozjpeg: true,
          optimiseCoding: true,
          trellisQuantisation: true,
        });
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const optimizedBuffer = await sharpProcessor.toBuffer();
    const optimizedMetadata = await getImageMetadata(optimizedBuffer);

    return {
      buffer: optimizedBuffer,
      metadata: optimizedMetadata,
      originalSize: imageBuffer.length,
      compressedSize: optimizedBuffer.length,
      compressionRatio: imageBuffer.length / optimizedBuffer.length,
      format,
      dimensions: {
        width: optimizedMetadata.width,
        height: optimizedMetadata.height,
      },
    };
  } catch (error) {
    throw new Error(`Image optimization failed: ${error}`);
  }
}

/**
 * Generate responsive images at multiple sizes and formats
 */
export async function generateResponsiveImages(
  imageBuffer: Buffer,
  config: Partial<ResponsiveImageConfig> = {}
): Promise<{
  sizes: Record<string, OptimizedImageResult[]>;
  metadata: ImageMetadata;
}> {
  const responsiveConfig: ResponsiveImageConfig = {
    sizes: {
      small: 640,
      medium: 1024,
      large: 1920,
      xlarge: 3840,
    },
    formats: ['webp', 'avif', 'original'],
    quality: 80,
    ...config,
  };

  try {
    const metadata = await getImageMetadata(imageBuffer);
    const sizes: Record<string, OptimizedImageResult[]> = {};

    for (const [sizeName, targetWidth] of Object.entries(responsiveConfig.sizes)) {
      sizes[sizeName] = [];

      // Skip sizes larger than the original image
      if (targetWidth > metadata.width) {
        continue;
      }

      // Generate different formats for each size
      for (const format of responsiveConfig.formats) {
        if (format === 'original') {
          // Keep original format but optimize
          const originalFormat = metadata.format as any;
          const optimized = await optimizeImage(imageBuffer, {
            width: targetWidth,
            format: originalFormat,
            quality: responsiveConfig.quality,
          });
          sizes[sizeName].push(optimized);
        } else {
          const optimized = await optimizeImage(imageBuffer, {
            width: targetWidth,
            format: format as any,
            quality: responsiveConfig.quality,
          });
          sizes[sizeName].push(optimized);
        }
      }
    }

    return { sizes, metadata };
  } catch (error) {
    throw new Error(`Responsive image generation failed: ${error}`);
  }
}

/**
 * Generate srcset string for responsive images
 */
export function generateSrcset(
  sizes: Record<string, OptimizedImageResult[]>,
  baseUrl: string = ''
): string {
  const srcsetEntries: string[] = [];

  for (const [sizeName, optimizedImages] of Object.entries(sizes)) {
    for (const image of optimizedImages) {
      const width = image.dimensions.width;
      const format = image.format;
      const extension = format === 'original' ? image.metadata.format : format;
      const filename = `${baseUrl}-${width}w.${extension}`;
      srcsetEntries.push(`${filename} ${width}w`);
    }
  }

  return srcsetEntries.join(',\n');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(sizes: Record<string, number>): string {
  const sizeEntries: string[] = [];

  if (sizes.small) sizeEntries.push(`(max-width: 640px) ${sizes.small}px`);
  if (sizes.medium) sizeEntries.push(`(max-width: 1024px) ${sizes.medium}px`);
  if (sizes.large) sizeEntries.push(`(max-width: 1920px) ${sizes.large}px`);
  if (sizes.xlarge) sizeEntries.push(`${sizes.xlarge}px`);

  return sizeEntries.join(', ');
}

/**
 * Create image hash for cache busting
 */
export function createImageHash(imageBuffer: Buffer): string {
  return createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16);
}

/**
 * Detect if image needs optimization
 */
export function needsOptimization(metadata: ImageMetadata): {
  needsResize: boolean;
  needsFormatConversion: boolean;
  needsCompression: boolean;
} {
  const needsResize = metadata.width > 1920 || metadata.height > 1920;
  const needsFormatConversion = !['webp', 'avif'].includes(metadata.format);
  const needsCompression = metadata.size > 500 * 1024; // > 500KB

  return {
    needsResize,
    needsFormatConversion,
    needsCompression,
  };
}

/**
 * Calculate optimal image dimensions based on container
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  preserveAspectRatio: boolean = true
): ImageDimensions {
  if (preserveAspectRatio) {
    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > maxWidth) {
      return {
        width: maxWidth,
        height: Math.round(maxWidth / aspectRatio),
      };
    }

    if (originalHeight > maxHeight) {
      return {
        width: Math.round(maxHeight * aspectRatio),
        height: maxHeight,
      };
    }
  }

  return {
    width: Math.min(originalWidth, maxWidth),
    height: Math.min(originalHeight, maxHeight),
  };
}

/**
 * Batch optimize multiple images
 */
export async function batchOptimizeImages(
  images: Array<{ name: string; buffer: Buffer }>,
  options: OptimizationOptions = {}
): Promise<Array<{ name: string; result: OptimizedImageResult; error?: string }>> {
  const results = await Promise.allSettled(
    images.map(async ({ name, buffer }) => {
      const result = await optimizeImage(buffer, options);
      return { name, result };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        name: images[index].name,
        result: {} as OptimizedImageResult,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    }
  });
}

/**
 * Generate image optimization report
 */
export function generateOptimizationReport(results: OptimizedImageResult[]): {
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalCompressionRatio: number;
  averageCompressionRatio: number;
  formatBreakdown: Record<string, number>;
  recommendations: string[];
} {
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalCompressionRatio = totalOriginalSize / totalCompressedSize;
  const averageCompressionRatio = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;

  const formatBreakdown: Record<string, number> = {};
  results.forEach(result => {
    formatBreakdown[result.format] = (formatBreakdown[result.format] || 0) + 1;
  });

  const recommendations: string[] = [];

  if (averageCompressionRatio < 1.5) {
    recommendations.push('Consider increasing compression quality for better compression ratios');
  }

  if (formatBreakdown.jpeg > formatBreakdown.webp) {
    recommendations.push('Convert more JPEG images to WebP format for better compression');
  }

  if (formatBreakdown.png > formatBreakdown.avif) {
    recommendations.push('Consider using AVIF format for images with transparency');
  }

  return {
    totalOriginalSize,
    totalCompressedSize,
    totalCompressionRatio,
    averageCompressionRatio,
    formatBreakdown,
    recommendations,
  };
}

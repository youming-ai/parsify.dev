/**
 * Cloudflare Images Configuration
 *
 * This module provides configuration and utilities for interacting with
 * Cloudflare Images API, including image upload, transformation, optimization,
 * and CDN delivery capabilities.
 */

export interface CloudflareImagesConfig {
  accountId?: string
  apiToken?: string
  accountHash?: string
  enabled?: boolean
  maxFileSize?: number
  allowedFormats?: string[]
  defaultFormat?: string
  enableOptimization?: boolean
  enableWebp?: boolean
  enableAvif?: boolean
  quality?: number
  enableSmartCropping?: boolean
  enableBackgroundRemoval?: boolean
  enableAiFeatures?: boolean
  enableCdn?: boolean
  cdnUrl?: string
  customDomain?: string
  watermarkSettings?: {
    enabled: boolean
    opacity?: number
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    scale?: number
  }
  transformationPresets?: Record<string, ImageTransformationOptions>
  retentionPolicy?: {
    defaultRetentionDays: number
    autoCleanupEnabled: boolean
    cleanupInterval?: number
  }
  enableHealthCheck?: boolean
  healthCheckInterval?: number
  rateLimiting?: {
    enabled: boolean
    requestsPerMinute?: number
    requestsPerHour?: number
  }
}

export interface ImagesEnvironmentConfig {
  development: CloudflareImagesConfig
  production: CloudflareImagesConfig
  staging?: CloudflareImagesConfig
}

export const DEFAULT_IMAGES_CONFIG: Partial<CloudflareImagesConfig> = {
  enabled: true,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFormats: ['JPEG', 'PNG', 'GIF', 'WEBP', 'AVIF'],
  defaultFormat: 'JPEG',
  enableOptimization: true,
  enableWebp: true,
  enableAvif: true,
  quality: 85,
  enableSmartCropping: true,
  enableBackgroundRemoval: false,
  enableAiFeatures: false,
  enableCdn: true,
  watermarkSettings: {
    enabled: false,
    opacity: 0.7,
    position: 'bottom-right',
    scale: 0.15,
  },
  transformationPresets: {
    thumbnail: {
      width: 150,
      height: 150,
      fit: 'cover',
      quality: 75,
    },
    medium: {
      width: 800,
      height: 600,
      fit: 'scale-down',
      quality: 85,
    },
    large: {
      width: 1920,
      height: 1080,
      fit: 'scale-down',
      quality: 90,
    },
    avatar: {
      width: 200,
      height: 200,
      fit: 'cover',
      quality: 85,
      gravity: 'face',
    },
    banner: {
      width: 1200,
      height: 400,
      fit: 'cover',
      quality: 85,
    },
  },
  retentionPolicy: {
    defaultRetentionDays: 90,
    autoCleanupEnabled: true,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  },
  enableHealthCheck: true,
  healthCheckInterval: 300000, // 5 minutes
  rateLimiting: {
    enabled: true,
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
}

export const IMAGES_ENVIRONMENT_CONFIG: ImagesEnvironmentConfig = {
  development: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    accountHash: process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH,
    ...DEFAULT_IMAGES_CONFIG,
  },
  production: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    accountHash: process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH,
    maxFileSize: 100 * 1024 * 1024, // 100MB for production
    enableAiFeatures: true,
    enableBackgroundRemoval: true,
    customDomain: process.env.CLOUDFLARE_IMAGES_CUSTOM_DOMAIN,
    cdnUrl: process.env.CLOUDFLARE_IMAGES_CDN_URL,
    retentionPolicy: {
      defaultRetentionDays: 365, // 1 year for production
      autoCleanupEnabled: true,
      cleanupInterval: 12 * 60 * 60 * 1000, // 12 hours
    },
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 120,
      requestsPerHour: 5000,
    },
    ...DEFAULT_IMAGES_CONFIG,
  },
}

export function getImagesConfig(environment?: string): CloudflareImagesConfig {
  const env = environment || process.env.ENVIRONMENT || 'development'

  const config =
    IMAGES_ENVIRONMENT_CONFIG[env as keyof ImagesEnvironmentConfig] ||
    IMAGES_ENVIRONMENT_CONFIG.development

  if (env === 'production' && !config.accountId) {
    throw new Error('Cloudflare Account ID is required for production environment')
  }

  if (env === 'production' && !config.apiToken) {
    throw new Error('Cloudflare API Token is required for production environment')
  }

  return config
}

// Image transformation options
export interface ImageTransformationOptions {
  width?: number
  height?: number
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  gravity?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'face' | 'smart'
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'auto'
  background?: string
  brightness?: number
  contrast?: number
  saturation?: number
  sharpness?: number
  blur?: number
  opacity?: number
  rotate?: number
  flip?: 'horizontal' | 'vertical'
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  pad?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  watermark?: {
    url?: string
    opacity?: number
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    scale?: number
    x?: number
    y?: number
  }
  effects?: {
    grayscale?: boolean
    sepia?: boolean
    vintage?: boolean
    blackwhite?: boolean
  }
}

// Image metadata and info
export interface ImageMetadata {
  id: string
  filename: string
  size: number
  width: number
  height: number
  format: string
  contentType: string
  uploadedAt: Date
  updatedAt: Date
  userId?: string
  variants: ImageVariant[]
  tags: string[]
  metadata: Record<string, unknown>
  url: string
  cdnUrl: string
  requiresSignedUrls?: boolean
  signedUrlToken?: string
}

export interface ImageVariant {
  name: string
  width: number
  height: number
  size: number
  format: string
  url: string
  cdnUrl: string
  transformation: ImageTransformationOptions
  createdAt: Date
}

// Upload options
export interface ImageUploadOptions {
  filename: string
  format?: string
  quality?: number
  metadata?: Record<string, unknown>
  tags?: string[]
  requireSignedUrls?: boolean
  webhookUrl?: string
  maxRetries?: number
  onProgress?: (progress: UploadProgress) => void
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  stage: 'uploading' | 'processing' | 'completed' | 'failed'
  message?: string
}

// Health check
export interface ImagesHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: number
  responseTime: number
  error?: string
  details?: {
    uploadTime: number
    transformationTime: number
    apiQuotaUsage: number
    activeTransformations: number
    errorRate: number
  }
}

// API response types
export interface CloudflareImagesApiResponse<T = unknown> {
  success: boolean
  errors?: Array<{
    code: number
    message: string
  }>
  messages?: Array<{
    code: number
    message: string
  }>
  result?: T
}

export interface CloudflareImage {
  id: string
  filename: string
  uploaded: string
  requireSignedURLs: boolean
  variants: string[]
  metadata: Record<string, unknown>
}

export interface DirectUploadInfo {
  id: string
  uploadURL: string
  maxSizeBytes: number
  customMetadata?: Record<string, unknown>
  requireSignedURLs: boolean
  expiration?: string
}

// Error types
export class CloudflareImagesError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'CloudflareImagesError'
  }
}

// Utility functions
export function validateImageFormat(format: string): boolean {
  const validFormats = ['JPEG', 'PNG', 'GIF', 'WEBP', 'AVIF', 'BMP', 'TIFF']
  return validFormats.includes(format.toUpperCase())
}

export function validateTransformationOptions(options: ImageTransformationOptions): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (options.width && (options.width < 1 || options.width > 10000)) {
    errors.push('Width must be between 1 and 10000 pixels')
  }

  if (options.height && (options.height < 1 || options.height > 10000)) {
    errors.push('Height must be between 1 and 10000 pixels')
  }

  if (options.quality && (options.quality < 1 || options.quality > 100)) {
    errors.push('Quality must be between 1 and 100')
  }

  if (options.brightness && (options.brightness < -100 || options.brightness > 100)) {
    errors.push('Brightness must be between -100 and 100')
  }

  if (options.contrast && (options.contrast < -100 || options.contrast > 100)) {
    errors.push('Contrast must be between -100 and 100')
  }

  if (options.saturation && (options.saturation < -100 || options.saturation > 100)) {
    errors.push('Saturation must be between -100 and 100')
  }

  if (options.sharpness && (options.sharpness < 0 || options.sharpness > 100)) {
    errors.push('Sharpness must be between 0 and 100')
  }

  if (options.blur && (options.blur < 0 || options.blur > 100)) {
    errors.push('Blur must be between 0 and 100')
  }

  if (options.opacity && (options.opacity < 0 || options.opacity > 1)) {
    errors.push('Opacity must be between 0 and 1')
  }

  if (options.rotate && (options.rotate < 0 || options.rotate > 360)) {
    errors.push('Rotation must be between 0 and 360 degrees')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function generateTransformationUrl(
  baseUrl: string,
  imageId: string,
  options: ImageTransformationOptions
): string {
  const params = new URLSearchParams()

  if (options.width) params.set('w', options.width.toString())
  if (options.height) params.set('h', options.height.toString())
  if (options.fit) params.set('fit', options.fit)
  if (options.gravity) params.set('g', options.gravity)
  if (options.quality) params.set('q', options.quality.toString())
  if (options.format && options.format !== 'auto') params.set('f', options.format)
  if (options.background) params.set('bg', options.background.replace('#', ''))
  if (options.brightness) params.set('brightness', options.brightness.toString())
  if (options.contrast) params.set('contrast', options.contrast.toString())
  if (options.saturation) params.set('saturation', options.saturation.toString())
  if (options.sharpness) params.set('sharpness', options.sharpness.toString())
  if (options.blur) params.set('blur', options.blur.toString())
  if (options.opacity) params.set('opacity', options.opacity.toString())
  if (options.rotate) params.set('rotate', options.rotate.toString())
  if (options.flip) params.set('flip', options.flip)

  // Crop parameters
  if (options.crop) {
    params.set(
      'crop',
      `${options.crop.x},${options.crop.y},${options.crop.width},${options.crop.height}`
    )
  }

  // Pad parameters
  if (options.pad) {
    const padValues = [
      options.pad.top || 0,
      options.pad.right || 0,
      options.pad.bottom || 0,
      options.pad.left || 0,
    ].join(',')
    params.set('pad', padValues)
  }

  // Watermark parameters
  if (options.watermark) {
    if (options.watermark.url) params.set('watermark', options.watermark.url)
    if (options.watermark.opacity)
      params.set('watermark-opacity', options.watermark.opacity.toString())
    if (options.watermark.position) params.set('watermark-position', options.watermark.position)
    if (options.watermark.scale) params.set('watermark-scale', options.watermark.scale.toString())
    if (options.watermark.x !== undefined) params.set('watermark-x', options.watermark.x.toString())
    if (options.watermark.y !== undefined) params.set('watermark-y', options.watermark.y.toString())
  }

  // Effects
  if (options.effects) {
    if (options.effects.grayscale) params.set('grayscale', 'true')
    if (options.effects.sepia) params.set('sepia', 'true')
    if (options.effects.vintage) params.set('vintage', 'true')
    if (options.effects.blackwhite) params.set('bw', 'true')
  }

  const queryString = params.toString()
  return queryString ? `${baseUrl}/${imageId}?${queryString}` : `${baseUrl}/${imageId}`
}

export function parseImageIdFromUrl(url: string): string | null {
  // Extract image ID from Cloudflare Images URL
  // URL format: https://imagedelivery.net/accountHash/imageId
  const match = url.match(/imagedelivery\.net\/[^/]+\/([^/?]+)/)
  return match ? match[1] : null
}

export function detectImageFormat(buffer: ArrayBuffer): string | null {
  const view = new Uint8Array(buffer)

  // JPEG signature: FF D8 FF
  if (view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
    return 'JPEG'
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47 &&
    view[4] === 0x0d &&
    view[5] === 0x0a &&
    view[6] === 0x1a &&
    view[7] === 0x0a
  ) {
    return 'PNG'
  }

  // GIF signature: GIF87a or GIF89a
  if (
    view[0] === 0x47 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x38 &&
    (view[4] === 0x37 || view[4] === 0x38) &&
    view[5] === 0x61
  ) {
    return 'GIF'
  }

  // WebP signature: RIFF...WEBP
  if (
    view[0] === 0x52 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x46 &&
    view[8] === 0x57 &&
    view[9] === 0x45 &&
    view[10] === 0x42 &&
    view[11] === 0x50
  ) {
    return 'WEBP'
  }

  // AVIF signature: ftypavif or ftypavis
  if (
    view[4] === 0x66 &&
    view[5] === 0x74 &&
    view[6] === 0x79 &&
    view[7] === 0x70 &&
    view[8] === 0x61 &&
    view[9] === 0x76 &&
    view[10] === 0x69 &&
    (view[11] === 0x66 || view[11] === 0x73)
  ) {
    return 'AVIF'
  }

  return null
}

export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  options: ImageTransformationOptions
): { width: number; height: number } {
  let { width, height } = options

  if (!width && !height) {
    return { width: originalWidth, height: originalHeight }
  }

  const aspectRatio = originalWidth / originalHeight

  switch (options.fit) {
    case 'contain':
      if (!width && height) {
        width = Math.round(height * aspectRatio)
      } else if (width && !height) {
        height = Math.round(width / aspectRatio)
      } else if (width && height) {
        const targetAspectRatio = width / height
        if (aspectRatio > targetAspectRatio) {
          height = Math.round(width / aspectRatio)
        } else {
          width = Math.round(height * aspectRatio)
        }
      }
      break

    case 'cover':
      if (!width && height) {
        width = Math.round(height * aspectRatio)
      } else if (width && !height) {
        height = Math.round(width / aspectRatio)
      } else if (width && height) {
        const targetAspectRatio = width / height
        if (aspectRatio > targetAspectRatio) {
          width = Math.round(height * aspectRatio)
        } else {
          height = Math.round(width / aspectRatio)
        }
      }
      break

    case 'scale-down':
      if (!width && height) {
        width = Math.min(originalWidth, Math.round(height * aspectRatio))
      } else if (width && !height) {
        height = Math.min(originalHeight, Math.round(width / aspectRatio))
      } else if (width && height) {
        if (width > originalWidth || height > originalHeight) {
          return { width: originalWidth, height: originalHeight }
        }
        const targetAspectRatio = width / height
        if (aspectRatio > targetAspectRatio) {
          height = Math.round(width / aspectRatio)
        } else {
          width = Math.round(height * aspectRatio)
        }
      }
      break

    case 'fill':
      // Use provided dimensions, may distort image
      if (!width) width = originalWidth
      if (!height) height = originalHeight
      break
    default:
      // Use provided dimensions for crop or no fit
      if (!width) width = originalWidth
      if (!height) height = originalHeight
      break
  }

  return {
    width: Math.max(1, Math.min(width || originalWidth, 10000)),
    height: Math.max(1, Math.min(height || originalHeight, 10000)),
  }
}

import { z } from 'zod'

// Image format types
export const ImageFormatSchema = z.enum([
  'JPEG', 'PNG', 'GIF', 'WEBP', 'AVIF', 'BMP', 'TIFF'
])
export type ImageFormat = z.infer<typeof ImageFormatSchema>

// Image transformation schema
export const ImageTransformationSchema = z.object({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  fit: z.enum(['scale-down', 'contain', 'cover', 'crop', 'pad']).optional(),
  gravity: z.enum(['center', 'top', 'bottom', 'left', 'right', 'auto', 'face', 'smart']).optional(),
  quality: z.number().min(1).max(100).optional(),
  format: ImageFormatSchema.optional(),
  background: z.string().optional(),
  brightness: z.number().min(-100).max(100).optional(),
  contrast: z.number().min(-100).max(100).optional(),
  saturation: z.number().min(-100).max(100).optional(),
  sharpness: z.number().min(0).max(100).optional(),
  blur: z.number().min(0).max(100).optional(),
  opacity: z.number().min(0).max(1).optional(),
  rotate: z.number().min(0).max(360).optional(),
  flip: z.enum(['horizontal', 'vertical']).optional(),
  crop: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  pad: z.object({
    top: z.number().default(0),
    right: z.number().default(0),
    bottom: z.number().default(0),
    left: z.number().default(0),
  }).optional(),
  watermark: z.object({
    url: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
    position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).optional(),
    scale: z.number().positive().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
  }).optional(),
  effects: z.object({
    grayscale: z.boolean().optional(),
    sepia: z.boolean().optional(),
    vintage: z.boolean().optional(),
    blackwhite: z.boolean().optional(),
  }).optional(),
})

export type ImageTransformation = z.infer<typeof ImageTransformationSchema>

// Image metadata schema
export const ImageMetadataSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1).max(255),
  size: z.number().min(0),
  width: z.number().min(0),
  height: z.number().min(0),
  format: ImageFormatSchema,
  content_type: z.string().min(1),
  uploaded_at: z.number(),
  updated_at: z.number(),
  user_id: z.string().uuid().nullable(),
  file_id: z.string().uuid().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  url: z.string().url(),
  cdn_url: z.string().url().nullable(),
  requires_signed_urls: z.boolean().default(false),
  signed_url_token: z.string().nullable(),
})

export type ImageMetadata = z.infer<typeof ImageMetadataSchema>

// Image variant schema
export const ImageVariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  width: z.number().min(0),
  height: z.number().min(0),
  size: z.number().min(0),
  format: ImageFormatSchema,
  url: z.string().url(),
  cdn_url: z.string().url().nullable(),
  transformation: ImageTransformationSchema,
  created_at: z.number(),
})

export type ImageVariant = z.infer<typeof ImageVariantSchema>

// Image upload options schema
export const ImageUploadOptionsSchema = z.object({
  filename: z.string().min(1).max(255),
  format: ImageFormatSchema.optional(),
  quality: z.number().min(1).max(100).optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  require_signed_urls: z.boolean().optional(),
  webhook_url: z.string().url().optional(),
  max_retries: z.number().min(0).max(10).default(3),
})

export type ImageUploadOptions = z.infer<typeof ImageUploadOptionsSchema>

// Image processing options schema
export const ImageProcessingOptionsSchema = ImageTransformationSchema.extend({
  user_id: z.string().uuid().optional(),
  file_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  require_signed_urls: z.boolean().optional(),
  webhook_url: z.string().url().optional(),
})

export type ImageProcessingOptions = z.infer<typeof ImageProcessingOptionsSchema>

// Image query options schema
export const ImageQueryOptionsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['uploaded_at', 'updated_at', 'size', 'filename', 'format']).default('uploaded_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  format: ImageFormatSchema.optional(),
  tags: z.array(z.string()).optional(),
  min_width: z.number().positive().optional(),
  max_width: z.number().positive().optional(),
  min_height: z.number().positive().optional(),
  max_height: z.number().positive().optional(),
  min_size: z.number().positive().optional(),
  max_size: z.number().positive().optional(),
  search: z.string().optional(),
})

export type ImageQueryOptions = z.infer<typeof ImageQueryOptionsSchema>

// Database queries
export const IMAGE_METADATA_QUERIES = {
  // Basic CRUD operations
  SELECT_BY_ID: 'SELECT * FROM image_metadata WHERE id = ?',
  SELECT_BY_USER_ID: 'SELECT * FROM image_metadata WHERE user_id = ? ORDER BY uploaded_at DESC',
  SELECT_BY_FILE_ID: 'SELECT * FROM image_metadata WHERE file_id = ?',
  INSERT: `
    INSERT INTO image_metadata (
      id, filename, size, width, height, format, content_type, uploaded_at, updated_at,
      user_id, file_id, tags, metadata, url, cdn_url, requires_signed_urls, signed_url_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  UPDATE: `
    UPDATE image_metadata SET
      filename = ?, size = ?, width = ?, height = ?, format = ?, content_type = ?,
      updated_at = ?, tags = ?, metadata = ?, url = ?, cdn_url = ?,
      requires_signed_urls = ?, signed_url_token = ?
    WHERE id = ?
  `,
  DELETE: 'DELETE FROM image_metadata WHERE id = ?',

  // Query operations
  SELECT_PAGINATED: `
    SELECT * FROM image_metadata
    WHERE user_id = ?
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `,
  COUNT_BY_USER: 'SELECT COUNT(*) as count FROM image_metadata WHERE user_id = ?',
  SEARCH_BY_FILENAME: `
    SELECT * FROM image_metadata
    WHERE user_id = ? AND filename LIKE ?
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `,
  SELECT_BY_FORMAT: `
    SELECT * FROM image_metadata
    WHERE user_id = ? AND format = ?
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `,
  SELECT_BY_TAGS: `
    SELECT * FROM image_metadata
    WHERE user_id = ? AND JSON_CONTAINS(tags, ?)
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `,
  SELECT_BY_SIZE_RANGE: `
    SELECT * FROM image_metadata
    WHERE user_id = ? AND size BETWEEN ? AND ?
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `,
  SELECT_BY_DIMENSIONS: `
    SELECT * FROM image_metadata
    WHERE user_id = ?
      AND width BETWEEN ? AND ?
      AND height BETWEEN ? AND ?
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `,

  // Analytics queries
  COUNT_BY_FORMAT: `
    SELECT format, COUNT(*) as count, SUM(size) as total_size
    FROM image_metadata
    WHERE user_id = ?
    GROUP BY format
  `,
  COUNT_BY_DATE: `
    SELECT DATE(FROM_UNIXTIME(uploaded_at)) as date, COUNT(*) as count
    FROM image_metadata
    WHERE user_id = ? AND uploaded_at >= ?
    GROUP BY DATE(FROM_UNIXTIME(uploaded_at))
    ORDER BY date DESC
  `,
  SIZE_STATISTICS: `
    SELECT
      COUNT(*) as total_images,
      SUM(size) as total_size,
      AVG(size) as avg_size,
      MIN(size) as min_size,
      MAX(size) as max_size
    FROM image_metadata
    WHERE user_id = ?
  `,
  DIMENSION_STATISTICS: `
    SELECT
      COUNT(*) as total_images,
      AVG(width) as avg_width,
      AVG(height) as avg_height,
      MIN(width) as min_width,
      MAX(width) as max_width,
      MIN(height) as min_height,
      MAX(height) as max_height
    FROM image_metadata
    WHERE user_id = ?
  `,
  RECENT_UPLOADS: `
    SELECT * FROM image_metadata
    WHERE user_id = ? AND uploaded_at >= ?
    ORDER BY uploaded_at DESC
    LIMIT ?
  `,
  POPULAR_FORMATS: `
    SELECT format, COUNT(*) as count
    FROM image_metadata
    WHERE uploaded_at >= ?
    GROUP BY format
    ORDER BY count DESC
    LIMIT ?
  `,

  // Cleanup queries
  SELECT_EXPIRED: `
    SELECT * FROM image_metadata
    WHERE expires_at IS NOT NULL AND expires_at < ?
  `,
  DELETE_EXPIRED: `
    DELETE FROM image_metadata
    WHERE expires_at IS NOT NULL AND expires_at < ?
  `,
  SELECT_ORPHANED: `
    SELECT im.* FROM image_metadata im
    LEFT JOIN file_uploads fu ON im.file_id = fu.id
    WHERE im.file_id IS NOT NULL AND fu.id IS NULL
  `,
  DELETE_ORPHANED: `
    DELETE im FROM image_metadata im
    LEFT JOIN file_uploads fu ON im.file_id = fu.id
    WHERE im.file_id IS NOT NULL AND fu.id IS NULL
  `,
} as const

// Database queries for image variants
export const IMAGE_VARIANT_QUERIES = {
  SELECT_BY_ID: 'SELECT * FROM image_variants WHERE id = ?',
  SELECT_BY_IMAGE_ID: 'SELECT * FROM image_variants WHERE image_id = ? ORDER BY created_at DESC',
  SELECT_BY_NAME: 'SELECT * FROM image_variants WHERE image_id = ? AND name = ?',
  INSERT: `
    INSERT INTO image_variants (
      id, image_id, name, width, height, size, format, url, cdn_url,
      transformation, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  UPDATE: `
    UPDATE image_variants SET
      name = ?, width = ?, height = ?, size = ?, format = ?,
      url = ?, cdn_url = ?, transformation = ?
    WHERE id = ?
  `,
  DELETE: 'DELETE FROM image_variants WHERE id = ?',
  DELETE_BY_IMAGE_ID: 'DELETE FROM image_variants WHERE image_id = ?',
  COUNT_BY_IMAGE_ID: 'SELECT COUNT(*) as count FROM image_variants WHERE image_id = ?',
  SELECT_VARIANTS_BY_TRANSFORMATION: `
    SELECT * FROM image_variants
    WHERE image_id = ? AND JSON_CONTAINS(transformation, ?)
    ORDER BY created_at DESC
  `,
  SELECT_VARIANTS_BY_FORMAT: `
    SELECT * FROM image_variants
    WHERE image_id = ? AND format = ?
    ORDER BY created_at DESC
  `,
  SELECT_VARIANTS_BY_SIZE: `
    SELECT * FROM image_variants
    WHERE image_id = ?
      AND width BETWEEN ? AND ?
      AND height BETWEEN ? AND ?
    ORDER BY created_at DESC
  `,
  DELETE_VARIANTS_BEFORE: `
    DELETE FROM image_variants
    WHERE image_id = ? AND created_at < ?
  `,
} as const

// Image metadata model class
export class ImageMetadataModel {
  public id: string
  public filename: string
  public size: number
  public width: number
  public height: number
  public format: ImageFormat
  public content_type: string
  public uploaded_at: number
  public updated_at: number
  public user_id: string | null
  public file_id: string | null
  public tags: string[]
  public metadata: Record<string, any>
  public url: string
  public cdn_url: string | null
  public requires_signed_urls: boolean
  public signed_url_token: string | null

  constructor(data: ImageMetadata) {
    this.id = data.id
    this.filename = data.filename
    this.size = data.size
    this.width = data.width
    this.height = data.height
    this.format = data.format
    this.content_type = data.content_type
    this.uploaded_at = data.uploaded_at
    this.updated_at = data.updated_at
    this.user_id = data.user_id
    this.file_id = data.file_id
    this.tags = data.tags
    this.metadata = data.metadata
    this.url = data.url
    this.cdn_url = data.cdn_url
    this.requires_signed_urls = data.requires_signed_urls
    this.signed_url_token = data.signed_url_token
  }

  // Static factory methods
  static create(data: {
    id?: string
    filename: string
    size: number
    width: number
    height: number
    format: ImageFormat
    content_type?: string
    user_id?: string
    file_id?: string
    tags?: string[]
    metadata?: Record<string, any>
    url?: string
    cdn_url?: string
    requires_signed_urls?: boolean
    signed_url_token?: string
  }): ImageMetadataModel {
    const now = Math.floor(Date.now() / 1000)

    return new ImageMetadataModel({
      id: data.id || crypto.randomUUID(),
      filename: data.filename,
      size: data.size,
      width: data.width,
      height: data.height,
      format: data.format,
      content_type: data.content_type || `image/${data.format.toLowerCase()}`,
      uploaded_at: now,
      updated_at: now,
      user_id: data.user_id || null,
      file_id: data.file_id || null,
      tags: data.tags || [],
      metadata: data.metadata || {},
      url: data.url || '',
      cdn_url: data.cdn_url || null,
      requires_signed_urls: data.requires_signed_urls || false,
      signed_url_token: data.signed_url_token || null,
    })
  }

  static fromRow(row: any): ImageMetadataModel {
    return new ImageMetadataModel({
      id: row.id,
      filename: row.filename,
      size: row.size,
      width: row.width,
      height: row.height,
      format: row.format,
      content_type: row.content_type,
      uploaded_at: row.uploaded_at,
      updated_at: row.updated_at,
      user_id: row.user_id,
      file_id: row.file_id,
      tags: row.tags ? JSON.parse(row.tags) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      url: row.url,
      cdn_url: row.cdn_url,
      requires_signed_urls: Boolean(row.requires_signed_urls),
      signed_url_token: row.signed_url_token,
    })
  }

  // Instance methods
  update(data: Partial<ImageMetadata>): ImageMetadataModel {
    return new ImageMetadataModel({
      ...this,
      ...data,
      updated_at: Math.floor(Date.now() / 1000),
    })
  }

  addTag(tag: string): ImageMetadataModel {
    const tags = [...new Set([...this.tags, tag])]
    return this.update({ tags })
  }

  removeTag(tag: string): ImageMetadataModel {
    const tags = this.tags.filter(t => t !== tag)
    return this.update({ tags })
  }

  addMetadata(key: string, value: any): ImageMetadataModel {
    const metadata = { ...this.metadata, [key]: value }
    return this.update({ metadata })
  }

  removeMetadata(key: string): ImageMetadataModel {
    const { [key]: _, ...metadata } = this.metadata
    return this.update({ metadata })
  }

  // Validation methods
  static validateFilename(filename: string): { valid: boolean; error?: string } {
    if (!filename || filename.trim().length === 0) {
      return { valid: false, error: 'Filename is required' }
    }

    if (filename.length > 255) {
      return { valid: false, error: 'Filename is too long (max 255 characters)' }
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
    if (invalidChars.test(filename)) {
      return { valid: false, error: 'Filename contains invalid characters' }
    }

    return { valid: true }
  }

  static validateFormat(format: string): { valid: boolean; error?: string } {
    const validFormats = ['JPEG', 'PNG', 'GIF', 'WEBP', 'AVIF', 'BMP', 'TIFF']
    if (!validFormats.includes(format.toUpperCase())) {
      return { valid: false, error: `Invalid image format: ${format}` }
    }
    return { valid: true }
  }

  static validateDimensions(width: number, height: number): { valid: boolean; error?: string } {
    if (width <= 0 || height <= 0) {
      return { valid: false, error: 'Image dimensions must be positive' }
    }

    if (width > 50000 || height > 50000) {
      return { valid: false, error: 'Image dimensions are too large (max 50000px)' }
    }

    return { valid: true }
  }

  static validateSize(size: number, maxSize = 100 * 1024 * 1024): { valid: boolean; error?: string } {
    if (size <= 0) {
      return { valid: false, error: 'Image size must be positive' }
    }

    if (size > maxSize) {
      return { valid: false, error: `Image size exceeds maximum allowed size (${maxSize} bytes)` }
    }

    return { valid: true }
  }

  // Computed properties
  get aspectRatio(): number {
    return this.height > 0 ? this.width / this.height : 1
  }

  get isLandscape(): boolean {
    return this.width > this.height
  }

  get isPortrait(): boolean {
    return this.height > this.width
  }

  get isSquare(): boolean {
    return this.width === this.height
  }

  get megapixels(): number {
    return Math.round((this.width * this.height) / 1_000_000 * 100) / 100
  }

  get sizeInMB(): number {
    return Math.round(this.size / (1024 * 1024) * 100) / 100
  }

  // Utility methods
  toObject(): ImageMetadata {
    return {
      id: this.id,
      filename: this.filename,
      size: this.size,
      width: this.width,
      height: this.height,
      format: this.format,
      content_type: this.content_type,
      uploaded_at: this.uploaded_at,
      updated_at: this.updated_at,
      user_id: this.user_id,
      file_id: this.file_id,
      tags: this.tags,
      metadata: this.metadata,
      url: this.url,
      cdn_url: this.cdn_url,
      requires_signed_urls: this.requires_signed_urls,
      signed_url_token: this.signed_url_token,
    }
  }

  toJSON(): ImageMetadata {
    return this.toObject()
  }
}

// Image variant model class
export class ImageVariantModel {
  public id?: string
  public name: string
  public width: number
  public height: number
  public size: number
  public format: ImageFormat
  public url: string
  public cdn_url: string | null
  public transformation: ImageTransformation
  public created_at: number

  constructor(data: ImageVariant) {
    this.id = data.id
    this.name = data.name
    this.width = data.width
    this.height = data.height
    this.size = data.size
    this.format = data.format
    this.url = data.url
    this.cdn_url = data.cdn_url
    this.transformation = data.transformation
    this.created_at = data.created_at
  }

  // Static factory methods
  static create(data: {
    id?: string
    name: string
    width: number
    height: number
    size: number
    format: ImageFormat
    url: string
    cdn_url?: string
    transformation: ImageTransformation
  }): ImageVariantModel {
    return new ImageVariantModel({
      id: data.id || crypto.randomUUID(),
      name: data.name,
      width: data.width,
      height: data.height,
      size: data.size,
      format: data.format,
      url: data.url,
      cdn_url: data.cdn_url || null,
      transformation: data.transformation,
      created_at: Math.floor(Date.now() / 1000),
    })
  }

  static fromRow(row: any): ImageVariantModel {
    return new ImageVariantModel({
      id: row.id,
      name: row.name,
      width: row.width,
      height: row.height,
      size: row.size,
      format: row.format,
      url: row.url,
      cdn_url: row.cdn_url,
      transformation: row.transformation ? JSON.parse(row.transformation) : {},
      created_at: row.created_at,
    })
  }

  // Computed properties
  get aspectRatio(): number {
    return this.height > 0 ? this.width / this.height : 1
  }

  get sizeInKB(): number {
    return Math.round(this.size / 1024 * 100) / 100
  }

  get compressionRatio(): number {
    // Estimate original size based on dimensions and format
    const estimatedOriginalSize = this.width * this.height * 3 // RGB bytes
    return this.size > 0 ? estimatedOriginalSize / this.size : 0
  }

  // Utility methods
  toObject(): ImageVariant {
    return {
      id: this.id,
      name: this.name,
      width: this.width,
      height: this.height,
      size: this.size,
      format: this.format,
      url: this.url,
      cdn_url: this.cdn_url,
      transformation: this.transformation,
      created_at: this.created_at,
    }
  }

  toJSON(): ImageVariant {
    return this.toObject()
  }
}

// Export schemas for validation
export const validateImageMetadata = ImageMetadataSchema.parse
export const validateImageVariant = ImageVariantSchema.parse
export const validateImageTransformation = ImageTransformationSchema.parse
export const validateImageUploadOptions = ImageUploadOptionsSchema.parse
export const validateImageProcessingOptions = ImageProcessingOptionsSchema.parse
export const validateImageQueryOptions = ImageQueryOptionsSchema.parse

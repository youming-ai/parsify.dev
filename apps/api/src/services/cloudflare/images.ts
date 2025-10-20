/**
 * Cloudflare Images Service
 *
 * This module provides comprehensive Cloudflare Images API integration with
 * image upload, transformation, optimization, and CDN delivery capabilities.
 * It integrates with the existing FileService and R2 storage for a complete
 * image management solution.
 */

import {
  CloudflareImagesConfig,
  ImageTransformationOptions,
  ImageMetadata,
  ImageVariant,
  ImageUploadOptions,
  UploadProgress,
  ImagesHealthCheck,
  CloudflareImagesApiResponse,
  CloudflareImage,
  DirectUploadInfo,
  CloudflareImagesError,
  validateImageFormat,
  validateTransformationOptions,
  generateTransformationUrl,
  parseImageIdFromUrl,
  detectImageFormat,
  calculateImageDimensions,
  getImagesConfig,
} from '../../config/cloudflare/images-config'

import { FileUpload } from '../../models/file_upload'
import { FileService } from '../file_service'
import { R2StorageService } from './r2-storage'
import { DatabaseClient } from '../../database'

export interface CloudflareImagesServiceOptions {
  config?: CloudflareImagesConfig
  fileService: FileService
  r2Storage?: R2StorageService
  database: DatabaseClient
  enableHealthMonitoring?: boolean
  enableCaching?: boolean
  cache?: KVNamespace
}

export interface ImageProcessingOptions extends ImageTransformationOptions {
  userId?: string
  fileId?: string
  tags?: string[]
  metadata?: Record<string, any>
  requireSignedUrls?: boolean
  webhookUrl?: string
}

export interface ImageStats {
  totalImages: number
  totalSize: number
  totalVariants: number
  imagesByFormat: Record<string, number>
  imagesByUser: Record<string, number>
  processingTime: number
  apiQuotaUsage: number
  storageUsage: number
}

export interface ImageOperation {
  id: string
  type: 'upload' | 'transform' | 'delete' | 'optimize'
  imageId?: string
  fileId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startTime: number
  endTime?: number
  error?: string
  result?: any
}

export class CloudflareImagesService {
  private config: CloudflareImagesConfig
  private fileService: FileService
  private r2Storage?: R2StorageService
  private database: DatabaseClient
  private cache?: KVNamespace
  private healthStatus: ImagesHealthCheck | null = null
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private activeOperations = new Map<string, ImageOperation>()
  private baseUrl: string
  private apiHeaders: Record<string, string>

  constructor(options: CloudflareImagesServiceOptions) {
    this.config = options.config || getImagesConfig()
    this.fileService = options.fileService
    this.r2Storage = options.r2Storage
    this.database = options.database
    this.cache = options.cache

    // Build API base URL
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/images/v1`

    // Setup API headers
    this.apiHeaders = {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    }

    // Start health monitoring if enabled
    if (options.enableHealthMonitoring && this.config.enableHealthCheck) {
      this.startHealthMonitoring()
    }
  }

  /**
   * Upload image directly to Cloudflare Images
   */
  async uploadImage(
    file: File | ArrayBuffer | Uint8Array,
    options: ImageUploadOptions
  ): Promise<{
    imageMetadata: ImageMetadata
    fileUpload: FileUpload
    operation: ImageOperation
  }> {
    if (!this.config.enabled) {
      throw new CloudflareImagesError('Cloudflare Images service is disabled')
    }

    const operationId = this.generateOperationId()
    const operation: ImageOperation = {
      id: operationId,
      type: 'upload',
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
    }

    this.activeOperations.set(operationId, operation)

    try {
      operation.status = 'processing'
      operation.progress = 10

      // Convert file to ArrayBuffer
      const buffer = await this.normalizeFileInput(file)
      const size = buffer.byteLength

      operation.progress = 20

      // Validate file
      await this.validateImageFile(buffer, options)

      operation.progress = 30

      // Detect image format
      const detectedFormat = detectImageFormat(buffer)
      const format = options.format || detectedFormat || 'JPEG'

      operation.progress = 40

      // Create file upload record first
      const fileUpload = await this.fileService.createUploadRequest({
        filename: options.filename,
        mimeType: `image/${format.toLowerCase()}`,
        size,
        userId: options.metadata?.userId,
        retentionHours: this.config.retentionPolicy?.defaultRetentionDays
          ? this.config.retentionPolicy.defaultRetentionDays * 24
          : undefined,
      })

      operation.fileId = fileUpload.fileId
      operation.progress = 50

      // Upload to Cloudflare Images
      const imageInfo = await this.uploadToCloudflareImages(buffer, {
        ...options,
        format,
        metadata: {
          ...options.metadata,
          fileId: fileUpload.fileId,
          userId: options.metadata?.userId,
        },
      })

      operation.progress = 80

      // Create image metadata record
      const imageMetadata = await this.createImageMetadataRecord({
        id: imageInfo.id,
        filename: options.filename,
        size,
        format,
        uploadedAt: new Date(),
        userId: options.metadata?.userId,
        fileId: fileUpload.fileId,
        variants: imageInfo.variants?.map(url => ({
          name: 'original',
          width: 0,
          height: 0,
          size: 0,
          format,
          url,
          cdnUrl: url,
          transformation: {},
          createdAt: new Date(),
        })) || [],
        tags: options.tags || [],
        metadata: options.metadata || {},
        url: imageInfo.variants?.[0] || '',
        cdnUrl: imageInfo.variants?.[0] || '',
        requiresSignedUrls: imageInfo.requireSignedURLs,
      })

      operation.progress = 100
      operation.status = 'completed'
      operation.endTime = Date.now()
      operation.result = { imageMetadata, fileUpload }

      // Complete file upload
      await this.fileService.completeUpload(fileUpload.fileId!)

      return { imageMetadata, fileUpload, operation }
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Upload failed'
      operation.endTime = Date.now()

      if (operation.fileId) {
        await this.fileService.failUpload(operation.fileId, operation.error)
      }

      throw error
    } finally {
      setTimeout(() => {
        this.activeOperations.delete(operationId)
      }, 60000) // Keep operation in memory for 1 minute
    }
  }

  /**
   * Upload image from URL
   */
  async uploadImageFromUrl(
    url: string,
    filename: string,
    options: Omit<ImageUploadOptions, 'filename'> = {}
  ): Promise<{
    imageMetadata: ImageMetadata
    fileUpload: FileUpload
    operation: ImageOperation
  }> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      return this.uploadImage(buffer, { filename, ...options })
    } catch (error) {
      throw new CloudflareImagesError(
        `Failed to upload image from URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Transform existing image
   */
  async transformImage(
    imageId: string,
    transformation: ImageTransformationOptions,
    options: {
      variantName?: string
      userId?: string
      cacheKey?: string
    } = {}
  ): Promise<ImageVariant> {
    if (!this.config.enabled) {
      throw new CloudflareImagesError('Cloudflare Images service is disabled')
    }

    const operationId = this.generateOperationId()
    const operation: ImageOperation = {
      id: operationId,
      type: 'transform',
      imageId,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
    }

    this.activeOperations.set(operationId, operation)

    try {
      operation.status = 'processing'
      operation.progress = 20

      // Validate transformation options
      const validation = validateTransformationOptions(transformation)
      if (!validation.valid) {
        throw new CloudflareImagesError(
          `Invalid transformation options: ${validation.errors.join(', ')}`
        )
      }

      operation.progress = 40

      // Check cache first
      const cacheKey = options.cacheKey || this.generateCacheKey(imageId, transformation)
      if (this.cache) {
        const cached = await this.cache.get(cacheKey)
        if (cached) {
          operation.status = 'completed'
          operation.progress = 100
          operation.endTime = Date.now()
          return JSON.parse(cached) as ImageVariant
        }
      }

      operation.progress = 60

      // Get original image metadata
      const originalMetadata = await this.getImageMetadata(imageId)
      if (!originalMetadata) {
        throw new CloudflareImagesError('Original image not found')
      }

      operation.progress = 80

      // Generate transformation URL
      const transformUrl = this.generateTransformationUrl(imageId, transformation)

      // Create variant metadata
      const { width, height } = calculateImageDimensions(
        originalMetadata.width || 1000,
        originalMetadata.height || 1000,
        transformation
      )

      const variant: ImageVariant = {
        name: options.variantName || `transform_${Date.now()}`,
        width,
        height,
        size: 0, // Would be populated by actual API response
        format: transformation.format || originalMetadata.format,
        url: transformUrl,
        cdnUrl: transformUrl,
        transformation,
        createdAt: new Date(),
      }

      // Cache the variant
      if (this.cache) {
        await this.cache.put(cacheKey, JSON.stringify(variant), {
          expirationTtl: 3600, // 1 hour
        })
      }

      operation.progress = 100
      operation.status = 'completed'
      operation.endTime = Date.now()
      operation.result = variant

      // Save variant to database
      await this.saveImageVariant(imageId, variant)

      return variant
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Transformation failed'
      operation.endTime = Date.now()
      throw error
    } finally {
      setTimeout(() => {
        this.activeOperations.delete(operationId)
      }, 60000)
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
    try {
      // Try to get from database first
      const result = await this.database.queryFirst(
        'SELECT * FROM image_metadata WHERE id = ?',
        [imageId]
      )

      if (result) {
        return this.mapRowToImageMetadata(result)
      }

      // If not in database, try to get from Cloudflare API
      const apiResponse = await this.makeCloudflareRequest<CloudflareImage>(
        'GET',
        `/images/${imageId}`
      )

      if (apiResponse.success && apiResponse.result) {
        const cloudflareImage = apiResponse.result
        return this.mapCloudflareImageToMetadata(cloudflareImage)
      }

      return null
    } catch (error) {
      console.error('Failed to get image metadata:', error)
      return null
    }
  }

  /**
   * Get image variants
   */
  async getImageVariants(imageId: string): Promise<ImageVariant[]> {
    try {
      const results = await this.database.query(
        'SELECT * FROM image_variants WHERE image_id = ? ORDER BY created_at DESC',
        [imageId]
      )

      return results.map(row => this.mapRowToImageVariant(row))
    } catch (error) {
      console.error('Failed to get image variants:', error)
      return []
    }
  }

  /**
   * Delete image and all variants
   */
  async deleteImage(imageId: string): Promise<boolean> {
    if (!this.config.enabled) {
      throw new CloudflareImagesError('Cloudflare Images service is disabled')
    }

    const operationId = this.generateOperationId()
    const operation: ImageOperation = {
      id: operationId,
      type: 'delete',
      imageId,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
    }

    this.activeOperations.set(operationId, operation)

    try {
      operation.status = 'processing'
      operation.progress = 20

      // Get image metadata
      const imageMetadata = await this.getImageMetadata(imageId)
      if (!imageMetadata) {
        throw new CloudflareImagesError('Image not found')
      }

      operation.progress = 40

      // Delete from Cloudflare Images
      await this.makeCloudflareRequest('DELETE', `/images/${imageId}`)

      operation.progress = 60

      // Delete from database
      await this.database.execute('DELETE FROM image_metadata WHERE id = ?', [imageId])
      await this.database.execute('DELETE FROM image_variants WHERE image_id = ?', [imageId])

      operation.progress = 80

      // Delete associated file upload if exists
      if (imageMetadata.fileId) {
        await this.fileService.deleteFile(imageMetadata.fileId)
      }

      operation.progress = 100
      operation.status = 'completed'
      operation.endTime = Date.now()

      // Clear cache
      if (this.cache) {
        const keys = await this.cache.list({ prefix: `image:${imageId}:` })
        for (const key of keys.keys) {
          await this.cache.delete(key.name)
        }
      }

      return true
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Delete failed'
      operation.endTime = Date.now()
      return false
    } finally {
      setTimeout(() => {
        this.activeOperations.delete(operationId)
      }, 60000)
    }
  }

  /**
   * Get user images
   */
  async getUserImages(
    userId: string,
    options: {
      limit?: number
      offset?: number
      sortBy?: 'created_at' | 'size' | 'filename'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ): Promise<{
    images: ImageMetadata[]
    total: number
    hasMore: boolean
  }> {
    try {
      const limit = options.limit || 50
      const offset = options.offset || 0
      const sortBy = options.sortBy || 'created_at'
      const sortOrder = options.sortOrder || 'desc'

      const query = `
        SELECT * FROM image_metadata
        WHERE user_id = ?
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `

      const images = await this.database.query(query, [userId, limit, offset])

      // Get total count
      const countResult = await this.database.queryFirst(
        'SELECT COUNT(*) as total FROM image_metadata WHERE user_id = ?',
        [userId]
      )

      const total = countResult?.total || 0
      const hasMore = offset + images.length < total

      return {
        images: images.map(row => this.mapRowToImageMetadata(row)),
        total,
        hasMore,
      }
    } catch (error) {
      console.error('Failed to get user images:', error)
      return { images: [], total: 0, hasMore: false }
    }
  }

  /**
   * Get image statistics
   */
  async getImageStats(userId?: string): Promise<ImageStats> {
    try {
      let whereClause = userId ? 'WHERE user_id = ?' : ''
      let params: any[] = userId ? [userId] : []

      const statsQuery = `
        SELECT
          COUNT(*) as total_images,
          SUM(size) as total_size,
          COUNT(DISTINCT format) as unique_formats,
          COUNT(DISTINCT user_id) as unique_users
        FROM image_metadata
        ${whereClause}
      `

      const stats = await this.database.queryFirst(statsQuery, params)

      // Get format breakdown
      const formatQuery = `
        SELECT format, COUNT(*) as count
        FROM image_metadata
        ${whereClause}
        GROUP BY format
      `

      const formatResults = await this.database.query(formatQuery, params)
      const imagesByFormat: Record<string, number> = {}
      formatResults.forEach(row => {
        imagesByFormat[row.format] = row.count
      })

      // Get user breakdown (if not filtered by user)
      let imagesByUser: Record<string, number> = {}
      if (!userId) {
        const userQuery = `
          SELECT user_id, COUNT(*) as count
          FROM image_metadata
          GROUP BY user_id
        `
        const userResults = await this.database.query(userQuery)
        userResults.forEach(row => {
          imagesByUser[row.user_id || 'anonymous'] = row.count
        })
      }

      // Get variant count
      const variantQuery = `
        SELECT COUNT(*) as total_variants
        FROM image_variants
        ${userId ? 'INNER JOIN image_metadata ON image_variants.image_id = image_metadata.id WHERE image_metadata.user_id = ?' : ''}
      `
      const variantParams = userId ? [userId] : []
      const variantResult = await this.database.queryFirst(variantQuery, variantParams)

      return {
        totalImages: stats?.total_images || 0,
        totalSize: stats?.total_size || 0,
        totalVariants: variantResult?.total_variants || 0,
        imagesByFormat,
        imagesByUser,
        processingTime: 0, // Would need to track this
        apiQuotaUsage: 0, // Would need to get from Cloudflare API
        storageUsage: stats?.total_size || 0,
      }
    } catch (error) {
      console.error('Failed to get image stats:', error)
      return {
        totalImages: 0,
        totalSize: 0,
        totalVariants: 0,
        imagesByFormat: {},
        imagesByUser: {},
        processingTime: 0,
        apiQuotaUsage: 0,
        storageUsage: 0,
      }
    }
  }

  /**
   * Generate CDN URL with transformations
   */
  generateCdnUrl(
    imageId: string,
    transformation: ImageTransformationOptions = {}
  ): string {
    const baseUrl = this.config.customDomain ||
                   `https://imagedelivery.net/${this.config.accountHash}`

    return generateTransformationUrl(baseUrl, imageId, transformation)
  }

  /**
   * Generate signed URL for private images
   */
  async generateSignedUrl(
    imageId: string,
    transformation: ImageTransformationOptions = {},
    expiresIn = 3600
  ): Promise<string> {
    // This would need to implement Cloudflare's signed URL generation
    // For now, return the regular CDN URL
    return this.generateCdnUrl(imageId, transformation)
  }

  /**
   * Get operation status
   */
  getOperationStatus(operationId: string): ImageOperation | null {
    return this.activeOperations.get(operationId) || null
  }

  /**
   * Start health monitoring
   */
  async startHealthMonitoring(): Promise<void> {
    if (this.healthCheckTimer) {
      return
    }

    await this.performHealthCheck()

    this.healthCheckTimer = setInterval(
      () => this.performHealthCheck(),
      this.config.healthCheckInterval || 300000
    )
  }

  /**
   * Stop health monitoring
   */
  async stopHealthMonitoring(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): ImagesHealthCheck | null {
    return this.healthStatus
  }

  // Private helper methods
  private async uploadToCloudflareImages(
    buffer: ArrayBuffer,
    options: ImageUploadOptions
  ): Promise<DirectUploadInfo> {
    try {
      // Get direct upload URL from Cloudflare
      const uploadInfo = await this.makeCloudflareRequest<DirectUploadInfo>(
        'POST',
        '/direct_upload',
        {
          maxFileSizeBytes: this.config.maxFileSize || 50 * 1024 * 1024,
          requireSignedURLs: options.requireSignedUrls || false,
          metadata: options.metadata,
          expiration: options.webhookUrl ? new Date(Date.now() + 3600000).toISOString() : undefined,
        }
      )

      if (!uploadInfo.success || !uploadInfo.result) {
        throw new CloudflareImagesError(
          uploadInfo.errors?.[0]?.message || 'Failed to get upload URL'
        )
      }

      const directUpload = uploadInfo.result

      // Upload file to the direct upload URL
      const formData = new FormData()
      formData.append('file', new Blob([buffer]), options.filename)

      if (directUpload.customMetadata) {
        Object.entries(directUpload.customMetadata).forEach(([key, value]) => {
          formData.append(`metadata[${key}]`, value as string)
        })
      }

      const uploadResponse = await fetch(directUpload.uploadURL, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new CloudflareImagesError(
          `Upload failed: ${uploadResponse.statusText}`
        )
      }

      const uploadResult = await uploadResponse.json()

      if (!uploadResult.success) {
        throw new CloudflareImagesError(
          uploadResult.errors?.[0]?.message || 'Upload failed'
        )
      }

      return directUpload
    } catch (error) {
      throw new CloudflareImagesError(
        `Failed to upload to Cloudflare Images: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async makeCloudflareRequest<T = any>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<CloudflareImagesApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const options: RequestInit = {
        method,
        headers: this.apiHeaders,
      }

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data)
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        throw new CloudflareImagesError(
          `Cloudflare API request failed: ${response.statusText}`,
          undefined,
          response.status
        )
      }

      const result = await response.json()
      return result as CloudflareImagesApiResponse<T>
    } catch (error) {
      if (error instanceof CloudflareImagesError) {
        throw error
      }
      throw new CloudflareImagesError(
        `API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async validateImageFile(
    buffer: ArrayBuffer,
    options: ImageUploadOptions
  ): Promise<void> {
    const size = buffer.byteLength

    // Check file size
    if (size > (this.config.maxFileSize || 50 * 1024 * 1024)) {
      throw new CloudflareImagesError(
        `File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`
      )
    }

    // Check image format
    const detectedFormat = detectImageFormat(buffer)
    if (!detectedFormat) {
      throw new CloudflareImagesError('Invalid image format')
    }

    if (options.format && !validateImageFormat(options.format)) {
      throw new CloudflareImagesError(`Invalid image format: ${options.format}`)
    }

    if (this.config.allowedFormats && !this.config.allowedFormats.includes(detectedFormat)) {
      throw new CloudflareImagesError(
        `Image format ${detectedFormat} is not allowed`
      )
    }
  }

  private async normalizeFileInput(
    file: File | ArrayBuffer | Uint8Array
  ): Promise<ArrayBuffer> {
    if (file instanceof File) {
      return file.arrayBuffer()
    }
    if (file instanceof Uint8Array) {
      return file.buffer
    }
    return file
  }

  private async createImageMetadataRecord(data: {
    id: string
    filename: string
    size: number
    format: string
    uploadedAt: Date
    userId?: string
    fileId?: string
    variants: ImageVariant[]
    tags: string[]
    metadata: Record<string, any>
    url: string
    cdnUrl: string
    requiresSignedUrls?: boolean
  }): Promise<ImageMetadata> {
    try {
      await this.database.execute(
        `INSERT INTO image_metadata (
          id, filename, size, format, uploaded_at, user_id, file_id,
          tags, metadata, url, cdn_url, requires_signed_urls
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.filename,
          data.size,
          data.format,
          data.uploadedAt.toISOString(),
          data.userId,
          data.fileId,
          JSON.stringify(data.tags),
          JSON.stringify(data.metadata),
          data.url,
          data.cdnUrl,
          data.requiresSignedUrls || false,
        ]
      )

      return {
        ...data,
        width: 0,
        height: 0,
        updatedAt: data.uploadedAt,
      }
    } catch (error) {
      throw new CloudflareImagesError(
        `Failed to create image metadata record: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async saveImageVariant(imageId: string, variant: ImageVariant): Promise<void> {
    try {
      await this.database.execute(
        `INSERT INTO image_variants (
          image_id, name, width, height, size, format, url, cdn_url,
          transformation, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          imageId,
          variant.name,
          variant.width,
          variant.height,
          variant.size,
          variant.format,
          variant.url,
          variant.cdnUrl,
          JSON.stringify(variant.transformation),
          variant.createdAt.toISOString(),
        ]
      )
    } catch (error) {
      console.error('Failed to save image variant:', error)
    }
  }

  private mapRowToImageMetadata(row: any): ImageMetadata {
    return {
      id: row.id,
      filename: row.filename,
      size: row.size,
      width: row.width || 0,
      height: row.height || 0,
      format: row.format,
      contentType: `image/${row.format.toLowerCase()}`,
      uploadedAt: new Date(row.uploaded_at),
      updatedAt: new Date(row.updated_at || row.uploaded_at),
      userId: row.user_id,
      fileId: row.file_id,
      variants: [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      url: row.url,
      cdnUrl: row.cdn_url,
      requiresSignedUrls: row.requires_signed_urls,
      signedUrlToken: row.signed_url_token,
    }
  }

  private mapRowToImageVariant(row: any): ImageVariant {
    return {
      name: row.name,
      width: row.width,
      height: row.height,
      size: row.size,
      format: row.format,
      url: row.url,
      cdnUrl: row.cdn_url,
      transformation: row.transformation ? JSON.parse(row.transformation) : {},
      createdAt: new Date(row.created_at),
    }
  }

  private mapCloudflareImageToMetadata(cloudflareImage: CloudflareImage): ImageMetadata {
    return {
      id: cloudflareImage.id,
      filename: cloudflareImage.filename,
      size: 0,
      width: 0,
      height: 0,
      format: 'UNKNOWN',
      contentType: 'application/octet-stream',
      uploadedAt: new Date(cloudflareImage.uploaded),
      updatedAt: new Date(cloudflareImage.uploaded),
      variants: cloudflareImage.variants.map((url, index) => ({
        name: `variant_${index}`,
        width: 0,
        height: 0,
        size: 0,
        format: 'UNKNOWN',
        url,
        cdnUrl: url,
        transformation: {},
        createdAt: new Date(),
      })),
      tags: [],
      metadata: cloudflareImage.metadata || {},
      url: cloudflareImage.variants[0] || '',
      cdnUrl: cloudflareImage.variants[0] || '',
      requiresSignedUrls: cloudflareImage.requireSignedURLs,
    }
  }

  private generateTransformationUrl(
    imageId: string,
    transformation: ImageTransformationOptions
  ): string {
    const baseUrl = this.config.customDomain ||
                   `https://imagedelivery.net/${this.config.accountHash}`

    return generateTransformationUrl(baseUrl, imageId, transformation)
  }

  private generateCacheKey(imageId: string, transformation: ImageTransformationOptions): string {
    const key = `image:${imageId}:${JSON.stringify(transformation)}`
    return key.replace(/[^a-zA-Z0-9-_]/g, '_')
  }

  private generateOperationId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now()

    try {
      // Test API connectivity
      const response = await this.makeCloudflareRequest('GET', '/images', undefined)

      const responseTime = Date.now() - startTime
      const isHealthy = response.success && responseTime < 5000

      this.healthStatus = {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        responseTime,
        details: {
          uploadTime: responseTime,
          transformationTime: responseTime,
          apiQuotaUsage: 0,
          activeTransformations: this.activeOperations.size,
          errorRate: 0,
        },
      }
    } catch (error) {
      this.healthStatus = {
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Health check failed',
      }
    }
  }
}

// Factory function
export function createCloudflareImagesService(
  options: CloudflareImagesServiceOptions
): CloudflareImagesService {
  return new CloudflareImagesService(options)
}

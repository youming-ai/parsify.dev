/**
 * Cloudflare R2 Configuration
 *
 * This module provides configuration and utilities for interacting with
 * Cloudflare R2 object storage, including file uploads, downloads,
 * and storage management.
 */

export interface R2Config {
  binding: string
  bucketName: string
  accountId?: string
  accessKeyId?: string
  secretAccessKey?: string
  region?: string
  endpoint?: string
  publicUrl?: string
  maxFileSize?: number
  allowedMimeTypes?: string[]
  enableCdn?: boolean
  cdnUrl?: string
  enableVersioning?: boolean
  enableEncryption?: boolean
  compressionEnabled?: boolean
  retentionPeriod?: number
  enableHealthCheck?: boolean
  healthCheckInterval?: number
}

export interface R2EnvironmentConfig {
  development: R2Config
  production: R2Config
  staging?: R2Config
}

export const DEFAULT_R2_CONFIG: Partial<R2Config> = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
  ],
  enableCdn: true,
  enableVersioning: true,
  enableEncryption: true,
  compressionEnabled: true,
  retentionPeriod: 30 * 24 * 60 * 60, // 30 days
  enableHealthCheck: true,
  healthCheckInterval: 300000, // 5 minutes
}

export const R2_ENVIRONMENT_CONFIG: R2EnvironmentConfig = {
  development: {
    binding: 'FILES',
    bucketName: 'parsify-files-dev',
    ...DEFAULT_R2_CONFIG,
  },
  production: {
    binding: 'FILES',
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'parsify-files-prod',
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    maxFileSize: 500 * 1024 * 1024, // 500MB for production
    retentionPeriod: 90 * 24 * 60 * 60, // 90 days
    enableCdn: true,
    cdnUrl: process.env.CLOUDFLARE_R2_CDN_URL,
    ...DEFAULT_R2_CONFIG,
  },
}

export function getR2Config(environment?: string): R2Config {
  const env = environment || process.env.ENVIRONMENT || 'development'

  if (env === 'production' && !R2_ENVIRONMENT_CONFIG.production.bucketName) {
    throw new Error(
      'Cloudflare R2 bucket name is required for production environment'
    )
  }

  return (
    R2_ENVIRONMENT_CONFIG[env as keyof R2EnvironmentConfig] ||
    R2_ENVIRONMENT_CONFIG.development
  )
}

export interface R2UploadOptions {
  contentType?: string
  metadata?: Record<string, any>
  tags?: Record<string, string>
  cacheControl?: string
  contentEncoding?: string
  contentDisposition?: string
  expires?: Date
  customHeaders?: Record<string, string>
}

export interface R2FileMetadata {
  key: string
  size: number
  contentType: string
  etag: string
  lastModified: Date
  metadata?: Record<string, any>
  tags?: Record<string, string>
  url?: string
  cdnUrl?: string
  userId?: string
  uploadId?: string
  originalName?: string
  mimeType?: string
  checksum?: string
  encrypted?: boolean
  version?: string
}

export interface R2HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: number
  responseTime: number
  error?: string
  details?: {
    bucketCount: number
    totalObjects: number
    totalSize: number
    avgUploadTime: number
    avgDownloadTime: number
    errorRate: number
  }
}

export class R2HealthMonitor {
  private config: R2Config
  private lastHealthCheck: R2HealthCheck | null = null
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private isMonitoring = false
  private operations: {
    uploads: { count: number; totalTime: number; errors: number }
    downloads: { count: number; totalTime: number; errors: number }
    deletes: { count: number; errors: number }
  } = {
    uploads: { count: 0, totalTime: 0, errors: 0 },
    downloads: { count: 0, totalTime: 0, errors: 0 },
    deletes: { count: 0, errors: 0 },
  }

  constructor(config: R2Config) {
    this.config = config
  }

  async startMonitoring(bucket: R2Bucket): Promise<void> {
    if (!this.config.enableHealthCheck || this.isMonitoring) {
      return
    }

    this.isMonitoring = true

    // Initial health check
    await this.performHealthCheck(bucket)

    // Set up periodic health checks
    this.healthCheckTimer = setInterval(
      () => this.performHealthCheck(bucket),
      this.config.healthCheckInterval || 300000
    )
  }

  async stopMonitoring(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
    this.isMonitoring = false
  }

  async performHealthCheck(bucket: R2Bucket): Promise<R2HealthCheck> {
    const startTime = Date.now()

    try {
      // Test file operations
      const testKey = `health-check-${Date.now()}.txt`
      const testData = 'health check'

      // Test upload
      await bucket.put(testKey, testData)
      const uploadTime = Date.now()

      // Test download
      const result = await bucket.get(testKey)
      const downloadTime = Date.now()

      // Test delete
      await bucket.delete(testKey)

      const responseTime = Date.now() - startTime
      const success = result && (await result.text()) === testData

      const healthCheck: R2HealthCheck = {
        status: success && responseTime < 5000 ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        responseTime,
        details: {
          bucketCount: 1,
          totalObjects: 0, // Would need additional queries to get actual count
          totalSize: 0,
          avgUploadTime: uploadTime - startTime,
          avgDownloadTime: downloadTime - uploadTime,
          errorRate: this.calculateErrorRate(),
        },
      }

      this.lastHealthCheck = healthCheck
      return healthCheck
    } catch (error) {
      const healthCheck: R2HealthCheck = {
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.lastHealthCheck = healthCheck
      return healthCheck
    }
  }

  recordUpload(duration: number, success: boolean): void {
    this.operations.uploads.count++
    this.operations.uploads.totalTime += duration
    if (!success) this.operations.uploads.errors++
  }

  recordDownload(duration: number, success: boolean): void {
    this.operations.downloads.count++
    this.operations.downloads.totalTime += duration
    if (!success) this.operations.downloads.errors++
  }

  recordDelete(success: boolean): void {
    this.operations.deletes.count++
    if (!success) this.operations.deletes.errors++
  }

  private calculateErrorRate(): number {
    const totalOps =
      this.operations.uploads.count +
      this.operations.downloads.count +
      this.operations.deletes.count
    const totalErrors =
      this.operations.uploads.errors +
      this.operations.downloads.errors +
      this.operations.deletes.errors

    return totalOps > 0 ? (totalErrors / totalOps) * 100 : 0
  }

  getLastHealthCheck(): R2HealthCheck | null {
    return this.lastHealthCheck
  }

  isHealthy(): boolean {
    const lastCheck = this.getLastHealthCheck()
    if (!lastCheck) return false

    const maxAge = (this.config.healthCheckInterval || 300000) * 2
    const isRecent = Date.now() - lastCheck.timestamp < maxAge

    return isRecent && lastCheck.status !== 'unhealthy'
  }
}

export class R2FileService {
  private bucket: R2Bucket
  private config: R2Config
  private healthMonitor: R2HealthMonitor

  constructor(bucket: R2Bucket, config: R2Config) {
    this.bucket = bucket
    this.config = config
    this.healthMonitor = new R2HealthMonitor(config)
  }

  async startHealthMonitoring(): Promise<void> {
    await this.healthMonitor.startMonitoring(this.bucket)
  }

  async stopHealthMonitoring(): Promise<void> {
    await this.healthMonitor.stopMonitoring()
  }

  private generateKey(
    userId: string,
    filename: string,
    prefix?: string
  ): string {
    const timestamp = Date.now()
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const ext = sanitized.includes('.') ? `.${sanitized.split('.').pop()}` : ''
    const name = sanitized.replace(/\.[^/.]+$/, '') || 'file'

    const parts = [
      prefix || 'uploads',
      userId,
      timestamp.toString(),
      name + ext,
    ]
    return parts.filter(Boolean).join('/')
  }

  private validateFile(
    size: number,
    mimeType?: string
  ): { valid: boolean; error?: string } {
    // Check file size
    if (size > (this.config.maxFileSize || 100 * 1024 * 1024)) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`,
      }
    }

    // Check MIME type if provided and restrictions exist
    if (mimeType && this.config.allowedMimeTypes) {
      if (!this.config.allowedMimeTypes.includes(mimeType)) {
        return {
          valid: false,
          error: `MIME type ${mimeType} is not allowed`,
        }
      }
    }

    return { valid: true }
  }

  async uploadFile(
    userId: string,
    file: ArrayBuffer | ReadableStream | Uint8Array,
    filename: string,
    options: R2UploadOptions = {}
  ): Promise<R2FileMetadata> {
    const startTime = Date.now()

    try {
      const size =
        file instanceof ArrayBuffer
          ? file.byteLength
          : file instanceof Uint8Array
            ? file.length
            : 0

      const validation = this.validateFile(size, options.contentType)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      const key = this.generateKey(userId, filename)

      const metadata: Record<string, any> = {
        userId,
        originalName: filename,
        uploadTime: Date.now(),
        ...options.metadata,
      }

      const uploadOptions: R2PutOptions = {
        httpMetadata: {
          contentType: options.contentType || 'application/octet-stream',
          cacheControl: options.cacheControl || 'public, max-age=31536000',
          contentEncoding: options.contentEncoding,
          contentDisposition:
            options.contentDisposition || `inline; filename="${filename}"`,
        },
        customMetadata: {
          ...metadata,
          ...options.tags,
        },
      }

      if (options.expires) {
        uploadOptions.customMetadata!.expiresAt = options.expires.toISOString()
      }

      const result = await this.bucket.put(key, file, uploadOptions)

      const fileMetadata: R2FileMetadata = {
        key,
        size,
        contentType: options.contentType || 'application/octet-stream',
        etag: result.etag,
        lastModified: new Date(),
        metadata,
        tags: options.tags,
        userId,
        originalName: filename,
        mimeType: options.contentType,
        checksum: result.checksums?.md5 || '',
        encrypted: this.config.enableEncryption,
        url: this.getFileUrl(key),
        cdnUrl: this.getCdnUrl(key),
      }

      this.healthMonitor.recordUpload(Date.now() - startTime, true)
      return fileMetadata
    } catch (error) {
      this.healthMonitor.recordUpload(Date.now() - startTime, false)
      throw error
    }
  }

  async uploadFileFromUrl(
    userId: string,
    url: string,
    filename: string,
    options: R2UploadOptions = {}
  ): Promise<R2FileMetadata> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch file from URL: ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      const contentType =
        response.headers.get('content-type') || options.contentType

      return this.uploadFile(userId, buffer, filename, {
        ...options,
        contentType,
      })
    } catch (error) {
      throw new Error(`Failed to upload file from URL: ${error}`)
    }
  }

  async getFile(
    key: string
  ): Promise<{ file: R2ObjectBody; metadata: R2FileMetadata } | null> {
    const startTime = Date.now()

    try {
      const object = await this.bucket.get(key)

      if (!object) {
        this.healthMonitor.recordDownload(Date.now() - startTime, false)
        return null
      }

      const metadata: R2FileMetadata = {
        key,
        size: object.size,
        contentType:
          object.httpMetadata?.contentType || 'application/octet-stream',
        etag: object.etag,
        lastModified: object.uploaded,
        metadata: object.customMetadata,
        url: this.getFileUrl(key),
        cdnUrl: this.getCdnUrl(key),
        userId: object.customMetadata?.userId,
        originalName: object.customMetadata?.originalName,
        mimeType: object.httpMetadata?.contentType,
        checksum: object.checksums?.md5 || '',
        encrypted: object.customMetadata?.encrypted === 'true',
      }

      this.healthMonitor.recordDownload(Date.now() - startTime, true)
      return { file: object, metadata }
    } catch (error) {
      this.healthMonitor.recordDownload(Date.now() - startTime, false)
      throw error
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.bucket.delete(key)
      this.healthMonitor.recordDelete(true)
      return true
    } catch (error) {
      this.healthMonitor.recordDelete(false)
      return false
    }
  }

  async deleteFiles(
    keys: string[]
  ): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = []
    const failed: string[] = []

    for (const key of keys) {
      try {
        await this.deleteFile(key)
        deleted.push(key)
      } catch (error) {
        failed.push(key)
      }
    }

    return { deleted, failed }
  }

  async listFiles(
    prefix?: string,
    options: { limit?: number; cursor?: string } = {}
  ): Promise<{ files: R2FileMetadata[]; cursor?: string; truncated: boolean }> {
    try {
      const listOptions: R2ListOptions = {
        limit: options.limit || 1000,
        cursor: options.cursor,
      }

      if (prefix) {
        listOptions.prefix = prefix
      }

      const result = await this.bucket.list(listOptions)

      const files: R2FileMetadata[] = result.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        contentType:
          obj.httpMetadata?.contentType || 'application/octet-stream',
        etag: obj.etag,
        lastModified: obj.uploaded,
        metadata: obj.customMetadata,
        url: this.getFileUrl(obj.key),
        cdnUrl: this.getCdnUrl(obj.key),
        userId: obj.customMetadata?.userId,
        originalName: obj.customMetadata?.originalName,
        mimeType: obj.httpMetadata?.contentType,
        checksum: obj.checksums?.md5 || '',
        encrypted: obj.customMetadata?.encrypted === 'true',
      }))

      return {
        files,
        cursor: result.truncated ? result.cursor : undefined,
        truncated: result.truncated,
      }
    } catch (error) {
      throw new Error(`Failed to list files: ${error}`)
    }
  }

  async getUserFiles(
    userId: string,
    options: { limit?: number; cursor?: string; prefix?: string } = {}
  ): Promise<{ files: R2FileMetadata[]; cursor?: string; truncated: boolean }> {
    const userPrefix = `uploads/${userId}${options.prefix ? '/' + options.prefix : ''}`
    return this.listFiles(userPrefix, options)
  }

  async copyFile(
    sourceKey: string,
    destinationKey: string,
    options: R2UploadOptions = {}
  ): Promise<R2FileMetadata> {
    try {
      const sourceObject = await this.bucket.get(sourceKey)
      if (!sourceObject) {
        throw new Error('Source file not found')
      }

      const buffer = await sourceObject.arrayBuffer()

      const uploadOptions: R2UploadOptions = {
        contentType: sourceObject.httpMetadata?.contentType,
        metadata: sourceObject.customMetadata,
        ...options,
      }

      // Extract userId from destination key for proper metadata
      const keyParts = destinationKey.split('/')
      const userId = keyParts.length > 2 ? keyParts[1] : undefined

      if (userId) {
        return this.uploadFile(
          userId,
          buffer,
          keyParts[keyParts.length - 1],
          uploadOptions
        )
      } else {
        throw new Error('Invalid destination key format')
      }
    } catch (error) {
      throw new Error(`Failed to copy file: ${error}`)
    }
  }

  async getFileInfo(key: string): Promise<R2FileMetadata | null> {
    try {
      const object = await this.bucket.head(key)

      if (!object) {
        return null
      }

      return {
        key,
        size: object.size,
        contentType:
          object.httpMetadata?.contentType || 'application/octet-stream',
        etag: object.etag,
        lastModified: object.uploaded,
        metadata: object.customMetadata,
        url: this.getFileUrl(key),
        cdnUrl: this.getCdnUrl(key),
        userId: object.customMetadata?.userId,
        originalName: object.customMetadata?.originalName,
        mimeType: object.httpMetadata?.contentType,
        checksum: object.checksums?.md5 || '',
        encrypted: object.customMetadata?.encrypted === 'true',
      }
    } catch (error) {
      return null
    }
  }

  async getFileSize(key: string): Promise<number> {
    const info = await this.getFileInfo(key)
    return info?.size || 0
  }

  async fileExists(key: string): Promise<boolean> {
    const info = await this.getFileInfo(key)
    return info !== null
  }

  private getFileUrl(key: string): string {
    const baseUrl =
      this.config.publicUrl ||
      `https://storage.googleapis.com/${this.config.bucketName}`
    return `${baseUrl}/${key}`
  }

  private getCdnUrl(key: string): string {
    if (!this.config.enableCdn || !this.config.cdnUrl) {
      return this.getFileUrl(key)
    }

    return `${this.config.cdnUrl}/${key}`
  }

  async cleanupExpiredFiles(): Promise<{ deleted: number; errors: number }> {
    const cutoffTime = new Date()
    cutoffTime.setDate(
      cutoffTime.getDate() - (this.config.retentionPeriod || 30)
    )

    try {
      // This would need to be implemented with a list and filter operation
      // For now, return placeholder values
      return { deleted: 0, errors: 0 }
    } catch (error) {
      return { deleted: 0, errors: 1 }
    }
  }

  getHealthStatus(): R2HealthCheck | null {
    return this.healthMonitor.getLastHealthCheck()
  }

  isHealthy(): boolean {
    return this.healthMonitor.isHealthy()
  }
}

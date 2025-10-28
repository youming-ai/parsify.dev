/**
 * Cloudflare R2 Storage Service
 *
 * This module provides comprehensive R2 file storage functionality with
 * streaming support, metadata management, CDN integration, and lifecycle
 * management capabilities. It integrates with the existing FileService
 * to provide a complete file storage solution.
 */

import {
  type R2Config,
  type R2FileMetadata,
  R2HealthMonitor,
  type R2UploadOptions,
} from '../../config/cloudflare/r2-config'
import type { DatabaseClient } from '../../database'
import { FileUpload } from '../../models/file_upload'

export interface R2StorageOptions {
  bucket: R2Bucket
  config: R2Config
  database: DatabaseClient
  enableHealthMonitoring?: boolean
  retryAttempts?: number
  retryDelay?: number
}

export interface UploadStreamOptions extends R2UploadOptions {
  userId?: string
  fileId?: string
  onProgress?: (progress: UploadProgress) => void
  chunkSize?: number
  enableResumable?: boolean
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  speed?: number
  timeRemaining?: number
  chunks?: {
    completed: number
    total: number
  }
}

export interface DownloadStreamOptions {
  range?: {
    start: number
    end?: number
  }
  onProgress?: (progress: DownloadProgress) => void
}

export interface DownloadProgress {
  loaded: number
  total: number
  percentage: number
  speed?: number
  timeRemaining?: number
}

export interface FileMetadataValidation {
  maxSize?: number
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
  blockedExtensions?: string[]
  requireChecksum?: boolean
  scanForMalware?: boolean
}

export interface CdnUrlOptions {
  expiresIn?: number
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'jpeg' | 'png'
  fit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'pad'
}

export interface RetentionPolicy {
  defaultRetentionDays: number
  perTypeRetention?: Record<string, number>
  autoCleanupEnabled: boolean
  cleanupInterval?: number
  retainOnAccess?: boolean
}

export interface StorageStats {
  totalFiles: number
  totalSize: number
  totalUsers: number
  filesByType: Record<string, number>
  sizeByType: Record<string, number>
  uploadsToday: number
  downloadsToday: number
  averageFileSize: number
  storageUtilization: number
}

export interface FileOperation {
  id: string
  type: 'upload' | 'download' | 'delete' | 'copy'
  fileId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startTime: number
  endTime?: number
  error?: string
}

export class R2StorageService {
  private bucket: R2Bucket
  private config: R2Config
  private database: DatabaseClient
  private healthMonitor: R2HealthMonitor
  private retryAttempts: number
  private retryDelay: number
  private activeOperations = new Map<string, FileOperation>()
  private retentionPolicy: RetentionPolicy

  constructor(options: R2StorageOptions) {
    this.bucket = options.bucket
    this.config = options.config
    this.database = options.database
    this.retryAttempts = options.retryAttempts ?? 3
    this.retryDelay = options.retryDelay ?? 1000

    this.healthMonitor = new R2HealthMonitor(options.config)
    this.retentionPolicy = {
      defaultRetentionDays: 30,
      perTypeRetention: {
        'application/pdf': 90,
        'image/jpeg': 60,
        'image/png': 60,
        'application/json': 7,
        'text/plain': 7,
      },
      autoCleanupEnabled: true,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
      retainOnAccess: false,
    }

    if (options.enableHealthMonitoring) {
      this.startHealthMonitoring()
    }
  }

  /**
   * Upload file with streaming support and progress tracking
   */
  async uploadFile(
    file: File | ArrayBuffer | ReadableStream | Uint8Array,
    filename: string,
    options: UploadStreamOptions = {}
  ): Promise<{
    fileUpload: FileUpload
    metadata: R2FileMetadata
    operation: FileOperation
  }> {
    const operationId = this.generateOperationId()
    const operation: FileOperation = {
      id: operationId,
      type: 'upload',
      fileId: options.fileId || '',
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
    }

    this.activeOperations.set(operationId, operation)

    try {
      operation.status = 'running'

      // Convert file to appropriate format
      const fileData = await this.normalizeFileInput(file)
      const fileSize = this.getFileSize(fileData)

      // Validate file
      await this.validateFileUpload(filename, fileSize, options.contentType)

      // Generate file key and metadata
      const r2Key = this.generateFileKey(options.userId || 'anonymous', filename, options.fileId)

      // Create database record
      const fileUpload = await this.createFileUploadRecord({
        id: options.fileId || crypto.randomUUID(),
        userId: options.userId,
        filename,
        size: fileSize,
        mimeType: options.contentType || this.getMimeType(filename),
        r2Key,
      })

      operation.fileId = fileUpload.id

      // Prepare upload options
      const uploadOptions: R2UploadOptions = {
        contentType: options.contentType || this.getMimeType(filename),
        metadata: {
          ...options.metadata,
          userId: options.userId,
          originalName: filename,
          fileId: fileUpload.id,
          uploadTime: Date.now().toString(),
        },
        tags: {
          ...options.tags,
          userId: options.userId || 'anonymous',
          fileType: this.getFileCategory(filename),
        },
        cacheControl: options.cacheControl || this.getDefaultCacheControl(filename),
        contentDisposition: options.contentDisposition || `inline; filename="${filename}"`,
        expires: options.expires || this.calculateExpirationDate(filename),
      }

      // Perform upload with progress tracking
      const metadata = await this.performUploadWithProgress(
        r2Key,
        fileData,
        uploadOptions,
        operation,
        options.onProgress,
        options.chunkSize,
        options.enableResumable
      )

      // Update database record with success
      await this.updateFileUploadStatus(fileUpload.id, 'completed', metadata.checksum)

      operation.status = 'completed'
      operation.progress = 100
      operation.endTime = Date.now()

      return { fileUpload, metadata, operation }
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Upload failed'
      operation.endTime = Date.now()

      if (operation.fileId) {
        await this.updateFileUploadStatus(operation.fileId, 'failed', undefined, operation.error)
      }

      throw error
    } finally {
      setTimeout(() => {
        this.activeOperations.delete(operationId)
      }, 60000) // Keep operation in memory for 1 minute
    }
  }

  /**
   * Upload file from URL with streaming
   */
  async uploadFileFromUrl(
    url: string,
    filename: string,
    options: UploadStreamOptions = {}
  ): Promise<{
    fileUpload: FileUpload
    metadata: R2FileMetadata
    operation: FileOperation
  }> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch file from URL: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || options.contentType
      const contentLength = response.headers.get('content-length')

      if (contentLength) {
        const size = parseInt(contentLength, 10)
        await this.validateFileUpload(filename, size, contentType)
      }

      const fileData = response.body
      if (!fileData) {
        throw new Error('No file data received from URL')
      }

      return this.uploadFile(fileData, filename, {
        ...options,
        contentType,
      })
    } catch (error) {
      throw new Error(
        `Failed to upload file from URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Download file with streaming support and progress tracking
   */
  async downloadFile(
    fileId: string,
    options: DownloadStreamOptions = {}
  ): Promise<{
    stream: ReadableStream
    metadata: R2FileMetadata
    fileUpload: FileUpload
    operation: FileOperation
  }> {
    const operationId = this.generateOperationId()
    const operation: FileOperation = {
      id: operationId,
      type: 'download',
      fileId,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
    }

    this.activeOperations.set(operationId, operation)

    try {
      operation.status = 'running'

      // Get file upload record
      const fileUpload = await this.getFileUploadById(fileId)
      if (!fileUpload) {
        throw new Error('File not found')
      }

      if (!fileUpload.isAccessible) {
        throw new Error('File is not accessible')
      }

      // Get file from R2
      const r2Object = await this.bucket.get(fileUpload.r2_key, {
        range: options.range,
      })

      if (!r2Object) {
        throw new Error('File not found in storage')
      }

      // Create metadata
      const metadata: R2FileMetadata = {
        key: fileUpload.r2_key,
        size: r2Object.size,
        contentType: r2Object.httpMetadata?.contentType || fileUpload.mime_type,
        etag: r2Object.etag,
        lastModified: r2Object.uploaded,
        metadata: r2Object.customMetadata,
        url: this.getFileUrl(fileUpload.r2_key),
        cdnUrl: this.getCdnUrl(fileUpload.r2_key),
        userId: fileUpload.user_id || undefined,
        originalName: fileUpload.filename,
        mimeType: fileUpload.mime_type,
        checksum: fileUpload.checksum || undefined,
      }

      // Transform stream with progress tracking
      const stream = this.createProgressStream(r2Object.body!, r2Object.size, (loaded, total) => {
        operation.progress = (loaded / total) * 100
        options.onProgress?.({
          loaded,
          total,
          percentage: (loaded / total) * 100,
        })
      })

      operation.status = 'completed'
      operation.progress = 100
      operation.endTime = Date.now()

      // Update access time for retention policy
      if (this.retentionPolicy.retainOnAccess) {
        await this.updateFileAccessTime(fileId)
      }

      return { stream, metadata, fileUpload, operation }
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Download failed'
      operation.endTime = Date.now()
      throw error
    } finally {
      setTimeout(() => {
        this.activeOperations.delete(operationId)
      }, 60000)
    }
  }

  /**
   * Generate CDN URL with optional transformations
   */
  generateCdnUrl(fileId: string, options: CdnUrlOptions = {}): string | null {
    // This would integrate with your CDN provider
    // For now, return the R2 URL with query parameters
    const baseUrl = this.config.cdnUrl || this.config.publicUrl
    if (!baseUrl) return null

    // Get file info
    const fileUpload = this.getFileUploadById(fileId)
    if (!fileUpload) return null

    const url = new URL(`${baseUrl}/${fileUpload.r2_key}`)

    // Add transformation parameters
    if (options.width) url.searchParams.set('w', options.width.toString())
    if (options.height) url.searchParams.set('h', options.height.toString())
    if (options.quality) url.searchParams.set('q', options.quality.toString())
    if (options.format) url.searchParams.set('f', options.format)
    if (options.fit) url.searchParams.set('fit', options.fit)

    // Add expiration for signed URLs
    if (options.expiresIn) {
      const expires = Math.floor(Date.now() / 1000) + options.expiresIn
      url.searchParams.set('expires', expires.toString())

      // Add signature (in production, use proper signing)
      const signature = this.generateUrlSignature(fileUpload.r2_key, expires)
      url.searchParams.set('sig', signature)
    }

    return url.toString()
  }

  /**
   * Copy file to new location
   */
  async copyFile(
    sourceFileId: string,
    newFilename: string,
    options: {
      userId?: string
      metadata?: Record<string, any>
    } = {}
  ): Promise<{
    fileUpload: FileUpload
    metadata: R2FileMetadata
  }> {
    const sourceFileUpload = await this.getFileUploadById(sourceFileId)
    if (!sourceFileUpload) {
      throw new Error('Source file not found')
    }

    if (!sourceFileUpload.isAccessible) {
      throw new Error('Source file is not accessible')
    }

    // Generate new key
    const newR2Key = this.generateFileKey(
      options.userId || sourceFileUpload.user_id || 'anonymous',
      newFilename
    )

    // Copy in R2
    const sourceObject = await this.bucket.get(sourceFileUpload.r2_key)
    if (!sourceObject) {
      throw new Error('Source file not found in storage')
    }

    const fileData = await sourceObject.arrayBuffer()

    const uploadOptions: R2UploadOptions = {
      contentType: sourceFileUpload.mime_type,
      metadata: {
        ...sourceObject.customMetadata,
        ...options.metadata,
        originalName: newFilename,
        copiedFrom: sourceFileId,
        copyTime: Date.now().toString(),
      },
      cacheControl: sourceObject.httpMetadata?.cacheControl,
      contentDisposition: `inline; filename="${newFilename}"`,
    }

    const result = await this.bucket.put(newR2Key, fileData, {
      httpMetadata: {
        contentType: uploadOptions.contentType,
        cacheControl: uploadOptions.cacheControl,
        contentDisposition: uploadOptions.contentDisposition,
      },
      customMetadata: uploadOptions.metadata,
    })

    // Create new database record
    const newFileUpload = await this.createFileUploadRecord({
      userId: options.userId || sourceFileUpload.user_id,
      filename: newFilename,
      size: sourceFileUpload.size_bytes,
      mimeType: sourceFileUpload.mime_type,
      r2Key: newR2Key,
      checksum: result.checksums?.md5,
    })

    const metadata: R2FileMetadata = {
      key: newR2Key,
      size: sourceFileUpload.size_bytes,
      contentType: sourceFileUpload.mime_type,
      etag: result.etag,
      lastModified: new Date(),
      metadata: uploadOptions.metadata,
      url: this.getFileUrl(newR2Key),
      cdnUrl: this.getCdnUrl(newR2Key),
      userId: options.userId,
      originalName: newFilename,
      mimeType: sourceFileUpload.mime_type,
      checksum: result.checksums?.md5,
    }

    return { fileUpload: newFileUpload, metadata }
  }

  /**
   * Delete file with cleanup
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const fileUpload = await this.getFileUploadById(fileId)
      if (!fileUpload) {
        return false
      }

      // Delete from R2
      await this.bucket.delete(fileUpload.r2_key)

      // Mark as deleted in database
      await this.updateFileUploadStatus(fileId, 'expired')

      return true
    } catch (error) {
      console.error('Failed to delete file:', error)
      return false
    }
  }

  /**
   * Batch delete files
   */
  async deleteFiles(fileIds: string[]): Promise<{
    deleted: string[]
    failed: string[]
  }> {
    const deleted: string[] = []
    const failed: string[] = []

    for (const fileId of fileIds) {
      try {
        const success = await this.deleteFile(fileId)
        if (success) {
          deleted.push(fileId)
        } else {
          failed.push(fileId)
        }
      } catch (_error) {
        failed.push(fileId)
      }
    }

    return { deleted, failed }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(userId?: string): Promise<StorageStats> {
    try {
      let query = `
        SELECT
          COUNT(*) as total_files,
          SUM(size_bytes) as total_size,
          COUNT(DISTINCT user_id) as total_users,
          mime_type,
          COUNT(*) as count_by_type,
          SUM(size_bytes) as size_by_type
        FROM file_uploads
        WHERE status = 'completed' AND (expires_at IS NULL OR expires_at > ?)
      `
      const params: any[] = [Math.floor(Date.now() / 1000)]

      if (userId) {
        query += ' AND user_id = ?'
        params.push(userId)
      }

      query += ' GROUP BY mime_type'

      const results = await this.database.query(query, params)

      let totalFiles = 0
      let totalSize = 0
      let totalUsers = 0
      const filesByType: Record<string, number> = {}
      const sizeByType: Record<string, number> = {}

      for (const row of results) {
        totalFiles += row.count_by_type
        totalSize += row.size_by_type
        totalUsers = Math.max(totalUsers, row.total_users)
        filesByType[row.mime_type] = row.count_by_type
        sizeByType[row.mime_type] = row.size_by_type
      }

      // Get today's stats
      const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)
      const todayStats = await this.database.query(
        `SELECT
          COUNT(CASE WHEN created_at >= ? THEN 1 END) as uploads_today,
          COUNT(CASE WHEN last_accessed >= ? THEN 1 END) as downloads_today
         FROM file_uploads
         WHERE status = 'completed' AND (expires_at IS NULL OR expires_at > ?)`,
        [todayStart, todayStart, Math.floor(Date.now() / 1000)]
      )

      const { uploads_today = 0, downloads_today = 0 } = todayStats[0] || {}

      return {
        totalFiles,
        totalSize,
        totalUsers,
        filesByType,
        sizeByType,
        uploadsToday: uploads_today,
        downloadsToday: downloads_today,
        averageFileSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
        storageUtilization: 0, // Would need storage limit from config
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        totalFiles: 0,
        totalSize: 0,
        totalUsers: 0,
        filesByType: {},
        sizeByType: {},
        uploadsToday: 0,
        downloadsToday: 0,
        averageFileSize: 0,
        storageUtilization: 0,
      }
    }
  }

  /**
   * Cleanup expired files
   */
  async cleanupExpiredFiles(): Promise<{ deleted: number; errors: number }> {
    if (!this.retentionPolicy.autoCleanupEnabled) {
      return { deleted: 0, errors: 0 }
    }

    try {
      const expiredFiles = await this.getExpiredFiles()
      let deleted = 0
      let errors = 0

      for (const fileUpload of expiredFiles) {
        try {
          const success = await this.deleteFile(fileUpload.id)
          if (success) {
            deleted++
          } else {
            errors++
          }
        } catch (error) {
          errors++
          console.error(`Failed to cleanup file ${fileUpload.id}:`, error)
        }
      }

      return { deleted, errors }
    } catch (error) {
      console.error('Cleanup failed:', error)
      return { deleted: 0, errors: 1 }
    }
  }

  /**
   * Get active operation status
   */
  getOperationStatus(operationId: string): FileOperation | null {
    return this.activeOperations.get(operationId) || null
  }

  /**
   * Cancel active operation
   */
  async cancelOperation(operationId: string): Promise<boolean> {
    const operation = this.activeOperations.get(operationId)
    if (!operation || operation.status !== 'running') {
      return false
    }

    operation.status = 'failed'
    operation.error = 'Operation cancelled'
    operation.endTime = Date.now()

    // In a real implementation, you would cancel the actual upload/download
    // This would require integration with the underlying transfer mechanism

    return true
  }

  /**
   * Start health monitoring
   */
  async startHealthMonitoring(): Promise<void> {
    await this.healthMonitor.startMonitoring(this.bucket)
  }

  /**
   * Stop health monitoring
   */
  async stopHealthMonitoring(): Promise<void> {
    await this.healthMonitor.stopMonitoring()
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return this.healthMonitor.getLastHealthCheck()
  }

  // Private helper methods
  private async normalizeFileInput(
    file: File | ArrayBuffer | ReadableStream | Uint8Array
  ): Promise<ArrayBuffer | ReadableStream> {
    if (file instanceof File) {
      return file.arrayBuffer()
    }
    if (file instanceof Uint8Array) {
      return file.buffer
    }
    return file
  }

  private getFileSize(file: ArrayBuffer | ReadableStream): number {
    if (file instanceof ArrayBuffer) {
      return file.byteLength
    }
    // For streams, we can't determine size without reading
    return 0
  }

  private async validateFileUpload(
    filename: string,
    size: number,
    mimeType?: string
  ): Promise<void> {
    // Filename validation
    const filenameValidation = FileUpload.validateFilename(filename)
    if (!filenameValidation.valid) {
      throw new Error(filenameValidation.error!)
    }

    // Size validation
    const maxSize = this.config.maxFileSize || 100 * 1024 * 1024
    if (size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size (${maxSize} bytes)`)
    }

    // MIME type validation
    if (mimeType && this.config.allowedMimeTypes) {
      const isAllowed = this.config.allowedMimeTypes.some(type => {
        if (type.endsWith('/*')) {
          return mimeType.startsWith(type.slice(0, -1))
        }
        return mimeType === type
      })

      if (!isAllowed) {
        throw new Error(`MIME type ${mimeType} is not allowed`)
      }
    }
  }

  private generateFileKey(userId: string, filename: string, fileId?: string): string {
    const timestamp = Date.now()
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const ext = sanitized.includes('.') ? `.${sanitized.split('.').pop()}` : ''
    const name = sanitized.replace(/\.[^/.]+$/, '') || 'file'

    const parts = [
      'uploads',
      userId,
      timestamp.toString(),
      fileId || crypto.randomUUID().slice(0, 8),
      name + ext,
    ]
    return parts.filter(Boolean).join('/')
  }

  private getMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      json: 'application/json',
      txt: 'text/plain',
      csv: 'text/csv',
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      zip: 'application/zip',
    }
    return mimeTypes[extension || ''] || 'application/octet-stream'
  }

  private getFileCategory(filename: string): string {
    const mimeType = this.getMimeType(filename)
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'document'
    if (mimeType.includes('json') || mimeType.includes('text')) return 'text'
    return 'other'
  }

  private getDefaultCacheControl(filename: string): string {
    const category = this.getFileCategory(filename)
    const cacheControl: Record<string, string> = {
      image: 'public, max-age=31536000, immutable',
      document: 'public, max-age=86400',
      text: 'public, max-age=3600',
      other: 'public, max-age=3600',
    }
    return cacheControl[category] || 'public, max-age=3600'
  }

  private calculateExpirationDate(filename: string): Date {
    const _category = this.getFileCategory(filename)
    const retentionDays =
      this.retentionPolicy.perTypeRetention[this.getMimeType(filename)] ||
      this.retentionPolicy.defaultRetentionDays

    const expiration = new Date()
    expiration.setDate(expiration.getDate() + retentionDays)
    return expiration
  }

  private async createFileUploadRecord(data: {
    id?: string
    userId?: string
    filename: string
    size: number
    mimeType: string
    r2Key: string
    checksum?: string
  }): Promise<FileUpload> {
    const fileUpload = FileUpload.createForUpload(
      data.filename,
      data.mimeType,
      data.size,
      data.userId,
      { retentionHours: this.retentionPolicy.defaultRetentionDays * 24 }
    )

    // Override generated values with provided ones
    if (data.id) (fileUpload as any).id = data.id
    if (data.r2Key) (fileUpload as any).r2_key = data.r2Key
    if (data.checksum) (fileUpload as any).checksum = data.checksum

    await this.database.execute(
      `INSERT INTO file_uploads (id, user_id, filename, mime_type, size_bytes, r2_key, checksum, status, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileUpload.id,
        fileUpload.user_id,
        fileUpload.filename,
        fileUpload.mime_type,
        fileUpload.size_bytes,
        fileUpload.r2_key,
        fileUpload.checksum,
        fileUpload.status,
        fileUpload.expires_at,
        fileUpload.created_at,
      ]
    )

    return fileUpload
  }

  private async getFileUploadById(fileId: string): Promise<FileUpload | null> {
    try {
      const result = await this.database.queryFirst('SELECT * FROM file_uploads WHERE id = ?', [
        fileId,
      ])

      if (!result) return null
      return FileUpload.fromRow(result)
    } catch (error) {
      console.error('Failed to get file upload:', error)
      return null
    }
  }

  private async updateFileUploadStatus(
    fileId: string,
    status: string,
    checksum?: string,
    error?: string
  ): Promise<void> {
    try {
      let query = 'UPDATE file_uploads SET status = ?'
      const params: any[] = [status]

      if (checksum) {
        query += ', checksum = ?'
        params.push(checksum)
      }

      if (error) {
        query += ', error_message = ?'
        params.push(error)
      }

      query += ' WHERE id = ?'
      params.push(fileId)

      await this.database.execute(query, params)
    } catch (error) {
      console.error('Failed to update file upload status:', error)
    }
  }

  private async updateFileAccessTime(fileId: string): Promise<void> {
    try {
      await this.database.execute('UPDATE file_uploads SET last_accessed = ? WHERE id = ?', [
        Math.floor(Date.now() / 1000),
        fileId,
      ])
    } catch (error) {
      console.error('Failed to update file access time:', error)
    }
  }

  private async getExpiredFiles(): Promise<FileUpload[]> {
    try {
      const results = await this.database.query(
        'SELECT * FROM file_uploads WHERE expires_at IS NOT NULL AND expires_at < ?',
        [Math.floor(Date.now() / 1000)]
      )

      return results.map(row => FileUpload.fromRow(row))
    } catch (error) {
      console.error('Failed to get expired files:', error)
      return []
    }
  }

  private async performUploadWithProgress(
    key: string,
    data: ArrayBuffer | ReadableStream,
    options: R2UploadOptions,
    operation: FileOperation,
    onProgress?: (progress: UploadProgress) => void,
    _chunkSize?: number,
    _enableResumable?: boolean
  ): Promise<R2FileMetadata> {
    if (data instanceof ArrayBuffer) {
      // Simple upload for small files
      const result = await this.performUploadWithRetry(key, data, options)

      const metadata: R2FileMetadata = {
        key,
        size: data.byteLength,
        contentType: options.contentType || 'application/octet-stream',
        etag: result.etag,
        lastModified: new Date(),
        metadata: options.metadata,
        tags: options.tags,
        url: this.getFileUrl(key),
        cdnUrl: this.getCdnUrl(key),
        userId: options.metadata?.userId,
        originalName: options.metadata?.originalName,
        mimeType: options.contentType,
        checksum: result.checksums?.md5,
      }

      operation.progress = 100
      onProgress?.({
        loaded: data.byteLength,
        total: data.byteLength,
        percentage: 100,
      })

      return metadata
    } else {
      // Streaming upload for large files
      return this.performStreamingUpload(key, data, options, operation, onProgress)
    }
  }

  private async performUploadWithRetry(
    key: string,
    data: ArrayBuffer,
    options: R2UploadOptions
  ): Promise<R2Object> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.bucket.put(key, data, {
          httpMetadata: {
            contentType: options.contentType,
            cacheControl: options.cacheControl,
            contentEncoding: options.contentEncoding,
            contentDisposition: options.contentDisposition,
          },
          customMetadata: {
            ...options.metadata,
            ...options.tags,
          },
        })

        this.healthMonitor.recordUpload(Date.now() - Date.now(), true)
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Upload failed')
        this.healthMonitor.recordUpload(Date.now() - Date.now(), false)

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        }
      }
    }

    throw lastError || new Error('Upload failed after retries')
  }

  private async performStreamingUpload(
    key: string,
    stream: ReadableStream,
    options: R2UploadOptions,
    operation: FileOperation,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<R2FileMetadata> {
    // This is a simplified implementation
    // In a real scenario, you would implement proper chunked uploads
    // with resumable capability

    const reader = stream.getReader()
    const chunks: Uint8Array[] = []
    let loaded = 0
    const total = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        chunks.push(value)
        loaded += value.length

        // Update progress
        const percentage = total > 0 ? (loaded / total) * 100 : 0
        operation.progress = percentage

        onProgress?.({
          loaded,
          total,
          percentage,
        })
      }

      // Combine chunks and upload
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const combined = new Uint8Array(totalLength)
      let offset = 0

      for (const chunk of chunks) {
        combined.set(chunk, offset)
        offset += chunk.length
      }

      const result = await this.performUploadWithRetry(key, combined.buffer, options)

      return {
        key,
        size: totalLength,
        contentType: options.contentType || 'application/octet-stream',
        etag: result.etag,
        lastModified: new Date(),
        metadata: options.metadata,
        tags: options.tags,
        url: this.getFileUrl(key),
        cdnUrl: this.getCdnUrl(key),
        userId: options.metadata?.userId,
        originalName: options.metadata?.originalName,
        mimeType: options.contentType,
        checksum: result.checksums?.md5,
      }
    } finally {
      reader.releaseLock()
    }
  }

  private createProgressStream(
    stream: ReadableStream,
    totalSize: number,
    onProgress: (loaded: number, total: number) => void
  ): ReadableStream {
    const reader = stream.getReader()
    let loaded = 0

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            if (value) {
              loaded += value.length
              onProgress(loaded, totalSize)
              controller.enqueue(value)
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      },
    })
  }

  private getFileUrl(key: string): string {
    const baseUrl =
      this.config.publicUrl || `https://storage.googleapis.com/${this.config.bucketName}`
    return `${baseUrl}/${key}`
  }

  private getCdnUrl(key: string): string {
    if (!this.config.enableCdn || !this.config.cdnUrl) {
      return this.getFileUrl(key)
    }
    return `${this.config.cdnUrl}/${key}`
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateUrlSignature(key: string, expires: number): string {
    // In production, use proper HMAC signature
    const message = `${key}\n${expires}`
    const encoder = new TextEncoder()
    const data = encoder.encode(message)

    // This is a placeholder - use proper crypto signing in production
    return btoa(String.fromCharCode(...new Uint8Array(data.slice(0, 32))))
  }
}

// Factory function
export function createR2StorageService(options: R2StorageOptions): R2StorageService {
  return new R2StorageService(options)
}

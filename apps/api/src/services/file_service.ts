import {
  FileUpload,
  FileUploadSchema,
  CreateFileUploadSchema,
  UpdateFileUploadSchema,
  FILE_UPLOAD_QUERIES,
} from '../models/file_upload'
import { ToolUsage, TOOL_USAGE_QUERIES } from '../models/tool_usage'
import { AuditLog, AUDIT_LOG_QUERIES } from '../models/audit_log'
import { DatabaseClient, createDatabaseClient } from '../database'

export interface FileServiceOptions {
  db: D1Database
  r2: R2Bucket
  kv: KVNamespace
  auditEnabled?: boolean
  maxFileSize?: number
  allowedMimeTypes?: string[]
  retentionHours?: number
  databaseConfig?: {
    maxConnections?: number
    connectionTimeoutMs?: number
    retryAttempts?: number
    enableMetrics?: boolean
  }
}

export interface UploadOptions {
  filename: string
  mimeType: string
  size: number
  userId?: string
  retentionHours?: number
  maxRetries?: number
}

export interface FileUploadResult {
  success: boolean
  fileId?: string
  uploadUrl?: string
  expiresIn?: number
  error?: string
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  allowedSize?: number
  actualSize?: number
  allowedMimeTypes?: string[]
  actualMimeType?: string
}

export interface FileStats {
  fileId: string
  filename: string
  size: number
  mimeType: string
  uploadedAt: number
  expiresAt: number
  isExpired: boolean
  downloadCount: number
}

export interface PresignedUrlOptions {
  fileId: string
  method: 'GET' | 'PUT' | 'DELETE'
  expiresIn?: number // seconds
  contentType?: string
}

export class FileService {
  private db: D1Database
  private client: DatabaseClient
  private r2: R2Bucket
  private kv: KVNamespace
  private auditEnabled: boolean
  private maxFileSize: number
  private allowedMimeTypes: string[]
  private retentionHours: number

  constructor(options: FileServiceOptions) {
    this.db = options.db
    this.client = createDatabaseClient(this.db, options.databaseConfig)
    this.r2 = options.r2
    this.kv = options.kv
    this.auditEnabled = options.auditEnabled ?? true
    this.maxFileSize = options.maxFileSize ?? 10 * 1024 * 1024 // 10MB default
    this.allowedMimeTypes = options.allowedMimeTypes ?? [
      'application/json',
      'text/plain',
      'text/csv',
      'application/xml',
      'text/xml',
      'application/javascript',
      'application/typescript',
      'text/html',
      'text/css',
      'text/markdown',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'application/zip',
      'application/x-zip-compressed',
    ]
    this.retentionHours = options.retentionHours ?? 72 // 3 days default
  }

  // File validation
  async validateFileUpload(
    options: UploadOptions
  ): Promise<FileValidationResult> {
    // Validate filename
    const filenameValidation = FileUpload.validateFilename(options.filename)
    if (!filenameValidation.valid) {
      return {
        valid: false,
        error: filenameValidation.error,
      }
    }

    // Validate MIME type
    const mimeTypeValidation = FileUpload.validateMimeType(
      options.mimeType,
      this.allowedMimeTypes
    )
    if (!mimeTypeValidation.valid) {
      return {
        valid: false,
        error: mimeTypeValidation.error,
        allowedMimeTypes: this.allowedMimeTypes,
        actualMimeType: options.mimeType,
      }
    }

    // Validate file size
    const sizeValidation = FileUpload.validateFileSize(
      options.size,
      this.maxFileSize
    )
    if (!sizeValidation.valid) {
      return {
        valid: false,
        error: sizeValidation.error,
        allowedSize: this.maxFileSize,
        actualSize: options.size,
      }
    }

    return {
      valid: true,
      allowedSize: this.maxFileSize,
      actualSize: options.size,
      allowedMimeTypes: this.allowedMimeTypes,
      actualMimeType: options.mimeType,
    }
  }

  // File upload flow
  async createUploadRequest(
    options: UploadOptions,
    ipAddress?: string,
    userAgent?: string
  ): Promise<FileUploadResult> {
    // Validate file
    const validation = await this.validateFileUpload(options)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    try {
      // Create file upload record
      const retentionHours = options.retentionHours ?? this.retentionHours
      const fileUpload = FileUpload.createForUpload(
        options.filename,
        options.mimeType,
        options.size,
        options.userId,
        { retentionHours }
      )

      // Save to database
      await this.saveFileUpload(fileUpload)

      // Generate presigned upload URL
      const uploadUrl = await this.generatePresignedUploadUrl(fileUpload)

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'file_upload',
          resource_type: 'file_upload',
          resource_id: fileUpload.id,
          new_values: {
            filename: options.filename,
            size: options.size,
            mime_type: options.mimeType,
          },
          ipAddress,
          userAgent,
        })
      }

      return {
        success: true,
        fileId: fileUpload.id,
        uploadUrl,
        expiresIn: 3600, // 1 hour
      }
    } catch (error) {
      console.error('Failed to create upload request:', error)
      return {
        success: false,
        error: 'Failed to create upload request',
      }
    }
  }

  async completeUpload(
    fileId: string,
    checksum?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const fileUpload = await this.getFileUploadById(fileId)
      if (!fileUpload) {
        throw new Error('File upload not found')
      }

      if (!fileUpload.isUploading) {
        throw new Error('File is not in uploading state')
      }

      // Verify file exists in R2
      const object = await this.r2.head(fileUpload.r2_key)
      if (!object) {
        throw new Error('File not found in storage')
      }

      // Verify checksum if provided
      if (checksum && fileUpload.checksum && checksum !== fileUpload.checksum) {
        throw new Error('File checksum mismatch')
      }

      // Update file upload record
      const completedUpload = fileUpload.complete(checksum)
      await this.updateFileUpload(completedUpload)

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'file_upload',
          resource_type: 'file_upload',
          resource_id: fileId,
          new_values: {
            status: 'completed',
            checksum: checksum,
          },
          ipAddress,
          userAgent,
        })
      }

      return true
    } catch (error) {
      console.error('Failed to complete upload:', error)
      return false
    }
  }

  async failUpload(
    fileId: string,
    errorMessage: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const fileUpload = await this.getFileUploadById(fileId)
      if (!fileUpload) {
        return
      }

      // Update file upload record
      const failedUpload = fileUpload.fail()
      await this.updateFileUpload(failedUpload)

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'file_upload',
          resource_type: 'file_upload',
          resource_id: fileId,
          new_values: {
            status: 'failed',
            error: errorMessage,
          },
          ipAddress,
          userAgent,
          success: false,
        })
      }
    } catch (error) {
      console.error('Failed to fail upload:', error)
    }
  }

  // File download and access
  async getFileUploadById(fileId: string): Promise<FileUpload | null> {
    try {
      const result = await this.client.queryFirst(
        FILE_UPLOAD_QUERIES.SELECT_BY_ID,
        [fileId]
      )

      if (!result) {
        return null
      }

      return FileUpload.fromRow(result)
    } catch (error) {
      console.error('Failed to get file upload:', error)
      return null
    }
  }

  async getPresignedDownloadUrl(
    fileId: string,
    expiresIn = 3600
  ): Promise<string | null> {
    const fileUpload = await this.getFileUploadById(fileId)
    if (!fileUpload || !fileUpload.isAccessible) {
      return null
    }

    try {
      return await this.generatePresignedDownloadUrl(fileUpload, expiresIn)
    } catch (error) {
      console.error('Failed to generate download URL:', error)
      return null
    }
  }

  async downloadFile(fileId: string): Promise<{
    success: boolean
    data?: ArrayBuffer
    contentType?: string
    filename?: string
    error?: string
  }> {
    const fileUpload = await this.getFileUploadById(fileId)
    if (!fileUpload) {
      return { success: false, error: 'File not found' }
    }

    if (!fileUpload.isAccessible) {
      return { success: false, error: 'File is not accessible' }
    }

    try {
      const object = await this.r2.get(fileUpload.r2_key)
      if (!object) {
        return { success: false, error: 'File not found in storage' }
      }

      const data = await object.arrayBuffer()

      // Log download event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'file_download',
          resource_type: 'file_upload',
          resource_id: fileId,
          new_values: { filename: fileUpload.filename },
          ipAddress: 'system',
          userAgent: 'file-service',
        })
      }

      return {
        success: true,
        data,
        contentType: fileUpload.mime_type,
        filename: fileUpload.filename,
      }
    } catch (error) {
      console.error('Failed to download file:', error)
      return {
        success: false,
        error: 'Failed to download file',
      }
    }
  }

  // File management
  async deleteFile(
    fileId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const fileUpload = await this.getFileUploadById(fileId)
    if (!fileUpload) {
      return false
    }

    try {
      // Delete from R2
      await this.r2.delete(fileUpload.r2_key)

      // Update database record
      await this.client.execute(FILE_UPLOAD_QUERIES.DELETE, [fileId])

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'data_delete',
          resource_type: 'file_upload',
          resource_id: fileId,
          old_values: {
            filename: fileUpload.filename,
            size: fileUpload.size_bytes,
          },
          ipAddress,
          userAgent,
        })
      }

      return true
    } catch (error) {
      console.error('Failed to delete file:', error)
      return false
    }
  }

  async extendFileRetention(
    fileId: string,
    additionalHours: number
  ): Promise<boolean> {
    const fileUpload = await this.getFileUploadById(fileId)
    if (!fileUpload) {
      return false
    }

    try {
      const extendedUpload = fileUpload.extendExpiration(additionalHours)
      await this.updateFileUpload(extendedUpload)

      return true
    } catch (error) {
      console.error('Failed to extend file retention:', error)
      return false
    }
  }

  // File listing and search
  async getFilesByUser(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<FileUpload[]> {
    try {
      const now = Math.floor(Date.now() / 1000)
      const result = await this.client.query(
        FILE_UPLOAD_QUERIES.SELECT_COMPLETED_BY_USER,
        [userId, now, limit, offset]
      )

      return result.map(row => FileUpload.fromRow(row))
    } catch (error) {
      console.error('Failed to get files by user:', error)
      return []
    }
  }

  async getExpiredFiles(): Promise<FileUpload[]> {
    try {
      const stmt = this.db.prepare(FILE_UPLOAD_QUERIES.SELECT_EXPIRED)
      const result = await stmt.all()

      return result.results.map(row => FileUpload.fromRow(row))
    } catch (error) {
      console.error('Failed to get expired files:', error)
      return []
    }
  }

  async searchFiles(query: string, userId?: string): Promise<FileUpload[]> {
    try {
      let stmt: D1PreparedStatement
      let result: D1Result<any>

      if (userId) {
        stmt = this.db.prepare(`
          SELECT * FROM file_uploads
          WHERE user_id = ? AND (filename LIKE ? OR mime_type LIKE ?)
          ORDER BY created_at DESC
          LIMIT 50
        `)
        const searchQuery = `%${query}%`
        result = await stmt.bind(userId, searchQuery, searchQuery).all()
      } else {
        stmt = this.db.prepare(`
          SELECT * FROM file_uploads
          WHERE filename LIKE ? OR mime_type LIKE ?
          ORDER BY created_at DESC
          LIMIT 50
        `)
        const searchQuery = `%${query}%`
        result = await stmt.bind(searchQuery, searchQuery).all()
      }

      return result.results.map(row => FileUpload.fromRow(row))
    } catch (error) {
      console.error('Failed to search files:', error)
      return []
    }
  }

  // File statistics and analytics
  async getFileStats(fileId: string): Promise<FileStats | null> {
    const fileUpload = await this.getFileUploadById(fileId)
    if (!fileUpload) {
      return null
    }

    return {
      fileId: fileUpload.id,
      filename: fileUpload.filename,
      size: fileUpload.size_bytes,
      mimeType: fileUpload.mime_type,
      uploadedAt: fileUpload.created_at,
      expiresAt: fileUpload.expires_at || 0,
      isExpired: fileUpload.isExpired,
      downloadCount: 0, // TODO: Implement download tracking
    }
  }

  async getUserStorageStats(userId: string): Promise<{
    totalFiles: number
    totalSize: number
    expiredFiles: number
    storageUsed: number
    storageLimit: number
  }> {
    try {
      const stmt = this.db.prepare(FILE_UPLOAD_QUERIES.SUM_SIZE_BY_USER)
      const result = await stmt.bind(userId).first()

      const totalSize = result?.total_size_bytes || 0
      const totalFiles = result?.file_count || 0

      // Get expired files count
      const expiredStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM file_uploads
        WHERE user_id = ? AND (expires_at IS NOT NULL AND expires_at < ?)
      `)
      const now = Math.floor(Date.now() / 1000)
      const expiredResult = await expiredStmt.bind(userId, now).first()
      const expiredFiles = expiredResult?.count || 0

      // Calculate storage limit based on user tier (this would come from user service)
      const storageLimit = 50 * 1024 * 1024 // 50MB default

      return {
        totalFiles,
        totalSize,
        expiredFiles,
        storageUsed: totalSize,
        storageLimit,
      }
    } catch (error) {
      console.error('Failed to get user storage stats:', error)
      return {
        totalFiles: 0,
        totalSize: 0,
        expiredFiles: 0,
        storageUsed: 0,
        storageLimit: 50 * 1024 * 1024,
      }
    }
  }

  async getStorageAnalytics(): Promise<{
    totalFiles: number
    totalSize: number
    anonymousFiles: number
    userFiles: number
    expiredFiles: number
    avgFileSize: number
    topMimeTypes: Array<{ mimeType: string; count: number; size: number }>
  }> {
    try {
      const analyticsStmt = this.db.prepare(
        FILE_UPLOAD_QUERIES.STORAGE_ANALYTICS
      )
      const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
      const result = await analyticsStmt.bind(sevenDaysAgo).all()

      if (!result.results.length) {
        return {
          totalFiles: 0,
          totalSize: 0,
          anonymousFiles: 0,
          userFiles: 0,
          expiredFiles: 0,
          avgFileSize: 0,
          topMimeTypes: [],
        }
      }

      const stats = result.results[0]
      const totalFiles = stats.total_files || 0
      const totalSize = stats.total_size_bytes || 0
      const completedFiles = stats.completed_files || 0
      const uploadingFiles = stats.uploading_files || 0

      return {
        totalFiles,
        totalSize,
        anonymousFiles: stats.anonymous_requests || 0,
        userFiles: totalFiles - (stats.anonymous_requests || 0),
        expiredFiles: stats.failed_files || 0,
        avgFileSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
        topMimeTypes: [], // TODO: Implement MIME type analytics
      }
    } catch (error) {
      console.error('Failed to get storage analytics:', error)
      return {
        totalFiles: 0,
        totalSize: 0,
        anonymousFiles: 0,
        userFiles: 0,
        expiredFiles: 0,
        avgFileSize: 0,
        topMimeTypes: [],
      }
    }
  }

  // Cleanup operations
  async cleanupExpiredFiles(): Promise<number> {
    const expiredFiles = await this.getExpiredFiles()
    let deletedCount = 0

    for (const fileUpload of expiredFiles) {
      try {
        // Delete from R2
        await this.r2.delete(fileUpload.r2_key)

        // Mark as expired in database
        const expiredUpload = fileUpload.expire()
        await this.updateFileUpload(expiredUpload)

        deletedCount++
      } catch (error) {
        console.error(`Failed to cleanup expired file ${fileUpload.id}:`, error)
      }
    }

    // Also cleanup database records for very old expired files
    const cutoffTime = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60 // 7 days ago
    try {
      const stmt = this.db.prepare(FILE_UPLOAD_QUERIES.DELETE_EXPIRED_FILES)
      const result = await stmt.bind(cutoffTime).run()
      deletedCount += result.changes || 0
    } catch (error) {
      console.error('Failed to cleanup expired database records:', error)
    }

    return deletedCount
  }

  // Private helper methods
  private async saveFileUpload(fileUpload: FileUpload): Promise<void> {
    try {
      await this.client.execute(FILE_UPLOAD_QUERIES.INSERT, [
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
      ])
    } catch (error) {
      throw new Error(`Failed to save file upload: ${error}`)
    }
  }

  private async updateFileUpload(fileUpload: FileUpload): Promise<void> {
    try {
      await this.client.execute(FILE_UPLOAD_QUERIES.UPDATE, [
        fileUpload.filename,
        fileUpload.mime_type,
        fileUpload.size_bytes,
        fileUpload.r2_key,
        fileUpload.checksum,
        fileUpload.status,
        fileUpload.expires_at,
        fileUpload.id,
      ])
    } catch (error) {
      throw new Error(`Failed to update file upload: ${error}`)
    }
  }

  private async generatePresignedUploadUrl(
    fileUpload: FileUpload
  ): Promise<string> {
    // In production, use R2's presigned URL API
    // For now, return a mock URL that would be generated by the actual implementation
    const baseUrl = 'https://upload.r2.cloudflarestorage.com'
    const expires = Math.floor(Date.now() / 1000) + 3600 // 1 hour
    const signature = await this.generateSignature(
      fileUpload.r2_key,
      'PUT',
      expires
    )

    return `${baseUrl}/${fileUpload.r2_key}?expires=${expires}&signature=${signature}`
  }

  private async generatePresignedDownloadUrl(
    fileUpload: FileUpload,
    expiresIn: number
  ): Promise<string> {
    // In production, use R2's presigned URL API
    const baseUrl = 'https://download.r2.cloudflarestorage.com'
    const expires = Math.floor(Date.now() / 1000) + expiresIn
    const signature = await this.generateSignature(
      fileUpload.r2_key,
      'GET',
      expires
    )

    return `${baseUrl}/${fileUpload.r2_key}?expires=${expires}&signature=${signature}`
  }

  private async generateSignature(
    key: string,
    method: string,
    expires: number
  ): Promise<string> {
    // Generate HMAC signature for presigned URL
    const message = `${method}\n${key}\n${expires}`
    const encoder = new TextEncoder()
    const keyData = encoder.encode(this.r2.toString()) // In production, use proper secret
    const messageData = encoder.encode(message)

    const signature = await crypto.subtle
      .importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, [
        'sign',
      ])
      .then(key => crypto.subtle.sign('HMAC', key, messageData))
      .then(sig => btoa(String.fromCharCode(...new Uint8Array(sig))))

    return signature as string
  }

  private async logAudit(options: {
    action: string
    resource_type: string
    resource_id: string
    old_values?: Record<string, any>
    new_values?: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    if (!this.auditEnabled) return

    try {
      const auditLog = AuditLog.create({
        user_id: undefined, // File operations may be anonymous
        action: options.action as any,
        resource_type: options.resource_type as any,
        resource_id: options.resource_id,
        old_values: options.old_values || null,
        new_values: options.new_values || null,
        ip_address: options.ipAddress || null,
        user_agent: options.userAgent || null,
        success: true,
      })

      await this.client.execute(AUDIT_LOG_QUERIES.INSERT, [
        auditLog.id,
        auditLog.user_id,
        auditLog.action,
        auditLog.resource_type,
        auditLog.resource_id,
        auditLog.old_values ? JSON.stringify(auditLog.old_values) : null,
        auditLog.new_values ? JSON.stringify(auditLog.new_values) : null,
        auditLog.ip_address,
        auditLog.user_agent,
        auditLog.success,
        auditLog.error_message,
        auditLog.created_at,
      ])
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  // Utility methods
  async getFileMimeType(fileId: string): Promise<string | null> {
    const fileUpload = await this.getFileUploadById(fileId)
    return fileUpload?.mime_type || null
  }

  async getFileSize(fileId: string): Promise<number> {
    const fileUpload = await this.getFileUploadById(fileId)
    return fileUpload?.size_bytes || 0
  }

  async isFileExpired(fileId: string): Promise<boolean> {
    const fileUpload = await this.getFileUploadById(fileId)
    return fileUpload?.isExpired || false
  }

  async isFileAccessible(fileId: string): Promise<boolean> {
    const fileUpload = await this.getFileUploadById(fileId)
    return fileUpload?.isAccessible || false
  }
}

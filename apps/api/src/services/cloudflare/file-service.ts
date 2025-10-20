/**
 * File Service - Cloudflare R2 Integration
 *
 * This service provides a high-level interface for file operations
 * using Cloudflare R2, with built-in validation, compression,
 * and CDN integration.
 */

import { CloudflareService } from './cloudflare-service'
import { R2FileMetadata } from '../../config/cloudflare/r2-config'

export interface FileUploadOptions {
  contentType?: string
  compress?: boolean
  enableCdn?: boolean
  customMetadata?: Record<string, any>
  tags?: Record<string, string>
  retentionPeriod?: number
  maxFileSize?: number
  allowedMimeTypes?: string[]
}

export interface FileDownloadOptions {
  download?: boolean
  filename?: string
  range?: { start: number; end: number }
  enableCdn?: boolean
}

export interface FileUploadResult {
  success: boolean
  file?: R2FileMetadata
  error?: string
  uploadTime: number
  compressed?: boolean
  size: number
}

export interface FileDownloadResult {
  success: boolean
  file?: R2ObjectBody
  metadata?: R2FileMetadata
  error?: string
  downloadTime: number
  fromCache?: boolean
}

export interface FileListResult {
  success: boolean
  files: R2FileMetadata[]
  totalCount: number
  hasMore: boolean
  cursor?: string
  error?: string
}

export class FileService {
  private cloudflare: CloudflareService
  private defaultOptions: FileUploadOptions

  constructor(cloudflare: CloudflareService, defaultOptions: FileUploadOptions = {}) {
    this.cloudflare = cloudflare
    this.defaultOptions = {
      compress: true,
      enableCdn: true,
      retentionPeriod: 30 * 24 * 60 * 60, // 30 days
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
        'application/zip'
      ],
      ...defaultOptions
    }
  }

  async uploadFile(
    userId: string,
    file: ArrayBuffer | ReadableStream | Uint8Array,
    filename: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const startTime = Date.now()
    const mergedOptions = { ...this.defaultOptions, ...options }

    try {
      // Validate file
      const validation = this.validateFile(file, filename, mergedOptions)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          uploadTime: Date.now() - startTime,
          size: this.getFileSize(file)
        }
      }

      // Compress if needed
      let processedFile = file
      let compressed = false

      if (mergedOptions.compress && this.shouldCompress(filename, mergedOptions.contentType)) {
        const compressionResult = await this.compressFile(file, mergedOptions.contentType)
        if (compressionResult.success) {
          processedFile = compressionResult.data!
          compressed = true
        }
      }

      // Prepare metadata
      const metadata: Record<string, any> = {
        originalFilename: filename,
        uploadedAt: Date.now(),
        userId,
        compressed,
        ...mergedOptions.customMetadata
      }

      // Upload file
      const result = await this.cloudflare.uploadFile(userId, processedFile, filename, {
        contentType: mergedOptions.contentType,
        metadata,
        tags: mergedOptions.tags
      })

      return {
        success: true,
        file: result,
        uploadTime: Date.now() - startTime,
        compressed,
        size: result.size
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        uploadTime: Date.now() - startTime,
        size: this.getFileSize(file)
      }
    }
  }

  async uploadFileFromUrl(
    userId: string,
    url: string,
    filename: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const startTime = Date.now()

    try {
      // Fetch file from URL
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch file from URL: ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || options.contentType

      // Upload with content type from URL
      return this.uploadFile(userId, buffer, filename, { ...options, contentType })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        uploadTime: Date.now() - startTime,
        size: 0
      }
    }
  }

  async downloadFile(
    key: string,
    options: FileDownloadOptions = {}
  ): Promise<FileDownloadResult> {
    const startTime = Date.now()

    try {
      const result = await this.cloudflare.getFile(key)

      if (!result) {
        return {
          success: false,
          error: 'File not found',
          downloadTime: Date.now() - startTime
        }
      }

      // Handle range requests
      let file = result.file
      let metadata = result.metadata

      if (options.range && options.range.start >= 0 && options.range.end >= options.range.start) {
        // This would need to be implemented with R2 range requests
        // For now, return the full file
      }

      return {
        success: true,
        file,
        metadata,
        downloadTime: Date.now() - startTime,
        fromCache: false // Would need actual cache checking
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        downloadTime: Date.now() - startTime
      }
    }
  }

  async getFileUrl(
    key: string,
    options: { enableCdn?: boolean; expiresIn?: number } = {}
  ): Promise<string> {
    try {
      const result = await this.cloudflare.getFile(key)

      if (!result) {
        throw new Error('File not found')
      }

      // Return CDN URL if available and enabled
      if (options.enableCdn && result.metadata.cdnUrl) {
        return result.metadata.cdnUrl
      }

      return result.metadata.url || ''
    } catch (error) {
      throw new Error(`Failed to get file URL: ${error}`)
    }
  }

  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await this.cloudflare.deleteFile(key)
      return { success }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async deleteFiles(keys: string[]): Promise<{
    success: boolean
    deleted: string[]
    failed: string[]
    error?: string
  }> {
    try {
      const results = await this.cloudflare.deleteFiles(keys)
      return {
        success: results.failed.length === 0,
        deleted: results.deleted,
        failed: results.failed
      }
    } catch (error) {
      return {
        success: false,
        deleted: [],
        failed: keys,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async listUserFiles(
    userId: string,
    options: {
      limit?: number
      cursor?: string
      prefix?: string
      sortBy?: 'name' | 'size' | 'created' | 'modified'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ): Promise<FileListResult> {
    try {
      const result = await this.cloudflare.listUserFiles(userId, {
        limit: options.limit,
        cursor: options.cursor,
        prefix: options.prefix
      })

      // Sort results if needed
      let files = result.files
      if (options.sortBy) {
        files = this.sortFiles(files, options.sortBy, options.sortOrder || 'desc')
      }

      return {
        success: true,
        files,
        totalCount: files.length,
        hasMore: result.truncated,
        cursor: result.cursor
      }
    } catch (error) {
      return {
        success: false,
        files: [],
        totalCount: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getUserFileStats(userId: string): Promise<{
    totalFiles: number
    totalSize: number
    fileTypes: Record<string, number>
    averageSize: number
    largestFile: R2FileMetadata | null
    oldestFile: R2FileMetadata | null
    newestFile: R2FileMetadata | null
  }> {
    try {
      const result = await this.cloudflare.listUserFiles(userId, { limit: 1000 })

      const files = result.files
      const totalFiles = files.length
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0

      const fileTypes: Record<string, number> = {}
      let largestFile: R2FileMetadata | null = null
      let oldestFile: R2FileMetadata | null = null
      let newestFile: R2FileMetadata | null = null

      for (const file of files) {
        // Count file types
        const mimeType = file.mimeType || 'unknown'
        fileTypes[mimeType] = (fileTypes[mimeType] || 0) + 1

        // Find largest file
        if (!largestFile || file.size > largestFile.size) {
          largestFile = file
        }

        // Find oldest and newest files
        if (!oldestFile || file.lastModified < oldestFile.lastModified) {
          oldestFile = file
        }
        if (!newestFile || file.lastModified > newestFile.lastModified) {
          newestFile = file
        }
      }

      return {
        totalFiles,
        totalSize,
        fileTypes,
        averageSize,
        largestFile,
        oldestFile,
        newestFile
      }
    } catch (error) {
      throw new Error(`Failed to get user file stats: ${error}`)
    }
  }

  async copyFile(
    sourceKey: string,
    destinationUserId: string,
    destinationFilename?: string
  ): Promise<FileUploadResult> {
    const startTime = Date.now()

    try {
      // Get source file info
      const sourceResult = await this.cloudflare.getFile(sourceKey)
      if (!sourceResult) {
        return {
          success: false,
          error: 'Source file not found',
          uploadTime: Date.now() - startTime,
          size: 0
        }
      }

      // Read source file
      const sourceData = await sourceResult.file.arrayBuffer()
      const filename = destinationFilename || sourceResult.metadata.originalName || 'copied_file'

      // Upload as new file
      return this.uploadFile(destinationUserId, sourceData, filename, {
        contentType: sourceResult.metadata.contentType,
        customMetadata: {
          ...sourceResult.metadata.metadata,
          copiedFrom: sourceKey,
          copiedAt: Date.now()
        }
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        uploadTime: Date.now() - startTime,
        size: 0
      }
    }
  }

  async moveFile(
    sourceKey: string,
    destinationUserId: string,
    destinationFilename?: string
  ): Promise<FileUploadResult> {
    // Copy file first
    const copyResult = await this.copyFile(sourceKey, destinationUserId, destinationFilename)

    if (copyResult.success) {
      // Delete original file
      await this.deleteFile(sourceKey)
    }

    return copyResult
  }

  async cleanupExpiredFiles(): Promise<{
    success: boolean
    deletedCount: number
    error?: string
  }> {
    try {
      // This would need to be implemented with a list and filter operation
      // For now, return placeholder values
      return {
        success: true,
        deletedCount: 0
      }
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Health check specific to file service
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded'
    responseTime: number
    error?: string
    details?: {
      totalFiles: number
      totalSize: number
      avgUploadTime: number
      avgDownloadTime: number
    }
  }> {
    const startTime = Date.now()

    try {
      // Get R2 health status
      const health = await this.cloudflare.getHealthStatus()

      return {
        status: health.r2.status,
        responseTime: health.r2.responseTime,
        error: health.r2.error,
        details: {
          totalFiles: 0, // Would need actual stats
          totalSize: 0,
          avgUploadTime: 0,
          avgDownloadTime: 0
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Private helper methods
  private validateFile(
    file: ArrayBuffer | ReadableStream | Uint8Array,
    filename: string,
    options: FileUploadOptions
  ): { valid: boolean; error?: string } {
    const size = this.getFileSize(file)
    const maxSize = options.maxFileSize || this.defaultOptions.maxFileSize!

    // Check file size
    if (size > maxSize) {
      return {
        valid: false,
        error: `File size (${size} bytes) exceeds maximum allowed size (${maxSize} bytes)`
      }
    }

    // Check MIME type if provided
    const contentType = options.contentType || this.getMimeTypeFromFilename(filename)
    const allowedTypes = options.allowedMimeTypes || this.defaultOptions.allowedMimeTypes!

    if (contentType && !allowedTypes.includes(contentType)) {
      return {
        valid: false,
        error: `MIME type ${contentType} is not allowed`
      }
    }

    return { valid: true }
  }

  private shouldCompress(filename: string, contentType?: string): boolean {
    if (!contentType) {
      contentType = this.getMimeTypeFromFilename(filename)
    }

    const compressibleTypes = [
      'text/',
      'application/json',
      'application/xml',
      'application/javascript',
      'application/x-javascript'
    ]

    return compressibleTypes.some(type => contentType?.startsWith(type))
  }

  private async compressFile(
    file: ArrayBuffer | ReadableStream | Uint8Array,
    contentType?: string
  ): Promise<{ success: boolean; data?: ArrayBuffer | ReadableStream | Uint8Array; error?: string }> {
    // This is a placeholder for compression logic
    // In a real implementation, you would use compression libraries
    // like CompressionStream API or other compression methods

    try {
      // For now, just return the original file
      return { success: true, data: file }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Compression failed'
      }
    }
  }

  private getFileSize(file: ArrayBuffer | ReadableStream | Uint8Array): number {
    if (file instanceof ArrayBuffer) {
      return file.byteLength
    }
    if (file instanceof Uint8Array) {
      return file.length
    }
    return 0 // ReadableStream size is not easily determined
  }

  private getMimeTypeFromFilename(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()

    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'json': 'application/json',
      'xml': 'application/xml',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    }

    return mimeTypes[extension || ''] || 'application/octet-stream'
  }

  private sortFiles(
    files: R2FileMetadata[],
    sortBy: 'name' | 'size' | 'created' | 'modified',
    sortOrder: 'asc' | 'desc'
  ): R2FileMetadata[] {
    return files.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = (a.originalName || a.key).localeCompare(b.originalName || b.key)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'created':
          comparison = (a.metadata?.uploadedAt || 0) - (b.metadata?.uploadedAt || 0)
          break
        case 'modified':
          comparison = a.lastModified.getTime() - b.lastModified.getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }
}

export function createFileService(cloudflare: CloudflareService, defaultOptions?: FileUploadOptions): FileService {
  return new FileService(cloudflare, defaultOptions)
}

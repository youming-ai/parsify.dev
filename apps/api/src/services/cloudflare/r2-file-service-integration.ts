/**
 * R2 File Service Integration
 *
 * This module integrates the enhanced R2 storage service with the existing
 * FileService, providing a unified interface for file operations while
 * maintaining backward compatibility and adding new capabilities.
 */

import { getR2Config, type R2Config } from '../../config/cloudflare/r2-config'
import { createDatabaseClient } from '../../database'
import { FileService, type FileServiceOptions, type UploadOptions } from '../file_service'
import {
  type CdnUrlOptions,
  type DownloadStreamOptions,
  type R2StorageOptions,
  R2StorageService,
  type UploadStreamOptions,
} from './r2-storage'

export interface EnhancedFileServiceOptions extends FileServiceOptions {
  enableR2Storage?: boolean
  r2Config?: R2Config
  enableStreaming?: boolean
  enableCdnIntegration?: boolean
  chunkSize?: number
  maxConcurrentOperations?: number
}

export interface EnhancedUploadOptions extends UploadOptions {
  useStreaming?: boolean
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  chunkSize?: number
  enableResumable?: boolean
  generateCdnUrl?: boolean
  cdnOptions?: CdnUrlOptions
}

export interface EnhancedDownloadOptions {
  useStreaming?: boolean
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  range?: { start: number; end?: number }
  preferCdn?: boolean
}

export interface FileOperationResult {
  success: boolean
  fileId?: string
  url?: string
  cdnUrl?: string
  metadata?: any
  error?: string
  operation?: any
}

export class EnhancedFileService extends FileService {
  private r2StorageService: R2StorageService | null = null
  private r2Config: R2Config
  private enableR2Storage: boolean
  private enableStreaming: boolean
  private enableCdnIntegration: boolean

  constructor(options: EnhancedFileServiceOptions) {
    super(options)

    this.enableR2Storage = options.enableR2Storage ?? true
    this.enableStreaming = options.enableStreaming ?? true
    this.enableCdnIntegration = options.enableCdnIntegration ?? true

    this.r2Config = options.r2Config || getR2Config()

    if (this.enableR2Storage && this.r2) {
      this.initializeR2StorageService(options)
    }
  }

  private initializeR2StorageService(options: EnhancedFileServiceOptions): void {
    const databaseClient = createDatabaseClient(this.db, options.databaseConfig)

    const r2Options: R2StorageOptions = {
      bucket: this.r2,
      config: this.r2Config,
      database: databaseClient,
      enableHealthMonitoring: true,
      retryAttempts: 3,
      retryDelay: 1000,
    }

    this.r2StorageService = new R2StorageService(r2Options)
  }

  /**
   * Enhanced upload with streaming support and progress tracking
   */
  async uploadFileEnhanced(
    file: File | ArrayBuffer | ReadableStream | Uint8Array,
    filename: string,
    options: EnhancedUploadOptions = {}
  ): Promise<FileOperationResult> {
    if (!this.r2StorageService || !this.enableStreaming) {
      // Fallback to legacy upload
      return this.uploadFileLegacy(file, filename, options)
    }

    try {
      const uploadOptions: UploadStreamOptions = {
        userId: options.userId,
        fileId: options.maxRetries ? crypto.randomUUID() : undefined,
        contentType: options.mimeType,
        metadata: {
          ...options.metadata,
          userAgent: options.userAgent,
          ipAddress: options.ipAddress,
        },
        tags: {
          source: 'enhanced-upload',
          userId: options.userId || 'anonymous',
        },
        cacheControl: this.generateCacheControl(filename),
        contentDisposition: this.generateContentDisposition(filename),
        onProgress: options.onProgress
          ? progress => {
              options.onProgress?.({
                loaded: progress.loaded,
                total: progress.total,
                percentage: progress.percentage,
              })
            }
          : undefined,
        chunkSize: options.chunkSize || 1024 * 1024, // 1MB
        enableResumable: options.enableResumable ?? true,
      }

      const result = await this.r2StorageService.uploadFile(file, filename, uploadOptions)

      let cdnUrl: string | undefined
      if (options.generateCdnUrl && this.enableCdnIntegration) {
        cdnUrl =
          this.r2StorageService.generateCdnUrl(result.fileUpload.id, options.cdnOptions) ||
          undefined
      }

      return {
        success: true,
        fileId: result.fileUpload.id,
        url: result.metadata.url,
        cdnUrl,
        metadata: {
          ...result.metadata,
          fileUpload: result.fileUpload,
        },
        operation: result.operation,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  /**
   * Enhanced download with streaming support and progress tracking
   */
  async downloadFileEnhanced(
    fileId: string,
    options: EnhancedDownloadOptions = {}
  ): Promise<{
    success: boolean
    stream?: ReadableStream
    data?: ArrayBuffer
    metadata?: any
    error?: string
  }> {
    if (!this.r2StorageService || !this.enableStreaming) {
      // Fallback to legacy download
      return this.downloadFileLegacy(fileId, options)
    }

    try {
      const downloadOptions: DownloadStreamOptions = {
        range: options.range,
        onProgress: options.onProgress
          ? progress => {
              options.onProgress?.({
                loaded: progress.loaded,
                total: progress.total,
                percentage: progress.percentage,
              })
            }
          : undefined,
      }

      const result = await this.r2StorageService.downloadFile(fileId, downloadOptions)

      return {
        success: true,
        stream: result.stream,
        metadata: {
          ...result.metadata,
          fileUpload: result.fileUpload,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      }
    }
  }

  /**
   * Generate CDN URL for file
   */
  generateCdnUrl(fileId: string, options: CdnUrlOptions = {}): string | null {
    if (!this.r2StorageService || !this.enableCdnIntegration) {
      return null
    }

    return this.r2StorageService.generateCdnUrl(fileId, options)
  }

  /**
   * Copy file with enhanced capabilities
   */
  async copyFileEnhanced(
    sourceFileId: string,
    newFilename: string,
    options: {
      userId?: string
      metadata?: Record<string, any>
      generateCdnUrl?: boolean
      cdnOptions?: CdnUrlOptions
    } = {}
  ): Promise<FileOperationResult> {
    if (!this.r2StorageService) {
      throw new Error('R2 storage service not available')
    }

    try {
      const result = await this.r2StorageService.copyFile(sourceFileId, newFilename, options)

      let cdnUrl: string | undefined
      if (options.generateCdnUrl && this.enableCdnIntegration) {
        cdnUrl =
          this.r2StorageService.generateCdnUrl(result.fileUpload.id, options.cdnOptions) ||
          undefined
      }

      return {
        success: true,
        fileId: result.fileUpload.id,
        url: result.metadata.url,
        cdnUrl,
        metadata: result.metadata,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Copy failed',
      }
    }
  }

  /**
   * Batch operations with enhanced capabilities
   */
  async uploadFilesEnhanced(
    files: Array<{
      file: File | ArrayBuffer | ReadableStream | Uint8Array
      filename: string
      options?: EnhancedUploadOptions
    }>,
    options: {
      maxConcurrent?: number
      onProgress?: (
        fileId: string,
        progress: { loaded: number; total: number; percentage: number }
      ) => void
      onFileComplete?: (result: FileOperationResult) => void
    } = {}
  ): Promise<FileOperationResult[]> {
    const maxConcurrent = options.maxConcurrent || 3
    const results: FileOperationResult[] = []
    const queue = [...files]
    const active = new Set<string>()

    const processNext = async (): Promise<void> => {
      if (queue.length === 0 || active.size >= maxConcurrent) {
        return
      }

      const item = queue.shift()
      if (!item) return

      const fileId = crypto.randomUUID()
      active.add(fileId)

      try {
        const result = await this.uploadFileEnhanced(item.file, item.filename, {
          ...item.options,
          onProgress: progress => {
            options.onProgress?.(fileId, progress)
            item.options?.onProgress?.(progress)
          },
        })

        results.push(result)
        options.onFileComplete?.(result)
      } catch (error) {
        const errorResult: FileOperationResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        }
        results.push(errorResult)
        options.onFileComplete?.(errorResult)
      } finally {
        active.delete(fileId)
        // Process next in queue
        if (queue.length > 0) {
          await processNext()
        }
      }
    }

    // Start initial batch
    const initialPromises = Array(Math.min(maxConcurrent, files.length))
      .fill(null)
      .map(() => processNext())

    await Promise.all(initialPromises)

    return results
  }

  /**
   * Get enhanced storage statistics
   */
  async getEnhancedStorageStats(userId?: string): Promise<{
    basic: any
    r2: any
    health: any
  }> {
    const basic = await this.getUserStorageStats(userId || 'system')

    let r2 = null
    let health = null

    if (this.r2StorageService) {
      r2 = await this.r2StorageService.getStorageStats(userId)
      health = this.r2StorageService.getHealthStatus()
    }

    return {
      basic,
      r2,
      health,
    }
  }

  /**
   * Get operation status
   */
  getOperationStatus(operationId: string): any {
    return this.r2StorageService?.getOperationStatus(operationId) || null
  }

  /**
   * Cancel operation
   */
  async cancelOperation(operationId: string): Promise<boolean> {
    if (!this.r2StorageService) {
      return false
    }

    return this.r2StorageService.cancelOperation(operationId)
  }

  /**
   * Cleanup expired files with enhanced capabilities
   */
  async cleanupExpiredFilesEnhanced(): Promise<{
    basic: number
    r2: { deleted: number; errors: number }
  }> {
    const basicDeleted = await this.cleanupExpiredFiles()

    let r2Result = { deleted: 0, errors: 0 }
    if (this.r2StorageService) {
      r2Result = await this.r2StorageService.cleanupExpiredFiles()
    }

    return {
      basic: basicDeleted,
      r2: r2Result,
    }
  }

  // Legacy fallback methods
  private async uploadFileLegacy(
    file: File | ArrayBuffer | ReadableStream | Uint8Array,
    filename: string,
    options: EnhancedUploadOptions
  ): Promise<FileOperationResult> {
    try {
      let fileSize = 0
      let mimeType = options.mimeType

      if (file instanceof File) {
        fileSize = file.size
        mimeType = file.type
      } else if (file instanceof ArrayBuffer) {
        fileSize = file.byteLength
      } else if (file instanceof Uint8Array) {
        fileSize = file.length
      }

      const uploadResult = await this.createUploadRequest(
        {
          filename,
          mimeType: mimeType || 'application/octet-stream',
          size: fileSize,
          userId: options.userId,
        },
        options.ipAddress,
        options.userAgent
      )

      if (!uploadResult.success || !uploadResult.fileId || !uploadResult.uploadUrl) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to create upload request',
        }
      }

      // Upload file to the presigned URL
      let uploadData: ArrayBuffer
      if (file instanceof ArrayBuffer) {
        uploadData = file
      } else if (file instanceof Uint8Array) {
        uploadData = file.buffer
      } else if (file instanceof File) {
        uploadData = await file.arrayBuffer()
      } else {
        // Handle ReadableStream
        const reader = file.getReader()
        const chunks: Uint8Array[] = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) chunks.push(value)
        }
        reader.releaseLock()

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        uploadData = new Uint8Array(totalLength).buffer
        const view = new Uint8Array(uploadData)
        let offset = 0
        for (const chunk of chunks) {
          view.set(chunk, offset)
          offset += chunk.length
        }
      }

      const response = await fetch(uploadResult.uploadUrl, {
        method: 'PUT',
        body: uploadData,
        headers: {
          'Content-Type': mimeType || 'application/octet-stream',
        },
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      // Complete the upload
      const completed = await this.completeUpload(
        uploadResult.fileId,
        undefined,
        options.ipAddress,
        options.userAgent
      )

      if (!completed) {
        throw new Error('Failed to complete upload')
      }

      return {
        success: true,
        fileId: uploadResult.fileId,
        url: uploadResult.uploadUrl,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  private async downloadFileLegacy(
    fileId: string,
    _options: EnhancedDownloadOptions
  ): Promise<{
    success: boolean
    data?: ArrayBuffer
    metadata?: any
    error?: string
  }> {
    const result = await this.downloadFile(fileId)

    if (result.success) {
      return {
        success: true,
        data: result.data,
        metadata: {
          contentType: result.contentType,
          filename: result.filename,
        },
      }
    }

    return {
      success: false,
      error: result.error,
    }
  }

  // Helper methods
  private generateCacheControl(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const documentExtensions = ['pdf', 'doc', 'docx']
    const textExtensions = ['txt', 'md', 'json', 'csv']

    if (imageExtensions.includes(extension || '')) {
      return 'public, max-age=31536000, immutable'
    } else if (documentExtensions.includes(extension || '')) {
      return 'public, max-age=86400'
    } else if (textExtensions.includes(extension || '')) {
      return 'public, max-age=3600'
    }

    return 'public, max-age=3600'
  }

  private generateContentDisposition(filename: string): string {
    const sanitized = filename.replace(/"/g, '\\"')
    return `inline; filename="${sanitized}"`
  }

  // Health monitoring
  async startHealthMonitoring(): Promise<void> {
    await this.r2StorageService?.startHealthMonitoring()
  }

  async stopHealthMonitoring(): Promise<void> {
    await this.r2StorageService?.stopHealthMonitoring()
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.stopHealthMonitoring()
    await this.r2StorageService?.cleanupExpiredFiles()
  }
}

// Factory function
export function createEnhancedFileService(
  options: EnhancedFileServiceOptions
): EnhancedFileService {
  return new EnhancedFileService(options)
}

// Export types
export type {
  EnhancedFileServiceOptions,
  EnhancedUploadOptions,
  EnhancedDownloadOptions,
  FileOperationResult,
}

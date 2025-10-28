import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FileService } from '@/api/src/services/file_service'
import {
  cleanupTestEnvironment,
  createMockAuditLog,
  createMockFileUpload,
  createMockToolUsage,
  createMockUser,
  createTestDatabase,
  type MockD1Database,
  setupTestEnvironment,
} from '../models/database.mock'

// Mock the database client module
vi.mock('@/api/src/database', () => ({
  DatabaseClient: vi.fn(),
  createDatabaseClient: vi.fn(() => ({
    query: vi.fn(),
    queryFirst: vi.fn(),
    execute: vi.fn(),
    enhancedTransaction: vi.fn(),
  })),
  TransactionHelper: vi.fn(),
  IsolationLevel: {
    READ_COMMITTED: 'READ_COMMITTED',
  },
}))

// Mock R2 bucket
const createMockR2Bucket = () => ({
  head: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  createMultipartUpload: vi.fn(),
  resumeMultipartUpload: vi.fn(),
  abortMultipartUpload: vi.fn(),
  completeMultipartUpload: vi.fn(),
})

// Mock the models
vi.mock('@/api/src/models/file_upload', () => ({
  FileUpload: {
    create: vi.fn(),
    createForUpload: vi.fn(),
    fromRow: vi.fn(),
    validateFilename: vi.fn(),
    validateMimeType: vi.fn(),
    validateFileSize: vi.fn(),
  },
  FileUploadSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
  CreateFileUploadSchema: {
    parse: vi.fn(),
  },
  UpdateFileUploadSchema: {
    parse: vi.fn(),
  },
  FILE_UPLOAD_QUERIES: {
    INSERT: 'INSERT INTO file_uploads...',
    SELECT_BY_ID: 'SELECT * FROM file_uploads WHERE id = ?',
    SELECT_BY_USER: 'SELECT * FROM file_uploads WHERE user_id = ?',
    UPDATE: 'UPDATE file_uploads SET...',
    DELETE: 'DELETE FROM file_uploads WHERE id = ?',
    LIST: 'SELECT * FROM file_uploads WHERE created_at >= ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    COUNT: 'SELECT COUNT(*) as count FROM file_uploads',
    COUNT_BY_USER: 'SELECT COUNT(*) as count FROM file_uploads WHERE user_id = ?',
    SUM_SIZE_BY_USER: 'SELECT SUM(size) as total_size_bytes FROM file_uploads WHERE user_id = ?',
  },
}))

vi.mock('@/api/src/models/tool_usage', () => ({
  ToolUsage: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  TOOL_USAGE_QUERIES: {
    INSERT: 'INSERT INTO tool_usage...',
  },
}))

vi.mock('@/api/src/models/audit_log', () => ({
  AuditLog: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  AUDIT_LOG_QUERIES: {
    INSERT: 'INSERT INTO audit_logs...',
  },
}))

describe('FileService', () => {
  let fileService: FileService
  let mockDb: MockD1Database
  let mockR2: any
  let mockKv: any
  let mockDbClient: any

  beforeEach(() => {
    setupTestEnvironment()

    mockDb = createTestDatabase({
      file_uploads: [createMockFileUpload()],
      users: [createMockUser()],
      tool_usage: [createMockToolUsage()],
      audit_logs: [createMockAuditLog()],
    })

    mockR2 = createMockR2Bucket()
    mockKv = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    }

    // Create a mock database client
    mockDbClient = {
      query: vi.fn(),
      queryFirst: vi.fn(),
      execute: vi.fn(),
      enhancedTransaction: vi.fn(),
    }

    const { createDatabaseClient } = require('@/api/src/database')
    createDatabaseClient.mockReturnValue(mockDbClient)

    fileService = new FileService({
      db: mockDb as any,
      r2: mockR2,
      kv: mockKv,
      auditEnabled: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['application/json', 'text/plain'],
      retentionHours: 72,
    })
  })

  afterEach(() => {
    cleanupTestEnvironment()
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const service = new FileService({
        db: mockDb as any,
        r2: mockR2,
        kv: mockKv,
      })
      expect(service).toBeDefined()
    })

    it('should initialize with custom options', () => {
      const service = new FileService({
        db: mockDb as any,
        r2: mockR2,
        kv: mockKv,
        auditEnabled: false,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg'],
        retentionHours: 168, // 7 days
      })
      expect(service).toBeDefined()
    })
  })

  describe('validateFileUpload', () => {
    it('should validate correct file upload', async () => {
      const options = {
        filename: 'test.json',
        mimeType: 'application/json',
        size: 1024,
        userId: 'user-123',
      }

      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.validateFilename.mockReturnValue({ valid: true })
      FileUpload.validateMimeType.mockReturnValue({ valid: true })
      FileUpload.validateFileSize.mockReturnValue({ valid: true })

      const result = await fileService.validateFileUpload(options)

      expect(result.valid).toBe(true)
      expect(FileUpload.validateFilename).toHaveBeenCalledWith(options.filename)
      expect(FileUpload.validateMimeType).toHaveBeenCalledWith(options.mimeType, [
        'application/json',
        'text/plain',
      ])
      expect(FileUpload.validateFileSize).toHaveBeenCalledWith(options.size, 10 * 1024 * 1024)
    })

    it('should reject invalid filename', async () => {
      const options = {
        filename: '../../../etc/passwd',
        mimeType: 'application/json',
        size: 1024,
      }

      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.validateFilename.mockReturnValue({
        valid: false,
        error: 'Invalid filename',
      })

      const result = await fileService.validateFileUpload(options)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid filename')
    })

    it('should reject invalid MIME type', async () => {
      const options = {
        filename: 'test.exe',
        mimeType: 'application/x-executable',
        size: 1024,
      }

      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.validateFilename.mockReturnValue({ valid: true })
      FileUpload.validateMimeType.mockReturnValue({
        valid: false,
        error: 'MIME type not allowed',
      })

      const result = await fileService.validateFileUpload(options)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('MIME type not allowed')
      expect(result.allowedMimeTypes).toEqual(['application/json', 'text/plain'])
      expect(result.actualMimeType).toBe('application/x-executable')
    })

    it('should reject oversized file', async () => {
      const options = {
        filename: 'large.json',
        mimeType: 'application/json',
        size: 20 * 1024 * 1024, // 20MB
      }

      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.validateFilename.mockReturnValue({ valid: true })
      FileUpload.validateMimeType.mockReturnValue({ valid: true })
      FileUpload.validateFileSize.mockReturnValue({
        valid: false,
        error: 'File too large',
      })

      const result = await fileService.validateFileUpload(options)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('File too large')
      expect(result.allowedSize).toBe(10 * 1024 * 1024)
      expect(result.actualSize).toBe(20 * 1024 * 1024)
    })
  })

  describe('createUploadRequest', () => {
    it('should create upload request successfully', async () => {
      const options = {
        filename: 'test.json',
        mimeType: 'application/json',
        size: 1024,
        userId: 'user-123',
      }

      const validation = {
        valid: true,
        allowedSize: 10 * 1024 * 1024,
        actualSize: 1024,
      }

      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.validateFilename.mockReturnValue({ valid: true })
      FileUpload.validateMimeType.mockReturnValue({ valid: true })
      FileUpload.validateFileSize.mockReturnValue(validation)

      const mockFileUpload = createMockFileUpload({
        filename: options.filename,
        mime_type: options.mimeType,
        size: options.size,
        user_id: options.userId,
      })
      FileUpload.createForUpload.mockReturnValue(mockFileUpload)

      mockDbClient.execute.mockResolvedValue({ success: true })

      // Mock presigned URL generation
      const uploadUrl = 'https://upload.example.com/presigned-url'
      mockR2.head.mockResolvedValue({
        customMetadata: { uploadUrl },
      })

      const result = await fileService.createUploadRequest(options, '127.0.0.1', 'test-agent')

      expect(result.success).toBe(true)
      expect(result.fileId).toBe(mockFileUpload.id)
      expect(result.uploadUrl).toBeDefined()
      expect(FileUpload.createForUpload).toHaveBeenCalledWith(
        options.filename,
        options.mimeType,
        options.size,
        options.userId,
        { retentionHours: 72 }
      )
    })

    it('should reject invalid file upload', async () => {
      const options = {
        filename: 'invalid.exe',
        mimeType: 'application/x-executable',
        size: 20 * 1024 * 1024,
      }

      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.validateFilename.mockReturnValue({ valid: true })
      FileUpload.validateMimeType.mockReturnValue({
        valid: false,
        error: 'MIME type not allowed',
      })

      const result = await fileService.createUploadRequest(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe('MIME type not allowed')
    })

    it('should handle database errors', async () => {
      const options = {
        filename: 'test.json',
        mimeType: 'application/json',
        size: 1024,
      }

      const validation = { valid: true }
      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.validateFilename.mockReturnValue({ valid: true })
      FileUpload.validateMimeType.mockReturnValue({ valid: true })
      FileUpload.validateFileSize.mockReturnValue(validation)

      const mockFileUpload = createMockFileUpload()
      FileUpload.createForUpload.mockReturnValue(mockFileUpload)

      mockDbClient.execute.mockRejectedValue(new Error('Database error'))

      const result = await fileService.createUploadRequest(options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create upload request')
    })
  })

  describe('getFileById', () => {
    it('should return file when found', async () => {
      const fileId = 'file-123'
      const mockFile = createMockFileUpload({ id: fileId })

      mockDbClient.queryFirst.mockResolvedValue(mockFile)
      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.fromRow.mockReturnValue(mockFile)

      const result = await fileService.getFileById(fileId)

      expect(result).toEqual(mockFile)
      expect(mockDbClient.queryFirst).toHaveBeenCalledWith(
        'SELECT * FROM file_uploads WHERE id = ?',
        [fileId]
      )
    })

    it('should return null when file not found', async () => {
      const fileId = 'nonexistent-file'
      mockDbClient.queryFirst.mockResolvedValue(null)

      const result = await fileService.getFileById(fileId)

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const fileId = 'file-123'
      mockDbClient.queryFirst.mockRejectedValue(new Error('Database error'))

      await expect(fileService.getFileById(fileId)).rejects.toThrow(
        'Failed to get file: Error: Database error'
      )
    })
  })

  describe('updateFile', () => {
    it('should update file successfully', async () => {
      const fileId = 'file-123'
      const existingFile = createMockFileUpload({ id: fileId })
      const updateData = {
        filename: 'updated.json',
        metadata: { processed: true },
      }
      const updatedFile = createMockFileUpload({
        ...existingFile,
        filename: 'updated.json',
        metadata: { processed: true },
      })

      mockDbClient.queryFirst.mockResolvedValue(existingFile)
      const { FileUpload, UpdateFileUploadSchema } = require('@/api/src/models/file_upload')
      FileUpload.fromRow.mockReturnValue(existingFile)
      UpdateFileUploadSchema.parse.mockReturnValue(updateData)

      const mockUpdatedInstance = {
        ...existingFile,
        update: vi.fn().mockReturnValue(updatedFile),
      }
      FileUpload.fromRow.mockReturnValue(mockUpdatedInstance)

      mockDbClient.execute.mockResolvedValue({ success: true })

      const result = await fileService.updateFile(fileId, updateData)

      expect(result).toEqual(updatedFile)
      expect(UpdateFileUploadSchema.parse).toHaveBeenCalledWith(updateData)
      expect(mockDbClient.execute).toHaveBeenCalledWith(
        'UPDATE file_uploads SET...',
        expect.arrayContaining([
          updatedFile.filename,
          updatedFile.original_name,
          JSON.stringify(updatedFile.metadata),
          updatedFile.updated_at,
          updatedFile.id,
        ])
      )
    })

    it('should throw error when file not found', async () => {
      const fileId = 'nonexistent-file'
      const updateData = { filename: 'updated.json' }

      mockDbClient.queryFirst.mockResolvedValue(null)

      await expect(fileService.updateFile(fileId, updateData)).rejects.toThrow(
        `File with ID ${fileId} not found`
      )
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const fileId = 'file-123'
      const existingFile = createMockFileUpload({ id: fileId })

      mockDbClient.queryFirst.mockResolvedValue(existingFile)
      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.fromRow.mockReturnValue(existingFile)

      mockDbClient.execute.mockResolvedValue({
        success: true,
        meta: { changes: 1 },
      })
      mockR2.delete.mockResolvedValue(undefined)

      await fileService.deleteFile(fileId, '127.0.0.1', 'test-agent')

      expect(mockDbClient.execute).toHaveBeenCalledWith('DELETE FROM file_uploads WHERE id = ?', [
        fileId,
      ])
      expect(mockR2.delete).toHaveBeenCalledWith(existingFile.path)
    })

    it('should throw error when file not found', async () => {
      const fileId = 'nonexistent-file'
      mockDbClient.queryFirst.mockResolvedValue(null)

      await expect(fileService.deleteFile(fileId)).rejects.toThrow(
        `File with ID ${fileId} not found`
      )
    })
  })

  describe('listFiles', () => {
    it('should list files with filters', async () => {
      const filter = {
        userId: 'user-123',
        limit: 10,
        offset: 0,
      }
      const mockFiles = [
        createMockFileUpload({ user_id: filter.userId }),
        createMockFileUpload({ user_id: filter.userId }),
      ]

      mockDbClient.query.mockResolvedValue(mockFiles)
      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.fromRow.mockImplementation(row => row)

      const result = await fileService.listFiles(filter)

      expect(result).toHaveLength(2)
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = ?'),
        expect.arrayContaining([filter.userId, filter.limit, filter.offset])
      )
    })

    it('should list files without filters', async () => {
      const mockFiles = [createMockFileUpload()]

      mockDbClient.query.mockResolvedValue(mockFiles)
      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.fromRow.mockImplementation(row => row)

      const result = await fileService.listFiles()

      expect(result).toHaveLength(1)
    })
  })

  describe('Presigned URLs', () => {
    describe('generatePresignedUploadUrl', () => {
      it('should generate presigned upload URL', async () => {
        const mockFile = createMockFileUpload()
        const uploadUrl = 'https://upload.example.com/presigned-url'

        mockR2.head.mockResolvedValue({
          customMetadata: { uploadUrl },
        })

        const result = await (fileService as any).generatePresignedUploadUrl(mockFile)

        expect(result).toBe(uploadUrl)
        expect(mockR2.head).toHaveBeenCalledWith(mockFile.path)
      })

      it('should handle URL generation errors', async () => {
        const mockFile = createMockFileUpload()

        mockR2.head.mockRejectedValue(new Error('R2 error'))

        await expect((fileService as any).generatePresignedUploadUrl(mockFile)).rejects.toThrow(
          'Failed to generate presigned URL: Error: R2 error'
        )
      })
    })

    describe('generatePresignedDownloadUrl', () => {
      it('should generate presigned download URL', async () => {
        const fileId = 'file-123'
        const mockFile = createMockFileUpload({ id: fileId })
        const downloadUrl = 'https://download.example.com/presigned-url'

        mockDbClient.queryFirst.mockResolvedValue(mockFile)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockReturnValue(mockFile)

        mockR2.head.mockResolvedValue({
          customMetadata: { downloadUrl },
        })

        const result = await fileService.generatePresignedDownloadUrl(fileId)

        expect(result).toBe(downloadUrl)
      })

      it('should return null for non-existent file', async () => {
        const fileId = 'nonexistent-file'
        mockDbClient.queryFirst.mockResolvedValue(null)

        const result = await fileService.generatePresignedDownloadUrl(fileId)

        expect(result).toBeNull()
      })
    })
  })

  describe('File Processing', () => {
    describe('processUploadedFile', () => {
      it('should process uploaded file successfully', async () => {
        const fileId = 'file-123'
        const mockFile = createMockFileUpload({
          id: fileId,
          status: 'uploading',
        })
        const processedFile = createMockFileUpload({
          id: fileId,
          status: 'completed',
          metadata: { processed: true },
        })

        mockDbClient.queryFirst.mockResolvedValue(mockFile)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockReturnValue(mockFile)

        // Mock file processing
        const fileContent = '{"test": "data"}'
        mockR2.get.mockResolvedValue({
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(fileContent))
              controller.close()
            },
          }),
        })

        const mockUpdatedInstance = {
          ...mockFile,
          update: vi.fn().mockReturnValue(processedFile),
        }
        FileUpload.fromRow.mockReturnValue(mockUpdatedInstance)

        mockDbClient.execute.mockResolvedValue({ success: true })

        const result = await fileService.processUploadedFile(fileId)

        expect(result.status).toBe('completed')
        expect(result.metadata).toEqual({ processed: true })
      })

      it('should handle processing errors', async () => {
        const fileId = 'file-123'
        const mockFile = createMockFileUpload({
          id: fileId,
          status: 'uploading',
        })

        mockDbClient.queryFirst.mockResolvedValue(mockFile)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockReturnValue(mockFile)

        // Mock file retrieval error
        mockR2.get.mockRejectedValue(new Error('File not found'))

        const result = await fileService.processUploadedFile(fileId)

        expect(result.status).toBe('error')
        expect(result.error_message).toContain('File not found')
      })
    })
  })

  describe('File Statistics', () => {
    describe('getFileStats', () => {
      it('should return file statistics', async () => {
        const fileId = 'file-123'
        const mockFile = createMockFileUpload({ id: fileId })

        mockDbClient.queryFirst.mockResolvedValue(mockFile)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockReturnValue(mockFile)

        const result = await fileService.getFileStats(fileId)

        expect(result).toEqual({
          fileId,
          filename: mockFile.filename,
          size: mockFile.size,
          mimeType: mockFile.mime_type,
          uploadedAt: mockFile.created_at,
          expiresAt: mockFile.expires_at,
          isExpired: expect.any(Boolean),
          downloadCount: expect.any(Number),
        })
      })

      it('should return null for non-existent file', async () => {
        const fileId = 'nonexistent-file'
        mockDbClient.queryFirst.mockResolvedValue(null)

        const result = await fileService.getFileStats(fileId)

        expect(result).toBeNull()
      })
    })

    describe('getUserFileStats', () => {
      it('should return user file statistics', async () => {
        const userId = 'user-123'

        mockDbClient.queryFirst
          .mockResolvedValueOnce({ count: 10 }) // Total files
          .mockResolvedValueOnce({ total_size_bytes: 1024000 }) // Total size

        const result = await fileService.getUserFileStats(userId)

        expect(result).toEqual({
          totalFiles: 10,
          totalSize: 1024000,
          averageFileSize: 102400, // 1024000 / 10
        })
      })
    })
  })

  describe('File Cleanup', () => {
    describe('cleanupExpiredFiles', () => {
      it('should cleanup expired files', async () => {
        const expiredTime = Math.floor(Date.now() / 1000) - 24 * 60 * 60 // 24 hours ago
        const mockFiles = [
          createMockFileUpload({
            id: 'file-1',
            expires_at: expiredTime,
          }),
          createMockFileUpload({
            id: 'file-2',
            expires_at: expiredTime,
          }),
        ]

        mockDbClient.query.mockResolvedValue(mockFiles)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockImplementation(row => row)

        mockDbClient.execute.mockResolvedValue({
          success: true,
          meta: { changes: 1 },
        })
        mockR2.delete.mockResolvedValue(undefined)

        const result = await fileService.cleanupExpiredFiles()

        expect(result.deletedFiles).toBe(2)
        expect(mockDbClient.execute).toHaveBeenCalledTimes(2)
        expect(mockR2.delete).toHaveBeenCalledTimes(2)
      })

      it('should not cleanup recent files', async () => {
        const recentTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours from now
        const mockFiles = [
          createMockFileUpload({
            id: 'file-1',
            expires_at: recentTime,
          }),
        ]

        mockDbClient.query.mockResolvedValue(mockFiles)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockImplementation(row => row)

        const result = await fileService.cleanupExpiredFiles()

        expect(result.deletedFiles).toBe(0)
        expect(mockDbClient.execute).not.toHaveBeenCalled()
        expect(mockR2.delete).not.toHaveBeenCalled()
      })
    })
  })

  describe('File Validation', () => {
    describe('validateFileContent', () => {
      it('should validate JSON content', async () => {
        const fileId = 'file-123'
        const mockFile = createMockFileUpload({
          id: fileId,
          mime_type: 'application/json',
        })

        mockDbClient.queryFirst.mockResolvedValue(mockFile)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockReturnValue(mockFile)

        // Mock file content
        const jsonContent = '{"test": "data", "number": 123}'
        mockR2.get.mockResolvedValue({
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(jsonContent))
              controller.close()
            },
          }),
        })

        const result = await fileService.validateFileContent(fileId)

        expect(result.valid).toBe(true)
        expect(result.content).toEqual({ test: 'data', number: 123 })
      })

      it('should detect invalid JSON', async () => {
        const fileId = 'file-123'
        const mockFile = createMockFileUpload({
          id: fileId,
          mime_type: 'application/json',
        })

        mockDbClient.queryFirst.mockResolvedValue(mockFile)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockReturnValue(mockFile)

        // Mock invalid JSON content
        const invalidJson = '{"test": invalid}'
        mockR2.get.mockResolvedValue({
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(invalidJson))
              controller.close()
            },
          }),
        })

        const result = await fileService.validateFileContent(fileId)

        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid JSON')
      })

      it('should handle file read errors', async () => {
        const fileId = 'file-123'
        const mockFile = createMockFileUpload({ id: fileId })

        mockDbClient.queryFirst.mockResolvedValue(mockFile)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockReturnValue(mockFile)

        mockR2.get.mockRejectedValue(new Error('File not found'))

        const result = await fileService.validateFileContent(fileId)

        expect(result.valid).toBe(false)
        expect(result.error).toContain('Failed to read file')
      })
    })
  })

  describe('File Operations', () => {
    describe('copyFile', () => {
      it('should copy file successfully', async () => {
        const sourceFileId = 'file-123'
        const targetFilename = 'copy.json'
        const sourceFile = createMockFileUpload({ id: sourceFileId })
        const copiedFile = createMockFileUpload({
          id: 'file-456',
          filename: targetFilename,
        })

        mockDbClient.queryFirst.mockResolvedValue(sourceFile)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockReturnValue(sourceFile)

        // Mock file copy
        const fileContent = '{"test": "data"}'
        mockR2.get.mockResolvedValue({
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(fileContent))
              controller.close()
            },
          }),
        })
        mockR2.put.mockResolvedValue(undefined)

        // Mock new file record creation
        FileUpload.create.mockReturnValue(copiedFile)
        mockDbClient.execute.mockResolvedValue({ success: true })

        const result = await fileService.copyFile(sourceFileId, targetFilename)

        expect(result).toEqual(copiedFile)
        expect(mockR2.put).toHaveBeenCalled()
        expect(mockDbClient.execute).toHaveBeenCalled()
      })

      it('should throw error when source file not found', async () => {
        const sourceFileId = 'nonexistent-file'
        mockDbClient.queryFirst.mockResolvedValue(null)

        await expect(fileService.copyFile(sourceFileId, 'copy.json')).rejects.toThrow(
          `Source file with ID ${sourceFileId} not found`
        )
      })
    })

    describe('moveFile', () => {
      it('should move file successfully', async () => {
        const fileId = 'file-123'
        const newFilename = 'moved.json'
        const existingFile = createMockFileUpload({ id: fileId })
        const movedFile = createMockFileUpload({
          ...existingFile,
          filename: newFilename,
          path: '/uploads/moved.json',
        })

        mockDbClient.queryFirst.mockResolvedValue(existingFile)
        const { FileUpload } = require('@/api/src/models/file_upload')
        FileUpload.fromRow.mockReturnValue(existingFile)

        // Mock R2 copy and delete
        mockR2.put.mockResolvedValue(undefined)
        mockR2.delete.mockResolvedValue(undefined)

        // Mock file update
        const mockUpdatedInstance = {
          ...existingFile,
          update: vi.fn().mockReturnValue(movedFile),
        }
        FileUpload.fromRow.mockReturnValue(mockUpdatedInstance)

        mockDbClient.execute.mockResolvedValue({ success: true })

        const result = await fileService.moveFile(fileId, newFilename)

        expect(result.filename).toBe(newFilename)
        expect(mockR2.put).toHaveBeenCalled()
        expect(mockR2.delete).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle R2 errors gracefully', async () => {
      const fileId = 'file-123'
      mockR2.get.mockRejectedValue(new Error('R2 connection failed'))

      await expect(fileService.getFileContent(fileId)).rejects.toThrow(
        'Failed to read file content: Error: R2 connection failed'
      )
    })

    it('should handle malformed file data', async () => {
      const fileId = 'file-123'
      mockDbClient.queryFirst.mockResolvedValue({ invalid: 'data' })
      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.fromRow.mockImplementation(() => {
        throw new Error('Invalid file data')
      })

      await expect(fileService.getFileById(fileId)).rejects.toThrow(
        'Failed to get file: Error: Invalid file data'
      )
    })

    it('should handle quota exceeded errors', async () => {
      const options = {
        filename: 'large.json',
        mimeType: 'application/json',
        size: 50 * 1024 * 1024, // 50MB, exceeds 10MB limit
      }

      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.validateFilename.mockReturnValue({ valid: true })
      FileUpload.validateMimeType.mockReturnValue({ valid: true })
      FileUpload.validateFileSize.mockReturnValue({
        valid: false,
        error: 'File size exceeds quota',
      })

      const result = await fileService.createUploadRequest(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe('File size exceeds quota')
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete file upload lifecycle', async () => {
      const userId = 'user-123'
      const options = {
        filename: 'test.json',
        mimeType: 'application/json',
        size: 1024,
        userId,
      }

      // 1. Create upload request
      const validation = { valid: true }
      const { FileUpload } = require('@/api/src/models/file_upload')
      FileUpload.validateFilename.mockReturnValue({ valid: true })
      FileUpload.validateMimeType.mockReturnValue({ valid: true })
      FileUpload.validateFileSize.mockReturnValue(validation)

      const mockFile = createMockFileUpload({
        filename: options.filename,
        mime_type: options.mimeType,
        size: options.size,
        user_id: userId,
        status: 'uploading',
      })
      FileUpload.createForUpload.mockReturnValue(mockFile)

      mockDbClient.execute.mockResolvedValue({ success: true })

      const uploadUrl = 'https://upload.example.com/presigned-url'
      mockR2.head.mockResolvedValue({
        customMetadata: { uploadUrl },
      })

      const uploadResult = await fileService.createUploadRequest(options)
      expect(uploadResult.success).toBe(true)

      // 2. Simulate file upload completion
      const completedFile = createMockFileUpload({
        ...mockFile,
        status: 'completed',
      })

      mockDbClient.queryFirst.mockResolvedValue(mockFile)
      FileUpload.fromRow.mockReturnValue(mockFile)

      const mockUpdatedInstance = {
        ...mockFile,
        update: vi.fn().mockReturnValue(completedFile),
      }
      FileUpload.fromRow.mockReturnValue(mockUpdatedInstance)

      mockDbClient.execute.mockResolvedValue({ success: true })

      const processResult = await fileService.processUploadedFile(mockFile.id)
      expect(processResult.status).toBe('completed')

      // 3. Validate file content
      mockDbClient.queryFirst.mockResolvedValue(completedFile)
      FileUpload.fromRow.mockReturnValue(completedFile)

      const jsonContent = '{"test": "data"}'
      mockR2.get.mockResolvedValue({
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(jsonContent))
            controller.close()
          },
        }),
      })

      const validationResult = await fileService.validateFileContent(completedFile.id)
      expect(validationResult.valid).toBe(true)
      expect(validationResult.content).toEqual({ test: 'data' })

      // 4. Generate download URL
      const downloadUrl = 'https://download.example.com/presigned-url'
      mockR2.head.mockResolvedValue({
        customMetadata: { downloadUrl },
      })

      const downloadResult = await fileService.generatePresignedDownloadUrl(completedFile.id)
      expect(downloadResult).toBe(downloadUrl)
    })
  })
})

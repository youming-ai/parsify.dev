import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CreateFileUploadSchema,
  FILE_UPLOAD_QUERIES,
  FileUpload,
  FileUploadOptionsSchema,
  FileUploadSchema,
} from '../../../../apps/api/src/models/file_upload'
import {
  cleanupTestEnvironment,
  createMockFileUpload,
  createTestDatabase,
  setupTestEnvironment,
} from './database.mock'

describe('FileUpload Model', () => {
  let mockDb: any

  beforeEach(() => {
    setupTestEnvironment()
    mockDb = createTestDatabase()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('Schema Validation', () => {
    it('should validate a complete file upload object', () => {
      const fileData = createMockFileUpload()
      const result = FileUploadSchema.safeParse(fileData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(fileData.id)
        expect(result.data.user_id).toBe(fileData.user_id)
        expect(result.data.filename).toBe(fileData.filename)
        expect(result.data.mime_type).toBe(fileData.mime_type)
      }
    })

    it('should reject invalid status', () => {
      const invalidFile = createMockFileUpload({ status: 'invalid' as any })
      const result = FileUploadSchema.safeParse(invalidFile)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status')
      }
    })

    it('should accept valid statuses', () => {
      const validStatuses = ['uploading', 'completed', 'expired', 'failed']

      validStatuses.forEach(status => {
        const file = createMockFileUpload({ status: status as any })
        const result = FileUploadSchema.safeParse(file)
        expect(result.success).toBe(true)
      })
    })

    it('should validate file upload creation schema', () => {
      const createData = {
        user_id: 'user-123',
        filename: 'test.json',
        mime_type: 'application/json',
        size_bytes: 1024,
        r2_key: 'uploads/test.json',
      }

      const result = CreateFileUploadSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should validate file upload options schema', () => {
      const options = {
        max_size_bytes: 10 * 1024 * 1024,
        allowed_mime_types: ['application/json', 'text/plain'],
        retention_hours: 72,
        require_auth: true,
      }

      const result = FileUploadOptionsSchema.safeParse(options)
      expect(result.success).toBe(true)
    })
  })

  describe('Model Creation and Instantiation', () => {
    it('should create a file upload instance with valid data', () => {
      const fileData = createMockFileUpload()
      const file = new FileUpload(fileData)

      expect(file.id).toBe(fileData.id)
      expect(file.user_id).toBe(fileData.user_id)
      expect(file.filename).toBe(fileData.filename)
      expect(file.mime_type).toBe(fileData.mime_type)
      expect(file.size_bytes).toBe(fileData.size_bytes)
    })

    it('should create a file upload with static create method', () => {
      const createData = {
        user_id: 'user-456',
        filename: 'upload.txt',
        mime_type: 'text/plain',
        size_bytes: 2048,
        r2_key: 'uploads/upload.txt',
      }

      const file = FileUpload.create(createData)

      expect(file.id).toBeDefined()
      expect(file.user_id).toBe(createData.user_id)
      expect(file.filename).toBe(createData.filename)
      expect(file.status).toBe('uploading')
      expect(file.created_at).toBeDefined()
    })

    it('should create file upload from database row', () => {
      const rowData = createMockFileUpload()
      mockDb.setTableData('file_uploads', [rowData])

      const file = FileUpload.fromRow(rowData)

      expect(file).toBeInstanceOf(FileUpload)
      expect(file.id).toBe(rowData.id)
      expect(file.filename).toBe(rowData.filename)
    })
  })

  describe('Factory Methods', () => {
    it('should create file upload for user', () => {
      const file = FileUpload.createForUpload('test.json', 'application/json', 1024, 'user-123')

      expect(file.filename).toBe('test.json')
      expect(file.mime_type).toBe('application/json')
      expect(file.size_bytes).toBe(1024)
      expect(file.user_id).toBe('user-123')
      expect(file.r2_key).toContain('users/user-123/')
    })

    it('should create anonymous file upload', () => {
      const file = FileUpload.createForUpload('test.json', 'application/json', 1024)

      expect(file.user_id).toBeNull()
      expect(file.r2_key).toContain('anonymous/')
    })

    it('should create file upload with custom R2 key', () => {
      const customR2Key = 'custom/path/test.json'
      const file = FileUpload.createWithR2Key(
        'test.json',
        'application/json',
        1024,
        customR2Key,
        'user-123'
      )

      expect(file.r2_key).toBe(customR2Key)
    })

    it('should apply options in create method', () => {
      const options = {
        retention_hours: 48,
        require_auth: false,
      }

      const file = FileUpload.create(
        {
          user_id: null,
          filename: 'test.json',
          mime_type: 'application/json',
          size_bytes: 1024,
          r2_key: 'test.json',
        },
        options
      )

      expect(file.expires_at).toBeDefined()
      expect(file.expires_at).toBeGreaterThan(file.created_at)
    })
  })

  describe('File Lifecycle Methods', () => {
    it('should complete file upload', () => {
      const fileData = createMockFileUpload({
        status: 'uploading',
        checksum: null,
      })
      const file = new FileUpload(fileData)

      const checksum = 'sha256:abc123'
      const completedFile = file.complete(checksum)

      expect(completedFile.status).toBe('completed')
      expect(completedFile.checksum).toBe(checksum)
    })

    it('should fail file upload', () => {
      const fileData = createMockFileUpload({ status: 'uploading' })
      const file = new FileUpload(fileData)

      const failedFile = file.fail()

      expect(failedFile.status).toBe('failed')
    })

    it('should expire file upload', () => {
      const fileData = createMockFileUpload({ status: 'completed' })
      const file = new FileUpload(fileData)

      const expiredFile = file.expire()

      expect(expiredFile.status).toBe('expired')
    })

    it('should extend file expiration', () => {
      const fileData = createMockFileUpload({
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      })
      const file = new FileUpload(fileData)
      const originalExpiresAt = file.expires_at!

      setTimeout(() => {
        const extendedFile = file.extendExpiration(24) // Add 24 hours

        expect(extendedFile.expires_at).toBeGreaterThan(originalExpiresAt)
      }, 10)
    })
  })

  describe('Helper Methods and Business Logic', () => {
    it('should correctly identify file states', () => {
      const uploadingFile = new FileUpload(createMockFileUpload({ status: 'uploading' }))
      const completedFile = new FileUpload(createMockFileUpload({ status: 'completed' }))
      const expiredFile = new FileUpload(createMockFileUpload({ status: 'expired' }))
      const failedFile = new FileUpload(createMockFileUpload({ status: 'failed' }))

      expect(uploadingFile.isUploading).toBe(true)
      expect(uploadingFile.isCompleted).toBe(false)
      expect(uploadingFile.isExpired).toBe(false)
      expect(uploadingFile.isFailed).toBe(false)

      expect(completedFile.isUploading).toBe(false)
      expect(completedFile.isCompleted).toBe(true)
      expect(completedFile.isExpired).toBe(false)
      expect(completedFile.isFailed).toBe(false)

      expect(expiredFile.isUploading).toBe(false)
      expect(expiredFile.isCompleted).toBe(false)
      expect(expiredFile.isExpired).toBe(true)
      expect(expiredFile.isFailed).toBe(false)

      expect(failedFile.isUploading).toBe(false)
      expect(failedFile.isCompleted).toBe(false)
      expect(failedFile.isExpired).toBe(false)
      expect(failedFile.isFailed).toBe(true)
    })

    it('should correctly identify accessible files', () => {
      const completedFile = new FileUpload(
        createMockFileUpload({
          status: 'completed',
          expires_at: Math.floor(Date.now() / 1000) + 3600, // Future
        })
      )
      const expiredFile = new FileUpload(
        createMockFileUpload({
          status: 'completed',
          expires_at: Math.floor(Date.now() / 1000) - 3600, // Past
        })
      )
      const failedFile = new FileUpload(createMockFileUpload({ status: 'failed' }))

      expect(completedFile.isAccessible).toBe(true)
      expect(expiredFile.isAccessible).toBe(false)
      expect(failedFile.isAccessible).toBe(false)
    })

    it('should correctly identify anonymous files', () => {
      const userFile = new FileUpload(createMockFileUpload({ user_id: 'user-123' }))
      const anonymousFile = new FileUpload(createMockFileUpload({ user_id: null }))

      expect(userFile.isAnonymous).toBe(false)
      expect(anonymousFile.isAnonymous).toBe(true)
    })

    it('should format file size correctly', () => {
      const file1 = new FileUpload(createMockFileUpload({ size_bytes: 1024 }))
      const file2 = new FileUpload(createMockFileUpload({ size_bytes: 1024 * 1024 }))
      const file3 = new FileUpload(createMockFileUpload({ size_bytes: 0 }))

      expect(file1.sizeString).toBe('1 KB')
      expect(file2.sizeString).toBe('1 MB')
      expect(file3.sizeString).toBe('0 B')
    })

    it('should extract file extension correctly', () => {
      const file1 = new FileUpload(createMockFileUpload({ filename: 'test.json' }))
      const file2 = new FileUpload(createMockFileUpload({ filename: 'document.pdf' }))
      const file3 = new FileUpload(createMockFileUpload({ filename: 'noextension' }))
      const file4 = new FileUpload(createMockFileUpload({ filename: '.hidden' }))

      expect(file1.fileExtension).toBe('json')
      expect(file2.fileExtension).toBe('pdf')
      expect(file3.fileExtension).toBe('')
      expect(file4.fileExtension).toBe('hidden')
    })

    it('should identify text files correctly', () => {
      const textFile = new FileUpload(
        createMockFileUpload({
          mime_type: 'text/plain',
        })
      )
      const jsonFile = new FileUpload(
        createMockFileUpload({
          mime_type: 'application/json',
        })
      )
      const imageFile = new FileUpload(
        createMockFileUpload({
          mime_type: 'image/jpeg',
        })
      )

      expect(textFile.isTextFile).toBe(true)
      expect(jsonFile.isTextFile).toBe(true)
      expect(imageFile.isTextFile).toBe(false)
    })

    it('should identify JSON files correctly', () => {
      const jsonFile1 = new FileUpload(
        createMockFileUpload({
          mime_type: 'application/json',
        })
      )
      const jsonFile2 = new FileUpload(
        createMockFileUpload({
          filename: 'config.json',
          mime_type: 'text/plain',
        })
      )
      const textFile = new FileUpload(
        createMockFileUpload({
          mime_type: 'text/plain',
        })
      )

      expect(jsonFile1.isJsonFile).toBe(true)
      expect(jsonFile2.isJsonFile).toBe(true)
      expect(textFile.isJsonFile).toBe(false)
    })

    it('should identify code files correctly', () => {
      const jsFile = new FileUpload(
        createMockFileUpload({
          filename: 'script.js',
          mime_type: 'application/javascript',
        })
      )
      const pyFile = new FileUpload(
        createMockFileUpload({
          filename: 'main.py',
          mime_type: 'text/x-python',
        })
      )
      const textFile = new FileUpload(
        createMockFileUpload({
          mime_type: 'text/plain',
        })
      )

      expect(jsFile.isCodeFile).toBe(true)
      expect(pyFile.isCodeFile).toBe(true)
      expect(textFile.isCodeFile).toBe(false)
    })

    it('should calculate remaining time correctly', () => {
      const now = Math.floor(Date.now() / 1000)
      const futureFile = new FileUpload(
        createMockFileUpload({
          expires_at: now + 3600, // 1 hour from now
        })
      )
      const pastFile = new FileUpload(
        createMockFileUpload({
          expires_at: now - 3600, // 1 hour ago
        })
      )
      const noExpireFile = new FileUpload(
        createMockFileUpload({
          expires_at: null,
        })
      )

      expect(futureFile.remainingTime).toBeGreaterThan(0)
      expect(futureFile.remainingTime).toBeLessThanOrEqual(3600)
      expect(pastFile.remainingTime).toBe(0)
      expect(noExpireFile.remainingTime).toBeNull()
    })

    it('should format remaining time correctly', () => {
      const now = Math.floor(Date.now() / 1000)
      const secondsFile = new FileUpload(
        createMockFileUpload({
          expires_at: now + 30,
        })
      )
      const minutesFile = new FileUpload(
        createMockFileUpload({
          expires_at: now + 150, // 2.5 minutes
        })
      )
      const hoursFile = new FileUpload(
        createMockFileUpload({
          expires_at: now + 7200, // 2 hours
        })
      )
      const daysFile = new FileUpload(
        createMockFileUpload({
          expires_at: now + 172800, // 2 days
        })
      )
      const expiredFile = new FileUpload(
        createMockFileUpload({
          expires_at: now - 3600,
        })
      )
      const noExpireFile = new FileUpload(
        createMockFileUpload({
          expires_at: null,
        })
      )

      expect(secondsFile.remainingTimeString).toBe('30s')
      expect(minutesFile.remainingTimeString).toBe('2m 30s')
      expect(hoursFile.remainingTimeString).toBe('2h 0m')
      expect(daysFile.remainingTimeString).toBe('2 days')
      expect(expiredFile.remainingTimeString).toBe('Expired')
      expect(noExpireFile.remainingTimeString).toBe('No expiration')
    })
  })

  describe('Validation Methods', () => {
    it('should validate filename correctly', () => {
      expect(FileUpload.validateFilename('test.json').valid).toBe(true)
      expect(FileUpload.validateFilename('file with spaces.txt').valid).toBe(true)
      expect(FileUpload.validateFilename('').valid).toBe(false)
      expect(FileUpload.validateFilename('file<name>.txt').valid).toBe(false)
      expect(FileUpload.validateFilename('CON.txt').valid).toBe(false) // Windows reserved name
      expect(FileUpload.validateFilename('a'.repeat(256)).valid).toBe(false) // Too long
    })

    it('should validate MIME type correctly', () => {
      const allowedTypes = ['application/json', 'text/plain', 'image/*']

      expect(FileUpload.validateMimeType('application/json', allowedTypes).valid).toBe(true)
      expect(FileUpload.validateMimeType('image/jpeg', allowedTypes).valid).toBe(true)
      expect(FileUpload.validateMimeType('application/xml', allowedTypes).valid).toBe(false)
      expect(FileUpload.validateMimeType('', allowedTypes).valid).toBe(false)
    })

    it('should validate file size correctly', () => {
      expect(FileUpload.validateFileSize(1024, 1024 * 1024).valid).toBe(true)
      expect(FileUpload.validateFileSize(0, 1024 * 1024).valid).toBe(true)
      expect(FileUpload.validateFileSize(-1, 1024 * 1024).valid).toBe(false)
      expect(FileUpload.validateFileSize(2 * 1024 * 1024, 1024 * 1024).valid).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields', () => {
      const minimalFileData = {
        id: 'file-123',
        user_id: null,
        filename: 'test.txt',
        mime_type: 'text/plain',
        size_bytes: 0,
        r2_key: 'test.txt',
        checksum: null,
        status: 'uploading',
        expires_at: null,
        created_at: 1234567890,
      }

      const file = new FileUpload(minimalFileData)

      expect(file.user_id).toBeNull()
      expect(file.checksum).toBeNull()
      expect(file.expires_at).toBeNull()
    })

    it('should handle invalid data in fromRow', () => {
      const invalidRow = {
        id: 'invalid-uuid',
        user_id: 'invalid-uuid',
        filename: '',
        mime_type: '',
        size_bytes: -1,
      }

      expect(() => FileUpload.fromRow(invalidRow)).toThrow()
    })
  })

  describe('SQL Queries', () => {
    it('should have all required SQL queries', () => {
      expect(FILE_UPLOAD_QUERIES.CREATE_TABLE).toBeDefined()
      expect(FILE_UPLOAD_QUERIES.INSERT).toBeDefined()
      expect(FILE_UPLOAD_QUERIES.SELECT_BY_ID).toBeDefined()
      expect(FILE_UPLOAD_QUERIES.SELECT_BY_USER).toBeDefined()
      expect(FILE_UPLOAD_QUERIES.SELECT_BY_R2_KEY).toBeDefined()
      expect(FILE_UPLOAD_QUERIES.SELECT_EXPIRED).toBeDefined()
      expect(FILE_UPLOAD_QUERIES.UPDATE).toBeDefined()
      expect(FILE_UPLOAD_QUERIES.DELETE).toBeDefined()
      expect(FILE_UPLOAD_QUERIES.DELETE_EXPIRED_FILES).toBeDefined()
    })

    it('should have proper table creation query', () => {
      expect(FILE_UPLOAD_QUERIES.CREATE_TABLE).toContain('CREATE TABLE IF NOT EXISTS file_uploads')
      expect(FILE_UPLOAD_QUERIES.CREATE_TABLE).toContain('id TEXT PRIMARY KEY')
      expect(FILE_UPLOAD_QUERIES.CREATE_TABLE).toContain(
        'FOREIGN KEY (user_id) REFERENCES users(id)'
      )
    })

    it('should have parameterized queries', () => {
      expect(FILE_UPLOAD_QUERIES.INSERT).toContain('VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      expect(FILE_UPLOAD_QUERIES.SELECT_BY_ID).toContain('WHERE id = ?')
      expect(FILE_UPLOAD_QUERIES.SELECT_BY_USER).toContain('WHERE user_id = ?')
      expect(FILE_UPLOAD_QUERIES.DELETE).toContain('WHERE id = ?')
    })
  })

  describe('Integration with Mock Database', () => {
    it('should work with mock database operations', async () => {
      const fileData = createMockFileUpload()
      mockDb.setTableData('file_uploads', [fileData])

      // Test SELECT by ID
      const selectStmt = mockDb.prepare(FILE_UPLOAD_QUERIES.SELECT_BY_ID).bind(fileData.id)
      const result = await selectStmt.first()

      expect(result).toEqual(fileData)
    })

    it('should handle file upload creation through mock database', async () => {
      const fileData = createMockFileUpload()

      // Test INSERT
      const insertStmt = mockDb
        .prepare(FILE_UPLOAD_QUERIES.INSERT)
        .bind(
          fileData.id,
          fileData.user_id,
          fileData.filename,
          fileData.mime_type,
          fileData.size_bytes,
          fileData.r2_key,
          fileData.checksum,
          fileData.status,
          fileData.expires_at,
          fileData.created_at
        )

      const result = await insertStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)
    })

    it('should handle file lookup by R2 key', async () => {
      const fileData = createMockFileUpload()
      mockDb.setTableData('file_uploads', [fileData])

      // Test SELECT by R2 key
      const selectStmt = mockDb.prepare(FILE_UPLOAD_QUERIES.SELECT_BY_R2_KEY).bind(fileData.r2_key)
      const result = await selectStmt.first()

      expect(result).toEqual(fileData)
    })
  })
})

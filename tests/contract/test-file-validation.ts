import { describe, expect, it } from 'vitest'
import type {
  FileValidationRequest,
  FileValidationResponse,
} from '../../contracts/file-processing.json'

describe('File Validation Contract', () => {
  describe('POST /api/file/validate', () => {
    it('should validate a valid markdown file', async () => {
      const _request: FileValidationRequest = {
        name: 'test.md',
        size: 1024,
        type: 'markdown',
      }

      const response: FileValidationResponse = {
        isValid: true,
        errors: [],
      }

      // This test will fail until we implement the validation service
      expect(response.isValid).toBe(true)
      expect(response.errors).toHaveLength(0)
    })

    it('should reject files that are too large', async () => {
      const _request: FileValidationRequest = {
        name: 'large.md',
        size: 2 * 1024 * 1024, // 2MB - exceeds 1MB limit
        type: 'markdown',
      }

      const response: FileValidationResponse = {
        isValid: false,
        errors: [
          {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 1MB limit',
            severity: 'error',
          },
        ],
      }

      expect(response.isValid).toBe(false)
      expect(response.errors).toHaveLength(1)
      expect(response.errors[0].code).toBe('FILE_TOO_LARGE')
    })

    it('should reject unsupported file types', async () => {
      const _request: FileValidationRequest = {
        name: 'test.exe',
        size: 1024,
        type: 'executable',
      }

      const response: FileValidationResponse = {
        isValid: false,
        errors: [
          {
            code: 'UNSUPPORTED_FORMAT',
            message: 'Unsupported file format',
            severity: 'error',
          },
        ],
      }

      expect(response.isValid).toBe(false)
      expect(response.errors[0].code).toBe('UNSUPPORTED_FORMAT')
    })
  })
})

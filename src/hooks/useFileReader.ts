import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { logError, logWarning } from '../lib/errorHandler'
import { JsonFileModel } from '../lib/models/JsonFile'
import { invalidateQueries } from '../lib/queryClient'
import { FileValidationService } from '../lib/services/fileValidationService'
import type { JsonFile, ValidationError } from '../lib/types'

interface UseFileReaderOptions {
  maxSize?: number
  onSuccess?: (file: JsonFile) => void
  onError?: (error: ValidationError) => void
}

interface UseFileReaderReturn {
  readFile: (file: File) => Promise<{ file: JsonFile; errors: ValidationError[] }>
  validateFile: (file: File) => { isValid: boolean; errors: ValidationError[] }
  isReading: boolean
  error: Error | null
  reset: () => void
}

export const useFileReader = (options: UseFileReaderOptions = {}): UseFileReaderReturn => {
  const { maxSize = 1024 * 1024, onSuccess, onError } = options
  const _queryClient = useQueryClient()
  const [error, setError] = useState<Error | null>(null)

  const validateFile = useCallback(
    (file: File): { isValid: boolean; errors: ValidationError[] } => {
      const validationService = new FileValidationService()
      const result = validationService.validateFile({
        name: file.name,
        size: file.size,
        type: file.name.toLowerCase().endsWith('.md') ? 'markdown' : 'text',
      })

      // Log validation errors for debugging
      if (result.errors.length > 0) {
        const criticalErrors = result.errors.filter(e => e.severity === 'error')
        if (criticalErrors.length > 0) {
          logError(criticalErrors[0], 'useFileReader.validateFile')
        } else {
          logWarning(result.errors[0].message, 'useFileReader.validateFile')
        }
      }

      return result
    },
    []
  )

  const fileReadMutation = useMutation({
    mutationFn: async (file: File): Promise<{ file: JsonFile; errors: ValidationError[] }> => {
      try {
        setError(null)

        // Validate file first
        const validation = validateFile(file)
        if (!validation.isValid) {
          const criticalError = validation.errors.find(e => e.severity === 'error')
          if (criticalError) {
            throw new Error(criticalError.message)
          }
        }

        // Read and parse the file
        const jsonFile = await JsonFileModel.fromFile(file)
        const fileErrors = jsonFile.validate()

        const allErrors = [...validation.errors, ...fileErrors]

        // Notify error callback if there are errors
        if (allErrors.length > 0) {
          const criticalError = allErrors.find(e => e.severity === 'error')
          if (criticalError && onError) {
            onError(criticalError)
          }
        }

        // Notify success callback
        if (onSuccess) {
          onSuccess(jsonFile)
        }

        // Invalidate related queries
        invalidateQueries.files()

        return { file: jsonFile, errors: allErrors }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        setError(new Error(errorMessage))
        logError(error, 'useFileReader.readFile')

        // Notify error callback
        if (onError) {
          onError({
            code: 'FILE_READ_ERROR',
            message: errorMessage,
            severity: 'error',
          })
        }

        throw error
      }
    },
    onSuccess: () => {
      // Invalidate file-related queries on successful read
      invalidateQueries.files()
    },
    onError: error => {
      setError(error)
      logError(error, 'useFileReader.mutation')
    },
  })

  const readFile = useCallback(
    async (file: File): Promise<{ file: JsonFile; errors: ValidationError[] }> => {
      return fileReadMutation.mutateAsync(file)
    },
    [fileReadMutation]
  )

  const reset = useCallback(() => {
    setError(null)
    fileReadMutation.reset()
  }, [fileReadMutation])

  return {
    readFile,
    validateFile,
    isReading: fileReadMutation.isPending,
    error,
    reset,
  }
}

export default useFileReader

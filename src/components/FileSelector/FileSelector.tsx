import type React from 'react'
import { useCallback, useRef, useState } from 'react'
import { logError } from '../../lib/errorHandler'
import { JsonFileModel } from '../../lib/models/JsonFile'
import { FileValidationService } from '../../lib/services/fileValidationService'
import type { JsonFile, ValidationError } from '../../lib/types'
import './FileSelector.css'

interface FileSelectorProps {
  onFileSelect: (file: JsonFile, documents: any[], errors: ValidationError[]) => void
  onError?: (error: ValidationError) => void
  accept?: string
  maxSize?: number
  disabled?: boolean
  className?: string
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  onFileSelect,
  onError,
  accept = '.md,.txt',
  maxSize = 1024 * 1024, // 1MB
  disabled = false,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const fileValidationService = new FileValidationService()

  const validateFile = useCallback(
    (file: File): ValidationError[] => {
      const validation = fileValidationService.validateFile({
        name: file.name,
        size: file.size,
        type: file.name.toLowerCase().endsWith('.md') ? 'markdown' : 'text',
      })

      return validation.errors
    },
    [fileValidationService.validateFile]
  )

  const processFile = useCallback(
    async (file: File) => {
      try {
        setIsLoading(true)
        setValidationErrors([])

        // Validate file
        const errors = validateFile(file)
        if (errors.some(error => error.severity === 'error')) {
          setValidationErrors(errors)
          onError?.(errors.find(error => error.severity === 'error')!)
          return
        }

        // Parse file and extract JSON
        const jsonFile = await JsonFileModel.fromFile(file)
        const fileErrors = jsonFile.validate()

        if (fileErrors.some(error => error.severity === 'error')) {
          setValidationErrors(fileErrors)
          onError?.(fileErrors.find(error => error.severity === 'error')!)
          return
        }

        // For now, we'll extract JSON content here
        // In a real implementation, this would use the JsonExtractor
        const documents = [] // This will be implemented with JsonExtractor
        const allErrors = [...errors, ...fileErrors]

        setValidationErrors(allErrors.filter(error => error.severity === 'warning'))
        onFileSelect(jsonFile, documents, allErrors)
      } catch (error) {
        const errorMessage: ValidationError = {
          code: 'FILE_PROCESSING_ERROR',
          message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        }
        setValidationErrors([errorMessage])
        onError?.(errorMessage)
        logError(error, 'FileSelector.processFile')
      } finally {
        setIsLoading(false)
      }
    },
    [validateFile, onError, onFileSelect]
  )

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        processFile(file)
      }
      // Reset the input value to allow selecting the same file again
      event.target.value = ''
    },
    [processFile]
  )

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current++

    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current--

    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)
      dragCounter.current = 0

      if (disabled || isLoading) return

      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith('text/') || file.name.match(/\.(md|txt)$/i)) {
          processFile(file)
        } else {
          const error: ValidationError = {
            code: 'UNSUPPORTED_FORMAT',
            message: 'Please drop a .md or .txt file',
            severity: 'error',
          }
          setValidationErrors([error])
          onError?.(error)
        }
      }
    },
    [disabled, isLoading, processFile, onError]
  )

  const handleClick = useCallback(() => {
    if (!disabled && !isLoading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled, isLoading])

  const clearErrors = useCallback(() => {
    setValidationErrors([])
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className={`file-selector ${className}`}>
      <div
        className={`file-selector__drop-area ${isDragging ? 'file-selector__drop-area--dragover' : ''} ${disabled ? 'disabled' : ''} ${isLoading ? 'loading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Select file to upload"
        aria-disabled={disabled}
        onKeyPress={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick()
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || isLoading}
          aria-label="File input"
          style={{ display: 'none' }}
        />

        <div className="file-selector__content">
          {isLoading ? (
            <div className="file-selector__loading">
              <div className="file-selector__spinner" aria-hidden="true" />
              <p>Processing file...</p>
            </div>
          ) : (
            <div className="file-selector__default-content">
              <div className="file-selector__icon" aria-hidden="true">
                📁
              </div>
              <h3 className="file-selector__title">Drop your JSON markdown file here</h3>
              <p className="file-selector__subtitle">or click to browse</p>
              <p className="file-selector__requirements">
                Supported formats: .md, .txt (max {formatFileSize(maxSize)})
              </p>
            </div>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="file-selector__error" role="alert" aria-live="polite">
          <div className="file-selector__error-header">
            <h4>Validation Issues</h4>
            <button
              type="button"
              onClick={clearErrors}
              aria-label="Clear errors"
              className="file-selector__button file-selector__button--secondary"
            >
              ×
            </button>
          </div>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index} className={`file-selector__error-item ${error.severity}`}>
                <span className="file-selector__error-code" aria-hidden="true">
                  {error.code}
                </span>
                <span className="file-selector__error-message">{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FileSelector

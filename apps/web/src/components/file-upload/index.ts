// Export all types and interfaces
export * from './file-upload-types'

// Export validation utilities
export * from './file-validation'

// Export API service
export * from './file-upload-api'

// Export components
export { default as FileDropZone } from './file-drop-zone'
export { default as FileUploadProgressIndicator } from './file-upload-progress'
export { default as FilePreview } from './file-preview'
export { default as FileListManager } from './file-list-manager'
export { DownloadButton, BatchDownloadButton } from './download-button'
export { default as FileUploadComponent } from './file-upload-component'

// Main default export for convenience
export { default as FileUpload } from './file-upload-component'

// Re-export commonly used utilities
export {
  DEFAULT_FILE_UPLOAD_CONFIG,
  COMMON_MIME_TYPES,
  FILE_TYPE_ICONS,
  FILE_TYPE_GROUPS,
  DEFAULT_VALIDATORS,
} from './file-upload-types'

export {
  validateFile,
  validateFiles,
  isPreviewable,
  getFileCategory,
  getFileTypeDescription,
  isImageFile,
  isTextFile,
  isJsonFile,
  validateJsonContent,
  sanitizeFilename,
  generateUniqueFilename,
  getFileExtension,
  validateMimeType,
  formatFileSize,
  fileSizeToBytes,
  canUploadFiles,
} from './file-validation'

export {
  FileUploadApiService,
  fileUploadApiService,
  createFileUploadService,
} from './file-upload-api'

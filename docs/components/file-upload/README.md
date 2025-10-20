# File Upload Components

This section covers the file upload components used in the Parsify.dev application. These components provide drag-and-drop file upload with progress tracking, preview functionality, and comprehensive file management.

## File Upload Component

A comprehensive file upload component that combines all file upload functionality into a single, easy-to-use component.

### Props

```tsx
interface FileUploadComponentProps {
  /** File upload configuration */
  config?: Partial<FileUploadConfig>
  /** Custom class name */
  className?: string
  /** Whether to show drop zone */
  showDropZone?: boolean
  /** Whether to show file list */
  showFileList?: boolean
  /** Whether to show progress indicators */
  showProgress?: boolean
  /** Whether to show preview */
  showPreview?: boolean
  /** Maximum number of files to display in list */
  maxFiles?: number
  /** Layout mode */
  layout?: 'vertical' | 'horizontal' | 'grid'
  /** Event handlers */
  onFilesChange?: (files: UploadedFile[]) => void
  onUploadComplete?: (files: UploadedFile[]) => void
  onError?: (error: Error) => void
}
```

### Configuration

```tsx
interface FileUploadConfig {
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number
  /** Allowed file types (default: all files) */
  accept?: string[]
  /** Whether multiple files are allowed (default: false) */
  multiple?: boolean
  /** Whether to auto-upload files after selection (default: true) */
  autoUpload?: boolean
  /** Custom upload endpoint */
  endpoint?: string
  /** Additional headers for upload request */
  headers?: Record<string, string>
  /** Custom validation function */
  validator?: (file: File) => string | null
}
```

### Usage Examples

```tsx
import { FileUploadComponent } from '@/components/file-upload/file-upload-component'

// Basic usage
<FileUploadComponent
  onUploadComplete={(files) => console.log('Files uploaded:', files)}
  onError={(error) => console.error('Upload error:', error)}
/>

// With custom configuration
<FileUploadComponent
  config={{
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: ['image/*', '.pdf', '.doc', '.docx'],
    multiple: true,
    autoUpload: false,
    endpoint: '/api/custom/upload',
    headers: {
      'X-Custom-Header': 'value'
    }
  }}
  showPreview={true}
  showProgress={true}
  layout="grid"
  onFilesChange={(files) => setFiles(files)}
/>

// With custom validation
<FileUploadComponent
  config={{
    accept: ['.json'],
    validator: (file) => {
      if (!file.name.endsWith('.json')) {
        return 'Only JSON files are allowed'
      }
      return null
    }
  }}
  onUploadComplete={handleUploadComplete}
/>
```

### Features

- **Drag & Drop**: Intuitive drag-and-drop interface
- **File Validation**: Size, type, and custom validation
- **Progress Tracking**: Real-time upload progress with speed and time remaining
- **File Preview**: Preview for images and text files
- **Error Handling**: Comprehensive error reporting and retry functionality
- **Multiple Layouts**: Vertical, horizontal, and grid layouts
- **Accessibility**: Full keyboard navigation and screen reader support

## File Drop Zone

A drag-and-drop zone for file selection with visual feedback.

### Props

```tsx
interface FileDropZoneProps {
  /** Whether files can be dropped */
  disabled?: boolean
  /** Whether multiple files are accepted */
  multiple?: boolean
  /** Accepted file types */
  accept?: string[]
  /** Maximum file size */
  maxSize?: number
  /** Custom class name */
  className?: string
  /** Custom styles */
  style?: React.CSSProperties
  /** Children to render inside the drop zone */
  children?: React.ReactNode
  /** Event handlers */
  onDrop?: (files: File[]) => void
  onDragOver?: (event: DragOverEvent) => void
  onDragLeave?: (event: DragOverEvent) => void
  onFilesSelected?: (files: File[]) => void
}
```

### Usage Examples

```tsx
import { FileDropZone } from '@/components/file-upload/file-drop-zone'

// Basic drop zone
<FileDropZone
  multiple={true}
  accept={['image/*', '.pdf']}
  maxSize={10 * 1024 * 1024}
  onFilesSelected={handleFilesSelected}
/>

// Custom drop zone content
<FileDropZone
  accept={['.json', '.yaml']}
  onDrop={handleDrop}
>
  <div className="p-8 text-center">
    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
    <p className="mt-2 text-sm text-gray-600">
      Drop configuration files here
    </p>
    <p className="text-xs text-gray-500">
      Supports JSON and YAML files
    </p>
  </div>
</FileDropZone>

// Disabled state
<FileDropZone
  disabled={true}
  className="opacity-50"
>
  <p>Upload disabled</p>
</FileDropZone>
```

### Features

- **Visual Feedback**: Hover and drag-over states
- **File Filtering**: Automatic filtering by type and size
- **Accessibility**: Full keyboard navigation and ARIA support
- **Custom Styling**: Customizable appearance and content
- **Multiple File Support**: Handle single or multiple files

## File Upload Progress

A component for displaying upload progress with detailed metrics.

### Props

```tsx
interface FileUploadProgressProps {
  /** Progress information */
  progress: FileUploadProgress
  /** Upload status */
  status: FileUploadStatus
  /** File name */
  fileName?: string
  /** File size */
  fileSize?: number
  /** Whether to show cancel button */
  showCancelButton?: boolean
  /** Whether to show retry button */
  showRetryButton?: boolean
  /** Custom class name */
  className?: string
  /** Event handlers */
  onCancel?: () => void
  onRetry?: () => void
}

interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
  speed?: number
  timeRemaining?: number
}

type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error' | 'cancelled'
```

### Usage Examples

```tsx
import { FileUploadProgressIndicator } from '@/components/file-upload/file-upload-progress'

// Basic progress indicator
<FileUploadProgressIndicator
  progress={{
    loaded: 1024 * 1024,
    total: 5 * 1024 * 1024,
    percentage: 20,
    speed: 1024 * 512,
    timeRemaining: 8
  }}
  status="uploading"
  fileName="document.pdf"
  fileSize={5 * 1024 * 1024}
  showCancelButton={true}
  onCancel={handleCancel}
/>

// Error state with retry
<FileUploadProgressIndicator
  progress={{
    loaded: 0,
    total: 1024 * 1024,
    percentage: 0
  }}
  status="error"
  fileName="image.jpg"
  showRetryButton={true}
  onRetry={handleRetry}
/>

// Success state
<FileUploadProgressIndicator
  progress={{
    loaded: 1024 * 1024,
    total: 1024 * 1024,
    percentage: 100
  }}
  status="success"
  fileName="data.json"
/>
```

### Features

- **Real-time Progress**: Live updates during upload
- **Speed Calculation**: Upload speed and time remaining
- **Status Indicators**: Visual status indicators (uploading, success, error)
- **Action Buttons**: Cancel and retry functionality
- **File Information**: Display file name and size
- **Responsive Design**: Adapts to different screen sizes

## File Preview

A component for previewing file content before and after upload.

### Props

```tsx
interface FilePreviewProps {
  /** File to preview */
  file: UploadedFile | File
  /** Preview options */
  options?: FilePreviewOptions
  /** Custom class name */
  className?: string
  /** Maximum height for the preview */
  maxHeight?: number
  /** Whether to show copy button */
  showCopyButton?: boolean
  /** Whether to show download button */
  showDownloadButton?: boolean
  /** Event handlers */
  onCopy?: (content: string) => void
  onDownload?: (file: UploadedFile | File) => void
}

interface FilePreviewOptions {
  /** Maximum preview length for text files */
  maxLength?: number
  /** Whether to show line numbers */
  showLineNumbers?: boolean
  /** Theme for code preview */
  theme?: 'light' | 'dark'
}
```

### Usage Examples

```tsx
import { FilePreview } from '@/components/file-upload/file-preview'

// Basic file preview
<FilePreview
  file={selectedFile}
  showCopyButton={true}
  showDownloadButton={true}
  onCopy={handleCopy}
  onDownload={handleDownload}
/>

// Text file with custom options
<FilePreview
  file={textFile}
  options={{
    maxLength: 5000,
    showLineNumbers: true,
    theme: 'dark'
  }}
  maxHeight={300}
/>

// Image preview
<FilePreview
  file={imageFile}
  showCopyButton={false}
  showDownloadButton={true}
/>
```

### Features

- **Multi-format Support**: Images, text files, code files
- **Syntax Highlighting**: Automatic language detection for code files
- **Line Numbers**: Optional line numbering for text content
- **Copy to Clipboard**: Copy text content with one click
- **Theme Support**: Light and dark themes for code preview
- **Responsive Images**: Properly scaled image previews
- **Error Handling**: Graceful handling of unsupported file types

## File List Manager

A component for managing a list of uploaded files with actions.

### Props

```tsx
interface FileListManagerProps {
  /** Array of uploaded files */
  files: UploadedFile[]
  /** Maximum number of files to display */
  maxFiles?: number
  /** Whether to show file details */
  showDetails?: boolean
  /** Whether to show progress indicators */
  showProgress?: boolean
  /** Whether to show action buttons */
  showActions?: boolean
  /** Custom class name */
  className?: string
  /** Event handlers */
  onFileRemove?: (fileId: string) => void
  onFilePreview?: (file: UploadedFile) => void
  onFileDownload?: (file: UploadedFile) => void
  onFileRetry?: (fileId: string) => void
  onFileCancel?: (fileId: string) => void
}
```

### Usage Examples

```tsx
import { FileListManager } from '@/components/file-upload/file-list-manager'

// Basic file list
<FileListManager
  files={uploadedFiles}
  onFileRemove={handleRemove}
  onFilePreview={handlePreview}
/>

// With all features enabled
<FileListManager
  files={uploadedFiles}
  maxFiles={10}
  showDetails={true}
  showProgress={true}
  showActions={true}
  onFileRemove={handleRemove}
  onFilePreview={handlePreview}
  onFileDownload={handleDownload}
  onFileRetry={handleRetry}
  onFileCancel={handleCancel}
/>
```

### Features

- **File Management**: Add, remove, and organize files
- **Progress Display**: Show upload progress for each file
- **Bulk Actions**: Remove all, retry failed files
- **File Information**: Display file name, size, type, and status
- **Status Indicators**: Visual indicators for upload status
- **Search and Filter**: Find specific files in large lists

## Download Button

A button component for downloading files with loading states.

### Props

```tsx
interface DownloadButtonProps {
  /** File to download */
  file: UploadedFile | File
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Custom class name */
  className?: string
  /** Custom download text */
  children?: React.ReactNode
  /** Download options */
  downloadOptions?: FileDownloadOptions
  /** Event handlers */
  onDownloadStart?: () => void
  onDownloadComplete?: () => void
  onDownloadError?: (error: Error) => void
}

interface FileDownloadOptions {
  /** Custom filename */
  filename?: string
  /** Whether to open in new tab instead of downloading */
  openInNewTab?: boolean
}
```

### Usage Examples

```tsx
import { DownloadButton } from '@/components/file-upload/download-button'

// Basic download button
<DownloadButton file={uploadedFile} />

// Custom filename and options
<DownloadButton
  file={uploadedFile}
  downloadOptions={{
    filename: 'custom-name.json',
    openInNewTab: false
  }}
  onDownloadComplete={() => console.log('Download complete')}
>
  Download Report
</DownloadButton>

// Icon-only button
<DownloadButton
  file={uploadedFile}
  size="icon"
  variant="outline"
>
  <DownloadIcon className="h-4 w-4" />
</DownloadButton>
```

### Features

- **Direct Download**: Download files from URLs or File objects
- **Custom Filenames**: Override original filenames
- **Loading States**: Show loading indicators during download
- **Error Handling**: Handle download errors gracefully
- **Multiple Variants**: Different button styles and sizes
- **Event Callbacks**: Track download start, completion, and errors

## File Validation

Utilities for validating files before upload.

### Types

```tsx
interface FileValidationError {
  code: 'size' | 'type' | 'count' | 'custom'
  message: string
  file?: File
}

interface ValidationResult {
  validFiles: File[]
  errors: FileValidationError[]
}
```

### Usage Examples

```tsx
import { validateFiles } from '@/components/file-upload/file-validation'

// Basic validation
const result = validateFiles(files, {
  maxSize: 5 * 1024 * 1024,
  accept: ['image/*'],
  multiple: true
})

if (result.errors.length > 0) {
  console.error('Validation errors:', result.errors)
}

// Custom validation
const result = validateFiles(files, {
  accept: ['.json'],
  validator: (file) => {
    try {
      const content = JSON.parse(await file.text())
      if (!content.requiredField) {
        return 'JSON must contain requiredField'
      }
    } catch {
      return 'Invalid JSON format'
    }
    return null
  }
})
```

### Features

- **Size Validation**: Check file sizes against limits
- **Type Validation**: Validate file types and extensions
- **Count Validation**: Limit number of files
- **Custom Validation**: Add custom validation logic
- **Detailed Errors**: Specific error messages for each validation failure

## File Upload API

Service class for handling file upload requests.

### Usage Examples

```tsx
import { fileUploadApiService } from '@/components/file-upload/file-upload-api'

// Create API service instance
const apiService = new fileUploadApiService({
  baseUrl: '/api/files',
  defaultHeaders: {
    'Authorization': `Bearer ${token}`
  }
})

// Upload single file
const result = await apiService.uploadFile(file, {
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress.percentage}%`)
  }
})

// Upload multiple files
const results = await apiService.uploadFiles(files, options)

// Cancel upload
apiService.cancelUpload(fileId)

// Get upload status
const status = await apiService.getUploadStatus(fileId)
```

### Features

- **HTTP Requests**: Handles multipart/form-data uploads
- **Progress Tracking**: Real-time upload progress
- **Cancellation**: Cancel in-progress uploads
- **Error Handling**: Comprehensive error handling and retry logic
- **Authentication**: Support for authenticated uploads
- **Chunked Upload**: Support for large file uploads

## File Types and Constants

### Common MIME Types

```tsx
export const COMMON_MIME_TYPES = {
  JSON: ['application/json', 'text/json'],
  TEXT: ['text/plain', 'text/csv', 'text/markdown', 'text/html'],
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ARCHIVE: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
}
```

### File Type Icons

```tsx
export const FILE_TYPE_ICONS = {
  json: '📄',
  text: '📝',
  image: '🖼️',
  document: '📄',
  spreadsheet: '📊',
  archive: '📦',
  default: '📁',
}
```

## Best Practices

### 1. Security
- Always validate file types on the server
- Scan uploaded files for malware
- Use secure file storage with proper permissions
- Implement file size limits to prevent abuse

### 2. Performance
- Use chunked uploads for large files
- Implement proper caching strategies
- Optimize images during upload
- Use compression when appropriate

### 3. User Experience
- Provide clear progress indicators
- Show estimated time remaining
- Allow cancellation of long uploads
- Provide immediate feedback for errors

### 4. Accessibility
- Ensure keyboard navigation works
- Provide screen reader announcements
- Use proper ARIA labels and roles
- Maintain focus management

### 5. Error Handling
- Provide clear error messages
- Offer retry mechanisms for transient errors
- Log errors for debugging
- Handle network interruptions gracefully

## Integration Examples

### Complete File Upload Flow

```tsx
import React, { useState } from 'react'
import { FileUploadComponent } from '@/components/file-upload/file-upload-component'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function DocumentUpload() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFilesChange = (files) => {
    setUploadedFiles(files)
  }

  const handleUploadComplete = (files) => {
    setIsUploading(false)
    console.log('All files uploaded successfully:', files)
  }

  const handleError = (error) => {
    setIsUploading(false)
    console.error('Upload failed:', error)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <FileUploadComponent
          config={{
            maxSize: 10 * 1024 * 1024, // 10MB
            accept: ['.pdf', '.doc', '.docx', '.txt'],
            multiple: true,
            autoUpload: true
          }}
          showPreview={true}
          showProgress={true}
          layout="vertical"
          onFilesChange={handleFilesChange}
          onUploadComplete={handleUploadComplete}
          onError={handleError}
        />
        
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            {/* Display uploaded files */}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```
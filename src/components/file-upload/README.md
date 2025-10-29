# File Upload Components

A comprehensive file upload system for the Parsify application with drag & drop support, progress tracking, file preview, and validation.

## Features

- **Drag & Drop Support**: Intuitive file upload with drag and drop interface
- **Progress Tracking**: Real-time upload progress with percentage, speed, and time remaining
- **File Preview**: Preview for JSON, text, and image files with syntax highlighting
- **Validation**: File size, type, and custom validation support
- **Multiple File Upload**: Support for single or multiple file uploads
- **Error Handling**: Comprehensive error handling with retry functionality
- **Download Support**: Built-in download buttons for uploaded files
- **Responsive Design**: Mobile-friendly with Tailwind CSS styling
- **API Integration**: Ready to connect with R2 storage or any backend

## Components

### FileUploadComponent (Main Component)

The main wrapper component that combines all functionality:

```tsx
import { FileUpload } from '@/components/file-upload'

<FileUpload
  config={{
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: ['.json', '.txt', 'image/*'],
    multiple: true,
    autoUpload: true,
    endpoint: '/api/files/upload'
  }}
  showDropZone={true}
  showFileList={true}
  showProgress={true}
  showPreview={false}
  onFilesChange={(files) => console.log('Files changed:', files)}
  onUploadComplete={(files) => console.log('Upload complete:', files)}
/>
```

### Individual Components

#### FileDropZone

Drag and drop zone component:

```tsx
import { FileDropZone } from '@/components/file-upload'

<FileDropZone
  multiple={true}
  accept={['.json', '.txt']}
  maxSize={10 * 1024 * 1024}
  onDrop={(files) => console.log('Files dropped:', files)}
  onFilesSelected={(files) => console.log('Files selected:', files)}
/>
```

#### FileListManager

Display and manage uploaded files:

```tsx
import { FileListManager } from '@/components/file-upload'

<FileListManager
  files={uploadedFiles}
  showDetails={true}
  showProgress={true}
  showActions={true}
  onFileRemove={(fileId) => console.log('Remove file:', fileId)}
  onFileDownload={(file) => console.log('Download file:', file)}
/>
```

#### FilePreview

Preview file contents:

```tsx
import { FilePreview } from '@/components/file-upload'

<FilePreview
  file={selectedFile}
  options={{
    maxLength: 10000,
    showLineNumbers: true,
    theme: 'light'
  }}
  onCopy={(content) => console.log('Copied:', content)}
  onDownload={(file) => console.log('Download:', file)}
/>
```

#### DownloadButton

Download button for files:

```tsx
import { DownloadButton } from '@/components/file-upload'

<DownloadButton
  file={uploadedFile}
  options={{
    filename: 'custom-name.json',
    openInNewTab: false
  }}
  onDownloadComplete={(file) => console.log('Download complete:', file)}
/>
```

## File Validation

### Built-in Validators

```tsx
import { DEFAULT_VALIDATORS } from '@/components/file-upload'

// For JSON files
<FileUpload config={DEFAULT_VALIDATORS.JSON} />

// For images
<FileUpload config={DEFAULT_VALIDATORS.IMAGES} />

// For documents
<FileUpload config={DEFAULT_VALIDATORS.DOCUMENTS} />
```

### Custom Validation

```tsx
import { validateFile } from '@/components/file-upload'

const customValidator = (file: File) => {
  if (file.name.includes('sensitive')) {
    return 'Files containing "sensitive" in the name are not allowed'
  }
  return null
}

<FileUpload
  config={{
    validator: customValidator,
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: ['.json', '.txt']
  }}
/>
```

## File Type Groups

```tsx
import { FILE_TYPE_GROUPS } from '@/components/file-upload'

<FileUpload
  config={{
    accept: FILE_TYPE_GROUPS.IMAGES, // or DOCUMENTS, CODE, TEXT, etc.
  }}
/>
```

## API Service

### Basic Usage

```tsx
import { fileUploadApiService } from '@/components/file-upload'

// Upload a single file
const uploadedFile = await fileUploadApiService.uploadFile(file, options, onProgress)

// Upload multiple files
const uploadedFiles = await fileUploadApiService.uploadFiles(files, options, onProgress)

// Cancel upload
fileUploadApiService.cancelUpload(fileId)

// Get file info
const fileInfo = await fileUploadApiService.getFileInfo(fileId)
```

### Custom API Service

```tsx
import { createFileUploadService } from '@/components/file-upload'

const customService = createFileUploadService({
  baseUrl: 'https://your-api.com/files',
  defaultHeaders: {
    'Authorization': 'Bearer your-token',
    'X-Custom-Header': 'value'
  },
  timeout: 60000,
  useChunkedUpload: true,
  chunkSize: 2 * 1024 * 1024, // 2MB chunks
  maxConcurrentUploads: 5,
  retryConfig: {
    maxAttempts: 5,
    retryDelay: 2000,
    retryCondition: (error) => !error.message.includes('404')
  }
})
```

## Utility Functions

```tsx
import {
  formatFileSize,
  isJsonFile,
  isImageFile,
  sanitizeFilename,
  generateUniqueFilename,
  validateJsonContent
} from '@/components/file-upload'

// Format file size
console.log(formatFileSize(1024 * 1024)) // "1 MB"

// Check file type
console.log(isJsonFile(file)) // true/false

// Sanitize filename
console.log(sanitizeFilename('my file:name.txt')) // "my_file_name.txt"

// Validate JSON content
const result = validateJsonContent('{"invalid": json}')
console.log(result.isValid) // false
console.log(result.error) // "Unexpected token..."
```

## Styling

All components use Tailwind CSS classes and can be customized with the `className` prop:

```tsx
<FileUpload
  className="custom-upload-styles"
  config={{
    // ...config
  }}
/>

<FileDropZone
  className="border-2 border-dashed border-blue-500 bg-blue-50"
  // ...props
/>
```

## Accessibility

All components include proper ARIA attributes and keyboard navigation support:

- Semantic HTML elements
- ARIA labels and descriptions
- Keyboard navigation (Tab, Enter, Space, Escape)
- Focus management
- Screen reader support

## Error Handling

The system provides comprehensive error handling:

- File validation errors with detailed messages
- Network error handling with retry functionality
- Upload cancellation support
- Timeout handling
- Custom error messages through validation

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- File API support
- Drag and Drop API support
- Fetch API support
- ES2020+ JavaScript features

## Examples

### Basic JSON File Upload

```tsx
import { FileUpload } from '@/components/file-upload'

export function JsonUploader() {
  return (
    <FileUpload
      config={{
        accept: ['.json', 'application/json'],
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false,
        autoUpload: true,
        validator: (file) => {
          if (!file.name.endsWith('.json')) {
            return 'Please upload a valid JSON file'
          }
          return null
        }
      }}
      showPreview={true}
      onUploadComplete={(files) => {
        console.log('JSON file uploaded:', files[0])
      }}
    />
  )
}
```

### Multi-File Image Gallery

```tsx
import { FileUpload, FileListManager } from '@/components/file-upload'

export function ImageGallery() {
  const [files, setFiles] = useState([])

  return (
    <div>
      <FileUpload
        config={{
          accept: FILE_TYPE_GROUPS.IMAGES,
          maxSize: 50 * 1024 * 1024, // 50MB
          multiple: true,
          autoUpload: true
        }}
        showFileList={false}
        onFilesChange={setFiles}
      />
      
      <FileListManager
        files={files}
        maxFiles={20}
        showDetails={false}
        onFilePreview={(file) => {
          // Open preview modal
        }}
      />
    </div>
  )
}
```

## Props Reference

### FileUploadComponent Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| config | `Partial<FileUploadConfig>` | `{}` | Upload configuration |
| className | `string` | `""` | Custom CSS classes |
| showDropZone | `boolean` | `true` | Show drop zone |
| showFileList | `boolean` | `true` | Show file list |
| showProgress | `boolean` | `true` | Show progress indicators |
| showPreview | `boolean` | `false` | Show file preview |
| maxFiles | `number` | `undefined` | Max files to display |
| layout | `'vertical' \| 'horizontal' \| 'grid'` | `'vertical'` | Layout mode |
| onFilesChange | `(files: UploadedFile[]) => void` | `undefined` | Files change handler |
| onUploadComplete | `(files: UploadedFile[]) => void` | `undefined` | Upload complete handler |
| onError | `(error: Error) => void` | `undefined` | Error handler |

### FileUploadConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| maxSize | `number` | `10485760` (10MB) | Max file size in bytes |
| accept | `string[]` | `[]` | Accepted file types |
| multiple | `boolean` | `false` | Allow multiple files |
| autoUpload | `boolean` | `true` | Auto-upload after selection |
| endpoint | `string` | `'/api/files/upload'` | Upload endpoint |
| headers | `Record<string, string>` | `{}` | Request headers |
| validator | `(file: File) => string \| null` | `undefined` | Custom validator |

## Contributing

When adding new features to the file upload system:

1. Follow the existing component patterns
2. Add proper TypeScript types
3. Include accessibility attributes
4. Add comprehensive error handling
5. Write tests for new functionality
6. Update documentation
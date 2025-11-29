export interface FileUploadOptions {
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Allowed file types (default: all files) */
  accept?: string[];
  /** Whether multiple files are allowed (default: false) */
  multiple?: boolean;
  /** Whether to auto-upload files after selection (default: true) */
  autoUpload?: boolean;
  /** Custom upload endpoint */
  endpoint?: string;
  /** Additional headers for upload request */
  headers?: Record<string, string>;
  /** Custom validation function */
  validator?: (file: File) => string | null;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  url?: string;
  preview?: string;
  status: FileUploadStatus;
  progress: number;
  error?: string;
  metadata?: Record<string, string | number | boolean>;
}

export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error' | 'cancelled';

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number;
  timeRemaining?: number;
}

export interface FileValidationError {
  code: 'size' | 'type' | 'count' | 'custom';
  message: string;
  file?: File;
}

export interface FileUploadResponse {
  success: boolean;
  file?: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    metadata?: Record<string, string | number | boolean>;
  };
  error?: string;
}

export interface FilePreviewOptions {
  /** Maximum preview length for text files */
  maxLength?: number;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Theme for code preview */
  theme?: 'light' | 'dark';
}

export interface FileDownloadOptions {
  /** Custom filename */
  filename?: string;
  /** Whether to open in new tab instead of downloading */
  openInNewTab?: boolean;
}

export type DragOverEvent = React.DragEvent<HTMLDivElement>;
export type FileChangeEvent = React.ChangeEvent<HTMLInputElement>;

export interface FileUploadEvents {
  onFilesSelected?: (files: File[]) => void;
  onFileUploadStart?: (file: UploadedFile) => void;
  onFileUploadProgress?: (fileId: string, progress: FileUploadProgress) => void;
  onFileUploadSuccess?: (file: UploadedFile) => void;
  onFileUploadError?: (fileId: string, error: string) => void;
  onFileUploadCancel?: (fileId: string) => void;
  onFileRemove?: (fileId: string) => void;
  onFileDownload?: (file: UploadedFile) => void;
  onDrop?: (files: File[]) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragLeave?: (event: DragOverEvent) => void;
}

export interface FileUploadConfig extends FileUploadOptions, FileUploadEvents {}

// Default configuration
export const DEFAULT_FILE_UPLOAD_CONFIG: Required<
  Omit<FileUploadConfig, 'validator' | keyof FileUploadEvents>
> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  accept: [],
  multiple: false,
  autoUpload: true,
  endpoint: '/api/files/upload',
  headers: {},
};

// Common MIME types
export const COMMON_MIME_TYPES = {
  JSON: ['application/json', 'text/json'],
  TEXT: ['text/plain', 'text/csv', 'text/markdown', 'text/html'],
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  SPREADSHEET: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ARCHIVE: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
} as const;

// File type icons
export const FILE_TYPE_ICONS = {
  json: '📄',
  text: '📝',
  image: '🖼️',
  document: '📄',
  spreadsheet: '📊',
  archive: '📦',
  default: '📁',
} as const;

export type FileTypeCategory = keyof typeof COMMON_MIME_TYPES;

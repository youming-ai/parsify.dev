import { z } from 'zod'

// File upload status
export const FileUploadStatusSchema = z.enum(['uploading', 'completed', 'expired', 'failed'])
export type FileUploadStatus = z.infer<typeof FileUploadStatusSchema>

// File upload schema for validation
export const FileUploadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(1),
  size_bytes: z.number().min(0),
  r2_key: z.string().min(1),
  checksum: z.string().length(64).nullable(), // SHA-256 hash
  status: FileUploadStatusSchema.default('uploading'),
  expires_at: z.number().nullable(),
  created_at: z.number()
})

export type FileUpload = z.infer<typeof FileUploadSchema>

// File upload creation schema
export const CreateFileUploadSchema = FileUploadSchema.partial({
  id: true,
  status: true,
  expires_at: true,
  created_at: true
})

export type CreateFileUpload = z.infer<typeof CreateFileUploadSchema>

// File upload update schema
export const UpdateFileUploadSchema = FileUploadSchema.partial({
  id: true,
  user_id: true,
  filename: true,
  mime_type: true,
  size_bytes: true,
  r2_key: true,
  created_at: true
})

export type UpdateFileUpload = z.infer<typeof UpdateFileUploadSchema>

// File upload options
export const FileUploadOptionsSchema = z.object({
  max_size_bytes: z.number().min(1).default(10 * 1024 * 1024), // 10MB default
  allowed_mime_types: z.array(z.string()).default([
    'application/json',
    'text/plain',
    'text/csv',
    'application/xml',
    'text/xml',
    'application/javascript',
    'application/typescript',
    'text/html',
    'text/css'
  ]),
  retention_hours: z.number().min(1).default(72), // 3 days default
  require_auth: z.boolean().default(false)
})

export type FileUploadOptions = z.infer<typeof FileUploadOptionsSchema>

// File model class
export class FileUpload {
  public id: string
  public user_id: string | null
  public filename: string
  public mime_type: string
  public size_bytes: number
  public r2_key: string
  public checksum: string | null
  public status: FileUploadStatus
  public expires_at: number | null
  public created_at: number

  constructor(data: FileUpload) {
    this.id = data.id
    this.user_id = data.user_id
    this.filename = data.filename
    this.mime_type = data.mime_type
    this.size_bytes = data.size_bytes
    this.r2_key = data.r2_key
    this.checksum = data.checksum
    this.status = data.status
    this.expires_at = data.expires_at
    this.created_at = data.created_at
  }

  // Static methods for database operations
  static create(data: CreateFileUpload, options?: FileUploadOptions): FileUpload {
    const now = Math.floor(Date.now() / 1000)
    const opts = options || {}

    return new FileUpload({
      id: crypto.randomUUID(),
      status: 'uploading',
      created_at: now,
      expires_at: opts.retention_hours ? now + (opts.retention_hours * 3600) : null,
      ...data
    })
  }

  static fromRow(row: any): FileUpload {
    return new FileUpload(FileUploadSchema.parse(row))
  }

  toRow(): Record<string, any> {
    return {
      id: this.id,
      user_id: this.user_id,
      filename: this.filename,
      mime_type: this.mime_type,
      size_bytes: this.size_bytes,
      r2_key: this.r2_key,
      checksum: this.checksum,
      status: this.status,
      expires_at: this.expires_at,
      created_at: this.created_at
    }
  }

  update(data: UpdateFileUpload): FileUpload {
    return new FileUpload({
      ...this,
      ...data
    })
  }

  // File lifecycle methods
  complete(checksum?: string): FileUpload {
    return this.update({
      status: 'completed',
      checksum: checksum || null
    })
  }

  fail(): FileUpload {
    return this.update({
      status: 'failed'
    })
  }

  expire(): FileUpload {
    return this.update({
      status: 'expired'
    })
  }

  extendExpiration(hours: number): FileUpload {
    const newExpiresAt = Math.floor(Date.now() / 1000) + (hours * 3600)
    return this.update({
      expires_at: newExpiresAt
    })
  }

  // Helper methods
  get isUploading(): boolean {
    return this.status === 'uploading'
  }

  get isCompleted(): boolean {
    return this.status === 'completed'
  }

  get isExpired(): boolean {
    return this.status === 'expired' || (this.expires_at && Date.now() / 1000 > this.expires_at)
  }

  get isFailed(): boolean {
    return this.status === 'failed'
  }

  get isAccessible(): boolean {
    return this.isCompleted && !this.isExpired
  }

  get isAnonymous(): boolean {
    return this.user_id === null
  }

  get sizeString(): string {
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return formatBytes(this.size_bytes)
  }

  get fileExtension(): string {
    const parts = this.filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
  }

  get isTextFile(): boolean {
    const textMimeTypes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/typescript',
      'application/xml',
      'application/xhtml+xml'
    ]
    return textMimeTypes.some(type => this.mime_type.startsWith(type))
  }

  get isJsonFile(): boolean {
    return this.mime_type === 'application/json' || this.fileExtension === 'json'
  }

  get isCodeFile(): boolean {
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs']
    const codeMimeTypes = [
      'application/javascript',
      'application/typescript',
      'text/x-python',
      'text/x-java-source',
      'text/x-c++src'
    ]
    return codeExtensions.includes(this.fileExtension) ||
           codeMimeTypes.some(type => this.mime_type.startsWith(type))
  }

  get remainingTime(): number | null {
    if (!this.expires_at) return null
    const remaining = this.expires_at - Math.floor(Date.now() / 1000)
    return Math.max(0, remaining)
  }

  get remainingTimeString(): string {
    const remaining = this.remainingTime
    if (remaining === null) return 'No expiration'

    if (remaining <= 0) return 'Expired'

    const hours = Math.floor(remaining / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    const seconds = remaining % 60

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''}`
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }

    return `${seconds}s`
  }

  // Validation methods
  static validateFilename(filename: string): { valid: boolean; error?: string } {
    if (!filename || filename.trim().length === 0) {
      return { valid: false, error: 'Filename cannot be empty' }
    }

    if (filename.length > 255) {
      return { valid: false, error: 'Filename too long (max 255 characters)' }
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
    if (invalidChars.test(filename)) {
      return { valid: false, error: 'Filename contains invalid characters' }
    }

    // Check for reserved names on Windows
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
    if (reservedNames.test(filename)) {
      return { valid: false, error: 'Filename is reserved' }
    }

    return { valid: true }
  }

  static validateMimeType(mimeType: string, allowedTypes: string[]): { valid: boolean; error?: string } {
    if (!mimeType) {
      return { valid: false, error: 'MIME type is required' }
    }

    const isAllowed = allowedTypes.length === 0 ||
                     allowedTypes.some(type => {
                       if (type.endsWith('/*')) {
                         return mimeType.startsWith(type.slice(0, -1))
                       }
                       return mimeType === type
                     })

    if (!isAllowed) {
      return { valid: false, error: `MIME type ${mimeType} is not allowed` }
    }

    return { valid: true }
  }

  static validateFileSize(sizeBytes: number, maxSizeBytes: number): { valid: boolean; error?: string } {
    if (sizeBytes < 0) {
      return { valid: false, error: 'File size cannot be negative' }
    }

    if (sizeBytes > maxSizeBytes) {
      const maxSizeString = this.formatBytes(maxSizeBytes)
      return { valid: false, error: `File size exceeds maximum allowed size (${maxSizeString})` }
    }

    return { valid: true }
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Factory methods
  static createForUpload(
    filename: string,
    mimeType: string,
    sizeBytes: number,
    userId?: string,
    options?: FileUploadOptions
  ): FileUpload {
    const opts = options || {}
    const r2Key = userId
      ? `users/${userId}/${Date.now()}-${filename}`
      : `anonymous/${Date.now()}-${filename}`

    return FileUpload.create({
      user_id: userId || null,
      filename,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      r2_key: r2Key
    }, opts)
  }

  static createWithR2Key(
    filename: string,
    mimeType: string,
    sizeBytes: number,
    r2Key: string,
    userId?: string,
    options?: FileUploadOptions
  ): FileUpload {
    return FileUpload.create({
      user_id: userId || null,
      filename,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      r2_key: r2Key
    }, options)
  }
}

// SQL queries
export const FILE_UPLOAD_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS file_uploads (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      r2_key TEXT NOT NULL,
      checksum TEXT,
      status TEXT NOT NULL DEFAULT 'uploading',
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `,

  CREATE_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status);',
    'CREATE INDEX IF NOT EXISTS idx_file_uploads_expires_at ON file_uploads(expires_at);',
    'CREATE INDEX IF NOT EXISTS idx_file_uploads_r2_key ON file_uploads(r2_key);',
    'CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);'
  ],

  INSERT: `
    INSERT INTO file_uploads (id, user_id, filename, mime_type, size_bytes, r2_key, checksum, status, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,

  SELECT_BY_ID: `
    SELECT * FROM file_uploads WHERE id = ?;
  `,

  SELECT_BY_USER: `
    SELECT * FROM file_uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_BY_R2_KEY: `
    SELECT * FROM file_uploads WHERE r2_key = ?;
  `,

  SELECT_BY_STATUS: `
    SELECT * FROM file_uploads WHERE status = ? ORDER BY created_at DESC;
  `,

  SELECT_EXPIRED: `
    SELECT * FROM file_uploads WHERE expires_at IS NOT NULL AND expires_at < ?;
  `,

  SELECT_COMPLETED: `
    SELECT * FROM file_uploads WHERE status = 'completed' AND (expires_at IS NULL OR expires_at > ?) ORDER BY created_at DESC;
  `,

  SELECT_COMPLETED_BY_USER: `
    SELECT * FROM file_uploads
    WHERE user_id = ? AND status = 'completed' AND (expires_at IS NULL OR expires_at > ?)
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?;
  `,

  UPDATE: `
    UPDATE file_uploads
    SET filename = ?, mime_type = ?, size_bytes = ?, r2_key = ?, checksum = ?, status = ?, expires_at = ?
    WHERE id = ?;
  `,

  UPDATE_STATUS: `
    UPDATE file_uploads SET status = ? WHERE id = ?;
  `,

  UPDATE_CHECKSUM: `
    UPDATE file_uploads SET checksum = ?, status = 'completed' WHERE id = ?;
  `,

  DELETE: `
    DELETE FROM file_uploads WHERE id = ?;
  `,

  DELETE_BY_USER: `
    DELETE FROM file_uploads WHERE user_id = ?;
  `,

  COUNT: `
    SELECT COUNT(*) as count FROM file_uploads;
  `,

  COUNT_BY_USER: `
    SELECT COUNT(*) as count FROM file_uploads WHERE user_id = ?;
  `,

  COUNT_BY_STATUS: `
    SELECT COUNT(*) as count FROM file_uploads WHERE status = ?;
  `,

  SUM_SIZE_BY_USER: `
    SELECT SUM(size_bytes) as total_size, COUNT(*) as file_count FROM file_uploads WHERE user_id = ? AND status = 'completed';
  `,

  // Cleanup queries
  DELETE_EXPIRED_FILES: `
    DELETE FROM file_uploads WHERE expires_at IS NOT NULL AND expires_at < ?;
  `,

  DELETE_OLD_FAILED_FILES: `
    DELETE FROM file_uploads WHERE status = 'failed' AND created_at < ?;
  `,

  // Analytics queries
  STORAGE_ANALYTICS: `
    SELECT
      user_id,
      COUNT(*) as file_count,
      SUM(size_bytes) as total_size_bytes,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_files,
      SUM(CASE WHEN status = 'uploading' THEN 1 ELSE 0 END) as uploading_files,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_files
    FROM file_uploads
    WHERE created_at >= ?
    GROUP BY user_id
    ORDER BY total_size_bytes DESC;
  `
} as const
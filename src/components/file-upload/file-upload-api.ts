import type {
  FileUploadOptions,
  FileUploadProgress,
  FileUploadResponse,
  UploadedFile,
} from './file-upload-types';

export interface FileUploadApiConfig {
  /** Base URL for upload endpoints */
  baseUrl?: string;
  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to use chunked upload for large files */
  useChunkedUpload?: boolean;
  /** Chunk size in bytes for chunked uploads */
  chunkSize?: number;
  /** Maximum number of concurrent uploads */
  maxConcurrentUploads?: number;
  /** Retry configuration */
  retryConfig?: {
    maxAttempts: number;
    retryDelay: number;
    retryCondition?: (error: Error) => boolean;
  };
}

export class FileUploadApiService {
  private config: Required<FileUploadApiConfig>;
  private activeUploads = new Map<string, AbortController>();
  private uploadQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor(config: FileUploadApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '/api/files',
      defaultHeaders: config.defaultHeaders || {},
      timeout: config.timeout || 30000,
      useChunkedUpload: config.useChunkedUpload || false,
      chunkSize: config.chunkSize || 1024 * 1024, // 1MB
      maxConcurrentUploads: config.maxConcurrentUploads || 3,
      retryConfig: {
        maxAttempts: config.retryConfig?.maxAttempts || 3,
        retryDelay: config.retryConfig?.retryDelay || 1000,
        retryCondition: config.retryConfig?.retryCondition || (() => true),
      },
    };
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    file: File,
    options: FileUploadOptions = {},
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile> {
    const fileId = this.generateFileId(file);
    const _endpoint = options.endpoint || `${this.config.baseUrl}/upload`;

    // Create abort controller for this upload
    const controller = new AbortController();
    this.activeUploads.set(fileId, controller);

    try {
      // Add to queue if concurrent uploads limit is reached
      if (this.activeUploads.size >= this.config.maxConcurrentUploads) {
        await this.addToQueue(() => this.performUpload(file, options, onProgress, controller));
      } else {
        await this.performUpload(file, options, onProgress, controller);
      }

      // Return uploaded file metadata
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        status: 'success',
        progress: 100,
      };

      return uploadedFile;
    } catch (error) {
      const _uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      };

      throw error;
    } finally {
      this.activeUploads.delete(fileId);
      this.processQueue();
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    options: FileUploadOptions = {},
    onProgress?: (fileId: string, progress: FileUploadProgress) => void
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, options, (progress) => {
        const fileId = this.generateFileId(file);
        onProgress?.(fileId, progress);
      })
    );

    return Promise.allSettled(uploadPromises).then((results) => {
      return results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        // Create error file object for failed uploads
        const file = files[results.indexOf(result)];
        return {
          id: this.generateFileId(file),
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          status: 'error' as const,
          progress: 0,
          error: result.reason instanceof Error ? result.reason.message : 'Upload failed',
        };
      });
    });
  }

  /**
   * Cancel an ongoing upload
   */
  cancelUpload(fileId: string): boolean {
    const controller = this.activeUploads.get(fileId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(fileId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all ongoing uploads
   */
  cancelAllUploads(): void {
    for (const [_fileId, controller] of this.activeUploads) {
      controller.abort();
    }
    this.activeUploads.clear();
    this.uploadQueue = [];
  }

  /**
   * Get file information from server
   */
  async getFileInfo(fileId: string): Promise<UploadedFile | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/info/${fileId}`, {
        headers: this.config.defaultHeaders,
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to get file info: ${response.statusText}`);
      }

      const fileInfo = await response.json();
      return {
        ...fileInfo,
        status: 'success',
        progress: 100,
      };
    } catch (error) {
      throw new Error(
        `Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a file from server
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/delete/${fileId}`, {
        method: 'DELETE',
        headers: this.config.defaultHeaders,
      });

      return response.ok;
    } catch (error) {
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get download URL for a file
   */
  getDownloadUrl(fileId: string, filename?: string): string {
    const params = new URLSearchParams();
    if (filename) {
      params.append('filename', filename);
    }
    return `${this.config.baseUrl}/download/${fileId}${params.toString() ? `?${params.toString()}` : ''}`;
  }

  /**
   * Generate a signed URL for direct upload (useful for large files)
   */
  async generateSignedUploadUrl(
    filename: string,
    contentType: string,
    fileSize: number
  ): Promise<{ uploadUrl: string; fileId: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.defaultHeaders,
        },
        body: JSON.stringify({
          filename,
          contentType,
          fileSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate signed URL: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Upload file using signed URL (for direct uploads)
   */
  async uploadWithSignedUrl(
    file: File,
    signedUrl: string,
    fileId: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<void> {
    const controller = new AbortController();
    this.activeUploads.set(fileId, controller);

    try {
      await this.uploadToSignedUrl(file, signedUrl, onProgress, controller);
    } finally {
      this.activeUploads.delete(fileId);
    }
  }

  private async performUpload(
    file: File,
    options: FileUploadOptions,
    onProgress?: (progress: FileUploadProgress) => void,
    controller?: AbortController
  ): Promise<FileUploadResponse> {
    const endpoint = options.endpoint || `${this.config.baseUrl}/upload`;
    const headers = {
      ...this.config.defaultHeaders,
      ...options.headers,
    };

    if (this.config.useChunkedUpload && file.size > this.config.chunkSize) {
      return this.uploadChunked(file, endpoint, headers, onProgress, controller);
    }
    return this.uploadSingle(file, endpoint, headers, onProgress, controller);
  }

  private async uploadSingle(
    file: File,
    endpoint: string,
    headers: Record<string, string>,
    onProgress?: (progress: FileUploadProgress) => void,
    _controller?: AbortController
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional metadata
    if (headers['X-File-Metadata']) {
      formData.append('metadata', headers['X-File-Metadata']);
      delete headers['X-File-Metadata'];
    }

    let attempt = 0;
    const maxAttempts = this.config.retryConfig.maxAttempts;

    while (attempt < maxAttempts) {
      try {
        const xhr = new XMLHttpRequest();

        return await new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
              const progress: FileUploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: (event.loaded / event.total) * 100,
                speed: this.calculateUploadSpeed(event.loaded, Date.now()),
                timeRemaining: this.calculateTimeRemaining(event.loaded, event.total, Date.now()),
              };
              onProgress(progress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (_error) {
                reject(new Error('Invalid response from server'));
              }
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
          });

          xhr.timeout = this.config.timeout;
          xhr.ontimeout = () => {
            reject(new Error('Upload timeout'));
          };

          xhr.open('POST', endpoint);

          // Set headers
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });

          xhr.send(formData);
        });
      } catch (error) {
        attempt++;

        if (
          attempt >= maxAttempts ||
          !this.config.retryConfig?.retryCondition?.(
            error instanceof Error ? error : new Error('Unknown error')
          )
        ) {
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryConfig.retryDelay * attempt)
        );
      }
    }

    throw new Error('Upload failed after maximum retries');
  }

  private async uploadChunked(
    file: File,
    endpoint: string,
    headers: Record<string, string>,
    onProgress?: (progress: FileUploadProgress) => void,
    controller?: AbortController
  ): Promise<FileUploadResponse> {
    // Initialize chunked upload
    const initResponse = await fetch(`${endpoint}/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        filename: file.name,
        fileSize: file.size,
        contentType: file.type,
        chunkSize: this.config.chunkSize,
      }),
      signal: controller?.signal,
    });

    if (!initResponse.ok) {
      throw new Error(`Failed to initialize chunked upload: ${initResponse.statusText}`);
    }

    const { uploadId, totalChunks } = await initResponse.json();
    const totalSize = file.size;
    let uploadedSize = 0;

    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * this.config.chunkSize;
      const end = Math.min(start + this.config.chunkSize, totalSize);
      const chunk = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append('chunk', chunk);
      chunkFormData.append('uploadId', uploadId);
      chunkFormData.append('chunkIndex', chunkIndex.toString());

      const chunkResponse = await fetch(`${endpoint}/chunk`, {
        method: 'POST',
        headers,
        body: chunkFormData,
        signal: controller?.signal,
      });

      if (!chunkResponse.ok) {
        throw new Error(`Failed to upload chunk ${chunkIndex}: ${chunkResponse.statusText}`);
      }

      uploadedSize += chunk.size;

      if (onProgress) {
        const progress: FileUploadProgress = {
          loaded: uploadedSize,
          total: totalSize,
          percentage: (uploadedSize / totalSize) * 100,
          speed: this.calculateUploadSpeed(uploadedSize, Date.now()),
          timeRemaining: this.calculateTimeRemaining(uploadedSize, totalSize, Date.now()),
        };
        onProgress(progress);
      }
    }

    // Complete chunked upload
    const completeResponse = await fetch(`${endpoint}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ uploadId }),
      signal: controller?.signal,
    });

    if (!completeResponse.ok) {
      throw new Error(`Failed to complete chunked upload: ${completeResponse.statusText}`);
    }

    return await completeResponse.json();
  }

  private async uploadToSignedUrl(
    file: File,
    signedUrl: string,
    onProgress?: (progress: FileUploadProgress) => void,
    _controller?: AbortController
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: FileUploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100,
            speed: this.calculateUploadSpeed(event.loaded, Date.now()),
            timeRemaining: this.calculateTimeRemaining(event.loaded, event.total, Date.now()),
          };
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.timeout = this.config.timeout;
      xhr.ontimeout = () => {
        reject(new Error('Upload timeout'));
      };

      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  private async addToQueue(
    uploadTask: () => Promise<FileUploadResponse>
  ): Promise<FileUploadResponse> {
    return new Promise((resolve, reject) => {
      this.uploadQueue.push(async () => {
        try {
          const result = await uploadTask();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.uploadQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (
      this.uploadQueue.length > 0 &&
      this.activeUploads.size < this.config.maxConcurrentUploads
    ) {
      const task = this.uploadQueue.shift();
      if (task) {
        task().catch(console.error);
      }
    }

    this.isProcessingQueue = false;
  }

  private generateFileId(file: File): string {
    return `${file.name}_${file.size}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateUploadSpeed(loaded: number, _currentTime: number): number {
    // This is a simplified calculation
    // In a real implementation, you'd want to track this over time
    return loaded / 1000; // bytes per second (simplified)
  }

  private calculateTimeRemaining(loaded: number, total: number, currentTime: number): number {
    if (loaded === 0) return 0;
    const speed = this.calculateUploadSpeed(loaded, currentTime);
    return speed > 0 ? (total - loaded) / speed : 0;
  }
}

// Create a default instance
export const fileUploadApiService = new FileUploadApiService();

// Helper function to create a new instance with custom config
export function createFileUploadService(config: FileUploadApiConfig): FileUploadApiService {
  return new FileUploadApiService(config);
}

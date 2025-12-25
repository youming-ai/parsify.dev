'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useState } from 'react';
import type { FileDownloadOptions, UploadedFile } from './file-upload-types';

interface DownloadButtonProps {
  /** File to download */
  file: UploadedFile;
  /** Download options */
  options?: FileDownloadOptions;
  /** Custom class name */
  className?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Show progress indicator */
  showProgress?: boolean;
  /** Custom download text */
  children?: React.ReactNode;
  /** Event handlers */
  onDownloadStart?: (file: UploadedFile) => void;
  onDownloadComplete?: (file: UploadedFile) => void;
  onDownloadError?: (file: UploadedFile, error: Error) => void;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  file,
  options = {},
  className,
  variant = 'default',
  size = 'default',
  showProgress = false,
  children,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { filename, openInNewTab } = options;

  const handleDownload = async () => {
    if (!file.url && !(file instanceof File)) {
      setError('No download URL available');
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      setError(null);

      onDownloadStart?.(file);

      const downloadUrl = file instanceof File ? URL.createObjectURL(file) : file.url || '';
      const finalFilename = filename || file.name;

      if (openInNewTab) {
        // Open in new tab instead of downloading
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (file instanceof File) {
          URL.revokeObjectURL(downloadUrl);
        }
      } else {
        // Download the file
        if (file instanceof File) {
          // For File objects, create a download link directly
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = finalFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        } else {
          // For remote files, fetch and download
          const response = await fetch(downloadUrl);
          if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
          }

          const contentLength = response.headers.get('content-length');
          const total = contentLength ? Number.parseInt(contentLength, 10) : 0;
          let loaded = 0;

          const reader = response.body?.getReader();
          const chunks: Uint8Array[] = [];

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              chunks.push(value);
              loaded += value.length;

              if (showProgress && total > 0) {
                setDownloadProgress(Math.round((loaded / total) * 100));
              }
            }
          }

          // Create blob from chunks
          const blob = new Blob(
            chunks.map((chunk) => new Uint8Array(chunk)),
            { type: file.type }
          );
          const url = URL.createObjectURL(blob);

          // Create download link
          const link = document.createElement('a');
          link.href = url;
          link.download = finalFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }

      setDownloadProgress(100);
      onDownloadComplete?.(file);

      // Reset progress after a short delay
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Download failed');
      setError(error.message);
      onDownloadError?.(file, error);
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={cn('inline-block', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={isDownloading || (!file.url && !(file instanceof File))}
        className={cn(
          'relative',
          error && 'border-red-500 text-red-600 hover:border-red-600 hover:text-red-700'
        )}
      >
        {isDownloading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {showProgress ? `${downloadProgress}%` : 'Downloading...'}
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {children || 'Download'}
          </>
        )}
      </Button>

      {error && <div className="mt-2 max-w-xs text-red-600 text-xs">{error}</div>}

      {showProgress && isDownloading && (
        <div className="mt-2 max-w-xs text-gray-500 text-xs">
          Downloading {formatFileSize(file.size)}...
        </div>
      )}
    </div>
  );
};

interface BatchDownloadButtonProps {
  /** Files to download */
  files: UploadedFile[];
  /** Download options */
  options?: FileDownloadOptions;
  /** Custom class name */
  className?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Show progress indicator */
  showProgress?: boolean;
  /** Custom download text */
  children?: React.ReactNode;
  /** Event handlers */
  onDownloadStart?: (files: UploadedFile[]) => void;
  onDownloadComplete?: (files: UploadedFile[]) => void;
  onDownloadError?: (files: UploadedFile[], error: Error) => void;
}

export const BatchDownloadButton: React.FC<BatchDownloadButtonProps> = ({
  files,
  options = {},
  className,
  variant = 'default',
  size = 'default',
  showProgress = false,
  children,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validFiles = files.filter((file) => file.url || file instanceof File);

  const handleBatchDownload = async () => {
    if (validFiles.length === 0) {
      setError('No downloadable files available');
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      setError(null);

      onDownloadStart?.(validFiles);

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const downloadUrl = file instanceof File ? URL.createObjectURL(file) : (file.url ?? '');
        const finalFilename = options.filename
          ? `${options.filename.replace(/\.[^/.]+$/, '')}_${i + 1}.${file.name.split('.').pop()}`
          : file.name;

        if (file instanceof File) {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = finalFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        } else {
          const response = await fetch(downloadUrl);
          if (!response.ok) {
            throw new Error(`Download failed for ${file.name}: ${response.statusText}`);
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.download = finalFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

        if (showProgress) {
          setDownloadProgress(Math.round(((i + 1) / validFiles.length) * 100));
        }

        // Add a small delay between downloads to avoid overwhelming the browser
        if (i < validFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      onDownloadComplete?.(validFiles);

      // Reset after a short delay
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch download failed');
      setError(error.message);
      onDownloadError?.(validFiles, error);
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <div className={cn('inline-block', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={handleBatchDownload}
        disabled={isDownloading || validFiles.length === 0}
        className={cn(
          'relative',
          error && 'border-red-500 text-red-600 hover:border-red-600 hover:text-red-700'
        )}
      >
        {isDownloading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {showProgress ? `${downloadProgress}%` : `Downloading ${validFiles.length} files...`}
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {children || `Download ${validFiles.length} files`}
          </>
        )}
      </Button>

      {error && <div className="mt-2 max-w-xs text-red-600 text-xs">{error}</div>}

      {showProgress && isDownloading && (
        <div className="mt-2 max-w-xs text-gray-500 text-xs">
          Downloaded {Math.round((downloadProgress / 100) * validFiles.length)} of{' '}
          {validFiles.length} files
        </div>
      )}
    </div>
  );
};

export { DownloadButton as default };

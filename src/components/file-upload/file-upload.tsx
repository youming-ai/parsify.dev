'use client';

import { Button } from '@/components/ui/button';
import { UploadSimple, X } from '@phosphor-icons/react';
import { useCallback, useRef } from 'react';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  files?: File[];
  acceptedFormats?: string[];
  onFilesSelected?: (files: File[]) => void;
  onFilesChange?: (files: File[]) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function FileUpload({
  accept,
  multiple = true,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  files: controlledFiles,
  acceptedFormats,
  onFilesSelected,
  onFilesChange,
  onError,
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const files = controlledFiles || [];

  const acceptString =
    accept || (acceptedFormats ? acceptedFormats.map((f) => `.${f}`).join(',') : '*/*');

  const handleFileChange = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const selectedFiles: File[] = [];
      for (let i = 0; i < Math.min(fileList.length, maxFiles); i++) {
        const file = fileList[i];
        if (!file) continue;
        if (file.size > maxSize) {
          onError?.(
            `File "${file.name}" exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`
          );
          continue;
        }
        selectedFiles.push(file);
      }

      if (selectedFiles.length > 0) {
        onFilesSelected?.(selectedFiles);
        onFilesChange?.(selectedFiles);
      }
    },
    [maxSize, maxFiles, onError, onFilesSelected, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileChange(e.dataTransfer.files);
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange?.(newFiles);
    },
    [files, onFilesChange]
  );

  return (
    <div className={className}>
      <div
        className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <UploadSimple className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Max {maxFiles} files, {Math.round(maxSize / 1024 / 1024)}MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;

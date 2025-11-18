import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import type { DragOverEvent, FileChangeEvent, FileUploadEvents } from "./file-upload-types";

interface FileDropZoneProps {
  /** Whether files can be dropped */
  disabled?: boolean;
  /** Whether multiple files are accepted */
  multiple?: boolean;
  /** Accepted file types */
  accept?: string[];
  /** Maximum file size */
  maxSize?: number;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Children to render inside the drop zone */
  children?: React.ReactNode;
  /** Event handlers */
  onDrop?: FileUploadEvents["onDrop"];
  onDragOver?: FileUploadEvents["onDragOver"];
  onDragLeave?: FileUploadEvents["onDragLeave"];
  onFilesSelected?: FileUploadEvents["onFilesSelected"];
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  disabled = false,
  multiple = false,
  accept = [],
  maxSize,
  className,
  style,
  children,
  onDrop,
  onDragOver,
  onDragLeave,
  onFilesSelected,
}) => {
  const [_isDragOver, setIsDragOver] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!disabled) {
        setIsDragOver(true);
        setIsDragActive(true);
        onDragOver?.(event);
      }
    },
    [disabled, onDragOver],
  );

  const handleDragEnter = useCallback(
    (event: DragOverEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (event: DragOverEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!disabled) {
        setIsDragOver(false);
        setIsDragActive(false);
        onDragLeave?.(event);
      }
    },
    [disabled, onDragLeave],
  );

  const handleDrop = useCallback(
    (event: DragOverEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) {
        return;
      }

      setIsDragOver(false);
      setIsDragActive(false);

      const files = Array.from(event.dataTransfer.files);

      // Filter files based on accept and maxSize
      const validFiles = files.filter((file) => {
        if (accept.length > 0) {
          const isAccepted = accept.some((type) => {
            if (type.startsWith(".")) {
              return file.name.toLowerCase().endsWith(type.toLowerCase());
            }
            return file.type.match(type.replace("*", ".*"));
          });
          if (!isAccepted) return false;
        }

        if (maxSize && file.size > maxSize) {
          return false;
        }

        return true;
      });

      // Handle multiple file constraint
      const filesToProcess = multiple ? validFiles : validFiles.slice(0, 1);

      if (filesToProcess.length > 0) {
        onDrop?.(filesToProcess);
        onFilesSelected?.(filesToProcess);
      }
    },
    [disabled, accept, maxSize, multiple, onDrop, onFilesSelected],
  );

  const handleFileInput = useCallback(
    (event: FileChangeEvent) => {
      const files = Array.from(event.target.files || []);

      if (files.length > 0) {
        const filesToProcess = multiple ? files : files.slice(0, 1);
        onFilesSelected?.(filesToProcess);
      }

      // Reset the input value so the same file can be selected again
      event.target.value = "";
    },
    [multiple, onFilesSelected],
  );

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <Card
      className={cn(
        "relative cursor-pointer border-2 border-dashed transition-all duration-200",
        {
          "border-blue-500 bg-blue-50 dark:bg-blue-950/20": isDragActive,
          "border-gray-300 bg-gray-50 dark:bg-gray-800/20": !isDragActive,
          "cursor-not-allowed opacity-50": disabled,
        },
        className,
      )}
      style={style}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="File upload drop zone"
      aria-disabled={disabled}
    >
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(",")}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label="File input"
        />

        {children || (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-label="Upload icon"
              >
                <title>Upload</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <div>
              <p className="font-medium text-gray-900 text-lg dark:text-gray-100">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">or click to browse</p>
            </div>

            <Button
              variant="outline"
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Select Files
            </Button>

            {accept.length > 0 && (
              <p className="text-gray-400 text-xs dark:text-gray-500">
                Accepted formats: {accept.join(", ")}
              </p>
            )}

            {maxSize && (
              <p className="text-gray-400 text-xs dark:text-gray-500">
                Max file size: {formatFileSize(maxSize)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export default FileDropZone;

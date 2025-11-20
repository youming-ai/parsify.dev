import React, { useCallback, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileDropZone } from "./file-drop-zone";
import { FileListManager } from "./file-list-manager";
import { FilePreview } from "./file-preview";
import { createFileUploadService } from "./file-upload-api";
import { FileUploadProgressIndicator } from "./file-upload-progress";
import {
  DEFAULT_FILE_UPLOAD_CONFIG,
  type FileUploadConfig,
  type FileValidationError,
  type UploadedFile,
} from "./file-upload-types";
import { validateFiles } from "./file-validation";

interface FileUploadComponentProps {
  /** File upload configuration */
  config?: Partial<FileUploadConfig>;
  /** Custom class name */
  className?: string;
  /** Whether to show drop zone */
  showDropZone?: boolean;
  /** Whether to show file list */
  showFileList?: boolean;
  /** Whether to show progress indicators */
  showProgress?: boolean;
  /** Whether to show preview */
  showPreview?: boolean;
  /** Maximum number of files to display in list */
  maxFiles?: number;
  /** Layout mode */
  layout?: "vertical" | "horizontal" | "grid";
  /** Event handlers */
  onFilesChange?: (files: UploadedFile[]) => void;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onError?: (error: Error) => void;
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  config = {},
  className,
  showDropZone = true,
  showFileList = true,
  showProgress = true,
  showPreview = false,
  maxFiles,
  layout = "vertical",
  onFilesChange,
  onUploadComplete,
  onError,
}) => {
  const finalConfig = { ...DEFAULT_FILE_UPLOAD_CONFIG, ...config };
  const { maxSize, accept, multiple, autoUpload, endpoint, headers, validator } = finalConfig;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<FileValidationError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [_dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize API service with config
  const apiService = React.useMemo(() => {
    return createFileUploadService({
      baseUrl: endpoint,
      defaultHeaders: headers,
    });
  }, [endpoint, headers]);

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      try {
        // Validate files
        const validation = validateFiles(selectedFiles, {
          maxSize,
          accept,
          multiple,
          validator,
        });

        if (validation.errors.length > 0) {
          setErrors(validation.errors);
        }

        if (validation.validFiles.length === 0) {
          return;
        }

        // Create uploaded file objects
        const newUploadedFiles: UploadedFile[] = validation.validFiles.map((file) => ({
          id: `${file.name}_${file.size}_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          status: "pending",
          progress: 0,
        }));

        // Add to files list
        const updatedFiles = multiple ? [...files, ...newUploadedFiles] : newUploadedFiles;
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles);

        // Auto-upload if enabled
        if (autoUpload) {
          await uploadFiles(newUploadedFiles);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Failed to process files");
        onError?.(err);
      }
    },
    [files, maxSize, accept, multiple, autoUpload, validator, onFilesChange, onError, uploadFiles],
  );

  const uploadFiles = useCallback(
    async (filesToUpload: UploadedFile[]) => {
      if (filesToUpload.length === 0) return;

      setIsUploading(true);
      setErrors([]);

      try {
        // Convert UploadedFile objects back to File objects for upload
        const fileObjects = await Promise.all(
          filesToUpload.map(async (uploadedFile) => {
            // For now, we'll need to reconstruct the File object
            // In a real implementation, you might want to store the original File objects
            const response = await fetch(uploadedFile.url || "");
            const blob = await response.blob();
            return new File([blob], uploadedFile.name, {
              type: uploadedFile.type,
            });
          }),
        );

        // Upload files
        const uploadedFiles = await apiService.uploadFiles(
          fileObjects,
          {
            maxSize,
            accept,
            multiple,
            endpoint,
            headers,
            validator,
          },
          (fileId, progress) => {
            setFiles((prevFiles) =>
              prevFiles.map((file) =>
                file.id === fileId
                  ? {
                      ...file,
                      status: "uploading" as const,
                      progress: progress.percentage,
                    }
                  : file,
              ),
            );
          },
        );

        // Update files with upload results
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          uploadedFiles.forEach((uploadedFile, index) => {
            const fileIndex = updatedFiles.findIndex((f) => f.id === filesToUpload[index].id);
            if (fileIndex !== -1) {
              updatedFiles[fileIndex] = {
                ...updatedFiles[fileIndex],
                ...uploadedFile,
                status: uploadedFile.status === "success" ? "success" : "error",
              };
            }
          });
          return updatedFiles;
        });

        onUploadComplete?.(uploadedFiles);
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Upload failed");
        onError?.(err);

        // Update file statuses to error
        setFiles((prevFiles) =>
          prevFiles.map((file) =>
            filesToUpload.some((f) => f.id === file.id)
              ? { ...file, status: "error" as const, error: err.message }
              : file,
          ),
        );
      } finally {
        setIsUploading(false);
      }
    },
    [
      apiService,
      maxSize,
      accept,
      multiple,
      endpoint,
      headers,
      validator,
      onUploadComplete,
      onError,
    ],
  );

  const handleFileRemove = useCallback(
    (fileId: string) => {
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      onFilesChange?.(files.filter((file) => file.id !== fileId));
    },
    [files, onFilesChange],
  );

  const handleFileRetry = useCallback(
    async (fileId: string) => {
      const fileToRetry = files.find((f) => f.id === fileId);
      if (fileToRetry) {
        await uploadFiles([fileToRetry]);
      }
    },
    [files, uploadFiles],
  );

  const handleFileCancel = useCallback(
    (fileId: string) => {
      apiService.cancelUpload(fileId);
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, status: "cancelled" as const } : file,
        ),
      );
    },
    [apiService],
  );

  const handleFilePreview = useCallback((file: UploadedFile) => {
    setSelectedFile(file);
  }, []);

  const handleFileDownload = useCallback((_file: UploadedFile | File) => {
    // Download will be handled by the DownloadButton component
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    setErrors([]);
    setSelectedFile(null);
    onFilesChange?.([]);
  }, [onFilesChange]);

  const handleRetryAll = useCallback(() => {
    const failedFiles = files.filter((file) => file.status === "error");
    if (failedFiles.length > 0) {
      uploadFiles(failedFiles);
    }
  }, [files, uploadFiles]);

  const hasErrors = errors.length > 0;
  const hasFiles = files.length > 0;
  const hasPendingFiles = files.some((file) => file.status === "pending");
  const hasUploadingFiles = files.some((file) => file.status === "uploading");
  const hasCompletedFiles = files.some((file) => file.status === "success");
  const hasFailedFiles = files.some((file) => file.status === "error");

  const layoutClasses = {
    vertical: "flex flex-col space-y-6",
    horizontal: "flex flex-row space-x-6",
    grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  };

  return (
    <div className={cn("w-full space-y-6", layoutClasses[layout], className)}>
      {/* Drop Zone */}
      {showDropZone && !hasUploadingFiles && (
        <FileDropZone
          disabled={isUploading}
          multiple={multiple}
          accept={accept}
          maxSize={maxSize}
          onFilesSelected={handleFilesSelected}
          onDragOver={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={() => setDragOver(false)}
        />
      )}

      {/* Errors */}
      {hasErrors && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-red-800">Validation Errors:</p>
              <ul className="list-inside list-disc space-y-1 text-red-700 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Indicators */}
      {showProgress && hasUploadingFiles && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Uploading Files...</h3>
          {files
            .filter((file) => file.status === "uploading")
            .map((file) => (
              <FileUploadProgressIndicator
                key={file.id}
                progress={{
                  loaded: (file.progress / 100) * file.size,
                  total: file.size,
                  percentage: file.progress,
                }}
                status={file.status}
                fileName={file.name}
                fileSize={file.size}
                showCancelButton={true}
                onCancel={() => handleFileCancel(file.id)}
              />
            ))}
        </div>
      )}

      {/* File List */}
      {showFileList && hasFiles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">
              Files ({files.length})
              {hasCompletedFiles && (
                <span className="ml-2 text-green-600 text-sm">
                  ({files.filter((f) => f.status === "success").length} uploaded)
                </span>
              )}
              {hasFailedFiles && (
                <span className="ml-2 text-red-600 text-sm">
                  ({files.filter((f) => f.status === "error").length} failed)
                </span>
              )}
            </h3>

            <div className="flex space-x-2">
              {hasFailedFiles && (
                <Button variant="outline" size="sm" onClick={handleRetryAll} disabled={isUploading}>
                  Retry Failed
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleClearAll} disabled={isUploading}>
                Clear All
              </Button>
            </div>
          </div>

          <FileListManager
            files={files}
            maxFiles={maxFiles}
            showDetails={true}
            showProgress={true}
            showActions={true}
            onFileRemove={handleFileRemove}
            onFilePreview={handleFilePreview}
            onFileDownload={handleFileDownload}
            onFileRetry={handleFileRetry}
            onFileCancel={handleFileCancel}
          />
        </div>
      )}

      {/* File Preview */}
      {showPreview && selectedFile && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">File Preview</h3>
            <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
              Close Preview
            </Button>
          </div>

          <FilePreview
            file={selectedFile}
            onCopy={(content) => {
              navigator.clipboard.writeText(content);
            }}
            onDownload={handleFileDownload}
          />
        </div>
      )}

      {/* Manual Upload Button */}
      {!autoUpload && hasPendingFiles && (
        <div className="flex justify-center">
          <Button
            onClick={() => uploadFiles(files.filter((f) => f.status === "pending"))}
            disabled={isUploading}
            size="lg"
          >
            {isUploading
              ? "Uploading..."
              : `Upload ${files.filter((f) => f.status === "pending").length} Files`}
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept?.join(",")}
        onChange={(e) => {
          const selectedFiles = Array.from(e.target.files || []);
          if (selectedFiles.length > 0) {
            handleFilesSelected(selectedFiles);
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default FileUploadComponent;

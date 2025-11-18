"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileDropZone } from "./file-drop-zone";
import { cn } from "@/lib/utils";
import { Upload, X, File as FileIcon } from "lucide-react";

export interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFormats?: string[];
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function FileUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = [],
  className,
  multiple = true,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});

  const handleFilesDrop = (newFiles: File[]) => {
    // Filter files based on size and format
    const validFiles = newFiles.filter((file) => {
      const isValidSize = file.size <= maxFileSize;
      const isValidFormat =
        acceptedFormats.length === 0 ||
        acceptedFormats.some((format) =>
          file.name.toLowerCase().endsWith(`.${format.toLowerCase()}`),
        );

      return isValidSize && isValidFormat;
    });

    // Check max files limit
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    // Update files list
    const updatedFiles = [...files, ...filesToAdd];
    onFilesChange(updatedFiles);

    // Simulate upload progress
    filesToAdd.forEach((file) => {
      const fileName = file.name;
      setUploadProgress((prev) => ({ ...prev, [fileName]: 0 }));

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          // Remove from progress tracking when complete
          setTimeout(() => {
            setUploadProgress((prev) => {
              const newProgress = { ...prev };
              delete newProgress[fileName];
              return newProgress;
            });
          }, 500);
        }
        setUploadProgress((prev) => ({ ...prev, [fileName]: progress }));
      }, 200);
    });
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <FileDropZone
        onDrop={handleFilesDrop}
        maxSize={maxFileSize}
        accept={acceptedFormats.map((format) => `.${format}`)}
        multiple={multiple}
        disabled={disabled}
      />

      {Object.keys(uploadProgress).length > 0 && (
        <Card>
          <CardContent className="p-4">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{fileName}</span>
                  <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeFile(index)}
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

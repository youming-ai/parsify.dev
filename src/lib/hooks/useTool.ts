/**
 * Shared hook for tool functionality
 * Provides common tool operations and state management
 */

import { SUCCESS_MESSAGES, TIMEOUTS } from '@/lib/constants';
import type { ProcessingStatus, ToolComponentProps, ToolResult } from '@/types/components';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseToolOptions<T = any> extends Partial<ToolComponentProps> {
  /** Tool-specific processing function */
  processFunction?: (data: any) => Promise<T>;
  /** Auto-reset on completion */
  autoReset?: boolean;
  /** Reset delay in milliseconds */
  resetDelay?: number;
  /** Timeout for processing */
  timeout?: number;
  /** Enable progress tracking */
  enableProgress?: boolean;
}

interface UseToolReturn<T = any> {
  /** Current processing status */
  status: ProcessingStatus;
  /** Current result */
  result: ToolResult<T> | null;
  /** Whether the tool is currently processing */
  isProcessing: boolean;
  /** Whether the tool has completed successfully */
  isCompleted: boolean;
  /** Whether the tool has encountered an error */
  hasError: boolean;
  /** Current progress (0-100) */
  progress: number;
  /** Current error message */
  error: string | null;
  /** Function to start processing */
  startProcessing: (data: any) => Promise<void>;
  /** Function to stop processing */
  stopProcessing: () => void;
  /** Function to reset state */
  reset: () => void;
  /** Function to update progress */
  updateProgress: (progress: number, message?: string) => void;
  /** Function to set error */
  setError: (error: string | Error) => void;
  /** Function to set result */
  setResult: (data: T) => void;
}

/**
 * Hook for managing tool state and operations
 */
export function useTool<T = any>(options: UseToolOptions<T> = {}): UseToolReturn<T> {
  const {
    processFunction,
    onComplete,
    onError,
    onProgress,
    autoReset = false,
    resetDelay = 3000,
    timeout = TIMEOUTS.FILE_PROCESSING,
    enableProgress = false,
  } = options;

  // State management
  const [status, setStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const [result, setResultState] = useState<ToolResult<T> | null>(null);

  // Refs for timeout and abort controller
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset function
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setStatus({
      status: 'idle',
      progress: 0,
      message: '',
    });
    setResultState(null);
  }, []);

  // Update progress function
  const updateProgress = useCallback(
    (progress: number, message?: string) => {
      if (!enableProgress) return;

      setStatus((prev) => ({
        ...prev,
        progress: Math.max(0, Math.min(100, progress)),
        message: message || prev.message,
      }));

      onProgress?.(progress);
    },
    [enableProgress, onProgress]
  );

  // Set error function
  const setError = useCallback(
    (error: string | Error) => {
      const errorMessage = error instanceof Error ? error.message : error;

      setStatus((prev) => ({
        ...prev,
        status: 'error',
        message: errorMessage,
        endTime: Date.now(),
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    },
    [onError]
  );

  // Set result function
  const applyResult = useCallback(
    (data: T) => {
      const now = Date.now();
      const startTime = status.startTime || now;

      const toolResult: ToolResult<T> = {
        data,
        success: true,
        status: {
          ...status,
          status: 'completed',
          progress: 100,
          message: SUCCESS_MESSAGES.PROCESSING_COMPLETE,
          endTime: now,
        },
        metadata: {
          timestamp: now,
          duration: now - startTime,
          toolVersion: '2.0.0',
        },
      };

      setResultState(toolResult);
      setStatus((prev) => ({
        ...prev,
        status: 'completed',
        progress: 100,
        message: SUCCESS_MESSAGES.PROCESSING_COMPLETE,
        endTime: now,
      }));

      onComplete?.(data);

      // Auto-reset if enabled
      if (autoReset) {
        timeoutRef.current = setTimeout(() => {
          reset();
        }, resetDelay);
      }
    },
    [status, onComplete, autoReset, resetDelay, reset]
  );

  // Start processing function
  const startProcessing = useCallback(
    async (data: any) => {
      if (!processFunction) {
        setError('No processing function provided');
        return;
      }

      try {
        // Reset any existing state
        reset();

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        // Set initial processing status
        const startTime = Date.now();
        setStatus({
          status: 'processing',
          progress: 0,
          message: 'Starting processing...',
          startTime,
        });

        // Set up timeout
        timeoutRef.current = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          setError(`Processing timeout after ${timeout}ms`);
        }, timeout);

        // Start processing
        const result = await processFunction(data);

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Check if processing was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Set successful result
        applyResult(result);
      } catch (error) {
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Handle different error types
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setStatus((prev) => ({
              ...prev,
              status: 'idle',
              message: 'Processing cancelled',
            }));
            return;
          }
          setError(error);
        } else {
          setError(error instanceof Error ? error.message : String(error));
        }
      }
    },
    [processFunction, timeout, reset, setError, applyResult]
  );

  // Stop processing function
  const stopProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setStatus((prev) => ({
      ...prev,
      status: 'idle',
      message: 'Processing cancelled',
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Computed states
  const isProcessing = status.status === 'processing';
  const isCompleted = status.status === 'completed';
  const hasError = status.status === 'error';

  return {
    status,
    result,
    isProcessing,
    isCompleted,
    hasError,
    progress: status.progress,
    error: hasError ? status.message : null,
    startProcessing,
    stopProcessing,
    reset,
    updateProgress,
    setError,
    setResult: applyResult as (data: T) => void,
  };
}

/**
 * Hook for file handling with validation and progress tracking
 */
export function useFileHandler(options: {
  acceptFormats?: string[];
  maxSize?: number;
  multiple?: boolean;
  validateFile?: (file: File) => boolean | string;
  onFilesSelected?: (files: File[]) => void;
  onFileError?: (error: string) => void;
}) {
  const {
    acceptFormats = [],
    maxSize = 10 * 1024 * 1024, // 10MB default
    multiple = false,
    validateFile,
    onFilesSelected,
    onFileError,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const validateFiles = useCallback(
    (fileList: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];

      Array.from(fileList).forEach((file) => {
        // Check file size
        if (file.size > maxSize) {
          errors.push(
            `File "${file.name}" is too large (max ${(maxSize / 1024 / 1024).toFixed(1)}MB)`
          );
          return;
        }

        // Check file format
        if (acceptFormats.length > 0) {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          if (!fileExtension || !acceptFormats.includes(fileExtension)) {
            errors.push(`File "${file.name}" has unsupported format`);
            return;
          }
        }

        // Custom validation
        if (validateFile) {
          const validationResult = validateFile(file);
          if (validationResult !== true) {
            errors.push(
              typeof validationResult === 'string'
                ? validationResult
                : `File "${file.name}" validation failed`
            );
            return;
          }
        }

        valid.push(file);
      });

      return { valid, errors };
    },
    [maxSize, acceptFormats, validateFile]
  );

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const filesArray = Array.from(fileList);

      if (!multiple && filesArray.length > 1) {
        onFileError?.('Only one file is allowed');
        return;
      }

      const { valid, errors } = validateFiles(filesArray);

      if (errors.length > 0) {
        onFileError?.(errors.join('; '));
        return;
      }

      setFiles(valid);
      onFilesSelected?.(valid);
    },
    [multiple, validateFiles, onFilesSelected, onFileError]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles);
      }
    },
    [handleFiles]
  );

  const reset = useCallback(() => {
    setFiles([]);
    setIsDragging(false);
  }, []);

  return {
    files,
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInput,
    reset,
  };
}

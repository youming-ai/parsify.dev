/**
 * Web Worker Integration Examples
 * Demonstrates how to integrate workers with existing Parsify.dev tools
 */

import { executeWorkerTask } from './integration';
import { WorkerTaskCategory } from './types';
import { useState, useCallback } from 'react';

/**
 * Example 1: JSON Processing Tool Integration
 */
export function useJSONProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processJSON = useCallback(async (
    jsonString: string,
    operation: 'validate' | 'format' | 'transform' | 'convert',
    options?: any
  ) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const result = await executeWorkerTask(
        operation === 'validate' ? 'parse-and-validate' :
        operation === 'format' ? 'parse-and-validate' :
        operation === 'transform' ? 'transform' :
        operation === 'convert' ? 'convert' :
        'parse-and-validate',
        'json-processing',
        operation === 'validate' ? { jsonString, options } :
        operation === 'format' ? { jsonString, options: { format: true, ...options } } :
        operation === 'transform' ? { input: JSON.parse(jsonString), transformation: options.transformation } :
        operation === 'convert' ? { input: JSON.parse(jsonString), targetFormat: options.targetFormat } :
        { jsonString },
        {
          onProgress: (progressValue, message) => {
            setProgress(progressValue);
            console.log('JSON Processing Progress:', progressValue, message);
          },
          onError: (taskId, error) => {
            setError(error.message);
            console.error('JSON Processing Error:', error);
          },
          timeout: 30000,
          retries: 2
        }
      );

      if (result.success) {
        setProgress(100);
        return result.data;
      } else {
        setError(result.error?.message || 'Processing failed');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processJSON,
    isProcessing,
    progress,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Example 2: File Processing Tool Integration
 */
export function useFileProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (
    file: File,
    operation: 'convert' | 'extract-text' | 'optimize' | 'analyze',
    options?: any
  ) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      const result = await executeWorkerTask(
        operation === 'convert' ? 'convert-file' :
        operation === 'extract-text' ? 'extract-text' :
        operation === 'optimize' ? 'optimize-file' :
        operation === 'analyze' ? 'analyze-file' :
        'convert-file',
        'file-processing',
        operation === 'convert' ? { fileData, sourceFormat: options.sourceFormat, targetFormat: options.targetFormat } :
        operation === 'extract-text' ? { fileData, mimeType: file.type, options } :
        operation === 'optimize' ? { fileData, mimeType: file.type, options } :
        operation === 'analyze' ? { fileData, mimeType: file.type, options } :
        { fileData, sourceFormat: options.sourceFormat, targetFormat: options.targetFormat },
        {
          onProgress: (progressValue, message) => {
            setProgress(progressValue);
            console.log('File Processing Progress:', progressValue, message);
          },
          onError: (taskId, error) => {
            setError(error.message);
            console.error('File Processing Error:', error);
          },
          timeout: 60000,
          retries: 1
        }
      );

      if (result.success) {
        setProgress(100);
        return result.data;
      } else {
        setError(result.error?.message || 'Processing failed');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processFile,
    isProcessing,
    progress,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Example 3: Text Processing Tool Integration
 */
export function useTextProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processText = useCallback(async (
    text: string,
    operation: 'search-replace' | 'analyze' | 'transform' | 'compare',
    options?: any
  ) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const result = await executeWorkerTask(
        operation === 'search-replace' ? 'search-replace' :
        operation === 'analyze' ? 'analyze-text' :
        operation === 'transform' ? 'transform-text' :
        operation === 'compare' ? 'compare-texts' :
        'analyze-text',
        'text-processing',
        operation === 'search-replace' ? { text, patterns: options.patterns } :
        operation === 'analyze' ? { text, options } :
        operation === 'transform' ? { text, transformations: options.transformations } :
        operation === 'compare' ? { left: text, right: options.rightText, options } :
        { text, options },
        {
          onProgress: (progressValue, message) => {
            setProgress(progressValue);
            console.log('Text Processing Progress:', progressValue, message);
          },
          onError: (taskId, error) => {
            setError(error.message);
            console.error('Text Processing Error:', error);
          },
          timeout: 20000,
          retries: 2
        }
      );

      if (result.success) {
        setProgress(100);
        return result.data;
      } else {
        setError(result.error?.message || 'Processing failed');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processText,
    isProcessing,
    progress,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Example 4: Batch Processing Hook
 */
export function useBatchProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const processBatch = useCallback(async (
    items: any[],
    operation: string,
    category: WorkerTaskCategory,
    options?: any
  ) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setResults([]);

    try {
      const batchResults = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        try {
          const result = await executeWorkerTask(
            operation,
            category,
            item,
            {
              ...options,
              timeout: options?.timeout || 15000,
              retries: 1
            }
          );

          batchResults.push({
            index: i,
            success: result.success,
            data: result.data,
            error: result.error
          });

          // Update progress
          const currentProgress = ((i + 1) / items.length) * 100;
          setProgress(currentProgress);

        } catch (err) {
          batchResults.push({
            index: i,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      setResults(batchResults);
      setProgress(100);

      return batchResults;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch processing failed');
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processBatch,
    isProcessing,
    progress,
    error,
    results,
    clearError: () => setError(null),
    clearResults: () => setResults([])
  };
}

/**
 * Example 5: Tool Integration Utilities
 */
export class ToolIntegrator {
  /**
   * Create a worker-enhanced tool component
   */
  static createWorkerTool<T, R>(
    toolName: string,
    category: WorkerTaskCategory,
    operation: string,
    defaultOptions?: any
  ) {
    return function useWorkerTool() {
      const [isProcessing, setIsProcessing] = useState(false);
      const [progress, setProgress] = useState(0);
      const [error, setError] = useState<string | null>(null);
      const [lastResult, setLastResult] = useState<R | null>(null);

      const execute = useCallback(async (
        data: T,
        customOptions?: any
      ): Promise<R | null> => {
        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
          const result = await executeWorkerTask(
            operation,
            category,
            data,
            {
              ...defaultOptions,
              ...customOptions,
              onProgress: (progressValue, message) => {
                setProgress(progressValue);
                console.log(`${toolName} Progress:`, progressValue, message);
              },
              onError: (taskId, error) => {
                setError(error.message);
                console.error(`${toolName} Error:`, error);
              }
            }
          );

          if (result.success) {
            setLastResult(result.data);
            setProgress(100);
            return result.data;
          } else {
            setError(result.error?.message || `${toolName} failed`);
            return null;
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : `Unknown ${toolName} error`);
          return null;
        } finally {
          setIsProcessing(false);
        }
      }, [defaultOptions]);

      return {
        execute,
        isProcessing,
        progress,
        error,
        lastResult,
        clearError: () => setError(null),
        clearResult: () => setLastResult(null)
      };
    };
  }

  /**
   * Wrap an existing tool function with worker processing
   */
  static async wrapWithWorker<T, R>(
    originalFunction: (data: T) => Promise<R>,
    data: T,
    category: WorkerTaskCategory,
    workerOperation: string,
    options?: any
  ): Promise<R> {
    // Check if data is large enough to warrant worker processing
    const dataSize = JSON.stringify(data).length;
    const shouldUseWorker = dataSize > 1024 * 10; // 10KB threshold

    if (shouldUseWorker) {
      console.log(`Using worker for ${workerOperation} (${dataSize} bytes)`);

      const result = await executeWorkerTask(workerOperation, category, data, options);

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Worker processing failed');
      }
    } else {
      // Use original function for small data
      console.log(`Using main thread for ${workerOperation} (${dataSize} bytes)`);
      return await originalFunction(data);
    }
  }
}

/**
 * Example 6: React Component Integration
 */
export function WorkerEnhancedTool({
  toolName,
  category,
  operation,
  children,
  onResult,
  onError
}: {
  toolName: string;
  category: WorkerTaskCategory;
  operation: string;
  children: (execute: (data: any) => Promise<any>, isProcessing: boolean, progress: number) => React.ReactNode;
  onResult?: (result: any) => void;
  onError?: (error: string) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const execute = useCallback(async (data: any) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await executeWorkerTask(operation, category, data, {
        onProgress: (progressValue, message) => {
          setProgress(progressValue);
          console.log(`${toolName} Progress:`, message);
        },
        timeout: 30000,
        retries: 2
      });

      if (result.success) {
        setProgress(100);
        onResult?.(result.data);
        return result.data;
      } else {
        const errorMessage = result.error?.message || 'Processing failed';
        onError?.(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [category, operation, onResult, onError, toolName]);

  return children(execute, isProcessing, progress);
}

/**
 * Example 7: Migration Helper for Existing Tools
 */
export class ToolMigrationHelper {
  /**
   * Migrate an existing tool to use workers
   */
  static migrateTool<T, R>(
    toolId: string,
    category: WorkerTaskCategory,
    workerOperation: string,
    originalProcessFunction: (data: T) => R | Promise<R>,
    options: {
      autoDetect?: boolean;
      sizeThreshold?: number;
      fallbackOnError?: boolean;
    } = {}
  ) {
    const {
      autoDetect = true,
      sizeThreshold = 1024 * 10, // 10KB
      fallbackOnError = true
    } = options;

    return async function migratedProcessFunction(data: T): Promise<R> {
      const shouldUseWorker = autoDetect
        ? JSON.stringify(data).length > sizeThreshold
        : true;

      if (shouldUseWorker) {
        try {
          console.log(`Using worker for ${toolId}`);
          const result = await executeWorkerTask(workerOperation, category, data);

          if (result.success) {
            return result.data;
          } else {
            throw new Error(result.error?.message || 'Worker processing failed');
          }
        } catch (error) {
          if (fallbackOnError) {
            console.warn(`Worker failed for ${toolId}, falling back to main thread:`, error);
            return await originalProcessFunction(data);
          } else {
            throw error;
          }
        }
      } else {
        console.log(`Using main thread for ${toolId}`);
        return await originalProcessFunction(data);
      }
    };
  }

  /**
   * Create a progress-aware version of an existing tool
   */
  static createProgressAwareTool<T, R>(
    originalProcessFunction: (data: T, onProgress?: (progress: number) => void) => Promise<R>,
    category: WorkerTaskCategory,
    workerOperation: string,
    options: {
      useWorkerForLargeFiles?: boolean;
      sizeThreshold?: number;
    } = {}
  ) {
    const {
      useWorkerForLargeFiles = true,
      sizeThreshold = 1024 * 20 // 20KB
    } = options;

    return async function progressAwareProcessFunction(
      data: T,
      onProgress?: (progress: number) => void
    ): Promise<R> {
      const dataSize = JSON.stringify(data).length;
      const shouldUseWorker = useWorkerForLargeFiles && dataSize > sizeThreshold;

      if (shouldUseWorker) {
        const result = await executeWorkerTask(workerOperation, category, data, {
          onProgress: (progress) => {
            onProgress?.(progress);
          }
        });

        if (result.success) {
          return result.data;
        } else {
          throw new Error(result.error?.message || 'Worker processing failed');
        }
      } else {
        // Simulate progress for main thread processing
        if (onProgress) {
          onProgress(0);
          setTimeout(() => onProgress(50), 100);
          setTimeout(() => onProgress(100), 200);
        }

        return await originalProcessFunction(data, onProgress);
      }
    };
  }
}

// Export all examples
export {
  useJSONProcessor as jsonProcessor,
  useFileProcessor as fileProcessor,
  useTextProcessor as textProcessor,
  useBatchProcessor as batchProcessor,
  ToolIntegrator as toolIntegrator,
  WorkerEnhancedTool as WorkerTool,
  ToolMigrationHelper as migrationHelper
};

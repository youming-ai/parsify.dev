import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  Download,
  MemoryStick,
  Play,
  RotateCcw,
  Square,
  Terminal,
  XCircle,
} from 'lucide-react';
import * as React from 'react';
import type { CodeExecutionProps, CodeExecutionResult, ExecutionStatus } from './code-types';
import { getLanguageConfig } from './language-configs';

interface CodeExecutionComponentProps extends CodeExecutionProps {
  showCompileOutput?: boolean;
  maxHeight?: string | number;
  allowDownload?: boolean;
  allowCopy?: boolean;
  onDownloadResult?: (result: CodeExecutionResult) => void;
  onCopyResult?: (result: CodeExecutionResult) => void;
}

export function CodeExecution({
  request,
  onExecutionStart,
  onExecutionComplete,
  onExecutionError,
  onCancel,
  showProgress = true,
  showStats = true,
  showCompileOutput = false,
  maxHeight = 400,
  allowDownload = true,
  allowCopy = true,
  onDownloadResult,
  onCopyResult,
  className,
}: CodeExecutionComponentProps) {
  const [status, setStatus] = React.useState<ExecutionStatus>('idle');
  const [result, setResult] = React.useState<CodeExecutionResult | null>(null);
  const [error, setError] = React.useState<string>('');
  const [progress, setProgress] = React.useState<number>(0);
  const [startTime, setStartTime] = React.useState<number>(0);
  const [elapsedTime, setElapsedTime] = React.useState<number>(0);

  const executionIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Update elapsed time during execution
  React.useEffect(() => {
    if (status === 'compiling' || status === 'running') {
      executionIntervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      if (executionIntervalRef.current) {
        clearInterval(executionIntervalRef.current);
        executionIntervalRef.current = null;
      }
    }

    return () => {
      if (executionIntervalRef.current) {
        clearInterval(executionIntervalRef.current);
      }
    };
  }, [status, startTime]);

  const executeCode = async () => {
    try {
      setStatus('compiling');
      setProgress(0);
      setStartTime(Date.now());
      setElapsedTime(0);
      setError('');
      setResult(null);

      if (onExecutionStart) {
        onExecutionStart();
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const languageConfig = getLanguageConfig(request.language);

      // Simulate compilation for languages that need it
      if (languageConfig.supportsCompilation) {
        setProgress(25);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Execution cancelled');
        }
      }

      setStatus('running');
      setProgress(50);

      // Simulate code execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Execution cancelled');
      }

      setProgress(90);

      // Simulate API call to execute code
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const executionResult: CodeExecutionResult = await response.json();

      setProgress(100);
      setStatus('completed');
      setResult(executionResult);

      if (onExecutionComplete) {
        onExecutionComplete(executionResult);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'Execution cancelled') {
        setStatus('cancelled');
        setError('Execution was cancelled');
      } else {
        setStatus('error');
        setError(err.message || 'An error occurred during execution');
        if (onExecutionError) {
          onExecutionError(err.message);
        }
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancelExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (onCancel) {
      onCancel();
    }
  };

  const resetExecution = () => {
    setStatus('idle');
    setResult(null);
    setError('');
    setProgress(0);
    setElapsedTime(0);
  };

  const handleDownloadResult = () => {
    if (result && onDownloadResult) {
      onDownloadResult(result);
    } else if (result) {
      // Default download behavior
      const blob = new Blob(
        [
          `Exit Code: ${result.exitCode}\n`,
          `Execution Time: ${result.executionTime}ms\n`,
          `Memory Usage: ${result.memoryUsage}KB\n`,
          `Output:\n${result.output}\n`,
          result.error ? `Error:\n${result.error}\n` : '',
          result.compileOutput ? `Compile Output:\n${result.compileOutput}\n` : '',
        ],
        { type: 'text/plain' }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `execution-result-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyResult = () => {
    if (result && onCopyResult) {
      onCopyResult(result);
    } else if (result) {
      // Default copy behavior
      const text = [
        `Exit Code: ${result.exitCode}`,
        `Execution Time: ${result.executionTime}ms`,
        `Memory Usage: ${result.memoryUsage}KB`,
        'Output:',
        result.output,
        result.error ? `Error:\n${result.error}` : '',
        result.compileOutput ? `Compile Output:\n${result.compileOutput}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      navigator.clipboard.writeText(text).then(() => {
        // Could show a toast notification here
      });
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatMemoryUsage = (kb: number) => {
    if (kb < 1024) return `${kb}KB`;
    return `${(kb / 1024).toFixed(2)}MB`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <Play className="h-4 w-4" />;
      case 'compiling':
        return <Terminal className="h-4 w-4 animate-pulse" />;
      case 'running':
        return <Play className="h-4 w-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-yellow-500" />;
      case 'timeout':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'default';
      case 'compiling':
        return 'secondary';
      case 'running':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'error':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      case 'timeout':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Execution Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getStatusIcon()}
              Code Execution
              <Badge variant={getStatusColor() as any}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              {status === 'idle' && (
                <Button onClick={executeCode} size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Run Code
                </Button>
              )}

              {(status === 'compiling' || status === 'running') && (
                <Button onClick={cancelExecution} variant="outline" size="sm">
                  <Square className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}

              {(status === 'completed' ||
                status === 'error' ||
                status === 'cancelled' ||
                status === 'timeout') && (
                <>
                  <Button onClick={resetExecution} variant="outline" size="sm">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>

                  {result && allowCopy && (
                    <Button onClick={handleCopyResult} variant="outline" size="sm">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  )}

                  {result && allowDownload && (
                    <Button onClick={handleDownloadResult} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Progress Bar */}
        {showProgress && (status === 'compiling' || status === 'running') && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600 text-sm dark:text-gray-400">
                <span>{status === 'compiling' ? 'Compiling...' : 'Running...'}</span>
                <span>{formatExecutionTime(elapsedTime)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Execution Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Result</CardTitle>

            {showStats && (
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Exit Code: {result.exitCode}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Time: {formatExecutionTime(result.executionTime)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <MemoryStick className="h-4 w-4" />
                  <span>Memory: {formatMemoryUsage(result.memoryUsage)}</span>
                </div>

                {result.compileTime && (
                  <div className="flex items-center gap-1">
                    <Terminal className="h-4 w-4" />
                    <span>Compile: {formatExecutionTime(result.compileTime)}</span>
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Standard Output */}
            {result.output && (
              <div>
                <h4 className="mb-2 font-medium text-green-700 dark:text-green-400">Output</h4>
                <div
                  className="overflow-auto rounded-md border bg-gray-50 p-4 font-mono text-sm dark:bg-gray-900"
                  style={{ maxHeight }}
                >
                  <pre className="whitespace-pre-wrap">{result.output}</pre>
                </div>
              </div>
            )}

            {/* Error Output */}
            {result.error && (
              <div>
                <h4 className="mb-2 font-medium text-red-700 dark:text-red-400">Error</h4>
                <div
                  className="overflow-auto rounded-md border border-red-200 bg-red-50 p-4 font-mono text-sm dark:border-red-800 dark:bg-red-900/20"
                  style={{ maxHeight }}
                >
                  <pre className="whitespace-pre-wrap text-red-800 dark:text-red-300">
                    {result.error}
                  </pre>
                </div>
              </div>
            )}

            {/* Compile Output */}
            {showCompileOutput && result.compileOutput && (
              <div>
                <h4 className="mb-2 font-medium text-blue-700 dark:text-blue-400">
                  Compile Output
                </h4>
                <div
                  className="overflow-auto rounded-md border border-blue-200 bg-blue-50 p-4 font-mono text-sm dark:border-blue-800 dark:bg-blue-900/20"
                  style={{ maxHeight }}
                >
                  <pre className="whitespace-pre-wrap text-blue-800 dark:text-blue-300">
                    {result.compileOutput}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

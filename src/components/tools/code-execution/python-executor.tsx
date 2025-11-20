/**
 * Python Code Executor
 * Executes Python code in browser using Pyodide WASM runtime
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Download, Package, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useWasmRuntimeManager } from "@/hooks/useWasmRuntimeManager";
import { useConsoleCapture } from "@/hooks/useConsoleCapture";
import type { PythonWasmRuntime } from "@/lib/runtimes/python-wasm";
import type { ExecutionResult, ExecutionOptions } from "@/lib/execution-sandbox";

interface PythonExecutorProps {
  initialCode?: string;
  onExecutionComplete?: (result: ExecutionResult) => void;
  className?: string;
  readOnly?: boolean;
  showStdin?: boolean;
  maxExecutionTime?: number;
  memoryLimit?: number;
}

const DEFAULT_PYTHON_CODE = `# Welcome to Python Execution with Pyodide!
# This runs entirely in your browser using WebAssembly

print("Hello, World!")

# Try some data processing
import math
numbers = [1, 2, 3, 4, 5]
squares = [x**2 for x in numbers]
print(f"Numbers: {numbers}")
print(f"Squares: {squares}")
print(f"Sum of squares: {sum(squares)}")

# Pyodide includes popular packages
try:
    import numpy as np
    arr = np.array([1, 2, 3, 4, 5])
    print(f"NumPy array: {arr}")
    print(f"Mean: {np.mean(arr)}")
except ImportError:
    print("NumPy not available")

# You can import standard library modules
import json
data = {"name": "Python", "version": "3.11"}
print(json.dumps(data, indent=2))`;

export const PythonExecutor: React.FC<PythonExecutorProps> = ({
  initialCode = DEFAULT_PYTHON_CODE,
  onExecutionComplete,
  className = "",
  readOnly = false,
  showStdin = true,
  maxExecutionTime = 5000,
  memoryLimit = 50 * 1024 * 1024, // 50MB
}) => {
  const [code, setCode] = useState(initialCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);
  const [packageInput, setPackageInput] = useState("");

  const runtimeManager = useWasmRuntimeManager("python");
  const { captureConsole, restoreConsole } = useConsoleCapture();
  const outputRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<PythonWasmRuntime | null>(null);

  // Initialize Python runtime
  useEffect(() => {
    const initializeRuntime = async () => {
      try {
        if (runtimeManager) {
          const runtime = await runtimeManager.getRuntime();
          runtimeRef.current = runtime;

          // Get available packages
          if (runtime.getInstalledPackages) {
            const packages = await runtime.getInstalledPackages();
            setAvailablePackages(packages);
          }
        }
      } catch (err) {
        setError(
          `Failed to initialize Python runtime: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    };

    initializeRuntime();
  }, [runtimeManager]);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const executeCode = useCallback(async () => {
    if (!runtimeRef.current || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setOutput("");
    setExecutionTime(null);
    setMemoryUsage(null);

    try {
      // Start console capture
      captureConsole((data) => {
        setOutput((prev) => prev + data + "\n");
      });

      const startTime = performance.now();

      // Prepare execution options
      const options: ExecutionOptions = {
        timeout: maxExecutionTime,
        memoryLimit,
        captureOutput: true,
        allowNetworking: false, // Security restriction
        workingDirectory: "/tmp",
      };

      // Execute Python code
      const result = await runtimeRef.current.execute(code, options);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      setExecutionTime(totalTime);

      if (result.memoryUsage) {
        setMemoryUsage(result.memoryUsage);
      }

      // Set final output if not captured by console
      if (result.output && !output) {
        setOutput(result.output);
      }

      if (result.error) {
        setError(result.error);
      }

      // Call completion callback
      if (onExecutionComplete) {
        onExecutionComplete({
          ...result,
          executionTime: totalTime,
          language: "python",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown execution error";
      setError(errorMessage);
      setOutput(`Error: ${errorMessage}\n`);

      if (onExecutionComplete) {
        onExecutionComplete({
          output: "",
          error: errorMessage,
          executionTime: 0,
          language: "python",
          memoryUsage: 0,
          exitCode: 1,
        });
      }
    } finally {
      // Restore console
      restoreConsole();
      setIsExecuting(false);
    }
  }, [
    code,
    runtimeRef.current,
    isExecuting,
    maxExecutionTime,
    memoryLimit,
    captureConsole,
    restoreConsole,
    output,
    onExecutionComplete,
  ]);

  const stopExecution = useCallback(() => {
    if (runtimeRef.current && isExecuting) {
      runtimeRef.current.interrupt();
      setIsExecuting(false);
      setOutput("\n--- Execution Stopped ---\n");
    }
  }, [runtimeRef.current, isExecuting]);

  const resetCode = useCallback(() => {
    setCode(initialCode);
    setOutput("");
    setError(null);
    setExecutionTime(null);
    setMemoryUsage(null);
  }, [initialCode]);

  const installPackage = useCallback(
    async (packageName: string) => {
      if (!runtimeRef.current || !packageName.trim()) return;

      try {
        setOutput((prev) => prev + `\nInstalling ${packageName}...\n`);

        await runtimeRef.current.installPackage(packageName.trim());

        setOutput((prev) => prev + `✓ ${packageName} installed successfully\n`);

        // Update available packages
        if (runtimeRef.current.getInstalledPackages) {
          const packages = await runtimeRef.current.getInstalledPackages();
          setAvailablePackages(packages);
        }

        setPackageInput("");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to install package";
        setOutput((prev) => prev + `✗ Failed to install ${packageName}: ${errorMessage}\n`);
      }
    },
    [runtimeRef.current],
  );

  const downloadCode = useCallback(() => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">Py</span>
              </div>
              Python Executor
              <Badge variant="outline">Pyodide WASM</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              {executionTime && <Badge variant="secondary">{executionTime.toFixed(0)}ms</Badge>}
              {memoryUsage && <Badge variant="secondary">{formatBytes(memoryUsage)}</Badge>}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Code editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Python Code</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadCode} disabled={readOnly}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetCode}
                disabled={readOnly || isExecuting}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your Python code here..."
            className="font-mono text-sm min-h-[300px]"
            disabled={readOnly || isExecuting}
            spellCheck={false}
          />
        </CardContent>
      </Card>

      {/* Package management */}
      {showStdin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4" />
              Package Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={packageInput}
                onChange={(e) => setPackageInput(e.target.value)}
                placeholder="Enter package name (e.g., numpy, pandas, requests)"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                disabled={isExecuting}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && packageInput.trim()) {
                    installPackage(packageInput);
                  }
                }}
              />
              <Button
                onClick={() => packageInput.trim() && installPackage(packageInput)}
                disabled={isExecuting || !packageInput.trim()}
                size="sm"
              >
                Install
              </Button>
            </div>

            {availablePackages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Available Packages:</h4>
                <div className="flex flex-wrap gap-1">
                  {availablePackages.slice(0, 20).map((pkg) => (
                    <Badge key={pkg} variant="outline" className="text-xs">
                      {pkg}
                    </Badge>
                  ))}
                  {availablePackages.length > 20 && (
                    <Badge variant="outline" className="text-xs">
                      +{availablePackages.length - 20} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={executeCode}
          disabled={isExecuting || !runtimeRef.current}
          className="bg-green-600 hover:bg-green-700"
        >
          {isExecuting ? (
            <>
              <Pause className="w-4 h-4 mr-1" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" />
              Run Code
            </>
          )}
        </Button>

        {isExecuting && (
          <Button
            onClick={stopExecution}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Pause className="w-4 h-4 mr-1" />
            Stop
          </Button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Output display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {output && !error ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <div className="w-4 h-4 border-2 border-gray-300 rounded" />
            )}
            Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={outputRef}
            className="bg-gray-50 border rounded-md p-3 font-mono text-sm whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-auto"
          >
            {output || "Run your code to see the output here..."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

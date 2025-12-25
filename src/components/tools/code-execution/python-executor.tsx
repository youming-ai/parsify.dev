'use client';

import { type ToolConfig, ToolWrapper } from '@/components/tools/tool-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MemoryManager } from '@/lib/memory-manager';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { type PythonExecutionResult, pythonRuntime } from '@/lib/runtimes/python-wasm';
import { FileCode, Plus, Trash, X } from '@phosphor-icons/react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PythonExecutorState {
  code: string;
  output: string;
  error: string | null;
  isRunning: boolean;
  isInstalling: boolean;
  packages: string[];
  inputFiles: Array<{ name: string; content: string }>;
  graphics: string[];
  executionTime: number | null;
  memoryUsage: number | null;
  packageInput: string;
  newFileName: string;
  newFileContent: string;
}

const DEFAULT_CODE = `# Python 3.11 (Pyodide)
import numpy as np
import matplotlib.pyplot as plt
import io

# Calculate sine wave
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Plot results
plt.figure(figsize=(8, 4))
plt.plot(x, y)
plt.title('Sine Wave')
plt.grid(True)
plt.show()

print(f"Calculated {len(x)} points")
`;

export const PythonExecutor: React.FC = () => {
  const [state, setState] = useState<PythonExecutorState>({
    code: DEFAULT_CODE,
    output: '',
    error: null,
    isRunning: false,
    isInstalling: false,
    packages: ['numpy', 'matplotlib'],
    inputFiles: [],
    graphics: [],
    executionTime: null,
    memoryUsage: null,
    packageInput: '',
    newFileName: '',
    newFileContent: '',
  });

  const [runtimeInitialized, setRuntimeInitialized] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Get singleton instances
  const memoryManager = MemoryManager.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Initialize runtime
  useEffect(() => {
    const init = async () => {
      try {
        await pythonRuntime.initialize();
        setRuntimeInitialized(true);
      } catch (_err) {
        setState((prev) => ({ ...prev, error: 'Failed to initialize Python runtime' }));
      }
    };
    init();
  }, []);

  // Scroll to bottom of output
  useEffect(() => {
    if (outputRef.current && state.output) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [state.output]);

  const runCode = useCallback(async () => {
    if (!runtimeInitialized) {
      setState((prev) => ({ ...prev, error: 'Runtime not initialized' }));
      return;
    }

    setState((prev) => ({ ...prev, isRunning: true, error: null, graphics: [], output: '' }));
    const startTime = performance.now();
    performanceMonitor.trackToolLoad('python-executor');

    try {
      const result: PythonExecutionResult = await pythonRuntime.executeCode({
        code: state.code,
        packages: state.packages.map((p) => ({ name: p })),
        inputFiles: state.inputFiles,
        captureGraphics: true,
        timeoutMs: 30000,
      });

      const executionTime = performance.now() - startTime;
      const memoryUsage = memoryManager.getMemoryUsage().used;

      if (result.exitCode === 0) {
        setState((prev) => ({
          ...prev,
          output: result.stdout || 'Program executed successfully',
          graphics: result.graphics || [],
          executionTime,
          memoryUsage,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          output: result.stdout || '',
          error: result.stderr || result.error?.message || 'Execution failed',
          graphics: result.graphics || [],
          executionTime,
          memoryUsage,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    } finally {
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [runtimeInitialized, state.code, state.packages, state.inputFiles]);

  const stopExecution = useCallback(() => {
    pythonRuntime.interrupt();
    setState((prev) => ({
      ...prev,
      isRunning: false,
      output: `${prev.output}\nExecution stopped.`,
    }));
  }, []);

  const installPackage = useCallback(async () => {
    if (!state.packageInput.trim()) return;

    setState((prev) => ({ ...prev, isInstalling: true }));
    try {
      await pythonRuntime.installPackage(state.packageInput);
      setState((prev) => ({
        ...prev,
        packages: [...prev.packages, prev.packageInput],
        packageInput: '',
        isInstalling: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: `Failed to install package: ${err instanceof Error ? err.message : String(err)}`,
        isInstalling: false,
      }));
    }
  }, [state.packageInput]);

  const addInputFile = useCallback(() => {
    if (!state.newFileName.trim()) return;

    setState((prev) => ({
      ...prev,
      inputFiles: [...prev.inputFiles, { name: prev.newFileName, content: prev.newFileContent }],
      newFileName: '',
      newFileContent: '',
    }));
  }, [state.newFileName, state.newFileContent]);

  const removeInputFile = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      inputFiles: prev.inputFiles.filter((f) => f.name !== name),
    }));
  }, []);

  const removePackage = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      packages: prev.packages.filter((p) => p !== name),
    }));
  }, []);

  const exportCode = useCallback(() => {
    const blob = new Blob([state.code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.code]);

  const importCode = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setState((prev) => ({ ...prev, code: content }));
    };
    reader.readAsText(file);
  }, []);

  const toolConfig: ToolConfig = {
    id: 'python-executor',
    name: 'Python Executor',
    description: 'Execute Python code in browser using Pyodide WASM runtime',
    category: 'code',
    version: '3.11.0',
    icon: '🐍',
    tags: ['python', 'pyodide', 'wasm', 'execution', 'data-science'],
    hasSettings: true,
    hasHelp: true,
    canExport: true,
    canImport: true,
    canCopy: true,
    canReset: true,
  };

  return (
    <ToolWrapper
      config={toolConfig}
      isLoading={!runtimeInitialized}
      onExport={exportCode}
      onImport={() => document.getElementById('python-import')?.click()}
      onCopy={() => navigator.clipboard.writeText(state.output)}
      onReset={() => setState((prev) => ({ ...prev, output: '', error: null, graphics: [] }))}
    >
      <input type="file" id="python-import" className="hidden" accept=".py" onChange={importCode} />

      <div className="grid h-[calc(100vh-200px)] grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="flex flex-1 flex-col">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-medium text-sm">Code Editor</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={state.isRunning ? stopExecution : runCode}
                    variant={state.isRunning ? 'destructive' : 'default'}
                    disabled={!runtimeInitialized}
                  >
                    {state.isRunning ? 'Stop' : 'Run'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Textarea
                value={state.code}
                onChange={(e) => setState((prev) => ({ ...prev, code: e.target.value }))}
                className="h-full resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          <Card className="flex h-1/3 flex-col">
            <CardHeader className="py-3">
              <CardTitle className="font-medium text-sm">Output</CardTitle>
            </CardHeader>
            <CardContent className="relative flex-1 p-0">
              <div
                ref={outputRef}
                className="absolute inset-0 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm"
              >
                {state.error && (
                  <div className="mb-2 font-bold text-red-500">Error: {state.error}</div>
                )}
                {state.output}
                {state.graphics.map((img, i) => (
                  <img
                    key={i}
                    src={`data:image/png;base64,${img}`}
                    alt={`Plot ${i + 1}`}
                    className="mt-2 max-w-full"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="font-medium text-sm">Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Packages</Label>
                <div className="mt-1 mb-2 flex gap-2">
                  <Input
                    value={state.packageInput}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, packageInput: e.target.value }))
                    }
                    placeholder="Package name..."
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={installPackage}
                    disabled={state.isInstalling}
                  >
                    {state.isInstalling ? '...' : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {state.packages.map((pkg) => (
                    <Badge
                      key={pkg}
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      {pkg}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removePackage(pkg)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Input Files</Label>
                <div className="mt-1 space-y-2">
                  <Input
                    value={state.newFileName}
                    onChange={(e) => setState((prev) => ({ ...prev, newFileName: e.target.value }))}
                    placeholder="filename.txt"
                    className="h-8 text-sm"
                  />
                  <Textarea
                    value={state.newFileContent}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, newFileContent: e.target.value }))
                    }
                    placeholder="File content..."
                    className="h-20 resize-none text-sm"
                  />
                  <Button size="sm" variant="outline" className="w-full" onClick={addInputFile}>
                    Add File
                  </Button>
                </div>
                <ScrollArea className="mt-2 h-32 rounded-md border p-2">
                  {state.inputFiles.map((file) => (
                    <div key={file.name} className="flex items-center justify-between py-1 text-sm">
                      <span className="flex items-center gap-2">
                        <FileCode className="h-3 w-3" />
                        {file.name}
                      </span>
                      <Trash
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeInputFile(file.name)}
                      />
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {state.executionTime !== null && (
                <div className="border-t pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Time:</span>
                    <span>{state.executionTime.toFixed(2)}ms</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Memory:</span>
                    <span>
                      {state.memoryUsage ? (state.memoryUsage / 1024 / 1024).toFixed(2) : 0} MB
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolWrapper>
  );
};

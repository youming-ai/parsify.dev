# Quick Start Guide: Complete Developer Tools Platform

**Created**: 2025-01-18  
**Purpose**: Rapid onboarding guide for developers implementing the 76+ tools expansion

---

## Getting Started

### Prerequisites

**Required Tools & Versions:**
- Node.js >= 20.0.0
- pnpm >= 9.0.0 (package manager)
- Git for version control
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

**Development Environment:**
- TypeScript 5.0+ in strict mode
- React 19+ with functional components and hooks
- Next.js 16 with App Router
- Tailwind CSS for styling
- Zustand for state management

---

## Architecture Overview

### Core Principles

1. **Client-Side Processing**: All tools execute in browser using JavaScript/TypeScript
2. **Monaco Editor Integration**: Code/data tools use Monaco with language-specific lazy loading
3. **Tool Modularity**: Each tool is standalone React component with independent interfaces
4. **Progressive Enhancement**: Core functionality works without JavaScript where possible
5. **Performance First**: Individual tools <200KB, total platform <2MB compressed

### Existing Project Structure

```
src/components/tools/
├── json/                    # JSON tools (7 implemented)
│   ├── json-formatter.tsx
│   ├── json-validator.tsx
│   └── json-viewer.tsx
├── code/                    # Code tools (5 implemented)
│   ├── code-formatter.tsx
│   ├── code-executor.tsx
│   └── monaco-editor.tsx
├── data/                    # Data utilities (7 implemented)
│   ├── hash-generator.tsx
│   ├── data-validator.tsx
│   └── base64-converter.tsx
└── [other existing categories]
```

---

## Phase 1: JSON Tools Implementation

### 1.1 JSON Hero Viewer

**File**: `src/components/tools/json/json-hero-viewer.tsx`

```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { ToolWrapper } from '../tool-wrapper';
import { useToolState } from '@/hooks/use-tool-state';

interface JSONHeroViewerProps {
  initialData?: string;
}

export const JSONHeroViewer: React.FC<JSONHeroViewerProps> = ({ 
  initialData = '' 
}) => {
  const [input, setInput] = useState(initialData);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Tool state management
  const { state, updateState } = useToolState('json-hero-viewer');

  // Parse JSON with error handling
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(input);
    } catch (error) {
      return null;
    }
  }, [input]);

  // Generate tree structure for visualization
  const treeData = useMemo(() => {
    if (!parsedData) return null;
    return generateTreeStructure(parsedData, expandedPaths, searchQuery);
  }, [parsedData, expandedPaths, searchQuery]);

  // Handle path expansion/collapse
  const togglePath = useCallback((path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  }, [expandedPaths]);

  // Copy JSON path to clipboard
  const copyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path);
    setSelectedPath(path);
  }, []);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    updateState({ input: { type: 'json', data: value } });
  }, [updateState]);

  return (
    <ToolWrapper
      title="JSON Hero Viewer"
      description="Interactive JSON visualization with search and navigation"
    >
      <div className="flex h-full">
        {/* JSON Input */}
        <div className="w-1/2 p-4 border-r">
          <h3 className="text-lg font-semibold mb-2">JSON Input</h3>
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full h-full p-2 border rounded font-mono text-sm"
            placeholder="Paste your JSON here..."
          />
        </div>

        {/* Interactive Tree View */}
        <div className="w-1/2 p-4">
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in JSON..."
              className="w-full p-2 border rounded"
            />
          </div>

          {parsedData ? (
            <JSONTreeView
              data={treeData}
              expandedPaths={expandedPaths}
              onTogglePath={togglePath}
              onCopyPath={copyPath}
              selectedPath={selectedPath}
            />
          ) : (
            <div className="text-red-500">
              Invalid JSON: Please check your input
            </div>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
};

// Helper functions
function generateTreeStructure(data: any, expandedPaths: Set<string>, searchQuery: string): TreeNode {
  // Implementation for generating tree structure
  // ... (detailed implementation in actual code)
}

interface TreeNode {
  key: string;
  value: any;
  path: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  children?: TreeNode[];
  isExpanded: boolean;
  isHighlighted: boolean;
}
```

### 1.2 JSON Code Generator

**File**: `src/components/tools/json/json-code-generators/json-to-typescript.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { ToolWrapper } from '../../tool-wrapper';

interface JSONToTypeScriptProps {}

export const JSONToTypeScript: React.FC<JSONToTypeScriptProps> = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [typescriptOutput, setTypescriptOutput] = useState('');
  const [options, setOptions] = useState({
    interfaceNames: 'pascal',
    propertyNames: 'camel',
    generateComments: true,
    optionalProperties: false,
    strictNullChecks: true
  });

  // Generate TypeScript interfaces from JSON
  const generateTypeScript = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      const interfaces = generateInterfaces(parsed, options);
      setTypescriptOutput(interfaces);
    } catch (error) {
      setTypescriptOutput(`Error: ${error.message}`);
    }
  }, [jsonInput, options]);

  // Core interface generation logic
  function generateInterfaces(data: any, opts: typeof options): string {
    // Implementation for generating TypeScript interfaces
    // ... (detailed implementation in actual code)
  }

  return (
    <ToolWrapper
      title="JSON to TypeScript Converter"
      description="Generate TypeScript interfaces from JSON data"
    >
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">JSON Input</h3>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-32 p-2 border rounded font-mono text-sm"
            placeholder="Paste your JSON here..."
          />
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Options</h3>
          <div className="grid grid-cols-2 gap-4">
            <label>
              <input
                type="checkbox"
                checked={options.generateComments}
                onChange={(e) => setOptions({...options, generateComments: e.target.checked})}
              />
              Generate Comments
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.optionalProperties}
                onChange={(e) => setOptions({...options, optionalProperties: e.target.checked})}
              />
              Optional Properties
            </label>
          </div>
        </div>

        <button
          onClick={generateTypeScript}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Generate TypeScript
        </button>

        <div>
          <h3 className="text-lg font-semibold mb-2">TypeScript Output</h3>
          <textarea
            value={typescriptOutput}
            readOnly
            className="w-full h-48 p-2 border rounded font-mono text-sm"
          />
        </div>
      </div>
    </ToolWrapper>
  );
};
```

---

## Phase 2: Code Execution Implementation

### 2.1 Python Executor

**File**: `src/lib/runtimes/python-wasm.ts`

```typescript
import { loadPyodide, PyodideInterface } from 'pyodide';

export class PythonRuntime {
  private pyodide: PyodideInterface | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      this.pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
      });

      // Pre-load common packages
      await this.pyodide.loadPackage(['numpy', 'pandas', 'matplotlib']);
      
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Python runtime: ${error.message}`);
    }
  }

  async executeCode(code: string, options: {
    timeout?: number;
    packages?: string[];
    captureOutput?: boolean;
  } = {}): Promise<ExecutionResult> {
    await this.initialize();

    if (!this.pyodide) {
      throw new Error('Python runtime not initialized');
    }

    const { timeout = 5000, packages = [], captureOutput = true } = options;

    // Load additional packages if requested
    if (packages.length > 0) {
      await this.pyodide.loadPackage(packages);
    }

    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      let output = '';
      let errorOutput = '';
      let isComplete = false;

      // Create timeout
      const timeoutId = setTimeout(() => {
        if (!isComplete) {
          isComplete = true;
          reject(new Error('Execution timeout'));
        }
      }, timeout);

      try {
        // Capture stdout and stderr
        this.pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
        `);

        // Execute user code
        this.pyodide.runPython(code);

        // Capture output
        if (captureOutput) {
          output = this.pyodide.runPython(`
output = sys.stdout.getvalue()
sys.stdout = sys.__stdout__
output
          `) as string;

          errorOutput = this.pyodide.runPython(`
error_output = sys.stderr.getvalue()
sys.stderr = sys.__stderr__
error_output
          `) as string;
        }

        isComplete = true;
        clearTimeout(timeoutId);

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        resolve({
          stdout: output,
          stderr: errorOutput,
          exitCode: errorOutput ? 1 : 0,
          executionTime,
          memoryUsed: this._estimateMemoryUsage()
        });

      } catch (error) {
        isComplete = true;
        clearTimeout(timeoutId);
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        resolve({
          stdout: output,
          stderr: error instanceof Error ? error.message : String(error),
          exitCode: 1,
          executionTime,
          memoryUsed: this._estimateMemoryUsage(),
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    });
  }

  private _estimateMemoryUsage(): number {
    // Estimate memory usage - implementation varies by runtime
    return 0; // Placeholder
  }

  async installPackage(packageName: string): Promise<void> {
    await this.initialize();
    
    if (!this.pyodide) {
      throw new Error('Python runtime not initialized');
    }

    try {
      await this.pyodide.loadPackage(packageName);
    } catch (error) {
      throw new Error(`Failed to install package ${packageName}: ${error.message}`);
    }
  }

  async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
    await this.initialize();
    
    if (!this.pyodide) {
      throw new Error('Python runtime not initialized');
    }

    try {
      const info = this.pyodide.runPython(`
import importlib.metadata
try:
    info = importlib.metadata.version('${packageName}')
    {"version": info, "installed": True}
except:
    {"installed": False}
      `) as { version: string; installed: boolean };

      return info.installed ? {
        name: packageName,
        version: info.version,
        installed: true
      } : null;
    } catch {
      return null;
    }
  }
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  error?: Error;
}

interface PackageInfo {
  name: string;
  version: string;
  installed: boolean;
}
```

---

## Phase 3: Image Processing Implementation

### 3.1 Image Converter

**File**: `src/components/tools/image/image-converter.tsx`

```typescript
import React, { useState, useCallback, useRef } from 'react';
import { ToolWrapper } from '../tool-wrapper';

interface ImageConverterProps {}

export const ImageConverter: React.FC<ImageConverterProps> = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp' | 'gif'>('png');
  const [quality, setQuality] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setProcessedImage(null);
      
      // Display original image
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Convert image format
  const convertImage = useCallback(async () => {
    if (!selectedFile || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      const img = new Image();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image to canvas
            ctx.drawImage(img, 0, 0);

            // Convert to target format
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setProcessedImage(e.target?.result as string);
                    setIsProcessing(false);
                    resolve();
                  };
                  reader.readAsDataURL(blob);
                } else {
                  setIsProcessing(false);
                  reject(new Error('Failed to convert image'));
                }
              },
              `image/${outputFormat}`,
              quality / 100
            );
          } catch (error) {
            setIsProcessing(false);
            reject(error);
          }
        };

        img.onerror = () => {
          setIsProcessing(false);
          reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(selectedFile);
      });
    } catch (error) {
      setIsProcessing(false);
      console.error('Image conversion failed:', error);
    }
  }, [selectedFile, outputFormat, quality]);

  // Download processed image
  const downloadImage = useCallback(() => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `converted-image.${outputFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage, outputFormat]);

  return (
    <ToolWrapper
      title="Image Format Converter"
      description="Convert images between different formats (PNG, JPEG, WebP, GIF)"
    >
      <div className="p-6">
        {/* File Input */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Select Image
          </button>

          {selectedFile && (
            <span className="ml-4 text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>

        {/* Conversion Options */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Output Format:
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
              <option value="gif">GIF</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Quality: {quality}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Convert Button */}
        <div className="mb-6">
          <button
            onClick={convertImage}
            disabled={!selectedFile || isProcessing}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isProcessing ? 'Converting...' : 'Convert Image'}
          </button>
        </div>

        {/* Image Preview */}
        <div className="grid grid-cols-2 gap-6">
          {/* Original Image */}
          {originalImage && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Original</h3>
              <img
                src={originalImage}
                alt="Original"
                className="max-w-full h-auto border rounded"
              />
            </div>
          )}

          {/* Processed Image */}
          {processedImage && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Converted</h3>
              <img
                src={processedImage}
                alt="Converted"
                className="max-w-full h-auto border rounded"
              />
              <button
                onClick={downloadImage}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Download {outputFormat.toUpperCase()}
              </button>
            </div>
          )}
        </div>

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </ToolWrapper>
  );
};
```

---

## Performance Guidelines

### Bundle Size Optimization

1. **Lazy Loading Tools**:
```typescript
// Dynamic import for tool components
const JsonHeroViewer = lazy(() => import('./json/json-hero-viewer'));
const ImageConverter = lazy(() => import('./image/image-converter'));
```

2. **WASM Runtime Loading**:
```typescript
// Load WASM runtimes only when needed
const loadPythonRuntime = () => import('@/lib/runtimes/python-wasm');
```

3. **Tree Shaking**:
```typescript
// Import only what's needed
import { AES } from 'crypto-js/aes';
import { SHA256 } from 'crypto-js/sha256';
```

### Memory Management

1. **Cleanup Resources**:
```typescript
useEffect(() => {
  return () => {
    // Cleanup WASM instances
    cleanupRuntime();
    // Clear image references
    URL.revokeObjectURL(imageUrl);
  };
}, []);
```

2. **Memory Monitoring**:
```typescript
const monitorMemory = () => {
  if ('memory' in performance) {
    const mem = (performance as any).memory;
    console.log(`Memory: ${mem.usedJSHeapSize / 1024 / 1024} MB`);
  }
};
```

---

## Testing Guidelines

### Unit Testing

```typescript
// Example unit test for JSON tool
import { render, screen, fireEvent } from '@testing-library/react';
import { JSONHeroViewer } from './json-hero-viewer';

describe('JSONHeroViewer', () => {
  test('parses valid JSON correctly', () => {
    const validJson = '{"name": "test", "value": 123}';
    render(<JSONHeroViewer initialData={validJson} />);
    
    expect(screen.queryByText(/Invalid JSON/)).not.toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  test('shows error for invalid JSON', () => {
    const invalidJson = '{"name": "test",}';
    render(<JSONHeroViewer initialData={invalidJson} />);
    
    expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
// Example integration test
describe('Tool Integration', () => {
  test('JSON converter integrates with code generator', async () => {
    // Test integration between tools
  });
});
```

---

## Development Workflow

1. **Create Tool Component**: Follow the established patterns
2. **Add Tool Configuration**: Register in tool registry
3. **Implement Core Logic**: Focus on client-side processing
4. **Add Tests**: Unit and integration tests
5. **Performance Check**: Bundle size and memory usage
6. **Accessibility Review**: Screen reader and keyboard navigation
7. **Code Review**: Constitutional compliance check

---

## Common Patterns

### Tool State Management

```typescript
// Custom hook for tool state
export function useToolState(toolId: string) {
  const [state, setState] = useState<ToolState>({
    toolId,
    sessionId: generateSessionId(),
    configuration: getDefaultConfig(toolId),
    input: { type: 'text', data: '' },
    execution: { status: 'idle', errorCount: 0, warningCount: 0 },
    uiState: { activeTab: 'input', expandedSections: [] },
    metadata: { version: '1.0.0', createdAt: new Date() }
  });

  const updateState = useCallback((updates: Partial<ToolState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return { state, updateState };
}
```

### Error Handling

```typescript
// Standardized error handling
export function handleToolError(error: unknown, context: string): ToolError {
  if (error instanceof Error) {
    return {
      code: 'TOOL_ERROR',
      message: error.message,
      severity: 'error',
      recoverable: true,
      context,
      suggestions: ['Check input format', 'Try again with different data']
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    severity: 'error',
    recoverable: false,
    context,
    suggestions: ['Refresh the page', 'Contact support']
  };
}
```

---

This quickstart guide provides the essential patterns and examples needed to rapidly implement the 76+ developer tools while maintaining consistency with the existing architecture and constitutional requirements.
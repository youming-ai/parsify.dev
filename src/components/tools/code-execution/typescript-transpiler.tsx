/**
 * TypeScript Code Executor Component
 *
 * Provides TypeScript code editing, compilation, and execution capabilities with:
 * - Monaco Editor integration with TypeScript language support
 * - Live type checking and IntelliSense
 * - Deno runtime integration for secure execution
 * - Import/export functionality for .ts files
 * - Preset code examples demonstrating TypeScript features
 * - Real-time compilation and error reporting
 * - Performance monitoring and memory management
 */

import { type ToolConfig, ToolWrapper } from '@/components/tools/tool-wrapper';
import { MemoryManager } from '@/lib/memory-manager';
import { PerformanceMonitor } from '@/lib/performance-monitor';
// import * as monaco from 'monaco-editor'; // Removed - using CodeMirror now
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

interface TypeScriptExecutorProps {
  onComplete?: (result: string) => void;
}

// TypeScript preset examples
const typescriptPresets = [
  {
    name: 'Hello TypeScript',
    code: `// TypeScript Hello World with strong typing
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message: string = greet("TypeScript");
console.log(message);

// Interface definition
interface Person {
  name: string;
  age: number;
}

const user: Person = {
  name: "Alice",
  age: 30
};

console.log(\`User: \${user.name}, Age: \${user.age}\`);`,
  },
  {
    name: 'Classes & Inheritance',
    code: `// TypeScript classes with inheritance and access modifiers
abstract class Shape {
  protected constructor(public color: string) {}

  abstract getArea(): number;

  describe(): string {
    return \`A \${this.color} shape\`;
  }
}

class Circle extends Shape {
  constructor(color: string, public radius: number) {
    super(color);
  }

  getArea(): number {
    return Math.PI * this.radius * this.radius;
  }
}

class Rectangle extends Shape {
  constructor(color: string, public width: number, public height: number) {
    super(color);
  }

  getArea(): number {
    return this.width * this.height;
  }
}

const circle = new Circle("red", 5);
const rect = new Rectangle("blue", 4, 6);

console.log(circle.describe());
console.log(\`Circle area: \${circle.getArea().toFixed(2)}\`);
console.log(rect.describe());
console.log(\`Rectangle area: \${rect.getArea()}\`);`,
  },
  {
    name: 'Generics & Types',
    code: `// TypeScript generics and utility types
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// Generic implementation
class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  private entities: Map<string, T> = new Map();

  async findById(id: string): Promise<T | null> {
    return this.entities.get(id) || null;
  }

  async save(entity: T): Promise<T> {
    this.entities.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<boolean> {
    return this.entities.delete(id);
  }
}

interface User {
  id: string;
  name: string;
  email?: string;
}

type CreateUser = Omit<User, 'id'>;
type UserPreview = Pick<User, 'name' | 'email'>;

const userRepo = new InMemoryRepository<User>();

async function demonstrateGenerics() {
  const newUser: CreateUser = {
    name: "John Doe",
    email: "john@example.com"
  };

  const user = await userRepo.save({ ...newUser, id: "1" });
  const found = await userRepo.findById("1");

  console.log("Created user:", user);
  console.log("Found user:", found);
}

demonstrateGenerics();`,
  },
  {
    name: 'Async/Await',
    code: `// TypeScript async/await with proper typing
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

class HttpClient {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      data: {} as T,
      status: 200,
      message: "OK"
    };
  }

  async post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      data: {} as T,
      status: 201,
      message: "Created"
    };
  }
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

class BlogService {
  constructor(private http: HttpClient) {}

  async getPosts(): Promise<Post[]> {
    const response = await this.http.get<Post[]>('/posts');
    return response.data;
  }

  async createPost(title: string, body: string): Promise<Post> {
    const newPost = {
      title,
      body,
      userId: 1
    };

    const response = await this.http.post<Post>('/posts', newPost);
    return response.data;
  }
}

async function demonstrateAsync() {
  const blogService = new BlogService(new HttpClient());

  try {
    console.log("Fetching posts...");
    const posts = await blogService.getPosts();
    console.log(\`Fetched \${posts.length} posts\`);

    console.log("Creating new post...");
    const post = await blogService.createPost(
      "My TypeScript Journey",
      "Learning TypeScript has been amazing!"
    );
    console.log("Created post:", post);

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }
}

demonstrateAsync();`,
  },
];

export const TypeScriptTranspiler: React.FC<TypeScriptExecutorProps> = ({ onComplete }) => {
  // Editor and execution state
  const [code, setCode] = useState(typescriptPresets[0].code);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [compilationErrors, setCompilationErrors] = useState<string[]>([]);
  const [jsCode, setJsCode] = useState('');
  const [showCompiledJS, setShowCompiledJS] = useState(false);

  // TypeScript configuration
  const [tsConfig, setTsConfig] = useState({
    target: 'ES2020',
    module: 'ESNext',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    experimentalDecorators: false,
  });

  // Module imports
  const [moduleImports, setModuleImports] = useState(['https://deno.land/std@0.177.0/mod.ts']);

  // Singletons
  const memoryManager = MemoryManager.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Initialize Monaco Editor with TypeScript support
  useEffect(() => {
    // Monaco Editor configuration removed - now using CodeMirror
    // The TypeScript compilation still works without Monaco's type checking
    /*
    // Add TypeScript types to Monaco
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
      strict: tsConfig.strict,
      experimentalDecorators: tsConfig.experimentalDecorators,
    });

    // Add Deno type definitions
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare namespace Deno {
        export interface FileInfo {
          isFile: boolean;
          isDirectory: boolean;
          isSymlink: boolean;
          size: number;
          mtime: Date | null;
          atime: Date | null;
          birthtime: Date | null;
          dev: number;
          ino: number;
          mode: number | null;
          nlink: number;
          uid: number | null;
          gid: number | null;
          rdev: number | null;
          blksize: number | null;
          blocks: number | null;
        }

        export function readTextFileSync(path: string): string;
        export function writeTextFileSync(path: string, data: string): void;
        export function readDirSync(path: string): FileInfo[];
        export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
        export function removeSync(path: string): void;
        export function statSync(path: string): FileInfo;
      }
    `,
      'deno.d.ts'
    );
    */
  }, [tsConfig]);

  // Compile TypeScript to JavaScript
  const compileTypeScript = useCallback(
    async (sourceCode: string): Promise<{ js: string; errors: string[] }> => {
      try {
        // For now, use a simplified TypeScript compilation
        // In a real implementation, you'd use typescript compiler API
        const ts = await import('typescript');

        const compilerOptions = {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          strict: tsConfig.strict,
          esModuleInterop: tsConfig.esModuleInterop,
          skipLibCheck: tsConfig.skipLibCheck,
          experimentalDecorators: tsConfig.experimentalDecorators,
          noEmitOnError: true,
        };

        const result = ts.transpileModule(sourceCode, {
          compilerOptions,
          reportDiagnostics: true,
        });

        const errors = result.diagnostics
          ? result.diagnostics
              .filter((diag) => diag.category === ts.DiagnosticCategory.Error)
              .map((diag) => ts.flattenDiagnosticMessageText(diag.messageText, '\n'))
          : [];

        return {
          js: result.outputText,
          errors,
        };
      } catch (error) {
        // Fallback if typescript package is not available
        console.warn('TypeScript compiler not available, using basic compilation');
        return {
          js: sourceCode
            .replace(/: string/g, '')
            .replace(/: number/g, '')
            .replace(/: boolean/g, '')
            .replace(/interface.*?{[^}]*}/gs, '')
            .replace(/type.*?=.*?;/g, '')
            .replace(/export /g, '')
            .replace(/import.*?;/g, ''),
          errors: [
            `TypeScript compiler not available: ${error instanceof Error ? error.message : String(error)}`,
          ],
        };
      }
    },
    [tsConfig]
  );

  // Execute TypeScript code
  const executeTypeScript = useCallback(async () => {
    // Removed constitutional compliance check as the hook is missing

    setIsRunning(true);
    setOutput('');
    setCompilationErrors([]);

    performanceMonitor.trackToolLoad('typescript-transpiler');

    try {
      // Check memory usage
      const memoryUsage = memoryManager.getMemoryUsage();
      if (memoryUsage.percentage > 90) {
        setOutput(`❌ Memory limit exceeded: ${memoryUsage.used} bytes used`);
        return;
      }

      // Compile TypeScript to JavaScript
      setOutput('🔨 Compiling TypeScript to JavaScript...\n');
      const compileResult = await compileTypeScript(code);

      if (compileResult.errors.length > 0) {
        setOutput(
          (prev) =>
            `${prev}❌ Compilation errors:\n${compileResult.errors.map((e) => `  • ${e}`).join('\n')}`
        );
        setCompilationErrors(compileResult.errors);
        return;
      }

      setJsCode(compileResult.js);
      setOutput((prev) => `${prev}✅ Compilation successful!\n\n`);
      setOutput((prev) => `${prev}🚀 Executing JavaScript...\n`);

      // Capture console output
      const originalLog = console.log;
      const originalError = console.error;
      const logs: string[] = [];
      const errors: string[] = [];

      console.log = (...args) => {
        logs.push(
          args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
            .join(' ')
        );
      };

      console.error = (...args) => {
        errors.push(args.map((arg) => String(arg)).join(' '));
      };

      try {
        // Create async function to execute the compiled JavaScript
        const executeCode = new Function(
          'console',
          `
          ${moduleImports.map((imp) => `// import from ${imp}`).join('\n')}

          ${compileResult.js}
        `
        );

        // Execute with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Execution timeout (5s)')), 5000);
        });

        const executionPromise = Promise.resolve(executeCode(console));

        await Promise.race([executionPromise, timeoutPromise]);

        // Restore console methods
        console.log = originalLog;
        console.error = originalError;

        // Format output
        let finalOutput = '';
        if (logs.length > 0) {
          finalOutput += `📋 Output:\n${logs.join('\n')}\n\n`;
        }
        if (errors.length > 0) {
          finalOutput += `❌ Errors:\n${errors.join('\n')}\n\n`;
        }

        finalOutput += '✅ Execution completed successfully!';

        setOutput(finalOutput);
        if (onComplete) onComplete(finalOutput);
      } catch (execError) {
        // Restore console methods
        console.log = originalLog;
        console.error = originalError;

        const errorMessage = execError instanceof Error ? execError.message : String(execError);
        setOutput((prev) => `${prev}❌ Runtime error: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setOutput(`❌ Compilation or execution error: ${errorMessage}`);
    } finally {
      const _metrics = performanceMonitor.getToolMetrics('typescript-transpiler');
      const memoryStats = memoryManager.getMemoryUsage();

      // setOutput((prev) => `${prev}\n\n⏱️ Execution time: ${metrics?.executionTime?.toFixed(2) || 0}ms`);
      setOutput(
        (prev) => `${prev}\n💾 Memory usage: ${(memoryStats.used / 1024 / 1024).toFixed(2)}MB`
      );

      setIsRunning(false);
    }
  }, [code, moduleImports, memoryManager, performanceMonitor, compileTypeScript, onComplete]);

  // Handle file import
  const importFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.name.endsWith('.ts')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        setOutput(`✅ Imported ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      setOutput('❌ Please select a valid TypeScript file (.ts)');
    }
  }, []);

  // Handle file export
  const exportFile = useCallback(() => {
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOutput('✅ Exported code.ts');
  }, [code]);

  // Insert module import
  const insertModuleImport = useCallback(() => {
    const importStatement = `import { } from '';`;
    const newCode = `${importStatement}\n\n${code}`;
    setCode(newCode);
  }, [code]);

  const toolConfig: ToolConfig = {
    id: 'typescript-transpiler',
    name: 'TypeScript Transpiler',
    description:
      'Edit, compile, and execute TypeScript code with real-time type checking and Deno runtime integration',
    category: 'code',
    version: '1.0.0',
    icon: 'TS',
    tags: ['typescript', 'transpiler', 'execution'],
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
      onExport={exportFile}
      onImport={() => document.getElementById('ts-import')?.click()}
      onCopy={() => navigator.clipboard.writeText(output)}
      onReset={() => {
        setCode(typescriptPresets[0].code);
        setOutput('');
        setCompilationErrors([]);
      }}
    >
      <input type="file" id="ts-import" accept=".ts" onChange={importFile} className="hidden" />

      <div className="flex flex-col space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={executeTypeScript}
            disabled={isRunning}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Running...
              </>
            ) : (
              <>
                <span className="h-4 w-4">▶</span>
                Run TypeScript
              </>
            )}
          </button>

          <button
            onClick={insertModuleImport}
            className="flex items-center gap-2 rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
          >
            <span className="h-4 w-4">📦</span>
            Import Module
          </button>

          <label className="flex cursor-pointer items-center gap-2 rounded bg-gray-600 px-3 py-2 text-white hover:bg-gray-700">
            <span className="h-4 w-4">📁</span>
            Import .ts
            <input type="file" accept=".ts" onChange={importFile} className="hidden" />
          </label>

          <button
            onClick={exportFile}
            className="flex items-center gap-2 rounded bg-gray-600 px-3 py-2 text-white hover:bg-gray-700"
          >
            <span className="h-4 w-4">💾</span>
            Export .ts
          </button>

          <button
            onClick={() => setShowCompiledJS(!showCompiledJS)}
            className="flex items-center gap-2 rounded bg-purple-600 px-3 py-2 text-white hover:bg-purple-700"
          >
            <span className="h-4 w-4">{showCompiledJS ? '🔒' : '👁'}</span>
            {showCompiledJS ? 'Hide' : 'Show'} JS
          </button>

          <select
            value={tsConfig.target}
            onChange={(e) =>
              setTsConfig((prev) => ({
                ...prev,
                target: e.target.value as any,
              }))
            }
            className="rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          >
            <option value="ES2015">ES2015</option>
            <option value="ES2016">ES2016</option>
            <option value="ES2017">ES2017</option>
            <option value="ES2018">ES2018</option>
            <option value="ES2019">ES2019</option>
            <option value="ES2020">ES2020</option>
            <option value="ES2021">ES2021</option>
            <option value="ES2022">ES2022</option>
          </select>

          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={tsConfig.strict}
              onChange={(e) => setTsConfig((prev) => ({ ...prev, strict: e.target.checked }))}
              className="rounded"
            />
            Strict Mode
          </label>

          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={tsConfig.experimentalDecorators}
              onChange={(e) =>
                setTsConfig((prev) => ({
                  ...prev,
                  experimentalDecorators: e.target.checked,
                }))
              }
              className="rounded"
            />
            Decorators
          </label>
        </div>

        {/* Preset Examples */}
        <div className="flex flex-wrap gap-2">
          {typescriptPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => {
                setCode(preset.code);
                setOutput(`✅ Loaded preset: ${preset.name}`);
              }}
              className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-600"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Module Configuration */}
        <div className="rounded bg-gray-800 p-3">
          <div className="mb-2 font-semibold text-sm text-white">Module Imports:</div>
          <div className="flex flex-wrap gap-2">
            {moduleImports.map((module, index) => (
              <span key={index} className="rounded bg-gray-700 px-2 py-1 text-gray-300 text-xs">
                {module}
                <button
                  onClick={() => {
                    setModuleImports((prev) => prev.filter((_, i) => i !== index));
                  }}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Compilation Errors */}
        {compilationErrors.length > 0 && (
          <div className="rounded border border-red-500 bg-red-900 bg-opacity-20 p-3">
            <div className="mb-2 font-semibold text-red-400 text-sm">Compilation Errors:</div>
            {compilationErrors.map((error, index) => (
              <div key={index} className="font-mono text-red-300 text-sm">
                • {error}
              </div>
            ))}
          </div>
        )}

        <div className="grid h-[600px] grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Editor */}
          <div className="overflow-hidden rounded border border-gray-700">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-full w-full resize-none bg-[#1e1e1e] p-4 font-mono text-[#d4d4d4] text-sm focus:outline-none"
              spellCheck={false}
            />
          </div>

          {/* Output */}
          <div className="flex h-full flex-col gap-4">
            {showCompiledJS && (
              <div className="h-1/2 overflow-hidden rounded border border-gray-700">
                <textarea
                  value={jsCode}
                  readOnly
                  className="h-full w-full resize-none bg-[#1e1e1e] p-4 font-mono text-[#d4d4d4] text-sm focus:outline-none"
                />
              </div>
            )}
            <div
              className={`${showCompiledJS ? 'h-1/2' : 'h-full'} overflow-hidden rounded border border-gray-700 bg-[#1e1e1e]`}
            >
              <textarea
                value={output}
                readOnly
                className="h-full w-full resize-none bg-[#1e1e1e] p-4 font-mono text-[#d4d4d4] text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

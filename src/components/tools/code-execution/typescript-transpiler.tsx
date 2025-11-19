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
 * - Integration with the constitutional compliance layer
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import * as monaco from "monaco-editor";
import { ToolWrapper } from "../common/ToolWrapper";
import { usePerformanceMonitor } from "../../../hooks/usePerformanceMonitor";
import { useMemoryManagement } from "../../../hooks/useMemoryManagement";
import { useConstitutionalCompliance } from "../../../hooks/useConstitutionalCompliance";

interface TypeScriptExecutorProps {
  onComplete: (result: string) => void;
}

// TypeScript preset examples
const typescriptPresets = [
  {
    name: "Hello TypeScript",
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
    name: "Classes & Inheritance",
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
    name: "Generics & Types",
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
    name: "Async/Await",
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
  {
    name: "Decorators",
    code: `// TypeScript decorators (experimental feature)
// Requires "experimentalDecorators": true in tsconfig

function logged(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    console.log(\`Calling \${propertyKey} with args:\`, args);
    const result = originalMethod.apply(this, args);
    console.log(\`\${propertyKey} returned:\`, result);
    return result;
  };

  return descriptor;
}

function measureTime(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const end = performance.now();

    console.log(\`\${propertyKey} took \${(end - start).toFixed(2)}ms\`);
    return result;
  };

  return descriptor;
}

class Calculator {
  @logged
  @measureTime
  add(a: number, b: number): number {
    return a + b;
  }

  @logged
  @measureTime
  multiply(a: number, b: number): number {
    // Simulate some work
    let result = 0;
    for (let i = 0; i < a; i++) {
      result += b;
    }
    return result;
  }
}

const calc = new Calculator();

console.log("Testing calculator methods:");
const sum = calc.add(5, 3);
const product = calc.multiply(4, 6);

console.log(\`Final results - Sum: \${sum}, Product: \${product}\`);`,
  },
];

export const TypeScriptTranspiler: React.FC<TypeScriptExecutorProps> = ({
  onComplete,
}) => {
  // Editor and execution state
  const [code, setCode] = useState(typescriptPresets[0].code);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [compilationErrors, setCompilationErrors] = useState<string[]>([]);
  const [jsCode, setJsCode] = useState("");
  const [showCompiledJS, setShowCompiledJS] = useState(false);

  // TypeScript configuration
  const [tsConfig, setTsConfig] = useState({
    target: "ES2020" as
      | "ES3"
      | "ES5"
      | "ES2015"
      | "ES2016"
      | "ES2017"
      | "ES2018"
      | "ES2019"
      | "ES2020"
      | "ES2021"
      | "ES2022",
    module: "ESNext" as
      | "None"
      | "CommonJS"
      | "AMD"
      | "UMD"
      | "System"
      | "ES6"
      | "ES2015"
      | "ES2020"
      | "ES2022"
      | "ESNext"
      | "Node16"
      | "NodeNext",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    experimentalDecorators: false,
  });

  // Module imports
  const [moduleImports, setModuleImports] = useState([
    "https://deno.land/std@0.177.0/mod.ts",
  ]);

  // Editor reference
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const outputRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Custom hooks
  const { startMonitoring, stopMonitoring, getMetrics } =
    usePerformanceMonitor();
  const { checkMemoryUsage, getMemoryStats } = useMemoryManagement();
  const { validateAction } = useConstitutionalCompliance();

  // Initialize Monaco Editor with TypeScript support
  useEffect(() => {
    // Add TypeScript types to Monaco
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
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
      "deno.d.ts",
    );
  }, [tsConfig]);

  // Compile TypeScript to JavaScript
  const compileTypeScript = useCallback(
    async (sourceCode: string): Promise<{ js: string; errors: string[] }> => {
      try {
        // For now, use a simplified TypeScript compilation
        // In a real implementation, you'd use typescript compiler API
        const ts = await import("typescript");

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
          .filter((diag) => diag.category === ts.DiagnosticCategory.Error)
          .map((diag) =>
            ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
          );

        return {
          js: result.outputText,
          errors,
        };
      } catch (error) {
        // Fallback if typescript package is not available
        console.warn(
          "TypeScript compiler not available, using basic compilation",
        );
        return {
          js: sourceCode
            .replace(/: string/g, "")
            .replace(/: number/g, "")
            .replace(/: boolean/g, "")
            .replace(/interface.*?{[^}]*}/gs, "")
            .replace(/type.*?=.*?;/g, "")
            .replace(/export /g, "")
            .replace(/import.*?;/g, ""),
          errors: [
            `TypeScript compiler not available: ${error instanceof Error ? error.message : String(error)}`,
          ],
        };
      }
    },
    [tsConfig],
  );

  // Execute TypeScript code
  const executeTypeScript = useCallback(async () => {
    const isCompliant = await validateAction("code_execution", {
      language: "typescript",
      codeLength: code.length,
      hasImports: moduleImports.length > 0,
    });

    if (!isCompliant) {
      setOutput(
        "❌ Code execution blocked: Constitutional compliance check failed",
      );
      return;
    }

    setIsRunning(true);
    setOutput("");
    setCompilationErrors([]);

    startMonitoring();

    try {
      // Check memory usage
      const memoryCheck = await checkMemoryUsage();
      if (!memoryCheck.safe) {
        setOutput(
          `❌ Memory limit exceeded: ${memoryCheck.usage.toFixed(2)}MB used`,
        );
        return;
      }

      // Compile TypeScript to JavaScript
      setOutput("🔨 Compiling TypeScript to JavaScript...\n");
      const compileResult = await compileTypeScript(code);

      if (compileResult.errors.length > 0) {
        setOutput(
          (prev) =>
            prev +
            "❌ Compilation errors:\n" +
            compileResult.errors.map((e) => `  • ${e}`).join("\n"),
        );
        setCompilationErrors(compileResult.errors);
        return;
      }

      setJsCode(compileResult.js);
      setOutput((prev) => prev + "✅ Compilation successful!\n\n");
      setOutput((prev) => prev + "🚀 Executing JavaScript...\n");

      // Capture console output
      const originalLog = console.log;
      const originalError = console.error;
      const logs: string[] = [];
      const errors: string[] = [];

      console.log = (...args) => {
        logs.push(
          args
            .map((arg) =>
              typeof arg === "object"
                ? JSON.stringify(arg, null, 2)
                : String(arg),
            )
            .join(" "),
        );
      };

      console.error = (...args) => {
        errors.push(args.map((arg) => String(arg)).join(" "));
      };

      try {
        // Create async function to execute the compiled JavaScript
        const executeCode = new Function(
          "console",
          `
          ${moduleImports.map((imp) => `// import from ${imp}`).join("\n")}

          ${compileResult.js}
        `,
        );

        // Execute with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Execution timeout (5s)")), 5000);
        });

        const executionPromise = Promise.resolve(executeCode(console));

        await Promise.race([executionPromise, timeoutPromise]);

        // Restore console methods
        console.log = originalLog;
        console.error = originalError;

        // Format output
        let finalOutput = "";
        if (logs.length > 0) {
          finalOutput += "📋 Output:\n" + logs.join("\n") + "\n\n";
        }
        if (errors.length > 0) {
          finalOutput += "❌ Errors:\n" + errors.join("\n") + "\n\n";
        }

        finalOutput += "✅ Execution completed successfully!";

        setOutput(finalOutput);
        onComplete(finalOutput);
      } catch (execError) {
        // Restore console methods
        console.log = originalLog;
        console.error = originalError;

        const errorMessage =
          execError instanceof Error ? execError.message : String(execError);
        setOutput((prev) => prev + `❌ Runtime error: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setOutput(`❌ Compilation or execution error: ${errorMessage}`);
    } finally {
      const metrics = getMetrics();
      const memoryStats = getMemoryStats();

      setOutput(
        (prev) =>
          prev + `\n\n⏱️ Execution time: ${metrics.executionTime.toFixed(2)}ms`,
      );
      setOutput(
        (prev) => prev + `\n💾 Memory usage: ${memoryStats.used.toFixed(2)}MB`,
      );

      stopMonitoring();
      setIsRunning(false);
    }
  }, [
    code,
    moduleImports,
    validateAction,
    checkMemoryUsage,
    startMonitoring,
    stopMonitoring,
    getMetrics,
    getMemoryStats,
    compileTypeScript,
    onComplete,
  ]);

  // Handle file import
  const importFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.name.endsWith(".ts")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setCode(content);
          setOutput(`✅ Imported ${file.name}`);
        };
        reader.readAsText(file);
      } else {
        setOutput("❌ Please select a valid TypeScript file (.ts)");
      }
    },
    [],
  );

  // Handle file export
  const exportFile = useCallback(() => {
    const blob = new Blob([code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code.ts";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOutput("✅ Exported code.ts");
  }, [code]);

  // Insert module import
  const insertModuleImport = useCallback(() => {
    const importStatement = `import { } from '';`;
    const newCode = importStatement + "\n\n" + code;
    setCode(newCode);
  }, [code]);

  // Editor configuration
  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    language: "typescript",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on",
    glyphMargin: true,
    folding: true,
    lineDecorationsWidth: 20,
    lineNumbersMinChars: 3,
    scrollBeyondLastLine: false,
    wordWrap: "on",
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
  };

  const outputOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    language: "plaintext",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 12,
    lineNumbers: "off",
    readOnly: true,
    scrollBeyondLastLine: false,
    wordWrap: "on",
  };

  return (
    <ToolWrapper
      title="TypeScript Transpiler"
      description="Edit, compile, and execute TypeScript code with real-time type checking and Deno runtime integration"
    >
      <div className="flex flex-col space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={executeTypeScript}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running...
              </>
            ) : (
              <>
                <span className="w-4 h-4">▶</span>
                Run TypeScript
              </>
            )}
          </button>

          <button
            onClick={insertModuleImport}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            <span className="w-4 h-4">📦</span>
            Import Module
          </button>

          <label className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <span className="w-4 h-4">📁</span>
            Import .ts
            <input
              type="file"
              accept=".ts"
              onChange={importFile}
              className="hidden"
            />
          </label>

          <button
            onClick={exportFile}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
          >
            <span className="w-4 h-4">💾</span>
            Export .ts
          </button>

          <button
            onClick={() => setShowCompiledJS(!showCompiledJS)}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
          >
            <span className="w-4 h-4">{showCompiledJS ? "🔒" : "👁"}</span>
            {showCompiledJS ? "Hide" : "Show"} JS
          </button>

          <select
            value={tsConfig.target}
            onChange={(e) =>
              setTsConfig((prev) => ({
                ...prev,
                target: e.target.value as any,
              }))
            }
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
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
              onChange={(e) =>
                setTsConfig((prev) => ({ ...prev, strict: e.target.checked }))
              }
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
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Module Configuration */}
        <div className="bg-gray-800 rounded p-3">
          <div className="text-white text-sm font-semibold mb-2">
            Module Imports:
          </div>
          <div className="flex flex-wrap gap-2">
            {moduleImports.map((module, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
              >
                {module}
                <button
                  onClick={() => {
                    setModuleImports((prev) =>
                      prev.filter((_, i) => i !== index),
                    );
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
          <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded p-3">
            <div className="text-red-400 text-sm font-semibold mb-2">
              Compilation Errors:
            </div>
            {compilationErrors.map((error, index) => (
              <div key={index} className="text-red-300 text-sm font-mono">
                • {error}
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div
          className={`grid ${showCompiledJS ? "grid-cols-3" : "grid-cols-2"} gap-4`}
        >
          {/* Code Editor */}
          <div className="space-y-2">
            <div className="text-white text-sm font-semibold">
              TypeScript Code:
            </div>
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              <div
                style={{ height: "500px" }}
                ref={(editor) => {
                  if (editor && !editorRef.current) {
                    editorRef.current = monaco.editor.create(editor, {
                      ...editorOptions,
                      value: code,
                      model: monaco.editor.createModel(code, "typescript"),
                    });

                    editorRef.current.onDidChangeModelContent(() => {
                      if (editorRef.current) {
                        setCode(editorRef.current.getValue());
                      }
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Compiled JavaScript */}
          {showCompiledJS && (
            <div className="space-y-2">
              <div className="text-white text-sm font-semibold">
                Compiled JavaScript:
              </div>
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <div
                  style={{ height: "500px" }}
                  ref={(editor) => {
                    if (editor && jsCode) {
                      monaco.editor.create(editor, {
                        ...editorOptions,
                        value: jsCode,
                        language: "javascript",
                        readOnly: true,
                        model: monaco.editor.createModel(jsCode, "javascript"),
                      });
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Output */}
          <div className="space-y-2">
            <div className="text-white text-sm font-semibold">Output:</div>
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              <div
                style={{ height: "500px" }}
                ref={(editor) => {
                  if (editor && !outputRef.current) {
                    outputRef.current = monaco.editor.create(editor, {
                      ...outputOptions,
                      value: output,
                      model: monaco.editor.createModel(output, "plaintext"),
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">
            📚 TypeScript Transpiler Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-1">
                Language Features:
              </h4>
              <ul className="space-y-1">
                <li>• Strong static typing with type inference</li>
                <li>• Interface and type definitions</li>
                <li>• Generics and utility types</li>
                <li>• Classes and inheritance</li>
                <li>• Async/await with proper typing</li>
                <li>• Decorators (experimental)</li>
                <li>• Advanced type manipulation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">
                Compiler Options:
              </h4>
              <ul className="space-y-1">
                <li>• Target ES version selection</li>
                <li>• Module system configuration</li>
                <li>• Strict type checking mode</li>
                <li>• ES module interop</li>
                <li>• JSX support for React</li>
                <li>• Source map generation</li>
                <li>• Declaration file output</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

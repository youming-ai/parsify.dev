/**
 * C/C++ WASM Runtime using Emscripten
 * Provides C++17 compilation and execution with standard library support
 */

export interface CppCompilerFlags {
  optimization?: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz';
  stdVersion?: 'c++11' | 'c++14' | 'c++17' | 'c++20' | 'c++23';
  warnings?: 'all' | 'extra' | 'pedantic' | 'minimal';
  debug?: boolean;
  staticLink?: boolean;
  memoryInit?: number; // Initial memory in bytes
}

export interface CppExecutionOptions {
  code: string;
  input?: string; // stdin input
  compilerFlags?: CppCompilerFlags;
  libraries?: string[]; // Additional libraries to link
  timeoutMs?: number;
  memoryLimitMB?: number;
  enableOutput?: boolean;
  captureErrors?: boolean;
}

export interface CppExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  compilationTime: number;
  compiledSize: number; // Size of compiled WASM module in bytes
  error?: Error;
  warnings?: string[];
  compilationOutput?: string;
}

export interface CppLibrary {
  name: string;
  version?: string;
  headers?: string[];
  linkFlags?: string[];
}

export class CppRuntime {
  private emscripten: any = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private compilationCache = new Map<string, WebAssembly.Module>();
  private defaultLibraries: CppLibrary[] = [
    {
      name: 'std',
      version: '17',
      headers: ['iostream', 'vector', 'string', 'algorithm', 'map'],
    },
  ];

  /**
   * Initialize C++ runtime with Emscripten
   */
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
      // Load Emscripten compiler environment
      // Note: This is a simplified version - in production, you would use
      // a pre-built Emscripten CDN or self-hosted compiler

      // For now, we'll simulate the Emscripten environment
      // In a real implementation, you would load the actual Emscripten toolchain

      this.emscripten = {
        // Mock Emscripten API - replace with actual implementation
        compile: async (_code: string, _flags: any) => {
          // This would compile C++ to WASM using Emscripten
          // For now, return a mock compiled module
          return {
            module: null, // WebAssembly.Module
            output: 'Compilation output',
            errors: [],
            warnings: [],
          };
        },
        run: async (_module: any, _input: string) => {
          // This would run the compiled WASM module
          return {
            stdout: 'Hello, World!\\n',
            stderr: '',
            exitCode: 0,
          };
        },
      };

      this.isInitialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      throw new Error(`Failed to initialize C++ runtime: ${message}`);
    }
  }

  /**
   * Compile C++ code to WASM
   */
  async compileCode(
    code: string,
    flags: CppCompilerFlags = {}
  ): Promise<{
    module: WebAssembly.Module;
    output: string;
    errors: string[];
    warnings: string[];
    compiledSize: number;
  }> {
    await this.initialize();

    if (!this.emscripten) {
      throw new Error('C++ runtime not initialized');
    }

    // Create compilation key for caching
    const compilationKey = this._createCompilationKey(code, flags);

    // Check cache first
    if (this.compilationCache.has(compilationKey)) {
      return {
        module: this.compilationCache.get(compilationKey)!,
        output: 'Using cached compilation',
        errors: [],
        warnings: [],
        compiledSize: 0,
      };
    }

    const startTime = performance.now();

    try {
      // Prepare compiler flags
      const compilerFlags = this._prepareCompilerFlags(flags);

      // Add standard libraries
      let fullCode = code;
      if (flags.staticLink !== false) {
        fullCode = this._addStandardIncludes(code);
      }

      // Compile using Emscripten
      const result = await this.emscripten.compile(fullCode, compilerFlags);

      const _compilationTime = performance.now() - startTime;

      if (result.errors.length > 0) {
        throw new Error(`Compilation failed: ${result.errors.join('\\n')}`);
      }

      // Cache the compiled module
      if (result.module) {
        this.compilationCache.set(compilationKey, result.module);
      }

      return {
        module: result.module,
        output: result.output,
        errors: result.errors,
        warnings: result.warnings,
        compiledSize: result.compiledSize || 0,
      };
    } catch (error) {
      const compilationTime = performance.now() - startTime;
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      throw new Error(`C++ compilation failed (${compilationTime.toFixed(2)}ms): ${message}`);
    }
  }

  /**
   * Execute C++ code with options
   */
  async executeCode(options: CppExecutionOptions): Promise<CppExecutionResult> {
    await this.initialize();

    if (!this.emscripten) {
      throw new Error('C++ runtime not initialized');
    }

    const {
      code,
      input = '',
      compilerFlags = {},
      libraries = [],
      timeoutMs = 10000,
      memoryLimitMB = 256,
      enableOutput = true,
      captureErrors = true,
    } = options;

    const startTime = performance.now();
    let compilationTime = 0;
    let compiledSize = 0;

    try {
      // First, compile the code
      const compilationStart = performance.now();
      const compileResult = await this.compileCode(code, compilerFlags);
      compilationTime = performance.now() - compilationStart;
      compiledSize = compileResult.compiledSize;

      // Set up execution timeout
      const timeoutId = setTimeout(() => {
        throw new Error('C++ execution timeout');
      }, timeoutMs);

      try {
        // Execute the compiled code
        const executionStart = performance.now();
        const runResult = await this.emscripten.run(compileResult.module, input);
        const executionTime = performance.now() - executionStart;

        clearTimeout(timeoutId);

        const _totalTime = performance.now() - startTime;

        return {
          stdout: runResult.stdout || '',
          stderr: runResult.stderr || '',
          exitCode: runResult.exitCode || 0,
          executionTime: executionTime,
          memoryUsed: this._estimateMemoryUsage(),
          compilationTime,
          compiledSize,
          compilationOutput: compileResult.output,
          warnings: compileResult.warnings,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        const executionTime = performance.now() - startTime;

        return {
          stdout: '',
          stderr: error instanceof Error ? error.message : String(error),
          exitCode: 1,
          executionTime,
          memoryUsed: this._estimateMemoryUsage(),
          compilationTime,
          compiledSize,
          compilationOutput: compileResult.output,
          error: error instanceof Error ? error : new Error(String(error)),
          warnings: compileResult.warnings,
        };
      }
    } catch (error) {
      const totalTime = performance.now() - startTime;

      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        executionTime: totalTime,
        memoryUsed: this._estimateMemoryUsage(),
        compilationTime,
        compiledSize,
        compilationOutput: '',
        error: error instanceof Error ? error : new Error(String(error)),
        warnings: [],
      };
    }
  }

  /**
   * Get available libraries
   */
  getAvailableLibraries(): CppLibrary[] {
    return this.defaultLibraries;
  }

  /**
   * Get code templates
   */
  getCodeTemplates(): Record<string, string> {
    return {
      'Hello World': `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
      'Vector Operations': `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9, 3};

    std::cout << "Original: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    std::sort(numbers.begin(), numbers.end());

    std::cout << "Sorted: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}`,
      'String Processing': `#include <iostream>
#include <string>
#include <algorithm>

int main() {
    std::string text = "Hello, C++ Programming!";

    std::cout << "Original: " << text << std::endl;
    std::cout << "Length: " << text.length() << std::endl;

    // Convert to uppercase
    std::transform(text.begin(), text.end(), text.begin(), ::toupper);
    std::cout << "Uppercase: " << text << std::endl;

    return 0;
}`,
      'Class Example': `#include <iostream>
#include <string>
#include <vector>

class Student {
private:
    std::string name;
    int age;
    double gpa;

public:
    Student(std::string n, int a, double g) : name(n), age(a), gpa(g) {}

    void display() const {
        std::cout << "Name: " << name << ", Age: " << age
                  << ", GPA: " << gpa << std::endl;
    }

    double getGPA() const { return gpa; }
};

int main() {
    std::vector<Student> students = {
        Student("Alice", 20, 3.8),
        Student("Bob", 21, 3.5),
        Student("Charlie", 19, 3.9)
    };

    for (const auto& student : students) {
        student.display();
    }

    return 0;
}`,
    };
  }

  /**
   * Interrupt execution
   */
  interrupt(): void {
    // Emscripten interruption would be implemented here
    console.log('Interrupting C++ execution');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.compilationCache.clear();
    this.emscripten = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Get runtime status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      version: '17',
      compiler: 'Emscripten',
      memoryUsage: this._estimateMemoryUsage(),
      cacheSize: this.compilationCache.size,
      availableLibraries: this.defaultLibraries.length,
    };
  }

  private _prepareCompilerFlags(flags: CppCompilerFlags): string[] {
    const compilerFlags: string[] = [];

    // Optimization level
    if (flags.optimization) {
      compilerFlags.push(`-${flags.optimization}`);
    }

    // C++ standard
    if (flags.stdVersion) {
      compilerFlags.push(`--std=${flags.stdVersion}`);
    }

    // Warning levels
    if (flags.warnings) {
      switch (flags.warnings) {
        case 'all':
          compilerFlags.push('-Wall', '-Wextra');
          break;
        case 'extra':
          compilerFlags.push('-Wall', '-Wextra', '-Wpedantic');
          break;
        case 'pedantic':
          compilerFlags.push('-Wall', '-Wextra', '-Wpedantic', '-Werror');
          break;
      }
    }

    // Debug symbols
    if (flags.debug) {
      compilerFlags.push('-g', '-DDEBUG');
    }

    // Memory initialization
    if (flags.memoryInit) {
      compilerFlags.push(`--initial-memory=${flags.memoryInit}`);
    }

    // Default flags for WASM compilation
    compilerFlags.push(
      '--bind',
      '--shell-file=/dev/null', // Suppress HTML shell
      '-s',
      'WASM=1',
      '-s',
      'ALLOW_MEMORY_GROWTH=1',
      '-s',
      'EXIT_RUNTIME=1',
      '-s',
      'MODULARIZE=1',
      '-s',
      "EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap']",
      '-s',
      "EXPORTED_FUNCTIONS=['_main', '_malloc', '_free']",
      '-s',
      'NO_EXIT_RUNTIME=0'
    );

    return compilerFlags;
  }

  private _addStandardIncludes(code: string): string {
    const includes = [
      '#include <iostream>',
      '#include <string>',
      '#include <vector>',
      '#include <algorithm>',
      '#include <map>',
    ];

    // Check which includes are already present
    const hasIncludes = includes.some((include) => code.includes(include));

    if (!hasIncludes) {
      return `${includes.join('\\n')}\\n\\n${code}`;
    }

    return code;
  }

  private _createCompilationKey(code: string, flags: CppCompilerFlags): string {
    return `${code.substring(0, 100)}_${JSON.stringify(flags)}`;
  }

  private _estimateMemoryUsage(): number {
    // Estimate memory usage - this is a placeholder
    // In a real implementation, you would track actual WASM memory usage
    return 64 * 1024 * 1024; // 64MB estimate
  }
}

// Export singleton instance
export const cppRuntime = new CppRuntime();

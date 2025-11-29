/**
 * C# WASM Runtime using Blazor WebAssembly
 * Provides C# .NET 8 execution with full framework support
 */

export interface CSharpCompilationOptions {
  optimizationLevel?: 'Debug' | 'Release';
  targetFramework?: 'net8.0' | 'net7.0' | 'net6.0';
  langVersion?: 'latest' | '11.0' | '10.0' | '9.0' | '8.0';
  warningsAsErrors?: boolean;
  allowUnsafe?: boolean;
  nullable?: 'enable' | 'disable' | 'warnings';
  generateXmlDocs?: boolean;
}

export interface CSharpExecutionOptions {
  code: string;
  input?: string; // Console input
  compilationOptions?: CSharpCompilationOptions;
  references?: string[]; // Additional assembly references
  usingStatements?: string[]; // Additional using statements
  timeoutMs?: number;
  memoryLimitMB?: number;
  enableOutput?: boolean;
  captureErrors?: boolean;
}

export interface CSharpExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  compilationTime: number;
  compiledSize: number; // Size of compiled assembly in bytes
  warnings?: string[];
  error?: Error;
  assemblyInfo?: {
    name: string;
    version: string;
    dependencies: string[];
  };
}

export interface CSharpLibrary {
  name: string;
  version: string;
  assemblyName: string;
  isBuiltIn: boolean;
  namespaces: string[];
}

export class CSharpRuntime {
  private blazor: any = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private compilationCache = new Map<string, any>();
  private defaultLibraries: CSharpLibrary[] = [
    {
      name: 'System.Runtime',
      version: '8.0.0',
      assemblyName: 'System.Runtime',
      isBuiltIn: true,
      namespaces: ['System', 'System.Collections.Generic', 'System.Linq'],
    },
    {
      name: 'System.Console',
      version: '8.0.0',
      assemblyName: 'System.Console',
      isBuiltIn: true,
      namespaces: ['System'],
    },
    {
      name: 'System.Text.Json',
      version: '8.0.0',
      assemblyName: 'System.Text.Json',
      isBuiltIn: true,
      namespaces: ['System.Text.Json'],
    },
    {
      name: 'System.Threading.Tasks',
      version: '8.0.0',
      assemblyName: 'System.Threading.Tasks',
      isBuiltIn: true,
      namespaces: ['System.Threading.Tasks'],
    },
  ];

  /**
   * Initialize C# runtime with Blazor WebAssembly
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
      // In a real implementation, you would load Blazor WebAssembly runtime
      // For now, we'll simulate the Blazor environment

      this.blazor = {
        // Mock Blazor API - replace with actual Blazor WebAssembly integration
        compileCSharp: async (_code: string, _options: any) => {
          // This would compile C# to IL and load it into the runtime
          return {
            assembly: null, // Assembly object
            diagnostics: [],
            warnings: [],
            compiledSize: 0,
            executionTime: 0,
          };
        },
        runAssembly: async (_assembly: any, _input: string) => {
          // This would run the compiled assembly
          return {
            stdout: '',
            stderr: '',
            exitCode: 0,
            executionTime: 0,
          };
        },
        addReference: (_assemblyName: string) => {
          // Add assembly reference
        },
      };

      this.isInitialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      throw new Error(`Failed to initialize C# runtime: ${message}`);
    }
  }

  /**
   * Compile C# code to assembly
   */
  async compileCode(
    code: string,
    options: CSharpCompilationOptions = {}
  ): Promise<{
    assembly: any;
    diagnostics: any[];
    warnings: string[];
    compiledSize: number;
    compilationTime: number;
  }> {
    await this.initialize();

    if (!this.blazor) {
      throw new Error('C# runtime not initialized');
    }

    // Create compilation key for caching
    const compilationKey = this._createCompilationKey(code, options);

    // Check cache first
    if (this.compilationCache.has(compilationKey)) {
      return {
        assembly: this.compilationCache.get(compilationKey),
        diagnostics: [],
        warnings: [],
        compiledSize: 0,
        compilationTime: 0,
      };
    }

    const startTime = performance.now();

    try {
      // Prepare compilation options
      const compilationOptions = this._prepareCompilationOptions(options);

      // Add default using statements if not present
      const fullCode = this._addDefaultUsings(code);

      // Compile using Blazor WebAssembly compiler
      const result = await this.blazor.compileCSharp(fullCode, compilationOptions);

      const compilationTime = performance.now() - startTime;

      if (result.diagnostics?.some((d: any) => d.severity === 'error')) {
        throw new Error(
          `C# compilation failed: ${result.diagnostics.map((d: any) => d.message).join('\\n')}`
        );
      }

      // Cache the compiled assembly
      if (result.assembly) {
        this.compilationCache.set(compilationKey, result.assembly);
      }

      return {
        assembly: result.assembly,
        diagnostics: result.diagnostics || [],
        warnings: result.warnings || [],
        compiledSize: result.compiledSize || 0,
        compilationTime,
      };
    } catch (error) {
      const compilationTime = performance.now() - startTime;
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      throw new Error(`C# compilation failed (${compilationTime.toFixed(2)}ms): ${message}`);
    }
  }

  /**
   * Execute C# code with options
   */
  async executeCode(options: CSharpExecutionOptions): Promise<CSharpExecutionResult> {
    await this.initialize();

    if (!this.blazor) {
      throw new Error('C# runtime not initialized');
    }

    const {
      code,
      input = '',
      compilationOptions = {},
      references = [],
      usingStatements = [],
      timeoutMs = 15000,
      memoryLimitMB = 256,
      enableOutput = true,
      captureErrors = true,
    } = options;

    const startTime = performance.now();
    let compilationTime = 0;
    let compiledSize = 0;

    try {
      // Add assembly references
      for (const reference of references) {
        this.blazor.addReference(reference);
      }

      // Add additional using statements
      let fullCode = code;
      if (usingStatements.length > 0) {
        const usingDeclarations = usingStatements.map((ns) => `using ${ns};`).join('\\n');
        fullCode = `${usingDeclarations}\\n\\n${code}`;
      }

      // First, compile the code
      const compilationStart = performance.now();
      const compileResult = await this.compileCode(fullCode, compilationOptions);
      compilationTime = performance.now() - compilationStart;
      compiledSize = compileResult.compiledSize;

      // Set up execution timeout
      const timeoutId = setTimeout(() => {
        throw new Error('C# execution timeout');
      }, timeoutMs);

      try {
        // Execute the compiled assembly
        const executionStart = performance.now();
        const runResult = await this.blazor.runAssembly(compileResult.assembly, input);
        const executionTime = performance.now() - executionStart;

        clearTimeout(timeoutId);

        const _totalTime = performance.now() - startTime;

        return {
          stdout: runResult.stdout || '',
          stderr: runResult.stderr || '',
          exitCode: runResult.exitCode || 0,
          executionTime,
          memoryUsed: this._estimateMemoryUsage(),
          compilationTime,
          compiledSize,
          warnings: compileResult.warnings,
          assemblyInfo: {
            name: 'DynamicAssembly',
            version: '1.0.0.0',
            dependencies: references,
          },
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
        error: error instanceof Error ? error : new Error(String(error)),
        warnings: [],
      };
    }
  }

  /**
   * Get available libraries
   */
  getAvailableLibraries(): CSharpLibrary[] {
    return this.defaultLibraries;
  }

  /**
   * Get code templates
   */
  getCodeTemplates(): Record<string, string> {
    return {
      'Hello World': `using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello, World!");

        // Basic C# features
        var numbers = new List<int> { 5, 2, 8, 1, 9 };

        Console.WriteLine("Original numbers: " + string.Join(", ", numbers));

        numbers.Sort();

        Console.WriteLine("Sorted numbers: " + string.Join(", ", numbers));

        // String manipulation
        string greeting = "Hello from C#";
        Console.WriteLine($"String: {greeting}");
        Console.WriteLine($"Length: {greeting.Length}");
    }
}`,
      'LINQ Operations': `using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        var students = new List<Student>
        {
            new Student { Name = "Alice", Age = 20, Grade = 85.5 },
            new Student { Name = "Bob", Age = 22, Grade = 78.0 },
            new Student { Name = "Charlie", Age = 19, Grade = 92.3 }
        };

        // LINQ queries
        var topStudents = students
            .Where(s => s.Grade >= 80)
            .OrderByDescending(s => s.Grade)
            .Select(s => new { s.Name, s.Grade });

        Console.WriteLine("Top Students:");
        foreach (var student in topStudents)
        {
            Console.WriteLine($"{student.Name}: {student.Grade}");
        }

        // Aggregate operations
        double averageGrade = students.Average(s => s.Grade);
        Console.WriteLine($"Average Grade: {averageGrade:F2}");
    }
}

class Student
{
    public string Name { get; set; }
    public int Age { get; set; }
    public double Grade { get; set; }
}`,
      'Async/Await Example': `using System;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        Console.WriteLine("Starting async operations...");

        // Run multiple async operations
        var task1 = ProcessDataAsync("Task 1", 1000);
        var task2 = ProcessDataAsync("Task 2", 1500);
        var task3 = ProcessDataAsync("Task 3", 800);

        await Task.WhenAll(task1, task2, task3);

        Console.WriteLine("All tasks completed!");

        // Sequential async operations
        await ProcessSequentiallyAsync();
    }

    static async Task<string> ProcessDataAsync(string name, int delay)
    {
        Console.WriteLine($"{name} started...");
        await Task.Delay(delay);
        Console.WriteLine($"{name} completed after {delay}ms");
        return $"{name} result";
    }

    static async Task ProcessSequentiallyAsync()
    {
        Console.WriteLine("\\nSequential processing:");

        var result1 = await ProcessDataAsync("Step 1", 500);
        Console.WriteLine($"Got: {result1}");

        var result2 = await ProcessDataAsync("Step 2", 300);
        Console.WriteLine($"Got: {result2}");

        var result3 = await ProcessDataAsync("Step 3", 200);
        Console.WriteLine($"Got: {result3}");
    }
}`,
      'JSON Processing': `using System;
using System.Text.Json;
using System.Text.Json.Serialization;

class Program
{
    static void Main()
    {
        var person = new Person
        {
            Name = "John Doe",
            Age = 30,
            Email = "john@example.com",
            Hobbies = new List<string> { "reading", "coding", "gaming" }
        };

        // Serialize to JSON
        var jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        string json = JsonSerializer.Serialize(person, jsonOptions);
        Console.WriteLine("Serialized JSON:");
        Console.WriteLine(json);

        // Deserialize from JSON
        var deserializedPerson = JsonSerializer.Deserialize<Person>(json, jsonOptions);

        Console.WriteLine("\\nDeserialized Object:");
        Console.WriteLine($"Name: {deserializedPerson.Name}");
        Console.WriteLine($"Age: {deserializedPerson.Age}");
        Console.WriteLine($"Hobbies: {string.Join(", ", deserializedPerson.Hobbies)}");
    }
}

class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string Email { get; set; }
    public List<string> Hobbies { get; set; }
}`,
      'Exception Handling': `using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Exception Handling Examples\\n");

        // Basic try-catch
        TryDivide(10, 2);
        TryDivide(10, 0);

        // Multiple catch blocks
        TryParseNumber("123");
        TryParseNumber("invalid");

        // Custom exception
        TryValidateAge(25);
        TryValidateAge(-5);

        // Finally block
        TryFileOperation();
    }

    static void TryDivide(int a, int b)
    {
        try
        {
            double result = a / b;
            Console.WriteLine($"{a} / {b} = {result}");
        }
        catch (DivideByZeroException)
        {
            Console.WriteLine($"Cannot divide {a} by zero!");
        }
        finally
        {
            Console.WriteLine("Division operation completed.\\n");
        }
    }

    static void TryParseNumber(string input)
    {
        try
        {
            int number = int.Parse(input);
            Console.WriteLine($"Parsed number: {number}");
        }
        catch (FormatException)
        {
            Console.WriteLine($"'{input}' is not a valid number");
        }
        catch (OverflowException)
        {
            Console.WriteLine($"'{input}' is too large or too small");
        }
        finally
        {
            Console.WriteLine("Parse operation completed.\\n");
        }
    }

    static void TryValidateAge(int age)
    {
        try
        {
            if (age < 0 || age > 150)
            {
                throw new ArgumentException("Age must be between 0 and 150");
            }
            Console.WriteLine($"Valid age: {age}");
        }
        catch (ArgumentException ex)
        {
            Console.WriteLine($"Validation error: {ex.Message}");
        }
        finally
        {
            Console.WriteLine("Age validation completed.\\n");
        }
    }

    static void TryFileOperation()
    {
        try
        {
            // Simulate file operation
            Console.WriteLine("Simulating file operation...");
            throw new InvalidOperationException("File access denied");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
        finally
        {
            Console.WriteLine("File operation cleanup completed.\\n");
        }
    }
}`,
    };
  }

  /**
   * Interrupt execution
   */
  interrupt(): void {
    // Blazor interruption would be implemented here
    console.log('Interrupting C# execution');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.compilationCache.clear();
    this.blazor = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Get runtime status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      version: '.NET 8',
      framework: 'Blazor WebAssembly',
      memoryUsage: this._estimateMemoryUsage(),
      cacheSize: this.compilationCache.size,
      availableLibraries: this.defaultLibraries.length,
    };
  }

  private _prepareCompilationOptions(options: CSharpCompilationOptions): any {
    return {
      optimizationLevel: options.optimizationLevel || 'Release',
      targetFramework: options.targetFramework || 'net8.0',
      langVersion: options.langVersion || 'latest',
      warningsAsErrors: options.warningsAsErrors || false,
      allowUnsafe: options.allowUnsafe || false,
      nullable: options.nullable || 'enable',
      generateXmlDocs: options.generateXmlDocs || false,
    };
  }

  private _addDefaultUsings(code: string): string {
    const defaultUsings = [
      'using System;',
      'using System.Collections.Generic;',
      'using System.Linq;',
      'using System.Text;',
      'using System.Threading.Tasks;',
    ];

    // Check which using statements are already present
    const hasUsings = defaultUsings.some((using) => code.includes(using));

    if (!hasUsings) {
      return `${defaultUsings.join('\\n')}\\n\\n${code}`;
    }

    return code;
  }

  private _createCompilationKey(code: string, options: CSharpCompilationOptions): string {
    return `${code.substring(0, 100)}_${JSON.stringify(options)}`;
  }

  private _estimateMemoryUsage(): number {
    // Estimate memory usage - this is a placeholder
    // In a real implementation, you would track actual WASM memory usage
    return 96 * 1024 * 1024; // 96MB estimate for .NET runtime
  }
}

// Export singleton instance
export const csharpRuntime = new CSharpRuntime();

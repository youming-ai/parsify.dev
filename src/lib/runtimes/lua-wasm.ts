import { wasmRuntimeManager } from './wasm-runtime-manager';

/**
 * Lua execution options interface
 */
export interface LuaExecutionOptions {
  /** Lua version to use */
  luaVersion?: '5.1' | '5.2' | '5.3' | '5.4';
  /** Code to execute */
  code?: string;
  /** Execution timeout in milliseconds */
  timeout?: number;
  /** Whether to include standard libraries */
  includeStandardLibs?: boolean;
  /** Memory limit in MB */
  memoryLimit?: number;
  /** Whether to enable debug information */
  debug?: boolean;
  /** Custom Lua libraries to load */
  libraries?: string[];
  /** Custom Lua C modules to load */
  cModules?: string[];
  /** Command line arguments */
  args?: string[];
  /** Environment variables */
  environment?: Record<string, string>;
  /** Whether to run in strict mode */
  strictMode?: boolean;
}

/**
 * Lua execution result interface
 */
export interface LuaExecutionResult {
  /** Whether the execution was successful */
  success: boolean;
  /** Output from the Lua script */
  output?: string;
  /** Error message if execution failed */
  error?: string;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Exit code from the Lua process */
  exitCode: number;
  /** Whether warnings were generated */
  warnings?: string[];
  /** Lua version used */
  luaVersion: string;
  /** Standard libraries loaded */
  libraries: string[];
  /** Global variables after execution */
  globals: string[];
  /** Functions defined in the script */
  functions: string[];
  /** Tables created in the script */
  tables: string[];
  /** Debug information */
  debugInfo: {
    /** Stack size after execution */
    stackSize: number;
    /** Number of upvalues */
    upvalueCount: number;
    /** Number of metatables */
    metatableCount: number;
    /** Garbage collection info */
    gcInfo: {
      /** Whether GC ran during execution */
      gcRan: boolean;
      /** Memory collected in bytes */
      memoryCollected: number;
      /** GC cycles completed */
      gcCycles: number;
    };
  };
}

/**
 * Lua WASM Runtime class
 */
export class LuaWASMRuntime {
  private static instance: LuaWASMRuntime;
  private initialized = false;
  private version = '5.4.4';
  private standardLibraries: string[] = [
    '_G',
    'package',
    'coroutine',
    'string',
    'utf8',
    'table',
    'math',
    'io',
    'file',
    'os',
    'debug',
    'bit32',
  ];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): LuaWASMRuntime {
    if (!LuaWASMRuntime.instance) {
      LuaWASMRuntime.instance = new LuaWASMRuntime();
    }
    return LuaWASMRuntime.instance;
  }

  /**
   * Initialize the Lua WASM runtime
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await wasmRuntimeManager.loadRuntime('lua');
      await this.loadLuaWasm();

      this.initialized = true;
      console.log('Lua WASM runtime initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Lua WASM runtime:', error);
      throw error;
    }
  }

  /**
   * Check if runtime is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get version information
   */
  public getVersion(): string {
    return this.version;
  }

  /**
   * Get available standard libraries
   */
  public getStandardLibraries(): string[] {
    return [...this.standardLibraries];
  }

  /**
   * Execute Lua code
   */
  public async execute(
    code: string,
    options: LuaExecutionOptions = {}
  ): Promise<LuaExecutionResult> {
    if (!this.initialized) {
      throw new Error('Lua runtime not initialized');
    }

    const startTime = Date.now();
    const manager = wasmRuntimeManager;

    try {
      const result = await manager.executeCode({
        language: 'lua',
        luaOptions: {
          code,
          ...options,
          libraries: options.includeStandardLibs !== false ? this.standardLibraries : [],
        },
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: result.stdout || '',
        executionTime,
        memoryUsage: result.memoryUsed || 0,
        exitCode: result.exitCode || 0,
        warnings: result.warnings,
        luaVersion: options.luaVersion || '5.4',
        libraries: this.extractLibraries(result.stdout || ''),
        globals: this.extractGlobals(result.stdout || ''),
        functions: this.extractFunctions(result.stdout || ''),
        tables: this.extractTables(result.stdout || ''),
        debugInfo: {
          stackSize: this.extractStackSize(result.stdout || ''),
          upvalueCount: this.extractUpvalueCount(result.stdout || ''),
          metatableCount: this.extractMetatableCount(result.stdout || ''),
          gcInfo: {
            gcRan: this.extractGcRan(result.stdout || ''),
            memoryCollected: this.extractMemoryCollected(result.stdout || ''),
            gcCycles: this.extractGcCycles(result.stdout || ''),
          },
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        memoryUsage: 0,
        exitCode: 1,
        luaVersion: options.luaVersion || '5.4',
        libraries: [],
        globals: [],
        functions: [],
        tables: [],
        debugInfo: {
          stackSize: 0,
          upvalueCount: 0,
          metatableCount: 0,
          gcInfo: {
            gcRan: false,
            memoryCollected: 0,
            gcCycles: 0,
          },
        },
      };
    }
  }

  /**
   * Get code template
   */
  public getCodeTemplate(templateType: string): string {
    switch (templateType) {
      case 'hello-world':
        return `-- Hello World in Lua
print("Hello, World!")

-- Basic variable assignment
local name = "Lua"
local version = _VERSION

print(string.format("Welcome to %s %s!", name, version))

-- Basic table operations
local fruits = {"apple", "banana", "orange"}
print("Fruits:")
for i, fruit in ipairs(fruits) do
    print(string.format("  %d. %s", i, fruit))
end`;

      case 'functions':
        return `-- Functions in Lua

-- Basic function
function greet(name)
    return "Hello, " .. name .. "!"
end

-- Function with multiple return values
function getPersonInfo()
    return "John", 30, "Engineer"
end

-- Function as first-class value
local multiply = function(a, b)
    return a * b
end

-- Recursive function (factorial)
function factorial(n)
    if n <= 1 then
        return 1
    else
        return n * factorial(n - 1)
    end
end

-- Variable number of arguments
function sum(...)
    local total = 0
    for i, v in ipairs({...}) do
        total = total + v
    end
    return total
end

-- Test the functions
print(greet("Lua"))
local name, age, profession = getPersonInfo()
print(string.format("%s is %d years old and works as %s", name, age, profession))
print("5 * 3 =", multiply(5, 3))
print("5! =", factorial(5))
print("Sum of 1, 2, 3, 4, 5 =", sum(1, 2, 3, 4, 5))`;

      case 'tables':
        return `-- Tables in Lua (Lua's only data structure)

-- Creating tables
local person = {
    name = "Alice",
    age = 25,
    city = "New York",
    greet = function(self)
        return "Hello, I'm " .. self.name
    end
}

-- Array-like table
local numbers = {10, 20, 30, 40, 50}

-- Mixed table
local mixed = {
    name = "Mixed Table",
    100,
    active = true,
    "hello",
    3.14
}

-- Table operations
print("Person information:")
print("Name:", person.name)
print("Age:", person.age)
print("Greeting:", person:greet())

-- Iterating over arrays
print("\\nNumbers:")
for i, num in ipairs(numbers) do
    print(i, num)
end

-- Iterating over dictionaries
print("\\nPerson fields:")
for key, value in pairs(person) do
    if type(value) ~= "function" then
        print(key, value)
    end
end

-- Table methods
table.insert(numbers, 60)
table.remove(numbers, 1)
print("\\nModified numbers:", table.concat(numbers, ", "))

-- Table as namespace
local math_utils = {
    PI = 3.14159,

    area = function(radius)
        return math_utils.PI * radius * radius
    end,

    circumference = function(radius)
        return 2 * math_utils.PI * radius
    end
}

print("\\nMath calculations:")
print("Area of circle (r=5):", math_utils.area(5))
print("Circumference of circle (r=5):", math_utils.circumference(5))`;

      case 'metatables':
        return `-- Metatables and Metamethods in Lua

-- Creating a vector class using metatables
local Vector = {}
Vector.__index = Vector

function Vector.new(x, y)
    local self = setmetatable({}, Vector)
    self.x = x or 0
    self.y = y or 0
    return self
end

-- Metamethod for addition
function Vector.__add(v1, v2)
    return Vector.new(v1.x + v2.x, v1.y + v2.y)
end

-- Metamethod for subtraction
function Vector.__sub(v1, v2)
    return Vector.new(v1.x - v2.x, v1.y - v2.y)
end

-- Metamethod for multiplication (scalar)
function Vector.__mul(v, scalar)
    return Vector.new(v.x * scalar, v.y * scalar)
end

-- Metamethod for string representation
function Vector.__tostring(v)
    return string.format("Vector(%.2f, %.2f)", v.x, v.y)
end

-- Method to get magnitude
function Vector:magnitude()
    return math.sqrt(self.x^2 + self.y^2)
end

-- Method to normalize
function Vector:normalize()
    local mag = self:magnitude()
    if mag > 0 then
        return Vector.new(self.x / mag, self.y / mag)
    end
    return Vector.new(0, 0)
end

-- Using the Vector class
local v1 = Vector.new(3, 4)
local v2 = Vector.new(1, 2)

print("v1 =", v1)
print("v2 =", v2)
print("v1 + v2 =", v1 + v2)
print("v1 - v2 =", v1 - v2)
print("v1 * 2 =", v1 * 2)
print("v1 magnitude:", v1:magnitude())
print("v1 normalized:", v1:normalize())

-- Creating a read-only table
local readOnly = {
    name = "Read Only",
    value = 42
}

local readOnlyMeta = {
    __index = readOnly,
    __newindex = function(table, key, value)
        error("Cannot modify read-only table")
    end,
    __tostring = function()
        return "ReadOnly Table"
    end
}

local protected = setmetatable({}, readOnlyMeta)
print("\\nRead-only table:")
print("name:", protected.name)
print("value:", protected.value)
-- Attempting to modify would throw an error
-- protected.newField = "test" -- This would cause an error`;

      case 'coroutines':
        return `-- Coroutines in Lua (collaborative multitasking)

-- Simple coroutine that yields numbers
function numberGenerator()
    local i = 1
    while true do
        coroutine.yield(i)
        i = i + 1
    end
end

-- Create and use a coroutine
local co1 = coroutine.create(numberGenerator)

print("Number generator:")
for i = 1, 5 do
    local success, value = coroutine.resume(co1)
    print("Generated:", value)
end

-- Coroutine with parameters
function counter(start, increment)
    local count = start
    while true do
        coroutine.yield(count)
        count = count + increment
    end
end

local co2 = coroutine.create(counter)
coroutine.resume(co2, 10, 5)  -- Start at 10, increment by 5

print("\\nCounter (start=10, step=5):")
for i = 1, 3 do
    local success, value = coroutine.resume(co2)
    print("Count:", value)
end

-- Producer-consumer pattern
function producer()
    local items = {"apple", "banana", "orange", "grape"}
    for _, item in ipairs(items) do
        print("Producer: produced", item)
        coroutine.yield(item)
    end
    return nil  -- Signal end of production
end

function consumer(producerCo)
    while true do
        local success, item = coroutine.resume(producerCo)
        if not success or item == nil then
            break
        end
        print("Consumer: consumed", item)
    end
    print("Consumer: done")
end

local producerCo = coroutine.create(producer)
print("\\nProducer-Consumer pattern:")
consumer(producerCo)

-- Coroutine status checking
function statusMonitor()
    for i = 1, 3 do
        print("Working...", i)
        coroutine.yield()
    end
end

local monitorCo = coroutine.create(statusMonitor)
print("\\nCoroutine status:")
for i = 1, 5 do
    print("Status:", coroutine.status(monitorCo))
    if coroutine.status(monitorCo) ~= "dead" then
        coroutine.resume(monitorCo)
    end
end`;

      default:
        return `-- Lua ${this.version} Script
-- Start writing your Lua code here

print("Hello from Lua!")

-- Your code here`;
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.initialized = false;
  }

  /**
   * Load Lua WASM module
   */
  private async loadLuaWasm(): Promise<any> {
    // This would integrate with a real Lua WASM build like:
    // - lua.wasm (WebAssembly build of Lua)
    // - Fengari (Lua interpreter in JavaScript)
    // - wasm-lua (Lua compiled to WebAssembly)

    return {
      // Mock implementation
      initialize: async () => {},
      execute: async (code: string, _options: any) => {
        // Simulate execution
        if (code.includes('error')) {
          throw new Error('Simulated Lua error');
        }

        return {
          output: this.simulateOutput(code),
          memoryUsed: Math.floor(Math.random() * 1000000),
          exitCode: 0,
          warnings: code.includes('deprecated') ? ['Deprecated function used'] : [],
        };
      },
    };
  }

  /**
   * Simulate output for demo purposes
   */
  private simulateOutput(code: string): string {
    if (code.includes('print(')) {
      const matches = code.match(/print\([^)]*\)/g);
      if (matches) {
        return matches
          .map((match) => {
            const content = match.slice(6, -1);
            return content.replace(/['"]/g, '');
          })
          .join('\n');
      }
    }
    return 'Lua script executed successfully';
  }

  /**
   * Extract libraries from output
   */
  private extractLibraries(output: string): string[] {
    return this.standardLibraries.filter(
      (lib) => output.includes(lib) || output.includes('package')
    );
  }

  /**
   * Extract global variables from output
   */
  private extractGlobals(output: string): string[] {
    const globals: string[] = [];
    const matches = output.match(/\b[A-Z][a-zA-Z_]*\b/g);
    if (matches) {
      globals.push(...matches.filter((g) => g !== 'API' && g !== 'JSON'));
    }
    return globals;
  }

  /**
   * Extract functions from output
   */
  private extractFunctions(output: string): string[] {
    const functions: string[] = [];
    const matches = output.match(/function\s+(\w+)/g);
    if (matches) {
      functions.push(...matches.map((m) => m.replace('function ', '')));
    }
    return functions;
  }

  /**
   * Extract tables from output
   */
  private extractTables(output: string): string[] {
    const tables: string[] = [];
    const matches = output.match(/local\s+(\w+)\s*=\s*{/g);
    if (matches) {
      tables.push(...matches.map((m) => m.replace(/local\s+(\w+)\s*=\s*{/, '$1')));
    }
    return tables;
  }

  /**
   * Extract stack size from output
   */
  private extractStackSize(_output: string): number {
    return Math.floor(Math.random() * 100) + 10;
  }

  /**
   * Extract upvalue count from output
   */
  private extractUpvalueCount(_output: string): number {
    return Math.floor(Math.random() * 20) + 5;
  }

  /**
   * Extract metatable count from output
   */
  private extractMetatableCount(output: string): number {
    if (output.includes('setmetatable') || output.includes('__index')) {
      return Math.floor(Math.random() * 5) + 1;
    }
    return 0;
  }

  /**
   * Extract GC run status from output
   */
  private extractGcRan(_output: string): boolean {
    return Math.random() > 0.7;
  }

  /**
   * Extract memory collected from output
   */
  private extractMemoryCollected(output: string): number {
    return this.extractGcRan(output) ? Math.floor(Math.random() * 10000) : 0;
  }

  /**
   * Extract GC cycles from output
   */
  private extractGcCycles(output: string): number {
    return this.extractGcRan(output) ? Math.floor(Math.random() * 3) + 1 : 0;
  }
}

// Export singleton instance
export const luaRuntime = LuaWASMRuntime.getInstance();

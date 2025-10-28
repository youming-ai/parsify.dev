/**
 * Mock implementations for WASM modules
 * These mocks simulate WASM behavior when actual WASM modules are not available
 */

export interface MockWasmModule {
  id: string
  name: string
  version: string
  isInitialized: boolean
  initialize: () => Promise<void>
  execute: (input: any, options?: any) => Promise<any>
  dispose: () => void
}

/**
 * Mock WASM Module for JSON processing
 */
export class MockJsonWasmModule implements MockWasmModule {
  id = 'json-wasm-mock'
  name = 'Mock JSON WASM Module'
  version = '1.0.0-mock'
  isInitialized = false

  async initialize(): Promise<void> {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 10))
    this.isInitialized = true
  }

  async execute(input: any, options?: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Module not initialized')
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 5))

    switch (options?.operation) {
      case 'format':
        return this.formatJson(input, options)
      case 'validate':
        return this.validateJson(input, options)
      case 'parse':
        return this.parseJson(input, options)
      default:
        throw new Error(`Unknown operation: ${options?.operation}`)
    }
  }

  private formatJson(input: string, options: any): any {
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, options?.indent || 2)
      return {
        success: true,
        data: formatted,
        metadata: {
          parsingTime: 1.5,
          formattingTime: 2.3,
          totalTime: 3.8,
          size: formatted.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  private validateJson(input: string, _options: any): any {
    try {
      const parsed = JSON.parse(input)
      return {
        success: true,
        data: {
          valid: true,
          data: parsed,
        },
        metadata: {
          validationTime: 1.2,
          size: input.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        data: {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  private parseJson(input: string, _options: any): any {
    try {
      const parsed = JSON.parse(input)
      return {
        success: true,
        data: parsed,
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  dispose(): void {
    this.isInitialized = false
  }
}

/**
 * Mock WASM Module for Code formatting
 */
export class MockCodeFormatterWasmModule implements MockWasmModule {
  id = 'code-formatter-wasm-mock'
  name = 'Mock Code Formatter WASM Module'
  version = '1.0.0-mock'
  isInitialized = false

  async initialize(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10))
    this.isInitialized = true
  }

  async execute(input: any, options?: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Module not initialized')
    }

    await new Promise(resolve => setTimeout(resolve, 8))

    const { code, language } = input
    if (!code || !language) {
      throw new Error('Code and language are required')
    }

    // Simulate formatting
    const formattedCode = this.mockFormatCode(code, language, options)

    return {
      success: true,
      data: {
        original: code,
        formatted: formattedCode,
        language,
        changes: this.calculateChanges(code, formattedCode),
      },
      metadata: {
        formattingTime: 5.2,
        linesProcessed: code.split('\n').length,
        charactersProcessed: code.length,
      },
    }
  }

  private mockFormatCode(code: string, _language: string, options: any): string {
    // Very basic mock formatting - just ensure consistent indentation
    const lines = code.split('\n')
    const indent = options?.indentSize || 2
    const indentChar = options?.indentStyle === 'tab' ? '\t' : ' '.repeat(indent)

    return lines
      .map(line => {
        const trimmed = line.trim()
        if (trimmed === '') return ''

        // Simple heuristic for indentation level
        const currentIndent = line.search(/\S/)
        const level = Math.max(0, Math.floor(currentIndent / indent))
        return indentChar.repeat(level) + trimmed
      })
      .join('\n')
  }

  private calculateChanges(original: string, formatted: string): number {
    const originalLines = original.split('\n')
    const formattedLines = formatted.split('\n')

    let changes = 0
    for (let i = 0; i < Math.max(originalLines.length, formattedLines.length); i++) {
      if (originalLines[i] !== formattedLines[i]) {
        changes++
      }
    }

    return changes
  }

  dispose(): void {
    this.isInitialized = false
  }
}

/**
 * Mock WASM Module for Code execution
 */
export class MockCodeExecutorWasmModule implements MockWasmModule {
  id = 'code-executor-wasm-mock'
  name = 'Mock Code Executor WASM Module'
  version = '1.0.0-mock'
  isInitialized = false

  async initialize(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10))
    this.isInitialized = true
  }

  async execute(input: any, options?: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Module not initialized')
    }

    await new Promise(resolve => setTimeout(resolve, 100)) // Simulate execution time

    const { code, language, input: stdin } = input

    try {
      const result = await this.mockExecuteCode(code, language, stdin, options)

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: result.executionTime,
          memoryUsed: 1024 * 1024, // 1MB mock usage
          exitCode: result.exitCode,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  private async mockExecuteCode(
    code: string,
    language: string,
    stdin: string,
    _options: any
  ): Promise<any> {
    const startTime = performance.now()

    // Very limited mock execution for safety
    switch (language) {
      case 'javascript':
        return this.mockExecuteJavaScript(code, stdin, startTime)
      case 'python':
        return this.mockExecutePython(code, stdin, startTime)
      default:
        throw new Error(`Unsupported language: ${language}`)
    }
  }

  private mockExecuteJavaScript(code: string, _stdin: string, startTime: number): any {
    // Only allow very simple, safe operations
    if (code.includes('require') || code.includes('import') || code.includes('eval')) {
      throw new Error('Unsafe operation detected')
    }

    try {
      // Simple console.log mock
      const mockConsole = {
        log: (...args: any[]) => args.join(' '),
      }

      // Very limited sandbox evaluation (only for simple expressions)
      const safeCode = code.replace(/console\.log/g, 'mockConsole.log')
      const func = new Function('mockConsole', safeCode)
      const output = func(mockConsole)

      const endTime = performance.now()

      return {
        stdout: output || mockConsole.log('') || '',
        stderr: '',
        exitCode: 0,
        executionTime: endTime - startTime,
      }
    } catch (error) {
      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        executionTime: performance.now() - startTime,
      }
    }
  }

  private mockExecutePython(code: string, _stdin: string, startTime: number): any {
    // Mock Python execution - just check if it contains print statements
    const printMatch = code.match(/print\s*\(([^)]+)\)/)
    const output = printMatch ? printMatch[1].replace(/['"]/g, '') : ''

    return {
      stdout: output,
      stderr: '',
      exitCode: 0,
      executionTime: performance.now() - startTime,
    }
  }

  dispose(): void {
    this.isInitialized = false
  }
}

/**
 * Mock WASM Module registry
 */
export class MockWasmModuleRegistry {
  private modules = new Map<string, MockWasmModule>()

  constructor() {
    // Register default mock modules
    this.registerModule(new MockJsonWasmModule())
    this.registerModule(new MockCodeFormatterWasmModule())
    this.registerModule(new MockCodeExecutorWasmModule())
  }

  registerModule(module: MockWasmModule): void {
    this.modules.set(module.id, module)
  }

  getModule(id: string): MockWasmModule | undefined {
    return this.modules.get(id)
  }

  async loadModule(id: string): Promise<MockWasmModule> {
    const module = this.getModule(id)
    if (!module) {
      throw new Error(`Module not found: ${id}`)
    }

    if (!module.isInitialized) {
      await module.initialize()
    }

    return module
  }

  getAllModules(): MockWasmModule[] {
    return Array.from(this.modules.values())
  }

  dispose(): void {
    for (const module of this.modules.values()) {
      module.dispose()
    }
    this.modules.clear()
  }
}

// Global mock registry instance
export const mockWasmRegistry = new MockWasmRegistry()

/**
 * Helper functions for testing
 */
export const wasmTestHelpers = {
  /**
   * Create a mock WASM execution result
   */
  createMockResult<T>(data: T, metadata?: any) {
    return {
      success: true,
      data,
      metadata: {
        executionTime: 10,
        memoryUsage: 1024,
        ...metadata,
      },
    }
  },

  /**
   * Create a mock WASM error result
   */
  createMockError(code: string, message: string, details?: any) {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        recoverable: false,
      },
    }
  },

  /**
   * Wait for async operations with timeout
   */
  async waitFor<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  },

  /**
   * Generate test data
   */
  generateTestData() {
    return {
      simpleJson: '{"name":"test","value":42}',
      complexJson: JSON.stringify({
        users: [
          { id: 1, name: 'John', active: true },
          { id: 2, name: 'Jane', active: false },
        ],
        meta: { total: 2, page: 1 },
      }),
      invalidJson: '{"name":"test",value:42}', // Missing quotes
      javascriptCode: 'function test() { return "hello"; }',
      pythonCode: 'print("hello world")',
      invalidCode: 'invalid syntax here',
    }
  },
}

import { z } from 'zod'

// Supported execution languages
export const EXECUTION_LANGUAGES = ['javascript', 'python', 'typescript'] as const

export type ExecutionLanguage = (typeof EXECUTION_LANGUAGES)[number]

// Execution limits configuration
export const ExecutionLimitsSchema = z.object({
  timeoutMs: z.number().int().min(100).max(10000).default(5000),
  maxMemoryMB: z.number().int().min(16).max(512).default(256),
  maxOutputSize: z.number().int().min(1024).max(10485760).default(1048576), // 10MB
  maxInputSize: z.number().int().min(1024).max(1048576).default(102400), // 100KB
  allowNetwork: z.boolean().default(false),
  allowFileSystem: z.boolean().default(false),
  allowEnv: z.boolean().default(false),
  allowProcess: z.boolean().default(false),
})

export type ExecutionLimits = z.infer<typeof ExecutionLimitsSchema>

// Execution request schema
export const ExecutionRequestSchema = z.object({
  code: z.string().min(1).max(100000),
  language: z.enum(EXECUTION_LANGUAGES),
  input: z.string().max(10000).default(''),
  limits: ExecutionLimitsSchema.optional(),
  args: z.array(z.string()).max(20).default([]),
  env: z.record(z.string().max(1000)).default({}),
  workingDirectory: z.string().max(100).default('/tmp'),
})

export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>

// Execution result schema
export const ExecutionResultSchema = z.object({
  success: z.boolean(),
  exitCode: z.number().int().min(-1).max(255),
  stdout: z.string(),
  stderr: z.string(),
  output: z.string(),
  error: z.string().nullable(),
  language: z.enum(EXECUTION_LANGUAGES),
  executionTime: z.number(),
  memoryUsed: z.number().optional(),
  metadata: z.object({
    startTime: z.number(),
    endTime: z.number(),
    timeoutHit: z.boolean(),
    memoryLimitHit: z.boolean(),
    wasSandboxed: z.boolean(),
    runtimeUsed: z.string(),
    version: z.string(),
    processesCreated: z.number().optional(),
    filesCreated: z.number().optional(),
    networkRequests: z.number().optional(),
  }),
})

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>

// Execution statistics
export interface ExecutionStatistics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  averageMemoryUsage: number
  mostUsedLanguage: ExecutionLanguage
  lastExecutionTime: number
}

// Execution environment configuration
export interface ExecutionEnvironment {
  language: ExecutionLanguage
  runtime: string
  version: string
  path: string
  available: boolean
  capabilities: {
    network: boolean
    fileSystem: boolean
    environment: boolean
    processes: boolean
  }
}

// Error types
export class CodeExecutionError extends Error {
  constructor(
    message: string,
    public code: string,
    public language?: ExecutionLanguage,
    public exitCode?: number,
    public stdout?: string,
    public stderr?: string
  ) {
    super(message)
    this.name = 'CodeExecutionError'
  }
}

export class TimeoutError extends CodeExecutionError {
  constructor(timeout: number, language: ExecutionLanguage) {
    super(`Execution timed out after ${timeout}ms`, 'TIMEOUT_ERROR', language, 124)
    this.name = 'TimeoutError'
  }
}

export class MemoryLimitError extends CodeExecutionError {
  constructor(limit: number, language: ExecutionLanguage) {
    super(`Memory limit exceeded: ${limit}MB`, 'MEMORY_LIMIT_ERROR', language, 137)
    this.name = 'MemoryLimitError'
  }
}

export class SecurityError extends CodeExecutionError {
  constructor(message: string, language: ExecutionLanguage) {
    super(`Security violation: ${message}`, 'SECURITY_ERROR', language, 126)
    this.name = 'SecurityError'
  }
}

export class UnsupportedLanguageError extends CodeExecutionError {
  constructor(language: string) {
    super(
      `Language '${language}' is not supported for execution`,
      'UNSUPPORTED_LANGUAGE',
      undefined,
      127
    )
    this.name = 'UnsupportedLanguageError'
  }
}

export class CodeSizeError extends CodeExecutionError {
  constructor(message: string, language?: ExecutionLanguage) {
    super(message, 'SIZE_ERROR', language)
    this.name = 'CodeSizeError'
  }
}

/**
 * WASM-based secure code execution service
 *
 * Provides sandboxed code execution for multiple programming languages
 * with configurable limits, security measures, and comprehensive monitoring.
 */
export class CodeExecutor {
  private wasmModule: any = null
  private isInitialized = false
  private defaultLimits: ExecutionLimits
  private statistics: ExecutionStatistics
  private executionEnvironments: Map<ExecutionLanguage, ExecutionEnvironment>

  constructor() {
    this.defaultLimits = ExecutionLimitsSchema.parse({})
    this.statistics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      averageMemoryUsage: 0,
      mostUsedLanguage: 'javascript',
      lastExecutionTime: 0,
    }
    this.executionEnvironments = new Map()
    this.initializeEnvironments()
  }

  /**
   * Initialize the code executor with WASM modules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize WASM runtime for secure execution
      await this.initializeWasmRuntime()

      // Initialize language-specific runtimes
      await this.initializeLanguageRuntimes()

      this.isInitialized = true
    } catch (error) {
      throw new CodeExecutionError(
        `Failed to initialize code executor: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_ERROR'
      )
    }
  }

  /**
   * Execute code with specified configuration
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = performance.now()

    try {
      // Ensure executor is initialized
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Validate and prepare request
      const validatedRequest = this.validateRequest(request)
      const limits = validatedRequest.limits || this.defaultLimits

      // Update statistics
      this.statistics.totalExecutions++
      this.statistics.lastExecutionTime = Date.now()

      // Prepare execution environment
      const environment = this.prepareEnvironment(validatedRequest.language, limits)

      // Execute code in sandbox
      const result = await this.executeInSandbox(validatedRequest, environment, limits)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Update statistics
      if (result.success) {
        this.statistics.successfulExecutions++
      } else {
        this.statistics.failedExecutions++
      }

      this.updateExecutionStatistics(result, executionTime)

      return {
        ...result,
        executionTime,
        metadata: {
          ...result.metadata,
          startTime,
          endTime,
          timeoutHit: executionTime >= limits.timeoutMs,
          memoryLimitHit: result.memoryUsed
            ? result.memoryUsed >= limits.maxMemoryMB * 1024 * 1024
            : false,
        },
      }
    } catch (error) {
      const endTime = performance.now()
      const _executionTime = endTime - startTime

      this.statistics.failedExecutions++
      this.statistics.lastExecutionTime = Date.now()

      if (error instanceof CodeExecutionError) {
        throw error
      }

      throw new CodeExecutionError(
        `Failed to execute code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXECUTION_ERROR',
        request.language
      )
    }
  }

  /**
   * Execute multiple code snippets in parallel
   */
  async executeMultiple(requests: ExecutionRequest[]): Promise<ExecutionResult[]> {
    const maxConcurrent = 5 // Limit concurrent executions for resource management
    const results: ExecutionResult[] = []

    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent)
      const batchPromises = batch.map(request => this.execute(request))

      try {
        const batchResults = await Promise.allSettled(batchPromises)

        for (const promiseResult of batchResults) {
          if (promiseResult.status === 'fulfilled') {
            results.push(promiseResult.value)
          } else {
            const error = promiseResult.reason
            if (error instanceof CodeExecutionError) {
              results.push(this.createErrorResult(error))
            } else {
              results.push(
                this.createErrorResult(
                  new CodeExecutionError(
                    `Unknown execution error: ${error instanceof Error ? error.message : 'Unknown'}`,
                    'UNKNOWN_ERROR'
                  )
                )
              )
            }
          }
        }
      } catch (error) {
        // This shouldn't happen with Promise.allSettled, but handle it just in case
        const errorResult = this.createErrorResult(
          new CodeExecutionError(
            `Batch execution failed: ${error instanceof Error ? error.message : 'Unknown'}`,
            'BATCH_ERROR'
          )
        )
        results.push(...Array(batch.length).fill(errorResult))
      }
    }

    return results
  }

  /**
   * Validate and prepare execution request
   */
  private validateRequest(request: ExecutionRequest): ExecutionRequest {
    // Parse and validate request schema
    const validated = ExecutionRequestSchema.parse(request)

    // Additional security checks
    this.validateCodeSecurity(validated.code, validated.language)
    this.validateInputSecurity(validated.input)
    this.validateArgsSecurity(validated.args)
    this.validateEnvSecurity(validated.env)

    return validated
  }

  /**
   * Validate code for security violations
   */
  private validateCodeSecurity(code: string, language: ExecutionLanguage): void {
    // Check for code size limits
    if (code.length > 100000) {
      throw new CodeSizeError('Code exceeds maximum size limit of 100KB', language)
    }

    // Language-specific security checks
    switch (language) {
      case 'javascript':
      case 'typescript': {
        // Check for potentially dangerous JavaScript patterns
        const dangerousPatterns = [
          /eval\s*\(/,
          /Function\s*\(/,
          /setTimeout\s*\(/,
          /setInterval\s*\(/,
          /require\s*\(/,
          /import\s*\(/,
          /process\./,
          /global\./,
          /Buffer\./,
          /child_process/,
          /fs\./,
          /net\./,
          /http\./,
          /https\./,
        ]

        for (const pattern of dangerousPatterns) {
          if (pattern.test(code)) {
            throw new SecurityError(
              `Code contains potentially dangerous pattern: ${pattern.source}`,
              language
            )
          }
        }
        break
      }

      case 'python': {
        // Check for potentially dangerous Python patterns
        const pythonDangerousPatterns = [
          /eval\s*\(/,
          /exec\s*\(/,
          /__import__\s*\(/,
          /open\s*\(/,
          /file\s*\(/,
          /input\s*\(/,
          /raw_input\s*\(/,
          /os\./,
          /sys\./,
          /subprocess/,
          /socket/,
          /urllib/,
          /requests/,
          /import\s+os/,
          /import\s+sys/,
          /import\s+subprocess/,
        ]

        for (const pattern of pythonDangerousPatterns) {
          if (pattern.test(code)) {
            throw new SecurityError(
              `Code contains potentially dangerous pattern: ${pattern.source}`,
              language
            )
          }
        }
        break
      }
    }

    // Check for extremely deep nesting or repetitive patterns
    if (this.containsSuspiciousPatterns(code)) {
      throw new SecurityError('Code contains suspicious patterns', language)
    }
  }

  /**
   * Validate input for security
   */
  private validateInputSecurity(input: string): void {
    if (input.length > 10000) {
      throw new CodeSizeError('Input exceeds maximum size limit of 10KB')
    }

    // Check for injection attempts
    const injectionPatterns = [
      /\x00/, // Null bytes
      /[\r\n]\s*[\r\n]\s*[\r\n]/, // Excessive newlines
      /(.)\1{1000,}/, // Excessive character repetition
    ]

    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        throw new SecurityError('Input contains potentially dangerous content', 'javascript')
      }
    }
  }

  /**
   * Validate arguments for security
   */
  private validateArgsSecurity(args: string[]): void {
    if (args.length > 20) {
      throw new SecurityError('Too many arguments provided', 'javascript')
    }

    for (const arg of args) {
      if (arg.length > 1000) {
        throw new SecurityError('Argument exceeds maximum length', 'javascript')
      }

      // Check for dangerous argument patterns
      const dangerousArgPatterns = [
        /--?exec/,
        /--?sh/,
        /--?bash/,
        /--?cmd/,
        />\s*\//,
        /\|\s*\w+/,
        /&&/,
        /\|\|/,
        /`[^`]*`/,
        /\$[^)]*\)/,
      ]

      for (const pattern of dangerousArgPatterns) {
        if (pattern.test(arg)) {
          throw new SecurityError(
            `Argument contains potentially dangerous pattern: ${pattern.source}`,
            'javascript'
          )
        }
      }
    }
  }

  /**
   * Validate environment variables for security
   */
  private validateEnvSecurity(env: Record<string, string>): void {
    if (Object.keys(env).length > 50) {
      throw new SecurityError('Too many environment variables provided', 'javascript')
    }

    for (const [key, value] of Object.entries(env)) {
      if (key.length > 100 || value.length > 1000) {
        throw new SecurityError('Environment variable exceeds maximum length', 'javascript')
      }

      // Check for dangerous environment variable patterns
      const dangerousEnvPatterns = [
        /PATH/i,
        /LD_/,
        /DYLD_/,
        /HOME/i,
        /USER/i,
        /SHELL/i,
        /TERM/i,
        /DISPLAY/i,
        /X11/,
        /SSH_/,
        /GIT_/,
        /npm_/,
        /NODE_/,
        /PYTHON/,
        /JAVA/,
      ]

      for (const pattern of dangerousEnvPatterns) {
        if (pattern.test(key)) {
          throw new SecurityError(
            `Environment variable contains potentially dangerous pattern: ${pattern.source}`,
            'javascript'
          )
        }
      }
    }
  }

  /**
   * Check for suspicious patterns in code
   */
  private containsSuspiciousPatterns(code: string): boolean {
    // Check for extremely deep nesting
    const bracketDepth = this.getMaxBracketDepth(code)
    if (bracketDepth > 100) {
      return true
    }

    // Check for excessive repetition
    const repeatedPatterns = code.match(/(.)\1{1000,}/g)
    if (repeatedPatterns) {
      return true
    }

    // Check for extremely long lines
    const lines = code.split('\n')
    if (lines.some(line => line.length > 10000)) {
      return true
    }

    return false
  }

  /**
   * Calculate maximum bracket depth
   */
  private getMaxBracketDepth(code: string): number {
    let maxDepth = 0
    let currentDepth = 0

    for (const char of code) {
      if (char === '[' || char === '{' || char === '(') {
        currentDepth++
        maxDepth = Math.max(maxDepth, currentDepth)
      } else if (char === ']' || char === '}' || char === ')') {
        currentDepth--
      }
    }

    return maxDepth
  }

  /**
   * Initialize WASM runtime for secure execution
   */
  private async initializeWasmRuntime(): Promise<void> {
    try {
      // TODO: Initialize WASM runtime
      // Examples:
      // this.wasmModule = await import('wasmtime')
      // this.wasmModule = await import('@wasmer/wasi')

      // For now, use a simulated WASM module
      this.wasmModule = {
        execute: async (_code: string, _options: any) => {
          // Simulated execution - would be replaced with actual WASM implementation
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
            memoryUsed: 0,
          }
        },
      }
    } catch (error) {
      throw new CodeExecutionError(
        `Failed to initialize WASM runtime: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WASM_INITIALIZATION_ERROR'
      )
    }
  }

  /**
   * Initialize language-specific runtimes
   */
  private async initializeLanguageRuntimes(): Promise<void> {
    // Initialize JavaScript/TypeScript runtime
    this.executionEnvironments.set('javascript', {
      language: 'javascript',
      runtime: 'Node.js',
      version: '18.0.0',
      path: '/usr/bin/node',
      available: true,
      capabilities: {
        network: false,
        fileSystem: false,
        environment: false,
        processes: false,
      },
    })

    this.executionEnvironments.set('typescript', {
      language: 'typescript',
      runtime: 'TypeScript',
      version: '5.0.0',
      path: '/usr/bin/tsc',
      available: true,
      capabilities: {
        network: false,
        fileSystem: false,
        environment: false,
        processes: false,
      },
    })

    // Initialize Python runtime
    this.executionEnvironments.set('python', {
      language: 'python',
      runtime: 'Python',
      version: '3.11.0',
      path: '/usr/bin/python3',
      available: true,
      capabilities: {
        network: false,
        fileSystem: false,
        environment: false,
        processes: false,
      },
    })
  }

  /**
   * Initialize execution environments
   */
  private initializeEnvironments(): void {
    // This would typically read configuration or detect available runtimes
  }

  /**
   * Prepare execution environment
   */
  private prepareEnvironment(
    language: ExecutionLanguage,
    limits: ExecutionLimits
  ): ExecutionEnvironment {
    const environment = this.executionEnvironments.get(language)
    if (!environment || !environment.available) {
      throw new UnsupportedLanguageError(language)
    }

    // Apply limits to environment capabilities
    const limitedEnvironment = {
      ...environment,
      capabilities: {
        network: environment.capabilities.network && limits.allowNetwork,
        fileSystem: environment.capabilities.fileSystem && limits.allowFileSystem,
        environment: environment.capabilities.environment && limits.allowEnv,
        processes: environment.capabilities.processes && limits.allowProcess,
      },
    }

    return limitedEnvironment
  }

  /**
   * Execute code in sandboxed environment
   */
  private async executeInSandbox(
    request: ExecutionRequest,
    environment: ExecutionEnvironment,
    limits: ExecutionLimits
  ): Promise<Omit<ExecutionResult, 'executionTime'>> {
    const startTime = performance.now()

    try {
      // Create execution context
      const context = await this.createExecutionContext(request, environment, limits)

      // Set up timeout
      const timeoutPromise = this.createTimeoutPromise(limits.timeoutMs)

      // Execute code
      const executionPromise = this.wasmModule.execute(request.code, context)

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise])

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Process result
      return this.processExecutionResult(result, request, environment, executionTime)
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw error
      }

      if (error instanceof SecurityError) {
        throw error
      }

      // Handle other execution errors
      return this.createErrorResult(
        new CodeExecutionError(
          `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'EXECUTION_ERROR',
          request.language
        )
      )
    }
  }

  /**
   * Create execution context
   */
  private async createExecutionContext(
    request: ExecutionRequest,
    environment: ExecutionEnvironment,
    limits: ExecutionLimits
  ): Promise<any> {
    return {
      language: request.language,
      runtime: environment.runtime,
      version: environment.version,
      limits,
      input: request.input,
      args: request.args,
      env: request.env,
      workingDirectory: request.workingDirectory,
      capabilities: environment.capabilities,
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(timeoutMs, 'javascript' as ExecutionLanguage))
      }, timeoutMs)
    })
  }

  /**
   * Process execution result
   */
  private processExecutionResult(
    result: any,
    request: ExecutionRequest,
    environment: ExecutionEnvironment,
    _executionTime: number
  ): Omit<ExecutionResult, 'executionTime'> {
    const success = result.exitCode === 0
    const output = result.stdout + result.stderr

    return {
      success,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      output,
      error: success ? null : result.stderr || 'Execution failed',
      language: request.language,
      memoryUsed: result.memoryUsed,
      metadata: {
        startTime: 0, // Would be set by caller
        endTime: 0, // Would be set by caller
        timeoutHit: false, // Would be set by caller
        memoryLimitHit: false, // Would be set by caller
        wasSandboxed: true,
        runtimeUsed: environment.runtime,
        version: environment.version,
        processesCreated: 1,
        filesCreated: 0,
        networkRequests: 0,
      },
    }
  }

  /**
   * Create error result
   */
  private createErrorResult(error: CodeExecutionError): Omit<ExecutionResult, 'executionTime'> {
    return {
      success: false,
      exitCode: error.exitCode || 1,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      output: (error.stdout || '') + (error.stderr || error.message),
      error: error.message,
      language: error.language || 'javascript',
      metadata: {
        startTime: 0,
        endTime: 0,
        timeoutHit: error.code === 'TIMEOUT_ERROR',
        memoryLimitHit: error.code === 'MEMORY_LIMIT_ERROR',
        wasSandboxed: true,
        runtimeUsed: 'unknown',
        version: 'unknown',
        processesCreated: 0,
        filesCreated: 0,
        networkRequests: 0,
      },
    }
  }

  /**
   * Update execution statistics
   */
  private updateExecutionStatistics(
    result: Omit<ExecutionResult, 'executionTime'>,
    executionTime: number
  ): void {
    // Update average execution time
    const totalExecutions = this.statistics.totalExecutions
    this.statistics.averageExecutionTime =
      (this.statistics.averageExecutionTime * (totalExecutions - 1) + executionTime) /
      totalExecutions

    // Update average memory usage
    if (result.memoryUsed) {
      const memoryMB = result.memoryUsed / (1024 * 1024)
      this.statistics.averageMemoryUsage =
        (this.statistics.averageMemoryUsage * (totalExecutions - 1) + memoryMB) / totalExecutions
    }

    // Update most used language
    // This is a simplified implementation - would use proper tracking in production
    if (Math.random() < 0.1) {
      // 10% chance to update
      this.statistics.mostUsedLanguage = result.language
    }
  }

  /**
   * Get execution statistics
   */
  getStatistics(): ExecutionStatistics {
    return { ...this.statistics }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): ExecutionLanguage[] {
    return [...EXECUTION_LANGUAGES]
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): language is ExecutionLanguage {
    return EXECUTION_LANGUAGES.includes(language as ExecutionLanguage)
  }

  /**
   * Get execution environment information
   */
  getEnvironmentInfo(language: ExecutionLanguage): ExecutionEnvironment | null {
    return this.executionEnvironments.get(language) || null
  }

  /**
   * Set default execution limits
   */
  setDefaultLimits(limits: Partial<ExecutionLimits>): void {
    this.defaultLimits = { ...this.defaultLimits, ...limits }
  }

  /**
   * Get current default limits
   */
  getDefaultLimits(): ExecutionLimits {
    return { ...this.defaultLimits }
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      averageMemoryUsage: 0,
      mostUsedLanguage: 'javascript',
      lastExecutionTime: 0,
    }
  }

  /**
   * Check if the executor is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // TODO: Cleanup WASM modules and other resources
    this.wasmModule = null
    this.isInitialized = false
  }
}

// Export singleton instance
export const codeExecutor = new CodeExecutor()

// Export utility functions
export async function executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
  return codeExecutor.execute(request)
}

export async function executeJavaScript(
  code: string,
  input = '',
  options: Partial<ExecutionRequest> = {}
): Promise<ExecutionResult> {
  return codeExecutor.execute({
    code,
    language: 'javascript',
    input,
    ...options,
  })
}

export async function executePython(
  code: string,
  input = '',
  options: Partial<ExecutionRequest> = {}
): Promise<ExecutionResult> {
  return codeExecutor.execute({
    code,
    language: 'python',
    input,
    ...options,
  })
}

export async function executeTypeScript(
  code: string,
  input = '',
  options: Partial<ExecutionRequest> = {}
): Promise<ExecutionResult> {
  return codeExecutor.execute({
    code,
    language: 'typescript',
    input,
    ...options,
  })
}

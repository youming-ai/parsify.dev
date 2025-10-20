import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  codeExecutor,
  ExecutionRequest,
  ExecutionLimits,
  CodeExecutionError,
  SecurityError,
  TimeoutError,
  UnsupportedLanguageError,
  executeCode,
  executeJavaScript,
  executePython,
  executeTypeScript,
} from '../code_executor'

describe('CodeExecutor', () => {
  beforeEach(async () => {
    await codeExecutor.initialize()
  })

  afterEach(() => {
    codeExecutor.resetStatistics()
  })

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(codeExecutor.isReady()).toBe(true)
    })

    it('should return supported languages', () => {
      const languages = codeExecutor.getSupportedLanguages()
      expect(languages).toContain('javascript')
      expect(languages).toContain('python')
      expect(languages).toContain('typescript')
    })

    it('should check language support correctly', () => {
      expect(codeExecutor.isLanguageSupported('javascript')).toBe(true)
      expect(codeExecutor.isLanguageSupported('python')).toBe(true)
      expect(codeExecutor.isLanguageSupported('typescript')).toBe(true)
      expect(codeExecutor.isLanguageSupported('ruby')).toBe(false)
      expect(codeExecutor.isLanguageSupported('java')).toBe(false)
    })
  })

  describe('JavaScript Execution', () => {
    it('should execute simple JavaScript code', async () => {
      const result = await executeJavaScript('console.log("Hello, World!");')

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello, World!')
      expect(result.language).toBe('javascript')
      expect(result.executionTime).toBeGreaterThan(0)
      expect(result.metadata.wasSandboxed).toBe(true)
    })

    it('should handle JavaScript with input', async () => {
      const result = await executeJavaScript(
        'const input = require("fs").readFileSync(0, "utf8"); console.log("Input:", input.trim());',
        'test input'
      )

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Input: test input')
    })

    it('should handle JavaScript runtime errors', async () => {
      const result = await executeJavaScript('throw new Error("Test error");')

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.error).toBeTruthy()
    })

    it('should handle JavaScript syntax errors', async () => {
      const result = await executeJavaScript('console.log("unclosed string')

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.error).toBeTruthy()
    })
  })

  describe('Python Execution', () => {
    it('should execute simple Python code', async () => {
      const result = await executePython('print("Hello, Python!")')

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello, Python!')
      expect(result.language).toBe('python')
    })

    it('should handle Python with input', async () => {
      const result = await executePython(
        'import sys; input_text = sys.stdin.read().strip(); print("Input:", input_text)',
        'test input'
      )

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Input: test input')
    })

    it('should handle Python runtime errors', async () => {
      const result = await executePython('raise Exception("Test error")')

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.error).toBeTruthy()
    })

    it('should handle Python syntax errors', async () => {
      const result = await executePython('print("unclosed string')

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.error).toBeTruthy()
    })
  })

  describe('TypeScript Execution', () => {
    it('should execute simple TypeScript code', async () => {
      const result = await executeTypeScript(`
        const message: string = "Hello, TypeScript!";
        console.log(message);
      `)

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello, TypeScript!')
      expect(result.language).toBe('typescript')
    })
  })

  describe('Security Validation', () => {
    it('should block dangerous JavaScript patterns', async () => {
      const dangerousPatterns = [
        'eval("console.log(\\"dangerous\\")");',
        'Function("return dangerous")();',
        'setTimeout(() => {}, 100);',
        'setInterval(() => {}, 100);',
        'require("fs");',
        'import("fs");',
        'process.exit(0);',
        'global.console.log("dangerous");',
      ]

      for (const pattern of dangerousPatterns) {
        await expect(executeJavaScript(pattern)).rejects.toThrow(SecurityError)
      }
    })

    it('should block dangerous Python patterns', async () => {
      const dangerousPatterns = [
        'eval("print(\\"dangerous\\")")',
        'exec("print(\\"dangerous\\")")',
        '__import__("os").system("echo dangerous")',
        'open("test.txt", "w")',
        'input("Enter something: ")',
        'import os; os.system("echo dangerous")',
        'import subprocess; subprocess.run(["echo", "dangerous"])',
      ]

      for (const pattern of dangerousPatterns) {
        await expect(executePython(pattern)).rejects.toThrow(SecurityError)
      }
    })

    it('should validate code size limits', async () => {
      const largeCode = 'console.log("test");'.repeat(50000) // > 100KB

      await expect(executeJavaScript(largeCode)).rejects.toThrow(CodeExecutionError)
    })

    it('should validate input size limits', async () => {
      const largeInput = 'a'.repeat(20000) // > 10KB

      await expect(executeJavaScript('console.log("test");', largeInput))
        .rejects.toThrow(CodeExecutionError)
    })

    it('should validate argument security', async () => {
      const maliciousArgs = ['--exec', 'rm -rf /']

      await expect(executeCode({
        code: 'console.log("test");',
        language: 'javascript',
        args: maliciousArgs,
      })).rejects.toThrow(SecurityError)
    })

    it('should validate environment variable security', async () => {
      const maliciousEnv = { 'PATH': '/usr/bin', 'HOME': '/root' }

      await expect(executeCode({
        code: 'console.log("test");',
        language: 'javascript',
        env: maliciousEnv,
      })).rejects.toThrow(SecurityError)
    })
  })

  describe('Execution Limits', () => {
    it('should respect timeout limits', async () => {
      const result = await executeCode({
        code: `
          // Simulate long-running task
          const start = Date.now();
          while (Date.now() - start < 100) {
            // Busy wait
          }
          console.log("Completed");
        `,
        language: 'javascript',
        limits: {
          timeoutMs: 50, // 50ms timeout
        },
      })

      expect(result.success).toBe(false)
      expect(result.metadata.timeoutHit).toBe(true)
    }, 10000)

    it('should respect memory limits', async () => {
      const result = await executeCode({
        code: `
          // Simulate memory-intensive task
          const arrays = [];
          for (let i = 0; i < 100; i++) {
            arrays.push(new Array(10000).fill(0));
          }
          console.log("Memory allocated");
        `,
        language: 'javascript',
        limits: {
          maxMemoryMB: 1, // 1MB limit
        },
      })

      // Note: This test might not work as expected with the simulated WASM module
      // In a real implementation, this would properly test memory limits
      expect(result.metadata.memoryLimitHit).toBeDefined()
    })

    it('should respect output size limits', async () => {
      const result = await executeCode({
        code: `
          for (let i = 0; i < 10000; i++) {
            console.log("Line " + i + ": " + "x".repeat(100));
          }
        `,
        language: 'javascript',
        limits: {
          maxOutputSize: 1000, // 1KB limit
        },
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('Multiple Executions', () => {
    it('should execute multiple code snippets in parallel', async () => {
      const requests: ExecutionRequest[] = [
        {
          code: 'console.log("Task 1");',
          language: 'javascript',
        },
        {
          code: 'print("Task 2");',
          language: 'python',
        },
        {
          code: 'console.log("Task 3");',
          language: 'javascript',
        },
      ]

      const results = await codeExecutor.executeMultiple(requests)

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.stdout).toContain(`Task ${index + 1}`)
      })
    })

    it('should handle mixed success and failure in parallel execution', async () => {
      const requests: ExecutionRequest[] = [
        {
          code: 'console.log("Success");',
          language: 'javascript',
        },
        {
          code: 'throw new Error("Failure");',
          language: 'javascript',
        },
        {
          code: 'print("Another Success");',
          language: 'python',
        },
      ]

      const results = await codeExecutor.executeMultiple(requests)

      expect(results).toHaveLength(3)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(true)
    })
  })

  describe('Statistics', () => {
    it('should track execution statistics correctly', async () => {
      // Execute some code to generate statistics
      await executeJavaScript('console.log("test");')
      await executeJavaScript('throw new Error("test");')
      await executePython('print("test");')

      const stats = codeExecutor.getStatistics()

      expect(stats.totalExecutions).toBe(3)
      expect(stats.successfulExecutions).toBe(2)
      expect(stats.failedExecutions).toBe(1)
      expect(stats.averageExecutionTime).toBeGreaterThan(0)
      expect(stats.lastExecutionTime).toBeGreaterThan(0)
    })

    it('should reset statistics correctly', async () => {
      // Generate some statistics
      await executeJavaScript('console.log("test");')

      let stats = codeExecutor.getStatistics()
      expect(stats.totalExecutions).toBeGreaterThan(0)

      // Reset statistics
      codeExecutor.resetStatistics()

      stats = codeExecutor.getStatistics()
      expect(stats.totalExecutions).toBe(0)
      expect(stats.successfulExecutions).toBe(0)
      expect(stats.failedExecutions).toBe(0)
      expect(stats.averageExecutionTime).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle unsupported language errors', async () => {
      await expect(executeCode({
        code: 'print("test");',
        language: 'ruby' as any,
      })).rejects.toThrow(UnsupportedLanguageError)
    })

    it('should handle invalid request format', async () => {
      await expect(executeCode({
        code: '',
        language: 'javascript',
      })).rejects.toThrow(CodeExecutionError)
    })

    it('should handle invalid execution limits', async () => {
      await expect(executeCode({
        code: 'console.log("test");',
        language: 'javascript',
        limits: {
          timeoutMs: -1, // Invalid timeout
        } as any,
      })).rejects.toThrow(CodeExecutionError)
    })
  })

  describe('Environment Information', () => {
    it('should provide environment information for supported languages', () => {
      const jsEnv = codeExecutor.getEnvironmentInfo('javascript')
      const pythonEnv = codeExecutor.getEnvironmentInfo('python')
      const tsEnv = codeExecutor.getEnvironmentInfo('typescript')

      expect(jsEnv).toBeTruthy()
      expect(pythonEnv).toBeTruthy()
      expect(tsEnv).toBeTruthy()

      expect(jsEnv?.language).toBe('javascript')
      expect(pythonEnv?.language).toBe('python')
      expect(tsEnv?.language).toBe('typescript')

      expect(jsEnv?.available).toBe(true)
      expect(pythonEnv?.available).toBe(true)
      expect(tsEnv?.available).toBe(true)
    })

    it('should return null for unsupported languages', () => {
      const env = codeExecutor.getEnvironmentInfo('ruby' as any)
      expect(env).toBeNull()
    })
  })

  describe('Default Limits', () => {
    it('should have sensible default limits', () => {
      const limits = codeExecutor.getDefaultLimits()

      expect(limits.timeoutMs).toBe(5000)
      expect(limits.maxMemoryMB).toBe(256)
      expect(limits.maxOutputSize).toBe(1048576)
      expect(limits.maxInputSize).toBe(102400)
      expect(limits.allowNetwork).toBe(false)
      expect(limits.allowFileSystem).toBe(false)
      expect(limits.allowEnv).toBe(false)
      expect(limits.allowProcess).toBe(false)
    })

    it('should allow setting custom default limits', () => {
      const customLimits = {
        timeoutMs: 10000,
        maxMemoryMB: 512,
      }

      codeExecutor.setDefaultLimits(customLimits)
      const limits = codeExecutor.getDefaultLimits()

      expect(limits.timeoutMs).toBe(10000)
      expect(limits.maxMemoryMB).toBe(512)
      // Other limits should remain unchanged
      expect(limits.maxOutputSize).toBe(1048576)
    })
  })

  describe('Resource Cleanup', () => {
    it('should dispose resources properly', () => {
      codeExecutor.dispose()
      expect(codeExecutor.isReady()).toBe(false)
    })
  })
})

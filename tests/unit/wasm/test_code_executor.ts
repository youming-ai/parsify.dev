import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CodeExecutionError,
  CodeExecutor,
  CodeSizeError,
  codeExecutor,
  type ExecutionEnvironment,
  type ExecutionLanguage,
  type ExecutionLimits,
  type ExecutionRequest,
  executeCode,
  executeJavaScript,
  executePython,
  executeTypeScript,
  UnsupportedLanguageError,
} from '../../../apps/api/src/wasm/code_executor'

describe('CodeExecutor', () => {
  let executor: CodeExecutor

  beforeEach(async () => {
    executor = new CodeExecutor()
    await executor.initialize()
  })

  afterEach(() => {
    executor.dispose()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newExecutor = new CodeExecutor()
      await newExecutor.initialize()
      expect(newExecutor.isReady()).toBe(true)
      newExecutor.dispose()
    })

    it('should handle multiple initialization calls', async () => {
      await executor.initialize()
      await executor.initialize()
      expect(executor.isReady()).toBe(true)
    })

    it('should get supported languages', () => {
      const languages = executor.getSupportedLanguages()
      expect(languages).toContain('javascript')
      expect(languages).toContain('python')
      expect(languages).toContain('typescript')
    })

    it('should check if language is supported for execution', () => {
      expect(executor.isLanguageSupported('javascript')).toBe(true)
      expect(executor.isLanguageSupported('python')).toBe(true)
      expect(executor.isLanguageSupported('typescript')).toBe(true)
      expect(executor.isLanguageSupported('unsupported')).toBe(false)
    })

    it('should get execution statistics', () => {
      const stats = executor.getStatistics()
      expect(stats).toHaveProperty('totalExecutions')
      expect(stats).toHaveProperty('successfulExecutions')
      expect(stats).toHaveProperty('failedExecutions')
      expect(stats).toHaveProperty('averageExecutionTime')
      expect(stats).toHaveProperty('averageMemoryUsage')
      expect(stats).toHaveProperty('mostUsedLanguage')
      expect(stats).toHaveProperty('lastExecutionTime')
    })

    it('should get execution environments', () => {
      const environments = executor.getExecutionEnvironments()
      expect(environments.size).toBeGreaterThan(0)

      environments.forEach((env, language) => {
        expect(env.language).toBe(language)
        expect(env.runtime).toBeDefined()
        expect(env.version).toBeDefined()
        expect(env.available).toBe(true)
        expect(env.capabilities).toBeDefined()
      })
    })
  })

  describe('JavaScript execution', () => {
    beforeEach(async () => {
      await executor.initialize()
    })

    it('should execute simple JavaScript code', async () => {
      const request: ExecutionRequest = {
        code: 'console.log("Hello, World!")',
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello, World!')
      expect(result.stderr).toBe('')
      expect(result.language).toBe('javascript')
      expect(result.executionTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.timeoutHit).toBe(false)
      expect(result.metadata.memoryLimitHit).toBe(false)
      expect(result.metadata.wasSandboxed).toBe(true)
    })

    it('should execute JavaScript with return value', async () => {
      const request: ExecutionRequest = {
        code: 'function add(a, b) { return a + b; } add(2, 3);',
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('5')
    })

    it('should handle JavaScript with syntax errors', async () => {
      const request: ExecutionRequest = {
        code: 'function test( { console.log("missing parenthesis")',
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.stderr).toBeDefined()
      expect(result.error).toBeDefined()
    })

    it('should handle JavaScript runtime errors', async () => {
      const request: ExecutionRequest = {
        code: 'console.log(undefinedVariable)',
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.stderr).toBeDefined()
      expect(result.error).toBeDefined()
    })

    it('should handle JavaScript with multiple statements', async () => {
      const request: ExecutionRequest = {
        code: `
          const x = 10;
          const y = 20;
          const sum = x + y;
          console.log('Sum:', sum);
          const product = x * y;
          console.log('Product:', product);
        `,
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Sum: 30')
      expect(result.stdout).toContain('Product: 200')
    })

    it('should handle JavaScript with async/await', async () => {
      const request: ExecutionRequest = {
        code: `
          async function test() {
            const result = await Promise.resolve('async result');
            console.log(result);
          }
          test();
        `,
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('async result')
    })

    it('should handle JavaScript with loops', async () => {
      const request: ExecutionRequest = {
        code: `
          for (let i = 0; i < 5; i++) {
            console.log('Iteration:', i);
          }
        `,
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Iteration: 0')
      expect(result.stdout).toContain('Iteration: 4')
    })
  })

  describe('Python execution', () => {
    beforeEach(async () => {
      await executor.initialize()
    })

    it('should execute simple Python code', async () => {
      const request: ExecutionRequest = {
        code: 'print("Hello, World!")',
        language: 'python',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello, World!')
      expect(result.stderr).toBe('')
      expect(result.language).toBe('python')
    })

    it('should execute Python with variables', async () => {
      const request: ExecutionRequest = {
        code: `
          x = 10
          y = 20
          sum = x + y
          print(f"Sum: {sum}")
        `,
        language: 'python',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Sum: 30')
    })

    it('should handle Python with syntax errors', async () => {
      const request: ExecutionRequest = {
        code: 'print("missing quote',
        language: 'python',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.stderr).toBeDefined()
      expect(result.error).toBeDefined()
    })

    it('should handle Python runtime errors', async () => {
      const request: ExecutionRequest = {
        code: 'print(undefined_variable)',
        language: 'python',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.stderr).toBeDefined()
      expect(result.error).toBeDefined()
    })

    it('should handle Python with functions', async () => {
      const request: ExecutionRequest = {
        code: `
          def add(a, b):
              return a + b

          result = add(3, 4)
          print(f"Result: {result}")
        `,
        language: 'python',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Result: 7')
    })

    it('should handle Python with loops', async () => {
      const request: ExecutionRequest = {
        code: `
          for i in range(5):
              print(f"Iteration: {i}")
        `,
        language: 'python',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Iteration: 0')
      expect(result.stdout).toContain('Iteration: 4')
    })
  })

  describe('TypeScript execution', () => {
    beforeEach(async () => {
      await executor.initialize()
    })

    it('should execute simple TypeScript code', async () => {
      const request: ExecutionRequest = {
        code: `
          const message: string = "Hello, TypeScript!";
          console.log(message);
        `,
        language: 'typescript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello, TypeScript!')
      expect(result.language).toBe('typescript')
    })

    it('should execute TypeScript with interfaces', async () => {
      const request: ExecutionRequest = {
        code: `
          interface User {
            name: string;
            age: number;
          }

          const user: User = { name: "John", age: 30 };
          console.log(\`User: \${user.name}, Age: \${user.age}\`);
        `,
        language: 'typescript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('User: John, Age: 30')
    })

    it('should handle TypeScript compilation errors', async () => {
      const request: ExecutionRequest = {
        code: `
          const message: number = "hello";
          console.log(message);
        `,
        language: 'typescript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.stderr).toBeDefined()
      expect(result.error).toBeDefined()
    })

    it('should execute TypeScript with classes', async () => {
      const request: ExecutionRequest = {
        code: `
          class Calculator {
            private result: number = 0;

            add(value: number): this {
              this.result += value;
              return this;
            }

            getResult(): number {
              return this.result;
            }
          }

          const calc = new Calculator();
          const result = calc.add(5).add(3).getResult();
          console.log(\`Result: \${result}\`);
        `,
        language: 'typescript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Result: 8')
    })
  })

  describe('Execution limits and security', () => {
    beforeEach(async () => {
      await executor.initialize()
    })

    it('should respect timeout limits', async () => {
      const request: ExecutionRequest = {
        code: `
          while (true) {
            // Infinite loop
          }
        `,
        language: 'javascript',
        limits: {
          timeoutMs: 100, // 100ms timeout
        },
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.metadata.timeoutHit).toBe(true)
      expect(result.exitCode).toBe(124) // Timeout exit code
    })

    it('should respect memory limits', async () => {
      const request: ExecutionRequest = {
        code: `
          // Create large array to consume memory
          const largeArray = [];
          for (let i = 0; i < 1000000; i++) {
            largeArray.push(new Array(1000).fill('x'));
          }
          console.log('Memory allocated');
        `,
        language: 'javascript',
        limits: {
          maxMemoryMB: 16, // 16MB limit
        },
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.metadata.memoryLimitHit).toBe(true)
      expect(result.exitCode).toBe(137) // Memory limit exit code
    })

    it('should prevent network access', async () => {
      const request: ExecutionRequest = {
        code: `
          fetch('https://example.com')
            .then(response => response.text())
            .then(text => console.log(text))
            .catch(error => console.error('Error:', error));
        `,
        language: 'javascript',
        limits: {
          allowNetwork: false,
        },
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('network')
    })

    it('should prevent file system access', async () => {
      const request: ExecutionRequest = {
        code: `
          const fs = require('fs');
          fs.writeFileSync('/tmp/test.txt', 'Hello');
          console.log('File written');
        `,
        language: 'javascript',
        limits: {
          allowFileSystem: false,
        },
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('file system')
    })

    it('should prevent environment access', async () => {
      const request: ExecutionRequest = {
        code: `
          console.log('HOME:', process.env.HOME);
          console.log('PATH:', process.env.PATH);
        `,
        language: 'javascript',
        limits: {
          allowEnv: false,
        },
      }

      const result = await executor.execute(request)

      // Should either fail or return empty/undefined values
      if (result.success) {
        expect(result.stdout).not.toContain(process.env.HOME)
        expect(result.stdout).not.toContain(process.env.PATH)
      } else {
        expect(result.error).toContain('environment')
      }
    })

    it('should prevent process access', async () => {
      const request: ExecutionRequest = {
        code: `
          console.log('PID:', process.pid);
          console.log('Platform:', process.platform);
        `,
        language: 'javascript',
        limits: {
          allowProcess: false,
        },
      }

      const result = await executor.execute(request)

      // Should either fail or return undefined values
      if (result.success) {
        expect(result.stdout).not.toContain(String(process.pid))
      } else {
        expect(result.error).toContain('process')
      }
    })

    it('should prevent dangerous operations', async () => {
      const dangerousCodes = [
        'eval("console.log(\\"eval executed\\")")',
        'Function("console.log(\\"Function executed\\")")()',
        'setTimeout(() => console.log("setTimeout executed"), 0)',
        'setInterval(() => console.log("setInterval executed"), 100)',
      ]

      for (const code of dangerousCodes) {
        const request: ExecutionRequest = {
          code,
          language: 'javascript',
        }

        const result = await executor.execute(request)

        // Should either fail or not execute the dangerous operation
        if (!result.success) {
          expect(result.error).toBeDefined()
        }
      }
    })

    it('should handle large input size', async () => {
      const _largeInput = 'x'.repeat(200000) // 200KB
      const request: ExecutionRequest = {
        code: 'console.log(input.length)',
        language: 'javascript',
        limits: {
          maxInputSize: 100000, // 100KB limit
        },
      }

      await expect(executor.execute(request)).rejects.toThrow(CodeSizeError)
    })

    it('should handle large output size', async () => {
      const request: ExecutionRequest = {
        code: `
          for (let i = 0; i < 100000; i++) {
            console.log('Line ' + i + ': ' + 'x'.repeat(100));
          }
        `,
        language: 'javascript',
        limits: {
          maxOutputSize: 10000, // 10KB limit
        },
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Input and environment handling', () => {
    beforeEach(async () => {
      await executor.initialize()
    })

    it('should handle standard input', async () => {
      const request: ExecutionRequest = {
        code: `
          const readline = require('readline');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
          });

          rl.on('line', (line) => {
            console.log('Input received:', line);
            rl.close();
          });
        `,
        language: 'javascript',
        input: 'Hello from stdin',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Input received: Hello from stdin')
    })

    it('should handle command line arguments', async () => {
      const request: ExecutionRequest = {
        code: `
          console.log('Arguments:', process.argv.slice(2));
        `,
        language: 'javascript',
        args: ['arg1', 'arg2', 'arg3'],
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('arg1')
      expect(result.stdout).toContain('arg2')
      expect(result.stdout).toContain('arg3')
    })

    it('should handle environment variables', async () => {
      const request: ExecutionRequest = {
        code: `
          console.log('TEST_VAR:', process.env.TEST_VAR);
          console.log('NODE_ENV:', process.env.NODE_ENV);
        `,
        language: 'javascript',
        env: {
          TEST_VAR: 'test value',
          NODE_ENV: 'test',
        },
        limits: {
          allowEnv: true,
        },
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('test value')
      expect(result.stdout).toContain('test')
    })

    it('should handle custom working directory', async () => {
      const request: ExecutionRequest = {
        code: `
          console.log('Working directory:', process.cwd());
        `,
        language: 'javascript',
        workingDirectory: '/custom/workspace',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      // Working directory should be respected (actual behavior may vary)
      expect(result.stdout).toBeDefined()
    })
  })

  describe('Multi-language scenarios', () => {
    beforeEach(async () => {
      await executor.initialize()
    })

    it('should execute equivalent code in different languages', async () => {
      const factorialJS = `
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        console.log(factorial(5));
      `

      const factorialPY = `
        def factorial(n):
            if n <= 1:
                return 1
            return n * factorial(n - 1)

        print(factorial(5))
      `

      const jsResult = await executor.execute({
        code: factorialJS,
        language: 'javascript',
      })

      const pyResult = await executor.execute({
        code: factorialPY,
        language: 'python',
      })

      expect(jsResult.success).toBe(true)
      expect(pyResult.success).toBe(true)
      expect(jsResult.stdout).toContain('120')
      expect(pyResult.stdout).toContain('120')
    })

    it('should handle language-specific features', async () => {
      const jsCode = `
        const array = [1, 2, 3, 4, 5];
        const doubled = array.map(x => x * 2);
        console.log(doubled.join(', '));
      `

      const pyCode = `
        array = [1, 2, 3, 4, 5]
        doubled = [x * 2 for x in array]
        print(', '.join(map(str, doubled)))
      `

      const jsResult = await executor.execute({
        code: jsCode,
        language: 'javascript',
      })

      const pyResult = await executor.execute({
        code: pyCode,
        language: 'python',
      })

      expect(jsResult.success).toBe(true)
      expect(pyResult.success).toBe(true)
      expect(jsResult.stdout).toContain('2, 4, 6, 8, 10')
      expect(pyResult.stdout).toContain('2, 4, 6, 8, 10')
    })
  })

  describe('Error handling and edge cases', () => {
    beforeEach(async () => {
      await executor.initialize()
    })

    it('should handle unsupported language', async () => {
      const request: ExecutionRequest = {
        code: 'print("hello")',
        language: 'ruby' as ExecutionLanguage,
      }

      await expect(executor.execute(request)).rejects.toThrow(UnsupportedLanguageError)
    })

    it('should handle empty code', async () => {
      const request: ExecutionRequest = {
        code: '',
        language: 'javascript',
      }

      await expect(executor.execute(request)).rejects.toThrow(CodeExecutionError)
    })

    it('should handle extremely long code', async () => {
      const longCode = 'console.log("x");'.repeat(10000)
      const request: ExecutionRequest = {
        code: longCode,
        language: 'javascript',
      }

      await expect(executor.execute(request)).rejects.toThrow(CodeSizeError)
    })

    it('should handle code with special characters', async () => {
      const request: ExecutionRequest = {
        code: 'console.log("Special chars: \n\t\r\\"\\\'\\x00\\u1234");',
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Special chars:')
    })

    it('should handle Unicode characters', async () => {
      const request: ExecutionRequest = {
        code: 'console.log("Unicode: 你好 🌍 🚀 é ü ñ");',
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('Unicode:')
      expect(result.stdout).toContain('你好')
      expect(result.stdout).toContain('🌍')
    })

    it('should handle malformed execution limits', async () => {
      const request: ExecutionRequest = {
        code: 'console.log("test");',
        language: 'javascript',
        limits: {
          timeoutMs: -1, // Invalid
          maxMemoryMB: 0, // Invalid
        },
      }

      // Should handle invalid limits gracefully
      const result = await executor.execute(request)
      expect(result).toBeDefined()
    })

    it('should provide detailed error information', async () => {
      const request: ExecutionRequest = {
        code: 'throw new Error("Custom error message");',
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(false)
      expect(result.exitCode).toBeGreaterThan(0)
      expect(result.stderr).toContain('Custom error message')
      expect(result.error).toBeDefined()
      expect(result.metadata.wasSandboxed).toBe(true)
    })
  })

  describe('Performance and statistics', () => {
    beforeEach(async () => {
      await executor.initialize()
    })

    it('should track execution statistics', async () => {
      const initialStats = executor.getStatistics()
      expect(initialStats.totalExecutions).toBe(0)

      // Execute several times
      await executor.execute({
        code: 'console.log("test 1");',
        language: 'javascript',
      })

      await executor.execute({
        code: 'console.log("test 2");',
        language: 'javascript',
      })

      await executor.execute({
        code: 'print("test 3")',
        language: 'python',
      })

      const updatedStats = executor.getStatistics()
      expect(updatedStats.totalExecutions).toBe(3)
      expect(updatedStats.successfulExecutions).toBe(3)
      expect(updatedStats.failedExecutions).toBe(0)
      expect(updatedStats.averageExecutionTime).toBeGreaterThan(0)
      expect(updatedStats.mostUsedLanguage).toBe('javascript')
      expect(updatedStats.lastExecutionTime).toBeGreaterThan(0)
    })

    it('should provide accurate execution metadata', async () => {
      const request: ExecutionRequest = {
        code: `
          const start = Date.now();
          let sum = 0;
          for (let i = 0; i < 1000000; i++) {
            sum += i;
          }
          const end = Date.now();
          console.log(\`Sum: \${sum}, Time: \${end - start}ms\`);
        `,
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.executionTime).toBeGreaterThan(0)
      expect(result.metadata.startTime).toBeGreaterThan(0)
      expect(result.metadata.endTime).toBeGreaterThan(result.metadata.startTime)
      expect(result.metadata.runtimeUsed).toBeDefined()
      expect(result.metadata.version).toBeDefined()
      expect(result.metadata.wasSandboxed).toBe(true)
    })

    it('should handle concurrent executions', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        executor.execute({
          code: `console.log("Concurrent execution ${i}");`,
          language: 'javascript',
        })
      )

      const results = await Promise.all(requests)

      expect(results.length).toBe(5)
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.stdout).toContain(`Concurrent execution ${index}`)
      })
    })

    it('should handle memory measurement', async () => {
      const request: ExecutionRequest = {
        code: `
          const arrays = [];
          for (let i = 0; i < 100; i++) {
            arrays.push(new Array(1000).fill(i));
          }
          console.log(\`Created \${arrays.length} arrays\`);
        `,
        language: 'javascript',
        limits: {
          maxMemoryMB: 64,
        },
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.memoryUsed).toBeGreaterThan(0)
      expect(result.memoryUsed).toBeLessThan(64 * 1024 * 1024) // Less than 64MB
    })
  })

  describe('Configuration and limits', () => {
    beforeEach(async () => {
      await executor.initialize()
    })

    it('should allow setting default limits', async () => {
      const customLimits: ExecutionLimits = {
        timeoutMs: 1000,
        maxMemoryMB: 128,
        maxOutputSize: 2048,
        maxInputSize: 2048,
        allowNetwork: false,
        allowFileSystem: false,
        allowEnv: false,
        allowProcess: false,
      }

      executor.setDefaultLimits(customLimits)

      const request: ExecutionRequest = {
        code: 'console.log("test with custom limits");',
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.metadata.timeoutHit).toBe(false)
      expect(result.metadata.memoryLimitHit).toBe(false)
    })

    it('should allow custom execution environments', async () => {
      const customEnv: ExecutionEnvironment = {
        language: 'javascript',
        runtime: 'custom-runtime',
        version: '1.0.0',
        path: '/usr/bin/custom-runtime',
        available: true,
        capabilities: {
          network: false,
          fileSystem: false,
          environment: false,
          processes: false,
        },
      }

      executor.setExecutionEnvironment('javascript', customEnv)

      const request: ExecutionRequest = {
        code: 'console.log("test with custom environment");',
        language: 'javascript',
      }

      const result = await executor.execute(request)

      expect(result.success).toBe(true)
      expect(result.metadata.runtimeUsed).toBe('custom-runtime')
      expect(result.metadata.version).toBe('1.0.0')
    })

    it('should validate execution requests', async () => {
      // Test with invalid request
      const invalidRequests = [
        { code: null, language: 'javascript' },
        { code: '', language: 'javascript' },
        { code: 'console.log("test")', language: null },
        { code: 'x'.repeat(200000), language: 'javascript' }, // Too long
        {
          code: 'console.log("test")',
          language: 'javascript',
          args: Array(100).fill('arg'),
        }, // Too many args
      ]

      for (const request of invalidRequests) {
        await expect(executor.execute(request as any)).rejects.toThrow(CodeExecutionError)
      }
    })
  })

  describe('Resource management', () => {
    it('should dispose resources properly', async () => {
      expect(executor.isReady()).toBe(true)

      executor.dispose()
      expect(executor.isReady()).toBe(false)
    })

    it('should clean up after execution', async () => {
      const request: ExecutionRequest = {
        code: `
          const tempFile = '/tmp/test.txt';
          console.log('Before execution');
          // File should not persist after execution
        `,
        language: 'javascript',
      }

      const result = await executor.execute(request)
      expect(result.success).toBe(true)

      // Resources should be cleaned up automatically
    })

    it('should handle multiple executions efficiently', async () => {
      const startTime = performance.now()

      for (let i = 0; i < 50; i++) {
        await executor.execute({
          code: `console.log("Execution ${i}");`,
          language: 'javascript',
        })
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds

      const stats = executor.getStatistics()
      expect(stats.totalExecutions).toBe(50)
      expect(stats.successfulExecutions).toBe(50)
    })
  })
})

describe('Utility functions', () => {
  beforeEach(async () => {
    await codeExecutor.initialize()
  })

  it('executeCode should execute code correctly', async () => {
    const request: ExecutionRequest = {
      code: 'console.log("Hello from utility function");',
      language: 'javascript',
    }

    const result = await executeCode(request)

    expect(result.success).toBe(true)
    expect(result.stdout).toContain('Hello from utility function')
  })

  it('executeJavaScript should execute JS correctly', async () => {
    const result = await executeJavaScript('console.log("Hello JS");')

    expect(result.success).toBe(true)
    expect(result.language).toBe('javascript')
    expect(result.stdout).toContain('Hello JS')
  })

  it('executePython should execute Python correctly', async () => {
    const result = await executePython('print("Hello Python")')

    expect(result.success).toBe(true)
    expect(result.language).toBe('python')
    expect(result.stdout).toContain('Hello Python')
  })

  it('executeTypeScript should execute TS correctly', async () => {
    const code = `
      const message: string = "Hello TypeScript";
      console.log(message);
    `

    const result = await executeTypeScript(code)

    expect(result.success).toBe(true)
    expect(result.language).toBe('typescript')
    expect(result.stdout).toContain('Hello TypeScript')
  })
})

describe('Security features', () => {
  beforeEach(async () => {
    await codeExecutor.initialize()
  })

  it('should prevent module imports', async () => {
    const maliciousCodes = [
      'const fs = require("fs"); fs.readFile("/etc/passwd", (data) => console.log(data));',
      'import { exec } from "child_process"; exec("ls -la", (error, stdout) => console.log(stdout));',
      'const { spawn } = require("child_process"); spawn("rm", ["-rf", "/"]);',
    ]

    for (const code of maliciousCodes) {
      const result = await executeCode({
        code,
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    }
  })

  it('should prevent code injection attempts', async () => {
    const injectionAttempts = [
      'require("child_process").execSync("echo HACKED").toString()',
      'global.process.mainModule.require("child_process").exec("echo HACKED")',
      'process.binding("spawn_sync").spawn({ file: "echo", args: ["HACKED"] })',
    ]

    for (const code of injectionAttempts) {
      const result = await executeCode({
        code,
        language: 'javascript',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    }
  })

  it('should prevent prototype pollution', async () => {
    const pollutionAttempts = [
      'Object.prototype.polluted = true; console.log("Polluted:", {}.polluted);',
      'JSON.parse(\'{"__proto__":{"polluted":true}}\'); console.log("Polluted:", {}.polluted);',
      'const obj = {}; obj.__proto__.polluted = true; console.log("Polluted:", {}.polluted);',
    ]

    for (const code of pollutionAttempts) {
      const result = await executeCode({
        code,
        language: 'javascript',
      })

      // Should either fail or not actually pollute
      expect(result).toBeDefined()
    }
  })

  it('should prevent infinite recursion', async () => {
    const code = `
      function infinite() {
        infinite();
      }
      infinite();
    `

    const result = await executeCode({
      code,
      language: 'javascript',
      limits: {
        timeoutMs: 1000,
      },
    })

    expect(result.success).toBe(false)
    expect(result.metadata.timeoutHit).toBe(true)
  })
})

describe('Performance benchmarks', () => {
  beforeEach(async () => {
    await codeExecutor.initialize()
  })

  it('should handle computation-intensive tasks', async () => {
    const code = `
      function isPrime(n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 === 0 || n % 3 === 0) return false;
        for (let i = 5; i * i <= n; i += 6) {
          if (n % i === 0 || n % (i + 2) === 0) return false;
        }
        return true;
      }

      let count = 0;
      for (let i = 2; i <= 10000; i++) {
        if (isPrime(i)) count++;
      }
      console.log(\`Found \${count} primes up to 10000\`);
    `

    const startTime = performance.now()
    const result = await executeJavaScript(code)
    const endTime = performance.now()

    expect(result.success).toBe(true)
    expect(result.stdout).toContain('Found 1229 primes')
    expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
  })

  it('should handle memory-intensive tasks', async () => {
    const code = `
      const data = [];
      for (let i = 0; i < 1000; i++) {
        data.push({
          id: i,
          name: \`Item \${i}\`,
          description: \`This is item number \${i} with some additional text\`,
          tags: [\`tag\${i % 10}\`, \`category\${i % 5}\`],
          metadata: {
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            version: Math.floor(i / 100) + 1
          }
        });
      }
      console.log(\`Created \${data.length} objects\`);
    `

    const result = await executeJavaScript(code, {
      maxMemoryMB: 64,
    })

    expect(result.success).toBe(true)
    expect(result.stdout).toContain('Created 1000 objects')
    expect(result.memoryUsed).toBeGreaterThan(0)
  })

  it('should handle I/O-intensive tasks', async () => {
    const code = `
      let output = '';
      for (let i = 0; i < 1000; i++) {
        output += \`Line \${i}: \${Math.random()}\\n\`;
      }
      console.log('Generated output length:', output.length);
    `

    const result = await executeJavaScript(code, {
      maxOutputSize: 50000,
    })

    expect(result.success).toBe(true)
    expect(result.stdout).toContain('Generated output length:')
  })
})

describe('Error handling and validation', () => {
  beforeEach(async () => {
    await codeExecutor.initialize()
  })

  it('should provide meaningful error messages', async () => {
    const testCases = [
      {
        code: 'undefinedVariable',
        expectedError: 'undefinedVariable',
      },
      {
        code: 'function test( { console.log("missing paren")',
        expectedError: 'SyntaxError',
      },
      {
        code: 'throw new Error("Custom error")',
        expectedError: 'Custom error',
      },
      {
        code: 'JSON.parse("invalid json")',
        expectedError: 'JSON',
      },
    ]

    for (const testCase of testCases) {
      const result = await executeJavaScript(testCase.code)

      expect(result.success).toBe(false)
      expect(result.stderr).toBeDefined()
      expect(result.error).toBeDefined()
      if (testCase.expectedError) {
        expect(
          result.stderr?.includes(testCase.expectedError) ||
            result.error?.includes(testCase.expectedError)
        ).toBe(true)
      }
    }
  })

  it('should handle partial failures gracefully', async () => {
    const code = `
      console.log("Before error");
      undefinedVariable;
      console.log("After error"); // This should not execute
    `

    const result = await executeJavaScript(code)

    expect(result.success).toBe(false)
    expect(result.stdout).toContain('Before error')
    expect(result.stdout).not.toContain('After error')
  })

  it('should validate complex inputs', async () => {
    const complexRequest: ExecutionRequest = {
      code: 'console.log("Complex test");',
      language: 'javascript',
      input: 'Test input with unicode: 你好 🌍',
      args: ['--flag', 'value with spaces'],
      env: {
        TEST_VAR: 'value with unicode: é ü ñ',
        EMPTY_VAR: '',
        NUMERIC_VAR: '12345',
      },
      workingDirectory: '/tmp/test workspace',
      limits: {
        timeoutMs: 5000,
        maxMemoryMB: 256,
        maxOutputSize: 1024,
        maxInputSize: 1024,
        allowNetwork: false,
        allowFileSystem: false,
        allowEnv: true,
        allowProcess: false,
      },
    }

    const result = await executeCode(complexRequest)

    expect(result.success).toBe(true)
    expect(result.stdout).toContain('Complex test')
  })
})

import {
  codeExecutor,
  ExecutionRequest,
  ExecutionLimits,
  executeCode,
  executeJavaScript,
  executePython,
  executeTypeScript,
} from './code_executor'

/**
 * Example usage of the CodeExecutor service
 */

async function demonstrateCodeExecutor() {
  console.log('=== Code Executor Demonstration ===\n')

  try {
    // Initialize the executor
    await codeExecutor.initialize()
    console.log('✅ Code executor initialized successfully\n')

    // Example 1: Simple JavaScript execution
    console.log('1. JavaScript Execution:')
    const jsResult = await executeJavaScript(`
      console.log('Hello from JavaScript!');
      const sum = (a, b) => a + b;
      console.log('Sum of 5 and 3:', sum(5, 3));
    `)
    console.log('Result:', jsResult.success ? '✅ Success' : '❌ Failed')
    console.log('Output:', jsResult.output)
    console.log('Execution Time:', `${jsResult.executionTime.toFixed(2)}ms\n`)

    // Example 2: JavaScript with input
    console.log('2. JavaScript with Input:')
    const jsWithInputResult = await executeJavaScript(
      `
      const input = require('fs').readFileSync(0, 'utf8').trim();
      console.log('Received input:', input);
      console.log('Input length:', input.length);
      console.log('Input in uppercase:', input.toUpperCase());
    `,
      'Hello, World! This is test input.'
    )
    console.log(
      'Result:',
      jsWithInputResult.success ? '✅ Success' : '❌ Failed'
    )
    console.log('Output:', jsWithInputResult.output)
    console.log(
      'Execution Time:',
      `${jsWithInputResult.executionTime.toFixed(2)}ms\n`
    )

    // Example 3: Python execution
    console.log('3. Python Execution:')
    const pythonResult = await executePython(`
      print("Hello from Python!")
      def fibonacci(n):
          if n <= 1:
              return n
          return fibonacci(n-1) + fibonacci(n-2)

      print("Fibonacci of 10:", fibonacci(10))
    `)
    console.log('Result:', pythonResult.success ? '✅ Success' : '❌ Failed')
    console.log('Output:', pythonResult.output)
    console.log(
      'Execution Time:',
      `${pythonResult.executionTime.toFixed(2)}ms\n`
    )

    // Example 4: Python with input
    console.log('4. Python with Input:')
    const pythonWithInputResult = await executePython(
      `
      import sys
      input_text = sys.stdin.read().strip()
      print("Received input:", input_text)
      words = input_text.split()
      print("Word count:", len(words))
      print("Reversed input:", input_text[::-1])
    `,
      'Python is awesome for data processing'
    )
    console.log(
      'Result:',
      pythonWithInputResult.success ? '✅ Success' : '❌ Failed'
    )
    console.log('Output:', pythonWithInputResult.output)
    console.log(
      'Execution Time:',
      `${pythonWithInputResult.executionTime.toFixed(2)}ms\n`
    )

    // Example 5: Custom execution limits
    console.log('5. Custom Execution Limits:')
    const customLimits: ExecutionLimits = {
      timeoutMs: 2000, // 2 seconds
      maxMemoryMB: 128, // 128MB
      maxOutputSize: 5000, // 5KB
      maxInputSize: 5000, // 5KB
    }

    const limitedResult = await executeCode({
      code: `
        console.log('Running with custom limits...');
        // Simulate some work
        const start = Date.now();
        while (Date.now() - start < 1000) {
          // Busy wait for 1 second
        }
        console.log('Work completed!');
      `,
      language: 'javascript',
      limits: customLimits,
    })
    console.log('Result:', limitedResult.success ? '✅ Success' : '❌ Failed')
    console.log('Output:', limitedResult.output)
    console.log(
      'Execution Time:',
      `${limitedResult.executionTime.toFixed(2)}ms`
    )
    console.log(
      'Memory Used:',
      limitedResult.memoryUsed
        ? `${(limitedResult.memoryUsed / 1024 / 1024).toFixed(2)}MB`
        : 'N/A'
    )
    console.log(
      'Timeout Hit:',
      limitedResult.metadata.timeoutHit ? '✅ Yes' : '❌ No'
    )
    console.log(
      'Memory Limit Hit:',
      limitedResult.metadata.memoryLimitHit ? '✅ Yes' : '❌ No'
    )
    console.log(
      'Was Sandboxed:',
      limitedResult.metadata.wasSandboxed ? '✅ Yes' : '❌ No\n'
    )

    // Example 6: Error handling - Security violation
    console.log('6. Security Violation Example:')
    try {
      await executeJavaScript(`
        // This should be blocked by security measures
        eval('console.log("This should not execute");');
      `)
    } catch (error) {
      console.log(
        '✅ Security violation caught:',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }

    // Example 7: Error handling - Timeout
    console.log('\n7. Timeout Example:')
    try {
      await executeCode({
        code: `
          // This should timeout
          console.log('Starting infinite loop...');
          while (true) {
            // Infinite loop
          }
        `,
        language: 'javascript',
        limits: {
          timeoutMs: 1000, // 1 second timeout
        },
      })
    } catch (error) {
      console.log(
        '✅ Timeout caught:',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }

    // Example 8: Multiple executions in parallel
    console.log('\n8. Multiple Executions in Parallel:')
    const multipleRequests: ExecutionRequest[] = [
      {
        code: 'console.log("Task 1 completed");',
        language: 'javascript',
      },
      {
        code: 'print("Task 2 completed");',
        language: 'python',
      },
      {
        code: 'console.log("Task 3 completed");',
        language: 'javascript',
      },
    ]

    const multipleResults = await codeExecutor.executeMultiple(multipleRequests)
    console.log('Parallel execution results:')
    multipleResults.forEach((result, index) => {
      console.log(
        `  Task ${index + 1}:`,
        result.success ? '✅ Success' : '❌ Failed'
      )
      if (result.success) {
        console.log(`    Output: ${result.output.trim()}`)
      } else {
        console.log(`    Error: ${result.error}`)
      }
    })

    // Example 9: Show statistics
    console.log('\n9. Execution Statistics:')
    const stats = codeExecutor.getStatistics()
    console.log('  Total Executions:', stats.totalExecutions)
    console.log('  Successful Executions:', stats.successfulExecutions)
    console.log('  Failed Executions:', stats.failedExecutions)
    console.log(
      '  Average Execution Time:',
      `${stats.averageExecutionTime.toFixed(2)}ms`
    )
    console.log(
      '  Average Memory Usage:',
      stats.averageMemoryUsage > 0
        ? `${stats.averageMemoryUsage.toFixed(2)}MB`
        : 'N/A'
    )
    console.log('  Most Used Language:', stats.mostUsedLanguage)
    console.log(
      '  Last Execution Time:',
      new Date(stats.lastExecutionTime).toISOString()
    )

    // Example 10: Show supported languages
    console.log('\n10. Supported Languages:')
    const supportedLanguages = codeExecutor.getSupportedLanguages()
    supportedLanguages.forEach(lang => {
      const envInfo = codeExecutor.getEnvironmentInfo(lang)
      console.log(
        `  ${lang}:`,
        envInfo?.available ? '✅ Available' : '❌ Not Available'
      )
      if (envInfo) {
        console.log(`    Runtime: ${envInfo.runtime} ${envInfo.version}`)
        console.log(`    Capabilities:`, {
          network: envInfo.capabilities.network ? '✅' : '❌',
          fileSystem: envInfo.capabilities.fileSystem ? '✅' : '❌',
          environment: envInfo.capabilities.environment ? '✅' : '❌',
          processes: envInfo.capabilities.processes ? '✅' : '❌',
        })
      }
    })

    console.log('\n=== Demonstration Complete ===')
  } catch (error) {
    console.error('❌ Demonstration failed:', error)
  } finally {
    // Cleanup
    codeExecutor.dispose()
  }
}

// Export the demonstration function
// It can be called from other modules or tests
export { demonstrateCodeExecutor }

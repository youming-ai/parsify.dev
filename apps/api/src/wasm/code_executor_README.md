# Code Execution Service

A secure, WASM-based code execution service that provides sandboxed execution of multiple programming languages with configurable limits and comprehensive security measures.

## Features

- **Secure Sandboxing**: Executes code in isolated WASM environments
- **Multiple Language Support**: JavaScript, TypeScript, Python with more planned
- **Configurable Limits**: Timeout, memory, input/output size restrictions
- **I/O Handling**: stdin/stdout/stderr capture and processing
- **Security Measures**: Input validation, pattern blocking, injection prevention
- **Execution Statistics**: Performance monitoring and usage tracking
- **Parallel Execution**: Batch processing of multiple code snippets
- **TypeScript Support**: Full type definitions and interfaces

## Quick Start

```typescript
import { executeCode, executeJavaScript, executePython } from './code_executor'

// Initialize the executor
await codeExecutor.initialize()

// Execute JavaScript
const jsResult = await executeJavaScript(`
  console.log('Hello from JavaScript!');
  const sum = (a, b) => a + b;
  console.log('Sum of 5 and 3:', sum(5, 3));
`)

// Execute Python with input
const pythonResult = await executePython(`
  import sys
  input_text = sys.stdin.read().strip()
  print('Received:', input_text)
  print('Length:', len(input_text))
`, 'Hello, World!')

// Execute with custom limits
const customResult = await executeCode({
  code: 'console.log("Limited execution");',
  language: 'javascript',
  limits: {
    timeoutMs: 2000,    // 2 seconds
    maxMemoryMB: 128,   // 128MB
    maxOutputSize: 5000 // 5KB
  }
})
```

## API Reference

### Execution Request

```typescript
interface ExecutionRequest {
  code: string                    // Code to execute
  language: ExecutionLanguage     // Target language
  input?: string                  // stdin input
  limits?: ExecutionLimits        // Execution limits
  args?: string[]                 // Command line arguments
  env?: Record<string, string>    // Environment variables
  workingDirectory?: string       // Working directory
}
```

### Execution Limits

```typescript
interface ExecutionLimits {
  timeoutMs: number        // Maximum execution time (100-10000ms, default: 5000)
  maxMemoryMB: number      // Maximum memory usage (16-512MB, default: 256)
  maxOutputSize: number    // Maximum output size (1KB-10MB, default: 1MB)
  maxInputSize: number     // Maximum input size (1KB-1MB, default: 100KB)
  allowNetwork: boolean    // Allow network access (default: false)
  allowFileSystem: boolean // Allow file system access (default: false)
  allowEnv: boolean        // Allow environment access (default: false)
  allowProcess: boolean    // Allow process creation (default: false)
}
```

### Execution Result

```typescript
interface ExecutionResult {
  success: boolean         // Whether execution succeeded
  exitCode: number         // Process exit code
  stdout: string           // Standard output
  stderr: string           // Standard error
  output: string           // Combined stdout + stderr
  error?: string           // Error message if failed
  language: ExecutionLanguage
  executionTime: number    // Execution time in milliseconds
  memoryUsed?: number      // Memory used in bytes
  metadata: {
    startTime: number
    endTime: number
    timeoutHit: boolean
    memoryLimitHit: boolean
    wasSandboxed: boolean
    runtimeUsed: string
    version: string
    processesCreated?: number
    filesCreated?: number
    networkRequests?: number
  }
}
```

## Supported Languages

### JavaScript/TypeScript
- **Runtime**: Node.js 18.0.0
- **Features**: ES2022 support, async/await, modules
- **Security**: Blocks eval, Function constructor, process access, file system

### Python
- **Runtime**: Python 3.11.0
- **Features**: Standard library support, async/await
- **Security**: Blocks eval, exec, file operations, subprocess, network

## Security Features

### Input Validation
- Code size limits (max 100KB)
- Input size limits (max 10KB)
- Argument validation (max 20 args, 1000 chars each)
- Environment variable filtering

### Pattern Blocking
JavaScript blocked patterns:
- `eval()`, `Function()` constructor
- `setTimeout()`, `setInterval()`
- `require()`, `import()`
- `process.*`, `global.*`
- File system operations
- Network operations

Python blocked patterns:
- `eval()`, `exec()`
- `__import__()`, `open()`, `file()`
- `input()`, `raw_input()`
- `os.*`, `sys.*`, `subprocess.*`
- Network operations

### Sandbox Restrictions
- No network access (by default)
- No file system access (by default)
- No environment variable access (by default)
- No process creation (by default)
- Memory and time limits enforced

## Error Handling

The service provides comprehensive error types:

```typescript
// Base execution error
class CodeExecutionError extends Error {
  constructor(message: string, code: string, language?: string)
}

// Specific error types
class TimeoutError extends CodeExecutionError
class MemoryLimitError extends CodeExecutionError
class SecurityError extends CodeExecutionError
class UnsupportedLanguageError extends CodeExecutionError
class CodeSizeError extends CodeExecutionError
```

## Performance Monitoring

```typescript
// Get execution statistics
const stats = codeExecutor.getStatistics()
console.log('Total executions:', stats.totalExecutions)
console.log('Average time:', stats.averageExecutionTime)
console.log('Success rate:', stats.successfulExecutions / stats.totalExecutions)

// Get environment information
const jsEnv = codeExecutor.getEnvironmentInfo('javascript')
console.log('Runtime:', jsEnv.runtime, jsEnv.version)
console.log('Available:', jsEnv.available)
```

## Batch Execution

```typescript
// Execute multiple code snippets in parallel
const requests: ExecutionRequest[] = [
  { code: 'console.log("Task 1");', language: 'javascript' },
  { code: 'print("Task 2");', language: 'python' },
  { code: 'console.log("Task 3");', language: 'javascript' }
]

const results = await codeExecutor.executeMultiple(requests)
results.forEach((result, index) => {
  console.log(`Task ${index + 1}:`, result.success ? '✅' : '❌')
})
```

## Configuration

### Default Limits
```typescript
// Set custom default limits
codeExecutor.setDefaultLimits({
  timeoutMs: 3000,    // 3 seconds
  maxMemoryMB: 128,   // 128MB
  allowNetwork: false // Explicitly disable network
})
```

### Environment Setup
The service automatically detects and configures available runtimes. You can check what's available:

```typescript
const languages = codeExecutor.getSupportedLanguages()
console.log('Supported languages:', languages)

languages.forEach(lang => {
  const env = codeExecutor.getEnvironmentInfo(lang)
  console.log(`${lang}:`, env?.available ? '✅' : '❌')
})
```

## Best Practices

1. **Always Initialize**: Call `await codeExecutor.initialize()` before use
2. **Set Reasonable Limits**: Use appropriate timeouts and memory limits
3. **Validate Input**: Validate user input before execution
4. **Handle Errors**: Catch and handle specific error types
5. **Monitor Performance**: Use statistics to track usage
6. **Cleanup**: Call `codeExecutor.dispose()` when done

## Security Considerations

- The service is designed for code execution, not general computing
- All execution happens in sandboxed environments
- Network and file system access are disabled by default
- Input validation prevents injection attacks
- Resource limits prevent DoS attacks
- Execution time is limited to prevent infinite loops

## Example Use Cases

1. **Code Playground**: Interactive code execution in web apps
2. **Educational Platforms**: Safe code execution for learning
3. **Code Testing**: Automated testing of code snippets
4. **API Endpoints**: Execute user code as part of larger systems
5. **Development Tools**: Code formatting, validation, transformation

## Limitations

- Limited standard library access (security restriction)
- No network access by default
- Maximum execution time of 10 seconds
- Maximum memory usage of 512MB
- Maximum input size of 100KB
- Maximum output size of 10MB

## Future Enhancements

- Additional language support (Rust, Go, Java, C++)
- WASM module integration for better performance
- File system sandbox with temporary directories
- Network sandbox with restricted access
- Real-time execution streaming
- Code profiling and debugging features
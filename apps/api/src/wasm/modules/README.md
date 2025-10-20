# WASM Modules Infrastructure

This directory contains the comprehensive WebAssembly modules infrastructure for the Parsify application. It provides a modular, extensible system for loading, managing, and executing WASM modules with built-in error handling, fallback mechanisms, and performance monitoring.

## Architecture

### Core Components

1. **Interfaces** (`interfaces/`)
   - `wasm-module.interface.ts` - Base interfaces for all WASM modules
   - `json-module.interface.ts` - JSON-specific module interfaces
   - `code-module.interface.ts` - Code execution module interfaces

2. **Registry** (`registry/`)
   - `wasm-module-registry.ts` - Module registration and discovery system

3. **Loaders** (`loaders/`)
   - `wasm-module-loader.ts` - WebAssembly module loading and instantiation

4. **Core** (`core/`)
   - `wasm-error-handler.ts` - Comprehensive error handling and fallback mechanisms

5. **Implementations** (`implementations/`)
   - `json-wasm-module.ts` - JSON processing module implementation
   - `code-wasm-module.ts` - Code execution module implementation

## Features

### Module Management
- **Dynamic Loading**: Load modules on-demand with automatic dependency resolution
- **Registry System**: Centralized module discovery and metadata management
- **Version Management**: Semantic versioning and compatibility checking
- **Caching**: Intelligent module caching for improved performance

### Security & Safety
- **Sandboxed Execution**: Secure execution environment with configurable restrictions
- **Memory Limits**: Configurable memory constraints to prevent resource exhaustion
- **Timeout Protection**: Automatic termination of long-running operations
- **Input Validation**: Comprehensive validation of module inputs and configurations

### Error Handling
- **Graceful Degradation**: Automatic fallback to native implementations when WASM fails
- **Error Classification**: Intelligent categorization of errors by severity and type
- **Recovery Mechanisms**: Automatic retry and recovery strategies
- **Detailed Logging**: Comprehensive error reporting for debugging

### Performance Monitoring
- **Execution Metrics**: Detailed performance statistics and timing information
- **Memory Usage**: Real-time memory monitoring and usage tracking
- **Health Checks**: Continuous monitoring of module health and availability
- **Analytics**: Error frequency and pattern analysis

## Usage

### Basic Module Execution

```typescript
import { wasmModuleManager, initializeWasmModules } from './modules'

// Initialize the WASM module system
await initializeWasmModules({
  preloadModules: ['json-processor', 'code-processor']
})

// Execute JSON formatting
const formatResult = await wasmModuleManager.executeModule('json-processor', {
  json: '{"name":"John","age":30}',
  options: { indent: 2, sortKeys: true }
}, {
  operation: 'format'
})

// Execute code analysis
const analysisResult = await wasmModuleManager.executeModule('code-processor', {
  code: 'function hello() { console.log("Hello"); }',
  language: 'javascript'
}, {
  operation: 'analyze'
})
```

### Convenience Functions

```typescript
import { 
  formatJson, 
  validateJson, 
  formatCode, 
  validateCode, 
  analyzeCode 
} from './modules'

// Format JSON
const formatted = await formatJson('{"name":"John"}', { indent: 2 })

// Validate JSON
const validation = await validateJson('{"name":"John"}')

// Format code
const formattedCode = await formatCode('function hello(){console.log("Hello");}', 'javascript')

// Validate code
const codeValidation = await validateCode('function hello() {}', 'javascript')

// Analyze code
const analysis = await analyzeCode('function hello() {}', 'javascript')
```

### Module Management

```typescript
import { wasmModuleManager } from './modules'

// Get available modules
const modules = await wasmModuleManager.getAvailableModules()

// Search modules
const searchResults = await wasmModuleManager.searchModules('json')

// Get module information
const moduleInfo = await wasmModuleManager.getModuleInfo('json-processor')

// Health check
const health = await wasmModuleManager.healthCheck()

// Get statistics
const stats = await wasmModuleManager.getStatistics()
```

## Module Development

### Creating a Custom Module

1. **Implement the Interface**

```typescript
import { IWasmModule, WasmModuleResult } from '../interfaces/wasm-module.interface'

export class CustomWasmModule implements IWasmModule {
  get id(): string { return 'custom-module' }
  get name(): string { return 'Custom Module' }
  get version(): string { return '1.0.0' }
  // ... implement other required methods

  async execute(input: any, options?: any): Promise<WasmModuleResult> {
    // Implementation here
  }
}
```

2. **Register the Module**

```typescript
import { wasmModuleRegistry } from '../modules'

const customModule = new CustomWasmModule()
await wasmModuleRegistry.registerModule(customModule)
```

3. **Use the Module**

```typescript
const result = await wasmModuleManager.executeModule('custom-module', inputData, options)
```

### WASM Integration

When actual WASM implementations are available, the infrastructure will automatically:

1. Load WASM binaries from the specified source
2. Create appropriate import objects with required functions
3. Instantiate the WASM module with proper error handling
4. Provide fallback to native implementations if WASM fails

## Configuration

### Module Loader Configuration

```typescript
import { wasmModuleLoader } from './modules'

wasmModuleLoader.setDefaultConfig({
  maxMemory: 128 * 1024 * 1024, // 128MB
  timeout: 60000, // 60 seconds
  debug: false,
  logLevel: 'error'
})
```

### Module Configuration

```typescript
const result = await wasmModuleManager.executeModule('json-processor', {
  json: '{"test": true}'
}, {
  config: {
    maxMemory: 64 * 1024 * 1024,
    timeout: 30000,
    debug: true
  }
})
```

## Error Handling

The infrastructure provides comprehensive error handling with automatic fallbacks:

```typescript
try {
  const result = await formatJson(invalidJson)
  if (!result.success) {
    console.log('Error occurred but fallback was provided:', result.error)
    console.log('Fallback result:', result.data)
  }
} catch (error) {
  console.error('Fatal error:', error)
}
```

## Performance Monitoring

Monitor module performance and health:

```typescript
const health = await wasmModuleManager.healthCheck()
console.log('System health:', health.status)

const stats = await wasmModuleManager.getStatistics()
console.log('Total modules:', stats.registry.totalModules)
console.log('Loaded modules:', stats.loader.loadedModules)
console.log('Error rate:', stats.errors.errorsBySeverity)
```

## Security Considerations

- All code execution is sandboxed with configurable restrictions
- Memory limits prevent resource exhaustion attacks
- Timeout protection against infinite loops or blocking operations
- Input validation prevents malicious data injection
- Network and file system access are restricted by default

## Future Enhancements

- **Additional Languages**: Support for more programming languages
- **Advanced Caching**: Persistent caching strategies
- **Plugin System**: Dynamic plugin loading and management
- **Performance Optimization**: JIT compilation and optimization
- **Enhanced Security**: Additional sandboxing and security features
- **Monitoring Dashboard**: Real-time monitoring and alerting

## Troubleshooting

### Common Issues

1. **Module Not Found**
   - Ensure the module is registered in the registry
   - Check for correct module ID

2. **WASM Loading Failed**
   - Verify WASM binary is accessible and valid
   - Check browser/WebAssembly support
   - Review error logs for specific issues

3. **Execution Timeout**
   - Increase timeout configuration
   - Check for infinite loops in code
   - Optimize module performance

4. **Memory Limits Exceeded**
   - Increase memory limits in configuration
   - Optimize data processing
   - Process data in smaller chunks

### Debug Mode

Enable debug mode for detailed logging:

```typescript
await initializeWasmModules({
  defaultConfig: {
    debug: true,
    logLevel: 'debug'
  }
})
```

## Contributing

When adding new modules or features:

1. Follow the existing interface patterns
2. Implement comprehensive error handling
3. Add appropriate tests
4. Update documentation
5. Consider security implications
6. Ensure backward compatibility

## License

This WASM modules infrastructure is part of the Parsify project and follows the same licensing terms.
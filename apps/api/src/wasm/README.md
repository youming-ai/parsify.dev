# JSON Formatting Service

A high-performance JSON formatting service with WASM-ready architecture, designed for the Parsify Developer Tools platform.

## Features

- **High Performance**: Optimized for processing large JSON files efficiently
- **WASM-Ready Architecture**: Designed to easily integrate with SIMDJSON WASM module when available
- **Configurable Options**: Extensive formatting options for various use cases
- **Comprehensive Error Handling**: Detailed error messages with line/column information
- **Input Validation**: Security-focused validation to prevent malicious content
- **Performance Metrics**: Detailed statistics and timing information
- **Memory Efficient**: Optimized for large file processing (>1MB)

## Installation

The service is included in the API package. No additional dependencies required.

## Usage

### Basic Usage

```typescript
import { formatJson, validateJson, minifyJson, prettifyJson } from '../wasm/json_formatter'

// Format JSON with default options
const result = await formatJson('{"name":"John","age":30}')
console.log(result.formatted) // Pretty-printed JSON

// Validate JSON
const validation = await validateJson('{"name":"John"}')
console.log(validation.valid) // true

// Minify JSON
const minified = await minifyJson('{"name": "John", "age": 30}')
console.log(minified) // {"name":"John","age":30}

// Prettify JSON
const prettified = await prettifyJson('{"name":"John","age":30}', 2, true)
console.log(prettified) // Pretty-printed with 2-space indent and sorted keys
```

### Advanced Usage

```typescript
import { JsonFormatter, JsonFormattingOptions } from '../wasm/json_formatter'

const formatter = new JsonFormatter()
await formatter.initialize()

const options: JsonFormattingOptions = {
  indent: 4,                    // Indentation size (0-10)
  sortKeys: true,               // Sort object keys alphabetically
  compact: false,               // Compact output (no pretty-printing)
  ensureAscii: false,           // Escape non-ASCII characters
  insertFinalNewline: true,     // Add newline at end of output
  maxDepth: 100,                // Maximum nesting depth
  truncateLongStrings: false,   // Truncate strings exceeding max length
  maxStringLength: 10000,       // Maximum string length before truncation
  preserveOrder: false,         // Preserve original key order when sorting
  removeNulls: false,           // Remove null values
  removeUndefined: false        // Remove undefined values
}

const result = await formatter.format(jsonString, options)
```

## API Reference

### Classes

#### `JsonFormatter`

Main class for JSON formatting operations.

**Methods:**

- `initialize(): Promise<void>` - Initialize the formatter
- `format(jsonString: string, options?: JsonFormattingOptions): Promise<JsonFormattingResult>` - Format JSON
- `getMetrics(): FormattingMetrics` - Get performance metrics
- `setLimits(maxInputSize: number, maxOutputSize: number): void` - Set size limits
- `isReady(): boolean` - Check if formatter is initialized
- `dispose(): void` - Cleanup resources

### Types

#### `JsonFormattingOptions`

```typescript
interface JsonFormattingOptions {
  indent?: number              // Indentation size (0-10, default: 2)
  sortKeys?: boolean           // Sort keys alphabetically (default: false)
  compact?: boolean            // Compact output (default: false)
  ensureAscii?: boolean        // Escape non-ASCII characters (default: false)
  insertFinalNewline?: boolean // Add final newline (default: false)
  maxDepth?: number           // Maximum depth (1-100, default: 100)
  truncateLongStrings?: boolean // Truncate long strings (default: false)
  maxStringLength?: number    // Max string length (default: 10000)
  preserveOrder?: boolean     // Preserve order when sorting (default: false)
  removeNulls?: boolean       // Remove null values (default: false)
  removeUndefined?: boolean   // Remove undefined values (default: false)
}
```

#### `JsonFormattingResult`

```typescript
interface JsonFormattingResult {
  success: boolean             // Operation success
  formatted: string | null     // Formatted JSON
  original: string            // Original input
  originalSize: number        // Original size in bytes
  formattedSize: number       // Formatted size in bytes
  compressionRatio: number    // Size ratio (formatted/original)
  errors: string[] | null     // Error messages
  metadata: {                 // Detailed metadata
    parsingTime: number       // Parse time in ms
    formattingTime: number   // Format time in ms
    totalTime: number        // Total time in ms
    depth: number            // Maximum nesting depth
    keyCount: number         // Number of keys
    valueCount: number       // Number of values
    arrayCount: number       // Number of arrays
    objectCount: number      // Number of objects
    stringCount: number      // Number of strings
    numberCount: number      // Number of numbers
    booleanCount: number     // Number of booleans
    nullCount: number        // Number of nulls
    maxStringLength: number  // Maximum string length
    truncated: boolean       // Whether strings were truncated
  }
}
```

### Error Types

- `JsonFormattingError` - Base error class for formatting errors
- `JsonValidationError` - JSON syntax validation errors
- `JsonSizeError` - Input/output size limit errors
- `JsonDepthError` - Maximum depth exceeded errors

## Performance

The service is optimized for high-performance processing:

- **Large Files**: Efficiently handles JSON files >1MB
- **Memory Usage**: Optimized memory management for large datasets
- **Processing Speed**: Fast parsing and formatting operations
- **WASM Integration**: Ready for SIMDJSON WASM integration when available

### Benchmarks

Typical performance metrics:

- Small JSON (<1KB): <1ms processing time
- Medium JSON (1-100KB): <10ms processing time
- Large JSON (>1MB): <100ms processing time

## Security

The service includes comprehensive security measures:

- **Input Validation**: Validates input for malicious content
- **Size Limits**: Configurable maximum input/output sizes
- **Depth Protection**: Prevents excessively deep nesting
- **Content Filtering**: Detects suspicious patterns and content

## Examples

### Format with Custom Options

```typescript
import { formatJson } from '../wasm/json_formatter'

const options = {
  indent: 2,
  sortKeys: true,
  removeNulls: true,
  insertFinalNewline: true
}

const result = await formatJson(jsonString, options)
if (result.success) {
  console.log(result.formatted)
}
```

### Handle Errors Gracefully

```typescript
import { JsonFormatter, JsonValidationError } from '../wasm/json_formatter'

const formatter = new JsonFormatter()
await formatter.initialize()

try {
  const result = await formatter.format(jsonString)
  // Process result
} catch (error) {
  if (error instanceof JsonValidationError) {
    console.log(`Validation error at line ${error.line}, column ${error.column}: ${error.message}`)
  } else {
    console.log(`Formatting error: ${error.message}`)
  }
}
```

### Process Large JSON Files

```typescript
import { JsonFormatter } from '../wasm/json_formatter'

const formatter = new JsonFormatter()
formatter.setLimits(10 * 1024 * 1024, 50 * 1024 * 1024) // 10MB input, 50MB output
await formatter.initialize()

const result = await formatter.format(largeJsonString, {
  compact: true,
  truncateLongStrings: true,
  maxStringLength: 1000
})
```

## Future Enhancements

- **WASM SIMDJSON Integration**: High-performance SIMDJSON WASM module integration
- **Streaming Processing**: Support for streaming large JSON files
- **Schema Validation**: JSON schema validation capabilities
- **Custom Transformations**: User-defined transformation functions
- **Performance Monitoring**: Advanced performance metrics and monitoring

## Dependencies

- `zod` - TypeScript schema validation
- **TODO**: `simdjson-wasm` - High-performance SIMD parsing (when available)

## License

This service is part of the Parsify Developer Tools platform.
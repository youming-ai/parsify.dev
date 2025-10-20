# Data Model: JSON.md Reader

## Core Entities

### JsonFile
Represents a markdown file containing JSON content.

**Properties**:
- `name: string` - Filename (e.g., "json.md")
- `content: string` - Raw markdown file content
- `size: number` - File size in bytes
- `lastModified: Date` - File modification timestamp
- `type: 'markdown' | 'text'` - File type classification

**Validation Rules**:
- Name must end with .md or .txt extension
- Size must be < 1MB for optimal performance
- Content must be valid UTF-8 string

### JsonDocument
Represents extracted JSON data from markdown content.

**Properties**:
- `id: string` - Unique identifier for the JSON document
- `rawJson: string` - Raw JSON string extracted from markdown
- `parsedData: JsonNode | null` - Parsed JSON object or null if invalid
- `isValid: boolean` - Whether JSON is syntactically valid
- `extractionMethod: 'codeblock' | 'inline' | 'mixed'` - How JSON was extracted
- `errorMessage?: string` - Error message if parsing failed
- `lineNumber?: number` - Line number where JSON was found

**Validation Rules**:
- RawJson must be valid JSON syntax or have error handling
- ParsedData must match JsonNode interface or be null
- ExtractionMethod must be one of defined values

### JsonNode
Represents a node in the JSON data structure.

**Types**:
```typescript
type JsonNode =
  | JsonObject
  | JsonArray
  | JsonPrimitive
  | null

interface JsonObject {
  [key: string]: JsonNode
}

interface JsonArray {
  [index: number]: JsonNode
}

type JsonPrimitive =
  | string
  | number
  | boolean
  | null
```

**Properties**:
- `type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'`
- `value: any` - The actual value
- `path: string` - JSON path to this node (e.g., "users[0].name")
- `parent?: JsonNode` - Reference to parent node
- `depth: number` - Nesting depth in JSON structure

### ValidationError
Represents parsing or validation errors.

**Properties**:
- `code: string` - Error code identifier
- `message: string` - Human-readable error message
- `line?: number` - Line number where error occurred
- `column?: number` - Column position of error
- `severity: 'error' | 'warning' | 'info'` - Error severity level

**Error Codes**:
- `INVALID_JSON_SYNTAX` - JSON parsing failed
- `FILE_TOO_LARGE` - File exceeds size limit
- `UNSUPPORTED_FORMAT` - File format not supported
- `EXTRACTION_FAILED` - Could not extract JSON from markdown

## State Transitions

### File Processing Flow
```
File Selected → File Validated → Content Extracted → JSON Parsed → Display Ready
     ↓               ↓                ↓               ↓           ↓
  Error State    → Size Check → Extraction → Validation → Rendered
```

### States:
1. **IDLE**: No file selected
2. **LOADING**: File being read and processed
3. **PARSING**: JSON content being extracted and parsed
4. **SUCCESS**: Valid JSON ready for display
5. **ERROR**: Error in processing with specific error type

### Transitions:
- `IDLE → LOADING`: File selected by user
- `LOADING → PARSING`: File successfully read
- `PARSING → SUCCESS`: JSON valid and extracted
- `PARSING → ERROR`: Invalid JSON or extraction failed
- `ERROR → IDLE`: User dismisses error or selects new file

## Data Relationships

### Composition
- `JsonFile` contains multiple `JsonDocument` instances
- `JsonDocument` contains one `JsonNode` hierarchy
- `JsonNode` can contain nested `JsonNode` instances

### Aggregation
- `ValidationError` aggregates all errors found during processing
- Processing state aggregates file, document, and view states

## Constraints and Invariants

### File Constraints
- Maximum file size: 1MB (configurable)
- Supported extensions: .md, .txt
- Encoding: UTF-8 only

### JSON Constraints
- Maximum nesting depth: 20 levels
- Maximum array length: 10,000 items
- Maximum string length: 1MB per string value

### Performance Constraints
- Parsing time: <200ms for typical files
- Memory usage: <100MB for processing
- UI responsiveness: No blocking operations

## Data Access Patterns

### Read Operations
- File content reading via FileReader API
- JSON extraction via regex parsing
- JSON parsing via native JSON.parse()
- Tree traversal for JSON display

### Write Operations
- No persistent data storage required
- In-memory state management only
- Temporary caching for performance

### Search Operations
- Key-based search in JSON objects
- Value-based search across all nodes
- Path-based navigation support

## Error Handling Strategy

### Validation Errors
- Input validation before processing
- Syntax validation during parsing
- Structural validation for display

### Recovery Mechanisms
- Partial JSON extraction when possible
- Graceful degradation for display
- Retry options for transient errors

### User Communication
- Clear error messages with context
- Suggested fixes for common issues
- Progress indicators for long operations
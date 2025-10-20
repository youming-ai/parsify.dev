# Tool Components

This section covers the specialized tool components used in the Parsify.dev application. These components provide functionality for JSON manipulation, code execution, and other developer tools.

## Tool Layout

A consistent layout wrapper for all tool pages with optional tabs and feature badges.

### Props

```tsx
interface ToolLayoutProps {
  title: string
  description: string
  category: string
  children: ReactNode
  tabs?: Array<{
    value: string
    label: string
    content: ReactNode
  }>
  features?: string[]
  version?: string
}
```

### Usage Examples

```tsx
import { ToolLayout } from '@/components/tools/tool-layout'

// Basic layout
<ToolLayout
  title="JSON Validator"
  description="Validate and format JSON data with real-time error checking"
  category="JSON Tools"
  features={["Real-time validation", "Error highlighting", "Format suggestions"]}
>
  <JsonValidator input={jsonInput} onValidationChange={handleValidation} />
</ToolLayout>

// Layout with tabs
<ToolLayout
  title="JSON Tools"
  description="Complete JSON manipulation toolkit"
  category="JSON Tools"
  tabs={[
    {
      value: 'validator',
      label: 'Validator',
      content: <JsonValidator input={input} onValidationChange={handleValidation} />
    },
    {
      value: 'formatter',
      label: 'Formatter',
      content: <JsonFormatter input={input} onFormat={handleFormat} />
    }
  ]}
/>
```

## JSON Tools

### JSON Validator

Real-time JSON validation with error highlighting and statistics.

#### Props

```tsx
interface JsonValidatorProps {
  input: string
  onValidationChange: (result: JsonValidationResult) => void
  showLineNumbers?: boolean
  className?: string
}

interface JsonValidationResult {
  isValid: boolean
  errors: JsonValidationError[]
  lineNumbers?: number[]
}

interface JsonValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
}
```

#### Usage Examples

```tsx
import { JsonValidator } from '@/components/tools/json/json-validator'

// Basic validator
<JsonValidator
  input={jsonString}
  onValidationChange={(result) => {
    if (result.isValid) {
      console.log('Valid JSON')
    } else {
      console.log('Errors:', result.errors)
    }
  }}
/>

// With custom styling
<JsonValidator
  input={jsonString}
  showLineNumbers={true}
  className="border rounded-lg p-4"
  onValidationChange={handleValidation}
/>
```

#### Features

- **Real-time validation**: Validates JSON as you type with debouncing
- **Error highlighting**: Shows line numbers and column positions
- **Statistics**: Displays line count, character count, and word count
- **Manual revalidation**: Force validation on demand
- **Accessibility**: Screen reader friendly with proper ARIA labels

### JSON Formatter

Format and beautify JSON with customizable options.

#### Props

```tsx
interface JsonFormatterProps {
  input: string
  options?: JsonFormatOptions
  onFormat: (formatted: string) => void
  onError: (error: string) => void
  className?: string
}

interface JsonFormatOptions {
  indent: number
  sortKeys: boolean
  compact: boolean
  trailingComma: boolean
}
```

#### Usage Examples

```tsx
import { JsonFormatter } from '@/components/tools/json/json-formatter'

// Basic formatter
<JsonFormatter
  input={jsonString}
  onFormat={setFormattedJson}
  onError={setError}
/>

// With custom options
<JsonFormatter
  input={jsonString}
  options={{
    indent: 2,
    sortKeys: true,
    compact: false,
    trailingComma: false
  }}
  onFormat={setFormattedJson}
  onError={setError}
/>
```

### JSON Viewer

Display JSON data in a collapsible tree view.

#### Props

```tsx
interface JsonViewerProps {
  data: unknown
  expandLevel?: number
  showLineNumbers?: boolean
  copyable?: boolean
  className?: string
}
```

#### Usage Examples

```tsx
import { JsonViewer } from '@/components/tools/json/json-viewer'

// Basic viewer
<JsonViewer data={jsonObject} />

// With custom options
<JsonViewer
  data={jsonObject}
  expandLevel={3}
  showLineNumbers={true}
  copyable={true}
  className="border rounded-lg p-4"
/>
```

### JSON Converter

Convert JSON to other formats like XML, YAML, and CSV.

#### Props

```tsx
interface JsonConverterProps {
  input: string
  options: JsonConversionOptions
  onConvert: (output: string) => void
  onError: (error: string) => void
  className?: string
}

interface JsonConversionOptions {
  targetFormat: 'xml' | 'yaml' | 'csv'
  rootElement?: string
  arrayItemName?: string
  flatten?: boolean
  csvDelimiter?: string
}
```

#### Usage Examples

```tsx
import { JsonConverter } from '@/components/tools/json/json-converter'

// Convert to XML
<JsonConverter
  input={jsonString}
  options={{
    targetFormat: 'xml',
    rootElement: 'root',
    arrayItemName: 'item'
  }}
  onConvert={setXmlOutput}
  onError={setError}
/>

// Convert to CSV
<JsonConverter
  input={jsonString}
  options={{
    targetFormat: 'csv',
    flatten: true,
    csvDelimiter: ','
  }}
  onConvert={setCsvOutput}
  onError={setError}
/>
```

### JSON Input Editor

A specialized code editor for JSON input with syntax highlighting and validation.

#### Props

```tsx
interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  onValidate?: (result: JsonValidationResult) => void
  placeholder?: string
  height?: string | number
  className?: string
}
```

#### Usage Examples

```tsx
import { JsonInputEditor } from '@/components/tools/json/json-input-editor'

// Basic editor
<JsonInputEditor
  value={jsonString}
  onChange={setJsonString}
  onValidate={handleValidation}
  placeholder="Enter JSON here..."
/>

// With custom height
<JsonInputEditor
  value={jsonString}
  onChange={setJsonString}
  height="400px"
  placeholder="Paste your JSON data..."
/>
```

## Code Tools

### Code Editor

A Monaco-based code editor with syntax highlighting and IntelliSense.

#### Props

```tsx
interface CodeEditorProps {
  value: string
  language: CodeLanguage
  onChange: (value: string) => void
  onLanguageChange: (language: CodeLanguage) => void
  height?: string | number
  width?: string | number
  readOnly?: boolean
  theme?: 'light' | 'dark' | 'high-contrast'
  fontSize?: number
  wordWrap?: boolean
  showLineNumbers?: boolean
  minimap?: boolean
  className?: string
}

type CodeLanguage =
  | 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c'
  | 'csharp' | 'go' | 'rust' | 'php' | 'ruby' | 'swift' | 'kotlin'
  | 'scala' | 'bash' | 'powershell' | 'sql'
```

#### Usage Examples

```tsx
import { CodeEditor } from '@/components/tools/code/code-editor'

// Basic editor
<CodeEditor
  value={code}
  language="javascript"
  onChange={setCode}
  onLanguageChange={setLanguage}
  height="400px"
/>

// With custom options
<CodeEditor
  value={code}
  language="python"
  onChange={setCode}
  theme="dark"
  fontSize={14}
  wordWrap={true}
  showLineNumbers={true}
  minimap={false}
/>
```

### Language Selector

A dropdown for selecting programming languages with version support.

#### Props

```tsx
interface LanguageSelectorProps {
  selectedLanguage: CodeLanguage
  onLanguageChange: (language: CodeLanguage) => void
  showVersion?: boolean
  compact?: boolean
  className?: string
}
```

#### Usage Examples

```tsx
import { LanguageSelector } from '@/components/tools/code/language-selector'

// Basic selector
<LanguageSelector
  selectedLanguage="javascript"
  onLanguageChange={setLanguage}
/>

// Compact version
<LanguageSelector
  selectedLanguage="python"
  onLanguageChange={setLanguage}
  compact={true}
/>
```

### Code Execution

Execute code in various languages with progress tracking.

#### Props

```tsx
interface CodeExecutionProps {
  request: CodeExecutionRequest
  onExecutionStart: () => void
  onExecutionComplete: (result: CodeExecutionResult) => void
  onExecutionError: (error: string) => void
  onCancel?: () => void
  showProgress?: boolean
  showStats?: boolean
  className?: string
}

interface CodeExecutionRequest {
  language: CodeLanguage
  code: string
  input?: string
  version?: string
  compilerOptions?: Record<string, any>
}

interface CodeExecutionResult {
  output: string
  error?: string
  exitCode: number
  executionTime: number
  memoryUsage: number
  compileTime?: number
  compileOutput?: string
  signal?: string
}
```

#### Usage Examples

```tsx
import { CodeExecution } from '@/components/tools/code/code-execution'

// Basic execution
<CodeExecution
  request={{
    language: 'javascript',
    code: 'console.log("Hello, World!");'
  }}
  onExecutionStart={() => setLoading(true)}
  onExecutionComplete={(result) => {
    setLoading(false)
    setOutput(result.output)
  }}
  onExecutionError={(error) => {
    setLoading(false)
    setError(error)
  }}
/>

// With input and compiler options
<CodeExecution
  request={{
    language: 'python',
    code: 'name = input()\nprint(f"Hello, {name}!")',
    input: 'Alice'
  }}
  showProgress={true}
  showStats={true}
/>
```

### Terminal

A terminal-like component for displaying execution output.

#### Props

```tsx
interface TerminalProps {
  lines: TerminalLine[]
  onInput?: (input: string) => void
  onClear?: () => void
  readonly?: boolean
  height?: string | number
  theme?: 'light' | 'dark' | 'high-contrast'
  showTimestamps?: boolean
  showLineNumbers?: boolean
  className?: string
}

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'info'
  content: string
  timestamp: number
}
```

#### Usage Examples

```tsx
import { Terminal } from '@/components/tools/code/terminal'

// Read-only terminal
<Terminal
  lines={terminalLines}
  readonly={true}
  height="300px"
  theme="dark"
/>

// Interactive terminal
<Terminal
  lines={terminalLines}
  onInput={handleInput}
  onClear={clearTerminal}
  showTimestamps={true}
/>
```

### Execution Status

Display execution status with progress and metrics.

#### Props

```tsx
interface ExecutionStatusProps {
  status: ExecutionStatus
  progress?: number
  executionTime?: number
  memoryUsage?: number
  error?: string
  onCancel?: () => void
  compact?: boolean
  className?: string
}

type ExecutionStatus = 'idle' | 'compiling' | 'running' | 'completed' | 'error' | 'timeout' | 'cancelled'
```

#### Usage Examples

```tsx
import { ExecutionStatus } from '@/components/tools/code/execution-status'

// Basic status display
<ExecutionStatus
  status="running"
  progress={75}
  executionTime={1.5}
  memoryUsage={128}
/>

// Compact version
<ExecutionStatus
  status="completed"
  executionTime={2.3}
  memoryUsage={256}
  compact={true}
/>
```

### Code Formatter

Format code according to language-specific rules.

#### Props

```tsx
interface CodeFormatterProps {
  code: string
  language: CodeLanguage
  options: CodeFormatOptions
  onFormat: (formattedCode: string) => void
  onError: (error: string) => void
  className?: string
}

interface CodeFormatOptions {
  indentSize: number
  indentType: 'spaces' | 'tabs'
  maxLineLength: number
  semicolons: boolean
  quotes: 'single' | 'double'
  trailingComma: boolean
}
```

#### Usage Examples

```tsx
import { CodeFormatter } from '@/components/tools/code/code-formatter'

// Basic formatter
<CodeFormatter
  code={unformattedCode}
  language="javascript"
  options={{
    indentSize: 2,
    indentType: 'spaces',
    semicolons: true,
    quotes: 'single'
  }}
  onFormat={setFormattedCode}
  onError={setError}
/>
```

## Tool Wrapper

A wrapper component that provides common tool functionality like loading states and error handling.

### Props

```tsx
interface ToolWrapperProps {
  children: React.ReactNode
  isLoading?: boolean
  error?: string
  onRetry?: () => void
  className?: string
}
```

### Usage Examples

```tsx
import { ToolWrapper } from '@/components/tools/tool-wrapper'

// Basic wrapper
<ToolWrapper
  isLoading={isLoading}
  error={error}
  onRetry={retryOperation}
>
  <YourToolComponent />
</ToolWrapper>
```

## Best Practices

### 1. Performance
- Use debouncing for validation and formatting operations
- Implement proper loading states for long-running operations
- Cache results when appropriate

### 2. Error Handling
- Provide clear error messages with context
- Offer retry mechanisms for recoverable errors
- Validate inputs before processing

### 3. Accessibility
- Ensure keyboard navigation works in all tool components
- Provide screen reader friendly output
- Use semantic HTML elements

### 4. User Experience
- Provide real-time feedback when possible
- Show progress indicators for long operations
- Include helpful examples and templates

### 5. Code Quality
- Use TypeScript interfaces for all props
- Implement proper error boundaries
- Test with various input formats and edge cases
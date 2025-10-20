export interface JsonValidationResult {
  isValid: boolean
  errors: JsonValidationError[]
  lineNumbers?: number[]
}

export interface JsonValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
}

export interface JsonFormatOptions {
  indent: number
  sortKeys: boolean
  compact: boolean
  trailingComma: boolean
}

export interface JsonConversionOptions {
  targetFormat: 'xml' | 'yaml' | 'csv'
  rootElement?: string
  arrayItemName?: string
  flatten?: boolean
  csvDelimiter?: string
}

export interface TreeNode {
  key: string
  value: unknown
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  path: string
  children?: TreeNode[]
  isExpanded?: boolean
  level: number
}

export type JsonParsingStatus = 'idle' | 'parsing' | 'valid' | 'error'

export interface JsonEditorState {
  content: string
  parsedValue: unknown
  status: JsonParsingStatus
  validationErrors: JsonValidationError[]
  formatOptions: JsonFormatOptions
}

export interface JsonViewerProps {
  data: unknown
  expandLevel?: number
  showLineNumbers?: boolean
  copyable?: boolean
  className?: string
}

export interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  onValidate?: (result: JsonValidationResult) => void
  placeholder?: string
  height?: string | number
  className?: string
}

export interface JsonFormatterProps {
  input: string
  options?: JsonFormatOptions
  onFormat: (formatted: string) => void
  onError: (error: string) => void
  className?: string
}

export interface JsonValidatorProps {
  input: string
  onValidationChange: (result: JsonValidationResult) => void
  showLineNumbers?: boolean
  className?: string
}

export interface JsonConverterProps {
  input: string
  options: JsonConversionOptions
  onConvert: (output: string) => void
  onError: (error: string) => void
  className?: string
}

export interface JsonErrorDisplayProps {
  errors: JsonValidationError[]
  content: string
  className?: string
}

import { IWasmModule, WasmModuleResult, WasmModuleConfig } from './wasm-module.interface'

/**
 * Interface for JSON processing WASM modules
 */
export interface IJsonWasmModule extends IWasmModule {
  /**
   * Format JSON with specified options
   */
  formatJson(json: string, options?: JsonFormatOptions): Promise<WasmModuleResult>

  /**
   * Validate JSON against a schema
   */
  validateJson(json: string, schema?: any): Promise<WasmModuleResult>

  /**
   * Minify JSON to reduce size
   */
  minifyJson(json: string): Promise<WasmModuleResult>

  /**
   * Prettify JSON with custom formatting
   */
  prettifyJson(json: string, options?: JsonPrettifyOptions): Promise<WasmModuleResult>

  /**
   * Convert JSON to other formats
   */
  convertJson(json: string, targetFormat: JsonTargetFormat, options?: JsonConversionOptions): Promise<WasmModuleResult>

  /**
   * Extract data from JSON using JSONPath or similar
   */
  extractJsonData(json: string, path: string): Promise<WasmModuleResult>

  /**
   * Merge multiple JSON objects
   */
  mergeJsonObjects(objects: any[], strategy?: MergeStrategy): Promise<WasmModuleResult>

  /**
   * Compare two JSON objects
   */
  compareJson(json1: string, json2: string, options?: JsonCompareOptions): Promise<WasmModuleResult>

  /**
   * Sort JSON keys recursively
   */
  sortJsonKeys(json: string, options?: JsonSortOptions): Promise<WasmModuleResult>

  /**
   * Filter JSON data based on criteria
   */
  filterJson(json: string, filter: JsonFilter): Promise<WasmModuleResult>

  /**
   * Transform JSON structure
   */
  transformJson(json: string, transformation: JsonTransformation): Promise<WasmModuleResult>
}

/**
 * JSON formatting options
 */
export interface JsonFormatOptions {
  /**
   * Number of spaces for indentation (0-10)
   */
  indent?: number

  /**
   * Whether to sort object keys alphabetically
   */
  sortKeys?: boolean

  /**
   * Whether to generate compact JSON (no whitespace)
   */
  compact?: boolean

  /**
   * Ensure all characters are ASCII
   */
  ensureAscii?: boolean

  /**
   * Insert final newline at end of output
   */
  insertFinalNewline?: boolean

  /**
   * Maximum nesting depth allowed
   */
  maxDepth?: number

  /**
   * Truncate long strings to prevent memory issues
   */
  truncateLongStrings?: boolean

  /**
   * Maximum string length before truncation
   */
  maxStringLength?: number

  /**
   * Preserve original key order
   */
  preserveOrder?: boolean

  /**
   * Remove null values from output
   */
  removeNulls?: boolean

  /**
   * Remove undefined values from output
   */
  removeUndefined?: boolean

  /**
   * Custom replacer function for serialization
   */
  replacer?: (key: string, value: any) => any

  /**
   * Custom space parameter (string or number)
   */
  space?: string | number
}

/**
 * JSON prettify options
 */
export interface JsonPrettifyOptions extends JsonFormatOptions {
  /**
   * Whether to add color syntax highlighting
   */
  colorize?: boolean

  /**
   * Whether to add comments in output
   */
  addComments?: boolean

  /**
   * Custom theme for highlighting
   */
  theme?: JsonTheme

  /**
   * Whether to inline short objects/arrays
   */
  inlineShort?: boolean

  /**
   * Maximum length for inline objects/arrays
   */
  inlineMaxLength?: number
}

/**
 * JSON target formats for conversion
 */
export type JsonTargetFormat =
  | 'xml'
  | 'yaml'
  | 'csv'
  | 'properties'
  | 'ini'
  | 'toml'
  | 'bson'
  | 'msgpack'
  | 'cbor'
  | 'json5'
  | 'jsonc'

/**
 * JSON conversion options
 */
export interface JsonConversionOptions {
  /**
   * Root element name for XML conversion
   */
  rootElement?: string

  /**
   * Whether to include attributes in XML conversion
   */
  includeAttributes?: boolean

  /**
   * Delimiter for CSV conversion
   */
  delimiter?: string

  /**
   * Whether to include headers in CSV conversion
   */
  includeHeaders?: boolean

  /**
   * Indentation for YAML conversion
   */
  yamlIndent?: number

  /**
   * Whether to use flow style for YAML arrays
   */
  yamlFlowStyle?: boolean

  /**
   * Encoding for binary formats
   */
  encoding?: 'base64' | 'hex' | 'binary'

  /**
   * Whether to preserve types in conversion
   */
  preserveTypes?: boolean

  /**
   * Custom mappings for conversion
   */
  mappings?: Record<string, string>

  /**
   * Whether to convert camelCase to snake_case
   */
  camelToSnake?: boolean

  /**
   * Whether to convert snake_case to camelCase
   */
  snakeToCamel?: boolean
}

/**
 * JSON merge strategies
 */
export type MergeStrategy =
  | 'overwrite'     // Later values overwrite earlier ones
  | 'merge'         // Deep merge objects
  | 'append'        // Append arrays
  | 'combine'       // Combine values intelligently
  | 'keep-first'    // Keep first occurrence
  | 'keep-last'     // Keep last occurrence

/**
 * JSON comparison options
 */
export interface JsonCompareOptions {
  /**
   * Whether to ignore key order
   */
  ignoreOrder?: boolean

  /**
   * Whether to ignore whitespace differences
   */
  ignoreWhitespace?: boolean

  /**
   * Whether to ignore case for string values
   */
  ignoreCase?: boolean

  /**
   * Precision for numeric comparisons
   */
  numericPrecision?: number

  /**
   * Whether to show detailed differences
   */
  showDifferences?: boolean

  /**
   * Format for difference output
   */
  differenceFormat?: 'text' | 'json' | 'html'

  /**
   * Paths to exclude from comparison
   */
  excludePaths?: string[]

  /**
   * Whether to compare only specific paths
   */
  includePaths?: string[]
}

/**
 * JSON sort options
 */
export interface JsonSortOptions {
  /**
   * Whether to sort keys recursively
   */
  recursive?: boolean

  /**
   * Custom sort function
   */
  sortFunction?: (a: string, b: string) => number

  /**
   * Whether to sort arrays
   */
  sortArrays?: boolean

  /**
   * Whether to sort numeric keys numerically
   */
  numericKeys?: boolean

  /**
   * Whether to use natural sorting
   */
  naturalSort?: boolean

  /**
   * Keys to exclude from sorting
   */
  excludeKeys?: string[]

  /**
   * Whether to preserve special key order (like __proto__)
   */
  preserveSpecialKeys?: boolean
}

/**
 * JSON filter criteria
 */
export interface JsonFilter {
  /**
   * JSONPath expression to filter by
   */
  path?: string

  /**
   * Key-value pairs to match
   */
  matches?: Record<string, any>

  /**
   * Regular expression patterns for values
   */
  regex?: Record<string, string>

  /**
   * Range filters for numeric values
   */
  ranges?: Record<string, { min?: number; max?: number }>

  /**
   * Include only these keys
   */
  includeKeys?: string[]

  /**
   * Exclude these keys
   */
  excludeKeys?: string[]

  /**
   * Filter by value type
   */
  types?: Record<string, string[]>

  /**
   * Custom filter function
   */
  custom?: (value: any, key: string, path: string) => boolean

  /**
   * Maximum depth to traverse
   */
  maxDepth?: number
}

/**
 * JSON transformation specification
 */
export interface JsonTransformation {
  /**
   * List of transformation operations
   */
  operations: JsonTransformationOperation[]

  /**
   * Whether to apply transformations recursively
   */
  recursive?: boolean

  /**
   * Maximum depth for recursive transformations
   */
  maxDepth?: number
}

/**
 * Individual JSON transformation operation
 */
export interface JsonTransformationOperation {
  /**
   * Type of transformation
   */
  type: 'rename' | 'move' | 'copy' | 'delete' | 'modify' | 'add' | 'calculate' | 'format' | 'convert'

  /**
   * Target path for the transformation
   */
  target: string

  /**
   * Source path (for move, copy operations)
   */
  source?: string

  /**
   * Value to set (for add, modify operations)
   */
  value?: any

  /**
   * Function to apply (for modify, calculate operations)
   */
  function?: string | ((value: any, context: any) => any)

  /**
   * Conditions for applying the transformation
   */
  condition?: JsonFilter

  /**
   * Parameters for the operation
   */
  parameters?: Record<string, any>
}

/**
 * JSON theme for syntax highlighting
 */
export interface JsonTheme {
  /**
   * Color for keys
   */
  keyColor?: string

  /**
   * Color for string values
   */
  stringColor?: string

  /**
   * Color for numeric values
   */
  numberColor?: string

  /**
   * Color for boolean values
   */
  booleanColor?: string

  /**
   * Color for null values
   */
  nullColor?: string

  /**
   * Color for brackets and punctuation
   */
  punctuationColor?: string

  /**
   * Background color
   */
  backgroundColor?: string

  /**
   * Text font family
   */
  fontFamily?: string

  /**
   * Text font size
   */
  fontSize?: string

  /**
   * Whether to use bold formatting
   */
  bold?: boolean

  /**
   * Whether to use italic formatting
   */
  italic?: boolean
}

/**
 * JSON analysis results
 */
export interface JsonAnalysisResult {
  /**
   * Whether the JSON is valid
   */
  valid: boolean

  /**
   * File size in bytes
   */
  size: number

  /**
   * Maximum nesting depth
   */
  maxDepth: number

  /**
   * Total number of keys
   */
  keyCount: number

  /**
   * Total number of values
   */
  valueCount: number

  /**
   * Type statistics
   */
  typeStats: {
    objects: number
    arrays: number
    strings: number
    numbers: number
    booleans: number
    nulls: number
  }

  /**
   * Unique keys found
   */
  uniqueKeys: string[]

  /**
   * Largest object/array found
   */
  largestStructure: {
    type: 'object' | 'array'
    path: string
    size: number
  }

  /**
   * Validation errors if any
   */
  errors?: string[]

  /**
   * Performance metrics
   */
  metrics: {
    parseTime: number
    analysisTime: number
    memoryUsage: number
  }
}

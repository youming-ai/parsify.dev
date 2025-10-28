export interface JsonFile {
  name: string
  content: string
  size: number
  lastModified: Date
  type: 'markdown' | 'text'
}

export interface JsonDocument {
  id: string
  rawJson: string
  parsedData: JsonNode | null
  isValid: boolean
  extractionMethod: 'codeblock' | 'inline' | 'mixed'
  errorMessage?: string
  lineNumber?: number
}

export type JsonNode = JsonObject | JsonArray | JsonPrimitive | null

export interface JsonObject {
  [key: string]: JsonNode
}

export interface JsonArray {
  [index: number]: JsonNode
}

export type JsonPrimitive = string | number | boolean | null

export interface ValidationError {
  code: string
  message: string
  line?: number
  column?: number
  severity: 'error' | 'warning' | 'info'
}

export interface FileValidationRequest {
  name: string
  size: number
  type: 'markdown' | 'text'
}

export interface FileValidationResponse {
  isValid: boolean
  errors: ValidationError[]
}

export interface FileParseRequest {
  content: string
  options?: {
    extractMode?: 'codeblock' | 'inline' | 'mixed'
    maxDepth?: number
  }
}

export interface FileParseResponse {
  success: boolean
  documents: JsonDocument[]
  errors: ValidationError[]
}

export interface PerformanceMeasurement {
  duration: number
  memoryUsage?: number
  operation: string
}

export enum LoadingStates {
  IDLE = 'idle',
  LOADING = 'loading',
  PARSING = 'parsing',
  SUCCESS = 'success',
  ERROR = 'error',
}

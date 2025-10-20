/**
 * Base types for tool components
 * These provide a consistent interface for all tool implementations
 */

export interface ToolInput {
  [key: string]: unknown
}

export interface ToolOutput {
  data?: unknown
  error?: string
  metadata?: Record<string, unknown>
}

export interface ToolState {
  id: string
  name: string
  description: string
  category: string
  status: 'idle' | 'loading' | 'success' | 'error'
  input: ToolInput
  output?: ToolOutput
  error?: string
  isRunning: boolean
  lastRun?: Date
}

export interface ToolConfig {
  id: string
  name: string
  description: string
  category: string
  icon?: string
  version?: string
  features?: string[]
  inputSchema: ToolInputSchema
  outputType?: 'json' | 'text' | 'code' | 'table' | 'custom'
}

export interface ToolInputSchema {
  [key: string]: {
    type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'file'
    label: string
    placeholder?: string
    required?: boolean
    defaultValue?: unknown
    options?: Array<{ value: string; label: string }>
    validation?: {
      min?: number
      max?: number
      pattern?: string
      message?: string
    }
  }
}

export interface ToolComponentProps {
  config: ToolConfig
  state: ToolState
  onInputChange: (key: string, value: unknown) => void
  onExecute: () => Promise<void>
  onReset: () => void
  className?: string
}

export interface ToolWrapperProps {
  children: React.ReactNode
  title: string
  description: string
  category: string
  status?: ToolState['status']
  error?: string
  className?: string
  features?: string[]
  version?: string
}

export interface ToolLoadingProps {
  message?: string
  className?: string
}

export interface ToolErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

export interface ToolOutputProps {
  output: ToolOutput
  outputType?: ToolConfig['outputType']
  className?: string
}

export interface ToolInputFormProps {
  schema: ToolInputSchema
  values: ToolInput
  onChange: (key: string, value: unknown) => void
  onSubmit: () => void
  isDisabled?: boolean
  className?: string
}

// Tool categories for organization
export type ToolCategory =
  | 'json'
  | 'code'
  | 'text'
  | 'data'
  | 'validation'
  | 'conversion'
  | 'utility'

// Tool status indicators
export type ToolStatus = ToolState['status']

// Error types for better error handling
export interface ToolError {
  type: 'validation' | 'execution' | 'network' | 'unknown'
  message: string
  details?: unknown
}

// Event types for tool interactions
export interface ToolEvent {
  type: 'execute' | 'reset' | 'input_change' | 'output_change'
  payload?: unknown
  timestamp: Date
}

// Hook return type for tool state management
export interface UseToolReturn {
  state: ToolState
  execute: () => Promise<void>
  reset: () => void
  updateInput: (key: string, value: unknown) => void
  isLoading: boolean
  error: string | null
  hasOutput: boolean
}

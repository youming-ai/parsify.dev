/**
 * Shared TypeScript types for the Parsify platform
 */

// Common API types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

// User types
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'pro' | 'enterprise'
  preferences: Record<string, any>
  created_at: number
  updated_at: number
  last_login_at?: number
}

// Tool types
export interface Tool {
  id: string
  slug: string
  name: string
  category: string
  description: string
  config: ToolConfig
  enabled: boolean
  beta: boolean
  sort_order: number
  created_at: number
  updated_at: number
}

export interface ToolConfig {
  inputSchema: Record<string, any>
  outputSchema: Record<string, any>
  executionMode: 'sync' | 'async' | 'streaming'
  quotas?: {
    maxInputSize?: number
    maxExecutionTime?: number
    requiresAuth?: boolean
  }
}

// Job types
export interface Job {
  id: string
  user_id?: string
  tool_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input_data?: Record<string, any>
  output_data?: Record<string, any>
  input_ref?: string
  output_ref?: string
  progress: number
  error_message?: string
  retry_count: number
  started_at?: number
  completed_at?: number
  created_at: number
  updated_at: number
}

// File upload types
export interface FileUpload {
  id: string
  user_id?: string
  filename: string
  mime_type: string
  size_bytes: number
  r2_key: string
  checksum?: string
  status: 'uploading' | 'completed' | 'expired'
  expires_at?: number
  created_at: number
}

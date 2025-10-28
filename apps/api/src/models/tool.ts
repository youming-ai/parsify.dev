import { z } from 'zod'

// Tool categories
export const ToolCategorySchema = z.enum([
  'json',
  'formatting',
  'execution',
  'text',
  'image',
  'network',
  'crypto',
])
export type ToolCategory = z.infer<typeof ToolCategorySchema>

// Execution modes
export const ExecutionModeSchema = z.enum(['sync', 'async', 'streaming'])
export type ExecutionMode = z.infer<typeof ExecutionModeSchema>

// Tool configuration schema
export const ToolConfigSchema = z.object({
  inputSchema: z.record(z.any()),
  outputSchema: z.record(z.any()),
  executionMode: ExecutionModeSchema,
  quotas: z
    .object({
      maxInputSize: z.number().default(1024 * 1024), // 1MB default
      maxExecutionTime: z.number().default(5000), // 5s default
      requiresAuth: z.boolean().default(false),
    })
    .default({
      maxInputSize: 1024 * 1024,
      maxExecutionTime: 5000,
      requiresAuth: false,
    }),
  parameters: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean().default(false),
        default: z.any().optional(),
        description: z.string().optional(),
      })
    )
    .default([]),
})

export type ToolConfig = z.infer<typeof ToolConfigSchema>

// Tool schema for validation
export const ToolSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  category: ToolCategorySchema,
  description: z.string().nullable(),
  config: ToolConfigSchema,
  enabled: z.boolean().default(true),
  beta: z.boolean().default(false),
  sort_order: z.number().default(0),
  created_at: z.number(),
  updated_at: z.number(),
})

export type Tool = z.infer<typeof ToolSchema>

// Tool creation schema
export const CreateToolSchema = ToolSchema.partial({
  id: true,
  created_at: true,
  updated_at: true,
  enabled: true,
  beta: true,
  sort_order: true,
})

export type CreateTool = z.infer<typeof CreateToolSchema>

// Tool update schema
export const UpdateToolSchema = ToolSchema.partial({
  id: true,
  created_at: true,
  updated_at: true,
})

export type UpdateTool = z.infer<typeof UpdateToolSchema>

// Tool model class
export class Tool {
  public id: string
  public slug: string
  public name: string
  public category: ToolCategory
  public description: string | null
  public config: ToolConfig
  public enabled: boolean
  public beta: boolean
  public sort_order: number
  public created_at: number
  public updated_at: number

  constructor(data: Tool) {
    this.id = data.id
    this.slug = data.slug
    this.name = data.name
    this.category = data.category
    this.description = data.description
    this.config = data.config
    this.enabled = data.enabled
    this.beta = data.beta
    this.sort_order = data.sort_order
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  // Static methods for database operations
  static create(data: CreateTool): Tool {
    const now = Math.floor(Date.now() / 1000)
    return new Tool({
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      enabled: true,
      beta: false,
      sort_order: 0,
      ...data,
    })
  }

  static fromRow(row: any): Tool {
    return new Tool(
      ToolSchema.parse({
        ...row,
        config: JSON.parse(row.config),
      })
    )
  }

  toRow(): Record<string, any> {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      category: this.category,
      description: this.description,
      config: JSON.stringify(this.config),
      enabled: this.enabled,
      beta: this.beta,
      sort_order: this.sort_order,
      created_at: this.created_at,
      updated_at: this.updated_at,
    }
  }

  update(data: UpdateTool): Tool {
    return new Tool({
      ...this,
      ...data,
      updated_at: Math.floor(Date.now() / 1000),
    })
  }

  enable(): Tool {
    return this.update({ enabled: true })
  }

  disable(): Tool {
    return this.update({ enabled: false })
  }

  markAsBeta(): Tool {
    return this.update({ beta: true })
  }

  markAsStable(): Tool {
    return this.update({ beta: false })
  }

  setSortOrder(order: number): Tool {
    return this.update({ sort_order: order })
  }

  // Helper methods
  get isAvailable(): boolean {
    return this.enabled && (!this.beta || process.env.ENABLE_BETA_FEATURES === 'true')
  }

  get maxInputSize(): number {
    return this.config.quotas.maxInputSize
  }

  get maxExecutionTime(): number {
    return this.config.quotas.maxExecutionTime
  }

  get requiresAuth(): boolean {
    return this.config.quotas.requiresAuth
  }

  get executionMode(): ExecutionMode {
    return this.config.executionMode
  }

  get isAsynchronous(): boolean {
    return this.executionMode === 'async' || this.executionMode === 'streaming'
  }

  validateInput(input: any): { valid: boolean; errors?: string[] } {
    try {
      // Simple validation based on input schema
      const schema = this.config.inputSchema
      if (!schema || Object.keys(schema).length === 0) {
        return { valid: true }
      }

      // For now, do basic type checking
      // In a real implementation, use a JSON schema validator like ajv
      if (schema.type === 'object' && typeof input !== 'object') {
        return { valid: false, errors: ['Input must be an object'] }
      }

      if (schema.type === 'string' && typeof input !== 'string') {
        return { valid: false, errors: ['Input must be a string'] }
      }

      if (schema.type === 'number' && typeof input !== 'number') {
        return { valid: false, errors: ['Input must be a number'] }
      }

      if (schema.type === 'boolean' && typeof input !== 'boolean') {
        return { valid: false, errors: ['Input must be a boolean'] }
      }

      // Check required parameters
      const errors: string[] = []
      for (const param of this.config.parameters) {
        if (param.required && !(param.name in input)) {
          errors.push(`Missing required parameter: ${param.name}`)
        }
      }

      if (errors.length > 0) {
        return { valid: false, errors }
      }

      return { valid: true }
    } catch (_error) {
      return { valid: false, errors: ['Validation error'] }
    }
  }

  validateOutput(output: any): { valid: boolean; errors?: string[] } {
    try {
      const schema = this.config.outputSchema
      if (!schema || Object.keys(schema).length === 0) {
        return { valid: true }
      }

      // Similar to input validation, implement basic type checking
      if (schema.type === 'object' && typeof output !== 'object') {
        return { valid: false, errors: ['Output must be an object'] }
      }

      if (schema.type === 'string' && typeof output !== 'string') {
        return { valid: false, errors: ['Output must be a string'] }
      }

      if (schema.type === 'number' && typeof output !== 'number') {
        return { valid: false, errors: ['Output must be a number'] }
      }

      return { valid: true }
    } catch (_error) {
      return { valid: false, errors: ['Output validation error'] }
    }
  }

  getParameterSchema(): Array<{
    name: string
    type: string
    required: boolean
    default?: any
    description?: string
  }> {
    return this.config.parameters
  }

  // Factory methods for common tool types
  static createJsonFormatter(): Tool {
    return Tool.create({
      slug: 'json-format',
      name: 'JSON Formatter',
      category: 'json',
      description: 'Format and pretty-print JSON data',
      config: {
        inputSchema: {
          type: 'object',
          properties: {
            json: { type: 'string', description: 'JSON string to format' },
            indent: {
              type: 'number',
              default: 2,
              description: 'Indentation spaces',
            },
            sort_keys: {
              type: 'boolean',
              default: false,
              description: 'Sort object keys alphabetically',
            },
          },
          required: ['json'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            formatted: { type: 'string', description: 'Formatted JSON string' },
            valid: {
              type: 'boolean',
              description: 'Whether input was valid JSON',
            },
            errors: {
              type: 'array',
              items: { type: 'string' },
              description: 'Validation errors if any',
            },
          },
        },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024 * 1024, // 1MB
          maxExecutionTime: 1000, // 1s
          requiresAuth: false,
        },
        parameters: [
          {
            name: 'json',
            type: 'string',
            required: true,
            description: 'JSON string to format',
          },
          {
            name: 'indent',
            type: 'number',
            required: false,
            default: 2,
            description: 'Indentation spaces',
          },
          {
            name: 'sort_keys',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Sort object keys alphabetically',
          },
        ],
      },
    })
  }

  static createJsonValidator(): Tool {
    return Tool.create({
      slug: 'json-validate',
      name: 'JSON Validator',
      category: 'json',
      description: 'Validate JSON data against schema',
      config: {
        inputSchema: {
          type: 'object',
          properties: {
            json: { type: 'string', description: 'JSON string to validate' },
            schema: {
              type: 'object',
              description: 'JSON schema to validate against',
            },
          },
          required: ['json'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean', description: 'Whether JSON is valid' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              description: 'Validation errors',
            },
          },
        },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024 * 1024, // 1MB
          maxExecutionTime: 2000, // 2s
          requiresAuth: false,
        },
      },
    })
  }

  static createCodeExecutor(): Tool {
    return Tool.create({
      slug: 'code-execute',
      name: 'Code Executor',
      category: 'execution',
      description: 'Execute code in various programming languages',
      config: {
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Code to execute' },
            language: {
              type: 'string',
              enum: ['javascript', 'typescript', 'python'],
              description: 'Programming language',
            },
            input: {
              type: 'string',
              description: 'Standard input for the code',
            },
            timeout: {
              type: 'number',
              default: 5000,
              description: 'Execution timeout in milliseconds',
            },
          },
          required: ['code', 'language'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            output: { type: 'string', description: 'Program output' },
            error: { type: 'string', description: 'Error output if any' },
            exit_code: { type: 'number', description: 'Program exit code' },
            execution_time: {
              type: 'number',
              description: 'Execution time in milliseconds',
            },
            memory_usage: {
              type: 'number',
              description: 'Memory usage in bytes',
            },
          },
        },
        executionMode: 'async' as const,
        quotas: {
          maxInputSize: 100 * 1024, // 100KB
          maxExecutionTime: 10000, // 10s
          requiresAuth: true,
        },
      },
    })
  }
}

// SQL queries
export const TOOL_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      config TEXT NOT NULL,
      enabled BOOLEAN DEFAULT true,
      beta BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `,

  CREATE_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);',
    'CREATE INDEX IF NOT EXISTS idx_tools_enabled ON tools(enabled);',
    'CREATE INDEX IF NOT EXISTS idx_tools_sort ON tools(sort_order);',
    'CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);',
  ],

  INSERT: `
    INSERT INTO tools (id, slug, name, category, description, config, enabled, beta, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,

  SELECT_BY_ID: `
    SELECT * FROM tools WHERE id = ?;
  `,

  SELECT_BY_SLUG: `
    SELECT * FROM tools WHERE slug = ?;
  `,

  SELECT_ENABLED: `
    SELECT * FROM tools WHERE enabled = true ORDER BY sort_order ASC, name ASC;
  `,

  SELECT_BY_CATEGORY: `
    SELECT * FROM tools WHERE category = ? AND enabled = true ORDER BY sort_order ASC, name ASC;
  `,

  SELECT_BETA: `
    SELECT * FROM tools WHERE beta = true AND enabled = true ORDER BY sort_order ASC, name ASC;
  `,

  UPDATE: `
    UPDATE tools
    SET name = ?, category = ?, description = ?, config = ?, enabled = ?, beta = ?, sort_order = ?, updated_at = ?
    WHERE id = ?;
  `,

  DELETE: `
    DELETE FROM tools WHERE id = ?;
  `,

  LIST: `
    SELECT * FROM tools
    WHERE enabled = true
    ORDER BY sort_order ASC, name ASC
    LIMIT ? OFFSET ?;
  `,

  LIST_BY_CATEGORY: `
    SELECT * FROM tools
    WHERE category = ? AND enabled = true
    ORDER BY sort_order ASC, name ASC
    LIMIT ? OFFSET ?;
  `,

  COUNT: `
    SELECT COUNT(*) as count FROM tools WHERE enabled = true;
  `,

  COUNT_BY_CATEGORY: `
    SELECT COUNT(*) as count FROM tools WHERE category = ? AND enabled = true;
  `,
} as const

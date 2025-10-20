import { Hono } from 'hono'
import {
  authMiddleware,
  optionalAuth,
  requirePremium,
  requireEnterprise,
  getCurrentUser,
  getUserQuota,
  hasPremiumFeatures,
} from '../middleware/auth'

const app = new Hono()

// Apply optional auth to all tool routes - enriches context if auth provided
app.use('*', optionalAuth())

// JSON Tools Routes
app.post('/json/format', async c => {
  try {
    const body = await c.req.json()

    // Validate required parameters
    if (!body.json) {
      return c.json({ error: 'Missing required parameter: json' }, 400)
    }

    // Validate indentation limits
    if (body.indent !== undefined && (body.indent < 0 || body.indent > 8)) {
      return c.json({ error: 'Indentation must be between 0 and 8' }, 400)
    }

    const json = body.json
    const indent = body.indent ?? 2
    const sortKeys = body.sort_keys ?? false

    let parsed
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      return c.json({
        valid: false,
        formatted: null,
        errors: [
          {
            line: 1,
            column: 1,
            message: error instanceof Error ? error.message : 'Invalid JSON',
          },
        ],
        size: json.length,
      })
    }

    // Sort keys if requested
    if (sortKeys && typeof parsed === 'object' && parsed !== null) {
      const sortObjectKeys = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(sortObjectKeys)
        } else if (obj !== null && typeof obj === 'object') {
          const sorted: any = {}
          Object.keys(obj)
            .sort()
            .forEach(key => {
              sorted[key] = sortObjectKeys(obj[key])
            })
          return sorted
        }
        return obj
      }
      parsed = sortObjectKeys(parsed)
    }

    const formatted = JSON.stringify(parsed, null, indent)

    return c.json({
      formatted,
      valid: true,
      size: formatted.length,
      errors: null,
    })
  } catch (error) {
    return c.json({ error: 'Invalid request format' }, 400)
  }
})

app.post('/json/validate', async c => {
  try {
    const body = await c.req.json()

    // Validate required parameters
    if (!body.json) {
      return c.json({ error: 'Missing required parameter: json' }, 400)
    }

    const json = body.json
    const schema = body.schema

    let parsed
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      return c.json({
        valid: false,
        errors: [
          {
            line: 1,
            column: 1,
            message:
              error instanceof Error ? error.message : 'Invalid JSON syntax',
          },
        ],
      })
    }

    // If no schema provided, just check if it's valid JSON
    if (!schema) {
      return c.json({
        valid: true,
        errors: [],
      })
    }

    // Basic schema validation (simplified for MVP)
    // In a real implementation, you'd use a library like ajv
    const errors: string[] = []

    const validateSchema = (
      data: any,
      schema: any,
      path: string = ''
    ): void => {
      if (schema.type === 'object') {
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          errors.push(`${path}: Expected object`)
          return
        }

        if (schema.required) {
          for (const prop of schema.required) {
            if (!(prop in data)) {
              errors.push(`${path}.${prop}: Required property missing`)
            }
          }
        }

        if (schema.properties) {
          for (const [prop, propSchema] of Object.entries(schema.properties)) {
            if (prop in data) {
              validateSchema(
                data[prop],
                propSchema,
                path ? `${path}.${prop}` : prop
              )
            }
          }
        }
      } else if (schema.type === 'array') {
        if (!Array.isArray(data)) {
          errors.push(`${path}: Expected array`)
          return
        }

        if (schema.items && Array.isArray(data)) {
          data.forEach((item, index) => {
            validateSchema(item, schema.items, `${path}[${index}]`)
          })
        }
      } else if (schema.type === 'string') {
        if (typeof data !== 'string') {
          errors.push(`${path}: Expected string`)
        }
      } else if (schema.type === 'number') {
        if (typeof data !== 'number') {
          errors.push(`${path}: Expected number`)
        }
      } else if (schema.type === 'boolean') {
        if (typeof data !== 'boolean') {
          errors.push(`${path}: Expected boolean`)
        }
      }
    }

    validateSchema(parsed, schema)

    return c.json({
      valid: errors.length === 0,
      errors: errors.map(msg => ({ line: 1, column: 1, message: msg })),
    })
  } catch (error) {
    return c.json({ error: 'Invalid request format' }, 400)
  }
})

app.post('/json/convert', async c => {
  try {
    const body = await c.req.json()

    // Validate required parameters
    if (!body.json) {
      return c.json({ error: 'Missing required parameter: json' }, 400)
    }
    if (!body.target_format) {
      return c.json({ error: 'Missing required parameter: target_format' }, 400)
    }

    const json = body.json
    const targetFormat = body.target_format
    const options = body.options ?? {}

    let parsed
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      return c.json({ error: 'Invalid JSON input' }, 400)
    }

    let converted: string

    if (targetFormat === 'csv') {
      if (!Array.isArray(parsed)) {
        // If it's an object, convert to single-row CSV
        const flattened = flattenObject(parsed)
        const headers = Object.keys(flattened)
        const values = headers.map(h => flattened[h])
        converted = [headers.join(','), values.join(',')].join('\n')
      } else {
        // Handle array of objects
        if (parsed.length === 0) {
          converted = ''
        } else {
          const flattened = parsed.map(item => flattenObject(item))
          const headers = Object.keys(flattened[0])
          const rows = flattened.map(item =>
            headers
              .map(h => `"${String(item[h] ?? '').replace(/"/g, '""')}"`)
              .join(',')
          )
          converted = [headers.join(','), ...rows].join('\n')
        }
      }
    } else if (targetFormat === 'xml') {
      converted = jsonToXml(parsed)
    } else {
      return c.json({ error: `Unsupported format: ${targetFormat}` }, 400)
    }

    return c.json({
      converted,
      format: targetFormat,
    })
  } catch (error) {
    return c.json({ error: 'Conversion failed' }, 500)
  }
})

// Helper functions
function flattenObject(
  obj: any,
  prefix = '',
  separator = '.'
): Record<string, any> {
  const flattened: Record<string, any> = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key

      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        Object.assign(flattened, flattenObject(obj[key], newKey, separator))
      } else {
        flattened[newKey] = obj[key]
      }
    }
  }

  return flattened
}

function jsonToXml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent)

  if (
    typeof obj === 'string' ||
    typeof obj === 'number' ||
    typeof obj === 'boolean'
  ) {
    return String(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(item => jsonToXml(item, indent)).join('\n')
  }

  if (typeof obj === 'object' && obj !== null) {
    let xml = ''
    for (const [key, value] of Object.entries(obj)) {
      xml += `${spaces}<${key}>\n`
      xml += jsonToXml(value, indent + 1)
      xml += `${spaces}</${key}>\n`
    }
    return xml
  }

  return ''
}

// Code Execution Routes - requires authentication for security
app.post('/code/execute', authMiddleware({ required: true }), async c => {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const body = await c.req.json()

    // Validate required parameters
    if (!body.code) {
      return c.json({ error: 'Missing required parameter: code' }, 400)
    }
    if (!body.language) {
      return c.json({ error: 'Missing required parameter: language' }, 400)
    }

    const { code, language, input = '', timeout = 5000 } = body

    // Validate language based on subscription tier
    const supportedLanguages = hasPremiumFeatures(c)
      ? ['javascript', 'typescript', 'python']
      : ['javascript']
    if (!supportedLanguages.includes(language)) {
      return c.json(
        {
          error: `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(', ')}`,
        },
        400
      )
    }

    // Validate timeout
    if (timeout < 1000 || timeout > 30000) {
      return c.json(
        { error: 'Timeout must be between 1000ms and 30000ms' },
        400
      )
    }

    // Validate code size
    const maxCodeSize = 1024 * 1024 // 1MB
    if (code.length > maxCodeSize) {
      return c.json({ error: 'Code size exceeds limit' }, 413)
    }

    // Execute code based on language
    let result: any

    if (language === 'javascript' || language === 'typescript') {
      result = await executeJavaScript(code, input, timeout)
    } else if (language === 'python') {
      result = await executePython(code, input, timeout)
    }

    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Invalid request format' }, 400)
  }
})

app.post('/code/format', async c => {
  try {
    const body = await c.req.json()

    // Validate required parameters
    if (!body.code) {
      return c.json({ error: 'Missing required parameter: code' }, 400)
    }
    if (!body.language) {
      return c.json({ error: 'Missing required parameter: language' }, 400)
    }

    const { code, language, options = {} } = body

    // Validate language
    const supportedLanguages = ['javascript', 'typescript', 'python']
    if (!supportedLanguages.includes(language)) {
      return c.json(
        {
          error: `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(', ')}`,
        },
        400
      )
    }

    // Validate options
    if (
      options.indent_size !== undefined &&
      (options.indent_size < 1 || options.indent_size > 8)
    ) {
      return c.json({ error: 'indent_size must be between 1 and 8' }, 400)
    }

    // Format code based on language
    let formatted: string

    if (language === 'javascript' || language === 'typescript') {
      formatted = formatJavaScript(code, options)
    } else if (language === 'python') {
      formatted = formatPython(code, options)
    }

    return c.json({
      formatted,
      language,
      options,
    })
  } catch (error) {
    return c.json(
      {
        error: 'Code formatting failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      400
    )
  }
})

// Code execution helpers
async function executeJavaScript(
  code: string,
  input: string,
  timeout: number
): Promise<any> {
  try {
    // Simple mock execution for MVP
    // In production, this would use a secure sandboxed environment
    const startTime = Date.now()

    // Mock execution with console capture
    const mockOutput = 'Mock JavaScript execution output\n'
    const executionTime = Date.now() - startTime

    return {
      output: mockOutput,
      exit_code: 0,
      execution_time: executionTime,
      memory_usage: 1024000, // 1MB
      error: null,
    }
  } catch (error) {
    return {
      output: '',
      exit_code: 1,
      execution_time: 0,
      memory_usage: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function executePython(
  code: string,
  input: string,
  timeout: number
): Promise<any> {
  try {
    // Simple mock execution for MVP
    // In production, this would use Pyodide or similar
    const startTime = Date.now()

    // Mock execution
    const mockOutput = 'Mock Python execution output\n'
    const executionTime = Date.now() - startTime

    return {
      output: mockOutput,
      exit_code: 0,
      execution_time: executionTime,
      memory_usage: 2048000, // 2MB
      error: null,
    }
  } catch (error) {
    return {
      output: '',
      exit_code: 1,
      execution_time: 0,
      memory_usage: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Code formatting helpers
function formatJavaScript(code: string, options: any): string {
  const indentSize = options.indent_size || 2
  const useTabs = options.use_tabs || false
  const indent = useTabs ? '\t' : ' '.repeat(indentSize)

  // Very basic formatting for MVP
  // In production, this would use Prettier or similar
  let formatted = code
    .replace(/\s*{\s*/g, ` {\n${indent}`)
    .replace(/;\s*/g, ';\n')
    .replace(/}\s*/g, `\n}\n`)
    .replace(/\n\s*\n/g, '\n') // Remove double empty lines

  return formatted.trim()
}

function formatPython(code: string, options: any): string {
  const maxLineLength = options.max_line_length || 79

  // Very basic Python formatting for MVP
  // In production, this would use Black or similar
  let formatted = code
    .replace(/:\s*#/g, ': #') // Fix spacing in comments
    .replace(/\s*:\s*\n/g, ':\n') // Fix colon spacing
    .replace(/\n\s*\n/g, '\n') // Remove double empty lines

  return formatted.trim()
}

// Note: Upload routes have been moved to separate upload router at /api/v1/upload

// General Tools Route
app.get('/', async c => {
  const category = c.req.query('category')
  const enabledOnly = c.req.query('enabled_only') !== 'false'

  const tools = [
    {
      id: 'json-format',
      slug: 'json-format',
      name: 'JSON Formatter',
      category: 'json',
      description: 'Format and beautify JSON files with custom indentation',
      config: {
        inputSchema: {
          type: 'object',
          properties: {
            json: { type: 'string' },
            indent: { type: 'number', minimum: 0, maximum: 8, default: 2 },
            sort_keys: { type: 'boolean', default: false },
          },
          required: ['json'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            formatted: { type: 'string' },
            valid: { type: 'boolean' },
            size: { type: 'number' },
            errors: { type: ['null', 'array'] },
          },
        },
        executionMode: 'sync',
        quotas: {
          maxInputSize: 10485760, // 10MB
          maxExecutionTime: 1000,
          requiresAuth: false,
        },
      },
      enabled: true,
      beta: false,
      sort_order: 1,
    },
    {
      id: 'json-validate',
      slug: 'json-validate',
      name: 'JSON Validator',
      category: 'json',
      description: 'Validate JSON against JSON schema',
      config: {
        inputSchema: {
          type: 'object',
          properties: {
            json: { type: 'string' },
            schema: { type: 'object' },
          },
          required: ['json'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            errors: { type: 'array' },
          },
        },
        executionMode: 'sync',
        quotas: {
          maxInputSize: 10485760,
          maxExecutionTime: 1000,
          requiresAuth: false,
        },
      },
      enabled: true,
      beta: false,
      sort_order: 2,
    },
    {
      id: 'json-convert',
      slug: 'json-convert',
      name: 'JSON Converter',
      category: 'json',
      description: 'Convert JSON to CSV, XML, and other formats',
      config: {
        inputSchema: {
          type: 'object',
          properties: {
            json: { type: 'string' },
            target_format: { type: 'string', enum: ['csv', 'xml'] },
            options: { type: 'object' },
          },
          required: ['json', 'target_format'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            converted: { type: 'string' },
            format: { type: 'string' },
          },
        },
        executionMode: 'sync',
        quotas: {
          maxInputSize: 10485760,
          maxExecutionTime: 2000,
          requiresAuth: false,
        },
      },
      enabled: true,
      beta: false,
      sort_order: 3,
    },
    {
      id: 'code-execute',
      slug: 'code-execute',
      name: 'Code Executor',
      category: 'code',
      description:
        'Execute JavaScript and Python code in a sandboxed environment',
      config: {
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            language: { type: 'string', enum: ['javascript', 'python'] },
            input: { type: 'string' },
            timeout: {
              type: 'number',
              minimum: 1000,
              maximum: 30000,
              default: 5000,
            },
          },
          required: ['code', 'language'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            output: { type: 'string' },
            exit_code: { type: 'number' },
            execution_time: { type: 'number' },
            memory_usage: { type: 'number' },
            error: { type: ['null', 'string'] },
          },
        },
        executionMode: 'async',
        quotas: {
          maxInputSize: 1048576, // 1MB
          maxExecutionTime: 30000,
          requiresAuth: false,
        },
      },
      enabled: true,
      beta: true,
      sort_order: 4,
    },
    {
      id: 'code-format',
      slug: 'code-format',
      name: 'Code Formatter',
      category: 'code',
      description:
        'Format and beautify JavaScript, TypeScript, and Python code',
      config: {
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            language: {
              type: 'string',
              enum: ['javascript', 'typescript', 'python'],
            },
            options: { type: 'object' },
          },
          required: ['code', 'language'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            formatted: { type: 'string' },
            language: { type: 'string' },
            options: { type: 'object' },
          },
        },
        executionMode: 'sync',
        quotas: {
          maxInputSize: 1048576,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
      },
      enabled: true,
      beta: false,
      sort_order: 5,
    },
  ]

  let filteredTools = tools

  if (category) {
    filteredTools = filteredTools.filter(tool => tool.category === category)
  }

  if (enabledOnly) {
    filteredTools = filteredTools.filter(tool => tool.enabled)
  }

  return c.json({
    tools: filteredTools.sort((a, b) => a.sort_order - b.sort_order),
  })
})

export { app as tools }

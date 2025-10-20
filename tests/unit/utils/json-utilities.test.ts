import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock the DOM APIs
Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(),
    },
  },
  writable: true,
})

Object.defineProperty(global, 'window', {
  value: {
    isSecureContext: true,
    URL: {
      createObjectURL: vi.fn(() => 'blob-url'),
      revokeObjectURL: vi.fn(),
    },
    document: {
      createElement: vi.fn(() => ({
        value: '',
        style: { position: '', left: '', top: '' },
        focus: vi.fn(),
        select: vi.fn(),
        click: vi.fn(),
      })),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      execCommand: vi.fn(() => true),
    },
    Blob: vi.fn((content, options) => ({ content, options })),
    MouseEvent: vi.fn(),
  },
  writable: true,
})

// Simplified implementations of JSON utility functions for testing
interface JsonValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
}

interface JsonValidationResult {
  isValid: boolean
  errors: JsonValidationError[]
  lineNumbers?: number[]
}

interface JsonFormatOptions {
  indent: number
  sortKeys: boolean
  compact: boolean
  trailingComma: boolean
}

interface TreeNode {
  key: string
  value: unknown
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  path: string
  children?: TreeNode[]
  isExpanded?: boolean
  level: number
}

function validateJson(content: string): JsonValidationResult {
  const errors: JsonValidationError[] = []
  let isValid = true

  if (!content.trim()) {
    return {
      isValid: false,
      errors: [
        { line: 1, column: 1, message: 'Empty input', severity: 'error' },
      ],
    }
  }

  try {
    JSON.parse(content)
  } catch (error) {
    isValid = false
    const errorMessage = error instanceof Error ? error.message : 'Invalid JSON'

    // Parse error message to extract line and column numbers
    const lineMatch = errorMessage.match(/line (\d+)/i)
    const columnMatch = errorMessage.match(/column (\d+)/i)
    const positionMatch = errorMessage.match(/position (\d+)/i)

    let line = 1
    let column = 1

    if (lineMatch) {
      line = parseInt(lineMatch[1], 10)
    } else if (positionMatch) {
      // Calculate line and column from character position
      const position = parseInt(positionMatch[1], 10)
      const lines = content.substring(0, position).split('\n')
      line = lines.length
      column = lines[lines.length - 1].length + 1
    }

    if (columnMatch) {
      column = parseInt(columnMatch[1], 10)
    }

    errors.push({
      line,
      column,
      message: errorMessage,
      severity: 'error',
    })
  }

  return {
    isValid,
    errors,
    lineNumbers: errors.length > 0 ? errors.map(e => e.line) : undefined,
  }
}

function formatJson(content: string, options: JsonFormatOptions): string {
  try {
    const parsed = JSON.parse(content)
    let formatted = JSON.stringify(parsed, null, options.indent)

    if (options.compact) {
      formatted = JSON.stringify(parsed)
    }

    if (options.sortKeys) {
      const sorted = sortJsonKeys(parsed)
      formatted = JSON.stringify(sorted, null, options.indent)
    }

    if (options.trailingComma && !options.compact) {
      formatted = formatted
        .replace(/([}\]])/g, '$1,')
        .replace(/,(\s*[}\]])/g, '$1')
    }

    return formatted
  } catch (error) {
    throw new Error(
      `Failed to format JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

function sortJsonKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys)
  }

  if (obj !== null && typeof obj === 'object') {
    const sortedObj: Record<string, unknown> = {}
    const keys = Object.keys(obj).sort()

    for (const key of keys) {
      sortedObj[key] = sortJsonKeys((obj as Record<string, unknown>)[key])
    }

    return sortedObj
  }

  return obj
}

function parseJsonToTree(data: unknown, path = 'root', level = 0): TreeNode[] {
  if (data === null || typeof data !== 'object') {
    return [
      {
        key: path,
        value: data,
        type: getValueType(data),
        path,
        level,
      },
    ]
  }

  if (Array.isArray(data)) {
    return data.map((item, index) => ({
      key: `${path}[${index}]`,
      value: item,
      type: 'array',
      path: `${path}[${index}]`,
      children: parseJsonToTree(item, `${path}[${index}]`, level + 1),
      level,
    }))
  }

  return Object.entries(data as Record<string, unknown>).map(
    ([key, value]) => ({
      key: `${path}.${key}`,
      value,
      type: getValueType(value),
      path: `${path}.${key}`,
      children:
        typeof value === 'object' && value !== null
          ? parseJsonToTree(value, `${path}.${key}`, level + 1)
          : undefined,
      level,
    })
  )
}

function getValueType(value: unknown): TreeNode['type'] {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'string'
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    return new Promise((resolve, reject) => {
      if (document.execCommand('copy')) {
        resolve()
      } else {
        reject(new Error('Failed to copy to clipboard'))
      }
      document.body.removeChild(textArea)
    })
  }
}

function downloadFile(
  content: string,
  filename: string,
  contentType = 'text/plain'
): void {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

describe('JSON Utils', () => {
  describe('validateJson', () => {
    it('should validate valid JSON', () => {
      const validJson = '{"name": "John", "age": 30}'
      const result = validateJson(validJson)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.lineNumbers).toBeUndefined()
    })

    it('should reject invalid JSON', () => {
      const invalidJson = '{"name": "John", age: 30}' // Missing quotes around age
      const result = validateJson(invalidJson)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].severity).toBe('error')
      expect(result.errors[0].line).toBe(1)
      expect(result.errors[0].column).toBeGreaterThan(0)
      expect(result.errors[0].message).toContain('JSON')
    })

    it('should handle empty input', () => {
      const result = validateJson('')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('Empty input')
      expect(result.errors[0].line).toBe(1)
      expect(result.errors[0].column).toBe(1)
    })

    it('should handle whitespace-only input', () => {
      const result = validateJson('   \n  \t  ')

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toBe('Empty input')
    })

    it('should handle array validation', () => {
      const validArray = '[1, 2, 3, {"nested": true}]'
      const result = validateJson(validArray)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle number validation', () => {
      const validNumber = '42'
      const result = validateJson(validNumber)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle string validation', () => {
      const validString = '"Hello, World!"'
      const result = validateJson(validString)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle boolean validation', () => {
      const validBoolean = 'true'
      const result = validateJson(validBoolean)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle null validation', () => {
      const validNull = 'null'
      const result = validateJson(validNull)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('formatJson', () => {
    const defaultOptions: JsonFormatOptions = {
      indent: 2,
      sortKeys: false,
      compact: false,
      trailingComma: false,
    }

    it('should format JSON with default options', () => {
      const input = '{"name":"John","age":30}'
      const result = formatJson(input, defaultOptions)

      expect(result).toContain('"name": "John"')
      expect(result).toContain('"age": 30')
      expect(result.split('\n').length).toBeGreaterThan(1)
    })

    it('should format JSON with custom indent', () => {
      const input = '{"name":"John","age":30}'
      const options = { ...defaultOptions, indent: 4 }
      const result = formatJson(input, options)

      expect(result).toContain('    "name"')
      expect(result).toContain('    "age"')
    })

    it('should format JSON compactly', () => {
      const input = '{"name":"John","age":30}'
      const options = { ...defaultOptions, compact: true }
      const result = formatJson(input, options)

      expect(result).toBe('{"name":"John","age":30}')
      expect(result.split('\n').length).toBe(1)
    })

    it('should sort keys alphabetically', () => {
      const input = '{"z":1,"a":2,"m":3}'
      const options = { ...defaultOptions, sortKeys: true }
      const result = formatJson(input, options)

      const lines = result.split('\n').filter(line => line.trim().includes('"'))
      expect(lines[0]).toContain('"a"')
      expect(lines[1]).toContain('"m"')
      expect(lines[2]).toContain('"z"')
    })

    it('should handle nested objects', () => {
      const input = '{"user":{"name":"John","details":{"age":30}}}'
      const result = formatJson(input, defaultOptions)

      expect(result).toContain('"user": {')
      expect(result).toContain('"name": "John"')
      expect(result).toContain('"details": {')
      expect(result).toContain('"age": 30')
    })

    it('should handle arrays', () => {
      const input = '[1,2,3]'
      const result = formatJson(input, defaultOptions)

      expect(result).toContain('[')
      expect(result).toContain(']')
      expect(result.split('\n').length).toBeGreaterThan(1)
    })

    it('should throw error for invalid JSON', () => {
      const input = '{"name":"John",age:30}'

      expect(() => formatJson(input, defaultOptions)).toThrow(
        'Failed to format JSON'
      )
    })

    it('should handle empty object', () => {
      const input = '{}'
      const result = formatJson(input, defaultOptions)

      expect(result).toBe('{}')
    })

    it('should handle empty array', () => {
      const input = '[]'
      const result = formatJson(input, defaultOptions)

      expect(result).toBe('[]')
    })
  })

  describe('sortJsonKeys', () => {
    it('should sort keys in flat object', () => {
      const input = { z: 1, a: 2, m: 3 }
      const result = sortJsonKeys(input)

      expect(Object.keys(result as any)).toEqual(['a', 'm', 'z'])
      expect((result as any).a).toBe(2)
      expect((result as any).m).toBe(3)
      expect((result as any).z).toBe(1)
    })

    it('should sort keys recursively in nested objects', () => {
      const input = {
        z: 1,
        nested: {
          z: 'nested',
          a: 'first',
          m: 'middle',
        },
        a: 2,
      }
      const result = sortJsonKeys(input)

      expect(Object.keys(result as any)).toEqual(['a', 'nested', 'z'])
      expect(Object.keys((result as any).nested)).toEqual(['a', 'm', 'z'])
    })

    it('should handle arrays without sorting', () => {
      const input = [3, 1, 2]
      const result = sortJsonKeys(input)

      expect(result).toEqual([3, 1, 2])
    })

    it('should handle primitive values', () => {
      expect(sortJsonKeys('string')).toBe('string')
      expect(sortJsonKeys(42)).toBe(42)
      expect(sortJsonKeys(true)).toBe(true)
      expect(sortJsonKeys(null)).toBe(null)
    })

    it('should handle empty object', () => {
      const result = sortJsonKeys({})
      expect(result).toEqual({})
    })
  })

  describe('parseJsonToTree', () => {
    it('should parse simple object to tree', () => {
      const data = { name: 'John', age: 30 }
      const result = parseJsonToTree(data)

      expect(result).toHaveLength(2)
      expect(result[0].key).toBe('root.name')
      expect(result[0].value).toBe('John')
      expect(result[0].type).toBe('string')
      expect(result[0].path).toBe('root.name')
      expect(result[0].level).toBe(0)

      expect(result[1].key).toBe('root.age')
      expect(result[1].value).toBe(30)
      expect(result[1].type).toBe('number')
    })

    it('should parse nested object to tree', () => {
      const data = { user: { name: 'John', age: 30 } }
      const result = parseJsonToTree(data)

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('root.user')
      expect(result[0].type).toBe('object')
      expect(result[0].children).toBeDefined()
      expect(result[0].children).toHaveLength(2)

      const nameChild = result[0].children![0]
      expect(nameChild.key).toBe('root.user.name')
      expect(nameChild.value).toBe('John')
      expect(nameChild.level).toBe(1)
    })

    it('should parse array to tree', () => {
      const data = [1, 2, 3]
      const result = parseJsonToTree(data)

      expect(result).toHaveLength(3)
      expect(result[0].key).toBe('root[0]')
      expect(result[0].value).toBe(1)
      expect(result[0].type).toBe('array')
      expect(result[0].level).toBe(0)

      expect(result[1].key).toBe('root[1]')
      expect(result[1].value).toBe(2)
    })

    it('should handle null values', () => {
      const data = { name: null }
      const result = parseJsonToTree(data)

      expect(result[0].key).toBe('root.name')
      expect(result[0].value).toBe(null)
      expect(result[0].type).toBe('null')
    })

    it('should handle different data types', () => {
      const data = {
        string: 'hello',
        number: 42,
        boolean: true,
        nullValue: null,
        array: [1, 2, 3],
        object: { nested: true },
      }
      const result = parseJsonToTree(data)

      const nodeMap = new Map(
        result.map(node => [node.key.split('.').pop(), node])
      )

      expect(nodeMap.get('string')?.type).toBe('string')
      expect(nodeMap.get('number')?.type).toBe('number')
      expect(nodeMap.get('boolean')?.type).toBe('boolean')
      expect(nodeMap.get('nullValue')?.type).toBe('null')
      expect(nodeMap.get('array')?.type).toBe('array')
      expect(nodeMap.get('object')?.type).toBe('object')
    })
  })

  describe('copyToClipboard', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      // Ensure DOM APIs are available
      Object.defineProperty(global, 'document', {
        value: window.document,
        writable: true,
      })
    })

    it('should copy text using modern clipboard API', async () => {
      const mockWriteText = vi.mocked(navigator.clipboard.writeText)
      mockWriteText.mockResolvedValue(undefined)

      await copyToClipboard('test text')

      expect(mockWriteText).toHaveBeenCalledWith('test text')
    })

    it('should fallback to execCommand for older browsers', async () => {
      // Mock no clipboard support
      Object.defineProperty(global.navigator, 'clipboard', {
        value: undefined,
        writable: true,
      })

      const mockTextArea = {
        value: '',
        style: { position: '', left: '', top: '' },
        focus: vi.fn(),
        select: vi.fn(),
      }

      const mockCreateElement = vi.mocked(document.createElement)
      mockCreateElement.mockReturnValue(mockTextArea as any)

      const mockExecCommand = vi.mocked(document.execCommand)
      mockExecCommand.mockReturnValue(true)

      await copyToClipboard('test text')

      expect(mockCreateElement).toHaveBeenCalledWith('textarea')
      expect(mockTextArea.value).toBe('test text')
      expect(mockTextArea.focus).toHaveBeenCalled()
      expect(mockTextArea.select).toHaveBeenCalled()
      expect(mockExecCommand).toHaveBeenCalledWith('copy')
      expect(document.body.appendChild).toHaveBeenCalledWith(mockTextArea)
      expect(document.body.removeChild).toHaveBeenCalledWith(mockTextArea)
    })
  })

  describe('downloadFile', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      // Ensure DOM APIs are available
      Object.defineProperty(global, 'document', {
        value: window.document,
        writable: true,
      })
    })

    it('should download file with default content type', () => {
      const mockCreateElement = vi.mocked(document.createElement)
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      mockCreateElement.mockReturnValue(mockLink as any)

      // URL is already mocked in the global setup

      downloadFile('test content', 'test.txt')

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockLink.href).toBe('blob-url')
      expect(mockLink.download).toBe('test.txt')
      expect(mockLink.click).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink)
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink)
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob-url')
    })

    it('should download file with custom content type', () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      const mockCreateElement = vi.mocked(document.createElement)
      mockCreateElement.mockReturnValue(mockLink as any)

      const originalBlob = global.Blob
      global.Blob = vi
        .fn()
        .mockImplementation((content, options) => ({ content, options }) as any)

      downloadFile('json content', 'data.json', 'application/json')

      expect(global.Blob).toHaveBeenCalledWith(['json content'], {
        type: 'application/json',
      })
      expect(mockLink.download).toBe('data.json')

      // Restore original Blob
      global.Blob = originalBlob
    })
  })

  describe('getValueType', () => {
    it('should identify null values', () => {
      expect(getValueType(null)).toBe('null')
    })

    it('should identify arrays', () => {
      expect(getValueType([])).toBe('array')
      expect(getValueType([1, 2, 3])).toBe('array')
    })

    it('should identify objects', () => {
      expect(getValueType({})).toBe('object')
      expect(getValueType({ key: 'value' })).toBe('object')
    })

    it('should identify strings', () => {
      expect(getValueType('')).toBe('string')
      expect(getValueType('hello')).toBe('string')
    })

    it('should identify numbers', () => {
      expect(getValueType(0)).toBe('number')
      expect(getValueType(42)).toBe('number')
      expect(getValueType(3.14)).toBe('number')
      expect(getValueType(-10)).toBe('number')
    })

    it('should identify booleans', () => {
      expect(getValueType(true)).toBe('boolean')
      expect(getValueType(false)).toBe('boolean')
    })

    it('should handle undefined values as string', () => {
      expect(getValueType(undefined)).toBe('string')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle special Unicode characters', () => {
      const unicodeJson =
        '{"emoji": "🎉", "chinese": "中文", "arabic": "العربية"}'
      const result = validateJson(unicodeJson)

      expect(result.isValid).toBe(true)
    })

    it('should handle escape sequences', () => {
      const escapeJson =
        '{"newline": "\\n", "tab": "\\t", "quote": "\\"", "backslash": "\\\\"}'
      const result = validateJson(escapeJson)

      expect(result.isValid).toBe(true)
    })

    it('should handle very large JSON strings', () => {
      const largeObject: any = {}
      for (let i = 0; i < 100; i++) {
        largeObject[`key${i}`] = `value${i}`
      }

      const largeJson = JSON.stringify(largeObject)
      const result = validateJson(largeJson)

      expect(result.isValid).toBe(true)
    })
  })
})

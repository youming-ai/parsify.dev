import { describe, it, expect, beforeEach } from 'vitest'
import { CodeFormatter, formatCode, detectLanguage } from '../wasm/code_formatter'

describe('CodeFormatter', () => {
  let formatter: CodeFormatter

  beforeEach(async () => {
    formatter = new CodeFormatter()
    await formatter.initialize()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      expect(formatter.isReady()).toBe(true)
    })

    it('should support multiple languages', () => {
      const supportedLanguages = formatter.getSupportedLanguages()
      expect(supportedLanguages).toContain('javascript')
      expect(supportedLanguages).toContain('typescript')
      expect(supportedLanguages).toContain('python')
      expect(supportedLanguages).toContain('java')
      expect(supportedLanguages).toContain('rust')
      expect(supportedLanguages).toContain('go')
      expect(supportedLanguages.length).toBeGreaterThan(20)
    })
  })

  describe('Language Detection', () => {
    it('should detect JavaScript code', async () => {
      const jsCode = 'const hello = () => { console.log("Hello, World!"); };'
      const language = await formatter.detectLanguage(jsCode)
      expect(language).toBe('javascript')
    })

    it('should detect Python code', async () => {
      const pyCode = 'def hello():\n    print("Hello, World!")'
      const language = await formatter.detectLanguage(pyCode)
      expect(language).toBe('python')
    })

    it('should detect JSON code', async () => {
      const jsonCode = '{"hello": "world", "number": 42}'
      const language = await formatter.detectLanguage(jsonCode)
      expect(language).toBe('json')
    })

    it('should return null for unknown code', async () => {
      const unknownCode = 'This is just plain text without any specific syntax'
      const language = await formatter.detectLanguage(unknownCode)
      expect(language).toBeNull()
    })
  })

  describe('Code Formatting', () => {
    it('should format JavaScript code', async () => {
      const jsCode = 'const x=1;const y=2;console.log(x+y);'
      const result = await formatter.format(jsCode, 'javascript')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeTruthy()
      expect(result.language).toBe('javascript')
      expect(result.originalSize).toBe(jsCode.length)
      expect(result.formattedSize).toBeGreaterThan(0)
      expect(result.metadata.wasWasmUsed).toBeDefined()
      expect(result.metadata.formatterUsed).toBeDefined()
    })

    it('should format Python code', async () => {
      const pyCode = 'def hello():print("Hello")'
      const result = await formatter.format(pyCode, 'python')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeTruthy()
      expect(result.language).toBe('python')
      expect(result.metadata.lineCount).toBeGreaterThan(0)
    })

    it('should format JSON code', async () => {
      const jsonCode = '{"name":"John","age":30}'
      const result = await formatter.format(jsonCode, 'json')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeTruthy()
      expect(result.formatted).toContain('\n') // Should be pretty printed
      expect(result.language).toBe('json')
    })

    it('should handle empty code', async () => {
      await expect(formatter.format('', 'javascript')).rejects.toThrow('Code cannot be empty')
    })

    it('should handle unsupported language', async () => {
      const code = 'some code'
      await expect(formatter.format(code, 'unsupported' as any)).rejects.toThrow('Language \'unsupported\' is not supported')
    })
  })

  describe('Language Support', () => {
    it('should check language support', () => {
      expect(formatter.isLanguageSupported('javascript')).toBe(true)
      expect(formatter.isLanguageSupported('typescript')).toBe(true)
      expect(formatter.isLanguageSupported('python')).toBe(true)
      expect(formatter.isLanguageSupported('unsupported')).toBe(false)
    })

    it('should provide formatter information', () => {
      const jsInfo = formatter.getFormatterInfo('javascript')
      expect(jsInfo.name).toBeDefined()
      expect(jsInfo.version).toBeDefined()
      expect(typeof jsInfo.available).toBe('boolean')
    })
  })
})

describe('Utility Functions', () => {
  beforeEach(async () => {
    const formatter = new CodeFormatter()
    await formatter.initialize()
  })

  it('should format code using utility function', async () => {
    const result = await formatCode('const x=1;', 'javascript')
    expect(result.success).toBe(true)
    expect(result.formatted).toBeTruthy()
  })

  it('should detect language using utility function', async () => {
    const language = await detectLanguage('const x = 1;')
    expect(language).toBe('javascript')
  })
})

import { describe, it, expect } from 'vitest'
import type { FileParseRequest, FileParseResponse } from '../../contracts/file-processing.json'

describe('JSON Parsing Contract', () => {
  describe('POST /api/file/parse', () => {
    it('should parse valid JSON from markdown code blocks', async () => {
      const request: FileParseRequest = {
        content: `# Test File

\`\`\`json
{
  "name": "test",
  "value": 123
}
\`\`\`

Some text here.
`,
        options: {
          extractMode: 'codeblock',
          maxDepth: 10
        }
      }

      const response: FileParseResponse = {
        success: true,
        documents: [{
          id: 'doc1',
          rawJson: '{\n  "name": "test",\n  "value": 123\n}',
          parsedData: {
            name: "test",
            value: 123
          },
          isValid: true,
          extractionMethod: 'codeblock',
          lineNumber: 3
        }],
        errors: []
      }

      expect(response.success).toBe(true)
      expect(response.documents).toHaveLength(1)
      expect(response.documents[0].isValid).toBe(true)
      expect(response.documents[0].parsedData.name).toBe('test')
    })

    it('should handle invalid JSON gracefully', async () => {
      const request: FileParseRequest = {
        content: `# Invalid JSON

\`\`\`json
{
  "name": "test",
  "value": 123,
}
\`\`\`
`,
        options: {
          extractMode: 'codeblock',
          maxDepth: 10
        }
      }

      const response: FileParseResponse = {
        success: false,
        documents: [{
          id: 'doc1',
          rawJson: '{\n  "name": "test",\n  "value": 123,\n}',
          parsedData: null,
          isValid: false,
          extractionMethod: 'codeblock',
          errorMessage: 'Invalid JSON syntax: Unexpected trailing comma',
          lineNumber: 3
        }],
        errors: [{
          code: 'INVALID_JSON_SYNTAX',
          message: 'Invalid JSON syntax at line 4, column 1',
          line: 4,
          column: 1,
          severity: 'error'
        }]
      }

      expect(response.success).toBe(false)
      expect(response.documents[0].isValid).toBe(false)
      expect(response.documents[0].errorMessage).toBeDefined()
    })

    it('should extract inline JSON when specified', async () => {
      const request: FileParseRequest = {
        content: 'Configuration: {"theme": "dark", "debug": true}',
        options: {
          extractMode: 'inline',
          maxDepth: 10
        }
      }

      const response: FileParseResponse = {
        success: true,
        documents: [{
          id: 'doc1',
          rawJson: '{"theme": "dark", "debug": true}',
          parsedData: {
            theme: "dark",
            debug: true
          },
          isValid: true,
          extractionMethod: 'inline'
        }],
        errors: []
      }

      expect(response.success).toBe(true)
      expect(response.documents[0].extractionMethod).toBe('inline')
    })
  })
})
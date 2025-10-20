import type { JsonDocument } from './types'
import { JsonDocumentModel } from './models/JsonDocument'

export class JsonExtractor {
  private readonly JSON_CODEBLOCK_REGEX = /```json\s*([\s\S]*?)\s*```/gi
  private readonly INLINE_JSON_REGEX = /({[\s\S]*?})/g
  private readonly JSON_STRING_REGEX = /"([^"\\]|\\.)*"/g

  extractJsonFromMarkdown(
    content: string,
    mode: 'codeblock' | 'inline' | 'mixed' = 'mixed'
  ): JsonDocument[] {
    const documents: JsonDocument[] = []

    try {
      switch (mode) {
        case 'codeblock':
          return this.extractFromCodeBlocks(content)
        case 'inline':
          return this.extractInline(content)
        case 'mixed':
        default:
          return this.extractMixed(content)
      }
    } catch (error) {
      console.error('Error extracting JSON from markdown:', error)
      return []
    }
  }

  private extractFromCodeBlocks(content: string): JsonDocument[] {
    const documents: JsonDocument[] = []
    const lines = content.split('\n')

    let match: RegExpExecArray | null
    this.JSON_CODEBLOCK_REGEX.lastIndex = 0 // Reset regex

    while ((match = this.JSON_CODEBLOCK_REGEX.exec(content)) !== null) {
      const jsonContent = match[1]?.trim()
      if (jsonContent) {
        const lineNumber = this.getLineNumber(content, match.index)
        const document = JsonDocumentModel.createFromExtraction(
          jsonContent,
          'codeblock',
          lineNumber
        )
        documents.push(document)
      }
    }

    return documents
  }

  private extractInline(content: string): JsonDocument[] {
    const documents: JsonDocument[] = []
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const inlineJsons = this.findInlineJson(line)

      for (const json of inlineJsons) {
        const document = JsonDocumentModel.createFromExtraction(
          json,
          'inline',
          i + 1
        )
        documents.push(document)
      }
    }

    return documents
  }

  private extractMixed(content: string): JsonDocument[] {
    const documents: JsonDocument[] = []

    // First extract from code blocks
    const codeBlockDocs = this.extractFromCodeBlocks(content)
    documents.push(...codeBlockDocs)

    // Then extract inline JSON, avoiding those already in code blocks
    const inlineDocs = this.extractInlineOutsideCodeBlocks(content)
    documents.push(...inlineDocs)

    return documents
  }

  private extractInlineOutsideCodeBlocks(content: string): JsonDocument[] {
    const documents: JsonDocument[] = []
    const lines = content.split('\n')
    let inCodeBlock = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check if we're entering or exiting a code block
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock
        continue
      }

      // Only extract JSON if we're not in a code block
      if (!inCodeBlock) {
        const inlineJsons = this.findInlineJson(line)
        for (const json of inlineJsons) {
          const document = JsonDocumentModel.createFromExtraction(
            json,
            'mixed',
            i + 1
          )
          documents.push(document)
        }
      }
    }

    return documents
  }

  private findInlineJson(line: string): string[] {
    const jsonStrings: string[] = []
    let braceCount = 0
    let start = -1
    let inString = false
    let escapeNext = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      if (char === '"' && !escapeNext) {
        inString = !inString
        continue
      }

      if (inString) {
        continue
      }

      if (char === '{') {
        if (braceCount === 0) {
          start = i
        }
        braceCount++
      } else if (char === '}') {
        braceCount--
        if (braceCount === 0 && start !== -1) {
          const jsonString = line.substring(start, i + 1)
          if (this.isValidJsonString(jsonString)) {
            jsonStrings.push(jsonString)
          }
          start = -1
        }
      }
    }

    return jsonStrings
  }

  private isValidJsonString(str: string): boolean {
    try {
      const parsed = JSON.parse(str)
      return parsed !== null && typeof parsed === 'object'
    } catch {
      return false
    }
  }

  private getLineNumber(content: string, index: number): number {
    const beforeIndex = content.substring(0, index)
    return beforeIndex.split('\n').length
  }

  cleanJsonString(jsonString: string): string {
    // Remove common markdown formatting issues
    return jsonString
      .replace(/^[\s>]+/, '') // Remove leading spaces and blockquote markers
      .replace(/[\s>]+$/, '') // Remove trailing spaces and blockquote markers
      .trim()
  }

  extractJsonFromText(content: string): JsonDocument[] {
    const documents: JsonDocument[] = []
    const potentialJsons = content.match(/{[^{}]*}/g) || []

    for (const json of potentialJsons) {
      try {
        const parsed = JSON.parse(json)
        if (parsed !== null && typeof parsed === 'object') {
          const document = JsonDocumentModel.createFromExtraction(json, 'inline')
          documents.push(document)
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    return documents
  }

  isLikelyJson(str: string): boolean {
    const trimmed = str.trim()
    if (!trimmed) return false

    // Quick checks for JSON-like structure
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    )
  }

  getJsonStatistics(documents: JsonDocument[]): {
    total: number
    valid: number
    invalid: number
    averageSize: number
    extractionMethods: Record<string, number>
  } {
    const total = documents.length
    const valid = documents.filter(doc => doc.isValid).length
    const invalid = total - valid
    const averageSize = total > 0
      ? documents.reduce((sum, doc) => sum + doc.rawJson.length, 0) / total
      : 0

    const extractionMethods: Record<string, number> = {}
    documents.forEach(doc => {
      extractionMethods[doc.extractionMethod] = (extractionMethods[doc.extractionMethod] || 0) + 1
    })

    return {
      total,
      valid,
      invalid,
      averageSize,
      extractionMethods
    }
  }
}
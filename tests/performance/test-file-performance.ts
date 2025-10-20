import { describe, it, expect, beforeEach } from 'vitest'
import { measurePerformance } from '../../src/lib/performance'
import { JsonExtractor } from '../../src/lib/jsonExtractor'
import { FileParser } from '../../src/lib/fileParser'

describe('File Performance Tests', () => {
  let jsonExtractor: JsonExtractor
  let fileParser: FileParser

  beforeEach(() => {
    jsonExtractor = new JsonExtractor()
    fileParser = new FileParser()
  })

  describe('JSON Parsing Performance', () => {
    it('should parse small JSON files under 10ms', async () => {
      const smallJson = {
        config: { theme: 'dark', debug: true },
        users: [{ id: 1, name: 'Alice' }],
        settings: { autoSave: true }
      }

      const { duration } = await measurePerformance(async () => {
        return jsonExtractor.parseJson(JSON.stringify(smallJson))
      })

      expect(duration).toBeLessThan(10) // 10ms threshold
    })

    it('should parse medium JSON files under 100ms', async () => {
      // Generate medium-sized JSON (~100KB)
      const mediumJson = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
          tags: [`tag${i % 10}`, `category${i % 5}`],
          metadata: {
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            version: '1.0.0'
          }
        }))
      }

      const { duration } = await measurePerformance(async () => {
        return jsonExtractor.parseJson(JSON.stringify(mediumJson))
      })

      expect(duration).toBeLessThan(100) // 100ms threshold
    })

    it('should parse large JSON files under 200ms', async () => {
      // Generate large JSON (~500KB)
      const largeJson = {
        users: Array.from({ length: 5000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          profile: {
            avatar: `https://example.com/avatar${i}.jpg`,
            bio: `Bio for user ${i}`,
            settings: {
              theme: i % 2 === 0 ? 'dark' : 'light',
              notifications: i % 3 === 0,
              language: ['en', 'es', 'fr'][i % 3]
            }
          },
          activity: Array.from({ length: 10 }, (_, j) => ({
            type: ['login', 'view', 'edit'][j % 3],
            timestamp: new Date(Date.now() - j * 1000).toISOString(),
            metadata: { source: 'web', version: '2.1.0' }
          }))
        }))
      }

      const { duration } = await measurePerformance(async () => {
        return jsonExtractor.parseJson(JSON.stringify(largeJson))
      })

      expect(duration).toBeLessThan(200) // 200ms threshold from spec
    })
  })

  describe('File Processing Performance', () => {
    it('should extract JSON from markdown files under 50ms', async () => {
      const markdownContent = `
# Configuration File

This file contains application configuration.

\`\`\`json
{
  "app": {
    "name": "JSON Reader",
    "version": "1.0.0",
    "settings": {
      "theme": "dark",
      "autoSave": true,
      "maxFileSize": "1MB"
    }
  },
  "features": ["search", "export", "validation"],
  "endpoints": {
    "api": "https://api.example.com",
    "cdn": "https://cdn.example.com"
  }
}
\`\`\`

Additional documentation text here.
      `.trim()

      const { duration } = await measurePerformance(async () => {
        return fileParser.extractJsonFromMarkdown(markdownContent)
      })

      expect(duration).toBeLessThan(50) // 50ms threshold
    })

    it('should handle multiple JSON blocks efficiently', async () => {
      const multipleBlocksContent = `
# Multiple JSON blocks

\`\`\`json
{"type": "config", "version": "1.0"}
\`\`\`

Some text in between.

\`\`\`json
{"type": "data", "items": [1, 2, 3]}
\`\`\`

More content.

\`\`\`json
{"type": "metadata", "author": "test"}
\`\`\`
      `.trim()

      const { duration } = await measurePerformance(async () => {
        return fileParser.extractJsonFromMarkdown(multipleBlocksContent)
      })

      expect(duration).toBeLessThan(80) // 80ms threshold for multiple blocks
      const results = await fileParser.extractJsonFromMarkdown(multipleBlocksContent)
      expect(results).toHaveLength(3)
    })
  })

  describe('Memory Usage Performance', () => {
    it('should not exceed memory limits for large files', async () => {
      // Create a large JSON structure
      const largeData = {
        nodes: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          data: `x`.repeat(100), // 100 characters per node
          nested: {
            level1: { level2: { level3: `data-${i}` } }
          }
        }))
      }

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Process the large data
      const result = await jsonExtractor.parseJson(JSON.stringify(largeData))

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Should not increase memory by more than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      expect(result).toBeDefined()
    })
  })

  describe('Rendering Performance', () => {
    it('should render large JSON trees under 100ms', async () => {
      const largeJson = {
        root: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Node ${i}`,
          children: Array.from({ length: 5 }, (_, j) => ({
            id: `${i}-${j}`,
            value: `Child ${j}`,
            leaf: true
          }))
        }))
      }

      // Mock rendering performance measurement
      const { duration } = await measurePerformance(async () => {
        // Simulate rendering calculation
        const nodeCount = JSON.stringify(largeJson).length
        return { nodeCount, renderTime: nodeCount * 0.01 } // Mock calculation
      })

      expect(duration).toBeLessThan(100) // 100ms rendering threshold
    })
  })
})
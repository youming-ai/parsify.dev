import type { Tool } from '@/types/tools'

// Tools data organized by category
export const toolsData: Tool[] = [
  // JSON Tools
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description:
      'Format, beautify, and validate JSON data with customizable indentation and sorting options',
    category: 'JSON Processing',
    icon: 'FileJson',
    features: [
      'Format & Beautify',
      'Syntax Validation',
      'Custom Indentation',
      'Key Sorting',
      'Error Detection',
    ],
    tags: ['json', 'formatter', 'validator', 'beautifier'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/json/formatter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-validator',
    name: 'JSON Validator',
    description: 'Comprehensive JSON validation with detailed error messages and schema support',
    category: 'JSON Processing',
    icon: 'FileJson',
    features: ['Syntax Validation', 'Schema Validation', 'Detailed Errors', 'Real-time Validation'],
    tags: ['json', 'validator', 'schema', 'error-detection'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/json/validator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-converter',
    name: 'JSON Converter',
    description: 'Convert JSON to various formats like XML, CSV, YAML, and vice versa',
    category: 'JSON Processing',
    icon: 'FileJson',
    features: ['Multiple Formats', 'Batch Conversion', 'Custom Mapping', 'Preview Mode'],
    tags: ['json', 'converter', 'xml', 'csv', 'yaml'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/json/converter',
    isNew: true,
    processingType: 'hybrid',
    security: 'local-only',
  },
  {
    id: 'json-path-queries',
    name: 'JSONPath Queries',
    description: 'Extract and query data from JSON using JSONPath expressions',
    category: 'JSON Processing',
    icon: 'FileJson',
    features: ['JSONPath Expressions', 'Real-time Results', 'Syntax Highlighting', 'Query History'],
    tags: ['json', 'jsonpath', 'query', 'extract'],
    difficulty: 'intermediate',
    status: 'beta',
    href: '/tools/json/path-queries',
    processingType: 'client-side',
    security: 'local-only',
  },

  // Code Execution Tools
  {
    id: 'code-executor',
    name: 'Code Executor',
    description: 'Execute code in a secure WASM sandbox with multiple language support',
    category: 'Code Execution',
    icon: 'Terminal',
    features: ['Multi-language Support', 'Secure Sandboxing', 'Real-time Output', 'Debug Mode'],
    tags: ['code', 'executor', 'wasm', 'sandbox', 'javascript', 'python'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/code/executor',
    isPopular: true,
    processingType: 'client-side',
    security: 'secure-sandbox',
  },
  {
    id: 'code-formatter',
    name: 'Code Formatter',
    description: 'Format and beautify code in multiple programming languages',
    category: 'Code Execution',
    icon: 'Code',
    features: ['Multiple Languages', 'Prettier Integration', 'Custom Rules', 'Batch Formatting'],
    tags: ['code', 'formatter', 'prettier', 'beautifier'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/code/formatter',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test and debug regular expressions with real-time matching and explanation',
    category: 'Code Execution',
    icon: 'Code',
    features: ['Real-time Testing', 'Match Explanation', 'Pattern Library', 'Export Patterns'],
    tags: ['regex', 'testing', 'pattern', 'validation'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/code/regex',
    processingType: 'client-side',
    security: 'local-only',
  },

  // File Processing Tools
  {
    id: 'file-converter',
    name: 'File Converter',
    description:
      'Convert between different file formats including images, documents, and data files',
    category: 'File Processing',
    icon: 'FileText',
    features: ['Multiple Formats', 'Batch Processing', 'Preview Mode', 'Quality Settings'],
    tags: ['file', 'converter', 'image', 'document', 'batch'],
    difficulty: 'beginner',
    status: 'beta',
    href: '/tools/file/converter',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'text-processor',
    name: 'Text Processor',
    description: 'Advanced text processing with search, replace, and transformation capabilities',
    category: 'File Processing',
    icon: 'FileText',
    features: ['Search & Replace', 'Text Transformation', 'Encoding Conversion', 'Case Tools'],
    tags: ['text', 'processing', 'search', 'replace', 'encoding'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/file/text-processor',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'csv-processor',
    name: 'CSV Processor',
    description: 'Process, transform, and analyze CSV files with advanced filtering and sorting',
    category: 'File Processing',
    icon: 'FileText',
    features: ['CSV Validation', 'Data Transformation', 'Filtering & Sorting', 'Export Options'],
    tags: ['csv', 'data', 'processing', 'analysis'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/file/csv-processor',
    processingType: 'client-side',
    security: 'local-only',
  },

  // Data Validation Tools
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate various hash types for data integrity and security',
    category: 'Data Validation',
    icon: 'Hash',
    features: ['Multiple Algorithms', 'File & Text Hashing', 'Batch Processing', 'Compare Hashes'],
    tags: ['hash', 'checksum', 'md5', 'sha256', 'security'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/data/hash-generator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'data-validator',
    name: 'Data Validator',
    description: 'Validate data against custom rules and schemas',
    category: 'Data Validation',
    icon: 'Shield',
    features: ['Custom Rules', 'Schema Validation', 'Batch Validation', 'Detailed Reports'],
    tags: ['data', 'validation', 'schema', 'rules'],
    difficulty: 'advanced',
    status: 'experimental',
    href: '/tools/data/validator',
    processingType: 'hybrid',
    security: 'local-only',
  },

  // Utility Tools
  {
    id: 'url-encoder',
    name: 'URL Encoder/Decoder',
    description: 'Encode and decode URLs and URL components',
    category: 'Utilities',
    icon: 'Settings',
    features: ['URL Encoding', 'Component Encoding', 'Batch Processing', 'Format Detection'],
    tags: ['url', 'encode', 'decode', 'encoding'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/utilities/url-encoder',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'base64-converter',
    name: 'Base64 Converter',
    description: 'Convert between text and Base64 encoding',
    category: 'Utilities',
    icon: 'Zap',
    features: ['Text to Base64', 'File to Base64', 'Batch Conversion', 'Preview Mode'],
    tags: ['base64', 'encoding', 'conversion', 'file'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/utilities/base64-converter',
    processingType: 'client-side',
    security: 'local-only',
  },
]

// Categories extraction
export const categories = Array.from(new Set(toolsData.map(tool => tool.category)))

// Get all unique tags
export const getAllTags = (): string[] => {
  const tags = new Set<string>()
  toolsData.forEach(tool => {
    tool.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
}

// Get tools by category
export const getToolsByCategory = (category: string): Tool[] => {
  return toolsData.filter(tool => tool.category === category)
}

// Get popular tools
export const getPopularTools = (): Tool[] => {
  return toolsData.filter(tool => tool.isPopular)
}

// Get new tools
export const getNewTools = (): Tool[] => {
  return toolsData.filter(tool => tool.isNew)
}

// Search tools
export const searchTools = (query: string): Tool[] => {
  const lowercaseQuery = query.toLowerCase()
  return toolsData.filter(
    tool =>
      tool.name.toLowerCase().includes(lowercaseQuery) ||
      tool.description.toLowerCase().includes(lowercaseQuery) ||
      tool.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      tool.category.toLowerCase().includes(lowercaseQuery)
  )
}

// Get tool by ID
export const getToolById = (id: string): Tool | undefined => {
  return toolsData.find(tool => tool.id === id)
}

import type { Tool, EnhancedTool, ToolCategory, ProcessingType, SecurityLevel } from '@/types/tools';

/**
 * Comprehensive test fixtures for tools and related components
 */

// Mock tool categories
export const mockToolCategories: ToolCategory[] = [
  {
    id: 'json',
    name: 'JSON Processing',
    description: 'Format, validate, and transform JSON data',
    icon: 'FileJson',
    color: '#3B82F6',
    count: 4,
  },
  {
    id: 'code',
    name: 'Code Execution',
    description: 'Execute and format code in multiple languages',
    icon: 'Terminal',
    color: '#10B981',
    count: 3,
  },
  {
    id: 'file',
    name: 'File Processing',
    description: 'Convert and process various file formats',
    icon: 'File',
    color: '#F59E0B',
    count: 5,
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Encrypt, hash, and secure your data',
    icon: 'Shield',
    color: '#EF4444',
    count: 3,
  },
  {
    id: 'network',
    name: 'Network Tools',
    description: 'Test and analyze network connectivity',
    icon: 'Globe',
    color: '#8B5CF6',
    count: 3,
  },
];

// Mock tools data
export const mockTools: (Tool | EnhancedTool)[] = [
  // JSON Tools
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, beautify, and validate JSON data with customizable indentation and sorting options',
    category: 'JSON Processing',
    icon: 'FileJson',
    features: ['Format & Beautify', 'Syntax Validation', 'Custom Indentation', 'Key Sorting', 'Error Detection'],
    tags: ['json', 'formatter', 'validator', 'beautifier'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/json/formatter',
    isPopular: true,
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
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
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
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
    processingType: 'hybrid' as ProcessingType,
    security: 'local-only' as SecurityLevel,
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
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },

  // Code Tools
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
    processingType: 'client-side' as ProcessingType,
    security: 'secure-sandbox' as SecurityLevel,
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
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test and debug regular expressions with real-time matching and explanation',
    category: 'Code Execution',
    icon: 'Code',
    features: ['Real-time Matching', 'Regex Explanation', 'Test Strings', 'Match History'],
    tags: ['regex', 'pattern', 'validation', 'testing'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/code/regex-tester',
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },

  // File Tools
  {
    id: 'file-converter',
    name: 'File Converter',
    description: 'Convert files between different formats including images, documents, and archives',
    category: 'File Processing',
    icon: 'File',
    features: ['Multiple Formats', 'Batch Processing', 'Quality Options', 'Preview Mode'],
    tags: ['converter', 'format', 'image', 'document'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/file/converter',
    isPopular: true,
    processingType: 'hybrid' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },
  {
    id: 'text-processor',
    name: 'Text Processor',
    description: 'Advanced text processing with search, replace, and transformation capabilities',
    category: 'File Processing',
    icon: 'FileText',
    features: ['Search & Replace', 'Text Transformation', 'Encoding Conversion', 'Regex Support'],
    tags: ['text', 'processing', 'search', 'replace', 'encoding'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/file/text-processor',
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },
  {
    id: 'csv-processor',
    name: 'CSV Processor',
    description: 'Process and transform CSV files with advanced filtering and data manipulation',
    category: 'File Processing',
    icon: 'Table',
    features: ['CSV Parsing', 'Data Filtering', 'Column Operations', 'Export Options'],
    tags: ['csv', 'data', 'processing', 'filtering'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/file/csv-processor',
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Generate QR codes from text, URLs, and other data formats',
    category: 'File Processing',
    icon: 'QrCode',
    features: ['Multiple Data Types', 'Customization Options', 'Logo Support', 'Batch Generation'],
    tags: ['qr', 'code', 'generator', 'barcode'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/file/qr-generator',
    isNew: true,
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },

  // Security Tools
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate various hash types including MD5, SHA, and cryptographic hashes',
    category: 'Security',
    icon: 'Hash',
    features: ['Multiple Hash Types', 'Batch Processing', 'Salt Support', 'Comparison Tool'],
    tags: ['hash', 'crypto', 'security', 'md5', 'sha'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/security/hash-generator',
    isPopular: true,
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate secure passwords with customizable options and strength analysis',
    category: 'Security',
    icon: 'Key',
    features: ['Customizable Length', 'Character Sets', 'Strength Analysis', 'Batch Generation'],
    tags: ['password', 'security', 'generator', 'strength'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/security/password-generator',
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },
  {
    id: 'file-encryptor',
    name: 'File Encryptor',
    description: 'Encrypt and decrypt files with strong encryption algorithms',
    category: 'Security',
    icon: 'Lock',
    features: ['Multiple Algorithms', 'Password Protection', 'File Preview', 'Batch Operations'],
    tags: ['encryption', 'security', 'file', 'crypto'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/security/encryptor',
    processingType: 'client-side' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },

  // Network Tools
  {
    id: 'http-client',
    name: 'HTTP Client',
    description: 'Make HTTP requests with customizable headers, body, and authentication',
    category: 'Network Tools',
    icon: 'Globe',
    features: ['Multiple Methods', 'Headers & Auth', 'Request History', 'Response Analysis'],
    tags: ['http', 'api', 'request', 'client', 'rest'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/network/http-client',
    processingType: 'hybrid' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },
  {
    id: 'ip-lookup',
    name: 'IP Lookup',
    description: 'Lookup IP address information including location, ISP, and network details',
    category: 'Network Tools',
    icon: 'MapPin',
    features: ['Geolocation', 'ISP Information', 'Network Details', 'Reverse DNS'],
    tags: ['ip', 'lookup', 'geolocation', 'network'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/network/ip-lookup',
    processingType: 'hybrid' as ProcessingType,
    security: 'local-only' as SecurityLevel,
  },
];

// Mock user data for testing
export const mockUserData = {
  preferences: {
    theme: 'light' as 'light' | 'dark',
    language: 'en',
    sidebarCollapsed: false,
    recentlyUsedTools: ['json-formatter', 'hash-generator'],
    favoriteTools: ['code-executor', 'json-validator'],
  },
  session: {
    isAuthenticated: false,
    userId: null,
    userName: null,
  },
  analytics: {
    toolsUsed: [],
    timeSpent: 0,
    lastActive: new Date().toISOString(),
  },
};

// Mock API responses
export const mockApiResponses = {
  tools: {
    getAll: {
      success: {
        data: mockTools,
        status: 'success',
        message: 'Tools retrieved successfully',
      },
      error: {
        data: null,
        status: 'error',
        message: 'Failed to retrieve tools',
      },
    },
    getByCategory: {
      success: (category: string) => ({
        data: mockTools.filter(tool => tool.category.toLowerCase().includes(category)),
        status: 'success',
        message: `Tools in ${category} category retrieved successfully`,
      }),
    },
  },
  analytics: {
    trackUsage: {
      success: {
        data: { tracked: true, timestamp: new Date().toISOString() },
        status: 'success',
        message: 'Usage tracked successfully',
      },
    },
  },
  network: {
    ipLookup: {
      success: {
        ip: '8.8.8.8',
        country: 'United States',
        city: 'Mountain View',
        isp: 'Google LLC',
        latitude: 37.4056,
        longitude: -122.0775,
      },
    },
    httpClient: {
      success: {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { message: 'Success' },
      },
    },
  },
};

// Mock performance data
export const mockPerformanceData = {
  metrics: {
    renderTime: 150,
    bundleSize: 250000,
    loadTime: 1200,
    firstContentfulPaint: 800,
    largestContentfulPaint: 1400,
    cumulativeLayoutShift: 0.05,
  },
  budgets: {
    renderTime: 500,
    bundleSize: 500000,
    loadTime: 3000,
    firstContentfulPaint: 1500,
    largestContentfulPaint: 2500,
    cumulativeLayoutShift: 0.1,
  },
};

// Mock error scenarios
export const mockErrorScenarios = {
  network: {
    timeout: new Error('Request timeout'),
    connectionError: new Error('Network connection failed'),
    serverError: new Error('Internal server error'),
    notFound: new Error('Resource not found'),
  },
  validation: {
    invalidJSON: new Error('Invalid JSON format'),
    missingRequired: new Error('Required field is missing'),
    invalidFormat: new Error('Invalid data format'),
    fileTooLarge: new Error('File size exceeds limit'),
  },
  security: {
    unauthorized: new Error('Unauthorized access'),
    forbidden: new Error('Access forbidden'),
    rateLimit: new Error('Rate limit exceeded'),
  },
};

// Mock file data
export const mockFileData = {
  valid: [
    new File(['{"test": "data"}'], 'test.json', { type: 'application/json' }),
    new File(['name,age\nJohn,30'], 'test.csv', { type: 'text/csv' }),
    new File(['<html><body>Test</body></html>'], 'test.html', { type: 'text/html' }),
  ],
  invalid: [
    new File([''], 'empty.txt', { type: 'text/plain' }),
    new File(['{"invalid": json}'], 'invalid.json', { type: 'application/json' }),
  ],
  large: [
    new File([Array(1000000).fill('a').join('')], 'large.txt', { type: 'text/plain' }),
  ],
};

// Export fixtures for use in tests
export default {
  mockToolCategories,
  mockTools,
  mockUserData,
  mockApiResponses,
  mockPerformanceData,
  mockErrorScenarios,
  mockFileData,
};

import type { Tool, EnhancedTool } from '@/types/tools';

/**
 * Comprehensive test fixtures for tools and components
 * Provides realistic test data for various scenarios
 */

// Tool test fixtures
export const toolFixtures = {
  // JSON Processing tools
  jsonFormatter: {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, beautify, and validate JSON data with customizable indentation and sorting options',
    category: 'JSON Processing',
    icon: 'FileJson',
    features: ['Format & Beautify', 'Syntax Validation', 'Custom Indentation', 'Key Sorting', 'Error Detection'],
    tags: ['json', 'formatter', 'validator', 'beautifier'],
    difficulty: 'beginner' as const,
    status: 'stable' as const,
    href: '/tools/json/formatter',
    isPopular: true,
    processingType: 'client-side' as const,
    security: 'local-only' as const,
  },

  codeExecutor: {
    id: 'code-executor',
    name: 'Code Executor',
    description: 'Execute code in a secure WASM sandbox with multiple language support',
    category: 'Code Execution',
    icon: 'Terminal',
    features: ['Multi-language Support', 'Secure Sandboxing', 'Real-time Output', 'Debug Mode'],
    tags: ['code', 'executor', 'wasm', 'sandbox', 'javascript', 'python'],
    difficulty: 'intermediate' as const,
    status: 'stable' as const,
    href: '/tools/code/executor',
    isPopular: true,
    processingType: 'client-side' as const,
    security: 'secure-sandbox' as const,
  },

  hashGenerator: {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate various hash values (MD5, SHA-1, SHA-256, etc.) from text or files',
    category: 'Security',
    icon: 'Shield',
    features: ['Multiple Algorithms', 'File Input', 'Text Input', 'Batch Processing'],
    tags: ['hash', 'md5', 'sha1', 'sha256', 'security'],
    difficulty: 'beginner' as const,
    status: 'stable' as const,
    href: '/tools/security/hash-generator',
    processingType: 'client-side' as const,
    security: 'local-only' as const,
  },
};

// JSON test data fixtures
export const jsonFixtures = {
  valid: {
    simple: {
      name: "John Doe",
      age: 30,
      city: "New York"
    },
    complex: {
      id: 123,
      user: {
        name: "Alice",
        email: "alice@example.com",
        preferences: {
          theme: "dark",
          notifications: true,
          privacy: {
            showEmail: false,
            showAge: true
          }
        }
      },
      orders: [
        { id: "order-1", total: 99.99, items: ["item1", "item2"] },
        { id: "order-2", total: 149.99, items: ["item3"] }
      ],
      metadata: {
        created: "2023-01-01T00:00:00Z",
        updated: "2023-12-31T23:59:59Z"
      }
    },
    nestedArrays: {
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ],
      categories: [
        {
          name: "Technology",
          items: [
            { id: 1, name: "Laptop" },
            { id: 2, name: "Phone" }
          ]
        },
        {
          name: "Books",
          items: [
            { id: 3, name: "Fiction" },
            { id: 4, name: "Non-fiction" }
          ]
        }
      ]
    }
  },

  invalid: {
    syntaxError: `{
      "name": "John",
      "age": 30,
      "city": "New York"
    `, // Missing closing brace

    commaError: `{
      "name": "John",
      "age": 30,
      "city": "New York",
    }`, // Trailing comma

    quoteError: `{
      name: "John",
      "age": 30,
      "city": "New York"
    }`, // Missing quotes around key

    typeError: `{
      "name": "John",
      "age": "thirty", // Should be number
      "isActive": "true" // Should be boolean
    }`,
  },

  formatted: {
    twoSpace: {
      name: "John Doe",
      age: 30,
      city: "New York"
    },
    fourSpace: {
        name: "John Doe",
        age: 30,
        city: "New York"
    },
    tabbed: {
		name: "John Doe",
		age: 30,
		city: "New York"
	}
  }
};

// Code execution fixtures
export const codeFixtures = {
  javascript: {
    simple: `console.log("Hello, World!");`,
    function: `function add(a, b) {
      return a + b;
    }
    console.log(add(5, 3));`,
    async: `async function fetchData() {
      return new Promise(resolve => {
        setTimeout(() => resolve("Data loaded"), 100);
      });
    }
    fetchData().then(console.log);`,
    error: `throw new Error("Test error");`,
  },

  python: {
    simple: `print("Hello, World!")`,
    function: `def add(a, b):
      return a + b
    print(add(5, 3))`,
    error: `raise Exception("Test error")`,
  },

  regex: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s-()]{10,}$/,
    url: /^https?:\/\/.+$/,
    custom: /(?:\d{3}-|\(\d{3}\)\s?)?\d{3}-\d{4}/,
  }
};

// Security and hash fixtures
export const securityFixtures = {
  testInput: "Hello, World! This is a test string for hash generation.",

  expectedHashes: {
    md5: "ed076287532e86365e841e92bfc50d8c",
    sha1: "0a4d55a8d778e5022fab701977c5d840bbc486d0",
    sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    sha512: "2c74fd17edafd80e8447b0d46741ee243b7eb74dd2149a0ab1b9246fb30382f27e853d8585719e0e67cbda0daa8f51671064615d645ae27acb15bfb1447f459b"
  },

  largeInput: "A".repeat(10000), // For performance testing
};

// File processing fixtures
export const fileFixtures = {
  text: {
    lorem: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    unicode: "Hello 世界! 🌍 Test with emojis and international characters: áéíóú, ñ, 中文, العربية, русский",
    multiline: `This is line 1.
This is line 2.
This is line 3.
And this is line 4.`,
  },

  csv: {
    simple: `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`,
    complex: `id,name,email,age,department,salary
1,John Doe,john@example.com,30,Engineering,75000
2,Jane Smith,jane@example.com,25,Marketing,65000
3,Bob Johnson,bob@example.com,35,Engineering,80000`,
    withQuotes: `name,description,notes
"John Doe","Software Engineer","Loves coding"
"Jane Smith","Product Manager","Very organized"`,
  },

  xml: {
    simple: `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <age>30</age>
  <city>New York</city>
</person>`,
    complex: `<?xml version="1.0" encoding="UTF-8"?>
<company>
  <name>Tech Corp</name>
  <employees>
    <employee id="1">
      <name>John Doe</name>
      <department>Engineering</department>
      <skills>
        <skill>JavaScript</skill>
        <skill>Python</skill>
      </skills>
    </employee>
  </employees>
</company>`,
  },
};

// User interaction fixtures
export const interactionFixtures = {
  searchQueries: [
    "json",
    "formatter",
    "hash generator",
    "code executor",
    "regex tester",
    "invalid query xyz",
    "",
    "   ", // Whitespace only
    "a".repeat(100), // Very long query
  ],

  filterCombinations: [
    { category: 'JSON Processing', difficulty: 'beginner' },
    { category: 'Code Execution', status: 'stable' },
    { tags: ['json', 'validator'] },
    { features: ['Multi-language Support'] },
    { security: 'local-only' },
    { processingType: 'client-side' },
  ],

  viewportSizes: [
    { width: 320, height: 568, name: 'Mobile Small' },
    { width: 375, height: 667, name: 'Mobile Medium' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1024, height: 768, name: 'Desktop Small' },
    { width: 1920, height: 1080, name: 'Desktop Large' },
  ],

  fileUploads: [
    { name: 'test.json', size: 1024, type: 'application/json' },
    { name: 'large-file.txt', size: 1048576, type: 'text/plain' }, // 1MB
    { name: 'huge-file.json', size: 10485760, type: 'application/json' }, // 10MB
    { name: 'image.png', size: 51200, type: 'image/png' },
  ],
};

// Performance test fixtures
export const performanceFixtures = {
  renderTargets: [
    { name: 'simple-component', renderTime: 50 }, // ms
    { name: 'complex-component', renderTime: 200 },
    { name: 'data-heavy-component', renderTime: 500 },
  ],

  networkRequests: [
    { url: '/api/tools', method: 'GET', responseTime: 100 },
    { url: '/api/tools/json/formatter', method: 'GET', responseTime: 150 },
    { url: '/api/search', method: 'POST', responseTime: 200 },
  ],

  memoryThresholds: {
    component: 10 * 1024 * 1024, // 10MB
    page: 50 * 1024 * 1024, // 50MB
  },
};

// Error scenario fixtures
export const errorFixtures = {
  networkErrors: [
    { status: 404, message: 'Not Found' },
    { status: 500, message: 'Internal Server Error' },
    { status: 503, message: 'Service Unavailable' },
  ],

  validationErrors: [
    { field: 'json-input', message: 'Invalid JSON syntax' },
    { field: 'code-input', message: 'Code contains syntax errors' },
    { field: 'file-upload', message: 'File size exceeds limit' },
  ],

  userErrors: [
    { type: 'empty-input', message: 'Please provide input data' },
    { type: 'invalid-format', message: 'Unsupported file format' },
    { type: 'processing-failed', message: 'Failed to process data' },
  ],
};

// Accessibility test fixtures
export const accessibilityFixtures = {
  keyboardNavigation: [
    { key: 'Tab', expected: 'Focus moves to next focusable element' },
    { key: 'Shift+Tab', expected: 'Focus moves to previous focusable element' },
    { key: 'Enter', expected: 'Activates focused button or link' },
    { key: 'Space', expected: 'Activates focused button or toggles checkbox' },
  ],

  screenReader: [
    { element: 'button', attribute: 'aria-label' },
    { element: 'input', attribute: 'aria-describedby' },
    { element: 'form', attribute: 'aria-labelledby' },
  ],

  colorContrast: [
    { foreground: '#000000', background: '#ffffff', ratio: 21 },
    { foreground: '#666666', background: '#f0f0f0', ratio: 4.5 },
    { foreground: '#cccccc', background: '#ffffff', ratio: 1.6 }, // Fails WCAG
  ],
};

// Export all fixtures
export default {
  tools: toolFixtures,
  json: jsonFixtures,
  code: codeFixtures,
  security: securityFixtures,
  files: fileFixtures,
  interactions: interactionFixtures,
  performance: performanceFixtures,
  errors: errorFixtures,
  accessibility: accessibilityFixtures,
};

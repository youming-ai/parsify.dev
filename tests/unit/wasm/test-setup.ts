/**
 * Test configuration for WASM modules
 *
 * This file provides common test utilities and configuration
 * for testing WASM modules across the platform.
 */

import { vi } from 'vitest'

// Mock WebAssembly for testing
global.WebAssembly = {
  instantiate: vi.fn(),
  instantiateStreaming: vi.fn(),
  compile: vi.fn(),
  validate: vi.fn(),
  Module: vi.fn(),
  Instance: vi.fn(),
  Memory: vi.fn(),
  Table: vi.fn(),
  Global: vi.fn(),
} as any

// Mock Performance API for testing
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
} as any

// Mock crypto for UUID generation
global.crypto = {
  randomUUID: vi.fn(() => `test-uuid-${Math.random().toString(36).substr(2, 9)}`),
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
    return arr
  }),
} as any

// Mock fetch for WASM module loading
global.fetch = vi.fn()

// Mock console methods for testing
const originalConsole = { ...console }

// Setup test console spies
export const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}

// Override console for testing
Object.assign(console, mockConsole)

// Restore original console after tests
export const restoreConsole = () => {
  Object.assign(console, originalConsole)
}

// Test data generators
export const testDataGenerators = {
  /**
   * Generate test JSON data
   */
  generateJsonData: (size: 'small' | 'medium' | 'large' = 'medium') => {
    const base = {
      id: Math.floor(Math.random() * 1000),
      name: `Test Item ${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      active: Math.random() > 0.5,
    }

    if (size === 'small') {
      return base
    }

    const medium = {
      ...base,
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: Math.floor(Math.random() * 10),
        tags: [`tag${Math.floor(Math.random() * 10)}`, `category${Math.floor(Math.random() * 5)}`],
      },
      data: Array.from({ length: 10 }, (_, i) => ({
        id: i,
        value: Math.random() * 100,
        label: `Item ${i}`,
      })),
    }

    if (size === 'medium') {
      return medium
    }

    // Large data
    return {
      ...medium,
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        profile: {
          age: Math.floor(Math.random() * 50) + 18,
          location: `Location ${i}`,
          interests: Array.from({ length: 5 }, (_, j) => `Interest ${i}-${j}`),
        },
      })),
      analytics: {
        views: Math.floor(Math.random() * 10000),
        clicks: Math.floor(Math.random() * 1000),
        conversions: Math.floor(Math.random() * 100),
        revenue: Math.random() * 10000,
      },
    }
  },

  /**
   * Generate test code for different languages
   */
  generateCode: (language: string, complexity: 'simple' | 'medium' | 'complex' = 'medium') => {
    const baseCode = {
      javascript: {
        simple: 'console.log("Hello, World!");',
        medium: `
          function fibonacci(n) {
            if (n <= 1) return n;
            return fibonacci(n - 1) + fibonacci(n - 2);
          }
          console.log(fibonacci(10));
        `,
        complex: `
          class DataProcessor {
            constructor(data) {
              this.data = data;
              this.processed = [];
            }

            async process() {
              for (const item of this.data) {
                const result = await this.transform(item);
                this.processed.push(result);
              }
              return this.processed;
            }

            transform(item) {
              return {
                ...item,
                processed: true,
                timestamp: Date.now()
              };
            }
          }

          const processor = new DataProcessor([1, 2, 3, 4, 5]);
          processor.process().then(console.log);
        `,
      },
      python: {
        simple: 'print("Hello, World!")',
        medium: `
          def fibonacci(n):
              if n <= 1:
                  return n
              return fibonacci(n - 1) + fibonacci(n - 2)

          print(fibonacci(10))
        `,
        complex: `
          class DataProcessor:
              def __init__(self, data):
                  self.data = data
                  self.processed = []

              async def process(self):
                  for item in self.data:
                      result = await self.transform(item)
                      self.processed.append(result)
                  return self.processed

              async def transform(self, item):
                  return {
                      **item,
                      'processed': True,
                      'timestamp': time.time()
                  }

          import asyncio

          async def main():
              processor = DataProcessor([1, 2, 3, 4, 5])
              result = await processor.process()
              print(result)

          asyncio.run(main())
        `,
      },
      typescript: {
        simple: 'const message: string = "Hello, TypeScript!"; console.log(message);',
        medium: `
          interface User {
            id: number;
            name: string;
            email: string;
          }

          class UserService {
            private users: User[] = [];

            addUser(user: User): void {
              this.users.push(user);
            }

            findUser(id: number): User | undefined {
              return this.users.find(u => u.id === id);
            }
          }

          const service = new UserService();
          service.addUser({ id: 1, name: "John", email: "john@example.com" });
          console.log(service.findUser(1));
        `,
        complex: `
          interface ApiResponse<T> {
            data: T;
            status: number;
            message: string;
          }

          class ApiClient {
            private baseUrl: string;

            constructor(baseUrl: string) {
              this.baseUrl = baseUrl;
            }

            async get<T>(endpoint: string): Promise<ApiResponse<T>> {
              const response = await fetch(\`\${this.baseUrl}\${endpoint}\`);
              const data = await response.json();
              return {
                data,
                status: response.status,
                message: response.statusText
              };
            }
          }

          interface User {
            id: number;
            name: string;
            email: string;
          }

          const client = new ApiClient('https://api.example.com');
          client.get<User>('/users/1').then(result => {
            console.log('User:', result.data);
          });
        `,
      },
    }

    return baseCode[language as keyof typeof baseCode]?.[complexity] || ''
  },

  /**
   * Generate test XML data
   */
  generateXmlData: (complexity: 'simple' | 'medium' | 'complex' = 'medium') => {
    const simple = '<root><message>Hello, World!</message></root>'

    if (complexity === 'simple') return simple

    const medium = `
      <users>
        <user id="1">
          <name>John Doe</name>
          <email>john@example.com</email>
          <active>true</active>
        </user>
        <user id="2">
          <name>Jane Smith</name>
          <email>jane@example.com</email>
          <active>false</active>
        </user>
      </users>
    `

    if (complexity === 'medium') return medium

    return `
      <catalog>
        <categories>
          <category id="electronics">
            <name>Electronics</name>
            <description>Electronic devices and gadgets</description>
            <products>
              <product id="1">
                <name>Smartphone</name>
                <price>699.99</price>
                <specs>
                  <screen>6.1 inches</screen>
                  <storage>128GB</storage>
                  <camera>12MP</camera>
                </specs>
              </product>
            </products>
          </category>
        </categories>
      </catalog>
    `
  },
}

// Test utilities
export const testUtils = {
  /**
   * Wait for async operations
   */
  wait: (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create a mock WASM module
   */
  createMockModule: (id: string, name: string, version: string = '1.0.0') => ({
    id,
    name,
    version,
    isInitialized: false,
    initialize: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue({ success: true, data: 'mock result' }),
    dispose: vi.fn(),
    isCompatible: vi.fn().mockResolvedValue(true),
    getMetadata: vi.fn().mockReturnValue({
      id,
      name,
      version,
      executionCount: 0,
      memoryUsage: 0,
      loadTime: 0,
    }),
    getHealth: vi.fn().mockResolvedValue({
      status: 'healthy' as const,
      lastCheck: new Date(),
      responseTime: 10,
      memoryUsage: 1024,
      errorRate: 0,
      uptime: 1000,
    }),
  }),

  /**
   * Create a mock execution result
   */
  createMockResult: (data: any, success: boolean = true) => ({
    success,
    data,
    metadata: {
      executionTime: Math.random() * 100,
      memoryUsage: Math.random() * 1024 * 1024,
      outputSize: JSON.stringify(data).length,
    },
  }),

  /**
   * Create a mock error
   */
  createMockError: (message: string, code: string = 'ERROR') => ({
    success: false,
    error: {
      code,
      message,
      recoverable: false,
      suggestions: ['Check input data', 'Try again later'],
    },
  }),

  /**
   * Assert that a promise resolves within a timeout
   */
  expectToResolve: async <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Promise did not resolve within ${timeoutMs}ms`)),
        timeoutMs
      )
    })

    return Promise.race([promise, timeoutPromise])
  },

  /**
   * Assert that a promise rejects with a specific error
   */
  expectToReject: async <T>(
    promise: Promise<T>,
    expectedError?: string | RegExp | ErrorConstructor
  ): Promise<void> => {
    try {
      await promise
      throw new Error('Expected promise to reject')
    } catch (error) {
      if (!expectedError) return

      if (typeof expectedError === 'string') {
        expect(error.message).toContain(expectedError)
      } else if (expectedError instanceof RegExp) {
        expect(error.message).toMatch(expectedError)
      } else if (typeof expectedError === 'function') {
        expect(error).toBeInstanceOf(expectedError)
      }
    }
  },

  /**
   * Measure execution time of a function
   */
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> => {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    return { result, timeMs: end - start }
  },
}

// Test constants
export const TEST_CONSTANTS = {
  TIMEOUTS: {
    SHORT: 100,
    MEDIUM: 1000,
    LONG: 5000,
    EXTENDED: 10000,
  },
  LIMITS: {
    SMALL_INPUT: 1024,
    MEDIUM_INPUT: 10240,
    LARGE_INPUT: 102400,
    SMALL_MEMORY: 16 * 1024 * 1024,
    MEDIUM_MEMORY: 64 * 1024 * 1024,
    LARGE_MEMORY: 256 * 1024 * 1024,
  },
  SAMPLE_DATA: {
    JSON_STRING: '{"name":"test","value":42,"active":true}',
    XML_STRING: '<root><name>test</name><value>42</value></root>',
    YAML_STRING: 'name: test\nvalue: 42\nactive: true',
    CSV_STRING: 'name,value,active\ntest,42,true',
    TOML_STRING: 'name = "test"\nvalue = 42\nactive = true',
  },
}

// Setup and teardown utilities
export const setupUtils = {
  /**
   * Setup common test environment
   */
  setupTestEnvironment: () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  },

  /**
   * Cleanup test environment
   */
  cleanupTestEnvironment: () => {
    vi.runAllTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
    restoreConsole()
  },

  /**
   * Setup WASM module mocks
   */
  setupWasmMocks: () => {
    // Mock WebAssembly instantiation
    ;(global.WebAssembly.instantiate as any).mockResolvedValue({
      exports: {
        memory: new WebAssembly.Memory({ initial: 1 }),
        format: vi.fn(),
        validate: vi.fn(),
        execute: vi.fn(),
      },
    })

    // Mock fetch for WASM files
    ;(global.fetch as any).mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    })
  },
}

// Export default configuration
export const testConfig = {
  setupFiles: ['./tests/unit/wasm/test-setup.ts'],
  testTimeout: TEST_CONSTANTS.TIMEOUTS.EXTENDED,
  hookTimeout: TEST_CONSTANTS.TIMEOUTS.LONG,
  isolate: true,
  globals: true,
  environment: 'node',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', 'dist/', 'build/'],
    thresholds: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
}

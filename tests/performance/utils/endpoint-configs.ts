/**
 * API endpoint test configurations and test data generators
 */

export const API_BASE_URL = 'http://localhost:8787'

export interface EndpointConfig {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description: string
  body?: any
  headers?: Record<string, string>
  expectedStatus?: number
  requiresAuth?: boolean
  maxP95ResponseTime?: number
  minSuccessRate?: number
}

export const TOOL_ENDPOINTS: EndpointConfig[] = [
  {
    path: '/tools',
    method: 'GET',
    description: 'Get available tools list',
    expectedStatus: 200,
    maxP95ResponseTime: 100,
    minSuccessRate: 0.99,
  },
  {
    path: '/tools?category=json',
    method: 'GET',
    description: 'Get JSON tools',
    expectedStatus: 200,
    maxP95ResponseTime: 100,
    minSuccessRate: 0.99,
  },
  {
    path: '/tools/json/format',
    method: 'POST',
    description: 'Format JSON',
    body: {
      json: '{"name":"test","value":123,"nested":{"array":[1,2,3]}}',
      indent: 2,
      sort_keys: true,
    },
    expectedStatus: 200,
    maxP95ResponseTime: 150,
    minSuccessRate: 0.98,
  },
  {
    path: '/tools/json/validate',
    method: 'POST',
    description: 'Validate JSON',
    body: {
      json: '{"name":"test","value":123}',
    },
    expectedStatus: 200,
    maxP95ResponseTime: 150,
    minSuccessRate: 0.98,
  },
  {
    path: '/tools/json/convert',
    method: 'POST',
    description: 'Convert JSON to CSV',
    body: {
      json: '[{"name":"test","value":123},{"name":"test2","value":456}]',
      target_format: 'csv',
    },
    expectedStatus: 200,
    maxP95ResponseTime: 200,
    minSuccessRate: 0.95,
  },
  {
    path: '/tools/code/format',
    method: 'POST',
    description: 'Format JavaScript code',
    body: {
      code: 'function test(){return 1+1;}',
      language: 'javascript',
    },
    expectedStatus: 200,
    maxP95ResponseTime: 200,
    minSuccessRate: 0.95,
  },
]

export const AUTH_ENDPOINTS: EndpointConfig[] = [
  {
    path: '/auth/validate',
    method: 'GET',
    description: 'Validate session (no auth)',
    expectedStatus: 401,
    maxP95ResponseTime: 50,
    minSuccessRate: 1.0, // Expect consistent 401 response
  },
]

export const USER_ENDPOINTS: EndpointConfig[] = [
  {
    path: '/users/profile',
    method: 'GET',
    description: 'Get user profile (no auth)',
    expectedStatus: 401,
    maxP95ResponseTime: 50,
    minSuccessRate: 1.0, // Expect consistent 401 response
  },
  {
    path: '/users/test-user-id',
    method: 'GET',
    description: 'Get public user info',
    expectedStatus: 200,
    maxP95ResponseTime: 100,
    minSuccessRate: 0.99,
  },
]

export const JOB_ENDPOINTS: EndpointConfig[] = [
  {
    path: '/jobs',
    method: 'POST',
    description: 'Create new job',
    body: {
      tool_id: 'json-format',
      input_data: {
        json: '{"test": "data"}',
      },
    },
    expectedStatus: 201,
    maxP95ResponseTime: 150,
    minSuccessRate: 0.95,
  },
  {
    path: '/jobs',
    method: 'GET',
    description: 'List jobs',
    expectedStatus: 200,
    maxP95ResponseTime: 100,
    minSuccessRate: 0.99,
  },
]

export const UPLOAD_ENDPOINTS: EndpointConfig[] = [
  {
    path: '/upload/sign',
    method: 'POST',
    description: 'Get upload presigned URL',
    body: {
      filename: 'test.json',
      content_type: 'application/json',
      size: 1024,
    },
    expectedStatus: 200,
    maxP95ResponseTime: 150,
    minSuccessRate: 0.95,
  },
  {
    path: '/upload/status/test-file-id',
    method: 'GET',
    description: 'Get upload status',
    expectedStatus: 404,
    maxP95ResponseTime: 50,
    minSuccessRate: 1.0, // Expect consistent 404 for non-existent file
  },
]

export const HEALTH_ENDPOINTS: EndpointConfig[] = [
  {
    path: '/health',
    method: 'GET',
    description: 'Health check',
    expectedStatus: 200,
    maxP95ResponseTime: 20,
    minSuccessRate: 1.0,
  },
]

export const ALL_ENDPOINTS = [
  ...TOOL_ENDPOINTS,
  ...AUTH_ENDPOINTS,
  ...USER_ENDPOINTS,
  ...JOB_ENDPOINTS,
  ...UPLOAD_ENDPOINTS,
  ...HEALTH_ENDPOINTS,
]

/**
 * Test data generators for different scenarios
 */
export class TestDataGenerator {
  /**
   * Generate JSON data of varying sizes
   */
  static generateJsonData(size: 'small' | 'medium' | 'large' = 'medium'): string {
    const baseObject = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Test Data',
      value: Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      nested: {
        array: Array.from({ length: 10 }, (_, i) => ({
          index: i,
          data: Math.random().toString(36),
        })),
      },
    }

    const multiplier = size === 'small' ? 1 : size === 'medium' ? 10 : 100
    const data = Array.from({ length: multiplier }, () => ({
      ...baseObject,
      id: Math.random().toString(36).substr(2, 9),
    }))

    return JSON.stringify(data)
  }

  /**
   * Generate code samples for testing
   */
  static generateCodeSamples(language: 'javascript' | 'python' = 'javascript'): string {
    if (language === 'javascript') {
      return `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Test the function
console.log(fibonacci(10));
      `.trim()
    } else {
      return `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Test the function
print(fibonacci(10))
      `.trim()
    }
  }

  /**
   * Generate file upload test data
   */
  static generateUploadData(filename: string, size: number = 1024): any {
    return {
      filename,
      content_type: 'application/json',
      size,
      checksum: Math.random().toString(36).substr(2, 16),
    }
  }

  /**
   * Generate job creation test data
   */
  static generateJobData(toolId: string, dataSize: 'small' | 'medium' | 'large' = 'medium'): any {
    return {
      tool_id: toolId,
      input_data: {
        json: TestDataGenerator.generateJsonData(dataSize),
        options: {
          indent: 2,
          sort_keys: true,
        },
      },
    }
  }
}

/**
 * Performance test configurations for different scenarios
 */
export interface TestScenario {
  name: string
  description: string
  endpoints: EndpointConfig[]
  concurrentRequests: number
  totalRequests: number
  requirements?: {
    maxP95ResponseTime?: number
    minSuccessRate?: number
    minRequestsPerSecond?: number
  }
}

export const PERFORMANCE_TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'smoke-test',
    description: 'Quick smoke test for all endpoints',
    endpoints: HEALTH_ENDPOINTS,
    concurrentRequests: 1,
    totalRequests: 10,
    requirements: {
      maxP95ResponseTime: 50,
      minSuccessRate: 1.0,
      minRequestsPerSecond: 1,
    },
  },
  {
    name: 'tools-basic',
    description: 'Basic tools API performance test',
    endpoints: TOOL_ENDPOINTS.filter(e => e.method === 'GET'),
    concurrentRequests: 5,
    totalRequests: 50,
    requirements: {
      maxP95ResponseTime: 150,
      minSuccessRate: 0.98,
      minRequestsPerSecond: 5,
    },
  },
  {
    name: 'tools-intensive',
    description: 'Intensive tools API performance test',
    endpoints: TOOL_ENDPOINTS.filter(e => e.method === 'POST'),
    concurrentRequests: 10,
    totalRequests: 100,
    requirements: {
      maxP95ResponseTime: 300,
      minSuccessRate: 0.95,
      minRequestsPerSecond: 10,
    },
  },
  {
    name: 'concurrency-test',
    description: 'Test API performance under varying concurrency levels',
    endpoints: HEALTH_ENDPOINTS,
    concurrentRequests: 1,
    totalRequests: 20,
    requirements: {
      maxP95ResponseTime: 100,
      minSuccessRate: 0.99,
      minRequestsPerSecond: 5,
    },
  },
  {
    name: 'load-test',
    description: 'Comprehensive load test for all endpoints',
    endpoints: ALL_ENDPOINTS,
    concurrentRequests: 20,
    totalRequests: 200,
    requirements: {
      maxP95ResponseTime: 500,
      minSuccessRate: 0.9,
      minRequestsPerSecond: 20,
    },
  },
]

/**
 * Load Testing Configuration and Scenarios
 * Comprehensive configuration for testing concurrent user behavior
 */

export interface LoadTestUser {
  id: string
  email: string
  sessionId?: string
  authToken?: string
  profile: {
    name: string
    preferences: Record<string, any>
  }
  behavior: UserBehavior
}

export interface UserBehavior {
  toolsUsage: {
    jsonFormat: number // frequency (0-1)
    jsonValidate: number
    jsonConvert: number
    codeFormat: number
    codeExecute: number
  }
  fileOperations: {
    upload: number // average uploads per session
    download: number // average downloads per session
    size: 'small' | 'medium' | 'large' // preferred file size
  }
  sessionDuration: number // average session duration in minutes
  requestInterval: number // average time between requests in seconds
  concurrencyLevel: number // preferred concurrency level
}

export interface ConcurrentUserScenario {
  name: string
  description: string
  userCount: number
  duration: number // milliseconds
  rampUpTime: number // milliseconds to gradually add users
  behavior: UserBehavior
  requirements: {
    maxP95ResponseTime: number
    minSuccessRate: number
    minThroughput: number
    maxErrorRate: number
  }
}

export interface SystemResourceMetrics {
  timestamp: number
  cpu: {
    usage: number // percentage
    loadAverage: number[]
  }
  memory: {
    used: number // MB
    total: number // MB
    percentage: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    connections: number
  }
  database: {
    connections: number
    queryTime: number
    queueSize: number
  }
}

export interface LoadTestReport {
  scenario: string
  timestamp: string
  duration: number
  users: number
  summary: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    throughput: number
    errorRate: number
  }
  endpoints: {
    [endpoint: string]: {
      requests: number
      averageResponseTime: number
      p95ResponseTime: number
      successRate: number
      errors: Array<{ type: string; count: number }>
    }
  }
  userBehavior: {
    [behaviorType: string]: {
      frequency: number
      averageResponseTime: number
      successRate: number
    }
  }
  resources: SystemResourceMetrics[]
  bottlenecks: Array<{
    type: 'endpoint' | 'resource' | 'database'
    target: string
    metric: string
    value: number
    threshold: number
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
  recommendations: string[]
}

// Predefined user behavior patterns
export const USER_BEHAVIOR_PATTERNS: Record<string, UserBehavior> = {
  // Light usage - occasional tool usage
  light: {
    toolsUsage: {
      jsonFormat: 0.6,
      jsonValidate: 0.3,
      jsonConvert: 0.1,
      codeFormat: 0.2,
      codeExecute: 0.05,
    },
    fileOperations: {
      upload: 2,
      download: 3,
      size: 'small',
    },
    sessionDuration: 15, // 15 minutes
    requestInterval: 30, // 30 seconds between requests
    concurrencyLevel: 1,
  },

  // Moderate usage - regular tool usage
  moderate: {
    toolsUsage: {
      jsonFormat: 0.7,
      jsonValidate: 0.5,
      jsonConvert: 0.3,
      codeFormat: 0.4,
      codeExecute: 0.2,
    },
    fileOperations: {
      upload: 5,
      download: 8,
      size: 'medium',
    },
    sessionDuration: 30, // 30 minutes
    requestInterval: 15, // 15 seconds between requests
    concurrencyLevel: 2,
  },

  // Heavy usage - intensive tool usage
  heavy: {
    toolsUsage: {
      jsonFormat: 0.9,
      jsonValidate: 0.8,
      jsonConvert: 0.6,
      codeFormat: 0.7,
      codeExecute: 0.5,
    },
    fileOperations: {
      upload: 10,
      download: 15,
      size: 'large',
    },
    sessionDuration: 60, // 60 minutes
    requestInterval: 5, // 5 seconds between requests
    concurrencyLevel: 3,
  },

  // Developer pattern - code-heavy usage
  developer: {
    toolsUsage: {
      jsonFormat: 0.4,
      jsonValidate: 0.3,
      jsonConvert: 0.2,
      codeFormat: 0.9,
      codeExecute: 0.7,
    },
    fileOperations: {
      upload: 8,
      download: 12,
      size: 'medium',
    },
    sessionDuration: 45, // 45 minutes
    requestInterval: 8, // 8 seconds between requests
    concurrencyLevel: 2,
  },

  // Data analyst pattern - JSON-heavy usage
  analyst: {
    toolsUsage: {
      jsonFormat: 0.9,
      jsonValidate: 0.8,
      jsonConvert: 0.8,
      codeFormat: 0.3,
      codeExecute: 0.1,
    },
    fileOperations: {
      upload: 15,
      download: 20,
      size: 'large',
    },
    sessionDuration: 90, // 90 minutes
    requestInterval: 10, // 10 seconds between requests
    concurrencyLevel: 3,
  },
}

// Load testing scenarios for different concurrent user levels
export const CONCURRENT_USER_SCENARIOS: ConcurrentUserScenario[] = [
  {
    name: 'small-team',
    description: 'Small team concurrent usage (10 users)',
    userCount: 10,
    duration: 300000, // 5 minutes
    rampUpTime: 60000, // 1 minute
    behavior: USER_BEHAVIOR_PATTERNS.moderate,
    requirements: {
      maxP95ResponseTime: 300,
      minSuccessRate: 0.98,
      minThroughput: 50,
      maxErrorRate: 0.02,
    },
  },
  {
    name: 'medium-team',
    description: 'Medium team concurrent usage (50 users)',
    userCount: 50,
    duration: 600000, // 10 minutes
    rampUpTime: 120000, // 2 minutes
    behavior: USER_BEHAVIOR_PATTERNS.moderate,
    requirements: {
      maxP95ResponseTime: 500,
      minSuccessRate: 0.95,
      minThroughput: 100,
      maxErrorRate: 0.05,
    },
  },
  {
    name: 'large-team',
    description: 'Large team concurrent usage (100 users)',
    userCount: 100,
    duration: 900000, // 15 minutes
    rampUpTime: 180000, // 3 minutes
    behavior: USER_BEHAVIOR_PATTERNS.heavy,
    requirements: {
      maxP95ResponseTime: 750,
      minSuccessRate: 0.9,
      minThroughput: 150,
      maxErrorRate: 0.1,
    },
  },
  {
    name: 'enterprise-scale',
    description: 'Enterprise scale concurrent usage (500+ users)',
    userCount: 500,
    duration: 1200000, // 20 minutes
    rampUpTime: 300000, // 5 minutes
    behavior: USER_BEHAVIOR_PATTERNS.moderate,
    requirements: {
      maxP95ResponseTime: 1000,
      minSuccessRate: 0.85,
      minThroughput: 300,
      maxErrorRate: 0.15,
    },
  },
  {
    name: 'stress-test',
    description: 'Stress test with maximum load (1000 users)',
    userCount: 1000,
    duration: 600000, // 10 minutes
    rampUpTime: 600000, // 10 minutes gradual ramp-up
    behavior: USER_BEHAVIOR_PATTERNS.heavy,
    requirements: {
      maxP95ResponseTime: 2000,
      minSuccessRate: 0.7,
      minThroughput: 200,
      maxErrorRate: 0.3,
    },
  },
  {
    name: 'endurance-test',
    description: 'Endurance test with sustained load (100 users, 1 hour)',
    userCount: 100,
    duration: 3600000, // 1 hour
    rampUpTime: 300000, // 5 minutes
    behavior: USER_BEHAVIOR_PATTERNS.moderate,
    requirements: {
      maxP95ResponseTime: 600,
      minSuccessRate: 0.92,
      minThroughput: 120,
      maxErrorRate: 0.08,
    },
  },
  {
    name: 'developer-workflow',
    description: 'Developer workflow simulation (25 users)',
    userCount: 25,
    duration: 450000, // 7.5 minutes
    rampUpTime: 90000, // 1.5 minutes
    behavior: USER_BEHAVIOR_PATTERNS.developer,
    requirements: {
      maxP95ResponseTime: 400,
      minSuccessRate: 0.95,
      minThroughput: 75,
      maxErrorRate: 0.05,
    },
  },
  {
    name: 'analyst-workflow',
    description: 'Data analyst workflow simulation (15 users)',
    userCount: 15,
    duration: 600000, // 10 minutes
    rampUpTime: 60000, // 1 minute
    behavior: USER_BEHAVIOR_PATTERNS.analyst,
    requirements: {
      maxP95ResponseTime: 600,
      minSuccessRate: 0.93,
      minThroughput: 60,
      maxErrorRate: 0.07,
    },
  },
]

// File size configurations for load testing
export const FILE_SIZE_CONFIGS = {
  small: {
    min: 1024, // 1 KB
    max: 10240, // 10 KB
    average: 4096, // 4 KB
  },
  medium: {
    min: 10240, // 10 KB
    max: 1048576, // 1 MB
    average: 262144, // 256 KB
  },
  large: {
    min: 1048576, // 1 MB
    max: 10485760, // 10 MB
    average: 5242880, // 5 MB
  },
}

// Load testing configuration
export const LOAD_TEST_CONFIG = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:8787',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
  },
  reporting: {
    outputDir: './tests/load/reports',
    formats: ['json', 'html', 'csv'] as const,
    includeRawData: true,
    includeCharts: true,
    includeRecommendations: true,
  },
  monitoring: {
    metricsInterval: 5000, // 5 seconds
    resourceMonitoring: true,
    databaseMonitoring: true,
    networkMonitoring: true,
  },
  thresholds: {
    responseTime: {
      excellent: 100,
      good: 200,
      acceptable: 500,
      poor: 1000,
    },
    successRate: {
      excellent: 0.99,
      good: 0.95,
      acceptable: 0.9,
      poor: 0.8,
    },
    throughput: {
      excellent: 1000,
      good: 500,
      acceptable: 200,
      poor: 100,
    },
  },
}

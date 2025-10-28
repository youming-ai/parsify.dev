/**
 * Health Check System for Environment Monitoring
 *
 * This module provides comprehensive health checks for all environment components
 * including databases, storage, APIs, and external services.
 */

import { productionConfig, productionHealthCheck } from './production.js'
import { stagingConfig, stagingHealthCheck } from './staging.js'

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
  timestamp: string
  responseTime: number
  error?: string
  details?: Record<string, any>
  metadata?: Record<string, any>
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
  checks: HealthCheckResult[]
  lastChecked: string
  uptime: number
  version?: string
}

export interface EnvironmentHealth {
  environment: string
  overall: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
  services: Record<string, ServiceHealth>
  lastChecked: string
  incidentCount: number
  performance: {
    averageResponseTime: number
    errorRate: number
    throughput: number
  }
}

export interface HealthCheckConfig {
  name: string
  url: string
  method: 'GET' | 'POST' | 'HEAD'
  headers?: Record<string, string>
  body?: string
  timeout: number
  expectedStatusCodes: number[]
  expectedBody?: string
  checkInterval: number
  retries: number
  critical: boolean
  dependencies?: string[]
}

/**
 * Get health check configuration for environment
 */
export function getHealthCheckConfig(environment: 'staging' | 'production'): HealthCheckConfig[] {
  const baseConfig = environment === 'staging' ? stagingHealthCheck : productionHealthCheck
  const appConfig = environment === 'staging' ? stagingConfig : productionConfig

  const configs: HealthCheckConfig[] = [
    // Application health checks
    {
      name: 'main-app',
      url: `${appConfig.web.baseUrl}/health`,
      method: 'GET',
      timeout: baseConfig.timeout,
      expectedStatusCodes: baseConfig.expectedStatusCodes,
      checkInterval: 30000,
      retries: baseConfig.retries,
      critical: true,
    },
    {
      name: 'api-health',
      url: `${appConfig.api.baseUrl}/health`,
      method: 'GET',
      timeout: baseConfig.timeout,
      expectedStatusCodes: baseConfig.expectedStatusCodes,
      checkInterval: 30000,
      retries: baseConfig.retries,
      critical: true,
    },
    {
      name: 'api-status',
      url: `${appConfig.api.baseUrl}/api/v1/status`,
      method: 'GET',
      timeout: baseConfig.timeout,
      expectedStatusCodes: baseConfig.expectedStatusCodes,
      checkInterval: 60000,
      retries: baseConfig.retries,
      critical: false,
    },

    // Database health checks
    {
      name: 'database',
      url: `${appConfig.api.baseUrl}/api/v1/health/database`,
      method: 'GET',
      timeout: 5000,
      expectedStatusCodes: [200],
      checkInterval: 30000,
      retries: 3,
      critical: true,
    },

    // Storage health checks
    {
      name: 'r2-storage',
      url: `${appConfig.api.baseUrl}/api/v1/health/storage`,
      method: 'GET',
      timeout: 10000,
      expectedStatusCodes: [200],
      checkInterval: 60000,
      retries: 3,
      critical: false,
    },
    {
      name: 'kv-cache',
      url: `${appConfig.api.baseUrl}/api/v1/health/cache`,
      method: 'GET',
      timeout: 5000,
      expectedStatusCodes: [200],
      checkInterval: 30000,
      retries: 2,
      critical: false,
    },

    // External service health checks
    {
      name: 'analytics',
      url: `${appConfig.api.baseUrl}/api/v1/health/analytics`,
      method: 'GET',
      timeout: 10000,
      expectedStatusCodes: [200, 503], // 503 is acceptable if analytics is down
      checkInterval: 120000,
      retries: 2,
      critical: false,
    },
    {
      name: 'email-service',
      url: `${appConfig.api.baseUrl}/api/v1/health/email`,
      method: 'GET',
      timeout: 15000,
      expectedStatusCodes: [200, 503], // 503 is acceptable if email is down
      checkInterval: 300000,
      retries: 2,
      critical: false,
    },

    // Performance health checks
    {
      name: 'performance',
      url: `${appConfig.api.baseUrl}/api/v1/health/performance`,
      method: 'GET',
      timeout: 5000,
      expectedStatusCodes: [200],
      checkInterval: 60000,
      retries: 2,
      critical: false,
    },
  ]

  // Add production-specific checks
  if (environment === 'production') {
    configs.push(
      {
        name: 'load-balancer',
        url: `${appConfig.api.baseUrl}/api/v1/health/load-balancer`,
        method: 'GET',
        timeout: 3000,
        expectedStatusCodes: [200],
        checkInterval: 30000,
        retries: 3,
        critical: true,
      },
      {
        name: 'ssl-certificate',
        url: `${appConfig.api.baseUrl}/api/v1/health/ssl`,
        method: 'GET',
        timeout: 5000,
        expectedStatusCodes: [200],
        checkInterval: 3600000, // Check every hour
        retries: 1,
        critical: false,
      }
    )
  }

  return configs
}

/**
 * Perform a single health check
 */
export async function performHealthCheck(config: HealthCheckConfig): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        'User-Agent': 'Parsify-HealthCheck/1.0',
        ...config.headers,
      },
      body: config.body,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    // Check if status code is expected
    if (!config.expectedStatusCodes.includes(response.status)) {
      return {
        status: 'unhealthy',
        timestamp,
        responseTime,
        error: `Unexpected status code: ${response.status}`,
        details: {
          expectedStatusCodes: config.expectedStatusCodes,
          actualStatusCode: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
        },
      }
    }

    // Check response body if expected
    if (config.expectedBody) {
      const responseText = await response.text()
      if (!responseText.includes(config.expectedBody)) {
        return {
          status: 'unhealthy',
          timestamp,
          responseTime,
          error: `Response body does not contain expected text: ${config.expectedBody}`,
          details: {
            expectedBody: config.expectedBody,
            actualBody: responseText.substring(0, 200), // First 200 chars
          },
        }
      }
    }

    // Check response time for performance issues
    let status: 'healthy' | 'degraded' = 'healthy'
    if (responseTime > config.timeout * 0.8) {
      status = 'degraded'
    }

    return {
      status,
      timestamp,
      responseTime,
      details: {
        statusCode: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
      },
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    return {
      status: 'unhealthy',
      timestamp,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    }
  }
}

/**
 * Perform health check with retries
 */
export async function performHealthCheckWithRetries(
  config: HealthCheckConfig
): Promise<HealthCheckResult> {
  let lastResult: HealthCheckResult | null = null

  for (let attempt = 1; attempt <= config.retries + 1; attempt++) {
    const result = await performHealthCheck(config)

    if (result.status === 'healthy') {
      return {
        ...result,
        metadata: {
          attempt,
          totalAttempts: config.retries + 1,
        },
      }
    }

    lastResult = result

    // Don't wait after the last attempt
    if (attempt <= config.retries) {
      // Exponential backoff
      const delay = Math.min(1000 * 2 ** (attempt - 1), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return {
    ...lastResult!,
    metadata: {
      attempt: config.retries + 1,
      totalAttempts: config.retries + 1,
      failedAttempts: config.retries + 1,
    },
  }
}

/**
 * Check all services for an environment
 */
export async function checkEnvironmentHealth(
  environment: 'staging' | 'production'
): Promise<EnvironmentHealth> {
  const configs = getHealthCheckConfig(environment)
  const services: Record<string, ServiceHealth> = {}
  let _healthyCount = 0
  let totalCount = 0
  let totalResponseTime = 0
  let errorCount = 0

  // Group checks by service
  const serviceGroups: Record<string, HealthCheckConfig[]> = {}
  configs.forEach(config => {
    const serviceName = config.name.split('-')[0] // Get the base service name
    if (!serviceGroups[serviceName]) {
      serviceGroups[serviceName] = []
    }
    serviceGroups[serviceName].push(config)
  })

  // Check each service
  for (const [serviceName, serviceConfigs] of Object.entries(serviceGroups)) {
    const checks: HealthCheckResult[] = []
    let serviceStatus: 'healthy' | 'unhealthy' | 'degraded' | 'unknown' = 'healthy'
    const serviceUptime = 100

    for (const config of serviceConfigs) {
      const result = await performHealthCheckWithRetries(config)
      checks.push(result)

      totalCount++
      totalResponseTime += result.responseTime

      if (result.status === 'healthy') {
        _healthyCount++
      } else if (result.status === 'unhealthy') {
        errorCount++
        if (config.critical) {
          serviceStatus = 'unhealthy'
        } else if (serviceStatus === 'healthy') {
          serviceStatus = 'degraded'
        }
      } else if (result.status === 'degraded') {
        if (serviceStatus === 'healthy') {
          serviceStatus = 'degraded'
        }
      }
    }

    services[serviceName] = {
      name: serviceName,
      status: serviceStatus,
      checks,
      lastChecked: new Date().toISOString(),
      uptime: serviceUptime,
    }
  }

  // Determine overall health
  let overall: 'healthy' | 'unhealthy' | 'degraded' | 'unknown' = 'healthy'
  const criticalServices = Object.values(services).filter(service =>
    configs.some(config => config.name.startsWith(service.name) && config.critical)
  )

  if (criticalServices.some(service => service.status === 'unhealthy')) {
    overall = 'unhealthy'
  } else if (Object.values(services).some(service => service.status === 'degraded')) {
    overall = 'degraded'
  }

  const averageResponseTime = totalCount > 0 ? totalResponseTime / totalCount : 0
  const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0
  const throughput = 100 // This would be calculated based on actual metrics

  return {
    environment,
    overall,
    services,
    lastChecked: new Date().toISOString(),
    incidentCount: errorCount,
    performance: {
      averageResponseTime,
      errorRate,
      throughput,
    },
  }
}

/**
 * Validate environment configuration
 */
export function validateEnvironmentConfig(environment: 'staging' | 'production'): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const config = environment === 'staging' ? stagingConfig : productionConfig

  try {
    // Validate basic configuration
    if (!config.api.baseUrl) {
      errors.push('API base URL is required')
    }

    if (!config.web.baseUrl) {
      errors.push('Web base URL is required')
    }

    // Validate URLs format
    try {
      new URL(config.api.baseUrl)
    } catch {
      errors.push('Invalid API base URL format')
    }

    try {
      new URL(config.web.baseUrl)
    } catch {
      errors.push('Invalid web base URL format')
    }

    // Validate database configuration
    if (!config.database.id) {
      errors.push('Database ID is required')
    }

    // Validate storage configuration
    if (!config.storage.r2.files.bucketName) {
      errors.push('R2 files bucket name is required')
    }

    if (!config.storage.kv.cache.namespaceId) {
      errors.push('KV cache namespace ID is required')
    }

    // Validate security configuration for production
    if (environment === 'production') {
      if (!config.security.jwt.secret || config.security.jwt.secret.length < 32) {
        errors.push('JWT secret must be at least 32 characters long')
      }

      if (!config.security.encryption.key || config.security.encryption.key.length < 32) {
        errors.push('Encryption key must be at least 32 characters long')
      }
    }
  } catch (error) {
    errors.push(`Configuration validation error: ${error}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get health check summary for monitoring
 */
export function getHealthSummary(environment: 'staging' | 'production'): Promise<{
  status: string
  checks: number
  failures: number
  responseTime: number
  uptime: number
}> {
  return checkEnvironmentHealth(environment).then(health => {
    const totalChecks = Object.values(health.services).reduce(
      (total, service) => total + service.checks.length,
      0
    )
    const failures = Object.values(health.services).reduce(
      (total, service) =>
        total + service.checks.filter(check => check.status === 'unhealthy').length,
      0
    )

    return {
      status: health.overall,
      checks: totalChecks,
      failures,
      responseTime: Math.round(health.performance.averageResponseTime),
      uptime: Math.round(100 - health.performance.errorRate),
    }
  })
}

/**
 * Monitor environment health continuously
 */
export class HealthMonitor {
  private environment: 'staging' | 'production'
  private interval: number
  private timer: NodeJS.Timeout | null = null
  private callbacks: Array<(health: EnvironmentHealth) => void> = []

  constructor(environment: 'staging' | 'production', interval: number = 30000) {
    this.environment = environment
    this.interval = interval
  }

  start() {
    if (this.timer) {
      this.stop()
    }

    this.timer = setInterval(async () => {
      try {
        const health = await checkEnvironmentHealth(this.environment)
        this.callbacks.forEach(callback => callback(health))
      } catch (error) {
        console.error('Health monitoring error:', error)
      }
    }, this.interval)

    // Run initial check
    checkEnvironmentHealth(this.environment).then(health => {
      this.callbacks.forEach(callback => callback(health))
    })
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  onHealthChange(callback: (health: EnvironmentHealth) => void) {
    this.callbacks.push(callback)
  }

  removeCallback(callback: (health: EnvironmentHealth) => void) {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }
}

export default {
  getHealthCheckConfig,
  performHealthCheck,
  performHealthCheckWithRetries,
  checkEnvironmentHealth,
  validateEnvironmentConfig,
  getHealthSummary,
  HealthMonitor,
}

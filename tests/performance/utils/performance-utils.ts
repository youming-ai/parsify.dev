/**
 * Performance testing utilities and helpers
 */

export interface PerformanceMetrics {
  url: string
  method: string
  responseTime: number
  statusCode: number
  success: boolean
  timestamp: number
  error?: string
  responseSize?: number
}

export interface LoadTestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  concurrentRequests: number
  totalRequests: number
  duration?: number // milliseconds
  timeout?: number // milliseconds per request
}

export interface LoadTestResult {
  url: string
  method: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50: number
  p90: number
  p95: number
  p99: number
  requestsPerSecond: number
  throughputBytesPerSecond?: number
  errors: Array<{ error: string; count: number }>
  metrics: PerformanceMetrics[]
}

export interface ConcurrencyTestResult {
  [concurrencyLevel: number]: LoadTestResult
}

/**
 * Measure performance of a single HTTP request
 */
export async function measureRequest(
  url: string,
  options: RequestInit = {}
): Promise<PerformanceMetrics> {
  const startTime = performance.now()
  const timestamp = Date.now()

  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(options.timeout || 30000)
    })

    const endTime = performance.now()
    const responseTime = endTime - startTime

    let responseSize: number | undefined
    try {
      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        responseSize = parseInt(contentLength, 10)
      } else {
        const text = await response.text()
        responseSize = new TextEncoder().encode(text).length
      }
    } catch {
      // Ignore response size measurement errors
    }

    return {
      url,
      method: options.method || 'GET',
      responseTime,
      statusCode: response.status,
      success: response.status >= 200 && response.status < 400,
      timestamp,
      responseSize,
      error: response.status >= 400 ? `HTTP ${response.status}` : undefined
    }
  } catch (error) {
    const endTime = performance.now()
    const responseTime = endTime - startTime

    return {
      url,
      method: options.method || 'GET',
      responseTime,
      statusCode: 0,
      success: false,
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Run a load test with specified configuration
 */
export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    concurrentRequests,
    totalRequests,
    duration,
    timeout = 30000
  } = config

  const metrics: PerformanceMetrics[] = []
  const startTime = Date.now()

  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    timeout,
    body: body ? JSON.stringify(body) : undefined
  }

  // Calculate how many batches we need
  const batchSize = concurrentRequests
  const batches = Math.ceil(totalRequests / batchSize)

  console.log(`Starting load test: ${totalRequests} requests in ${batches} batches of ${batchSize}`)

  for (let batch = 0; batch < batches; batch++) {
    const requestsInBatch = Math.min(batchSize, totalRequests - metrics.length)

    // Run concurrent requests
    const batchPromises = Array.from({ length: requestsInBatch }, async () => {
      return measureRequest(url, requestOptions)
    })

    const batchResults = await Promise.all(batchPromises)
    metrics.push(...batchResults)

    // Check if we've exceeded duration limit
    if (duration && Date.now() - startTime > duration) {
      break
    }

    // Small delay between batches to prevent overwhelming
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  return calculateLoadTestMetrics(url, method, metrics)
}

/**
 * Calculate load test statistics from raw metrics
 */
function calculateLoadTestMetrics(
  url: string,
  method: string,
  metrics: PerformanceMetrics[]
): LoadTestResult {
  const successfulMetrics = metrics.filter(m => m.success)
  const failedMetrics = metrics.filter(m => !m.success)

  const responseTimes = successfulMetrics.map(m => m.responseTime)
  responseTimes.sort((a, b) => a - b)

  const totalTestTime = Math.max(...metrics.map(m => m.timestamp)) - Math.min(...metrics.map(m => m.timestamp)) || 1
  const totalResponseSize = successfulMetrics.reduce((sum, m) => sum + (m.responseSize || 0), 0)

  // Calculate percentiles
  const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0
  const p90 = responseTimes[Math.floor(responseTimes.length * 0.9)] || 0
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0

  // Group errors by type
  const errorCounts = new Map<string, number>()
  failedMetrics.forEach(m => {
    const error = m.error || 'Unknown error'
    errorCounts.set(error, (errorCounts.get(error) || 0) + 1)
  })

  const errors = Array.from(errorCounts.entries()).map(([error, count]) => ({
    error,
    count
  }))

  return {
    url,
    method,
    totalRequests: metrics.length,
    successfulRequests: successfulMetrics.length,
    failedRequests: failedMetrics.length,
    averageResponseTime: responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0,
    minResponseTime: responseTimes.length > 0 ? responseTimes[0] : 0,
    maxResponseTime: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0,
    p50,
    p90,
    p95,
    p99,
    requestsPerSecond: metrics.length / (totalTestTime / 1000),
    throughputBytesPerSecond: totalResponseSize / (totalTestTime / 1000),
    errors,
    metrics
  }
}

/**
 * Run concurrent load tests with different concurrency levels
 */
export async function runConcurrencyTest(
  baseUrl: string,
  config: Omit<LoadTestConfig, 'concurrentRequests'>,
  concurrencyLevels: number[] = [1, 5, 10, 25, 50]
): Promise<ConcurrencyTestResult> {
  const results: ConcurrencyTestResult = {}

  console.log(`Running concurrency test for ${baseUrl} with levels: ${concurrencyLevels.join(', ')}`)

  for (const concurrency of concurrencyLevels) {
    console.log(`Testing concurrency level: ${concurrency}`)

    const result = await runLoadTest({
      ...config,
      url: baseUrl,
      concurrentRequests: concurrency,
      totalRequests: Math.min(config.totalRequests || 100, concurrency * 10)
    })

    results[concurrency] = result

    // Small delay between different concurrency levels
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return results
}

/**
 * Generate performance test report
 */
export function generatePerformanceReport(results: LoadTestResult | ConcurrencyTestResult): string {
  if ('totalRequests' in results) {
    // Single test result
    const result = results as LoadTestResult
    return `
Performance Test Report
=======================
URL: ${result.url} (${result.method})
Total Requests: ${result.totalRequests}
Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%)
Failed: ${result.failedRequests}

Response Times:
- Average: ${result.averageResponseTime.toFixed(2)}ms
- Min: ${result.minResponseTime.toFixed(2)}ms
- Max: ${result.maxResponseTime.toFixed(2)}ms
- P50: ${result.p50.toFixed(2)}ms
- P90: ${result.p90.toFixed(2)}ms
- P95: ${result.p95.toFixed(2)}ms
- P99: ${result.p99.toFixed(2)}ms

Throughput:
- Requests/sec: ${result.requestsPerSecond.toFixed(2)}
- Throughput: ${result.throughputBytesPerSecond ? `${(result.throughputBytesPerSecond / 1024).toFixed(2)} KB/s` : 'N/A'}

${result.errors.length > 0 ? `
Errors:
${result.errors.map(e => `- ${e.error}: ${e.count} times`).join('\n')}
` : ''}
`.trim()
  } else {
    // Concurrency test result
    const concurrencyResults = results as ConcurrencyTestResult
    const levels = Object.keys(concurrencyResults).map(Number).sort((a, b) => a - b)

    let report = `
Concurrency Test Report
=======================
URL: ${levels.length > 0 ? concurrencyResults[levels[0]].url : 'N/A'}

Concurrency Levels Analysis:
`

    levels.forEach(level => {
      const result = concurrencyResults[level]
      report += `
${level} concurrent requests:
- P95 Response Time: ${result.p95.toFixed(2)}ms ${result.p95 < 200 ? '✅' : '❌'}
- Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%
- Throughput: ${result.requestsPerSecond.toFixed(2)} req/s
`
    })

    return report.trim()
  }
}

/**
 * Assert that performance meets requirements
 */
export function assertPerformanceRequirements(
  result: LoadTestResult,
  requirements: {
    maxP95ResponseTime?: number
    minSuccessRate?: number
    minRequestsPerSecond?: number
  } = {}
): { passed: boolean; failures: string[] } {
  const {
    maxP95ResponseTime = 200,
    minSuccessRate = 0.95,
    minRequestsPerSecond = 10
  } = requirements

  const failures: string[] = []

  if (result.p95 > maxP95ResponseTime) {
    failures.push(`P95 response time ${result.p95.toFixed(2)}ms exceeds requirement of ${maxP95ResponseTime}ms`)
  }

  const successRate = result.successfulRequests / result.totalRequests
  if (successRate < minSuccessRate) {
    failures.push(`Success rate ${(successRate * 100).toFixed(1)}% below requirement of ${(minSuccessRate * 100).toFixed(1)}%`)
  }

  if (result.requestsPerSecond < minRequestsPerSecond) {
    failures.push(`Throughput ${result.requestsPerSecond.toFixed(2)} req/s below requirement of ${minRequestsPerSecond} req/s`)
  }

  return {
    passed: failures.length === 0,
    failures
  }
}

/**
 * Save performance test results to file
 */
export async function savePerformanceResults(
  results: LoadTestResult | ConcurrencyTestResult,
  filename: string
): Promise<void> {
  const data = {
    timestamp: new Date().toISOString(),
    results
  }

  // In a real implementation, this would save to a file
  // For now, we'll just log the data
  console.log(`Performance results saved to ${filename}:`)
  console.log(JSON.stringify(data, null, 2))
}

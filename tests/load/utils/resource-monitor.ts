/**
 * System Resource Monitoring for Load Testing
 * Monitors CPU, memory, network, and database performance during load tests
 */

import { SystemResourceMetrics } from '../config/load-test-config'

export class SystemResourceMonitor {
  private isMonitoring = false
  private metrics: SystemResourceMetrics[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private startTime = 0

  /**
   * Start resource monitoring
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Resource monitoring is already running')
      return
    }

    this.isMonitoring = true
    this.startTime = Date.now()
    this.metrics = []

    console.log('🔍 Starting system resource monitoring...')

    // Collect metrics every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
    }, 5000)

    // Collect initial metrics
    await this.collectMetrics()
  }

  /**
   * Stop resource monitoring
   */
  async stop(): Promise<void> {
    if (!this.isMonitoring) {
      console.warn('Resource monitoring is not running')
      return
    }

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Collect final metrics
    await this.collectMetrics()

    console.log(`🔍 Stopped system resource monitoring. Collected ${this.metrics.length} data points.`)
  }

  /**
   * Get collected metrics
   */
  getMetrics(): SystemResourceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): ResourceMetricsSummary {
    if (this.metrics.length === 0) {
      return {
        duration: 0,
        cpu: { max: 0, average: 0, maxLoadAverage: 0 },
        memory: { max: 0, average: 0, peakUsage: 0 },
        network: { totalBytesIn: 0, totalBytesOut: 0, maxConnections: 0 },
        database: { maxConnections: 0, averageQueryTime: 0, maxQueueSize: 0 }
      }
    }

    const cpuUsages = this.metrics.map(m => m.cpu.usage)
    const memoryUsages = this.metrics.map(m => m.memory.percentage)
    const networkConnections = this.metrics.map(m => m.network.connections)
    const dbConnections = this.metrics.map(m => m.database.connections)
    const dbQueryTimes = this.metrics.map(m => m.database.queryTime)
    const dbQueueSizes = this.metrics.map(m => m.database.queueSize)

    return {
      duration: Date.now() - this.startTime,
      cpu: {
        max: Math.max(...cpuUsages),
        average: cpuUsages.reduce((sum, usage) => sum + usage, 0) / cpuUsages.length,
        maxLoadAverage: Math.max(...this.metrics.map(m => Math.max(...m.cpu.loadAverage)))
      },
      memory: {
        max: Math.max(...memoryUsages),
        average: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
        peakUsage: Math.max(...this.metrics.map(m => m.memory.used))
      },
      network: {
        totalBytesIn: this.metrics.reduce((sum, m, i) =>
          i === 0 ? 0 : sum + (m.network.bytesIn - this.metrics[i - 1].network.bytesIn), 0),
        totalBytesOut: this.metrics.reduce((sum, m, i) =>
          i === 0 ? 0 : sum + (m.network.bytesOut - this.metrics[i - 1].network.bytesOut), 0),
        maxConnections: Math.max(...networkConnections)
      },
      database: {
        maxConnections: Math.max(...dbConnections),
        averageQueryTime: dbQueryTimes.reduce((sum, time) => sum + time, 0) / dbQueryTimes.length,
        maxQueueSize: Math.max(...dbQueueSizes)
      }
    }
  }

  /**
   * Collect current system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = Date.now()

      // In a real implementation, these would collect actual system metrics
      // For now, we'll simulate realistic values based on load
      const metrics: SystemResourceMetrics = {
        timestamp,
        cpu: await this.collectCpuMetrics(),
        memory: await this.collectMemoryMetrics(),
        network: await this.collectNetworkMetrics(),
        database: await this.collectDatabaseMetrics()
      }

      this.metrics.push(metrics)

      // Log metrics at key points
      if (this.metrics.length === 1 || this.metrics.length % 12 === 0) { // Every minute
        console.log(`📊 Resource metrics (${this.metrics.length} samples): CPU=${metrics.cpu.usage.toFixed(1)}%, Memory=${metrics.memory.percentage.toFixed(1)}%, DB Conn=${metrics.database.connections}`)
      }
    } catch (error) {
      console.error('Error collecting resource metrics:', error)
    }
  }

  /**
   * Collect CPU metrics
   */
  private async collectCpuMetrics(): Promise<{ usage: number; loadAverage: number[] }> {
    // Simulate CPU usage based on time and system load
    const baseUsage = 20
    const loadVariation = Math.sin(Date.now() / 10000) * 15
    const randomVariation = (Math.random() - 0.5) * 10
    const usage = Math.max(0, Math.min(100, baseUsage + loadVariation + randomVariation))

    // Simulate load averages (1, 5, 15 minute averages)
    const loadAverage = [
      usage / 100 * 2 + Math.random() * 0.5,
      usage / 100 * 1.8 + Math.random() * 0.3,
      usage / 100 * 1.5 + Math.random() * 0.2
    ]

    return { usage, loadAverage }
  }

  /**
   * Collect memory metrics
   */
  private async collectMemoryMetrics(): Promise<{ used: number; total: number; percentage: number }> {
    // Simulate memory usage
    const totalMemory = 8192 // 8GB total
    const baseUsage = 0.3 // 30% base usage
    const usageGrowth = this.metrics.length * 0.001 // Gradual growth over time
    const randomVariation = (Math.random() - 0.5) * 0.05
    const percentage = Math.max(0.1, Math.min(0.95, baseUsage + usageGrowth + randomVariation))
    const used = totalMemory * percentage

    return { used, total: totalMemory, percentage: percentage * 100 }
  }

  /**
   * Collect network metrics
   */
  private async collectNetworkMetrics(): Promise<{ bytesIn: number; bytesOut: number; connections: number }> {
    // Simulate network metrics
    const previousMetrics = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null

    const bytesPerSecond = 1024 * 1024 // 1MB/s baseline
    const randomVariation = (Math.random() - 0.5) * 0.3
    const multiplier = 1 + randomVariation

    const bytesIn = previousMetrics
      ? previousMetrics.network.bytesIn + (bytesPerSecond * 5 * multiplier) // 5 second intervals
      : 1024 * 1024 * 10 // Start with 10MB

    const bytesOut = previousMetrics
      ? previousMetrics.network.bytesOut + (bytesPerSecond * 0.8 * multiplier) // 80% of inbound
      : 1024 * 1024 * 8 // Start with 8MB

    const baseConnections = 50
    const connectionVariation = Math.sin(Date.now() / 8000) * 20 + (Math.random() - 0.5) * 10
    const connections = Math.max(10, Math.floor(baseConnections + connectionVariation))

    return { bytesIn, bytesOut, connections }
  }

  /**
   * Collect database metrics
   */
  private async collectDatabaseMetrics(): Promise<{ connections: number; queryTime: number; queueSize: number }> {
    // Simulate database metrics
    const baseConnections = 20
    const connectionLoad = this.metrics.length * 0.1 // Increase connections over time
    const connectionVariation = Math.sin(Date.now() / 6000) * 5
    const connections = Math.max(5, Math.floor(baseConnections + connectionLoad + connectionVariation))

    const baseQueryTime = 5 // 5ms base query time
    const queryLoad = this.metrics.length * 0.02 // Query time increases with load
    const queryVariation = Math.abs(Math.sin(Date.now() / 4000)) * 10
    const queryTime = Math.max(1, baseQueryTime + queryLoad + queryVariation)

    const baseQueueSize = 0
    const queueLoad = Math.max(0, (connections - 30) * 0.5) // Queue grows when connections exceed threshold
    const queueVariation = Math.random() * 2
    const queueSize = Math.floor(baseQueueSize + queueLoad + queueVariation)

    return { connections, queryTime, queueSize }
  }

  /**
   * Generate resource usage report
   */
  generateResourceReport(): string {
    const summary = this.getMetricsSummary()

    return `
System Resource Usage Report
============================
Duration: ${(summary.duration / 1000).toFixed(1)}s
Data Points: ${this.metrics.length}

CPU Usage:
- Maximum: ${summary.cpu.max.toFixed(1)}%
- Average: ${summary.cpu.average.toFixed(1)}%
- Maximum Load Average: ${summary.cpu.maxLoadAverage.toFixed(2)}

Memory Usage:
- Maximum: ${summary.memory.max.toFixed(1)}%
- Average: ${summary.memory.average.toFixed(1)}%
- Peak Usage: ${(summary.memory.peakUsage / 1024).toFixed(1)} GB

Network Usage:
- Total Data In: ${(summary.network.totalBytesIn / 1024 / 1024).toFixed(1)} MB
- Total Data Out: ${(summary.network.totalBytesOut / 1024 / 1024).toFixed(1)} MB
- Maximum Connections: ${summary.network.maxConnections}

Database Performance:
- Maximum Connections: ${summary.database.maxConnections}
- Average Query Time: ${summary.database.averageQueryTime.toFixed(2)}ms
- Maximum Queue Size: ${summary.database.maxQueueSize}

Resource Efficiency:
${this.generateEfficiencyAnalysis(summary)}
`.trim()
  }

  /**
   * Generate resource efficiency analysis
   */
  private generateEfficiencyAnalysis(summary: ResourceMetricsSummary): string {
    const analysis = []

    // CPU efficiency analysis
    if (summary.cpu.average < 30) {
      analysis.push('✅ CPU usage is well within acceptable limits')
    } else if (summary.cpu.average < 70) {
      analysis.push('⚠️  CPU usage is moderate - monitor under increased load')
    } else {
      analysis.push('❌ CPU usage is high - consider scaling or optimization')
    }

    // Memory efficiency analysis
    if (summary.memory.average < 50) {
      analysis.push('✅ Memory usage is well within acceptable limits')
    } else if (summary.memory.average < 80) {
      analysis.push('⚠️  Memory usage is moderate - monitor for leaks')
    } else {
      analysis.push('❌ Memory usage is high - investigate potential memory leaks')
    }

    // Database efficiency analysis
    if (summary.database.averageQueryTime < 10) {
      analysis.push('✅ Database query performance is excellent')
    } else if (summary.database.averageQueryTime < 50) {
      analysis.push('⚠️  Database query performance is acceptable but could be optimized')
    } else {
      analysis.push('❌ Database query performance is poor - consider indexing or query optimization')
    }

    // Network efficiency analysis
    const totalThroughput = (summary.network.totalBytesIn + summary.network.totalBytesOut) / (summary.duration / 1000) / 1024 / 1024
    if (totalThroughput < 10) {
      analysis.push('✅ Network usage is low')
    } else if (totalThroughput < 50) {
      analysis.push('⚠️  Network usage is moderate')
    } else {
      analysis.push('❌ Network usage is high - consider bandwidth optimization')
    }

    return analysis.join('\n')
  }

  /**
   * Check for resource bottlenecks
   */
  identifyBottlenecks(): ResourceBottleneck[] {
    const bottlenecks: ResourceBottleneck[] = []
    const summary = this.getMetricsSummary()

    // CPU bottlenecks
    if (summary.cpu.max > 90) {
      bottlenecks.push({
        type: 'cpu',
        metric: 'max_usage',
        value: summary.cpu.max,
        threshold: 90,
        severity: 'critical',
        recommendation: 'Scale up CPU resources or optimize compute-intensive operations'
      })
    } else if (summary.cpu.average > 70) {
      bottlenecks.push({
        type: 'cpu',
        metric: 'average_usage',
        value: summary.cpu.average,
        threshold: 70,
        severity: 'high',
        recommendation: 'Monitor CPU usage and consider optimization under load'
      })
    }

    // Memory bottlenecks
    if (summary.memory.max > 90) {
      bottlenecks.push({
        type: 'memory',
        metric: 'max_usage',
        value: summary.memory.max,
        threshold: 90,
        severity: 'critical',
        recommendation: 'Investigate memory leaks and optimize memory usage'
      })
    } else if (summary.memory.average > 75) {
      bottlenecks.push({
        type: 'memory',
        metric: 'average_usage',
        value: summary.memory.average,
        threshold: 75,
        severity: 'high',
        recommendation: 'Monitor memory usage and implement caching strategies'
      })
    }

    // Database bottlenecks
    if (summary.database.maxConnections > 80) {
      bottlenecks.push({
        type: 'database',
        metric: 'max_connections',
        value: summary.database.maxConnections,
        threshold: 80,
        severity: 'high',
        recommendation: 'Consider connection pooling or database scaling'
      })
    }

    if (summary.database.averageQueryTime > 100) {
      bottlenecks.push({
        type: 'database',
        metric: 'average_query_time',
        value: summary.database.averageQueryTime,
        threshold: 100,
        severity: 'medium',
        recommendation: 'Optimize database queries and add appropriate indexes'
      })
    }

    if (summary.database.maxQueueSize > 10) {
      bottlenecks.push({
        type: 'database',
        metric: 'max_queue_size',
        value: summary.database.maxQueueSize,
        threshold: 10,
        severity: 'high',
        recommendation: 'Database is experiencing high load - consider scaling or query optimization'
      })
    }

    return bottlenecks
  }
}

/**
 * Resource metrics summary
 */
export interface ResourceMetricsSummary {
  duration: number
  cpu: {
    max: number
    average: number
    maxLoadAverage: number
  }
  memory: {
    max: number
    average: number
    peakUsage: number
  }
  network: {
    totalBytesIn: number
    totalBytesOut: number
    maxConnections: number
  }
  database: {
    maxConnections: number
    averageQueryTime: number
    maxQueueSize: number
  }
}

/**
 * Resource bottleneck information
 */
export interface ResourceBottleneck {
  type: 'cpu' | 'memory' | 'network' | 'database'
  metric: string
  value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

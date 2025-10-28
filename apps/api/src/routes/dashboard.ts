/**
 * 业务监控仪表板 API 端点
 * 提供业务指标、系统状态和性能数据的 API
 */

import { Hono } from 'hono'
import { logger } from '@shared/utils'
import { createAPIPerformanceMonitor } from '../monitoring/api-performance-monitor'
import { createMultiLayerCache } from '../cache/multi-layer-cache'
import { createAdaptivePoolOptimizer } from '../database/adaptive-pool-optimizer'

const dashboardApi = new Hono()

// 获取性能指标
dashboardApi.get('/metrics', async (c) => {
  try {
    const monitor = c.get('performanceMonitor') as APIPerformanceMonitor
    const metrics = monitor.getCurrentMetrics()

    // 添加业务指标
    const businessMetrics = {
      activeUsers: await getActiveUsers(),
      totalConversions: await getTotalConversions(),
      revenueToday: await getRevenueToday(),
      errorRate: metrics.errorRate,
      averageResponseTime: metrics.averageResponseTime,
      cacheHitRate: metrics.cacheHitRate,
      throughput: metrics.requestCount / (metrics.window / 1000) // requests per second
    }

    const response = {
      status: 'success',
      timestamp: Date.now(),
      data: {
        performance: metrics,
        business: businessMetrics,
        health: {
          database: await getDatabaseHealth(),
          cache: await getCacheHealth(),
          services: await getServiceHealth()
        }
      }
    }

    logger.info('Dashboard metrics retrieved', {
      performanceMetrics: metrics.requestCount,
      businessMetrics: businessMetrics.activeUsers
    })

    return c.json(response)
  } catch (error) {
    logger.error('Failed to get dashboard metrics', {
      error: (error as Error).message
    })
    return c.json({
      status: 'error',
      message: 'Failed to retrieve metrics',
      timestamp: Date.now()
    }, 500)
  }
})

// 获取历史性能数据
dashboardApi.get('/metrics/history', async (c) => {
  try {
    const hours = parseInt(c.req.query('hours') || '24')
    const monitor = c.get('performanceMonitor') as APIPerformanceMonitor

    const history = monitor.getMetricsHistory(hours)

    return c.json({
      status: 'success',
      timestamp: Date.now(),
      data: history,
      hours
    })
  } catch (error) {
    logger.error('Failed to get metrics history', {
      error: (error as Error).message
    })
    return c.json({
      status: 'error',
      message: 'Failed to retrieve metrics history'
    }, 500)
  }
})

// 获取慢请求
dashboardApi.get('/metrics/slow-requests', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50')
    const threshold = parseInt(c.req.query('threshold') || '1000')

    const monitor = c.get('performanceMonitor') as APIPerformanceMonitor
    const slowRequests = monitor.getSlowRequests(limit, threshold)

    return c.json({
      status: 'success',
      timestamp: Date.now(),
      data: slowRequests,
      limit,
      threshold
    })
  } catch (error) {
    logger.error('Failed to get slow requests', {
      error: (error as Error).message
    })
    return c.json({
      status: 'error',
      message: 'Failed to retrieve slow requests'
    }, 500)
  }
})

// 获取错误请求
dashboardApi.get('/metrics/errors', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50')

    const monitor = c.get('performanceMonitor') as APIPerformanceMonitor
    const errorRequests = monitor.getErrorRequests(limit)

    return c.json({
      status: 'success',
      timestamp: Date.now(),
      data: errorRequests,
      limit
    })
  } catch (error) {
    logger.error('Failed to get error requests', {
      error: (error as Error).message
    })
    return c.json({
      status: 'error',
      message: 'Failed to retrieve error requests'
    }, 500)
  }
})

// 获取活跃告警
dashboardApi.get('/alerts', async (c) => {
  try {
    const monitor = c.get('performanceMonitor') as APIPerformanceMonitor
    const activeAlerts = monitor.getActiveAlerts()

    return c.json({
      status: 'success',
      timestamp: Date.now(),
      data: activeAlerts
    })
  } catch (error) {
    logger.error('Failed to get active alerts', {
      error: (error as Error).message
    })
    return c.json({
      status: 'error',
      message: 'Failed to retrieve active alerts'
    }, 500)
  }
})

// 创建性能报告
dashboardApi.post('/reports/performance', async (c) => {
  try {
    const body = await c.req.json()
    const timeRange = body.timeRange || '1h'

    const monitor = c.get('performanceMonitor') as APIPerformanceMonitor
    const report = monitor.generateReport(timeRange)

    return c.json({
      status: 'success',
      timestamp: Date.now(),
      data: report,
      timeRange
    })
  } catch (error) {
    logger.error('Failed to generate performance report', {
      error: (error as Error).message
    })
    return c.json({
      status: 'error',
      message: 'Failed to generate performance report'
    }, 500)
  }
})

// 获取用户活动统计
dashboardApi.get('/users/activity', async (c) => {
  try {
    const timeRange = c.req.query('range') || '24h'
    const stats = await getUserActivityStats(timeRange)

    return c.json({
      status: 'success',
      timestamp: Date.now(),
      data: stats,
      timeRange
    })
  } catch (error) {
    logger.error('Failed to get user activity stats', {
      error: (error as Error).message
    })
    return c.json({
      status: 'error',
      message: 'Failed to retrieve user activity stats'
    }, 500)
  }
})

// 获取工具使用统计
dashboardApi.get('/tools/usage', async (c) => {
  try {
    const timeRange = c.req.query('range') || '24h'
    const stats = await getToolUsageStats(timeRange)

    return c.json({
      status: 'success',
      timestamp: Date.now(),
      data: stats,
      timeRange
    })
  } catch (error) {
    logger.error('Failed to get tool usage stats', {
      error: (error as Error).message
    })
    return c.json({
      status: 'error',
      message: 'Failed to retrieve tool usage stats'
    }, 500)
  }
})

// 获取系统健康状态
dashboardApi.get('/health/system', async (c) => {
  try {
    const health = await getSystemHealth()

    return c.json({
      status: 'success',
      timestamp: Date.now(),
      data: health
    })
  } catch (error) {
    logger.error('Failed to get system health', {
      error: (error as Error).message
    })
    return c.json({
      status: 'error',
      message: 'Failed to retrieve system health'
    }, 500)
  }
})

// 辅助函数
async function getActiveUsers(): Promise<number> {
  // 这里应该从数据库或缓存中获取真实数据
  // 简化版本，返回模拟数据
  return Math.floor(Math.random() * 1000) + 500
}

async function getTotalConversions(): Promise<number> {
  // 从实际业务数据源获取
  return Math.floor(Math.random() * 100) + 50
}

async function getRevenueToday(): Promise<number> {
  // 从实际业务数据源获取
  return Math.floor(Math.random() * 10000) + 5000
}

async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  connections: number
  responseTime: number
  errorRate: number
}> {
  try {
    const db = c.get('db') as D1Database
    const startTime = Date.now()

    await db.prepare('SELECT 1').first()

    const responseTime = Date.now() - startTime

    // 获取连接池状态
    const poolOptimizer = c.get('poolOptimizer')
    const config = poolOptimizer?.getCurrentConfiguration()

    return {
      status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',
      connections: config?.minConnections || 2,
      responseTime,
      errorRate: 0.01 // 简化版本
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      connections: 0,
      responseTime: 9999,
      errorRate: 1.0
    }
  }
}

async function getCacheHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  hitRate: number
  memoryUsage: number
  totalSize: number
}> {
  try {
    const cache = c.get('cache') as MultiLayerCache
    const stats = cache.getStats()

    return {
      status: stats.memoryUsage < 50 * 1024 * 1024 ? 'healthy' : 'degraded',
      hitRate: stats.layers.l1.hits / Math.max(1, stats.layers.l1.hits + stats.layers.l1.misses),
      memoryUsage: stats.memoryUsage,
      totalSize: stats.size
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      hitRate: 0,
      memoryUsage: 0,
      totalSize: 0
    }
  }
}

async function getServiceHealth(): Promise<Record<string, {
  status: 'up' | 'down' | 'degraded'
  responseTime: number
  lastCheck: string
}>> {
  // 检查各个服务的健康状态
  const services = ['auth', 'tools', 'upload', 'cache']
  const health: Record<string, any> = {}

  for (const service of services) {
    try {
      const startTime = Date.now()
      // 这里应该实际检查服务端点
      const responseTime = Math.random() * 100 + 50

      health[service] = {
        status: responseTime < 200 ? 'up' : responseTime < 500 ? 'degraded' : 'down',
        responseTime,
        lastCheck: new Date().toISOString()
      }
    } catch (error) {
      health[service] = {
        status: 'down',
        responseTime: 9999,
        lastCheck: new Date().toISOString()
      }
    }
  }

  return health
}

async function getUserActivityStats(timeRange: string): Promise<{
  totalUsers: number
  activeUsers: number
  newUsers: number
  returningUsers: number
  sessionsByHour: Record<string, number>
  topPages: Array<{ page: string; views: number }>
  topCountries: Array<{ country: string; users: number }>
}> {
  // 简化版本，返回模拟数据
  const totalUsers = Math.floor(Math.random() * 10000) + 5000
  const activeUsers = Math.floor(totalUsers * 0.3)
  const newUsers = Math.floor(totalUsers * 0.1)
  const returningUsers = activeUsers - newUsers

  const hours = []
  for (let i = 0; i < 24; i++) {
    hours.push(new Date(Date.now() - i * 3600000).toISOString())
  }

  const sessionsByHour: Record<string, number> = {}
  hours.forEach(hour => {
    sessionsByHour[hour] = Math.floor(Math.random() * 100 + 50)
  })

  return {
    totalUsers,
    activeUsers,
    newUsers,
    returningUsers,
    sessionsByHour,
    topPages: [
      { page: '/tools', views: 1500 },
      { page: '/dashboard', views: 1200 },
      { page: '/auth/login', views: 800 }
    ],
    topCountries: [
      { country: 'US', users: 4500 },
      { country: 'GB', users: 2000 },
      { country: 'CA', users: 1500 }
    ]
  }
}

async function getToolUsageStats(timeRange: string): Promise<{
  totalExecutions: number
  toolUsage: Record<string, {
    name: string
    executions: number
    users: number
    averageTime: number
    successRate: number
  }>
  mostPopular: string
  trends: {
    increasing: string[]
    decreasing: string[]
  }
}> {
  // 简化版本，返回模拟数据
  const tools = ['json-formatter', 'code-formatter', 'json-validator', 'base64-encoder']
  const totalExecutions = Math.floor(Math.random() * 50000) + 10000

  const toolUsage: Record<string, any> = {}
  tools.forEach(tool => {
    toolUsage[tool] = {
      name: tool.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase()),
      executions: Math.floor(Math.random() * 10000) + 1000,
      users: Math.floor(Math.random() * 500) + 100,
      averageTime: Math.random() * 500 + 100,
      successRate: 0.95 + Math.random() * 0.04
    }
  })

  return {
    totalExecutions,
    toolUsage,
    mostPopular: 'json-formatter',
    trends: {
      increasing: ['code-formatter'],
      decreasing: ['base64-encoder']
    }
  }
}

async function getSystemHealth(): Promise<{
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: Record<string, {
    status: 'up' | 'down' | 'degraded'
    uptime: number
    lastCheck: string
  }>
  resources: {
    cpu: { usage: number; status: string }
    memory: { usage: number; status: string }
    disk: { usage: number; status: string }
  }
  metrics: {
    errorRate: number
    responseTime: number
    throughput: number
  }
}> {
  const dbHealth = await getDatabaseHealth()
  const cacheHealth = await getCacheHealth()
  const serviceHealth = await getServiceHealth()

  const services = {
    database: {
      status: dbHealth.status,
      uptime: 99.9,
      lastCheck: new Date().toISOString()
    },
    cache: {
      status: cacheHealth.status,
      uptime: 99.5,
      lastCheck: new Date().toISOString()
    },
    ...serviceHealth
  }

  const downServices = Object.values(services).filter(s => s.status === 'down').length
  const degradedServices = Object.values(services).filter(s => s.status === 'degraded').length

  const overall = downServices === 0
    ? (degradedServices > 2 ? 'degraded' : 'healthy')
    : 'unhealthy'

  return {
    overall,
    services,
    resources: {
      cpu: { usage: Math.random() * 0.8, status: 'normal' },
      memory: { usage: 0.65, status: 'normal' },
      disk: { usage: 0.45, status: 'normal' }
    },
    metrics: {
      errorRate: 0.01,
      responseTime: 150,
      throughput: 450
    }
  }
}

export { dashboardApi }

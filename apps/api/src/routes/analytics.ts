/**
 * Analytics API Routes
 * Handles analytics data collection, retrieval, and management
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import type { Env } from '../index'

// Type definitions
interface AnalyticsEvent {
  id: string
  name: string
  timestamp: number
  url: string
  userAgent: string
  userId?: string
  sessionId: string
  data: Record<string, any>
  properties?: Record<string, string | number | boolean>
}

interface AnalyticsBatch {
  id: string
  events: AnalyticsEvent[]
  sessionId: string
  userId?: string
  timestamp: number
}

interface AnalyticsMetrics {
  totalPageViews: number
  uniqueSessions: number
  activeUsers: number
  toolUsage: Record<string, number>
  performance: {
    averageLCP: number
    averageFID: number
    averageCLS: number
    averageFCP: number
  }
  apiUsage: {
    totalRequests: number
    averageResponseTime: number
    errorRate: number
    endpointBreakdown: Record<string, number>
  }
  engagement: {
    averageSessionDuration: number
    bounceRate: number
    pagesPerSession: number
  }
}

// Validation schemas
const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  timestamp: z.number(),
  url: z.string().url(),
  userAgent: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  data: z.record(z.any()),
  properties: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
})

const BatchSchema = z.object({
  batchId: z.string(),
  events: z.array(EventSchema),
  sessionId: z.string(),
  userId: z.string().optional(),
  timestamp: z.number(),
})

const MetricsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  metrics: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
})

const app = new Hono<{ Bindings: Env }>()

/**
 * Store analytics events
 */
app.post('/events', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = BatchSchema.parse(body)

    // Store events in KV analytics storage
    const batchKey = `analytics:batch:${validatedData.batchId}`
    await c.env.ANALYTICS.put(batchKey, JSON.stringify(validatedData), {
      expirationTtl: 60 * 60 * 24 * 30, // 30 days retention
    })

    // Store individual events for real-time processing
    for (const event of validatedData.events) {
      const eventKey = `analytics:event:${event.id}`
      await c.env.ANALYTICS.put(eventKey, JSON.stringify(event), {
        expirationTtl: 60 * 60 * 24 * 7, // 7 days retention
      })

      // Update real-time counters
      await updateRealtimeCounters(c.env, event)
    }

    // Process events for aggregation
    await processAnalyticsBatch(c.env, validatedData)

    return c.json({
      success: true,
      batchId: validatedData.batchId,
      eventsProcessed: validatedData.events.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to store analytics events:', error)
    return c.json(
      {
        error: 'Failed to store analytics events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      400
    )
  }
})

/**
 * Get real-time analytics data
 */
app.get('/realtime', async (c) => {
  try {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    // Get real-time metrics from KV
    const realtimeMetrics = await getRealtimeMetrics(c.env, oneHourAgo, now)

    return c.json({
      timestamp: new Date().toISOString(),
      timeframe: '1h',
      metrics: realtimeMetrics,
    })
  } catch (error) {
    console.error('Failed to get real-time analytics:', error)
    return c.json(
      {
        error: 'Failed to retrieve real-time analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Get analytics dashboard data
 */
app.get('/dashboard', async (c) => {
  try {
    const query = MetricsQuerySchema.parse(c.req.query())

    const startDate = query.startDate ? new Date(query.startDate).getTime() : Date.now() - 7 * 24 * 60 * 60 * 1000
    const endDate = query.endDate ? new Date(query.endDate).getTime() : Date.now()

    // Get aggregated metrics from database
    const metrics = await getAggregatedMetrics(c.env, startDate, endDate, query.granularity)

    return c.json({
      timeframe: {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
        granularity: query.granularity,
      },
      metrics,
    })
  } catch (error) {
    console.error('Failed to get dashboard analytics:', error)
    return c.json(
      {
        error: 'Failed to retrieve dashboard analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Get tool usage analytics
 */
app.get('/tools', async (c) => {
  try {
    const query = MetricsQuerySchema.parse(c.req.query())

    const startDate = query.startDate ? new Date(query.startDate).getTime() : Date.now() - 7 * 24 * 60 * 60 * 1000
    const endDate = query.endDate ? new Date(query.endDate).getTime() : Date.now()

    // Get tool usage metrics
    const toolMetrics = await getToolUsageMetrics(c.env, startDate, endDate)

    return c.json({
      timeframe: {
        start: new Date(startDate).toISOString(),
        end: new Date(endName).toISOString(),
      },
      tools: toolMetrics,
    })
  } catch (error) {
    console.error('Failed to get tool analytics:', error)
    return c.json(
      {
        error: 'Failed to retrieve tool analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Get performance analytics
 */
app.get('/performance', async (c) => {
  try {
    const query = MetricsQuerySchema.parse(c.req.query())

    const startDate = query.startDate ? new Date(query.startDate).getTime() : Date.now() - 7 * 24 * 60 * 60 * 1000
    const endDate = query.endDate ? new Date(query.endDate).getTime() : Date.now()

    // Get performance metrics
    const performanceMetrics = await getPerformanceMetrics(c.env, startDate, endDate)

    return c.json({
      timeframe: {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
      },
      performance: performanceMetrics,
    })
  } catch (error) {
    console.error('Failed to get performance analytics:', error)
    return c.json(
      {
        error: 'Failed to retrieve performance analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Get user analytics (requires authentication)
 */
app.get('/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')

    // In a real implementation, you would verify that the authenticated user
    // has permission to access this user's analytics

    const query = MetricsQuerySchema.parse(c.req.query())
    const startDate = query.startDate ? new Date(query.startDate).getTime() : Date.now() - 7 * 24 * 60 * 60 * 1000
    const endDate = query.endDate ? new Date(query.endDate).getTime() : Date.now()

    // Get user-specific analytics
    const userAnalytics = await getUserAnalytics(c.env, userId, startDate, endDate)

    return c.json({
      userId,
      timeframe: {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
      },
      analytics: userAnalytics,
    })
  } catch (error) {
    console.error('Failed to get user analytics:', error)
    return c.json(
      {
        error: 'Failed to retrieve user analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Export analytics data (requires admin permissions)
 */
app.post('/export', async (c) => {
  try {
    const body = await c.req.json()
    const { format = 'json', filters = {} } = body

    // In a real implementation, you would verify admin permissions

    const query = MetricsQuerySchema.parse(c.req.query())
    const startDate = query.startDate ? new Date(query.startDate).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000
    const endDate = query.endDate ? new Date(query.endDate).getTime() : Date.now()

    // Get analytics data for export
    const exportData = await getAnalyticsExport(c.env, startDate, endDate, filters)

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${Date.now()}.csv"`,
        },
      })
    } else {
      // Return JSON format
      return c.json({
        exportDate: new Date().toISOString(),
        timeframe: {
          start: new Date(startDate).toISOString(),
          end: new Date(endDate).toISOString(),
        },
        data: exportData,
      })
    }
  } catch (error) {
    console.error('Failed to export analytics:', error)
    return c.json(
      {
        error: 'Failed to export analytics data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Delete analytics data (GDPR compliance)
 */
app.delete('/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')

    // In a real implementation, you would verify user identity or admin permissions

    // Delete user's analytics data
    await deleteUserAnalytics(c.env, userId)

    return c.json({
      success: true,
      message: 'User analytics data deleted successfully',
      userId,
    })
  } catch (error) {
    console.error('Failed to delete user analytics:', error)
    return c.json(
      {
        error: 'Failed to delete user analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// Helper functions

async function updateRealtimeCounters(env: Env, event: AnalyticsEvent): Promise<void> {
  const now = Date.now()
  const hourKey = `analytics:hour:${Math.floor(now / (60 * 60 * 1000))}`

  try {
    // Get existing counters
    const existing = await env.ANALYTICS.get(hourKey)
    const counters = existing ? JSON.parse(existing) : {}

    // Update counters based on event type
    switch (event.name) {
      case 'page_view':
        counters.pageViews = (counters.pageViews || 0) + 1
        break
      case 'tool_usage':
        counters.toolUsage = (counters.toolUsage || 0) + 1
        counters.toolUsageBreakdown = counters.toolUsageBreakdown || {}
        const toolName = event.data.toolName || 'unknown'
        counters.toolUsageBreakdown[toolName] = (counters.toolUsageBreakdown[toolName] || 0) + 1
        break
      case 'performance':
        counters.performanceEvents = (counters.performanceEvents || 0) + 1
        break
      case 'api_usage':
        counters.apiCalls = (counters.apiCalls || 0) + 1
        if (event.data.statusCode >= 400) {
          counters.apiErrors = (counters.apiErrors || 0) + 1
        }
        break
    }

    counters.uniqueSessions = counters.uniqueSessions || new Set()
    counters.uniqueSessions.add(event.sessionId)

    // Save updated counters
    await env.ANALYTICS.put(hourKey, JSON.stringify(counters), {
      expirationTtl: 60 * 60 * 24, // 24 hours
    })
  } catch (error) {
    console.error('Failed to update realtime counters:', error)
  }
}

async function getRealtimeMetrics(env: Env, startTime: number, endTime: number): Promise<any> {
  const metrics = {
    pageViews: 0,
    uniqueSessions: new Set<string>(),
    toolUsage: 0,
    apiCalls: 0,
    apiErrors: 0,
    activeUsers: new Set<string>(),
  }

  try {
    // Get counters for the last hour
    const hourKey = `analytics:hour:${Math.floor(startTime / (60 * 60 * 1000))}`
    const counters = await env.ANALYTICS.get(hourKey)

    if (counters) {
      const data = JSON.parse(counters)
      metrics.pageViews = data.pageViews || 0
      metrics.toolUsage = data.toolUsage || 0
      metrics.apiCalls = data.apiCalls || 0
      metrics.apiErrors = data.apiErrors || 0
      metrics.uniqueSessions = new Set(data.uniqueSessions || [])
    }
  } catch (error) {
    console.error('Failed to get realtime metrics:', error)
  }

  return {
    pageViews: metrics.pageViews,
    uniqueSessions: metrics.uniqueSessions.size,
    toolUsage: metrics.toolUsage,
    apiCalls: metrics.apiCalls,
    apiErrors: metrics.apiErrors,
    activeUsers: metrics.activeUsers.size,
    errorRate: metrics.apiCalls > 0 ? (metrics.apiErrors / metrics.apiCalls) * 100 : 0,
  }
}

async function processAnalyticsBatch(env: Env, batch: AnalyticsBatch): Promise<void> {
  // Process events for long-term storage and aggregation
  try {
    // Store aggregated data in D1 database for long-term analysis
    for (const event of batch.events) {
      await storeEventInDatabase(env, event)
    }
  } catch (error) {
    console.error('Failed to process analytics batch:', error)
  }
}

async function storeEventInDatabase(env: Env, event: AnalyticsEvent): Promise<void> {
  try {
    // Store event in D1 database for long-term analysis
    await env.DB.prepare(`
      INSERT INTO analytics_events (
        id, name, timestamp, url, user_agent, user_id, session_id, data, properties
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id,
      event.name,
      new Date(event.timestamp).toISOString(),
      event.url,
      event.userAgent,
      event.userId || null,
      event.sessionId,
      JSON.stringify(event.data),
      event.properties ? JSON.stringify(event.properties) : null
    ).run()
  } catch (error) {
    console.error('Failed to store event in database:', error)
  }
}

async function getAggregatedMetrics(
  env: Env,
  startDate: number,
  endDate: number,
  granularity: string
): Promise<AnalyticsMetrics> {
  try {
    // Get aggregated metrics from D1 database
    const result = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT user_id) as active_users,
        SUM(CASE WHEN name = 'page_view' THEN 1 ELSE 0 END) as page_views,
        SUM(CASE WHEN name = 'tool_usage' THEN 1 ELSE 0 END) as tool_usage
      FROM analytics_events
      WHERE timestamp BETWEEN ? AND ?
    `).bind(
      new Date(startDate).toISOString(),
      new Date(endDate).toISOString()
    ).first()

    return {
      totalPageViews: result?.page_views || 0,
      uniqueSessions: result?.unique_sessions || 0,
      activeUsers: result?.active_users || 0,
      toolUsage: {},
      performance: {
        averageLCP: 0,
        averageFID: 0,
        averageCLS: 0,
        averageFCP: 0,
      },
      apiUsage: {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        endpointBreakdown: {},
      },
      engagement: {
        averageSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
      },
    }
  } catch (error) {
    console.error('Failed to get aggregated metrics:', error)
    throw error
  }
}

async function getToolUsageMetrics(env: Env, startDate: number, endDate: number): Promise<any> {
  try {
    const result = await env.DB.prepare(`
      SELECT
        JSON_EXTRACT(data, '$.toolName') as tool_name,
        JSON_EXTRACT(data, '$.action') as action,
        COUNT(*) as usage_count,
        AVG(JSON_EXTRACT(data, '$.processingTime')) as avg_processing_time
      FROM analytics_events
      WHERE name = 'tool_usage'
        AND timestamp BETWEEN ? AND ?
      GROUP BY tool_name, action
      ORDER BY usage_count DESC
    `).bind(
      new Date(startDate).toISOString(),
      new Date(endDate).toISOString()
    ).all()

    return result.results || []
  } catch (error) {
    console.error('Failed to get tool usage metrics:', error)
    return []
  }
}

async function getPerformanceMetrics(env: Env, startDate: number, endDate: number): Promise<any> {
  try {
    const result = await env.DB.prepare(`
      SELECT
        JSON_EXTRACT(data, '$.lcp') as lcp,
        JSON_EXTRACT(data, '$.fid') as fid,
        JSON_EXTRACT(data, '$.cls') as cls,
        JSON_EXTRACT(data, '$.fcp') as fcp,
        JSON_EXTRACT(data, '$.ttfb') as ttfb
      FROM analytics_events
      WHERE name = 'performance'
        AND timestamp BETWEEN ? AND ?
    `).bind(
      new Date(startDate).toISOString(),
      new Date(endDate).toISOString()
    ).all()

    const metrics = result.results || []
    const validMetrics = metrics.filter(m => m.lcp || m.fid || m.cls || m.fcp || m.ttfb)

    if (validMetrics.length === 0) {
      return {
        averageLCP: 0,
        averageFID: 0,
        averageCLS: 0,
        averageFCP: 0,
        averageTTFB: 0,
        sampleSize: 0,
      }
    }

    return {
      averageLCP: validMetrics.reduce((sum, m) => sum + (m.lcp || 0), 0) / validMetrics.length,
      averageFID: validMetrics.reduce((sum, m) => sum + (m.fid || 0), 0) / validMetrics.length,
      averageCLS: validMetrics.reduce((sum, m) => sum + (m.cls || 0), 0) / validMetrics.length,
      averageFCP: validMetrics.reduce((sum, m) => sum + (m.fcp || 0), 0) / validMetrics.length,
      averageTTFB: validMetrics.reduce((sum, m) => sum + (m.ttfb || 0), 0) / validMetrics.length,
      sampleSize: validMetrics.length,
    }
  } catch (error) {
    console.error('Failed to get performance metrics:', error)
    return {}
  }
}

async function getUserAnalytics(env: Env, userId: string, startDate: number, endDate: number): Promise<any> {
  try {
    const result = await env.DB.prepare(`
      SELECT
        name,
        COUNT(*) as event_count,
        MIN(timestamp) as first_event,
        MAX(timestamp) as last_event
      FROM analytics_events
      WHERE user_id = ?
        AND timestamp BETWEEN ? AND ?
      GROUP BY name
      ORDER BY event_count DESC
    `).bind(
      userId,
      new Date(startDate).toISOString(),
      new Date(endDate).toISOString()
    ).all()

    return result.results || []
  } catch (error) {
    console.error('Failed to get user analytics:', error)
    return []
  }
}

async function getAnalyticsExport(env: Env, startDate: number, endDate: number, filters: any): Promise<any> {
  try {
    const result = await env.DB.prepare(`
      SELECT *
      FROM analytics_events
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
      LIMIT 10000
    `).bind(
      new Date(startDate).toISOString(),
      new Date(endDate).toISOString()
    ).all()

    return result.results || []
  } catch (error) {
    console.error('Failed to get analytics export:', error)
    return []
  }
}

async function deleteUserAnalytics(env: Env, userId: string): Promise<void> {
  try {
    // Delete or anonymize user's analytics data
    await env.DB.prepare(`
      DELETE FROM analytics_events
      WHERE user_id = ?
    `).bind(userId).run()

    // Also clean up any KV storage
    const list = await env.ANALYTICS.list({ prefix: `analytics:user:${userId}:` })
    for (const key of list.keys) {
      await env.ANALYTICS.delete(key.name)
    }
  } catch (error) {
    console.error('Failed to delete user analytics:', error)
    throw error
  }
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      return typeof value === 'string' && value.includes(',')
        ? `"${value.replace(/"/g, '""')}"`
        : value
    })
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}

export { app as analyticsRoutes }

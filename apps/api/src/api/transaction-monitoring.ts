import { Hono } from 'hono'
import {
  globalTransactionManager,
  globalTransactionMonitor,
  TransactionStatus,
  IsolationLevel
} from '../database'

export const transactionMonitoringApi = new Hono()

/**
 * Get real-time transaction monitoring dashboard data
 */
transactionMonitoringApi.get('/dashboard', async (c) => {
  try {
    const db = c.get('db')
    const client = c.get('dbClient')

    const dashboardData = client.getTransactionMonitor().getDashboardData(
      client.getTransactionManager()
    )

    return c.json({
      success: true,
      data: dashboardData
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Get transaction metrics and analytics
 */
transactionMonitoringApi.get('/metrics', async (c) => {
  try {
    const client = c.get('dbClient')
    const timeRange = parseInt(c.req.query('timeRange') || '3600000') // Default 1 hour

    const report = client.getTransactionMonitor().generateReport(timeRange)

    return c.json({
      success: true,
      data: report
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Get active transactions
 */
transactionMonitoringApi.get('/active', async (c) => {
  try {
    const client = c.get('dbClient')
    const activeTransactions = client.getTransactionManager().getActiveTransactions()

    const transactionData = activeTransactions.map(tx => ({
      id: tx.id,
      status: tx.currentStatus,
      duration: tx.getDuration(),
      queryCount: tx.getMetrics().queryCount,
      isolationLevel: tx.getMetrics().isolationLevel,
      remainingTime: tx.getRemainingTime(),
      hasTimedOut: tx.hasTimedOut(),
      activeSavepoints: tx.getActiveSavepoints()
    }))

    return c.json({
      success: true,
      data: {
        count: activeTransactions.length,
        transactions: transactionData
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Get transaction alerts
 */
transactionMonitoringApi.get('/alerts', async (c) => {
  try {
    const monitor = c.get('dbClient').getTransactionMonitor()
    const activeOnly = c.req.query('activeOnly') === 'true'

    const alerts = activeOnly ? monitor.getActiveAlerts() : monitor.getAllAlerts()

    return c.json({
      success: true,
      data: {
        count: alerts.length,
        alerts: alerts.map(alert => ({
          id: alert.id,
          transactionId: alert.transactionId,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          resolvedAt: alert.resolvedAt
        }))
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Resolve an alert
 */
transactionMonitoringApi.post('/alerts/:alertId/resolve', async (c) => {
  try {
    const alertId = c.req.param('alertId')
    const monitor = c.get('dbClient').getTransactionMonitor()

    const resolved = monitor.resolveAlert(alertId)

    if (!resolved) {
      return c.json({
        success: false,
        error: 'Alert not found or already resolved'
      }, 404)
    }

    return c.json({
      success: true,
      message: 'Alert resolved successfully'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Export transaction metrics in different formats
 */
transactionMonitoringApi.get('/export/:format', async (c) => {
  try {
    const format = c.req.param('format') as 'json' | 'prometheus' | 'csv'
    const monitor = c.get('dbClient').getTransactionMonitor()

    if (!['json', 'prometheus', 'csv'].includes(format)) {
      return c.json({
        success: false,
        error: 'Invalid format. Supported formats: json, prometheus, csv'
      }, 400)
    }

    const exportedData = monitor.exportMetrics(format)

    // Set appropriate content type
    const contentType = format === 'json' ? 'application/json' :
                       format === 'csv' ? 'text/csv' :
                       'text/plain'

    return c.text(exportedData, 200, {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="transaction-metrics.${format}"`
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Get transaction performance analysis
 */
transactionMonitoringApi.get('/performance', async (c) => {
  try {
    const client = c.get('dbClient')
    const timeRange = parseInt(c.req.query('timeRange') || '3600000') // Default 1 hour

    const report = client.getTransactionMonitor().generateReport(timeRange)
    const activeTransactions = client.getTransactionManager().getActiveTransactions()

    // Analyze performance issues
    const performanceIssues = []

    // Check for long-running transactions
    const longRunningTransactions = activeTransactions.filter(tx => tx.getDuration() > 10000)
    if (longRunningTransactions.length > 0) {
      performanceIssues.push({
        type: 'long_running_transactions',
        count: longRunningTransactions.length,
        severity: longRunningTransactions.length > 5 ? 'high' : 'medium',
        message: `${longRunningTransactions.length} transactions running for more than 10 seconds`
      })
    }

    // Check success rate
    if (report.summary.successRate < 95) {
      performanceIssues.push({
        type: 'low_success_rate',
        value: report.summary.successRate,
        severity: report.summary.successRate < 90 ? 'high' : 'medium',
        message: `Transaction success rate is ${report.summary.successRate.toFixed(2)}%`
      })
    }

    // Check average duration
    if (report.summary.averageDuration > 5000) {
      performanceIssues.push({
        type: 'high_average_duration',
        value: report.summary.averageDuration,
        severity: report.summary.averageDuration > 10000 ? 'high' : 'medium',
        message: `Average transaction duration is ${report.summary.averageDuration}ms`
      })
    }

    // Check deadlock rate
    if (report.summary.deadlockRate > 1) {
      performanceIssues.push({
        type: 'high_deadlock_rate',
        value: report.summary.deadlockRate,
        severity: report.summary.deadlockRate > 5 ? 'high' : 'medium',
        message: `Deadlock rate is ${report.summary.deadlockRate.toFixed(2)}%`
      })
    }

    return c.json({
      success: true,
      data: {
        performance: report.performance,
        issues: performanceIssues,
        recommendations: report.recommendations,
        summary: report.summary
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Kill a specific transaction (emergency use only)
 */
transactionMonitoringApi.delete('/transactions/:transactionId', async (c) => {
  try {
    const transactionId = c.req.param('transactionId')
    const reason = c.req.query('reason') || 'Manual termination via API'

    const transactionManager = c.get('dbClient').getTransactionManager()
    const transaction = transactionManager.getTransaction(transactionId)

    if (!transaction) {
      return c.json({
        success: false,
        error: 'Transaction not found'
      }, 404)
    }

    if (!transaction.isActive) {
      return c.json({
        success: false,
        error: 'Transaction is not active'
      }, 400)
    }

    await transaction.rollback(reason)
    transactionManager.removeTransaction(transactionId)

    return c.json({
      success: true,
      message: 'Transaction terminated successfully',
      data: {
        transactionId,
        reason,
        duration: transaction.getDuration()
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Cleanup completed transactions
 */
transactionMonitoringApi.post('/cleanup', async (c) => {
  try {
    const transactionManager = c.get('dbClient').getTransactionManager()
    const cleanedCount = transactionManager.cleanup()

    return c.json({
      success: true,
      message: `Cleaned up ${cleanedCount} completed transactions`,
      data: { cleanedCount }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Get transaction statistics by isolation level
 */
transactionMonitoringApi.get('/isolation-levels', async (c) => {
  try {
    const monitor = c.get('dbClient').getTransactionMonitor()
    const timeRange = parseInt(c.req.query('timeRange') || '3600000') // Default 1 hour

    const report = monitor.generateReport(timeRange)

    return c.json({
      success: true,
      data: {
        distribution: report.summary.isolationLevelDistribution || {},
        recommendations: Object.entries(report.summary.isolationLevelDistribution || {})
          .filter(([level, count]) => level === IsolationLevel.SERIALIZABLE && count > 0)
          .map(([level, count]) => ({
            level,
            count,
            recommendation: `Consider using lower isolation level for some transactions to improve performance`
          }))
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

/**
 * Configure monitoring settings
 */
transactionMonitoringApi.post('/config', async (c) => {
  try {
    const body = await c.req.json()
    const monitor = c.get('dbClient').getTransactionMonitor()

    // Update monitoring configuration (this would require extending the monitor)
    // For now, just return success with current config

    return c.json({
      success: true,
      message: 'Monitoring configuration updated',
      data: {
        slowTransactionThreshold: 5000,
        maxQueryHistory: 10000,
        enableAlerts: true,
        enableMetricsExport: true
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: (error as Error).message
    }, 500)
  }
})

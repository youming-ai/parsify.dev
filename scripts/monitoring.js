#!/usr/bin/env node

/**
 * Monitoring and Health Check Script
 *
 * This script sets up monitoring, health checks, and alerting for the
 * Parsify platform, including application metrics, database performance,
 * and system health monitoring.
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const https = require('node:https')
const http = require('node:http')

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..')
const MONITORING_DIR = path.join(PROJECT_ROOT, 'monitoring')
const CONFIG_DIR = path.join(MONITORING_DIR, 'config')
const ALERTS_DIR = path.join(MONITORING_DIR, 'alerts')
const DASHBOARDS_DIR = path.join(MONITORING_DIR, 'dashboards')

// Health check endpoints
const _HEALTH_ENDPOINTS = {
  api: '/health',
  database: '/health/database',
  cache: '/health/cache',
  storage: '/health/storage',
}

// Monitoring thresholds
const THRESHOLDS = {
  responseTime: 2000, // 2 seconds
  errorRate: 0.05, // 5%
  memoryUsage: 0.85, // 85%
  cpuUsage: 0.8, // 80%
  diskUsage: 0.9, // 90%
  databaseConnections: 0.8, // 80% of max
  cacheHitRate: 0.9, // 90%
}

// Colors for console output
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[34m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
}

function log(level, message) {
  console.log(`${colors[level]}[${level.toUpperCase()}]${colors.reset} ${message}`)
}

function exec(command, options = {}) {
  const { silent = false } = options

  try {
    log('info', `Executing: ${command}`)
    const result = execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
    })
    return result
  } catch (error) {
    log('error', `Command failed: ${command}`)
    log('error', error.message)
    if (!silent) {
      throw error
    }
    return null
  }
}

function ensureDirectories() {
  const dirs = [MONITORING_DIR, CONFIG_DIR, ALERTS_DIR, DASHBOARDS_DIR]

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      log('info', `Created directory: ${dir}`)
    }
  }
}

function createPrometheusConfig() {
  const config = {
    global: {
      scrape_interval: '15s',
      evaluation_interval: '15s',
    },
    rule_files: ['alerts/*.yml'],
    scrape_configs: [
      {
        job_name: 'parsify-api',
        static_configs: [
          {
            targets: ['localhost:8787'],
          },
        ],
        metrics_path: '/metrics',
        scrape_interval: '15s',
        scrape_timeout: '10s',
      },
      {
        job_name: 'node-exporter',
        static_configs: [
          {
            targets: ['localhost:9100'],
          },
        ],
        scrape_interval: '30s',
      },
    ],
    alerting: {
      alertmanagers: [
        {
          static_configs: [
            {
              targets: ['localhost:9093'],
            },
          ],
        },
      ],
    },
  }

  const configPath = path.join(CONFIG_DIR, 'prometheus.yml')
  fs.writeFileSync(
    configPath,
    `# Prometheus Configuration\n${JSON.stringify(config, null, 2).replace(/"/g, '')}`
  )

  log('success', `Prometheus configuration created: ${configPath}`)
  return configPath
}

function createGrafanaDashboard() {
  const dashboard = {
    dashboard: {
      title: 'Parsify Platform Monitoring',
      tags: ['parsify', 'platform'],
      timezone: 'browser',
      panels: [
        {
          title: 'API Response Time',
          type: 'graph',
          targets: [
            {
              expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
              legendFormat: '95th percentile',
            },
            {
              expr: 'histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))',
              legendFormat: '50th percentile',
            },
          ],
          yAxes: [
            {
              label: 'Response Time (seconds)',
            },
          ],
        },
        {
          title: 'Request Rate',
          type: 'graph',
          targets: [
            {
              expr: 'rate(http_requests_total[5m])',
              legendFormat: 'Requests/sec',
            },
          ],
          yAxes: [
            {
              label: 'Requests per second',
            },
          ],
        },
        {
          title: 'Error Rate',
          type: 'graph',
          targets: [
            {
              expr: 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])',
              legendFormat: 'Error Rate',
            },
          ],
          yAxes: [
            {
              label: 'Error Rate',
              max: 1,
              min: 0,
            },
          ],
        },
        {
          title: 'Memory Usage',
          type: 'graph',
          targets: [
            {
              expr: 'process_resident_memory_bytes / 1024 / 1024',
              legendFormat: 'Memory (MB)',
            },
          ],
          yAxes: [
            {
              label: 'Memory (MB)',
            },
          ],
        },
        {
          title: 'Database Performance',
          type: 'graph',
          targets: [
            {
              expr: 'rate(database_query_duration_seconds_sum[5m]) / rate(database_query_duration_seconds_count[5m])',
              legendFormat: 'Average Query Time',
            },
            {
              expr: 'rate(database_connections_active[5m])',
              legendFormat: 'Active Connections',
            },
          ],
          yAxes: [
            {
              label: 'Time/Connections',
            },
          ],
        },
        {
          title: 'Cache Performance',
          type: 'graph',
          targets: [
            {
              expr: 'rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))',
              legendFormat: 'Cache Hit Rate',
            },
          ],
          yAxes: [
            {
              label: 'Hit Rate',
              max: 1,
              min: 0,
            },
          ],
        },
      ],
      time: {
        from: 'now-1h',
        to: 'now',
      },
      refresh: '30s',
    },
  }

  const dashboardPath = path.join(DASHBOARDS_DIR, 'parsify-platform.json')
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2))

  log('success', `Grafana dashboard created: ${dashboardPath}`)
  return dashboardPath
}

function createAlertRules() {
  const alerts = {
    groups: [
      {
        name: 'parsify-api',
        rules: [
          {
            alert: 'HighErrorRate',
            expr: 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05',
            for: '5m',
            labels: {
              severity: 'warning',
            },
            annotations: {
              summary: 'High error rate detected',
              description: 'Error rate is {{ $value | humanizePercentage }} for the last 5 minutes',
            },
          },
          {
            alert: 'HighResponseTime',
            expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2',
            for: '5m',
            labels: {
              severity: 'warning',
            },
            annotations: {
              summary: 'High response time detected',
              description: '95th percentile response time is {{ $value }} seconds',
            },
          },
          {
            alert: 'HighMemoryUsage',
            expr: 'process_resident_memory_bytes / 1024 / 1024 / 1024 > 1',
            for: '5m',
            labels: {
              severity: 'warning',
            },
            annotations: {
              summary: 'High memory usage detected',
              description: 'Memory usage is {{ $value }} GB',
            },
          },
          {
            alert: 'DatabaseDown',
            expr: 'up{job="parsify-api"} == 0',
            for: '1m',
            labels: {
              severity: 'critical',
            },
            annotations: {
              summary: 'Database is down',
              description: 'Database connection has been lost for more than 1 minute',
            },
          },
          {
            alert: 'CacheHitRateLow',
            expr: 'rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.8',
            for: '10m',
            labels: {
              severity: 'warning',
            },
            annotations: {
              summary: 'Low cache hit rate',
              description: 'Cache hit rate is {{ $value | humanizePercentage }}',
            },
          },
        ],
      },
    ],
  }

  const alertPath = path.join(ALERTS_DIR, 'parsify-alerts.yml')
  const alertContent =
    `# Alert Rules for Parsify Platform\n${JSON.stringify(alerts, null, 2).replace(/"/g, '')}`
      .replace(/groups:/g, 'groups:')
      .replace(/name:/g, 'name:')
      .replace(/rules:/g, 'rules:')
      .replace(/alert:/g, 'alert:')
      .replace(/expr:/g, 'expr:')
      .replace(/for:/g, 'for:')
      .replace(/labels:/g, 'labels:')
      .replace(/annotations:/g, 'annotations:')
      .replace(/summary:/g, 'summary:')
      .replace(/description:/g, 'description:')
      .replace(/severity:/g, 'severity:')

  fs.writeFileSync(alertPath, alertContent)

  log('success', `Alert rules created: ${alertPath}`)
  return alertPath
}

function createDockerCompose() {
  const compose = {
    version: '3.8',
    services: {
      prometheus: {
        image: 'prom/prometheus:latest',
        ports: ['9090:9090'],
        volumes: [
          './monitoring/config/prometheus.yml:/etc/prometheus/prometheus.yml',
          './monitoring/alerts:/etc/prometheus/alerts',
        ],
        command: [
          '--config.file=/etc/prometheus/prometheus.yml',
          '--storage.tsdb.path=/prometheus',
          '--web.console.libraries=/etc/prometheus/console_libraries',
          '--web.console.templates=/etc/prometheus/consoles',
          '--storage.tsdb.retention.time=200h',
          '--web.enable-lifecycle',
        ],
      },
      grafana: {
        image: 'grafana/grafana:latest',
        ports: ['3000:3000'],
        volumes: [
          './monitoring/dashboards:/etc/grafana/provisioning/dashboards',
          'grafana-storage:/var/lib/grafana',
        ],
        environment: {
          GF_SECURITY_ADMIN_PASSWORD: 'admin',
        },
        depends_on: ['prometheus'],
      },
      alertmanager: {
        image: 'prom/alertmanager:latest',
        ports: ['9093:9093'],
        volumes: ['./monitoring/config/alertmanager.yml:/etc/alertmanager/alertmanager.yml'],
      },
      node_exporter: {
        image: 'prom/node-exporter:latest',
        ports: ['9100:9100'],
        volumes: ['/proc:/host/proc:ro', '/sys:/host/sys:ro', '/:/rootfs:ro'],
        command: [
          '--path.procfs=/host/proc',
          '--path.rootfs=/rootfs',
          '--path.sysfs=/host/sys',
          '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)',
        ],
      },
    },
    volumes: {
      'grafana-storage': {},
    },
  }

  const composePath = path.join(MONITORING_DIR, 'docker-compose.yml')
  fs.writeFileSync(
    composePath,
    `# Docker Compose for Monitoring Stack\n${JSON.stringify(compose, null, 2).replace(/"/g, '')}`
  )

  log('success', `Docker Compose configuration created: ${composePath}`)
  return composePath
}

async function performHealthCheck(baseUrl, endpoint = '/health') {
  const url = new URL(endpoint, baseUrl)
  const startTime = Date.now()

  return new Promise(resolve => {
    const request = url.protocol === 'https:' ? https : http

    const req = request.get(url, res => {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      let data = ''
      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const healthData = JSON.parse(data)
          resolve({
            success: true,
            statusCode: res.statusCode,
            responseTime,
            data: healthData,
            url: url.toString(),
          })
        } catch (_error) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            responseTime,
            error: 'Invalid JSON response',
            url: url.toString(),
          })
        }
      })
    })

    req.on('error', error => {
      const endTime = Date.now()
      resolve({
        success: false,
        responseTime: endTime - startTime,
        error: error.message,
        url: url.toString(),
      })
    })

    req.setTimeout(THRESHOLDS.responseTime, () => {
      req.destroy()
      resolve({
        success: false,
        responseTime: THRESHOLDS.responseTime,
        error: 'Request timeout',
        url: url.toString(),
      })
    })
  })
}

async function runHealthChecks(baseUrl) {
  log('info', `Running health checks for ${baseUrl}`)

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl,
    checks: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  }

  // Check main health endpoint
  const mainHealth = await performHealthCheck(baseUrl, '/health')
  results.checks.main = mainHealth
  results.summary.total++

  if (mainHealth.success && mainHealth.statusCode === 200) {
    results.summary.passed++
  } else {
    results.summary.failed++
  }

  // Check additional endpoints if main health check passes
  if (mainHealth.success && mainHealth.data?.services) {
    for (const [service, _status] of Object.entries(mainHealth.data.services)) {
      const serviceHealth = await performHealthCheck(baseUrl, `/health/${service}`)
      results.checks[service] = serviceHealth
      results.summary.total++

      if (serviceHealth.success && serviceHealth.statusCode === 200) {
        results.summary.passed++
      } else {
        results.summary.failed++
      }
    }
  }

  // Check metrics endpoint
  const metricsHealth = await performHealthCheck(baseUrl, '/metrics')
  results.checks.metrics = metricsHealth
  results.summary.total++

  if (metricsHealth.success && metricsHealth.statusCode === 200) {
    results.summary.passed++
  } else {
    results.summary.warnings++ // Metrics endpoint failure is a warning, not a failure
  }

  // Print summary
  console.log('\n=== Health Check Summary ===')
  console.log(`Base URL: ${baseUrl}`)
  console.log(`Total Checks: ${results.summary.total}`)
  console.log(`Passed: ${results.summary.passed}`)
  console.log(`Failed: ${results.summary.failed}`)
  console.log(`Warnings: ${results.summary.warnings}`)

  // Print individual check results
  console.log('\n=== Individual Checks ===')
  for (const [checkName, checkResult] of Object.entries(results.checks)) {
    const status = checkResult.success && checkResult.statusCode === 200 ? '✓' : '✗'
    const time = checkResult.responseTime ? `${checkResult.responseTime}ms` : 'N/A'
    console.log(`${status} ${checkName}: ${checkResult.statusCode || 'ERROR'} (${time})`)

    if (!checkResult.success && checkResult.error) {
      console.log(`   Error: ${checkResult.error}`)
    }
  }

  return results
}

function setupMonitoringStack() {
  log('info', 'Setting up monitoring stack...')

  ensureDirectories()

  const configs = {
    prometheus: createPrometheusConfig(),
    grafana: createGrafanaDashboard(),
    alerts: createAlertRules(),
    docker: createDockerCompose(),
  }

  log('success', 'Monitoring stack setup completed')
  log('info', 'To start the monitoring stack, run:')
  log('info', `  cd ${MONITORING_DIR} && docker-compose up -d`)
  log('info', 'Then access:')
  log('info', '  Prometheus: http://localhost:9090')
  log('info', '  Grafana: http://localhost:3000 (admin/admin)')
  log('info', '  AlertManager: http://localhost:9093')

  return configs
}

function generateHealthReport(results) {
  const reportPath = path.join(MONITORING_DIR, `health-report-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))

  log('success', `Health report saved: ${reportPath}`)
  return reportPath
}

function sendAlert(type, message, details = {}) {
  log('warning', `ALERT [${type}]: ${message}`)

  // In a real implementation, this would send alerts to:
  // - Slack
  // - Email
  // - PagerDuty
  // - Discord
  // - etc.

  const alert = {
    timestamp: new Date().toISOString(),
    type,
    message,
    details,
  }

  // Store alert in monitoring directory
  const alertPath = path.join(ALERTS_DIR, `alert-${Date.now()}.json`)
  fs.writeFileSync(alertPath, JSON.stringify(alert, null, 2))
}

async function monitorContinuously(baseUrl, interval = 60000) {
  log('info', `Starting continuous monitoring every ${interval}ms`)

  const results = []

  const monitor = async () => {
    try {
      const healthResults = await runHealthChecks(baseUrl)
      results.push(healthResults)

      // Check for alerts
      if (healthResults.summary.failed > 0) {
        sendAlert('health_check_failed', `${healthResults.summary.failed} health check(s) failed`, {
          url: baseUrl,
          results: healthResults,
        })
      }

      // Check response times
      for (const [checkName, checkResult] of Object.entries(healthResults.checks)) {
        if (checkResult.responseTime > THRESHOLDS.responseTime) {
          sendAlert(
            'high_response_time',
            `High response time for ${checkName}: ${checkResult.responseTime}ms`,
            { url: checkResult.url, responseTime: checkResult.responseTime }
          )
        }
      }
    } catch (error) {
      log('error', `Monitoring error: ${error.message}`)
      sendAlert('monitoring_error', `Monitoring system error: ${error.message}`, {
        error: error.message,
        stack: error.stack,
      })
    }
  }

  // Run immediately
  await monitor()

  // Set up interval
  const intervalId = setInterval(monitor, interval)

  // Handle shutdown
  process.on('SIGINT', () => {
    log('info', 'Stopping continuous monitoring...')
    clearInterval(intervalId)
    process.exit(0)
  })

  return intervalId
}

// Main CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'

  switch (command) {
    case 'setup':
      setupMonitoringStack()
      break

    case 'health': {
      const baseUrl = args[1]
      if (!baseUrl) {
        log('error', 'Base URL is required for health check')
        log('info', 'Usage: node monitoring.js health <base_url>')
        process.exit(1)
      }

      const results = await runHealthChecks(baseUrl)
      generateHealthReport(results)
      break
    }

    case 'monitor': {
      const monitorUrl = args[1]
      const interval = parseInt(args[2], 10) || 60000

      if (!monitorUrl) {
        log('error', 'Base URL is required for monitoring')
        log('info', 'Usage: node monitoring.js monitor <base_url> [interval_ms]')
        process.exit(1)
      }

      await monitorContinuously(monitorUrl, interval)
      break
    }

    case 'alert': {
      const alertType = args[1]
      const alertMessage = args.slice(2).join(' ')

      if (!alertType || !alertMessage) {
        log('error', 'Alert type and message are required')
        log('info', 'Usage: node monitoring.js alert <type> <message>')
        process.exit(1)
      }

      sendAlert(alertType, alertMessage)
      break
    }

    case 'start':
      log('info', 'Starting monitoring stack with Docker Compose...')
      exec('docker-compose up -d', { cwd: MONITORING_DIR })
      log('success', 'Monitoring stack started')
      break

    case 'stop':
      log('info', 'Stopping monitoring stack...')
      exec('docker-compose down', { cwd: MONITORING_DIR })
      log('success', 'Monitoring stack stopped')
      break

    case 'help':
      console.log(`
Monitoring and Health Check Script

Usage: node monitoring.js <command> [options]

Commands:
  setup                     Set up monitoring stack configuration files
  health <url>              Run health checks on specified URL
  monitor <url> [interval]  Start continuous monitoring
  alert <type> <message>    Send a manual alert
  start                     Start monitoring stack with Docker
  stop                      Stop monitoring stack
  help                      Show this help message

Examples:
  node monitoring.js setup
  node monitoring.js health https://api.parsify.dev
  node monitoring.js monitor https://api.parsify.dev 30000
  node monitoring.js alert high_error_rate "Error rate exceeded 5%"
  node monitoring.js start
  node monitoring.js stop

Health Check Endpoints:
  /health                   Main application health
  /health/database         Database connectivity
  /health/cache           Cache performance
  /metrics                 Prometheus metrics

Monitoring Stack:
  - Prometheus (port 9090)
  - Grafana (port 3000)
  - AlertManager (port 9093)
  - Node Exporter (port 9100)
`)
      break

    default:
      log('error', `Unknown command: ${command}`)
      log('info', 'Run "node monitoring.js help" for usage information')
      process.exit(1)
  }
}

// Export functions for testing
module.exports = {
  setupMonitoringStack,
  runHealthChecks,
  monitorContinuously,
  sendAlert,
  performHealthCheck,
  createPrometheusConfig,
  createGrafanaDashboard,
  createAlertRules,
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error)
}

#!/usr/bin/env node

/**
 * Post-Deployment Monitoring and Rollback System
 * Monitors production deployments and handles automatic rollback procedures
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '../..');

// Monitoring configuration
const MONITORING_CONFIG = {
  domain: process.env.MONITOR_DOMAIN || 'parsify.dev',
  apiDomain: process.env.MONITOR_API_DOMAIN || 'api.parsify.dev',
  interval: parseInt(process.env.MONITOR_INTERVAL) || 60000, // 1 minute
  timeout: parseInt(process.env.MONITOR_TIMEOUT) || 30000, // 30 seconds
  failureThreshold: parseInt(process.env.FAILURE_THRESHOLD) || 5,
  rollbackWindow: parseInt(process.env.ROLLBACK_WINDOW) || 3600000, // 1 hour
  notificationChannels: (process.env.NOTIFICATION_CHANNELS || 'console').split(','),
  autoRollback: process.env.AUTO_ROLLBACK !== 'false',
  dryRun: process.env.DRY_RUN === 'true',
};

// Health check endpoints
const HEALTH_ENDPOINTS = [
  { name: 'Main Page', url: '/', critical: true },
  { name: 'API Health', url: '/api/health', critical: true },
  { name: 'Tools Page', url: '/tools', critical: true },
  { name: 'Search API', url: '/api/search?q=test', critical: false },
  { name: 'JSON Tool', url: '/tools/json', critical: false },
];

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  responseTime: 5000, // 5 seconds
  errorRate: 0.05, // 5%
  memoryUsage: 0.9, // 90%
  cpuUsage: 0.8, // 80%
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logCritical(message) {
  log(`🔴 ${message}`, 'bright');
}

class MonitoringSystem {
  constructor() {
    this.deploymentId = null;
    this.startTime = Date.now();
    this.failureCount = 0;
    this.successCount = 0;
    this.checkHistory = [];
    this.isHealthy = true;
    this.rollbackTriggered = false;
  }

  async initialize(deploymentId) {
    this.deploymentId = deploymentId;

    log('🚀 Starting Post-Deployment Monitoring', 'bright');
    log('=====================================', 'cyan');
    logInfo(`Deployment ID: ${deploymentId}`);
    logInfo(`Domain: ${MONITORING_CONFIG.domain}`);
    logInfo(`Monitoring interval: ${MONITORING_CONFIG.interval / 1000}s`);
    logInfo(`Failure threshold: ${MONITORING_CONFIG.failureThreshold}`);
    logInfo(`Rollback window: ${MONITORING_CONFIG.rollbackWindow / 60000} minutes`);
    logInfo(`Auto rollback: ${MONITORING_CONFIG.autoRollback ? 'enabled' : 'disabled'}`);

    if (MONITORING_CONFIG.dryRun) {
      logWarning('DRY RUN MODE - No actual rollbacks will be performed');
    }
  }

  async performHealthCheck(endpoint) {
    const url = `https://${MONITORING_CONFIG.domain}${endpoint.url}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(MONITORING_CONFIG.timeout),
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok && responseTime <= PERFORMANCE_THRESHOLDS.responseTime;

      return {
        endpoint: endpoint.name,
        url,
        status: response.status,
        responseTime,
        success,
        critical: endpoint.critical,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        endpoint: endpoint.name,
        url,
        error: error.message,
        responseTime: Date.now() - startTime,
        success: false,
        critical: endpoint.critical,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runHealthChecks() {
    const results = [];
    let criticalFailures = 0;
    let totalFailures = 0;

    for (const endpoint of HEALTH_ENDPOINTS) {
      const result = await this.performHealthCheck(endpoint);
      results.push(result);

      if (!result.success) {
        totalFailures++;
        if (endpoint.critical) {
          criticalFailures++;
        }

        logError(`❌ ${endpoint.name}: ${result.error || `HTTP ${result.status}`} (${result.responseTime}ms)`);
      } else {
        logSuccess(`✅ ${endpoint.name}: OK (${result.responseTime}ms)`);
      }
    }

    return {
      results,
      criticalFailures,
      totalFailures,
      allPassed: totalFailures === 0,
      criticalPassed: criticalFailures === 0,
    };
  }

  async checkPerformanceMetrics() {
    try {
      const healthResponse = await fetch(`https://${MONITORING_CONFIG.domain}/api/health`, {
        signal: AbortSignal.timeout(MONITORING_CONFIG.timeout),
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();

        const metrics = {
          uptime: healthData.uptime || 0,
          memory: healthData.memory || {},
          timestamp: new Date().toISOString(),
        };

        // Check memory usage
        const memoryUsage = (metrics.memory.heapUsed || 0) / (metrics.memory.heapTotal || 1);

        if (memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage) {
          logWarning(`High memory usage: ${(memoryUsage * 100).toFixed(1)}%`);
        }

        return {
          success: true,
          metrics,
          memoryUsage,
          healthy: memoryUsage <= PERFORMANCE_THRESHOLDS.memoryUsage,
        };
      }

      return { success: false, error: 'Health endpoint not responding' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  recordCheckResult(result) {
    this.checkHistory.push({
      timestamp: new Date().toISOString(),
      ...result,
    });

    // Keep only last 100 checks
    if (this.checkHistory.length > 100) {
      this.checkHistory = this.checkHistory.slice(-100);
    }

    // Update counters
    if (result.allPassed) {
      this.successCount++;
      this.failureCount = 0;
      this.isHealthy = true;
    } else {
      this.failureCount++;
      if (this.failureCount >= MONITORING_CONFIG.failureThreshold) {
        this.isHealthy = false;
      }
    }
  }

  async notify(message, severity = 'info') {
    const notification = {
      timestamp: new Date().toISOString(),
      deploymentId: this.deploymentId,
      message,
      severity,
      domain: MONITORING_CONFIG.domain,
    };

    // Console notification
    switch (severity) {
      case 'critical':
        logCritical(message);
        break;
      case 'error':
        logError(message);
        break;
      case 'warning':
        logWarning(message);
        break;
      default:
        logInfo(message);
    }

    // Additional notification channels
    if (MONITORING_CONFIG.notificationChannels.includes('slack')) {
      await this.notifySlack(notification);
    }

    if (MONITORING_CONFIG.notificationChannels.includes('email')) {
      await this.notifyEmail(notification);
    }

    // Save to log file
    this.saveNotificationLog(notification);
  }

  async notifySlack(notification) {
    // Slack webhook integration would go here
    logInfo(`[SLACK] ${notification.message}`);
  }

  async notifyEmail(notification) {
    // Email notification would go here
    logInfo(`[EMAIL] ${notification.message}`);
  }

  saveNotificationLog(notification) {
    const logsDir = join(projectRoot, 'logs');
    mkdirSync(logsDir, { recursive: true });

    const logFile = join(logsDir, `monitoring-${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = JSON.stringify(notification) + '\n';

    try {
      // Simple append - in production you'd use a proper logging library
      execSync(`echo '${logEntry}' >> ${logFile}`);
    } catch (error) {
      logWarning(`Could not save notification log: ${error.message}`);
    }
  }

  async triggerRollback(reason) {
    if (this.rollbackTriggered) {
      logWarning('Rollback already triggered');
      return;
    }

    this.rollbackTriggered = true;

    await this.notify(
      `🚨 CRITICAL: Triggering automatic rollback due to: ${reason}`,
      'critical'
    );

    if (MONITORING_CONFIG.dryRun) {
      logWarning('[DRY RUN] Would execute rollback now');
      return;
    }

    try {
      // Execute rollback
      logInfo('Executing Vercel rollback...');
      const result = execSync('vercel rollback', {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 120000,
      });

      logSuccess('Rollback executed successfully');
      await this.notify('✅ Rollback completed successfully', 'info');

      return result;

    } catch (error) {
      logError(`Rollback failed: ${error.message}`);
      await this.notify(`❌ Rollback failed: ${error.message}`, 'critical');
      throw error;
    }
  }

  async runMonitoringCycle() {
    const cycleStart = Date.now();

    log('\n🔍 Running monitoring cycle...', 'blue');

    try {
      // Run health checks
      const healthResults = await this.runHealthChecks();

      // Run performance checks
      const performanceResults = await this.checkPerformanceMetrics();

      // Determine overall health
      const cycleHealthy = healthResults.criticalPassed &&
                          (performanceResults.success ? performanceResults.healthy : false);

      // Record results
      const cycleResult = {
        cycleId: this.checkHistory.length + 1,
        health: healthResults,
        performance: performanceResults,
        healthy: cycleHealthy,
        duration: Date.now() - cycleStart,
      };

      this.recordCheckResult(cycleResult);

      // Handle failures
      if (!cycleHealthy) {
        const reason = healthResults.criticalFailures > 0
          ? `${healthResults.criticalFailures} critical health check(s) failed`
          : 'Performance thresholds exceeded';

        await this.notify(`⚠️ Monitoring cycle failed: ${reason}`, 'warning');

        if (this.failureCount >= MONITORING_CONFIG.failureThreshold && MONITORING_CONFIG.autoRollback) {
          await this.triggerRollback(reason);
          return false; // Stop monitoring after rollback
        }
      } else {
        logSuccess(`✅ Monitoring cycle passed (${cycleResult.duration}ms)`);
      }

      return true; // Continue monitoring

    } catch (error) {
      logError(`Monitoring cycle error: ${error.message}`);
      await this.notify(`❌ Monitoring cycle error: ${error.message}`, 'error');

      // Don't count monitoring errors as deployment failures
      return true;
    }
  }

  async start() {
    log(`📊 Starting monitoring for deployment: ${this.deploymentId}`, 'bright');
    log(`⏰ Rollback window: ${MONITORING_CONFIG.rollbackWindow / 60000} minutes`, 'blue');

    const endTime = Date.now() + MONITORING_CONFIG.rollbackWindow;
    let cycleCount = 0;

    // Initial health check
    await this.notify('🚀 Post-deployment monitoring started', 'info');

    const initialCheck = await this.runMonitoringCycle();
    if (!initialCheck) {
      return; // Rollback triggered on first check
    }

    // Monitoring loop
    const monitoringInterval = setInterval(async () => {
      cycleCount++;

      // Check if rollback window has expired
      if (Date.now() >= endTime) {
        clearInterval(monitoringInterval);
        log('\n🏁 Monitoring window expired', 'cyan');
        await this.notify('✅ Post-deployment monitoring completed successfully', 'info');
        this.generateMonitoringReport();
        return;
      }

      // Run monitoring cycle
      const continueMonitoring = await this.runMonitoringCycle();

      // Stop if rollback was triggered
      if (!continueMonitoring) {
        clearInterval(monitoringInterval);
        this.generateMonitoringReport(true);
        return;
      }

    }, MONITORING_CONFIG.interval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(monitoringInterval);
      log('\n🛑 Monitoring stopped by user', 'yellow');
      this.generateMonitoringReport();
      process.exit(0);
    });
  }

  generateMonitoringReport(rollbackTriggered = false) {
    logStep('Generating Monitoring Report');

    const report = {
      deploymentId: this.deploymentId,
      domain: MONITORING_CONFIG.domain,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      cycles: this.checkHistory.length,
      successCount: this.successCount,
      failureCount: this.failureCount,
      rollbackTriggered,
      configuration: MONITORING_CONFIG,
      healthEndpoints: HEALTH_ENDPOINTS,
      performanceThresholds: PERFORMANCE_THRESHOLDS,
      checkHistory: this.checkHistory,
    };

    const reportsDir = join(projectRoot, 'reports');
    mkdirSync(reportsDir, { recursive: true });

    const reportPath = join(reportsDir, `monitoring-report-${this.deploymentId}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    logSuccess(`Monitoring report generated: ${reportPath}`);

    // Display summary
    log(`\n📊 Monitoring Summary:`, 'bright');
    log(`Total cycles: ${report.cycles}`, 'blue');
    log(`Successful cycles: ${report.successCount}`, 'green');
    log(`Failed cycles: ${report.failureCount}`, report.failureCount > 0 ? 'red' : 'blue');
    log(`Duration: ${Math.round(report.duration / 1000)}s`, 'blue');
    log(`Rollback triggered: ${rollbackTriggered ? 'Yes' : 'No'}`, rollbackTriggered ? 'red' : 'green');

    return reportPath;
  }
}

async function createRollbackScript() {
  logStep('Creating Rollback Script');

  const rollbackScript = `#!/bin/bash
# Manual Rollback Script
# Usage: ./rollback.sh [deployment-id]

set -e

DEPLOYMENT_ID="${1:-latest}"
DOMAIN="${MONITORING_CONFIG.domain}"

echo "🔄 Starting rollback process..."
echo "Domain: $DOMAIN"
echo "Deployment: $DEPLOYMENT_ID"

# Backup current state
echo "📦 Creating backup of current deployment..."
vercel alias ls $DOMAIN > current-deployment.backup

# Perform rollback
echo "🚨 Executing rollback..."
vercel rollback $DEPLOYMENT_ID

# Verify rollback
echo "🔍 Verifying rollback..."
sleep 10

if curl -f -s "https://$DOMAIN/api/health" > /dev/null; then
    echo "✅ Rollback successful - health check passed"
else
    echo "❌ Rollback verification failed"
    echo "🔴 Manual intervention required"
    exit 1
fi

echo "🎉 Rollback completed successfully"
echo "📋 Previous deployment saved to: current-deployment.backup"
`;

  const scriptPath = join(projectRoot, 'scripts', 'rollback.sh');
  writeFileSync(scriptPath, rollbackScript);

  // Make script executable
  try {
    execSync(`chmod +x ${scriptPath}`);
    logSuccess('Rollback script created and made executable');
  } catch (error) {
    logWarning('Could not make rollback script executable');
  }
}

async function main() {
  const deploymentId = process.argv[2] || `deploy-${Date.now()}`;

  log('📊 Parsify.dev Post-Deployment Monitoring', 'bright');
  log('========================================', 'cyan');

  try {
    // Create rollback script
    await createRollbackScript();

    // Initialize and start monitoring
    const monitor = new MonitoringSystem();
    await monitor.initialize(deploymentId);
    await monitor.start();

  } catch (error) {
    logError(`Monitoring system failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at ${promise}: ${reason}`);
  process.exit(1);
});

// Start the monitoring system
main();

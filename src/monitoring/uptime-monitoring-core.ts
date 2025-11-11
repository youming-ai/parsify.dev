/**
 * Uptime Monitoring Core Infrastructure
 * Comprehensive system health monitoring for SC-005 compliance (99.9% uptime target)
 * Provides automated health checks, availability tracking, and real-time monitoring
 */

export interface UptimeConfig {
  targetUptimePercentage: number; // 99.9% for SC-005
  checkInterval: number; // milliseconds
  timeout: number; // timeout for each check
  retryAttempts: number;
  retryDelay: number;
  alerting: {
    enabled: boolean;
    downtimeThreshold: number; // minutes before alert
    performanceThreshold: number; // percentage degradation
    channels: Array<'console' | 'browser' | 'analytics' | 'webhook'>;
  };
  monitoring: {
    realTime: boolean;
    historical: boolean;
    performance: boolean;
    availability: boolean;
  };
  storage: {
    maxHistoryDays: number;
    compressOldData: boolean;
    cleanupInterval: number; // hours
  };
}

export interface HealthCheckResult {
  toolId: string;
  toolName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  uptimePercentage: number;
  consecutiveFailures: number;
  totalChecks: number;
  successfulChecks: number;
  errorRate: number;
  averageResponseTime: number;
  details: HealthCheckDetails;
}

export interface HealthCheckDetails {
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration: number;
    timestamp: Date;
  }>;
  performance: {
    loadTime?: number;
    renderTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    networkRequests?: number;
  };
  errors: Array<{
    type: string;
    message: string;
    timestamp: Date;
    count: number;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

export interface UptimeMetrics {
  toolId: string;
  toolName: string;
  period: {
    start: Date;
    end: Date;
    duration: number; // milliseconds
  };
  uptime: {
    percentage: number;
    totalDowntime: number; // milliseconds
    incidents: number;
    averageIncidentDuration: number; // milliseconds
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    slowestResponseTime: number;
    fastestResponseTime: number;
    performanceDegradation: number; // percentage
  };
  availability: {
    totalChecks: number;
    successfulChecks: number;
    failedChecks: number;
    errorRate: number;
    consecutiveSuccesses: number;
    consecutiveFailures: number;
  };
  reliability: {
    meanTimeBetweenFailures: number; // milliseconds
    meanTimeToRecovery: number; // milliseconds
    currentStreak: number; // consecutive successful checks
    reliabilityScore: number; // 0-100
  };
  compliance: {
    sc005Compliant: boolean;
    targetUptime: number;
    achievedUptime: number;
    variance: number;
    lastComplianceCheck: Date;
  };
}

export interface DowntimeIncident {
  id: string;
  toolId: string;
  toolName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  status: 'active' | 'resolved' | 'investigating';
  severity: 'minor' | 'major' | 'critical';
  impact: {
    affectedUsers: number;
    affectedFeatures: string[];
    businessImpact: string;
  };
  cause: {
    category: 'performance' | 'availability' | 'infrastructure' | 'code' | 'external';
    description: string;
    rootCause?: string;
  };
  resolution: {
    action?: string;
    resolutionTime?: number;
    prevention?: string;
  };
  notifications: Array<{
    type: 'alert' | 'escalation' | 'resolution';
    timestamp: Date;
    channel: string;
    recipient?: string;
  }>;
}

export interface UptimeAlert {
  id: string;
  type: 'downtime' | 'performance' | 'compliance' | 'recovery';
  severity: 'info' | 'warning' | 'error' | 'critical';
  toolId?: string;
  toolName?: string;
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  escalation: {
    level: number;
    maxLevel: number;
    escalatedAt?: Date;
    escalatedTo?: string;
  };
  metadata: {
    incidentId?: string;
    metrics?: Partial<UptimeMetrics>;
    previousAlerts?: number;
    threshold?: number;
    actualValue?: number;
  };
}

export interface SystemHealthStatus {
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number; // 0-100
    uptime: number; // percentage
    activeTools: number;
    totalTools: number;
    lastUpdate: Date;
  };
  sc005Compliance: {
    compliant: boolean;
    targetUptime: number;
    currentUptime: number;
    variance: number;
    lastCheck: Date;
    daysInPeriod: number;
    incidents: number;
    maxAllowedIncidents: number;
  };
  tools: HealthCheckResult[];
  incidents: DowntimeIncident[];
  alerts: UptimeAlert[];
  performance: {
    averageResponseTime: number;
    slowestTool: string;
    fastestTool: string;
    performanceDegradation: number;
  };
  trends: {
    uptimeTrend: Array<{ date: Date; uptime: number }>;
    performanceTrend: Array<{ date: Date; responseTime: number }>;
    incidentTrend: Array<{ date: Date; incidents: number }>;
  };
}

export interface HealthChecker {
  id: string;
  name: string;
  toolId: string;
  check: () => Promise<HealthCheckResult>;
  interval?: number;
  timeout?: number;
  enabled: boolean;
  lastRun?: Date;
  lastResult?: HealthCheckResult;
}

export interface UptimeStorage {
  // Metrics storage
  saveMetrics(toolId: string, metrics: UptimeMetrics): Promise<void>;
  getMetrics(toolId: string, period: { start: Date; end: Date }): Promise<UptimeMetrics[]>;

  // Incident storage
  saveIncident(incident: DowntimeIncident): Promise<void>;
  getIncidents(toolId?: string, status?: string): Promise<DowntimeIncident[]>;
  updateIncident(id: string, updates: Partial<DowntimeIncident>): Promise<void>;

  // Alert storage
  saveAlert(alert: UptimeAlert): Promise<void>;
  getAlerts(resolved?: boolean, type?: string): Promise<UptimeAlert[]>;
  updateAlert(id: string, updates: Partial<UptimeAlert>): Promise<void>;

  // Cleanup old data
  cleanup(): Promise<void>;

  // Backup and export
  exportData(period: { start: Date; end: Date }): Promise<any>;
  importData(data: any): Promise<void>;
}

export interface UptimeNotifier {
  send(alert: UptimeAlert): Promise<void>;
  sendEscalation(alert: UptimeAlert, level: number): Promise<void>;
  sendResolution(incident: DowntimeIncident): Promise<void>;
  testChannel(channel: string): Promise<boolean>;
}

export interface UptimeReport {
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  summary: {
    overallUptime: number;
    sc005Compliant: boolean;
    totalIncidents: number;
    totalDowntime: number;
    averageResponseTime: number;
    reliabilityScore: number;
  };
  tools: Array<{
    toolId: string;
    toolName: string;
    uptime: number;
    incidents: number;
    downtime: number;
    averageResponseTime: number;
    sc005Compliant: boolean;
  }>;
  incidents: DowntimeIncident[];
  compliance: {
    sc005Target: number;
    achieved: number;
    variance: number;
    compliantTools: number;
    totalTools: number;
    complianceRate: number;
  };
  trends: {
    uptime: Array<{ date: Date; percentage: number }>;
    performance: Array<{ date: Date; responseTime: number }>;
    incidents: Array<{ date: Date; count: number }>;
  };
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'performance' | 'availability' | 'monitoring' | 'infrastructure';
    title: string;
    description: string;
    expectedImpact: string;
  }>;
  generatedAt: Date;
  dataPoints: number;
}

export class UptimeMonitoringCore {
  private static instance: UptimeMonitoringCore;
  private config: UptimeConfig;
  private healthCheckers: Map<string, HealthChecker> = new Map();
  private storage: UptimeStorage;
  private notifier: UptimeNotifier;
  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private lastSystemUpdate = new Date();
  private systemHealth: SystemHealthStatus;

  // Event listeners
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();

  private constructor(
    storage: UptimeStorage,
    notifier: UptimeNotifier,
    config?: Partial<UptimeConfig>
  ) {
    this.config = this.getDefaultConfig(config);
    this.storage = storage;
    this.notifier = notifier;
    this.systemHealth = this.getInitialSystemHealth();
  }

  public static getInstance(
    storage: UptimeStorage,
    notifier: UptimeNotifier,
    config?: Partial<UptimeConfig>
  ): UptimeMonitoringCore {
    if (!UptimeMonitoringCore.instance) {
      UptimeMonitoringCore.instance = new UptimeMonitoringCore(storage, notifier, config);
    }
    return UptimeMonitoringCore.instance;
  }

  private getDefaultConfig(overrides?: Partial<UptimeConfig>): UptimeConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      targetUptimePercentage: 99.9, // SC-005 requirement
      checkInterval: isProduction ? 60000 : 30000, // 1 min prod, 30 sec dev
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 2000, // 2 seconds
      alerting: {
        enabled: true,
        downtimeThreshold: 2, // 2 minutes
        performanceThreshold: 50, // 50% degradation
        channels: isProduction ? ['console', 'analytics'] : ['console'],
      },
      monitoring: {
        realTime: true,
        historical: true,
        performance: true,
        availability: true,
      },
      storage: {
        maxHistoryDays: 90,
        compressOldData: true,
        cleanupInterval: 24, // hours
      },
      ...overrides,
    };
  }

  private getInitialSystemHealth(): SystemHealthStatus {
    return {
      overall: {
        status: 'healthy',
        score: 100,
        uptime: 100,
        activeTools: 0,
        totalTools: 0,
        lastUpdate: new Date(),
      },
      sc005Compliance: {
        compliant: true,
        targetUptime: this.config.targetUptimePercentage,
        currentUptime: 100,
        variance: 0,
        lastCheck: new Date(),
        daysInPeriod: 30,
        incidents: 0,
        maxAllowedIncidents: Math.floor((100 - this.config.targetUptimePercentage) * 0.3), // ~43 minutes/month
      },
      tools: [],
      incidents: [],
      alerts: [],
      performance: {
        averageResponseTime: 0,
        slowestTool: '',
        fastestTool: '',
        performanceDegradation: 0,
      },
      trends: {
        uptimeTrend: [],
        performanceTrend: [],
        incidentTrend: [],
      },
    };
  }

  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Uptime Monitoring System for SC-005 compliance...');

    try {
      // Start background monitoring
      if (this.config.monitoring.realTime) {
        this.startMonitoring();
      }

      // Setup cleanup interval
      this.setupCleanupInterval();

      // Load initial data
      await this.loadInitialData();

      // Run initial health checks
      await this.runInitialHealthChecks();

      console.log('✅ Uptime Monitoring System initialized successfully');
      this.emit('initialized', { timestamp: new Date() });
    } catch (error) {
      console.error('❌ Failed to initialize Uptime Monitoring System:', error);
      throw error;
    }
  }

  public registerHealthChecker(checker: HealthChecker): void {
    this.healthCheckers.set(checker.id, checker);
    console.log(`📝 Registered health checker: ${checker.name} for tool ${checker.toolId}`);
  }

  public unregisterHealthChecker(id: string): void {
    this.healthCheckers.delete(id);
    console.log(`🗑️ Unregistered health checker: ${id}`);
  }

  private startMonitoring(): void {
    if (this.isRunning) {
      console.warn('Monitoring is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔍 Starting real-time monitoring (interval: ${this.config.checkInterval}ms)`);

    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.checkInterval);

    this.emit('monitoring-started', { interval: this.config.checkInterval });
  }

  public stopMonitoring(): void {
    if (!this.isRunning) {
      console.warn('Monitoring is not running');
      return;
    }

    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    console.log('🛑 Stopped real-time monitoring');
    this.emit('monitoring-stopped', { timestamp: new Date() });
  }

  private async performHealthChecks(): Promise<void> {
    const checks = Array.from(this.healthCheckers.values()).filter(checker => checker.enabled);

    if (checks.length === 0) {
      return;
    }

    const results: HealthCheckResult[] = [];

    for (const checker of checks) {
      try {
        const result = await this.runHealthCheck(checker);
        results.push(result);
        checker.lastRun = new Date();
        checker.lastResult = result;
      } catch (error) {
        console.error(`❌ Health check failed for ${checker.name}:`, error);
        // Create a failed result
        const failedResult: HealthCheckResult = {
          toolId: checker.toolId,
          toolName: checker.name,
          status: 'unhealthy',
          responseTime: -1,
          lastCheck: new Date(),
          uptimePercentage: 0,
          consecutiveFailures: (checker.lastResult?.consecutiveFailures || 0) + 1,
          totalChecks: (checker.lastResult?.totalChecks || 0) + 1,
          successfulChecks: checker.lastResult?.successfulChecks || 0,
          errorRate: 100,
          averageResponseTime: checker.lastResult?.averageResponseTime || 0,
          details: {
            checks: [{
              name: 'basic',
              status: 'fail',
              message: error instanceof Error ? error.message : 'Unknown error',
              duration: 0,
              timestamp: new Date(),
            }],
            performance: {},
            errors: [{
              type: 'health_check_failed',
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
              count: 1,
            }],
            warnings: [],
          },
        };
        results.push(failedResult);
        checker.lastResult = failedResult;
      }
    }

    // Update system health
    this.updateSystemHealth(results);

    // Check for incidents and alerts
    await this.processHealthCheckResults(results);

    // Save metrics
    await this.saveMetrics(results);

    this.lastSystemUpdate = new Date();
    this.emit('health-checks-completed', { results, timestamp: new Date() });
  }

  private async runHealthCheck(checker: HealthChecker): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const lastResult = checker.lastResult;

    try {
      const result = await Promise.race([
        checker.check(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), checker.timeout || this.config.timeout)
        )
      ]);

      const responseTime = Date.now() - startTime;

      // Update consecutive counts
      const consecutiveSuccesses = result.status === 'healthy'
        ? (lastResult?.consecutiveFailures || 0) + 1
        : 0;

      const consecutiveFailures = result.status !== 'healthy'
        ? (lastResult?.consecutiveFailures || 0) + 1
        : 0;

      // Update totals
      const totalChecks = (lastResult?.totalChecks || 0) + 1;
      const successfulChecks = (lastResult?.successfulChecks || 0) + (result.status === 'healthy' ? 1 : 0);

      // Calculate uptime percentage
      const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

      // Calculate error rate
      const errorRate = totalChecks > 0 ? ((totalChecks - successfulChecks) / totalChecks) * 100 : 0;

      // Update average response time
      const averageResponseTime = lastResult?.averageResponseTime
        ? (lastResult.averageResponseTime + responseTime) / 2
        : responseTime;

      return {
        ...result,
        responseTime,
        lastCheck: new Date(),
        uptimePercentage,
        consecutiveFailures,
        totalChecks,
        successfulChecks,
        errorRate,
        averageResponseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      throw error;
    }
  }

  private updateSystemHealth(results: HealthCheckResult[]): void {
    const totalTools = results.length;
    const healthyTools = results.filter(r => r.status === 'healthy').length;
    const degradedTools = results.filter(r => r.status === 'degraded').length;
    const unhealthyTools = results.filter(r => r.status === 'unhealthy').length;

    // Calculate overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyTools === 0 && degradedTools === 0) {
      status = 'healthy';
    } else if (unhealthyTools === 0 && degradedTools <= totalTools * 0.1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    // Calculate score
    const score = totalTools > 0 ? ((healthyTools * 100 + degradedTools * 50) / totalTools) : 100;

    // Calculate uptime
    const uptime = totalTools > 0 ? results.reduce((sum, r) => sum + r.uptimePercentage, 0) / totalTools : 100;

    // Update performance metrics
    const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0;

    const slowestResult = results.reduce((slowest, current) =>
      current.responseTime > (slowest?.responseTime || 0) ? current : slowest,
      results[0]
    );

    const fastestResult = results.reduce((fastest, current) =>
      current.responseTime > 0 && current.responseTime < (fastest?.responseTime || Infinity) ? current : fastest,
      results[0]
    );

    // Update system health
    this.systemHealth = {
      ...this.systemHealth,
      overall: {
        status,
        score,
        uptime,
        activeTools: totalTools,
        totalTools,
        lastUpdate: new Date(),
      },
      tools: results,
      performance: {
        averageResponseTime,
        slowestTool: slowestResult?.toolName || '',
        fastestTool: fastestResult?.toolName || '',
        performanceDegradation: this.calculatePerformanceDegradation(results),
      },
    };

    // Update SC-005 compliance
    this.updateSC005Compliance();
  }

  private updateSC005Compliance(): void {
    const currentUptime = this.systemHealth.overall.uptime;
    const targetUptime = this.config.targetUptimePercentage;
    const variance = targetUptime - currentUptime;

    const compliant = currentUptime >= targetUptime;

    // Count incidents in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentIncidents = this.systemHealth.incidents.filter(
      incident => incident.startTime >= thirtyDaysAgo
    );

    this.systemHealth.sc005Compliance = {
      compliant,
      targetUptime,
      currentUptime,
      variance,
      lastCheck: new Date(),
      daysInPeriod: 30,
      incidents: recentIncidents.length,
      maxAllowedIncidents: Math.floor((100 - targetUptime) * 0.3), // ~43 minutes/month
    };
  }

  private calculatePerformanceDegradation(results: HealthCheckResult[]): number {
    // This is a simplified calculation
    // In a real implementation, you'd compare with historical baselines
    const averageResponseTime = this.systemHealth.performance.averageResponseTime;
    const baselineResponseTime = 1000; // 1 second baseline

    if (averageResponseTime === 0) return 0;

    return Math.max(0, ((averageResponseTime - baselineResponseTime) / baselineResponseTime) * 100);
  }

  private async processHealthCheckResults(results: HealthCheckResult[]): Promise<void> {
    for (const result of results) {
      // Check for new incidents
      if (result.status === 'unhealthy' && result.consecutiveFailures >= this.config.retryAttempts) {
        await this.handlePotentialIncident(result);
      }

      // Check for performance degradation
      if (result.responseTime > 0 && this.config.monitoring.performance) {
        await this.checkPerformanceDegradation(result);
      }

      // Check for recovery
      if (result.status === 'healthy' && result.consecutiveFailures > 0) {
        await this.handleRecovery(result);
      }
    }

    // Check SC-005 compliance
    await this.checkSC005Compliance();
  }

  private async handlePotentialIncident(result: HealthCheckResult): Promise<void> {
    // Check if there's already an active incident for this tool
    const existingIncident = this.systemHealth.incidents.find(
      incident => incident.toolId === result.toolId && incident.status === 'active'
    );

    if (!existingIncident) {
      // Create new incident
      const incident: DowntimeIncident = {
        id: `incident-${Date.now()}-${result.toolId}`,
        toolId: result.toolId,
        toolName: result.toolName,
        startTime: new Date(),
        status: 'active',
        severity: this.determineIncidentSeverity(result),
        impact: {
          affectedUsers: 0, // Would be calculated from analytics
          affectedFeatures: [],
          businessImpact: 'Tool functionality unavailable',
        },
        cause: {
          category: this.categorizeIncidentCause(result),
          description: `Health check failed with status: ${result.status}`,
        },
        notifications: [],
      };

      this.systemHealth.incidents.push(incident);
      await this.storage.saveIncident(incident);

      // Send alert
      await this.sendDowntimeAlert(incident, result);

      console.warn(`🚨 New downtime incident detected: ${incident.toolName}`);
      this.emit('incident-detected', { incident, result });
    }
  }

  private determineIncidentSeverity(result: HealthCheckResult): 'minor' | 'major' | 'critical' {
    const consecutiveFailures = result.consecutiveFailures;
    const errorRate = result.errorRate;

    if (consecutiveFailures >= 10 || errorRate >= 90) {
      return 'critical';
    } else if (consecutiveFailures >= 5 || errorRate >= 50) {
      return 'major';
    } else {
      return 'minor';
    }
  }

  private categorizeIncidentCause(result: HealthCheckResult): 'performance' | 'availability' | 'infrastructure' | 'code' | 'external' {
    // Analyze the error details to categorize the cause
    if (result.details.errors.some(e => e.type.includes('timeout'))) {
      return 'performance';
    } else if (result.details.errors.some(e => e.type.includes('network'))) {
      return 'infrastructure';
    } else if (result.details.errors.some(e => e.type.includes('code'))) {
      return 'code';
    } else {
      return 'availability';
    }
  }

  private async handleRecovery(result: HealthCheckResult): Promise<void> {
    // Find active incident for this tool
    const incident = this.systemHealth.incidents.find(
      i => i.toolId === result.toolId && i.status === 'active'
    );

    if (incident) {
      // Resolve the incident
      incident.endTime = new Date();
      incident.duration = incident.endTime.getTime() - incident.startTime.getTime();
      incident.status = 'resolved';
      incident.resolution = {
        action: 'Automatic recovery detected',
        resolutionTime: incident.duration,
      };

      await this.storage.updateIncident(incident.id, incident);

      // Send recovery notification
      await this.sendRecoveryAlert(incident, result);

      console.log(`✅ Incident resolved: ${incident.toolName} (downtime: ${Math.round(incident.duration / 1000)}s)`);
      this.emit('incident-resolved', { incident, result });
    }
  }

  private async checkPerformanceDegradation(result: HealthCheckResult): Promise<void> {
    const degradationThreshold = this.config.alerting.performanceThreshold;

    if (result.averageResponseTime > 0) {
      // Compare with baseline (this is simplified - real implementation would use historical data)
      const baselineResponseTime = 1000; // 1 second baseline
      const degradation = ((result.averageResponseTime - baselineResponseTime) / baselineResponseTime) * 100;

      if (degradation >= degradationThreshold) {
        await this.sendPerformanceAlert(result, degradation);
      }
    }
  }

  private async checkSC005Compliance(): Promise<void> {
    const compliance = this.systemHealth.sc005Compliance;

    if (!compliance.compliant && this.config.alerting.enabled) {
      // Send SC-005 compliance alert
      await this.sendSC005ComplianceAlert(compliance);
    }
  }

  private async sendDowntimeAlert(incident: DowntimeIncident, result: HealthCheckResult): Promise<void> {
    const alert: UptimeAlert = {
      id: `alert-${Date.now()}-${incident.id}`,
      type: 'downtime',
      severity: incident.severity === 'critical' ? 'critical' :
                 incident.severity === 'major' ? 'error' : 'warning',
      toolId: incident.toolId,
      toolName: incident.toolName,
      title: `Tool Downtime Detected: ${incident.toolName}`,
      message: `${incident.toolName} has been unavailable for ${result.consecutiveFailures} consecutive checks. Status: ${result.status}`,
      timestamp: new Date(),
      resolved: false,
      acknowledged: false,
      escalation: {
        level: 1,
        maxLevel: 3,
      },
      metadata: {
        incidentId: incident.id,
        metrics: {
          uptime: { uptime: result.uptimePercentage } as any,
        },
        threshold: 0,
        actualValue: result.uptimePercentage,
      },
    };

    this.systemHealth.alerts.push(alert);
    await this.storage.saveAlert(alert);
    await this.notifier.send(alert);
  }

  private async sendRecoveryAlert(incident: DowntimeIncident, result: HealthCheckResult): Promise<void> {
    const alert: UptimeAlert = {
      id: `alert-${Date.now()}-recovery-${incident.id}`,
      type: 'recovery',
      severity: 'info',
      toolId: incident.toolId,
      toolName: incident.toolName,
      title: `Tool Recovery: ${incident.toolName}`,
      message: `${incident.toolName} has recovered and is now healthy. Downtime: ${Math.round((incident.duration || 0) / 1000)}s`,
      timestamp: new Date(),
      resolved: true,
      resolvedAt: new Date(),
      acknowledged: false,
      escalation: {
        level: 0,
        maxLevel: 3,
      },
      metadata: {
        incidentId: incident.id,
        metrics: {
          uptime: { uptime: result.uptimePercentage } as any,
        },
      },
    };

    this.systemHealth.alerts.push(alert);
    await this.storage.saveAlert(alert);
    await this.notifier.sendResolution(incident);
  }

  private async sendPerformanceAlert(result: HealthCheckResult, degradation: number): Promise<void> {
    const alert: UptimeAlert = {
      id: `alert-${Date.now()}-performance-${result.toolId}`,
      type: 'performance',
      severity: degradation >= 100 ? 'error' : 'warning',
      toolId: result.toolId,
      toolName: result.toolName,
      title: `Performance Degradation: ${result.toolName}`,
      message: `${result.toolName} is experiencing ${Math.round(degradation)}% performance degradation. Response time: ${Math.round(result.averageResponseTime)}ms`,
      timestamp: new Date(),
      resolved: false,
      acknowledged: false,
      escalation: {
        level: 1,
        maxLevel: 2,
      },
      metadata: {
        threshold: this.config.alerting.performanceThreshold,
        actualValue: degradation,
      },
    };

    this.systemHealth.alerts.push(alert);
    await this.storage.saveAlert(alert);
    await this.notifier.send(alert);
  }

  private async sendSC005ComplianceAlert(compliance: SystemHealthStatus['sc005Compliance']): Promise<void> {
    const alert: UptimeAlert = {
      id: `alert-${Date.now()}-sc005-compliance`,
      type: 'compliance',
      severity: 'error',
      title: 'SC-005 Compliance Violation',
      message: `System uptime (${compliance.currentUptime.toFixed(2)}%) is below SC-005 target (${compliance.targetUptime}%). Variance: ${compliance.variance.toFixed(2)}%`,
      timestamp: new Date(),
      resolved: false,
      acknowledged: false,
      escalation: {
        level: 2,
        maxLevel: 3,
      },
      metadata: {
        threshold: compliance.targetUptime,
        actualValue: compliance.currentUptime,
      },
    };

    this.systemHealth.alerts.push(alert);
    await this.storage.saveAlert(alert);
    await this.notifier.send(alert);
  }

  private async saveMetrics(results: HealthCheckResult[]): Promise<void> {
    for (const result of results) {
      const metrics: UptimeMetrics = {
        toolId: result.toolId,
        toolName: result.toolName,
        period: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date(),
          duration: 24 * 60 * 60 * 1000, // 24 hours
        },
        uptime: {
          percentage: result.uptimePercentage,
          totalDowntime: 0, // Would be calculated from incidents
          incidents: this.systemHealth.incidents.filter(i => i.toolId === result.toolId).length,
          averageIncidentDuration: 0, // Would be calculated from incidents
        },
        performance: {
          averageResponseTime: result.averageResponseTime,
          p95ResponseTime: result.averageResponseTime, // Simplified
          p99ResponseTime: result.averageResponseTime, // Simplified
          slowestResponseTime: result.responseTime,
          fastestResponseTime: result.responseTime,
          performanceDegradation: this.calculatePerformanceDegradation([result]),
        },
        availability: {
          totalChecks: result.totalChecks,
          successfulChecks: result.successfulChecks,
          failedChecks: result.totalChecks - result.successfulChecks,
          errorRate: result.errorRate,
          consecutiveSuccesses: result.consecutiveFailures === 0 ? result.totalChecks : 0,
          consecutiveFailures: result.consecutiveFailures,
        },
        reliability: {
          meanTimeBetweenFailures: 0, // Would be calculated from history
          meanTimeToRecovery: 0, // Would be calculated from incidents
          currentStreak: result.consecutiveFailures === 0 ? result.totalChecks : 0,
          reliabilityScore: result.uptimePercentage,
        },
        compliance: {
          sc005Compliant: result.uptimePercentage >= this.config.targetUptimePercentage,
          targetUptime: this.config.targetUptimePercentage,
          achievedUptime: result.uptimePercentage,
          variance: this.config.targetUptimePercentage - result.uptimePercentage,
          lastComplianceCheck: new Date(),
        },
      };

      await this.storage.saveMetrics(result.toolId, metrics);
    }
  }

  private setupCleanupInterval(): void {
    const intervalMs = this.config.storage.cleanupInterval * 60 * 60 * 1000; // Convert hours to milliseconds

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.storage.cleanup();
        console.log('🧹 Completed data cleanup');
      } catch (error) {
        console.error('❌ Data cleanup failed:', error);
      }
    }, intervalMs);
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Load recent incidents
      const incidents = await this.storage.getIncidents();
      this.systemHealth.incidents = incidents;

      // Load recent alerts
      const alerts = await this.storage.getAlerts();
      this.systemHealth.alerts = alerts;

      console.log(`📂 Loaded ${incidents.length} incidents and ${alerts.length} alerts`);
    } catch (error) {
      console.error('❌ Failed to load initial data:', error);
    }
  }

  private async runInitialHealthChecks(): Promise<void> {
    console.log('🔍 Running initial health checks...');
    await this.performHealthChecks();
  }

  // Event management
  public on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Public API methods
  public getSystemHealth(): SystemHealthStatus {
    return { ...this.systemHealth };
  }

  public getHealthCheckers(): HealthChecker[] {
    return Array.from(this.healthCheckers.values());
  }

  public updateConfig(config: Partial<UptimeConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart monitoring if interval changed
    if (config.checkInterval && this.isRunning) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  public async generateReport(period: { start: Date; end: Date }): Promise<UptimeReport> {
    // This would generate a comprehensive report
    // Implementation would aggregate metrics, incidents, and trends
    throw new Error('Report generation not implemented yet');
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Uptime Monitoring System...');

    this.stopMonitoring();

    // Save final state
    try {
      // Save any pending data
      console.log('✅ Uptime Monitoring System shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

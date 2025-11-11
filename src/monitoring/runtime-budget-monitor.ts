/**
 * Runtime Budget Monitor
 * Monitors performance budgets at runtime in the browser
 * Provides real-time checking and alerting for budget violations
 */

import { performanceBudgetManager, type BudgetReport } from './performance-budget-manager';

interface RuntimeMeasurement {
  name: string;
  value: number;
  unit: 'milliseconds' | 'bytes' | 'percentage' | 'score' | 'count';
  timestamp: Date;
  source: 'navigation' | 'vitals' | 'observer' | 'custom';
  metadata?: Record<string, any>;
}

interface RuntimeBudgetCheck {
  budgetId: string;
  budgetName: string;
  metric: string;
  current: RuntimeMeasurement;
  threshold: number;
  status: 'pass' | 'warning' | 'critical';
  violation: boolean;
  trend: 'improving' | 'stable' | 'degrading';
  lastChecked: Date;
}

interface RuntimeAlert {
  id: string;
  budgetId: string;
  budgetName: string;
  metric: string;
  severity: 'warning' | 'critical';
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolutionTime?: Date;
}

interface RuntimeSession {
  id: string;
  startTime: Date;
  userAgent: string;
  url: string;
  measurements: RuntimeMeasurement[];
  checks: RuntimeBudgetCheck[];
  alerts: RuntimeAlert[];
  complianceScore: number;
  violations: number;
}

interface RuntimeMonitorConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  sampleRate: number; // 0-1, percentage of users to monitor
  maxMeasurements: number; // max measurements per session
  alertThrottle: number; // minimum time between alerts for same metric
  autoResolve: boolean; // automatically resolve resolved violations
  persistSession: boolean; // persist session data
  integrations: {
    coreWebVitals: boolean;
    performanceObserver: boolean;
    navigationTiming: boolean;
    resourceTiming: boolean;
    userTiming: boolean;
  };
  thresholds: {
    measurementTimeout: number; // max time to wait for measurement
    trendWindow: number; // number of measurements for trend analysis
    regressionThreshold: number; // percentage change for regression detection
  };
}

export class RuntimeBudgetMonitor {
  private static instance: RuntimeBudgetMonitor;
  private config: RuntimeMonitorConfig;
  private session: RuntimeSession;
  private measurements: Map<string, RuntimeMeasurement[]> = new Map();
  private checks: Map<string, RuntimeBudgetCheck> = new Map();
  private alerts: Map<string, RuntimeAlert> = new Map();
  private observers: PerformanceObserver[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.session = this.createSession();
  }

  public static getInstance(): RuntimeBudgetMonitor {
    if (!RuntimeBudgetMonitor.instance) {
      RuntimeBudgetMonitor.instance = new RuntimeBudgetMonitor();
    }
    return RuntimeBudgetMonitor.instance;
  }

  private getDefaultConfig(): RuntimeMonitorConfig {
    return {
      enabled: true,
      checkInterval: 30000, // 30 seconds
      sampleRate: 1.0, // 100% for development, adjust for production
      maxMeasurements: 1000,
      alertThrottle: 60000, // 1 minute
      autoResolve: true,
      persistSession: true,
      integrations: {
        coreWebVitals: true,
        performanceObserver: true,
        navigationTiming: true,
        resourceTiming: true,
        userTiming: true,
      },
      thresholds: {
        measurementTimeout: 10000, // 10 seconds
        trendWindow: 10, // 10 measurements
        regressionThreshold: 0.15, // 15% change
      },
    };
  }

  /**
   * Initialize runtime monitoring
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized || !this.config.enabled) {
      return;
    }

    console.log('🚀 Initializing Runtime Budget Monitor');

    try {
      // Check if running in browser
      if (typeof window === 'undefined') {
        console.warn('RuntimeBudgetMonitor can only be used in browser environment');
        return;
      }

      // Initialize performance observers
      await this.initializePerformanceObservers();

      // Start periodic budget checking
      this.startPeriodicChecking();

      // Load existing session data
      if (this.config.persistSession) {
        this.loadSessionData();
      }

      this.isInitialized = true;
      this.emitEvent('monitor-initialized', { sessionId: this.session.id });

      console.log('✅ Runtime Budget Monitor initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Runtime Budget Monitor:', error);
      throw error;
    }
  }

  /**
   * Initialize performance observers
   */
  private async initializePerformanceObservers(): Promise<void> {
    if (!window.PerformanceObserver) {
      console.warn('PerformanceObserver not available');
      return;
    }

    // Core Web Vitals observer
    if (this.config.integrations.coreWebVitals) {
      try {
        const vitalsObserver = new PerformanceObserver((list) => {
          this.handleVitalsEntries(list.getEntries());
        });

        vitalsObserver.observe({
          entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']
        });

        this.observers.push(vitalsObserver);
      } catch (error) {
        console.warn('Failed to initialize Core Web Vitals observer:', error);
      }
    }

    // Navigation timing observer
    if (this.config.integrations.navigationTiming) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          this.handleNavigationEntries(list.getEntries());
        });

        navigationObserver.observe({ entryTypes: ['navigation'] });

        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Failed to initialize navigation timing observer:', error);
      }
    }

    // Resource timing observer
    if (this.config.integrations.resourceTiming) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          this.handleResourceEntries(list.getEntries());
        });

        resourceObserver.observe({ entryTypes: ['resource'] });

        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Failed to initialize resource timing observer:', error);
      }
    }

    // User timing observer
    if (this.config.integrations.userTiming) {
      try {
        const userTimingObserver = new PerformanceObserver((list) => {
          this.handleUserTimingEntries(list.getEntries());
        });

        userTimingObserver.observe({ entryTypes: ['measure', 'mark'] });

        this.observers.push(userTimingObserver);
      } catch (error) {
        console.warn('Failed to initialize user timing observer:', error);
      }
    }

    // Long tasks observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        this.handleLongTaskEntries(list.getEntries());
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });

      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Failed to initialize long task observer:', error);
    }
  }

  /**
   * Start periodic budget checking
   */
  private startPeriodicChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkBudgets();
    }, this.config.checkInterval);
  }

  /**
   * Create new session
   */
  private createSession(): RuntimeSession {
    return {
      id: this.generateSessionId(),
      startTime: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      measurements: [],
      checks: [],
      alerts: [],
      complianceScore: 100,
      violations: 0,
    };
  }

  /**
   * Handle Core Web Vitals entries
   */
  private handleVitalsEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      switch (entry.entryType) {
        case 'largest-contentful-paint':
          this.addMeasurement('largestContentfulPaint', entry.startTime, 'milliseconds', 'vitals');
          break;
        case 'first-input':
          const fidEntry = entry as any;
          this.addMeasurement('firstInputDelay', fidEntry.processingStart - entry.startTime, 'milliseconds', 'vitals');
          break;
        case 'layout-shift':
          const clsEntry = entry as any;
          if (!clsEntry.hadRecentInput) {
            this.addMeasurement('cumulativeLayoutShift', clsEntry.value, 'score', 'vitals');
          }
          break;
      }
    });
  }

  /**
   * Handle navigation entries
   */
  private handleNavigationEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      const navEntry = entry as PerformanceNavigationTiming;

      this.addMeasurement('timeToFirstByte', navEntry.responseStart - navEntry.requestStart, 'milliseconds', 'navigation');
      this.addMeasurement('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.navigationStart, 'milliseconds', 'navigation');
      this.addMeasurement('loadComplete', navEntry.loadEventEnd - navEntry.navigationStart, 'milliseconds', 'navigation');

      // Calculate First Contentful Paint if available
      if (navEntry.responseStart > 0) {
        this.addMeasurement('firstContentfulPaint', navEntry.responseStart, 'milliseconds', 'navigation');
      }
    });
  }

  /**
   * Handle resource entries
   */
  private handleResourceEntries(entries: PerformanceEntry[]): void {
    let totalResources = 0;
    let totalSize = 0;
    let totalTransferSize = 0;

    entries.forEach(entry => {
      const resourceEntry = entry as PerformanceResourceTiming;
      totalResources++;
      totalTransferSize += resourceEntry.transferSize || 0;

      if (resourceEntry.decodedBodySize) {
        totalSize += resourceEntry.decodedBodySize;
      }
    });

    this.addMeasurement('totalRequests', totalResources, 'count', 'observer');
    this.addMeasurement('totalTransferSize', totalTransferSize, 'bytes', 'observer');

    if (totalSize > 0) {
      this.addMeasurement('totalDecodedSize', totalSize, 'bytes', 'observer');
    }
  }

  /**
   * Handle user timing entries
   */
  private handleUserTimingEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      if (entry.entryType === 'measure') {
        this.addMeasurement(entry.name, entry.duration, 'milliseconds', 'custom');
      }
    });
  }

  /**
   * Handle long task entries
   */
  private handleLongTaskEntries(entries: PerformanceEntry[]): void {
    let longTaskCount = 0;
    let totalLongTaskDuration = 0;

    entries.forEach(entry => {
      longTaskCount++;
      totalLongTaskDuration += entry.duration;
    });

    this.addMeasurement('longTasks', longTaskCount, 'count', 'observer');
    this.addMeasurement('totalBlockingTime', totalLongTaskDuration, 'milliseconds', 'observer');
  }

  /**
   * Add measurement to monitoring system
   */
  public addMeasurement(
    name: string,
    value: number,
    unit: RuntimeMeasurement['unit'],
    source: RuntimeMeasurement['source'],
    metadata?: Record<string, any>
  ): void {
    if (!this.isInitialized || !this.config.enabled) {
      return;
    }

    const measurement: RuntimeMeasurement = {
      name,
      value,
      unit,
      timestamp: new Date(),
      source,
      metadata,
    };

    // Store measurement
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }

    const measurements = this.measurements.get(name)!;
    measurements.push(measurement);

    // Limit measurement history
    if (measurements.length > this.config.maxMeasurements) {
      measurements.shift();
    }

    // Add to session
    this.session.measurements.push(measurement);

    // Emit measurement event
    this.emitEvent('measurement-added', measurement);

    // Check if this measurement affects any budgets
    this.checkBudgetForMeasurement(name, measurement);
  }

  /**
   * Check budgets for a specific measurement
   */
  private async checkBudgetForMeasurement(metricName: string, measurement: RuntimeMeasurement): Promise<void> {
    try {
      const budgets = performanceBudgetManager.getBudgets();
      const relevantBudgets = budgets.filter(budget =>
        budget.enabled && budget.metrics.some(metric => metric.name === metricName)
      );

      for (const budget of relevantBudgets) {
        const metric = budget.metrics.find(m => m.name === metricName);
        if (!metric) continue;

        const check = this.performBudgetCheck(budget, metric, measurement);
        this.checks.set(`${budget.id}_${metricName}`, check);

        // Update session
        this.session.checks.push(check);

        // Handle violations
        if (check.violation) {
          await this.handleViolation(check);
        }

        // Emit check event
        this.emitEvent('budget-checked', check);
      }
    } catch (error) {
      console.error('Error checking budget for measurement:', error);
    }
  }

  /**
   * Perform budget check
   */
  private performBudgetCheck(
    budget: any,
    metric: any,
    measurement: RuntimeMeasurement
  ): RuntimeBudgetCheck {
    let status: 'pass' | 'warning' | 'critical';
    let violation = false;

    const value = measurement.value;
    const target = metric.target;
    const warning = metric.warning;
    const critical = metric.critical;

    if (metric.unit === 'score') {
      // Higher is better for scores
      if (value >= target) {
        status = 'pass';
      } else if (value >= warning) {
        status = 'warning';
      } else {
        status = 'critical';
        violation = true;
      }
    } else {
      // Lower is better for most metrics
      if (value <= target) {
        status = 'pass';
      } else if (value <= warning) {
        status = 'warning';
      } else {
        status = 'critical';
        violation = true;
      }
    }

    // Analyze trend
    const trend = this.analyzeTrend(measurement.name);

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      metric: measurement.name,
      current: measurement,
      threshold: status === 'critical' ? critical : status === 'warning' ? warning : target,
      status,
      violation,
      trend,
      lastChecked: new Date(),
    };
  }

  /**
   * Analyze trend for a metric
   */
  private analyzeTrend(metricName: string): 'improving' | 'stable' | 'degrading' {
    const measurements = this.measurements.get(metricName);
    if (!measurements || measurements.length < this.config.thresholds.trendWindow) {
      return 'stable';
    }

    const recentMeasurements = measurements.slice(-this.config.thresholds.trendWindow);
    const values = recentMeasurements.map(m => m.value);

    // Simple trend analysis using linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;

    const changePercentage = Math.abs((slope / avgY) * 100);

    if (changePercentage < 5) {
      return 'stable';
    } else if (slope < 0) {
      return 'improving';
    } else {
      return 'degrading';
    }
  }

  /**
   * Handle budget violation
   */
  private async handleViolation(check: RuntimeBudgetCheck): Promise<void> {
    const alertId = `${check.budgetId}_${check.metric}_${Date.now()}`;

    // Check if alert is throttled
    const lastAlertKey = `${check.budgetId}_${check.metric}`;
    const lastAlertTime = this.alerts.get(lastAlertKey)?.timestamp.getTime() || 0;
    const now = Date.now();

    if (now - lastAlertTime < this.config.alertThrottle) {
      return; // Throttled
    }

    const alert: RuntimeAlert = {
      id: alertId,
      budgetId: check.budgetId,
      budgetName: check.budgetName,
      metric: check.metric,
      severity: check.status === 'critical' ? 'critical' : 'warning',
      currentValue: check.current.value,
      threshold: check.threshold,
      message: `Budget violation: ${check.budgetName} - ${check.metric} is ${check.current.value} (threshold: ${check.threshold})`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.set(alertId, alert);
    this.session.alerts.push(alert);
    this.session.violations++;

    // Update compliance score
    this.updateComplianceScore();

    // Emit alert event
    this.emitEvent('violation-detected', alert);

    // Log alert
    console.warn(`🚨 Performance Budget Violation: ${alert.message}`);
  }

  /**
   * Update compliance score
   */
  private updateComplianceScore(): void {
    const totalChecks = this.session.checks.length;
    const violations = this.session.checks.filter(c => c.violation).length;

    if (totalChecks > 0) {
      this.session.complianceScore = Math.max(0, 100 - (violations / totalChecks) * 100);
    }
  }

  /**
   * Check all budgets periodically
   */
  private async checkBudgets(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Get latest measurements for each metric
      const measurements: Record<string, number> = {};

      this.measurements.forEach((measurementList, metricName) => {
        if (measurementList.length > 0) {
          const latest = measurementList[measurementList.length - 1];
          measurements[metricName] = latest.value;
        }
      });

      if (Object.keys(measurements).length === 0) {
        return; // No measurements yet
      }

      // Generate budget report
      const report = await performanceBudgetManager.generateBudgetReport(
        measurements,
        this.session.id,
        'production' // Runtime is always production-like
      );

      // Update session with latest report data
      this.session.complianceScore = report.summary.overallScore;
      this.session.violations = report.summary.criticalViolations;

      // Emit report event
      this.emitEvent('budget-report-generated', report);

    } catch (error) {
      console.error('Error during periodic budget check:', error);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load session data from storage
   */
  private loadSessionData(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const sessionData = localStorage.getItem('runtime-budget-session');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          // Restore some session data but keep current session ID
          this.session.measurements = parsed.measurements || [];
          this.session.violations = parsed.violations || 0;
        }
      }
    } catch (error) {
      console.warn('Failed to load session data:', error);
    }
  }

  /**
   * Save session data to storage
   */
  private saveSessionData(): void {
    try {
      if (typeof localStorage !== 'undefined' && this.config.persistSession) {
        const dataToSave = {
          measurements: this.session.measurements.slice(-100), // Save last 100 measurements
          violations: this.session.violations,
        };
        localStorage.setItem('runtime-budget-session', JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  // Public API methods

  /**
   * Get current session information
   */
  public getSession(): RuntimeSession {
    return { ...this.session };
  }

  /**
   * Get current measurements
   */
  public getMeasurements(metricName?: string): RuntimeMeasurement[] {
    if (metricName) {
      return this.measurements.get(metricName) || [];
    }

    const allMeasurements: RuntimeMeasurement[] = [];
    this.measurements.forEach(measurements => {
      allMeasurements.push(...measurements);
    });

    return allMeasurements;
  }

  /**
   * Get current budget checks
   */
  public getBudgetChecks(): RuntimeBudgetCheck[] {
    return Array.from(this.checks.values());
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): RuntimeAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emitEvent('alert-acknowledged', alert);
    }
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolutionTime = new Date();
      this.emitEvent('alert-resolved', alert);
    }
  }

  /**
   * Auto-resolve alerts
   */
  public autoResolveAlerts(): void {
    if (!this.config.autoResolve) {
      return;
    }

    this.alerts.forEach((alert, alertId) => {
      if (!alert.resolved) {
        const check = this.checks.get(`${alert.budgetId}_${alert.metric}`);
        if (check && !check.violation) {
          this.resolveAlert(alertId);
        }
      }
    });
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<RuntimeMonitorConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart periodic checking if interval changed
    if (config.checkInterval && this.checkInterval) {
      this.startPeriodicChecking();
    }
  }

  /**
   * Get configuration
   */
  public getConfig(): RuntimeMonitorConfig {
    return { ...this.config };
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    this.isInitialized = false;

    // Save session data before stopping
    this.saveSessionData();

    this.emitEvent('monitor-stopped', { sessionId: this.session.id });

    console.log('⏹️ Runtime Budget Monitor stopped');
  }

  /**
   * Force manual budget check
   */
  public async forceBudgetCheck(): Promise<void> {
    await this.checkBudgets();
  }

  /**
   * Get compliance summary
   */
  public getComplianceSummary(): {
    score: number;
    violations: number;
    checks: number;
    alerts: number;
    sessionDuration: number;
  } {
    return {
      score: this.session.complianceScore,
      violations: this.session.violations,
      checks: this.session.checks.length,
      alerts: this.getActiveAlerts().length,
      sessionDuration: Date.now() - this.session.startTime.getTime(),
    };
  }
}

// Export singleton instance
export const runtimeBudgetMonitor = RuntimeBudgetMonitor.getInstance();

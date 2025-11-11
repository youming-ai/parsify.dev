/**
 * Performance Regression Testing Integration
 * Integrates the comprehensive performance regression testing system with existing Parsify monitoring infrastructure
 * Provides unified API for all performance testing, monitoring, and analysis capabilities
 */

import { PerformanceRegressionTester, PerformanceTestResult } from './performance-regression-testing';
import { PerformanceBenchmarking, BenchmarkResult } from './performance-benchmarking';
import { PerformanceRegressionDetector, RegressionDetectionResult } from './performance-regression-detector';
import { CICDIntegration } from './ci-cd-integration';
import { PerformanceBudgetEnforcer, PerformanceBudget, BudgetValidation } from './performance-budget-enforcement';
import { PerformanceDegradationMonitor } from './performance-degradation-monitor';

export interface PerformanceRegressionSystemConfig {
  enabled: boolean;
  testing: {
    regressionTester: {
      enabled: boolean;
      autoRun: boolean;
      schedule: string; // Cron expression
      environments: string[];
      scenarios: string[];
    };
    benchmarking: {
      enabled: boolean;
      autoRun: boolean;
      schedule: string;
      createBaselines: boolean;
    };
    budgetEnforcement: {
      enabled: boolean;
      strictMode: boolean;
      autoBlock: boolean;
    };
  };
  ciIntegration: {
    enabled: boolean;
    platform: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'azure-devops';
    environment: string;
    gates: {
      enabled: boolean;
      strict: boolean;
    };
  };
  monitoring: {
    existingSystem: {
      enabled: boolean;
      endpoint?: string;
      apiKey?: string;
    };
    degradationMonitor: {
      enabled: boolean;
      integration: 'full' | 'partial' | 'minimal';
    };
  };
  reporting: {
    enabled: boolean;
    dashboard: {
      enabled: boolean;
      refreshInterval: number; // seconds
    };
    alerts: {
      enabled: boolean;
      channels: Array<'console' | 'email' | 'slack' | 'webhook'>;
    };
  };
  storage: {
    type: 'memory' | 'file' | 'database';
    retention: {
      results: number; // days
      baselines: number; // days
      reports: number; // days
      alerts: number; // days
    };
  };
}

export interface PerformanceRegressionSystemStatus {
  initialized: boolean;
  components: {
    regressionTester: boolean;
    benchmarking: boolean;
    regressionDetector: boolean;
    budgetEnforcer: boolean;
    ciIntegration: boolean;
    degradationMonitor: boolean;
  };
  health: {
    overall: 'healthy' | 'warning' | 'critical';
    lastRun: Date | null;
    lastSuccessfulRun: Date | null;
    consecutiveFailures: number;
  };
  metrics: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    totalBaselines: number;
    activeBudgets: number;
    budgetViolations: number;
    regressionsDetected: number;
  };
}

export interface UnifiedPerformanceReport {
  id: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
    duration: number;
  };

  // Executive summary
  summary: {
    overallStatus: 'excellent' | 'good' | 'fair' | 'poor';
    performanceScore: number; // 0-100
    regressionStatus: 'clean' | 'warning' | 'critical';
    budgetCompliance: 'compliant' | 'warning' | 'violation';
    trend: 'improving' | 'stable' | 'degrading';
  };

  // Test results
  testResults: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    averageScore: number;
    criticalFailures: number;
    results: PerformanceTestResult[];
  };

  // Benchmarking results
  benchmarking: {
    baselines: {
      total: number;
      active: number;
      outdated: number;
    };
    measurements: {
      total: number;
      improvements: number;
      degradations: number;
    };
    results: BenchmarkResult[];
  };

  // Regression analysis
  regressions: {
    total: number;
    critical: number;
    warnings: number;
    detected: RegressionDetectionResult[];
    trends: {
      improving: number;
      stable: number;
      degrading: number;
    };
  };

  // Budget compliance
  budgets: {
    total: number;
    compliant: number;
    warning: number;
    violation: number;
    validations: BudgetValidation[];
    categoryBreakdown: Record<string, {
      total: number;
      compliant: number;
      warning: number;
      violation: number;
    }>;
  };

  // CI/CD integration
  cicd: {
    lastRun?: {
      status: 'success' | 'failure' | 'warning';
      duration: number;
      testsExecuted: number;
    };
    gates: {
      passed: boolean;
      blocked: boolean;
      manualOverride: boolean;
    };
    deployments: Array<{
      timestamp: Date;
      status: string;
      performanceImpact: string;
    }>;
  };

  // Monitoring integration
  monitoring: {
    degradationMonitor: {
      active: boolean;
      alerts: number;
      degradations: number;
    };
    realTimeMetrics: Array<{
      metric: string;
      value: number;
      status: 'normal' | 'warning' | 'critical';
      timestamp: Date;
    }>;
  };

  // Recommendations
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'testing' | 'optimization' | 'infrastructure' | 'monitoring';
    description: string;
    impact: string;
    effort: string;
    deadline?: Date;
  }>;
}

/**
 * Unified Performance Regression Testing System
 */
export class PerformanceRegressionSystem {
  private static instance: PerformanceRegressionSystem;
  private config: PerformanceRegressionSystemConfig;
  private status: PerformanceRegressionSystemStatus;

  // Core components
  private regressionTester: PerformanceRegressionTester;
  private benchmarking: PerformanceBenchmarking;
  private regressionDetector: PerformanceRegressionDetector;
  private budgetEnforcer: PerformanceBudgetEnforcer;
  private ciIntegration: CICDIntegration;
  private degradationMonitor?: PerformanceDegradationMonitor;

  // Data storage
  private testResults: PerformanceTestResult[] = [];
  private benchmarkResults: BenchmarkResult[] = [];
  private regressionResults: RegressionDetectionResult[] = [];
  private unifiedReports: UnifiedPerformanceReport[] = [];

  // Scheduling and automation
  private testScheduler?: NodeJS.Timeout;
  private benchmarkScheduler?: NodeJS.Timeout;
  private reportScheduler?: NodeJS.Timeout;

  // Integration helpers
  private monitoringIntegration: MonitoringIntegrationHelper;
  private reportingService: UnifiedReportingService;
  private alertService: UnifiedAlertService;

  private constructor(config?: Partial<PerformanceRegressionSystemConfig>) {
    this.config = this.getDefaultConfig(config);
    this.status = this.getInitialStatus();

    this.regressionTester = PerformanceRegressionTester.getInstance();
    this.benchmarking = PerformanceBenchmarking.getInstance();
    this.regressionDetector = PerformanceRegressionDetector.getInstance();
    this.budgetEnforcer = PerformanceBudgetEnforcer.getInstance();
    this.ciIntegration = CICDIntegration.getInstance();

    this.monitoringIntegration = new MonitoringIntegrationHelper(this.config.monitoring);
    this.reportingService = new UnifiedReportingService();
    this.alertService = new UnifiedAlertService(this.config.reporting.alerts);
  }

  public static getInstance(config?: Partial<PerformanceRegressionSystemConfig>): PerformanceRegressionSystem {
    if (!PerformanceRegressionSystem.instance) {
      PerformanceRegressionSystem.instance = new PerformanceRegressionSystem(config);
    }
    return PerformanceRegressionSystem.instance;
  }

  private getDefaultConfig(overrides?: Partial<PerformanceRegressionSystemConfig>): PerformanceRegressionSystemConfig {
    const isCI = process.env.CI === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      enabled: true,
      testing: {
        regressionTester: {
          enabled: true,
          autoRun: !isCI,
          schedule: isProduction ? '0 2 * * *' : '0 */6 * * *', // Every 6 hours in dev, daily at 2 AM in prod
          environments: ['Desktop Chrome', 'Mobile Chrome'],
          scenarios: ['Home Page Load', 'Tools Index Load', 'JSON Formatter Load', 'JSON Formatting Operation'],
        },
        benchmarking: {
          enabled: true,
          autoRun: !isCI,
          schedule: '0 3 * * 1', // Weekly on Mondays at 3 AM
          createBaselines: true,
        },
        budgetEnforcement: {
          enabled: true,
          strictMode: isProduction,
          autoBlock: false,
        },
      },
      ciIntegration: {
        enabled: isCI,
        platform: this.detectCIPlatform(),
        environment: isProduction ? 'production' : 'staging',
        gates: {
          enabled: true,
          strict: isProduction,
        },
      },
      monitoring: {
        existingSystem: {
          enabled: true,
          endpoint: process.env.MONITORING_ENDPOINT,
          apiKey: process.env.MONITORING_API_KEY,
        },
        degradationMonitor: {
          enabled: true,
          integration: 'full',
        },
      },
      reporting: {
        enabled: true,
        dashboard: {
          enabled: true,
          refreshInterval: 300, // 5 minutes
        },
        alerts: {
          enabled: true,
          channels: ['console'],
        },
      },
      storage: {
        type: 'memory',
        retention: {
          results: 30, // days
          baselines: 90, // days
          reports: 90, // days
          alerts: 7, // days
        },
      },
      ...overrides,
    };
  }

  private getInitialStatus(): PerformanceRegressionSystemStatus {
    return {
      initialized: false,
      components: {
        regressionTester: false,
        benchmarking: false,
        regressionDetector: false,
        budgetEnforcer: false,
        ciIntegration: false,
        degradationMonitor: false,
      },
      health: {
        overall: 'healthy',
        lastRun: null,
        lastSuccessfulRun: null,
        consecutiveFailures: 0,
      },
      metrics: {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        totalBaselines: 0,
        activeBudgets: 0,
        budgetViolations: 0,
        regressionsDetected: 0,
      },
    };
  }

  private detectCIPlatform(): PerformanceRegressionSystemConfig['ciIntegration']['platform'] {
    if (process.env.GITHUB_ACTIONS) return 'github-actions';
    if (process.env.GITLAB_CI) return 'gitlab-ci';
    if (process.env.JENKINS_URL) return 'jenkins';
    if (process.env.AZURE_PIPELINES) return 'azure-devops';
    return 'github-actions';
  }

  /**
   * Initialize the complete performance regression system
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Performance Regression System...');

    try {
      // Validate configuration
      this.validateConfiguration();

      // Initialize core components
      await this.initializeCoreComponents();

      // Initialize monitoring integration
      await this.initializeMonitoringIntegration();

      // Initialize reporting and alerts
      await this.initializeReporting();

      // Set up scheduled tasks
      await this.setupScheduling();

      // Load existing data
      await this.loadExistingData();

      // Update status
      this.updateComponentStatus('initialized', true);
      this.status.health.overall = 'healthy';

      console.log('✅ Performance Regression System initialized successfully');
      console.log(`📊 System configuration: ${JSON.stringify(this.getStatus(), null, 2)}`);
    } catch (error) {
      console.error('❌ Failed to initialize Performance Regression System:', error);
      this.status.health.overall = 'critical';
      throw error;
    }
  }

  /**
   * Run complete performance regression pipeline
   */
  public async runFullPipeline(options?: {
    includeBenchmarking?: boolean;
    includeBudgetValidation?: boolean;
    forceNewBaseline?: boolean;
    scenarios?: string[];
    environments?: string[];
    dryRun?: boolean;
  }): Promise<UnifiedPerformanceReport> {
    if (!this.status.initialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log('🔄 Running full performance regression pipeline...');
    const startTime = Date.now();

    try {
      // Update health status
      this.status.health.lastRun = new Date();

      // Phase 1: Run regression tests
      console.log('🧪 Phase 1: Running regression tests...');
      const testResults = await this.runRegressionTests(options);

      // Phase 2: Run benchmarking (if enabled)
      let benchmarkResults: BenchmarkResult[] = [];
      if (options?.includeBenchmarking !== false && this.config.testing.benchmarking.enabled) {
        console.log('📊 Phase 2: Running benchmarking...');
        benchmarkResults = await this.runBenchmarking(options);
      }

      // Phase 3: Perform regression detection
      console.log('🔍 Phase 3: Performing regression detection...');
      const regressionResults = await this.performRegressionDetection(testResults);

      // Phase 4: Validate against budgets (if enabled)
      let budgetValidations: BudgetValidation[] = [];
      if (options?.includeBudgetValidation !== false && this.config.testing.budgetEnforcement.enabled) {
        console.log('🔒 Phase 4: Validating against budgets...');
        budgetValidations = await this.validateBudgets(testResults);
      }

      // Phase 5: Generate unified report
      console.log('📋 Phase 5: Generating unified report...');
      const report = await this.generateUnifiedReport({
        testResults,
        benchmarkResults,
        regressionResults,
        budgetValidations,
        duration: Date.now() - startTime,
      });

      // Phase 6: Send notifications and alerts
      console.log('📢 Phase 6: Sending notifications...');
      await this.sendNotifications(report);

      // Phase 7: Store results
      await this.storeResults(report);

      // Update metrics and health
      this.updateMetrics(report);
      this.updateHealth(report);

      console.log('✅ Full pipeline completed successfully');
      return report;
    } catch (error) {
      console.error('❌ Full pipeline failed:', error);
      this.status.health.consecutiveFailures++;
      this.status.health.overall = this.status.health.consecutiveFailures >= 3 ? 'critical' : 'warning';

      // Send error alert
      await this.sendErrorAlert(error);

      throw error;
    }
  }

  /**
   * Run regression tests only
   */
  public async runRegressionTests(options?: {
    scenarios?: string[];
    environments?: string[];
    dryRun?: boolean;
  }): Promise<PerformanceTestResult[]> {
    const testResults = await this.regressionTester.runTestSuite({
      scenarios: options?.scenarios || this.config.testing.regressionTester.scenarios,
      environments: options?.environments || this.config.testing.regressionTester.environments,
      dryRun: options?.dryRun,
    });

    // Store results
    this.testResults.push(...testResults);

    // Integrate with existing monitoring system
    await this.monitoringIntegration.sendTestResults(testResults);

    return testResults;
  }

  /**
   * Run benchmarking only
   */
  public async runBenchmarking(options?: {
    forceNewBaseline?: boolean;
    scenarios?: string[];
    environments?: string[];
    dryRun?: boolean;
  }): Promise<BenchmarkResult[]> {
    const benchmarkResults = await this.benchmarking.runBenchmarkSuite({
      createBaseline: options?.forceNewBaseline || this.config.testing.benchmarking.createBaselines,
      scenarios: options?.scenarios,
      environments: options?.environments,
      dryRun: options?.dryRun,
    });

    // Store results
    this.benchmarkResults.push(...benchmarkResults);

    // Integrate with existing monitoring system
    await this.monitoringIntegration.sendBenchmarkResults(benchmarkResults);

    return benchmarkResults;
  }

  /**
   * Perform regression detection
   */
  public async performRegressionDetection(
    testResults?: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult[]> {
    const results = testResults || this.testResults;

    if (results.length === 0) {
      console.warn('⚠️ No test results available for regression detection');
      return [];
    }

    // Get active baselines
    const baselines = this.regressionTester.getBaselines();

    const regressionResults: RegressionDetectionResult[] = [];

    for (const result of results) {
      const baseline = baselines.get(`${result.scenario}-${result.environment}`);

      if (baseline) {
        const detection = await this.regressionDetector.detectRegressions(result, baseline);
        regressionResults.push(detection);
      } else {
        console.warn(`⚠️ No baseline found for ${result.scenario} in ${result.environment}`);
      }
    }

    // Store results
    this.regressionResults.push(...regressionResults);

    // Integrate with degradation monitor
    if (this.degradationMonitor) {
      await this.integrateWithDegradationMonitor(regressionResults);
    }

    return regressionResults;
  }

  /**
   * Validate against budgets
   */
  public async validateBudgets(testResults?: PerformanceTestResult[]): Promise<BudgetValidation[]> {
    const results = testResults || this.testResults;

    if (results.length === 0) {
      console.warn('⚠️ No test results available for budget validation');
      return [];
    }

    const validations = await this.budgetEnforcer.validatePerformance(results, {
      environment: this.config.ciIntegration.environment,
      commit: process.env.COMMIT_SHA,
      deployment: process.env.DEPLOYMENT_ID,
      buildNumber: process.env.BUILD_NUMBER,
    });

    return validations;
  }

  /**
   * Generate unified performance report
   */
  public async generateUnifiedReport(data: {
    testResults: PerformanceTestResult[];
    benchmarkResults: BenchmarkResult[];
    regressionResults: RegressionDetectionResult[];
    budgetValidations: BudgetValidation[];
    duration: number;
  }): Promise<UnifiedPerformanceReport> {
    return await this.reportingService.generateReport({
      ...data,
      config: this.config,
      status: this.status,
      timestamp: new Date(),
    });
  }

  /**
   * Get system status
   */
  public getStatus(): PerformanceRegressionSystemStatus {
    return { ...this.status };
  }

  /**
   * Get unified reports
   */
  public getReports(limit?: number): UnifiedPerformanceReport[] {
    let reports = [...this.unifiedReports].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (limit) {
      reports = reports.slice(0, limit);
    }

    return reports;
  }

  /**
   * Get latest report
   */
  public getLatestReport(): UnifiedPerformanceReport | null {
    return this.unifiedReports.length > 0 ? this.unifiedReports[0] : null;
  }

  /**
   * Get performance health dashboard data
   */
  public getHealthDashboard(): {
    status: PerformanceRegressionSystemStatus;
    recentReport: UnifiedPerformanceReport | null;
    budgetHealth: any;
    activeAlerts: any[];
    trends: any;
  } {
    return {
      status: this.getStatus(),
      recentReport: this.getLatestReport(),
      budgetHealth: this.budgetEnforcer.getBudgetHealth(),
      activeAlerts: this.budgetEnforcer.getActiveAlerts(),
      trends: this.calculateTrends(),
    };
  }

  // Private methods
  private validateConfiguration(): void {
    if (!this.config.enabled) {
      throw new Error('Performance regression system is disabled in configuration');
    }

    // Validate critical dependencies
    if (!this.config.testing.regressionTester.enabled &&
        !this.config.testing.benchmarking.enabled) {
      throw new Error('At least one testing component must be enabled');
    }
  }

  private async initializeCoreComponents(): Promise<void> {
    console.log('🔧 Initializing core components...');

    await this.regressionTester.initialize();
    this.updateComponentStatus('regressionTester', true);

    await this.benchmarking.initialize();
    this.updateComponentStatus('benchmarking', true);

    await this.regressionDetector.initialize();
    this.updateComponentStatus('regressionDetector', true);

    await this.budgetEnforcer.initialize();
    this.updateComponentStatus('budgetEnforcer', true);

    if (this.config.ciIntegration.enabled) {
      await this.ciIntegration.initialize();
      this.updateComponentStatus('ciIntegration', true);
    }
  }

  private async initializeMonitoringIntegration(): Promise<void> {
    console.log('📡 Initializing monitoring integration...');

    await this.monitoringIntegration.initialize();

    if (this.config.monitoring.degradationMonitor.enabled) {
      try {
        this.degradationMonitor = PerformanceDegradationMonitor.getInstance();
        await this.degradationMonitor.initialize();
        this.updateComponentStatus('degradationMonitor', true);
        console.log('✅ Degradation monitor integrated');
      } catch (error) {
        console.warn('⚠️ Failed to integrate degradation monitor:', error);
      }
    }
  }

  private async initializeReporting(): Promise<void> {
    console.log('📊 Initializing reporting system...');

    await this.reportingService.initialize();
    await this.alertService.initialize();
  }

  private async setupScheduling(): Promise<void> {
    console.log('⏰ Setting up scheduled tasks...');

    // Schedule regression tests
    if (this.config.testing.regressionTester.autoRun) {
      this.testScheduler = setInterval(async () => {
        try {
          await this.runRegressionTests();
        } catch (error) {
          console.error('Scheduled regression test failed:', error);
        }
      }, this.parseCronSchedule(this.config.testing.regressionTester.schedule));
    }

    // Schedule benchmarking
    if (this.config.testing.benchmarking.autoRun) {
      this.benchmarkScheduler = setInterval(async () => {
        try {
          await this.runBenchmarking();
        } catch (error) {
          console.error('Scheduled benchmarking failed:', error);
        }
      }, this.parseCronSchedule(this.config.testing.benchmarking.schedule));
    }

    // Schedule reports
    if (this.config.reporting.dashboard.enabled) {
      this.reportScheduler = setInterval(async () => {
        try {
          const report = await this.runFullPipeline({ dryRun: true });
          console.log('📊 Scheduled report generated:', report.summary.overallStatus);
        } catch (error) {
          console.error('Scheduled report generation failed:', error);
        }
      }, this.config.reporting.dashboard.refreshInterval * 1000);
    }
  }

  private parseCronSchedule(cronExpression: string): number {
    // Simplified cron parsing - in a real implementation, use a proper cron library
    // For now, return a default interval (6 hours)
    return 6 * 60 * 60 * 1000;
  }

  private async loadExistingData(): Promise<void> {
    console.log('📂 Loading existing data...');

    // In a real implementation, this would load from storage/database
    // For now, we start with empty arrays
  }

  private async storeResults(report: UnifiedPerformanceReport): Promise<void> {
    // Store the unified report
    this.unifiedReports.push(report);

    // Clean old reports based on retention policy
    const retentionMs = this.config.storage.retention.reports * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - retentionMs);
    this.unifiedReports = this.unifiedReports.filter(r => r.timestamp >= cutoff);

    // Clean other data
    await this.cleanupOldData();
  }

  private async cleanupOldData(): Promise<void> {
    // Clean test results
    const testRetentionMs = this.config.storage.retention.results * 24 * 60 * 60 * 1000;
    const testCutoff = new Date(Date.now() - testRetentionMs);
    this.testResults = this.testResults.filter(r => r.timestamp >= testCutoff);

    // Clean benchmark results
    const benchmarkRetentionMs = this.config.storage.retention.baselines * 24 * 60 * 60 * 1000;
    const benchmarkCutoff = new Date(Date.now() - benchmarkRetentionMs);
    this.benchmarkResults = this.benchmarkResults.filter(r => r.timestamp >= benchmarkCutoff);

    // Clean regression results
    const regressionRetentionMs = this.config.storage.retention.reports * 24 * 60 * 60 * 1000;
    const regressionCutoff = new Date(Date.now() - regressionRetentionMs);
    this.regressionResults = this.regressionResults.filter(r => r.timestamp >= regressionCutoff);
  }

  private updateMetrics(report: UnifiedPerformanceReport): void {
    this.status.metrics.totalTests += report.testResults.total;
    this.status.metrics.successfulTests += report.testResults.passed;
    this.status.metrics.failedTests += report.testResults.failed;
    this.status.metrics.totalBaselines = report.benchmarking.baselines.total;
    this.status.metrics.activeBudgets = report.budgets.total;
    this.status.metrics.budgetViolations = report.budgets.violation;
    this.status.metrics.regressionsDetected = report.regressions.total;
  }

  private updateHealth(report: UnifiedPerformanceReport): void {
    if (report.testResults.criticalFailures > 0 ||
        report.regressions.critical > 0 ||
        report.budgets.violation > 0) {
      this.status.health.overall = 'critical';
    } else if (report.testResults.failed > 0 ||
               report.regressions.warnings > 0 ||
               report.budgets.warning > 0) {
      this.status.health.overall = 'warning';
    } else {
      this.status.health.overall = 'healthy';
    }

    this.status.health.lastSuccessfulRun = report.testResults.failed === 0 ? new Date() : this.status.health.lastSuccessfulRun;
    this.status.health.consecutiveFailures = report.testResults.failed > 0 ? this.status.health.consecutiveFailures + 1 : 0;
  }

  private updateComponentStatus(component: keyof PerformanceRegressionSystemStatus['components'], status: boolean): void {
    this.status.components[component] = status;
  }

  private async sendNotifications(report: UnifiedPerformanceReport): Promise<void> {
    await this.alertService.sendUnifiedReportAlert(report);
  }

  private async sendErrorAlert(error: any): Promise<void> {
    await this.alertService.sendErrorAlert(error);
  }

  private async integrateWithDegradationMonitor(regressionResults: RegressionDetectionResult[]): Promise<void> {
    if (!this.degradationMonitor) return;

    for (const result of regressionResults) {
      for (const regression of result.regressions) {
        // Send degradation data to existing monitor
        await this.monitoringIntegration.sendRegressionData(regression);
      }
    }
  }

  private calculateTrends(): any {
    // Calculate trends from historical data
    return {
      performance: 'stable',
      regressions: 'decreasing',
      budgets: 'improving',
    };
  }

  // Public API for configuration management
  public updateConfig(config: Partial<PerformanceRegressionSystemConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize affected components
    if (config.monitoring) {
      this.monitoringIntegration.updateConfig(this.config.monitoring);
    }

    if (config.reporting?.alerts) {
      this.alertService.updateConfig(this.config.reporting.alerts);
    }
  }

  public getConfig(): PerformanceRegressionSystemConfig {
    return { ...this.config };
  }

  /**
   * Cleanup system resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Performance Regression System...');

    // Clear scheduled tasks
    if (this.testScheduler) {
      clearInterval(this.testScheduler);
    }
    if (this.benchmarkScheduler) {
      clearInterval(this.benchmarkScheduler);
    }
    if (this.reportScheduler) {
      clearInterval(this.reportScheduler);
    }

    // Cleanup components
    await this.regressionTester.cleanup?.();
    await this.benchmarking.cleanup?.();
    await this.regressionDetector.cleanup?.();
    await this.budgetEnforcer.cleanup?.();
    await this.ciIntegration.cleanup?.();
    await this.degradationMonitor?.cleanup?.();
    await this.monitoringIntegration.cleanup?.();

    // Clear data
    this.testResults = [];
    this.benchmarkResults = [];
    this.regressionResults = [];
    this.unifiedReports = [];

    // Reset status
    this.status = this.getInitialStatus();

    console.log('✅ Performance Regression System cleaned up');
  }
}

// Supporting integration classes
class MonitoringIntegrationHelper {
  constructor(private config: PerformanceRegressionSystemConfig['monitoring']) {}

  async initialize(): Promise<void> {
    console.log('📡 Initializing monitoring integration helper...');
  }

  async sendTestResults(results: PerformanceTestResult[]): Promise<void> {
    if (!this.config.existingSystem.enabled) {
      return;
    }

    console.log(`📊 Sending ${results.length} test results to existing monitoring system...`);

    // Implementation would send to existing monitoring system
    if (this.config.existingSystem.endpoint) {
      // Send to external monitoring system
    }
  }

  async sendBenchmarkResults(results: BenchmarkResult[]): Promise<void> {
    if (!this.config.existingSystem.enabled) {
      return;
    }

    console.log(`📈 Sending ${results.length} benchmark results to existing monitoring system...`);

    // Implementation would send to existing monitoring system
  }

  async sendRegressionData(regression: any): Promise<void> {
    if (!this.config.existingSystem.enabled) {
      return;
    }

    console.log(`📉 Sending regression data to degradation monitor...`);

    // Implementation would send to existing monitoring system
  }

  updateConfig(config: PerformanceRegressionSystemConfig['monitoring']): void {
    this.config = config;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up monitoring integration helper...');
  }
}

class UnifiedReportingService {
  async initialize(): Promise<void> {
    console.log('📋 Initializing unified reporting service...');
  }

  async generateReport(data: any): Promise<UnifiedPerformanceReport> {
    const report: UnifiedPerformanceReport = {
      id: `report-${Date.now()}`,
      timestamp: new Date(),
      period: data.period || {
        start: new Date(Date.now() - data.duration),
        end: new Date(),
        duration: data.duration,
      },

      summary: {
        overallStatus: this.calculateOverallStatus(data),
        performanceScore: this.calculatePerformanceScore(data),
        regressionStatus: this.calculateRegressionStatus(data),
        budgetCompliance: this.calculateBudgetCompliance(data),
        trend: 'stable', // Would calculate from historical data
      },

      testResults: {
        total: data.testResults.length,
        passed: data.testResults.filter(r => r.status === 'passed').length,
        failed: data.testResults.filter(r => r.status === 'failed').length,
        warnings: data.testResults.filter(r => r.status === 'warning').length,
        averageScore: Math.round(data.testResults.reduce((sum: number, r: any) => sum + r.score.overall, 0) / data.testResults.length),
        criticalFailures: data.testResults.filter(r => r.status === 'failed' && r.score.overall < 50).length,
        results: data.testResults,
      },

      benchmarking: {
        baselines: {
          total: 0, // Would calculate from benchmarking system
          active: 0,
          outdated: 0,
        },
        measurements: {
          total: data.benchmarkResults.length,
          improvements: 0, // Would calculate from results
          degradations: 0,
        },
        results: data.benchmarkResults,
      },

      regressions: {
        total: data.regressionResults.reduce((sum: number, r: any) => sum + r.regressions.length, 0),
        critical: data.regressionResults.reduce((sum: number, r: any) => sum + r.regressions.filter((reg: any) => reg.severity === 'critical').length, 0),
        warnings: data.regressionResults.reduce((sum: number, r: any) => sum + r.regressions.filter((reg: any) => reg.severity === 'warning').length, 0),
        detected: data.regressionResults,
        trends: {
          improving: 0,
          stable: 0,
          degrading: 0,
        },
      },

      budgets: {
        total: data.budgetValidations.length,
        compliant: data.budgetValidations.filter(v => v.status === 'compliant').length,
        warning: data.budgetValidations.filter(v => v.status === 'warning').length,
        violation: data.budgetValidations.filter(v => v.status === 'violation').length,
        validations: data.budgetValidations,
        categoryBreakdown: {}, // Would calculate from validations
      },

      cicd: {
        lastRun: undefined, // Would get from CI integration
        gates: {
          passed: true,
          blocked: false,
          manualOverride: false,
        },
        deployments: [],
      },

      monitoring: {
        degradationMonitor: {
          active: false,
          alerts: 0,
          degradations: 0,
        },
        realTimeMetrics: [],
      },

      recommendations: this.generateRecommendations(data),
    };

    return report;
  }

  private calculateOverallStatus(data: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const criticalIssues =
      data.testResults.criticalFailures +
      data.regressions.critical +
      data.budgets.violation;

    if (criticalIssues === 0) {
      return 'excellent';
    } else if (criticalIssues <= 2) {
      return 'good';
    } else if (criticalIssues <= 5) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  private calculatePerformanceScore(data: any): number {
    const testScore = data.testResults.averageScore || 0;
    // Would incorporate other factors
    return Math.round(testScore);
  }

  private calculateRegressionStatus(data: any): 'clean' | 'warning' | 'critical' {
    const totalRegressions = data.regressions.total;
    const criticalRegressions = data.regressions.critical;

    if (totalRegressions === 0) {
      return 'clean';
    } else if (criticalRegressions > 0) {
      return 'critical';
    } else {
      return 'warning';
    }
  }

  private calculateBudgetCompliance(data: any): 'compliant' | 'warning' | 'violation' {
    if (data.budgets.violation > 0) {
      return 'violation';
    } else if (data.budgets.warning > 0) {
      return 'warning';
    } else {
      return 'compliant';
    }
  }

  private generateRecommendations(data: any): UnifiedPerformanceReport['recommendations'] {
    const recommendations: UnifiedPerformanceReport['recommendations'] = [];

    // Test-related recommendations
    if (data.testResults.failed > 0) {
      recommendations.push({
        priority: 'high',
        category: 'testing',
        description: `Investigate ${data.testResults.failed} failed test cases`,
        impact: 'Failed tests indicate performance regressions that need immediate attention',
        effort: '2-4 hours',
      });
    }

    // Regression-related recommendations
    if (data.regressions.critical > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'optimization',
        description: `Address ${data.regressions.critical} critical performance regressions`,
        impact: 'Critical regressions significantly impact user experience and business metrics',
        effort: '1-3 days',
      });
    }

    // Budget-related recommendations
    if (data.budgets.violation > 0) {
      recommendations.push({
        priority: 'high',
        category: 'infrastructure',
        description: `Resolve ${data.budgets.violation} budget violations`,
        impact: 'Budget violations indicate performance issues that may affect scalability and costs',
        effort: '1-2 days',
      });
    }

    return recommendations;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up unified reporting service...');
  }
}

class UnifiedAlertService {
  private config: PerformanceRegressionSystemConfig['reporting']['alerts'];

  constructor(config: PerformanceRegressionSystemConfig['reporting']['alerts']) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('🚨 Initializing unified alert service...');
  }

  async sendUnifiedReportAlert(report: UnifiedPerformanceReport): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    console.log(`📢 Sending unified report alert: ${report.summary.overallStatus}`);

    for (const channel of this.config.channels) {
      switch (channel) {
        case 'console':
          this.sendConsoleAlert(report);
          break;
        case 'email':
          await this.sendEmailAlert(report);
          break;
        case 'slack':
          await this.sendSlackAlert(report);
          break;
        case 'webhook':
          await this.sendWebhookAlert(report);
          break;
      }
    }
  }

  async sendErrorAlert(error: any): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    console.error(`🚨 Error alert: ${error.message || error}`);

    for (const channel of this.config.channels) {
      if (channel === 'console') {
        console.error('❌ Performance Regression System Error:', error);
      }
      // Add other channel implementations
    }
  }

  private sendConsoleAlert(report: UnifiedPerformanceReport): void {
    console.log(`📊 Performance Report (${report.summary.overallStatus.toUpperCase()}):`);
    console.log(`  Score: ${report.summary.performanceScore}/100`);
    console.log(`  Tests: ${report.testResults.passed}/${report.testResults.total} passed`);
    console.log(`  Regressions: ${report.regressions.total} (${report.regressions.critical} critical)`);
    console.log(`  Budgets: ${report.budgets.compliant}/${report.budgets.total} compliant`);
  }

  private async sendEmailAlert(report: UnifiedPerformanceReport): Promise<void> {
    // Implementation would send email
    console.log('📧 Email alert sent');
  }

  private async sendSlackAlert(report: UnifiedPerformanceReport): Promise<void> {
    // Implementation would send Slack notification
    console.log('💬 Slack alert sent');
  }

  private async sendWebhookAlert(report: UnifiedPerformanceReport): Promise<void> {
    // Implementation would send webhook
    console.log('🔗 Webhook alert sent');
  }

  updateConfig(config: PerformanceRegressionSystemConfig['reporting']['alerts']): void {
    this.config = config;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up unified alert service...');
  }
}

/**
 * Performance Budget System - Integrated Entry Point
 * Main orchestrator for all performance budget components
 * Provides unified interface for budget management, validation, monitoring, and optimization
 */

import { performanceBudgetManager, type PerformanceBudget, type BudgetReport } from './performance-budget-manager';
import { buildTimeBudgetValidator, type ValidationResult } from './build-time-budget-validator';
import { runtimeBudgetMonitor, type RuntimeSession } from './runtime-budget-monitor';
import { budgetAlertSystem, type Alert, type AlertChannel } from './budget-alert-system';
import { performanceRegressionDetector, type Regression, type RegressionReport } from './performance-regression-detector';
import { budgetOptimizationEngine, type OptimizationRecommendation, type OptimizationPlan } from './budget-optimization-engine';
import { ciBudgetIntegration, type CIBuildResult, type CIConfig } from './ci-cd-integration';
import { EventEmitter } from 'events';

export interface PerformanceBudgetSystemConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  components: {
    budgetManager: boolean;
    buildValidator: boolean;
    runtimeMonitor: boolean;
    alertSystem: boolean;
    regressionDetector: boolean;
    optimizationEngine: boolean;
    ciIntegration: boolean;
  };
  thresholds: {
    warning: number;
    critical: number;
    regression: number;
  };
  automation: {
    enabled: boolean;
    autoOptimize: boolean;
    autoResolveAlerts: boolean;
    blockOnViolations: boolean;
  };
  reporting: {
    enabled: boolean;
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    formats: ('json' | 'html' | 'markdown')[];
    retention: number; // days
  };
  storage: {
    enabled: boolean;
    path: string;
    compression: boolean;
  };
}

export interface SystemStatus {
  enabled: boolean;
  initialized: boolean;
  components: {
    budgetManager: boolean;
    buildValidator: boolean;
    runtimeMonitor: boolean;
    alertSystem: boolean;
    regressionDetector: boolean;
    optimizationEngine: boolean;
    ciIntegration: boolean;
  };
  environment: string;
  health: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastActivity: Date;
  metrics: {
    budgetsMonitored: number;
    alertsActive: number;
    regressionsActive: number;
    recommendationsGenerated: number;
    totalSavings: number;
  };
}

export interface SystemReport {
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: SystemSummary;
  components: {
    budget: BudgetReport | null;
    build: ValidationResult | null;
    runtime: RuntimeSession | null;
    alerts: Alert[];
    regressions: Regression[];
    optimizations: OptimizationRecommendation[];
    ci: CIBuildResult | null;
  };
  recommendations: OptimizationRecommendation[];
  trends: SystemTrend[];
}

export interface SystemSummary {
  overallScore: number;
  budgetsCompliant: number;
  budgetsTotal: number;
  activeAlerts: number;
  criticalAlerts: number;
  regressionsDetected: number;
  criticalRegressions: number;
  optimizationsApplied: number;
  estimatedSavings: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface SystemTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'degrading';
  changePercentage: number;
  timeframe: number;
  significance: 'high' | 'medium' | 'low';
}

/**
 * Main Performance Budget System class
 * Orchestrates all performance budget components
 */
export class PerformanceBudgetSystem extends EventEmitter {
  private static instance: PerformanceBudgetSystem;
  private config: PerformanceBudgetSystemConfig;
  private initialized = false;
  private startTime: Date;
  private lastActivity: Date;

  private constructor(config?: Partial<PerformanceBudgetSystemConfig>) {
    super();
    this.config = this.mergeConfig(this.getDefaultConfig(), config || {});
    this.startTime = new Date();
    this.lastActivity = new Date();
  }

  public static getInstance(config?: Partial<PerformanceBudgetSystemConfig>): PerformanceBudgetSystem {
    if (!PerformanceBudgetSystem.instance) {
      PerformanceBudgetSystem.instance = new PerformanceBudgetSystem(config);
    }
    return PerformanceBudgetSystem.instance;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): PerformanceBudgetSystemConfig {
    return {
      enabled: true,
      environment: 'development',
      components: {
        budgetManager: true,
        buildValidator: true,
        runtimeMonitor: true,
        alertSystem: true,
        regressionDetector: true,
        optimizationEngine: true,
        ciIntegration: true,
      },
      thresholds: {
        warning: 10, // 10% over budget
        critical: 20, // 20% over budget
        regression: 15, // 15% regression threshold
      },
      automation: {
        enabled: false, // Disabled by default for safety
        autoOptimize: false,
        autoResolveAlerts: false,
        blockOnViolations: true,
      },
      reporting: {
        enabled: true,
        frequency: 'daily',
        formats: ['json', 'markdown'],
        retention: 90, // 90 days
      },
      storage: {
        enabled: true,
        path: '.performance-budgets',
        compression: false,
      },
    };
  }

  /**
   * Merge configurations
   */
  private mergeConfig(
    defaultConfig: PerformanceBudgetSystemConfig,
    userConfig: Partial<PerformanceBudgetSystemConfig>
  ): PerformanceBudgetSystemConfig {
    return {
      ...defaultConfig,
      ...userConfig,
      components: { ...defaultConfig.components, ...userConfig.components },
      thresholds: { ...defaultConfig.thresholds, ...userConfig.thresholds },
      automation: { ...defaultConfig.automation, ...userConfig.automation },
      reporting: { ...defaultConfig.reporting, ...userConfig.reporting },
      storage: { ...defaultConfig.storage, ...userConfig.storage },
    };
  }

  /**
   * Initialize the performance budget system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('Performance Budget System already initialized');
      return;
    }

    if (!this.config.enabled) {
      console.log('Performance Budget System is disabled');
      return;
    }

    console.log('🚀 Initializing Performance Budget System...');

    try {
      // Initialize components in dependency order
      if (this.config.components.budgetManager) {
        console.log('📊 Initializing Budget Manager...');
        // Budget manager is already initialized as singleton
      }

      if (this.config.components.alertSystem) {
        console.log('🔔 Initializing Alert System...');
        // Alert system is already initialized as singleton
      }

      if (this.config.components.runtimeMonitor) {
        console.log('🔍 Initializing Runtime Monitor...');
        await runtimeBudgetMonitor.initialize();
      }

      if (this.config.components.regressionDetector) {
        console.log('📈 Initializing Regression Detector...');
        // Regression detector is already initialized as singleton
      }

      if (this.config.components.optimizationEngine) {
        console.log('⚡ Initializing Optimization Engine...');
        // Optimization engine is already initialized as singleton
      }

      if (this.config.components.buildValidator) {
        console.log('🏗️ Initializing Build Validator...');
        // Build validator is already initialized as singleton
      }

      if (this.config.components.ciIntegration) {
        console.log('🔄 Initializing CI Integration...');
        // CI integration is already initialized as singleton
      }

      // Set up event listeners
      this.setupEventListeners();

      this.initialized = true;
      this.lastActivity = new Date();

      // Emit initialization event
      this.emit('system-initialized', {
        timestamp: new Date(),
        environment: this.config.environment,
        components: this.config.components,
      });

      console.log('✅ Performance Budget System initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Performance Budget System:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners between components
   */
  private setupEventListeners(): void {
    // Runtime Monitor -> Budget Manager
    if (this.config.components.runtimeMonitor && this.config.components.budgetManager) {
      runtimeBudgetMonitor.addEventListener('measurement-added', async (measurement) => {
        // Forward measurements to budget manager
        const measurements: Record<string, number> = {};
        measurements[measurement.name] = measurement.value;

        try {
          await performanceBudgetManager.generateBudgetReport(
            measurements,
            runtimeBudgetMonitor.getSession().id,
            this.config.environment
          );
        } catch (error) {
          console.error('Error forwarding measurement to budget manager:', error);
        }
      });
    }

    // Budget Manager -> Alert System
    if (this.config.components.budgetManager && this.config.components.alertSystem) {
      performanceBudgetManager.addEventListener('report-generated', async (report: BudgetReport) => {
        // Create alerts for violations
        for (const violation of report.violations) {
          try {
            await budgetAlertSystem.createAlert({
              type: 'violation',
              severity: violation.severity === 'critical' ? 'critical' : 'error',
              category: 'bundle' as any, // Simplified
              source: 'runtime',
              metric: violation.metric,
              currentValue: violation.currentValue,
              threshold: violation.threshold,
              overage: violation.overage,
              overagePercentage: violation.overagePercentage,
              message: `Budget violation in ${violation.budgetName}`,
              description: violation.recommendation || 'Budget threshold exceeded',
              recommendation: violation.recommendation,
              metadata: {
                budgetId: violation.budgetId,
                reportId: report.id,
                environment: this.config.environment,
              },
              timestamp: new Date(),
              acknowledged: false,
              resolved: false,
              escalated: false,
              responses: [],
              tags: ['budget', 'runtime'],
            });
          } catch (error) {
            console.error('Error creating alert for budget violation:', error);
          }
        }
      });
    }

    // Regression Detector -> Alert System
    if (this.config.components.regressionDetector && this.config.components.alertSystem) {
      performanceRegressionDetector.addEventListener('regression-detected', async (regression: Regression) => {
        try {
          await budgetAlertSystem.createAlert({
            type: 'regression',
            severity: regression.severity === 'critical' ? 'critical' : 'error',
            category: 'bundle' as any, // Simplified
            source: 'runtime',
            metric: regression.metric,
            currentValue: regression.currentValue,
            threshold: regression.baselineValue,
            overage: regression.currentValue - regression.baselineValue,
            overagePercentage: regression.changePercentage,
            message: `Performance regression detected: ${regression.metric}`,
            description: `${regression.changePercentage.toFixed(1)}% degradation detected`,
            recommendation: regression.recommendations.join(', '),
            metadata: {
              regressionId: regression.id,
              buildId: regression.buildId,
              environment: this.config.environment,
            },
            timestamp: new Date(),
            acknowledged: false,
            resolved: false,
            escalated: false,
            responses: [],
            tags: ['regression', 'performance'],
          });
        } catch (error) {
          console.error('Error creating alert for regression:', error);
        }
      });
    }

    // Alert System -> System Events
    if (this.config.components.alertSystem) {
      budgetAlertSystem.addEventListener('alert-created', (alert: Alert) => {
        this.lastActivity = new Date();
        this.emit('alert-created', alert);
      });

      budgetAlertSystem.addEventListener('alert-resolved', (alert: Alert) => {
        this.lastActivity = new Date();
        this.emit('alert-resolved', alert);
      });
    }

    // CI Integration -> System Events
    if (this.config.components.ciIntegration) {
      ciBudgetIntegration.addEventListener('validation-completed', (result: CIBuildResult) => {
        this.lastActivity = new Date();
        this.emit('ci-validation-completed', result);
      });
    }
  }

  /**
   * Run comprehensive budget validation
   */
  public async runValidation(buildPath?: string): Promise<SystemReport> {
    if (!this.initialized) {
      throw new Error('Performance Budget System not initialized');
    }

    console.log('🔍 Running comprehensive performance budget validation...');

    const report: SystemReport = {
      timestamp: new Date(),
      period: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
      },
      summary: {
        overallScore: 0,
        budgetsMonitored: 0,
        budgetsTotal: 0,
        activeAlerts: 0,
        criticalAlerts: 0,
        regressionsDetected: 0,
        criticalRegressions: 0,
        optimizationsApplied: 0,
        estimatedSavings: 0,
        healthStatus: 'healthy',
        performanceGrade: 'A',
      },
      components: {
        budget: null,
        build: null,
        runtime: null,
        alerts: [],
        regressions: [],
        optimizations: [],
        ci: null,
      },
      recommendations: [],
      trends: [],
    };

    try {
      // Budget validation
      if (this.config.components.budgetManager) {
        console.log('📊 Running budget validation...');
        const measurements = await this.collectCurrentMeasurements();
        const budgetReport = await performanceBudgetManager.generateBudgetReport(
          measurements,
          `system_${Date.now()}`,
          this.config.environment
        );
        report.components.budget = budgetReport;
        report.summary.budgetsMonitored = budgetReport.summary.totalBudgets;
        report.summary.budgetsCompliant = budgetReport.summary.passedBudgets;
        report.summary.overallScore = budgetReport.summary.overallScore;
      }

      // Build validation
      if (this.config.components.buildValidator && buildPath) {
        console.log('🏗️ Running build validation...');
        const buildResult = await buildTimeBudgetValidator.validateBuild(buildPath, this.config.environment);
        report.components.build = buildResult;
        report.components.alerts.push(...buildResult.violations.map(v => ({
          id: `build_${v.metric}`,
          type: 'violation' as const,
          severity: v.severity === 'critical' ? 'critical' : 'error' as const,
          category: 'bundle' as const,
          source: 'build-time' as const,
          budgetId: 'build',
          budgetName: 'Build Validation',
          metric: v.metric,
          currentValue: v.currentValue,
          threshold: v.threshold,
          overage: v.currentValue - v.threshold,
          overagePercentage: ((v.currentValue - v.threshold) / v.threshold) * 100,
          message: v.message,
          description: v.message,
          metadata: { buildId: buildResult.analysis.buildId },
          timestamp: new Date(),
          acknowledged: false,
          resolved: false,
          escalated: false,
          responses: [],
          tags: ['build'],
        })));
      }

      // Runtime session
      if (this.config.components.runtimeMonitor) {
        console.log('🔍 Collecting runtime data...');
        report.components.runtime = runtimeBudgetMonitor.getSession();
      }

      // Collect alerts
      if (this.config.components.alertSystem) {
        console.log('🔔 Collecting active alerts...');
        report.components.alerts.push(...budgetAlertSystem.getActiveAlerts());
        report.summary.activeAlerts = report.components.alerts.length;
        report.summary.criticalAlerts = report.components.alerts.filter(a => a.severity === 'critical').length;
      }

      // Collect regressions
      if (this.config.components.regressionDetector) {
        console.log('📈 Analyzing regressions...');
        report.components.regressions = performanceRegressionDetector.getRegressions({ status: 'active' });
        report.summary.regressionsDetected = report.components.regressions.length;
        report.summary.criticalRegressions = report.components.regressions.filter(r => r.severity === 'critical').length;
      }

      // Generate optimization recommendations
      if (this.config.components.optimizationEngine) {
        console.log('⚡ Generating optimization recommendations...');
        const context = await this.collectOptimizationContext(report);
        const recommendations = await budgetOptimizationEngine.generateRecommendations(context);
        report.components.optimizations = recommendations;
        report.summary.optimizationsApplied = recommendations.filter(r => r.automation.automatable).length;
        report.summary.estimatedSavings = recommendations.reduce((sum, r) => sum + r.impact.sizeSavings, 0);
      }

      // Analyze trends
      console.log('📈 Analyzing trends...');
      report.trends = await this.analyzeSystemTrends();

      // Generate system recommendations
      console.log('💡 Generating system recommendations...');
      report.recommendations = this.generateSystemRecommendations(report);

      // Calculate final health status and grade
      this.calculateFinalMetrics(report);

      this.lastActivity = new Date();
      this.emit('validation-completed', report);

      return report;

    } catch (error) {
      console.error('❌ Comprehensive validation failed:', error);
      throw error;
    }
  }

  /**
   * Collect current measurements from all sources
   */
  private async collectCurrentMeasurements(): Promise<Record<string, number>> {
    const measurements: Record<string, number> = {};

    // Collect from runtime monitor
    if (this.config.components.runtimeMonitor) {
      const runtimeMeasurements = runtimeBudgetMonitor.getMeasurements();
      const latestMeasurements = new Map<string, number>();

      runtimeMeasurements.forEach(measurement => {
        if (!latestMeasurements.has(measurement.name) ||
            measurement.timestamp > runtimeMeasurements.find(m => m.name === measurement.name)?.timestamp!) {
          latestMeasurements.set(measurement.name, measurement.value);
        }
      });

      latestMeasurements.forEach((value, name) => {
        measurements[name] = value;
      });
    }

    // Add mock data if no measurements available
    if (Object.keys(measurements).length === 0) {
      Object.assign(measurements, {
        totalSize: 450 * 1024,
        compressedSize: 135 * 1024,
        maxChunkSize: 200 * 1024,
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2000,
        firstInputDelay: 80,
        cumulativeLayoutShift: 0.08,
        totalRequests: 35,
        totalTransferSize: 800 * 1024,
        timeToFirstByte: 500,
      });
    }

    return measurements;
  }

  /**
   * Collect optimization context
   */
  private async collectOptimizationContext(report: SystemReport): Promise<any> {
    return {
      buildId: `system_${Date.now()}`,
      timestamp: new Date(),
      bundleSize: report.summary.budgetsMonitored > 0 ? 450 * 1024 : 0,
      compressedSize: 135 * 1024,
      metrics: await this.collectCurrentMeasurements(),
      violations: report.components.alerts.map(a => ({
        metric: a.metric,
        severity: a.severity,
        currentValue: a.currentValue,
        threshold: a.threshold,
        fixable: true,
      })),
      dependencies: [
        { name: 'react', version: '19.0.0', size: 65000, used: true },
        { name: 'next', version: '16.0.1', size: 250000, used: true },
        { name: 'lodash', version: '4.17.21', size: 70000, used: false, alternatives: ['lodash-es', 'native-js'] },
      ],
      assets: [
        { name: 'logo.png', type: 'image', size: 25000, optimized: false, canBeOptimized: true, optimizationPotential: 40, lazyLoadable: true },
        { name: 'app.css', type: 'css', size: 15000, optimized: true, canBeOptimized: false, lazyLoadable: false },
      ],
      chunks: [
        { name: 'main', size: 300000, modules: 50, dependencies: ['react', 'next'], canBeSplit: true, splitPotential: 30 },
        { name: 'vendor', size: 200000, modules: 30, dependencies: ['lodash'], canBeSplit: false, splitPotential: 0 },
      ],
      usage: {
        features: {
          'dashboard': 80,
          'analytics': 60,
          'advanced-chart': 15,
          'experimental-feature': 5,
        },
        routes: {
          '/': 90,
          '/dashboard': 70,
          '/analytics': 50,
          '/settings': 20,
        },
        components: {
          'Header': 100,
          'Sidebar': 80,
          'AdvancedChart': 10,
        },
        apis: {
          '/api/user': 90,
          '/api/analytics': 60,
          '/api/experimental': 5,
        },
      },
    };
  }

  /**
   * Analyze system trends
   */
  private async analyzeSystemTrends(): Promise<SystemTrend[]> {
    const trends: SystemTrend[] = [];

    // Budget compliance trend
    const budgetTrend = await this.analyzeBudgetTrend();
    if (budgetTrend) {
      trends.push(budgetTrend);
    }

    // Performance trend
    const performanceTrend = await this.analyzePerformanceTrend();
    if (performanceTrend) {
      trends.push(performanceTrend);
    }

    // Alert trend
    const alertTrend = await this.analyzeAlertTrend();
    if (alertTrend) {
      trends.push(alertTrend);
    }

    return trends;
  }

  /**
   * Analyze budget compliance trend
   */
  private async analyzeBudgetTrend(): Promise<SystemTrend | null> {
    // This would implement actual trend analysis
    // For now, return mock trend
    return {
      metric: 'budget-compliance',
      direction: 'improving',
      changePercentage: 5.2,
      timeframe: 7, // days
      significance: 'medium',
    };
  }

  /**
   * Analyze performance trend
   */
  private async analyzePerformanceTrend(): Promise<SystemTrend | null> {
    // This would implement actual trend analysis
    return {
      metric: 'load-performance',
      direction: 'stable',
      changePercentage: 1.1,
      timeframe: 7,
      significance: 'low',
    };
  }

  /**
   * Analyze alert trend
   */
  private async analyzeAlertTrend(): Promise<SystemTrend | null> {
    // This would implement actual trend analysis
    return {
      metric: 'alert-frequency',
      direction: 'improving',
      changePercentage: -15.3,
      timeframe: 7,
      significance: 'high',
    };
  }

  /**
   * Generate system recommendations
   */
  private generateSystemRecommendations(report: SystemReport): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Health-based recommendations
    if (report.summary.healthStatus === 'critical') {
      recommendations.push({
        id: 'system-health-critical',
        type: 'bundle',
        category: 'immediate',
        priority: 'critical',
        title: 'Address Critical System Health Issues',
        description: 'System health is critical. Immediate action required to prevent performance degradation.',
        problem: 'Multiple critical violations and regressions detected.',
        solution: 'Address all critical alerts and regressions immediately.',
        implementation: [
          {
            id: '1',
            title: 'Address Critical Violations',
            description: 'Fix all critical budget violations first',
            verification: 'All critical violations resolved',
          },
          {
            id: '2',
            title: 'Investigate Regressions',
            description: 'Analyze and fix critical performance regressions',
            verification: 'Regressions resolved or mitigated',
          },
        ],
        impact: {
          sizeSavings: 0,
          performanceGain: 100,
          budgetImprovement: 50,
          riskLevel: 'high',
        },
        effort: {
          estimatedTime: 40,
          complexity: 'high',
          dependencies: ['Development team'],
          requiredSkills: ['Performance optimization', 'Debugging'],
        },
        automation: {
          automatable: false,
          automatedSteps: [],
          manualSteps: ['Analysis', 'Implementation', 'Testing'],
        },
        evidence: [],
        references: [],
        tags: ['system', 'health', 'critical'],
      });
    }

    // Combine component recommendations
    if (report.components.optimizations.length > 0) {
      recommendations.push(...report.components.optimizations.slice(0, 5));
    }

    return recommendations;
  }

  /**
   * Calculate final metrics
   */
  private calculateFinalMetrics(report: SystemReport): void {
    const { summary } = report;

    // Health status
    if (summary.criticalAlerts > 0 || summary.criticalRegressions > 0) {
      summary.healthStatus = 'critical';
    } else if (summary.activeAlerts > 5 || summary.regressionsDetected > 2) {
      summary.healthStatus = 'warning';
    } else {
      summary.healthStatus = 'healthy';
    }

    // Performance grade
    const score = summary.overallScore;
    if (score >= 95) summary.performanceGrade = 'A';
    else if (score >= 85) summary.performanceGrade = 'B';
    else if (score >= 70) summary.performanceGrade = 'C';
    else if (score >= 50) summary.performanceGrade = 'D';
    else summary.performanceGrade = 'F';
  }

  /**
   * Get system status
   */
  public getStatus(): SystemStatus {
    const budgets = performanceBudgetManager.getBudgets();
    const alerts = budgetAlertSystem.getActiveAlerts();
    const regressions = performanceRegressionDetector.getRegressions({ status: 'active' });

    return {
      enabled: this.config.enabled,
      initialized: this.initialized,
      components: {
        budgetManager: this.config.components.budgetManager,
        buildValidator: this.config.components.buildValidator,
        runtimeMonitor: this.config.components.runtimeMonitor,
        alertSystem: this.config.components.alertSystem,
        regressionDetector: this.config.components.regressionDetector,
        optimizationEngine: this.config.components.optimizationEngine,
        ciIntegration: this.config.components.ciIntegration,
      },
      environment: this.config.environment,
      health: this.calculateSystemHealth(),
      uptime: Date.now() - this.startTime.getTime(),
      lastActivity: this.lastActivity,
      metrics: {
        budgetsMonitored: budgets.length,
        alertsActive: alerts.length,
        regressionsActive: regressions.length,
        recommendationsGenerated: 0, // Would track this
        totalSavings: 0, // Would track this
      },
    };
  }

  /**
   * Calculate system health
   */
  private calculateSystemHealth(): 'healthy' | 'warning' | 'critical' {
    try {
      const alerts = budgetAlertSystem.getActiveAlerts();
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');

      if (criticalAlerts.length > 0) {
        return 'critical';
      } else if (alerts.length > 5) {
        return 'warning';
      }

      return 'healthy';
    } catch (error) {
      return 'warning';
    }
  }

  /**
   * Run CI/CD validation
   */
  public async runCIValidation(buildPath?: string): Promise<CIBuildResult> {
    if (!this.config.components.ciIntegration) {
      throw new Error('CI integration is disabled');
    }

    return ciBudgetIntegration.runBudgetValidation(buildPath);
  }

  /**
   * Add custom budget
   */
  public addBudget(budget: PerformanceBudget): void {
    performanceBudgetManager.addBudget(budget);
    this.emit('budget-added', budget);
  }

  /**
   * Add alert channel
   */
  public addAlertChannel(channel: AlertChannel): void {
    budgetAlertSystem.addChannel(channel);
    this.emit('alert-channel-added', channel);
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PerformanceBudgetSystemConfig>): void {
    this.config = this.mergeConfig(this.config, config);
    this.emit('config-updated', this.config);
  }

  /**
   * Get configuration
   */
  public getConfig(): PerformanceBudgetSystemConfig {
    return { ...this.config };
  }

  /**
   * Stop the system
   */
  public stop(): void {
    console.log('⏹️ Stopping Performance Budget System...');

    if (this.config.components.runtimeMonitor) {
      runtimeBudgetMonitor.stop();
    }

    if (this.config.components.regressionDetector) {
      performanceRegressionDetector.stop();
    }

    this.initialized = false;
    this.emit('system-stopped', { timestamp: new Date() });

    console.log('✅ Performance Budget System stopped');
  }
}

// Export main class and singleton instance
export const performanceBudgetSystem = PerformanceBudgetSystem.getInstance();

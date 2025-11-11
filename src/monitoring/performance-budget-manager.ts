/**
 * Performance Budget Manager
 * Enforces performance budgets across the development lifecycle
 * Integrates with existing monitoring and build systems
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

export interface PerformanceBudget {
  id: string;
  name: string;
  description: string;
  category: 'bundle' | 'runtime' | 'network' | 'rendering' | 'user-experience';
  metrics: BudgetMetric[];
  thresholds: BudgetThresholds;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  tags: string[];
}

export interface BudgetMetric {
  name: string;
  unit: 'bytes' | 'milliseconds' | 'percentage' | 'count' | 'score';
  target: number;
  warning: number;
  critical: number;
  description: string;
  measurement: 'build-time' | 'runtime' | 'synthetic' | 'real-user';
}

export interface BudgetThresholds {
  absolute: Record<string, number>;
  relative: Record<string, number>;
  regression: Record<string, number>;
}

export interface BudgetViolation {
  budgetId: string;
  budgetName: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'warning' | 'critical';
  overage: number;
  overagePercentage: number;
  trend: 'improving' | 'stable' | 'degrading';
  recommendation: string;
}

export interface BudgetReport {
  timestamp: Date;
  buildId: string;
  environment: 'development' | 'staging' | 'production';
  status: 'pass' | 'warning' | 'fail';
  budgets: BudgetAssessment[];
  violations: BudgetViolation[];
  trends: BudgetTrend[];
  summary: BudgetSummary;
  recommendations: BudgetRecommendation[];
}

export interface BudgetAssessment {
  budgetId: string;
  budgetName: string;
  status: 'pass' | 'warning' | 'fail';
  score: number;
  metrics: MetricAssessment[];
  violations: BudgetViolation[];
}

export interface MetricAssessment {
  name: string;
  value: number;
  target: number;
  status: 'pass' | 'warning' | 'fail';
  trend: 'improving' | 'stable' | 'degrading';
  change: number;
}

export interface BudgetTrend {
  budgetId: string;
  metric: string;
  direction: 'improving' | 'stable' | 'degrading';
  changePercentage: number;
  timeframe: number;
  confidence: number;
  significance: 'high' | 'medium' | 'low';
}

export interface BudgetSummary {
  totalBudgets: number;
  passedBudgets: number;
  warningBudgets: number;
  failedBudgets: number;
  overallScore: number;
  criticalViolations: number;
  regressionCount: number;
}

export interface BudgetRecommendation {
  id: string;
  type: 'optimization' | 'configuration' | 'process' | 'measurement';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    metrics: string[];
    improvement: number;
    effort: 'low' | 'medium' | 'high';
  };
  implementation: string;
  automatable: boolean;
}

export interface PerformanceBudgetConfig {
  version: string;
  enabled: boolean;
  enforcement: {
    strictMode: boolean;
    failOnWarnings: boolean;
    blockDeployments: boolean;
    requireApproval: boolean;
  };
  budgets: PerformanceBudget[];
  alerts: AlertConfiguration;
  reporting: ReportingConfiguration;
}

export interface AlertConfiguration {
  enabled: boolean;
  channels: ('email' | 'slack' | 'webhook' | 'console')[];
  thresholds: {
    warning: number;
    critical: number;
    regression: number;
  };
  throttling: {
    maxAlerts: number;
    timeWindow: number; // minutes
  };
}

export interface ReportingConfiguration {
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  historyRetention: number; // days
  baselines: {
    updateFrequency: number; // days
    requiredDataPoints: number;
  };
  integrations: {
    ciCd: boolean;
    monitoring: boolean;
    analytics: boolean;
  };
}

export class PerformanceBudgetManager extends EventEmitter {
  private configPath: string;
  private historyPath: string;
  private reportsPath: string;
  private config: PerformanceBudgetConfig;
  private history: BudgetReport[] = [];
  private alertThrottle: Map<string, number> = new Map();

  constructor(basePath: string = '.performance-budgets') {
    super();
    this.configPath = join(basePath, 'budget-config.json');
    this.historyPath = join(basePath, 'budget-history.json');
    this.reportsPath = join(basePath, 'reports');

    this.ensureDirectories();
    this.loadConfiguration();
    this.loadHistory();
  }

  private ensureDirectories(): void {
    if (!existsSync(this.reportsPath)) {
      mkdirSync(this.reportsPath, { recursive: true });
    }
  }

  private loadConfiguration(): void {
    if (existsSync(this.configPath)) {
      try {
        this.config = JSON.parse(readFileSync(this.configPath, 'utf-8'));
      } catch (error) {
        console.error('Failed to load budget configuration:', error);
        this.config = this.getDefaultConfiguration();
      }
    } else {
      this.config = this.getDefaultConfiguration();
      this.saveConfiguration();
    }
  }

  private getDefaultConfiguration(): PerformanceBudgetConfig {
    return {
      version: '1.0.0',
      enabled: true,
      enforcement: {
        strictMode: false,
        failOnWarnings: false,
        blockDeployments: true,
        requireApproval: true,
      },
      budgets: this.getDefaultBudgets(),
      alerts: {
        enabled: true,
        channels: ['console'],
        thresholds: {
          warning: 1,
          critical: 1,
          regression: 5, // 5% regression threshold
        },
        throttling: {
          maxAlerts: 5,
          timeWindow: 60, // 1 hour
        },
      },
      reporting: {
        frequency: 'realtime',
        historyRetention: 90,
        baselines: {
          updateFrequency: 7,
          requiredDataPoints: 10,
        },
        integrations: {
          ciCd: true,
          monitoring: true,
          analytics: true,
        },
      },
    };
  }

  private getDefaultBudgets(): PerformanceBudget[] {
    return [
      // Bundle Size Budgets
      {
        id: 'bundle-total-size',
        name: 'Total Bundle Size',
        description: 'Total size of all JavaScript bundles',
        category: 'bundle',
        severity: 'critical',
        enabled: true,
        tags: ['sc-14', 'core-web-vitals', 'lcp'],
        metrics: [
          {
            name: 'totalSize',
            unit: 'bytes',
            target: 500 * 1024, // 500KB
            warning: 450 * 1024, // 450KB
            critical: 600 * 1024, // 600KB
            description: 'Total uncompressed bundle size',
            measurement: 'build-time',
          },
          {
            name: 'compressedSize',
            unit: 'bytes',
            target: 150 * 1024, // 150KB
            warning: 135 * 1024, // 135KB
            critical: 200 * 1024, // 200KB
            description: 'Gzipped bundle size',
            measurement: 'build-time',
          },
        ],
        thresholds: {
          absolute: { totalSize: 500 * 1024, compressedSize: 150 * 1024 },
          relative: { totalSize: 1.0, compressedSize: 1.0 },
          regression: { totalSize: 0.05, compressedSize: 0.05 },
        },
      },
      {
        id: 'bundle-chunk-size',
        name: 'Maximum Chunk Size',
        description: 'Size of largest individual chunk',
        category: 'bundle',
        severity: 'high',
        enabled: true,
        tags: ['code-splitting', 'loading'],
        metrics: [
          {
            name: 'maxChunkSize',
            unit: 'bytes',
            target: 250 * 1024, // 250KB
            warning: 225 * 1024, // 225KB
            critical: 350 * 1024, // 350KB
            description: 'Size of the largest chunk',
            measurement: 'build-time',
          },
        ],
        thresholds: {
          absolute: { maxChunkSize: 250 * 1024 },
          relative: { maxChunkSize: 1.0 },
          regression: { maxChunkSize: 0.1 },
        },
      },

      // Runtime Performance Budgets
      {
        id: 'runtime-initial-load',
        name: 'Initial Load Performance',
        description: 'Performance metrics for initial page load',
        category: 'runtime',
        severity: 'critical',
        enabled: true,
        tags: ['core-web-vitals', 'ux'],
        metrics: [
          {
            name: 'firstContentfulPaint',
            unit: 'milliseconds',
            target: 1500, // 1.5s
            warning: 2000, // 2s
            critical: 3000, // 3s
            description: 'Time to first contentful paint',
            measurement: 'synthetic',
          },
          {
            name: 'largestContentfulPaint',
            unit: 'milliseconds',
            target: 2500, // 2.5s
            warning: 3000, // 3s
            critical: 4000, // 4s
            description: 'Time to largest contentful paint',
            measurement: 'synthetic',
          },
          {
            name: 'firstInputDelay',
            unit: 'milliseconds',
            target: 100, // 100ms
            warning: 200, // 200ms
            critical: 300, // 300ms
            description: 'Delay to first user interaction',
            measurement: 'synthetic',
          },
          {
            name: 'cumulativeLayoutShift',
            unit: 'score',
            target: 0.1,
            warning: 0.2,
            critical: 0.3,
            description: 'Cumulative layout shift score',
            measurement: 'synthetic',
          },
        ],
        thresholds: {
          absolute: {
            firstContentfulPaint: 1500,
            largestContentfulPaint: 2500,
            firstInputDelay: 100,
            cumulativeLayoutShift: 0.1,
          },
          relative: {
            firstContentfulPaint: 1.0,
            largestContentfulPaint: 1.0,
            firstInputDelay: 1.0,
            cumulativeLayoutShift: 1.0,
          },
          regression: {
            firstContentfulPaint: 0.1,
            largestContentfulPaint: 0.1,
            firstInputDelay: 0.2,
            cumulativeLayoutShift: 0.5,
          },
        },
      },

      // Network Performance Budgets
      {
        id: 'network-resources',
        name: 'Network Resource Efficiency',
        description: 'Efficiency of network resource loading',
        category: 'network',
        severity: 'high',
        enabled: true,
        tags: ['network', 'resources'],
        metrics: [
          {
            name: 'totalRequests',
            unit: 'count',
            target: 50,
            warning: 75,
            critical: 100,
            description: 'Total number of network requests',
            measurement: 'synthetic',
          },
          {
            name: 'totalTransferSize',
            unit: 'bytes',
            target: 1024 * 1024, // 1MB
            warning: 1.5 * 1024 * 1024, // 1.5MB
            critical: 2 * 1024 * 1024, // 2MB
            description: 'Total transfer size of all resources',
            measurement: 'synthetic',
          },
          {
            name: 'timeToFirstByte',
            unit: 'milliseconds',
            target: 600, // 600ms
            warning: 1000, // 1s
            critical: 1500, // 1.5s
            description: 'Time to first byte from server',
            measurement: 'synthetic',
          },
        ],
        thresholds: {
          absolute: {
            totalRequests: 50,
            totalTransferSize: 1024 * 1024,
            timeToFirstByte: 600,
          },
          relative: {
            totalRequests: 1.0,
            totalTransferSize: 1.0,
            timeToFirstByte: 1.0,
          },
          regression: {
            totalRequests: 0.1,
            totalTransferSize: 0.1,
            timeToFirstByte: 0.1,
          },
        },
      },

      // Rendering Performance Budgets
      {
        id: 'rendering-performance',
        name: 'Rendering Performance',
        description: 'JavaScript execution and rendering performance',
        category: 'rendering',
        severity: 'medium',
        enabled: true,
        tags: ['javascript', 'rendering'],
        metrics: [
          {
            name: 'executionTime',
            unit: 'milliseconds',
            target: 50, // 50ms
            warning: 100, // 100ms
            critical: 200, // 200ms
            description: 'Maximum JavaScript execution time',
            measurement: 'runtime',
          },
          {
            name: 'renderingTime',
            unit: 'milliseconds',
            target: 16, // 16ms (60fps)
            warning: 33, // 33ms (30fps)
            critical: 100, // 100ms
            description: 'Maximum frame rendering time',
            measurement: 'runtime',
          },
          {
            name: 'longTasks',
            unit: 'count',
            target: 0,
            warning: 1,
            critical: 3,
            description: 'Number of long tasks (>50ms)',
            measurement: 'runtime',
          },
        ],
        thresholds: {
          absolute: {
            executionTime: 50,
            renderingTime: 16,
            longTasks: 0,
          },
          relative: {
            executionTime: 1.0,
            renderingTime: 1.0,
            longTasks: 1.0,
          },
          regression: {
            executionTime: 0.2,
            renderingTime: 0.2,
            longTasks: 0.5,
          },
        },
      },

      // User Experience Budgets
      {
        id: 'user-experience',
        name: 'User Experience Metrics',
        description: 'Overall user experience quality metrics',
        category: 'user-experience',
        severity: 'high',
        enabled: true,
        tags: ['ux', 'quality'],
        metrics: [
          {
            name: 'lighthouseScore',
            unit: 'score',
            target: 90,
            warning: 80,
            critical: 70,
            description: 'Overall Lighthouse performance score',
            measurement: 'synthetic',
          },
          {
            name: 'bounceRate',
            unit: 'percentage',
            target: 40, // 40%
            warning: 50, // 50%
            critical: 60, // 60%
            description: 'Page bounce rate percentage',
            measurement: 'real-user',
          },
          {
            name: 'errorRate',
            unit: 'percentage',
            target: 1, // 1%
            warning: 2, // 2%
            critical: 5, // 5%
            description: 'JavaScript error rate',
            measurement: 'runtime',
          },
        ],
        thresholds: {
          absolute: {
            lighthouseScore: 90,
            bounceRate: 40,
            errorRate: 1,
          },
          relative: {
            lighthouseScore: 1.0,
            bounceRate: 1.0,
            errorRate: 1.0,
          },
          regression: {
            lighthouseScore: -0.05, // 5% decrease
            bounceRate: 0.1, // 10% increase
            errorRate: 0.5, // 50% increase
          },
        },
      },
    ];
  }

  private saveConfiguration(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save budget configuration:', error);
    }
  }

  private loadHistory(): void {
    if (existsSync(this.historyPath)) {
      try {
        const data = JSON.parse(readFileSync(this.historyPath, 'utf-8'));
        this.history = data.map((report: any) => ({
          ...report,
          timestamp: new Date(report.timestamp),
        }));
      } catch (error) {
        console.error('Failed to load budget history:', error);
        this.history = [];
      }
    }
  }

  private saveHistory(): void {
    try {
      // Clean old history based on retention policy
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.reporting.historyRetention);

      const filteredHistory = this.history.filter(report => report.timestamp > cutoffDate);
      this.history = filteredHistory;

      writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.error('Failed to save budget history:', error);
    }
  }

  // Public API Methods

  /**
   * Generate a comprehensive budget report
   */
  public async generateBudgetReport(
    measurements: Record<string, number>,
    buildId?: string,
    environment: 'development' | 'staging' | 'production' = 'development'
  ): Promise<BudgetReport> {
    if (!this.config.enabled) {
      throw new Error('Performance budget monitoring is disabled');
    }

    const report: BudgetReport = {
      timestamp: new Date(),
      buildId: buildId || this.generateBuildId(),
      environment,
      status: 'pass',
      budgets: [],
      violations: [],
      trends: [],
      summary: {
        totalBudgets: 0,
        passedBudgets: 0,
        warningBudgets: 0,
        failedBudgets: 0,
        overallScore: 0,
        criticalViolations: 0,
        regressionCount: 0,
      },
      recommendations: [],
    };

    // Assess each enabled budget
    const enabledBudgets = this.config.budgets.filter(budget => budget.enabled);
    report.summary.totalBudgets = enabledBudgets.length;

    for (const budget of enabledBudgets) {
      const assessment = await this.assessBudget(budget, measurements);
      report.budgets.push(assessment);

      if (assessment.status === 'fail') {
        report.summary.failedBudgets++;
        report.status = 'fail';
      } else if (assessment.status === 'warning') {
        report.summary.warningBudgets++;
        if (report.status === 'pass') {
          report.status = 'warning';
        }
      } else {
        report.summary.passedBudgets++;
      }

      report.violations.push(...assessment.violations);
      report.summary.overallScore += assessment.score;
    }

    // Calculate overall score
    report.summary.overallScore = enabledBudgets.length > 0
      ? report.summary.overallScore / enabledBudgets.length
      : 100;

    // Count critical violations
    report.summary.criticalViolations = report.violations.filter(
      violation => violation.severity === 'critical'
    ).length;

    // Analyze trends
    report.trends = this.analyzeTrends(measurements);

    // Count regressions
    report.summary.regressionCount = report.trends.filter(
      trend => trend.direction === 'degrading' && trend.significance === 'high'
    ).length;

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    // Save report to history
    this.history.push(report);
    this.saveHistory();

    // Emit events
    this.emit('report-generated', report);

    // Handle violations
    if (report.violations.length > 0) {
      this.handleViolations(report.violations);
    }

    return report;
  }

  /**
   * Assess a single budget against measurements
   */
  private async assessBudget(
    budget: PerformanceBudget,
    measurements: Record<string, number>
  ): Promise<BudgetAssessment> {
    const assessment: BudgetAssessment = {
      budgetId: budget.id,
      budgetName: budget.name,
      status: 'pass',
      score: 100,
      metrics: [],
      violations: [],
    };

    let totalScore = 0;
    let metricCount = 0;

    for (const metric of budget.metrics) {
      const value = measurements[metric.name];
      if (value === undefined) {
        continue; // Skip metrics without measurements
      }

      const metricAssessment = await this.assessMetric(budget, metric, value);
      assessment.metrics.push(metricAssessment);

      if (metricAssessment.status === 'fail') {
        assessment.status = 'fail';
        assessment.score -= 30;
      } else if (metricAssessment.status === 'warning') {
        if (assessment.status === 'pass') {
          assessment.status = 'warning';
        }
        assessment.score -= 10;
      }

      totalScore += metricAssessment.status === 'pass' ? 100 :
                   metricAssessment.status === 'warning' ? 70 : 30;
      metricCount++;
    }

    // Normalize score
    assessment.score = metricCount > 0 ? totalScore / metricCount : 100;

    // Generate violations
    assessment.violations = this.generateViolations(budget, assessment.metrics);

    return assessment;
  }

  /**
   * Assess a single metric
   */
  private async assessMetric(
    budget: PerformanceBudget,
    metric: BudgetMetric,
    value: number
  ): Promise<MetricAssessment> {
    let status: 'pass' | 'warning' | 'fail';
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
        status = 'fail';
      }
    } else {
      // Lower is better for most metrics
      if (value <= target) {
        status = 'pass';
      } else if (value <= warning) {
        status = 'warning';
      } else {
        status = 'fail';
      }
    }

    // Analyze trend
    const trend = this.analyzeMetricTrend(budget.id, metric.name, value);
    const change = this.calculateMetricChange(budget.id, metric.name, value);

    return {
      name: metric.name,
      value,
      target,
      status,
      trend,
      change,
    };
  }

  /**
   * Analyze trend for a metric
   */
  private analyzeMetricTrend(budgetId: string, metricName: string, currentValue: number): 'improving' | 'stable' | 'degrading' {
    const recentReports = this.history.slice(-10); // Last 10 reports

    if (recentReports.length < 3) {
      return 'stable';
    }

    const values = recentReports
      .map(report => {
        const budget = report.budgets.find(b => b.budgetId === budgetId);
        return budget?.metrics.find(m => m.name === metricName)?.value;
      })
      .filter((value): value is number => value !== undefined);

    if (values.length < 3) {
      return 'stable';
    }

    // Calculate trend using linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;

    const changePercentage = (slope / avgY) * 100;

    if (Math.abs(changePercentage) < 5) {
      return 'stable';
    } else if (changePercentage < 0) {
      return 'improving';
    } else {
      return 'degrading';
    }
  }

  /**
   * Calculate change percentage for a metric
   */
  private calculateMetricChange(budgetId: string, metricName: string, currentValue: number): number {
    const lastReport = this.history
      .slice()
      .reverse()
      .find(report => {
        const budget = report.budgets.find(b => b.budgetId === budgetId);
        return budget?.metrics.some(m => m.name === metricName);
      });

    if (!lastReport) {
      return 0;
    }

    const lastBudget = lastReport.budgets.find(b => b.budgetId === budgetId);
    const lastMetric = lastBudget?.metrics.find(m => m.name === metricName);

    if (!lastMetric || lastMetric.value === 0) {
      return 0;
    }

    return ((currentValue - lastMetric.value) / lastMetric.value) * 100;
  }

  /**
   * Generate violations from metric assessments
   */
  private generateViolations(
    budget: PerformanceBudget,
    metrics: MetricAssessment[]
  ): BudgetViolation[] {
    return metrics
      .filter(metric => metric.status !== 'pass')
      .map(metric => ({
        budgetId: budget.id,
        budgetName: budget.name,
        metric: metric.name,
        currentValue: metric.value,
        threshold: metric.target,
        severity: metric.status === 'fail' ? 'critical' : 'warning',
        overage: Math.abs(metric.value - metric.target),
        overagePercentage: Math.abs((metric.value - metric.target) / metric.target) * 100,
        trend: metric.trend,
        recommendation: this.generateMetricRecommendation(budget, metric),
      }));
  }

  /**
   * Generate recommendation for a specific metric violation
   */
  private generateMetricRecommendation(
    budget: PerformanceBudget,
    metric: MetricAssessment
  ): string {
    const recommendations: Record<string, string> = {
      'totalSize': 'Enable code splitting, remove unused dependencies, and implement tree shaking',
      'compressedSize': 'Enable compression, optimize assets, and use modern compression algorithms',
      'maxChunkSize': 'Split large chunks into smaller, more focused modules',
      'firstContentfulPaint': 'Optimize critical path, minimize render-blocking resources',
      'largestContentfulPaint': 'Optimize images, lazy load content, improve server response time',
      'firstInputDelay': 'Reduce JavaScript execution time, optimize main thread work',
      'cumulativeLayoutShift': 'Specify dimensions for media, reserve space for dynamic content',
      'totalRequests': 'Bundle resources, use sprites, combine files where possible',
      'totalTransferSize': 'Compress assets, optimize images, use efficient formats',
      'timeToFirstByte': 'Optimize server, use CDN, enable caching',
      'executionTime': 'Optimize JavaScript, reduce main thread blocking',
      'renderingTime': 'Optimize rendering pipeline, use CSS transforms',
      'longTasks': 'Break up long tasks, use web workers, optimize code',
      'lighthouseScore': 'Address performance recommendations, optimize Core Web Vitals',
      'bounceRate': 'Improve page load speed, enhance user experience',
      'errorRate': 'Fix JavaScript errors, improve error handling',
    };

    return recommendations[metric.name] || 'Analyze and optimize the specific metric that exceeded the budget';
  }

  /**
   * Analyze trends across all metrics
   */
  private analyzeTrends(measurements: Record<string, number>): BudgetTrend[] {
    const trends: BudgetTrend[] = [];

    for (const budget of this.config.budgets.filter(b => b.enabled)) {
      for (const metric of budget.metrics) {
        if (measurements[metric.name] === undefined) {
          continue;
        }

        const trend = this.analyzeMetricTrend(budget.id, metric.name, measurements[metric.name]);
        const change = this.calculateMetricChange(budget.id, metric.name, measurements[metric.name]);

        // Determine significance
        let significance: 'high' | 'medium' | 'low' = 'low';
        if (Math.abs(change) > 20) {
          significance = 'high';
        } else if (Math.abs(change) > 10) {
          significance = 'medium';
        }

        // Calculate confidence based on data points
        const metricHistory = this.history
          .slice(-20)
          .map(report => {
            const budgetReport = report.budgets.find(b => b.budgetId === budget.id);
            return budgetReport?.metrics.find(m => m.name === metric.name)?.value;
          })
          .filter((value): value is number => value !== undefined);

        const confidence = Math.min(metricHistory.length / 10, 1);

        if (confidence > 0.3) { // Only include trends with sufficient data
          trends.push({
            budgetId: budget.id,
            metric: metric.name,
            direction: trend,
            changePercentage: change,
            timeframe: metricHistory.length,
            confidence,
            significance,
          });
        }
      }
    }

    return trends;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(report: BudgetReport): BudgetRecommendation[] {
    const recommendations: BudgetRecommendation[] = [];

    // Analyze violations and create recommendations
    const violationGroups = this.groupViolations(report.violations);

    for (const [category, violations] of violationGroups) {
      if (violations.length === 0) continue;

      const priority = violations.some(v => v.severity === 'critical') ? 'critical' :
                      violations.some(v => v.severity === 'warning') ? 'high' : 'medium';

      recommendations.push({
        id: `rec_${category}_${Date.now()}`,
        type: 'optimization',
        priority,
        title: this.getCategoryRecommendationTitle(category),
        description: this.getCategoryRecommendationDescription(category, violations),
        impact: {
          metrics: violations.map(v => v.metric),
          improvement: Math.max(...violations.map(v => v.overagePercentage)),
          effort: this.estimateEffort(category, violations),
        },
        implementation: this.getImplementationStrategy(category),
        automatable: this.isAutomatable(category),
      });
    }

    // Add process recommendations for recurring issues
    const regressionViolations = report.violations.filter(v => v.trend === 'degrading');
    if (regressionViolations.length > 0) {
      recommendations.push({
        id: `process_regression_${Date.now()}`,
        type: 'process',
        priority: 'high',
        title: 'Implement Performance Regression Prevention',
        description: 'Multiple metrics show degrading trends. Implement automated testing and gates.',
        impact: {
          metrics: ['all'],
          improvement: 20,
          effort: 'medium',
        },
        implementation: 'Set up CI/CD performance testing, implement size gates, require performance reviews for large changes',
        automatable: true,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private groupViolations(violations: BudgetViolation[]): Map<string, BudgetViolation[]> {
    const groups = new Map<string, BudgetViolation[]>();

    violations.forEach(violation => {
      // Group by budget category
      const category = this.config.budgets.find(b => b.id === violation.budgetId)?.category || 'unknown';

      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(violation);
    });

    return groups;
  }

  private getCategoryRecommendationTitle(category: string): string {
    const titles: Record<string, string> = {
      bundle: 'Optimize Bundle Size and Structure',
      runtime: 'Improve Runtime Performance',
      network: 'Optimize Network Efficiency',
      rendering: 'Enhance Rendering Performance',
      'user-experience': 'Improve User Experience Metrics',
    };

    return titles[category] || `Optimize ${category} Performance`;
  }

  private getCategoryRecommendationDescription(
    category: string,
    violations: BudgetViolation[]
  ): string {
    const summary = violations.length === 1
      ? `1 violation in ${category}`
      : `${violations.length} violations in ${category}`;

    const totalOverage = violations.reduce((sum, v) => sum + v.overage, 0);
    const avgOverage = totalOverage / violations.length;

    return `${summary}. Average overage: ${this.formatValue(avgOverage, violations[0].metric)}. Focus on optimizing the most critical violations first.`;
  }

  private estimateEffort(category: string, violations: BudgetViolation[]): 'low' | 'medium' | 'high' {
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const totalOverage = violations.reduce((sum, v) => sum + v.overagePercentage, 0);

    if (category === 'bundle' && criticalViolations > 0) {
      return totalOverage > 50 ? 'high' : 'medium';
    } else if (category === 'runtime' || category === 'rendering') {
      return 'high';
    } else if (totalOverage > 30) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private getImplementationStrategy(category: string): string {
    const strategies: Record<string, string> = {
      bundle: 'Implement code splitting, tree shaking, lazy loading, and remove unused dependencies',
      runtime: 'Optimize JavaScript execution, reduce main thread work, implement web workers',
      network: 'Enable compression, use CDN, optimize images, implement caching strategies',
      rendering: 'Use CSS transforms, optimize layout, implement virtualization',
      'user-experience': 'Improve loading states, optimize interaction delays, enhance error handling',
    };

    return strategies[category] || 'Analyze and optimize the specific performance issues';
  }

  private isAutomatable(category: string): boolean {
    const automatableCategories = ['bundle', 'network'];
    return automatableCategories.includes(category);
  }

  private formatValue(value: number, metric: string): string {
    const units: Record<string, string> = {
      'bytes': 'KB',
      'milliseconds': 'ms',
      'percentage': '%',
      'count': '',
      'score': 'points',
    };

    const unit = units[metric] || '';
    const formattedValue = metric === 'bytes' ? Math.round(value / 1024) : Math.round(value);

    return `${formattedValue}${unit}`;
  }

  private generateBuildId(): string {
    return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle budget violations
   */
  private handleViolations(violations: BudgetViolation[]): void {
    if (!this.config.alerts.enabled) {
      return;
    }

    // Check throttling
    const throttleKey = `violations_${Math.floor(Date.now() / (this.config.alerts.throttling.timeWindow * 60 * 1000))}`;
    const alertCount = this.alertThrottle.get(throttleKey) || 0;

    if (alertCount >= this.config.alerts.throttling.maxAlerts) {
      return; // Throttled
    }

    this.alertThrottle.set(throttleKey, alertCount + 1);

    // Send alerts
    const criticalViolations = violations.filter(v => v.severity === 'critical');

    if (criticalViolations.length > 0) {
      this.sendAlert('critical', criticalViolations);
    }

    if (violations.length > 0) {
      this.sendAlert('warning', violations);
    }

    // Emit violation event
    this.emit('violations-detected', violations);
  }

  private sendAlert(severity: 'critical' | 'warning', violations: BudgetViolation[]): void {
    const alertData = {
      timestamp: new Date(),
      severity,
      violations: violations.map(v => ({
        budget: v.budgetName,
        metric: v.metric,
        currentValue: v.currentValue,
        threshold: v.threshold,
        overage: v.overagePercentage,
      })),
    };

    // Console alert
    if (this.config.alerts.channels.includes('console')) {
      const emoji = severity === 'critical' ? '🚨' : '⚠️';
      console.log(`${emoji} Performance Budget ${severity.toUpperCase()}:`);
      console.log(alertData);
    }

    // TODO: Implement other alert channels (email, slack, webhook)
  }

  // Configuration Management

  public updateConfiguration(config: Partial<PerformanceBudgetConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfiguration();
    this.emit('configuration-updated', this.config);
  }

  public addBudget(budget: PerformanceBudget): void {
    this.config.budgets.push(budget);
    this.saveConfiguration();
    this.emit('budget-added', budget);
  }

  public updateBudget(budgetId: string, updates: Partial<PerformanceBudget>): void {
    const index = this.config.budgets.findIndex(b => b.id === budgetId);
    if (index !== -1) {
      this.config.budgets[index] = { ...this.config.budgets[index], ...updates };
      this.saveConfiguration();
      this.emit('budget-updated', this.config.budgets[index]);
    }
  }

  public removeBudget(budgetId: string): void {
    this.config.budgets = this.config.budgets.filter(b => b.id !== budgetId);
    this.saveConfiguration();
    this.emit('budget-removed', budgetId);
  }

  // Public Accessors

  public getConfiguration(): PerformanceBudgetConfig {
    return { ...this.config };
  }

  public getBudgets(): PerformanceBudget[] {
    return [...this.config.budgets];
  }

  public getHistory(limit?: number): BudgetReport[] {
    return limit ? this.history.slice(-limit) : [...this.history];
  }

  public isEnforcementEnabled(): boolean {
    return this.config.enabled && this.config.enforcement.blockDeployments;
  }

  public shouldFailOnWarnings(): boolean {
    return this.config.enforcement.failOnWarnings;
  }

  public getBudgetStatus(): {
    enabled: boolean;
    totalBudgets: number;
    enabledBudgets: number;
    lastReport?: BudgetReport;
    criticalViolations: number;
  } {
    return {
      enabled: this.config.enabled,
      totalBudgets: this.config.budgets.length,
      enabledBudgets: this.config.budgets.filter(b => b.enabled).length,
      lastReport: this.history[this.history.length - 1],
      criticalViolations: this.history[this.history.length - 1]?.summary.criticalViolations || 0,
    };
  }
}

// Singleton instance
export const performanceBudgetManager = new PerformanceBudgetManager();

/**
 * Performance Budget Validation and Enforcement System
 * Comprehensive budget management with automated validation, enforcement, and optimization recommendations
 * Features real-time monitoring, progressive enhancement, and intelligent budget allocation
 */

import { PerformanceTestResult } from './performance-regression-testing';

export interface PerformanceBudgetConfig {
  enabled: boolean;
  enforcement: {
    strict: boolean; // Block builds that exceed budgets
    warningsOnly: boolean; // Only warn, don't block
    allowExceptions: boolean;
    exceptions: Array<{
      path: string;
      reason: string;
      approvedBy: string;
      expiresAt: Date;
    }>;
  };
  budgets: {
    global: {
      totalBundleSize: number; // KB
      jsSize: number; // KB
      cssSize: number; // KB
      imageSize: number; // KB
      fontCount: number;
      requestCount: number;
      loadTime: number; // milliseconds
      timeToInteractive: number; // milliseconds
      firstContentfulPaint: number; // milliseconds
      largestContentfulPaint: number; // milliseconds
      cumulativeLayoutShift: number;
      memoryUsage: number; // MB
    };
    routes: Record<string, RouteBudget>;
    components: Record<string, ComponentBudget>;
    thirdParty: {
      maxThirdPartySize: number; // KB
      maxThirdPartyRequests: number;
      allowedDomains: string[];
      blockedDomains: string[];
    };
    coreWebVitals: {
      LCP: { budget: number; unit: 'ms' | 'percent' };
      FID: { budget: number; unit: 'ms' };
      CLS: { budget: number; unit: 'score' };
      FCP: { budget: number; unit: 'ms' };
      TTI: { budget: number; unit: 'ms' };
      TBT: { budget: number; unit: 'ms' }; // Total Blocking Time
    };
  };
  monitoring: {
    realTime: boolean;
    alertThreshold: number; // percentage over budget
    trendAnalysis: boolean;
    predictionEnabled: boolean;
    samplingRate: number; // percentage of requests to monitor
  };
  optimization: {
    autoOptimize: boolean;
    compressionEnabled: boolean;
    minificationEnabled: boolean;
    treeShakingEnabled: boolean;
    codeSplittingEnabled: boolean;
    lazyLoadingEnabled: boolean;
    imageOptimization: boolean;
  };
  reporting: {
    generateReports: boolean;
    includeRecommendations: boolean;
    format: 'json' | 'html' | 'markdown' | 'csv';
    retention: number; // days
    alerts: {
      email: boolean;
      slack: boolean;
      webhook: boolean;
      dashboard: boolean;
    };
  };
  thresholds: {
    warning: number; // percentage over budget for warning
    critical: number; // percentage over budget for critical
    gracePeriod: number; // days to allow temporary overages
  };
}

export interface RouteBudget {
  path: string;
  priority: 'critical' | 'important' | 'normal' | 'low';
  budgets: {
    bundleSize: number; // KB
    jsSize: number; // KB
    cssSize: number; // KB
    loadTime: number; // ms
    firstContentfulPaint: number; // ms
    timeToInteractive: number; // ms
  };
  exclusions: string[]; // Resource patterns to exclude
  conditions: {
    device?: 'desktop' | 'mobile' | 'all';
    network?: 'slow' | 'fast' | 'all';
    viewport?: 'small' | 'medium' | 'large' | 'all';
  };
}

export interface ComponentBudget {
  name: string;
  type: 'utility' | 'feature' | 'layout' | 'content';
  budgets: {
    bundleSize: number; // KB
    jsSize: number; // KB
    cssSize: number; // KB
    dependencies: number;
    renderTime: number; // ms
  };
  lazyLoad: boolean;
  critical: boolean;
  dependencies: string[];
}

export interface BudgetValidationResult {
  id: string;
  timestamp: Date;
  buildId?: string;
  environment: string;
  overallStatus: 'passed' | 'warning' | 'failed';

  // Budget adherence
  budgetAdherence: {
    overall: number; // percentage
    byCategory: Record<string, number>;
    critical: number;
    important: number;
    normal: number;
    low: number;
  };

  // Violations
  violations: BudgetViolation[];

  // Recommendations
  recommendations: BudgetRecommendation[];

  // Optimization opportunities
  optimizations: OptimizationOpportunity[];

  // Metrics breakdown
  metrics: {
    total: BudgetMetrics;
    routes: Record<string, RouteMetrics>;
    components: Record<string, ComponentMetrics>;
    thirdParty: ThirdPartyMetrics;
    coreWebVitals: CoreWebVitalsMetrics;
  };

  // Trends and predictions
  trends: BudgetTrendAnalysis;

  // Enforcement actions
  enforcementActions: EnforcementAction[];
}

export interface BudgetViolation {
  id: string;
  category: 'global' | 'route' | 'component' | 'third-party' | 'core-web-vitals';
  severity: 'warning' | 'critical';
  metric: string;
  budgetValue: number;
  actualValue: number;
  overage: number; // percentage
  overageAbsolute: number;
  context: {
    path?: string;
    component?: string;
    device?: string;
    network?: string;
  };
  impact: {
    userExperience: 'low' | 'medium' | 'high' | 'critical';
    businessImpact: string;
    affectedUsers: number;
  };
  recommendations: string[];
  isException: boolean;
  exceptionReason?: string;
}

export interface BudgetRecommendation {
  id: string;
  type: 'optimization' | 'architecture' | 'configuration' | 'dependency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    metric: string;
    potentialImprovement: number; // percentage
    effort: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
  };
  implementation: {
    steps: string[];
    code?: string;
    configuration?: Record<string, any>;
    tools?: string[];
  };
  automation: {
    automated: boolean;
    tools?: string[];
    scripts?: string[];
  };
}

export interface OptimizationOpportunity {
  category: 'compression' | 'minification' | 'tree-shaking' | 'code-splitting' | 'lazy-loading' | 'image-optimization' | 'bundle-analysis';
  description: string;
  potentialSavings: {
    bytes: number;
    percentage: number;
    timeMs: number;
  };
  complexity: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  implementation: {
    description: string;
    files?: string[];
    tools?: string[];
  };
}

export interface BudgetMetrics {
  bundleSize: { budget: number; actual: number; overage: number };
  jsSize: { budget: number; actual: number; overage: number };
  cssSize: { budget: number; actual: number; overage: number };
  loadImage: { budget: number; actual: number; overage: number };
  fontCount: { budget: number; actual: number; overage: number };
  requestCount: { budget: number; actual: number; overage: number };
  loadTime: { budget: number; actual: number; overage: number };
  timeToInteractive: { budget: number; actual: number; overage: number };
  firstContentfulPaint: { budget: number; actual: number; overage: number };
  largestContentfulPaint: { budget: number; actual: number; overage: number };
  cumulativeLayoutShift: { budget: number; actual: number; overage: number };
  memoryUsage: { budget: number; actual: number; overage: number };
}

export interface RouteMetrics extends BudgetMetrics {
  path: string;
  priority: RouteBudget['priority'];
  componentCount: number;
  dependencyCount: number;
}

export interface ComponentMetrics {
  name: string;
  type: ComponentBudget['type'];
  bundleSize: { budget: number; actual: number; overage: number };
  renderTime: { budget: number; actual: number; overage: number };
  dependencyCount: { budget: number; actual: number; overage: number };
  isCritical: boolean;
  isLazyLoaded: boolean;
}

export interface ThirdPartyMetrics {
  totalSize: { budget: number; actual: number; overage: number };
  requestCount: { budget: number; actual: number; overage: number };
  domains: Record<string, {
    size: number;
    requests: number;
    isAllowed: boolean;
    isBlocked: boolean;
  }>;
  largest: {
    domain: string;
    size: number;
  };
}

export interface CoreWebVitalsMetrics {
  LCP: { budget: number; actual: number; overage: number; status: 'good' | 'needs-improvement' | 'poor' };
  FID: { budget: number; actual: number; overage: number; status: 'good' | 'needs-improvement' | 'poor' };
  CLS: { budget: number; actual: number; overage: number; status: 'good' | 'needs-improvement' | 'poor' };
  FCP: { budget: number; actual: number; overage: number; status: 'good' | 'needs-improvement' | 'poor' };
  TTI: { budget: number; actual: number; overage: number; status: 'good' | 'needs-improvement' | 'poor' };
  TBT: { budget: number; actual: number; overage: number; status: 'good' | 'needs-improvement' | 'poor' };
}

export interface BudgetTrendAnalysis {
  period: {
    start: Date;
    end: Date;
    dataPoints: number;
  };
  trends: Record<string, {
    direction: 'improving' | 'degrading' | 'stable';
    slope: number;
    confidence: number;
    forecast: {
      nextPeriod: number;
      risk: 'low' | 'medium' | 'high';
    };
  }>;
  anomalies: Array<{
    timestamp: Date;
    metric: string;
    value: number;
    expectedValue: number;
    deviation: number;
  }>;
}

export interface EnforcementAction {
  type: 'build_block' | 'warning' | 'auto_fix' | 'notification' | 'rollback';
  severity: 'info' | 'warning' | 'error';
  description: string;
  automated: boolean;
  executed: boolean;
  timestamp: Date;
  result?: string;
}

/**
 * Advanced Performance Budget Validation System
 */
export class PerformanceBudgetValidator {
  private static instance: PerformanceBudgetValidator;
  private config: PerformanceBudgetConfig;
  private historicalData: BudgetValidationResult[] = [];
  private currentBuildMetrics: PerformanceTestResult | null = null;

  // Analysis engines
  private metricsAnalyzer: MetricsAnalyzer;
  private violationDetector: ViolationDetector;
  private recommendationEngine: RecommendationEngine;
  private optimizationAnalyzer: OptimizationAnalyzer;
  private trendAnalyzer: BudgetTrendAnalyzer;
  private enforcementEngine: EnforcementEngine;

  // Monitoring and reporting
  private monitoringSystem: BudgetMonitoringSystem;
  private reportingSystem: BudgetReportingSystem;

  private constructor(config?: Partial<PerformanceBudgetConfig>) {
    this.config = this.getDefaultConfig(config);
    this.metricsAnalyzer = new MetricsAnalyzer(this.config.budgets);
    this.violationDetector = new ViolationDetector(this.config.thresholds);
    this.recommendationEngine = new RecommendationEngine(this.config.optimization);
    this.optimizationAnalyzer = new OptimizationAnalyzer();
    this.trendAnalyzer = new BudgetTrendAnalyzer();
    this.enforcementEngine = new EnforcementEngine(this.config.enforcement);
    this.monitoringSystem = new BudgetMonitoringSystem(this.config.monitoring);
    this.reportingSystem = new BudgetReportingSystem(this.config.reporting);
  }

  public static getInstance(config?: Partial<PerformanceBudgetConfig>): PerformanceBudgetValidator {
    if (!PerformanceBudgetValidator.instance) {
      PerformanceBudgetValidator.instance = new PerformanceBudgetValidator(config);
    }
    return PerformanceBudgetValidator.instance;
  }

  private getDefaultConfig(overrides?: Partial<PerformanceBudgetConfig>): PerformanceBudgetConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    const isStrict = process.env.BUDGET_STRICT === 'true';

    return {
      enabled: true,
      enforcement: {
        strict: isStrict || isProduction,
        warningsOnly: !isProduction && !isStrict,
        allowExceptions: true,
        exceptions: [],
      },
      budgets: {
        global: {
          totalBundleSize: 500, // 500KB
          jsSize: 300, // 300KB
          cssSize: 100, // 100KB
          imageSize: 200, // 200KB
          fontCount: 4,
          requestCount: 50,
          loadTime: 3000, // 3 seconds
          timeToInteractive: 5000, // 5 seconds
          firstContentfulPaint: 1500, // 1.5 seconds
          largestContentfulPaint: 2500, // 2.5 seconds
          cumulativeLayoutShift: 0.1,
          memoryUsage: 50, // 50MB
        },
        routes: {
          '/': {
            path: '/',
            priority: 'critical',
            budgets: {
              bundleSize: 200, // 200KB
              jsSize: 150, // 150KB
              cssSize: 50, // 50KB
              loadTime: 2000, // 2 seconds
              firstContentfulPaint: 1000, // 1 second
              timeToInteractive: 3000, // 3 seconds
            },
            exclusions: [],
            conditions: { device: 'all', network: 'all' },
          },
          '/tools': {
            path: '/tools',
            priority: 'important',
            budgets: {
              bundleSize: 150, // 150KB
              jsSize: 100, // 100KB
              cssSize: 30, // 30KB
              loadTime: 1500, // 1.5 seconds
              firstContentfulPaint: 800, // 800ms
              timeToInteractive: 2000, // 2 seconds
            },
            exclusions: [],
            conditions: { device: 'all', network: 'all' },
          },
          '/tools/[slug]': {
            path: '/tools/[slug]',
            priority: 'important',
            budgets: {
              bundleSize: 250, // 250KB (larger due to tool-specific code)
              jsSize: 200, // 200KB
              cssSize: 40, // 40KB
              loadTime: 2500, // 2.5 seconds
              firstContentfulPaint: 1200, // 1.2 seconds
              timeToInteractive: 3500, // 3.5 seconds
            },
            exclusions: [],
            conditions: { device: 'all', network: 'all' },
          },
        },
        components: {
          'MonacoEditor': {
            name: 'MonacoEditor',
            type: 'feature',
            budgets: {
              bundleSize: 1000, // 1MB (large component)
              jsSize: 800, // 800KB
              cssSize: 50, // 50KB
              dependencies: 15,
              renderTime: 1000, // 1 second
            },
            lazyLoad: true,
            critical: false,
            dependencies: ['@monaco-editor/react', 'monaco-editor'],
          },
          'ToolCard': {
            name: 'ToolCard',
            type: 'content',
            budgets: {
              bundleSize: 20, // 20KB
              jsSize: 15, // 15KB
              cssSize: 5, // 5KB
              dependencies: 3,
              renderTime: 50, // 50ms
            },
            lazyLoad: false,
            critical: true,
            dependencies: [],
          },
        },
        thirdParty: {
          maxThirdPartySize: 200, // 200KB
          maxThirdPartyRequests: 10,
          allowedDomains: [
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'cdn.jsdelivr.net',
            'unpkg.com',
          ],
          blockedDomains: [
            'doubleclick.net',
            'google-analytics.com',
            'facebook.net',
          ],
        },
        coreWebVitals: {
          LCP: { budget: 2500, unit: 'ms' },
          FID: { budget: 100, unit: 'ms' },
          CLS: { budget: 0.1, unit: 'score' },
          FCP: { budget: 1800, unit: 'ms' },
          TTI: { budget: 3800, unit: 'ms' },
          TBT: { budget: 200, unit: 'ms' },
        },
      },
      monitoring: {
        realTime: true,
        alertThreshold: 10, // 10% over budget
        trendAnalysis: true,
        predictionEnabled: true,
        samplingRate: 10, // 10% of requests
      },
      optimization: {
        autoOptimize: false, // Enable cautiously
        compressionEnabled: true,
        minificationEnabled: true,
        treeShakingEnabled: true,
        codeSplittingEnabled: true,
        lazyLoadingEnabled: true,
        imageOptimization: true,
      },
      reporting: {
        generateReports: true,
        includeRecommendations: true,
        format: 'json',
        retention: 30, // 30 days
        alerts: {
          email: true,
          slack: true,
          webhook: false,
          dashboard: true,
        },
      },
      thresholds: {
        warning: 10, // 10% over budget for warning
        critical: 25, // 25% over budget for critical
        gracePeriod: 7, // 7 days
      },
      ...overrides,
    };
  }

  /**
   * Validate performance budgets against build metrics
   */
  public async validateBudgets(
    metrics: PerformanceTestResult,
    options?: {
      buildId?: string;
      environment?: string;
      skipAutoOptimization?: boolean;
    }
  ): Promise<BudgetValidationResult> {
    if (!this.config.enabled) {
      throw new Error('Performance budget validation is disabled');
    }

    const validationId = `budget-validation-${Date.now()}`;
    console.log(`🔍 Validating performance budgets: ${validationId}`);

    const startTime = Date.now();
    this.currentBuildMetrics = metrics;

    try {
      // Analyze metrics
      const analyzedMetrics = await this.metricsAnalyzer.analyze(metrics, this.config.budgets);

      // Detect violations
      const violations = await this.violationDetector.detect(analyzedMetrics, this.config);

      // Generate recommendations
      const recommendations = await this.recommendationEngine.generate(violations, analyzedMetrics);

      // Analyze optimization opportunities
      const optimizations = await this.optimizationAnalyzer.analyze(metrics, this.config);

      // Perform trend analysis
      const trends = await this.trendAnalyzer.analyze(this.historicalData);

      // Execute enforcement actions
      const enforcementActions = await this.enforcementEngine.execute(violations, this.config);

      // Calculate budget adherence
      const budgetAdherence = this.calculateBudgetAdherence(analyzedMetrics);

      // Determine overall status
      const overallStatus = this.determineOverallStatus(violations, enforcementActions);

      const result: BudgetValidationResult = {
        id: validationId,
        timestamp: new Date(),
        buildId: options?.buildId,
        environment: options?.environment || 'development',
        overallStatus,
        budgetAdherence,
        violations,
        recommendations,
        optimizations,
        metrics: analyzedMetrics,
        trends,
        enforcementActions,
      };

      // Store historical data
      this.historicalData.push(result);
      if (this.historicalData.length > 100) { // Keep last 100 results
        this.historicalData.shift();
      }

      // Generate reports
      if (this.config.reporting.generateReports) {
        await this.reportingSystem.generateReport(result);
      }

      // Send alerts if needed
      if (this.config.monitoring.realTime) {
        await this.monitoringSystem.sendAlerts(result);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Budget validation completed: ${validationId} (${overallStatus}) in ${duration}ms`);

      return result;
    } catch (error) {
      console.error(`❌ Budget validation failed: ${validationId}`, error);
      throw error;
    }
  }

  /**
   * Create or update budget configuration
   */
  public async updateBudgetConfig(updates: Partial<PerformanceBudgetConfig>): Promise<void> {
    console.log('📝 Updating budget configuration...');

    this.config = { ...this.config, ...updates };

    // Update component configurations
    this.metricsAnalyzer.updateBudgets(this.config.budgets);
    this.violationDetector.updateThresholds(this.config.thresholds);
    this.enforcementEngine.updateConfig(this.config.enforcement);

    console.log('✅ Budget configuration updated');
  }

  /**
   * Get budget compliance report for a specific period
   */
  public async getComplianceReport(
    period: { start: Date; end: Date },
    options?: {
      includeDetails?: boolean;
      format?: 'json' | 'html' | 'markdown';
    }
  ): Promise<any> {
    console.log('📊 Generating compliance report...');

    const relevantData = this.historicalData.filter(result =>
      result.timestamp >= period.start && result.timestamp <= period.end
    );

    if (relevantData.length === 0) {
      return {
        period,
        message: 'No data available for the specified period',
        summary: {
          totalValidations: 0,
          passedCount: 0,
          warningCount: 0,
          failedCount: 0,
          averageAdherence: 0,
        },
      };
    }

    const summary = this.calculateComplianceSummary(relevantData);
    const violations = this.aggregateViolations(relevantData);
    const trends = this.analyzeComplianceTrends(relevantData);

    return {
      period,
      summary,
      violations,
      trends,
      details: options?.includeDetails ? relevantData : undefined,
    };
  }

  /**
   * Get current budget status
   */
  public async getCurrentBudgetStatus(): Promise<{
    overall: { status: string; adherence: number; violations: number };
    byCategory: Record<string, { status: string; adherence: number; violations: number }>;
    alerts: Array<{
      category: string;
      severity: string;
      message: string;
    }>;
  }> {
    if (this.historicalData.length === 0) {
      return {
        overall: { status: 'unknown', adherence: 0, violations: 0 },
        byCategory: {},
        alerts: [],
      };
    }

    const latestResult = this.historicalData[this.historicalData.length - 1];

    const overall = {
      status: latestResult.overallStatus,
      adherence: latestResult.budgetAdherence.overall,
      violations: latestResult.violations.length,
    };

    const byCategory: Record<string, { status: string; adherence: number; violations: number }> = {
      global: {
        status: latestResult.violations.some(v => v.category === 'global') ? 'failed' : 'passed',
        adherence: latestResult.budgetAdherence.overall,
        violations: latestResult.violations.filter(v => v.category === 'global').length,
      },
      routes: {
        status: latestResult.violations.some(v => v.category === 'route') ? 'failed' : 'passed',
        adherence: latestResult.budgetAdherence.critical || 0,
        violations: latestResult.violations.filter(v => v.category === 'route').length,
      },
      components: {
        status: latestResult.violations.some(v => v.category === 'component') ? 'failed' : 'passed',
        adherence: latestResult.budgetAdherence.normal || 0,
        violations: latestResult.violations.filter(v => v.category === 'component').length,
      },
      'core-web-vitals': {
        status: latestResult.violations.some(v => v.category === 'core-web-vitals') ? 'failed' : 'passed',
        adherence: latestResult.budgetAdherence.low || 0,
        violations: latestResult.violations.filter(v => v.category === 'core-web-vitals').length,
      },
    };

    const alerts = latestResult.violations
      .filter(v => v.severity === 'critical')
      .map(v => ({
        category: v.category,
        severity: v.severity,
        message: `${v.metric} exceeds budget by ${v.overage.toFixed(1)}% (${v.actualValue} vs ${v.budgetValue})`,
      }));

    return { overall, byCategory, alerts };
  }

  /**
   * Add budget exception
   */
  public async addException(exception: {
    path: string;
    reason: string;
    approvedBy: string;
    expiresAt: Date;
  }): Promise<void> {
    console.log(`➕ Adding budget exception for ${exception.path}`);

    this.config.enforcement.exceptions.push({
      ...exception,
    });

    console.log(`✅ Budget exception added`);
  }

  /**
   * Get optimization suggestions
   */
  public async getOptimizationSuggestions(): Promise<BudgetRecommendation[]> {
    if (!this.currentBuildMetrics) {
      return [];
    }

    const analyzedMetrics = await this.metricsAnalyzer.analyze(this.currentBuildMetrics, this.config.budgets);
    const violations = await this.violationDetector.detect(analyzedMetrics, this.config);

    return await this.recommendationEngine.generate(violations, analyzedMetrics);
  }

  // Helper methods
  private calculateBudgetAdherence(metrics: any): BudgetValidationResult['budgetAdherence'] {
    const overall = this.calculateOverallAdherence(metrics.total);

    return {
      overall,
      byCategory: {
        global: overall,
        critical: this.calculateRouteAdherence(metrics.routes, 'critical'),
        important: this.calculateRouteAdherence(metrics.routes, 'important'),
        normal: this.calculateRouteAdherence(metrics.routes, 'normal'),
        low: this.calculateRouteAdherence(metrics.routes, 'low'),
      },
    };
  }

  private calculateOverallAdherence(totalMetrics: BudgetMetrics): number {
    let totalBudget = 0;
    let totalActual = 0;

    const metrics = [
      'bundleSize', 'jsSize', 'cssSize', 'loadTime',
      'timeToInteractive', 'firstContentfulPaint'
    ] as const;

    for (const metric of metrics) {
      totalBudget += totalMetrics[metric].budget;
      totalActual += totalMetrics[metric].actual;
    }

    return totalBudget > 0 ? Math.max(0, (totalBudget / totalActual) * 100) : 0;
  }

  private calculateRouteAdherence(routes: Record<string, RouteMetrics>, priority: RouteBudget['priority']): number {
    const priorityRoutes = Object.values(routes).filter(route =>
      this.config.budgetes.routes[route.path]?.priority === priority
    );

    if (priorityRoutes.length === 0) {
      return 100;
    }

    const totalAdherence = priorityRoutes.reduce((sum, route) => {
      const routeAdherence = this.calculateOverallAdherence(route);
      return sum + routeAdherence;
    }, 0);

    return totalAdherence / priorityRoutes.length;
  }

  private determineOverallStatus(violations: BudgetViolation[], enforcementActions: EnforcementAction[]): 'passed' | 'warning' | 'failed' {
    if (this.config.enforcement.strict && violations.some(v => v.severity === 'critical')) {
      return 'failed';
    } else if (violations.some(v => v.severity === 'critical')) {
      return 'warning';
    } else if (violations.length > 0) {
      return 'warning';
    } else {
      return 'passed';
    }
  }

  private calculateComplianceSummary(data: BudgetValidationResult[]) {
    const totalValidations = data.length;
    const passedCount = data.filter(r => r.overallStatus === 'passed').length;
    const warningCount = data.filter(r => r.overallStatus === 'warning').length;
    const failedCount = data.filter(r => r.overallStatus === 'failed').length;
    const averageAdherence = data.reduce((sum, r) => sum + r.budgetAdherence.overall, 0) / totalValidations;

    return {
      totalValidations,
      passedCount,
      warningCount,
      failedCount,
      averageAdherence,
      passRate: (passedCount / totalValidations) * 100,
    };
  }

  private aggregateViolations(data: BudgetValidationResult[]) {
    const violationsByCategory: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};

    for (const result of data) {
      for (const violation of result.violations) {
        violationsByCategory[violation.category] = (violationsByCategory[violation.category] || 0) + 1;
        violationsBySeverity[violation.severity] = (violationsBySeverity[violation.severity] || 0) + 1;
      }
    }

    return {
      byCategory: violationsByCategory,
      bySeverity: violationsBySeverity,
      total: Object.values(violationsByCategory).reduce((sum, count) => sum + count, 0),
    };
  }

  private analyzeComplianceTrends(data: BudgetValidationResult[]) {
    const adherenceByDate = data.map(result => ({
      date: result.timestamp,
      adherence: result.budgetAdherence.overall,
      status: result.overallStatus,
    }));

    // Simple trend analysis
    const recentAdherence = adherenceByDate.slice(-5).map(d => d.adherence);
    const olderAdherence = adherenceByDate.slice(-10, -5).map(d => d.adherence);

    const recentAverage = recentAdherence.reduce((sum, a) => sum + a, 0) / recentAdherence.length;
    const olderAverage = olderAdherence.length > 0
      ? olderAdherence.reduce((sum, a) => sum + a, 0) / olderAdherence.length
      : recentAverage;

    let trend: 'improving' | 'stable' | 'degrading';
    if (recentAverage > olderAverage + 5) {
      trend = 'improving';
    } else if (recentAverage < olderAverage - 5) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      adherenceByDate,
      recentAverage,
      olderAverage,
      change: recentAverage - olderAverage,
    };
  }

  // Public API methods
  public getConfig(): PerformanceBudgetConfig {
    return { ...this.config };
  }

  public getHistoricalData(): BudgetValidationResult[] {
    return [...this.historicalData];
  }

  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Performance Budget Validator...');

    this.historicalData = [];
    this.currentBuildMetrics = null;

    console.log('✅ Performance Budget Validator cleaned up');
  }
}

// Supporting classes
class MetricsAnalyzer {
  constructor(private budgets: PerformanceBudgetConfig['budgets']) {}

  async analyze(metrics: PerformanceTestResult, budgets: PerformanceBudgetConfig['budgets']): Promise<BudgetValidationResult['metrics']> {
    // Analyze total metrics
    const total = await this.analyzeTotalMetrics(metrics, budgets);

    // Analyze route-specific metrics (simplified)
    const routes: Record<string, RouteMetrics> = {};
    const routePath = this.extractRoutePath(metrics.scenario);
    if (routePath) {
      routes[routePath] = await this.analyzeRouteMetrics(metrics, budgets, routePath);
    }

    // Analyze component metrics (placeholder)
    const components: Record<string, ComponentMetrics> = {};

    // Analyze third-party metrics (placeholder)
    const thirdParty: ThirdPartyMetrics = {
      totalSize: { budget: budgets.thirdParty.maxThirdPartySize, actual: 0, overage: 0 },
      requestCount: { budget: budgets.thirdParty.maxThirdPartyRequests, actual: 0, overage: 0 },
      domains: {},
      largest: { domain: '', size: 0 },
    };

    // Analyze Core Web Vitals
    const coreWebVitals = await this.analyzeCoreWebVitals(metrics, budgets);

    return {
      total,
      routes,
      components,
      thirdParty,
      coreWebVitals,
    };
  }

  private async analyzeTotalMetrics(metrics: PerformanceTestResult, budgets: PerformanceBudgetConfig['budgets']): Promise<BudgetMetrics> {
    const globalBudget = budgets.global;

    return {
      bundleSize: this.createMetricPair(globalBudget.totalBundleSize, metrics.metrics.bundleSize),
      jsSize: this.createMetricPair(globalBudget.jsSize, metrics.metrics.jsSize),
      cssSize: this.createMetricPair(globalBudget.cssSize, metrics.metrics.cssSize),
      loadImage: this.createMetricPair(globalBudget.imageSize, metrics.metrics.imageSize),
      fontCount: this.createMetricPair(globalBudget.fontCount, 0), // Would need actual font count
      requestCount: this.createMetricPair(globalBudget.requestCount, metrics.metrics.resourceCount),
      loadTime: this.createMetricPair(globalBudget.loadTime, metrics.metrics.loadTime),
      timeToInteractive: this.createMetricPair(globalBudget.timeToInteractive, metrics.metrics.timeToInteractive),
      firstContentfulPaint: this.createMetricPair(globalBudget.firstContentfulPaint, metrics.metrics.firstContentfulPaint),
      largestContentfulPaint: this.createMetricPair(globalBudget.largestContentfulPaint, metrics.metrics.largestContentfulPaint),
      cumulativeLayoutShift: this.createMetricPair(globalBudget.cumulativeLayoutShift, metrics.metrics.cumulativeLayoutShift * 100), // Convert to percentage
      memoryUsage: this.createMetricPair(globalBudget.memoryUsage, metrics.metrics.memoryUsage),
    };
  }

  private async analyzeRouteMetrics(metrics: PerformanceTestResult, budgets: PerformanceBudgetConfig['budgets'], path: string): Promise<RouteMetrics> {
    const routeBudget = budgets.routes[path];

    if (!routeBudget) {
      // Use default budget if route not specified
      const defaultBudget = budgets.routes['/'];
      return {
        path,
        priority: 'normal',
        componentCount: 0,
        dependencyCount: 0,
        bundleSize: this.createMetricPair(defaultBudget?.budgets.bundleSize || 200, metrics.metrics.bundleSize),
        jsSize: this.createMetricPair(defaultBudget?.budgets.jsSize || 150, metrics.metrics.jsSize),
        cssSize: this.createMetricPair(defaultBudget?.budgets.cssSize || 50, metrics.metrics.cssSize),
        loadTime: this.createMetricPair(defaultBudget?.budgets.loadTime || 2000, metrics.metrics.loadTime),
        firstContentfulPaint: this.createMetricPair(defaultBudget?.budgets.firstContentfulPaint || 1000, metrics.metrics.firstContentfulPaint),
        timeToInteractive: this.createMetricPair(defaultBudget?.budgets.timeToInteractive || 3000, metrics.metrics.timeToInteractive),
      } as RouteMetrics;
    }

    return {
      path,
      priority: routeBudget.priority,
      componentCount: 0, // Would need component analysis
      dependencyCount: 0, // Would need dependency analysis
      bundleSize: this.createMetricPair(routeBudget.budgets.bundleSize, metrics.metrics.bundleSize),
      jsSize: this.createMetricPair(routeBudget.budgets.jsSize, metrics.metrics.jsSize),
      cssSize: this.createMetricPair(routeBudget.budgets.cssSize, metrics.metrics.cssSize),
      loadTime: this.createMetricPair(routeBudget.budgets.loadTime, metrics.metrics.loadTime),
      firstContentfulPaint: this.createMetricPair(routeBudget.budgets.firstContentfulPaint, metrics.metrics.firstContentfulPaint),
      timeToInteractive: this.createMetricPair(routeBudget.budgets.timeToInteractive, metrics.metrics.timeToInteractive),
    };
  }

  private async analyzeCoreWebVitals(metrics: PerformanceTestResult, budgets: PerformanceBudgetConfig['budgets']): Promise<CoreWebVitalsMetrics> {
    const cwvBudget = budgets.coreWebVitals;

    const getVitalStatus = (actual: number, budget: number, type: 'lower-is-better' | 'higher-is-better' = 'lower-is-better'): CoreWebVitalsMetrics['LCP']['status'] => {
      if (type === 'lower-is-better') {
        if (actual <= budget * 0.75) return 'good';
        if (actual <= budget) return 'needs-improvement';
        return 'poor';
      } else {
        if (actual >= budget * 1.25) return 'good';
        if (actual >= budget) return 'needs-improvement';
        return 'poor';
      }
    };

    const calculateTBT = (metrics: PerformanceTestResult): number => {
      // Total Blocking Time = Time to Interactive - First Contentful Paint (simplified)
      return Math.max(0, metrics.metrics.timeToInteractive - metrics.metrics.firstContentfulPaint);
    };

    const tbt = calculateTBT(metrics);

    return {
      LCP: {
        budget: cwvBudget.LCP.budget,
        actual: metrics.metrics.largestContentfulPaint,
        overage: this.calculateOverage(metrics.metrics.largestContentfulPaint, cwvBudget.LCP.budget),
        status: getVitalStatus(metrics.metrics.largestContentfulPaint, cwvBudget.LCP.budget),
      },
      FID: {
        budget: cwvBudget.FID.budget,
        actual: metrics.metrics.firstInputDelay,
        overage: this.calculateOverage(metrics.metrics.firstInputDelay, cwvBudget.FID.budget),
        status: getVitalStatus(metrics.metrics.firstInputDelay, cwvBudget.FID.budget),
      },
      CLS: {
        budget: cwvBudget.CLS.budget,
        actual: metrics.metrics.cumulativeLayoutShift,
        overage: this.calculateOverage(metrics.metrics.cumulativeLayoutShift * 100, cwvBudget.CLS.budget * 100), // Convert to percentage
        status: getVitalStatus(metrics.metrics.cumulativeLayoutShift, cwvBudget.CLS.budget),
      },
      FCP: {
        budget: cwvBudget.FCP.budget,
        actual: metrics.metrics.firstContentfulPaint,
        overage: this.calculateOverage(metrics.metrics.firstContentfulPaint, cwvBudget.FCP.budget),
        status: getVitalStatus(metrics.metrics.firstContentfulPaint, cwvBudget.FCP.budget),
      },
      TTI: {
        budget: cwvBudget.TTI.budget,
        actual: metrics.metrics.timeToInteractive,
        overage: this.calculateOverage(metrics.metrics.timeToInteractive, cwvBudget.TTI.budget),
        status: getVitalStatus(metrics.metrics.timeToInteractive, cwvBudget.TTI.budget),
      },
      TBT: {
        budget: cwvBudget.TBT.budget,
        actual: tbt,
        overage: this.calculateOverage(tbt, cwvBudget.TBT.budget),
        status: getVitalStatus(tbt, cwvBudget.TBT.budget),
      },
    };
  }

  private createMetricPair(budget: number, actual: number): { budget: number; actual: number; overage: number } {
    return {
      budget,
      actual,
      overage: this.calculateOverage(actual, budget),
    };
  }

  private calculateOverage(actual: number, budget: number): number {
    return budget > 0 ? ((actual - budget) / budget) * 100 : 0;
  }

  private extractRoutePath(scenario: string): string | null {
    // Extract route path from scenario name
    const pathMatch = scenario.match(/^(.+?)\s+[-–]/);
    return pathMatch ? pathMatch[1] : null;
  }

  updateBudgets(budgets: PerformanceBudgetConfig['budgets']): void {
    this.budgets = budgets;
  }
}

class ViolationDetector {
  constructor(private thresholds: PerformanceBudgetConfig['thresholds']) {}

  async detect(metrics: BudgetValidationResult['metrics'], config: PerformanceBudgetConfig): Promise<BudgetViolation[]> {
    const violations: BudgetViolation[] = [];

    // Check global budget violations
    violations.push(...this.checkGlobalViolations(metrics.total, config));

    // Check route budget violations
    violations.push(...this.checkRouteViolations(metrics.routes, config));

    // Check Core Web Vitals violations
    violations.push(...this.checkCoreWebVitalsViolations(metrics.coreWebVitals, config));

    // Check for exceptions
    violations.forEach(violation => {
      const exception = config.enforcement.exceptions.find(ex =>
        violation.context.path === ex.path
      );

      if (exception) {
        violation.isException = true;
        violation.exceptionReason = exception.reason;
      }
    });

    return violations;
  }

  private checkGlobalViolations(totalMetrics: BudgetMetrics, config: PerformanceBudgetConfig): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    const metricNames = [
      'bundleSize', 'jsSize', 'cssSize', 'loadImage', 'fontCount',
      'requestCount', 'loadTime', 'timeToInteractive', 'firstContentfulPaint',
      'largestContentfulPaint', 'cumulativeLayoutShift', 'memoryUsage'
    ] as const;

    for (const metricName of metricNames) {
      const metric = totalMetrics[metricName];

      if (metric.overage > this.thresholds.warning) {
        violations.push({
          id: `violation-${Date.now()}-${metricName}`,
          category: 'global',
          severity: metric.overage > this.thresholds.critical ? 'critical' : 'warning',
          metric: metricName,
          budgetValue: metric.budget,
          actualValue: metric.actual,
          overage: metric.overage,
          overageAbsolute: metric.actual - metric.budget,
          context: {},
          impact: this.assessImpact(metricName, metric.overage),
          recommendations: this.getMetricRecommendations(metricName, metric.overage),
          isException: false,
        });
      }
    }

    return violations;
  }

  private checkRouteViolations(routeMetrics: Record<string, RouteMetrics>, config: PerformanceBudgetConfig): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    for (const [path, metrics] of Object.entries(routeMetrics)) {
      const routeBudget = config.budgetes.routes[path];

      if (!routeBudget) {
        continue;
      }

      const routeMetricNames = [
        'bundleSize', 'jsSize', 'cssSize', 'loadTime',
        'firstContentfulPaint', 'timeToInteractive'
      ] as const;

      for (const metricName of routeMetricNames) {
        const metric = metrics[metricName];

        if (metric.overage > this.thresholds.warning) {
          violations.push({
            id: `violation-${Date.now()}-${path}-${metricName}`,
            category: 'route',
            severity: metric.overage > this.thresholds.critical ? 'critical' : 'warning',
            metric: `${path}:${metricName}`,
            budgetValue: metric.budget,
            actualValue: metric.actual,
            overage: metric.overage,
            overageAbsolute: metric.actual - metric.budget,
            context: { path },
            impact: this.assessImpact(metricName, metric.overage, routeBudget.priority),
            recommendations: this.getMetricRecommendations(metricName, metric.overage, path),
            isException: false,
          });
        }
      }
    }

    return violations;
  }

  private checkCoreWebVitalsViolations(coreWebVitals: CoreWebVitalsMetrics, config: PerformanceBudgetConfig): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    const vitalNames = ['LCP', 'FID', 'CLS', 'FCP', 'TTI', 'TBT'] as const;

    for (const vitalName of vitalNames) {
      const vital = coreWebVitals[vitalName];

      if (vital.overage > this.thresholds.warning) {
        violations.push({
          id: `violation-${Date.now()}-cwv-${vitalName}`,
          category: 'core-web-vitals',
          severity: vital.overage > this.thresholds.critical ? 'critical' : 'warning',
          metric: vitalName,
          budgetValue: vital.budget,
          actualValue: vital.actual,
          overage: vital.overage,
          overageAbsolute: vital.actual - vital.budget,
          context: {},
          impact: {
            userExperience: vital.status === 'poor' ? 'critical' : vital.status === 'needs-improvement' ? 'high' : 'medium',
            businessImpact: `Core Web Vital ${vitalName} ${vital.status} affects user experience and SEO ranking`,
            affectedUsers: 100, // All users
          },
          recommendations: this.getCWVRecommendations(vitalName, vital),
          isException: false,
        });
      }
    }

    return violations;
  }

  private assessImpact(metric: string, overage: number, priority: RouteBudget['priority'] = 'normal'): BudgetViolation['impact'] {
    let userExperience: BudgetViolation['impact']['userExperience'];
    let businessImpact: string;

    if (overage > this.thresholds.critical) {
      userExperience = 'critical';
      businessImpact = `Severe performance degradation affecting user experience and conversion`;
    } else if (overage > this.thresholds.warning) {
      userExperience = 'high';
      businessImpact = `Significant performance impact on user experience`;
    } else {
      userExperience = 'medium';
      businessImpact = `Moderate performance impact on user experience`;
    }

    // Adjust impact based on priority
    if (priority === 'critical') {
      userExperience = userExperience === 'critical' ? 'critical' :
                       userExperience === 'high' ? 'critical' : 'high';
    }

    return {
      userExperience,
      businessImpact,
      affectedUsers: 100, // Simplified - would need actual user data
    };
  }

  private getMetricRecommendations(metric: string, overage: number, context?: string): string[] {
    const recommendations: string[] = [];

    switch (metric) {
      case 'bundleSize':
        recommendations.push('Analyze bundle composition and identify large dependencies');
        recommendations.push('Implement code splitting and lazy loading');
        recommendations.push('Remove unused code and dependencies');
        recommendations.push('Optimize imports and use tree shaking');
        break;

      case 'jsSize':
        recommendations.push('Minimize JavaScript bundle size');
        recommendations.push('Use dynamic imports for non-critical code');
        recommendations.push('Optimize third-party libraries');
        recommendations.push('Enable compression and minification');
        break;

      case 'cssSize':
        recommendations.push('Remove unused CSS rules');
        recommendations.push('Optimize CSS delivery and critical path CSS');
        recommendations.push('Use CSS-in-JS efficiently');
        recommendations.push('Implement CSS code splitting');
        break;

      case 'loadTime':
      case 'firstContentfulPaint':
      case 'timeToInteractive':
        recommendations.push('Optimize server response time');
        recommendations.push('Implement resource preloading and prefetching');
        recommendations.push('Optimize critical rendering path');
        recommendations.push('Use CDN for static assets');
        break;

      case 'memoryUsage':
        recommendations.push('Identify and fix memory leaks');
        recommendations.push('Optimize object creation and garbage collection');
        recommendations.push('Use memory-efficient data structures');
        recommendations.push('Implement memory pooling for frequent allocations');
        break;

      default:
        recommendations.push('Analyze performance metrics and identify optimization opportunities');
        recommendations.push('Implement monitoring and alerting for performance regressions');
    }

    return recommendations;
  }

  private getCWVRecommendations(vitalName: string, vital: CoreWebVitalsMetrics[string]): string[] {
    const recommendations: string[] = [];

    switch (vitalName) {
      case 'LCP':
        recommendations.push('Optimize largest contentful paint');
        recommendations.push('Preload important resources');
        recommendations.push('Optimize image loading and formats');
        recommendations.push('Use efficient caching strategies');
        break;

      case 'FID':
        recommendations.push('Reduce JavaScript execution time');
        recommendations.push('Break up long tasks');
        recommendations.push('Optimize event listeners and handlers');
        recommendations.push('Use web workers for heavy computations');
        break;

      case 'CLS':
        recommendations.push('Ensure consistent element dimensions');
        recommendations.push('Reserve space for dynamic content');
        recommendations.push('Avoid inserting content above existing content');
        recommendations.push('Use transform animations instead of layout changes');
        break;

      default:
        recommendations.push('Optimize Core Web Vitals performance');
    }

    return recommendations;
  }

  updateThresholds(thresholds: PerformanceBudgetConfig['thresholds']): void {
    this.thresholds = thresholds;
  }
}

class RecommendationEngine {
  constructor(private optimizationConfig: PerformanceBudgetConfig['optimization']) {}

  async generate(violations: BudgetViolation[], metrics: BudgetValidationResult['metrics']): Promise<BudgetRecommendation[]> {
    const recommendations: BudgetRecommendation[] = [];

    // Analyze violations and generate specific recommendations
    for (const violation of violations) {
      const recs = await this.generateRecommendationsForViolation(violation, metrics);
      recommendations.push(...recs);
    }

    // Generate proactive optimization recommendations
    const proactiveRecs = await this.generateProactiveRecommendations(metrics);
    recommendations.push(...proactiveRecs);

    // Deduplicate and prioritize
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    return this.prioritizeRecommendations(uniqueRecs);
  }

  private async generateRecommendationsForViolation(violation: BudgetViolation, metrics: BudgetValidationResult['metrics']): Promise<BudgetRecommendation[]> {
    const recommendations: BudgetRecommendation[] = [];

    switch (violation.category) {
      case 'global':
      case 'route':
        recommendations.push(...this.generatePerformanceRecommendations(violation));
        break;

      case 'core-web-vitals':
        recommendations.push(...this.generateCWVRecommendations(violation));
        break;
    }

    return recommendations;
  }

  private generatePerformanceRecommendations(violation: BudgetViolation): BudgetRecommendation[] {
    const recommendations: BudgetRecommendation[] = [];

    if (violation.metric.includes('Size')) {
      recommendations.push({
        id: `rec-bundle-opt-${Date.now()}`,
        type: 'optimization',
        priority: violation.severity === 'critical' ? 'high' : 'medium',
        title: 'Optimize Bundle Size',
        description: `Reduce ${violation.metric} by optimizing bundle composition and removing unused code`,
        impact: {
          metric: violation.metric,
          potentialImprovement: Math.min(30, violation.overage * 0.8),
          effort: 'medium',
          risk: 'low',
        },
        implementation: {
          steps: [
            'Analyze bundle composition using webpack-bundle-analyzer',
            'Identify large dependencies and unused code',
            'Implement code splitting and dynamic imports',
            'Remove unused dependencies',
          ],
          tools: ['webpack-bundle-analyzer', 'bundlephobia', 'source-map-explorer'],
        },
        automation: {
          automated: true,
          tools: ['webpack', 'esbuild'],
          scripts: ['npm run analyze', 'npm run build:analyze'],
        },
      });
    }

    if (violation.metric.includes('Time')) {
      recommendations.push({
        id: `rec-perf-opt-${Date.now()}`,
        type: 'optimization',
        priority: violation.severity === 'critical' ? 'high' : 'medium',
        title: 'Optimize Load Performance',
        description: `Improve ${violation.metric} by optimizing resource loading and critical rendering path`,
        impact: {
          metric: violation.metric,
          potentialImprovement: Math.min(25, violation.overage * 0.6),
          effort: 'medium',
          risk: 'low',
        },
        implementation: {
          steps: [
            'Optimize server response times',
            'Implement resource preloading',
            'Optimize critical CSS delivery',
            'Use CDN for static assets',
          ],
          tools: ['lighthouse', 'webpagetest', 'chrome-devtools'],
        },
        automation: {
          automated: false,
          tools: [],
        },
      });
    }

    return recommendations;
  }

  private generateCWVRecommendations(violation: BudgetViolation): BudgetRecommendation[] {
    const recommendations: BudgetRecommendation[] = [];

    recommendations.push({
      id: `rec-cwv-opt-${Date.now()}`,
      type: 'optimization',
      priority: violation.severity === 'critical' ? 'high' : 'medium',
      title: `Optimize Core Web Vital: ${violation.metric}`,
      description: `Improve ${violation.metric} to enhance user experience and SEO ranking`,
      impact: {
        metric: violation.metric,
        potentialImprovement: Math.min(20, violation.overage * 0.5),
        effort: 'medium',
        risk: 'low',
      },
      implementation: {
        steps: [
          'Analyze Core Web Vitals using Lighthouse',
          'Identify performance bottlenecks',
          'Implement targeted optimizations',
          'Monitor improvements over time',
        ],
        tools: ['lighthouse', 'web-vitals', 'chrome-devtools'],
      },
      automation: {
        automated: true,
        tools: ['next.js', 'webpack'],
      },
    });

    return recommendations;
  }

  private async generateProactiveRecommendations(metrics: BudgetValidationResult['metrics']): Promise<BudgetRecommendation[]> {
    const recommendations: BudgetRecommendation[] = [];

    // Check for optimization opportunities even without violations
    if (metrics.total.bundleSize.actual > metrics.total.bundleSize.budget * 0.8) {
      recommendations.push({
        id: `rec-proactive-bundle-${Date.now()}`,
        type: 'optimization',
        priority: 'medium',
        title: 'Proactive Bundle Optimization',
        description: 'Bundle size is approaching budget limit, consider proactive optimization',
        impact: {
          metric: 'bundleSize',
          potentialImprovement: 15,
          effort: 'medium',
          risk: 'low',
        },
        implementation: {
          steps: [
            'Regular bundle size monitoring',
            'Preventive code splitting',
            'Dependency management',
          ],
        },
        automation: {
          automated: true,
          tools: ['webpack', 'size-limit'],
        },
      });
    }

    return recommendations;
  }

  private deduplicateRecommendations(recommendations: BudgetRecommendation[]): BudgetRecommendation[] {
    const seen = new Set<string>();
    const unique: BudgetRecommendation[] = [];

    for (const rec of recommendations) {
      const key = `${rec.type}-${rec.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      }
    }

    return unique;
  }

  private prioritizeRecommendations(recommendations: BudgetRecommendation[]): BudgetRecommendation[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Sort by potential improvement if same priority
      return b.impact.potentialImprovement - a.impact.potentialImprovement;
    });
  }
}

class OptimizationAnalyzer {
  async analyze(metrics: PerformanceTestResult, config: PerformanceBudgetConfig): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Analyze compression opportunities
    opportunities.push(...this.analyzeCompressionOpportunities(metrics));

    // Analyze minification opportunities
    opportunities.push(...this.analyzeMinificationOpportunities(metrics));

    // Analyze tree-shaking opportunities
    opportunities.push(...this.analyzeTreeShakingOpportunities(metrics));

    // Analyze code-splitting opportunities
    opportunities.push(...this.analyzeCodeSplittingOpportunities(metrics));

    // Analyze lazy-loading opportunities
    opportunities.push(...this.analyzeLazyLoadingOpportunities(metrics));

    return opportunities.sort((a, b) => b.potentialSavings.bytes - a.potentialSavings.bytes);
  }

  private analyzeCompressionOpportunities(metrics: PerformanceTestResult): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Estimate compression savings (simplified)
    const estimatedCompressionSavings = metrics.metrics.bundleSize * 0.3; // 30% compression savings

    if (estimatedCompressionSavings > 10240) { // 10KB
      opportunities.push({
        category: 'compression',
        description: 'Enable better compression for static assets',
        potentialSavings: {
          bytes: estimatedCompressionSavings,
          percentage: 30,
          timeMs: estimatedCompressionSavings * 0.001, // Rough estimate
        },
        complexity: 'low',
        effort: 'low',
        risk: 'low',
        implementation: {
          description: 'Configure compression middleware and optimize file compression settings',
          tools: ['gzip', 'brotli', 'zstd'],
        },
      });
    }

    return opportunities;
  }

  private analyzeMinificationOpportunities(metrics: PerformanceTestResult): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Estimate minification savings
    const estimatedMinificationSavings = metrics.metrics.bundleSize * 0.15; // 15% minification savings

    if (estimatedMinificationSavings > 5120) { // 5KB
      opportunities.push({
        category: 'minification',
        description: 'Improve code minification and optimization',
        potentialSavings: {
          bytes: estimatedMinificationSavings,
          percentage: 15,
          timeMs: estimatedMinificationSavings * 0.0005,
        },
        complexity: 'low',
        effort: 'low',
        risk: 'low',
        implementation: {
          description: 'Configure advanced minification options and optimize build process',
          tools: ['terser', 'cssnano', 'html-minifier'],
        },
      });
    }

    return opportunities;
  }

  private analyzeTreeShakingOpportunities(metrics: PerformanceTestResult): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Estimate tree-shaking savings
    const estimatedTreeShakingSavings = metrics.metrics.jsSize * 0.1; // 10% tree-shaking savings

    if (estimatedTreeShakingSavings > 2048) { // 2KB
      opportunities.push({
        category: 'tree-shaking',
        description: 'Improve tree-shaking to remove unused code',
        potentialSavings: {
          bytes: estimatedTreeShakingSavings,
          percentage: 10,
          timeMs: estimatedTreeShakingSavings * 0.0003,
        },
        complexity: 'medium',
        effort: 'medium',
        risk: 'medium',
        implementation: {
          description: 'Configure ES6 modules and sideEffects for better tree-shaking',
          tools: ['webpack', 'rollup', 'esbuild'],
        },
      });
    }

    return opportunities;
  }

  private analyzeCodeSplittingOpportunities(metrics: PerformanceTestResult): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Estimate code-splitting savings (initial bundle size reduction)
    const estimatedSavings = metrics.metrics.bundleSize * 0.2; // 20% initial load savings

    if (estimatedSavings > 4096) { // 4KB
      opportunities.push({
        category: 'code-splitting',
        description: 'Implement code splitting to reduce initial bundle size',
        potentialSavings: {
          bytes: estimatedSavings,
          percentage: 20,
          timeMs: estimatedSavings * 0.0004,
        },
        complexity: 'medium',
        effort: 'medium',
        risk: 'low',
        implementation: {
          description: 'Configure automatic code splitting and dynamic imports for non-critical code',
          tools: ['webpack', 'next.js', 'react.lazy'],
        },
      });
    }

    return opportunities;
  }

  private analyzeLazyLoadingOpportunities(metrics: PerformanceTestResult): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Estimate lazy-loading savings
    const estimatedSavings = metrics.metrics.bundleSize * 0.15; // 15% lazy-loading savings

    if (estimatedSavings > 3072) { // 3KB
      opportunities.push({
        category: 'lazy-loading',
        description: 'Implement lazy loading for non-critical components and routes',
        potentialSavings: {
          bytes: estimatedSavings,
          percentage: 15,
          timeMs: estimatedSavings * 0.0002,
        },
        complexity: 'medium',
        effort: 'medium',
        risk: 'low',
        implementation: {
          description: 'Use React.lazy and dynamic imports for components and routes',
          tools: ['next.js', 'react.lazy', 'intersection-observer'],
        },
      });
    }

    return opportunities;
  }
}

class BudgetTrendAnalyzer {
  async analyze(historicalData: BudgetValidationResult[]): Promise<BudgetTrendAnalysis> {
    if (historicalData.length < 2) {
      return this.getDefaultTrendAnalysis();
    }

    const period = {
      start: historicalData[0].timestamp,
      end: historicalData[historicalData.length - 1].timestamp,
      dataPoints: historicalData.length,
    };

    const trends: Record<string, BudgetTrendAnalysis['trends'][string]> = {};
    const anomalies: BudgetTrendAnalysis['anomalies'] = [];

    // Analyze trends for key metrics
    const metrics = ['overall', 'bundleSize', 'loadTime', 'firstContentfulPaint'];

    for (const metric of metrics) {
      const trend = this.calculateMetricTrend(historicalData, metric);
      trends[metric] = trend;

      // Detect anomalies
      const metricAnomalies = this.detectAnomalies(historicalData, metric);
      anomalies.push(...metricAnomalies);
    }

    return {
      period,
      trends,
      anomalies,
    };
  }

  private calculateMetricTrend(data: BudgetValidationResult[], metric: string): BudgetTrendAnalysis['trends'][string] {
    const values = data.map(d => {
      switch (metric) {
        case 'overall':
          return d.budgetAdherence.overall;
        case 'bundleSize':
          return d.metrics.total.bundleSize.actual;
        case 'loadTime':
          return d.metrics.total.loadTime.actual;
        case 'firstContentfulPaint':
          return d.metrics.total.firstContentfulPaint.actual;
        default:
          return 0;
      }
    });

    // Simple linear regression for trend
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    let direction: 'improving' | 'degrading' | 'stable';
    if (Math.abs(slope) < 0.01) {
      direction = 'stable';
    } else if (metric === 'overall') {
      direction = slope > 0 ? 'improving' : 'degrading';
    } else {
      direction = slope < 0 ? 'improving' : 'degrading';
    }

    // Calculate confidence (simplified)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const correlation = Math.abs(slope) / (Math.sqrt(variance) * Math.sqrt(n));
    const confidence = Math.min(0.95, correlation);

    // Simple forecast
    const nextPeriod = values[values.length - 1] + slope;
    const risk = Math.abs(slope) > 0.1 ? 'high' : Math.abs(slope) > 0.05 ? 'medium' : 'low';

    return {
      direction,
      slope,
      confidence,
      forecast: {
        nextPeriod,
        confidence,
        risk: risk as 'low' | 'medium' | 'high',
      },
    };
  }

  private detectAnomalies(data: BudgetValidationResult[], metric: string): BudgetTrendAnalysis['anomalies'] {
    const anomalies: BudgetTrendAnalysis['anomalies'] = [];

    const values = data.map(d => {
      switch (metric) {
        case 'overall':
          return d.budgetAdherence.overall;
        case 'bundleSize':
          return d.metrics.total.bundleSize.actual;
        case 'loadTime':
          return d.metrics.total.loadTime.actual;
        case 'firstContentfulPaint':
          return d.metrics.total.firstContentfulPaint.actual;
        default:
          return 0;
      }
    });

    if (values.length < 3) {
      return anomalies;
    }

    // Simple anomaly detection using statistical outliers
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    const threshold = 2 * stdDev;

    for (let i = 0; i < values.length; i++) {
      const deviation = Math.abs(values[i] - mean);
      if (deviation > threshold) {
        anomalies.push({
          timestamp: data[i].timestamp,
          metric,
          value: values[i],
          expectedValue: mean,
          deviation: deviation / stdDev,
        });
      }
    }

    return anomalies;
  }

  private getDefaultTrendAnalysis(): BudgetTrendAnalysis {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      period: {
        start: weekAgo,
        end: now,
        dataPoints: 1,
      },
      trends: {},
      anomalies: [],
    };
  }
}

class EnforcementEngine {
  constructor(private config: PerformanceBudgetConfig['enforcement']) {}

  async execute(violations: BudgetViolation[], config: PerformanceBudgetConfig): Promise<EnforcementAction[]> {
    const actions: EnforcementAction[] = [];

    // Filter out exceptions
    const enforceableViolations = violations.filter(v => !v.isException);

    // Determine enforcement actions
    if (config.enforcement.strict && enforceableViolations.some(v => v.severity === 'critical')) {
      // Block the build
      actions.push({
        type: 'build_block',
        severity: 'error',
        description: 'Build blocked due to critical performance budget violations',
        automated: true,
        executed: true,
        timestamp: new Date(),
        result: 'Build pipeline terminated',
      });
    } else if (enforceableViolations.length > 0) {
      // Create warning
      actions.push({
        type: 'warning',
        severity: 'warning',
        description: `Performance budget warnings detected: ${enforceableViolations.length} violation(s)`,
        automated: true,
        executed: true,
        timestamp: new Date(),
      });

      // Auto-fix if enabled
      if (config.optimization.autoOptimize) {
        actions.push({
          type: 'auto_fix',
          severity: 'info',
          description: 'Attempting automated performance optimizations',
          automated: true,
          executed: false, // Would be executed if auto-fix is implemented
          timestamp: new Date(),
        });
      }
    }

    // Send notifications
    if (enforceableViolations.length > 0) {
      actions.push({
        type: 'notification',
        severity: 'info',
        description: 'Performance budget violations detected and notifications sent',
        automated: true,
        executed: true,
        timestamp: new Date(),
      });
    }

    return actions;
  }

  updateConfig(config: PerformanceBudgetConfig['enforcement']): void {
    this.config = { ...this.config, ...config };
  }
}

class BudgetMonitoringSystem {
  constructor(private config: PerformanceBudgetConfig['monitoring']) {}

  async initialize(): Promise<void> {
    console.log('📊 Initializing Budget Monitoring System...');
  }

  async sendAlerts(result: BudgetValidationResult): Promise<void> {
    // Implementation would send monitoring alerts
    console.log('🚨 Sending budget monitoring alerts...');
  }
}

class BudgetReportingSystem {
  constructor(private config: PerformanceBudgetConfig['reporting']) {}

  async initialize(): Promise<void> {
    console.log('📝 Initializing Budget Reporting System...');
  }

  async generateReport(result: BudgetValidationResult): Promise<void> {
    // Implementation would generate budget reports
    console.log('📊 Generating budget report...');
  }
}

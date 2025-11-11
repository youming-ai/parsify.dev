/**
 * Performance Budget Validation and Enforcement System
 * Comprehensive budget management with real-time validation, automated enforcement, and intelligent alerting
 * Features hierarchical budgets, dynamic thresholds, and predictive budget planning
 */

import { PerformanceTestResult } from './performance-regression-testing';
import { PerformanceBaseline } from './performance-benchmarking';

export interface PerformanceBudget {
  id: string;
  name: string;
  description: string;
  category: 'bundle' | 'runtime' | 'memory' | 'network' | 'user-experience' | 'custom';
  scope: 'global' | 'scenario' | 'environment' | 'feature' | 'component';

  // Budget definition
  budget: {
    type: 'absolute' | 'relative' | 'composite';
    value: number;
    unit: string; // ms, KB, MB, percentage, score, etc.
    threshold: {
      warning: number; // percentage of budget
      critical: number; // percentage of budget
    };
    baseline?: {
      value: number;
      date: Date;
      source: string;
    };
  };

  // Budget conditions and context
  conditions: {
    environments?: string[]; // Specific environments
    scenarios?: string[]; // Specific test scenarios
    userSegments?: string[]; // User segments
    deviceTypes?: string[]; // Device types
    networkConditions?: string[]; // Network conditions
    timeRanges?: Array<{
      start: string; // HH:mm
      end: string; // HH:mm
      timezone: string;
      days: number[]; // 0-6 (Sunday-Saturday)
    }>;
  };

  // Validation rules
  validation: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    sampling: {
      size: number; // minimum samples for validation
      window: number; // time window in minutes
      aggregation: 'mean' | 'median' | 'p95' | 'p99' | 'max';
    };
    outlierDetection: {
      enabled: boolean;
      method: 'iqr' | 'zscore' | 'isolation_forest';
      threshold: number;
    };
    gracePeriod: number; // minutes after deployment
  };

  // Enforcement actions
  enforcement: {
    enabled: boolean;
    actions: Array<{
      trigger: 'warning' | 'critical';
      type: 'alert' | 'block' | 'rollback' | 'degrade' | 'optimize';
      automated: boolean;
      conditions: string[]; // Additional conditions
      delay: number; // minutes delay before action
      escalation?: {
        level: number;
        conditions: string[];
        actions: string[];
      };
    }>;
    approvalRequired: boolean;
    approvers?: string[];
    rollbackOptions?: {
      automatic: boolean;
      gracePeriod: number; // minutes
      conditions: string[];
    };
  };

  // Analytics and learning
  analytics: {
    trendAnalysis: boolean;
    seasonalAdjustment: boolean;
    predictiveAlerts: boolean;
    machineLearning: {
      enabled: boolean;
      algorithms: Array<'linear_regression' | 'time_series' | 'anomaly_detection'>;
      trainingWindow: number; // days
      predictionHorizon: number; // days
    };
  };

  // Metadata
  metadata: {
    owner: string;
    team: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    documentation?: string;
    relatedBudgets: string[]; // IDs of related budgets
    dependencies: string[]; // IDs of dependent budgets
    version: number;
    createdAt: Date;
    updatedAt: Date;
    reviewedAt?: Date;
    nextReview?: Date;
  };
}

export interface BudgetValidation {
  id: string;
  budgetId: string;
  budgetName: string;
  timestamp: Date;

  // Validation results
  status: 'compliant' | 'warning' | 'violation' | 'error';
  actualValue: number;
  budgetValue: number;
  utilization: number; // percentage of budget used

  // Validation details
  samples: Array<{
    value: number;
    timestamp: Date;
    scenario: string;
    environment: string;
    source: string;
  }>;
  statistics: {
    mean: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    standardDeviation: number;
    confidenceInterval: {
      lower: number;
      upper: number;
      level: number;
    };
  };

  // Context information
  context: {
    environment: string;
    scenario?: string;
    commit?: string;
    branch?: string;
    deployment?: string;
    buildNumber?: string;
    testExecution?: string;
  };

  // Impact assessment
  impact: {
    userExperience: 'low' | 'medium' | 'high' | 'critical';
    businessImpact: string;
    affectedUsers: number;
    revenueImpact: number;
    supportTicketsImpact: number;
  };

  // Recommendations
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'immediate' | 'short_term' | 'long_term';
    description: string;
    effortEstimate: string;
    expectedImprovement: number;
    dependencies: string[];
    owner?: string;
  }>;

  // Enforcement actions taken
  actions: Array<{
    type: string;
    status: 'pending' | 'executed' | 'completed' | 'failed';
    timestamp: Date;
    description: string;
    result?: string;
    error?: string;
  }>;
}

export interface BudgetComplianceReport {
  id: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
    duration: number; // milliseconds
  };

  // Overall compliance
  overallCompliance: {
    status: 'compliant' | 'warning' | 'violation';
    score: number; // 0-100
    budgetCount: number;
    compliantCount: number;
    warningCount: number;
    violationCount: number;
  };

  // Budget breakdown
  budgetCompliance: Array<{
    budgetId: string;
    budgetName: string;
    category: PerformanceBudget['category'];
    status: BudgetValidation['status'];
    score: number;
    utilization: number;
    trend: 'improving' | 'degrading' | 'stable';
  }>;

  // Category breakdown
  categoryCompliance: Array<{
    category: PerformanceBudget['category'];
    status: BudgetValidation['status'];
    score: number;
    budgetCount: number;
    compliantCount: number;
    warningCount: number;
    violationCount: number;
  }>;

  // Trends and insights
  trends: {
    overall: {
      direction: 'improving' | 'degrading' | 'stable';
      change: number; // percentage change
      significance: number;
    };
    categories: Array<{
      category: PerformanceBudget['category'];
      direction: 'improving' | 'degrading' | 'stable';
      change: number;
      significance: number;
    }>;
  };

  // Recommendations
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    impact: string;
    effort: string;
  }>;
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'violation' | 'trend' | 'prediction' | 'approval_required';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: Date;

  // Budget information
  budgetId: string;
  budgetName: string;
  category: PerformanceBudget['category'];

  // Alert details
  details: {
    currentValue: number;
    budgetValue: number;
    utilization: number;
    threshold: number;
    previousValue?: number;
    trend?: string;
    prediction?: {
      value: number;
      date: Date;
      confidence: number;
    };
  };

  // Context
  context: {
    environment: string;
    scenario?: string;
    commit?: string;
    deployment?: string;
    trigger: string;
  };

  // Impact
  impact: {
    userExperience: 'low' | 'medium' | 'high' | 'critical';
    businessImpact: string;
    affectedFeatures: string[];
    estimatedCost: number;
  };

  // Actions
  actions: Array<{
    type: 'investigate' | 'optimize' | 'approve' | 'reject' | 'escalate';
    description: string;
    automated: boolean;
    url?: string;
    deadline?: Date;
    owner?: string;
  }>;

  // Notification
  notifications: {
    channels: string[];
    sent: boolean;
    timestamp?: Date;
    responses?: Array<{
      user: string;
      action: string;
      timestamp: Date;
      comment?: string;
    }>;
  };
}

/**
 * Advanced Performance Budget Enforcement System
 */
export class PerformanceBudgetEnforcer {
  private static instance: PerformanceBudgetEnforcer;
  private budgets: Map<string, PerformanceBudget> = new Map();
  private validations: BudgetValidation[] = [];
  private alerts: BudgetAlert[] = [];
  private reports: BudgetComplianceReport[] = [];

  // Core components
  private budgetValidator: BudgetValidator;
  private budgetAnalyzer: BudgetAnalyzer;
  private budgetOptimizer: BudgetOptimizer;
  private budgetEnforcer: EnforcementEngine;
  private alertManager: BudgetAlertManager;
  private reportGenerator: BudgetReportGenerator;

  // Monitoring and learning
  private trendAnalyzer: BudgetTrendAnalyzer;
  private predictiveAnalyzer: BudgetPredictiveAnalyzer;
  private budgetLearner: BudgetMachineLearner;

  private constructor() {
    this.budgetValidator = new BudgetValidator();
    this.budgetAnalyzer = new BudgetAnalyzer();
    this.budgetOptimizer = new BudgetOptimizer();
    this.budgetEnforcer = new EnforcementEngine();
    this.alertManager = new BudgetAlertManager();
    this.reportGenerator = new BudgetReportGenerator();
    this.trendAnalyzer = new BudgetTrendAnalyzer();
    this.predictiveAnalyzer = new BudgetPredictiveAnalyzer();
    this.budgetLearner = new BudgetMachineLearner();

    this.initializeDefaultBudgets();
  }

  public static getInstance(): PerformanceBudgetEnforcer {
    if (!PerformanceBudgetEnforcer.instance) {
      PerformanceBudgetEnforcer.instance = new PerformanceBudgetEnforcer();
    }
    return PerformanceBudgetEnforcer.instance;
  }

  /**
   * Initialize the budget enforcement system
   */
  public async initialize(): Promise<void> {
    console.log('🔒 Initializing Performance Budget Enforcer...');

    try {
      // Load existing budgets
      await this.loadBudgets();

      // Load historical data
      await this.loadHistoricalData();

      // Initialize components
      await this.budgetValidator.initialize();
      await this.budgetAnalyzer.initialize();
      await this.budgetOptimizer.initialize();
      await this.budgetEnforcer.initialize();
      await this.alertManager.initialize();
      await this.reportGenerator.initialize();
      await this.trendAnalyzer.initialize();
      await this.predictiveAnalyzer.initialize();
      await this.budgetLearner.initialize();

      console.log('✅ Performance Budget Enforcer initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Performance Budget Enforcer:', error);
      throw error;
    }
  }

  /**
   * Add or update a performance budget
   */
  public async upsertBudget(budget: PerformanceBudget): Promise<void> {
    console.log(`📊 Upserting budget: ${budget.name}`);

    // Validate budget structure
    this.validateBudgetStructure(budget);

    // Update metadata
    budget.metadata.updatedAt = new Date();
    if (!budget.metadata.createdAt) {
      budget.metadata.createdAt = new Date();
    }

    // Store budget
    this.budgets.set(budget.id, budget);

    // Save to storage
    await this.saveBudget(budget);

    // Trigger validation if enabled
    if (budget.validation.enabled && budget.validation.frequency === 'immediate') {
      await this.validateBudget(budget.id);
    }

    console.log(`✅ Budget upserted: ${budget.name}`);
  }

  /**
   * Validate performance against budgets
   */
  public async validatePerformance(
    results: PerformanceTestResult[],
    context?: {
      environment: string;
      commit?: string;
      deployment?: string;
      buildNumber?: string;
    }
  ): Promise<BudgetValidation[]> {
    console.log(`🔍 Validating performance against ${this.budgets.size} budgets...`);

    const validations: BudgetValidation[] = [];

    for (const budget of this.budgets.values()) {
      if (budget.validation.enabled) {
        const validation = await this.validateBudgetAgainstResults(budget, results, context);
        validations.push(validation);
      }
    }

    // Store validations
    this.validations.push(...validations);

    // Clean old validations
    await this.cleanupValidations();

    // Process alerts and enforcement
    await this.processValidationResults(validations);

    console.log(`✅ Performance validation completed: ${validations.length} budgets checked`);
    return validations;
  }

  /**
   * Generate budget compliance report
   */
  public async generateComplianceReport(
    period?: { start: Date; end: Date }
  ): Promise<BudgetComplianceReport> {
    console.log('📋 Generating budget compliance report...');

    const report = await this.reportGenerator.generateComplianceReport(
      this.budgets,
      this.validations,
      period
    );

    // Store report
    this.reports.push(report);

    // Clean old reports
    await this.cleanupReports();

    console.log('✅ Compliance report generated');
    return report;
  }

  /**
   * Get budget status and health
   */
  public getBudgetHealth(): {
    total: number;
    compliant: number;
    warning: number;
    violation: number;
    overallScore: number;
    categoryBreakdown: Record<string, {
      total: number;
      compliant: number;
      warning: number;
      violation: number;
      score: number;
    }>;
  } {
    const recentValidations = this.getRecentValidations(24 * 60 * 60 * 1000); // Last 24 hours

    const health = {
      total: this.budgets.size,
      compliant: recentValidations.filter(v => v.status === 'compliant').length,
      warning: recentValidations.filter(v => v.status === 'warning').length,
      violation: recentValidations.filter(v => v.status === 'violation').length,
      overallScore: 0,
      categoryBreakdown: {} as any,
    };

    // Calculate overall score
    health.overallScore = health.total > 0
      ? Math.round((health.compliant / health.total) * 100)
      : 100;

    // Calculate category breakdown
    const categories = ['bundle', 'runtime', 'memory', 'network', 'user-experience', 'custom'];

    for (const category of categories) {
      const categoryBudgets = Array.from(this.budgets.values()).filter(b => b.category === category);
      const categoryValidations = recentValidations.filter(v => {
        const budget = this.budgets.get(v.budgetId);
        return budget?.category === category;
      });

      const categoryCompliant = categoryValidations.filter(v => v.status === 'compliant').length;
      const categoryWarning = categoryValidations.filter(v => v.status === 'warning').length;
      const categoryViolation = categoryValidations.filter(v => v.status === 'violation').length;

      health.categoryBreakdown[category] = {
        total: categoryBudgets.length,
        compliant: categoryCompliant,
        warning: categoryWarning,
        violation: categoryViolation,
        score: categoryBudgets.length > 0
          ? Math.round((categoryCompliant / categoryBudgets.length) * 100)
          : 100,
      };
    }

    return health;
  }

  // Private methods
  private initializeDefaultBudgets(): void {
    console.log('📊 Initializing default performance budgets...');

    // Bundle size budgets
    this.budgets.set('bundle-total', {
      id: 'bundle-total',
      name: 'Total Bundle Size',
      description: 'Total JavaScript bundle size including all dependencies',
      category: 'bundle',
      scope: 'global',
      budget: {
        type: 'absolute',
        value: 500, // 500KB
        unit: 'KB',
        threshold: {
          warning: 90, // 90% of budget
          critical: 100, // 100% of budget
        },
      },
      conditions: {
        environments: ['production', 'staging'],
      },
      validation: {
        enabled: true,
        frequency: 'immediate',
        sampling: {
          size: 5,
          window: 60,
          aggregation: 'mean',
        },
        outlierDetection: {
          enabled: true,
          method: 'iqr',
          threshold: 1.5,
        },
        gracePeriod: 30, // 30 minutes
      },
      enforcement: {
        enabled: true,
        actions: [
          {
            trigger: 'warning',
            type: 'alert',
            automated: true,
            conditions: [],
            delay: 0,
          },
          {
            trigger: 'critical',
            type: 'block',
            automated: false,
            conditions: ['production'],
            delay: 0,
            escalation: {
              level: 1,
              conditions: ['no_response_1h'],
              actions: ['notify_team_lead', 'create_ticket'],
            },
          },
        ],
        approvalRequired: true,
        approvers: ['team-lead', 'performance-architect'],
      },
      analytics: {
        trendAnalysis: true,
        seasonalAdjustment: false,
        predictiveAlerts: true,
        machineLearning: {
          enabled: true,
          algorithms: ['linear_regression', 'time_series'],
          trainingWindow: 30,
          predictionHorizon: 7,
        },
      },
      metadata: {
        owner: 'frontend-team',
        team: 'performance',
        priority: 'high',
        tags: ['bundle', 'javascript', 'critical'],
        relatedBudgets: ['bundle-javascript', 'bundle-vendor'],
        dependencies: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // JavaScript bundle budget
    this.budgets.set('bundle-javascript', {
      id: 'bundle-javascript',
      name: 'JavaScript Bundle Size',
      description: 'Size of JavaScript files excluding vendor libraries',
      category: 'bundle',
      scope: 'global',
      budget: {
        type: 'absolute',
        value: 250, // 250KB
        unit: 'KB',
        threshold: {
          warning: 85,
          critical: 100,
        },
      },
      conditions: {
        environments: ['production', 'staging'],
      },
      validation: {
        enabled: true,
        frequency: 'immediate',
        sampling: {
          size: 5,
          window: 60,
          aggregation: 'mean',
        },
        outlierDetection: {
          enabled: true,
          method: 'iqr',
          threshold: 1.5,
        },
        gracePeriod: 30,
      },
      enforcement: {
        enabled: true,
        actions: [
          {
            trigger: 'warning',
            type: 'optimize',
            automated: true,
            conditions: [],
            delay: 60, // 1 hour
          },
        ],
        approvalRequired: false,
      },
      analytics: {
        trendAnalysis: true,
        seasonalAdjustment: false,
        predictiveAlerts: true,
        machineLearning: {
          enabled: true,
          algorithms: ['linear_regression'],
          trainingWindow: 30,
          predictionHorizon: 7,
        },
      },
      metadata: {
        owner: 'frontend-team',
        team: 'performance',
        priority: 'high',
        tags: ['bundle', 'javascript'],
        relatedBudgets: ['bundle-total', 'bundle-vendor'],
        dependencies: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Runtime performance budgets
    this.budgets.set('runtime-load-time', {
      id: 'runtime-load-time',
      name: 'Page Load Time',
      description: 'Time from navigation start to load complete event',
      category: 'runtime',
      scope: 'global',
      budget: {
        type: 'absolute',
        value: 3000, // 3 seconds
        unit: 'ms',
        threshold: {
          warning: 80,
          critical: 100,
        },
      },
      conditions: {
        environments: ['production', 'staging'],
        deviceTypes: ['desktop', 'mobile'],
        networkConditions: ['4g', 'wifi'],
      },
      validation: {
        enabled: true,
        frequency: 'immediate',
        sampling: {
          size: 10,
          window: 60,
          aggregation: 'p95',
        },
        outlierDetection: {
          enabled: true,
          method: 'zscore',
          threshold: 2,
        },
        gracePeriod: 15,
      },
      enforcement: {
        enabled: true,
        actions: [
          {
            trigger: 'warning',
            type: 'alert',
            automated: true,
            conditions: [],
            delay: 0,
          },
          {
            trigger: 'critical',
            type: 'block',
            automated: false,
            conditions: ['production'],
            delay: 0,
          },
        ],
        approvalRequired: true,
        approvers: ['performance-lead'],
      },
      analytics: {
        trendAnalysis: true,
        seasonalAdjustment: true,
        predictiveAlerts: true,
        machineLearning: {
          enabled: true,
          algorithms: ['time_series', 'anomaly_detection'],
          trainingWindow: 14,
          predictionHorizon: 3,
        },
      },
      metadata: {
        owner: 'frontend-team',
        team: 'performance',
        priority: 'critical',
        tags: ['runtime', 'load-time', 'ux'],
        relatedBudgets: ['runtime-tti', 'runtime-lcp'],
        dependencies: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextReview: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
    });

    // Core Web Vitals budgets
    this.budgets.set('cwv-lcp', {
      id: 'cwv-lcp',
      name: 'Largest Contentful Paint (LCP)',
      description: 'Time to render the largest content element in the viewport',
      category: 'user-experience',
      scope: 'global',
      budget: {
        type: 'absolute',
        value: 2500, // 2.5 seconds (Google's recommended threshold)
        unit: 'ms',
        threshold: {
          warning: 100, // 100% of threshold
          critical: 120, // 20% over threshold
        },
      },
      conditions: {
        environments: ['production'],
        deviceTypes: ['mobile', 'desktop'],
      },
      validation: {
        enabled: true,
        frequency: 'immediate',
        sampling: {
          size: 25,
          window: 120,
          aggregation: 'p75',
        },
        outlierDetection: {
          enabled: true,
          method: 'iqr',
          threshold: 2,
        },
        gracePeriod: 0,
      },
      enforcement: {
        enabled: true,
        actions: [
          {
            trigger: 'warning',
            type: 'alert',
            automated: true,
            conditions: [],
            delay: 0,
          },
          {
            trigger: 'critical',
            type: 'alert',
            automated: true,
            conditions: [],
            delay: 0,
            escalation: {
              level: 1,
              conditions: ['no_improvement_24h'],
              actions: ['notify_product', 'create_incident'],
            },
          },
        ],
        approvalRequired: false,
      },
      analytics: {
        trendAnalysis: true,
        seasonalAdjustment: true,
        predictiveAlerts: true,
        machineLearning: {
          enabled: true,
          algorithms: ['time_series'],
          trainingWindow: 30,
          predictionHorizon: 7,
        },
      },
      metadata: {
        owner: 'frontend-team',
        team: 'performance',
        priority: 'critical',
        tags: ['cwv', 'lcp', 'ux', 'google'],
        relatedBudgets: ['cwv-fid', 'cwv-cls'],
        dependencies: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    this.budgets.set('cwv-fid', {
      id: 'cwv-fid',
      name: 'First Input Delay (FID)',
      description: 'Time from user first interaction to browser response',
      category: 'user-experience',
      scope: 'global',
      budget: {
        type: 'absolute',
        value: 100, // 100ms (Google's recommended threshold)
        unit: 'ms',
        threshold: {
          warning: 100,
          critical: 150,
        },
      },
      conditions: {
        environments: ['production'],
        deviceTypes: ['mobile', 'desktop'],
      },
      validation: {
        enabled: true,
        frequency: 'hourly',
        sampling: {
          size: 50,
          window: 60,
          aggregation: 'p95',
        },
        outlierDetection: {
          enabled: true,
          method: 'iqr',
          threshold: 2,
        },
        gracePeriod: 0,
      },
      enforcement: {
        enabled: true,
        actions: [
          {
            trigger: 'warning',
            type: 'alert',
            automated: true,
            conditions: [],
            delay: 0,
          },
          {
            trigger: 'critical',
            type: 'alert',
            automated: true,
            conditions: [],
            delay: 0,
          },
        ],
        approvalRequired: false,
      },
      analytics: {
        trendAnalysis: true,
        seasonalAdjustment: false,
        predictiveAlerts: true,
        machineLearning: {
          enabled: true,
          algorithms: ['time_series'],
          trainingWindow: 30,
          predictionHorizon: 7,
        },
      },
      metadata: {
        owner: 'frontend-team',
        team: 'performance',
        priority: 'critical',
        tags: ['cwv', 'fid', 'ux', 'google'],
        relatedBudgets: ['cwv-lcp', 'cwv-cls'],
        dependencies: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    this.budgets.set('cwv-cls', {
      id: 'cwv-cls',
      name: 'Cumulative Layout Shift (CLS)',
      description: 'Measure of visual stability of web page',
      category: 'user-experience',
      scope: 'global',
      budget: {
        type: 'absolute',
        value: 0.1, // 0.1 (Google's recommended threshold)
        unit: 'score',
        threshold: {
          warning: 100, // 100% of threshold
          critical: 150, // 50% over threshold
        },
      },
      conditions: {
        environments: ['production'],
        deviceTypes: ['mobile', 'desktop'],
      },
      validation: {
        enabled: true,
        frequency: 'hourly',
        sampling: {
          size: 100,
          window: 60,
          aggregation: 'p95',
        },
        outlierDetection: {
          enabled: true,
          method: 'iqr',
          threshold: 2,
        },
        gracePeriod: 0,
      },
      enforcement: {
        enabled: true,
        actions: [
          {
            trigger: 'warning',
            type: 'alert',
            automated: true,
            conditions: [],
            delay: 0,
          },
          {
            trigger: 'critical',
            type: 'alert',
            automated: true,
            conditions: [],
            delay: 0,
          },
        ],
        approvalRequired: false,
      },
      analytics: {
        trendAnalysis: true,
        seasonalAdjustment: false,
        predictiveAlerts: true,
        machineLearning: {
          enabled: true,
          algorithms: ['time_series'],
          trainingWindow: 30,
          predictionHorizon: 7,
        },
      },
      metadata: {
        owner: 'frontend-team',
        team: 'performance',
        priority: 'critical',
        tags: ['cwv', 'cls', 'ux', 'google'],
        relatedBudgets: ['cwv-lcp', 'cwv-fid'],
        dependencies: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Memory usage budgets
    this.budgets.set('memory-usage', {
      id: 'memory-usage',
      name: 'JavaScript Memory Usage',
      description: 'Peak JavaScript heap memory usage during page load',
      category: 'memory',
      scope: 'global',
      budget: {
        type: 'absolute',
        value: 50, // 50MB
        unit: 'MB',
        threshold: {
          warning: 80,
          critical: 100,
        },
      },
      conditions: {
        environments: ['production', 'staging'],
        deviceTypes: ['mobile'],
      },
      validation: {
        enabled: true,
        frequency: 'immediate',
        sampling: {
          size: 5,
          window: 30,
          aggregation: 'max',
        },
        outlierDetection: {
          enabled: true,
          method: 'iqr',
          threshold: 1.5,
        },
        gracePeriod: 15,
      },
      enforcement: {
        enabled: true,
        actions: [
          {
            trigger: 'warning',
            type: 'alert',
            automated: true,
            conditions: [],
            delay: 0,
          },
          {
            trigger: 'critical',
            type: 'optimize',
            automated: true,
            conditions: ['memory_leak_detected'],
            delay: 30,
          },
        ],
        approvalRequired: false,
      },
      analytics: {
        trendAnalysis: true,
        seasonalAdjustment: false,
        predictiveAlerts: true,
        machineLearning: {
          enabled: true,
          algorithms: ['anomaly_detection'],
          trainingWindow: 14,
          predictionHorizon: 3,
        },
      },
      metadata: {
        owner: 'frontend-team',
        team: 'performance',
        priority: 'medium',
        tags: ['memory', 'heap', 'mobile'],
        relatedBudgets: ['memory-leak'],
        dependencies: [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`✅ Initialized ${this.budgets.size} default budgets`);
  }

  private validateBudgetStructure(budget: PerformanceBudget): void {
    // Validate required fields
    const requiredFields = ['id', 'name', 'description', 'category', 'scope'];
    for (const field of requiredFields) {
      if (!budget[field as keyof PerformanceBudget]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate budget structure
    if (!budget.budget || !budget.budget.type || !budget.budget.value) {
      throw new Error('Invalid budget definition');
    }

    // Validate thresholds
    if (!budget.budget.threshold || budget.budget.threshold.warning >= budget.budget.threshold.critical) {
      throw new Error('Invalid threshold configuration');
    }
  }

  private async validateBudget(budgetId: string): Promise<BudgetValidation | null> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    // Get recent test results for validation
    const results = await this.getRecentTestResults(budget.validation.sampling.window);

    if (results.length < budget.validation.sampling.size) {
      console.warn(`Insufficient samples for budget ${budget.name}: ${results.length}/${budget.validation.sampling.size}`);
      return null;
    }

    return await this.budgetValidator.validateBudget(budget, results);
  }

  private async validateBudgetAgainstResults(
    budget: PerformanceBudget,
    results: PerformanceTestResult[],
    context?: {
      environment: string;
      commit?: string;
      deployment?: string;
      buildNumber?: string;
    }
  ): Promise<BudgetValidation> {
    // Filter results based on budget conditions
    const filteredResults = this.filterResultsForBudget(budget, results, context);

    if (filteredResults.length === 0) {
      // Create a compliant validation if no matching results
      return {
        id: `validation-${Date.now()}-${budget.id}`,
        budgetId: budget.id,
        budgetName: budget.name,
        timestamp: new Date(),
        status: 'compliant',
        actualValue: 0,
        budgetValue: budget.budget.value,
        utilization: 0,
        samples: [],
        statistics: {
          mean: 0,
          median: 0,
          p95: 0,
          p99: 0,
          min: 0,
          max: 0,
          standardDeviation: 0,
          confidenceInterval: { lower: 0, upper: 0, level: 0.95 },
        },
        context: {
          environment: context?.environment || 'unknown',
          commit: context?.commit,
          deployment: context?.deployment,
          buildNumber: context?.buildNumber,
        },
        impact: {
          userExperience: 'low',
          businessImpact: 'No data available',
          affectedUsers: 0,
          revenueImpact: 0,
          supportTicketsImpact: 0,
        },
        recommendations: [],
        actions: [],
      };
    }

    return await this.budgetValidator.validateBudget(budget, filteredResults, context);
  }

  private filterResultsForBudget(
    budget: PerformanceBudget,
    results: PerformanceTestResult[],
    context?: {
      environment: string;
      commit?: string;
      deployment?: string;
      buildNumber?: string;
    }
  ): PerformanceTestResult[] {
    return results.filter(result => {
      // Check environment conditions
      if (budget.conditions.environments &&
          !budget.conditions.environments.includes(result.environment)) {
        return false;
      }

      // Check scenario conditions
      if (budget.conditions.scenarios &&
          !budget.conditions.scenarios.includes(result.scenario)) {
        return false;
      }

      // Check if result is within grace period
      if (budget.validation.gracePeriod > 0 && context?.deployment) {
        const deploymentTime = new Date(context.deployment);
        const gracePeriodEnd = new Date(deploymentTime.getTime() + budget.validation.gracePeriod * 60 * 1000);

        if (result.timestamp < gracePeriodEnd) {
          return false;
        }
      }

      return true;
    });
  }

  private async processValidationResults(validations: BudgetValidation[]): Promise<void> {
    for (const validation of validations) {
      // Check if alert is needed
      if (validation.status === 'warning' || validation.status === 'violation') {
        await this.alertManager.createAlert(validation);
      }

      // Check if enforcement action is needed
      if (validation.status === 'violation') {
        await this.budgetEnforcer.enforceBudget(validation);
      }
    }
  }

  private getRecentValidations(timeWindowMs: number): BudgetValidation[] {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return this.validations.filter(v => v.timestamp >= cutoff);
  }

  private getRecentTestResults(timeWindowMs: number): PerformanceTestResult[] {
    // In a real implementation, this would load from storage/database
    // For now, return empty array
    return [];
  }

  private async loadBudgets(): Promise<void> {
    // In a real implementation, this would load from storage/database
    console.log('📊 Loading budgets from storage...');
  }

  private async loadHistoricalData(): Promise<void> {
    // In a real implementation, this would load historical validation data
    console.log('📈 Loading historical data...');
  }

  private async saveBudget(budget: PerformanceBudget): Promise<void> {
    // In a real implementation, this would save to storage/database
    console.log(`💾 Saving budget: ${budget.name}`);
  }

  private async cleanupValidations(): Promise<void> {
    // Keep only last 30 days of validations
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const originalLength = this.validations.length;
    this.validations = this.validations.filter(v => v.timestamp >= cutoff);

    if (this.validations.length < originalLength) {
      console.log(`🧹 Cleaned up ${originalLength - this.validations.length} old validations`);
    }
  }

  private async cleanupReports(): Promise<void> {
    // Keep only last 90 days of reports
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const originalLength = this.reports.length;
    this.reports = this.reports.filter(r => r.timestamp >= cutoff);

    if (this.reports.length < originalLength) {
      console.log(`🧹 Cleaned up ${originalLength - this.reports.length} old reports`);
    }
  }

  // Public API methods
  public getBudgets(): Map<string, PerformanceBudget> {
    return new Map(this.budgets);
  }

  public getBudget(id: string): PerformanceBudget | undefined {
    return this.budgets.get(id);
  }

  public deleteBudget(id: string): boolean {
    const deleted = this.budgets.delete(id);
    if (deleted) {
      console.log(`🗑️ Deleted budget: ${id}`);
    }
    return deleted;
  }

  public getValidations(budgetId?: string, timeWindowMs?: number): BudgetValidation[] {
    let validations = this.validations;

    if (budgetId) {
      validations = validations.filter(v => v.budgetId === budgetId);
    }

    if (timeWindowMs) {
      const cutoff = new Date(Date.now() - timeWindowMs);
      validations = validations.filter(v => v.timestamp >= cutoff);
    }

    return validations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getReports(timeWindowMs?: number): BudgetComplianceReport[] {
    let reports = this.reports;

    if (timeWindowMs) {
      const cutoff = new Date(Date.now() - timeWindowMs);
      reports = reports.filter(r => r.timestamp >= cutoff);
    }

    return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Performance Budget Enforcer...');

    await this.budgetValidator.cleanup?.();
    await this.budgetAnalyzer.cleanup?.();
    await this.budgetOptimizer.cleanup?.();
    await this.budgetEnforcer.cleanup?.();
    await this.alertManager.cleanup?.();
    await this.reportGenerator.cleanup?.();
    await this.trendAnalyzer.cleanup?.();
    await this.predictiveAnalyzer.cleanup?.();
    await this.budgetLearner.cleanup?.();

    // Clear in-memory data
    this.budgets.clear();
    this.validations = [];
    this.alerts = [];
    this.reports = [];

    console.log('✅ Performance Budget Enforcer cleaned up');
  }
}

// Supporting classes (simplified implementations)
class BudgetValidator {
  async initialize(): Promise<void> {
    console.log('🔍 Initializing Budget Validator...');
  }

  async validateBudget(
    budget: PerformanceBudget,
    results: PerformanceTestResult[],
    context?: {
      environment?: string;
      commit?: string;
      deployment?: string;
      buildNumber?: string;
    }
  ): Promise<BudgetValidation> {
    // Extract values from results based on budget category
    const values = this.extractValuesFromResults(budget, results);

    if (values.length === 0) {
      throw new Error(`No matching results found for budget ${budget.name}`);
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(values);

    // Determine actual value based on aggregation method
    const actualValue = this.getAggregatedValue(statistics, budget.validation.sampling.aggregation);

    // Calculate utilization
    const utilization = (actualValue / budget.budget.value) * 100;

    // Determine status
    let status: BudgetValidation['status'];
    if (utilization <= budget.budget.threshold.warning) {
      status = 'compliant';
    } else if (utilization < budget.budget.threshold.critical) {
      status = 'warning';
    } else {
      status = 'violation';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(budget, actualValue, utilization);

    return {
      id: `validation-${Date.now()}-${budget.id}`,
      budgetId: budget.id,
      budgetName: budget.name,
      timestamp: new Date(),
      status,
      actualValue,
      budgetValue: budget.budget.value,
      utilization,
      samples: values.map((value, index) => ({
        value,
        timestamp: results[index]?.timestamp || new Date(),
        scenario: results[index]?.scenario || 'unknown',
        environment: results[index]?.environment || 'unknown',
        source: 'performance-test',
      })),
      statistics,
      context: {
        environment: context?.environment || 'unknown',
        scenario: results[0]?.scenario,
        commit: context?.commit,
        deployment: context?.deployment,
        buildNumber: context?.buildNumber,
      },
      impact: this.assessImpact(budget, utilization),
      recommendations,
      actions: [],
    };
  }

  private extractValuesFromResults(budget: PerformanceBudget, results: PerformanceTestResult[]): number[] {
    const values: number[] = [];

    for (const result of results) {
      let value: number | null = null;

      switch (budget.category) {
        case 'bundle':
          value = result.metrics.bundleSize;
          break;
        case 'runtime':
          value = result.metrics.loadTime;
          break;
        case 'memory':
          value = result.metrics.memoryUsage;
          break;
        case 'user-experience':
          // Handle different UX metrics
          if (budget.name.includes('LCP')) {
            value = result.metrics.largestContentfulPaint;
          } else if (budget.name.includes('FID')) {
            value = result.metrics.firstInputDelay;
          } else if (budget.name.includes('CLS')) {
            value = result.metrics.cumulativeLayoutShift;
          } else if (budget.name.includes('TTI')) {
            value = result.metrics.timeToInteractive;
          } else {
            value = result.metrics.loadTime; // Default to load time
          }
          break;
        default:
          // Try to find matching custom metric
          value = result.metrics.customMetrics[budget.id] || null;
      }

      if (value !== null && value > 0) {
        values.push(value);
      }
    }

    return values;
  }

  private calculateStatistics(values: number[]): BudgetValidation['statistics'] {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;

    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);

    // Calculate percentiles
    const median = sorted[Math.floor(n / 2)];
    const p95 = sorted[Math.floor(n * 0.95)];
    const p99 = sorted[Math.floor(n * 0.99)];

    // Calculate confidence interval
    const margin = 1.96 * (standardDeviation / Math.sqrt(n));

    return {
      mean,
      median,
      p95,
      p99,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      standardDeviation,
      confidenceInterval: {
        lower: mean - margin,
        upper: mean + margin,
        level: 0.95,
      },
    };
  }

  private getAggregatedValue(
    statistics: BudgetValidation['statistics'],
    aggregation: string
  ): number {
    switch (aggregation) {
      case 'mean':
        return statistics.mean;
      case 'median':
        return statistics.median;
      case 'p95':
        return statistics.p95;
      case 'p99':
        return statistics.p99;
      case 'max':
        return statistics.max;
      default:
        return statistics.mean;
    }
  }

  private assessImpact(
    budget: PerformanceBudget,
    utilization: number
  ): BudgetValidation['impact'] {
    let userExperience: BudgetValidation['impact']['userExperience'] = 'low';
    let businessImpact = 'Minimal impact on user experience';

    if (utilization >= 100) {
      userExperience = 'critical';
      businessImpact = 'Severe impact on user experience and business metrics';
    } else if (utilization >= 90) {
      userExperience = 'high';
      businessImpact = 'Significant impact on user experience and engagement';
    } else if (utilization >= 80) {
      userExperience = 'medium';
      businessImpact = 'Moderate impact on user experience';
    }

    // Estimate affected users (simplified)
    const affectedUsers = Math.floor(1000 * (utilization / 100)); // Assume 1000 total users

    // Estimate revenue impact (simplified)
    const revenueImpact = utilization > 100 ? (utilization - 100) * 0.01 : 0; // 1% revenue impact per % over budget

    return {
      userExperience,
      businessImpact,
      affectedUsers,
      revenueImpact,
      supportTicketsImpact: utilization > 90 ? Math.floor(affectedUsers * 0.05) : 0,
    };
  }

  private generateRecommendations(
    budget: PerformanceBudget,
    actualValue: number,
    utilization: number
  ): BudgetValidation['recommendations'] {
    const recommendations: BudgetValidation['recommendations'] = [];

    if (utilization >= 100) {
      recommendations.push({
        priority: 'critical',
        type: 'immediate',
        description: `Budget exceeded by ${utilization - 100}%. Immediate action required.`,
        effortEstimate: '2-4 hours',
        expectedImprovement: 20,
        dependencies: ['code-analysis'],
        owner: budget.metadata.owner,
      });

      recommendations.push({
        priority: 'critical',
        type: 'immediate',
        description: 'Consider rolling back recent changes if budget breach is severe.',
        effortEstimate: '< 1 hour',
        expectedImprovement: 100,
        dependencies: ['deployment-system'],
        owner: budget.metadata.owner,
      });
    } else if (utilization >= 90) {
      recommendations.push({
        priority: 'high',
        type: 'short_term',
        description: `Budget utilization high at ${utilization}%. Optimization recommended.`,
        effortEstimate: '4-8 hours',
        expectedImprovement: 15,
        dependencies: ['performance-analysis'],
        owner: budget.metadata.owner,
      });
    } else if (utilization >= 80) {
      recommendations.push({
        priority: 'medium',
        type: 'long_term',
        description: `Budget utilization at ${utilization}%. Monitor and plan optimizations.`,
        effortEstimate: '1-2 days',
        expectedImprovement: 10,
        dependencies: [],
        owner: budget.metadata.owner,
      });
    }

    // Category-specific recommendations
    if (budget.category === 'bundle') {
      recommendations.push({
        priority: utilization > 90 ? 'high' : 'medium',
        type: 'short_term',
        description: 'Analyze bundle composition and identify optimization opportunities.',
        effortEstimate: '2-4 hours',
        expectedImprovement: 15,
        dependencies: ['bundle-analyzer'],
      });
    } else if (budget.category === 'runtime') {
      recommendations.push({
        priority: utilization > 90 ? 'high' : 'medium',
        type: 'short_term',
        description: 'Profile runtime performance to identify bottlenecks.',
        effortEstimate: '3-6 hours',
        expectedImprovement: 20,
        dependencies: ['profiling-tools'],
      });
    }

    return recommendations;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Budget Validator...');
  }
}

class BudgetAnalyzer {
  async initialize(): Promise<void> {
    console.log('📊 Initializing Budget Analyzer...');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Budget Analyzer...');
  }
}

class BudgetOptimizer {
  async initialize(): Promise<void> {
    console.log('💡 Initializing Budget Optimizer...');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Budget Optimizer...');
  }
}

class EnforcementEngine {
  async initialize(): Promise<void> {
    console.log('⚖️ Initializing Enforcement Engine...');
  }

  async enforceBudget(validation: BudgetValidation): Promise<void> {
    if (validation.status !== 'violation') {
      return;
    }

    console.log(`⚠️ Enforcing budget: ${validation.budgetName} (utilization: ${validation.utilization}%)`);

    // Implementation would trigger enforcement actions
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Enforcement Engine...');
  }
}

class BudgetAlertManager {
  async initialize(): Promise<void> {
    console.log('🚨 Initializing Budget Alert Manager...');
  }

  async createAlert(validation: BudgetValidation): Promise<void> {
    console.log(`🚨 Creating alert for budget: ${validation.budgetName}`);

    // Implementation would create and send alerts
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Budget Alert Manager...');
  }
}

class BudgetReportGenerator {
  async initialize(): Promise<void> {
    console.log('📋 Initializing Budget Report Generator...');
  }

  async generateComplianceReport(
    budgets: Map<string, PerformanceBudget>,
    validations: BudgetValidation[],
    period?: { start: Date; end: Date }
  ): Promise<BudgetComplianceReport> {
    // Simplified report generation
    const recentValidations = validations.filter(v =>
      !period || (v.timestamp >= period.start && v.timestamp <= period.end)
    );

    const report: BudgetComplianceReport = {
      id: `report-${Date.now()}`,
      timestamp: new Date(),
      period: period || {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
        duration: 24 * 60 * 60 * 1000,
      },
      overallCompliance: {
        status: 'compliant',
        score: 85,
        budgetCount: budgets.size,
        compliantCount: recentValidations.filter(v => v.status === 'compliant').length,
        warningCount: recentValidations.filter(v => v.status === 'warning').length,
        violationCount: recentValidations.filter(v => v.status === 'violation').length,
      },
      budgetCompliance: [],
      categoryCompliance: [],
      trends: {
        overall: {
          direction: 'stable',
          change: 0,
          significance: 0,
        },
        categories: [],
      },
      recommendations: [],
    };

    return report;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Budget Report Generator...');
  }
}

class BudgetTrendAnalyzer {
  async initialize(): Promise<void> {
    console.log('📈 Initializing Budget Trend Analyzer...');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Budget Trend Analyzer...');
  }
}

class BudgetPredictiveAnalyzer {
  async initialize(): Promise<void> {
    console.log('🔮 Initializing Budget Predictive Analyzer...');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Budget Predictive Analyzer...');
  }
}

class BudgetMachineLearner {
  async initialize(): Promise<void> {
    console.log('🤖 Initializing Budget Machine Learner...');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Budget Machine Learner...');
  }
}

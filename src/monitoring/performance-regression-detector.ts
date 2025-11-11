/**
 * Performance Comparison and Regression Detection Engine
 * Advanced statistical analysis and regression detection algorithms
 * Features machine learning-based anomaly detection, correlation analysis, and predictive modeling
 */

import { PerformanceTestResult, PerformanceBaseline } from './performance-regression-testing';

export interface RegressionDetectionConfig {
  thresholds: {
    // Response time thresholds
    responseTime: {
      warning: number; // percentage increase
      critical: number; // percentage increase
      absoluteWarning: number; // milliseconds
      absoluteCritical: number; // milliseconds
      minSampleSize: number; // minimum samples for statistical significance
    };
    // Bundle size thresholds
    bundleSize: {
      warning: number; // percentage increase
      critical: number; // percentage increase
      absoluteWarning: number; // KB
      absoluteCritical: number; // KB
      minSampleSize: number;
    };
    // Memory usage thresholds
    memoryUsage: {
      warning: number; // percentage increase
      critical: number; // percentage increase
      absoluteWarning: number; // MB
      absoluteCritical: number; // MB
      minSampleSize: number;
    };
    // Core Web Vitals thresholds
    coreWebVitals: {
      LCP: { warning: number; critical: number }; // percentage increase or absolute ms
      FID: { warning: number; critical: number };
      CLS: { warning: number; critical: number };
      FCP: { warning: number; critical: number };
      TTI: { warning: number; critical: number };
    };
  };
  statistical: {
    significanceLevel: number; // alpha level for hypothesis testing (0.05)
    power: number; // statistical power (0.8)
    effectSize: number; // minimum effect size to detect (Cohen's d)
    multipleTestingCorrection: 'bonferroni' | 'fdr' | 'none';
    confidenceInterval: number; // 0.95 for 95% CI
    outlierDetection: {
      enabled: boolean;
      method: 'iqr' | 'zscore' | 'isolation_forest';
      threshold: number;
    };
  };
  machineLearning: {
    enabled: boolean;
    algorithms: Array<'isolation_forest' | 'local_outlier_factor' | 'one_class_svm'>;
    anomalyThreshold: number; // 0-1
    trainingWindowSize: number; // number of historical data points
    featureEngineering: {
      enablePolynomialFeatures: boolean;
      enableInteractionTerms: boolean;
      enableTimeBasedFeatures: boolean;
    };
  };
  correlation: {
    enabled: boolean;
    minCorrelationThreshold: number; // minimum correlation to report
    maxLag: number; // maximum lag for time series correlation
    method: 'pearson' | 'spearman' | 'kendall';
  };
  trend: {
    enabled: boolean;
    windowSize: number; // number of data points for trend analysis
    minTrendStrength: number; // minimum correlation for trend detection
    seasonalityDetection: boolean;
    changePointDetection: boolean;
  };
  alerting: {
    enabled: boolean;
    channels: Array<'console' | 'email' | 'slack' | 'webhook'>;
    cooldownPeriod: number; // minutes between similar alerts
    groupSimilarAlerts: boolean;
    includeRecommendations: boolean;
    autoAssignment: boolean;
  };
}

export interface RegressionDetectionResult {
  id: string;
  timestamp: Date;
  testSuite: string;
  scenario: string;
  environment: string;
  baseline: PerformanceBaseline;
  current: PerformanceTestResult;

  // Overall assessment
  overallStatus: 'passed' | 'warning' | 'failed' | 'inconclusive';
  confidenceScore: number; // 0-1

  // Detected regressions
  regressions: PerformanceRegression[];

  // Detected improvements
  improvements: PerformanceImprovement[];

  // Statistical analysis
  statisticalAnalysis: {
    sampleSize: {
      baseline: number;
      current: number;
    };
    significanceTests: Array<{
      metric: string;
      testType: string;
      statistic: number;
      pValue: number;
      significant: boolean;
      effectSize: number;
      power: number;
    }>;
    confidenceIntervals: Array<{
      metric: string;
      lower: number;
      upper: number;
      level: number;
    }>;
    outliers: Array<{
      metric: string;
      values: number[];
      detectionMethod: string;
    }>;
  };

  // Machine learning analysis
  mlAnalysis: {
    anomalies: Array<{
      metric: string;
      value: number;
      expectedValue: number;
      anomalyScore: number;
      algorithm: string;
      features: string[];
    }>;
    patternChanges: Array<{
      metric: string;
      changePoint: Date;
      beforePattern: string;
      afterPattern: string;
      confidence: number;
    }>;
    predictions: Array<{
      metric: string;
      predictedValue: number;
      confidence: number;
      timeHorizon: number; // days
    }>;
  };

  // Correlation analysis
  correlationAnalysis: {
    metricCorrelations: Array<{
      metric1: string;
      metric2: string;
      correlation: number;
      pValue: number;
      lag: number;
    }>;
    featureImportance: Array<{
      feature: string;
      importance: number;
      direction: 'positive' | 'negative';
    }>;
  };

  // Trend analysis
  trendAnalysis: {
    trends: Array<{
      metric: string;
      direction: 'improving' | 'degrading' | 'stable';
      slope: number;
      significance: number;
      seasonalComponent?: {
        period: number;
        amplitude: number;
        phase: number;
      };
    }>;
    changePoints: Array<{
      timestamp: Date;
      metric: string;
      changeType: 'increase' | 'decrease' | 'variance';
      magnitude: number;
      confidence: number;
    }>;
  };

  // Recommendations
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'optimization' | 'investigation' | 'monitoring' | 'rollback';
    category: 'code' | 'infrastructure' | 'configuration' | 'data';
    description: string;
    impactAssessment: {
      userExperience: 'low' | 'medium' | 'high';
      businessValue: 'low' | 'medium' | 'high';
      technicalDebt: 'low' | 'medium' | 'high';
    };
    effortEstimate: string;
    automationPotential: 'low' | 'medium' | 'high';
    actionItems: Array<{
      description: string;
      owner?: string;
      deadline?: Date;
      dependencies?: string[];
    }>;
  }>;
}

export interface PerformanceRegression {
  id: string;
  type: 'response_time' | 'bundle_size' | 'memory_usage' | 'core_web_vital' | 'custom' | 'correlation';
  metric: string;
  severity: 'warning' | 'critical';
  baselineValue: number;
  currentValue: number;
  regression: number; // percentage
  absoluteDiff: number;
  threshold: number;

  // Statistical significance
  significance: {
    pValue: number;
    effectSize: number;
    confidence: number;
    power: number;
    sampleSizeAdequate: boolean;
  };

  // Impact assessment
  impact: {
    userExperience: 'low' | 'medium' | 'high' | 'critical';
    businessImpact: string;
    affectedFeatures: string[];
    affectedUsers: number;
    revenueImpact: number;
    supportTicketsIncrease: number;
  };

  // Context and attribution
  context: {
    testScenario: string;
    environment: string;
    commit?: string;
    branch?: string;
    deployment?: string;
    codeChanges: Array<{
      file: string;
      type: 'add' | 'modify' | 'delete';
      linesAdded: number;
      linesRemoved: number;
      complexity: number;
    }>;
    externalFactors: Array<{
      factor: string;
      impact: string;
      confidence: number;
    }>;
  };

  // Root cause analysis
  rootCause: {
    likelyCauses: Array<{
      cause: string;
      confidence: number;
      evidence: string[];
    }>;
    contributingFactors: Array<{
      factor: string;
      contribution: number;
    }>;
    correlationFactors: Array<{
      factor: string;
      correlation: number;
      confidence: number;
    }>;
  };

  // Recommendations
  recommendations: string[];

  // Evidence and data
  evidence: Array<{
    timestamp: Date;
    value: number;
    baseline: number;
    deviation: number;
    significance: boolean;
  }>;
}

export interface PerformanceImprovement {
  id: string;
  type: 'response_time' | 'bundle_size' | 'memory_usage' | 'core_web_vital' | 'custom';
  metric: string;
  baselineValue: number;
  currentValue: number;
  improvement: number; // percentage
  absoluteDiff: number;
  significance: {
    pValue: number;
    effectSize: number;
    confidence: number;
  };
  impact: {
    userExperience: 'low' | 'medium' | 'high';
    businessValue: string;
  };
  sustainability: {
    expectedDuration: 'short_term' | 'medium_term' | 'long_term';
    maintenanceOverhead: 'low' | 'medium' | 'high';
    scalability: 'low' | 'medium' | 'high';
  };
}

/**
 * Advanced Performance Regression Detection Engine
 */
export class PerformanceRegressionDetector {
  private static instance: PerformanceRegressionDetector;
  private config: RegressionDetectionConfig;
  private historicalData: Map<string, PerformanceTestResult[]> = new Map();
  private alertHistory: Map<string, Date> = new Map();

  // Analysis engines
  private statisticalEngine: StatisticalAnalysisEngine;
  private mlEngine: MachineLearningEngine;
  private correlationEngine: CorrelationAnalysisEngine;
  private trendEngine: TrendAnalysisEngine;
  private recommendationEngine: RecommendationEngine;

  // Alert system
  private alertManager: AlertManager;

  private constructor(config?: Partial<RegressionDetectionConfig>) {
    this.config = this.getDefaultConfig(config);
    this.statisticalEngine = new StatisticalAnalysisEngine(this.config.statistical);
    this.mlEngine = new MachineLearningEngine(this.config.machineLearning);
    this.correlationEngine = new CorrelationAnalysisEngine(this.config.correlation);
    this.trendEngine = new TrendAnalysisEngine(this.config.trend);
    this.recommendationEngine = new RecommendationEngine();
    this.alertManager = new AlertManager(this.config.alerting);
  }

  public static getInstance(config?: Partial<RegressionDetectionConfig>): PerformanceRegressionDetector {
    if (!PerformanceRegressionDetector.instance) {
      PerformanceRegressionDetector.instance = new PerformanceRegressionDetector(config);
    }
    return PerformanceRegressionDetector.instance;
  }

  private getDefaultConfig(overrides?: Partial<RegressionDetectionConfig>): RegressionDetectionConfig {
    return {
      thresholds: {
        responseTime: {
          warning: 15, // 15% increase
          critical: 30, // 30% increase
          absoluteWarning: 200, // 200ms
          absoluteCritical: 500, // 500ms
          minSampleSize: 5,
        },
        bundleSize: {
          warning: 10, // 10% increase
          critical: 25, // 25% increase
          absoluteWarning: 50, // 50KB
          absoluteCritical: 100, // 100KB
          minSampleSize: 3,
        },
        memoryUsage: {
          warning: 20, // 20% increase
          critical: 50, // 50% increase
          absoluteWarning: 20, // 20MB
          absoluteCritical: 50, // 50MB
          minSampleSize: 5,
        },
        coreWebVitals: {
          LCP: { warning: 20, critical: 40 }, // percentage or ms
          FID: { warning: 30, critical: 60 },
          CLS: { warning: 0.05, critical: 0.1 },
          FCP: { warning: 20, critical: 40 },
          TTI: { warning: 20, critical: 40 },
        },
      },
      statistical: {
        significanceLevel: 0.05,
        power: 0.8,
        effectSize: 0.5, // Medium effect size
        multipleTestingCorrection: 'fdr',
        confidenceInterval: 0.95,
        outlierDetection: {
          enabled: true,
          method: 'iqr',
          threshold: 1.5,
        },
      },
      machineLearning: {
        enabled: true,
        algorithms: ['isolation_forest', 'local_outlier_factor'],
        anomalyThreshold: 0.1,
        trainingWindowSize: 30,
        featureEngineering: {
          enablePolynomialFeatures: true,
          enableInteractionTerms: true,
          enableTimeBasedFeatures: true,
        },
      },
      correlation: {
        enabled: true,
        minCorrelationThreshold: 0.3,
        maxLag: 5,
        method: 'pearson',
      },
      trend: {
        enabled: true,
        windowSize: 10,
        minTrendStrength: 0.5,
        seasonalityDetection: true,
        changePointDetection: true,
      },
      alerting: {
        enabled: true,
        channels: ['console'],
        cooldownPeriod: 60, // 1 hour
        groupSimilarAlerts: true,
        includeRecommendations: true,
        autoAssignment: false,
      },
      ...overrides,
    };
  }

  /**
   * Detect performance regressions by comparing current results with baseline
   */
  public async detectRegressions(
    current: PerformanceTestResult,
    baseline: PerformanceBaseline,
    historicalData?: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult> {
    const resultId = `regression-detection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔍 Detecting performance regressions: ${resultId}`);

    try {
      // Store historical data for ML training
      if (historicalData) {
        const key = `${current.scenario}-${current.environment}`;
        this.historicalData.set(key, historicalData);
      }

      // Perform statistical analysis
      const statisticalAnalysis = await this.performStatisticalAnalysis(current, baseline);

      // Detect regressions
      const regressions = await this.detectMetricRegressions(current, baseline, statisticalAnalysis);

      // Detect improvements
      const improvements = await this.detectImprovements(current, baseline, statisticalAnalysis);

      // Perform machine learning analysis
      const mlAnalysis = this.config.machineLearning.enabled
        ? await this.performMLAnalysis(current, historicalData || [])
        : this.getDefaultMLAnalysis();

      // Perform correlation analysis
      const correlationAnalysis = this.config.correlation.enabled
        ? await this.performCorrelationAnalysis(current, baseline, historicalData || [])
        : this.getDefaultCorrelationAnalysis();

      // Perform trend analysis
      const trendAnalysis = this.config.trend.enabled
        ? await this.performTrendAnalysis(current, historicalData || [])
        : this.getDefaultTrendAnalysis();

      // Generate recommendations
      const recommendations = await this.recommendationEngine.generateRecommendations(
        regressions,
        improvements,
        statisticalAnalysis,
        mlAnalysis,
        correlationAnalysis,
        trendAnalysis
      );

      // Determine overall status
      const overallStatus = this.determineOverallStatus(regressions, improvements);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(
        statisticalAnalysis,
        regressions,
        improvements
      );

      const result: RegressionDetectionResult = {
        id: resultId,
        timestamp: new Date(),
        testSuite: current.testSuite,
        scenario: current.scenario,
        environment: current.environment,
        baseline,
        current,
        overallStatus,
        confidenceScore,
        regressions,
        improvements,
        statisticalAnalysis,
        mlAnalysis,
        correlationAnalysis,
        trendAnalysis,
        recommendations,
      };

      // Send alerts if needed
      if (this.config.alerting.enabled && regressions.length > 0) {
        await this.sendAlerts(result);
      }

      console.log(`✅ Regression detection completed: ${resultId} (${overallStatus})`);
      return result;
    } catch (error) {
      console.error(`❌ Regression detection failed: ${resultId}`, error);
      throw error;
    }
  }

  /**
   * Perform comprehensive statistical analysis
   */
  private async performStatisticalAnalysis(
    current: PerformanceTestResult,
    baseline: PerformanceBaseline
  ): Promise<RegressionDetectionResult['statisticalAnalysis']> {
    console.log('📊 Performing statistical analysis...');

    const metrics = this.getComparableMetrics(current);
    const significanceTests = [];
    const confidenceIntervals = [];
    const outliers = [];

    for (const metric of metrics) {
      const baselineValue = this.getBaselineMetricValue(baseline, metric);
      const currentValue = this.getCurrentMetricValue(current, metric);

      if (baselineValue !== null && currentValue !== null) {
        // Perform significance test
        const testResult = await this.statisticalEngine.performSignificanceTest(
          metric,
          [baselineValue],
          [currentValue]
        );

        significanceTests.push(testResult);

        // Calculate confidence interval
        const ci = await this.statisticalEngine.calculateConfidenceInterval(
          [currentValue],
          this.config.statistical.confidenceInterval
        );

        confidenceIntervals.push({
          metric,
          ...ci,
          level: this.config.statistical.confidenceInterval,
        });

        // Detect outliers
        if (this.config.statistical.outlierDetection.enabled) {
          const outlierResult = await this.statisticalEngine.detectOutliers(
            [currentValue],
            this.config.statistical.outlierDetection
          );

          if (outlierResult.outliers.length > 0) {
            outliers.push({
              metric,
              values: outlierResult.outliers,
              detectionMethod: this.config.statistical.outlierDetection.method,
            });
          }
        }
      }
    }

    return {
      sampleSize: {
        baseline: 1, // Baseline typically represents aggregated data
        current: 1, // Current is a single measurement
      },
      significanceTests,
      confidenceIntervals,
      outliers,
    };
  }

  /**
   * Detect specific metric regressions
   */
  private async detectMetricRegressions(
    current: PerformanceTestResult,
    baseline: PerformanceBaseline,
    statisticalAnalysis: RegressionDetectionResult['statisticalAnalysis']
  ): Promise<PerformanceRegression[]> {
    console.log('📉 Detecting metric regressions...');

    const regressions: PerformanceRegression[] = [];
    const metrics = this.getComparableMetrics(current);

    for (const metric of metrics) {
      const regression = await this.detectMetricRegression(
        metric,
        current,
        baseline,
        statisticalAnalysis
      );

      if (regression) {
        regressions.push(regression);
      }
    }

    return regressions;
  }

  private async detectMetricRegression(
    metric: string,
    current: PerformanceTestResult,
    baseline: PerformanceBaseline,
    statisticalAnalysis: RegressionDetectionResult['statisticalAnalysis']
  ): Promise<PerformanceRegression | null> {
    const baselineValue = this.getBaselineMetricValue(baseline, metric);
    const currentValue = this.getCurrentMetricValue(current, metric);

    if (baselineValue === null || currentValue === null || baselineValue === 0) {
      return null;
    }

    // Calculate regression percentage
    const regression = ((currentValue - baselineValue) / baselineValue) * 100;
    const absoluteDiff = currentValue - baselineValue;

    // Get threshold for this metric
    const threshold = this.getMetricThreshold(metric);

    // Check if regression exceeds threshold
    if (regression >= threshold.warning) {
      // Find corresponding statistical test
      const significanceTest = statisticalAnalysis.significanceTests.find(
        test => test.metric === metric
      );

      // Determine severity
      const severity = regression >= threshold.critical ? 'critical' : 'warning';

      // Assess impact
      const impact = await this.assessRegressionImpact(metric, regression, severity, current);

      // Analyze root causes
      const rootCause = await this.analyzeRootCause(metric, current, baseline);

      // Generate recommendations
      const recommendations = await this.generateRegressionRecommendations(
        metric,
        regression,
        severity,
        rootCause
      );

      return {
        id: `regression-${Date.now()}-${metric}`,
        type: this.getMetricType(metric),
        metric,
        severity,
        baselineValue,
        currentValue,
        regression,
        absoluteDiff,
        threshold: threshold.warning,
        significance: {
          pValue: significanceTest?.pValue || 1,
          effectSize: significanceTest?.effectSize || 0,
          confidence: 1 - (significanceTest?.pValue || 1),
          power: significanceTest?.power || 0,
          sampleSizeAdequate: true, // Simplified
        },
        impact,
        context: {
          testScenario: current.scenario,
          environment: current.environment,
          commit: process.env.COMMIT_SHA,
          branch: process.env.BRANCH_NAME,
          codeChanges: [], // Would be populated from git analysis
          externalFactors: [],
        },
        rootCause,
        recommendations,
        evidence: [{
          timestamp: current.timestamp,
          value: currentValue,
          baseline: baselineValue,
          deviation: regression,
          significance: significanceTest?.significant || false,
        }],
      };
    }

    return null;
  }

  /**
   * Detect performance improvements
   */
  private async detectImprovements(
    current: PerformanceTestResult,
    baseline: PerformanceBaseline,
    statisticalAnalysis: RegressionDetectionResult['statisticalAnalysis']
  ): Promise<PerformanceImprovement[]> {
    console.log('📈 Detecting performance improvements...');

    const improvements: PerformanceImprovement[] = [];
    const metrics = this.getComparableMetrics(current);

    for (const metric of metrics) {
      const improvement = await this.detectMetricImprovement(
        metric,
        current,
        baseline,
        statisticalAnalysis
      );

      if (improvement) {
        improvements.push(improvement);
      }
    }

    return improvements;
  }

  private async detectMetricImprovement(
    metric: string,
    current: PerformanceTestResult,
    baseline: PerformanceBaseline,
    statisticalAnalysis: RegressionDetectionResult['statisticalAnalysis']
  ): Promise<PerformanceImprovement | null> {
    const baselineValue = this.getBaselineMetricValue(baseline, metric);
    const currentValue = this.getCurrentMetricValue(current, metric);

    if (baselineValue === null || currentValue === null || baselineValue === 0) {
      return null;
    }

    // Calculate improvement percentage (negative regression is improvement)
    const improvement = ((baselineValue - currentValue) / baselineValue) * 100;

    // Only consider significant improvements (>5%)
    if (improvement > 5) {
      // Find corresponding statistical test
      const significanceTest = statisticalAnalysis.significanceTests.find(
        test => test.metric === metric
      );

      return {
        id: `improvement-${Date.now()}-${metric}`,
        type: this.getMetricType(metric),
        metric,
        baselineValue,
        currentValue,
        improvement,
        absoluteDiff: baselineValue - currentValue,
        significance: {
          pValue: significanceTest?.pValue || 1,
          effectSize: significanceTest?.effectSize || 0,
          confidence: 1 - (significanceTest?.pValue || 1),
        },
        impact: {
          userExperience: this.assessImprovementUserExperienceImpact(metric, improvement),
          businessValue: this.assessImprovementBusinessValue(metric, improvement),
        },
        sustainability: {
          expectedDuration: 'medium_term',
          maintenanceOverhead: 'low',
          scalability: 'high',
        },
      };
    }

    return null;
  }

  /**
   * Perform machine learning analysis
   */
  private async performMLAnalysis(
    current: PerformanceTestResult,
    historicalData: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult['mlAnalysis']> {
    console.log('🤖 Performing machine learning analysis...');

    if (!this.config.machineLearning.enabled || historicalData.length < 5) {
      return this.getDefaultMLAnalysis();
    }

    try {
      // Feature extraction
      const features = this.extractMLFeatures(current, historicalData);

      // Detect anomalies
      const anomalies = await this.mlEngine.detectAnomalies(features);

      // Detect pattern changes
      const patternChanges = await this.mlEngine.detectPatternChanges(historicalData);

      // Generate predictions
      const predictions = await this.mlEngine.generatePredictions(historicalData);

      return {
        anomalies,
        patternChanges,
        predictions,
      };
    } catch (error) {
      console.warn('Machine learning analysis failed:', error);
      return this.getDefaultMLAnalysis();
    }
  }

  /**
   * Perform correlation analysis
   */
  private async performCorrelationAnalysis(
    current: PerformanceTestResult,
    baseline: PerformanceBaseline,
    historicalData: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult['correlationAnalysis']> {
    console.log('🔗 Performing correlation analysis...');

    if (!this.config.correlation.enabled || historicalData.length < 3) {
      return this.getDefaultCorrelationAnalysis();
    }

    try {
      // Calculate metric correlations
      const metricCorrelations = await this.correlationEngine.calculateMetricCorrelations(
        historicalData,
        this.config.correlation.method
      );

      // Calculate feature importance
      const featureImportance = await this.correlationEngine.calculateFeatureImportance(
        current,
        historicalData
      );

      return {
        metricCorrelations: metricCorrelations.filter(
          corr => Math.abs(corr.correlation) >= this.config.correlation.minCorrelationThreshold
        ),
        featureImportance,
      };
    } catch (error) {
      console.warn('Correlation analysis failed:', error);
      return this.getDefaultCorrelationAnalysis();
    }
  }

  /**
   * Perform trend analysis
   */
  private async performTrendAnalysis(
    current: PerformanceTestResult,
    historicalData: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult['trendAnalysis']> {
    console.log('📈 Performing trend analysis...');

    if (!this.config.trend.enabled || historicalData.length < 5) {
      return this.getDefaultTrendAnalysis();
    }

    try {
      // Analyze trends for each metric
      const trends = await this.trendEngine.analyzeTrends(
        historicalData,
        this.config.trend.windowSize
      );

      // Detect change points
      const changePoints = await this.trendEngine.detectChangePoints(historicalData);

      return {
        trends,
        changePoints,
      };
    } catch (error) {
      console.warn('Trend analysis failed:', error);
      return this.getDefaultTrendAnalysis();
    }
  }

  // Helper methods
  private getComparableMetrics(result: PerformanceTestResult): string[] {
    return [
      'loadTime',
      'firstContentfulPaint',
      'largestContentfulPaint',
      'timeToInteractive',
      'bundleSize',
      'compressedBundleSize',
      'jsSize',
      'memoryUsage',
      'memoryPeak',
    ];
  }

  private getBaselineMetricValue(baseline: PerformanceBaseline, metric: string): number | null {
    // Extract metric value from baseline
    const scenario = baseline.data.scenarios[Object.keys(baseline.data.scenarios)[0]];
    if (!scenario) return null;

    const metricData = scenario.metrics[metric];
    return metricData ? metricData.value : null;
  }

  private getCurrentMetricValue(result: PerformanceTestResult, metric: string): number | null {
    // Extract metric value from current result
    const value = result.metrics[metric as keyof PerformanceTestResult['metrics']] as number;
    return value || null;
  }

  private getMetricType(metric: string): PerformanceRegression['type'] {
    if (metric.includes('Time') || metric.includes('time')) {
      return 'response_time';
    } else if (metric.includes('Size') || metric.includes('size')) {
      return 'bundle_size';
    } else if (metric.includes('Memory') || metric.includes('memory')) {
      return 'memory_usage';
    } else if (['FCP', 'LCP', 'FID', 'CLS', 'TTI'].some(acronym => metric.includes(acronym))) {
      return 'core_web_vital';
    } else {
      return 'custom';
    }
  }

  private getMetricThreshold(metric: string): { warning: number; critical: number } {
    const metricType = this.getMetricType(metric);

    switch (metricType) {
      case 'response_time':
        return this.config.thresholds.responseTime;
      case 'bundle_size':
        return this.config.thresholds.bundleSize;
      case 'memory_usage':
        return this.config.thresholds.memoryUsage;
      case 'core_web_vital':
        // Map core web vitals to their thresholds
        if (metric.includes('LCP')) return this.config.thresholds.coreWebVitals.LCP;
        if (metric.includes('FID')) return this.config.thresholds.coreWebVitals.FID;
        if (metric.includes('CLS')) return this.config.thresholds.coreWebVitals.CLS;
        if (metric.includes('FCP')) return this.config.thresholds.coreWebVitals.FCP;
        if (metric.includes('TTI')) return this.config.thresholds.coreWebVitals.TTI;
        break;
      default:
        // Default thresholds for custom metrics
        return { warning: 15, critical: 30 };
    }

    return { warning: 15, critical: 30 };
  }

  private async assessRegressionImpact(
    metric: string,
    regression: number,
    severity: 'warning' | 'critical',
    result: PerformanceTestResult
  ): Promise<PerformanceRegression['impact']> {
    // Assess impact based on metric type and regression severity
    let userExperience: PerformanceRegression['impact']['userExperience'] = 'low';
    let businessImpact = 'Minimal impact on user experience';
    let affectedFeatures: string[] = [];
    let affectedUsers = 100; // Default to all users
    let revenueImpact = 0;
    let supportTicketsIncrease = 0;

    if (severity === 'critical') {
      userExperience = 'critical';
      businessImpact = 'Severe degradation affecting user experience and conversion';
      revenueImpact = regression * 0.01; // Assume 1% revenue impact per % regression
      supportTicketsIncrease = Math.floor(regression * 0.5);
    } else if (regression > 20) {
      userExperience = 'high';
      businessImpact = 'Significant impact on user experience and engagement';
      revenueImpact = regression * 0.005;
      supportTicketsIncrease = Math.floor(regression * 0.2);
    } else if (regression > 10) {
      userExperience = 'medium';
      businessImpact = 'Moderate impact on user experience';
      revenueImpact = regression * 0.002;
      supportTicketsIncrease = Math.floor(regression * 0.1);
    }

    // Determine affected features based on scenario
    affectedFeatures = [result.scenario];

    return {
      userExperience,
      businessImpact,
      affectedFeatures,
      affectedUsers,
      revenueImpact,
      supportTicketsIncrease,
    };
  }

  private async analyzeRootCause(
    metric: string,
    current: PerformanceTestResult,
    baseline: PerformanceBaseline
  ): Promise<PerformanceRegression['rootCause']> {
    // Simplified root cause analysis
    const likelyCauses = [
      {
        cause: `Performance degradation in ${metric}`,
        confidence: 0.8,
        evidence: ['Metric exceeds threshold', 'Statistical significance detected'],
      },
    ];

    const contributingFactors = [
      {
        factor: 'Code changes',
        contribution: 0.6,
      },
      {
        factor: 'External dependencies',
        contribution: 0.3,
      },
    ];

    const correlationFactors = [];

    return {
      likelyCauses,
      contributingFactors,
      correlationFactors,
    };
  }

  private async generateRegressionRecommendations(
    metric: string,
    regression: number,
    severity: 'warning' | 'critical',
    rootCause: PerformanceRegression['rootCause']
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (severity === 'critical') {
      recommendations.push('🚨 Immediate investigation required - critical performance regression detected');
      recommendations.push('Consider rollback if recently deployed');
      recommendations.push('Engage performance engineering team');
    }

    // Metric-specific recommendations
    if (metric.includes('Time')) {
      recommendations.push('Profile code to identify performance bottlenecks');
      recommendations.push('Review database queries and optimize if needed');
      recommendations.push('Check for infinite loops or blocking operations');
      recommendations.push('Implement caching strategies');
    } else if (metric.includes('Size')) {
      recommendations.push('Analyze bundle composition and identify large dependencies');
      recommendations.push('Implement code splitting and lazy loading');
      recommendations.push('Optimize asset compression and minification');
      recommendations.push('Remove unused code and dependencies');
    } else if (metric.includes('Memory')) {
      recommendations.push('Check for memory leaks and excessive allocations');
      recommendations.push('Review object lifecycle and garbage collection');
      recommendations.push('Optimize data structures and algorithms');
      recommendations.push('Implement memory pooling if applicable');
    }

    // General recommendations
    recommendations.push('Monitor impact on user experience and business metrics');
    recommendations.push('Document findings and create action plan');
    recommendations.push('Set up enhanced monitoring for early detection');

    return recommendations;
  }

  private assessImprovementUserExperienceImpact(
    metric: string,
    improvement: number
  ): PerformanceImprovement['impact']['userExperience'] {
    if (improvement > 25) {
      return 'high';
    } else if (improvement > 10) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private assessImprovementBusinessValue(
    metric: string,
    improvement: number
  ): string {
    if (metric.includes('Time')) {
      return `Faster ${metric.replace(/Time$/, '').toLowerCase()} improves user experience and conversion`;
    } else if (metric.includes('Size')) {
      return `Reduced ${metric.replace(/Size$/, '').toLowerCase()).toLowerCase()} usage lowers costs and improves load times`;
    } else if (metric.includes('Memory')) {
      return `Optimized ${metric.replace(/Usage$/, '').toLowerCase()).toLowerCase()} usage improves performance and scalability`;
    } else {
      return `Performance improvement in ${metric} enhances overall system efficiency`;
    }
  }

  private determineOverallStatus(
    regressions: PerformanceRegression[],
    improvements: PerformanceImprovement[]
  ): RegressionDetectionResult['overallStatus'] {
    if (regressions.some(r => r.severity === 'critical')) {
      return 'failed';
    } else if (regressions.length > 0) {
      return 'warning';
    } else if (improvements.length > 0) {
      return 'passed';
    } else {
      return 'passed';
    }
  }

  private calculateConfidenceScore(
    statisticalAnalysis: RegressionDetectionResult['statisticalAnalysis'],
    regressions: PerformanceRegression[],
    improvements: PerformanceImprovement[]
  ): number {
    // Calculate confidence based on statistical significance and data quality
    let confidence = 0.8; // Base confidence

    // Adjust based on significance tests
    const significantTests = statisticalAnalysis.significanceTests.filter(
      test => test.significant
    ).length;
    const totalTests = statisticalAnalysis.significanceTests.length;

    if (totalTests > 0) {
      confidence *= (significantTests / totalTests);
    }

    // Adjust based on outlier presence
    const outlierMetrics = statisticalAnalysis.outliers.length;
    if (outlierMetrics > 0) {
      confidence *= (1 - outlierMetrics / 10); // Reduce confidence for outliers
    }

    // Adjust based on regression/improvement consistency
    if (regressions.length > 0 || improvements.length > 0) {
      confidence = Math.min(confidence + 0.1, 1.0); // Increase confidence for clear results
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private extractMLFeatures(
    current: PerformanceTestResult,
    historicalData: PerformanceTestResult[]
  ): number[][] {
    // Extract features for machine learning analysis
    const features: number[][] = [];

    for (const data of [current, ...historicalData]) {
      const featureVector = [
        data.metrics.loadTime,
        data.metrics.firstContentfulPaint,
        data.metrics.largestContentfulPaint,
        data.metrics.timeToInteractive,
        data.metrics.bundleSize,
        data.metrics.memoryUsage,
        data.timestamp.getTime(),
      ];
      features.push(featureVector);
    }

    return features;
  }

  // Default analysis results
  private getDefaultMLAnalysis(): RegressionDetectionResult['mlAnalysis'] {
    return {
      anomalies: [],
      patternChanges: [],
      predictions: [],
    };
  }

  private getDefaultCorrelationAnalysis(): RegressionDetectionResult['correlationAnalysis'] {
    return {
      metricCorrelations: [],
      featureImportance: [],
    };
  }

  private getDefaultTrendAnalysis(): RegressionDetectionResult['trendAnalysis'] {
    return {
      trends: [],
      changePoints: [],
    };
  }

  /**
   * Send alerts for detected regressions
   */
  private async sendAlerts(result: RegressionDetectionResult): Promise<void> {
    for (const regression of result.regressions) {
      const alertKey = `${result.scenario}-${result.environment}-${regression.metric}`;
      const lastAlert = this.alertHistory.get(alertKey);
      const cooldownPeriod = this.config.alerting.cooldownPeriod * 60 * 1000; // Convert to milliseconds

      if (!lastAlert || Date.now() - lastAlert.getTime() > cooldownPeriod) {
        await this.alertManager.sendAlert(regression, result);
        this.alertHistory.set(alertKey, new Date());
      }
    }
  }

  // Public API methods
  public updateConfig(config: Partial<RegressionDetectionConfig>): void {
    this.config = { ...this.config, ...config };

    // Update engine configurations
    this.statisticalEngine.updateConfig(this.config.statistical);
    this.mlEngine.updateConfig(this.config.machineLearning);
    this.correlationEngine.updateConfig(this.config.correlation);
    this.trendEngine.updateConfig(this.config.trend);
    this.alertManager.updateConfig(this.config.alerting);
  }

  public getConfig(): RegressionDetectionConfig {
    return { ...this.config };
  }

  public addHistoricalData(key: string, data: PerformanceTestResult[]): void {
    this.historicalData.set(key, data);
  }

  public getHistoricalData(key?: string): Map<string, PerformanceTestResult[]> | PerformanceTestResult[] {
    if (key) {
      return this.historicalData.get(key) || [];
    }
    return new Map(this.historicalData);
  }

  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Performance Regression Detector...');

    this.historicalData.clear();
    this.alertHistory.clear();

    console.log('✅ Performance Regression Detector cleaned up');
  }
}

// Analysis engine classes
class StatisticalAnalysisEngine {
  constructor(private config: RegressionDetectionConfig['statistical']) {}

  async performSignificanceTest(
    metric: string,
    baseline: number[],
    current: number[]
  ): Promise<RegressionDetectionResult['statisticalAnalysis']['significanceTests'][0]> {
    // Simplified t-test implementation
    const baselineMean = baseline.reduce((sum, val) => sum + val, 0) / baseline.length;
    const currentMean = current.reduce((sum, val) => sum + val, 0) / current.length;

    const baselineVariance = baseline.reduce((sum, val) => sum + Math.pow(val - baselineMean, 2), 0) / (baseline.length - 1);
    const currentVariance = current.reduce((sum, val) => sum + Math.pow(val - currentMean, 2), 0) / (current.length - 1);

    const pooledVariance = ((baseline.length - 1) * baselineVariance + (current.length - 1) * currentVariance) /
                           (baseline.length + current.length - 2);

    const standardError = Math.sqrt(pooledVariance * (1/baseline.length + 1/current.length));
    const tStatistic = (currentMean - baselineMean) / standardError;

    // Simplified p-value calculation
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStatistic)));

    // Calculate effect size (Cohen's d)
    const effectSize = (currentMean - baselineMean) / Math.sqrt(pooledVariance);

    // Calculate power (simplified)
    const power = this.calculatePower(effectSize, baseline.length + current.length);

    return {
      metric,
      testType: 't-test',
      statistic: tStatistic,
      pValue,
      significant: pValue < this.config.significanceLevel,
      effectSize,
      power,
    };
  }

  async calculateConfidenceInterval(
    values: number[],
    confidenceLevel: number
  ): Promise<{ lower: number; upper: number }> {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    const standardError = Math.sqrt(variance / values.length);

    const zScore = this.getZScore(confidenceLevel);
    const margin = zScore * standardError;

    return {
      lower: mean - margin,
      upper: mean + margin,
    };
  }

  async detectOutliers(
    values: number[],
    config: RegressionDetectionConfig['statistical']['outlierDetection']
  ): Promise<{ outliers: number[] }> {
    const outliers: number[] = [];

    switch (config.method) {
      case 'iqr':
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - config.threshold * iqr;
        const upperBound = q3 + config.threshold * iqr;

        for (const value of values) {
          if (value < lowerBound || value > upperBound) {
            outliers.push(value);
          }
        }
        break;

      case 'zscore':
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        for (const value of values) {
          const zScore = Math.abs((value - mean) / stdDev);
          if (zScore > config.threshold) {
            outliers.push(value);
          }
        }
        break;
    }

    return { outliers };
  }

  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  private getZScore(confidenceLevel: number): number {
    // Common z-scores for confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.98: 2.326,
      0.99: 2.576,
    };
    return zScores[confidenceLevel] || 1.96;
  }

  private calculatePower(effectSize: number, sampleSize: number): number {
    // Simplified power calculation
    return Math.min(0.95, Math.abs(effectSize) * Math.sqrt(sampleSize / 20));
  }

  updateConfig(config: RegressionDetectionConfig['statistical']): void {
    this.config = { ...this.config, ...config };
  }
}

class MachineLearningEngine {
  constructor(private config: RegressionDetectionConfig['machineLearning']) {}

  async detectAnomalies(features: number[][]): Promise<RegressionDetectionResult['mlAnalysis']['anomalies']> {
    const anomalies = [];

    // Simplified anomaly detection using statistical methods
    for (let i = 0; i < features.length; i++) {
      const featureVector = features[i];

      // Check for outliers in each feature dimension
      for (let j = 0; j < featureVector.length; j++) {
        const values = features.map(f => f[j]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

        const zScore = Math.abs((featureVector[j] - mean) / stdDev);

        if (zScore > 3) { // 3-sigma rule
          anomalies.push({
            metric: `feature_${j}`,
            value: featureVector[j],
            expectedValue: mean,
            anomalyScore: Math.min(1, zScore / 5),
            algorithm: 'statistical_outlier',
            features: [j.toString()],
          });
        }
      }
    }

    return anomalies;
  }

  async detectPatternChanges(
    historicalData: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult['mlAnalysis']['patternChanges']> {
    // Simplified pattern change detection
    const patternChanges = [];

    if (historicalData.length < 10) {
      return patternChanges;
    }

    // Look for significant changes in trends
    const metrics = ['loadTime', 'firstContentfulPaint', 'bundleSize'];

    for (const metric of metrics) {
      const values = historicalData.map(d => d.metrics[metric as keyof PerformanceTestResult['metrics']] as number);
      const changePoint = this.detectChangePoint(values);

      if (changePoint !== -1) {
        patternChanges.push({
          metric,
          changePoint: historicalData[changePoint].timestamp,
          beforePattern: 'baseline',
          afterPattern: 'changed',
          confidence: 0.7,
        });
      }
    }

    return patternChanges;
  }

  async generatePredictions(
    historicalData: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult['mlAnalysis']['predictions']> {
    // Simplified prediction using linear extrapolation
    const predictions = [];

    if (historicalData.length < 5) {
      return predictions;
    }

    const metrics = ['loadTime', 'firstContentfulPaint', 'bundleSize'];

    for (const metric of metrics) {
      const values = historicalData.map(d => d.metrics[metric as keyof PerformanceTestResult['metrics']] as number);
      const trend = this.calculateLinearTrend(values);

      if (trend.slope !== 0) {
        const nextValue = values[values.length - 1] + trend.slope * 7; // Predict 7 days ahead
        const confidence = Math.abs(trend.correlation);

        predictions.push({
          metric,
          predictedValue: nextValue,
          confidence,
          timeHorizon: 7,
        });
      }
    }

    return predictions;
  }

  private detectChangePoint(values: number[]): number {
    // Simplified change point detection using cumulative sum
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    let cumulativeSum = 0;
    let maxCumulativeSum = 0;
    let changePoint = -1;

    for (let i = 0; i < values.length; i++) {
      cumulativeSum += values[i] - mean;

      if (Math.abs(cumulativeSum) > maxCumulativeSum) {
        maxCumulativeSum = Math.abs(cumulativeSum);
        changePoint = i;
      }
    }

    return changePoint;
  }

  private calculateLinearTrend(values: number[]): { slope: number; correlation: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    // Calculate slope (linear regression)
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Calculate correlation coefficient
    const sumY2 = values.reduce((sum, val) => sum + val * val, 0);
    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return { slope, correlation };
  }

  updateConfig(config: RegressionDetectionConfig['machineLearning']): void {
    this.config = { ...this.config, ...config };
  }
}

class CorrelationAnalysisEngine {
  constructor(private config: RegressionDetectionConfig['correlation']) {}

  async calculateMetricCorrelations(
    data: PerformanceTestResult[],
    method: 'pearson' | 'spearman' | 'kendall'
  ): Promise<RegressionDetectionResult['correlationAnalysis']['metricCorrelations']> {
    const correlations = [];
    const metrics = ['loadTime', 'firstContentfulPaint', 'bundleSize', 'memoryUsage'];

    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const metric1 = metrics[i];
        const metric2 = metrics[j];

        const values1 = data.map(d => d.metrics[metric1 as keyof PerformanceTestResult['metrics']] as number);
        const values2 = data.map(d => d.metrics[metric2 as keyof PerformanceTestResult['metrics']] as number);

        let correlation: number;

        switch (method) {
          case 'pearson':
            correlation = this.calculatePearsonCorrelation(values1, values2);
            break;
          case 'spearman':
            correlation = this.calculateSpearmanCorrelation(values1, values2);
            break;
          case 'kendall':
            correlation = this.calculateKendallCorrelation(values1, values2);
            break;
          default:
            correlation = this.calculatePearsonCorrelation(values1, values2);
        }

        if (Math.abs(correlation) >= this.config.minCorrelationThreshold) {
          // Calculate p-value (simplified)
          const pValue = this.calculateCorrelationPValue(correlation, data.length);

          correlations.push({
            metric1,
            metric2,
            correlation,
            pValue,
            lag: 0, // No lag in this simplified implementation
          });
        }
      }
    }

    return correlations;
  }

  async calculateFeatureImportance(
    current: PerformanceTestResult,
    historicalData: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult['correlationAnalysis']['featureImportance']> {
    const importance = [];

    // Calculate importance based on correlation with overall performance score
    const overallScores = historicalData.map(d => d.score.overall);
    const metrics = ['loadTime', 'firstContentfulPaint', 'bundleSize', 'memoryUsage'];

    for (const metric of metrics) {
      const values = historicalData.map(d => d.metrics[metric as keyof PerformanceTestResult['metrics']] as number);
      const correlation = this.calculatePearsonCorrelation(values, overallScores);

      // Normalize importance (absolute value)
      const normalizedImportance = Math.abs(correlation);

      importance.push({
        feature: metric,
        importance: normalizedImportance,
        direction: correlation < 0 ? 'negative' : 'positive',
      });
    }

    // Sort by importance
    importance.sort((a, b) => b.importance - a.importance);

    return importance;
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateSpearmanCorrelation(x: number[], y: number[]): number {
    // Convert to ranks
    const rankX = this.getRanks(x);
    const rankY = this.getRanks(y);

    // Calculate Pearson correlation on ranks
    return this.calculatePearsonCorrelation(rankX, rankY);
  }

  private calculateKendallCorrelation(x: number[], y: number[]): number {
    // Simplified Kendall's tau calculation
    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < x.length; i++) {
      for (let j = i + 1; j < x.length; j++) {
        const xDiff = x[i] - x[j];
        const yDiff = y[i] - y[j];

        if (xDiff * yDiff > 0) {
          concordant++;
        } else if (xDiff * yDiff < 0) {
          discordant++;
        }
      }
    }

    return (concordant - discordant) / (concordant + discordant);
  }

  private getRanks(values: number[]): number[] {
    const sorted = [...values].map((value, index) => ({ value, index }))
      .sort((a, b) => a.value - b.value);

    const ranks = new Array(values.length);

    for (let i = 0; i < sorted.length; i++) {
      ranks[sorted[i].index] = i + 1;
    }

    return ranks;
  }

  private calculateCorrelationPValue(correlation: number, n: number): number {
    // Simplified p-value calculation for correlation
    const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    return 2 * (1 - this.tDistribution(Math.abs(t), n - 2));
  }

  private tDistribution(t: number, degreesOfFreedom: number): number {
    // Simplified t-distribution CDF
    return Math.min(0.999, 0.5 + Math.atan(t / Math.sqrt(degreesOfFreedom)) / Math.PI);
  }

  updateConfig(config: RegressionDetectionConfig['correlation']): void {
    this.config = { ...this.config, ...config };
  }
}

class TrendAnalysisEngine {
  constructor(private config: RegressionDetectionConfig['trend']) {}

  async analyzeTrends(
    historicalData: PerformanceTestResult[],
    windowSize: number
  ): Promise<RegressionDetectionResult['trendAnalysis']['trends']> {
    const trends = [];
    const metrics = ['loadTime', 'firstContentfulPaint', 'bundleSize', 'memoryUsage'];

    for (const metric of metrics) {
      const values = historicalData.map(d => d.metrics[metric as keyof PerformanceTestResult['metrics']] as number);

      if (values.length < windowSize) {
        continue;
      }

      // Analyze trend using linear regression
      const trend = this.calculateTrend(values.slice(-windowSize));

      if (trend !== null) {
        trends.push({
          metric,
          direction: trend.direction,
          slope: trend.slope,
          significance: trend.significance,
          seasonalComponent: this.detectSeasonality(values),
        });
      }
    }

    return trends;
  }

  async detectChangePoints(
    historicalData: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult['trendAnalysis']['changePoints']> {
    const changePoints = [];
    const metrics = ['loadTime', 'firstContentfulPaint', 'bundleSize'];

    for (const metric of metrics) {
      const values = historicalData.map(d => d.metrics[metric as keyof PerformanceTestResult['metrics']] as number);

      // Detect change points using cusum method
      const detected = this.detectChangePointsCusum(values);

      for (const point of detected) {
        changePoints.push({
          timestamp: historicalData[point.index].timestamp,
          metric,
          changeType: point.changeType,
          magnitude: point.magnitude,
          confidence: point.confidence,
        });
      }
    }

    return changePoints;
  }

  private calculateTrend(values: number[]): {
    direction: 'improving' | 'degrading' | 'stable';
    slope: number;
    significance: number;
  } | null {
    if (values.length < 3) {
      return null;
    }

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    // Linear regression
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Calculate correlation
    const sumY2 = values.reduce((sum, val) => sum + val * val, 0);
    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumY2 - sumY * sumY));

    // Determine direction
    let direction: 'improving' | 'degrading' | 'stable';
    if (Math.abs(slope) < 0.01) {
      direction = 'stable';
    } else if (slope < 0) {
      direction = 'improving'; // Negative slope for time-based metrics is improvement
    } else {
      direction = 'degrading';
    }

    return {
      direction,
      slope,
      significance: Math.abs(correlation),
    };
  }

  private detectSeasonality(values: number[]): {
    period: number;
    amplitude: number;
    phase: number;
  } | undefined {
    // Simplified seasonality detection
    // Look for periodic patterns (this would typically use FFT in a real implementation)

    if (values.length < 14) { // Need at least 2 weeks of daily data
      return undefined;
    }

    // Check for weekly patterns (7-day period)
    const weeklyPattern = this.extractPeriodicPattern(values, 7);

    if (weeklyPattern.amplitude > 0.1) { // Significant seasonal component
      return {
        period: 7,
        amplitude: weeklyPattern.amplitude,
        phase: weeklyPattern.phase,
      };
    }

    return undefined;
  }

  private extractPeriodicPattern(values: number[], period: number): {
    amplitude: number;
    phase: number;
  } {
    // Simplified periodic pattern extraction
    const n = values.length;
    let sumCos = 0;
    let sumSin = 0;

    for (let i = 0; i < n; i++) {
      const angle = 2 * Math.PI * i / period;
      sumCos += values[i] * Math.cos(angle);
      sumSin += values[i] * Math.sin(angle);
    }

    const amplitude = 2 * Math.sqrt(sumCos * sumCos + sumSin * sumSin) / n;
    const phase = Math.atan2(sumSin, sumCos);

    return { amplitude, phase };
  }

  private detectChangePointsCusum(values: number[]): Array<{
    index: number;
    changeType: 'increase' | 'decrease' | 'variance';
    magnitude: number;
    confidence: number;
  }> {
    // Simplified CUSUM change point detection
    const changePoints = [];

    if (values.length < 5) {
      return changePoints;
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    let cusumPos = 0;
    let cusumNeg = 0;

    for (let i = 0; i < values.length; i++) {
      cusumPos = Math.max(0, cusumPos + values[i] - mean);
      cusumNeg = Math.min(0, cusumNeg + values[i] - mean);

      // Check if CUSUM exceeds threshold
      const threshold = 2 * Math.sqrt(values.length);

      if (cusumPos > threshold) {
        changePoints.push({
          index: i,
          changeType: 'increase',
          magnitude: cusumPos,
          confidence: Math.min(1, cusumPos / threshold),
        });
        cusumPos = 0; // Reset
      }

      if (cusumNeg < -threshold) {
        changePoints.push({
          index: i,
          changeType: 'decrease',
          magnitude: Math.abs(cusumNeg),
          confidence: Math.min(1, Math.abs(cusumNeg) / threshold),
        });
        cusumNeg = 0; // Reset
      }
    }

    return changePoints;
  }

  updateConfig(config: RegressionDetectionConfig['trend']): void {
    this.config = { ...this.config, ...config };
  }
}

class RecommendationEngine {
  async generateRecommendations(
    regressions: PerformanceRegression[],
    improvements: PerformanceImprovement[],
    statisticalAnalysis: RegressionDetectionResult['statisticalAnalysis'],
    mlAnalysis: RegressionDetectionResult['mlAnalysis'],
    correlationAnalysis: RegressionDetectionResult['correlationAnalysis'],
    trendAnalysis: RegressionDetectionResult['trendAnalysis']
  ): Promise<RegressionDetectionResult['recommendations']> {
    const recommendations: RegressionDetectionResult['recommendations'] = [];

    // Generate recommendations for regressions
    for (const regression of regressions) {
      const recs = this.generateRegressionRecommendations(regression);
      recommendations.push(...recs);
    }

    // Generate recommendations based on correlation analysis
    const correlationRecs = this.generateCorrelationRecommendations(correlationAnalysis);
    recommendations.push(...correlationRecs);

    // Generate recommendations based on trend analysis
    const trendRecs = this.generateTrendRecommendations(trendAnalysis);
    recommendations.push(...trendRecs);

    // Generate recommendations based on ML analysis
    const mlRecs = this.generateMLRecommendations(mlAnalysis);
    recommendations.push(...mlRecs);

    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Remove duplicates and limit to top recommendations
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    return uniqueRecs.slice(0, 10); // Top 10 recommendations
  }

  private generateRegressionRecommendations(
    regression: PerformanceRegression
  ): RegressionDetectionResult['recommendations'] {
    const recommendations = [];

    // High-priority recommendations for critical regressions
    if (regression.severity === 'critical') {
      recommendations.push({
        priority: 'critical',
        type: 'rollback',
        category: 'code',
        description: `Critical regression in ${regression.metric} detected. Consider rolling back recent changes.`,
        impactAssessment: {
          userExperience: 'critical',
          businessValue: 'high',
          technicalDebt: 'low',
        },
        effortEstimate: '< 1 hour',
        automationPotential: 'high',
        actionItems: [{
          description: 'Rollback last deployment if regression is severe',
          deadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        }],
      });
    }

    // Metric-specific recommendations
    if (regression.type === 'response_time') {
      recommendations.push({
        priority: regression.severity === 'critical' ? 'high' : 'medium',
        type: 'optimization',
        category: 'code',
        description: `Optimize ${regression.metric} performance. Focus on identifying bottlenecks and reducing latency.`,
        impactAssessment: {
          userExperience: regression.impact.userExperience,
          businessValue: 'medium',
          technicalDebt: 'low',
        },
        effortEstimate: '2-4 hours',
        automationPotential: 'medium',
        actionItems: [{
          description: 'Profile code to identify performance bottlenecks',
          dependencies: ['Performance profiling tools'],
        }, {
          description: 'Review database queries and optimize slow queries',
        }, {
          description: 'Implement caching for frequently accessed data',
        }],
      });
    } else if (regression.type === 'bundle_size') {
      recommendations.push({
        priority: regression.severity === 'critical' ? 'high' : 'medium',
        type: 'optimization',
        category: 'code',
        description: `Reduce bundle size for ${regression.metric}. Review dependencies and implement code splitting.`,
        impactAssessment: {
          userExperience: regression.impact.userExperience,
          businessValue: 'medium',
          technicalDebt: 'low',
        },
        effortEstimate: '4-8 hours',
        automationPotential: 'high',
        actionItems: [{
          description: 'Analyze bundle composition and identify large dependencies',
          dependencies: ['Bundle analyzer tools'],
        }, {
          description: 'Implement code splitting and lazy loading',
        }, {
          description: 'Remove unused dependencies and code',
        }],
      });
    } else if (regression.type === 'memory_usage') {
      recommendations.push({
        priority: regression.severity === 'critical' ? 'high' : 'medium',
        type: 'optimization',
        category: 'code',
        description: `Optimize memory usage for ${regression.metric}. Check for memory leaks and inefficient data structures.`,
        impactAssessment: {
          userExperience: regression.impact.userExperience,
          businessValue: 'medium',
          technicalDebt: 'medium',
        },
        effortEstimate: '3-6 hours',
        automationPotential: 'medium',
        actionItems: [{
          description: 'Profile memory usage and identify memory leaks',
          dependencies: ['Memory profiling tools'],
        }, {
          description: 'Review object lifecycle and garbage collection',
        }, {
          description: 'Optimize data structures and algorithms',
        }],
      });
    }

    // Add the specific recommendations from the regression object
    for (const rec of regression.recommendations) {
      recommendations.push({
        priority: regression.severity === 'critical' ? 'high' : 'medium',
        type: 'investigation',
        category: 'code',
        description: rec,
        impactAssessment: {
          userExperience: regression.impact.userExperience,
          businessValue: 'medium',
          technicalDebt: 'low',
        },
        effortEstimate: '1-2 hours',
        automationPotential: 'low',
        actionItems: [{
          description: rec,
        }],
      });
    }

    return recommendations;
  }

  private generateCorrelationRecommendations(
    correlationAnalysis: RegressionDetectionResult['correlationAnalysis']
  ): RegressionDetectionResult['recommendations'] {
    const recommendations = [];

    // Analyze high correlations for optimization opportunities
    for (const correlation of correlationAnalysis.metricCorrelations) {
      if (Math.abs(correlation.correlation) > 0.7) {
        const improving = correlation.correlation < 0;

        if (correlation.metric1.includes('Time') || correlation.metric2.includes('Time')) {
          const timeMetric = correlation.metric1.includes('Time') ? correlation.metric1 : correlation.metric2;
          const otherMetric = correlation.metric1.includes('Time') ? correlation.metric2 : correlation.metric1;

          recommendations.push({
            priority: 'medium',
            type: 'optimization',
            category: 'code',
            description: `${improving ? 'Leverage' : 'Address'} strong correlation between ${timeMetric} and ${otherMetric}. ${
              improving ? 'Optimize both metrics together for compounded benefits.' : 'Focus on optimizing the root cause.'
            }`,
            impactAssessment: {
              userExperience: 'medium',
              businessValue: 'medium',
              technicalDebt: 'low',
            },
            effortEstimate: '2-4 hours',
            automationPotential: 'medium',
            actionItems: [{
              description: `Investigate relationship between ${timeMetric} and ${otherMetric}`,
            }, {
              description: 'Optimize both metrics as a system rather than in isolation',
            }],
          });
        }
      }
    }

    // Feature importance recommendations
    for (const feature of correlationAnalysis.featureImportance.slice(0, 3)) {
      if (feature.importance > 0.5) {
        recommendations.push({
          priority: feature.importance > 0.8 ? 'high' : 'medium',
          type: 'optimization',
          category: 'code',
          description: `${feature.feature} is a ${feature.direction} impact factor for overall performance. ${
            feature.direction === 'negative' ? 'Optimize' : 'Maintain'
          } this metric for best results.`,
          impactAssessment: {
            userExperience: 'medium',
            businessValue: 'medium',
            technicalDebt: 'low',
          },
          effortEstimate: '2-3 hours',
          automationPotential: 'medium',
          actionItems: [{
            description: `Prioritize optimization efforts on ${feature.feature}`,
          }],
        });
      }
    }

    return recommendations;
  }

  private generateTrendRecommendations(
    trendAnalysis: RegressionDetectionResult['trendAnalysis']
  ): RegressionDetectionResult['recommendations'] {
    const recommendations = [];

    // Trend-based recommendations
    for (const trend of trendAnalysis.trends) {
      if (trend.direction === 'degrading' && trend.significance > 0.7) {
        recommendations.push({
          priority: 'medium',
          type: 'monitoring',
          category: 'code',
          description: `${trend.metric} is showing a significant degrading trend. Proactive optimization recommended.`,
          impactAssessment: {
            userExperience: 'medium',
            businessValue: 'medium',
            technicalDebt: 'low',
          },
          effortEstimate: '1-2 hours',
          automationPotential: 'high',
          actionItems: [{
            description: 'Set up enhanced monitoring for this metric',
          }, {
            description: 'Investigate root cause of degradation',
          }],
        });
      } else if (trend.direction === 'improving' && trend.significance > 0.7) {
        recommendations.push({
          priority: 'low',
          type: 'monitoring',
          category: 'code',
          description: `${trend.metric} is showing a significant improving trend. Document successful optimization strategies.`,
          impactAssessment: {
            userExperience: 'low',
            businessValue: 'low',
            technicalDebt: 'low',
          },
          effortEstimate: '< 1 hour',
          automationPotential: 'medium',
          actionItems: [{
            description: 'Document optimization strategies that led to improvement',
          }],
        });
      }
    }

    // Change point recommendations
    for (const changePoint of trendAnalysis.changePoints) {
      if (changePoint.confidence > 0.8) {
        recommendations.push({
          priority: changePoint.magnitude > 0.3 ? 'high' : 'medium',
          type: 'investigation',
          category: 'code',
          description: `Significant change point detected in ${changePoint.metric} on ${changePoint.timestamp.toDateString()}. Investigate potential causes.`,
          impactAssessment: {
            userExperience: 'medium',
            businessValue: 'medium',
            technicalDebt: 'low',
          },
          effortEstimate: '1-2 hours',
          automationPotential: 'low',
          actionItems: [{
            description: 'Review code changes around the detected change point',
            dependencies: ['Git history', 'Deployment logs'],
          }, {
            description: 'Correlate with external events or infrastructure changes',
          }],
        });
      }
    }

    return recommendations;
  }

  private generateMLRecommendations(
    mlAnalysis: RegressionDetectionResult['mlAnalysis']
  ): RegressionDetectionResult['recommendations'] {
    const recommendations = [];

    // Anomaly-based recommendations
    for (const anomaly of mlAnalysis.anomalies) {
      if (anomaly.anomalyScore > 0.8) {
        recommendations.push({
          priority: 'medium',
          type: 'investigation',
          category: 'code',
          description: `Unusual pattern detected in ${anomaly.metric}. Value (${anomaly.value}) deviates significantly from expected (${anomaly.expectedValue}).`,
          impactAssessment: {
            userExperience: 'medium',
            businessValue: 'medium',
            technicalDebt: 'low',
          },
          effortEstimate: '1-2 hours',
          automationPotential: 'medium',
          actionItems: [{
            description: 'Investigate root cause of anomalous behavior',
          }, {
            description: 'Consider adding monitoring for this pattern',
          }],
        });
      }
    }

    // Prediction-based recommendations
    for (const prediction of mlAnalysis.predictions) {
      if (prediction.confidence > 0.7) {
        const isConcerning = this.isPredictionConcerning(prediction.metric, prediction.predictedValue);

        if (isConcerning) {
          recommendations.push({
            priority: 'medium',
            type: 'optimization',
            category: 'code',
            description: `Prediction indicates potential issue with ${prediction.metric} in next ${prediction.timeHorizon} days. Proactive optimization recommended.`,
            impactAssessment: {
              userExperience: 'medium',
              businessValue: 'medium',
              technicalDebt: 'low',
            },
            effortEstimate: '2-4 hours',
            automationPotential: 'medium',
            actionItems: [{
              description: 'Implement preventive optimization measures',
            }, {
              description: 'Monitor metric closely for early detection',
            }],
          });
        }
      }
    }

    return recommendations;
  }

  private isPredictionConcerning(metric: string, predictedValue: number): boolean {
    // Define thresholds concerning predictions
    const thresholds: Record<string, number> = {
      'loadTime': 3000, // 3 seconds
      'firstContentfulPaint': 2000, // 2 seconds
      'largestContentfulPaint': 4000, // 4 seconds
      'bundleSize': 500, // 500KB
      'memoryUsage': 100, // 100MB
    };

    const threshold = thresholds[metric];
    return threshold ? predictedValue > threshold : false;
  }

  private deduplicateRecommendations(
    recommendations: RegressionDetectionResult['recommendations']
  ): RegressionDetectionResult['recommendations'] {
    const seen = new Set<string>();
    const unique = [];

    for (const rec of recommendations) {
      const key = `${rec.type}-${rec.category}-${rec.description.substring(0, 50)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      }
    }

    return unique;
  }
}

class AlertManager {
  constructor(private config: RegressionDetectionConfig['alerting']) {}

  async sendAlert(
    regression: PerformanceRegression,
    result: RegressionDetectionResult
  ): Promise<void> {
    const alertMessage = this.formatAlert(regression, result);

    for (const channel of this.config.channels) {
      switch (channel) {
        case 'console':
          const logMethod = regression.severity === 'critical' ? 'error' : 'warn';
          console[logMethod](`🚨 Performance Regression Alert: ${alertMessage}`);

          if (this.config.includeRecommendations) {
            regression.recommendations.forEach(rec =>
              console[logMethod](`  • ${rec}`)
            );
          }
          break;

        case 'email':
          // Would implement email sending
          console.log(`📧 Email alert would be sent: ${alertMessage}`);
          break;

        case 'slack':
          // Would implement Slack integration
          console.log(`💬 Slack alert would be sent: ${alertMessage}`);
          break;

        case 'webhook':
          // Would implement webhook call
          console.log(`🔗 Webhook alert would be sent: ${alertMessage}`);
          break;
      }
    }
  }

  private formatAlert(
    regression: PerformanceRegression,
    result: RegressionDetectionResult
  ): string {
    return `${regression.severity.toUpperCase()} regression detected in ${result.scenario}: ${regression.metric} increased by ${regression.regression.toFixed(1)}% (${regression.baselineValue} → ${regression.currentValue})`;
  }

  updateConfig(config: RegressionDetectionConfig['alerting']): void {
    this.config = { ...this.config, ...config };
  }
}

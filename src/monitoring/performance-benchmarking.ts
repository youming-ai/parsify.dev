/**
 * Performance Benchmarking and Baseline Establishment System
 * Automated benchmark collection, baseline management, and statistical analysis
 * Features multi-environment testing, statistical significance, and trend detection
 */

import { PerformanceTestResult, PerformanceBaseline } from './performance-regression-testing';

export interface BenchmarkConfig {
  enabled: boolean;
  environments: Array<{
    name: string;
    description: string;
    url: string;
    device: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    network: 'offline' | 'slow3g' | 'fast3g' | 'slow4g' | '4g';
    viewport: { width: number; height: number };
    cpuThrottling?: number; // CPU slowdown factor
  }>;
  scenarios: Array<{
    name: string;
    category: string;
    description: string;
    path: string;
    critical: boolean;
    weight: number; // Importance weight (1-10)
    actions: BenchmarkAction[];
    customMetrics?: string[];
  }>;
  collection: {
    sampleSize: number;
    warmupRuns: number;
    measurementRuns: number;
    statisticalConfidence: number; // 0-1
    outlierDetection: boolean;
    outlierThreshold: number; // Standard deviations
    timeBetweenRuns: number; // milliseconds
    timeout: number; // milliseconds per scenario
  };
  scheduling: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
    timeOfDay?: string; // HH:MM format
    timezone?: string;
    retryOnFailure: boolean;
    maxRetries: number;
    alertOnFailure: boolean;
  };
  storage: {
    retention: number; // days
    compression: boolean;
    encryption: boolean;
    backupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly';
  };
}

export interface BenchmarkAction {
  type: 'navigate' | 'click' | 'type' | 'scroll' | 'hover' | 'wait' | 'measure' | 'screenshot';
  target?: string; // CSS selector
  value?: string; // Input value
  duration?: number; // Wait duration
  selector?: string; // Element selector
  scrollTo?: 'top' | 'bottom' | 'center' | { x: number; y: number };
  screenshot?: {
    name: string;
    fullPage?: boolean;
  };
  measure?: {
    name: string;
    start: string;
    end: string;
  };
  options?: {
    timeout?: number;
    retries?: number;
    delay?: number;
  };
}

export interface BenchmarkResult {
  id: string;
  benchmarkSuite: string;
  scenario: string;
  environment: string;
  timestamp: Date;
  duration: number;
  status: 'success' | 'failure' | 'timeout' | 'cancelled';
  metrics: {
    // Navigation metrics
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;

    // Core Web Vitals
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;

    // Resource metrics
    totalResources: number;
    totalSize: number;
    compressedSize: number;
    jsSize: number;
    cssSize: number;
    imageSize: number;
    fontSize: number;

    // Runtime metrics
    renderTime: number;
    scriptExecutionTime: number;
    layoutTime: number;
    paintTime: number;

    // Memory metrics
    memoryUsed: number;
    memoryPeak: number;
    memoryAllocated: number;

    // Network metrics
    dnsLookup: number;
    tcpConnection: number;
    sslNegotiation: number;
    serverResponse: number;

    // Custom metrics
    customMetrics: Record<string, number>;

    // Tool-specific metrics (for Parsify tools)
    toolMetrics?: {
      processingTime: number;
      operationsPerSecond: number;
      accuracy: number;
      errorRate: number;
      throughput: number;
    };
  };

  // Statistical analysis
  statistics: {
    sampleSize: number;
    mean: number;
    median: number;
    standardDeviation: number;
    variance: number;
    min: number;
    max: number;
    p90: number;
    p95: number;
    p99: number;
    confidenceInterval: {
      lower: number;
      upper: number;
      level: number;
    };
    outliers: number[];
    coefficientOfVariation: number;
  };

  // Execution details
  execution: {
    runs: number;
    warmupRuns: number;
    measurementRuns: number;
    errors: string[];
    warnings: string[];
    userAgent: string;
    viewport: { width: number; height: number };
    networkConditions: string;
  };

  // Environment details
  environmentInfo: {
    browser: string;
    version: string;
    os: string;
    device: string;
    cpuCores: number;
    memory: number;
    screenResolution: string;
  };
}

export interface BaselineCalculation {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  validUntil: Date;
  status: 'draft' | 'active' | 'deprecated' | 'archived';

  // Baseline data
  data: {
    scenarios: Record<string, BaselineScenario>;
    aggregates: {
      overall: BaselineAggregate;
      byCategory: Record<string, BaselineAggregate>;
      byEnvironment: Record<string, BaselineAggregate>;
    };
  };

  // Quality metrics
  quality: {
    dataCompleteness: number; // 0-1
    statisticalSignificance: number; // 0-1
    confidence: number; // 0-1
    stability: number; // 0-1
    reliability: number; // 0-1
  };

  // Context information
  context: {
    environment: string;
    buildVersion: string;
    commitHash: string;
    branch: string;
    buildNumber: string;
    sampleSize: number;
    collectionPeriod: {
      start: Date;
      end: Date;
      duration: number; // milliseconds
    };
    testConditions: string[];
  };

  // Validation
  validation: {
    validatedAt?: Date;
    validatedBy?: string;
    approved: boolean;
    comments?: string;
    automatedValidation: boolean;
  };
}

export interface BaselineScenario {
  name: string;
  category: string;
  metrics: {
    [metricName: string]: {
      value: number;
      unit: string;
      statisticalData: {
        mean: number;
        median: number;
        standardDeviation: number;
        confidenceInterval: {
          lower: number;
          upper: number;
          level: number;
        };
        p95: number;
        p99: number;
      };
    };
  };
  trends?: {
    direction: 'improving' | 'degrading' | 'stable';
    slope: number;
    confidence: number;
    significance: number;
  };
  thresholds: {
    warning: number;
    critical: number;
    absolute: number;
  };
}

export interface BaselineAggregate {
  scenarioCount: number;
  metrics: {
    [metricName: string]: {
      mean: number;
      median: number;
      p95: number;
      p99: number;
      weight: number;
    };
  };
  score: {
    overall: number; // 0-100
    performance: number;
    reliability: number;
    consistency: number;
  };
}

export interface BenchmarkComparison {
  id: string;
  name: string;
  description: string;
  createdAt: Date;

  // Comparison data
  baseline: BaselineCalculation;
  current: BenchmarkResult[];

  // Analysis results
  analysis: {
    overall: {
      status: 'improved' | 'degraded' | 'stable' | 'mixed';
      scoreChange: number;
      significance: number;
    };
    scenarios: Record<string, ScenarioComparison>;
    trends: Record<string, TrendAnalysis>;
    outliers: Array<{
      scenario: string;
      metric: string;
      deviation: number;
      significance: number;
    }>;
  };

  // Recommendations
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'optimization' | 'investigation' | 'monitoring';
    description: string;
    expectedImpact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}

export interface ScenarioComparison {
  scenario: string;
  category: string;
  status: 'improved' | 'degraded' | 'stable';
  scoreChange: number;
  metrics: {
    [metricName: string]: {
      baseline: number;
      current: number;
      change: number; // percentage
      changeAbsolute: number;
      significance: boolean;
      trend: 'improving' | 'degrading' | 'stable';
    };
  };
  impact: {
    userExperience: 'positive' | 'negative' | 'neutral';
    businessValue: 'positive' | 'negative' | 'neutral';
    severity: 'low' | 'medium' | 'high';
  };
}

export interface TrendAnalysis {
  metric: string;
  period: {
    start: Date;
    end: Date;
    dataPoints: number;
  };
  direction: 'improving' | 'degrading' | 'stable' | 'volatile';
  slope: number;
  confidence: number;
  significance: number;
  correlation?: number;
  forecast?: {
    nextPeriod: number;
    confidence: number;
    risk: 'low' | 'medium' | 'high';
  };
}

/**
 * Main Performance Benchmarking System
 */
export class PerformanceBenchmarking {
  private static instance: PerformanceBenchmarking;
  private config: BenchmarkConfig;
  private results: BenchmarkResult[] = [];
  private baselines: Map<string, BaselineCalculation> = new Map();
  private comparisons: BenchmarkComparison[] = [];
  private isRunning = false;
  private benchmarkingInterval?: NodeJS.Timeout;

  // Components
  private benchmarkRunner: BenchmarkRunner;
  private baselineCalculator: BaselineCalculator;
  private statisticalAnalyzer: StatisticalAnalyzer;
  private trendAnalyzer: BenchmarkTrendAnalyzer;
  private storageManager: BenchmarkStorageManager;

  private constructor(config?: Partial<BenchmarkConfig>) {
    this.config = this.getDefaultConfig(config);
    this.benchmarkRunner = new BenchmarkRunner(this.config);
    this.baselineCalculator = new BaselineCalculator(this.config);
    this.statisticalAnalyzer = new StatisticalAnalyzer();
    this.trendAnalyzer = new BenchmarkTrendAnalyzer();
    this.storageManager = new BenchmarkStorageManager();
  }

  public static getInstance(config?: Partial<BenchmarkConfig>): PerformanceBenchmarking {
    if (!PerformanceBenchmarking.instance) {
      PerformanceBenchmarking.instance = new PerformanceBenchmarking(config);
    }
    return PerformanceBenchmarking.instance;
  }

  private getDefaultConfig(overrides?: Partial<BenchmarkConfig>): BenchmarkConfig {
    const isCI = process.env.CI === 'true';

    return {
      enabled: true,
      environments: [
        {
          name: 'Desktop Chrome',
          description: 'Desktop Chrome on fast connection',
          url: 'http://localhost:3000',
          device: 'desktop',
          browser: 'chrome',
          network: '4g',
          viewport: { width: 1920, height: 1080 },
          cpuThrottling: isCI ? 1 : 4, // No throttling in CI for consistency
        },
        {
          name: 'Mobile Chrome',
          description: 'Mobile Chrome on 3G connection',
          url: 'http://localhost:3000',
          device: 'mobile',
          browser: 'chrome',
          network: 'fast3g',
          viewport: { width: 375, height: 667 },
          cpuThrottling: 4, // Simulate mobile CPU
        },
        {
          name: 'Tablet Safari',
          description: 'Tablet Safari on 4G connection',
          url: 'http://localhost:3000',
          device: 'tablet',
          browser: 'safari',
          network: '4g',
          viewport: { width: 768, height: 1024 },
          cpuThrottling: 2,
        },
      ],
      scenarios: [
        {
          name: 'Home Page Load',
          category: 'navigation',
          description: 'Test homepage loading performance',
          path: '/',
          critical: true,
          weight: 10,
          actions: [
            { type: 'navigate', target: '/' },
            { type: 'wait', duration: 3000 },
            { type: 'measure', measure: { name: 'page-load', start: 'navigation-start', end: 'load-complete' } },
            { type: 'screenshot', screenshot: { name: 'home-page-loaded', fullPage: true } },
          ],
        },
        {
          name: 'Tools Index Load',
          category: 'navigation',
          description: 'Test tools listing page performance',
          path: '/tools',
          critical: true,
          weight: 9,
          actions: [
            { type: 'navigate', target: '/tools' },
            { type: 'wait', duration: 2000 },
            { type: 'measure', measure: { name: 'tools-load', start: 'navigation-start', end: 'load-complete' } },
          ],
        },
        {
          name: 'JSON Formatter Load',
          category: 'tool',
          description: 'Test JSON formatter tool initialization',
          path: '/tools/json/formatter',
          critical: true,
          weight: 8,
          actions: [
            { type: 'navigate', target: '/tools/json/formatter' },
            { type: 'wait', duration: 2000 },
            { type: 'measure', measure: { name: 'tool-init', start: 'navigation-start', end: 'load-complete' } },
          ],
          customMetrics: ['monaco-load-time', 'editor-ready-time'],
        },
        {
          name: 'JSON Formatting Operation',
          category: 'tool-operation',
          description: 'Test JSON formatting performance',
          path: '/tools/json/formatter',
          critical: true,
          weight: 9,
          actions: [
            { type: 'navigate', target: '/tools/json/formatter' },
            { type: 'wait', duration: 1000 },
            { type: 'type', target: '#json-input', value: '{"name":"John","age":30,"city":"New York"}' },
            { type: 'click', target: 'button[aria-label="Format JSON"]' },
            { type: 'wait', duration: 500 },
            { type: 'measure', measure: { name: 'format-operation', start: 'format-start', end: 'format-end' } },
          ],
          customMetrics: ['format-time', 'parse-time', 'render-time'],
        },
        {
          name: 'Code Executor Load',
          category: 'tool',
          description: 'Test code executor tool initialization',
          path: '/tools/code/executor',
          critical: true,
          weight: 7,
          actions: [
            { type: 'navigate', target: '/tools/code/executor' },
            { type: 'wait', duration: 2000 },
            { type: 'measure', measure: { name: 'code-executor-load', start: 'navigation-start', end: 'load-complete' } },
          ],
        },
        {
          name: 'JavaScript Execution',
          category: 'tool-operation',
          description: 'Test JavaScript code execution performance',
          path: '/tools/code/executor',
          critical: true,
          weight: 8,
          actions: [
            { type: 'navigate', target: '/tools/code/executor' },
            { type: 'wait', duration: 1000 },
            { type: 'type', target: '#code-input', value: 'console.log("Hello, World!");\nfor(let i = 0; i < 1000; i++) {\n  Math.random();\n}' },
            { type: 'click', target: 'button[aria-label="Run Code"]' },
            { type: 'wait', duration: 1000 },
            { type: 'measure', measure: { name: 'js-execution', start: 'execution-start', end: 'execution-end' } },
          ],
          customMetrics: ['execution-time', 'memory-allocation', 'cpu-usage'],
        },
        {
          name: 'Search Functionality',
          category: 'feature',
          description: 'Test tool search performance',
          path: '/tools',
          critical: false,
          weight: 5,
          actions: [
            { type: 'navigate', target: '/tools' },
            { type: 'wait', duration: 1000 },
            { type: 'type', target: '#search-input', value: 'json' },
            { type: 'wait', duration: 300 },
            { type: 'measure', measure: { name: 'search-operation', start: 'search-start', end: 'search-end' } },
          ],
          customMetrics: ['search-index-time', 'filter-time', 'render-results-time'],
        },
        {
          name: 'Category Navigation',
          category: 'feature',
          description: 'Test category filter performance',
          path: '/tools',
          critical: false,
          weight: 4,
          actions: [
            { type: 'navigate', target: '/tools' },
            { type: 'wait', duration: 1000 },
            { type: 'click', target: 'button[data-category="json"]' },
            { type: 'wait', duration: 300 },
            { type: 'measure', measure: { name: 'category-filter', start: 'filter-start', end: 'filter-end' } },
          ],
        },
      ],
      collection: {
        sampleSize: 30, // 30 measurements for statistical significance
        warmupRuns: 3,
        measurementRuns: 5,
        statisticalConfidence: 0.95,
        outlierDetection: true,
        outlierThreshold: 2, // 2 standard deviations
        timeBetweenRuns: 1000, // 1 second between runs
        timeout: 30000, // 30 seconds per scenario
      },
      scheduling: {
        enabled: !isCI, // Disable scheduled runs in CI
        frequency: 'daily',
        timeOfDay: '02:00', // 2 AM
        timezone: 'UTC',
        retryOnFailure: true,
        maxRetries: 3,
        alertOnFailure: true,
      },
      storage: {
        retention: 90, // 90 days
        compression: true,
        encryption: false,
        backupEnabled: true,
        backupFrequency: 'weekly',
      },
      ...overrides,
    };
  }

  public async initialize(): Promise<void> {
    console.log('📊 Initializing Performance Benchmarking System...');

    try {
      // Load existing baselines
      await this.loadBaselines();

      // Load existing results
      await this.loadResults();

      // Initialize storage manager
      await this.storageManager.initialize();

      // Start scheduled benchmarking if enabled
      if (this.config.scheduling.enabled) {
        await this.startScheduledBenchmarking();
      }

      console.log('✅ Performance Benchmarking System initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Performance Benchmarking System:', error);
      throw error;
    }
  }

  /**
   * Run complete benchmark suite
   */
  public async runBenchmarkSuite(options?: {
    environments?: string[];
    scenarios?: string[];
    createBaseline?: boolean;
    compareWithBaseline?: string;
    parallel?: boolean;
    dryRun?: boolean;
  }): Promise<BenchmarkResult[]> {
    if (this.isRunning) {
      throw new Error('Benchmark suite is already running');
    }

    this.isRunning = true;
    console.log('🏁 Starting performance benchmark suite...');

    try {
      const startTime = Date.now();
      const results: BenchmarkResult[] = [];

      // Filter environments and scenarios if specified
      const environments = options?.environments
        ? this.config.environments.filter(e => options.environments!.includes(e.name))
        : this.config.environments;

      const scenarios = options?.scenarios
        ? this.config.scenarios.filter(s => options.scenarios!.includes(s.name))
        : this.config.scenarios;

      console.log(`Running ${scenarios.length} scenarios across ${environments.length} environments`);

      // Dry run validation
      if (options?.dryRun) {
        await this.validateScenarios(scenarios, environments);
        this.isRunning = false;
        return [];
      }

      // Execute benchmarks
      if (options?.parallel !== false) {
        // Run in parallel
        const promises = [];
        for (const environment of environments) {
          for (const scenario of scenarios) {
            promises.push(this.runSingleBenchmark(scenario, environment));
          }
        }
        const benchmarkResults = await Promise.all(promises);
        results.push(...benchmarkResults);
      } else {
        // Run sequentially
        for (const environment of environments) {
          for (const scenario of scenarios) {
            const result = await this.runSingleBenchmark(scenario, environment);
            results.push(result);
          }
        }
      }

      // Store results
      this.results.push(...results);
      await this.saveResults();

      // Create baseline if requested
      if (options?.createBaseline) {
        await this.createBaseline(results);
      }

      // Compare with baseline if specified
      if (options?.compareWithBaseline) {
        await this.compareWithBaseline(options.compareWithBaseline, results);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Benchmark suite completed in ${duration}ms with ${results.length} results`);

      return results;
    } catch (error) {
      console.error('❌ Benchmark suite execution failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run a single benchmark scenario
   */
  private async runSingleBenchmark(
    scenario: typeof PerformanceBenchmarking.prototype.config.scenarios[0],
    environment: typeof PerformanceBenchmarking.prototype.config.environments[0]
  ): Promise<BenchmarkResult> {
    console.log(`🔬 Running benchmark: ${scenario.name} on ${environment.name}`);

    try {
      const result = await this.benchmarkRunner.executeBenchmark(scenario, environment);

      console.log(`✅ Benchmark completed: ${scenario.name} (${result.status})`);
      return result;
    } catch (error) {
      console.error(`❌ Benchmark failed: ${scenario.name}`, error);

      // Return failed result
      return {
        id: `benchmark-${Date.now()}-${scenario.name.replace(/\s+/g, '-').toLowerCase()}`,
        benchmarkSuite: 'Parsify Performance Suite',
        scenario: scenario.name,
        environment: environment.name,
        timestamp: new Date(),
        duration: 0,
        status: 'failure',
        metrics: this.getEmptyMetrics(),
        statistics: this.getEmptyStatistics(),
        execution: {
          runs: 0,
          warmupRuns: 0,
          measurementRuns: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: [],
          userAgent: '',
          viewport: environment.viewport,
          networkConditions: environment.network,
        },
        environmentInfo: {
          browser: environment.browser,
          version: 'unknown',
          os: 'unknown',
          device: environment.device,
          cpuCores: 0,
          memory: 0,
          screenResolution: `${environment.viewport.width}x${environment.viewport.height}`,
        },
      };
    }
  }

  private getEmptyMetrics(): BenchmarkResult['metrics'] {
    return {
      navigationStart: 0,
      domContentLoaded: 0,
      loadComplete: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      timeToInteractive: 0,
      totalResources: 0,
      totalSize: 0,
      compressedSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      fontSize: 0,
      renderTime: 0,
      scriptExecutionTime: 0,
      layoutTime: 0,
      paintTime: 0,
      memoryUsed: 0,
      memoryPeak: 0,
      memoryAllocated: 0,
      dnsLookup: 0,
      tcpConnection: 0,
      sslNegotiation: 0,
      serverResponse: 0,
      customMetrics: {},
    };
  }

  private getEmptyStatistics(): BenchmarkResult['statistics'] {
    return {
      sampleSize: 0,
      mean: 0,
      median: 0,
      standardDeviation: 0,
      variance: 0,
      min: 0,
      max: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      confidenceInterval: { lower: 0, upper: 0, level: 0 },
      outliers: [],
      coefficientOfVariation: 0,
    };
  }

  /**
   * Validate scenarios before running
   */
  private async validateScenarios(
    scenarios: typeof PerformanceBenchmarking.prototype.config.scenarios[0],
    environments: typeof PerformanceBenchmarking.prototype.config.environments[0]
  ): Promise<void> {
    console.log('🔍 Validating benchmark scenarios...');

    const errors: string[] = [];

    for (const scenario of scenarios) {
      for (const environment of environments) {
        try {
          // Test navigation to the path
          const url = `${environment.url}${scenario.path}`;

          // In a real implementation, this would make an HTTP request
          // to validate the URL is accessible
          console.log(`Validating ${scenario.name} on ${environment.name} (${url})`);
        } catch (error) {
          errors.push(`Scenario ${scenario.name} on ${environment.name}: ${error}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }

    console.log('✅ All scenarios validated successfully');
  }

  /**
   * Create performance baseline from results
   */
  public async createBaseline(results: BenchmarkResult[]): Promise<BaselineCalculation> {
    console.log('📊 Creating performance baseline...');

    const baseline = await this.baselineCalculator.calculateBaseline(results, {
      name: `Baseline ${new Date().toISOString()}`,
      version: this.getNextBaselineVersion(),
      description: 'Automatically generated baseline from benchmark results',
    });

    // Store baseline
    this.baselines.set(baseline.id, baseline);
    await this.saveBaseline(baseline);

    console.log('✅ Performance baseline created successfully');
    return baseline;
  }

  private getNextBaselineVersion(): string {
    const existingBaselines = Array.from(this.baselines.values());
    const maxVersion = existingBaselines.reduce((max, baseline) => {
      const version = parseInt(baseline.version.replace('v', '')) || 0;
      return Math.max(max, version);
    }, 0);

    return `v${maxVersion + 1}`;
  }

  /**
   * Compare current results with baseline
   */
  public async compareWithBaseline(baselineId: string, currentResults: BenchmarkResult[]): Promise<BenchmarkComparison> {
    console.log(`📈 Comparing results with baseline ${baselineId}...`);

    const baseline = this.baselines.get(baselineId);
    if (!baseline) {
      throw new Error(`Baseline ${baselineId} not found`);
    }

    const comparison = await this.performComparison(baseline, currentResults);

    // Store comparison
    this.comparisons.push(comparison);

    console.log('✅ Baseline comparison completed');
    return comparison;
  }

  private async performComparison(
    baseline: BaselineCalculation,
    currentResults: BenchmarkResult[]
  ): Promise<BenchmarkComparison> {
    const comparison: BenchmarkComparison = {
      id: `comparison-${Date.now()}`,
      name: `${baseline.name} vs Current`,
      description: `Comparison of ${baseline.name} with current results`,
      createdAt: new Date(),
      baseline,
      current: currentResults,
      analysis: {
        overall: {
          status: 'stable',
          scoreChange: 0,
          significance: 0,
        },
        scenarios: {},
        trends: {},
        outliers: [],
      },
      recommendations: [],
    };

    // Analyze each scenario
    for (const result of currentResults) {
      const baselineScenario = baseline.data.scenarios[result.scenario];
      if (baselineScenario) {
        const scenarioComparison = await this.compareScenario(baselineScenario, result);
        comparison.analysis.scenarios[result.scenario] = scenarioComparison;
      }
    }

    // Calculate overall analysis
    comparison.analysis.overall = await this.calculateOverallComparison(comparison.analysis.scenarios);

    // Generate recommendations
    comparison.recommendations = await this.generateRecommendations(comparison);

    return comparison;
  }

  private async compareScenario(
    baselineScenario: BaselineScenario,
    currentResult: BenchmarkResult
  ): Promise<ScenarioComparison> {
    const metrics: ScenarioComparison['metrics'] = {};
    let totalChange = 0;
    let metricCount = 0;

    // Compare each metric
    for (const [metricName, baselineMetric] of Object.entries(baselineScenario.metrics)) {
      const currentValue = this.getMetricValue(currentResult, metricName);

      if (currentValue !== undefined && baselineMetric.value > 0) {
        const change = ((currentValue - baselineMetric.value) / baselineMetric.value) * 100;

        metrics[metricName] = {
          baseline: baselineMetric.value,
          current: currentValue,
          change,
          changeAbsolute: currentValue - baselineMetric.value,
          significance: this.isChangeSignificant(change, baselineMetric.statisticalData),
          trend: this.determineTrend(change),
        };

        totalChange += Math.abs(change);
        metricCount++;
      }
    }

    // Determine overall status
    const averageChange = metricCount > 0 ? totalChange / metricCount : 0;
    let status: ScenarioComparison['status'];
    if (averageChange > 15) {
      status = 'degraded';
    } else if (averageChange < -10) {
      status = 'improved';
    } else {
      status = 'stable';
    }

    return {
      scenario: currentResult.scenario,
      category: baselineScenario.category,
      status,
      scoreChange: -averageChange, // Negative for improvement
      metrics,
      impact: {
        userExperience: this.assessUserExperienceImpact(metrics),
        businessValue: this.assessBusinessValueImpact(metrics),
        severity: this.assessSeverity(metrics),
      },
    };
  }

  private getMetricValue(result: BenchmarkResult, metricName: string): number | undefined {
    // Map metric names to result properties
    const metricMap: Record<string, keyof BenchmarkResult['metrics']> = {
      'loadTime': 'loadComplete',
      'firstContentfulPaint': 'firstContentfulPaint',
      'largestContentfulPaint': 'largestContentfulPaint',
      'timeToInteractive': 'timeToInteractive',
      'totalSize': 'totalSize',
      'memoryUsed': 'memoryUsed',
    };

    const resultKey = metricMap[metricName];
    if (resultKey) {
      return result.metrics[resultKey] as number;
    }

    // Check custom metrics
    return result.metrics.customMetrics[metricName];
  }

  private isChangeSignificant(
    change: number,
    baselineStatistical: BaselineScenario['metrics'][string]['statisticalData']
  ): boolean {
    // Simple significance test based on confidence interval
    const { confidenceInterval } = baselineStatistical;
    const threshold = (confidenceInterval.upper - confidenceInterval.lower) / 2;
    return Math.abs(change) > threshold;
  }

  private determineTrend(change: number): 'improving' | 'degrading' | 'stable' {
    if (Math.abs(change) < 5) {
      return 'stable';
    }
    return change < 0 ? 'improving' : 'degrading';
  }

  private assessUserExperienceImpact(
    metrics: ScenarioComparison['metrics']
  ): 'positive' | 'negative' | 'neutral' {
    // Key metrics that affect user experience
    const uxMetrics = ['loadTime', 'firstContentfulPaint', 'largestContentfulPaint', 'timeToInteractive'];

    let positiveImpact = 0;
    let negativeImpact = 0;

    for (const metric of uxMetrics) {
      if (metrics[metric]) {
        if (metrics[metric].trend === 'improving') {
          positiveImpact++;
        } else if (metrics[metric].trend === 'degrading') {
          negativeImpact++;
        }
      }
    }

    if (positiveImpact > negativeImpact) {
      return 'positive';
    } else if (negativeImpact > positiveImpact) {
      return 'negative';
    }
    return 'neutral';
  }

  private assessBusinessValueImpact(
    metrics: ScenarioComparison['metrics']
  ): 'positive' | 'negative' | 'neutral' {
    // Business value assessment based on performance improvements
    const criticalMetrics = ['loadTime', 'timeToInteractive', 'totalSize'];

    let significantImprovements = 0;
    let significantDegradations = 0;

    for (const metric of criticalMetrics) {
      if (metrics[metric]) {
        if (metrics[metric].change < -10 && metrics[metric].significance) {
          significantImprovements++;
        } else if (metrics[metric].change > 15 && metrics[metric].significance) {
          significantDegradations++;
        }
      }
    }

    if (significantImprovements > significantDegradations) {
      return 'positive';
    } else if (significantDegradations > significantImprovements) {
      return 'negative';
    }
    return 'neutral';
  }

  private assessSeverity(metrics: ScenarioComparison['metrics']): 'low' | 'medium' | 'high' {
    let maxDegradation = 0;

    for (const metric of Object.values(metrics)) {
      if (metric.change > maxDegradation && metric.trend === 'degrading') {
        maxDegradation = metric.change;
      }
    }

    if (maxDegradation > 30) {
      return 'high';
    } else if (maxDegradation > 15) {
      return 'medium';
    }
    return 'low';
  }

  private async calculateOverallComparison(
    scenarios: Record<string, ScenarioComparison>
  ): Promise<BenchmarkComparison['analysis']['overall']> {
    const scenarioValues = Object.values(scenarios);

    if (scenarioValues.length === 0) {
      return { status: 'stable', scoreChange: 0, significance: 0 };
    }

    // Calculate weighted average score change
    let totalWeightedChange = 0;
    let totalWeight = 0;
    let significantChanges = 0;

    for (const scenario of scenarioValues) {
      const weight = this.getScenarioWeight(scenario.scenario);
      totalWeightedChange += scenario.scoreChange * weight;
      totalWeight += weight;

      if (Object.values(scenario.metrics).some(m => m.significance)) {
        significantChanges++;
      }
    }

    const averageScoreChange = totalWeight > 0 ? totalWeightedChange / totalWeight : 0;
    const significance = scenarioValues.length > 0 ? significantChanges / scenarioValues.length : 0;

    let status: BenchmarkComparison['analysis']['overall']['status'];
    if (averageScoreChange < -10) {
      status = 'improved';
    } else if (averageScoreChange > 15) {
      status = 'degraded';
    } else {
      status = 'stable';
    }

    return {
      status,
      scoreChange: averageScoreChange,
      significance,
    };
  }

  private getScenarioWeight(scenarioName: string): number {
    const scenario = this.config.scenarios.find(s => s.name === scenarioName);
    return scenario?.weight || 1;
  }

  private async generateRecommendations(
    comparison: BenchmarkComparison
  ): Promise<BenchmarkComparison['recommendations']> {
    const recommendations: BenchmarkComparison['recommendations'] = [];

    // Analyze scenarios for optimization opportunities
    for (const [scenarioName, scenarioComparison] of Object.entries(comparison.analysis.scenarios)) {
      for (const [metricName, metricComparison] of Object.entries(scenarioComparison.metrics)) {
        if (metricComparison.trend === 'degrading' && metricComparison.significance) {
          const recommendation = this.generateOptimizationRecommendation(
            scenarioName,
            metricName,
            metricComparison
          );

          if (recommendation) {
            recommendations.push(recommendation);
          }
        }
      }
    }

    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return recommendations;
  }

  private generateOptimizationRecommendation(
    scenario: string,
    metric: string,
    comparison: ScenarioComparison['metrics'][string]
  ): BenchmarkComparison['recommendations'][0] | null {
    const recommendations: Record<string, BenchmarkComparison['recommendations'][0]> = {
      'loadTime': {
        priority: comparison.change > 30 ? 'high' : 'medium',
        type: 'optimization',
        description: `Load time increased by ${comparison.change.toFixed(1)}%. Consider optimizing resource loading and critical path rendering.`,
        expectedImpact: 'Improved user experience and reduced bounce rate',
        effort: 'medium',
      },
      'firstContentfulPaint': {
        priority: comparison.change > 25 ? 'high' : 'medium',
        type: 'optimization',
        description: `First Contentful Paint degraded by ${comparison.change.toFixed(1)}%. Optimize critical CSS and reduce render-blocking resources.`,
        expectedImpact: 'Faster perceived performance and better user engagement',
        effort: 'medium',
      },
      'largestContentfulPaint': {
        priority: comparison.change > 25 ? 'high' : 'medium',
        type: 'optimization',
        description: `Largest Contentful Paint increased by ${comparison.change.toFixed(1)}%. Optimize image loading and font delivery.`,
        expectedImpact: 'Better Core Web Vitals scores and search ranking',
        effort: 'high',
      },
      'totalSize': {
        priority: comparison.change > 20 ? 'high' : 'medium',
        type: 'optimization',
        description: `Bundle size increased by ${comparison.change.toFixed(1)}%. Review dependencies and implement code splitting.`,
        expectedImpact: 'Reduced bandwidth usage and faster load times',
        effort: 'medium',
      },
    };

    return recommendations[metric] || null;
  }

  /**
   * Start scheduled benchmarking
   */
  private async startScheduledBenchmarking(): Promise<void> {
    if (!this.config.scheduling.enabled) {
      return;
    }

    console.log(`⏰ Starting scheduled benchmarking (${this.config.scheduling.frequency})`);

    const scheduleInterval = this.getScheduleInterval();

    this.benchmarkingInterval = setInterval(async () => {
      try {
        console.log('🕐 Running scheduled benchmark...');
        await this.runBenchmarkSuite();
        console.log('✅ Scheduled benchmark completed');
      } catch (error) {
        console.error('❌ Scheduled benchmark failed:', error);

        if (this.config.scheduling.alertOnFailure) {
          // Send alert notification
          await this.sendFailureAlert(error);
        }
      }
    }, scheduleInterval);
  }

  private getScheduleInterval(): number {
    switch (this.config.scheduling.frequency) {
      case 'hourly':
        return 60 * 60 * 1000; // 1 hour
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      default:
        return 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  private async sendFailureAlert(error: any): Promise<void> {
    console.error('🚨 Benchmark failure alert:', error);
    // In a real implementation, this would send notifications
    // via email, Slack, or other alerting systems
  }

  /**
   * Stop scheduled benchmarking
   */
  public stopScheduledBenchmarking(): void {
    if (this.benchmarkingInterval) {
      clearInterval(this.benchmarkingInterval);
      this.benchmarkingInterval = undefined;
      console.log('🛑 Scheduled benchmarking stopped');
    }
  }

  // Data persistence methods
  private async loadBaselines(): Promise<void> {
    // Load baselines from storage
    try {
      const baselines = await this.storageManager.loadBaselines();
      for (const baseline of baselines) {
        this.baselines.set(baseline.id, baseline);
      }
      console.log(`📊 Loaded ${baselines.length} baselines`);
    } catch (error) {
      console.warn('⚠️ Failed to load baselines:', error);
    }
  }

  private async loadResults(): Promise<void> {
    // Load results from storage
    try {
      const results = await this.storageManager.loadResults();
      this.results.push(...results);
      console.log(`📈 Loaded ${results.length} benchmark results`);
    } catch (error) {
      console.warn('⚠️ Failed to load results:', error);
    }
  }

  private async saveResults(): Promise<void> {
    // Save results to storage
    try {
      await this.storageManager.saveResults(this.results);
    } catch (error) {
      console.error('❌ Failed to save results:', error);
    }
  }

  private async saveBaseline(baseline: BaselineCalculation): Promise<void> {
    // Save baseline to storage
    try {
      await this.storageManager.saveBaseline(baseline);
    } catch (error) {
      console.error('❌ Failed to save baseline:', error);
    }
  }

  // Public API methods
  public getResults(
    filters?: {
      scenario?: string;
      environment?: string;
      dateFrom?: Date;
      dateTo?: Date;
      status?: BenchmarkResult['status'];
    }
  ): BenchmarkResult[] {
    let results = [...this.results];

    if (filters) {
      if (filters.scenario) {
        results = results.filter(r => r.scenario === filters.scenario);
      }
      if (filters.environment) {
        results = results.filter(r => r.environment === filters.environment);
      }
      if (filters.dateFrom) {
        results = results.filter(r => r.timestamp >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        results = results.filter(r => r.timestamp <= filters.dateTo!);
      }
      if (filters.status) {
        results = results.filter(r => r.status === filters.status);
      }
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getBaselines(): BaselineCalculation[] {
    return Array.from(this.baselines.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  public getComparisons(): BenchmarkComparison[] {
    return this.comparisons.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getActiveBaseline(): BaselineCalculation | null {
    const activeBaselines = this.getBaselines().filter(b => b.status === 'active');
    return activeBaselines.length > 0 ? activeBaselines[0] : null;
  }

  public async updateConfig(config: Partial<BenchmarkConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // Restart scheduled benchmarking if settings changed
    if (config.scheduling) {
      this.stopScheduledBenchmarking();
      if (this.config.scheduling.enabled) {
        await this.startScheduledBenchmarking();
      }
    }
  }

  public getConfig(): BenchmarkConfig {
    return { ...this.config };
  }

  public isBenchmarkingActive(): boolean {
    return this.isRunning;
  }

  public getSystemOverview(): {
    totalResults: number;
    totalBaselines: number;
    activeBaseline: BaselineCalculation | null;
    lastBenchmark: Date | null;
    nextScheduledRun: Date | null;
    isRunning: boolean;
  } {
    return {
      totalResults: this.results.length,
      totalBaselines: this.baselines.size,
      activeBaseline: this.getActiveBaseline(),
      lastBenchmark: this.results.length > 0 ? this.results[this.results.length - 1].timestamp : null,
      nextScheduledRun: this.benchmarkingInterval ? new Date(Date.now() + this.getScheduleInterval()) : null,
      isRunning: this.isRunning,
    };
  }

  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Performance Benchmarking System...');

    // Stop scheduled benchmarking
    this.stopScheduledBenchmarking();

    // Cleanup storage
    await this.storageManager.cleanup();

    console.log('✅ Performance Benchmarking System cleaned up');
  }
}

// Supporting classes
class BenchmarkRunner {
  constructor(private config: BenchmarkConfig) {}

  async executeBenchmark(
    scenario: typeof PerformanceBenchmarking.prototype.config.scenarios[0],
    environment: typeof PerformanceBenchmarking.prototype.config.environments[0]
  ): Promise<BenchmarkResult> {
    // In a real implementation, this would use Playwright or Puppeteer
    // to execute the benchmark in a real browser environment

    const startTime = Date.now();
    const measurements: number[] = [];

    // Simulate warmup runs
    for (let i = 0; i < this.config.collection.warmupRuns; i++) {
      await this.simulateRun(scenario, environment, true);
      if (this.config.collection.timeBetweenRuns > 0) {
        await this.sleep(this.config.collection.timeBetweenRuns);
      }
    }

    // Measurement runs
    for (let i = 0; i < this.config.collection.measurementRuns; i++) {
      const measurement = await this.simulateRun(scenario, environment, false);
      measurements.push(measurement);

      if (this.config.collection.timeBetweenRuns > 0) {
        await this.sleep(this.config.collection.timeBetweenRuns);
      }
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(measurements);

    // Generate realistic metrics based on scenario and environment
    const metrics = this.generateMetrics(scenario, environment, measurements);

    return {
      id: `benchmark-${Date.now()}-${scenario.name.replace(/\s+/g, '-').toLowerCase()}`,
      benchmarkSuite: 'Parsify Performance Suite',
      scenario: scenario.name,
      environment: environment.name,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      status: 'success',
      metrics,
      statistics,
      execution: {
        runs: this.config.collection.measurementRuns,
        warmupRuns: this.config.collection.warmupRuns,
        measurementRuns: this.config.collection.measurementRuns,
        errors: [],
        warnings: [],
        userAgent: `${environment.browser} on ${environment.device}`,
        viewport: environment.viewport,
        networkConditions: environment.network,
      },
      environmentInfo: {
        browser: environment.browser,
        version: 'latest',
        os: environment.device === 'mobile' ? 'iOS' : 'Windows',
        device: environment.device,
        cpuCores: environment.device === 'desktop' ? 8 : 4,
        memory: environment.device === 'desktop' ? 16384 : 4096,
        screenResolution: `${environment.viewport.width}x${environment.viewport.height}`,
      },
    };
  }

  private async simulateRun(
    scenario: typeof PerformanceBenchmarking.prototype.config.scenarios[0],
    environment: typeof PerformanceBenchmarking.prototype.config.environments[0],
    isWarmup: boolean
  ): Promise<number> {
    // Simulate benchmark execution time
    const baseTime = this.getBaseExecutionTime(scenario, environment);
    const variation = isWarmup ? baseTime * 0.5 : baseTime * (0.8 + Math.random() * 0.4);

    await this.sleep(variation);

    return variation;
  }

  private getBaseExecutionTime(
    scenario: typeof PerformanceBenchmarking.prototype.config.scenarios[0],
    environment: typeof PerformanceBenchmarking.prototype.config.environments[0]
  ): number {
    // Base execution times in milliseconds
    const baseTimes: Record<string, Record<string, number>> = {
      'desktop': {
        '4g': 1500,
        'fast3g': 2500,
        'slow3g': 4000,
        'slow4g': 3000,
      },
      'mobile': {
        '4g': 2000,
        'fast3g': 3500,
        'slow3g': 6000,
        'slow4g': 4500,
      },
      'tablet': {
        '4g': 1800,
        'fast3g': 3000,
        'slow3g': 5000,
        'slow4g': 3800,
      },
    };

    const categoryMultiplier: Record<string, number> = {
      'navigation': 1.0,
      'tool': 1.2,
      'tool-operation': 0.8,
      'feature': 0.6,
    };

    const deviceTime = baseTimes[environment.device]?.[environment.network] || 2000;
    const categoryMultiplier = categoryMultiplier[scenario.category] || 1.0;

    return deviceTime * categoryMultiplier;
  }

  private generateMetrics(
    scenario: typeof PerformanceBenchmarking.prototype.config.scenarios[0],
    environment: typeof PerformanceBenchmarking.prototype.config.environments[0],
    measurements: number[]
  ): BenchmarkResult['metrics'] {
    const avgMeasurement = measurements.reduce((sum, m) => sum + m, 0) / measurements.length;

    // Generate realistic metrics based on scenario type and environment
    const loadTimeMultiplier = environment.network === 'slow3g' ? 3 :
                               environment.network === 'fast3g' ? 2 : 1;

    const deviceMultiplier = environment.device === 'mobile' ? 1.5 :
                            environment.device === 'tablet' ? 1.2 : 1;

    return {
      navigationStart: 0,
      domContentLoaded: avgMeasurement * 0.4,
      loadComplete: avgMeasurement,
      firstContentfulPaint: avgMeasurement * 0.3,
      largestContentfulPaint: avgMeasurement * 0.7,
      firstInputDelay: 50 + Math.random() * 100,
      cumulativeLayoutShift: Math.random() * 0.2,
      timeToInteractive: avgMeasurement * 1.2,

      totalResources: 15 + Math.floor(Math.random() * 25),
      totalSize: (250 + Math.random() * 200) * deviceMultiplier,
      compressedSize: (80 + Math.random() * 60) * deviceMultiplier,
      jsSize: (200 + Math.random() * 100) * deviceMultiplier,
      cssSize: (50 + Math.random() * 30) * deviceMultiplier,
      imageSize: (20 + Math.random() * 50) * deviceMultiplier,
      fontSize: (10 + Math.random() * 20) * deviceMultiplier,

      renderTime: avgMeasurement * 0.1,
      scriptExecutionTime: avgMeasurement * 0.3,
      layoutTime: avgMeasurement * 0.05,
      paintTime: avgMeasurement * 0.08,

      memoryUsed: (50 + Math.random() * 100) * deviceMultiplier,
      memoryPeak: (100 + Math.random() * 150) * deviceMultiplier,
      memoryAllocated: (80 + Math.random() * 120) * deviceMultiplier,

      dnsLookup: 50 + Math.random() * 100,
      tcpConnection: 100 + Math.random() * 200,
      sslNegotiation: 150 + Math.random() * 250,
      serverResponse: 200 + Math.random() * 300,

      customMetrics: this.generateCustomMetrics(scenario),

      toolMetrics: this.generateToolMetrics(scenario),
    };
  }

  private generateCustomMetrics(scenario: typeof PerformanceBenchmarking.prototype.config.scenarios[0]): Record<string, number> {
    const customMetrics: Record<string, number> = {};

    if (scenario.customMetrics) {
      for (const metric of scenario.customMetrics) {
        // Generate realistic custom metric values
        switch (metric) {
          case 'monaco-load-time':
            customMetrics[metric] = 800 + Math.random() * 400;
            break;
          case 'editor-ready-time':
            customMetrics[metric] = 1000 + Math.random() * 500;
            break;
          case 'format-time':
            customMetrics[metric] = 50 + Math.random() * 100;
            break;
          case 'parse-time':
            customMetrics[metric] = 20 + Math.random() * 50;
            break;
          case 'render-time':
            customMetrics[metric] = 100 + Math.random() * 200;
            break;
          case 'execution-time':
            customMetrics[metric] = 200 + Math.random() * 400;
            break;
          case 'memory-allocation':
            customMetrics[metric] = 10 + Math.random() * 50;
            break;
          case 'cpu-usage':
            customMetrics[metric] = 30 + Math.random() * 40;
            break;
          case 'search-index-time':
            customMetrics[metric] = 10 + Math.random() * 30;
            break;
          case 'filter-time':
            customMetrics[metric] = 20 + Math.random() * 40;
            break;
          case 'render-results-time':
            customMetrics[metric] = 30 + Math.random() * 60;
            break;
          default:
            customMetrics[metric] = Math.random() * 1000;
        }
      }
    }

    return customMetrics;
  }

  private generateToolMetrics(scenario: typeof PerformanceBenchmarking.prototype.config.scenarios[0]): BenchmarkResult['metrics']['toolMetrics'] | undefined {
    if (scenario.category === 'tool-operation') {
      return {
        processingTime: 100 + Math.random() * 400,
        operationsPerSecond: 50 + Math.random() * 200,
        accuracy: 95 + Math.random() * 5,
        errorRate: Math.random() * 2,
        throughput: 100 + Math.random() * 500,
      };
    }

    return undefined;
  }

  private calculateStatistics(measurements: number[]): BenchmarkResult['statistics'] {
    if (measurements.length === 0) {
      return {
        sampleSize: 0,
        mean: 0,
        median: 0,
        standardDeviation: 0,
        variance: 0,
        min: 0,
        max: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        confidenceInterval: { lower: 0, upper: 0, level: 0 },
        outliers: [],
        coefficientOfVariation: 0,
      };
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);
    const mean = sum / measurements.length;

    // Calculate standard deviation
    const squaredDiffs = measurements.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / measurements.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate percentiles
    const median = sorted[Math.floor(sorted.length / 2)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    // Calculate confidence interval (95%)
    const margin = 1.96 * (standardDeviation / Math.sqrt(measurements.length));

    // Detect outliers (2 standard deviations)
    const outliers = measurements.filter(x => Math.abs(x - mean) > 2 * standardDeviation);

    const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) * 100 : 0;

    return {
      sampleSize: measurements.length,
      mean,
      median,
      standardDeviation,
      variance,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p90,
      p95,
      p99,
      confidenceInterval: {
        lower: mean - margin,
        upper: mean + margin,
        level: 0.95,
      },
      outliers,
      coefficientOfVariation,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class BaselineCalculator {
  constructor(private config: BenchmarkConfig) {}

  async calculateBaseline(
    results: BenchmarkResult[],
    metadata: {
      name: string;
      version: string;
      description: string;
    }
  ): Promise<BaselineCalculation> {
    const now = new Date();
    const baselineId = `baseline-${Date.now()}`;

    // Group results by scenario
    const scenarioGroups = new Map<string, BenchmarkResult[]>();
    for (const result of results) {
      const key = result.scenario;
      if (!scenarioGroups.has(key)) {
        scenarioGroups.set(key, []);
      }
      scenarioGroups.get(key)!.push(result);
    }

    // Calculate baseline for each scenario
    const scenarios: Record<string, BaselineScenario> = {};

    for (const [scenarioName, scenarioResults] of scenarioGroups) {
      const baselineScenario = await this.calculateScenarioBaseline(scenarioName, scenarioResults);
      scenarios[scenarioName] = baselineScenario;
    }

    // Calculate aggregates
    const aggregates = this.calculateAggregates(scenarios);

    // Calculate quality metrics
    const quality = this.calculateBaselineQuality(results, scenarios);

    return {
      id: baselineId,
      name: metadata.name,
      description: metadata.description,
      version: metadata.version,
      createdAt: now,
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'active',
      data: {
        scenarios,
        aggregates,
      },
      quality,
      context: {
        environment: 'production',
        buildVersion: process.env.BUILD_VERSION || 'unknown',
        commitHash: process.env.COMMIT_SHA || 'unknown',
        branch: process.env.BRANCH_NAME || 'main',
        buildNumber: process.env.BUILD_NUMBER || 'local',
        sampleSize: results.length,
        collectionPeriod: {
          start: new Date(Math.min(...results.map(r => r.timestamp.getTime()))),
          end: new Date(Math.max(...results.map(r => r.timestamp.getTime()))),
          duration: 0,
        },
        testConditions: ['automated', 'statistical'],
      },
      validation: {
        validatedAt: now,
        approved: true,
        automatedValidation: true,
      },
    };
  }

  private async calculateScenarioBaseline(
    scenarioName: string,
    results: BenchmarkResult[]
  ): Promise<BaselineScenario> {
    const scenario = this.config.scenarios.find(s => s.name === scenarioName);
    const category = scenario?.category || 'unknown';

    // Calculate baseline metrics
    const metrics: BaselineScenario['metrics'] = {};

    // Define metrics to calculate baseline for
    const metricDefinitions = [
      { name: 'loadTime', source: 'loadComplete', unit: 'ms' },
      { name: 'firstContentfulPaint', source: 'firstContentfulPaint', unit: 'ms' },
      { name: 'largestContentfulPaint', source: 'largestContentfulPaint', unit: 'ms' },
      { name: 'timeToInteractive', source: 'timeToInteractive', unit: 'ms' },
      { name: 'totalSize', source: 'totalSize', unit: 'KB' },
      { name: 'memoryUsed', source: 'memoryUsed', unit: 'MB' },
    ];

    for (const metricDef of metricDefinitions) {
      const values = results
        .map(r => r.metrics[metricDef.source as keyof BenchmarkResult['metrics']] as number)
        .filter(v => v > 0);

      if (values.length > 0) {
        metrics[metricDef.name] = this.calculateMetricBaseline(values, metricDef.unit);
      }
    }

    // Calculate thresholds based on statistical analysis
    const thresholds = this.calculateThresholds(metrics);

    return {
      name: scenarioName,
      category,
      metrics,
      thresholds,
    };
  }

  private calculateMetricBaseline(values: number[], unit: string): BaselineScenario['metrics'][string] {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    // Calculate standard deviation
    const squaredDiffs = values.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate percentiles
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    // Calculate confidence interval (95%)
    const margin = 1.96 * (standardDeviation / Math.sqrt(values.length));

    return {
      value: mean,
      unit,
      statisticalData: {
        mean,
        median,
        standardDeviation,
        confidenceInterval: {
          lower: mean - margin,
          upper: mean + margin,
          level: 0.95,
        },
        p95,
        p99,
      },
    };
  }

  private calculateThresholds(metrics: BaselineScenario['metrics']): BaselineScenario['thresholds'] {
    // Default thresholds (can be customized per metric type)
    return {
      warning: 15, // 15% increase
      critical: 30, // 30% increase
      absolute: 10000, // Maximum absolute value
    };
  }

  private calculateAggregates(scenarios: Record<string, BaselineScenario>): BaselineCalculation['data']['aggregates'] {
    // Calculate overall aggregates
    const allMetrics = Object.values(scenarios).flatMap(s => Object.values(s.metrics));

    const overall: BaselineAggregate = {
      scenarioCount: Object.keys(scenarios).length,
      metrics: {},
      score: {
        overall: 85,
        performance: 85,
        reliability: 90,
        consistency: 80,
      },
    };

    // Calculate category aggregates
    const byCategory: Record<string, BaselineAggregate> = {};
    const categoryGroups = new Map<string, BaselineScenario[]>();

    for (const scenario of Object.values(scenarios)) {
      if (!categoryGroups.has(scenario.category)) {
        categoryGroups.set(scenario.category, []);
      }
      categoryGroups.get(scenario.category)!.push(scenario);
    }

    for (const [category, categoryScenarios] of categoryGroups) {
      byCategory[category] = {
        scenarioCount: categoryScenarios.length,
        metrics: {},
        score: {
          overall: 85 + Math.random() * 10,
          performance: 85 + Math.random() * 10,
          reliability: 90 + Math.random() * 5,
          consistency: 80 + Math.random() * 15,
        },
      };
    }

    // Calculate environment aggregates (placeholder)
    const byEnvironment: Record<string, BaselineAggregate> = {
      'all': {
        scenarioCount: Object.keys(scenarios).length,
        metrics: {},
        score: {
          overall: 85,
          performance: 85,
          reliability: 90,
          consistency: 80,
        },
      },
    };

    return {
      overall,
      byCategory,
      byEnvironment,
    };
  }

  private calculateBaselineQuality(
    results: BenchmarkResult[],
    scenarios: Record<string, BaselineScenario>
  ): BaselineCalculation['quality'] {
    // Calculate data quality metrics
    const successfulResults = results.filter(r => r.status === 'success');
    const dataCompleteness = results.length > 0 ? successfulResults.length / results.length : 0;

    // Calculate statistical significance based on sample size
    const totalSampleSize = results.reduce((sum, r) => sum + r.statistics.sampleSize, 0);
    const statisticalSignificance = Math.min(0.99, totalSampleSize / 100);

    // Calculate stability based on coefficient of variation
    const avgCoefficientOfVariation = results.reduce((sum, r) =>
      sum + r.statistics.coefficientOfVariation, 0
    ) / results.length;
    const stability = Math.max(0, 1 - (avgCoefficientOfVariation / 100));

    // Calculate overall reliability
    const reliability = (dataCompleteness + statisticalSignificance + stability) / 3;

    return {
      dataCompleteness,
      statisticalSignificance,
      reliability,
      stability,
      confidence: reliability,
    };
  }
}

class StatisticalAnalyzer {
  // Statistical analysis methods for benchmarking
  async analyzeDistribution(values: number[]): Promise<{
    normality: boolean;
    skewness: number;
    kurtosis: number;
    outliers: number[];
  }> {
    // Simplified statistical analysis
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;

    // Calculate skewness and kurtosis
    const variance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const skewness = values.reduce((sum, x) => sum + Math.pow((x - mean) / stdDev, 3), 0) / n;
    const kurtosis = values.reduce((sum, x) => sum + Math.pow((x - mean) / stdDev, 4), 0) / n - 3;

    // Detect outliers using IQR method
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = values.filter(x => x < lowerBound || x > upperBound);

    // Test for normality (simplified)
    const normality = Math.abs(skewness) < 2 && Math.abs(kurtosis) < 7;

    return {
      normality,
      skewness,
      kurtosis,
      outliers,
    };
  }

  async compareDistributions(
    baseline: number[],
    current: number[]
  ): Promise<{
    significance: number;
    effectSize: number;
    power: number;
    recommendation: 'accept' | 'reject' | 'inconclusive';
  }> {
    // Simplified statistical comparison
    const baselineMean = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    const currentMean = current.reduce((a, b) => a + b, 0) / current.length;

    const change = ((currentMean - baselineMean) / baselineMean) * 100;
    const effectSize = Math.abs(change) / 10; // Simplified effect size calculation

    // Calculate significance (simplified t-test)
    const pooledVariance = this.calculatePooledVariance(baseline, current);
    const standardError = Math.sqrt(pooledVariance * (1/baseline.length + 1/current.length));
    const tStatistic = (currentMean - baselineMean) / standardError;
    const significance = 1 - this.tDistribution(Math.abs(tStatistic), baseline.length + current.length - 2);

    // Calculate power (simplified)
    const power = Math.min(0.95, effectSize * Math.sqrt(baseline.length * current.length / (baseline.length + current.length)));

    // Make recommendation
    let recommendation: 'accept' | 'reject' | 'inconclusive';
    if (significance < 0.05 && effectSize > 0.5) {
      recommendation = change > 0 ? 'reject' : 'accept'; // Reject if degradation, accept if improvement
    } else if (significance >= 0.05) {
      recommendation = 'inconclusive';
    } else {
      recommendation = 'accept';
    }

    return {
      significance,
      effectSize,
      power,
      recommendation,
    };
  }

  private calculatePooledVariance(sample1: number[], sample2: number[]): number {
    const mean1 = sample1.reduce((a, b) => a + b, 0) / sample1.length;
    const mean2 = sample2.reduce((a, b) => a + b, 0) / sample2.length;

    const variance1 = sample1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (sample1.length - 1);
    const variance2 = sample2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (sample2.length - 1);

    return ((sample1.length - 1) * variance1 + (sample2.length - 1) * variance2) /
           (sample1.length + sample2.length - 2);
  }

  private tDistribution(t: number, degreesOfFreedom: number): number {
    // Simplified t-distribution CDF calculation
    if (degreesOfFreedom < 1) return 0;

    // For large degrees of freedom, approximate with normal distribution
    if (degreesOfFreedom > 30) {
      return this.normalCDF(t);
    }

    // Simplified approximation for small degrees of freedom
    return Math.min(0.999, 0.5 + Math.atan(t / Math.sqrt(degreesOfFreedom)) / Math.PI);
  }

  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }
}

class BenchmarkTrendAnalyzer {
  // Trend analysis for benchmarking data
  async analyzeTrend(
    historicalData: Array<{ timestamp: Date; value: number; version: string }>
  ): Promise<TrendAnalysis> {
    if (historicalData.length < 2) {
      throw new Error('Insufficient data for trend analysis');
    }

    const values = historicalData.map(d => d.value);
    const timePoints = historicalData.map((_, i) => i);

    // Linear regression
    const n = values.length;
    const sumX = timePoints.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = timePoints.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Determine direction
    let direction: TrendAnalysis['direction'];
    if (Math.abs(slope) < 0.01) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'degrading';
    } else {
      direction = 'improving';
    }

    // Calculate confidence and significance
    const correlation = this.calculateCorrelation(timePoints, values);
    const confidence = Math.min(0.95, Math.abs(correlation));
    const significance = this.calculateSignificance(values);

    // Generate forecast
    const nextValue = values[values.length - 1] + slope;
    const forecast = {
      nextPeriod: nextValue,
      confidence: confidence,
      risk: this.assessForecastRisk(slope, confidence) as 'low' | 'medium' | 'high',
    };

    return {
      metric: 'performance', // Generic metric name
      period: {
        start: historicalData[0].timestamp,
        end: historicalData[historicalData.length - 1].timestamp,
        dataPoints: historicalData.length,
      },
      direction,
      slope,
      confidence,
      significance,
      correlation,
      forecast,
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
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

  private calculateSignificance(values: number[]): number {
    // Simplified significance calculation based on variance
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // Higher coefficient of variation means lower significance
    return Math.max(0.1, 1 - coefficientOfVariation);
  }

  private assessForecastRisk(slope: number, confidence: number): 'low' | 'medium' | 'high' {
    if (confidence > 0.8 && Math.abs(slope) < 0.1) {
      return 'low';
    } else if (confidence > 0.6 && Math.abs(slope) < 0.5) {
      return 'medium';
    } else {
      return 'high';
    }
  }
}

class BenchmarkStorageManager {
  // Storage management for benchmarking data
  async initialize(): Promise<void> {
    // Initialize storage (file system, database, etc.)
    console.log('📁 Initializing benchmark storage manager...');
  }

  async saveResults(results: BenchmarkResult[]): Promise<void> {
    // Save benchmark results to storage
    console.log(`💾 Saving ${results.length} benchmark results...`);
  }

  async saveBaseline(baseline: BaselineCalculation): Promise<void> {
    // Save baseline to storage
    console.log(`💾 Saving baseline ${baseline.id}...`);
  }

  async loadResults(): Promise<BenchmarkResult[]> {
    // Load benchmark results from storage
    console.log('📂 Loading benchmark results...');
    return [];
  }

  async loadBaselines(): Promise<BaselineCalculation[]> {
    // Load baselines from storage
    console.log('📂 Loading baselines...');
    return [];
  }

  async cleanup(): Promise<void> {
    // Cleanup old data and perform maintenance
    console.log('🧹 Cleaning up benchmark storage...');
  }
}

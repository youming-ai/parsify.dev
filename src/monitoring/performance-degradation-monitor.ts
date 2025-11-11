/**
 * Performance Degradation Monitoring System
 * Advanced performance monitoring with degradation detection and alerting
 * Features real-time performance tracking, trend analysis, and automated alerts
 */

export interface PerformanceConfig {
  enabled: boolean;
  monitoring: {
    interval: number; // milliseconds
    sampleSize: number;
    aggregationWindow: number; // minutes
    baselinePeriod: number; // days for baseline calculation
  };
  thresholds: {
    responseTime: {
      warning: number; // milliseconds
      critical: number; // milliseconds
    };
    throughput: {
      warning: number; // percentage drop
      critical: number; // percentage drop
    };
    errorRate: {
      warning: number; // percentage
      critical: number; // percentage
    };
    resourceUsage: {
      memory: number; // percentage
      cpu: number; // percentage
    };
  };
  detection: {
    degradationThreshold: number; // percentage
    consecutiveMeasurements: number;
    timeWindow: number; // minutes
    statisticalSignificance: number; // p-value threshold
  };
  alerting: {
    enabled: boolean;
    channels: Array<'console' | 'browser' | 'email' | 'webhook'>;
    cooldown: number; // minutes
    includeRecommendations: boolean;
  };
  analysis: {
    trendAnalysis: boolean;
    anomalyDetection: boolean;
    predictiveAlerts: boolean;
    correlationAnalysis: boolean;
  };
}

export interface PerformanceMetric {
  toolId: string;
  toolName: string;
  timestamp: Date;
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage?: number;
  cpuUsage?: number;
  networkRequests?: number;
  renderTime?: number;
  loadTime?: number;
  userInteractions?: number;
  successfulOperations?: number;
  failedOperations?: number;
}

export interface PerformanceBaseline {
  toolId: string;
  toolName: string;
  calculatedAt: Date;
  period: {
    start: Date;
    end: Date;
    samples: number;
  };
  metrics: {
    responseTime: {
      mean: number;
      median: number;
      p95: number;
      p99: number;
      standardDeviation: number;
    };
    throughput: {
      mean: number;
      median: number;
      p95: number;
      p99: number;
      standardDeviation: number;
    };
    errorRate: {
      mean: number;
      median: number;
      p95: number;
      p99: number;
      standardDeviation: number;
    };
    resourceUsage: {
      memory: { mean: number; peak: number; };
      cpu: { mean: number; peak: number; };
    };
  };
  quality: {
    dataCompleteness: number; // percentage
    statisticalSignificance: number;
    confidence: number; // 0-1
  };
}

export interface PerformanceDegradation {
  id: string;
  toolId: string;
  toolName: string;
  detectedAt: Date;
  type: 'response_time' | 'throughput' | 'error_rate' | 'resource_usage' | 'combination';
  severity: 'warning' | 'critical';
  duration: number; // milliseconds
  metrics: {
    baseline: number;
    current: number;
    degradation: number; // percentage
    statisticalSignificance: number; // p-value
  };
  context: {
    concurrentUsers?: number;
    systemLoad?: number;
    recentDeployments?: string[];
    relatedIncidents?: string[];
  };
  impact: {
    affectedUsers: number;
    userExperienceImpact: 'low' | 'medium' | 'high' | 'critical';
    businessImpact: string;
  };
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  resolution?: {
    action: string;
    timestamp: Date;
    effective: boolean;
  };
  recommendations: string[];
  correlationFactors: Array<{
    factor: string;
    correlation: number; // -1 to 1
    confidence: number; // 0-1
  }>;
}

export interface PerformanceTrend {
  toolId: string;
  metric: 'responseTime' | 'throughput' | 'errorRate' | 'memoryUsage' | 'cpuUsage';
  period: {
    start: Date;
    end: Date;
    dataPoints: number;
  };
  direction: 'improving' | 'degrading' | 'stable' | 'volatile';
  slope: number; // rate of change
  confidence: number; // 0-1
  significance: number; // statistical significance
  seasonalPattern?: {
    detected: boolean;
    period: number; // hours
    amplitude: number;
  };
  dataPoints: Array<{
    timestamp: Date;
    value: number;
    baseline: number;
    anomaly: boolean;
  }>;
}

export interface PerformanceAnomaly {
  id: string;
  toolId: string;
  toolName: string;
  detectedAt: Date;
  type: 'spike' | 'drop' | 'pattern_change' | 'outlier';
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number; // standard deviations
  confidence: number; // 0-1
  context: {
    timeOfDay: string;
    dayOfWeek: string;
    concurrentUsers: number;
    systemEvents: string[];
  };
  verified: boolean;
  impact: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedMetrics: string[];
    userImpact: string;
  };
}

export interface PerformanceInsight {
  id: string;
  type: 'optimization' | 'warning' | 'trend' | 'anomaly' | 'correlation';
  title: string;
  description: string;
  toolId?: string;
  toolName?: string;
  timestamp: Date;
  confidence: number; // 0-1
  impact: {
    potentialImprovement: number; // percentage
    priority: 'low' | 'medium' | 'high' | 'critical';
    effort: 'low' | 'medium' | 'high';
  };
  data: {
    metric: string;
    currentValue: number;
    targetValue: number;
    trend: PerformanceTrend;
    evidence: Array<{
      timestamp: Date;
      value: number;
      context: string;
    }>;
  };
  recommendations: string[];
  automatedAction?: {
    type: string;
    description: string;
    scheduled: boolean;
    estimatedImpact: number;
  };
}

export class PerformanceDegradationMonitor {
  private static instance: PerformanceDegradationMonitor;
  private config: PerformanceConfig;
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private metrics: PerformanceMetric[] = [];
  private degradations: PerformanceDegradation[] = [];
  private trends: Map<string, PerformanceTrend[]> = new Map();
  private anomalies: PerformanceAnomaly[] = [];
  private insights: PerformanceInsight[] = [];

  // Monitoring state
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private lastAnalysis = new Date();
  private consecutiveDegradations: Map<string, number> = new Map();

  // Analysis engines
  private trendAnalyzer: TrendAnalyzer;
  private anomalyDetector: AnomalyDetector;
  private correlationAnalyzer: CorrelationAnalyzer;

  private constructor(config?: Partial<PerformanceConfig>) {
    this.config = this.getDefaultConfig(config);
    this.trendAnalyzer = new TrendAnalyzer();
    this.anomalyDetector = new AnomalyDetector();
    this.correlationAnalyzer = new CorrelationAnalyzer();
  }

  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceDegradationMonitor {
    if (!PerformanceDegradationMonitor.instance) {
      PerformanceDegradationMonitor.instance = new PerformanceDegradationMonitor(config);
    }
    return PerformanceDegradationMonitor.instance;
  }

  private getDefaultConfig(overrides?: Partial<PerformanceConfig>): PerformanceConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      enabled: true,
      monitoring: {
        interval: isProduction ? 60000 : 30000, // 1 min prod, 30 sec dev
        sampleSize: 100,
        aggregationWindow: 5, // minutes
        baselinePeriod: 7, // days
      },
      thresholds: {
        responseTime: {
          warning: 2000, // 2 seconds
          critical: 5000, // 5 seconds
        },
        throughput: {
          warning: 20, // 20% drop
          critical: 50, // 50% drop
        },
        errorRate: {
          warning: 5, // 5%
          critical: 15, // 15%
        },
        resourceUsage: {
          memory: 80, // 80%
          cpu: 85, // 85%
        },
      },
      detection: {
        degradationThreshold: 25, // 25% degradation
        consecutiveMeasurements: 3,
        timeWindow: 10, // minutes
        statisticalSignificance: 0.05, // p-value threshold
      },
      alerting: {
        enabled: true,
        channels: ['console', 'browser'],
        cooldown: 15, // minutes
        includeRecommendations: true,
      },
      analysis: {
        trendAnalysis: true,
        anomalyDetection: true,
        predictiveAlerts: isProduction,
        correlationAnalysis: true,
      },
      ...overrides,
    };
  }

  public async initialize(): Promise<void> {
    console.log('📈 Initializing Performance Degradation Monitor...');

    try {
      // Load historical baselines
      await this.loadBaselines();

      // Calculate initial baselines if needed
      await this.calculateBaselines();

      // Start monitoring
      if (this.config.enabled) {
        this.startMonitoring();
      }

      console.log('✅ Performance Degradation Monitor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Performance Degradation Monitor:', error);
      throw error;
    }
  }

  private async loadBaselines(): Promise<void> {
    console.log('📊 Loading performance baselines...');
    // In a real implementation, this would load from storage/database
  }

  private async calculateBaselines(): Promise<void> {
    console.log('🔢 Calculating performance baselines...');

    // For each tool, calculate baseline from historical data
    // This is a simplified implementation
    const tools = this.getMonitoredTools();

    for (const tool of tools) {
      const baseline = await this.calculateToolBaseline(tool);
      if (baseline) {
        this.baselines.set(tool.id, baseline);
      }
    }

    console.log(`✅ Calculated baselines for ${this.baselines.size} tools`);
  }

  private getMonitoredTools(): Array<{ id: string; name: string; category: string }> {
    // In a real implementation, this would get from tools data
    return [
      { id: 'json-formatter', name: 'JSON Formatter', category: 'JSON Processing' },
      { id: 'code-executor', name: 'Code Executor', category: 'Code Execution' },
      { id: 'file-converter', name: 'File Converter', category: 'File Processing' },
    ];
  }

  private async calculateToolBaseline(tool: { id: string; name: string; category: string }): Promise<PerformanceBaseline | null> {
    // Simulate baseline calculation from historical data
    const now = new Date();
    const periodStart = new Date(now.getTime() - this.config.monitoring.baselinePeriod * 24 * 60 * 60 * 1000);

    return {
      toolId: tool.id,
      toolName: tool.name,
      calculatedAt: now,
      period: {
        start: periodStart,
        end: now,
        samples: 1000, // Simulated
      },
      metrics: {
        responseTime: {
          mean: 500 + Math.random() * 500, // 500-1000ms
          median: 450 + Math.random() * 400,
          p95: 1200 + Math.random() * 800,
          p99: 2000 + Math.random() * 1000,
          standardDeviation: 100 + Math.random() * 200,
        },
        throughput: {
          mean: 50 + Math.random() * 100, // 50-150 ops/min
          median: 45 + Math.random() * 90,
          p95: 150 + Math.random() * 100,
          p99: 200 + Math.random() * 150,
          standardDeviation: 10 + Math.random() * 20,
        },
        errorRate: {
          mean: Math.random() * 2, // 0-2%
          median: Math.random() * 1.5,
          p95: 3 + Math.random() * 2,
          p99: 5 + Math.random() * 5,
          standardDeviation: 0.5 + Math.random() * 1,
        },
        resourceUsage: {
          memory: { mean: 30 + Math.random() * 40, peak: 60 + Math.random() * 30 },
          cpu: { mean: 20 + Math.random() * 30, peak: 50 + Math.random() * 40 },
        },
      },
      quality: {
        dataCompleteness: 95 + Math.random() * 5,
        statisticalSignificance: 0.95,
        confidence: 0.9,
      },
    };
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    console.log(`🔄 Starting performance monitoring (interval: ${this.config.monitoring.interval}ms)`);

    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.analyzePerformance();
    }, this.config.monitoring.interval);
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('Performance monitoring is not active');
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('🛑 Stopped performance monitoring');
  }

  private async collectMetrics(): Promise<void> {
    const tools = this.getMonitoredTools();
    const timestamp = new Date();

    for (const tool of tools) {
      const metric = await this.collectToolMetrics(tool, timestamp);
      if (metric) {
        this.metrics.push(metric);
        this.cleanupMetrics();
      }
    }
  }

  private async collectToolMetrics(tool: { id: string; name: string; category: string }, timestamp: Date): Promise<PerformanceMetric | null> {
    try {
      // Simulate metric collection
      const baseline = this.baselines.get(tool.id);

      if (!baseline) {
        console.warn(`No baseline available for ${tool.name}`);
        return null;
      }

      // Generate realistic metrics with some variation
      const responseTime = baseline.metrics.responseTime.mean + (Math.random() - 0.5) * baseline.metrics.responseTime.standardDeviation * 2;
      const throughput = baseline.metrics.throughput.mean + (Math.random() - 0.5) * baseline.metrics.throughput.standardDeviation * 2;
      const errorRate = Math.max(0, baseline.metrics.errorRate.mean + (Math.random() - 0.5) * baseline.metrics.errorRate.standardDeviation * 2);

      return {
        toolId: tool.id,
        toolName: tool.name,
        timestamp,
        responseTime: Math.max(0, responseTime),
        throughput: Math.max(0, throughput),
        errorRate: Math.min(100, Math.max(0, errorRate)),
        memoryUsage: baseline.metrics.resourceUsage.memory.mean + (Math.random() - 0.5) * 20,
        cpuUsage: baseline.metrics.resourceUsage.cpu.mean + (Math.random() - 0.5) * 15,
        networkRequests: Math.floor(5 + Math.random() * 20),
        renderTime: Math.max(0, 50 + Math.random() * 200),
        loadTime: Math.max(0, 100 + Math.random() * 500),
        userInteractions: Math.floor(Math.random() * 10),
        successfulOperations: Math.floor(throughput * (1 - errorRate / 100)),
        failedOperations: Math.floor(throughput * errorRate / 100),
      };
    } catch (error) {
      console.error(`Failed to collect metrics for ${tool.name}:`, error);
      return null;
    }
  }

  private cleanupMetrics(): void {
    const maxAge = this.config.monitoring.baselinePeriod * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - maxAge);

    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);

    // Keep only recent metrics for analysis
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }

  private async analyzePerformance(): Promise<void> {
    try {
      // Detect degradations
      await this.detectDegradations();

      // Update trends
      if (this.config.analysis.trendAnalysis) {
        await this.updateTrends();
      }

      // Detect anomalies
      if (this.config.analysis.anomalyDetection) {
        await this.detectAnomalies();
      }

      // Analyze correlations
      if (this.config.analysis.correlationAnalysis) {
        await this.analyzeCorrelations();
      }

      // Generate insights
      await this.generateInsights();

      this.lastAnalysis = new Date();
    } catch (error) {
      console.error('Performance analysis failed:', error);
    }
  }

  private async detectDegradations(): Promise<void> {
    const tools = this.getMonitoredTools();

    for (const tool of tools) {
      const degradations = await this.detectToolDegradations(tool);

      for (const degradation of degradations) {
        await this.handleDegradation(degradation);
      }
    }
  }

  private async detectToolDegradations(tool: { id: string; name: string }): Promise<PerformanceDegradation[]> {
    const degradations: PerformanceDegradation[] = [];
    const baseline = this.baselines.get(tool.id);

    if (!baseline) {
      return degradations;
    }

    // Get recent metrics for analysis
    const windowStart = new Date(Date.now() - this.config.detection.timeWindow * 60 * 1000);
    const recentMetrics = this.metrics.filter(m =>
      m.toolId === tool.id && m.timestamp >= windowStart
    );

    if (recentMetrics.length < this.config.detection.consecutiveMeasurements) {
      return degradations;
    }

    // Check response time degradation
    const responseTimeDegradation = await this.checkResponseTimeDegradation(tool, recentMetrics, baseline);
    if (responseTimeDegradation) {
      degradations.push(responseTimeDegradation);
    }

    // Check throughput degradation
    const throughputDegradation = await this.checkThroughputDegradation(tool, recentMetrics, baseline);
    if (throughputDegradation) {
      degradations.push(throughputDegradation);
    }

    // Check error rate degradation
    const errorRateDegradation = await this.checkErrorRateDegradation(tool, recentMetrics, baseline);
    if (errorRateDegradation) {
      degradations.push(errorRateDegradation);
    }

    // Check resource usage degradation
    const resourceDegradation = await this.checkResourceUsageDegradation(tool, recentMetrics, baseline);
    if (resourceDegradation) {
      degradations.push(resourceDegradation);
    }

    return degradations;
  }

  private async checkResponseTimeDegradation(
    tool: { id: string; name: string },
    metrics: PerformanceMetric[],
    baseline: PerformanceBaseline
  ): Promise<PerformanceDegradation | null> {
    const recentAvg = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const baselineAvg = baseline.metrics.responseTime.mean;

    const degradation = ((recentAvg - baselineAvg) / baselineAvg) * 100;

    if (degradation >= this.config.detection.degradationThreshold) {
      const significance = await this.calculateStatisticalSignificance(
        metrics.map(m => m.responseTime),
        baseline.metrics.responseTime
      );

      if (significance <= this.config.detection.statisticalSignificance) {
        return {
          id: `degradation-${Date.now()}-${tool.id}-response-time`,
          toolId: tool.id,
          toolName: tool.name,
          detectedAt: new Date(),
          type: 'response_time',
          severity: degradation >= 50 ? 'critical' : 'warning',
          duration: 0, // Will be updated as it persists
          metrics: {
            baseline: baselineAvg,
            current: recentAvg,
            degradation,
            statisticalSignificance: significance,
          },
          context: await this.getDegradationContext(tool),
          impact: await this.assessDegradationImpact(tool, 'response_time', degradation),
          status: 'active',
          recommendations: this.generateResponseTimeRecommendations(degradation),
          correlationFactors: [],
        };
      }
    }

    return null;
  }

  private async checkThroughputDegradation(
    tool: { id: string; name: string },
    metrics: PerformanceMetric[],
    baseline: PerformanceBaseline
  ): Promise<PerformanceDegradation | null> {
    const recentAvg = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;
    const baselineAvg = baseline.metrics.throughput.mean;

    const degradation = ((baselineAvg - recentAvg) / baselineAvg) * 100;

    if (degradation >= this.config.detection.degradationThreshold) {
      const significance = await this.calculateStatisticalSignificance(
        metrics.map(m => m.throughput),
        baseline.metrics.throughput
      );

      if (significance <= this.config.detection.statisticalSignificance) {
        return {
          id: `degradation-${Date.now()}-${tool.id}-throughput`,
          toolId: tool.id,
          toolName: tool.name,
          detectedAt: new Date(),
          type: 'throughput',
          severity: degradation >= 50 ? 'critical' : 'warning',
          duration: 0,
          metrics: {
            baseline: baselineAvg,
            current: recentAvg,
            degradation,
            statisticalSignificance: significance,
          },
          context: await this.getDegradationContext(tool),
          impact: await this.assessDegradationImpact(tool, 'throughput', degradation),
          status: 'active',
          recommendations: this.generateThroughputRecommendations(degradation),
          correlationFactors: [],
        };
      }
    }

    return null;
  }

  private async checkErrorRateDegradation(
    tool: { id: string; name: string },
    metrics: PerformanceMetric[],
    baseline: PerformanceBaseline
  ): Promise<PerformanceDegradation | null> {
    const recentAvg = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    const baselineAvg = baseline.metrics.errorRate.mean;

    const degradation = ((recentAvg - baselineAvg) / Math.max(baselineAvg, 1)) * 100;

    if (degradation >= this.config.detection.degradationThreshold && recentAvg > this.config.thresholds.errorRate.warning) {
      const significance = await this.calculateStatisticalSignificance(
        metrics.map(m => m.errorRate),
        baseline.metrics.errorRate
      );

      if (significance <= this.config.detection.statisticalSignificance) {
        return {
          id: `degradation-${Date.now()}-${tool.id}-error-rate`,
          toolId: tool.id,
          toolName: tool.name,
          detectedAt: new Date(),
          type: 'error_rate',
          severity: recentAvg >= this.config.thresholds.errorRate.critical ? 'critical' : 'warning',
          duration: 0,
          metrics: {
            baseline: baselineAvg,
            current: recentAvg,
            degradation,
            statisticalSignificance: significance,
          },
          context: await this.getDegradationContext(tool),
          impact: await this.assessDegradationImpact(tool, 'error_rate', degradation),
          status: 'active',
          recommendations: this.generateErrorRateRecommendations(recentAvg),
          correlationFactors: [],
        };
      }
    }

    return null;
  }

  private async checkResourceUsageDegradation(
    tool: { id: string; name: string },
    metrics: PerformanceMetric[],
    baseline: PerformanceBaseline
  ): Promise<PerformanceDegradation | null> {
    // Check memory usage
    const recentMemory = metrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / metrics.length;
    const baselineMemory = baseline.metrics.resourceUsage.memory.mean;

    const memoryDegradation = recentMemory > this.config.thresholds.resourceUsage.memory;

    if (memoryDegradation) {
      return {
        id: `degradation-${Date.now()}-${tool.id}-memory`,
        toolId: tool.id,
        toolName: tool.name,
        detectedAt: new Date(),
        type: 'resource_usage',
        severity: recentMemory >= 90 ? 'critical' : 'warning',
        duration: 0,
        metrics: {
          baseline: baselineMemory,
          current: recentMemory,
          degradation: ((recentMemory - baselineMemory) / baselineMemory) * 100,
          statisticalSignificance: 0.05, // Simplified
        },
        context: await this.getDegradationContext(tool),
        impact: await this.assessDegradationImpact(tool, 'resource_usage', recentMemory),
        status: 'active',
        recommendations: this.generateResourceRecommendations('memory', recentMemory),
        correlationFactors: [],
      };
    }

    return null;
  }

  private async calculateStatisticalSignificance(
    sample: number[],
    baseline: { mean: number; standardDeviation: number }
  ): Promise<number> {
    // Simplified t-test calculation
    const sampleMean = sample.reduce((sum, val) => sum + val, 0) / sample.length;
    const sampleStd = Math.sqrt(sample.reduce((sum, val) => sum + Math.pow(val - sampleMean, 2), 0) / (sample.length - 1));

    const tStat = (sampleMean - baseline.mean) / (sampleStd / Math.sqrt(sample.length));

    // Convert to p-value (simplified)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)));

    return pValue;
  }

  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  private async getDegradationContext(tool: { id: string; name: string }): Promise<any> {
    return {
      concurrentUsers: Math.floor(50 + Math.random() * 200),
      systemLoad: 20 + Math.random() * 60,
      recentDeployments: [], // Would get from deployment tracking
      relatedIncidents: [], // Would get from incident tracking
    };
  }

  private async assessDegradationImpact(
    tool: { id: string; name: string },
    type: string,
    degradation: number
  ): Promise<any> {
    const affectedUsers = Math.floor(100 * (1 + degradation / 100));

    let userExperienceImpact: 'low' | 'medium' | 'high' | 'critical';
    let businessImpact: string;

    if (degradation >= 100) {
      userExperienceImpact = 'critical';
      businessImpact = 'Severe impact on user experience and productivity';
    } else if (degradation >= 50) {
      userExperienceImpact = 'high';
      businessImpact = 'Significant impact on user experience';
    } else if (degradation >= 25) {
      userExperienceImpact = 'medium';
      businessImpact = 'Moderate impact on user experience';
    } else {
      userExperienceImpact = 'low';
      businessImpact = 'Minor impact on user experience';
    }

    return {
      affectedUsers,
      userExperienceImpact,
      businessImpact,
    };
  }

  private generateResponseTimeRecommendations(degradation: number): string[] {
    const recommendations: string[] = [];

    if (degradation >= 50) {
      recommendations.push('Immediate investigation required - response time severely degraded');
      recommendations.push('Check for infinite loops or blocking operations');
      recommendations.push('Consider scaling resources immediately');
    } else {
      recommendations.push('Analyze recent code changes for performance regressions');
      recommendations.push('Review database queries and optimize if needed');
      recommendations.push('Check for memory leaks or excessive garbage collection');
    }

    recommendations.push('Monitor user feedback and error reports');

    return recommendations;
  }

  private generateThroughputRecommendations(degradation: number): string[] {
    const recommendations: string[] = [];

    recommendations.push('Investigate bottlenecks in processing pipeline');
    recommendations.push('Check for resource contention or threading issues');
    recommendations.push('Review caching strategies and implement if needed');

    if (degradation >= 50) {
      recommendations.push('Consider horizontal scaling of service');
      recommendations.push('Implement load shedding mechanisms');
    }

    return recommendations;
  }

  private generateErrorRateRecommendations(errorRate: number): string[] {
    const recommendations: string[] = [];

    recommendations.push('Review error logs for common patterns');
    recommendations.push('Check external dependencies and service health');

    if (errorRate >= 15) {
      recommendations.push('Implement circuit breakers for external calls');
      recommendations.push('Enable enhanced monitoring and alerting');
    }

    recommendations.push('Add retry logic with exponential backoff');
    recommendations.push('Improve input validation and error handling');

    return recommendations;
  }

  private generateResourceRecommendations(resource: string, usage: number): string[] {
    const recommendations: string[] = [];

    if (resource === 'memory') {
      recommendations.push('Analyze memory allocation patterns');
      recommendations.push('Check for memory leaks in long-running processes');
      recommendations.push('Implement memory pooling or caching optimizations');

      if (usage >= 90) {
        recommendations.push('Immediate memory optimization required');
        recommendations.push('Consider increasing memory allocation');
      }
    }

    return recommendations;
  }

  private async handleDegradation(degradation: PerformanceDegradation): Promise<void> {
    // Check if this is a new degradation or continuation of existing one
    const existingDegradation = this.degradations.find(d =>
      d.toolId === degradation.toolId &&
      d.type === degradation.type &&
      d.status === 'active'
    );

    if (existingDegradation) {
      // Update existing degradation
      existingDegradation.duration = Date.now() - existingDegradation.detectedAt.getTime();
      existingDegradation.metrics.current = degradation.metrics.current;
      existingDegradation.metrics.degradation = degradation.metrics.degradation;
    } else {
      // New degradation
      this.degradations.push(degradation);

      // Send alert
      if (this.config.alerting.enabled) {
        await this.sendDegradationAlert(degradation);
      }

      console.warn(`📉 Performance degradation detected: ${degradation.toolName} - ${degradation.type} (${degradation.metrics.degradation.toFixed(1)}% degradation)`);
    }

    // Track consecutive degradations
    const key = `${degradation.toolId}-${degradation.type}`;
    this.consecutiveDegradations.set(key, (this.consecutiveDegradations.get(key) || 0) + 1);
  }

  private async sendDegradationAlert(degradation: PerformanceDegradation): Promise<void> {
    const message = `Performance degradation detected in ${degradation.toolName}: ${degradation.type} degraded by ${degradation.metrics.degradation.toFixed(1)}%. Severity: ${degradation.severity}`;

    for (const channel of this.config.alerting.channels) {
      switch (channel) {
        case 'console':
          const logMethod = degradation.severity === 'critical' ? 'error' : 'warn';
          console[logMethod](`📉 ${message}`);
          if (this.config.alerting.includeRecommendations) {
            degradation.recommendations.forEach(rec => console[logMethod](`  • ${rec}`));
          }
          break;
        case 'browser':
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Performance Degradation Alert', {
              body: message,
              icon: '/favicon.ico',
              requireInteraction: degradation.severity === 'critical',
            });
          }
          break;
        // Add other channels as needed
      }
    }
  }

  private async updateTrends(): Promise<void> {
    const tools = this.getMonitoredTools();

    for (const tool of tools) {
      const toolTrends = await this.calculateToolTrends(tool);

      if (!this.trends.has(tool.id)) {
        this.trends.set(tool.id, []);
      }

      const existingTrends = this.trends.get(tool.id)!;

      // Update or add trends
      for (const trend of toolTrends) {
        const existingIndex = existingTrends.findIndex(t => t.metric === trend.metric);
        if (existingIndex >= 0) {
          existingTrends[existingIndex] = trend;
        } else {
          existingTrends.push(trend);
        }
      }
    }
  }

  private async calculateToolTrends(tool: { id: string; name: string }): Promise<PerformanceTrend[]> {
    const trends: PerformanceTrend[] = [];
    const metrics = ['responseTime', 'throughput', 'errorRate'] as const;

    for (const metric of metrics) {
      const trend = await this.trendAnalyzer.calculateTrend(tool.id, metric, this.metrics);
      if (trend) {
        trends.push(trend);
      }
    }

    return trends;
  }

  private async detectAnomalies(): Promise<void> {
    const tools = this.getMonitoredTools();

    for (const tool of tools) {
      const toolAnomalies = await this.anomalyDetector.detectAnomalies(tool, this.metrics, this.baselines.get(tool.id));

      for (const anomaly of toolAnomalies) {
        if (!this.anomalies.find(a => a.id === anomaly.id)) {
          this.anomalies.push(anomaly);

          if (anomaly.impact.severity === 'high' || anomaly.impact.severity === 'critical') {
            await this.sendAnomalyAlert(anomaly);
          }
        }
      }
    }

    // Clean old anomalies
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    this.anomalies = this.anomalies.filter(a => a.detectedAt >= cutoff);
  }

  private async sendAnomalyAlert(anomaly: PerformanceAnomaly): Promise<void> {
    const message = `Performance anomaly detected in ${anomaly.toolName}: ${anomaly.metric} ${anomaly.type} (value: ${anomaly.value.toFixed(2)}, expected: ${anomaly.expectedValue.toFixed(2)})`;

    for (const channel of this.config.alerting.channels) {
      switch (channel) {
        case 'console':
          console.warn(`🔍 ${message}`);
          break;
        case 'browser':
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Performance Anomaly Alert', {
              body: message,
              icon: '/favicon.ico',
            });
          }
          break;
      }
    }
  }

  private async analyzeCorrelations(): Promise<void> {
    // Analyze correlations between different metrics and tools
    const correlations = await this.correlationAnalyzer.analyzeCorrelations(this.metrics);

    // Store correlation insights
    for (const correlation of correlations) {
      if (Math.abs(correlation.correlation) > 0.7) { // Strong correlation
        // Update degradation correlation factors
        this.degradations.forEach(degradation => {
          if (degradation.toolId === correlation.toolId1 || degradation.toolId === correlation.toolId2) {
            degradation.correlationFactors.push({
              factor: `${correlation.metric1} <-> ${correlation.metric2}`,
              correlation: correlation.correlation,
              confidence: correlation.confidence,
            });
          }
        });
      }
    }
  }

  private async generateInsights(): Promise<void> {
    const tools = this.getMonitoredTools();

    for (const tool of tools) {
      const toolInsights = await this.generateToolInsights(tool);

      for (const insight of toolInsights) {
        if (!this.insights.find(i => i.id === insight.id)) {
          this.insights.push(insight);
          console.log(`💡 Performance insight: ${insight.title}`);
        }
      }
    }

    // Clean old insights
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    this.insights = this.insights.filter(i => i.timestamp >= cutoff);
  }

  private async generateToolInsights(tool: { id: string; name: string }): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];
    const baseline = this.baselines.get(tool.id);

    if (!baseline) return insights;

    // Analyze recent performance
    const recentMetrics = this.metrics.filter(m =>
      m.toolId === tool.id &&
      m.timestamp >= new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    if (recentMetrics.length === 0) return insights;

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgThroughput = recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;

    // Generate optimization insights
    if (avgResponseTime > baseline.metrics.responseTime.mean * 1.2) {
      insights.push({
        id: `insight-${Date.now()}-${tool.id}-response-time`,
        type: 'optimization',
        title: `${tool.name} response time optimization opportunity`,
        description: `Average response time is ${((avgResponseTime / baseline.metrics.responseTime.mean - 1) * 100).toFixed(1)}% above baseline`,
        toolId: tool.id,
        toolName: tool.name,
        timestamp: new Date(),
        confidence: 0.8,
        impact: {
          potentialImprovement: 15,
          priority: 'medium',
          effort: 'medium',
        },
        data: {
          metric: 'responseTime',
          currentValue: avgResponseTime,
          targetValue: baseline.metrics.responseTime.mean,
          trend: await this.trendAnalyzer.calculateTrend(tool.id, 'responseTime', this.metrics) || {} as PerformanceTrend,
          evidence: recentMetrics.slice(-5).map(m => ({
            timestamp: m.timestamp,
            value: m.responseTime,
            context: 'Regular operation',
          })),
        },
        recommendations: [
          'Profile code to identify bottlenecks',
          'Optimize database queries',
          'Consider caching strategies',
        ],
      });
    }

    return insights;
  }

  // Public API methods
  public getCurrentMetrics(toolId?: string): PerformanceMetric[] {
    if (toolId) {
      return this.metrics.filter(m => m.toolId === toolId);
    }
    return [...this.metrics];
  }

  public getBaselines(toolId?: string): Map<string, PerformanceBaseline> | PerformanceBaseline | null {
    if (toolId) {
      return this.baselines.get(toolId) || null;
    }
    return new Map(this.baselines);
  }

  public getActiveDegradations(toolId?: string): PerformanceDegradation[] {
    const active = this.degradations.filter(d => d.status === 'active');
    if (toolId) {
      return active.filter(d => d.toolId === toolId);
    }
    return active;
  }

  public getTrends(toolId?: string): PerformanceTrend[] {
    if (toolId) {
      return this.trends.get(toolId) || [];
    }
    return Array.from(this.trends.values()).flat();
  }

  public getAnomalies(toolId?: string, hours?: number): PerformanceAnomaly[] {
    let anomalies = [...this.anomalies];

    if (toolId) {
      anomalies = anomalies.filter(a => a.toolId === toolId);
    }

    if (hours) {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      anomalies = anomalies.filter(a => a.detectedAt >= cutoff);
    }

    return anomalies;
  }

  public getInsights(toolId?: string): PerformanceInsight[] {
    if (toolId) {
      return this.insights.filter(i => i.toolId === toolId);
    }
    return [...this.insights];
  }

  public async recalculateBaseline(toolId: string): Promise<void> {
    const tool = this.getMonitoredTools().find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    const baseline = await this.calculateToolBaseline(tool);
    if (baseline) {
      this.baselines.set(toolId, baseline);
      console.log(`📊 Recalculated baseline for ${tool.name}`);
    }
  }

  public acknowledgeDegradation(degradationId: string): void {
    const degradation = this.degradations.find(d => d.id === degradationId);
    if (degradation) {
      degradation.status = 'investigating';
    }
  }

  public resolveDegradation(degradationId: string, action: string): void {
    const degradation = this.degradations.find(d => d.id === degradationId);
    if (degradation) {
      degradation.status = 'resolved';
      degradation.resolution = {
        action,
        timestamp: new Date(),
        effective: true,
      };
    }
  }

  public updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart monitoring if interval changed
    if (config.monitoring?.interval && this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  public getSystemOverview(): {
    totalTools: number;
    toolsWithBaselines: number;
    activeDegradations: number;
    recentAnomalies: number;
    generatedInsights: number;
    lastAnalysis: Date;
  } {
    return {
      totalTools: this.getMonitoredTools().length,
      toolsWithBaselines: this.baselines.size,
      activeDegradations: this.degradations.filter(d => d.status === 'active').length,
      recentAnomalies: this.anomalies.filter(a =>
        a.detectedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      generatedInsights: this.insights.length,
      lastAnalysis: this.lastAnalysis,
    };
  }
}

// Supporting classes
class TrendAnalyzer {
  async calculateTrend(
    toolId: string,
    metric: string,
    metrics: PerformanceMetric[]
  ): Promise<PerformanceTrend | null> {
    const toolMetrics = metrics.filter(m => m.toolId === toolId);
    if (toolMetrics.length < 10) return null;

    const values = toolMetrics.map(m => ({
      timestamp: m.timestamp,
      value: m[metric as keyof PerformanceMetric] as number,
    }));

    // Simple linear regression
    const n = values.length;
    const sumX = values.reduce((sum, v, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v.value, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v.value, 0);
    const sumXX = values.reduce((sum, v, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    let direction: 'improving' | 'degrading' | 'stable' | 'volatile';
    if (Math.abs(slope) < 0.01) {
      direction = 'stable';
    } else if ((metric === 'responseTime' || metric === 'errorRate') && slope > 0) {
      direction = 'degrading';
    } else if ((metric === 'throughput') && slope < 0) {
      direction = 'degrading';
    } else {
      direction = 'improving';
    }

    return {
      toolId,
      metric: metric as any,
      period: {
        start: values[0].timestamp,
        end: values[values.length - 1].timestamp,
        dataPoints: n,
      },
      direction,
      slope,
      confidence: 0.8, // Simplified
      significance: 0.05, // Simplified
      dataPoints: values.map(v => ({
        timestamp: v.timestamp,
        value: v.value,
        baseline: 0, // Would calculate from baseline
        anomaly: false, // Would detect anomalies
      })),
    };
  }
}

class AnomalyDetector {
  async detectAnomalies(
    tool: { id: string; name: string },
    metrics: PerformanceMetric[],
    baseline?: PerformanceBaseline
  ): Promise<PerformanceAnomaly[]> {
    if (!baseline) return [];

    const anomalies: PerformanceAnomaly[] = [];
    const toolMetrics = metrics.filter(m => m.toolId === tool.id);
    const recentMetrics = toolMetrics.slice(-10); // Last 10 measurements

    for (const metric of recentMetrics) {
      // Check for response time anomalies
      if (metric.responseTime > baseline.metrics.responseTime.p99) {
        anomalies.push({
          id: `anomaly-${Date.now()}-${tool.id}-response-time`,
          toolId: tool.id,
          toolName: tool.name,
          detectedAt: metric.timestamp,
          type: 'spike',
          metric: 'responseTime',
          value: metric.responseTime,
          expectedValue: baseline.metrics.responseTime.mean,
          deviation: (metric.responseTime - baseline.metrics.responseTime.mean) / baseline.metrics.responseTime.standardDeviation,
          confidence: 0.9,
          context: {
            timeOfDay: metric.timestamp.getHours().toString(),
            dayOfWeek: metric.timestamp.toLocaleDateString(),
            concurrentUsers: 50,
            systemEvents: [],
          },
          verified: false,
          impact: {
            severity: metric.responseTime > baseline.metrics.responseTime.p99 * 2 ? 'high' : 'medium',
            affectedMetrics: ['responseTime', 'userExperience'],
            userImpact: 'Slow response times affecting user experience',
          },
        });
      }
    }

    return anomalies;
  }
}

class CorrelationAnalyzer {
  async analyzeCorrelations(metrics: PerformanceMetric[]): Promise<Array<{
    toolId1: string;
    toolId2: string;
    metric1: string;
    metric2: string;
    correlation: number;
    confidence: number;
  }>> {
    const correlations: Array<{
      toolId1: string;
      toolId2: string;
      metric1: string;
      metric2: string;
      correlation: number;
      confidence: number;
    }> = [];

    // Group metrics by tool
    const toolMetrics = new Map<string, PerformanceMetric[]>();
    for (const metric of metrics) {
      if (!toolMetrics.has(metric.toolId)) {
        toolMetrics.set(metric.toolId, []);
      }
      toolMetrics.get(metric.toolId)!.push(metric);
    }

    // Analyze correlations within each tool
    for (const [toolId, toolMetricList] of toolMetrics) {
      if (toolMetricList.length < 10) continue;

      // Correlate response time with error rate
      const responseTimes = toolMetricList.map(m => m.responseTime);
      const errorRates = toolMetricList.map(m => m.errorRate);
      const correlation = this.calculateCorrelation(responseTimes, errorRates);

      if (Math.abs(correlation) > 0.5) {
        correlations.push({
          toolId1: toolId,
          toolId2: toolId,
          metric1: 'responseTime',
          metric2: 'errorRate',
          correlation,
          confidence: 0.7,
        });
      }
    }

    return correlations;
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
}

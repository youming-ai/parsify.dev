/**
 * Real-time Error Recovery Reporting System
 * Provides real-time SC-009 compliance reporting and alerting
 * Generates comprehensive reports for error recovery performance and compliance monitoring
 */

import {
  ErrorEvent,
  ErrorRecoveryMetrics,
  ErrorRecoveryAlert,
  RealtimeErrorRecoveryMetrics,
  SC009TargetProgress,
  ErrorRecoveryRecommendation,
  EffectivenessMetrics,
  ErrorType,
  RecoveryStrategy,
  ErrorCategory,
  ErrorSeverity
} from './error-recovery-types';

// ============================================================================
// Real-time Reporting Configuration
// ============================================================================

export interface RealtimeReportingConfig {
  enabled: boolean;
  sc009: {
    targetRecoveryRate: number; // 98%
    reportingInterval: number; // 60000ms (1 minute)
    alertThresholds: {
      recoveryRateWarning: number; // 96%
      recoveryRateCritical: number; // 94%
      responseTimeWarning: number; // 30s
      responseTimeCritical: number; // 60s
      satisfactionWarning: number; // 75%
      satisfactionCritical: number; // 60%
    };
    complianceReporting: {
      enabled: boolean;
      reportFrequency: 'realtime' | 'hourly' | 'daily';
      includeRecommendations: boolean;
      includeTrends: boolean;
      includePredictions: boolean;
    };
  };
  realTime: {
    enabled: boolean;
    streamingEnabled: boolean;
    bufferSize: number;
    updateInterval: number; // 5000ms (5 seconds)
    maxRetries: number;
    retryDelay: number;
  };
  reporting: {
    formats: Array<'json' | 'csv' | 'html' | 'pdf'>;
    channels: Array<'console' | 'browser' | 'analytics' | 'webhook' | 'email'>;
    retention: {
      metricsRetention: number; // days
      alertsRetention: number; // days
      reportsRetention: number; // days
    };
    compression: boolean;
    encryption: boolean;
  };
  alerts: {
    enabled: boolean;
    channels: Array<'console' | 'browser' | 'email' | 'slack' | 'webhook'>;
    severity: Array<'info' | 'warning' | 'error' | 'critical'>;
    cooldownPeriod: number; // 300000ms (5 minutes)
    escalation: {
      enabled: boolean;
      thresholds: Array<{
        condition: string;
        action: string;
        delay: number;
      }>;
    };
  };
  dashboard: {
    enabled: boolean;
    refreshInterval: number; // 30000ms (30 seconds)
    maxDataPoints: number; // 1000
    enableDrillDown: boolean;
    enableExport: boolean;
  };
}

// ============================================================================
// Real-time Report Types
// ============================================================================

export interface RealtimeReport {
  id: string;
  type: ReportType;
  timestamp: Date;
  period: ReportPeriod;
  data: ReportData;
  metadata: ReportMetadata;
  status: ReportStatus;
}

export type ReportType =
  | 'sc009_compliance'
  | 'error_recovery_metrics'
  | 'performance_summary'
  | 'trend_analysis'
  | 'alert_summary'
  | 'recommendation_summary'
  | 'effectiveness_analysis'
  | 'prediction_report';

export interface ReportPeriod {
  start: Date;
  end: Date;
  duration: number;
  type: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface ReportData {
  summary: ReportSummary;
  sc009Compliance: SC009ComplianceReport;
  metrics: ErrorRecoveryMetrics;
  alerts: ErrorRecoveryAlert[];
  recommendations: ErrorRecoveryRecommendation[];
  trends: ReportTrend[];
  predictions: ReportPrediction[];
  effectiveness: EffectivenessReport;
}

export interface ReportSummary {
  totalErrors: number;
  successfulRecoveries: number;
  overallRecoveryRate: number;
  averageRecoveryTime: number;
  userSatisfactionScore: number;
  systemHealthScore: number;
  criticalAlerts: number;
  openRecommendations: number;
  sc009Compliant: boolean;
  period: string;
  generatedAt: Date;
}

export interface SC009ComplianceReport {
  compliant: boolean;
  currentRecoveryRate: number;
  targetRecoveryRate: number;
  gap: number;
  onTrack: boolean;
  riskAssessment: ComplianceRiskAssessment;
  mitigationProgress: MitigationProgress[];
  trend: ComplianceTrend;
  projectedAchievement: Date;
}

export interface ComplianceRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: ComplianceRiskFactor[];
  mitigationStrategies: string[];
  monitoringPlan: string[];
  lastAssessment: Date;
}

export interface ComplianceRiskFactor {
  factor: string;
  risk: 'low' | 'medium' | 'high';
  impact: number;
  probability: number;
  mitigation: string;
  status: 'active' | 'mitigated' | 'monitoring';
}

export interface MitigationProgress {
  initiative: string;
  progress: number;
  targetDate: Date;
  responsible: string;
  status: 'on_track' | 'at_risk' | 'delayed';
  impact: number;
}

export interface ComplianceTrend {
  direction: 'improving' | 'declining' | 'stable';
  rate: number;
  confidence: number;
  dataPoints: TrendDataPoint[];
  forecast: ComplianceForecast;
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  context?: Record<string, any>;
}

export interface ComplianceForecast {
  projectedValue: number;
  targetAchievement: Date;
  confidence: number;
  factors: string[];
}

export interface ReportTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down' | 'stable';
  significance: 'low' | 'medium' | 'high';
}

export interface ReportPrediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: number;
  factors: PredictionFactor[];
  recommendations: string[];
}

export interface PredictionFactor {
  factor: string;
  impact: number;
  weight: number;
  value: number;
}

export interface EffectivenessReport {
  overallEffectiveness: number;
  strategyRankings: StrategyEffectivenessRanking[];
  optimizationOpportunities: OptimizationOpportunity[];
  userFeedback: UserFeedbackReport;
  guidanceEffectiveness: GuidanceEffectivenessReport;
}

export interface StrategyEffectivenessRanking {
  strategy: RecoveryStrategy;
  ranking: number;
  effectivenessScore: number;
  successRate: number;
  averageTime: number;
  userSatisfaction: number;
  sc009Compliant: boolean;
  improvement: number;
}

export interface OptimizationOpportunity {
  id: string;
  strategy: RecoveryStrategy;
  errorType?: ErrorType;
  currentPerformance: number;
  potentialImprovement: number;
  confidence: number;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeline: string;
}

export interface UserFeedbackReport {
  totalFeedback: number;
  averageRating: number;
  satisfactionDistribution: SatisfactionDistribution[];
  commonIssues: CommonIssue[];
  improvementSuggestions: ImprovementSuggestion[];
  trends: FeedbackTrend[];
}

export interface SatisfactionDistribution {
  rating: number;
  count: number;
  percentage: number;
  comments: string[];
}

export interface CommonIssue {
  issue: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  affectedStrategies: RecoveryStrategy[];
  suggestedFix: string;
}

export interface ImprovementSuggestion {
  suggestion: string;
  support: number;
  feasibility: number;
  impact: number;
  source: 'user' | 'system' | 'expert';
}

export interface FeedbackTrend {
  period: string;
  averageRating: number;
  totalFeedback: number;
  change: number;
}

export interface GuidanceEffectivenessReport {
  overallEffectiveness: number;
  usageByType: GuidanceTypeUsage[];
  completionRates: GuidanceCompletionRate[];
  helpfulnessScores: GuidanceHelpfulnessScore[];
  timeToSuccess: number;
}

export interface GuidanceTypeUsage {
  type: string;
  usage: number;
  successRate: number;
  userSatisfaction: number;
  averageTime: number;
}

export interface GuidanceCompletionRate {
  guidanceType: string;
  started: number;
  completed: number;
  completionRate: number;
  averageTime: number;
}

export interface GuidanceHelpfulnessScore {
  guidanceType: string;
  helpful: number;
  notHelpful: number;
  helpfulnessScore: number;
  averageRating: number;
}

export interface ReportMetadata {
  generatedBy: string;
  version: string;
  dataSources: string[];
  processingTime: number;
  accuracy: number;
  lastUpdated: Date;
  expiresAt: Date;
}

export type ReportStatus = 'generating' | 'completed' | 'failed' | 'expired';

// ============================================================================
// Real-time Error Recovery Reporter
// ============================================================================

export class RealtimeErrorRecoveryReporter {
  private static instance: RealtimeErrorRecoveryReporter;
  private config: RealtimeReportingConfig;
  private reports: Map<string, RealtimeReport> = new Map();
  private subscribers: Map<string, ReportSubscriber[]> = new Map();
  private reportCache: Map<string, RealtimeReport> = new Map();
  private alertHistory: ErrorRecoveryAlert[] = [];
  private isRunning = false;
  private reportingInterval: NodeJS.Timeout | null = null;
  private lastReportTime: Date = new Date();

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): RealtimeErrorRecoveryReporter {
    if (!RealtimeErrorRecoveryReporter.instance) {
      RealtimeErrorRecoveryReporter.instance = new RealtimeErrorRecoveryReporter();
    }
    return RealtimeErrorRecoveryReporter.instance;
  }

  // Initialize the reporter
  public async initialize(config?: Partial<RealtimeReportingConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      console.log('Real-time error recovery reporting is disabled');
      return;
    }

    try {
      console.log('🚀 Initializing Real-time Error Recovery Reporter...');

      // Setup reporting intervals
      this.setupReportingIntervals();

      // Setup alert handling
      this.setupAlertHandling();

      // Initialize reporting channels
      await this.initializeReportingChannels();

      // Generate initial report
      await this.generateInitialReport();

      this.isRunning = true;
      console.log('✅ Real-time Error Recovery Reporter initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Real-time Error Recovery Reporter:', error);
      throw error;
    }
  }

  // Setup reporting intervals
  private setupReportingIntervals(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }

    // SC-009 compliance reporting
    if (this.config.sc009.complianceReporting.enabled) {
      const interval = this.config.sc009.reportingFrequency === 'realtime' ?
        this.config.realTime.updateInterval :
        this.config.sc009.reportingInterval;

      this.reportingInterval = setInterval(async () => {
        try {
          await this.generateSC009ComplianceReport();
        } catch (error) {
          console.error('Error generating SC-009 compliance report:', error);
        }
      }, interval);
    }
  }

  // Setup alert handling
  private setupAlertHandling(): void {
    if (!this.config.alerts.enabled) return;

    // Listen for alerts from the error recovery system
    // This would typically integrate with the error recovery integration manager
    console.log('🚨 Setting up alert handling...');
  }

  // Initialize reporting channels
  private async initializeReportingChannels(): Promise<void> {
    console.log('📡 Initializing reporting channels...');

    // Setup different reporting channels based on configuration
    for (const channel of this.config.reporting.channels) {
      switch (channel) {
        case 'console':
          console.log('Console reporting enabled');
          break;
        case 'browser':
          if (typeof window !== 'undefined') {
            console.log('Browser notifications enabled');
          }
          break;
        case 'analytics':
          console.log('Analytics reporting enabled');
          break;
        case 'webhook':
          console.log('Webhook reporting enabled');
          break;
        case 'email':
          console.log('Email reporting enabled');
          break;
      }
    }
  }

  // Generate initial report
  private async generateInitialReport(): Promise<void> {
    console.log('📊 Generating initial report...');

    try {
      const report = await this.generateSC009ComplianceReport();
      this.cacheReport(report);
      this.notifySubscribers('sc009_compliance', report);
    } catch (error) {
      console.error('Error generating initial report:', error);
    }
  }

  // Generate SC-009 compliance report
  public async generateSC009ComplianceReport(): Promise<RealtimeReport> {
    const reportId = `sc009_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    const report: RealtimeReport = {
      id: reportId,
      type: 'sc009_compliance',
      timestamp,
      period: {
        start: new Date(timestamp.getTime() - this.config.sc009.reportingInterval),
        end: timestamp,
        duration: this.config.sc009.reportingInterval,
        type: 'realtime'
      },
      data: await this.generateSC009ReportData(timestamp),
      metadata: {
        generatedBy: 'RealtimeErrorRecoveryReporter',
        version: '1.0.0',
        dataSources: ['error_recovery_integration', 'effectiveness_monitor', 'metrics_calculator'],
        processingTime: 0,
        accuracy: 0.95,
        lastUpdated: timestamp,
        expiresAt: new Date(timestamp.getTime() + this.config.reporting.retention.metricsRetention * 24 * 60 * 60 * 1000)
      },
      status: 'completed'
    };

    this.reports.set(reportId, report);
    this.lastReportTime = timestamp;

    return report;
  }

  // Generate SC-009 report data
  private async generateSC009ReportData(timestamp: Date): Promise<ReportData> {
    // This would typically fetch data from the error recovery integration manager
    // For now, create mock data structure

    const currentRecoveryRate = 0.95; // 95% - below 98% target
    const targetRecoveryRate = this.config.sc009.targetRecoveryRate;
    const gap = targetRecoveryRate - currentRecoveryRate;

    return {
      summary: {
        totalErrors: 150,
        successfulRecoveries: 143,
        overallRecoveryRate: currentRecoveryRate,
        averageRecoveryTime: 25000, // 25 seconds
        userSatisfactionScore: 0.87,
        systemHealthScore: 92,
        criticalAlerts: 2,
        openRecommendations: 5,
        sc009Compliant: currentRecoveryRate >= targetRecoveryRate,
        period: 'Last 60 minutes',
        generatedAt: timestamp
      },
      sc009Compliance: {
        compliant: currentRecoveryRate >= targetRecoveryRate,
        currentRecoveryRate,
        targetRecoveryRate,
        gap,
        onTrack: gap <= 0.02,
        riskAssessment: {
          overallRisk: gap > 0.05 ? 'high' : gap > 0.02 ? 'medium' : 'low',
          riskFactors: [
            {
              factor: 'High error rate in JSON processing',
              risk: 'medium',
              impact: 0.03,
              probability: 0.7,
              mitigation: 'Improve input validation and error handling',
              status: 'active'
            },
            {
              factor: 'Slow recovery times for file processing',
              risk: 'low',
              impact: 0.01,
              probability: 0.5,
              mitigation: 'Optimize file processing algorithms',
              status: 'monitoring'
            }
          ],
          mitigationStrategies: [
            'Implement enhanced input validation',
            'Optimize recovery algorithms',
            'Improve user guidance and instructions'
          ],
          monitoringPlan: [
            'Monitor recovery rates by error type',
            'Track user satisfaction scores',
            'Analyze recovery time trends'
          ],
          lastAssessment: timestamp
        },
        mitigationProgress: [
          {
            initiative: 'Enhanced input validation',
            progress: 0.75,
            targetDate: new Date(timestamp.getTime() + 7 * 24 * 60 * 60 * 1000),
            responsible: 'Development Team',
            status: 'on_track',
            impact: 0.02
          }
        ],
        trend: {
          direction: 'improving',
          rate: 0.005, // 0.5% improvement per day
          confidence: 0.8,
          dataPoints: [
            { timestamp: new Date(timestamp.getTime() - 6 * 24 * 60 * 60 * 1000), value: 0.92 },
            { timestamp: new Date(timestamp.getTime() - 5 * 24 * 60 * 60 * 1000), value: 0.93 },
            { timestamp: new Date(timestamp.getTime() - 4 * 24 * 60 * 60 * 1000), value: 0.935 },
            { timestamp: new Date(timestamp.getTime() - 3 * 24 * 60 * 60 * 1000), value: 0.94 },
            { timestamp: new Date(timestamp.getTime() - 2 * 24 * 60 * 60 * 1000), value: 0.945 },
            { timestamp: new Date(timestamp.getTime() - 1 * 24 * 60 * 60 * 1000), value: 0.947 },
            { timestamp: timestamp, value: currentRecoveryRate }
          ],
          forecast: {
            projectedValue: 0.98,
            targetAchievement: new Date(timestamp.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days
            confidence: 0.75,
            factors: ['Current trend', 'Recent improvements', 'Active mitigations']
          }
        },
        projectedAchievement: new Date(timestamp.getTime() + 6 * 24 * 60 * 60 * 1000)
      },
      metrics: await this.generateMockMetrics(),
      alerts: this.alertHistory.slice(-10), // Last 10 alerts
      recommendations: await this.generateMockRecommendations(),
      trends: await this.generateMockTrends(),
      predictions: await this.generateMockPredictions(),
      effectiveness: await this.generateMockEffectivenessReport()
    };
  }

  // Mock data generators (would typically fetch from real data sources)
  private async generateMockMetrics(): Promise<ErrorRecoveryMetrics> {
    return {
      overallRecoveryRate: 0.95,
      sc009Compliant: false,
      sc009Gap: 0.03,
      totalErrors: 150,
      errorsByType: [],
      errorsByCategory: [],
      errorsBySeverity: [],
      errorsByTool: [],
      averageRecoveryTime: 25000,
      medianRecoveryTime: 20000,
      recoveryTimeDistribution: [],
      successRateByStrategy: [],
      userSatisfactionScore: 0.87,
      satisfactionByErrorType: [],
      abandonmentRate: 0.05,
      abandonmentByErrorType: [],
      mostEffectiveStrategies: [],
      commonRecoveryPaths: [],
      retryPatterns: [],
      guidanceEffectivenessScore: 0.82,
      guidanceUsageStats: [],
      mostHelpfulGuidance: [],
      hourlyMetrics: [],
      dailyMetrics: [],
      weeklyMetrics: [],
      monthlyTrends: [],
      systemHealthScore: 92,
      criticalErrorRate: 0.02,
      cascadingFailureCount: 0,
      resilienceScore: 88,
      sc009TargetProgress: {
        targetRecoveryRate: 0.98,
        currentRecoveryRate: 0.95,
        gap: 0.03,
        onTrack: false,
        projectedAchievement: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        requiredImprovement: 0.03,
        confidenceLevel: 0.75,
        riskFactors: [],
        successFactors: []
      },
      recommendations: [],
      timestamp: new Date(),
      period: {
        start: new Date(Date.now() - 60 * 60 * 1000),
        end: new Date()
      }
    };
  }

  private async generateMockRecommendations(): Promise<ErrorRecoveryRecommendation[]> {
    return [
      {
        id: 'rec_1',
        category: 'recovery_optimization',
        priority: 'high',
        title: 'Improve JSON validation error recovery',
        description: 'Enhance the recovery strategy for JSON validation errors to improve SC-009 compliance',
        affectedErrorTypes: ['invalid_input_format'],
        expectedImprovement: {
          recoveryRateImprovement: 0.03,
          userSatisfactionImprovement: 0.05,
          timeToRecoveryReduction: 5,
          sc009ComplianceImpact: 0.03
        },
        effort: {
          complexity: 'medium',
          estimatedHours: 8,
          requiredResources: ['developer', 'testing'],
          dependencies: ['code review'],
          riskLevel: 'low'
        },
        timeframe: '1 week',
        dependencies: ['Code review', 'Testing'],
        riskLevel: 'low',
        supportingData: [],
        confidence: 0.85,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private async generateMockTrends(): Promise<ReportTrend[]> {
    return [
      {
        metric: 'Recovery Rate',
        current: 0.95,
        previous: 0.92,
        change: 0.03,
        changePercent: 3.26,
        direction: 'up',
        significance: 'medium'
      },
      {
        metric: 'Average Recovery Time',
        current: 25000,
        previous: 28000,
        change: -3000,
        changePercent: -10.71,
        direction: 'down',
        significance: 'high'
      }
    ];
  }

  private async generateMockPredictions(): Promise<ReportPrediction[]> {
    return [
      {
        metric: 'Recovery Rate',
        predictedValue: 0.98,
        confidence: 0.75,
        timeframe: 6 * 24 * 60 * 60 * 1000, // 6 days
        factors: [
          {
            factor: 'Current trend',
            impact: 0.6,
            weight: 0.4,
            value: 0.005
          },
          {
            factor: 'Recent improvements',
            impact: 0.3,
            weight: 0.3,
            value: 0.02
          }
        ],
        recommendations: [
          'Continue current improvement strategies',
          'Focus on high-impact error types'
        ]
      }
    ];
  }

  private async generateMockEffectivenessReport(): Promise<EffectivenessReport> {
    return {
      overallEffectiveness: 0.87,
      strategyRankings: [
        {
          strategy: 'retry_with_corrected_input',
          ranking: 1,
          effectivenessScore: 0.92,
          successRate: 0.94,
          averageTime: 20000,
          userSatisfaction: 0.89,
          sc009Compliant: true,
          improvement: 0.05
        }
      ],
      optimizationOpportunities: [],
      userFeedback: {
        totalFeedback: 125,
        averageRating: 4.2,
        satisfactionDistribution: [],
        commonIssues: [],
        improvementSuggestions: [],
        trends: []
      },
      guidanceEffectiveness: {
        overallEffectiveness: 0.82,
        usageByType: [],
        completionRates: [],
        helpfulnessScores: [],
        timeToSuccess: 45000
      }
    };
  }

  // Subscribe to reports
  public subscribe(reportType: ReportType, callback: (report: RealtimeReport) => void): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!this.subscribers.has(reportType)) {
      this.subscribers.set(reportType, []);
    }

    this.subscribers.get(reportType)!.push({
      id: subscriptionId,
      callback,
      subscribedAt: new Date()
    });

    return subscriptionId;
  }

  // Unsubscribe from reports
  public unsubscribe(reportType: ReportType, subscriptionId: string): void {
    const subscribers = this.subscribers.get(reportType);
    if (subscribers) {
      const index = subscribers.findIndex(sub => sub.id === subscriptionId);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  // Notify subscribers
  private notifySubscribers(reportType: ReportType, report: RealtimeReport): void {
    const subscribers = this.subscribers.get(reportType);
    if (subscribers) {
      subscribers.forEach(sub => {
        try {
          sub.callback(report);
        } catch (error) {
          console.error(`Error in subscriber callback for ${reportType}:`, error);
        }
      });
    }
  }

  // Cache report
  private cacheReport(report: RealtimeReport): void {
    this.reportCache.set(report.type, report);

    // Cleanup old reports based on retention policy
    this.cleanupOldReports();
  }

  // Cleanup old reports
  private cleanupOldReports(): void {
    const now = new Date();

    // Clean up reports cache
    for (const [type, report] of this.reportCache.entries()) {
      if (now > report.metadata.expiresAt) {
        this.reportCache.delete(type);
      }
    }

    // Clean up alerts history
    const alertRetention = this.config.reporting.retention.alertsRetention * 24 * 60 * 60 * 1000;
    this.alertHistory = this.alertHistory.filter(alert =>
      now.getTime() - alert.timestamp.getTime() < alertRetention
    );
  }

  // Get cached report
  public getCachedReport(reportType: ReportType): RealtimeReport | null {
    return this.reportCache.get(reportType) || null;
  }

  // Get latest report
  public getLatestReport(reportType?: ReportType): RealtimeReport | null {
    if (reportType) {
      return this.getCachedReport(reportType);
    }

    // Return the most recent report
    const reports = Array.from(this.reports.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return reports.length > 0 ? reports[0] : null;
  }

  // Get report history
  public getReportHistory(reportType: ReportType, limit?: number): RealtimeReport[] {
    const reports = Array.from(this.reports.values())
      .filter(report => report.type === reportType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? reports.slice(0, limit) : reports;
  }

  // Export report
  public async exportReport(reportId: string, format: 'json' | 'csv' | 'html' | 'pdf'): Promise<{
    data: string | Buffer;
    filename: string;
    mimeType: string;
  }> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const filename = `${report.type}_${report.timestamp.toISOString().split('T')[0]}.${format}`;
    let data: string | Buffer;
    let mimeType: string;

    switch (format) {
      case 'json':
        data = JSON.stringify(report, null, 2);
        mimeType = 'application/json';
        break;
      case 'csv':
        data = this.convertToCSV(report);
        mimeType = 'text/csv';
        break;
      case 'html':
        data = this.convertToHTML(report);
        mimeType = 'text/html';
        break;
      case 'pdf':
        data = await this.convertToPDF(report);
        mimeType = 'application/pdf';
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return { data, filename, mimeType };
  }

  // Convert report to CSV
  private convertToCSV(report: RealtimeReport): string {
    const headers = ['Metric', 'Current', 'Previous', 'Change', 'Change %'];
    const rows = report.data.trends.map(trend => [
      trend.metric,
      trend.current.toString(),
      trend.previous.toString(),
      trend.change.toString(),
      `${trend.changePercent.toFixed(2)}%`
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Convert report to HTML
  private convertToHTML(report: RealtimeReport): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.type.replace(/_/g, ' ')} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
          .metric { background: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.type.replace(/_/g, ' ').toUpperCase()} Report</h1>
          <p>Generated: ${report.timestamp.toLocaleString()}</p>
          <p>Period: ${report.period.start.toLocaleString()} - ${report.period.end.toLocaleString()}</p>
        </div>

        <div class="summary">
          <div class="metric">
            <h3>Recovery Rate</h3>
            <p>${(report.data.summary.overallRecoveryRate * 100).toFixed(1)}%</p>
          </div>
          <div class="metric">
            <h3>Avg Recovery Time</h3>
            <p>${(report.data.summary.averageRecoveryTime / 1000).toFixed(1)}s</p>
          </div>
          <div class="metric">
            <h3>User Satisfaction</h3>
            <p>${(report.data.summary.userSatisfactionScore * 100).toFixed(0)}%</p>
          </div>
          <div class="metric">
            <h3>SC-009 Compliant</h3>
            <p>${report.data.summary.sc009Compliant ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <h2>Trends</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Current</th>
              <th>Previous</th>
              <th>Change</th>
              <th>Change %</th>
            </tr>
          </thead>
          <tbody>
            ${report.data.trends.map(trend => `
              <tr>
                <td>${trend.metric}</td>
                <td>${trend.current}</td>
                <td>${trend.previous}</td>
                <td>${trend.change}</td>
                <td>${trend.changePercent.toFixed(2)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  // Convert report to PDF
  private async convertToPDF(report: RealtimeReport): Promise<Buffer> {
    // This would typically use a PDF generation library
    // For now, return a placeholder
    const html = this.convertToHTML(report);
    return Buffer.from(html, 'utf-8');
  }

  // Get reporter status
  public getStatus(): {
    running: boolean;
    config: RealtimeReportingConfig;
    reports: {
      total: number;
      cached: number;
      lastGenerated: Date | null;
    };
    subscribers: {
      total: number;
      byType: Record<string, number>;
    };
    alerts: {
      total: number;
      critical: number;
      recent: number;
    };
  } {
    const subscribersByType: Record<string, number> = {};
    for (const [type, subs] of this.subscribers.entries()) {
      subscribersByType[type] = subs.length;
    }

    return {
      running: this.isRunning,
      config: this.config,
      reports: {
        total: this.reports.size,
        cached: this.reportCache.size,
        lastGenerated: this.lastReportTime
      },
      subscribers: {
        total: Array.from(this.subscribers.values()).reduce((sum, subs) => sum + subs.length, 0),
        byType: subscribersByType
      },
      alerts: {
        total: this.alertHistory.length,
        critical: this.alertHistory.filter(a => a.severity === 'critical').length,
        recent: this.alertHistory.filter(a =>
          Date.now() - a.timestamp.getTime() < 60 * 60 * 1000 // Last hour
        ).length
      }
    };
  }

  // Start reporting
  public start(): void {
    if (!this.isRunning) {
      this.initialize();
    }
  }

  // Stop reporting
  public stop(): void {
    this.isRunning = false;
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
    console.log('Real-time error recovery reporting stopped');
  }

  // Cleanup
  public cleanup(): void {
    this.stop();
    this.reports.clear();
    this.reportCache.clear();
    this.subscribers.clear();
    this.alertHistory = [];
  }

  private getDefaultConfig(): RealtimeReportingConfig {
    return {
      enabled: true,
      sc009: {
        targetRecoveryRate: 0.98,
        reportingInterval: 60000,
        alertThresholds: {
          recoveryRateWarning: 0.96,
          recoveryRateCritical: 0.94,
          responseTimeWarning: 30000,
          responseTimeCritical: 60000,
          satisfactionWarning: 0.75,
          satisfactionCritical: 0.60
        },
        complianceReporting: {
          enabled: true,
          reportFrequency: 'realtime',
          includeRecommendations: true,
          includeTrends: true,
          includePredictions: true
        }
      },
      realTime: {
        enabled: true,
        streamingEnabled: true,
        bufferSize: 1000,
        updateInterval: 5000,
        maxRetries: 3,
        retryDelay: 1000
      },
      reporting: {
        formats: ['json', 'html'],
        channels: ['console', 'analytics'],
        retention: {
          metricsRetention: 30,
          alertsRetention: 7,
          reportsRetention: 90
        },
        compression: false,
        encryption: false
      },
      alerts: {
        enabled: true,
        channels: ['console', 'browser'],
        severity: ['warning', 'error', 'critical'],
        cooldownPeriod: 300000,
        escalation: {
          enabled: false,
          thresholds: []
        }
      },
      dashboard: {
        enabled: true,
        refreshInterval: 30000,
        maxDataPoints: 1000,
        enableDrillDown: true,
        enableExport: true
      }
    };
  }
}

interface ReportSubscriber {
  id: string;
  callback: (report: RealtimeReport) => void;
  subscribedAt: Date;
}

// Export singleton instance
export const realtimeErrorRecoveryReporter = RealtimeErrorRecoveryReporter.getInstance();

// Export convenience functions
export const initializeRealtimeReporting = async (
  config?: Partial<RealtimeReportingConfig>
): Promise<void> => {
  await realtimeErrorRecoveryReporter.initialize(config);
};

export const subscribeToReports = (
  reportType: ReportType,
  callback: (report: RealtimeReport) => void
): string => {
  return realtimeErrorRecoveryReporter.subscribe(reportType, callback);
};

export const getLatestReport = (reportType?: ReportType): RealtimeReport | null => {
  return realtimeErrorRecoveryReporter.getLatestReport(reportType);
};

export const exportReport = async (
  reportId: string,
  format: 'json' | 'csv' | 'html' | 'pdf' = 'json'
): Promise<{
  data: string | Buffer;
  filename: string;
  mimeType: string;
}> => {
  return await realtimeErrorRecoveryReporter.exportReport(reportId, format);
};

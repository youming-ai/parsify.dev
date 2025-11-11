/**
 * Downtime Detection and Alerting System
 * Advanced downtime detection with intelligent alerting and escalation
 * Features pattern recognition, predictive alerts, and automated responses
 */

import { HealthCheckResult, DowntimeIncident, UptimeAlert } from './uptime-monitoring-core';
import { AvailabilityEvent } from './realtime-availability-tracker';

export interface DowntimeDetectionConfig {
  enabled: boolean;
  detection: {
    consecutiveFailures: number;
    timeWindow: number; // minutes
    patterns: {
      enabled: boolean;
      learningEnabled: boolean;
      historicalDataDays: number;
      confidenceThreshold: number; // 0-1
    };
    prediction: {
      enabled: boolean;
      lookbackWindow: number; // hours
      predictionWindow: number; // minutes
      threshold: number; // probability threshold 0-1
    };
  };
  alerting: {
    enabled: boolean;
    channels: AlertChannel[];
    escalation: {
      enabled: boolean;
      levels: EscalationLevel[];
      autoEscalate: boolean;
      escalateAfter: number; // minutes
    };
    rateLimit: {
      enabled: boolean;
      maxAlertsPerHour: number;
      cooldownPeriod: number; // minutes
    };
    deduplication: {
      enabled: boolean;
      windowSize: number; // minutes
      similarityThreshold: number; // 0-1
    };
  };
  recovery: {
    autoDetect: boolean;
    confirmAfter: number; // consecutive successful checks
    notifyOnRecovery: boolean;
    postRecoveryAnalysis: boolean;
  };
}

export interface AlertChannel {
  id: string;
  type: 'console' | 'browser' | 'email' | 'webhook' | 'slack' | 'teams' | 'analytics';
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  filters: {
    severity?: Array<'info' | 'warning' | 'error' | 'critical'>;
    categories?: Array<string>;
    tools?: Array<string>;
  };
}

export interface EscalationLevel {
  level: number;
  name: string;
  delay: number; // minutes from incident start
  channels: string[]; // channel IDs
  severity: 'info' | 'warning' | 'error' | 'critical';
  autoResolve: boolean;
  notifyOnResolve: boolean;
}

export interface DowntimePattern {
  id: string;
  name: string;
  description: string;
  category: 'temporal' | 'load' | 'dependency' | 'environmental' | 'code';
  confidence: number; // 0-1
  frequency: number; // occurrences per period
  indicators: Array<{
    type: string;
    threshold: number;
    weight: number;
  }>;
  predictive: boolean;
  mitigation?: string;
  lastDetected: Date;
}

export interface DowntimePrediction {
  id: string;
  toolId: string;
  toolName: string;
  predictedAt: Date;
  predictedStartTime: Date;
  predictedEndTime: Date;
  confidence: number; // 0-1
  riskFactors: Array<{
    factor: string;
    impact: number;
    confidence: number;
  }>;
  recommendedActions: string[];
  status: 'predicted' | 'accurate' | 'false_positive' | 'missed';
}

export interface AlertContext {
  environment: string;
  timeOfDay: string;
  dayOfWeek: string;
  businessHours: boolean;
  recentIncidents: number;
  systemLoad: number;
  userImpact: {
    estimatedAffectedUsers: number;
    criticality: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AlertMetadata {
  correlationId: string;
  fingerprint: string;
  previousAlerts: string[];
  relatedIncidents: string[];
  suppressed: boolean;
  suppressionReason?: string;
  autoResolved: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export class DowntimeDetectionSystem {
  private static instance: DowntimeDetectionSystem;
  private config: DowntimeDetectionConfig;
  private channels: Map<string, AlertChannel> = new Map();
  private activeIncidents: Map<string, DowntimeIncident> = new Map();
  private recentAlerts: UptimeAlert[] = [];
  private downtimePatterns: DowntimePattern[] = [];
  private predictions: DowntimePrediction[] = [];

  // Detection state
  private consecutiveFailures: Map<string, number> = new Map();
  private failureHistory: Map<string, Date[]> = new Map();
  private alertHistory: Map<string, Date[]> = new Map();
  private detectionHistory: Array<{
    timestamp: Date;
    toolId: string;
    event: string;
    confidence: number;
  }> = [];

  // Pattern recognition
  private patternAnalyzer: PatternAnalyzer;
  private predictiveEngine: PredictiveEngine;

  private constructor(config?: Partial<DowntimeDetectionConfig>) {
    this.config = this.getDefaultConfig(config);
    this.patternAnalyzer = new PatternAnalyzer();
    this.predictiveEngine = new PredictiveEngine();
    this.initializeDefaultPatterns();
  }

  public static getInstance(config?: Partial<DowntimeDetectionConfig>): DowntimeDetectionSystem {
    if (!DowntimeDetectionSystem.instance) {
      DowntimeDetectionSystem.instance = new DowntimeDetectionSystem(config);
    }
    return DowntimeDetectionSystem.instance;
  }

  private getDefaultConfig(overrides?: Partial<DowntimeDetectionConfig>): DowntimeDetectionConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      enabled: true,
      detection: {
        consecutiveFailures: 3,
        timeWindow: 5, // minutes
        patterns: {
          enabled: true,
          learningEnabled: true,
          historicalDataDays: 30,
          confidenceThreshold: 0.7,
        },
        prediction: {
          enabled: isProduction,
          lookbackWindow: 24, // hours
          predictionWindow: 60, // minutes
          threshold: 0.8,
        },
      },
      alerting: {
        enabled: true,
        channels: this.getDefaultChannels(),
        escalation: {
          enabled: isProduction,
          levels: this.getDefaultEscalationLevels(),
          autoEscalate: true,
          escalateAfter: 15, // minutes
        },
        rateLimit: {
          enabled: true,
          maxAlertsPerHour: 10,
          cooldownPeriod: 5, // minutes
        },
        deduplication: {
          enabled: true,
          windowSize: 15, // minutes
          similarityThreshold: 0.8,
        },
      },
      recovery: {
        autoDetect: true,
        confirmAfter: 2,
        notifyOnRecovery: true,
        postRecoveryAnalysis: true,
      },
      ...overrides,
    };
  }

  private getDefaultChannels(): AlertChannel[] {
    return [
      {
        id: 'console',
        type: 'console',
        name: 'Console',
        enabled: true,
        config: { colors: true },
        filters: {},
      },
      {
        id: 'browser',
        type: 'browser',
        name: 'Browser Notifications',
        enabled: true,
        config: { requirePermission: true },
        filters: { severity: ['error', 'critical'] },
      },
      {
        id: 'analytics',
        type: 'analytics',
        name: 'Analytics',
        enabled: true,
        config: { tracking: true },
        filters: { severity: ['warning', 'error', 'critical'] },
      },
    ];
  }

  private getDefaultEscalationLevels(): EscalationLevel[] {
    return [
      {
        level: 1,
        name: 'Standard Alert',
        delay: 0,
        channels: ['console', 'browser'],
        severity: 'warning',
        autoResolve: false,
        notifyOnResolve: true,
      },
      {
        level: 2,
        name: 'Escalated Alert',
        delay: 15,
        channels: ['console', 'browser', 'analytics'],
        severity: 'error',
        autoResolve: false,
        notifyOnResolve: true,
      },
      {
        level: 3,
        name: 'Critical Alert',
        delay: 30,
        channels: ['console', 'browser', 'analytics'],
        severity: 'critical',
        autoResolve: false,
        notifyOnResolve: true,
      },
    ];
  }

  private initializeDefaultPatterns(): void {
    this.downtimePatterns = [
      {
        id: 'peak-load-failure',
        name: 'Peak Load Failure Pattern',
        description: 'Tools tend to fail during peak load hours',
        category: 'load',
        confidence: 0.8,
        frequency: 0,
        indicators: [
          { type: 'time_of_day', threshold: 0.8, weight: 0.4 },
          { type: 'concurrent_users', threshold: 100, weight: 0.3 },
          { type: 'response_time', threshold: 5000, weight: 0.3 },
        ],
        predictive: true,
        mitigation: 'Scale resources before peak hours',
        lastDetected: new Date(),
      },
      {
        id: 'dependency-cascade',
        name: 'Dependency Cascade Failure',
        description: 'Cascading failures when dependencies fail',
        category: 'dependency',
        confidence: 0.9,
        frequency: 0,
        indicators: [
          { type: 'dependency_failures', threshold: 2, weight: 0.5 },
          { type: 'error_rate', threshold: 50, weight: 0.3 },
          { type: 'response_time', threshold: 10000, weight: 0.2 },
        ],
        predictive: true,
        mitigation: 'Implement circuit breakers and fallback mechanisms',
        lastDetected: new Date(),
      },
    ];
  }

  public async initialize(): Promise<void> {
    console.log('🚨 Initializing Downtime Detection and Alerting System...');

    try {
      // Initialize channels
      await this.initializeChannels();

      // Load historical data for pattern learning
      if (this.config.detection.patterns.learningEnabled) {
        await this.loadHistoricalData();
      }

      // Start predictive engine if enabled
      if (this.config.detection.prediction.enabled) {
        await this.startPredictiveEngine();
      }

      console.log('✅ Downtime Detection and Alerting System initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Downtime Detection System:', error);
      throw error;
    }
  }

  private async initializeChannels(): Promise<void> {
    console.log('📡 Initializing alert channels...');

    for (const channel of this.config.alerting.channels) {
      this.channels.set(channel.id, channel);

      if (channel.type === 'browser' && channel.enabled) {
        await this.requestBrowserNotificationPermission();
      }
    }

    console.log(`✅ Initialized ${this.channels.size} alert channels`);
  }

  private async requestBrowserNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log(`Browser notification permission: ${permission}`);
    }
  }

  private async loadHistoricalData(): Promise<void> {
    console.log('📚 Loading historical data for pattern learning...');
    // Placeholder for loading historical incidents and alerts
    // In a real implementation, this would load from storage
  }

  private async startPredictiveEngine(): Promise<void> {
    console.log('🔮 Starting predictive engine...');
    // Start periodic prediction analysis
    setInterval(async () => {
      await this.runPredictiveAnalysis();
    }, this.config.detection.prediction.predictionWindow * 60 * 1000);
  }

  public async processHealthCheckResult(result: HealthCheckResult): Promise<void> {
    if (!this.config.enabled) return;

    const toolId = result.toolId;
    const timestamp = new Date();

    // Update failure tracking
    this.updateFailureTracking(toolId, result.status === 'healthy', timestamp);

    // Check for downtime patterns
    const patternMatch = await this.checkDowntimePatterns(result);

    // Detect downtime
    const downtimeDetected = await this.detectDowntime(result, patternMatch);

    if (downtimeDetected) {
      await this.handleDowntimeDetection(result, patternMatch);
    }

    // Check for recovery
    if (result.status === 'healthy') {
      await this.checkForRecovery(result);
    }

    // Update detection history
    this.detectionHistory.push({
      timestamp,
      toolId,
      event: result.status === 'healthy' ? 'healthy' : 'unhealthy',
      confidence: patternMatch?.confidence || 0,
    });

    // Cleanup old history
    this.cleanupHistory();
  }

  private updateFailureTracking(toolId: string, isHealthy: boolean, timestamp: Date): void {
    if (!this.consecutiveFailures.has(toolId)) {
      this.consecutiveFailures.set(toolId, 0);
      this.failureHistory.set(toolId, []);
    }

    if (isHealthy) {
      this.consecutiveFailures.set(toolId, 0);
    } else {
      this.consecutiveFailures.set(toolId, (this.consecutiveFailures.get(toolId) || 0) + 1);
      this.failureHistory.get(toolId)!.push(timestamp);
    }

    // Clean old failure history
    const cutoff = new Date(timestamp.getTime() - this.config.detection.timeWindow * 60 * 1000);
    const history = this.failureHistory.get(toolId)!.filter(date => date >= cutoff);
    this.failureHistory.set(toolId, history);
  }

  private async checkDowntimePatterns(result: HealthCheckResult): Promise<DowntimePattern | null> {
    if (!this.config.detection.patterns.enabled) return null;

    for (const pattern of this.downtimePatterns) {
      const match = await this.patternAnalyzer.matchPattern(pattern, result, this.detectionHistory);
      if (match && match.confidence >= this.config.detection.patterns.confidenceThreshold) {
        return pattern;
      }
    }

    return null;
  }

  private async detectDowntime(result: HealthCheckResult, patternMatch: DowntimePattern | null): Promise<boolean> {
    const toolId = result.toolId;
    const consecutiveFailures = this.consecutiveFailures.get(toolId) || 0;

    // Basic detection: consecutive failures
    if (consecutiveFailures >= this.config.detection.consecutiveFailures) {
      return true;
    }

    // Time window detection
    const failureHistory = this.failureHistory.get(toolId) || [];
    if (failureHistory.length >= this.config.detection.consecutiveFailures) {
      return true;
    }

    // Pattern-based detection
    if (patternMatch && patternMatch.predictive) {
      return true;
    }

    return false;
  }

  private async handleDowntimeDetection(result: HealthCheckResult, pattern: DowntimePattern | null): Promise<void> {
    const toolId = result.toolId;

    // Check if incident already exists
    if (this.activeIncidents.has(toolId)) {
      return; // Incident already being handled
    }

    // Create new incident
    const incident = await this.createIncident(result, pattern);
    this.activeIncidents.set(toolId, incident);

    // Create and send alert
    const alert = await this.createAlert(incident, 'downtime');
    await this.sendAlert(alert);

    // Check for escalation
    if (this.config.alerting.escalation.enabled) {
      this.scheduleEscalation(incident);
    }

    console.warn(`🚨 Downtime detected: ${incident.toolName} - ${incident.id}`);
  }

  private async createIncident(result: HealthCheckResult, pattern: DowntimePattern | null): Promise<DowntimeIncident> {
    const incidentId = `incident-${Date.now()}-${result.toolId}`;

    const incident: DowntimeIncident = {
      id: incidentId,
      toolId: result.toolId,
      toolName: result.toolName,
      startTime: new Date(),
      status: 'active',
      severity: this.determineIncidentSeverity(result),
      impact: {
        affectedUsers: 0, // Would be estimated from analytics
        affectedFeatures: [],
        businessImpact: this.assessBusinessImpact(result),
      },
      cause: {
        category: this.categorizeIncidentCause(result, pattern),
        description: this.generateIncidentDescription(result, pattern),
        rootCause: pattern?.description,
      },
      resolution: {},
      notifications: [],
    };

    return incident;
  }

  private determineIncidentSeverity(result: HealthCheckResult): 'minor' | 'major' | 'critical' {
    const consecutiveFailures = this.consecutiveFailures.get(result.toolId) || 0;
    const errorRate = result.errorRate;

    if (consecutiveFailures >= 10 || errorRate >= 95) {
      return 'critical';
    } else if (consecutiveFailures >= 5 || errorRate >= 50) {
      return 'major';
    } else {
      return 'minor';
    }
  }

  private assessBusinessImpact(result: HealthCheckResult): string {
    const isPopularTool = result.toolId.includes('formatter') || result.toolId.includes('validator');
    const isCriticalTool = result.toolId.includes('executor') || result.toolId.includes('converter');

    if (isCriticalTool) return 'Critical functionality unavailable';
    if (isPopularTool) return 'High-impact tool unavailable';
    return 'Tool functionality unavailable';
  }

  private categorizeIncidentCause(result: HealthCheckResult, pattern: DowntimePattern | null): 'performance' | 'availability' | 'infrastructure' | 'code' | 'external' {
    if (pattern) return pattern.category;

    if (result.details.errors.some(e => e.type.includes('timeout'))) {
      return 'performance';
    } else if (result.details.errors.some(e => e.type.includes('network'))) {
      return 'infrastructure';
    } else if (result.details.errors.some(e => e.type.includes('code'))) {
      return 'code';
    } else {
      return 'availability';
    }
  }

  private generateIncidentDescription(result: HealthCheckResult, pattern: DowntimePattern | null): string {
    if (pattern) {
      return `Pattern-based incident: ${pattern.description}`;
    }

    const consecutiveFailures = this.consecutiveFailures.get(result.toolId) || 0;
    return `Health check failure after ${consecutiveFailures} consecutive attempts`;
  }

  private async createAlert(incident: DowntimeIncident, type: 'downtime' | 'recovery' | 'escalation'): Promise<UptimeAlert> {
    const context = await this.createAlertContext(incident);
    const metadata = await this.createAlertMetadata(incident);

    const alert: UptimeAlert = {
      id: `alert-${Date.now()}-${incident.id}`,
      type: type === 'recovery' ? 'recovery' : 'downtime',
      severity: this.mapIncidentSeverityToAlertSeverity(incident.severity),
      toolId: incident.toolId,
      toolName: incident.toolName,
      title: this.generateAlertTitle(incident, type),
      message: this.generateAlertMessage(incident, type, context),
      timestamp: new Date(),
      resolved: type === 'recovery',
      acknowledged: false,
      escalation: {
        level: 1,
        maxLevel: this.config.alerting.escalation.levels.length,
      },
      metadata: {
        incidentId: incident.id,
        ...metadata,
      },
    };

    return alert;
  }

  private async createAlertContext(incident: DowntimeIncident): Promise<AlertContext> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    return {
      environment: process.env.NODE_ENV || 'development',
      timeOfDay: `${hour}:00`,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      businessHours: hour >= 9 && hour <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5,
      recentIncidents: this.activeIncidents.size,
      systemLoad: 0, // Would be calculated from system metrics
      userImpact: {
        estimatedAffectedUsers: this.estimateAffectedUsers(incident),
        criticality: this.assessUserImpactCriticality(incident),
      },
    };
  }

  private async createAlertMetadata(incident: DowntimeIncident): Promise<AlertMetadata> {
    const fingerprint = this.generateAlertFingerprint(incident);
    const previousAlerts = this.findPreviousAlerts(fingerprint);
    const relatedIncidents = this.findRelatedIncidents(incident);

    return {
      correlationId: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fingerprint,
      previousAlerts,
      relatedIncidents,
      suppressed: false,
      autoResolved: false,
      acknowledged: false,
    };
  }

  private generateAlertFingerprint(incident: DowntimeIncident): string {
    // Create a fingerprint based on incident characteristics
    const data = `${incident.toolId}-${incident.cause.category}-${incident.severity}`;
    return btoa(data).substr(0, 16);
  }

  private findPreviousAlerts(fingerprint: string): string[] {
    return this.recentAlerts
      .filter(alert => alert.metadata?.fingerprint === fingerprint)
      .map(alert => alert.id);
  }

  private findRelatedIncidents(incident: DowntimeIncident): string[] {
    // Find incidents with similar characteristics
    return Array.from(this.activeIncidents.values())
      .filter(inc =>
        inc.toolId === incident.toolId ||
        inc.cause.category === incident.cause.category
      )
      .map(inc => inc.id);
  }

  private estimateAffectedUsers(incident: DowntimeIncident): number {
    // Estimate based on tool popularity and time of day
    const baseUsers = 100; // Base estimate
    const popularityMultiplier = incident.toolName.includes('Formatter') ? 2 : 1;
    const timeMultiplier = this.isPeakHours() ? 1.5 : 0.5;

    return Math.round(baseUsers * popularityMultiplier * timeMultiplier);
  }

  private assessUserImpactCriticality(incident: DowntimeIncident): 'low' | 'medium' | 'high' | 'critical' {
    if (incident.severity === 'critical') return 'critical';
    if (incident.severity === 'major') return 'high';
    if (incident.toolId.includes('executor') || incident.toolId.includes('converter')) return 'medium';
    return 'low';
  }

  private isPeakHours(): boolean {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    return (hour >= 10 && hour <= 16) && (dayOfWeek >= 1 && dayOfWeek <= 5);
  }

  private mapIncidentSeverityToAlertSeverity(severity: 'minor' | 'major' | 'critical'): 'info' | 'warning' | 'error' | 'critical' {
    switch (severity) {
      case 'minor': return 'warning';
      case 'major': return 'error';
      case 'critical': return 'critical';
      default: return 'warning';
    }
  }

  private generateAlertTitle(incident: DowntimeIncident, type: 'downtime' | 'recovery' | 'escalation'): string {
    switch (type) {
      case 'downtime':
        return `🚨 Tool Downtime: ${incident.toolName}`;
      case 'recovery':
        return `✅ Tool Recovery: ${incident.toolName}`;
      case 'escalation':
        return `🔥 Escalated Alert: ${incident.toolName}`;
      default:
        return `Alert: ${incident.toolName}`;
    }
  }

  private generateAlertMessage(incident: DowntimeIncident, type: 'downtime' | 'recovery' | 'escalation', context: AlertContext): string {
    const timeStr = incident.startTime.toLocaleTimeString();

    switch (type) {
      case 'downtime':
        return `${incident.toolName} has been unavailable since ${timeStr}. ${incident.impact.businessImpact}. Severity: ${incident.severity}`;
      case 'recovery':
        return `${incident.toolName} has recovered and is now available. Downtime duration: ${this.formatDuration(Date.now() - incident.startTime.getTime())}`;
      case 'escalation':
        return `${incident.toolName} incident has been escalated to ${incident.severity} severity. Estimated ${context.userImpact.estimatedAffectedUsers} users affected.`;
      default:
        return `Alert for ${incident.toolName}`;
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private async sendAlert(alert: UptimeAlert): Promise<void> {
    // Check rate limiting
    if (this.config.alerting.rateLimit.enabled && this.isRateLimited(alert)) {
      console.warn(`Alert rate limited: ${alert.title}`);
      return;
    }

    // Check deduplication
    if (this.config.alerting.deduplication.enabled && this.isDuplicate(alert)) {
      console.warn(`Alert deduplicated: ${alert.title}`);
      return;
    }

    // Add to recent alerts
    this.recentAlerts.unshift(alert);
    if (this.recentAlerts.length > 100) {
      this.recentAlerts = this.recentAlerts.slice(0, 100);
    }

    // Send to enabled channels
    for (const channel of this.config.alerting.channels) {
      if (channel.enabled && this.shouldSendToChannel(alert, channel)) {
        await this.sendToChannel(alert, channel);
      }
    }

    console.log(`📢 Alert sent: ${alert.title}`);
  }

  private isRateLimited(alert: UptimeAlert): boolean {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentAlerts = this.recentAlerts.filter(a =>
      a.timestamp >= oneHourAgo &&
      a.toolId === alert.toolId
    );

    return recentAlerts.length >= this.config.alerting.rateLimit.maxAlertsPerHour;
  }

  private isDuplicate(alert: UptimeAlert): boolean {
    const windowSize = this.config.alerting.deduplication.windowSize * 60 * 1000;
    const cutoff = new Date(Date.now() - windowSize);

    const similarAlerts = this.recentAlerts.filter(a =>
      a.timestamp >= cutoff &&
      a.toolId === alert.toolId &&
      a.type === alert.type &&
      this.calculateAlertSimilarity(a, alert) >= this.config.alerting.deduplication.similarityThreshold
    );

    return similarAlerts.length > 0;
  }

  private calculateAlertSimilarity(alert1: UptimeAlert, alert2: UptimeAlert): number {
    // Simple similarity calculation based on title and message
    const titleSimilarity = this.calculateStringSimilarity(alert1.title, alert2.title);
    const messageSimilarity = this.calculateStringSimilarity(alert1.message, alert2.message);

    return (titleSimilarity + messageSimilarity) / 2;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private shouldSendToChannel(alert: UptimeAlert, channel: AlertChannel): boolean {
    const filters = channel.filters;

    if (filters.severity && !filters.severity.includes(alert.severity)) {
      return false;
    }

    if (filters.tools && !filters.tools.includes(alert.toolId || '')) {
      return false;
    }

    return true;
  }

  private async sendToChannel(alert: UptimeAlert, channel: AlertChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'console':
          this.sendToConsole(alert, channel.config);
          break;
        case 'browser':
          await this.sendToBrowser(alert, channel.config);
          break;
        case 'email':
          await this.sendToEmail(alert, channel.config);
          break;
        case 'webhook':
          await this.sendToWebhook(alert, channel.config);
          break;
        case 'analytics':
          await this.sendToAnalytics(alert, channel.config);
          break;
        default:
          console.warn(`Unknown channel type: ${channel.type}`);
      }
    } catch (error) {
      console.error(`Failed to send alert to ${channel.name}:`, error);
    }
  }

  private sendToConsole(alert: UptimeAlert, config: any): void {
    const colors = config.colors || false;
    const colorCode = colors ? this.getConsoleColor(alert.severity) : '';
    const resetCode = colors ? '\x1b[0m' : '';

    console.log(`${colorCode}[${alert.severity.toUpperCase()}] ${alert.title}${resetCode}`);
    console.log(`${colorCode}  ${alert.message}${resetCode}`);
    console.log(`${colorCode}  Time: ${alert.timestamp.toISOString()}${resetCode}`);
    if (alert.metadata?.incidentId) {
      console.log(`${colorCode}  Incident: ${alert.metadata.incidentId}${resetCode}`);
    }
  }

  private getConsoleColor(severity: string): string {
    switch (severity) {
      case 'critical': return '\x1b[41m'; // Red background
      case 'error': return '\x1b[31m'; // Red text
      case 'warning': return '\x1b[33m'; // Yellow text
      case 'info': return '\x1b[36m'; // Cyan text
      default: return '\x1b[0m'; // Reset
    }
  }

  private async sendToBrowser(alert: UptimeAlert, config: any): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.metadata?.incidentId,
        requireInteraction: alert.severity === 'critical',
      });

      if (alert.severity !== 'critical') {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }

  private async sendToEmail(alert: UptimeAlert, config: any): Promise<void> {
    // Placeholder for email sending
    console.log(`Email alert would be sent to ${config.to}: ${alert.title}`);
  }

  private async sendToWebhook(alert: UptimeAlert, config: any): Promise<void> {
    // Placeholder for webhook sending
    console.log(`Webhook alert would be sent to ${config.url}: ${alert.title}`);
  }

  private async sendToAnalytics(alert: UptimeAlert, config: any): Promise<void> {
    // Placeholder for analytics tracking
    console.log(`Analytics alert tracked: ${alert.title}`);
  }

  private scheduleEscalation(incident: DowntimeIncident): Promise<void> {
    if (!this.config.alerting.escalation.autoEscalate) {
      return Promise.resolve();
    }

    for (const level of this.config.alerting.escalation.levels) {
      if (level.delay > 0) {
        setTimeout(async () => {
          if (this.activeIncidents.has(incident.toolId) && incident.status === 'active') {
            await this.escalateIncident(incident, level);
          }
        }, level.delay * 60 * 1000);
      }
    }

    return Promise.resolve();
  }

  private async escalateIncident(incident: DowntimeIncident, level: EscalationLevel): Promise<void> {
    // Update incident severity
    incident.severity = level.name.includes('Critical') ? 'critical' :
                       level.name.includes('Escalated') ? 'major' : 'minor';

    // Create escalation alert
    const alert = await this.createAlert(incident, 'escalation');
    alert.severity = level.severity;
    alert.escalation.level = level.level;

    // Send to specific channels for this level
    for (const channelId of level.channels) {
      const channel = this.channels.get(channelId);
      if (channel && channel.enabled) {
        await this.sendToChannel(alert, channel);
      }
    }

    console.warn(`🔥 Incident escalated: ${incident.toolName} to level ${level.level}`);
  }

  private async checkForRecovery(result: HealthCheckResult): Promise<void> {
    const toolId = result.toolId;
    const incident = this.activeIncidents.get(toolId);

    if (!incident || incident.status !== 'active') {
      return;
    }

    const consecutiveSuccesses = this.getConsecutiveSuccesses(toolId);

    if (consecutiveSuccesses >= this.config.recovery.confirmAfter) {
      await this.handleRecovery(incident, result);
    }
  }

  private getConsecutiveSuccesses(toolId: string): number {
    // This would track consecutive successful health checks
    // For now, return a simplified calculation
    return this.consecutiveFailures.get(toolId) === 0 ? 1 : 0;
  }

  private async handleRecovery(incident: DowntimeIncident, result: HealthCheckResult): Promise<void> {
    // Update incident
    incident.endTime = new Date();
    incident.duration = incident.endTime.getTime() - incident.startTime.getTime();
    incident.status = 'resolved';
    incident.resolution = {
      action: 'Automatic recovery detected',
      resolutionTime: incident.duration,
    };

    // Remove from active incidents
    this.activeIncidents.delete(incident.toolId);

    // Send recovery notification
    if (this.config.recovery.notifyOnRecovery) {
      const alert = await this.createAlert(incident, 'recovery');
      await this.sendAlert(alert);
    }

    // Post-recovery analysis
    if (this.config.recovery.postRecoveryAnalysis) {
      await this.performPostRecoveryAnalysis(incident);
    }

    console.log(`✅ Incident resolved: ${incident.toolName} (downtime: ${this.formatDuration(incident.duration || 0)})`);
  }

  private async performPostRecoveryAnalysis(incident: DowntimeIncident): Promise<void> {
    // Analyze the incident to improve detection and prevention
    console.log(`🔍 Performing post-recovery analysis for ${incident.toolName}...`);

    // Update patterns based on this incident
    if (this.config.detection.patterns.learningEnabled) {
      await this.updatePatterns(incident);
    }
  }

  private async updatePatterns(incident: DowntimeIncident): Promise<void> {
    // Update pattern frequency and confidence
    for (const pattern of this.downtimePatterns) {
      if (pattern.category === incident.cause.category) {
        pattern.frequency++;
        pattern.lastDetected = incident.startTime;

        // Update confidence based on successful detection
        if (incident.cause.rootCause?.includes(pattern.description)) {
          pattern.confidence = Math.min(1.0, pattern.confidence + 0.1);
        }
      }
    }
  }

  private async runPredictiveAnalysis(): Promise<void> {
    if (!this.config.detection.prediction.enabled) return;

    try {
      const predictions = await this.predictiveEngine.generatePredictions(
        this.detectionHistory,
        this.downtimePatterns
      );

      for (const prediction of predictions) {
        if (prediction.confidence >= this.config.detection.prediction.threshold) {
          await this.handlePrediction(prediction);
        }
      }
    } catch (error) {
      console.error('Predictive analysis failed:', error);
    }
  }

  private async handlePrediction(prediction: DowntimePrediction): Promise<void> {
    console.warn(`🔮 Predictive alert: ${prediction.toolName} - ${prediction.confidence}% confidence`);

    // Store prediction
    this.predictions.push(prediction);

    // Send predictive alert
    const alert: UptimeAlert = {
      id: `alert-prediction-${prediction.id}`,
      type: 'downtime',
      severity: 'warning',
      toolId: prediction.toolId,
      toolName: prediction.toolName,
      title: `⚠️ Predicted Downtime: ${prediction.toolName}`,
      message: `Downtime predicted with ${Math.round(prediction.confidence * 100)}% confidence. Expected: ${prediction.predictedStartTime.toLocaleTimeString()} - ${prediction.predictedEndTime.toLocaleTimeString()}`,
      timestamp: new Date(),
      resolved: false,
      acknowledged: false,
      escalation: {
        level: 0,
        maxLevel: 1,
      },
      metadata: {
        correlationId: prediction.id,
        prediction: true,
      },
    };

    await this.sendAlert(alert);
  }

  private cleanupHistory(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    this.detectionHistory = this.detectionHistory.filter(entry => entry.timestamp >= cutoff);

    // Clean old alerts
    const alertCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    this.recentAlerts = this.recentAlerts.filter(alert => alert.timestamp >= alertCutoff);
  }

  // Public API methods
  public getActiveIncidents(): DowntimeIncident[] {
    return Array.from(this.activeIncidents.values());
  }

  public getRecentAlerts(hours?: number): UptimeAlert[] {
    if (!hours) return [...this.recentAlerts];

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.recentAlerts.filter(alert => alert.timestamp >= cutoff);
  }

  public getDowntimePatterns(): DowntimePattern[] {
    return [...this.downtimePatterns];
  }

  public getPredictions(): DowntimePrediction[] {
    return [...this.predictions];
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<void> {
    const alert = this.recentAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
    }
    return Promise.resolve();
  }

  public addChannel(channel: AlertChannel): void {
    this.channels.set(channel.id, channel);
  }

  public removeChannel(channelId: string): void {
    this.channels.delete(channelId);
  }

  public updateConfig(config: Partial<DowntimeDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): DowntimeDetectionConfig {
    return { ...this.config };
  }
}

// Supporting classes
class PatternAnalyzer {
  async matchPattern(pattern: DowntimePattern, result: HealthCheckResult, history: any[]): Promise<{ pattern: DowntimePattern; confidence: number } | null> {
    // Simplified pattern matching
    let confidence = 0;

    for (const indicator of pattern.indicators) {
      switch (indicator.type) {
        case 'time_of_day':
          const hour = new Date().getHours();
          if (hour >= 10 && hour <= 16) confidence += indicator.weight;
          break;
        case 'response_time':
          if (result.responseTime > indicator.threshold) confidence += indicator.weight;
          break;
        case 'error_rate':
          if (result.errorRate > indicator.threshold) confidence += indicator.weight;
          break;
      }
    }

    return confidence >= 0.5 ? { pattern, confidence } : null;
  }
}

class PredictiveEngine {
  async generatePredictions(history: any[], patterns: DowntimePattern[]): Promise<DowntimePrediction[]> {
    // Simplified predictive analysis
    const predictions: DowntimePrediction[] = [];

    // Look for patterns in history that suggest future downtime
    const recentFailures = history.filter(entry =>
      entry.event === 'unhealthy' &&
      entry.timestamp > new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
    );

    if (recentFailures.length >= 2) {
      // Predict potential continued issues
      const toolFailures = recentFailures.reduce((acc, entry) => {
        acc[entry.toolId] = (acc[entry.toolId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      for (const [toolId, count] of Object.entries(toolFailures)) {
        if (count >= 2) {
          predictions.push({
            id: `pred-${Date.now()}-${toolId}`,
            toolId,
            toolName: `Tool ${toolId}`, // Would get actual name
            predictedAt: new Date(),
            predictedStartTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
            predictedEndTime: new Date(Date.now() + 90 * 60 * 1000), // 90 minutes from now
            confidence: 0.8,
            riskFactors: [
              { factor: 'Recent failures', impact: 0.7, confidence: 0.9 },
              { factor: 'Pattern recurrence', impact: 0.3, confidence: 0.7 },
            ],
            recommendedActions: ['Monitor closely', 'Prepare fallback'],
            status: 'predicted',
          });
        }
      }
    }

    return predictions;
  }
}

/**
 * Recovery Time Tracking System
    * Comprehensive tracking and analysis of system recovery times and effectiveness
    * Features MTTR/MTBF calculation, recovery pattern analysis, and improvement recommendations
    */

import { DowntimeIncident, HealthCheckResult } from './uptime-monitoring-core';
import { PerformanceDegradation } from './performance-degradation-monitor';

export interface RecoveryTimeConfig {
  enabled: boolean;
  tracking: {
    autoDetectRecovery: boolean;
    confirmAfter: number; // consecutive successful checks
    gracePeriod: number; // minutes before considering recovered
    partialRecoveryThreshold: number; // percentage of functionality
  };
  analysis: {
    calculateMTTR: boolean; // Mean Time To Recovery
    calculateMTBF: boolean; // Mean Time Between Failures
    trackPartialRecovery: boolean;
    analyzeRecoveryPatterns: boolean;
    benchmarkPeriod: number; // days
  };
  alerting: {
    enabled: boolean;
    onRecovery: boolean;
    onSlowRecovery: boolean;
    onFailureRecovery: boolean;
    channels: Array<'console' | 'browser' | 'email' | 'webhook'>;
  };
  thresholds: {
    fastRecovery: number; // minutes
    acceptableRecovery: number; // minutes
    slowRecovery: number; // minutes
    criticalRecovery: number; // minutes
    failureThreshold: number; // percentage of incidents that fail to recover
  };
  improvement: {
    enabled: boolean;
    trackRecoveryEffectiveness: boolean;
    identifyRecoveryBottlenecks: boolean;
    generateOptimizationSuggestions: boolean;
  };
}

export interface RecoveryEvent {
  id: string;
  incidentId: string;
  toolId: string;
  toolName: string;
  type: 'partial' | 'full' | 'failed' | 'degraded';
  detectedAt: Date;
  confirmedAt: Date;
  duration: number; // milliseconds
  recoveryMethod: 'automatic' | 'manual' | 'hybrid';
  confidence: number; // 0-1
  metrics: {
    downtimeDuration: number;
    recoveryTime: number;
    functionalityRestored: number; // percentage
    performanceLevel: number; // percentage of normal
    qualityScore: number; // 0-100
  };
  context: {
    trigger: string;
    rootCause: string;
    dependenciesInvolved: string[];
    humanIntervention: boolean;
    automatedActions: string[];
  };
  validation: {
    healthChecksPassed: number;
    functionalTestsPassed: number;
    userVerification: boolean;
    postRecoveryIncidents: number;
  };
  effectiveness: {
    score: number; // 0-100
    userSatisfaction: number; // 0-100
    businessImpact: 'low' | 'medium' | 'high' | 'critical';
    recurrenceRisk: number; // 0-1
  };
  learning: {
    newPatterns: boolean;
    improvementOpportunities: string[];
    preventiveMeasures: string[];
    addToRunbook: boolean;
  };
}

export interface RecoveryMetrics {
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  summary: {
    totalIncidents: number;
    recoveredIncidents: number;
    failedRecoveries: number;
    recoveryRate: number;
    averageRecoveryTime: number;
  };
  mttr: {
    overall: number; // Mean Time To Recovery
    byTool: Record<string, number>;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    trend: Array<{ date: Date; mttr: number }>;
  };
  mtbf: {
    overall: number; // Mean Time Between Failures
    byTool: Record<string, number>;
    byCategory: Record<string, number>;
    trend: Array<{ date: Date; mtbf: number }>;
  };
  distribution: {
    fastRecoveries: number; // < threshold
    acceptableRecoveries: number;
    slowRecoveries: number;
    criticalRecoveries: number;
    average: number;
    median: number;
    p95: number;
    p99: number;
  };
  patterns: {
    timeOfDayPattern: Array<{ hour: number; avgRecoveryTime: number; incidents: number }>;
    dayOfWeekPattern: Array<{ day: string; avgRecoveryTime: number; incidents: number }>;
    seasonalPattern: Array<{ month: string; avgRecoveryTime: number; incidents: number }>;
  };
  effectiveness: {
    recoveryScore: number; // 0-100
    userSatisfaction: number; // 0-100
    businessImpactMitigation: number; // 0-100
    learningRate: number; // 0-100
  };
}

export interface RecoveryPattern {
  id: string;
  name: string;
  description: string;
  category: 'temporal' | 'systematic' | 'tool_specific' | 'environmental';
  confidence: number; // 0-1
  frequency: number;
  indicators: Array<{
    indicator: string;
    value: number;
    weight: number;
  }>;
  typicalRecoveryTime: number;
  successFactors: string[];
  blockers: string[];
  improvementOpportunities: string[];
  lastObserved: Date;
}

export interface RecoveryAnalysis {
  period: {
    start: Date;
    end: Date;
  };
  overallPerformance: {
    recoveryScore: number;
    mttr: number;
    mtbf: number;
    availabilityImprovement: number;
  };
  bottlenecks: Array<{
    category: string;
    impact: number;
    description: string;
    incidents: number;
    averageDelay: number;
  }>;
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'process' | 'technology' | 'people' | 'tools';
    title: string;
    description: string;
    expectedImprovement: {
      mttrReduction: number; // percentage
      recoveryRateIncrease: number; // percentage
      riskReduction: number; // percentage
    };
    implementation: {
      effort: 'low' | 'medium' | 'high';
      timeline: string;
      dependencies: string[];
    };
  }>;
  predictions: {
    nextWeekMTTR: number;
    nextMonthMTTR: number;
    riskFactors: string[];
    confidence: number;
  };
}

export interface RecoveryRunbook {
  id: string;
  toolId: string;
  toolName: string;
  incidentType: string;
  version: string;
  lastUpdated: Date;
  effectiveness: {
    successRate: number;
    averageRecoveryTime: number;
    userSatisfaction: number;
  };
  steps: Array<{
    order: number;
    action: string;
    command?: string;
    expectedTime: number;
    dependencies: string[];
    rollback: string;
    verification: string;
  }>;
  prerequisites: string[];
  resources: {
    personnel: string[];
    tools: string[];
    permissions: string[];
  };
  escalation: {
    when: string;
    who: string[];
    how: string;
  };
  postRecovery: {
    verification: string[];
    monitoring: string[];
    communication: string[];
  };
}

export class RecoveryTimeTracker {
  private static instance: RecoveryTimeTracker;
  private config: RecoveryTimeConfig;
  private recoveryEvents: RecoveryEvent[] = [];
  private activeIncidents: Map<string, DowntimeIncident> = new Map();
  private recoveryPatterns: RecoveryPattern[] = [];
  private runbooks: Map<string, RecoveryRunbook> = new Map();
  private consecutiveSuccesses: Map<string, number> = new Map();

  // Analysis state
  private lastAnalysis = new Date();
  private metrics: RecoveryMetrics | null = null;

  private constructor(config?: Partial<RecoveryTimeConfig>) {
    this.config = this.getDefaultConfig(config);
    this.initializeDefaultPatterns();
  }

  public static getInstance(config?: Partial<RecoveryTimeConfig>): RecoveryTimeTracker {
    if (!RecoveryTimeTracker.instance) {
      RecoveryTimeTracker.instance = new RecoveryTimeTracker(config);
    }
    return RecoveryTimeTracker.instance;
  }

  private getDefaultConfig(overrides?: Partial<RecoveryTimeConfig>): RecoveryTimeConfig {
    return {
      enabled: true,
      tracking: {
        autoDetectRecovery: true,
        confirmAfter: 2,
        gracePeriod: 5, // 5 minutes
        partialRecoveryThreshold: 80, // 80% functionality
      },
      analysis: {
        calculateMTTR: true,
        calculateMTBF: true,
        trackPartialRecovery: true,
        analyzeRecoveryPatterns: true,
        benchmarkPeriod: 30, // 30 days
      },
      alerting: {
        enabled: true,
        onRecovery: true,
        onSlowRecovery: true,
        onFailureRecovery: true,
        channels: ['console', 'browser'],
      },
      thresholds: {
        fastRecovery: 5, // 5 minutes
        acceptableRecovery: 15, // 15 minutes
        slowRecovery: 60, // 1 hour
        criticalRecovery: 240, // 4 hours
        failureThreshold: 10, // 10% of incidents
      },
      improvement: {
        enabled: true,
        trackRecoveryEffectiveness: true,
        identifyRecoveryBottlenecks: true,
        generateOptimizationSuggestions: true,
      },
      ...overrides,
    };
  }

  private initializeDefaultPatterns(): void {
    this.recoveryPatterns = [
      {
        id: 'auto-healing-pattern',
        name: 'Auto-Healing Recovery',
        description: 'Incidents that recover automatically without intervention',
        category: 'systematic',
        confidence: 0.9,
        frequency: 0,
        indicators: [
          { indicator: 'automatic_recovery', value: 1, weight: 0.8 },
          { indicator: 'no_human_intervention', value: 1, weight: 0.7 },
        ],
        typicalRecoveryTime: 2 * 60 * 1000, // 2 minutes
        successFactors: ['Circuit breakers', 'Retry mechanisms', 'Health checks'],
        blockers: ['Complete system failure', 'Database corruption'],
        improvementOpportunities: ['Expand auto-healing coverage', 'Improve detection sensitivity'],
        lastObserved: new Date(),
      },
      {
        id: 'manual-intervention-pattern',
        name: 'Manual Intervention Recovery',
        description: 'Incidents requiring manual intervention for recovery',
        category: 'people',
        confidence: 0.8,
        frequency: 0,
        indicators: [
          { indicator: 'human_intervention', value: 1, weight: 0.9 },
          { indicator: 'escalation_required', value: 1, weight: 0.6 },
        ],
        typicalRecoveryTime: 30 * 60 * 1000, // 30 minutes
        successFactors: ['Experienced team', 'Clear procedures', 'Good documentation'],
        blockers: ['Lack of expertise', 'Unclear procedures', 'System complexity'],
        improvementOpportunities: ['Training programs', 'Better documentation', 'Automation of manual steps'],
        lastObserved: new Date(),
      },
    ];
  }

  public async initialize(): Promise<void> {
    console.log('🔄 Initializing Recovery Time Tracking System...');

    try {
      // Load historical data
      await this.loadHistoricalData();

      // Calculate initial metrics
      await this.calculateRecoveryMetrics();

      console.log('✅ Recovery Time Tracking System initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Recovery Time Tracking System:', error);
      throw error;
    }
  }

  private async loadHistoricalData(): Promise<void> {
    console.log('📚 Loading historical recovery data...');
    // In a real implementation, this would load from storage/database
  }

  public async trackIncidentStart(incident: DowntimeIncident): Promise<void> {
    this.activeIncidents.set(incident.id, incident);
    this.consecutiveSuccesses.set(incident.toolId, 0);

    console.log(`📊 Tracking incident start: ${incident.toolName} - ${incident.id}`);
  }

  public async processHealthCheck(result: HealthCheckResult): Promise<void> {
    if (!this.config.enabled) return;

    const toolId = result.toolId;

    // Update consecutive successes
    if (result.status === 'healthy') {
      this.consecutiveSuccesses.set(toolId, (this.consecutiveSuccesses.get(toolId) || 0) + 1);
    } else {
      this.consecutiveSuccesses.set(toolId, 0);
    }

    // Check for recovery opportunities
    await this.checkForRecovery(result);
  }

  private async checkForRecovery(result: HealthCheckResult): Promise<void> {
    const toolId = result.toolId;
    const consecutiveSuccesses = this.consecutiveSuccesses.get(toolId) || 0;

    // Find active incidents for this tool
    const activeIncidents = Array.from(this.activeIncidents.values())
      .filter(incident => incident.toolId === toolId && incident.status === 'active');

    for (const incident of activeIncidents) {
      if (consecutiveSuccesses >= this.config.tracking.confirmAfter) {
        await this.handleRecovery(incident, result);
      }
    }
  }

  private async handleRecovery(incident: DowntimeIncident, result: HealthCheckResult): Promise<void> {
    const recoveryTime = Date.now() - incident.startTime.getTime();
    const toolId = incident.toolId;

    // Determine recovery type
    const recoveryType = await this.determineRecoveryType(incident, result, recoveryTime);

    // Create recovery event
    const recoveryEvent: RecoveryEvent = {
      id: `recovery-${Date.now()}-${incident.id}`,
      incidentId: incident.id,
      toolId: incident.toolId,
      toolName: incident.toolName,
      type: recoveryType,
      detectedAt: new Date(),
      confirmedAt: new Date(),
      duration: recoveryTime,
      recoveryMethod: await this.determineRecoveryMethod(incident, recoveryTime),
      confidence: await this.calculateRecoveryConfidence(incident, result),
      metrics: await this.calculateRecoveryMetrics(incident, result, recoveryTime),
      context: await this.getRecoveryContext(incident, result),
      validation: await this.validateRecovery(incident, result),
      effectiveness: await this.assessRecoveryEffectiveness(incident, result, recoveryTime),
      learning: await this.extractLearningOpportunities(incident, result, recoveryTime),
    };

    // Update incident
    incident.endTime = new Date();
    incident.duration = recoveryTime;
    incident.status = 'resolved';
    incident.resolution = {
      action: recoveryEvent.recoveryMethod,
      resolutionTime: recoveryTime,
    };

    // Store recovery event
    this.recoveryEvents.push(recoveryEvent);
    this.activeIncidents.delete(incident.id);

    // Send notifications
    if (this.config.alerting.onRecovery) {
      await this.sendRecoveryNotification(recoveryEvent);
    }

    // Analyze for slow recovery
    if (this.config.alerting.onSlowRecovery) {
      await this.checkSlowRecovery(recoveryEvent);
    }

    // Update patterns
    if (this.config.analysis.analyzeRecoveryPatterns) {
      await this.updateRecoveryPatterns(recoveryEvent);
    }

    // Generate improvement suggestions
    if (this.config.improvement.generateOptimizationSuggestions) {
      await this.generateImprovementSuggestions(recoveryEvent);
    }

    console.log(`✅ Recovery tracked: ${incident.toolName} - ${this.formatDuration(recoveryTime)} (${recoveryType})`);
  }

  private async determineRecoveryType(
    incident: DowntimeIncident,
    result: HealthCheckResult,
    recoveryTime: number
  ): Promise<'partial' | 'full' | 'failed' | 'degraded'> {
    // Check if it's a full recovery
    if (result.status === 'healthy' && result.errorRate === 0) {
      return 'full';
    }

    // Check if it's a partial recovery
    if (result.status === 'healthy' && result.errorRate < 5) {
      return 'partial';
    }

    // Check if it's degraded recovery
    if (result.status === 'degraded') {
      return 'degraded';
    }

    return 'failed';
  }

  private async determineRecoveryMethod(
    incident: DowntimeIncident,
    recoveryTime: number
  ): Promise<'automatic' | 'manual' | 'hybrid'> {
    // This would analyze the recovery process to determine method
    // For now, use heuristics based on recovery time

    if (recoveryTime < this.config.thresholds.fastRecovery * 60 * 1000) {
      return 'automatic';
    } else if (recoveryTime > this.config.thresholds.acceptableRecovery * 60 * 1000) {
      return 'manual';
    } else {
      return 'hybrid';
    }
  }

  private async calculateRecoveryConfidence(
    incident: DowntimeIncident,
    result: HealthCheckResult
  ): Promise<number> {
    let confidence = 0.5; // Base confidence

    // Factor in consecutive successful health checks
    const consecutiveSuccesses = this.consecutiveSuccesses.get(incident.toolId) || 0;
    confidence += Math.min(0.3, consecutiveSuccesses * 0.1);

    // Factor in error rate
    if (result.errorRate === 0) {
      confidence += 0.2;
    } else if (result.errorRate < 1) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  private async calculateRecoveryMetrics(
    incident: DowntimeIncident,
    result: HealthCheckResult,
    recoveryTime: number
  ): Promise<RecoveryEvent['metrics']> {
    return {
      downtimeDuration: recoveryTime,
      recoveryTime: recoveryTime,
      functionalityRestored: result.status === 'healthy' ? 100 : result.status === 'degraded' ? 80 : 0,
      performanceLevel: result.responseTime > 0 ? Math.max(0, 100 - (result.responseTime / 1000) * 10) : 100,
      qualityScore: this.calculateQualityScore(result),
    };
  }

  private calculateQualityScore(result: HealthCheckResult): number {
    let score = 100;

    // Deduct for errors
    score -= result.errorRate * 2;

    // Deduct for response time
    if (result.responseTime > 1000) {
      score -= (result.responseTime - 1000) / 100;
    }

    // Deduct for failed checks
    const failedChecks = result.details.checks.filter(c => c.status === 'fail').length;
    score -= failedChecks * 5;

    return Math.max(0, Math.min(100, score));
  }

  private async getRecoveryContext(
    incident: DowntimeIncident,
    result: HealthCheckResult
  ): Promise<RecoveryEvent['context']> {
    return {
      trigger: this.identifyRecoveryTrigger(incident, result),
      rootCause: incident.cause.description,
      dependenciesInvolved: [], // Would analyze from system data
      humanIntervention: await this.wasHumanInterventionInvolved(incident),
      automatedActions: await this.identifyAutomatedActions(incident),
    };
  }

  private identifyRecoveryTrigger(incident: DowntimeIncident, result: HealthCheckResult): string {
    if (result.details.checks.some(c => c.name.includes('automatic'))) {
      return 'Automated health check';
    } else if (result.details.checks.some(c => c.name.includes('manual'))) {
      return 'Manual intervention';
    } else {
      return 'Natural recovery';
    }
  }

  private async wasHumanInterventionInvolved(incident: DowntimeIncident): Promise<boolean> {
    // This would check if any human actions were taken during the incident
    return incident.duration && incident.duration > 15 * 60 * 1000; // Assume human involvement for longer incidents
  }

  private async identifyAutomatedActions(incident: DowntimeIncident): Promise<string[]> {
    const actions: string[] = [];

    // This would analyze logs to identify automated actions
    if (incident.cause.category === 'performance') {
      actions.push('Auto-scaling triggered');
    }

    return actions;
  }

  private async validateRecovery(
    incident: DowntimeIncident,
    result: HealthCheckResult
  ): Promise<RecoveryEvent['validation']> {
    return {
      healthChecksPassed: result.details.checks.filter(c => c.status === 'pass').length,
      functionalTestsPassed: result.details.checks.length, // Simplified
      userVerification: false, // Would check user feedback
      postRecoveryIncidents: 0, // Would check for follow-up incidents
    };
  }

  private async assessRecoveryEffectiveness(
    incident: DowntimeIncident,
    result: HealthCheckResult,
    recoveryTime: number
  ): Promise<RecoveryEvent['effectiveness']> {
    const score = this.calculateRecoveryScore(recoveryTime, incident.severity, result);

    return {
      score,
      userSatisfaction: this.estimateUserSatisfaction(recoveryTime, incident.severity),
      businessImpact: this.assessBusinessImpact(incident, recoveryTime),
      recurrenceRisk: this.calculateRecurrenceRisk(incident, result),
    };
  }

  private calculateRecoveryScore(recoveryTime: number, severity: string, result: HealthCheckResult): number {
    let score = 100;

    // Deduct based on recovery time
    const recoveryMinutes = recoveryTime / (1000 * 60);
    if (recoveryMinutes > this.config.thresholds.criticalRecovery) {
      score -= 50;
    } else if (recoveryMinutes > this.config.thresholds.slowRecovery) {
      score -= 30;
    } else if (recoveryMinutes > this.config.thresholds.acceptableRecovery) {
      score -= 10;
    }

    // Adjust based on severity
    if (severity === 'critical' && recoveryMinutes > this.config.thresholds.acceptableRecovery) {
      score -= 20;
    }

    // Adjust based on quality
    score = score * (result.errorRate === 0 ? 1 : 0.8);

    return Math.max(0, Math.min(100, score));
  }

  private estimateUserSatisfaction(recoveryTime: number, severity: string): number {
    const recoveryMinutes = recoveryTime / (1000 * 60);

    if (recoveryMinutes <= this.config.thresholds.fastRecovery) {
      return 90 + Math.random() * 10;
    } else if (recoveryMinutes <= this.config.thresholds.acceptableRecovery) {
      return 70 + Math.random() * 20;
    } else if (recoveryMinutes <= this.config.thresholds.slowRecovery) {
      return 40 + Math.random() * 30;
    } else {
      return 10 + Math.random() * 30;
    }
  }

  private assessBusinessImpact(incident: DowntimeIncident, recoveryTime: number): 'low' | 'medium' | 'high' | 'critical' {
    const impact = incident.impact.businessImpact.toLowerCase();

    if (impact.includes('critical') || recoveryTime > this.config.thresholds.criticalRecovery * 60 * 1000) {
      return 'critical';
    } else if (impact.includes('high') || recoveryTime > this.config.thresholds.slowRecovery * 60 * 1000) {
      return 'high';
    } else if (impact.includes('medium')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private calculateRecurrenceRisk(incident: DowntimeIncident, result: HealthCheckResult): number {
    let risk = 0.1; // Base risk

    // Increase risk based on error rate
    risk += result.errorRate / 100;

    // Increase risk if root cause is not resolved
    if (!incident.resolution?.action || incident.resolution.action === 'Automatic recovery detected') {
      risk += 0.2;
    }

    return Math.min(1.0, risk);
  }

  private async extractLearningOpportunities(
    incident: DowntimeIncident,
    result: HealthCheckResult,
    recoveryTime: number
  ): Promise<RecoveryEvent['learning']> {
    const opportunities: string[] = [];
    const preventiveMeasures: string[] = [];

    // Analyze recovery time
    if (recoveryTime > this.config.thresholds.slowRecovery * 60 * 1000) {
      opportunities.push('Optimize recovery procedures to reduce time');
      preventiveMeasures.push('Implement automated recovery mechanisms');
    }

    // Analyze errors
    if (result.errorRate > 5) {
      opportunities.push('Address underlying quality issues');
      preventiveMeasures.push('Improve error handling and validation');
    }

    return {
      newPatterns: await this.identifyNewPatterns(incident, recoveryTime),
      improvementOpportunities: opportunities,
      preventiveMeasures,
      addToRunbook: recoveryTime > this.config.thresholds.acceptableRecovery * 60 * 1000,
    };
  }

  private async identifyNewPatterns(incident: DowntimeIncident, recoveryTime: number): Promise<boolean> {
    // Check if this recovery represents a new pattern
    const similarEvents = this.recoveryEvents.filter(event =>
      event.toolId === incident.toolId &&
      Math.abs(event.duration - recoveryTime) / recoveryTime < 0.2 // Within 20% of duration
    );

    return similarEvents.length < 3; // Not enough similar events to establish pattern
  }

  private async sendRecoveryNotification(event: RecoveryEvent): Promise<void> {
    const message = `Recovery completed: ${event.toolName} - ${this.formatDuration(event.duration)} (${event.type} recovery)`;

    for (const channel of this.config.alerting.channels) {
      switch (channel) {
        case 'console':
          console.log(`✅ ${message}`);
          console.log(`   Method: ${event.recoveryMethod}`);
          console.log(`   Effectiveness: ${event.effectiveness.score.toFixed(1)}/100`);
          break;
        case 'browser':
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('System Recovery', {
              body: message,
              icon: '/favicon.ico',
            });
          }
          break;
      }
    }
  }

  private async checkSlowRecovery(event: RecoveryEvent): Promise<void> {
    const recoveryMinutes = event.duration / (1000 * 60);

    if (recoveryMinutes > this.config.thresholds.slowRecovery) {
      const message = `Slow recovery detected: ${event.toolName} took ${recoveryMinutes.toFixed(1)} minutes to recover`;

      for (const channel of this.config.alerting.channels) {
        switch (channel) {
          case 'console':
            console.warn(`🐌 ${message}`);
            break;
          case 'browser':
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Slow Recovery Alert', {
                body: message,
                icon: '/favicon.ico',
              });
            }
            break;
        }
      }
    }
  }

  private async updateRecoveryPatterns(event: RecoveryEvent): Promise<void> {
    // Update existing patterns or identify new ones
    for (const pattern of this.recoveryPatterns) {
      if (this.matchesPattern(event, pattern)) {
        pattern.frequency++;
        pattern.lastObserved = event.detectedAt;
        pattern.typicalRecoveryTime = (pattern.typicalRecoveryTime + event.duration) / 2;
      }
    }
  }

  private matchesPattern(event: RecoveryEvent, pattern: RecoveryPattern): boolean {
    // Simple pattern matching - in reality this would be more sophisticated
    if (pattern.name === 'Auto-Healing Recovery' && event.recoveryMethod === 'automatic') {
      return true;
    }
    if (pattern.name === 'Manual Intervention Recovery' && event.recoveryMethod === 'manual') {
      return true;
    }
    return false;
  }

  private async generateImprovementSuggestions(event: RecoveryEvent): Promise<void> {
    if (event.duration > this.config.thresholds.acceptableRecovery * 60 * 1000) {
      // Suggest creating or updating runbook
      const runbook = this.runbooks.get(event.toolId);
      if (!runbook || this.shouldUpdateRunbook(runbook, event)) {
        await this.createOrUpdateRunbook(event);
      }
    }
  }

  private shouldUpdateRunbook(runbook: RecoveryRunbook, event: RecoveryEvent): boolean {
    // Update if current recovery is significantly better or worse
    const performanceImprovement = (runbook.effectiveness.averageRecoveryTime - event.duration) / runbook.effectiveness.averageRecoveryTime;
    return Math.abs(performanceImprovement) > 0.2; // 20% difference
  }

  private async createOrUpdateRunbook(event: RecoveryEvent): Promise<void> {
    const runbook: RecoveryRunbook = {
      id: `runbook-${event.toolId}-${event.type}`,
      toolId: event.toolId,
      toolName: event.toolName,
      incidentType: event.type,
      version: '1.0',
      lastUpdated: new Date(),
      effectiveness: {
        successRate: 100, // Would calculate from history
        averageRecoveryTime: event.duration,
        userSatisfaction: event.effectiveness.userSatisfaction,
      },
      steps: [
        {
          order: 1,
          action: 'Detect incident',
          expectedTime: 1,
          dependencies: [],
          rollback: 'N/A',
          verification: 'Incident confirmed in monitoring system',
        },
        {
          order: 2,
          action: 'Assess impact',
          expectedTime: 2,
          dependencies: ['Detect incident'],
          rollback: 'N/A',
          verification: 'Impact assessment completed',
        },
        {
          order: 3,
          action: 'Execute recovery',
          expectedTime: event.duration / (1000 * 60),
          dependencies: ['Assess impact'],
          rollback: 'Rollback to previous state',
          verification: 'Health checks pass',
        },
      ],
      prerequisites: ['Access to monitoring system', 'Recovery permissions'],
      resources: {
        personnel: ['On-call engineer'],
        tools: ['Monitoring dashboard', 'Recovery scripts'],
        permissions: ['System admin', 'Service restart'],
      },
      escalation: {
        when: 'Recovery time exceeds 30 minutes',
        who: ['Senior engineer', 'Team lead'],
        how: 'Page on-call escalation list',
      },
      postRecovery: {
        verification: ['All health checks passing', 'User functionality confirmed'],
        monitoring: ['Enhanced monitoring for 24 hours'],
        communication: ['Stakeholder notification'],
      },
    };

    this.runbooks.set(event.toolId, runbook);
    console.log(`📚 Created/updated runbook for ${event.toolName}`);
  }

  public async calculateRecoveryMetrics(): Promise<RecoveryMetrics> {
    const now = new Date();
    const periodStart = new Date(now.getTime() - this.config.analysis.benchmarkPeriod * 24 * 60 * 60 * 1000);

    const periodEvents = this.recoveryEvents.filter(event =>
      event.detectedAt >= periodStart && event.detectedAt <= now
    );

    const metrics: RecoveryMetrics = {
      period: {
        start: periodStart,
        end: now,
        duration: now.getTime() - periodStart.getTime(),
      },
      summary: this.calculateSummary(periodEvents),
      mttr: this.calculateMTTR(periodEvents, periodStart),
      mtbf: this.calculateMTBF(periodEvents, periodStart),
      distribution: this.calculateDistribution(periodEvents),
      patterns: this.calculatePatterns(periodEvents),
      effectiveness: this.calculateEffectiveness(periodEvents),
    };

    this.metrics = metrics;
    this.lastAnalysis = now;

    return metrics;
  }

  private calculateSummary(events: RecoveryEvent[]): RecoveryMetrics['summary'] {
    const totalIncidents = events.length;
    const recoveredIncidents = events.filter(e => e.type !== 'failed').length;
    const failedRecoveries = totalIncidents - recoveredIncidents;

    const averageRecoveryTime = recoveredIncidents > 0
      ? recoveredIncidents.reduce((sum, e) => sum + e.duration, 0) / recoveredIncidents
      : 0;

    return {
      totalIncidents,
      recoveredIncidents,
      failedRecoveries,
      recoveryRate: totalIncidents > 0 ? (recoveredIncidents / totalIncidents) * 100 : 0,
      averageRecoveryTime,
    };
  }

  private calculateMTTR(events: RecoveryEvent[], periodStart: Date): RecoveryMetrics['mttr'] {
    const overall = events.length > 0
      ? events.reduce((sum, e) => sum + e.duration, 0) / events.length
      : 0;

    const byTool: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    // Group by tool
    const eventsByTool = events.reduce((groups, event) => {
      if (!groups[event.toolId]) groups[event.toolId] = [];
      groups[event.toolId].push(event);
      return groups;
    }, {} as Record<string, RecoveryEvent[]>);

    for (const [toolId, toolEvents] of Object.entries(eventsByTool)) {
      byTool[toolId] = toolEvents.reduce((sum, e) => sum + e.duration, 0) / toolEvents.length;
    }

    // Generate trend data
    const trend = this.generateMTTRTrend(events);

    return {
      overall,
      byTool,
      byCategory,
      bySeverity,
      trend,
    };
  }

  private calculateMTBF(events: RecoveryEvent[], periodStart: Date): RecoveryMetrics['mtbf'] {
    // Sort events by time
    const sortedEvents = events.sort((a, b) => a.detectedAt.getTime() - b.detectedAt.getTime());

    if (sortedEvents.length < 2) {
      return {
        overall: 0,
        byTool: {},
        byCategory: {},
        bySeverity: {},
        trend: [],
      };
    }

    // Calculate time between incidents
    const intervals: number[] = [];
    for (let i = 1; i < sortedEvents.length; i++) {
      const interval = sortedEvents[i].detectedAt.getTime() - sortedEvents[i - 1].detectedAt.getTime();
      intervals.push(interval);
    }

    const overall = intervals.length > 0
      ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      : 0;

    return {
      overall,
      byTool: {},
      byCategory: {},
      bySeverity: {},
      trend: this.generateMTBFTrend(sortedEvents),
    };
  }

  private generateMTTRTrend(events: RecoveryEvent[]): Array<{ date: Date; mttr: number }> {
    // Group events by day and calculate daily MTTR
    const dailyGroups = events.reduce((groups, event) => {
      const day = new Date(event.detectedAt);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString();

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
      return groups;
    }, {} as Record<string, RecoveryEvent[]>);

    return Object.entries(dailyGroups).map(([dayStr, dayEvents]) => ({
      date: new Date(dayStr),
      mttr: dayEvents.reduce((sum, e) => sum + e.duration, 0) / dayEvents.length,
    }));
  }

  private generateMTBFTrend(events: RecoveryEvent[]): Array<{ date: Date; mtbf: number }> {
    const trend: Array<{ date: Date; mtbf: number }> = [];

    for (let i = 1; i < events.length; i++) {
      const mtbf = events[i].detectedAt.getTime() - events[i - 1].detectedAt.getTime();
      trend.push({
        date: events[i].detectedAt,
        mtbf,
      });
    }

    return trend;
  }

  private calculateDistribution(events: RecoveryEvent[]): RecoveryMetrics['distribution'] {
    if (events.length === 0) {
      return {
        fastRecoveries: 0,
        acceptableRecoveries: 0,
        slowRecoveries: 0,
        criticalRecoveries: 0,
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
      };
    }

    const durations = events.map(e => e.duration).sort((a, b) => a - b);

    const fastRecoveries = durations.filter(d => d <= this.config.thresholds.fastRecovery * 60 * 1000).length;
    const acceptableRecoveries = durations.filter(d =>
      d > this.config.thresholds.fastRecovery * 60 * 1000 &&
      d <= this.config.thresholds.acceptableRecovery * 60 * 1000
    ).length;
    const slowRecoveries = durations.filter(d =>
      d > this.config.thresholds.acceptableRecovery * 60 * 1000 &&
      d <= this.config.thresholds.slowRecovery * 60 * 1000
    ).length;
    const criticalRecoveries = durations.filter(d => d > this.config.thresholds.slowRecovery * 60 * 1000).length;

    const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const median = durations[Math.floor(durations.length / 2)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    return {
      fastRecoveries,
      acceptableRecoveries,
      slowRecoveries,
      criticalRecoveries,
      average,
      median,
      p95,
      p99,
    };
  }

  private calculatePatterns(events: RecoveryEvent[]): RecoveryMetrics['patterns'] {
    const timeOfDayPattern = this.calculateTimeOfDayPattern(events);
    const dayOfWeekPattern = this.calculateDayOfWeekPattern(events);
    const seasonalPattern = this.calculateSeasonalPattern(events);

    return {
      timeOfDayPattern,
      dayOfWeekPattern,
      seasonalPattern,
    };
  }

  private calculateTimeOfDayPattern(events: RecoveryEvent[]): Array<{ hour: number; avgRecoveryTime: number; incidents: number }> {
    const hourlyData: Array<{ hour: number; totalRecoveryTime: number; incidents: number }> = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourEvents = events.filter(e => e.detectedAt.getHours() === hour);
      const totalRecoveryTime = hourEvents.reduce((sum, e) => sum + e.duration, 0);

      hourlyData.push({
        hour,
        totalRecoveryTime,
        incidents: hourEvents.length,
      });
    }

    return hourlyData.map(data => ({
      hour: data.hour,
      avgRecoveryTime: data.incidents > 0 ? data.totalRecoveryTime / data.incidents : 0,
      incidents: data.incidents,
    }));
  }

  private calculateDayOfWeekPattern(events: RecoveryEvent[]): Array<{ day: string; avgRecoveryTime: number; incidents: number }> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayData: Record<string, { totalRecoveryTime: number; incidents: number }> = {};

    days.forEach(day => {
      dayData[day] = { totalRecoveryTime: 0, incidents: 0 };
    });

    events.forEach(event => {
      const dayName = days[event.detectedAt.getDay()];
      dayData[dayName].totalRecoveryTime += event.duration;
      dayData[dayName].incidents++;
    });

    return days.map(day => ({
      day,
      avgRecoveryTime: dayData[day].incidents > 0 ? dayData[day].totalRecoveryTime / dayData[day].incidents : 0,
      incidents: dayData[day].incidents,
    }));
  }

  private calculateSeasonalPattern(events: RecoveryEvent[]): Array<{ month: string; avgRecoveryTime: number; incidents: number }> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthData: Record<string, { totalRecoveryTime: number; incidents: number }> = {};

    months.forEach(month => {
      monthData[month] = { totalRecoveryTime: 0, incidents: 0 };
    });

    events.forEach(event => {
      const monthName = months[event.detectedAt.getMonth()];
      monthData[monthName].totalRecoveryTime += event.duration;
      monthData[monthName].incidents++;
    });

    return months.map(month => ({
      month,
      avgRecoveryTime: monthData[month].incidents > 0 ? monthData[month].totalRecoveryTime / monthData[month].incidents : 0,
      incidents: monthData[month].incidents,
    }));
  }

  private calculateEffectiveness(events: RecoveryEvent[]): RecoveryMetrics['effectiveness'] {
    if (events.length === 0) {
      return {
        recoveryScore: 0,
        userSatisfaction: 0,
        businessImpactMitigation: 0,
        learningRate: 0,
      };
    }

    const recoveryScore = events.reduce((sum, e) => sum + e.effectiveness.score, 0) / events.length;
    const userSatisfaction = events.reduce((sum, e) => sum + e.effectiveness.userSatisfaction, 0) / events.length;

    // Calculate business impact mitigation
    const businessImpactCounts = events.reduce((counts, e) => {
      counts[e.effectiveness.businessImpact] = (counts[e.effectiveness.businessImpact] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const totalImpact = Object.values(businessImpactCounts).reduce((sum, count) => sum + count, 0);
    const lowImpactPercentage = (businessImpactCounts['low'] || 0) / totalImpact;
    const businessImpactMitigation = lowImpactPercentage * 100;

    // Calculate learning rate (improvement over time)
    const learningRate = this.calculateLearningRate(events);

    return {
      recoveryScore,
      userSatisfaction,
      businessImpactMitigation,
      learningRate,
    };
  }

  private calculateLearningRate(events: RecoveryEvent[]): number {
    if (events.length < 2) return 0;

    // Sort events by time
    const sortedEvents = [...events].sort((a, b) => a.detectedAt.getTime() - b.detectedAt.getTime());

    // Split into two halves
    const midPoint = Math.floor(sortedEvents.length / 2);
    const firstHalf = sortedEvents.slice(0, midPoint);
    const secondHalf = sortedEvents.slice(midPoint);

    // Calculate average recovery time for each half
    const firstHalfAvg = firstHalf.reduce((sum, e) => sum + e.duration, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, e) => sum + e.duration, 0) / secondHalf.length;

    // Calculate improvement rate
    const improvement = (firstHalfAvg - secondHalfAvg) / firstHalfAvg;
    return Math.max(0, Math.min(100, improvement * 100));
  }

  public async generateRecoveryAnalysis(): Promise<RecoveryAnalysis> {
    if (!this.metrics) {
      await this.calculateRecoveryMetrics();
    }

    const metrics = this.metrics!;

    return {
      period: metrics.period,
      overallPerformance: {
        recoveryScore: metrics.effectiveness.recoveryScore,
        mttr: metrics.mttr.overall,
        mtbf: metrics.mtbf.overall,
        availabilityImprovement: this.calculateAvailabilityImprovement(),
      },
      bottlenecks: this.identifyRecoveryBottlenecks(),
      recommendations: this.generateRecommendations(),
      predictions: this.generatePredictions(),
    };
  }

  private calculateAvailabilityImprovement(): number {
    // Simplified calculation based on MTTR improvement
    const currentMTTR = this.metrics?.mttr.overall || 0;
    const baselineMTTR = 30 * 60 * 1000; // 30 minutes baseline

    if (currentMTTR === 0) return 0;

    const improvement = ((baselineMTTR - currentMTTR) / baselineMTTR) * 100;
    return Math.max(0, Math.min(100, improvement));
  }

  private identifyRecoveryBottlenecks(): RecoveryAnalysis['bottlenecks'] {
    const bottlenecks: RecoveryAnalysis['bottlenecks'] = [];

    // Analyze slow recoveries
    const slowRecoveries = this.recoveryEvents.filter(e =>
      e.duration > this.config.thresholds.slowRecovery * 60 * 1000
    );

    if (slowRecoveries.length > 0) {
      bottlenecks.push({
        category: 'slow_recovery',
        impact: (slowRecoveries.length / this.recoveryEvents.length) * 100,
        description: `Recoveries taking longer than ${this.config.thresholds.slowRecovery} minutes`,
        incidents: slowRecoveries.length,
        averageDelay: slowRecoveries.reduce((sum, e) => sum + e.duration, 0) / slowRecoveries.length,
      });
    }

    // Analyze failed recoveries
    const failedRecoveries = this.recoveryEvents.filter(e => e.type === 'failed');

    if (failedRecoveries.length > 0) {
      bottlenecks.push({
        category: 'failed_recovery',
        impact: (failedRecoveries.length / this.recoveryEvents.length) * 100,
        description: 'Recoveries that failed to restore service',
        incidents: failedRecoveries.length,
        averageDelay: 0, // Failed recoveries have infinite delay
      });
    }

    return bottlenecks;
  }

  private generateRecommendations(): RecoveryAnalysis['recommendations'] {
    const recommendations: RecoveryAnalysis['recommendations'] = [];

    // Analyze MTTR
    const currentMTTR = this.metrics?.mttr.overall || 0;

    if (currentMTTR > this.config.thresholds.acceptableRecovery * 60 * 1000) {
      recommendations.push({
        priority: 'high',
        category: 'process',
        title: 'Improve Recovery Procedures',
        description: 'Current MTTR is above acceptable threshold. Implement more efficient recovery processes.',
        expectedImprovement: {
          mttrReduction: 30,
          recoveryRateIncrease: 10,
          riskReduction: 20,
        },
        implementation: {
          effort: 'medium',
          timeline: '4-6 weeks',
          dependencies: ['Team training', 'Process documentation'],
        },
      });
    }

    // Analyze recovery patterns
    const manualRecoveries = this.recoveryEvents.filter(e => e.recoveryMethod === 'manual');

    if (manualRecoveries.length > this.recoveryEvents.length * 0.5) {
      recommendations.push({
        priority: 'medium',
        category: 'technology',
        title: 'Increase Automation',
        description: 'More than 50% of recoveries require manual intervention. Increase automation.',
        expectedImprovement: {
          mttrReduction: 40,
          recoveryRateIncrease: 15,
          riskReduction: 25,
        },
        implementation: {
          effort: 'high',
          timeline: '8-12 weeks',
          dependencies: ['Development resources', 'Testing environment'],
        },
      });
    }

    return recommendations;
  }

  private generatePredictions(): RecoveryAnalysis['predictions'] {
    const currentMTTR = this.metrics?.mttr.overall || 0;
    const mttrTrend = this.metrics?.mttr.trend || [];

    // Simple linear prediction
    let nextWeekMTTR = currentMTTR;
    let nextMonthMTTR = currentMTTR;

    if (mttrTrend.length > 1) {
      const recentTrend = mttrTrend.slice(-4); // Last 4 data points
      const avgChange = recentTrend.reduce((sum, point, i) => {
        if (i === 0) return sum;
        return sum + (point.mttr - recentTrend[i - 1].mttr);
      }, 0) / (recentTrend.length - 1);

      nextWeekMTTR = currentMTTR + (avgChange * 7); // 7 days ahead
      nextMonthMTTR = currentMTTR + (avgChange * 30); // 30 days ahead
    }

    const riskFactors: string[] = [];
    if (nextWeekMTTR > currentMTTR * 1.2) riskFactors.push('Increasing MTTR trend');
    if (this.metrics?.summary.recoveryRate && this.metrics.summary.recoveryRate < 95) {
      riskFactors.push('Low recovery rate');
    }

    return {
      nextWeekMTTR,
      nextMonthMTTR,
      riskFactors,
      confidence: 0.7, // Simplified confidence calculation
    };
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Public API methods
  public getRecoveryEvents(toolId?: string, days?: number): RecoveryEvent[] {
    let events = [...this.recoveryEvents];

    if (toolId) {
      events = events.filter(e => e.toolId === toolId);
    }

    if (days) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      events = events.filter(e => e.detectedAt >= cutoff);
    }

    return events;
  }

  public getCurrentMetrics(): RecoveryMetrics | null {
    return this.metrics;
  }

  public getRecoveryPatterns(): RecoveryPattern[] {
    return [...this.recoveryPatterns];
  }

  public getRunbooks(toolId?: string): Map<string, RecoveryRunbook> | RecoveryRunbook | null {
    if (toolId) {
      return this.runbooks.get(toolId) || null;
    }
    return new Map(this.runbooks);
  }

  public updateConfig(config: Partial<RecoveryTimeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): RecoveryTimeConfig {
    return { ...this.config };
  }

  public getSystemOverview(): {
    totalEvents: number;
    averageRecoveryTime: number;
    recoveryRate: number;
    mttr: number;
    mtbf: number;
    lastAnalysis: Date;
  } {
    return {
      totalEvents: this.recoveryEvents.length,
      averageRecoveryTime: this.metrics?.summary.averageRecoveryTime || 0,
      recoveryRate: this.metrics?.summary.recoveryRate || 0,
      mttr: this.metrics?.mttr.overall || 0,
      mtbf: this.metrics?.mtbf.overall || 0,
      lastAnalysis: this.lastAnalysis,
    };
  }
}

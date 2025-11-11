/**
 * Error Recovery Monitoring Integration
 * Integrates SC-009 error recovery metrics with the existing performance monitoring system
 * Provides unified monitoring interface for both SC-14 and SC-009 compliance
 */

import { BundleMonitoringSystem } from './index';
import { errorClassificationSystem } from './error-classification-system';
import { recoveryMetricsCalculator } from './recovery-metrics-calculator';
import { errorPatternAnalyzer } from './error-pattern-analyzer';
import { recoveryEffectivenessMonitor } from './recovery-effectiveness-monitor';
import { performanceObserver } from '../performance-observer';

import {
  ErrorEvent,
  ErrorRecoveryMetrics,
  ErrorType,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  RecoveryOutcome,
  ErrorContext,
  RecoveryAttempt,
  RecoveryGuidance,
  ErrorRecoveryAlert,
  RealtimeErrorRecoveryMetrics,
  ErrorRecoveryRecommendation,
  EffectivenessMetrics,
  StrategyPerformance,
  RecoveryOptimization
} from './error-recovery-types';

// ============================================================================
// Integration Configuration
// ============================================================================

export interface ErrorRecoveryIntegrationConfig {
  enabled: boolean;
  sc009: {
    targetRecoveryRate: number; // 98%
    realTimeMonitoring: boolean;
    errorClassification: boolean;
    patternAnalysis: boolean;
    effectivenessMonitoring: boolean;
    autoOptimization: boolean;
    reporting: boolean;
    alerts: boolean;
    integrationWithBundleMonitoring: boolean;
  };
  dataCollection: {
    trackAllErrors: boolean;
    anonymizeData: boolean;
    retentionPeriod: number; // days
    batchSize: number;
    flushInterval: number; // milliseconds
  };
  performance: {
    monitoringOverhead: number; // maximum 5%
    asyncProcessing: boolean;
    cacheResults: boolean;
    cacheTTL: number; // seconds
  };
  alerts: {
    enabled: boolean;
    threshold: number; // SC-009 compliance threshold
    channels: Array<'console' | 'browser' | 'analytics' | 'webhook'>;
    cooldownPeriod: number; // milliseconds
  };
  optimization: {
    enabled: boolean;
    autoImplement: boolean;
    aBTesting: boolean;
    minConfidence: number;
    maxRiskLevel: 'low' | 'medium' | 'high';
  };
}

// ============================================================================
// Error Recovery Event System
// ============================================================================

export class ErrorRecoveryEventSystem {
  private static instance: ErrorRecoveryEventSystem;
  private eventListeners: Map<string, Function[]> = new Map();
  private eventQueue: ErrorEvent[] = [];
  private processing = false;

  private constructor() {}

  public static getInstance(): ErrorRecoveryEventSystem {
    if (!ErrorRecoveryEventSystem.instance) {
      ErrorRecoveryEventSystem.instance = new ErrorRecoveryEventSystem();
    }
    return ErrorRecoveryEventSystem.instance;
  }

  // Register event listeners
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // Remove event listeners
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit events
  public emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Add error event to queue
  public addErrorEvent(errorEvent: ErrorEvent): void {
    this.eventQueue.push(errorEvent);
    this.processQueue();
  }

  // Process event queue
  private async processQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;

      try {
        // Process the error event
        await this.processErrorEvent(event);
      } catch (error) {
        console.error('Error processing error event:', error);
      }
    }

    this.processing = false;
  }

  // Process individual error event
  private async processErrorEvent(event: ErrorEvent): Promise<void> {
    // Emit error occurred event
    this.emit('error_occurred', event);

    // Classify the error
    const classification = errorClassificationSystem.classifyError(
      event.message,
      event.context,
      event.context.additionalData
    );

    // Update event with classification data
    event.type = classification.type;
    event.category = classification.category;
    event.severity = classification.severity;
    event.recoveryStrategy = classification.recoveryStrategy;
    event.sc009Compliant = classification.sc009Compliant;

    // Emit error classified event
    this.emit('error_classified', { event, classification });

    // Track recovery attempts
    for (const attempt of event.recoveryAttempts) {
      this.emit('recovery_attempted', { event, attempt });

      if (attempt.success) {
        this.emit('recovery_succeeded', { event, attempt });
      } else {
        this.emit('recovery_failed', { event, attempt });
      }
    }

    // Emit recovery completed event
    this.emit('recovery_completed', event);

    // Check SC-009 compliance
    if (!event.sc009Compliant) {
      this.emit('sc009_compliance_risk', event);
    }
  }

  // Get queue status
  public getQueueStatus(): { size: number; processing: boolean } {
    return {
      size: this.eventQueue.length,
      processing: this.processing
    };
  }

  // Clear queue
  public clearQueue(): void {
    this.eventQueue = [];
    this.processing = false;
  }
}

// ============================================================================
// Error Recovery Integration Manager
// ============================================================================

export class ErrorRecoveryIntegrationManager {
  private static instance: ErrorRecoveryIntegrationManager;
  private config: ErrorRecoveryIntegrationConfig;
  private eventSystem: ErrorRecoveryEventSystem;
  private metrics: ErrorRecoveryMetrics | null = null;
  private realTimeMetrics: RealtimeErrorRecoveryMetrics | null = null;
  private alerts: ErrorRecoveryAlert[] = [];
  private recommendations: ErrorRecoveryRecommendation[] = [];
  private initialized = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.eventSystem = ErrorRecoveryEventSystem.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): ErrorRecoveryIntegrationManager {
    if (!ErrorRecoveryIntegrationManager.instance) {
      ErrorRecoveryIntegrationManager.instance = new ErrorRecoveryIntegrationManager();
    }
    return ErrorRecoveryIntegrationManager.instance;
  }

  // Initialize the integration system
  public async initialize(config?: Partial<ErrorRecoveryIntegrationConfig>): Promise<void> {
    if (this.initialized) {
      console.warn('Error Recovery Integration already initialized');
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      console.log('Error Recovery Integration is disabled');
      return;
    }

    try {
      console.log('🚀 Initializing Error Recovery Integration...');

      // Initialize core components
      await this.initializeCoreComponents();

      // Setup monitoring integration
      await this.setupMonitoringIntegration();

      // Initialize error recovery monitoring
      await this.initializeErrorRecoveryMonitoring();

      // Setup alerts and notifications
      this.setupAlerts();

      // Start real-time monitoring
      if (this.config.sc009.realTimeMonitoring) {
        this.startRealTimeMonitoring();
      }

      this.initialized = true;
      console.log('✅ Error Recovery Integration initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Error Recovery Integration:', error);
      throw error;
    }
  }

  // Initialize core components
  private async initializeCoreComponents(): Promise<void> {
    console.log('📦 Initializing core components...');

    // Components are already singleton instances, just ensure they're available
    const components = [
      errorClassificationSystem,
      recoveryMetricsCalculator,
      errorPatternAnalyzer,
      recoveryEffectivenessMonitor
    ];

    for (const component of components) {
      if (!component) {
        throw new Error('Required component not available');
      }
    }

    console.log('✅ Core components initialized');
  }

  // Setup monitoring integration
  private async setupMonitoringIntegration(): Promise<void> {
    if (!this.config.sc009.integrationWithBundleMonitoring) {
      console.log('Bundle monitoring integration is disabled');
      return;
    }

    console.log('🔗 Setting up monitoring integration...');

    // Get the bundle monitoring system instance
    const bundleMonitoring = BundleMonitoringSystem.getInstance();

    // Check if bundle monitoring is initialized
    if (!bundleMonitoring.getStatus().initialized) {
      console.log('Bundle monitoring not initialized, initializing...');
      await bundleMonitoring.initialize();
    }

    // Extend the bundle monitoring system with error recovery metrics
    this.extendBundleMonitoringSystem(bundleMonitoring);

    console.log('✅ Monitoring integration completed');
  }

  // Extend bundle monitoring system with error recovery capabilities
  private extendBundleMonitoringSystem(bundleMonitoring: BundleMonitoringSystem): void {
    // Add error recovery metrics to the system status
    const originalStatus = bundleMonitoring.getStatus;

    // Override the getStatus method to include error recovery data
    bundleMonitoring.getStatus = () => {
      const status = originalStatus.call(bundleMonitoring);

      return {
        ...status,
        components: {
          ...status.components,
          errorRecovery: this.initialized
        },
        errorRecovery: {
          sc009Compliant: this.metrics?.sc009Compliant || false,
          currentRecoveryRate: this.metrics?.overallRecoveryRate || 0,
          lastAnalysis: this.metrics?.timestamp || new Date(),
          activeAlerts: this.alerts.length,
          recommendations: this.recommendations.length
        }
      };
    };

    // Add error recovery method to bundle monitoring
    (bundleMonitoring as any).getErrorRecoveryMetrics = () => {
      return {
        metrics: this.metrics,
        realTimeMetrics: this.realTimeMetrics,
        alerts: this.alerts,
        recommendations: this.recommendations
      };
    };

    // Add error recovery health report method
    (bundleMonitoring as any).getErrorRecoveryHealthReport = async () => {
      return await this.generateHealthReport();
    };
  }

  // Initialize error recovery monitoring
  private async initializeErrorRecoveryMonitoring(): Promise<void> {
    console.log('🔍 Initializing error recovery monitoring...');

    // Start the effectiveness monitor
    if (this.config.sc009.effectivenessMonitoring) {
      recoveryEffectivenessMonitor.startRealtimeMonitoring();
    }

    console.log('✅ Error recovery monitoring initialized');
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Listen for error events
    this.eventSystem.on('error_occurred', (event: ErrorEvent) => {
      this.handleErrorOccurred(event);
    });

    // Listen for recovery events
    this.eventSystem.on('recovery_succeeded', (data: { event: ErrorEvent, attempt: RecoveryAttempt }) => {
      this.handleRecoverySucceeded(data.event, data.attempt);
    });

    // Listen for SC-009 compliance risks
    this.eventSystem.on('sc009_compliance_risk', (event: ErrorEvent) => {
      this.handleSC009ComplianceRisk(event);
    });

    // Listen for performance observer events if available
    if (typeof performanceObserver !== 'undefined') {
      // Setup integration with performance observer
      this.setupPerformanceObserverIntegration();
    }
  }

  // Setup performance observer integration
  private setupPerformanceObserverIntegration(): void {
    try {
      // Monitor for performance issues that might affect error recovery
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.includes('error-recovery')) {
            this.eventSystem.emit('performance_metric', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('Performance Observer integration not available:', error);
    }
  }

  // Setup alerts and notifications
  private setupAlerts(): void {
    if (!this.config.alerts.enabled) {
      return;
    }

    console.log('🚨 Setting up alerts and notifications...');

    // Setup SC-009 compliance monitoring
    this.setupSC009ComplianceAlerts();

    // Setup performance alerts
    this.setupPerformanceAlerts();

    console.log('✅ Alerts and notifications setup completed');
  }

  // Setup SC-009 compliance alerts
  private setupSC009ComplianceAlerts(): void {
    this.eventSystem.on('sc009_compliance_risk', (event: ErrorEvent) => {
      const alert: ErrorRecoveryAlert = {
        id: `sc009_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'compliance_risk',
        severity: 'error',
        title: 'SC-009 Compliance Risk',
        description: `Error "${event.type}" is not SC-009 compliant and may affect the 98% recovery rate target`,
        errorType: event.type,
        impact: {
          sc009Compliance: true,
          userExperience: event.severity === 'critical' ? 'high' : 'medium',
          systemStability: 'low'
        },
        recommendedActions: [
          'Review and improve the recovery strategy',
          'Enhance user guidance and instructions',
          'Implement alternative recovery methods'
        ],
        timestamp: new Date(),
        resolved: false
      };

      this.alerts.push(alert);
      this.emitAlert(alert);
    });
  }

  // Setup performance alerts
  private setupPerformanceAlerts(): void {
    this.eventSystem.on('performance_metric', (data: any) => {
      if (data.duration > 10000) { // 10 seconds threshold
        const alert: ErrorRecoveryAlert = {
          id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'performance_degradation',
          severity: 'warning',
          title: 'Performance Degradation',
          description: `Error recovery operation "${data.name}" took ${data.duration}ms, which exceeds the 10-second threshold`,
          impact: {
            sc009Compliance: false,
            userExperience: 'medium',
            systemStability: 'low'
          },
          recommendedActions: [
            'Optimize the recovery algorithm',
            'Consider asynchronous processing',
            'Implement timeout handling'
          ],
          timestamp: new Date(),
          resolved: false
        };

        this.alerts.push(alert);
        this.emitAlert(alert);
      }
    });
  }

  // Emit alert to notification channels
  private emitAlert(alert: ErrorRecoveryAlert): void {
    this.config.alerts.channels.forEach(channel => {
      switch (channel) {
        case 'console':
          console.warn(`[ERROR RECOVERY ALERT] ${alert.title}: ${alert.description}`);
          break;
        case 'browser':
          if (typeof window !== 'undefined' && 'Notification' in window) {
            new Notification(alert.title, {
              body: alert.description,
              icon: '/alert-icon.png'
            });
          }
          break;
        case 'analytics':
          // Send to analytics service
          this.sendToAnalytics('error_recovery_alert', alert);
          break;
        case 'webhook':
          // Send to webhook endpoint
          this.sendToWebhook(alert);
          break;
      }
    });
  }

  // Start real-time monitoring
  private startRealTimeMonitoring(): void {
    console.log('📡 Starting real-time monitoring...');

    // Setup periodic metrics calculation
    setInterval(async () => {
      await this.updateMetrics();
    }, 30000); // Every 30 seconds

    // Setup real-time metrics update
    setInterval(async () => {
      await this.updateRealTimeMetrics();
    }, 5000); // Every 5 seconds

    console.log('✅ Real-time monitoring started');
  }

  // Update metrics
  private async updateMetrics(): Promise<void> {
    try {
      // Get recent error events (would typically come from a data source)
      const errorEvents = await this.getRecentErrorEvents();

      if (errorEvents.length > 0) {
        // Calculate metrics
        const timeRange = {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date()
        };

        this.metrics = recoveryMetricsCalculator.calculateMetrics(
          errorEvents,
          timeRange
        );

        // Update effectiveness monitor
        recoveryEffectivenessMonitor.updateEffectivenessMetrics(errorEvents);

        // Emit metrics updated event
        this.eventSystem.emit('metrics_updated', this.metrics);

        // Check for new recommendations
        await this.generateRecommendations();
      }
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  // Update real-time metrics
  private async updateRealTimeMetrics(): Promise<void> {
    try {
      // Get current session data
      const currentSession = await this.getCurrentSessionData();

      this.realTimeMetrics = {
        currentSession,
        recentErrors: await this.getRecentErrors(10), // Last 10 errors
        activeRecoveries: await this.getActiveRecoveries(),
        systemHealth: await this.getSystemHealth(),
        alerts: this.alerts.filter(a => !a.resolved),
        performance: await this.getPerformanceMetrics(),
        predictions: await this.getPredictions()
      };

      this.eventSystem.emit('realtime_metrics_updated', this.realTimeMetrics);
    } catch (error) {
      console.error('Error updating real-time metrics:', error);
    }
  }

  // Generate recommendations
  private async generateRecommendations(): Promise<void> {
    if (!this.metrics) return;

    try {
      // Generate optimizations from effectiveness monitor
      const optimizations = recoveryEffectivenessMonitor.generateOptimizations();

      // Convert optimizations to recommendations
      this.recommendations = optimizations.map(opt => ({
        id: opt.id,
        category: this.mapOptimizationTypeToCategory(opt.type),
        priority: this.mapImpactToPriority(opt.expectedImprovement),
        title: `Improve ${opt.strategy.replace(/_/g, ' ')}`,
        description: `Optimize ${opt.strategy} to improve SC-009 compliance`,
        affectedErrorTypes: opt.errorType ? [opt.errorType] : [],
        expectedImprovement: {
          recoveryRateImprovement: opt.expectedImprovement,
          userSatisfactionImprovement: opt.expectedImprovement * 0.8,
          timeToRecoveryReduction: opt.expectedImprovement * 10, // seconds
          sc009ComplianceImpact: opt.expectedImprovement
        },
        effort: opt.effort,
        timeframe: `${opt.effort.estimatedHours}h`,
        dependencies: opt.effort.dependencies,
        riskLevel: opt.effort.riskLevel,
        supportingData: [{
          metric: 'current_performance',
          currentValue: opt.currentPerformance,
          targetValue: opt.currentPerformance + opt.expectedImprovement,
          source: 'effectiveness_monitor',
          timestamp: new Date()
        }],
        confidence: opt.confidence,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      this.eventSystem.emit('recommendations_generated', this.recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  }

  // Event handlers
  private handleErrorOccurred(event: ErrorEvent): void {
    // Track the error occurrence
    this.eventSystem.emit('error_tracked', {
      type: event.type,
      category: event.category,
      severity: event.severity,
      timestamp: event.timestamp,
      sessionId: event.sessionId
    });
  }

  private handleRecoverySucceeded(event: ErrorEvent, attempt: RecoveryAttempt): void {
    // Track successful recovery
    this.eventSystem.emit('recovery_success', {
      errorType: event.type,
      strategy: attempt.strategy,
      duration: attempt.duration,
      automated: attempt.automated,
      userSatisfied: event.userSatisfied
    });
  }

  private handleSC009ComplianceRisk(event: ErrorEvent): void {
    // Handle SC-009 compliance risks
    this.eventSystem.emit('compliance_monitoring', {
      errorType: event.type,
      compliant: event.sc009Compliant,
      recoveryTime: event.totalRecoveryTime,
      userSatisfied: event.userSatisfied
    });
  }

  // Helper methods
  private async getRecentErrorEvents(): Promise<ErrorEvent[]> {
    // This would typically fetch from a database or analytics service
    // For now, return empty array
    return [];
  }

  private async getCurrentSessionData(): Promise<any> {
    // This would typically get current session data
    return {
      sessionId: 'current_session',
      startTime: new Date(),
      errorsEncountered: 0,
      recoveriesAttempted: 0,
      successfulRecoveries: 0,
      currentRecoveryRate: 0,
      averageTime: 0,
      userSatisfaction: 0,
      sc009Compliant: true
    };
  }

  private async getRecentErrors(limit: number): Promise<ErrorEvent[]> {
    // This would typically fetch recent errors from storage
    return [];
  }

  private async getActiveRecoveries(): Promise<any[]> {
    // This would typically fetch active recovery attempts
    return [];
  }

  private async getSystemHealth(): Promise<any> {
    // This would typically fetch system health metrics
    return {
      overallScore: 85,
      errorRate: 0.05,
      recoveryRate: 0.95,
      userSatisfaction: 0.88,
      systemLoad: 0.6,
      responsiveness: 0.9,
      sc009Compliance: true
    };
  }

  private async getPerformanceMetrics(): Promise<any> {
    // This would typically fetch performance metrics
    return {
      currentRecoveryRate: 0.95,
      averageRecoveryTime: 15000,
      activeErrorCount: 2,
      throughput: 50,
      responseTime: 200,
      successRate: 0.95,
      userEngagement: 0.8
    };
  }

  private async getPredictions(): Promise<any[]> {
    // This would typically fetch predictions from pattern analyzer
    return [];
  }

  private async generateHealthReport(): Promise<any> {
    return {
      overall: {
        score: this.metrics?.systemHealthScore || 0,
        status: this.metrics?.systemHealthScore >= 90 ? 'healthy' : 'warning'
      },
      sc009: {
        compliant: this.metrics?.sc009Compliant || false,
        currentRate: this.metrics?.overallRecoveryRate || 0,
        targetRate: this.config.sc009.targetRecoveryRate,
        gap: Math.max(0, this.config.sc009.targetRecoveryRate - (this.metrics?.overallRecoveryRate || 0))
      },
      performance: {
        score: 85,
        metrics: await this.getPerformanceMetrics()
      },
      recommendations: this.recommendations.slice(0, 5),
      alerts: this.alerts.filter(a => a.severity === 'critical').slice(0, 3),
      timestamp: new Date()
    };
  }

  private mapOptimizationTypeToCategory(type: string): string {
    const mapping: Record<string, string> = {
      'strategy_improvement': 'recovery_optimization',
      'guidance_enhancement': 'user_guidance',
      'parameter_tuning': 'system_improvement',
      'fallback_optimization': 'recovery_optimization',
      'automation_enhancement': 'system_improvement',
      'user_experience': 'user_guidance',
      'performance': 'system_improvement',
      'reliability': 'recovery_optimization'
    };
    return mapping[type] || 'system_improvement';
  }

  private mapImpactToPriority(impact: number): 'low' | 'medium' | 'high' | 'critical' {
    if (impact > 0.1) return 'critical';
    if (impact > 0.05) return 'high';
    if (impact > 0.02) return 'medium';
    return 'low';
  }

  private sendToAnalytics(event: string, data: any): void {
    // This would send to analytics service
    console.log(`[ANALYTICS] ${event}:`, data);
  }

  private sendToWebhook(alert: ErrorRecoveryAlert): void {
    // This would send to webhook endpoint
    console.log(`[WEBHOOK] Alert:`, alert);
  }

  // Public API methods
  public getConfig(): ErrorRecoveryIntegrationConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<ErrorRecoveryIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getMetrics(): ErrorRecoveryMetrics | null {
    return this.metrics;
  }

  public getRealTimeMetrics(): RealtimeErrorRecoveryMetrics | null {
    return this.realTimeMetrics;
  }

  public getAlerts(): ErrorRecoveryAlert[] {
    return [...this.alerts];
  }

  public getRecommendations(): ErrorRecoveryRecommendation[] {
    return [...this.recommendations];
  }

  // Add error event for tracking
  public addErrorEvent(errorEvent: ErrorEvent): void {
    this.eventSystem.addErrorEvent(errorEvent);
  }

  // Acknowledge alert
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.eventSystem.emit('alert_acknowledged', alert);
    }
  }

  // Implement recommendation
  public async implementRecommendation(recommendationId: string): Promise<boolean> {
    const recommendation = this.recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return false;

    try {
      recommendation.status = 'in_progress';
      this.eventSystem.emit('recommendation_implemented', recommendation);

      // Simulate implementation
      await new Promise(resolve => setTimeout(resolve, 2000));

      recommendation.status = 'completed';
      this.eventSystem.emit('recommendation_completed', recommendation);

      return true;
    } catch (error) {
      recommendation.status = 'failed';
      this.eventSystem.emit('recommendation_failed', { recommendation, error });
      return false;
    }
  }

  // Get integration status
  public getStatus(): {
    initialized: boolean;
    config: ErrorRecoveryIntegrationConfig;
    components: {
      classification: boolean;
      calculation: boolean;
      analysis: boolean;
      monitoring: boolean;
    };
    queueStatus: { size: number; processing: boolean };
    lastUpdate: Date | null;
  } {
    return {
      initialized: this.initialized,
      config: this.config,
      components: {
        classification: !!errorClassificationSystem,
        calculation: !!recoveryMetricsCalculator,
        analysis: !!errorPatternAnalyzer,
        monitoring: !!recoveryEffectivenessMonitor
      },
      queueStatus: this.eventSystem.getQueueStatus(),
      lastUpdate: this.metrics?.timestamp || null
    };
  }

  // Shutdown the integration
  public async shutdown(): Promise<void> {
    if (!this.initialized) return;

    console.log('🛑 Shutting down Error Recovery Integration...');

    try {
      // Stop real-time monitoring
      recoveryEffectivenessMonitor.stopRealtimeMonitoring();

      // Clear event queue
      this.eventSystem.clearQueue();

      // Clear data
      this.metrics = null;
      this.realTimeMetrics = null;
      this.alerts = [];
      this.recommendations = [];

      this.initialized = false;
      console.log('✅ Error Recovery Integration shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  private getDefaultConfig(): ErrorRecoveryIntegrationConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      enabled: true,
      sc009: {
        targetRecoveryRate: 0.98,
        realTimeMonitoring: isDevelopment,
        errorClassification: true,
        patternAnalysis: isDevelopment,
        effectivenessMonitoring: true,
        autoOptimization: isDevelopment,
        reporting: true,
        alerts: true,
        integrationWithBundleMonitoring: true
      },
      dataCollection: {
        trackAllErrors: true,
        anonymizeData: isProduction,
        retentionPeriod: 30,
        batchSize: 100,
        flushInterval: 30000
      },
      performance: {
        monitoringOverhead: 0.05,
        asyncProcessing: true,
        cacheResults: true,
        cacheTTL: 300
      },
      alerts: {
        enabled: true,
        threshold: 0.02,
        channels: isDevelopment ? ['console', 'browser'] : ['console', 'analytics'],
        cooldownPeriod: 300000
      },
      optimization: {
        enabled: isDevelopment,
        autoImplement: false,
        aBTesting: false,
        minConfidence: 0.8,
        maxRiskLevel: isDevelopment ? 'medium' : 'low'
      }
    };
  }
}

// Export singleton instance
export const errorRecoveryIntegrationManager = ErrorRecoveryIntegrationManager.getInstance();

// Export convenience functions for initialization
export const initializeErrorRecoveryIntegration = async (
  config?: Partial<ErrorRecoveryIntegrationConfig>
): Promise<void> => {
  await errorRecoveryIntegrationManager.initialize(config);
};

export const getErrorRecoveryMetrics = (): ErrorRecoveryMetrics | null => {
  return errorRecoveryIntegrationManager.getMetrics();
};

export const getErrorRecoveryStatus = () => {
  return errorRecoveryIntegrationManager.getStatus();
};

/**
 * Real-time Availability Status Tracking System
 * Provides real-time tracking of tool availability with WebSocket-like updates
 * Features live status updates, historical trends, and instant notifications
 */

import { HealthCheckResult, SystemHealthStatus, UptimeMetrics } from './uptime-monitoring-core';
import { ToolHealthStatus } from './automated-uptime-checker';

export interface AvailabilityEvent {
  id: string;
  type: 'status_change' | 'incident_detected' | 'incident_resolved' | 'performance_alert' | 'compliance_update';
  timestamp: Date;
  toolId?: string;
  toolName?: string;
  data: {
    previousStatus?: string;
    currentStatus?: string;
    incidentId?: string;
    metrics?: Partial<UptimeMetrics>;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
  };
}

export interface AvailabilitySnapshot {
  timestamp: Date;
  systemHealth: SystemHealthStatus;
  toolStatuses: ToolHealthStatus[];
  metrics: {
    totalTools: number;
    availableTools: number;
    unavailableTools: number;
    systemUptime: number;
    averageResponseTime: number;
    activeIncidents: number;
  };
  trends: {
    uptimeTrend: Array<{ time: Date; uptime: number }>;
    performanceTrend: Array<{ time: Date; responseTime: number }>;
    incidentTrend: Array<{ time: Date; incidents: number }>;
  };
}

export interface RealtimeAvailabilityConfig {
  enabled: boolean;
  updateInterval: number; // milliseconds
  historyRetention: number; // hours
  maxEvents: number;
  notifications: {
    enabled: boolean;
    statusChanges: boolean;
    incidents: boolean;
    performance: boolean;
    compliance: boolean;
  };
  aggregation: {
    enabled: boolean;
    windowSize: number; // minutes
    smoothingFactor: number; // 0-1
  };
}

export interface AvailabilitySubscription {
  id: string;
  filters: {
    toolIds?: string[];
    categories?: string[];
    eventTypes?: Array<'status_change' | 'incident_detected' | 'incident_resolved' | 'performance_alert' | 'compliance_update'>;
    severity?: Array<'info' | 'warning' | 'error' | 'critical'>;
  };
  callback: (event: AvailabilityEvent) => void;
  active: boolean;
  createdAt: Date;
  lastEvent?: Date;
}

export interface AvailabilityAnalytics {
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  availability: {
    overallUptime: number;
    uptimeByCategory: Record<string, number>;
    uptimeByTool: Record<string, number>;
    availabilityScore: number; // 0-100
  };
  incidents: {
    totalIncidents: number;
    incidentsByCategory: Record<string, number>;
    incidentsBySeverity: Record<string, number>;
    averageResolutionTime: number;
    mttr: number; // Mean Time To Recovery
    mtbf: number; // Mean Time Between Failures
  };
  performance: {
    averageResponseTime: number;
    responseTimeByTool: Record<string, number>;
    performanceScore: number; // 0-100
    degradationEvents: number;
  };
  trends: {
    uptimeTrend: Array<{ timestamp: Date; uptime: number }>;
    performanceTrend: Array<{ timestamp: Date; responseTime: number }>;
    incidentFrequency: Array<{ timestamp: Date; count: number }>;
  };
}

export class RealtimeAvailabilityTracker {
  private static instance: RealtimeAvailabilityTracker;
  private config: RealtimeAvailabilityConfig;
  private isTracking = false;
  private trackingInterval?: NodeJS.Timeout;

  // Data storage
  private currentSnapshot: AvailabilitySnapshot;
  private historicalSnapshots: AvailabilitySnapshot[] = [];
  private events: AvailabilityEvent[] = [];
  private subscriptions: Map<string, AvailabilitySubscription> = new Map();

  // Metrics
  private lastUpdate = new Date();
  private eventCounter = 0;
  private metricsHistory: Array<{
    timestamp: Date;
    uptime: number;
    responseTime: number;
    incidents: number;
  }> = [];

  private constructor(config?: Partial<RealtimeAvailabilityConfig>) {
    this.config = this.getDefaultConfig(config);
    this.currentSnapshot = this.createEmptySnapshot();
  }

  public static getInstance(config?: Partial<RealtimeAvailabilityConfig>): RealtimeAvailabilityTracker {
    if (!RealtimeAvailabilityTracker.instance) {
      RealtimeAvailabilityTracker.instance = new RealtimeAvailabilityTracker(config);
    }
    return RealtimeAvailabilityTracker.instance;
  }

  private getDefaultConfig(overrides?: Partial<RealtimeAvailabilityConfig>): RealtimeAvailabilityConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      enabled: true,
      updateInterval: isProduction ? 30000 : 10000, // 30 sec prod, 10 sec dev
      historyRetention: 24, // hours
      maxEvents: 1000,
      notifications: {
        enabled: true,
        statusChanges: true,
        incidents: true,
        performance: true,
        compliance: true,
      },
      aggregation: {
        enabled: true,
        windowSize: 5, // minutes
        smoothingFactor: 0.3,
      },
      ...overrides,
    };
  }

  private createEmptySnapshot(): AvailabilitySnapshot {
    return {
      timestamp: new Date(),
      systemHealth: {
        overall: {
          status: 'healthy',
          score: 100,
          uptime: 100,
          activeTools: 0,
          totalTools: 0,
          lastUpdate: new Date(),
        },
        sc005Compliance: {
          compliant: true,
          targetUptime: 99.9,
          currentUptime: 100,
          variance: 0,
          lastCheck: new Date(),
          daysInPeriod: 30,
          incidents: 0,
          maxAllowedIncidents: 0,
        },
        tools: [],
        incidents: [],
        alerts: [],
        performance: {
          averageResponseTime: 0,
          slowestTool: '',
          fastestTool: '',
          performanceDegradation: 0,
        },
        trends: {
          uptimeTrend: [],
          performanceTrend: [],
          incidentTrend: [],
        },
      },
      toolStatuses: [],
      metrics: {
        totalTools: 0,
        availableTools: 0,
        unavailableTools: 0,
        systemUptime: 100,
        averageResponseTime: 0,
        activeIncidents: 0,
      },
      trends: {
        uptimeTrend: [],
        performanceTrend: [],
        incidentTrend: [],
      },
    };
  }

  public async initialize(): Promise<void> {
    console.log('📡 Initializing Real-time Availability Tracker...');

    try {
      // Load historical data
      await this.loadHistoricalData();

      // Start tracking if enabled
      if (this.config.enabled) {
        this.startTracking();
      }

      console.log('✅ Real-time Availability Tracker initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Real-time Availability Tracker:', error);
      throw error;
    }
  }

  public startTracking(): void {
    if (this.isTracking) {
      console.warn('Real-time tracking is already active');
      return;
    }

    this.isTracking = true;
    console.log(`🔄 Starting real-time availability tracking (interval: ${this.config.updateInterval}ms)`);

    this.trackingInterval = setInterval(async () => {
      await this.updateSnapshot();
    }, this.config.updateInterval);

    this.emit('tracking-started', { interval: this.config.updateInterval });
  }

  public stopTracking(): void {
    if (!this.isTracking) {
      console.warn('Real-time tracking is not active');
      return;
    }

    this.isTracking = false;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = undefined;
    }

    console.log('🛑 Stopped real-time availability tracking');
    this.emit('tracking-stopped', { timestamp: new Date() });
  }

  private async updateSnapshot(): Promise<void> {
    try {
      const previousSnapshot = this.currentSnapshot;
      const newSnapshot = await this.createSnapshot();

      // Detect changes
      await this.detectChanges(previousSnapshot, newSnapshot);

      // Update current snapshot
      this.currentSnapshot = newSnapshot;
      this.lastUpdate = new Date();

      // Store historical data
      this.storeSnapshot(newSnapshot);

      // Update metrics history
      this.updateMetricsHistory(newSnapshot);

      // Cleanup old data
      this.cleanupOldData();

      // Emit update event
      this.emit('snapshot-updated', { snapshot: newSnapshot, previous: previousSnapshot });
    } catch (error) {
      console.error('❌ Failed to update availability snapshot:', error);
    }
  }

  private async createSnapshot(): Promise<AvailabilitySnapshot> {
    const timestamp = new Date();

    // This would typically get data from the uptime monitoring system
    // For now, we'll simulate the data structure

    return {
      timestamp,
      systemHealth: this.currentSnapshot.systemHealth, // Would be updated from monitoring system
      toolStatuses: this.currentSnapshot.toolStatuses, // Would be updated from automated checker
      metrics: this.calculateMetrics(),
      trends: this.calculateTrends(),
    };
  }

  private calculateMetrics(): AvailabilitySnapshot['metrics'] {
    const toolStatuses = this.currentSnapshot.toolStatuses;
    const totalTools = toolStatuses.length;
    const availableTools = toolStatuses.filter(t => t.status === 'healthy').length;
    const unavailableTools = toolStatuses.filter(t => t.status === 'unhealthy' || t.status === 'degraded').length;

    const systemUptime = totalTools > 0 ? (availableTools / totalTools) * 100 : 100;
    const averageResponseTime = toolStatuses.length > 0
      ? toolStatuses.reduce((sum, t) => sum + t.responseTime, 0) / toolStatuses.length
      : 0;

    const activeIncidents = this.currentSnapshot.systemHealth.incidents.filter(i => i.status === 'active').length;

    return {
      totalTools,
      availableTools,
      unavailableTools,
      systemUptime,
      averageResponseTime,
      activeIncidents,
    };
  }

  private calculateTrends(): AvailabilitySnapshot['trends'] {
    const now = new Date();
    const trends = {
      uptimeTrend: this.getTrendData('uptime', 24), // Last 24 hours
      performanceTrend: this.getTrendData('responseTime', 24),
      incidentTrend: this.getTrendData('incidents', 24),
    };

    // Add current data point
    trends.uptimeTrend.push({ time: now, uptime: this.currentSnapshot.metrics.systemUptime });
    trends.performanceTrend.push({ time: now, responseTime: this.currentSnapshot.metrics.averageResponseTime });
    trends.incidentTrend.push({ time: now, incidents: this.currentSnapshot.metrics.activeIncidents });

    return trends;
  }

  private getTrendData(metric: 'uptime' | 'responseTime' | 'incidents', hours: number): Array<{ time: Date; [key: string]: number }> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    return this.metricsHistory
      .filter(entry => entry.timestamp >= cutoff)
      .map(entry => ({
        time: entry.timestamp,
        [metric]: entry[metric],
      }));
  }

  private async detectChanges(previous: AvailabilitySnapshot, current: AvailabilitySnapshot): Promise<void> {
    // Detect tool status changes
    await this.detectToolStatusChanges(previous.toolStatuses, current.toolStatuses);

    // Detect incident changes
    await this.detectIncidentChanges(previous.systemHealth.incidents, current.systemHealth.incidents);

    // Detect performance changes
    await this.detectPerformanceChanges(previous.metrics, current.metrics);

    // Detect compliance changes
    await this.detectComplianceChanges(previous.systemHealth.sc005Compliance, current.systemHealth.sc005Compliance);
  }

  private async detectToolStatusChanges(previous: ToolHealthStatus[], current: ToolHealthStatus[]): Promise<void> {
    for (const currentTool of current) {
      const previousTool = previous.find(t => t.toolId === currentTool.toolId);

      if (previousTool && previousTool.status !== currentTool.status) {
        await this.createStatusChangeEvent(previousTool, currentTool);
      }
    }
  }

  private async detectIncidentChanges(previous: any[], current: any[]): Promise<void> {
    // Check for new incidents
    for (const incident of current) {
      if (!previous.find(p => p.id === incident.id) && incident.status === 'active') {
        await this.createIncidentDetectedEvent(incident);
      }
    }

    // Check for resolved incidents
    for (const previousIncident of previous) {
      const currentIncident = current.find(c => c.id === previousIncident.id);
      if (previousIncident.status === 'active' && currentIncident && currentIncident.status === 'resolved') {
        await this.createIncidentResolvedEvent(currentIncident);
      }
    }
  }

  private async detectPerformanceChanges(previous: AvailabilitySnapshot['metrics'], current: AvailabilitySnapshot['metrics']): Promise<void> {
    const responseTimeChange = Math.abs(current.averageResponseTime - previous.averageResponseTime);
    const responseTimeThreshold = previous.averageResponseTime * 0.5; // 50% change threshold

    if (responseTimeChange > responseTimeThreshold) {
      await this.createPerformanceAlertEvent(previous.averageResponseTime, current.averageResponseTime);
    }
  }

  private async detectComplianceChanges(previous: any, current: any): Promise<void> {
    if (previous.compliant !== current.compliant) {
      await this.createComplianceUpdateEvent(previous.compliant, current.compliant, current.currentUptime);
    }
  }

  private async createStatusChangeEvent(previousTool: ToolHealthStatus, currentTool: ToolHealthStatus): Promise<void> {
    const event: AvailabilityEvent = {
      id: `event-${Date.now()}-status-${currentTool.toolId}`,
      type: 'status_change',
      timestamp: new Date(),
      toolId: currentTool.toolId,
      toolName: currentTool.toolName,
      data: {
        previousStatus: previousTool.status,
        currentStatus: currentTool.status,
        message: `${currentTool.toolName} status changed from ${previousTool.status} to ${currentTool.status}`,
        severity: this.getSeverityForStatus(currentTool.status),
      },
    };

    await this.addEvent(event);
  }

  private async createIncidentDetectedEvent(incident: any): Promise<void> {
    const event: AvailabilityEvent = {
      id: `event-${Date.now()}-incident-${incident.id}`,
      type: 'incident_detected',
      timestamp: new Date(),
      toolId: incident.toolId,
      toolName: incident.toolName,
      data: {
        incidentId: incident.id,
        message: `New incident detected: ${incident.toolName} - ${incident.cause.description}`,
        severity: incident.severity === 'critical' ? 'critical' :
                 incident.severity === 'major' ? 'error' : 'warning',
      },
    };

    await this.addEvent(event);
  }

  private async createIncidentResolvedEvent(incident: any): Promise<void> {
    const event: AvailabilityEvent = {
      id: `event-${Date.now()}-resolved-${incident.id}`,
      type: 'incident_resolved',
      timestamp: new Date(),
      toolId: incident.toolId,
      toolName: incident.toolName,
      data: {
        incidentId: incident.id,
        message: `Incident resolved: ${incident.toolName} - Downtime: ${Math.round((incident.duration || 0) / 1000)}s`,
        severity: 'info',
      },
    };

    await this.addEvent(event);
  }

  private async createPerformanceAlertEvent(previousResponseTime: number, currentResponseTime: number): Promise<void> {
    const change = ((currentResponseTime - previousResponseTime) / previousResponseTime) * 100;

    const event: AvailabilityEvent = {
      id: `event-${Date.now()}-performance`,
      type: 'performance_alert',
      timestamp: new Date(),
      data: {
        message: `Performance ${change > 0 ? 'degradation' : 'improvement'} detected: ${Math.abs(Math.round(change))}% change in response time`,
        severity: Math.abs(change) > 100 ? 'error' : 'warning',
        metrics: {
          performance: {
            averageResponseTime: currentResponseTime,
            previousResponseTime,
            changePercentage: change,
          } as any,
        },
      },
    };

    await this.addEvent(event);
  }

  private async createComplianceUpdateEvent(previousCompliant: boolean, currentCompliant: boolean, uptime: number): Promise<void> {
    const event: AvailabilityEvent = {
      id: `event-${Date.now()}-compliance`,
      type: 'compliance_update',
      timestamp: new Date(),
      data: {
        message: currentCompliant
          ? `SC-005 compliance restored: ${uptime.toFixed(2)}% uptime`
          : `SC-005 compliance violation: ${uptime.toFixed(2)}% uptime`,
        severity: currentCompliant ? 'info' : 'error',
        metrics: {
          uptime: {
            currentUptime: uptime,
            sc005Compliant: currentCompliant,
          } as any,
        },
      },
    };

    await this.addEvent(event);
  }

  private getSeverityForStatus(status: string): 'info' | 'warning' | 'error' | 'critical' {
    switch (status) {
      case 'healthy': return 'info';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'info';
    }
  }

  private async addEvent(event: AvailabilityEvent): Promise<void> {
    // Add to events list
    this.events.unshift(event);

    // Maintain max events limit
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(0, this.config.maxEvents);
    }

    // Increment counter
    this.eventCounter++;

    // Notify subscribers
    await this.notifySubscribers(event);

    // Emit event
    this.emit('availability-event', { event });
  }

  private async notifySubscribers(event: AvailabilityEvent): Promise<void> {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) continue;

      if (this.eventMatchesSubscription(event, subscription)) {
        try {
          subscription.callback(event);
          subscription.lastEvent = new Date();
        } catch (error) {
          console.error(`Error in subscription ${subscription.id}:`, error);
        }
      }
    }
  }

  private eventMatchesSubscription(event: AvailabilityEvent, subscription: AvailabilitySubscription): boolean {
    const { filters } = subscription;

    // Check tool ID filter
    if (filters.toolIds && event.toolId && !filters.toolIds.includes(event.toolId)) {
      return false;
    }

    // Check event type filter
    if (filters.eventTypes && !filters.eventTypes.includes(event.type)) {
      return false;
    }

    // Check severity filter
    if (filters.severity && !filters.severity.includes(event.data.severity)) {
      return false;
    }

    return true;
  }

  private storeSnapshot(snapshot: AvailabilitySnapshot): void {
    this.historicalSnapshots.unshift(snapshot);

    // Maintain retention limit
    const maxSnapshots = Math.floor((this.config.historyRetention * 60 * 60 * 1000) / this.config.updateInterval);
    if (this.historicalSnapshots.length > maxSnapshots) {
      this.historicalSnapshots = this.historicalSnapshots.slice(0, maxSnapshots);
    }
  }

  private updateMetricsHistory(snapshot: AvailabilitySnapshot): void {
    this.metricsHistory.push({
      timestamp: snapshot.timestamp,
      uptime: snapshot.metrics.systemUptime,
      responseTime: snapshot.metrics.averageResponseTime,
      incidents: snapshot.metrics.activeIncidents,
    });

    // Keep only last 24 hours of data
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    this.metricsHistory = this.metricsHistory.filter(entry => entry.timestamp >= cutoff);
  }

  private cleanupOldData(): void {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - this.config.historyRetention);

    // Clean old events
    this.events = this.events.filter(event => event.timestamp >= cutoff);

    // Clean old snapshots (already handled in storeSnapshot)
    // Clean old metrics history (already handled in updateMetricsHistory)
  }

  private async loadHistoricalData(): Promise<void> {
    // In a real implementation, this would load from storage
    console.log('📂 Loading historical availability data...');
    // Placeholder for loading data from localStorage, IndexedDB, or server
  }

  // Event management
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();

  public on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
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

  // Public API methods
  public getCurrentSnapshot(): AvailabilitySnapshot {
    return { ...this.currentSnapshot };
  }

  public getHistoricalSnapshots(hours?: number): AvailabilitySnapshot[] {
    if (!hours) return [...this.historicalSnapshots];

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    return this.historicalSnapshots.filter(snapshot => snapshot.timestamp >= cutoff);
  }

  public getEvents(filters?: {
    type?: string;
    toolId?: string;
    severity?: string;
    hours?: number;
  }): AvailabilityEvent[] {
    let filtered = [...this.events];

    if (filters?.type) {
      filtered = filtered.filter(event => event.type === filters.type);
    }

    if (filters?.toolId) {
      filtered = filtered.filter(event => event.toolId === filters.toolId);
    }

    if (filters?.severity) {
      filtered = filtered.filter(event => event.data.severity === filters.severity);
    }

    if (filters?.hours) {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - filters.hours);
      filtered = filtered.filter(event => event.timestamp >= cutoff);
    }

    return filtered;
  }

  public subscribe(filters: AvailabilitySubscription['filters'], callback: (event: AvailabilityEvent) => void): string {
    const subscription: AvailabilitySubscription = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filters,
      callback,
      active: true,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscription.id, subscription);

    console.log(`📞 Subscribed to availability events: ${subscription.id}`);
    return subscription.id;
  }

  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(subscriptionId);
      console.log(`📞 Unsubscribed from availability events: ${subscriptionId}`);
    }
  }

  public getSubscriptions(): AvailabilitySubscription[] {
    return Array.from(this.subscriptions.values());
  }

  public async generateAnalytics(period: { start: Date; end: Date }): Promise<AvailabilityAnalytics> {
    const snapshots = this.historicalSnapshots.filter(
      snapshot => snapshot.timestamp >= period.start && snapshot.timestamp <= period.end
    );

    if (snapshots.length === 0) {
      throw new Error('No data available for the specified period');
    }

    // Calculate analytics
    const uptimeValues = snapshots.map(s => s.metrics.systemUptime);
    const responseTimeValues = snapshots.map(s => s.metrics.averageResponseTime);
    const incidentCounts = snapshots.map(s => s.metrics.activeIncidents);

    const overallUptime = uptimeValues.reduce((sum, uptime) => sum + uptime, 0) / uptimeValues.length;
    const averageResponseTime = responseTimeValues.reduce((sum, rt) => sum + rt, 0) / responseTimeValues.length;

    return {
      period,
      availability: {
        overallUptime,
        uptimeByCategory: this.calculateUptimeByCategory(snapshots),
        uptimeByTool: this.calculateUptimeByTool(snapshots),
        availabilityScore: Math.min(100, overallUptime),
      },
      incidents: {
        totalIncidents: this.events.filter(e => e.type === 'incident_detected').length,
        incidentsByCategory: this.calculateIncidentsByCategory(),
        incidentsBySeverity: this.calculateIncidentsBySeverity(),
        averageResolutionTime: this.calculateAverageResolutionTime(),
        mttr: this.calculateMTTR(),
        mtbf: this.calculateMTBF(),
      },
      performance: {
        averageResponseTime,
        responseTimeByTool: this.calculateResponseTimeByTool(snapshots),
        performanceScore: this.calculatePerformanceScore(responseTimeValues),
        degradationEvents: this.events.filter(e => e.type === 'performance_alert').length,
      },
      trends: {
        uptimeTrend: snapshots.map(s => ({ timestamp: s.timestamp, uptime: s.metrics.systemUptime })),
        performanceTrend: snapshots.map(s => ({ timestamp: s.timestamp, responseTime: s.metrics.averageResponseTime })),
        incidentFrequency: this.calculateIncidentFrequency(period),
      },
    };
  }

  private calculateUptimeByCategory(snapshots: AvailabilitySnapshot[]): Record<string, number> {
    const categoryUptime: Record<string, number[]> = {};

    for (const snapshot of snapshots) {
      for (const tool of snapshot.toolStatuses) {
        if (!categoryUptime[tool.category]) {
          categoryUptime[tool.category] = [];
        }
        categoryUptime[tool.category].push(tool.uptime);
      }
    }

    const result: Record<string, number> = {};
    for (const [category, uptimes] of Object.entries(categoryUptime)) {
      result[category] = uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length;
    }

    return result;
  }

  private calculateUptimeByTool(snapshots: AvailabilitySnapshot[]): Record<string, number> {
    const toolUptime: Record<string, number[]> = {};

    for (const snapshot of snapshots) {
      for (const tool of snapshot.toolStatuses) {
        if (!toolUptime[tool.toolId]) {
          toolUptime[tool.toolId] = [];
        }
        toolUptime[tool.toolId].push(tool.uptime);
      }
    }

    const result: Record<string, number> = {};
    for (const [toolId, uptimes] of Object.entries(toolUptime)) {
      result[toolId] = uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length;
    }

    return result;
  }

  private calculateIncidentsByCategory(): Record<string, number> {
    const incidents: Record<string, number> = {};

    for (const event of this.events.filter(e => e.type === 'incident_detected')) {
      // Would need to get category from tool ID
      const category = 'unknown'; // Placeholder
      incidents[category] = (incidents[category] || 0) + 1;
    }

    return incidents;
  }

  private calculateIncidentsBySeverity(): Record<string, number> {
    const incidents: Record<string, number> = {};

    for (const event of this.events.filter(e => e.type === 'incident_detected')) {
      incidents[event.data.severity] = (incidents[event.data.severity] || 0) + 1;
    }

    return incidents;
  }

  private calculateAverageResolutionTime(): number {
    const resolvedEvents = this.events.filter(e => e.type === 'incident_resolved');
    if (resolvedEvents.length === 0) return 0;

    // Would calculate from actual incident data
    return 300000; // 5 minutes placeholder
  }

  private calculateMTTR(): number {
    // Mean Time To Recovery
    return this.calculateAverageResolutionTime();
  }

  private calculateMTBF(): number {
    // Mean Time Between Failures
    const incidentEvents = this.events.filter(e => e.type === 'incident_detected');
    if (incidentEvents.length < 2) return 0;

    const timeSpan = incidentEvents[incidentEvents.length - 1].timestamp.getTime() - incidentEvents[0].timestamp.getTime();
    return timeSpan / (incidentEvents.length - 1);
  }

  private calculateResponseTimeByTool(snapshots: AvailabilitySnapshot[]): Record<string, number> {
    const toolResponseTime: Record<string, number[]> = {};

    for (const snapshot of snapshots) {
      for (const tool of snapshot.toolStatuses) {
        if (!toolResponseTime[tool.toolId]) {
          toolResponseTime[tool.toolId] = [];
        }
        toolResponseTime[tool.toolId].push(tool.responseTime);
      }
    }

    const result: Record<string, number> = {};
    for (const [toolId, responseTimes] of Object.entries(toolResponseTime)) {
      result[toolId] = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
    }

    return result;
  }

  private calculatePerformanceScore(responseTimeValues: number[]): number {
    const averageResponseTime = responseTimeValues.reduce((sum, rt) => sum + rt, 0) / responseTimeValues.length;

    // Score based on response time (lower is better)
    if (averageResponseTime < 500) return 100;
    if (averageResponseTime < 1000) return 90;
    if (averageResponseTime < 2000) return 75;
    if (averageResponseTime < 5000) return 50;
    return 25;
  }

  private calculateIncidentFrequency(period: { start: Date; end: Date }): Array<{ timestamp: Date; count: number }> {
    const incidents = this.events.filter(e =>
      e.type === 'incident_detected' &&
      e.timestamp >= period.start &&
      e.timestamp <= period.end
    );

    // Group by hour
    const frequency: Record<string, number> = {};

    for (const incident of incidents) {
      const hour = new Date(incident.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      frequency[key] = (frequency[key] || 0) + 1;
    }

    return Object.entries(frequency).map(([timestamp, count]) => ({
      timestamp: new Date(timestamp),
      count,
    }));
  }

  public updateSystemHealth(systemHealth: SystemHealthStatus): void {
    this.currentSnapshot.systemHealth = systemHealth;
  }

  public updateToolStatuses(toolStatuses: ToolHealthStatus[]): void {
    this.currentSnapshot.toolStatuses = toolStatuses;
  }

  public updateConfig(config: Partial<RealtimeAvailabilityConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart tracking if interval changed
    if (config.updateInterval && this.isTracking) {
      this.stopTracking();
      this.startTracking();
    }
  }

  public getConfig(): RealtimeAvailabilityConfig {
    return { ...this.config };
  }

  public isTrackingActive(): boolean {
    return this.isTracking;
  }

  public getMetrics(): {
    eventsProcessed: number;
    snapshotsStored: number;
    activeSubscriptions: number;
    lastUpdate: Date;
    uptimePercentage: number;
  } {
    return {
      eventsProcessed: this.eventCounter,
      snapshotsStored: this.historicalSnapshots.length,
      activeSubscriptions: Array.from(this.subscriptions.values()).filter(s => s.active).length,
      lastUpdate: this.lastUpdate,
      uptimePercentage: this.currentSnapshot.metrics.systemUptime,
    };
  }
}

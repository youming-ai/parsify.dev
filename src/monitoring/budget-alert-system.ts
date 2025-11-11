/**
 * Budget Alert System
 * Comprehensive alerting system for performance budget violations
 * Supports multiple channels, throttling, escalation, and automated responses
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface Alert {
  id: string;
  type: 'violation' | 'regression' | 'trend' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'bundle' | 'runtime' | 'network' | 'rendering' | 'user-experience' | 'system';
  source: 'build-time' | 'runtime' | 'ci-cd' | 'manual';
  budgetId?: string;
  budgetName?: string;
  metric: string;
  currentValue: number;
  threshold: number;
  overage: number;
  overagePercentage: number;
  message: string;
  description: string;
  recommendation?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  escalated: boolean;
  escalatedTo?: string[];
  responses: AlertResponse[];
  tags: string[];
}

export interface AlertResponse {
  id: string;
  type: 'acknowledgment' | 'resolution' | 'escalation' | 'comment' | 'automated';
  userId?: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  throttling: AlertThrottling;
  escalation: EscalationRule[];
  filters: AlertFilter[];
}

export interface AlertCondition {
  type: 'budget-violation' | 'metric-threshold' | 'trend-degradation' | 'system-event';
  metric?: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'percentage-change';
  threshold?: number;
  percentage?: number;
  budgetIds?: string[];
  severity?: Alert['severity'];
  category?: Alert['category'];
}

export interface AlertAction {
  type: 'notification' | 'webhook' | 'email' | 'slack' | 'jira' | 'automated-fix';
  config: Record<string, any>;
  delay?: number; // milliseconds
}

export interface AlertThrottling {
  enabled: boolean;
  maxAlerts: number;
  timeWindow: number; // milliseconds
  cooldownPeriod: number; // milliseconds between similar alerts
  groupBy: string[]; // fields to group alerts by for throttling
}

export interface EscalationRule {
  condition: {
    timeWithoutResponse: number; // milliseconds
    severity: Alert['severity'];
    unacknowledged?: boolean;
  };
  actions: AlertAction[];
  escalateTo: string[]; // user IDs or roles
}

export interface AlertFilter {
  field: keyof Alert;
  operator: 'equals' | 'contains' | 'not-equals' | 'in' | 'not-in';
  value: any;
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'jira' | 'console' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  rateLimit: {
    maxMessages: number;
    timeWindow: number; // milliseconds
  };
  lastUsed?: Date;
}

export interface AlertStatistics {
  total: number;
  bySeverity: Record<Alert['severity'], number>;
  byCategory: Record<Alert['category'], number>;
  bySource: Record<Alert['source'], number>;
  acknowledged: number;
  resolved: number;
  escalated: number;
  averageResolutionTime: number;
  unacknowledgedCritical: number;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
  };
}

export interface AlertSystemConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
  globalThrottling: AlertThrottling;
  autoResponse: {
    enabled: boolean;
    acknowledgeLowSeverity: boolean;
    autoResolveOnRecovery: boolean;
    maxAutoResponses: number;
  };
  retention: {
    alertRetention: number; // days
    responseRetention: number; // days
    statisticsRetention: number; // days
  };
  notifications: {
    enabled: boolean;
    batchInterval: number; // milliseconds
    maxBatchSize: number;
  };
}

export class BudgetAlertSystem extends EventEmitter {
  private static instance: BudgetAlertSystem;
  private config: AlertSystemConfig;
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private statistics: AlertStatistics;
  private throttlingCache: Map<string, number> = new Map();
  private batchQueue: Alert[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.config = this.getDefaultConfig();
    this.statistics = this.initializeStatistics();
    this.loadConfiguration();
    this.startBatchProcessing();
  }

  public static getInstance(): BudgetAlertSystem {
    if (!BudgetAlertSystem.instance) {
      BudgetAlertSystem.instance = new BudgetAlertSystem();
    }
    return BudgetAlertSystem.instance;
  }

  private getDefaultConfig(): AlertSystemConfig {
    return {
      enabled: true,
      channels: this.getDefaultChannels(),
      rules: this.getDefaultRules(),
      globalThrottling: {
        enabled: true,
        maxAlerts: 50,
        timeWindow: 60 * 60 * 1000, // 1 hour
        cooldownPeriod: 5 * 60 * 1000, // 5 minutes
        groupBy: ['budgetId', 'metric', 'severity'],
      },
      autoResponse: {
        enabled: true,
        acknowledgeLowSeverity: true,
        autoResolveOnRecovery: true,
        maxAutoResponses: 10,
      },
      retention: {
        alertRetention: 90, // days
        responseRetention: 180, // days
        statisticsRetention: 365, // days
      },
      notifications: {
        enabled: true,
        batchInterval: 30 * 1000, // 30 seconds
        maxBatchSize: 20,
      },
    };
  }

  private getDefaultChannels(): AlertChannel[] {
    return [
      {
        id: 'console',
        name: 'Console Output',
        type: 'console',
        enabled: true,
        config: {
          colored: true,
          timestamp: true,
        },
        rateLimit: {
          maxMessages: 1000,
          timeWindow: 60 * 1000, // 1 minute
        },
      },
      {
        id: 'email',
        name: 'Email Notifications',
        type: 'email',
        enabled: false, // Disabled by default
        config: {
          recipients: ['dev-team@example.com'],
          template: 'budget-violation',
        },
        rateLimit: {
          maxMessages: 10,
          timeWindow: 60 * 60 * 1000, // 1 hour
        },
      },
      {
        id: 'slack',
        name: 'Slack Integration',
        type: 'slack',
        enabled: false, // Disabled by default
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#performance-alerts',
          username: 'Budget Monitor',
        },
        rateLimit: {
          maxMessages: 20,
          timeWindow: 60 * 60 * 1000, // 1 hour
        },
      },
      {
        id: 'webhook',
        name: 'Webhook Endpoint',
        type: 'webhook',
        enabled: false, // Disabled by default
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        rateLimit: {
          maxMessages: 30,
          timeWindow: 60 * 60 * 1000, // 1 hour
        },
      },
    ];
  }

  private getDefaultRules(): AlertRule[] {
    return [
      {
        id: 'critical-budget-violation',
        name: 'Critical Budget Violation',
        description: 'Alert on critical budget violations immediately',
        enabled: true,
        conditions: [
          {
            type: 'budget-violation',
            severity: 'critical',
          },
        ],
        actions: [
          {
            type: 'notification',
            config: {
              channels: ['console', 'email'],
              priority: 'high',
            },
          },
          {
            type: 'webhook',
            config: {
              urgency: 'critical',
            },
          },
        ],
        throttling: {
          enabled: false, // No throttling for critical alerts
          maxAlerts: 0,
          timeWindow: 0,
          cooldownPeriod: 0,
          groupBy: [],
        },
        escalation: [
          {
            condition: {
              timeWithoutResponse: 30 * 60 * 1000, // 30 minutes
              severity: 'critical',
              unacknowledged: true,
            },
            actions: [
              {
                type: 'email',
                config: {
                  escalateTo: ['management@example.com'],
                  priority: 'urgent',
                },
              },
            ],
            escalateTo: ['dev-lead', 'management'],
          },
        ],
        filters: [],
      },
      {
        id: 'warning-budget-violation',
        name: 'Warning Budget Violation',
        description: 'Alert on warning budget violations with throttling',
        enabled: true,
        conditions: [
          {
            type: 'budget-violation',
            severity: 'warning',
          },
        ],
        actions: [
          {
            type: 'notification',
            config: {
              channels: ['console'],
              priority: 'medium',
            },
          },
        ],
        throttling: {
          enabled: true,
          maxAlerts: 3,
          timeWindow: 60 * 60 * 1000, // 1 hour
          cooldownPeriod: 10 * 60 * 1000, // 10 minutes
          groupBy: ['budgetId', 'metric'],
        },
        escalation: [],
        filters: [],
      },
      {
        id: 'performance-regression',
        name: 'Performance Regression',
        description: 'Alert on significant performance regressions',
        enabled: true,
        conditions: [
          {
            type: 'trend-degradation',
            percentage: 15, // 15% degradation
          },
        ],
        actions: [
          {
            type: 'notification',
            config: {
              channels: ['console', 'slack'],
              priority: 'medium',
            },
          },
        ],
        throttling: {
          enabled: true,
          maxAlerts: 2,
          timeWindow: 24 * 60 * 60 * 1000, // 24 hours
          cooldownPeriod: 60 * 60 * 1000, // 1 hour
          groupBy: ['budgetId', 'metric'],
        },
        escalation: [],
        filters: [],
      },
    ];
  }

  private initializeStatistics(): AlertStatistics {
    return {
      total: 0,
      bySeverity: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      },
      byCategory: {
        bundle: 0,
        runtime: 0,
        network: 0,
        rendering: 0,
        'user-experience': 0,
        system: 0,
      },
      bySource: {
        'build-time': 0,
        runtime: 0,
        'ci-cd': 0,
        manual: 0,
      },
      acknowledged: 0,
      resolved: 0,
      escalated: 0,
      averageResolutionTime: 0,
      unacknowledgedCritical: 0,
      trends: {
        daily: [],
        weekly: [],
      },
    };
  }

  /**
   * Load configuration from file
   */
  private loadConfiguration(): void {
    const configPath = '.budget-alerts/config.json';

    try {
      if (existsSync(configPath)) {
        const data = readFileSync(configPath, 'utf-8');
        const loadedConfig = JSON.parse(data);
        this.config = { ...this.config, ...loadedConfig };
      }
    } catch (error) {
      console.warn('Failed to load alert system configuration:', error);
    }

    // Initialize maps
    this.config.channels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });

    this.config.rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    // Load existing alerts
    this.loadAlerts();
  }

  /**
   * Save configuration to file
   */
  private saveConfiguration(): void {
    const configPath = '.budget-alerts/config.json';

    try {
      mkdirSync('.budget-alerts', { recursive: true });
      writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save alert system configuration:', error);
    }
  }

  /**
   * Load existing alerts from storage
   */
  private loadAlerts(): void {
    const alertsPath = '.budget-alerts/alerts.json';

    try {
      if (existsSync(alertsPath)) {
        const data = readFileSync(alertsPath, 'utf-8');
        const alertsData = JSON.parse(data);

        Object.entries(alertsData).forEach(([id, alert]: [string, any]) => {
          // Convert string dates back to Date objects
          alert.timestamp = new Date(alert.timestamp);
          if (alert.acknowledgedAt) {
            alert.acknowledgedAt = new Date(alert.acknowledgedAt);
          }
          if (alert.resolvedAt) {
            alert.resolvedAt = new Date(alert.resolvedAt);
          }

          this.alerts.set(id, alert);
          this.updateStatistics(alert);
        });
      }
    } catch (error) {
      console.warn('Failed to load existing alerts:', error);
    }
  }

  /**
   * Save alerts to storage
   */
  private saveAlerts(): void {
    const alertsPath = '.budget-alerts/alerts.json';

    try {
      mkdirSync('.budget-alerts', { recursive: true });

      const alertsData: Record<string, Alert> = {};
      this.alerts.forEach((alert, id) => {
        alertsData[id] = alert;
      });

      writeFileSync(alertsPath, JSON.stringify(alertsData, null, 2));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }

  /**
   * Create and process a new alert
   */
  public async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved' | 'escalated' | 'responses'>): Promise<Alert> {
    if (!this.config.enabled) {
      throw new Error('Alert system is disabled');
    }

    const alert: Alert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      escalated: false,
      responses: [],
    };

    // Check throttling
    if (this.isThrottled(alert)) {
      console.log(`Alert throttled: ${alert.type} - ${alert.metric}`);
      return alert;
    }

    // Apply filters
    if (!this.passesFilters(alert)) {
      console.log(`Alert filtered out: ${alert.type} - ${alert.metric}`);
      return alert;
    }

    // Store alert
    this.alerts.set(alert.id, alert);
    this.updateStatistics(alert);

    // Auto-respond if configured
    if (this.config.autoResponse.enabled) {
      this.autoRespond(alert);
    }

    // Process alert through rules
    await this.processAlertThroughRules(alert);

    // Add to batch queue
    if (this.config.notifications.enabled) {
      this.addToBatch(alert);
    }

    // Emit alert event
    this.emit('alert-created', alert);

    // Save alerts
    this.saveAlerts();

    return alert;
  }

  /**
   * Check if alert is throttled
   */
  private isThrottled(alert: Alert): boolean {
    if (!this.config.globalThrottling.enabled) {
      return false;
    }

    // Generate throttle key based on grouping
    const throttleKey = this.config.globalThrottling.groupBy
      .map(field => (alert as any)[field] || 'unknown')
      .join(':');

    const now = Date.now();
    const lastAlertTime = this.throttlingCache.get(throttleKey) || 0;

    // Check cooldown period
    if (now - lastAlertTime < this.config.globalThrottling.cooldownPeriod) {
      return true;
    }

    // Update throttle cache
    this.throttlingCache.set(throttleKey, now);

    return false;
  }

  /**
   * Check if alert passes filters
   */
  private passesFilters(alert: Alert): boolean {
    for (const rule of this.config.rules.filter(r => r.enabled)) {
      for (const filter of rule.filters) {
        const fieldValue = (alert as any)[filter.field];

        let passes = false;
        switch (filter.operator) {
          case 'equals':
            passes = fieldValue === filter.value;
            break;
          case 'contains':
            passes = typeof fieldValue === 'string' && fieldValue.includes(filter.value);
            break;
          case 'not-equals':
            passes = fieldValue !== filter.value;
            break;
          case 'in':
            passes = Array.isArray(filter.value) && filter.value.includes(fieldValue);
            break;
          case 'not-in':
            passes = Array.isArray(filter.value) && !filter.value.includes(fieldValue);
            break;
        }

        if (!passes) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Auto-respond to alert based on configuration
   */
  private autoRespond(alert: Alert): void {
    // Auto-acknowledge low severity alerts
    if (this.config.autoResponse.acknowledgeLowSeverity &&
        (alert.severity === 'info' || alert.severity === 'warning')) {
      this.acknowledgeAlert(alert.id, 'system', 'Auto-acknowledged low severity alert');
    }

    // Auto-resolve if this is a recovery alert
    if (this.config.autoResponse.autoResolveOnRecovery &&
        alert.type === 'violation' && alert.overagePercentage < 0) {
      this.resolveAlert(alert.id, 'system', 'Auto-resolved: metric within threshold');
    }
  }

  /**
   * Process alert through rules
   */
  private async processAlertThroughRules(alert: Alert): Promise<void> {
    for (const rule of this.config.rules.filter(r => r.enabled)) {
      if (this.matchesRule(alert, rule)) {
        await this.executeRuleActions(alert, rule);

        // Set up escalation if needed
        if (rule.escalation.length > 0) {
          this.setupEscalation(alert, rule);
        }
      }
    }
  }

  /**
   * Check if alert matches rule conditions
   */
  private matchesRule(alert: Alert, rule: AlertRule): boolean {
    return rule.conditions.every(condition => {
      switch (condition.type) {
        case 'budget-violation':
          return alert.type === 'violation' &&
                 (!condition.severity || alert.severity === condition.severity) &&
                 (!condition.budgetIds || !alert.budgetId || condition.budgetIds.includes(alert.budgetId));

        case 'metric-threshold':
          return alert.metric === condition.metric &&
                 this.compareValues(alert.currentValue, condition.operator, condition.threshold);

        case 'trend-degradation':
          return alert.type === 'regression' ||
                 (alert.overagePercentage > 0 && alert.overagePercentage >= (condition.percentage || 10));

        case 'system-event':
          return alert.type === 'system' &&
                 (!condition.severity || alert.severity === condition.severity);

        default:
          return false;
      }
    });
  }

  /**
   * Compare values based on operator
   */
  private compareValues(value: number, operator: string, threshold?: number): boolean {
    if (threshold === undefined) return false;

    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'percentage-change':
        return Math.abs(value - threshold) / threshold > 0.1; // 10% change
      default:
        return false;
    }
  }

  /**
   * Execute rule actions
   */
  private async executeRuleActions(alert: Alert, rule: AlertRule): Promise<void> {
    for (const action of rule.actions) {
      if (action.delay && action.delay > 0) {
        setTimeout(() => this.executeAction(alert, action), action.delay);
      } else {
        await this.executeAction(alert, action);
      }
    }
  }

  /**
   * Execute individual action
   */
  private async executeAction(alert: Alert, action: AlertAction): Promise<void> {
    try {
      switch (action.type) {
        case 'notification':
          await this.sendNotification(alert, action.config);
          break;
        case 'webhook':
          await this.sendWebhook(alert, action.config);
          break;
        case 'email':
          await this.sendEmail(alert, action.config);
          break;
        case 'slack':
          await this.sendSlackMessage(alert, action.config);
          break;
        case 'jira':
          await this.createJiraTicket(alert, action.config);
          break;
        case 'automated-fix':
          await this.executeAutomatedFix(alert, action.config);
          break;
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(alert: Alert, config: Record<string, any>): Promise<void> {
    const channels = config.channels || ['console'];

    for (const channelId of channels) {
      const channel = this.channels.get(channelId);
      if (channel && channel.enabled && this.checkRateLimit(channel)) {
        await this.sendToChannel(alert, channel, config);
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendToChannel(alert: Alert, channel: AlertChannel, config: Record<string, any>): Promise<void> {
    const message = this.formatAlertMessage(alert, config);

    switch (channel.type) {
      case 'console':
        this.sendConsoleAlert(alert, message, channel.config);
        break;
      case 'webhook':
        await this.sendWebhookAlert(alert, message, channel.config);
        break;
      case 'email':
        await this.sendEmailAlert(alert, message, channel.config);
        break;
      case 'slack':
        await this.sendSlackAlert(alert, message, channel.config);
        break;
      default:
        console.warn(`Unknown channel type: ${channel.type}`);
    }

    // Update rate limit
    channel.lastUsed = new Date();
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(alert: Alert, config: Record<string, any>): string {
    const severity = alert.severity.toUpperCase();
    const emoji = this.getSeverityEmoji(alert.severity);

    let message = `${emoji} [${severity}] ${alert.type.toUpperCase()}: ${alert.metric}\n`;
    message += `💰 Budget: ${alert.budgetName || 'Unknown'}\n`;
    message += `📊 Current: ${alert.currentValue} (Threshold: ${alert.threshold})\n`;
    message += `📈 Overage: ${alert.overagePercentage.toFixed(1)}%\n`;
    message += `💬 ${alert.message}\n`;

    if (alert.recommendation) {
      message += `💡 Recommendation: ${alert.recommendation}\n`;
    }

    message += `⏰ Time: ${alert.timestamp.toISOString()}\n`;
    message += `🔗 Alert ID: ${alert.id}`;

    return message;
  }

  /**
   * Get emoji for severity
   */
  private getSeverityEmoji(severity: Alert['severity']): string {
    const emojis = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };
    return emojis[severity] || 'ℹ️';
  }

  /**
   * Send console alert
   */
  private sendConsoleAlert(alert: Alert, message: string, config: Record<string, any>): void {
    if (config.colored) {
      const colors = {
        info: '\x1b[36m', // cyan
        warning: '\x1b[33m', // yellow
        error: '\x1b[31m', // red
        critical: '\x1b[41m\x1b[37m', // red background white text
      };

      const reset = '\x1b[0m';
      const color = colors[alert.severity] || colors.info;

      console.log(`${color}${message}${reset}`);
    } else {
      console.log(message);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert, message: string, config: Record<string, any>): Promise<void> {
    // This would implement actual webhook sending
    // For now, just log
    console.log(`Webhook alert (to ${config.url}):`, message);
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert, message: string, config: Record<string, any>): Promise<void> {
    // This would implement actual email sending
    // For now, just log
    console.log(`Email alert (to ${config.recipients?.join(', ')}):`, message);
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: Alert, message: string, config: Record<string, any>): Promise<void> {
    // This would implement actual Slack sending
    // For now, just log
    console.log(`Slack alert (to ${config.channel}):`, message);
  }

  /**
   * Setup escalation for alert
   */
  private setupEscalation(alert: Alert, rule: AlertRule): void {
    rule.escalation.forEach(escalationRule => {
      const timeout = escalationRule.condition.timeWithoutResponse;

      setTimeout(() => {
        if (!alert.acknowledged || escalationRule.condition.unacknowledged) {
          this.escalateAlert(alert, escalationRule);
        }
      }, timeout);
    });
  }

  /**
   * Escalate alert
   */
  private async escalateAlert(alert: Alert, escalationRule: EscalationRule): Promise<void> {
    if (alert.escalated) {
      return; // Already escalated
    }

    alert.escalated = true;
    alert.escalatedTo = escalationRule.escalateTo;

    // Add escalation response
    const response: AlertResponse = {
      id: this.generateResponseId(),
      type: 'escalation',
      message: `Escalated to: ${escalationRule.escalateTo.join(', ')}`,
      timestamp: new Date(),
    };
    alert.responses.push(response);

    // Execute escalation actions
    await this.executeRuleActions(alert, {
      actions: escalationRule.actions,
      conditions: [],
      enabled: true,
      filters: [],
      throttling: { enabled: false, maxAlerts: 0, timeWindow: 0, cooldownPeriod: 0, groupBy: [] },
      id: 'escalation',
      name: 'Escalation',
      description: '',
      escalation: [],
    });

    this.emit('alert-escalated', alert);
    this.saveAlerts();
  }

  /**
   * Check rate limit for channel
   */
  private checkRateLimit(channel: AlertChannel): boolean {
    if (!channel.lastUsed) {
      return true;
    }

    const now = Date.now();
    const timeSinceLastUse = now - channel.lastUsed.getTime();

    return timeSinceLastUse >= (channel.rateLimit.timeWindow / channel.rateLimit.maxMessages);
  }

  /**
   * Add alert to batch queue
   */
  private addToBatch(alert: Alert): void {
    this.batchQueue.push(alert);

    if (this.batchQueue.length >= this.config.notifications.maxBatchSize) {
      this.processBatch();
    }
  }

  /**
   * Start batch processing
   */
  private startBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.processBatch();
      }
    }, this.config.notifications.batchInterval);
  }

  /**
   * Process batch of alerts
   */
  private processBatch(): void {
    if (this.batchQueue.length === 0) {
      return;
    }

    const batch = this.batchQueue.splice(0, this.config.notifications.maxBatchSize);

    // Group alerts by severity and channel
    const grouped: Record<string, Alert[]> = {};

    batch.forEach(alert => {
      const key = `${alert.severity}_batch`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(alert);
    });

    // Send batch notifications
    Object.entries(grouped).forEach(([key, alerts]) => {
      const [severity] = key.split('_');
      this.sendBatchNotification(alerts, severity as Alert['severity']);
    });
  }

  /**
   * Send batch notification
   */
  private async sendBatchNotification(alerts: Alert[], severity: Alert['severity']): Promise<void> {
    const consoleChannel = this.channels.get('console');
    if (consoleChannel && consoleChannel.enabled) {
      const count = alerts.length;
      const emoji = this.getSeverityEmoji(severity);

      console.log(`${emoji} Batch Alert: ${count} ${severity} alerts detected`);

      if (consoleChannel.config.verbose) {
        alerts.forEach((alert, index) => {
          console.log(`  ${index + 1}. ${alert.metric}: ${alert.currentValue} (threshold: ${alert.threshold})`);
        });
      }
    }

    this.emit('batch-notification-sent', { alerts, severity });
  }

  /**
   * Update statistics
   */
  private updateStatistics(alert: Alert): void {
    this.statistics.total++;
    this.statistics.bySeverity[alert.severity]++;
    this.statistics.byCategory[alert.category]++;
    this.statistics.bySource[alert.source]++;

    if (alert.acknowledged) {
      this.statistics.acknowledged++;
    }

    if (alert.resolved) {
      this.statistics.resolved++;
    }

    if (alert.escalated) {
      this.statistics.escalated++;
    }

    if (alert.severity === 'critical' && !alert.acknowledged) {
      this.statistics.unacknowledgedCritical++;
    }
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate response ID
   */
  private generateResponseId(): string {
    return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string, userId: string, message?: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.acknowledged) {
      return;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    const response: AlertResponse = {
      id: this.generateResponseId(),
      type: 'acknowledgment',
      userId,
      message: message || 'Alert acknowledged',
      timestamp: new Date(),
    };
    alert.responses.push(response);

    if (alert.severity === 'critical') {
      this.statistics.unacknowledgedCritical--;
    }

    this.emit('alert-acknowledged', alert);
    this.saveAlerts();
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string, userId: string, message?: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return;
    }

    alert.resolved = true;
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();

    const response: AlertResponse = {
      id: this.generateResponseId(),
      type: 'resolution',
      userId,
      message: message || 'Alert resolved',
      timestamp: new Date(),
    };
    alert.responses.push(response);

    // Update average resolution time
    if (alert.timestamp) {
      const resolutionTime = alert.resolvedAt.getTime() - alert.timestamp.getTime();
      this.statistics.averageResolutionTime =
        (this.statistics.averageResolutionTime + resolutionTime) / 2;
    }

    this.emit('alert-resolved', alert);
    this.saveAlerts();
  }

  /**
   * Get alert by ID
   */
  public getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get all alerts with optional filtering
   */
  public getAlerts(filters: {
    severity?: Alert['severity'];
    category?: Alert['category'];
    acknowledged?: boolean;
    resolved?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Alert[] {
    let alerts = Array.from(this.alerts.values());

    // Apply filters
    if (filters.severity) {
      alerts = alerts.filter(alert => alert.severity === filters.severity);
    }
    if (filters.category) {
      alerts = alerts.filter(alert => alert.category === filters.category);
    }
    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
    }
    if (filters.resolved !== undefined) {
      alerts = alerts.filter(alert => alert.resolved === filters.resolved);
    }

    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    if (filters.offset) {
      alerts = alerts.slice(filters.offset);
    }
    if (filters.limit) {
      alerts = alerts.slice(0, filters.limit);
    }

    return alerts;
  }

  /**
   * Get statistics
   */
  public getStatistics(): AlertStatistics {
    return { ...this.statistics };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AlertSystemConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfiguration();
  }

  /**
   * Add alert channel
   */
  public addChannel(channel: AlertChannel): void {
    this.config.channels.push(channel);
    this.channels.set(channel.id, channel);
    this.saveConfiguration();
  }

  /**
   * Add alert rule
   */
  public addRule(rule: AlertRule): void {
    this.config.rules.push(rule);
    this.rules.set(rule.id, rule);
    this.saveConfiguration();
  }

  /**
   * Stop alert system
   */
  public stop(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // Process remaining batch
    if (this.batchQueue.length > 0) {
      this.processBatch();
    }

    this.emit('system-stopped');
  }
}

// Export singleton instance
export const budgetAlertSystem = BudgetAlertSystem.getInstance();

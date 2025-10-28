/**
 * Auto-scaling Service - Automated resource scaling based on demand
 */

interface ScalingMetric {
  name: string;
  value: number;
  threshold: number;
  comparison: 'greater_than' | 'less_than' | 'equal_to';
  weight: number;
}

interface ScalingRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metrics: ScalingMetric[];
  cooldownPeriod: number; // minutes
  scaleUpAction: ScalingAction;
  scaleDownAction: ScalingAction;
  lastTriggered?: Date;
  triggerCount: number;
}

interface ScalingAction {
  type: 'increase_workers' | 'decrease_workers' | 'increase_memory' | 'decrease_memory' | 'custom';
  value: number;
  max?: number;
  min?: number;
  config?: Record<string, any>;
}

interface ScalingEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  action: ScalingAction;
  triggeredAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  metrics: Record<string, number>;
  message: string;
  error?: string;
}

export class AutoScalingService {
  private static instance: AutoScalingService;
  private rules: Map<string, ScalingRule> = new Map();
  private events: ScalingEvent[] = [];
  private isScaling: boolean = false;
  private currentWorkers: number = 1;
  private currentMemory: number = 128; // MB

  private constructor() {
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  static getInstance(): AutoScalingService {
    if (!AutoScalingService.instance) {
      AutoScalingService.instance = new AutoScalingService();
    }
    return AutoScalingService.instance;
  }

  private initializeDefaultRules(): void {
    // High CPU usage scaling rule
    this.registerRule({
      id: 'high-cpu-usage',
      name: 'High CPU Usage Scale Up',
      description: 'Scale up when CPU usage exceeds 80%',
      enabled: true,
      cooldownPeriod: 10,
      metrics: [
        {
          name: 'cpu_usage',
          value: 0,
          threshold: 80,
          comparison: 'greater_than',
          weight: 1.0
        }
      ],
      scaleUpAction: {
        type: 'increase_workers',
        value: 1,
        max: 10
      },
      scaleDownAction: {
        type: 'decrease_workers',
        value: 1,
        min: 1
      },
      triggerCount: 0
    });

    // High memory usage scaling rule
    this.registerRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage Scale Up',
      description: 'Scale up when memory usage exceeds 85%',
      enabled: true,
      cooldownPeriod: 15,
      metrics: [
        {
          name: 'memory_usage',
          value: 0,
          threshold: 85,
          comparison: 'greater_than',
          weight: 1.0
        }
      ],
      scaleUpAction: {
        type: 'increase_memory',
        value: 64,
        max: 1024
      },
      scaleDownAction: {
        type: 'decrease_memory',
        value: 32,
        min: 128
      },
      triggerCount: 0
    });

    // High response time scaling rule
    this.registerRule({
      id: 'high-response-time',
      name: 'High Response Time Scale Up',
      description: 'Scale up when average response time exceeds 1000ms',
      enabled: true,
      cooldownPeriod: 5,
      metrics: [
        {
          name: 'avg_response_time',
          value: 0,
          threshold: 1000,
          comparison: 'greater_than',
          weight: 0.8
        },
        {
          name: 'request_rate',
          value: 0,
          threshold: 100,
          comparison: 'greater_than',
          weight: 0.2
        }
      ],
      scaleUpAction: {
        type: 'increase_workers',
        value: 2,
        max: 10
      },
      scaleDownAction: {
        type: 'decrease_workers',
        value: 1,
        min: 1
      },
      triggerCount: 0
    });

    // Low usage scale down rule
    this.registerRule({
      id: 'low-usage-scale-down',
      name: 'Low Usage Scale Down',
      description: 'Scale down when resources are underutilized',
      enabled: true,
      cooldownPeriod: 20,
      metrics: [
        {
          name: 'cpu_usage',
          value: 0,
          threshold: 20,
          comparison: 'less_than',
          weight: 0.4
        },
        {
          name: 'memory_usage',
          value: 0,
          threshold: 30,
          comparison: 'less_than',
          weight: 0.3
        },
        {
          name: 'request_rate',
          value: 0,
          threshold: 10,
          comparison: 'less_than',
          weight: 0.3
        }
      ],
      scaleUpAction: {
        type: 'increase_workers',
        value: 1,
        max: 10
      },
      scaleDownAction: {
        type: 'decrease_workers',
        value: 1,
        min: 1
      },
      triggerCount: 0
    });
  }

  private startMonitoring(): void {
    // Monitor metrics every 30 seconds
    setInterval(() => {
      this.checkScalingRules();
    }, 30 * 1000);
  }

  private async checkScalingRules(): Promise<void> {
    if (this.isScaling) return;

    const metrics = await this.collectMetrics();
    const currentTime = new Date();

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown period
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = (currentTime.getTime() - rule.lastTriggered.getTime()) / 1000 / 60;
        if (timeSinceLastTrigger < rule.cooldownPeriod) continue;
      }

      const shouldScale = this.evaluateRule(rule, metrics);

      if (shouldScale) {
        await this.triggerScaling(rule, metrics);
      }
    }
  }

  private async collectMetrics(): Promise<Record<string, number>> {
    const metrics: Record<string, number> = {};

    try {
      // Collect CPU usage
      metrics.cpu_usage = await this.getCPUUsage();

      // Collect memory usage
      metrics.memory_usage = await this.getMemoryUsage();

      // Collect response time
      metrics.avg_response_time = await this.getAverageResponseTime();

      // Collect request rate
      metrics.request_rate = await this.getRequestRate();

      // Collect active connections
      metrics.active_connections = await this.getActiveConnections();

      // Collect error rate
      metrics.error_rate = await this.getErrorRate();

    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }

    return metrics;
  }

  private async getCPUUsage(): Promise<number> {
    // Implement CPU usage collection
    // This would use Cloudflare Workers metrics or external monitoring
    return Math.random() * 100; // Placeholder
  }

  private async getMemoryUsage(): Promise<number> {
    // Implement memory usage collection
    return Math.random() * 100; // Placeholder
  }

  private async getAverageResponseTime(): Promise<number> {
    // Implement response time collection from your monitoring system
    return Math.random() * 2000; // Placeholder
  }

  private async getRequestRate(): Promise<number> {
    // Implement request rate collection
    return Math.random() * 1000; // Placeholder
  }

  private async getActiveConnections(): Promise<number> {
    // Implement active connections collection
    return Math.floor(Math.random() * 100); // Placeholder
  }

  private async getErrorRate(): Promise<number> {
    // Implement error rate collection
    return Math.random() * 10; // Placeholder
  }

  private evaluateRule(rule: ScalingRule, metrics: Record<string, number>): boolean {
    let totalScore = 0;
    let totalWeight = 0;

    for (const metric of rule.metrics) {
      const metricValue = metrics[metric.name] || 0;
      let conditionMet = false;

      switch (metric.comparison) {
        case 'greater_than':
          conditionMet = metricValue > metric.threshold;
          break;
        case 'less_than':
          conditionMet = metricValue < metric.threshold;
          break;
        case 'equal_to':
          conditionMet = metricValue === metric.threshold;
          break;
      }

      if (conditionMet) {
        totalScore += metric.weight;
      }

      totalWeight += metric.weight;
    }

    // Scale if more than 50% of weighted metrics meet conditions
    const threshold = totalWeight * 0.5;
    return totalScore >= threshold;
  }

  private async triggerScaling(rule: ScalingRule, metrics: Record<string, number>): Promise<void> {
    this.isScaling = true;

    const eventId = `scaling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const event: ScalingEvent = {
      id: eventId,
      ruleId: rule.id,
      ruleName: rule.name,
      action: rule.scaleUpAction, // Default to scale up
      triggeredAt: new Date(),
      status: 'pending',
      metrics,
      message: 'Scaling action triggered'
    };

    this.events.push(event);

    try {
      // Determine if we should scale up or down based on metrics
      const shouldScaleUp = this.shouldScaleUp(rule, metrics);
      event.action = shouldScaleUp ? rule.scaleUpAction : rule.scaleDownAction;

      console.log(`Triggering ${shouldScaleUp ? 'scale up' : 'scale down'} action: ${event.action.type}`);

      // Execute scaling action
      await this.executeScalingAction(event.action);

      // Update rule
      rule.lastTriggered = new Date();
      rule.triggerCount++;

      // Complete event
      event.status = 'completed';
      event.completedAt = new Date();
      event.message = `Successfully executed ${shouldScaleUp ? 'scale up' : 'scale down'} action`;

      console.log(`Scaling completed: ${event.message}`);

    } catch (error) {
      event.status = 'failed';
      event.completedAt = new Date();
      event.error = error instanceof Error ? error.message : 'Unknown error';
      event.message = 'Scaling action failed';

      console.error('Scaling failed:', error);
    } finally {
      this.isScaling = false;

      // Keep only last 1000 events
      if (this.events.length > 1000) {
        this.events = this.events.slice(-1000);
      }
    }
  }

  private shouldScaleUp(rule: ScalingRule, metrics: Record<string, number>): boolean {
    // Simple heuristic: if most metrics are above thresholds, scale up
    let aboveThreshold = 0;
    let totalMetrics = 0;

    for (const metric of rule.metrics) {
      const metricValue = metrics[metric.name] || 0;
      totalMetrics++;

      if (metric.comparison === 'greater_than' && metricValue > metric.threshold) {
        aboveThreshold++;
      } else if (metric.comparison === 'less_than' && metricValue < metric.threshold) {
        aboveThreshold++;
      }
    }

    return aboveThreshold > totalMetrics / 2;
  }

  private async executeScalingAction(action: ScalingAction): Promise<void> {
    switch (action.type) {
      case 'increase_workers':
        await this.scaleUpWorkers(action.value, action.max);
        break;
      case 'decrease_workers':
        await this.scaleDownWorkers(action.value, action.min);
        break;
      case 'increase_memory':
        await this.scaleUpMemory(action.value, action.max);
        break;
      case 'decrease_memory':
        await this.scaleDownMemory(action.value, action.min);
        break;
      case 'custom':
        await this.executeCustomAction(action);
        break;
    }
  }

  private async scaleUpWorkers(increment: number, max?: number): Promise<void> {
    const newWorkers = Math.min(this.currentWorkers + increment, max || 10);

    // Implement worker scaling logic
    // This would use Cloudflare Workers or other scaling mechanisms

    this.currentWorkers = newWorkers;
    console.log(`Scaled up workers to ${newWorkers}`);
  }

  private async scaleDownWorkers(decrement: number, min?: number): Promise<void> {
    const newWorkers = Math.max(this.currentWorkers - decrement, min || 1);

    // Implement worker scaling logic
    this.currentWorkers = newWorkers;
    console.log(`Scaled down workers to ${newWorkers}`);
  }

  private async scaleUpMemory(increment: number, max?: number): Promise<void> {
    const newMemory = Math.min(this.currentMemory + increment, max || 1024);

    // Implement memory scaling logic
    this.currentMemory = newMemory;
    console.log(`Scaled up memory to ${newMemory}MB`);
  }

  private async scaleDownMemory(decrement: number, min?: number): Promise<void> {
    const newMemory = Math.max(this.currentMemory - decrement, min || 128);

    // Implement memory scaling logic
    this.currentMemory = newMemory;
    console.log(`Scaled down memory to ${newMemory}MB`);
  }

  private async executeCustomAction(action: ScalingAction): Promise<void> {
    // Implement custom scaling action
    console.log('Executing custom scaling action:', action.config);
  }

  registerRule(rule: Omit<ScalingRule, 'lastTriggered' | 'triggerCount'>): void {
    const fullRule: ScalingRule = {
      ...rule,
      triggerCount: 0
    };

    this.rules.set(rule.id, fullRule);
  }

  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<ScalingRule>): void {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    Object.assign(rule, updates);
  }

  getRule(ruleId: string): ScalingRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): ScalingRule[] {
    return Array.from(this.rules.values());
  }

  getScalingEvents(limit: number = 100): ScalingEvent[] {
    return this.events.slice(-limit);
  }

  getCurrentResources(): {
    workers: number;
    memory: number;
    isScaling: boolean;
  } {
    return {
      workers: this.currentWorkers,
      memory: this.currentMemory,
      isScaling: this.isScaling
    };
  }

  getScalingStats(): {
    totalRules: number;
    enabledRules: number;
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    averageScaleTime: number;
    currentWorkers: number;
    currentMemory: number;
  } {
    const rules = this.getAllRules();
    const events = this.getScalingEvents(100);

    const successfulEvents = events.filter(e => e.status === 'completed').length;
    const failedEvents = events.filter(e => e.status === 'failed').length;

    const completedEvents = events.filter(e => e.status === 'completed' && e.completedAt);
    const averageScaleTime = completedEvents.length > 0
      ? completedEvents.reduce((sum, e) => sum + (e.completedAt!.getTime() - e.triggeredAt.getTime()), 0) / completedEvents.length
      : 0;

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      totalEvents: events.length,
      successfulEvents,
      failedEvents,
      averageScaleTime,
      currentWorkers: this.currentWorkers,
      currentMemory: this.currentMemory
    };
  }
}

// Export singleton instance
export const autoScalingService = AutoScalingService.getInstance();

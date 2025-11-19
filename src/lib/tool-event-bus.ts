/**
 * Tool Event Bus
 * Provides communication and coordination between tools
 */

export interface ToolEvent {
  id: string;
  type: string;
  source: string;
  target?: string;
  timestamp: number;
  data: any;
  metadata?: {
    priority: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number; // Time to live in milliseconds
    retryCount?: number;
    maxRetries?: number;
  };
}

export interface EventHandler {
  id: string;
  eventType: string;
  handler: (event: ToolEvent) => Promise<void> | void;
  priority: number;
  once?: boolean;
  filter?: (event: ToolEvent) => boolean;
}

export interface Subscription {
  id: string;
  subscriber: string;
  eventType: string;
  handler: EventHandler['handler'];
  filter?: EventHandler['filter'];
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

export interface EventBusMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  averageProcessingTime: number;
  failedEvents: number;
  activeSubscriptions: number;
  queueSize: number;
}

export class ToolEventBus {
  private static instance: ToolEventBus;
  private handlers: Map<string, EventHandler[]>;
  private subscriptions: Map<string, Subscription>;
  private eventQueue: ToolEvent[];
  private processing: boolean;
  private maxQueueSize: number;
  private defaultTTL: number;
  private metrics: EventBusMetrics;
  private eventHistory: ToolEvent[];
  private maxHistorySize: number;
  private eventListeners: Map<string, Function[]>;

  private constructor(config: {
    maxQueueSize?: number;
    defaultTTL?: number;
    maxHistorySize?: number;
  } = {}) {
    this.handlers = new Map();
    this.subscriptions = new Map();
    this.eventQueue = [];
    this.processing = false;
    this.maxQueueSize = config.maxQueueSize || 1000;
    this.defaultTTL = config.defaultTTL || 30000; // 30 seconds
    this.maxHistorySize = config.maxHistorySize || 1000;

    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      eventsBySource: {},
      averageProcessingTime: 0,
      failedEvents: 0,
      activeSubscriptions: 0,
      queueSize: 0,
    };

    this.eventHistory = [];
    this.eventListeners = new Map();

    // Start processing loop
    this.startProcessingLoop();

    // Start cleanup loop
    this.startCleanupLoop();
  }

  public static getInstance(config?: {
    maxQueueSize?: number;
    defaultTTL?: number;
    maxHistorySize?: number;
  }): ToolEventBus {
    if (!ToolEventBus.instance) {
      ToolEventBus.instance = new ToolEventBus(config);
    }
    return ToolEventBus.instance;
  }

  /**
   * Publish an event
   */
  public publish(event: Omit<ToolEvent, 'id' | 'timestamp'>): string {
    const eventId = this.generateEventId();
    const fullEvent: ToolEvent = {
      id: eventId,
      timestamp: Date.now(),
      metadata: {
        priority: 'normal',
        ttl: this.defaultTTL,
        retryCount: 0,
        maxRetries: 3,
      },
      ...event,
    };

    // Validate event
    this.validateEvent(fullEvent);

    // Add to queue
    if (this.eventQueue.length >= this.maxQueueSize) {
      // Remove oldest event if queue is full
      const dropped = this.eventQueue.shift();
      this.emit('event:dropped', { event: dropped });
    }

    this.eventQueue.push(fullEvent);
    this.metrics.queueSize = this.eventQueue.length;
    this.metrics.totalEvents++;

    // Update metrics
    this.metrics.eventsByType[fullEvent.type] = (this.metrics.eventsByType[fullEvent.type] || 0) + 1;
    this.metrics.eventsBySource[fullEvent.source] = (this.metrics.eventsBySource[fullEvent.source] || 0) + 1;

    // Add to history
    this.addToHistory(fullEvent);

    this.emit('event:published', { event: fullEvent });
    return eventId;
  }

  /**
   * Subscribe to events
   */
  public subscribe(
    subscriber: string,
    eventType: string,
    handler: EventHandler['handler'],
    options: {
      priority?: number;
      once?: boolean;
      filter?: (event: ToolEvent) => boolean;
    } = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId();

    const subscription: Subscription = {
      id: subscriptionId,
      subscriber,
      eventType,
      handler,
      filter: options.filter,
      createdAt: Date.now(),
      triggerCount: 0,
    };

    // Add to subscription map
    this.subscriptions.set(subscriptionId, subscription);

    // Also add to handlers map for efficient lookup
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const eventHandler: EventHandler = {
      id: subscriptionId,
      eventType,
      handler,
      priority: options.priority || 0,
      once: options.once,
      filter: options.filter,
    };

    this.handlers.get(eventType)!.push(eventHandler);

    // Sort handlers by priority (high to low)
    this.handlers.get(eventType)!.sort((a, b) => b.priority - a.priority);

    this.metrics.activeSubscriptions = this.subscriptions.size;
    this.emit('subscription:created', { subscriptionId, subscriber, eventType });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    // Remove from subscription map
    this.subscriptions.delete(subscriptionId);

    // Remove from handlers map
    const handlers = this.handlers.get(subscription.eventType);
    if (handlers) {
      const index = handlers.findIndex(h => h.id === subscriptionId);
      if (index !== -1) {
        handlers.splice(index, 1);
      }

      // Clean up empty handler arrays
      if (handlers.length === 0) {
        this.handlers.delete(subscription.eventType);
      }
    }

    this.metrics.activeSubscriptions = this.subscriptions.size;
    this.emit('subscription:removed', { subscriptionId });
    return true;
  }

  /**
   * Unsubscribe all handlers for a subscriber
   */
  public unsubscribeAll(subscriber: string): number {
    const subscriptionIds = Array.from(this.subscriptions.entries())
      .filter(([_, sub]) => sub.subscriber === subscriber)
      .map(([id, _]) => id);

    subscriptionIds.forEach(id => this.unsubscribe(id));

    this.emit('subscriber:removed', { subscriber, subscriptionIds });
    return subscriptionIds.length;
  }

  /**
   * Get subscriptions for a subscriber
   */
  public getSubscriptions(subscriber?: string): Subscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => !subscriber || sub.subscriber === subscriber);
  }

  /**
   * Get event history
   */
  public getEventHistory(eventType?: string, source?: string, limit?: number): ToolEvent[] {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }

    if (source) {
      history = history.filter(event => event.source === source);
    }

    if (limit && limit > 0) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Send event to specific target
   */
  public send(target: string, eventType: string, data: any, options: {
    priority?: ToolEvent['metadata']['priority'];
    ttl?: number;
  } = {}): string {
    return this.publish({
      type: eventType,
      source: 'system',
      target,
      data,
      metadata: {
        priority: options.priority || 'normal',
        ttl: options.ttl || this.defaultTTL,
        retryCount: 0,
        maxRetries: 3,
      },
    });
  }

  /**
   * Broadcast event to all subscribers
   */
  public broadcast(eventType: string, data: any, options: {
    priority?: ToolEvent['metadata']['priority'];
    ttl?: number;
    exclude?: string[];
  } = {}): string {
    return this.publish({
      type: eventType,
      source: 'system',
      data,
      metadata: {
        priority: options.priority || 'normal',
        ttl: options.ttl || this.defaultTTL,
        retryCount: 0,
        maxRetries: 3,
      },
    });
  }

  /**
   * Request-response pattern
   */
  public async request(
    target: string,
    eventType: string,
    data: any,
    timeout: number = 5000
  ): Promise<any> {
    const responseEventId = this.generateEventId();
    const responseEventType = `${eventType}:response`;

    return new Promise((resolve, reject) => {
      // Subscribe for response
      const subscriptionId = this.subscribe(
        'requester',
        responseEventType,
        (event) => {
          if (event.data.requestId === responseEventId) {
            this.unsubscribe(subscriptionId);

            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          }
        },
        { once: true }
      );

      // Send request
      this.publish({
        type: eventType,
        source: 'requester',
        target,
        data: {
          ...data,
          requestId: responseEventId,
        },
      });

      // Setup timeout
      setTimeout(() => {
        this.unsubscribe(subscriptionId);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Get metrics
   */
  public getMetrics(): EventBusMetrics {
    return {
      ...this.metrics,
      queueSize: this.eventQueue.length,
      activeSubscriptions: this.subscriptions.size,
    };
  }

  /**
   * Clear event queue
   */
  public clearQueue(): number {
    const clearedCount = this.eventQueue.length;
    this.eventQueue.length = 0;
    this.metrics.queueSize = 0;
    this.emit('queue:cleared', { clearedCount });
    return clearedCount;
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory.length = 0;
    this.emit('history:cleared');
  }

  /**
   * Start processing loop
   */
  private startProcessingLoop(): void {
    const processEvents = async () => {
      if (this.processing || this.eventQueue.length === 0) {
        setTimeout(processEvents, 10);
        return;
      }

      this.processing = true;
      const startTime = performance.now();

      try {
        // Process events in priority order
        this.eventQueue.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
          const aPriority = priorityOrder[a.metadata?.priority || 'normal'];
          const bPriority = priorityOrder[b.metadata?.priority || 'normal'];

          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }

          return a.timestamp - b.timestamp;
        });

        const eventsToProcess = this.eventQueue.splice(0); // Take all events
        this.metrics.queueSize = 0;

        for (const event of eventsToProcess) {
          await this.processEvent(event);
        }
      } catch (error) {
        console.error('Error processing events:', error);
      } finally {
        const processingTime = performance.now() - startTime;
        this.metrics.averageProcessingTime =
          (this.metrics.averageProcessingTime + processingTime) / 2;

        this.processing = false;
        setTimeout(processEvents, 1);
      }
    };

    setTimeout(processEvents, 1);
  }

  /**
   * Process a single event
   */
  private async processEvent(event: ToolEvent): Promise<void> {
    try {
      // Check TTL
      if (this.isEventExpired(event)) {
        this.emit('event:expired', { event });
        return;
      }

      // Get handlers for this event type
      const handlers = this.handlers.get(event.type) || [];

      // If event has a specific target, only process handlers from that target
      const filteredHandlers = event.target
        ? handlers.filter(handler => {
            const subscription = this.subscriptions.get(handler.id);
            return subscription?.subscriber === event.target;
          })
        : handlers;

      // Process handlers
      for (const handler of filteredHandlers) {
        try {
          // Apply filter if present
          if (handler.filter && !handler.filter(event)) {
            continue;
          }

          // Execute handler
          await handler.handler(event);

          // Update subscription stats
          const subscription = this.subscriptions.get(handler.id);
          if (subscription) {
            subscription.triggerCount++;
            subscription.lastTriggered = Date.now();
          }

          // Remove once handlers
          if (handler.once) {
            this.unsubscribe(handler.id);
          }

        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
          this.metrics.failedEvents++;
          this.emit('handler:error', { handler, event, error });
        }
      }

      this.emit('event:processed', { event });

    } catch (error) {
      console.error('Error processing event:', error);
      this.metrics.failedEvents++;
      this.emit('event:error', { event, error });
    }
  }

  /**
   * Check if event is expired
   */
  private isEventExpired(event: ToolEvent): boolean {
    if (!event.metadata?.ttl) return false;
    return Date.now() - event.timestamp > event.metadata.ttl;
  }

  /**
   * Start cleanup loop
   */
  private startCleanupLoop(): void {
    const cleanup = () => {
      const now = Date.now();

      // Clean up expired subscriptions (optional - implement if needed)

      // Clean up old history
      if (this.eventHistory.length > this.maxHistorySize) {
        const excess = this.eventHistory.length - this.maxHistorySize;
        this.eventHistory.splice(0, excess);
      }

      // Run cleanup every minute
      setTimeout(cleanup, 60000);
    };

    // Run initial cleanup after 1 minute
    setTimeout(cleanup, 60000);
  }

  /**
   * Add event to history
   */
  private addToHistory(event: ToolEvent): void {
    this.eventHistory.push(event);

    // Maintain history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Validate event
   */
  private validateEvent(event: ToolEvent): void {
    if (!event.type) {
      throw new Error('Event must have a type');
    }

    if (!event.source) {
      throw new Error('Event must have a source');
    }

    if (event.metadata?.ttl && event.metadata.ttl <= 0) {
      throw new Error('Event TTL must be greater than 0');
    }
  }

  /**
   * Generate unique IDs
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event handling for the bus itself
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event bus listener for ${event}:`, error);
      }
    });
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Clear all data
    this.handlers.clear();
    this.subscriptions.clear();
    this.eventQueue.length = 0;
    this.eventHistory.length = 0;
    this.eventListeners.clear();

    // Reset metrics
    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      eventsBySource: {},
      averageProcessingTime: 0,
      failedEvents: 0,
      activeSubscriptions: 0,
      queueSize: 0,
    };

    this.emit('bus:disposed', {});
  }
}

// Global event bus instance
export const eventBus = ToolEventBus.getInstance();

export default ToolEventBus;

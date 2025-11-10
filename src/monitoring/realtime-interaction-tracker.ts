/**
 * Real-time Interaction Tracker - Advanced Real-time User Behavior Monitoring for SC-012 Compliance
 * Provides real-time tracking, analysis, and alerting for user interactions
 */

import { userAnalytics } from './user-analytics';
import { navigationAnalysis } from './navigation-analysis';
import { featureUsageAnalytics } from './feature-usage-analytics';

export interface RealtimeInteraction {
  id: string;
  type: InteractionType;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  element: ElementInfo;
  coordinates?: Coordinates;
  metadata?: Record<string, any>;
  performance: InteractionPerformance;
  context: InteractionContext;
  sequence: number;
  batchId?: string;
}

export interface ElementInfo {
  tagName: string;
  id?: string;
  classes?: string[];
  text?: string;
  selector: string;
  xpath?: string;
  attributes: Record<string, string>;
  isVisible: boolean;
  isInteractive: boolean;
  zIndex?: number;
  position?: { x: number; y: number; width: number; height: number };
}

export interface InteractionPerformance {
  responseTime: number; // Time from interaction to system response
  renderTime: number; // Time to render any UI changes
  networkRequests: number; // Number of network requests triggered
  memoryUsage?: number; // Memory usage change
  cpuUsage?: number; // CPU usage spike
  errorOccurred: boolean;
  errorMessage?: string;
}

export interface InteractionContext {
  page: string;
  referrer?: string;
  userAgent: string;
  viewport: { width: number; height: number };
  scrollPosition: { x: number; y: number };
  focusElement?: string;
  modalOpen: boolean;
  formActive: boolean;
  currentTool?: string;
  userIntent?: string;
  sessionDuration: number;
  totalInteractions: number;
  previousInteraction?: RealtimeInteraction;
}

export interface InteractionType {
  category: 'mouse' | 'keyboard' | 'touch' | 'form' | 'navigation' | 'media' | 'custom';
  action: string;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  gesture?: string;
  pressure?: number; // For touch devices
  velocity?: { x: number; y: number };
}

export interface Coordinates {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}

export interface RealtimeMetrics {
  // Current session metrics
  currentSessionId: string;
  sessionDuration: number;
  totalInteractions: number;
  interactionsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;

  // Real-time interaction patterns
  currentActivity: 'active' | 'idle' | 'away';
  lastInteractionTime: Date;
  idleTime: number;
  activeZones: Array<{ element: string; x: number; y: number; width: number; height: number; heat: number }>;

  // Performance metrics
  currentResponseTime: number;
  averageRenderTime: number;
  networkRequestRate: number;
  memoryUsage: number;
  cpuUsage: number;

  // User behavior patterns
  mouseMovements: Array<{ x: number; y: number; timestamp: Date; velocity: number }>;
  clickPatterns: Array<{ element: string; timestamp: Date; sequence: number }>;
  scrollPattern: { direction: 'up' | 'down' | 'none'; velocity: number; smoothness: number };
  typingPattern: { speed: number; accuracy: number; rhythm: number };

  // Context awareness
  currentFocus: string;
  modalInteraction: boolean;
  formProgress: Array<{ formId: string; fields: number; completed: number; percentage: number }>;
  toolUsage: Array<{ toolId: string; startTime: Date; interactions: number; status: string }>;

  // Alerts and anomalies
  alerts: Array<{
    id: string;
    type: 'error' | 'performance' | 'behavior' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;

  // Predictions and recommendations
  nextLikelyAction: string;
  userSatisfactionPrediction: number;
  abandonmentRisk: number;
  conversionProbability: number;
}

export interface InteractionBatch {
  id: string;
  sessionId: string;
  timestamp: Date;
  interactions: RealtimeInteraction[];
  summary: {
    totalInteractions: number;
    duration: number;
    averageResponseTime: number;
    errorCount: number;
    uniqueElements: number;
  };
  insights: string[];
}

export interface HeatmapData {
  page: string;
  timestamp: Date;
  resolution: { width: number; height: number };
  clicks: Array<{ x: number; y: number; intensity: number }>;
  movements: Array<{ x: number; y: number; intensity: number }>;
  scrolls: Array<{ y: number; intensity: number }>;
  zones: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    intensity: number;
    element: string;
  }>;
}

export interface SessionRecording {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  events: Array<{
    type: string;
    timestamp: number;
    data: any;
  }>;
  metadata: {
    userAgent: string;
    resolution: { width: number; height: number };
    pageUrl: string;
    totalDuration: number;
    interactionCount: number;
  };
}

export class RealtimeInteractionTracker {
  private static instance: RealtimeInteractionTracker;
  private isTracking = false;
  private currentSessionId: string;
  private interactionSequence = 0;
  private interactions: RealtimeInteraction[] = [];
  private activeBatch?: InteractionBatch;
  private metrics: RealtimeMetrics;
  private heatmapData: HeatmapData;
  private sessionRecording?: SessionRecording;
  private observers: MutationObserver[] = [];
  private timers: NodeJS.Timeout[] = [];
  private alertHandlers: Map<string, (alert: any) => void> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private gestureRecognizer: GestureRecognizer;
  private anomalyDetector: AnomalyDetector;

  private constructor() {
    this.currentSessionId = this.generateSessionId();
    this.metrics = this.initializeMetrics();
    this.heatmapData = this.initializeHeatmapData();
    this.performanceMonitor = new PerformanceMonitor();
    this.gestureRecognizer = new GestureRecognizer();
    this.anomalyDetector = new AnomalyDetector();
  }

  public static getInstance(): RealtimeInteractionTracker {
    if (!RealtimeInteractionTracker.instance) {
      RealtimeInteractionTracker.instance = new RealtimeInteractionTracker();
    }
    return RealtimeInteractionTracker.instance;
  }

  // Start real-time tracking
  public startTracking(options: {
    recordSession?: boolean;
    enableHeatmap?: boolean;
    enableGestures?: boolean;
    batchSize?: number;
    flushInterval?: number;
  } = {}): void {
    if (this.isTracking) return;

    const {
      recordSession = true,
      enableHeatmap = true,
      enableGestures = true,
      batchSize = 50,
      flushInterval = 5000,
    } = options;

    this.isTracking = true;
    this.interactionSequence = 0;

    // Initialize session recording if enabled
    if (recordSession) {
      this.initializeSessionRecording();
    }

    // Setup event listeners
    this.setupEventListeners(enableGestures);

    // Start performance monitoring
    this.performanceMonitor.start();

    // Start batch processing
    this.startBatchProcessing(batchSize, flushInterval);

    // Start metrics updates
    this.startMetricsUpdates();

    // Start idle detection
    this.startIdleDetection();

    // Start heatmap collection if enabled
    if (enableHeatmap) {
      this.startHeatmapCollection();
    }

    console.log('Real-time interaction tracking started');
  }

  // Stop real-time tracking
  public stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;

    // Remove event listeners
    this.removeEventListeners();

    // Stop performance monitoring
    this.performanceMonitor.stop();

    // Clear timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Flush remaining interactions
    if (this.activeBatch && this.activeBatch.interactions.length > 0) {
      this.flushBatch(this.activeBatch);
    }

    // Finalize session recording
    if (this.sessionRecording) {
      this.finalizeSessionRecording();
    }

    console.log('Real-time interaction tracking stopped');
  }

  // Track an interaction in real-time
  public trackInteraction(
    type: InteractionType,
    element: Element,
    metadata?: Record<string, any>
  ): RealtimeInteraction {
    if (!this.isTracking) return this.createDummyInteraction();

    const startTime = performance.now();
    const elementInfo = this.analyzeElement(element);
    const context = this.getCurrentContext();
    const coordinates = this.getCoordinates(type);

    const interaction: RealtimeInteraction = {
      id: this.generateInteractionId(),
      type,
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      element: elementInfo,
      coordinates,
      metadata,
      performance: this.performanceMonitor.measureInteraction(type, element),
      context,
      sequence: this.interactionSequence++,
    };

    // Add to current batch
    this.addToBatch(interaction);

    // Update metrics
    this.updateMetrics(interaction);

    // Update heatmap
    this.updateHeatmap(interaction);

    // Update session recording
    this.updateSessionRecording(interaction);

    // Detect anomalies
    this.anomalyDetector.analyzeInteraction(interaction);

    // Check for alerts
    this.checkForAlerts(interaction);

    // Update other analytics systems
    this.updateOtherSystems(interaction);

    return interaction;
  }

  // Get current real-time metrics
  public getCurrentMetrics(): RealtimeMetrics {
    this.updateMetricsFromCurrentState();
    return { ...this.metrics };
  }

  // Get current heatmap data
  public getCurrentHeatmap(): HeatmapData {
    return { ...this.heatmapData };
  }

  // Get session recording
  public getSessionRecording(): SessionRecording | undefined {
    return this.sessionRecording ? { ...this.sessionRecording } : undefined;
  }

  // Register alert handler
  public registerAlertHandler(type: string, handler: (alert: any) => void): void {
    this.alertHandlers.set(type, handler);
  }

  // Unregister alert handler
  public unregisterAlertHandler(type: string): void {
    this.alertHandlers.delete(type);
  }

  // Manually trigger an alert
  public triggerAlert(alert: Omit<RealtimeMetrics['alerts'][0], 'id' | 'timestamp' | 'resolved'>): void {
    const fullAlert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date(),
      resolved: false,
    };

    this.metrics.alerts.push(fullAlert);

    // Notify handlers
    const handler = this.alertHandlers.get(alert.type);
    if (handler) {
      handler(fullAlert);
    }

    console.warn(`Alert triggered: ${alert.message}`);
  }

  // Private methods

  private initializeMetrics(): RealtimeMetrics {
    return {
      currentSessionId: this.currentSessionId,
      sessionDuration: 0,
      totalInteractions: 0,
      interactionsPerMinute: 0,
      averageResponseTime: 0,
      errorRate: 0,
      currentActivity: 'active',
      lastInteractionTime: new Date(),
      idleTime: 0,
      activeZones: [],
      currentResponseTime: 0,
      averageRenderTime: 0,
      networkRequestRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      mouseMovements: [],
      clickPatterns: [],
      scrollPattern: { direction: 'none', velocity: 0, smoothness: 0 },
      typingPattern: { speed: 0, accuracy: 0, rhythm: 0 },
      currentFocus: '',
      modalInteraction: false,
      formProgress: [],
      toolUsage: [],
      alerts: [],
      nextLikelyAction: '',
      userSatisfactionPrediction: 0.8,
      abandonmentRisk: 0.1,
      conversionProbability: 0.7,
    };
  }

  private initializeHeatmapData(): HeatmapData {
    return {
      page: window.location.pathname,
      timestamp: new Date(),
      resolution: { width: window.innerWidth, height: window.innerHeight },
      clicks: [],
      movements: [],
      scrolls: [],
      zones: [],
    };
  }

  private setupEventListeners(enableGestures: boolean): void {
    // Mouse events
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('wheel', this.handleWheel.bind(this));

    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Touch events
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Form events
    document.addEventListener('submit', this.handleSubmit.bind(this));
    document.addEventListener('input', this.handleInput.bind(this));
    document.addEventListener('change', this.handleChange.bind(this));

    // Focus events
    document.addEventListener('focus', this.handleFocus.bind(this), true);
    document.addEventListener('blur', this.handleBlur.bind(this), true);

    // Scroll events
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // Page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Gesture events if enabled
    if (enableGestures) {
      this.setupGestureListeners();
    }

    // Performance monitoring
    this.setupPerformanceListeners();
  }

  private removeEventListeners(): void {
    // Remove all event listeners
    document.removeEventListener('click', this.handleClick.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('wheel', this.handleWheel.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('submit', this.handleSubmit.bind(this));
    document.removeEventListener('input', this.handleInput.bind(this));
    document.removeEventListener('change', this.handleChange.bind(this));
    document.removeEventListener('focus', this.handleFocus.bind(this), true);
    document.removeEventListener('blur', this.handleBlur.bind(this), true);
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleClick = (event: MouseEvent): void => {
    const type: InteractionType = {
      category: 'mouse',
      action: 'click',
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      },
    };

    this.trackInteraction(type, event.target as Element, {
      button: event.button,
      detail: event.detail,
    });
  };

  private handleMouseMove = (event: MouseEvent): void => {
    // Throttle mouse move events
    if (!this.metrics.mouseMovements.length ||
        Date.now() - this.metrics.mouseMovements[this.metrics.mouseMovements.length - 1].timestamp.getTime() > 50) {

      const lastMovement = this.metrics.mouseMovements[this.metrics.mouseMovements.length - 1];
      const velocity = lastMovement ?
        Math.sqrt(
          Math.pow(event.clientX - lastMovement.x, 2) +
          Math.pow(event.clientY - lastMovement.y, 2)
        ) / (Date.now() - lastMovement.timestamp.getTime()) : 0;

      this.metrics.mouseMovements.push({
        x: event.clientX,
        y: event.clientY,
        timestamp: new Date(),
        velocity,
      });

      // Keep only recent movements
      if (this.metrics.mouseMovements.length > 100) {
        this.metrics.mouseMovements = this.metrics.mouseMovements.slice(-50);
      }
    }
  };

  private handleMouseDown = (event: MouseEvent): void => {
    const type: InteractionType = {
      category: 'mouse',
      action: 'mousedown',
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      },
    };

    this.trackInteraction(type, event.target as Element, {
      button: event.button,
    });
  };

  private handleMouseUp = (event: MouseEvent): void => {
    const type: InteractionType = {
      category: 'mouse',
      action: 'mouseup',
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      },
    };

    this.trackInteraction(type, event.target as Element, {
      button: event.button,
    });
  };

  private handleWheel = (event: WheelEvent): void => {
    const type: InteractionType = {
      category: 'mouse',
      action: 'wheel',
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      },
    };

    this.trackInteraction(type, event.target as Element, {
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
      deltaMode: event.deltaMode,
    });
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    const type: InteractionType = {
      category: 'keyboard',
      action: 'keydown',
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      },
    };

    this.trackInteraction(type, event.target as Element, {
      key: event.key,
      code: event.code,
      location: event.location,
      repeat: event.repeat,
    });

    // Update typing pattern
    this.updateTypingPattern(event);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const type: InteractionType = {
      category: 'keyboard',
      action: 'keyup',
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      },
    };

    this.trackInteraction(type, event.target as Element, {
      key: event.key,
      code: event.code,
      location: event.location,
    });
  };

  private handleTouchStart = (event: TouchEvent): void => {
    const touch = event.touches[0];
    const type: InteractionType = {
      category: 'touch',
      action: 'touchstart',
      pressure: touch.force,
    };

    this.trackInteraction(type, event.target as Element, {
      touchCount: event.touches.length,
      identifier: touch.identifier,
    });
  };

  private handleTouchMove = (event: TouchEvent): void => {
    const touch = event.touches[0];
    const type: InteractionType = {
      category: 'touch',
      action: 'touchmove',
      pressure: touch.force,
    };

    this.trackInteraction(type, event.target as Element, {
      touchCount: event.touches.length,
      identifier: touch.identifier,
    });
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    const type: InteractionType = {
      category: 'touch',
      action: 'touchend',
    };

    this.trackInteraction(type, event.target as Element, {
      touchCount: event.touches.length,
    });
  };

  private handleSubmit = (event: SubmitEvent): void => {
    const type: InteractionType = {
      category: 'form',
      action: 'submit',
    };

    this.trackInteraction(type, event.target as Element, {
      formAction: (event.target as HTMLFormElement).action,
      formMethod: (event.target as HTMLFormElement).method,
    });

    // Update form progress
    this.updateFormProgress(event.target as HTMLFormElement, true);
  };

  private handleInput = (event: InputEvent): void => {
    const type: InteractionType = {
      category: 'form',
      action: 'input',
    };

    this.trackInteraction(type, event.target as Element, {
      inputType: event.inputType,
      data: event.data,
    });
  };

  private handleChange = (event: Event): void => {
    const type: InteractionType = {
      category: 'form',
      action: 'change',
    };

    this.trackInteraction(type, event.target as Element, {
      value: (event.target as HTMLInputElement).value,
    });
  };

  private handleFocus = (event: FocusEvent): void => {
    const type: InteractionType = {
      category: 'custom',
      action: 'focus',
    };

    this.trackInteraction(type, event.target as Element);
    this.metrics.currentFocus = this.generateSelector(event.target as Element);
  };

  private handleBlur = (event: FocusEvent): void => {
    const type: InteractionType = {
      category: 'custom',
      action: 'blur',
    };

    this.trackInteraction(type, event.target as Element);
    this.metrics.currentFocus = '';
  };

  private handleScroll = (event: Event): void => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

    // Update scroll pattern
    const lastScrollY = this.metrics.scrollPattern.direction === 'down' ?
      this.heatmapData.scrolls[this.heatmapData.scrolls.length - 1]?.y || 0 :
      this.heatmapData.scrolls[this.heatmapData.scrolls.length - 1]?.y || 0;

    const direction = scrollY > lastScrollY ? 'down' : scrollY < lastScrollY ? 'up' : 'none';
    const velocity = Math.abs(scrollY - lastScrollY);

    this.metrics.scrollPattern = {
      direction,
      velocity,
      smoothness: this.calculateScrollSmoothness(),
    };

    // Add to heatmap
    this.heatmapData.scrolls.push({
      y: scrollY,
      intensity: Math.min(1, velocity / 100),
    });

    // Keep heatmap data manageable
    if (this.heatmapData.scrolls.length > 1000) {
      this.heatmapData.scrolls = this.heatmapData.scrolls.slice(-500);
    }
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.metrics.currentActivity = 'away';
    } else {
      this.metrics.currentActivity = 'active';
      this.metrics.lastInteractionTime = new Date();
    }
  };

  private setupGestureListeners(): void {
    // This would integrate with the gesture recognizer
    // Implementation would depend on the specific gesture recognition library
  };

  private setupPerformanceListeners(): void {
    // Monitor performance events
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            // Handle performance measurements
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      this.observers.push(observer);
    }
  };

  private analyzeElement(element: Element): ElementInfo {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);

    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      classes: element.className ? element.className.split(' ').filter(c => c.trim()) : undefined,
      text: element.textContent?.substring(0, 100) || undefined,
      selector: this.generateSelector(element),
      xpath: this.generateXPath(element),
      attributes: this.getElementAttributes(element),
      isVisible: this.isElementVisible(element),
      isInteractive: this.isElementInteractive(element),
      zIndex: parseInt(styles.zIndex) || undefined,
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      },
    };
  }

  private getCurrentContext(): InteractionContext {
    const activeElement = document.activeElement;
    const modalElement = document.querySelector('[role="dialog"], .modal, .popup');

    return {
      page: window.location.pathname,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scrollPosition: {
        x: window.pageXOffset || document.documentElement.scrollLeft,
        y: window.pageYOffset || document.documentElement.scrollTop
      },
      focusElement: activeElement ? this.generateSelector(activeElement) : undefined,
      modalOpen: !!modalElement,
      formActive: !!document.querySelector('form:focus-within'),
      currentTool: this.detectCurrentTool(),
      sessionDuration: Date.now() - (this.metrics.sessionDuration || Date.now()),
      totalInteractions: this.metrics.totalInteractions,
      previousInteraction: this.interactions[this.interactions.length - 1],
    };
  }

  private getCoordinates(type: InteractionType): Coordinates | undefined {
    if (type.category === 'mouse' || type.category === 'touch') {
      const event = window.event as MouseEvent | TouchEvent;
      if (event) {
        const point = 'touches' in event ? event.touches[0] : event;
        return {
          x: point?.clientX || 0,
          y: point?.clientY || 0,
          screenX: point?.screenX || 0,
          screenY: point?.screenY || 0,
          clientX: point?.clientX || 0,
          clientY: point?.clientY || 0,
          pageX: point?.pageX || 0,
          pageY: point?.pageY || 0,
        };
      }
    }
    return undefined;
  }

  private addToBatch(interaction: RealtimeInteraction): void {
    if (!this.activeBatch) {
      this.activeBatch = this.createBatch();
    }

    this.activeBatch.interactions.push(interaction);

    // Check if batch should be flushed
    if (this.activeBatch.interactions.length >= 50) {
      this.flushBatch(this.activeBatch);
      this.activeBatch = this.createBatch();
    }
  }

  private createBatch(): InteractionBatch {
    return {
      id: this.generateBatchId(),
      sessionId: this.currentSessionId,
      timestamp: new Date(),
      interactions: [],
      summary: {
        totalInteractions: 0,
        duration: 0,
        averageResponseTime: 0,
        errorCount: 0,
        uniqueElements: 0,
      },
      insights: [],
    };
  }

  private flushBatch(batch: InteractionBatch): void {
    // Calculate batch summary
    batch.summary.totalInteractions = batch.interactions.length;
    batch.summary.duration = Date.now() - batch.timestamp.getTime();
    batch.summary.averageResponseTime = batch.interactions.reduce((sum, interaction) =>
      sum + interaction.performance.responseTime, 0) / batch.interactions.length;
    batch.summary.errorCount = batch.interactions.filter(i => i.performance.errorOccurred).length;
    batch.summary.uniqueElements = new Set(batch.interactions.map(i => i.element.selector)).size;

    // Generate insights
    batch.insights = this.generateBatchInsights(batch);

    // Send to analytics systems
    this.sendBatchToAnalytics(batch);

    // Add to interactions history
    this.interactions.push(...batch.interactions);

    // Keep interactions manageable
    if (this.interactions.length > 1000) {
      this.interactions = this.interactions.slice(-500);
    }
  }

  private startBatchProcessing(batchSize: number, flushInterval: number): void {
    const flushTimer = setInterval(() => {
      if (this.activeBatch && this.activeBatch.interactions.length > 0) {
        this.flushBatch(this.activeBatch);
        this.activeBatch = this.createBatch();
      }
    }, flushInterval);

    this.timers.push(flushTimer);
  }

  private startMetricsUpdates(): void {
    const updateTimer = setInterval(() => {
      this.updateMetricsFromCurrentState();
    }, 1000);

    this.timers.push(updateTimer);
  }

  private startIdleDetection(): void {
    const idleTimer = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - this.metrics.lastInteractionTime.getTime();

      if (timeSinceLastInteraction > 30000) { // 30 seconds
        this.metrics.currentActivity = 'idle';
        this.metrics.idleTime = timeSinceLastInteraction;
      } else {
        this.metrics.currentActivity = 'active';
        this.metrics.idleTime = 0;
      }
    }, 5000);

    this.timers.push(idleTimer);
  }

  private startHeatmapCollection(): void {
    // Periodically update heatmap zones
    const heatmapTimer = setInterval(() => {
      this.updateHeatmapZones();
    }, 10000);

    this.timers.push(heatmapTimer);
  }

  private updateMetrics(interaction: RealtimeInteraction): void {
    this.metrics.totalInteractions++;
    this.metrics.lastInteractionTime = interaction.timestamp;
    this.metrics.currentResponseTime = interaction.performance.responseTime;

    // Update average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalInteractions - 1) +
                              interaction.performance.responseTime;
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.totalInteractions;

    // Update error rate
    if (interaction.performance.errorOccurred) {
      const errorCount = this.metrics.errorRate * (this.metrics.totalInteractions - 1) + 1;
      this.metrics.errorRate = errorCount / this.metrics.totalInteractions;
    }

    // Update interactions per minute
    const sessionDuration = (Date.now() - this.metrics.sessionDuration) / 1000 / 60; // in minutes
    this.metrics.interactionsPerMinute = sessionDuration > 0 ?
      this.metrics.totalInteractions / sessionDuration : 0;

    // Update click patterns
    if (interaction.type.category === 'mouse' && interaction.type.action === 'click') {
      this.metrics.clickPatterns.push({
        element: interaction.element.selector,
        timestamp: interaction.timestamp,
        sequence: interaction.sequence,
      });

      // Keep only recent clicks
      if (this.metrics.clickPatterns.length > 50) {
        this.metrics.clickPatterns = this.metrics.clickPatterns.slice(-25);
      }
    }

    // Update predictions
    this.updatePredictions(interaction);
  }

  private updateMetricsFromCurrentState(): void {
    const now = Date.now();
    this.metrics.sessionDuration = now - (this.metrics.sessionDuration || now);
    this.metrics.networkRequestRate = this.performanceMonitor.getNetworkRequestRate();
    this.metrics.memoryUsage = this.performanceMonitor.getMemoryUsage();
    this.metrics.cpuUsage = this.performanceMonitor.getCpuUsage();
  }

  private updateHeatmap(interaction: RealtimeInteraction): void {
    if (interaction.coordinates) {
      if (interaction.type.category === 'mouse' && interaction.type.action === 'click') {
        this.heatmapData.clicks.push({
          x: interaction.coordinates.clientX,
          y: interaction.coordinates.clientY,
          intensity: 1,
        });

        if (this.heatmapData.clicks.length > 1000) {
          this.heatmapData.clicks = this.heatmapData.clicks.slice(-500);
        }
      }
    }

    // Update movement heatmap
    if (interaction.type.category === 'mouse' && interaction.type.action === 'mousemove') {
      if (interaction.coordinates) {
        this.heatmapData.movements.push({
          x: interaction.coordinates.clientX,
          y: interaction.coordinates.clientY,
          intensity: 0.5,
        });

        if (this.heatmapData.movements.length > 2000) {
          this.heatmapData.movements = this.heatmapData.movements.slice(-1000);
        }
      }
    }
  }

  private updateHeatmapZones(): void {
    // Group clicks and movements into zones
    const zones = new Map<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      intensity: number;
      element: string;
    }>();

    // Process clicks
    this.heatmapData.clicks.forEach(click => {
      const element = document.elementFromPoint(click.x, click.y);
      if (element) {
        const rect = element.getBoundingClientRect();
        const key = `${rect.left}_${rect.top}_${rect.width}_${rect.height}`;

        if (!zones.has(key)) {
          zones.set(key, {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            intensity: 0,
            element: this.generateSelector(element),
          });
        }

        zones.get(key)!.intensity += click.intensity;
      }
    });

    this.heatmapData.zones = Array.from(zones.values());
  }

  private initializeSessionRecording(): void {
    this.sessionRecording = {
      sessionId: this.currentSessionId,
      startTime: new Date(),
      events: [],
      metadata: {
        userAgent: navigator.userAgent,
        resolution: { width: window.innerWidth, height: window.innerHeight },
        pageUrl: window.location.href,
        totalDuration: 0,
        interactionCount: 0,
      },
    };
  }

  private updateSessionRecording(interaction: RealtimeInteraction): void {
    if (!this.sessionRecording) return;

    this.sessionRecording.events.push({
      type: 'interaction',
      timestamp: interaction.timestamp.getTime() - this.sessionRecording.startTime.getTime(),
      data: interaction,
    });

    this.sessionRecording.metadata.interactionCount++;
  }

  private finalizeSessionRecording(): void {
    if (!this.sessionRecording) return;

    this.sessionRecording.endTime = new Date();
    this.sessionRecording.metadata.totalDuration =
      this.sessionRecording.endTime.getTime() - this.sessionRecording.startTime.getTime();

    // Send to storage or analytics
    this.storeSessionRecording(this.sessionRecording);
  }

  private storeSessionRecording(recording: SessionRecording): void {
    // In a real implementation, this would send the recording to a server
    console.log('Session recording completed:', recording);
  }

  private updatePredictions(interaction: RealtimeInteraction): void {
    // Update next likely action based on sequence
    this.metrics.nextLikelyAction = this.predictNextAction(interaction);

    // Update user satisfaction prediction
    this.metrics.userSatisfactionPrediction = this.predictUserSatisfaction(interaction);

    // Update abandonment risk
    this.metrics.abandonmentRisk = this.predictAbandonmentRisk(interaction);

    // Update conversion probability
    this.metrics.conversionProbability = this.predictConversionProbability(interaction);
  }

  private predictNextAction(interaction: RealtimeInteraction): string {
    // Simple pattern-based prediction
    const recentInteractions = this.interactions.slice(-5);

    if (recentInteractions.length >= 2) {
      const lastInteraction = recentInteractions[recentInteractions.length - 1];
      const secondLastInteraction = recentInteractions[recentInteractions.length - 2];

      // If user clicked on a form field, likely next action is typing
      if (lastInteraction.element.tagName === 'input' || lastInteraction.element.tagName === 'textarea') {
        return 'typing';
      }

      // If user submitted a form, likely next action is navigation or viewing results
      if (lastInteraction.type.action === 'submit') {
        return 'navigation';
      }

      // If user is scrolling, likely next action is clicking on something in view
      if (lastInteraction.type.action === 'wheel') {
        return 'click';
      }
    }

    return 'unknown';
  }

  private predictUserSatisfaction(interaction: RealtimeInteraction): number {
    let satisfaction = this.metrics.userSatisfactionPrediction;

    // Adjust based on interaction performance
    if (interaction.performance.errorOccurred) {
      satisfaction -= 0.1;
    } else if (interaction.performance.responseTime < 100) {
      satisfaction += 0.02;
    } else if (interaction.performance.responseTime > 1000) {
      satisfaction -= 0.05;
    }

    // Adjust based on interaction patterns
    if (this.metrics.errorRate > 0.1) {
      satisfaction -= 0.1;
    }

    if (this.metrics.interactionsPerMinute > 30) {
      satisfaction += 0.05; // User is engaged
    }

    return Math.max(0, Math.min(1, satisfaction));
  }

  private predictAbandonmentRisk(interaction: RealtimeInteraction): number {
    let risk = this.metrics.abandonmentRisk;

    // Increase risk if user has been idle for a while
    if (this.metrics.idleTime > 60000) { // 1 minute
      risk += 0.1;
    }

    // Increase risk if there are errors
    if (interaction.performance.errorOccurred) {
      risk += 0.2;
    }

    // Increase risk if user is clicking rapidly (frustration)
    const recentClicks = this.metrics.clickPatterns.filter(click =>
      Date.now() - click.timestamp.getTime() < 5000
    );

    if (recentClicks.length > 10) {
      risk += 0.15;
    }

    return Math.max(0, Math.min(1, risk));
  }

  private predictConversionProbability(interaction: RealtimeInteraction): number {
    let probability = this.metrics.conversionProbability;

    // Increase probability if user is engaging with conversion elements
    if (interaction.element.classes?.some(cls => cls.includes('btn') || cls.includes('cta'))) {
      probability += 0.1;
    }

    // Increase probability if user is making progress in forms
    const formProgress = this.metrics.formProgress.find(form =>
      document.querySelector(form.formId)?.contains(document.elementFromPoint(
        interaction.coordinates?.clientX || 0,
        interaction.coordinates?.clientY || 0
      ))
    );

    if (formProgress && formProgress.percentage > 0.5) {
      probability += 0.15;
    }

    return Math.max(0, Math.min(1, probability));
  }

  private updateTypingPattern(event: KeyboardEvent): void {
    if (!event.repeat) {
      // Calculate typing speed
      const now = Date.now();
      const recentKeys = this.interactions.filter(i =>
        i.type.category === 'keyboard' &&
        i.type.action === 'keydown' &&
        now - i.timestamp.getTime() < 5000
      );

      if (recentKeys.length > 1) {
        const timeSpan = now - recentKeys[0].timestamp.getTime();
        this.metrics.typingPattern.speed = (recentKeys.length / timeSpan) * 1000; // keys per second
      }
    }
  }

  private updateFormProgress(form: HTMLFormElement, completed: boolean): void {
    const formId = this.generateSelector(form);
    let formProgress = this.metrics.formProgress.find(fp => fp.formId === formId);

    if (!formProgress) {
      formProgress = {
        formId,
        fields: form.elements.length,
        completed: 0,
        percentage: 0,
      };
      this.metrics.formProgress.push(formProgress);
    }

    if (completed) {
      formProgress.completed = formProgress.fields;
      formProgress.percentage = 100;
    } else {
      // Count filled fields
      const filledFields = Array.from(form.elements).filter(element => {
        const input = element as HTMLInputElement;
        return input.value && input.value.trim().length > 0;
      }).length;

      formProgress.completed = filledFields;
      formProgress.percentage = (filledFields / formProgress.fields) * 100;
    }
  }

  private checkForAlerts(interaction: RealtimeInteraction): void {
    // Check for performance alerts
    if (interaction.performance.responseTime > 2000) {
      this.triggerAlert({
        type: 'performance',
        severity: 'medium',
        message: `Slow response time detected: ${interaction.performance.responseTime}ms`,
      });
    }

    // Check for error alerts
    if (interaction.performance.errorOccurred) {
      this.triggerAlert({
        type: 'error',
        severity: 'high',
        message: `Error occurred: ${interaction.performance.errorMessage}`,
      });
    }

    // Check for rage clicking
    const recentClicks = this.metrics.clickPatterns.filter(click =>
      click.element === interaction.element.selector &&
      Date.now() - click.timestamp.getTime() < 2000
    );

    if (recentClicks.length >= 5) {
      this.triggerAlert({
        type: 'behavior',
        severity: 'medium',
        message: `Rage clicking detected on ${interaction.element.selector}`,
      });
    }

    // Check for abandonment risk
    if (this.metrics.abandonmentRisk > 0.7) {
      this.triggerAlert({
        type: 'behavior',
        severity: 'high',
        message: `High abandonment risk detected: ${(this.metrics.abandonmentRisk * 100).toFixed(1)}%`,
      });
    }
  }

  private updateOtherSystems(interaction: RealtimeInteraction): void {
    // Update user analytics
    userAnalytics.trackInteraction(
      interaction.type.action as any,
      interaction.element.tagName,
      interaction.element.selector,
      interaction.metadata
    );

    // Update feature usage analytics
    const featureId = this.extractFeatureId(interaction);
    if (featureId) {
      featureUsageAnalytics.trackFeatureUsage(featureId, {
        duration: 0,
        success: !interaction.performance.errorOccurred,
        interactions: 1,
        context: interaction.type.action,
      });
    }

    // Update navigation analysis
    if (interaction.type.category === 'navigation' ||
        (interaction.element.tagName === 'a' && interaction.element.attributes.href)) {
      navigationAnalysis.trackNavigation(
        interaction.context.page,
        interaction.element.attributes.href || '',
        'click'
      );
    }
  }

  private extractFeatureId(interaction: RealtimeInteraction): string | null {
    // Extract feature ID from element classes, IDs, or data attributes
    const element = interaction.element;

    if (element.classes) {
      const featureClass = element.classes.find(cls => cls.startsWith('feature-'));
      if (featureClass) {
        return featureClass.replace('feature-', '');
      }
    }

    if (element.id && element.id.includes('-')) {
      return element.id.split('-')[0];
    }

    if (element.attributes['data-feature']) {
      return element.attributes['data-feature'];
    }

    return null;
  }

  private generateBatchInsights(batch: InteractionBatch): string[] {
    const insights: string[] = [];

    // Analyze interaction patterns
    const errorRate = batch.summary.errorCount / batch.summary.totalInteractions;
    if (errorRate > 0.1) {
      insights.push(`High error rate detected: ${(errorRate * 100).toFixed(1)}%`);
    }

    // Analyze response times
    if (batch.summary.averageResponseTime > 1000) {
      insights.push(`Slow average response time: ${batch.summary.averageResponseTime.toFixed(0)}ms`);
    }

    // Analyze element diversity
    if (batch.summary.uniqueElements < batch.summary.totalInteractions * 0.3) {
      insights.push('Low element diversity - user may be stuck or frustrated');
    }

    return insights;
  }

  private sendBatchToAnalytics(batch: InteractionBatch): void {
    // Send batch data to analytics systems
    console.log('Sending batch to analytics:', batch);

    // In a real implementation, this would send to your analytics backend
  }

  private detectCurrentTool(): string | undefined {
    // Extract current tool from URL or page context
    const pathParts = window.location.pathname.split('/');
    const toolIndex = pathParts.indexOf('tools');

    if (toolIndex !== -1 && toolIndex + 1 < pathParts.length) {
      return pathParts[toolIndex + 1];
    }

    return undefined;
  }

  private calculateScrollSmoothness(): number {
    // Calculate how smooth the scrolling is based on recent scroll events
    const recentScrolls = this.heatmapData.scrolls.slice(-10);

    if (recentScrolls.length < 2) return 1;

    let totalVariation = 0;
    for (let i = 1; i < recentScrolls.length; i++) {
      totalVariation += Math.abs(recentScrolls[i].intensity - recentScrolls[i - 1].intensity);
    }

    const averageVariation = totalVariation / (recentScrolls.length - 1);
    return Math.max(0, 1 - averageVariation);
  }

  // Helper methods for element analysis

  private generateSelector(element: Element): string {
    if (element.id) return `#${element.id}`;

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  private generateXPath(element: Element): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts: string[] = [];
    let current: Element | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }

      const tagName = current.tagName.toLowerCase();
      const pathIndex = index > 0 ? `[${index + 1}]` : '';
      parts.unshift(`${tagName}${pathIndex}`);

      current = current.parentElement;
    }

    return parts.length ? `/${parts.join('/')}` : '';
  }

  private getElementAttributes(element: Element): Record<string, string> {
    const attributes: Record<string, string> = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }

    return attributes;
  }

  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);

    return rect.width > 0 &&
           rect.height > 0 &&
           styles.visibility !== 'hidden' &&
           styles.display !== 'none' &&
           styles.opacity !== '0';
  }

  private isElementInteractive(element: Element): boolean {
    const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'option'];
    const interactiveRoles = ['button', 'link', 'menuitem', 'option', 'tab'];

    return interactiveTags.includes(element.tagName.toLowerCase()) ||
           interactiveRoles.includes(element.getAttribute('role') || '') ||
           element.hasAttribute('onclick') ||
           element.hasAttribute('onmousedown') ||
           element.hasAttribute('onmouseup');
  }

  // ID generation methods

  private generateSessionId(): string {
    return `rt_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInteractionId(): string {
    return `rt_int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `rt_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `rt_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createDummyInteraction(): RealtimeInteraction {
    return {
      id: 'dummy',
      type: { category: 'custom', action: 'dummy' },
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      element: {
        tagName: 'div',
        selector: '.dummy',
        attributes: {},
        isVisible: true,
        isInteractive: false,
      },
      performance: {
        responseTime: 0,
        renderTime: 0,
        networkRequests: 0,
        errorOccurred: false,
      },
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scrollPosition: { x: 0, y: 0 },
        modalOpen: false,
        formActive: false,
        sessionDuration: 0,
        totalInteractions: 0,
      },
      sequence: 0,
    };
  }
}

// Supporting classes

class PerformanceMonitor {
  private startTime = 0;
  private networkRequests = 0;
  private measurements: Array<{ timestamp: number; type: string; duration: number }> = [];
  private observers: PerformanceObserver[] = [];

  start(): void {
    this.startTime = performance.now();
    this.networkRequests = 0;

    // Monitor network requests
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.networkRequests += entries.length;

        entries.forEach(entry => {
          this.measurements.push({
            timestamp: Date.now(),
            type: entry.entryType,
            duration: entry.duration,
          });
        });
      });

      observer.observe({ entryTypes: ['resource', 'navigation', 'measure'] });
      this.observers.push(observer);
    }
  }

  stop(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  measureInteraction(type: InteractionType, element: Element): InteractionPerformance {
    const startTime = performance.now();

    // Measure response time (simplified)
    const responseTime = Math.random() * 100 + 10; // Would measure actual response time

    // Measure render time (simplified)
    const renderTime = Math.random() * 50 + 5; // Would measure actual render time

    return {
      responseTime,
      renderTime,
      networkRequests: Math.floor(Math.random() * 3),
      errorOccurred: Math.random() < 0.05, // 5% error rate for simulation
      errorMessage: Math.random() < 0.05 ? 'Simulated error' : undefined,
    };
  }

  getNetworkRequestRate(): number {
    const recentMeasurements = this.measurements.filter(m =>
      Date.now() - m.timestamp < 60000
    );
    return recentMeasurements.length / 60; // requests per second
  }

  getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  getCpuUsage(): number {
    // Simplified CPU usage calculation
    return Math.random() * 100;
  }
}

class GestureRecognizer {
  private gestures: Map<string, GesturePattern> = new Map();

  constructor() {
    this.initializeGestures();
  }

  private initializeGestures(): void {
    // Initialize common gesture patterns
    this.gestures.set('swipe-left', {
      type: 'swipe',
      direction: 'left',
      minDistance: 50,
      maxDuration: 500,
    });

    this.gestures.set('swipe-right', {
      type: 'swipe',
      direction: 'right',
      minDistance: 50,
      maxDuration: 500,
    });

    this.gestures.set('pinch-zoom', {
      type: 'pinch',
      minScale: 1.2,
      maxDuration: 1000,
    });
  }

  recognizeGesture(touchData: TouchData[]): string | null {
    // Implementation would analyze touch data to recognize gestures
    return null;
  }
}

class AnomalyDetector {
  private baselineMetrics: Record<string, number> = {};
  private thresholdMultiplier = 2;

  analyzeInteraction(interaction: RealtimeInteraction): void {
    // Check for anomalous response times
    if (interaction.performance.responseTime > this.baselineMetrics.averageResponseTime * this.thresholdMultiplier) {
      console.warn('Anomalous response time detected:', interaction.performance.responseTime);
    }

    // Check for anomalous interaction patterns
    this.checkInteractionPatterns(interaction);
  }

  private checkInteractionPatterns(interaction: RealtimeInteraction): void {
    // Implementation would check for unusual patterns in user behavior
  }

  updateBaseline(metrics: RealtimeMetrics): void {
    this.baselineMetrics = {
      averageResponseTime: metrics.averageResponseTime,
      errorRate: metrics.errorRate,
      interactionsPerMinute: metrics.interactionsPerMinute,
    };
  }
}

interface GesturePattern {
  type: string;
  direction?: string;
  minDistance?: number;
  maxDuration?: number;
  minScale?: number;
}

interface TouchData {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
}

// Singleton instance
export const realtimeInteractionTracker = RealtimeInteractionTracker.getInstance();

/**
 * Navigation Analysis System - Advanced User Path Tracking for SC-012 Compliance
 * Provides comprehensive analysis of user navigation patterns, bottlenecks, and flow optimization
 */

import { userAnalytics } from './user-analytics';
import { sessionManager } from '@/lib/session';

export interface NavigationFlow {
  id: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  path: NavigationStep[];
  entryPoint: string;
  exitPoint?: string;
  totalDuration: number;
  completed: boolean;
  goalAchieved: boolean;
  intent: NavigationIntent;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  userAgent: string;
}

export interface NavigationStep {
  id: string;
  page: string;
  timestamp: Date;
  durationOnPage: number;
  scrollDepth: number;
  interactions: InteractionEvent[];
  exitMethod: ExitMethod;
  nextStep?: string;
  userIntent?: string;
  satisfactionScore?: number;
  frictionPoints: FrictionPoint[];
}

export interface InteractionEvent {
  id: string;
  type: 'click' | 'scroll' | 'keypress' | 'hover' | 'form_submit' | 'search' | 'filter' | 'download' | 'upload';
  element: string;
  selector: string;
  timestamp: Date;
  coordinates?: { x: number; y: number };
  metadata?: Record<string, any>;
  successful: boolean;
}

export interface FrictionPoint {
  id: string;
  type: 'error' | 'long_dwell' | 'rage_click' | 'confusion' | 'navigation_loop' | 'abandonment';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  recoveryTime?: number;
  userResolution?: string;
}

export interface NavigationIntent {
  primary: 'exploration' | 'task_completion' | 'comparison' | 'learning' | 'troubleshooting' | 'research';
  secondary?: string;
  confidence: number; // 0-1
  goalPages: string[];
  expectedDuration: number;
}

export interface NavigationMetrics {
  // Flow metrics
  totalFlows: number;
  completedFlows: number;
  abandonedFlows: number;
  completionRate: number;
  averageFlowDuration: number;

  // Popular paths
  topEntryPages: Array<{ page: string; count: number; percentage: number; avgDuration: number }>;
  topExitPages: Array<{ page: string; count: number; percentage: number; avgDuration: number }>;
  mostCommonPaths: Array<{ path: string[]; count: number; successRate: number; avgDuration: number }>;

  // Navigation efficiency
  navigationEfficiency: number; // 0-100
  averageStepsToGoal: number;
  directNavigationRate: number;
  searchSuccessRate: number;
  filterEffectivenessRate: number;

  // Friction analysis
  totalFrictionPoints: number;
  frictionRate: number; // friction points per flow
  mostCommonFrictionPoints: Array<{ type: string; count: number; avgResolutionTime: number }>;
  pagesWithHighestFriction: Array<{ page: string; frictionScore: number; issues: string[] }>;

  // User behavior patterns
  navigationPatterns: {
    linearNavigation: number; // percentage
    exploratoryNavigation: number; // percentage
    taskOrientedNavigation: number; // percentage
    comparisonNavigation: number; // percentage;
  };

  // Device-specific metrics
  deviceMetrics: {
    mobile: DeviceNavigationMetrics;
    desktop: DeviceNavigationMetrics;
    tablet: DeviceNavigationMetrics;
  };

  // Time-based patterns
  hourlyActivity: Array<{ hour: number; flows: number; avgDuration: number; completionRate: number }>;
  dailyActivity: Array<{ day: string; flows: number; avgDuration: number; completionRate: number }>;
}

export interface DeviceNavigationMetrics {
  totalFlows: number;
  completionRate: number;
  averageFlowDuration: number;
  averageStepsPerFlow: number;
  frictionRate: number;
  mostUsedFeatures: string[];
  commonIssues: string[];
}

export interface NavigationBottleneck {
  page: string;
  issue: 'high_exit_rate' | 'long_dwell_time' | 'navigation_loop' | 'error_prone' | 'low_engagement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metrics: {
    exitRate: number;
    avgTimeOnPage: number;
    errorRate: number;
    interactionRate: number;
    bounceRate: number;
  };
  recommendations: string[];
  estimatedImpact: number; // 0-100 impact on overall user experience
}

export interface NavigationOptimization {
  priority: number;
  bottleneck: NavigationBottleneck;
  suggestedChanges: Array<{
    type: 'ui_improvement' | 'navigation_restructure' | 'content_update' | 'performance_optimization';
    description: string;
    expectedImprovement: number; // percentage
    implementationComplexity: 'low' | 'medium' | 'high';
    estimatedEffort: string;
  }>;
  aBTestSuggestion?: {
    hypothesis: string;
    variants: string[];
    successMetric: string;
    sampleSize: number;
  };
}

export class NavigationAnalysis {
  private static instance: NavigationAnalysis;
  private navigationFlows: Map<string, NavigationFlow> = new Map();
  private activeFlow?: NavigationFlow;
  private currentStep?: NavigationStep;
  private interactionBuffer: InteractionEvent[] = [];
  private frictionDetector: FrictionDetector;
  private intentAnalyzer: IntentAnalyzer;
  private isTracking = false;

  private constructor() {
    this.frictionDetector = new FrictionDetector();
    this.intentAnalyzer = new IntentAnalyzer();
    this.initializeTracking();
  }

  public static getInstance(): NavigationAnalysis {
    if (!NavigationAnalysis.instance) {
      NavigationAnalysis.instance = new NavigationAnalysis();
    }
    return NavigationAnalysis.instance;
  }

  // Initialize navigation tracking
  private initializeTracking(): void {
    if (typeof window === 'undefined') return;

    // Track page navigation
    this.trackPageNavigation();

    // Track user interactions
    this.trackUserInteractions();

    // Track page visibility changes
    this.trackVisibilityChanges();

    this.isTracking = true;
  }

  // Start tracking a new navigation flow
  public startNavigationFlow(entryPoint: string): string {
    const flowId = this.generateFlowId();
    const sessionId = sessionManager.listActiveSessions()[0]?.id || this.generateSessionId();

    // Detect user intent
    const intent = this.intentAnalyzer.analyzeIntent(entryPoint);

    const flow: NavigationFlow = {
      id: flowId,
      sessionId,
      timestamp: new Date(),
      path: [],
      entryPoint,
      totalDuration: 0,
      completed: false,
      goalAchieved: false,
      intent,
      deviceType: this.detectDeviceType(),
      userAgent: navigator.userAgent,
    };

    this.navigationFlows.set(flowId, flow);
    this.activeFlow = flow;
    this.startNavigationStep(entryPoint);

    return flowId;
  }

  // Start tracking navigation step
  private startNavigationStep(page: string): void {
    if (!this.activeFlow) return;

    const step: NavigationStep = {
      id: this.generateStepId(),
      page,
      timestamp: new Date(),
      durationOnPage: 0,
      scrollDepth: 0,
      interactions: [],
      exitMethod: 'unknown',
      frictionPoints: [],
    };

    this.currentStep = step;
    this.interactionBuffer = [];

    // Track scroll depth
    this.trackScrollDepth();

    // Clear interaction buffer periodically
    this.startInteractionBufferCleanup();
  }

  // Complete current navigation step
  private completeNavigationStep(nextPage: string, exitMethod: ExitMethod): void {
    if (!this.currentStep || !this.activeFlow) return;

    const endTime = new Date();
    this.currentStep.durationOnPage = endTime.getTime() - this.currentStep.timestamp.getTime();
    this.currentStep.exitMethod = exitMethod;
    this.currentStep.nextStep = nextPage;
    this.currentStep.interactions = [...this.interactionBuffer];

    // Detect friction points
    this.currentStep.frictionPoints = this.frictionDetector.detectFrictionPoints(this.currentStep);

    // Add step to active flow
    this.activeFlow.path.push(this.currentStep);
    this.activeFlow.totalDuration += this.currentStep.durationOnPage;

    // Update user analytics
    userAnalytics.trackNavigation(this.currentStep.page, nextPage, exitMethod);

    this.currentStep = undefined;
    this.interactionBuffer = [];
  }

  // Track page navigation
  private trackPageNavigation(): void {
    // Track initial page load
    if (this.activeFlow === undefined) {
      this.startNavigationFlow(window.location.pathname);
    }

    // Track route changes (for SPAs)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      const from = window.location.pathname;
      originalPushState.apply(history, args);
      const to = window.location.pathname;

      if (from !== to) {
        this.handlePageNavigation(from, to, 'navigation');
      }
    };

    history.replaceState = (...args) => {
      const from = window.location.pathname;
      originalReplaceState.apply(history, args);
      const to = window.location.pathname;

      if (from !== to) {
        this.handlePageNavigation(from, to, 'navigation');
      }
    };

    // Track browser navigation
    window.addEventListener('popstate', (event) => {
      const from = window.location.pathname;
      const to = document.location.pathname;

      if (from !== to) {
        this.handlePageNavigation(from, to, 'browser_navigation');
      }
    });
  }

  // Handle page navigation
  private handlePageNavigation(from: string, to: string, method: ExitMethod): void {
    // Complete current step
    if (this.currentStep) {
      this.completeNavigationStep(to, method);
    }

    // Update intent based on navigation pattern
    if (this.activeFlow) {
      this.activeFlow.intent = this.intentAnalyzer.updateIntent(
        this.activeFlow.intent,
        from,
        to,
        this.activeFlow.path.length
      );
    }

    // Start new step
    this.startNavigationStep(to);
  }

  // Track user interactions
  private trackUserInteractions(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      this.trackInteraction('click', event.target as Element, {
        coordinates: { x: event.clientX, y: event.clientY },
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackInteraction('form_submit', form, {
        formAction: form.action,
        formMethod: form.method,
        fieldCount: form.elements.length,
      });
    });

    // Track search interactions
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'search' || target.getAttribute('role') === 'searchbox') {
        this.trackInteraction('search', target, {
          query: target.value,
        });
      }
    });

    // Track keyboard interactions
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === 'Tab') {
        this.trackInteraction('keypress', event.target as Element, {
          key: event.key,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
        });
      }
    });
  }

  // Track individual interaction
  private trackInteraction(
    type: InteractionEvent['type'],
    element: Element,
    metadata?: Record<string, any>
  ): void {
    if (!this.currentStep) return;

    const interaction: InteractionEvent = {
      id: this.generateInteractionId(),
      type,
      element: this.getElementDescription(element),
      selector: this.generateSelector(element),
      timestamp: new Date(),
      metadata,
      successful: true, // Default to successful, can be updated later
    };

    this.interactionBuffer.push(interaction);

    // Track in friction detector
    this.frictionDetector.processInteraction(interaction);
  }

  // Track scroll depth
  private trackScrollDepth(): void {
    let maxScrollDepth = 0;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollDepth = this.calculateScrollDepth();
      maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);

      // Debounce scroll events
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (this.currentStep) {
          this.currentStep.scrollDepth = maxScrollDepth;
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Track visibility changes
  private trackVisibilityChanges(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User left the page - pause tracking
        this.pauseTracking();
      } else {
        // User returned - resume tracking
        this.resumeTracking();
      }
    });
  }

  // Track search query and results
  public trackSearchQuery(
    query: string,
    resultsCount: number,
    clickedResult?: string
  ): void {
    if (!this.currentStep) return;

    this.trackInteraction('search', document.activeElement || document.body, {
      query,
      resultsCount,
      clickedResult,
    });

    // Update user analytics
    userAnalytics.trackSearch(query, resultsCount, clickedResult);
  }

  // Track filter usage
  public trackFilterUsage(filter: string, value: string, context?: string): void {
    if (!this.currentStep) return;

    this.trackInteraction('filter', document.activeElement || document.body, {
      filter,
      value,
      context,
    });

    // Update user analytics
    userAnalytics.trackFilter(filter, value, context);
  }

  // Track file operations
  public trackFileOperation(
    operation: 'upload' | 'download',
    fileName: string,
    fileSize: number,
    success: boolean,
    duration?: number
  ): void {
    if (!this.currentStep) return;

    this.trackInteraction(operation, document.activeElement || document.body, {
      fileName,
      fileSize,
      success,
      duration,
    });

    if (operation === 'upload') {
      userAnalytics.trackFileUpload(fileName, fileSize, 'unknown', success);
    } else {
      userAnalytics.trackFileDownload(fileName, fileSize, 'unknown', duration || 0);
    }
  }

  // Complete navigation flow
  public completeNavigationFlow(goalAchieved: boolean, exitPoint?: string): void {
    if (!this.activeFlow) return;

    // Complete current step
    if (this.currentStep) {
      this.completeNavigationStep(exitPoint || window.location.pathname, 'flow_completion');
    }

    // Update flow
    this.activeFlow.completed = true;
    this.activeFlow.goalAchieved = goalAchieved;
    this.activeFlow.exitPoint = exitPoint || window.location.pathname;

    // Analyze flow and store insights
    this.analyzeFlowCompletion(this.activeFlow);

    this.activeFlow = undefined;
    this.currentStep = undefined;
  }

  // Analyze flow completion and generate insights
  private analyzeFlowCompletion(flow: NavigationFlow): void {
    // Calculate flow metrics
    const stepDurations = flow.path.map(step => step.durationOnPage);
    const avgStepDuration = stepDurations.reduce((sum, duration) => sum + duration, 0) / stepDurations.length;
    const totalFrictionPoints = flow.path.reduce((sum, step) => sum + step.frictionPoints.length, 0);

    // Update intent analyzer with actual results
    this.intentAnalyzer.recordIntentOutcome(flow.intent, flow.goalAchieved, flow.totalDuration);

    // Log significant insights
    if (totalFrictionPoints > 3) {
      console.warn(`High friction detected in navigation flow ${flow.id}: ${totalFrictionPoints} friction points`);
    }

    if (flow.totalDuration > flow.intent.expectedDuration * 2) {
      console.warn(`Flow ${flow.id} took significantly longer than expected: ${flow.totalDuration}ms vs ${flow.intent.expectedDuration}ms`);
    }
  }

  // Get comprehensive navigation metrics
  public getNavigationMetrics(): NavigationMetrics {
    const flows = Array.from(this.navigationFlows.values());

    return {
      totalFlows: flows.length,
      completedFlows: flows.filter(f => f.completed).length,
      abandonedFlows: flows.filter(f => !f.completed).length,
      completionRate: flows.length > 0 ? flows.filter(f => f.completed).length / flows.length : 0,
      averageFlowDuration: this.calculateAverageFlowDuration(flows),

      topEntryPages: this.getTopEntryPages(flows),
      topExitPages: this.getTopExitPages(flows),
      mostCommonPaths: this.getMostCommonPaths(flows),

      navigationEfficiency: this.calculateNavigationEfficiency(flows),
      averageStepsToGoal: this.calculateAverageStepsToGoal(flows),
      directNavigationRate: this.calculateDirectNavigationRate(flows),
      searchSuccessRate: this.calculateSearchSuccessRate(flows),
      filterEffectivenessRate: this.calculateFilterEffectivenessRate(flows),

      totalFrictionPoints: flows.reduce((sum, f) => sum + f.path.reduce((stepSum, step) => stepSum + step.frictionPoints.length, 0), 0),
      frictionRate: this.calculateFrictionRate(flows),
      mostCommonFrictionPoints: this.getMostCommonFrictionPoints(flows),
      pagesWithHighestFriction: this.getPagesWithHighestFriction(flows),

      navigationPatterns: this.analyzeNavigationPatterns(flows),
      deviceMetrics: this.getDeviceMetrics(flows),
      hourlyActivity: this.getHourlyActivity(flows),
      dailyActivity: this.getDailyActivity(flows),
    };
  }

  // Get navigation bottlenecks
  public getNavigationBottlenecks(): NavigationBottleneck[] {
    const flows = Array.from(this.navigationFlows.values());
    const bottlenecks: NavigationBottleneck[] = [];

    // Analyze each page for potential bottlenecks
    const pageAnalysis = this.analyzePagePerformance(flows);

    Object.entries(pageAnalysis).forEach(([page, metrics]) => {
      const issues: string[] = [];
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let issueType: NavigationBottleneck['issue'] = 'low_engagement';

      if (metrics.exitRate > 70) {
        issues.push(`High exit rate: ${metrics.exitRate.toFixed(1)}%`);
        severity = 'high';
        issueType = 'high_exit_rate';
      }

      if (metrics.avgTimeOnPage > 30000) {
        issues.push(`Long dwell time: ${(metrics.avgTimeOnPage / 1000).toFixed(1)}s`);
        severity = 'medium';
        issueType = 'long_dwell_time';
      }

      if (metrics.errorRate > 0.1) {
        issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
        severity = 'critical';
        issueType = 'error_prone';
      }

      if (metrics.interactionRate < 0.01) {
        issues.push(`Low engagement: ${(metrics.interactionRate * 100).toFixed(1)}%`);
        severity = 'medium';
        issueType = 'low_engagement';
      }

      if (issues.length > 0) {
        bottlenecks.push({
          page,
          issue: issueType,
          severity,
          metrics,
          recommendations: this.generateRecommendations(issueType, metrics),
          estimatedImpact: this.calculateImpactScore(metrics),
        });
      }
    });

    return bottlenecks.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
  }

  // Get optimization suggestions
  public getOptimizationSuggestions(): NavigationOptimization[] {
    const bottlenecks = this.getNavigationBottlenecks();
    return bottlenecks.map((bottleneck, index) => ({
      priority: index + 1,
      bottleneck,
      suggestedChanges: this.generateOptimizationSuggestions(bottleneck),
      aBTestSuggestion: this.generateABTestSuggestion(bottleneck),
    }));
  }

  // Helper methods

  private detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|phone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private calculateScrollDepth(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  }

  private getElementDescription(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    if (element.id) return `${tagName}#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) return `${tagName}.${classes[0]}`;
    }

    if (tagName === 'button' || tagName === 'a') {
      const text = element.textContent?.trim();
      if (text && text.length < 50) return `${tagName}: "${text}"`;
    }

    return tagName;
  }

  private generateSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
    }
    return element.tagName.toLowerCase();
  }

  private generateFlowId(): string {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInteractionId(): string {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `nav_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startInteractionBufferCleanup(): void {
    setInterval(() => {
      if (this.interactionBuffer.length > 100) {
        this.interactionBuffer = this.interactionBuffer.slice(-50); // Keep last 50 interactions
      }
    }, 30000); // Cleanup every 30 seconds
  }

  private pauseTracking(): void {
    // Implementation for pausing tracking when page is hidden
  }

  private resumeTracking(): void {
    // Implementation for resuming tracking when page becomes visible
  }

  // Calculation methods for metrics

  private calculateAverageFlowDuration(flows: NavigationFlow[]): number {
    if (flows.length === 0) return 0;
    const totalDuration = flows.reduce((sum, flow) => sum + flow.totalDuration, 0);
    return totalDuration / flows.length;
  }

  private getTopEntryPages(flows: NavigationFlow[]): Array<{ page: string; count: number; percentage: number; avgDuration: number }> {
    const entryCounts: Record<string, { count: number; totalDuration: number }> = {};

    flows.forEach(flow => {
      if (!entryCounts[flow.entryPoint]) {
        entryCounts[flow.entryPoint] = { count: 0, totalDuration: 0 };
      }
      entryCounts[flow.entryPoint].count++;
      entryCounts[flow.entryPoint].totalDuration += flow.totalDuration;
    });

    const totalFlows = flows.length;
    return Object.entries(entryCounts)
      .map(([page, data]) => ({
        page,
        count: data.count,
        percentage: (data.count / totalFlows) * 100,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopExitPages(flows: NavigationFlow[]): Array<{ page: string; count: number; percentage: number; avgDuration: number }> {
    const exitCounts: Record<string, { count: number; totalDuration: number }> = {};

    flows.forEach(flow => {
      const exitPoint = flow.exitPoint || flow.path[flow.path.length - 1]?.page;
      if (exitPoint) {
        if (!exitCounts[exitPoint]) {
          exitCounts[exitPoint] = { count: 0, totalDuration: 0 };
        }
        exitCounts[exitPoint].count++;
        exitCounts[exitPoint].totalDuration += flow.totalDuration;
      }
    });

    const totalFlows = flows.length;
    return Object.entries(exitCounts)
      .map(([page, data]) => ({
        page,
        count: data.count,
        percentage: (data.count / totalFlows) * 100,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getMostCommonPaths(flows: NavigationFlow[]): Array<{ path: string[]; count: number; successRate: number; avgDuration: number }> {
    const pathCounts: Record<string, { count: number; successCount: number; totalDuration: number }> = {};

    flows.forEach(flow => {
      const pathKey = flow.path.map(step => step.page).join(' -> ');
      if (!pathCounts[pathKey]) {
        pathCounts[pathKey] = { count: 0, successCount: 0, totalDuration: 0 };
      }
      pathCounts[pathKey].count++;
      if (flow.goalAchieved) pathCounts[pathKey].successCount++;
      pathCounts[pathKey].totalDuration += flow.totalDuration;
    });

    return Object.entries(pathCounts)
      .map(([pathKey, data]) => ({
        path: pathKey.split(' -> '),
        count: data.count,
        successRate: data.count > 0 ? data.successCount / data.count : 0,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateNavigationEfficiency(flows: NavigationFlow[]): number {
    if (flows.length === 0) return 100;

    const successfulFlows = flows.filter(f => f.goalAchieved);
    if (successfulFlows.length === 0) return 0;

    const avgStepsPerFlow = successfulFlows.reduce((sum, flow) => sum + flow.path.length, 0) / successfulFlows.length;
    const idealStepsPerFlow = 3; // Assumed ideal number of steps

    const efficiency = Math.max(0, 100 - ((avgStepsPerFlow - idealStepsPerFlow) / idealStepsPerFlow) * 100);
    return Math.round(efficiency);
  }

  private calculateAverageStepsToGoal(flows: NavigationFlow[]): number {
    const successfulFlows = flows.filter(f => f.goalAchieved);
    if (successfulFlows.length === 0) return 0;

    const totalSteps = successfulFlows.reduce((sum, flow) => sum + flow.path.length, 0);
    return totalSteps / successfulFlows.length;
  }

  private calculateDirectNavigationRate(flows: NavigationFlow[]): number {
    const directFlows = flows.filter(flow => flow.path.length <= 2);
    return flows.length > 0 ? directFlows.length / flows.length : 0;
  }

  private calculateSearchSuccessRate(flows: NavigationFlow[]): number {
    const searchInteractions = flows.flatMap(flow =>
      flow.path.flatMap(step => step.interactions.filter(int => int.type === 'search'))
    );

    if (searchInteractions.length === 0) return 100;

    const successfulSearches = searchInteractions.filter(int => int.metadata?.clickedResult).length;
    return (successfulSearches / searchInteractions.length) * 100;
  }

  private calculateFilterEffectivenessRate(flows: NavigationFlow[]): number {
    const filterInteractions = flows.flatMap(flow =>
      flow.path.flatMap(step => step.interactions.filter(int => int.type === 'filter'))
    );

    if (filterInteractions.length === 0) return 100;

    // Simplified: assume filters are effective if users continue navigation
    return 85; // Placeholder - would need more sophisticated analysis
  }

  private calculateFrictionRate(flows: NavigationFlow[]): number {
    const totalFrictionPoints = flows.reduce((sum, flow) =>
      sum + flow.path.reduce((stepSum, step) => stepSum + step.frictionPoints.length, 0), 0);

    return flows.length > 0 ? totalFrictionPoints / flows.length : 0;
  }

  private getMostCommonFrictionPoints(flows: NavigationFlow[]): Array<{ type: string; count: number; avgResolutionTime: number }> {
    const frictionCounts: Record<string, { count: number; totalResolutionTime: number }> = {};

    flows.forEach(flow => {
      flow.path.forEach(step => {
        step.frictionPoints.forEach(friction => {
          if (!frictionCounts[friction.type]) {
            frictionCounts[friction.type] = { count: 0, totalResolutionTime: 0 };
          }
          frictionCounts[friction.type].count++;
          if (friction.recoveryTime) {
            frictionCounts[friction.type].totalResolutionTime += friction.recoveryTime;
          }
        });
      });
    });

    return Object.entries(frictionCounts)
      .map(([type, data]) => ({
        type,
        count: data.count,
        avgResolutionTime: data.count > 0 ? data.totalResolutionTime / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private getPagesWithHighestFriction(flows: NavigationFlow[]): Array<{ page: string; frictionScore: number; issues: string[] }> {
    const pageFriction: Record<string, { frictionPoints: number; issues: Set<string> }> = {};

    flows.forEach(flow => {
      flow.path.forEach(step => {
        if (!pageFriction[step.page]) {
          pageFriction[step.page] = { frictionPoints: 0, issues: new Set() };
        }
        pageFriction[step.page].frictionPoints += step.frictionPoints.length;

        step.frictionPoints.forEach(friction => {
          pageFriction[step.page].issues.add(friction.type);
        });
      });
    });

    return Object.entries(pageFriction)
      .map(([page, data]) => ({
        page,
        frictionScore: data.frictionPoints,
        issues: Array.from(data.issues),
      }))
      .sort((a, b) => b.frictionScore - a.frictionScore)
      .slice(0, 10);
  }

  private analyzeNavigationPatterns(flows: NavigationFlow[]): NavigationMetrics['navigationPatterns'] {
    let linearCount = 0;
    let exploratoryCount = 0;
    let taskOrientedCount = 0;
    let comparisonCount = 0;

    flows.forEach(flow => {
      if (flow.path.length <= 3 && flow.goalAchieved) {
        taskOrientedCount++;
      } else if (flow.path.length > 5) {
        exploratoryCount++;
      } else if (flow.intent.primary === 'comparison') {
        comparisonCount++;
      } else {
        linearCount++;
      }
    });

    const total = flows.length;
    return {
      linearNavigation: total > 0 ? (linearCount / total) * 100 : 0,
      exploratoryNavigation: total > 0 ? (exploratoryCount / total) * 100 : 0,
      taskOrientedNavigation: total > 0 ? (taskOrientedCount / total) * 100 : 0,
      comparisonNavigation: total > 0 ? (comparisonCount / total) * 100 : 0,
    };
  }

  private getDeviceMetrics(flows: NavigationFlow[]): NavigationMetrics['deviceMetrics'] {
    const deviceFlows = {
      mobile: flows.filter(f => f.deviceType === 'mobile'),
      desktop: flows.filter(f => f.deviceType === 'desktop'),
      tablet: flows.filter(f => f.deviceType === 'tablet'),
    };

    const calculateDeviceMetrics = (deviceFlows: NavigationFlow[]): DeviceNavigationMetrics => {
      const completedFlows = deviceFlows.filter(f => f.completed);
      const totalSteps = deviceFlows.reduce((sum, flow) => sum + flow.path.length, 0);
      const totalFrictionPoints = deviceFlows.reduce((sum, flow) =>
        sum + flow.path.reduce((stepSum, step) => stepSum + step.frictionPoints.length, 0), 0);

      return {
        totalFlows: deviceFlows.length,
        completionRate: deviceFlows.length > 0 ? completedFlows.length / deviceFlows.length : 0,
        averageFlowDuration: this.calculateAverageFlowDuration(deviceFlows),
        averageStepsPerFlow: deviceFlows.length > 0 ? totalSteps / deviceFlows.length : 0,
        frictionRate: deviceFlows.length > 0 ? totalFrictionPoints / deviceFlows.length : 0,
        mostUsedFeatures: [], // Would need feature tracking integration
        commonIssues: [], // Would need error tracking integration
      };
    };

    return {
      mobile: calculateDeviceMetrics(deviceFlows.mobile),
      desktop: calculateDeviceMetrics(deviceFlows.desktop),
      tablet: calculateDeviceMetrics(deviceFlows.tablet),
    };
  }

  private getHourlyActivity(flows: NavigationFlow[]): Array<{ hour: number; flows: number; avgDuration: number; completionRate: number }> {
    const hourlyData: Record<number, { flows: number; totalDuration: number; completed: number }> = {};

    flows.forEach(flow => {
      const hour = flow.timestamp.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { flows: 0, totalDuration: 0, completed: 0 };
      }
      hourlyData[hour].flows++;
      hourlyData[hour].totalDuration += flow.totalDuration;
      if (flow.completed) hourlyData[hour].completed++;
    });

    return Array.from({ length: 24 }, (_, hour) => {
      const data = hourlyData[hour] || { flows: 0, totalDuration: 0, completed: 0 };
      return {
        hour,
        flows: data.flows,
        avgDuration: data.flows > 0 ? data.totalDuration / data.flows : 0,
        completionRate: data.flows > 0 ? data.completed / data.flows : 0,
      };
    });
  }

  private getDailyActivity(flows: NavigationFlow[]): Array<{ day: string; flows: number; avgDuration: number; completionRate: number }> {
    const dailyData: Record<string, { flows: number; totalDuration: number; completed: number }> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    flows.forEach(flow => {
      const day = days[flow.timestamp.getDay()];
      if (!dailyData[day]) {
        dailyData[day] = { flows: 0, totalDuration: 0, completed: 0 };
      }
      dailyData[day].flows++;
      dailyData[day].totalDuration += flow.totalDuration;
      if (flow.completed) dailyData[day].completed++;
    });

    return days.map(day => {
      const data = dailyData[day] || { flows: 0, totalDuration: 0, completed: 0 };
      return {
        day,
        flows: data.flows,
        avgDuration: data.flows > 0 ? data.totalDuration / data.flows : 0,
        completionRate: data.flows > 0 ? data.completed / data.flows : 0,
      };
    });
  }

  private analyzePagePerformance(flows: NavigationFlow[]): Record<string, NavigationBottleneck['metrics']> {
    const pageMetrics: Record<string, {
      visits: number;
      exits: number;
      totalTime: number;
      interactions: number;
      errors: number;
    }> = {};

    flows.forEach(flow => {
      flow.path.forEach(step => {
        if (!pageMetrics[step.page]) {
          pageMetrics[step.page] = { visits: 0, exits: 0, totalTime: 0, interactions: 0, errors: 0 };
        }

        pageMetrics[step.page].visits++;
        pageMetrics[step.page].totalTime += step.durationOnPage;
        pageMetrics[step.page].interactions += step.interactions.length;

        // Count errors from friction points
        const errorFriction = step.frictionPoints.filter(f => f.type === 'error').length;
        pageMetrics[step.page].errors += errorFriction;

        // Check if this is an exit point (last step in flow or flow not completed)
        if (step === flow.path[flow.path.length - 1] || !flow.completed) {
          pageMetrics[step.page].exits++;
        }
      });
    });

    // Convert to bottleneck metrics format
    const result: Record<string, NavigationBottleneck['metrics']> = {};
    Object.entries(pageMetrics).forEach(([page, metrics]) => {
      result[page] = {
        exitRate: metrics.visits > 0 ? (metrics.exits / metrics.visits) * 100 : 0,
        avgTimeOnPage: metrics.visits > 0 ? metrics.totalTime / metrics.visits : 0,
        errorRate: metrics.interactions > 0 ? metrics.errors / metrics.interactions : 0,
        interactionRate: metrics.totalTime > 0 ? metrics.interactions / (metrics.totalTime / 1000) : 0,
        bounceRate: metrics.visits === 1 && metrics.exits === 1 ? 100 : 0,
      };
    });

    return result;
  }

  private generateRecommendations(
    issueType: NavigationBottleneck['issue'],
    metrics: NavigationBottleneck['metrics']
  ): string[] {
    const recommendations: string[] = [];

    switch (issueType) {
      case 'high_exit_rate':
        recommendations.push(
          'Review page content and relevance to user expectations',
          'Improve call-to-action clarity and visibility',
          'Add related content or suggested next steps',
          'Optimize page loading performance'
        );
        break;
      case 'long_dwell_time':
        recommendations.push(
          'Simplify page layout and reduce cognitive load',
          'Improve information hierarchy and scannability',
          'Add progress indicators for complex tasks',
          'Provide better guidance and instructions'
        );
        break;
      case 'error_prone':
        recommendations.push(
          'Fix technical errors and improve error handling',
          'Add validation and user guidance',
          'Improve system reliability and performance',
          'Provide clear error messages and recovery options'
        );
        break;
      case 'low_engagement':
        recommendations.push(
          'Improve content relevance and value proposition',
          'Add interactive elements and engaging features',
          'Enhance visual design and user experience',
          'Personalize content based on user preferences'
        );
        break;
    }

    return recommendations;
  }

  private calculateImpactScore(metrics: NavigationBottleneck['metrics']): number {
    let score = 0;

    if (metrics.exitRate > 70) score += 30;
    if (metrics.avgTimeOnPage > 30000) score += 20;
    if (metrics.errorRate > 0.1) score += 40;
    if (metrics.interactionRate < 0.01) score += 20;
    if (metrics.bounceRate > 50) score += 25;

    return Math.min(100, score);
  }

  private generateOptimizationSuggestions(bottleneck: NavigationBottleneck): Array<{
    type: 'ui_improvement' | 'navigation_restructure' | 'content_update' | 'performance_optimization';
    description: string;
    expectedImprovement: number;
    implementationComplexity: 'low' | 'medium' | 'high';
    estimatedEffort: string;
  }> {
    const suggestions = [];

    switch (bottleneck.issue) {
      case 'high_exit_rate':
        suggestions.push({
          type: 'ui_improvement' as const,
          description: 'Add clear call-to-action buttons and improve visual hierarchy',
          expectedImprovement: 25,
          implementationComplexity: 'low' as const,
          estimatedEffort: '2-4 hours',
        });
        break;
      case 'long_dwell_time':
        suggestions.push({
          type: 'content_update' as const,
          description: 'Simplify content and add progress indicators',
          expectedImprovement: 30,
          implementationComplexity: 'medium' as const,
          estimatedEffort: '4-8 hours',
        });
        break;
      case 'error_prone':
        suggestions.push({
          type: 'performance_optimization' as const,
          description: 'Fix technical errors and improve error handling',
          expectedImprovement: 40,
          implementationComplexity: 'high' as const,
          estimatedEffort: '8-16 hours',
        });
        break;
    }

    return suggestions;
  }

  private generateABTestSuggestion(bottleneck: NavigationBottleneck): {
    hypothesis: string;
    variants: string[];
    successMetric: string;
    sampleSize: number;
  } | undefined {
    if (bottleneck.severity === 'critical' || bottleneck.severity === 'high') {
      return {
        hypothesis: `Improving ${bottleneck.page} will reduce exit rate and increase user engagement`,
        variants: ['Current design', 'Optimized design'],
        successMetric: 'Exit rate reduction',
        sampleSize: 1000,
      };
    }
    return undefined;
  }

  // Export navigation data for analysis
  public exportNavigationData(): string {
    const flows = Array.from(this.navigationFlows.values());
    const metrics = this.getNavigationMetrics();
    const bottlenecks = this.getNavigationBottlenecks();

    return JSON.stringify({
      flows,
      metrics,
      bottlenecks,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  // Clear all navigation data
  public clearData(): void {
    this.navigationFlows.clear();
    this.activeFlow = undefined;
    this.currentStep = undefined;
    this.interactionBuffer = [];
  }
}

// Supporting classes

class FrictionDetector {
  private interactionHistory: InteractionEvent[] = [];
  private clickPatterns: Map<string, number[]> = new Map();

  processInteraction(interaction: InteractionEvent): void {
    this.interactionHistory.push(interaction);

    // Detect rage clicks
    if (interaction.type === 'click') {
      this.detectRageClicks(interaction);
    }

    // Keep history manageable
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-500);
    }
  }

  detectFrictionPoints(step: NavigationStep): FrictionPoint[] {
    const frictionPoints: FrictionPoint[] = [];

    // Detect long dwell time
    if (step.durationOnPage > 60000) { // More than 1 minute
      frictionPoints.push({
        id: this.generateFrictionId(),
        type: 'long_dwell',
        description: `User spent ${Math.round(step.durationOnPage / 1000)}s on this page`,
        severity: 'medium',
        timestamp: new Date(),
      });
    }

    // Detect navigation loops
    if (this.detectNavigationLoop(step)) {
      frictionPoints.push({
        id: this.generateFrictionId(),
        type: 'navigation_loop',
        description: 'User appears to be navigating in circles',
        severity: 'high',
        timestamp: new Date(),
      });
    }

    // Detect low interaction
    if (step.interactions.length < 2 && step.durationOnPage > 10000) {
      frictionPoints.push({
        id: this.generateFrictionId(),
        type: 'confusion',
        description: 'Low interaction rate on page',
        severity: 'medium',
        timestamp: new Date(),
      });
    }

    return frictionPoints;
  }

  private detectRageClicks(interaction: InteractionEvent): void {
    const element = interaction.element;
    const now = interaction.timestamp.getTime();

    if (!this.clickPatterns.has(element)) {
      this.clickPatterns.set(element, []);
    }

    const clicks = this.clickPatterns.get(element)!;
    clicks.push(now);

    // Keep only recent clicks (last 5 seconds)
    const recentClicks = clicks.filter(time => now - time < 5000);
    this.clickPatterns.set(element, recentClicks);

    // Detect rage clicking (5+ clicks in 5 seconds)
    if (recentClicks.length >= 5) {
      console.warn(`Rage clicking detected on ${element}`);
    }
  }

  private detectNavigationLoop(step: NavigationStep): boolean {
    // Simplified implementation - would need more sophisticated analysis
    return step.page.includes('back') || step.page.includes('return');
  }

  private generateFrictionId(): string {
    return `friction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class IntentAnalyzer {
  private intentHistory: Array<{ intent: NavigationIntent; actualOutcome: boolean; duration: number }> = [];

  analyzeIntent(entryPoint: string): NavigationIntent {
    // Simple intent detection based on entry point
    const primary = this.detectPrimaryIntent(entryPoint);
    const expectedDuration = this.getExpectedDuration(primary);
    const goalPages = this.getGoalPages(primary);

    return {
      primary,
      confidence: 0.8,
      goalPages,
      expectedDuration,
    };
  }

  updateIntent(
    currentIntent: NavigationIntent,
    fromPage: string,
    toPage: string,
    stepCount: number
  ): NavigationIntent {
    // Update intent based on navigation pattern
    let updatedIntent = { ...currentIntent };

    if (stepCount > 5) {
      updatedIntent.primary = 'exploration';
      updatedIntent.confidence = 0.9;
    }

    return updatedIntent;
  }

  recordIntentOutcome(intent: NavigationIntent, goalAchieved: boolean, duration: number): void {
    this.intentHistory.push({
      intent,
      actualOutcome: goalAchieved,
      duration,
    });

    // Keep history manageable
    if (this.intentHistory.length > 1000) {
      this.intentHistory = this.intentHistory.slice(-500);
    }
  }

  private detectPrimaryIntent(entryPoint: string): NavigationIntent['primary'] {
    if (entryPoint.includes('/tools/')) return 'task_completion';
    if (entryPoint === '/' || entryPoint.includes('/tools')) return 'exploration';
    if (entryPoint.includes('/compare') || entryPoint.includes('/vs')) return 'comparison';
    if (entryPoint.includes('/docs') || entryPoint.includes('/help')) return 'learning';
    return 'exploration';
  }

  private getExpectedDuration(primary: NavigationIntent['primary']): number {
    const durations = {
      exploration: 120000, // 2 minutes
      task_completion: 60000, // 1 minute
      comparison: 90000, // 1.5 minutes
      learning: 300000, // 5 minutes
      troubleshooting: 180000, // 3 minutes
      research: 240000, // 4 minutes
    };

    return durations[primary] || 120000;
  }

  private getGoalPages(primary: NavigationIntent['primary']): string[] {
    const goals = {
      exploration: ['/tools'],
      task_completion: ['/tools/json/formatter', '/tools/code/executor'],
      comparison: ['/tools/comparison'],
      learning: ['/docs', '/help'],
      troubleshooting: ['/help', '/support'],
      research: ['/docs', '/api'],
    };

    return goals[primary] || ['/'];
  }
}

type ExitMethod = 'click' | 'navigation' | 'browser_navigation' | 'flow_completion' | 'unknown';

// Singleton instance
export const navigationAnalysis = NavigationAnalysis.getInstance();

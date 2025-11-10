/**
 * Comprehensive TypeScript Types for Analytics and Monitoring System
 * Provides unified type definitions and error handling for SC-012 compliance
 */

// ============================================================================
// Core Types
// ============================================================================

export interface AnalyticsConfig {
  tracking: {
    enabled: boolean;
    sampleRate: number;
    batchSize: number;
    flushInterval: number;
    retentionPeriod: number;
  };
  privacy: {
    anonymizeData: boolean;
    respectDoNotTrack: boolean;
    cookieConsent: boolean;
    dataLocation: 'local' | 'region' | 'global';
    gdprCompliant: boolean;
  };
  performance: {
    maxOverhead: number;
    enableRealtimeTracking: boolean;
    enableSessionRecording: boolean;
    enableHeatmaps: boolean;
    enableNetworkMonitoring: boolean;
  };
  alerts: {
    enabled: boolean;
    channels: Array<'console' | 'email' | 'webhook' | 'slack'>;
    thresholds: Record<string, number>;
    cooldownPeriod: number;
  };
  integrations: {
    analyticsProvider?: string;
    dataWarehouse?: string;
    dashboardProvider?: string;
    alertingProvider?: string;
    customEndpoints: Array<{
      name: string;
      url: string;
      apiKey?: string;
      batchSize: number;
      flushInterval: number;
    }>;
  };
}

export interface ErrorContext {
  system: string;
  component: string;
  operation: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  additionalData?: Record<string, any>;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
}

// ============================================================================
// User Analytics Types
// ============================================================================

export interface UserInteraction {
  id: string;
  type: UserInteractionType;
  element: string;
  elementSelector?: string;
  timestamp: Date;
  sessionId: string;
  page: string;
  duration?: number;
  metadata?: Record<string, any>;
  coordinates?: { x: number; y: number };
  scrollDepth?: number;
}

export type UserInteractionType =
  | 'click'
  | 'scroll'
  | 'keypress'
  | 'hover'
  | 'focus'
  | 'blur'
  | 'tool_use'
  | 'navigation'
  | 'search'
  | 'filter'
  | 'upload'
  | 'download'
  | 'error'
  | 'retry';

export interface NavigationPath {
  id: string;
  from: string;
  to: string;
  timestamp: Date;
  sessionId: string;
  duration: number;
  method: NavigationMethod;
  breadcrumbs: string[];
  userIntent?: UserIntent;
  funnelStep?: number;
}

export type NavigationMethod =
  | 'click'
  | 'keyboard'
  | 'back_button'
  | 'forward_button'
  | 'external'
  | 'search'
  | 'bookmark'
  | 'direct';

export type UserIntent =
  | 'exploration'
  | 'task_completion'
  | 'comparison'
  | 'learning'
  | 'troubleshooting';

export interface ToolUsage {
  toolId: string;
  toolName: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  interactions: number;
  completed: boolean;
  features: string[];
  errors: string[];
  inputSize?: number;
  outputSize?: number;
  satisfaction?: number;
}

export interface UserSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  interactions: number;
  toolsUsed: string[];
  bounceRate: number;
  averageSessionTime: number;
  device: DeviceInfo;
  performance: PerformanceInfo;
  accessibility: AccessibilityInfo;
}

export interface DeviceInfo {
  userAgent: string;
  screen: { width: number; height: number };
  viewport: { width: number; height: number };
}

export interface PerformanceInfo {
  pageLoadTime: number;
  connectionType?: string;
}

export interface AccessibilityInfo {
  screenReader: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

// ============================================================================
// Navigation Analysis Types
// ============================================================================

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
  deviceType: DeviceType;
  userAgent: string;
}

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

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
  type: InteractionEventType;
  element: string;
  selector: string;
  timestamp: Date;
  coordinates?: { x: number; y: number };
  metadata?: Record<string, any>;
  successful: boolean;
}

export type InteractionEventType =
  | 'click'
  | 'scroll'
  | 'keypress'
  | 'hover'
  | 'form_submit'
  | 'search'
  | 'filter'
  | 'download'
  | 'upload';

export interface FrictionPoint {
  id: string;
  type: FrictionType;
  description: string;
  severity: FrictionSeverity;
  timestamp: Date;
  recoveryTime?: number;
  userResolution?: string;
}

export type FrictionType =
  | 'error'
  | 'long_dwell'
  | 'rage_click'
  | 'confusion'
  | 'navigation_loop'
  | 'abandonment';

export type FrictionSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ExitMethod =
  | 'click'
  | 'navigation'
  | 'browser_navigation'
  | 'flow_completion'
  | 'unknown';

export interface NavigationIntent {
  primary: UserIntent;
  secondary?: string;
  confidence: number;
  goalPages: string[];
  expectedDuration: number;
}

// ============================================================================
// Feature Usage Analytics Types
// ============================================================================

export interface FeatureDefinition {
  id: string;
  name: string;
  category: FeatureCategory;
  description: string;
  toolIds: string[];
  dependencies?: string[];
  successCriteria: FeatureSuccessCriteria;
  metadata?: FeatureMetadata;
}

export type FeatureCategory =
  | 'basic'
  | 'advanced'
  | 'experimental'
  | 'accessibility'
  | 'performance';

export interface FeatureSuccessCriteria {
  usage: number;
  retention: number;
  satisfaction: number;
}

export interface FeatureMetadata {
  version: string;
  releaseDate: Date;
  complexity: ComplexityLevel;
  documentation?: string;
  tutorials?: string[];
}

export type ComplexityLevel = 'low' | 'medium' | 'high';

export interface FeatureUsage {
  featureId: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  interactions: number;
  context: string;
  metadata?: FeatureUsageMetadata;
}

export interface FeatureUsageMetadata {
  inputSize?: number;
  outputSize?: number;
  processingTime?: number;
  errors?: string[];
  satisfactionRating?: number;
  deviceType?: DeviceType;
  browser?: string;
}

export interface FeatureAdoptionMetrics {
  totalFeatures: number;
  adoptedFeatures: number;
  adoptionRate: number;
  adoptionTrend: Array<{ date: Date; rate: number }>;
  adoptionByCategory: CategoryAdoptionMetrics[];
  featureMetrics: FeatureMetrics[];
  adoptionByUserSegment: UserSegmentMetrics[];
  usagePatterns: UsagePatterns;
  featureCorrelations: FeatureCorrelation[];
  performanceMetrics: FeaturePerformanceMetrics[];
}

export interface CategoryAdoptionMetrics {
  category: string;
  totalFeatures: number;
  adoptedFeatures: number;
  adoptionRate: number;
  averageSatisfaction: number;
  averageUsageTime: number;
}

export interface FeatureMetrics {
  featureId: string;
  featureName: string;
  category: string;
  totalUsers: number;
  activeUsers: number;
  adoptionRate: number;
  retentionRate: number;
  averageUsageTime: number;
  averageUsageFrequency: number;
  successRate: number;
  satisfactionScore: number;
  dropOffRate: number;
  errorRate: number;
  learningCurve: LearningCurvePoint[];
}

export interface LearningCurvePoint {
  day: number;
  competency: number;
}

export interface UserSegmentMetrics {
  segment: string;
  totalUsers: number;
  averageFeaturesAdopted: number;
  mostUsedFeatures: string[];
  adoptionRate: number;
  satisfactionScore: number;
}

export interface UsagePatterns {
  hourlyUsage: Array<{ hour: number; usage: number }>;
  dailyUsage: Array<{ day: string; usage: number }>;
  weeklyUsage: Array<{ week: number; usage: number }>;
  seasonalTrends: Array<{ month: string; usage: number }>;
}

export interface FeatureCorrelation {
  feature1: string;
  feature2: string;
  correlation: number;
  significance: number;
}

export interface FeaturePerformanceMetrics {
  featureId: string;
  averageLoadTime: number;
  errorRate: number;
  userSatisfactionImpact: number;
  systemResourceUsage: number;
}

export interface FeatureFunnel {
  featureId: string;
  steps: FunnelStep[];
  overallConversionRate: number;
  bottlenecks: FunnelBottleneck[];
}

export interface FunnelStep {
  name: string;
  description: string;
  users: number;
  conversionRate: number;
  dropOffReasons: DropOffReason[];
}

export interface DropOffReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface FunnelBottleneck {
  step: number;
  issue: string;
  impact: number;
  recommendations: string[];
}

export interface A/BTestResult {
  testId: string;
  featureId: string;
  hypothesis: string;
  variants: TestVariant[];
  winner: string;
  confidence: number;
  statisticalSignificance: boolean;
  insights: string[];
  recommendations: string[];
  testDuration: number;
  startDate: Date;
  endDate: Date;
}

export interface TestVariant {
  id: string;
  description: string;
  users: number;
  conversionRate: number;
  satisfaction: number;
  usageTime: number;
}

// ============================================================================
// Real-time Interaction Tracking Types
// ============================================================================

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

export interface InteractionType {
  category: InteractionCategory;
  action: string;
  modifiers?: InteractionModifiers;
  gesture?: string;
  pressure?: number;
  velocity?: { x: number; y: number };
}

export type InteractionCategory =
  | 'mouse'
  | 'keyboard'
  | 'touch'
  | 'form'
  | 'navigation'
  | 'media'
  | 'custom';

export interface InteractionModifiers {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
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
  position?: ElementPosition;
}

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
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

export interface InteractionPerformance {
  responseTime: number;
  renderTime: number;
  networkRequests: number;
  memoryUsage?: number;
  cpuUsage?: number;
  errorOccurred: boolean;
  errorMessage?: string;
}

export interface InteractionContext {
  page: string;
  referrer?: string;
  userAgent: string;
  viewport: ViewportSize;
  scrollPosition: ScrollPosition;
  focusElement?: string;
  modalOpen: boolean;
  formActive: boolean;
  currentTool?: string;
  userIntent?: string;
  sessionDuration: number;
  totalInteractions: number;
  previousInteraction?: RealtimeInteraction;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ScrollPosition {
  x: number;
  y: number;
}

export interface RealtimeMetrics {
  currentSessionId: string;
  sessionDuration: number;
  totalInteractions: number;
  interactionsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  currentActivity: UserActivity;
  lastInteractionTime: Date;
  idleTime: number;
  activeZones: ActiveZone[];
  currentResponseTime: number;
  averageRenderTime: number;
  networkRequestRate: number;
  memoryUsage: number;
  cpuUsage: number;
  mouseMovements: MouseMovement[];
  clickPatterns: ClickPattern[];
  scrollPattern: ScrollPattern;
  typingPattern: TypingPattern;
  currentFocus: string;
  modalInteraction: boolean;
  formProgress: FormProgress[];
  toolUsage: ToolUsageStatus[];
  alerts: Alert[];
  nextLikelyAction: string;
  userSatisfactionPrediction: number;
  abandonmentRisk: number;
  conversionProbability: number;
}

export type UserActivity = 'active' | 'idle' | 'away';

export interface ActiveZone {
  element: string;
  x: number;
  y: number;
  width: number;
  height: number;
  heat: number;
}

export interface MouseMovement {
  x: number;
  y: number;
  timestamp: Date;
  velocity: number;
}

export interface ClickPattern {
  element: string;
  timestamp: Date;
  sequence: number;
}

export interface ScrollPattern {
  direction: 'up' | 'down' | 'none';
  velocity: number;
  smoothness: number;
}

export interface TypingPattern {
  speed: number;
  accuracy: number;
  rhythm: number;
}

export interface FormProgress {
  formId: string;
  fields: number;
  completed: number;
  percentage: number;
}

export interface ToolUsageStatus {
  toolId: string;
  startTime: Date;
  interactions: number;
  status: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export type AlertType = 'error' | 'performance' | 'behavior' | 'security';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface InteractionBatch {
  id: string;
  sessionId: string;
  timestamp: Date;
  interactions: RealtimeInteraction[];
  summary: BatchSummary;
  insights: string[];
}

export interface BatchSummary {
  totalInteractions: number;
  duration: number;
  averageResponseTime: number;
  errorCount: number;
  uniqueElements: number;
}

export interface HeatmapData {
  page: string;
  timestamp: Date;
  resolution: { width: number; height: number };
  clicks: HeatmapPoint[];
  movements: HeatmapPoint[];
  scrolls: ScrollPoint[];
  zones: HeatmapZone[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
}

export interface ScrollPoint {
  y: number;
  intensity: number;
}

export interface HeatmapZone {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
  element: string;
}

export interface SessionRecording {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  events: SessionEvent[];
  metadata: SessionMetadata;
}

export interface SessionEvent {
  type: string;
  timestamp: number;
  data: any;
}

export interface SessionMetadata {
  userAgent: string;
  resolution: { width: number; height: number };
  pageUrl: string;
  totalDuration: number;
  interactionCount: number;
}

// ============================================================================
// Performance Monitoring Types
// ============================================================================

export interface PerformanceMetrics {
  taskCompletionTime: number;
  taskSuccessRate: number;
  totalTasksCompleted: number;
  totalTasksAttempted: number;
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  bundleSize: number;
  totalResourcesSize: number;
  resourceLoadTimes: number[];
  averageResponseTime: number;
  errorRate: number;
  userSatisfactionScore: number;
  timestamp: Date;
  sessionId: string;
}

export interface TaskPerformance {
  taskId: string;
  taskName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  errorMessage?: string;
  inputSize?: number;
  outputSize?: number;
  memoryUsage?: number;
}

// ============================================================================
// Accessibility Monitoring Types
// ============================================================================

export interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element: string;
  impact: AccessibilityImpact;
  wcagLevel: WCAGLevel;
  helpUrl?: string;
  selector?: string;
  timestamp: Date;
}

export type AccessibilityImpact = 'critical' | 'serious' | 'moderate' | 'minor';

export type WCAGLevel = 'A' | 'AA' | 'AAA';

export interface AccessibilityMetrics {
  totalIssues: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  wcagCompliance: WCAGCompliance;
  colorContrastRatio: number;
  keyboardNavigationAccessible: boolean;
  screenReaderCompatible: boolean;
  focusManagement: boolean;
  altTextCoverage: number;
  ariaLabelCoverage: number;
  timestamp: Date;
}

export interface WCAGCompliance {
  levelA: number;
  levelAA: number;
  levelAAA: number;
}

export interface AccessibilityAuditResult {
  metrics: AccessibilityMetrics;
  issues: AccessibilityIssue[];
  score: number;
  recommendations: string[];
  auditDate: Date;
}

// ============================================================================
// Unified Analytics Types
// ============================================================================

export interface UnifiedAnalyticsMetrics {
  userAnalytics: UserAnalyticsMetrics;
  navigationMetrics: NavigationMetrics;
  featureAdoption: FeatureAdoptionMetrics;
  realtimeMetrics: RealtimeMetrics;
  performanceMetrics: PerformanceMetrics;
  accessibilityMetrics: AccessibilityAuditResult;
  overallHealthScore: number;
  userExperienceScore: number;
  systemPerformanceScore: number;
  accessibilityComplianceScore: number;
  sc012Compliance: SC012Compliance;
  keyInsights: UnifiedInsight[];
  recommendations: UnifiedRecommendation[];
  actionItems: ActionItem[];
  trends: Trend[];
  systemHealth: SystemHealth;
  generatedAt: Date;
  dataFreshness: number;
}

export interface UserAnalyticsMetrics {
  totalSessions: number;
  totalUsers: number;
  totalPageViews: number;
  totalInteractions: number;
  averageSessionDuration: number;
  bounceRate: number;
  mostUsedTools: ToolUsageStats[];
  navigationPaths: NavigationPath[];
  navigationMetrics: NavigationMetrics;
  featureAdoption: FeatureAdoptionMetrics;
  userExperience: UserExperienceMetrics;
  userSatisfactionScore: number;
  accessibilityUsage: AccessibilityUsageStats;
  errorRate: number;
  taskCompletionRate: number;
  featureAdoptionRate: number;
  sc012Compliance: SC012ComplianceReport;
}

export interface ToolUsageStats {
  toolId: string;
  usage: number;
  averageDuration: number;
  completionRate: number;
  userSatisfaction: number;
}

export interface NavigationMetrics {
  totalPageViews: number;
  uniquePagesVisited: number;
  averagePageTime: number;
  entryPages: PageStats[];
  exitPages: PageStats[];
  topNavigationPaths: NavigationPathStats[];
  navigationBottlenecks: NavigationBottleneck[];
  searchUsage: SearchUsageMetrics;
  filterUsage: FilterUsageMetrics;
}

export interface PageStats {
  page: string;
  count: number;
  percentage: number;
  avgDuration: number;
}

export interface NavigationPathStats {
  from: string;
  to: string;
  count: number;
  avgDuration: number;
}

export interface NavigationBottleneck {
  page: string;
  issue: NavigationBottleneckIssue;
  severity: BottleneckSeverity;
  metrics: NavigationBottleneckMetrics;
  recommendations: string[];
  estimatedImpact: number;
}

export type NavigationBottleneckIssue =
  | 'high_exit_rate'
  | 'long_dwell_time'
  | 'navigation_loop'
  | 'error_prone'
  | 'low_engagement';

export type BottleneckSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface NavigationBottleneckMetrics {
  exitRate: number;
  avgTimeOnPage: number;
  errorRate: number;
  interactionRate: number;
  bounceRate: number;
}

export interface SearchUsageMetrics {
  searchesPerformed: number;
  successRate: number;
  averageResults: number;
  popularQueries: PopularQuery[];
}

export interface PopularQuery {
  query: string;
  count: number;
}

export interface FilterUsageMetrics {
  filtersApplied: number;
  mostUsedFilters: FilterUsage[];
  filterEffectiveness: number;
}

export interface FilterUsage {
  filter: string;
  usage: number;
}

export interface UserExperienceMetrics {
  sessionDuration: SessionDurationMetrics;
  taskCompletion: TaskCompletionMetrics;
  errorRecovery: ErrorRecoveryMetrics;
  engagementMetrics: EngagementMetrics;
  deviceAnalytics: DeviceAnalytics;
  accessibilityMetrics: AccessibilityUsageMetrics;
}

export interface SessionDurationMetrics {
  average: number;
  median: number;
  shortest: number;
  longest: number;
  distribution: DurationRange[];
}

export interface DurationRange {
  range: string;
  count: number;
}

export interface TaskCompletionMetrics {
  overallRate: number;
  byTool: ToolCompletionMetrics[];
  byTaskType: TaskTypeMetrics[];
  dropOffPoints: DropOffPointMetrics[];
}

export interface ToolCompletionMetrics {
  toolId: string;
  completionRate: number;
  averageTime: number;
}

export interface TaskTypeMetrics {
  taskType: string;
  completionRate: number;
  averageTime: number;
}

export interface DropOffPointMetrics {
  toolId: string;
  dropOffPoint: string;
  dropOffRate: number;
  averageTimeToDropOff: number;
  reasons: DropOffReason[];
}

export interface ErrorRecoveryMetrics {
  totalErrors: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  errorsByType: ErrorTypeMetrics[];
  retryPatterns: RetryPattern[];
}

export interface ErrorTypeMetrics {
  errorType: string;
  count: number;
  recoveryRate: number;
}

export interface RetryPattern {
  toolId: string;
  retryRate: number;
  averageRetries: number;
}

export interface EngagementMetrics {
  averageInteractionsPerSession: number;
  clickThroughRate: number;
  scrollDepthAverage: number;
  formCompletionRate: number;
  fileUploadSuccessRate: number;
  timeToFirstInteraction: number;
  activeUsersPerHour: HourlyActiveUsers[];
}

export interface HourlyActiveUsers {
  hour: number;
  activeUsers: number;
}

export interface DeviceAnalytics {
  mobileUsage: number;
  desktopUsage: number;
  tabletUsage: number;
  performanceByDevice: DevicePerformance[];
  featureUsageByDevice: DeviceFeatureUsage[];
}

export interface DevicePerformance {
  device: string;
  avgLoadTime: number;
  errorRate: number;
}

export interface DeviceFeatureUsage {
  device: string;
  features: string[];
  usageRate: number;
}

export interface AccessibilityUsageStats {
  screenReaderUsers: number;
  keyboardOnlyUsers: number;
  highContrastUsers: number;
  reducedMotionUsers: number;
  accessibilityFeatureSuccess: number;
  accessibilityErrors: AccessibilityError[];
}

export interface AccessibilityError {
  type: string;
  count: number;
  severity: string;
}

export interface SC012Compliance {
  trackingCoverage: number;
  dataQuality: number;
  privacyCompliance: number;
  reportingAccuracy: number;
  overallScore: number;
}

export interface SC012ComplianceReport {
  reportId: string;
  generatedAt: Date;
  period: DateRange;
  userInteractionTracking: TrackingCompliance;
  dataQuality: DataQualityMetrics;
  privacyCompliance: PrivacyComplianceMetrics;
  performanceMetrics: SC012PerformanceMetrics;
  insights: ComplianceInsights;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TrackingCompliance {
  allUserPathsTracked: boolean;
  navigationAnalysisComplete: boolean;
  featureUsageComplete: boolean;
  satisfactionMetricsCollected: boolean;
}

export interface DataQualityMetrics {
  dataIntegrityScore: number;
  missingDataPercentage: number;
  dataAccuracy: number;
  completenessRate: number;
}

export interface PrivacyComplianceMetrics {
  consentCollected: boolean;
  dataAnonymized: boolean;
  retentionPolicyFollowed: boolean;
  userControlProvided: boolean;
}

export interface SC012PerformanceMetrics {
  trackingOverhead: number;
  dataTransferSize: number;
  storageUsage: number;
  realTimeProcessing: boolean;
}

export interface ComplianceInsights {
  keyFindings: string[];
  recommendations: string[];
  actionItems: string[];
  successMetrics: string[];
}

export interface UnifiedInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  source: string;
  metrics: InsightMetrics;
  affectedComponents: string[];
  confidence: number;
  timestamp: Date;
  autoGenerated: boolean;
}

export type InsightType =
  | 'performance'
  | 'usability'
  | 'adoption'
  | 'navigation'
  | 'accessibility'
  | 'business';

export type InsightSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface InsightMetrics {
  current: number;
  baseline: number;
  target: number;
  trend: TrendDirection;
}

export type TrendDirection = 'improving' | 'declining' | 'stable';

export interface UnifiedRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  expectedImpact: ExpectedImpact;
  implementation: ImplementationDetails;
  supportingData: SupportingData;
  aBTestSuggestion?: ABTestSuggestion;
  status: RecommendationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type RecommendationCategory =
  | 'ui'
  | 'performance'
  | 'content'
  | 'feature'
  | 'navigation'
  | 'accessibility';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ExpectedImpact {
  metric: string;
  improvement: number;
  confidence: number;
}

export interface ImplementationDetails {
  complexity: ComplexityLevel;
  estimatedEffort: string;
  dependencies: string[];
  riskLevel: RiskLevel;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface SupportingData {
  source: string;
  evidence: string[];
  metrics: Record<string, number>;
}

export interface ABTestSuggestion {
  hypothesis: string;
  variants: string[];
  successMetric: string;
  sampleSize: number;
}

export type RecommendationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  status: ActionItemStatus;
  priority: RecommendationPriority;
  tags: string[];
  relatedInsights: string[];
  relatedRecommendations: string[];
  estimatedImpact: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ActionItemStatus =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done';

export interface Trend {
  id: string;
  name: string;
  description: string;
  metric: string;
  timeframe: Timeframe;
  dataPoints: TrendDataPoint[];
  pattern: TrendPattern;
  significance: number;
  forecast: ForecastPoint[];
}

export type Timeframe = 'hour' | 'day' | 'week' | 'month';

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  context?: Record<string, any>;
}

export type TrendPattern =
  | 'increasing'
  | 'decreasing'
  | 'stable'
  | 'seasonal'
  | 'volatile';

export interface ForecastPoint {
  timestamp: Date;
  value: number;
  confidence: number;
}

export interface SystemHealth {
  uptime: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
  resourceUtilization: number;
}

export interface HealthCheck {
  status: HealthStatus;
  checks: HealthCheckResult[];
  uptime: number;
  version: string;
  lastCheck: Date;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  name: string;
  status: CheckStatus;
  message?: string;
  duration: number;
  timestamp: Date;
}

export type CheckStatus = 'pass' | 'fail' | 'warn';

// ============================================================================
// Error Types
// ============================================================================

export interface AnalyticsError extends Error {
  code: ErrorCode;
  system: AnalyticsSystem;
  context: ErrorContext;
  retryable: boolean;
  retryConfig?: RetryConfig;
  originalError?: Error;
}

export type ErrorCode =
  | 'INITIALIZATION_FAILED'
  | 'TRACKING_DISABLED'
  | 'DATA_VALIDATION_FAILED'
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'PERMISSION_DENIED'
  | 'QUOTA_EXCEEDED'
  | 'TIMEOUT'
  | 'PARSE_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'DEPENDENCY_ERROR'
  | 'SESSION_EXPIRED'
  | 'INVALID_DATA'
  | 'OPERATION_FAILED';

export type AnalyticsSystem =
  | 'user-analytics'
  | 'navigation-analysis'
  | 'feature-analytics'
  | 'realtime-tracker'
  | 'performance-observer'
  | 'accessibility-audit'
  | 'analytics-hub';

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type EventCallback<T = any> = (data: T) => void;

export type AsyncFunction<T = any, R = any> = (...args: T[]) => Promise<R>;

export type SyncFunction<T = any, R = any> = (...args: T[]) => R;

export interface IDisposable {
  dispose(): void;
}

export interface IAnalyticsSystem {
  initialize(config?: any): Promise<void>;
  start(): void;
  stop(): void;
  isInitialized(): boolean;
  isRunning(): boolean;
  getMetrics(): any;
  dispose(): void;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AnalyticsError;
  timestamp: Date;
  requestId: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ExportResponse extends ApiResponse {
  format: 'json' | 'csv' | 'parquet';
  filename: string;
  size: number;
  downloadUrl?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface SystemConfiguration extends AnalyticsConfig {
  debug: boolean;
  logLevel: LogLevel;
  experimental: boolean;
  version: string;
  environment: 'development' | 'staging' | 'production';
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationRule<T = any> {
  name: string;
  validate: (value: T) => ValidationResult;
  required?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// ============================================================================
// Plugin Types
// ============================================================================

export interface AnalyticsPlugin {
  name: string;
  version: string;
  initialize(config: any): Promise<void>;
  track(event: any): void;
  dispose(): void;
}

export interface PluginRegistry {
  register(plugin: AnalyticsPlugin): void;
  unregister(name: string): void;
  get(name: string): AnalyticsPlugin | undefined;
  list(): AnalyticsPlugin[];
}

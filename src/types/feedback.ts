/**
 * Comprehensive TypeScript Types for Feedback Collection System (T146)
 * Provides unified type definitions for feedback collection, analysis, and management
 */

import { Tool, ToolCategory } from './tools';

// ============================================================================
// Core Feedback Types
// ============================================================================

export interface FeedbackConfig {
  enabled: boolean;
  collection: {
    autoTrigger: boolean;
    contextualRequests: boolean;
    toolSpecificSurveys: boolean;
    bugReports: boolean;
    featureRequests: boolean;
    satisfactionSurveys: boolean;
    npsSurveys: boolean;
  };
  frequency: {
    maxRequestsPerSession: number;
    minIntervalBetweenRequests: number; // minutes
    cooldownPeriod: number; // hours
    respectUserPreferences: boolean;
  };
  display: {
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'center';
    style: 'modal' | 'inline' | 'tooltip' | 'toast';
    animation: 'slide' | 'fade' | 'bounce';
    delay: number; // seconds before showing
    autoHide: number; // seconds before auto-hiding, 0 = disabled
  };
  privacy: {
    anonymizeData: boolean;
    collectUserAgent: boolean;
    collectSessionData: boolean;
    requireConsent: boolean;
    dataRetention: number; // days
  };
  integration: {
    analytics: boolean;
    errorHandling: boolean;
    monitoring: boolean;
    crm: boolean;
    projectManagement: boolean;
  };
}

export interface UserFeedbackPreferences {
  enabled: boolean;
  frequency: 'never' | 'minimal' | 'moderate' | 'frequent';
  channels: FeedbackChannel[];
  timing: FeedbackTiming[];
  topics: FeedbackTopic[];
  lastInteraction: Date;
  totalGiven: number;
  optedOut: boolean;
  customSettings: UserCustomSettings;
}

export type FeedbackChannel = 'modal' | 'inline' | 'tooltip' | 'toast' | 'email' | 'slack';

export type FeedbackTiming =
  | 'after_tool_use'
  | 'on_error'
  | 'on_session_end'
  | 'on_feature_discovery'
  | 'periodic'
  | 'manual';

export type FeedbackTopic =
  | 'satisfaction'
  | 'bug_report'
  | 'feature_request'
  | 'usability'
  | 'performance'
  | 'documentation'
  | 'general';

export interface UserCustomSettings {
  preferredTimeOfDay?: string;
  maxPerWeek?: number;
  skipWeekends?: boolean;
  toolSpecificSettings: Record<string, ToolFeedbackSettings>;
}

export interface ToolFeedbackSettings {
  enabled: boolean;
  frequency: 'never' | 'minimal' | 'moderate' | 'frequent';
  triggers: FeedbackTrigger[];
  questions: string[];
}

export type FeedbackTrigger =
  | 'first_use'
  | 'completion'
  | 'error'
  | 'time_spent'
  | 'feature_used'
  | 'session_milestone';

// ============================================================================
// Feedback Data Types
// ============================================================================

export interface FeedbackSubmission {
  id: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  type: FeedbackType;
  source: FeedbackSource;
  context: FeedbackContext;
  content: FeedbackContent;
  metadata: FeedbackMetadata;
  sentiment?: SentimentAnalysis;
  status: FeedbackStatus;
  priority: FeedbackPriority;
}

export type FeedbackType =
  | 'rating'
  | 'survey'
  | 'bug_report'
  | 'feature_request'
  | 'satisfaction'
  | 'nps'
  | 'usability'
  | 'performance'
  | 'general';

export type FeedbackSource =
  | 'modal'
  | 'inline_form'
  | 'tooltip'
  | 'toast'
  | 'email'
  | 'api'
  | 'browser_extension'
  | 'mobile_app';

export interface FeedbackContext {
  tool?: Tool;
  category?: ToolCategory;
  action?: string;
  page?: string;
  feature?: string;
  userAgent?: string;
  viewport?: { width: number; height: number };
  sessionDuration?: number;
  previousInteractions?: string[];
  errorContext?: ErrorContext;
  performanceMetrics?: PerformanceContext;
  userJourneyStage?: UserJourneyStage;
}

export interface ErrorContext {
  message: string;
  stack?: string;
  line?: number;
  column?: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

export interface PerformanceContext {
  loadTime?: number;
  processingTime?: number;
  memoryUsage?: number;
  bundleSize?: number;
  networkLatency?: number;
  renderTime?: number;
}

export type UserJourneyStage =
  | 'discovery'
  | 'exploration'
  | 'first_use'
  | 'regular_use'
  | 'advanced_use'
  | 'troubleshooting';

export interface FeedbackContent {
  rating?: RatingContent;
  survey?: SurveyContent;
  bugReport?: BugReportContent;
  featureRequest?: FeatureRequestContent;
  satisfaction?: SatisfactionContent;
  nps?: NPSContent;
  usability?: UsabilityContent;
  performance?: PerformanceFeedbackContent;
  general?: GeneralFeedbackContent;
}

export interface RatingContent {
  score: number; // 1-5 or 1-10
  maxScore: number;
  categories?: RatingCategory[];
  comment?: string;
}

export interface RatingCategory {
  category: string;
  score: number;
  weight?: number;
}

export interface SurveyContent {
  answers: SurveyAnswer[];
  completionRate: number;
  timeSpent: number; // seconds
  questionSkips: string[];
}

export interface SurveyAnswer {
  questionId: string;
  question: string;
  type: 'rating' | 'text' | 'choice' | 'multiple_choice' | 'boolean';
  answer: any;
  optional: boolean;
  order: number;
}

export interface BugReportContent {
  title: string;
  description: string;
  severity: BugSeverity;
  reproducibility: Reproducibility;
  steps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment?: EnvironmentInfo;
  attachments?: Attachment[];
  screenshots?: Attachment[];
  browserInfo?: BrowserInfo;
  consoleErrors?: string[];
  networkRequests?: NetworkRequest[];
}

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export type Reproducibility = 'always' | 'sometimes' | 'rarely' | 'unable_to_reproduce';

export interface EnvironmentInfo {
  os: string;
  browser: string;
  version: string;
  userAgent: string;
  screenResolution: string;
  language: string;
  timezone: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  plugins: string[];
  cookiesEnabled: boolean;
  javascriptEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  size: number;
  timestamp: Date;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface FeatureRequestContent {
  title: string;
  description: string;
  category: FeatureCategory;
  priority: RequestPriority;
  useCase: string;
  benefits: string[];
  alternatives: string[];
  implementation?: ImplementationDetails;
  userStories?: UserStory[];
}

export type FeatureCategory =
  | 'new_tool'
  | 'enhancement'
  | 'integration'
  | 'ui_improvement'
  | 'performance'
  | 'accessibility'
  | 'documentation'
  | 'other';

export type RequestPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ImplementationDetails {
  estimatedEffort: EffortLevel;
  complexity: ComplexityLevel;
  dependencies: string[];
  technicalRequirements: string[];
  potentialRisks: string[];
}

export type EffortLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'very_complex';

export interface UserStory {
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
  priority: 'must_have' | 'should_have' | 'could_have' | 'wont_have';
}

export interface SatisfactionContent {
  overall: number; // 1-5
  easeOfUse: number; // 1-5
  functionality: number; // 1-5
  performance: number; // 1-5
  reliability: number; // 1-5
  likelihoodToRecommend: number; // 1-10
  likelihoodToContinue: number; // 1-5
  comments?: string;
  whatWorks?: string[];
  whatCouldBeBetter?: string[];
}

export interface NPSContent {
  score: number; // 0-10
  category: 'detractor' | 'passive' | 'promoter';
  reason?: string;
  improvement?: string;
  competitor?: string;
  additional?: string;
}

export interface UsabilityContent {
  easeOfUse: number; // 1-5
  learnability: number; // 1-5
  efficiency: number; // 1-5
  memorability: number; // 1-5
  errors: number; // 1-5
  satisfaction: number; // 1-5
  findability: number; // 1-5
  accessibility: number; // 1-5
  feedbackItems: UsabilityFeedbackItem[];
}

export interface UsabilityFeedbackItem {
  aspect: string;
  rating: number;
  comment?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface PerformanceFeedbackContent {
  speed: number; // 1-5
  responsiveness: number; // 1-5
  reliability: number; // 1-5
  resourceUsage: number; // 1-5
  specificIssues: PerformanceIssue[];
  environmentDetails: EnvironmentInfo;
  comparisonToExpected?: 'much_worse' | 'worse' | 'as_expected' | 'better' | 'much_better';
}

export interface PerformanceIssue {
  type: 'slow_load' | 'freeze' | 'crash' | 'memory_leak' | 'network_error' | 'other';
  description: string;
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  impact: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
}

export interface GeneralFeedbackContent {
  category: string;
  subject: string;
  message: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency?: 'low' | 'medium' | 'high';
  attachments?: Attachment[];
  tags?: string[];
}

export interface FeedbackMetadata {
  ipAddress?: string;
  location?: string;
  deviceType: string;
  browser: string;
  os: string;
  language: string;
  timezone: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionId: string;
  journeyStage: UserJourneyStage;
  totalTimeOnPage: number;
  scrollDepth: number;
  interactions: number;
  formTime: number; // time spent on feedback form
  deviceOrientation?: 'portrait' | 'landscape';
  connectionType?: string;
  batteryLevel?: number;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0 to 1
  emotions: EmotionScore[];
  keyPhrases: string[];
  entities: Entity[];
  language: string;
  processedAt: Date;
  model: string;
}

export interface EmotionScore {
  emotion: 'joy' | 'anger' | 'sadness' | 'fear' | 'surprise' | 'disgust';
  score: number; // 0 to 1
}

export interface Entity {
  text: string;
  type: 'tool' | 'feature' | 'issue' | 'person' | 'organization' | 'location' | 'other';
  salience: number; // 0 to 1
  mentions: number;
}

export type FeedbackStatus =
  | 'new'
  | 'under_review'
  | 'in_progress'
  | 'awaiting_response'
  | 'resolved'
  | 'closed'
  | 'duplicate'
  | 'rejected';

export type FeedbackPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'urgent';

// ============================================================================
// Feedback Collection Types
// ============================================================================

export interface FeedbackTriggerConfig {
  id: string;
  name: string;
  description: string;
  type: FeedbackTriggerType;
  conditions: TriggerCondition[];
  template: FeedbackTemplate;
  probability: number; // 0 to 1
  cooldown: number; // minutes
  enabled: boolean;
}

export type FeedbackTriggerType =
  | 'event_based'
  | 'time_based'
  | 'behavior_based'
  | 'performance_based'
  | 'error_based'
  | 'manual';

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'matches';
  value: any;
  required: boolean;
}

export interface FeedbackTemplate {
  id: string;
  name: string;
  type: FeedbackType;
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  layout: TemplateLayout;
  styling: TemplateStyling;
  localization: Record<string, TemplateLocalization>;
  conditions?: TemplateCondition[];
}

export interface FeedbackQuestion {
  id: string;
  type: QuestionType;
  text: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  conditions?: QuestionCondition[];
  order: number;
  group?: string;
  weight?: number;
}

export type QuestionType =
  | 'rating'
  | 'text'
  | 'textarea'
  | 'choice'
  | 'multiple_choice'
  | 'boolean'
  | 'scale'
  | 'ranking'
  | 'file_upload'
  | 'email'
  | 'url'
  | 'number'
  | 'date';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  order: number;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
}

export interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  action: 'show' | 'hide' | 'require' | 'optional';
}

export interface TemplateLayout {
  type: 'single_page' | 'multi_step' | 'accordion' | 'tabs';
  columns: number;
  sections: TemplateSection[];
  progressIndicator: boolean;
  navigation: NavigationConfig;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  questions: string[];
  order: number;
  collapsible?: boolean;
  collapsedByDefault?: boolean;
}

export interface NavigationConfig {
  showPrevious: boolean;
  showNext: boolean;
  showSubmit: boolean;
  showCancel: boolean;
  previousLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  cancelLabel?: string;
}

export interface TemplateStyling {
  theme: 'light' | 'dark' | 'auto';
  colors: ColorScheme;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  animations: AnimationConfig;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  error: string;
  warning: string;
  success: string;
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: FontSizeConfig;
  fontWeight: FontWeightConfig;
  lineHeight: number;
}

export interface FontSizeConfig {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface FontWeightConfig {
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
}

export interface SpacingConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  enabled: boolean;
}

export interface TemplateLocalization {
  title: string;
  description: string;
  questions: Record<string, string>;
  options: Record<string, Record<string, string>>;
  buttons: {
    previous: string;
    next: string;
    submit: string;
    cancel: string;
    skip: string;
  };
  validation: {
    required: string;
    invalid: string;
    minLength: string;
    maxLength: string;
  };
}

export interface TemplateCondition {
  tool?: string;
  category?: string;
  userRole?: string;
  sessionLength?: { min?: number; max?: number };
  previousFeedback?: number;
  errorOccurred?: boolean;
  performanceIssue?: boolean;
  custom?: (context: FeedbackContext) => boolean;
}

// ============================================================================
// Analytics and Insights Types
// ============================================================================

export interface FeedbackAnalytics {
  summary: FeedbackSummary;
  trends: FeedbackTrend[];
  insights: FeedbackInsight[];
  recommendations: FeedbackRecommendation[];
  alerts: FeedbackAlert[];
  benchmarks: FeedbackBenchmark[];
  segments: FeedbackSegment[];
  correlation: FeedbackCorrelation[];
  predictions: FeedbackPrediction[];
}

export interface FeedbackSummary {
  totalSubmissions: number;
  averageRating: number;
  satisfactionScore: number;
  npsScore: number;
  responseRate: number;
  completionRate: number;
  timeToResolution: number;
  breakdown: FeedbackBreakdown;
  period: DateRange;
}

export interface FeedbackBreakdown {
  byType: Record<FeedbackType, number>;
  bySource: Record<FeedbackSource, number>;
  byTool: Record<string, number>;
  byCategory: Record<ToolCategory, number>;
  byStatus: Record<FeedbackStatus, number>;
  byPriority: Record<FeedbackPriority, number>;
  bySentiment: Record<'positive' | 'neutral' | 'negative', number>;
  byJourneyStage: Record<UserJourneyStage, number>;
}

export interface FeedbackTrend {
  id: string;
  metric: string;
  timeframe: Timeframe;
  data: TrendDataPoint[];
  pattern: TrendPattern;
  change: TrendChange;
  significance: number;
  forecast: ForecastDataPoint[];
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  volume: number;
  context?: Record<string, any>;
}

export interface ForecastDataPoint {
  timestamp: Date;
  value: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export type Timeframe = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type TrendPattern =
  | 'increasing'
  | 'decreasing'
  | 'stable'
  | 'seasonal'
  | 'volatile'
  | 'cyclical';

export interface TrendChange {
  absolute: number;
  percentage: number;
  direction: 'up' | 'down' | 'stable';
  significance: 'low' | 'medium' | 'high';
}

export interface FeedbackInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: InsightSeverity;
  confidence: number;
  evidence: InsightEvidence[];
  impact: InsightImpact;
  recommendations: string[];
  timeframe: DateRange;
  autoGenerated: boolean;
  reviewedAt?: Date;
  tags: string[];
}

export type InsightType =
  | 'pattern'
  | 'anomaly'
  | 'opportunity'
  | 'risk'
  | 'trend'
  | 'correlation'
  | 'sentiment'
  | 'usability';

export type InsightSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface InsightEvidence {
  type: 'data' | 'statistic' | 'quote' | 'metric' | 'comparison';
  content: string;
  source: string;
  weight: number;
}

export interface InsightImpact {
  area: 'user_experience' | 'business' | 'technical' | 'support';
  level: 'low' | 'medium' | 'high' | 'critical';
  usersAffected: number;
  potentialGain?: number;
  potentialLoss?: number;
}

export interface FeedbackRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: ExpectedOutcome;
  implementation: ImplementationPlan;
  effort: EffortLevel;
  risk: RiskLevel;
  dependencies: string[];
  successMetrics: string[];
  timeframe: string;
  owner?: string;
  status: RecommendationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type RecommendationCategory =
  | 'feature_improvement'
  | 'bug_fix'
  | 'usability'
  | 'performance'
  | 'documentation'
  | 'onboarding'
  | 'accessibility'
  | 'security';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ExpectedOutcome {
  description: string;
  metrics: {
    satisfaction?: number;
    rating?: number;
    adoption?: number;
    efficiency?: number;
    reduction?: number;
  };
  confidence: number;
  timeframe: string;
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  resources: string[];
  blockers: string[];
  alternatives: string[];
  testing: string[];
  rollout: RolloutPlan;
}

export interface ImplementationPhase {
  name: string;
  description: string;
  duration: string;
  deliverables: string[];
  dependencies: string[];
  effort: EffortLevel;
}

export interface RolloutPlan {
  strategy: 'big_bang' | 'phased' | 'canary' | 'beta';
  percentage: number;
  criteria: string[];
  monitoring: string[];
  rollback: string[];
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RecommendationStatus =
  | 'proposed'
  | 'approved'
  | 'in_progress'
  | 'testing'
  | 'deployed'
  | 'measuring'
  | 'completed'
  | 'rejected'
  | 'deferred';

export interface FeedbackAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  condition: AlertCondition;
  threshold: AlertThreshold;
  current: number;
  trend: string;
  affectedItems: string[];
  recommendations: string[];
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: Date;
}

export type AlertType =
  | 'volume_spike'
  | 'satisfaction_drop'
  | 'bug_increase'
  | 'negative_sentiment'
  | 'response_rate_low'
  | 'completion_rate_low'
  | 'performance_issue';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertCondition {
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  timeframe: Timeframe;
  comparison: 'baseline' | 'previous_period' | 'target';
}

export interface AlertThreshold {
  value: number;
  unit: string;
  critical: number;
  warning: number;
  info: number;
}

export interface FeedbackBenchmark {
  id: string;
  name: string;
  description: string;
  category: BenchmarkCategory;
  period: DateRange;
  metrics: BenchmarkMetric[];
  industry: string;
  companySize: string;
  toolCategory?: ToolCategory;
  source: string;
  reliability: number;
}

export type BenchmarkCategory =
  | 'satisfaction'
  | 'nps'
  | 'response_rate'
  | 'completion_rate'
  | 'time_to_resolution'
  | 'sentiment'
  | 'usability';

export interface BenchmarkMetric {
  name: string;
  value: number;
  percentile: number;
  rank: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
}

export interface FeedbackSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  size: number;
  percentage: number;
  characteristics: SegmentCharacteristic[];
  feedbackPatterns: FeedbackPattern[];
  recommendations: string[];
}

export interface SegmentCriteria {
  demographic?: DemographicCriteria;
  behavioral?: BehavioralCriteria;
  technical?: TechnicalCriteria;
  feedback?: FeedbackCriteria;
  custom?: Record<string, any>;
}

export interface DemographicCriteria {
  location?: string[];
  language?: string[];
  deviceType?: string[];
  browser?: string[];
  os?: string[];
}

export interface BehavioralCriteria {
  toolsUsed?: string[];
  usageFrequency?: string;
  sessionDuration?: { min?: number; max?: number };
  feedbackFrequency?: string;
  journeyStage?: UserJourneyStage[];
}

export interface TechnicalCriteria {
  errors?: boolean;
  performanceIssues?: boolean;
  connectionType?: string[];
  screenResolution?: string[];
}

export interface FeedbackCriteria {
  types?: FeedbackType[];
  sentiment?: string[];
  ratings?: { min?: number; max?: number };
  volume?: { min?: number; max?: number };
}

export interface SegmentCharacteristic {
  trait: string;
  value: string;
  significance: number;
  description: string;
}

export interface FeedbackPattern {
  pattern: string;
  frequency: number;
  context: string;
  examples: string[];
}

export interface FeedbackCorrelation {
  id: string;
  factor1: CorrelationFactor;
  factor2: CorrelationFactor;
  coefficient: number;
  significance: number;
  description: string;
  implications: string[];
  dataPoints: CorrelationDataPoint[];
  timeframe: DateRange;
}

export interface CorrelationFactor {
  type: 'feedback_metric' | 'user_behavior' | 'technical' | 'business';
  name: string;
  value: any;
}

export interface CorrelationDataPoint {
  timestamp: Date;
  factor1Value: any;
  factor2Value: any;
  context?: Record<string, any>;
}

export interface FeedbackPrediction {
  id: string;
  type: PredictionType;
  target: string;
  timeframe: DateRange;
  confidence: number;
  prediction: any;
  factors: PredictionFactor[];
  methodology: string;
  accuracy?: number;
  lastValidated?: Date;
}

export type PredictionType =
  | 'satisfaction'
  | 'churn_risk'
  | 'adoption'
  | 'issue_volume'
  | 'feature_success'
  | 'trend';

export interface PredictionFactor {
  name: string;
  value: number;
  importance: number;
  trend: string;
}

// ============================================================================
// Dashboard and UI Types
// ============================================================================

export interface FeedbackDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  dateRange: DateRange;
  refreshInterval: number;
  shareable: boolean;
  isDefault: boolean;
  owner?: string;
  permissions: DashboardPermissions;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  data?: any;
  lastUpdated: Date;
  refreshRate: number;
  draggable: boolean;
  resizable: boolean;
  collapsible: boolean;
}

export type WidgetType =
  | 'summary_card'
  | 'chart'
  | 'table'
  | 'list'
  | 'metric'
  | 'trend'
  | 'heatmap'
  | 'wordcloud'
  | 'sentiment'
  | 'alerts'
  | 'recommendations';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfig {
  chartType?: string;
  metrics: string[];
  filters: Record<string, any>;
  aggregation: string;
  comparison: string;
  timeframe: Timeframe;
  visualization: VisualizationConfig;
  interactions: InteractionConfig;
}

export interface VisualizationConfig {
  colors: string[];
  animations: boolean;
  legend: boolean;
  tooltips: boolean;
  grid: boolean;
  labels: boolean;
}

export interface InteractionConfig {
  clickable: boolean;
  hoverable: boolean;
  zoomable: boolean;
  filterable: boolean;
  exportable: boolean;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom';
  columns: number;
  spacing: number;
  padding: number;
  breakpoints: LayoutBreakpoint[];
}

export interface LayoutBreakpoint {
  name: string;
  width: number;
  columns: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: FilterType;
  field: string;
  options: FilterOption[];
  defaultValue: any;
  multiSelect: boolean;
  searchable: boolean;
}

export type FilterType =
  | 'select'
  | 'multiselect'
  | 'date_range'
  | 'number_range'
  | 'text_search'
  | 'toggle';

export interface FilterOption {
  label: string;
  value: any;
  count?: number;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  share: string[];
  delete: string[];
  public: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
  preset?: DateRangePreset;
}

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year';

// ============================================================================
// Integration Types
// ============================================================================

export interface FeedbackIntegration {
  id: string;
  name: string;
  type: IntegrationType;
  config: IntegrationConfig;
  status: IntegrationStatus;
  lastSync: Date;
  metrics: IntegrationMetrics;
  errors: IntegrationError[];
  enabled: boolean;
}

export type IntegrationType =
  | 'analytics'
  | 'crm'
  | 'project_management'
  | 'communication'
  | 'monitoring'
  | 'email'
  | 'webhook'
  | 'api';

export interface IntegrationConfig {
  endpoint?: string;
  apiKey?: string;
  credentials?: Record<string, string>;
  mapping?: FieldMapping[];
  filters?: IntegrationFilter[];
  schedule?: IntegrationSchedule;
  retry?: RetryConfig;
  headers?: Record<string, string>;
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: string;
  required: boolean;
}

export interface IntegrationFilter {
  field: string;
  operator: string;
  value: any;
  include: boolean;
}

export interface IntegrationSchedule {
  enabled: boolean;
  frequency: string;
  timezone: string;
  lastRun?: Date;
  nextRun?: Date;
}

export type IntegrationStatus =
  | 'active'
  | 'inactive'
  | 'error'
  | 'syncing'
  | 'disabled';

export interface IntegrationMetrics {
  synced: number;
  failed: number;
  pending: number;
  lastSync: Date;
  averageSyncTime: number;
  successRate: number;
}

export interface IntegrationError {
  id: string;
  timestamp: Date;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolvedAt?: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
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

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface Disposable {
  dispose(): void;
}

export interface EventCallback<T = any> {
  (data: T): void;
}

export interface ProgressInfo {
  loaded: number;
  total: number;
  percentage: number;
  bytes: number;
  speed: number;
  timeRemaining: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface FeedbackError extends Error {
  code: FeedbackErrorCode;
  context?: Record<string, any>;
  retryable: boolean;
  timestamp: Date;
}

export type FeedbackErrorCode =
  | 'VALIDATION_FAILED'
  | 'SUBMISSION_FAILED'
  | 'TEMPLATE_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PERMISSION_DENIED'
  | 'INTEGRATION_ERROR'
  | 'ANALYSIS_FAILED'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_DATA'
  | 'QUOTA_EXCEEDED'
  | 'SERVICE_UNAVAILABLE';

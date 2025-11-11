/**
 * Error Recovery Metrics Types for SC-009 Compliance
 * Comprehensive type definitions for error recovery tracking and analysis
 * Target: 98% error recovery rate - when errors occur, users can successfully retry and complete their task
 */

// ============================================================================
// Core Error Recovery Types
// ============================================================================

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  toolId?: string;
  operation?: string;

  // Error classification
  type: ErrorType;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategy?: RecoveryStrategy;

  // Error details
  message: string;
  code?: string;
  stack?: string;
  context: ErrorContext;

  // Recovery tracking
  recoveryAttempts: RecoveryAttempt[];
  finalOutcome: RecoveryOutcome;
  totalRecoveryTime: number;
  userSatisfied: boolean;

  // SC-009 compliance
  sc009Compliant: boolean;
  complianceNotes?: string;
}

export type ErrorType =
  | 'invalid_input_format'
  | 'file_size_limit_exceeded'
  | 'network_timeout'
  | 'unsupported_format'
  | 'processing_failure'
  | 'validation_error'
  | 'permission_denied'
  | 'resource_unavailable'
  | 'memory_limit_exceeded'
  | 'syntax_error'
  | 'runtime_error'
  | 'configuration_error'
  | 'dependency_error'
  | 'unknown_error';

export type ErrorCategory =
  | 'user_input'
  | 'file_processing'
  | 'network'
  | 'system_resource'
  | 'business_logic'
  | 'security'
  | 'integration'
  | 'performance'
  | 'ui_ux'
  | 'third_party';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  userAgent: string;
  url: string;
  referrer?: string;
  screenResolution: string;
  viewportSize: string;
  connectionType?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browserInfo: string;
  timestamp: Date;

  // Context-specific data
  inputSize?: number;
  fileName?: string;
  fileSize?: number;
  processingStep?: string;
  userAction?: string;
  formData?: Record<string, any>;
  additionalData?: Record<string, any>;
}

// ============================================================================
// Recovery Types
// ============================================================================

export interface RecoveryAttempt {
  id: string;
  timestamp: Date;
  strategy: RecoveryStrategy;
  automated: boolean;
  duration: number;
  success: boolean;

  // Guidance provided
  guidanceProvided?: RecoveryGuidance;
  userFollowedGuidance: boolean;

  // Technical details
  errorBefore: string;
  errorAfter?: string;
  stepsTaken: RecoveryStep[];

  // User experience
  userFeedback?: RecoveryFeedback;
  effortLevel: 'low' | 'medium' | 'high';
}

export type RecoveryStrategy =
  | 'retry_with_same_input'
  | 'retry_with_corrected_input'
  | 'fallback_processing'
  | 'alternative_method'
  | 'guided_correction'
  | 'automatic_fix'
  | 'manual_intervention'
  | 'escalation'
  | 'workaround_suggested'
  | 'graceful_degradation'
  | 'resource_optimization'
  | 'format_conversion'
  | 'cache_refresh'
  | 'network_retry'
  | 'browser_refresh';

export interface RecoveryGuidance {
  id: string;
  type: GuidanceType;
  title: string;
  description: string;
  steps: GuidanceStep[];
  examples?: GuidanceExample[];
  resources?: GuidanceResource[];
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type GuidanceType =
  | 'error_explanation'
  | 'step_by_step_instructions'
  | 'interactive_tutorial'
  | 'video_demo'
  | 'documentation_link'
  | 'example_code'
  | 'format_template'
  | 'checklist'
  | 'troubleshooting_guide';

export interface GuidanceStep {
  order: number;
  title: string;
  description: string;
  action?: string;
  expected?: string;
  interactive?: boolean;
  validation?: string;
}

export interface GuidanceExample {
  title: string;
  description: string;
  code?: string;
  before?: string;
  after?: string;
  explanation?: string;
}

export interface GuidanceResource {
  type: 'documentation' | 'video' | 'tutorial' | 'forum' | 'support';
  title: string;
  url: string;
  description?: string;
}

export interface RecoveryStep {
  action: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  details?: string;
}

export interface RecoveryFeedback {
  helpful: boolean;
  clear: boolean;
  effective: boolean;
  rating: number; // 1-5 scale
  comment?: string;
  suggestions?: string[];
}

export type RecoveryOutcome =
  | 'success_on_first_retry'
  | 'success_after_multiple_retries'
  | 'success_with_alternative_method'
  | 'success_with_escalation'
  | 'user_gave_up'
  | 'user_abandoned_task'
  | 'timeout'
  | 'system_intervention'
  | 'partial_success'
  | 'ongoing';

// ============================================================================
// Metrics and Analytics Types
// ============================================================================

export interface ErrorRecoveryMetrics {
  // Overall SC-009 compliance
  overallRecoveryRate: number; // Target: 98%
  sc009Compliant: boolean;
  sc009Gap: number; // Difference from 98% target

  // Error distribution
  totalErrors: number;
  errorsByType: ErrorTypeMetrics[];
  errorsByCategory: ErrorCategoryMetrics[];
  errorsBySeverity: ErrorSeverityMetrics[];
  errorsByTool: ToolErrorMetrics[];

  // Recovery performance
  averageRecoveryTime: number;
  medianRecoveryTime: number;
  recoveryTimeDistribution: RecoveryTimeDistribution[];
  successRateByStrategy: StrategySuccessMetrics[];

  // User experience
  userSatisfactionScore: number;
  userSatisfactionByErrorType: SatisfactionByErrorType[];
  abandonmentRate: number;
  abandonmentByErrorType: AbandonmentByErrorType[];

  // Recovery patterns
  mostEffectiveStrategies: RecoveryStrategyRanking[];
  commonRecoveryPaths: RecoveryPath[];
  retryPatterns: RetryPatternAnalysis[];

  // Guidance effectiveness
  guidanceEffectivenessScore: number;
  guidanceUsageStats: GuidanceUsageMetrics[];
  mostHelpfulGuidance: GuidanceRanking[];

  // Time-based metrics
  hourlyMetrics: HourlyErrorRecoveryMetrics[];
  dailyMetrics: DailyErrorRecoveryMetrics[];
  weeklyMetrics: WeeklyErrorRecoveryMetrics[];
  monthlyTrends: MonthlyTrendMetrics[];

  // System health
  systemHealthScore: number;
  criticalErrorRate: number;
  cascadingFailureCount: number;
  resilienceScore: number;

  // Target tracking
  sc009TargetProgress: SC009TargetProgress;
  recommendations: ErrorRecoveryRecommendation[];

  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
}

export interface ErrorTypeMetrics {
  type: ErrorType;
  count: number;
  percentage: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  mostEffectiveStrategy: RecoveryStrategy;
  userSatisfaction: number;
  sc009Compliant: boolean;
}

export interface ErrorCategoryMetrics {
  category: ErrorCategory;
  count: number;
  percentage: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  topErrors: ErrorType[];
  trend: TrendDirection;
}

export interface ErrorSeverityMetrics {
  severity: ErrorSeverity;
  count: number;
  percentage: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  impactOnUserExperience: number;
  priority: RecommendationPriority;
}

export interface ToolErrorMetrics {
  toolId: string;
  toolName: string;
  totalErrors: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  userSatisfaction: number;
  sc009Compliant: boolean;
  commonErrors: ErrorTypeMetrics[];
  topStrategies: RecoveryStrategyRanking[];
}

export interface RecoveryTimeDistribution {
  range: string; // "0-10s", "10-30s", etc.
  count: number;
  percentage: number;
  successRate: number;
  userSatisfaction: number;
}

export interface StrategySuccessMetrics {
  strategy: RecoveryStrategy;
  usageCount: number;
  successRate: number;
  averageRecoveryTime: number;
  userSatisfaction: number;
  effectivenessScore: number;
  applicableErrorTypes: ErrorType[];
}

export interface SatisfactionByErrorType {
  errorType: ErrorType;
  averageRating: number;
  totalRatings: number;
  distribution: RatingDistribution[];
  factors: SatisfactionFactor[];
}

export interface RatingDistribution {
  rating: number; // 1-5
  count: number;
  percentage: number;
}

export interface SatisfactionFactor {
  factor: string;
  positive: boolean;
  frequency: number;
  impact: number;
}

export interface AbandonmentByErrorType {
  errorType: ErrorType;
  abandonments: number;
  totalOccurrences: number;
  abandonmentRate: number;
  averageTimeToAbandon: number;
  commonReasons: AbandonmentReason[];
}

export interface AbandonmentReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface RecoveryStrategyRanking {
  strategy: RecoveryStrategy;
  effectivenessScore: number;
  successRate: number;
  usageCount: number;
  userSatisfaction: number;
  averageTime: number;
  applicableErrors: number;
}

export interface RecoveryPath {
  id: string;
  path: RecoveryStep[];
  successRate: number;
  usageCount: number;
  averageTime: number;
  commonErrors: ErrorType[];
  userSatisfaction: number;
}

export interface RetryPatternAnalysis {
  errorType: ErrorType;
  averageRetries: number;
  maxRetries: number;
  successByAttempt: SuccessByAttempt[];
  commonFailurePoints: FailurePoint[];
  optimalRetryCount: number;
}

export interface SuccessByAttempt {
  attemptNumber: number;
  successCount: number;
  successRate: number;
  averageTime: number;
}

export interface FailurePoint {
  step: string;
  failureCount: number;
  failureRate: number;
  commonErrors: string[];
}

export interface GuidanceUsageMetrics {
  guidanceType: GuidanceType;
  usageCount: number;
  effectivenessRate: number;
  userSatisfaction: number;
  averageTimeToSuccess: number;
  completionRate: number;
}

export interface GuidanceRanking {
  guidanceId: string;
  title: string;
  type: GuidanceType;
  effectivenessScore: number;
  usageCount: number;
  userRating: number;
  successRate: number;
}

export interface HourlyErrorRecoveryMetrics {
  hour: number;
  errorCount: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  userSatisfaction: number;
  topErrorTypes: ErrorType[];
}

export interface DailyErrorRecoveryMetrics {
  date: string;
  errorCount: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  userSatisfaction: number;
  sc009Compliant: boolean;
  improvementFromPreviousDay: number;
}

export interface WeeklyErrorRecoveryMetrics {
  week: number;
  year: number;
  errorCount: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  userSatisfaction: number;
  sc009Compliant: boolean;
  weekOverWeekChange: number;
}

export interface MonthlyTrendMetrics {
  month: string;
  year: number;
  errorCount: number;
  recoveryRate: number;
  averageRecoveryTime: number;
  userSatisfaction: number;
  sc009Compliant: boolean;
  monthOverMonthChange: number;
  yearOverYearChange: number;
  trendDirection: TrendDirection;
}

export interface SC009TargetProgress {
  targetRecoveryRate: number; // 98%
  currentRecoveryRate: number;
  gap: number;
  onTrack: boolean;
  projectedAchievement: Date;
  requiredImprovement: number;
  confidenceLevel: number;
  riskFactors: RiskFactor[];
  successFactors: SuccessFactor[];
}

export interface RiskFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  probability: number;
  mitigation: string;
}

export interface SuccessFactor {
  factor: string;
  impact: number;
  confidence: number;
  sustainability: boolean;
}

export interface ErrorRecoveryRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;

  // Impact metrics
  affectedErrorTypes: ErrorType[];
  expectedImprovement: ExpectedImprovement;

  // Implementation details
  effort: ImplementationEffort;
  timeframe: string;
  dependencies: string[];
  riskLevel: RiskLevel;

  // Validation
  supportingData: SupportingDataPoint[];
  confidence: number;

  // Status
  status: RecommendationStatus;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface ExpectedImprovement {
  recoveryRateImprovement: number;
  userSatisfactionImprovement: number;
  timeToRecoveryReduction: number;
  sc009ComplianceImpact: number;
}

export interface ImplementationEffort {
  complexity: 'low' | 'medium' | 'high';
  estimatedHours: number;
  requiredSkills: string[];
  resources: string[];
}

export interface SupportingDataPoint {
  metric: string;
  currentValue: number;
  targetValue: number;
  source: string;
  timestamp: Date;
}

// ============================================================================
// Real-time Monitoring Types
// ============================================================================

export interface RealtimeErrorRecoveryMetrics {
  currentSession: SessionErrorMetrics;
  recentErrors: ErrorEvent[];
  activeRecoveries: ActiveRecovery[];
  systemHealth: RealtimeSystemHealth;
  alerts: ErrorRecoveryAlert[];
  performance: RealtimePerformanceMetrics;
  predictions: RecoveryPrediction[];
}

export interface SessionErrorMetrics {
  sessionId: string;
  startTime: Date;
  errorsEncountered: number;
  recoveriesAttempted: number;
  successfulRecoveries: number;
  currentRecoveryRate: number;
  averageRecoveryTime: number;
  userSatisfaction: number;
  sc009Compliant: boolean;
}

export interface ActiveRecovery {
  errorId: string;
  startTime: Date;
  strategy: RecoveryStrategy;
  progress: number;
  estimatedCompletion: Date;
  automated: boolean;
  userEngaged: boolean;
}

export interface RealtimeSystemHealth {
  overallScore: number;
  errorRate: number;
  recoveryRate: number;
  userSatisfaction: number;
  systemLoad: number;
  responsiveness: number;
  sc009Compliance: boolean;
}

export interface ErrorRecoveryAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  errorType?: ErrorType;
  recoveryStrategy?: RecoveryStrategy;
  impact: AlertImpact;
  recommendedActions: string[];
  timestamp: Date;
  resolved: boolean;
  resolutionTime?: number;
}

export type AlertType = 'recovery_rate_drop' | 'high_abandonment' | 'slow_recovery' | 'guidance_ineffective' | 'system_overload';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AlertImpact {
  sc009Compliance: boolean;
  userExperience: 'low' | 'medium' | 'high';
  systemStability: 'low' | 'medium' | 'high';
}

export interface RealtimePerformanceMetrics {
  currentRecoveryRate: number;
  averageRecoveryTime: number;
  activeErrorCount: number;
  throughput: number;
  responseTime: number;
  successRate: number;
  userEngagement: number;
}

export interface RecoveryPrediction {
  errorType: ErrorType;
  predictedSuccessRate: number;
  recommendedStrategy: RecoveryStrategy;
  confidence: number;
  timeframe: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  factor: string;
  weight: number;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
}

// ============================================================================
// Report and Analysis Types
// ============================================================================

export interface ErrorRecoveryReport {
  id: string;
  generatedAt: Date;
  period: DateRange;
  summary: ReportSummary;
  sc009Compliance: SC009ComplianceReport;
  detailedMetrics: ErrorRecoveryMetrics;
  insights: ReportInsight[];
  recommendations: PrioritizedRecommendation[];
  actionItems: ActionItem[];
  appendices: ReportAppendices;
}

export interface ReportSummary {
  totalErrors: number;
  overallRecoveryRate: number;
  sc009Compliant: boolean;
  userSatisfaction: number;
  topErrorTypes: ErrorType[];
  mostEffectiveStrategies: RecoveryStrategy[];
  keyAchievements: string[];
  majorChallenges: string[];
  progressFromLastPeriod: ProgressComparison;
}

export interface SC009ComplianceReport {
  compliant: boolean;
  currentRecoveryRate: number;
  targetRecoveryRate: number;
  gap: number;
  onTrack: boolean;
  riskAssessment: ComplianceRiskAssessment;
  improvementPlan: ComplianceImprovementPlan;
  projectedAchievement: Date;
}

export interface ComplianceRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: ComplianceRiskFactor[];
  mitigationStrategies: string[];
  monitoringPlan: string[];
}

export interface ComplianceRiskFactor {
  factor: string;
  risk: 'low' | 'medium' | 'high';
  impact: number;
  probability: number;
  mitigation: string;
}

export interface ComplianceImprovementPlan {
  initiatives: ComplianceInitiative[];
  timeline: string;
  resources: string[];
  successMetrics: string[];
  milestones: ComplianceMilestone[];
}

export interface ComplianceInitiative {
  name: string;
  description: string;
  expectedImpact: number;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  owner: string;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface ComplianceMilestone {
  milestone: string;
  targetDate: Date;
  criteria: string[];
  status: 'upcoming' | 'achieved' | 'missed';
}

export interface ReportInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  evidence: InsightEvidence[];
  impact: InsightImpact;
  recommendations: string[];
  confidence: number;
  priority: 'low' | 'medium' | 'high';
}

export interface InsightEvidence {
  metric: string;
  value: number;
  change: number;
  significance: 'low' | 'medium' | 'high';
  source: string;
}

export interface InsightImpact {
  sc009Compliance: number;
  userExperience: number;
  systemPerformance: number;
  businessValue: number;
}

export interface PrioritizedRecommendation extends ErrorRecoveryRecommendation {
  businessImpact: number;
  technicalComplexity: number;
  implementationTimeline: string;
  successProbability: number;
  dependencies: string[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: ActionItemStatus;
  dueDate?: Date;
  estimatedEffort: string;
  relatedRecommendations: string[];
  progress: number;
  blockers?: string[];
  notes?: string;
}

export interface ReportAppendices {
  rawDataUrls: string[];
  methodology: string;
  glossary: GlossaryTerm[];
  technicalDetails: TechnicalDetails;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  context: string;
}

export interface TechnicalDetails {
  dataSources: string[];
  calculationMethods: CalculationMethod[];
  assumptions: Assumption[];
  limitations: string[];
}

export interface CalculationMethod {
  metric: string;
  formula: string;
  description: string;
  parameters: ParameterDefinition[];
}

export interface ParameterDefinition {
  name: string;
  type: string;
  description: string;
  source: string;
}

export interface Assumption {
  assumption: string;
  justification: string;
  impact: 'low' | 'medium' | 'high';
  uncertainty: number;
}

// ============================================================================
// Utility and Common Types
// ============================================================================

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile';

export type RecommendationCategory =
  | 'error_prevention'
  | 'recovery_optimization'
  | 'user_guidance'
  | 'system_improvement'
  | 'process_enhancement';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RecommendationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'deferred';

export type ActionItemStatus =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done'
  | 'blocked';

export type InsightType =
  | 'performance'
  | 'usability'
  | 'pattern'
  | 'opportunity'
  | 'risk'
  | 'trend';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ProgressComparison {
  recoveryRateChange: number;
  satisfactionChange: number;
  timeToRecoveryChange: number;
  newErrorTypes: ErrorType[];
  resolvedErrorTypes: ErrorType[];
  overallImprovement: boolean;
}

// ============================================================================
// Configuration and Setup Types
// ============================================================================

export interface ErrorRecoveryConfig {
  enabled: boolean;
  sc009: {
    targetRecoveryRate: number; // 98%
    monitoringEnabled: boolean;
    reportingEnabled: boolean;
    alertThresholds: SC009AlertThresholds;
  };
  tracking: {
    autoClassifyErrors: boolean;
    trackUserSatisfaction: boolean;
    recordRecoveryAttempts: boolean;
    anonymizeData: boolean;
    retentionPeriod: number; // days
  };
  guidance: {
    enableInteractiveGuidance: boolean;
    provideStepByStepInstructions: boolean;
    includeExamples: boolean;
    offerVideoTutorials: boolean;
    personalizationEnabled: boolean;
  };
  automation: {
    enableAutoRetry: boolean;
    enableAutoFix: boolean;
    enableFallbackProcessing: boolean;
    maxAutoAttempts: number;
    requireUserConfirmation: boolean;
  };
  monitoring: {
    realTimeAlerts: boolean;
    batchProcessing: boolean;
    generateReports: boolean;
    reportFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    enablePredictions: boolean;
  };
  integration: {
    analyticsProvider?: string;
    notificationChannels: NotificationChannel[];
    apiEndpoints: APIEndpoint[];
    externalTools: ExternalTool[];
  };
}

export interface SC009AlertThresholds {
  recoveryRateWarning: number; // e.g., 96%
  recoveryRateCritical: number; // e.g., 94%
  abandonmentRateWarning: number; // e.g., 5%
  abandonmentRateCritical: number; // e.g., 10%
  averageRecoveryTimeWarning: number; // e.g., 60 seconds
  averageRecoveryTimeCritical: number; // e.g., 120 seconds
}

export type NotificationChannel =
  | 'console'
  | 'browser_notification'
  | 'email'
  | 'slack'
  | 'teams'
  | 'webhook'
  | 'analytics';

export interface APIEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: AuthenticationConfig;
  rateLimit?: RateLimitConfig;
}

export interface AuthenticationConfig {
  type: 'none' | 'bearer' | 'basic' | 'api_key';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  retryAfter: number;
}

export interface ExternalTool {
  name: string;
  type: 'analytics' | 'monitoring' | 'alerting' | 'logging';
  config: Record<string, any>;
  enabled: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface ErrorRecoveryEvent {
  type: ErrorRecoveryEventType;
  timestamp: Date;
  sessionId: string;
  data: any;
}

export type ErrorRecoveryEventType =
  | 'error_occurred'
  | 'recovery_attempted'
  | 'recovery_succeeded'
  | 'recovery_failed'
  | 'guidance_viewed'
  | 'guidance_completed'
  | 'user_gave_feedback'
  | 'abandonment_detected'
  | 'strategy_changed'
  | 'escalation_triggered'
  | 'sc009_compliance_check'
  | 'alert_triggered'
  | 'report_generated';

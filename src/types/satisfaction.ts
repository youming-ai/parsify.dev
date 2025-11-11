// Satisfaction tracking types for SC-006 compliance

export type SatisfactionScore = 1 | 2 | 3 | 4 | 5;

export type SatisfactionCategory =
	| 'overall'
	| 'ease_of_use'
	| 'feature_completeness'
	| 'performance'
	| 'reliability'
	| 'design_ui'
	| 'documentation';

export type TaskComplexity = 'simple' | 'medium' | 'complex';

export type UserType = 'beginner' | 'intermediate' | 'expert';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export type FeedbackType = 'bug_report' | 'feature_request' | 'general_feedback' | 'complaint' | 'praise';

export interface SatisfactionSurvey {
	id: string;
	toolId: string;
	toolName: string;
	toolCategory: string;
	sessionId: string;
	userId?: string;
	timestamp: Date;
	taskId?: string;

	// Core satisfaction metrics
	responses: SatisfactionSurveyResponse;

	// Optional detailed feedback
	feedback?: DetailedFeedback;

	// Contextual information
	context: SatisfactionContext;

	// Survey metadata
	completedAt?: Date;
	timeToComplete: number;
	surveyVersion: string;
}

export interface SatisfactionSurveyResponse {
	overallSatisfaction: SatisfactionScore;
	easeOfUse: SatisfactionScore;
	featureCompleteness: SatisfactionScore;
	performance: SatisfactionScore;
	reliability: SatisfactionScore;
	achievedGoal: boolean;
	metExpectations: SatisfactionScore;
	wouldRecommend: SatisfactionScore;
	technicalIssues: boolean;
	featuresUsed: string[];
	difficultyRating: TaskComplexity;
}

export interface DetailedFeedback {
	whatWentWell?: string;
	whatCouldBeBetter?: string;
	suggestions?: string;
	technicalIssues?: string;
	bugs?: string[];
	featureRequests?: string[];
}

export interface SatisfactionContext {
	taskComplexity: TaskComplexity;
	deviceType: DeviceType;
	browserType: string;
	timeOfDay: string;
	sessionDuration: number;
	previousUsageCount: number;
	isFirstTimeUser: boolean;
	userType: UserType;
	toolVersion: string;
	interfaceLanguage: string;
}

export interface SatisfactionMetrics {
	overallSatisfactionScore: number;
	categoryScores: Record<SatisfactionCategory, number>;
	satisfactionTrend: 'improving' | 'stable' | 'declining';
	completionRate: number;
	responseRate: number;
	averageTimeToComplete: number;
	satisfactionDistribution: Record<SatisfactionScore, number>;
	netPromoterScore: number;
	customerSatisfactionScore: number;
	customerEffortScore: number;
}

export interface ToolSatisfactionData {
	toolId: string;
	toolName: string;
	toolCategory: string;
	totalSurveys: number;
	averageSatisfaction: number;
	satisfactionTrend: SatisfactionTrend;
	categoryBreakdown: Record<SatisfactionCategory, number>;
	issueBreakdown: SatisfactionIssueBreakdown;
	userSegments: UserSegmentAnalysis;
	timeAnalysis: TimeBasedAnalysis;
	lastUpdated: Date;
	sc006Compliant: boolean;
}

export interface SatisfactionTrend {
	current: number;
	previous: number;
	percentageChange: number;
	direction: 'up' | 'down' | 'stable';
	dataPoints: TrendDataPoint[];
}

export interface TrendDataPoint {
	date: Date;
	score: number;
	sampleSize: number;
}

export interface SatisfactionIssueBreakdown {
	commonIssues: SatisfactionIssue[];
	bugReports: number;
	featureRequests: number;
	usabilityIssues: number;
	performanceIssues: number;
	designIssues: number;
}

export interface SatisfactionIssue {
	type: string;
	description: string;
	frequency: number;
	severity: 'low' | 'medium' | 'high';
	affectedSatisfaction: number;
	resolutionStatus?: 'open' | 'in_progress' | 'resolved';
}

export interface UserSegmentAnalysis {
	beginnerUsers: SegmentData;
	intermediateUsers: SegmentData;
	expertUsers: SegmentData;
	newUsers: SegmentData;
	returningUsers: SegmentData;
}

export interface SegmentData {
	sampleSize: number;
	averageSatisfaction: number;
	completionRate: number;
	commonIssues: string[];
	satisfactionDistribution: Record<SatisfactionScore, number>;
}

export interface TimeBasedAnalysis {
	hourlyAverages: Record<string, number>;
	dailyAverages: Record<string, number>;
	weeklyAverages: Record<string, number>;
	seasonalTrends: SeasonalTrend[];
	peakSatisfactionHours: string[];
	peakSatisfactionDays: string[];
}

export interface SeasonalTrend {
	season: string;
	averageSatisfaction: number;
	sampleSize: number;
	trend: 'improving' | 'stable' | 'declining';
}

export interface SatisfactionGoal {
	id: string;
	toolId?: string; // undefined for global goal
	category?: SatisfactionCategory;
	targetScore: number;
	currentScore: number;
	deadline: Date;
	status: 'on_track' | 'at_risk' | 'missed' | 'achieved';
	progressPercentage: number;
	actionsTaken: SatisfactionAction[];
}

export interface SatisfactionAction {
	id: string;
	description: string;
	type: 'improvement' | 'bug_fix' | 'feature_addition' | 'documentation' | 'ui_enhancement';
	status: 'planned' | 'in_progress' | 'completed';
	impact: number;
	completedAt?: Date;
}

export interface SC006ComplianceReport {
	reportId: string;
	generatedAt: Date;
	reportingPeriod: {
		startDate: Date;
		endDate: Date;
	};

	// Overall compliance status
	compliant: boolean;
	complianceScore: number;
	targetScore: number;

	// Tool-specific compliance
	toolCompliance: ToolComplianceStatus[];

	// Category-specific compliance
	categoryCompliance: CategoryComplianceStatus[];

	// Satisfaction metrics
	overallMetrics: SatisfactionMetrics;

	// Issues and actions
	issues: SC006Issue[];
	actions: SC006Action[];

	// Trends and forecasts
	trends: SatisfactionTrend[];
	forecast: SatisfactionForecast;

	// Recommendations
	recommendations: SC006Recommendation[];
}

export interface ToolComplianceStatus {
	toolId: string;
	toolName: string;
	category: string;
	satisfactionScore: number;
	compliant: boolean;
	gapToTarget: number;
	sampleSize: number;
	lastUpdated: Date;
	issues: string[];
}

export interface CategoryComplianceStatus {
	category: string;
	averageSatisfaction: number;
	compliant: boolean;
	gapToTarget: number;
	toolCount: number;
	compliantToolCount: number;
	trendDirection: 'up' | 'down' | 'stable';
}

export interface SC006Issue {
	id: string;
	type: 'satisfaction_gap' | 'low_response_rate' | 'negative_trend' | 'sample_size_insufficient';
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	affectedTools?: string[];
	impact: number;
	resolution?: string;
	dueDate?: Date;
	status: 'open' | 'in_progress' | 'resolved' | 'ignored';
}

export interface SC006Action {
	id: string;
	title: string;
	description: string;
	type: 'immediate' | 'short_term' | 'long_term';
	priority: 'low' | 'medium' | 'high' | 'critical';
	assignedTo?: string;
	dueDate?: Date;
	status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
	expectedImpact: number;
	actualImpact?: number;
}

export interface SatisfactionForecast {
	period: string;
	predictedScore: number;
	confidence: number;
	factors: ForecastFactor[];
	scenarios: SatisfactionScenario[];
}

export interface ForecastFactor {
	factor: string;
	impact: number;
	weight: number;
	trend: 'positive' | 'negative' | 'neutral';
}

export interface SatisfactionScenario {
	name: string;
	description: string;
	predictedScore: number;
	probability: number;
	conditions: string[];
}

export interface SC006Recommendation {
	id: string;
	category: 'immediate' | 'short_term' | 'long_term';
	priority: 'low' | 'medium' | 'high' | 'critical';
	title: string;
	description: string;
	expectedImpact: number;
	effort: 'low' | 'medium' | 'high';
	targetTools?: string[];
	implementation: string[];
	successMetrics: string[];
}

export interface SatisfactionAlert {
	id: string;
	type: 'score_drop' | 'negative_trend' | 'low_response_rate' | 'compliance_breach';
	severity: 'info' | 'warning' | 'error' | 'critical';
	title: string;
	description: string;
	toolId?: string;
	category?: string;
	currentValue: number;
	thresholdValue: number;
	gap: number;
	timestamp: Date;
	resolved: boolean;
	actionRequired: boolean;
}

export interface SatisfactionFilter {
	toolIds?: string[];
	categories?: string[];
	dateRange?: {
		startDate: Date;
		endDate: Date;
	};
	userTypes?: UserType[];
	deviceTypes?: DeviceType[];
	satisfactionScores?: SatisfactionScore[];
	hasFeedback?: boolean;
	technicalIssues?: boolean;
}

export interface SatisfactionAnalytics {
	summary: SatisfactionMetrics;
	tools: ToolSatisfactionData[];
	categories: CategorySatisfactionData[];
	trends: SatisfactionTrend[];
	goals: SatisfactionGoal[];
	alerts: SatisfactionAlert[];
	compliance: SC006ComplianceReport;
}

export interface CategorySatisfactionData {
	category: string;
	totalSurveys: number;
	averageSatisfaction: number;
	trend: SatisfactionTrend;
	tools: ToolSatisfactionData[];
	compliance: {
		compliant: boolean;
		score: number;
		target: number;
		gap: number;
	};
}

// Utility types
export type SatisfactionUpdate = Partial<SatisfactionSurveyResponse> & {
	timestamp: Date;
	source: 'survey' | 'behavior' | 'implicit';
};

export type SatisfactionEvent =
	| { type: 'survey_started'; data: { surveyId: string; toolId: string } }
	| { type: 'survey_completed'; data: { surveyId: string; responses: SatisfactionSurveyResponse } }
	| { type: 'satisfaction_updated'; data: { toolId: string; update: SatisfactionUpdate } }
	| { type: 'goal_achieved'; data: { goalId: string; score: number } }
	| { type: 'compliance_breach'; data: { toolId: string; score: number; target: number } };

// Type guards
export function isValidSatisfactionScore(score: number): score is SatisfactionScore {
	return score >= 1 && score <= 5 && Number.isInteger(score);
}

export function isValidSatisfactionCategory(category: string): category is SatisfactionCategory {
	return [
		'overall',
		'ease_of_use',
		'feature_completeness',
		'performance',
		'reliability',
		'design_ui',
		'documentation'
	].includes(category);
}

export function isSC006Compliant(score: number): boolean {
	return score >= 4.5;
}

export function calculateNetPromoterScore(scores: SatisfactionScore[]): number {
	const promoters = scores.filter(s => s >= 4).length;
	const detractors = scores.filter(s <= 2).length;
	const total = scores.length;

	if (total === 0) return 0;

	return ((promoters - detractors) / total) * 100;
}

export function calculateCustomerSatisfactionScore(scores: SatisfactionScore[]): number {
	if (scores.length === 0) return 0;

	// CSAT = (Number of satisfied customers (4-5) / Total respondents) * 100
	const satisfied = scores.filter(s => s >= 4).length;
	return (satisfied / scores.length) * 100;
}

export function calculateCustomerEffortScore(effortScores: number[]): number {
	// CES calculation (lower scores indicate better experience)
	if (effortScores.length === 0) return 0;

	const averageEffort = effortScores.reduce((sum, score) => sum + score, 0) / effortScores.length;
	return Math.max(0, 100 - (averageEffort * 20)); // Convert 1-5 scale to 0-100 scale
}

/**
 * Security Validation and Testing Types - T168 Implementation
 * Comprehensive security validation system for Parsify.dev platform
 */

// Core security types
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SecurityCategory = 'vulnerability' | 'compliance' | 'privacy' | 'authentication' | 'authorization' | 'encryption';
export type SecurityStatus = 'pass' | 'fail' | 'warning' | 'pending' | 'skipped';

// Security test configurations
export interface SecurityTestConfig {
	enabled: boolean;
	frequency: 'continuous' | 'daily' | 'weekly' | 'on-demand';
	thresholds: SecurityThresholds;
	exclusions: string[];
	customRules: SecurityRule[];
}

export interface SecurityThresholds {
	maxVulnerabilities: {
		critical: number;
		high: number;
		medium: number;
		low: number;
	};
	maxComplianceViolations: number;
	maxPrivacyViolations: number;
	minSecurityScore: number;
}

// Security rules and policies
export interface SecurityRule {
	id: string;
	name: string;
	description: string;
	category: SecurityCategory;
	severity: SecuritySeverity;
	enabled: boolean;
	condition: string;
	remediation: string;
	custom: boolean;
}

export interface SecurityPolicy {
	id: string;
	name: string;
	version: string;
	description: string;
	rules: SecurityRule[];
	enforcement: 'strict' | 'advisory' | 'monitoring';
	lastUpdated: Date;
}

// Security vulnerability types
export interface SecurityVulnerability {
	id: string;
	title: string;
	description: string;
	category: SecurityCategory;
	severity: SecuritySeverity;
	cweId?: string;
	cveId?: string;
	affectedTools: string[];
	affectedFiles: string[];
	condition: string;
	impact: string;
	remediation: string;
	references: string[];
	firstDetected: Date;
	lastDetected: Date;
	status: SecurityStatus;
	falsePositive: boolean;
}

export interface SecurityScan {
	id: string;
	name: string;
	type: SecurityScanType;
	status: 'running' | 'completed' | 'failed' | 'cancelled';
	startedAt: Date;
	completedAt?: Date;
	duration?: number;
	vulnerabilities: SecurityVulnerability[];
	summary: SecurityScanSummary;
	tools: string[];
	scope: SecurityScanScope;
}

export type SecurityScanType = 'full' | 'incremental' | 'targeted' | 'compliance' | 'privacy';

export interface SecurityScanScope {
	tools: string[];
	files: string[];
	directories: string[];
	customPaths: string[];
	exclude: string[];
}

export interface SecurityScanSummary {
	totalVulnerabilities: number;
	criticalCount: number;
	highCount: number;
	mediumCount: number;
	lowCount: number;
	infoCount: number;
	securityScore: number;
	complianceScore: number;
	privacyScore: number;
	riskLevel: SecuritySeverity;
}

// Compliance and privacy validation
export interface ComplianceStandard {
	id: string;
	name: string;
	version: string;
	description: string;
	category: 'privacy' | 'security' | 'accessibility' | 'performance';
	requirements: ComplianceRequirement[];
}

export interface ComplianceRequirement {
	id: string;
	name: string;
	description: string;
	category: string;
	mandatory: boolean;
	testMethod: string;
	validation: ComplianceValidation;
}

export interface ComplianceValidation {
	status: SecurityStatus;
	score: number;
	evidence: string[];
	gaps: string[];
	remediation: string[];
	lastValidated: Date;
	nextReview: Date;
}

export interface PrivacyValidation {
	id: string;
	name: string;
	description: string;
	dataTypes: string[];
	riskLevel: SecuritySeverity;
	validation: PrivacyTestResult[];
	compliance: ComplianceValidation;
}

export interface PrivacyTestResult {
	testName: string;
	status: SecurityStatus;
	score: number;
	findings: PrivacyFinding[];
	recommendations: string[];
}

export interface PrivacyFinding {
	type: 'data-collection' | 'data-processing' | 'data-storage' | 'data-sharing' | 'consent';
	severity: SecuritySeverity;
	description: string;
	location: string;
	impact: string;
	remediation: string;
}

// Code security analysis
export interface CodeSecurityAnalysis {
	id: string;
	filePath: string;
	language: string;
	analysisType: 'static' | 'dynamic' | 'dependency' | 'runtime';
	status: SecurityStatus;
	vulnerabilities: CodeVulnerability[];
	metrics: CodeSecurityMetrics;
	summary: SecurityScanSummary;
	lastAnalyzed: Date;
}

export interface CodeVulnerability extends SecurityVulnerability {
	filePath: string;
	lineNumber?: number;
	columnNumber?: number;
	codeSnippet?: string;
	confidence: 'high' | 'medium' | 'low';
}

export interface CodeSecurityMetrics {
	linesOfCode: number;
	cyclomaticComplexity: number;
	securityDensity: number;
	maintainabilityIndex: number;
	technicalDebt: number;
	securityDebt: number;
}

// User data protection
export interface DataProtectionValidation {
	id: string;
	dataType: string;
	category: 'personal' | 'sensitive' | 'financial' | 'health' | 'general';
	location: string;
	encryption: EncryptionStatus;
	access: AccessControl;
	retention: RetentionPolicy;
	compliance: DataProtectionCompliance;
}

export interface EncryptionStatus {
	inTransit: boolean;
	atRest: boolean;
	algorithm: string;
	keyRotation: boolean;
	status: SecurityStatus;
}

export interface AccessControl {
	authentication: boolean;
	authorization: boolean;
	auditLogging: boolean;
	principleOfLeastPrivilege: boolean;
	status: SecurityStatus;
}

export interface RetentionPolicy {
	duration: string;
	autoDeletion: boolean;
	userConsent: boolean;
	compliance: boolean;
	status: SecurityStatus;
}

export interface DataProtectionCompliance {
	gdpr: ComplianceValidation;
	ccpa: ComplianceValidation;
	pci: ComplianceValidation;
	hipaa: ComplianceValidation;
	overall: SecurityStatus;
}

// Security testing automation
export interface SecurityTestSuite {
	id: string;
	name: string;
	description: string;
	tests: SecurityTestCase[];
	schedule: TestSchedule;
	environment: TestEnvironment;
	notifications: NotificationConfig;
}

export interface SecurityTestCase {
	id: string;
	name: string;
	type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
	description: string;
	tools: string[];
	steps: TestStep[];
	expectedResults: ExpectedResult[];
	dependencies: string[];
	timeout: number;
}

export interface TestStep {
	id: string;
	name: string;
	action: string;
	expected: string;
	timeout: number;
	retryCount: number;
}

export interface ExpectedResult {
	type: 'security' | 'performance' | 'functionality' | 'compliance';
	criteria: string;
	threshold: number;
	passCondition: string;
}

export interface TestSchedule {
	frequency: string;
	timezone: string;
	nextRun: Date;
	lastRun: Date;
	enabled: boolean;
}

export interface TestEnvironment {
	name: string;
	url: string;
	credentials?: TestCredentials;
	configuration: Record<string, any>;
	isolated: boolean;
}

export interface TestCredentials {
	username: string;
	password: string;
	token?: string;
	permissions: string[];
}

// Security reporting and compliance tracking
export interface SecurityReport {
	id: string;
	title: string;
	type: 'vulnerability' | 'compliance' | 'privacy' | 'comprehensive';
	generatedAt: Date;
	period: ReportPeriod;
	summary: SecurityReportSummary;
	vulnerabilities: SecurityVulnerability[];
	compliance: ComplianceReportSection[];
	privacy: PrivacyReportSection[];
	recommendations: SecurityRecommendation[];
	trends: SecurityTrend[];
}

export interface ReportPeriod {
	startDate: Date;
	endDate: Date;
	type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface SecurityReportSummary {
	overallScore: number;
	riskLevel: SecuritySeverity;
	criticalIssues: number;
	highIssues: number;
	mediumIssues: number;
	lowIssues: number;
	complianceRate: number;
	privacyScore: number;
	trendDirection: 'improving' | 'stable' | 'degrading';
}

export interface ComplianceReportSection {
	standard: string;
	score: number;
	status: SecurityStatus;
	requirements: ComplianceRequirement[];
	violations: ComplianceViolation[];
	evidence: string[];
}

export interface ComplianceViolation {
	requirement: string;
	description: string;
	severity: SecuritySeverity;
	remediation: string;
	dueDate: Date;
	status: SecurityStatus;
}

export interface PrivacyReportSection {
	dataTypes: string[];
	riskAssessment: PrivacyRiskAssessment;
	findings: PrivacyFinding[];
	gaps: PrivacyGap[];
}

export interface PrivacyRiskAssessment {
	overallRisk: SecuritySeverity;
	dataCollectionRisk: SecuritySeverity;
	dataProcessingRisk: SecuritySeverity;
	dataStorageRisk: SecuritySeverity;
	dataSharingRisk: SecuritySeverity;
}

export interface PrivacyGap {
	area: string;
	description: string;
	impact: string;
	remediation: string;
	priority: 'high' | 'medium' | 'low';
}

export interface SecurityRecommendation {
	id: string;
	title: string;
	description: string;
	priority: SecuritySeverity;
	category: SecurityCategory;
	effort: 'low' | 'medium' | 'high';
	impact: 'low' | 'medium' | 'high';
	dependencies: string[];
	dueDate?: Date;
	status: 'pending' | 'in-progress' | 'completed' | 'deferred';
}

export interface SecurityTrend {
	metric: string;
	period: string;
	data: TrendDataPoint[];
	direction: 'up' | 'down' | 'stable';
	percentage: number;
}

export interface TrendDataPoint {
	date: Date;
	value: number;
	threshold?: number;
}

// Integration with monitoring systems
export interface SecurityMonitoringIntegration {
	system: 'analytics-hub' | 'realtime-bundle-monitor' | 'error-handling' | 'performance-monitoring';
	enabled: boolean;
	configuration: MonitoringIntegrationConfig;
	mappings: SecurityMonitoringMapping[];
}

export interface MonitoringIntegrationConfig {
	endpoint: string;
	authentication: MonitoringAuth;
	frequency: number;
	batchSize: number;
	retryPolicy: RetryPolicy;
}

export interface MonitoringAuth {
	type: 'token' | 'key' | 'certificate';
	value: string;
	expires?: Date;
}

export interface RetryPolicy {
	maxAttempts: number;
	backoffMs: number;
	maxBackoffMs: number;
	jitter: boolean;
}

export interface SecurityMonitoringMapping {
	securityEvent: string;
	monitoringMetric: string;
	transformation?: string;
	aggregation?: string;
}

// Security best practices enforcement
export interface SecurityBestPractice {
	id: string;
	name: string;
	description: string;
	category: SecurityCategory;
	rule: SecurityRule;
	validation: PracticeValidation;
	enforcement: EnforcementPolicy;
}

export interface PracticeValidation {
	method: 'automated' | 'manual' | 'hybrid';
	frequency: string;
	criteria: string[];
	scoring: ScoringCriteria;
}

export interface ScoringCriteria {
	weight: number;
	passScore: number;
	failScore: number;
	partialScoreConditions: PartialScoreCondition[];
}

export interface PartialScoreCondition {
	condition: string;
	score: number;
	description: string;
}

export interface EnforcementPolicy {
	level: 'advisory' | 'warning' | 'blocking' | 'critical';
	actions: EnforcementAction[];
	exemptions: string[];
}

export interface EnforcementAction {
	type: 'warning' | 'block' | 'report' | 'notify';
	condition: string;
	message: string;
	resolution: string;
}

// Security configuration and settings
export interface SecurityConfig {
	scanning: SecurityScanConfig;
	compliance: ComplianceConfig;
	privacy: PrivacyConfig;
	testing: SecurityTestConfig;
	monitoring: SecurityMonitoringConfig;
	enforcement: SecurityEnforcementConfig;
	reporting: SecurityReportingConfig;
}

export interface SecurityScanConfig {
	enabled: boolean;
	frequency: string;
	tools: string[];
	depth: 'shallow' | 'standard' | 'deep';
	exclusions: string[];
	notifications: boolean;
}

export interface ComplianceConfig {
	standards: string[];
	autoRemediation: boolean;
	evidenceCollection: boolean;
	scheduleValidation: boolean;
	notifications: boolean;
}

export interface PrivacyConfig {
	dataMapping: boolean;
	consentManagement: boolean;
	dataRetention: boolean;
	privacyByDesign: boolean;
	notifications: boolean;
}

export interface SecurityMonitoringConfig {
	realtimeScanning: boolean;
	alertThresholds: AlertThresholds;
	integrations: SecurityMonitoringIntegration[];
	dashboard: boolean;
	notifications: boolean;
}

export interface SecurityEnforcementConfig {
	preCommitChecks: boolean;
	ciGate: boolean;
	deploymentGate: boolean;
	runtimeChecks: boolean;
	userNotifications: boolean;
}

export interface SecurityReportingConfig {
	automated: boolean;
	frequency: string;
	recipients: string[];
	formats: string[];
	dashboard: boolean;
	archival: boolean;
}

export interface AlertThresholds {
	vulnerabilityCount: number;
	severityLevel: SecuritySeverity;
	complianceScore: number;
	privacyScore: number;
	securityScore: number;
}

// Security events and incidents
export interface SecurityEvent {
	id: string;
	type: 'vulnerability' | 'compliance' | 'privacy' | 'incident';
	severity: SecuritySeverity;
	title: string;
	description: string;
	source: string;
	timestamp: Date;
	status: 'open' | 'investigating' | 'resolved' | 'false-positive';
	assignedTo?: string;
	relatedTools: string[];
	relatedVulnerabilities: string[];
	metadata: Record<string, any>;
}

export interface SecurityIncident extends SecurityEvent {
	impact: IncidentImpact;
	response: IncidentResponse;
	communication: IncidentCommunication;
	resolution: IncidentResolution;
	lessons: IncidentLessons;
}

export interface IncidentImpact {
	affectedUsers: number;
	affectedTools: string[];
	dataExposure: boolean;
	serviceDisruption: boolean;
	financialImpact: 'none' | 'low' | 'medium' | 'high';
	reputationalImpact: 'none' | 'low' | 'medium' | 'high';
}

export interface IncidentResponse {
	detectedAt: Date;
	acknowledgedAt: Date;
	containedAt?: Date;
	resolvedAt?: Date;
	responseTime: number;
	containmentTime?: number;
	resolutionTime?: number;
	team: string[];
	actions: IncidentAction[];
}

export interface IncidentAction {
	id: string;
	description: string;
	timestamp: Date;
	performedBy: string;
	duration: number;
	result: 'success' | 'failed' | 'partial';
}

export interface IncidentCommunication {
	internalNotifications: string[];
	externalNotifications: string[];
	stakeholders: string[];
	communicationPlan: string[];
	timeline: CommunicationEvent[];
}

export interface CommunicationEvent {
	timestamp: Date;
	audience: string;
	message: string;
	channel: string;
}

export interface IncidentResolution {
	rootCause: string;
	immediateActions: string[];
	longTermActions: string[];
	verificationSteps: string[];
	preventionMeasures: string[];
}

export interface IncidentLessons {
	learnings: string[];
	improvements: string[];
	prevention: string[];
	training: string[];
	documentation: string[];
}

// Security dashboard and visualization
export interface SecurityDashboard {
	id: string;
	name: string;
	layout: DashboardLayout;
	widgets: DashboardWidget[];
	filters: DashboardFilter[];
	refreshInterval: number;
	lastUpdated: Date;
}

export interface DashboardLayout {
	type: 'grid' | 'flexible';
	columns: number;
	rows: number;
	gap: number;
	responsive: boolean;
}

export interface DashboardWidget {
	id: string;
	type: 'metric' | 'chart' | 'table' | 'alert' | 'status';
	title: string;
	position: WidgetPosition;
	config: WidgetConfig;
	data: WidgetData;
}

export interface WidgetPosition {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface WidgetConfig {
	chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
	timeRange?: string;
	refreshInterval?: number;
	thresholds?: number[];
	legend?: boolean;
	annotations?: string[];
}

export interface WidgetData {
	source: string;
	metrics: string[];
	filters: Record<string, any>;
	aggregation?: string[];
	transformations?: string[];
}

export interface DashboardFilter {
	field: string;
	type: 'select' | 'range' | 'date' | 'search';
	options: string[];
	defaultValue: any;
	multiSelect: boolean;
}

/**
 * Monitoring System Index - T158 Implementation with T159 Resource Usage Monitoring
 * Main export point for comprehensive monitoring and resource optimization features
 */

// Export main concurrent usage support system
export { ConcurrentUsageSupport, concurrentUsageSupport } from './concurrent-usage-main';

// Export T159 - Resource Usage Monitoring and Optimization (NEW)
export { advancedMemoryLeakDetector } from './memory-leak-detection-system';
export { advancedCPUMonitor } from './cpu-usage-monitoring-system';
export { advancedNetworkMonitor } from './network-usage-monitoring-system';
export { resourceEfficiencyScoringSystem } from './resource-efficiency-scoring-system';
export { realtimeMonitoringDashboard } from './realtime-monitoring-dashboard';
export { resourceMonitoringIntegrationSystem } from './resource-monitoring-integration';

// Export individual monitoring systems
export { concurrentUsageMonitor } from './concurrent-usage-monitor';
export { resourceUsageOptimizer } from './resource-usage-optimizer';
export { sessionManagementSystem } from './session-management-system';
export { performanceScalingTools } from './performance-scaling-tools';
export { loadTestingValidation } from './load-testing-validation';
export { concurrentUsageIntegrationSystem } from './concurrent-usage-integration';
export { performanceOptimizationEngine } from './performance-optimization-engine';

// Export existing monitoring systems
export { analyticsHub } from './analytics-hub';
export { realtimeBundleMonitor } from './realtime-bundle-monitor';
export { realtimeInteractionTracker } from './realtime-interaction-tracker';

// Export T166 - Accessibility Compliance Validation (NEW)
export { accessibilityComplianceEngine, AccessibilityComplianceMain } from './accessibility-compliance-main';
export { wcagAAAutomatedTestingEngine, WCAgAAAutomatedTestingEngine } from './wcag-aa-automated-testing';
export { screenReaderTestingEngine, ScreenReaderTestingEngine } from './screen-reader-testing';
export { keyboardNavigationTestingEngine, KeyboardNavigationTestingEngine } from './keyboard-navigation-testing';
export { visualAccessibilityTestingEngine, VisualAccessibilityTestingEngine } from './visual-accessibility-testing';
export { accessibilityReportingSystem, AccessibilityReportingSystem } from './accessibility-reporting-system';

// Export T168 - Security Validation and Testing (NEW)
export {
	SecurityValidationEngine,
	securityValidationEngine,
	CodeSecurityAnalyzer,
	codeSecurityAnalyzer,
	UserDataProtectionValidator,
	userDataProtectionValidator,
	SecurityTestingAutomationEngine,
	securityTestingAutomationEngine,
	SecurityReportingEngine,
	securityReportingEngine,
	SecurityIntegrationEngine,
	securityIntegrationEngine,
	SecurityBestPracticesEngine,
	securityBestPracticesEngine,
	SecurityValidationSystem,
	securityValidationSystem
} from './security-validation-main';

// Export types for TypeScript users
export type {
	// Core metrics and monitoring types
	ConcurrentUserMetrics,
	ActiveSession,
	ResourceMetrics,
	SessionData,
	LoadTestScenario,
	LoadTestResults,
	ValidationSuite,
	ValidationReport,
	IntegratedAnalyticsReport,
	OptimizationReport,
	SessionCleanupReport,
	AdaptiveOptimizationReport,
} from './concurrent-usage-main';

// T159 - Resource Usage Monitoring Types (NEW)
export type {
	// Memory monitoring types
	MemorySnapshot,
	MemoryLeakPattern,
	MemoryAnalysisReport,
	MemoryRecommendation,
	CleanupReport,
	MemoryLeakDetectionConfig,
} from './memory-leak-detection-system';

export type {
	// CPU monitoring types
	CPUMetrics,
	LongTask,
	CPUBottleneck,
	PerformanceProfile,
	CPUAnalysisReport,
	CPURecommendation,
	CPUMonitoringConfig,
} from './cpu-usage-monitoring-system';

export type {
	// Network monitoring types
	NetworkMetrics,
	NetworkRequest,
	NetworkAnalysisReport,
	NetworkRecommendation,
	NetworkOptimizationReport,
	NetworkMonitoringConfig,
} from './network-usage-monitoring-system';

export type {
	// Resource efficiency scoring types
	ResourceEfficiencyScore,
	MemoryScore,
	CPUScore,
	NetworkScore,
	StorageScore,
	EfficiencyTrends,
	ResourceEfficiencyReport,
	ResourceEfficiencyScoringConfig,
} from './resource-efficiency-scoring-system';

export type {
	// Real-time dashboard types
	RealtimeDashboard,
	RealtimeAlert,
	DashboardState,
	RealtimeDashboardConfig,
	DashboardSubscriber,
} from './realtime-monitoring-dashboard';

export type {
	// Integration types
	ResourceMonitoringIntegration,
	IntegratedMonitoringReport,
	IntegratedResourceMetrics,
	CorrelationAnalysis,
	PerformanceAnalysis,
	IntegrationConfig,
	SystemHealth,
} from './resource-monitoring-integration';

// T166 - Accessibility Compliance Types (NEW)
export type {
	// Core accessibility types
	AccessibilityViolation,
	ToolAccessibilityResult,
	ScreenReaderTestResult,
	KeyboardNavigationTestResult,
	ColorContrastTestResult,
	AccessibilityReport,

	// Enums
	WCAGCategory,
	ComplianceLevel,
	AccessibilityTestType,
	AccessibilitySeverity,

	// Configuration types
	AccessibilityTestingConfig,
	AccessibilityComplianceEngine,

	// Additional types from accessibility systems
	RemediationTask,
	ComplianceTrend,
	AccessibilityMetrics,
} from './accessibility-compliance-types';

// T168 - Security Validation Types (NEW)
export type {
	// Core security types
	SecurityVulnerability,
	SecurityScan,
	SecurityScanSummary,
	SecurityRule,
	SecurityConfig,
	SecuritySeverity,
	SecurityStatus,
	SecurityScanType,
	SecurityScanScope,

	// Code security analysis types
	CodeSecurityAnalysis,
	CodeVulnerability,
	CodeSecurityMetrics,

	// Compliance and privacy validation types
	ComplianceValidation,
	PrivacyValidation,
	DataProtectionValidation,
	EncryptionStatus,
	AccessControl,
	RetentionPolicy,
	DataProtectionCompliance,

	// Security testing automation types
	SecurityTestSuite,
	SecurityTestCase,
	TestSchedule,
	TestEnvironment,
	NotificationConfig,

	// Security reporting types
	SecurityReport,
	ReportPeriod,
	SecurityReportSummary,
	ComplianceReportSection,
	PrivacyReportSection,
	SecurityRecommendation,
	SecurityTrend,

	// Integration types
	SecurityMonitoringIntegration,
	MonitoringIntegrationConfig,
	SecurityMonitoringMapping,
	SecurityEvent,

	// Best practices enforcement types
	SecurityBestPractice,
	PracticeValidation,
	EnforcementPolicy,
	EnforcementAction,
	EnforcementContext,
	EnforcementResult
} from '@/types/security';

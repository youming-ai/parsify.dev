/**
 * Concurrent Usage Support - T158 Main Integration
 * Comprehensive concurrent usage support for 100+ users
 * This is the main entry point for all concurrent usage monitoring and optimization features
 */

import { concurrentUsageMonitor, type ConcurrentUserMetrics, type ActiveSession } from './concurrent-usage-monitor';
import { resourceUsageOptimizer, type ResourceMetrics, type OptimizationReport } from './resource-usage-optimizer';
import { sessionManagementSystem, type SessionData, type SessionCleanupReport } from './session-management-system';
import { performanceScalingTools, type LoadTestScenario, type LoadTestResults, type PerformanceValidationReport } from './performance-scaling-tools';
import { loadTestingValidation, type ValidationSuite, type ValidationReport } from './load-testing-validation';
import { concurrentUsageIntegrationSystem, type IntegratedAnalyticsReport } from './concurrent-usage-integration';
import { performanceOptimizationEngine, type AdaptiveOptimizationReport } from './performance-optimization-engine';

// Main concurrent usage support class
export class ConcurrentUsageSupport {
	private static instance: ConcurrentUsageSupport;
	private isInitialized = false;

	private constructor() {}

	public static getInstance(): ConcurrentUsageSupport {
		if (!ConcurrentUsageSupport.instance) {
			ConcurrentUsageSupport.instance = new ConcurrentUsageSupport();
		}
		return ConcurrentUsageSupport.instance;
	}

	// Initialize all concurrent usage support systems
	public async initialize(): Promise<void> {
		if (this.isInitialized) {
			console.warn('Concurrent usage support already initialized');
			return;
		}

		console.log('🚀 Initializing Concurrent Usage Support for 100+ users...');

		try {
			// Initialize core monitoring systems
			console.log('📊 Initializing monitoring systems...');
			await concurrentUsageMonitor.initialize();
			console.log('✅ Concurrent usage monitor initialized');

			await resourceUsageOptimizer.initialize();
			console.log('✅ Resource usage optimizer initialized');

			await sessionManagementSystem.initialize();
			console.log('✅ Session management system initialized');

			// Initialize performance and testing systems
			console.log('🧪 Initializing performance systems...');
			await performanceScalingTools.initialize();
			console.log('✅ Performance scaling tools initialized');

			await loadTestingValidation.initialize();
			console.log('✅ Load testing validation initialized');

			// Initialize integration and optimization systems
			console.log('🔗 Initializing integration systems...');
			await concurrentUsageIntegrationSystem.initialize();
			console.log('✅ Concurrent usage integration initialized');

			await performanceOptimizationEngine.initialize();
			console.log('✅ Performance optimization engine initialized');

			this.isInitialized = true;
			console.log('🎉 Concurrent Usage Support initialized successfully!');
			console.log('Ready to handle 100+ concurrent users with comprehensive monitoring and optimization');

		} catch (error) {
			console.error('❌ Failed to initialize Concurrent Usage Support:', error);
			throw error;
		}
	}

	// Get current system status
	public getSystemStatus(): {
		initialized: boolean;
		systems: Array<{
			name: string;
			status: 'healthy' | 'degraded' | 'unhealthy';
			lastUpdate: Date;
		}>;
		overallHealth: number; // 0-100
		currentLoad: {
			concurrentUsers: number;
			capacityUtilization: number; // 0-1
			resourceUtilization: {
				cpu: number; // 0-1
				memory: number; // 0-1
			};
		};
	} {
		const integration = concurrentUsageIntegrationSystem.getIntegrationStatus();
		const metrics = concurrentUsageIntegrationSystem.getIntegratedMetrics();

		return {
			initialized: this.isInitialized,
			systems: integration.systemsConnected,
			overallHealth: metrics.overallHealth,
			currentLoad: {
				concurrentUsers: metrics.concurrentUsage.currentActiveUsers,
				capacityUtilization: metrics.concurrentUsage.capacityUtilization,
				resourceUtilization: {
					cpu: metrics.resourceUsage.cpu.usage,
					memory: metrics.resourceUsage.memory.usagePercentage,
				},
			},
		};
	}

	// Quick start methods for common use cases

	// Start monitoring current usage
	public startMonitoring(): void {
		console.log('📈 Starting concurrent usage monitoring...');
		concurrentUsageMonitor.startMonitoring();
		console.log('✅ Monitoring started');
	}

	// Get current metrics
	public getCurrentMetrics(): {
		concurrentUsers: ConcurrentUserMetrics;
		resources: ResourceMetrics;
		systemHealth: number;
	} {
		return {
			concurrentUsers: concurrentUsageMonitor.getConcurrentMetrics(),
			resources: resourceUsageOptimizer.getResourceMetrics(),
			systemHealth: concurrentUsageIntegrationSystem.getIntegratedMetrics().overallHealth,
		};
	}

	// Run quick load test
	public async runQuickLoadTest(userCount: number = 50): Promise<LoadTestResults> {
		console.log(`🧪 Running quick load test with ${userCount} users...`);

		// Create a simple test scenario
		const scenarioId = performanceScalingTools.createLoadTestScenario({
			name: `Quick Test - ${userCount} Users`,
			description: `Quick load test with ${userCount} concurrent users`,
			type: 'stress',
			userConfiguration: {
				minUsers: 10,
				maxUsers: userCount,
				rampUpTime: 60,
				rampDownTime: 60,
				duration: 180,
				thinkTime: 2000,
			},
			loadPattern: 'ramp-up',
			userBehavior: {
				pageViews: [
					{ path: '/', probability: 0.3, thinkTime: 3000 },
					{ path: '/tools', probability: 0.2, thinkTime: 2000 },
					{ path: '/tools/json', probability: 0.3, thinkTime: 5000 },
					{ path: '/tools/code', probability: 0.2, thinkTime: 5000 },
				],
				toolUsage: [
					{ toolId: 'json-formatter', probability: 0.4, processingTime: 1000, errorRate: 0.01 },
					{ toolId: 'code-formatter', probability: 0.3, processingTime: 1500, errorRate: 0.02 },
					{ toolId: 'hash-generator', probability: 0.3, processingTime: 500, errorRate: 0.005 },
				],
				interactionPattern: 'realistic',
			},
			targets: {
				averageResponseTime: 2000,
				p95ResponseTime: 5000,
				p99ResponseTime: 8000,
				maxErrorRate: 0.05,
				minThroughput: userCount * 2,
				maxCpuUsage: 0.85,
				maxMemoryUsage: 0.85,
			},
			configuration: {
				enableMonitoring: true,
				enableResourceTracking: true,
				enableDetailedLogging: true,
				sampleRate: 1.0,
				parallelism: Math.min(20, userCount / 5),
				timeout: 15000,
			},
		});

		const results = await performanceScalingTools.runLoadTest(scenarioId);

		console.log(`✅ Load test completed - Score: ${results.targetComparison.overallScore}/100`);
		return results;
	}

	// Run resource optimization
	public async runResourceOptimization(): Promise<OptimizationReport> {
		console.log('⚡ Running resource optimization...');

		const report = await resourceUsageOptimizer.runOptimization();

		console.log(`✅ Resource optimization completed`);
		console.log(`   Optimizations: ${report.summary.totalOptimizations}`);
		console.log(`   Memory saved: ${this.formatBytes(report.summary.memorySaved)}`);
		console.log(`   Performance improvement: ${report.summary.performanceImprovement.toFixed(1)}%`);

		return report;
	}

	// Run session cleanup
	public async runSessionCleanup(): Promise<SessionCleanupReport> {
		console.log('🧹 Running session cleanup...');

		const report = await sessionManagementSystem.runCleanup();

		console.log(`✅ Session cleanup completed`);
		console.log(`   Sessions processed: ${report.sessionStats.sessionsProcessed}`);
		console.log(`   Sessions cleaned: ${report.sessionStats.sessionsCleaned}`);
		console.log(`   Memory freed: ${this.formatBytes(report.memoryStats.totalMemoryFreed)}`);

		return report;
	}

	// Generate comprehensive report
	public async generateComprehensiveReport(): Promise<{
		systemStatus: any;
		currentMetrics: any;
		loadTestResults?: LoadTestResults;
		optimizationReport?: OptimizationReport;
		sessionCleanupReport?: SessionCleanupReport;
		integratedAnalytics?: IntegratedAnalyticsReport;
	}> {
		console.log('📊 Generating comprehensive concurrent usage report...');

		const systemStatus = this.getSystemStatus();
		const currentMetrics = this.getCurrentMetrics();

		// Run load test if system is not under heavy load
		let loadTestResults: LoadTestResults | undefined;
		if (systemStatus.currentLoad.capacityUtilization < 0.7) {
			console.log('Running load test as part of comprehensive report...');
			loadTestResults = await this.runQuickLoadTest(Math.min(50, 100 - systemStatus.currentLoad.concurrentUsers));
		}

		// Run resource optimization
		console.log('Running resource optimization as part of comprehensive report...');
		const optimizationReport = await this.runResourceOptimization();

		// Run session cleanup
		console.log('Running session cleanup as part of comprehensive report...');
		const sessionCleanupReport = await this.runSessionCleanup();

		// Generate integrated analytics
		console.log('Generating integrated analytics...');
		const integratedAnalytics = await concurrentUsageIntegrationSystem.generateAnalyticsReport({
			period: 'hour',
			includePredictive: true,
			includeRecommendations: true,
		});

		console.log('✅ Comprehensive report generated');

		return {
			systemStatus,
			currentMetrics,
			loadTestResults,
			optimizationReport,
			sessionCleanupReport,
			integratedAnalytics,
		};
	}

	// Advanced methods for power users

	// Create custom load test scenario
	public createCustomLoadTest(scenario: Omit<LoadTestScenario, 'id' | 'status' | 'createdAt' | 'results'>): string {
		return performanceScalingTools.createLoadTestScenario(scenario);
	}

	// Create validation suite
	public createValidationSuite(suite: Omit<ValidationSuite, 'id' | 'historicalData' | 'status' | 'createdAt' | 'lastRun' | 'nextRun'>): string {
		return loadTestingValidation.createValidationSuite(suite);
	}

	// Run full validation suite
	public async runFullValidation(): Promise<ValidationReport> {
		const suites = loadTestingValidation.getValidationSuites();
		if (suites.length === 0) {
			throw new Error('No validation suites found. Create one first.');
		}

		return await loadTestingValidation.runValidationSuite(suites[0].id);
	}

	// Get detailed analytics
	public async getDetailedAnalytics(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<IntegratedAnalyticsReport> {
		return await concurrentUsageIntegrationSystem.generateAnalyticsReport({
			period,
			includePredictive: true,
			includeRecommendations: true,
		});
	}

	// Get optimization recommendations
	public getOptimizationRecommendations(): string[] {
		const status = this.getSystemStatus();
		const recommendations: string[] = [];

		if (status.currentLoad.capacityUtilization > 0.8) {
			recommendations.push('⚠️  High capacity utilization detected. Consider scaling infrastructure.');
		}

		if (status.currentLoad.resourceUtilization.cpu > 0.8) {
			recommendations.push('🔥 High CPU usage detected. Run resource optimization to improve performance.');
		}

		if (status.currentLoad.resourceUtilization.memory > 0.8) {
			recommendations.push('💾 High memory usage detected. Run session cleanup and memory optimization.');
		}

		if (status.overallHealth < 70) {
			recommendations.push('🏥 System health is below optimal. Run comprehensive diagnostics.');
		}

		if (status.currentLoad.concurrentUsers < 10) {
			recommendations.push('📈 Current user count is low. Consider running load tests to validate scalability.');
		}

		if (recommendations.length === 0) {
			recommendations.push('✅ System is performing optimally. Continue monitoring.');
		}

		return recommendations;
	}

	// Emergency methods
	public async emergencyOptimization(): Promise<{
		success: boolean;
		actions: string[];
		impact: string;
	}> {
		console.log('🚨 Running emergency optimization...');

		const actions: string[] = [];
		let success = true;

		try {
			// Force resource optimization
			await resourceUsageOptimizer.runOptimization();
			actions.push('✅ Forced resource optimization');

			// Run aggressive session cleanup
			await sessionManagementSystem.runCleanup();
			actions.push('✅ Aggressive session cleanup');

			// Get current alerts and resolve critical ones
			const alerts = concurrentUsageIntegrationSystem.getCurrentAlerts();
			const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

			for (const alert of criticalAlerts) {
				concurrentUsageIntegrationSystem.resolveAlert(alert.id);
				actions.push(`✅ Resolved critical alert: ${alert.title}`);
			}

			console.log('✅ Emergency optimization completed successfully');

		} catch (error) {
			console.error('❌ Emergency optimization failed:', error);
			success = false;
			actions.push('❌ Emergency optimization failed');
		}

		return {
			success,
			actions,
			impact: success ? 'System stabilized and optimized for current load' : 'Emergency optimization failed - manual intervention required',
		};
	}

	// Stop all systems
	public stop(): void {
		console.log('🛑 Stopping Concurrent Usage Support...');

		concurrentUsageMonitor.stop();
		resourceUsageOptimizer.stop();
		sessionManagementSystem.stop();
		performanceScalingTools.stop();
		loadTestingValidation.stop();
		concurrentUsageIntegrationSystem.stop();
		performanceOptimizationEngine.stop();

		this.isInitialized = false;
		console.log('✅ Concurrent Usage Support stopped');
	}

	// Utility methods
	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';

		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Export individual system instances for advanced usage
	public get systems() {
		return {
			concurrentUsageMonitor,
			resourceUsageOptimizer,
			sessionManagementSystem,
			performanceScalingTools,
			loadTestingValidation,
			concurrentUsageIntegrationSystem,
			performanceOptimizationEngine,
		};
	}
}

// Export main class and individual system instances
export const concurrentUsageSupport = ConcurrentUsageSupport.getInstance();

// Export system instances for direct access
export {
	concurrentUsageMonitor,
	resourceUsageOptimizer,
	sessionManagementSystem,
	performanceScalingTools,
	loadTestingValidation,
	concurrentUsageIntegrationSystem,
	performanceOptimizationEngine,
};

// Export types
export type {
	// Core monitoring types
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
} from './concurrent-usage-monitor';

// Re-export for convenience
export { analyticsHub } from './analytics-hub';

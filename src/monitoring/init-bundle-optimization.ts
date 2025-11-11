/**
 * Bundle Optimization System Initialization
 * Sets up and initializes the comprehensive bundle optimization system for SC-14 compliance
 * Run this script to start monitoring and optimization
 */

import { bundleOptimizationSystem } from './bundle-optimization-system';
import { realtimeBundleMonitor } from './realtime-bundle-monitor';
import { sizeBudgetManager } from './size-budget-manager';
import { bundleAnalyzer } from '@/analytics/bundle-analyzer';
import { performanceObserver } from '../performance-observer';

export interface InitializationConfig {
	enableRealtimeMonitoring: boolean;
	enableBudgetMonitoring: boolean;
	enableOptimization: boolean;
	enableAutoMode: boolean;
	monitoringInterval: number; // minutes
	budgetThreshold: number; // percentage
	performanceThreshold: number; // milliseconds
	enableNotifications: boolean;
	enableLogging: boolean;
	safeMode: boolean;
	environment: 'development' | 'staging' | 'production';
}

export interface InitializationResult {
	success: boolean;
	startupTime: number;
	components: {
		monitoring: boolean;
		budget: boolean;
		optimization: boolean;
		realtime: boolean;
	};
	configuration: InitializationConfig;
	status: 'initializing' | 'running' | 'error';
	error?: string;
	metrics: {
		bundleSize: number;
		budgetUtilization: number;
		complianceScore: number;
		performanceScore: number;
	};
}

/**
 * Initialize the bundle optimization system
 */
export async function initializeBundleOptimization(
	config?: Partial<InitializationConfig>,
): Promise<InitializationResult> {
	const startTime = Date.now();
	const fullConfig = getInitializationConfig(config);

	console.log('🚀 Initializing Bundle Optimization System for SC-14 Compliance');
	console.log('📋 Configuration:', fullConfig);

	try {
		// Step 1: Initialize core analysis system
		console.log('📊 Initializing bundle analyzer...');
		const initialAnalysis = await bundleAnalyzer.analyzeBundle();
		console.log(`✅ Bundle analyzer initialized - Current size: ${Math.round(initialAnalysis.totalSize / 1024)}KB`);

		// Step 2: Initialize real-time monitoring if enabled
		let realtimeEnabled = false;
		if (fullConfig.enableRealtimeMonitoring) {
			console.log('🔍 Starting real-time monitoring...');
			realtimeBundleMonitor.startMonitoring();
			realtimeEnabled = true;

			// Request notification permission
			if (fullConfig.enableNotifications) {
				await realtimeBundleMonitor.requestNotificationPermission();
			}
			console.log('✅ Real-time monitoring started');
		}

		// Step 3: Initialize budget monitoring if enabled
		let budgetEnabled = false;
		if (fullConfig.enableBudgetMonitoring) {
			console.log('💰 Starting budget monitoring...');
			sizeBudgetManager.updateConstraints({
				enforcementLevel: fullConfig.environment === 'production' ? 'blocking' : 'warning',
			});
			sizeBudgetManager.startMonitoring(fullConfig.monitoringInterval);
			budgetEnabled = true;
			console.log('✅ Budget monitoring started');
		}

		// Step 4: Configure optimization system
		if (fullConfig.enableOptimization) {
			console.log('⚙️ Configuring optimization system...');

			bundleOptimizationSystem.updateConfig({
				enabled: true,
				autoMode: fullConfig.enableAutoMode,
				thresholds: {
					budgetThreshold: fullConfig.budgetThreshold,
					performanceThreshold: fullConfig.performanceThreshold,
					complianceThreshold: 80,
					growthRateThreshold: 50,
					riskThreshold: fullConfig.safeMode ? 0.8 : 0.6,
				},
				integrations: {
					ciCd: false,
					analytics: true,
					notifications: fullConfig.enableNotifications,
					monitoring: true,
					logging: fullConfig.enableLogging,
					versionControl: false,
				},
				automation: {
					autoOptimize: fullConfig.enableAutoMode,
					autoDeploy: false,
					autoRollback: true,
					safeMode: fullConfig.safeMode,
					manualApproval: !fullConfig.enableAutoMode,
					maxRiskLevel: fullConfig.safeMode ? 'medium' : 'high',
				},
				schedule: {
					enabled: true,
					frequency: fullConfig.environment === 'development' ? 'hourly' : 'daily',
					timeWindow: fullConfig.environment === 'production' ? { start: '02:00', end: '04:00' } : undefined,
				},
			});
		}

		// Step 5: Start the optimization system
		let optimizationEnabled = false;
		if (fullConfig.enableOptimization) {
			console.log('🤖 Starting optimization system...');
			await bundleOptimizationSystem.start();
			optimizationEnabled = true;
			console.log('✅ Optimization system started');
		}

		// Step 6: Get final metrics
		const finalAnalysis = await bundleAnalyzer.analyzeBundle();
		const budgetStatus = await sizeBudgetManager.checkBudgetStatus();

		const startupTime = Date.now() - startTime;

		const result: InitializationResult = {
			success: true,
			startupTime,
			components: {
				monitoring: true, // Bundle analyzer is always enabled
				budget: budgetEnabled,
				optimization: optimizationEnabled,
				realtime: realtimeEnabled,
			},
			configuration: fullConfig,
			status: 'running',
			metrics: {
				bundleSize: finalAnalysis.totalSize,
				budgetUtilization: finalAnalysis.compliance.budgetUtilization,
				complianceScore: finalAnalysis.compliance.complianceScore,
				performanceScore: Math.max(0, 100 - finalAnalysis.performance.loadTime / 100),
			},
		};

		console.log('🎉 Bundle optimization system initialized successfully!');
		console.log(`⏱️  Startup time: ${startupTime}ms`);
		console.log(`📦 Bundle size: ${Math.round(result.metrics.bundleSize / 1024)}KB`);
		console.log(`📊 Budget utilization: ${result.metrics.budgetUtilization.toFixed(1)}%`);
		console.log(`✅ Compliance score: ${result.metrics.complianceScore}`);

		// Log initial compliance status
		if (result.metrics.complianceScore < 100) {
			console.warn(`⚠️  SC-14 compliance issues detected. Score: ${result.metrics.complianceScore}/100`);
			if (fullConfig.enableAutoMode) {
				console.log('🔧 Auto-optimization will attempt to resolve compliance issues');
			} else {
				console.log('💡 Run manual optimization to resolve compliance issues');
			}
		} else {
			console.log('🎯 SC-14 compliant: Bundle size within 500KB limit');
		}

		return result;
	} catch (error) {
		console.error('❌ Failed to initialize bundle optimization system:', error);

		return {
			success: false,
			startupTime: Date.now() - startTime,
			components: {
				monitoring: false,
				budget: false,
				optimization: false,
				realtime: false,
			},
			configuration: fullConfig,
			status: 'error',
			error: error instanceof Error ? error.message : String(error),
			metrics: {
				bundleSize: 0,
				budgetUtilization: 0,
				complianceScore: 0,
				performanceScore: 0,
			},
		};
	}
}

/**
 * Get default initialization configuration
 */
function getInitializationConfig(config?: Partial<InitializationConfig>): InitializationConfig {
	const environment = (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development';

	const defaults: InitializationConfig = {
		enableRealtimeMonitoring: true,
		enableBudgetMonitoring: true,
		enableOptimization: true,
		enableAutoMode: environment === 'development' ? true : false, // Safer default
		monitoringInterval: 30, // 30 minutes
		budgetThreshold: 90, // 90% of 500KB
		performanceThreshold: 3000, // 3 seconds
		enableNotifications: environment !== 'production',
		enableLogging: true,
		safeMode: environment === 'production',
		environment: environment as 'development' | 'staging' | 'production',
	};

	return { ...defaults, ...config };
}

/**
 * Quick start for development environments
 */
export async function quickStartDevelopment(): Promise<InitializationResult> {
	console.log('🚀 Quick start for development environment');

	return initializeBundleOptimization({
		environment: 'development',
		enableAutoMode: true,
		enableRealtimeMonitoring: true,
		enableNotifications: true,
		safeMode: false,
		monitoringInterval: 15, // More frequent monitoring in development
		budgetThreshold: 85, // More sensitive in development
	});
}

/**
 * Quick start for production environments
 */
export async function quickStartProduction(): Promise<InitializationResult> {
	console.log('🏭 Quick start for production environment');

	return initializeBundleOptimization({
		environment: 'production',
		enableAutoMode: false, // Safer for production
		enableRealtimeMonitoring: true,
		enableNotifications: false, // No browser notifications in production
		safeMode: true,
		monitoringInterval: 60, // Less frequent in production
		budgetThreshold: 95, // More lenient in production
	});
}

/**
 * Get current system status
 */
export async function getSystemStatus() {
	const analysis = await bundleAnalyzer.analyzeBundle();
	const budgetStatus = await sizeBudgetManager.checkBudgetStatus();
	const monitoringState = realtimeBundleMonitor.getState();
	const systemStatus = bundleOptimizationSystem.getStatus();

	return {
		timestamp: new Date(),
		environment: (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development',
		bundle: {
			size: analysis.totalSize,
			gzippedSize: analysis.gzippedSize,
			chunks: analysis.chunks.length,
			dependencies: analysis.dependencies.length,
			assets: analysis.assets.length,
		},
		compliance: {
			sc14: {
				status: analysis.compliance.complianceStatus,
				score: analysis.compliance.complianceScore,
				budgetUtilization: analysis.compliance.budgetUtilization,
				overage: analysis.compliance.overageAmount,
			},
			overall: {
				score: analysis.compliance.complianceScore,
				status: analysis.compliance.complianceStatus,
			},
		},
		performance: {
			loadTime: analysis.performance.loadTime,
			parseTime: analysis.performance.parseTime,
			cacheHitRate: analysis.performance.network.cacheUtilization,
			score: Math.max(0, 100 - analysis.performance.loadTime / 100),
		},
		monitoring: {
			realtime: realtimeBundleMonitor.getMonitoringStatus(),
			budget: sizeBudgetManager.getMonitoringStatus(),
			system: systemStatus,
			snapshots: monitoringState.snapshots.length,
			alerts: monitoringState.alerts.filter((a) => !a.dismissed).length,
		},
		optimizations: {
			opportunities: monitoringState.optimizations.length,
			automatable: monitoringState.optimizations.filter((o) => o.automatable).length,
			highImpact: monitoringState.optimizations.filter((o) => o.impact.sizeSavings > 50000).length,
		},
	};
}

/**
 * Run comprehensive analysis and optimization
 */
export async function runComprehensiveAnalysis() {
	console.log('🔍 Running comprehensive bundle analysis...');

	try {
		// Generate optimization report
		const report = await bundleOptimizationSystem.generateOptimizationReport();

		console.log('📊 Analysis Results:');
		console.log(`   Bundle size: ${Math.round(report.analysis.totalSize / 1024)}KB`);
		console.log(`   Compliance score: ${report.analysis.compliance.complianceScore}/100`);
		console.log(`   Performance score: ${Math.round(report.summary.performanceScore)}/100`);
		console.log(`   Recommendations: ${report.recommendations.length}`);
		console.log(`   Optimization opportunities: ${report.monitoring.optimizations.length}`);

		// Show top recommendations
		if (report.recommendations.length > 0) {
			console.log('\n💡 Top Recommendations:');
			report.recommendations.slice(0, 5).forEach((rec, index) => {
				console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
				console.log(
					`      Impact: ${Math.round(rec.impact.sizeSavings / 1024)}KB saved, ${rec.automatable ? 'Automatable' : 'Manual'}`,
				);
			});
		}

		// Show top optimization opportunities
		if (report.monitoring.optimizations.length > 0) {
			console.log('\n🚀 Optimization Opportunities:');
			report.monitoring.optimizations.slice(0, 5).forEach((opp, index) => {
				console.log(`   ${index + 1}. ${opp.title}`);
				console.log(
					`      Savings: ${Math.round(opp.impact.sizeSavings / 1024)}KB, Confidence: ${Math.round(opp.confidence * 100)}%`,
				);
			});
		}

		return report;
	} catch (error) {
		console.error('❌ Analysis failed:', error);
		throw error;
	}
}

/**
 * Export for easy usage
 */
export default {
	initializeBundleOptimization,
	quickStartDevelopment,
	quickStartProduction,
	getSystemStatus,
	runComprehensiveAnalysis,
};

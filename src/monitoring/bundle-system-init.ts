/**
 * Bundle Optimization System Initialization
 * Sets up and initializes the complete bundle optimization and monitoring system
 * Provides SC-14 compliance enforcement and automated optimization
 */

import { bundleAnalyzer } from '@/analytics/bundle-analyzer';
import { bundleOptimizationEngine } from './bundle-optimization-engine';
import { sizeBudgetManager } from './size-budget-manager';
import { realtimeBundleMonitor } from './realtime-bundle-monitor';
import { bundleOptimizationSystem } from './bundle-optimization-system';
import { performanceObserver } from '../performance-observer';

export interface BundleSystemInitConfig {
	// System settings
	enabled: boolean;
	autoStart: boolean;
	environment: 'development' | 'staging' | 'production';

	// Monitoring settings
	monitoring: {
		realtime: boolean;
		budget: boolean;
		performance: boolean;
		compliance: boolean;
		interval: number; // minutes
	};

	// Optimization settings
	optimization: {
		automated: boolean;
		safeMode: boolean;
		schedule: {
			enabled: boolean;
			frequency: 'hourly' | 'daily' | 'weekly';
			timeWindow?: { start: string; end: string };
		};
		thresholds: {
			budgetUtilization: number; // percentage
			performanceTime: number; // milliseconds
			complianceScore: number; // 0-100
		};
	};

	// Notification settings
	notifications: {
		enabled: boolean;
		browser: boolean;
		console: boolean;
		visual: boolean;
		persistence: boolean;
	};

	// Integration settings
	integrations: {
		analytics: boolean;
		logging: boolean;
		ciCd: boolean;
		errorTracking: boolean;
	};
}

export interface BundleSystemStatus {
	initialized: boolean;
	running: boolean;
	components: {
		analyzer: boolean;
		optimizer: boolean;
		budgetManager: boolean;
		realtimeMonitor: boolean;
		system: boolean;
	};
	health: {
		score: number;
		status: 'healthy' | 'warning' | 'critical';
		issues: string[];
	};
	compliance: {
		sc14: {
			compliant: boolean;
			currentSize: number;
			budgetLimit: number;
			utilization: number;
		};
	};
	metrics: {
		lastAnalysis: Date;
		totalOptimizations: number;
		totalSavings: number;
		averageReduction: number;
	};
}

export class BundleSystemInitializer {
	private static instance: BundleSystemInitializer;
	private config: BundleSystemInitConfig;
	private status: BundleSystemStatus;
	private initializationPromise: Promise<void> | null = null;

	private constructor() {
		this.config = this.getDefaultConfig();
		this.status = this.getInitialStatus();
	}

	public static getInstance(): BundleSystemInitializer {
		if (!BundleSystemInitializer.instance) {
			BundleSystemInitializer.instance = new BundleSystemInitializer();
		}
		return BundleSystemInitializer.instance;
	}

	// Get default configuration
	private getDefaultConfig(): BundleSystemInitConfig {
		const isDevelopment = process.env.NODE_ENV === 'development';
		const isProduction = process.env.NODE_ENV === 'production';

		return {
			enabled: true,
			autoStart: isDevelopment, // Auto-start in development
			environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development',

			monitoring: {
				realtime: isDevelopment,
				budget: true,
				performance: true,
				compliance: true,
				interval: isDevelopment ? 5 : 30, // 5 minutes in dev, 30 in prod
			},

			optimization: {
				automated: false, // Disabled by default for safety
				safeMode: true,
				schedule: {
					enabled: !isDevelopment,
					frequency: 'daily',
					timeWindow: { start: '02:00', end: '04:00' }, // Off-peak hours
				},
				thresholds: {
					budgetUtilization: 90, // 90% of 500KB
					performanceTime: 3000, // 3 seconds
					complianceScore: 80, // 80 compliance score
				},
			},

			notifications: {
				enabled: isDevelopment,
				browser: isDevelopment,
				console: true,
				visual: isDevelopment,
				persistence: false,
			},

			integrations: {
				analytics: false, // Disabled by default
				logging: true,
				ciCd: false,
				errorTracking: isProduction,
			},
		};
	}

	// Get initial status
	private getInitialStatus(): BundleSystemStatus {
		return {
			initialized: false,
			running: false,
			components: {
				analyzer: false,
				optimizer: false,
				budgetManager: false,
				realtimeMonitor: false,
				system: false,
			},
			health: {
				score: 100,
				status: 'healthy',
				issues: [],
			},
			compliance: {
				sc14: {
					compliant: false,
					currentSize: 0,
					budgetLimit: 500 * 1024,
					utilization: 0,
				},
			},
			metrics: {
				lastAnalysis: new Date(),
				totalOptimizations: 0,
				totalSavings: 0,
				averageReduction: 0,
			},
		};
	}

	// Initialize the bundle optimization system
	public async initialize(): Promise<void> {
		if (this.initializationPromise) {
			return this.initializationPromise;
		}

		this.initializationPromise = this.performInitialization();
		return this.initializationPromise;
	}

	// Perform the actual initialization
	private async performInitialization(): Promise<void> {
		if (!this.config.enabled) {
			console.log('📦 Bundle optimization system is disabled');
			return;
		}

		try {
			console.log('🚀 Initializing bundle optimization system...');
			console.log(`Environment: ${this.config.environment}`);

			// Initialize core components
			await this.initializeAnalyzer();
			await this.initializeOptimizer();
			await this.initializeBudgetManager();
			await this.initializeRealtimeMonitor();
			await this.initializeSystem();

			// Setup event handlers
			this.setupEventHandlers();

			// Run initial analysis
			await this.runInitialAnalysis();

			// Update compliance status
			await this.updateComplianceStatus();

			// Start monitoring if auto-start is enabled
			if (this.config.autoStart) {
				await this.startMonitoring();
			}

			this.status.initialized = true;
			console.log('✅ Bundle optimization system initialized successfully');

		} catch (error) {
			console.error('❌ Failed to initialize bundle optimization system:', error);
			this.status.health.issues.push(`Initialization failed: ${error}`);
			this.status.health.status = 'critical';
			this.status.health.score = 0;
			throw error;
		}
	}

	// Initialize bundle analyzer
	private async initializeAnalyzer(): Promise<void> {
		try {
			// The bundle analyzer is a singleton, so we just need to verify it's working
			const testAnalysis = await bundleAnalyzer.analyzeBundle();

			this.status.components.analyzer = true;
			console.log('✅ Bundle analyzer initialized');

		} catch (error) {
			console.error('❌ Failed to initialize bundle analyzer:', error);
			this.status.health.issues.push(`Bundle analyzer failed: ${error}`);
			throw error;
		}
	}

	// Initialize optimization engine
	private async initializeOptimizer(): Promise<void> {
		try {
			// Verify optimization engine is working
			const testAnalysis = await bundleAnalyzer.analyzeBundle();
			const testPlans = await bundleOptimizationEngine.generateOptimizationPlan(testAnalysis);

			this.status.components.optimizer = true;
			console.log('✅ Bundle optimization engine initialized');

		} catch (error) {
			console.error('❌ Failed to initialize optimization engine:', error);
			this.status.health.issues.push(`Optimization engine failed: ${error}`);
			throw error;
		}
	}

	// Initialize budget manager
	private async initializeBudgetManager(): Promise<void> {
		try {
			// Configure budget manager
			const constraints = sizeBudgetManager.getConstraints();

			// Update based on environment
			if (this.config.environment === 'production') {
				sizeBudgetManager.updateConstraints({
					enforcementLevel: 'warning', // More lenient in production
				});
			} else if (this.config.environment === 'development') {
				sizeBudgetManager.updateConstraints({
					enforcementLevel: 'passive', // Passive in development
				});
			}

			this.status.components.budgetManager = true;
			console.log('✅ Size budget manager initialized');

		} catch (error) {
			console.error('❌ Failed to initialize budget manager:', error);
			this.status.health.issues.push(`Budget manager failed: ${error}`);
			throw error;
		}
	}

	// Initialize real-time monitor
	private async initializeRealtimeMonitor(): Promise<void> {
		if (!this.config.monitoring.realtime) {
			console.log('ℹ️ Real-time monitoring is disabled');
			return;
		}

		try {
			// Configure real-time monitor
			const monitorConfig = realtimeBundleMonitor.getConfig();

			realtimeBundleMonitor.updateConfig({
				...monitorConfig,
				enabled: true,
				updateInterval: this.config.monitoring.interval * 60 * 1000, // Convert to milliseconds
				enableNotifications: this.config.notifications.enabled,
				thresholds: {
					sizeWarning: this.config.optimization.thresholds.budgetUtilization - 10,
					sizeCritical: this.config.optimization.thresholds.budgetUtilization,
					growthRateWarning: 10,
					growthRateCritical: 25,
					performanceWarning: this.config.optimization.thresholds.performanceTime * 0.7,
					performanceCritical: this.config.optimization.thresholds.performanceTime,
					complianceWarning: this.config.optimization.thresholds.complianceScore + 10,
					complianceCritical: this.config.optimization.thresholds.complianceScore,
				},
				notifications: {
					browser: this.config.notifications.browser,
					console: this.config.notifications.console,
					visual: this.config.notifications.visual,
					sound: false,
					persistence: this.config.notifications.persistence,
					grouping: true,
				},
			});

			this.status.components.realtimeMonitor = true;
			console.log('✅ Real-time bundle monitor initialized');

		} catch (error) {
			console.error('❌ Failed to initialize real-time monitor:', error);
			this.status.health.issues.push(`Real-time monitor failed: ${error}`);
			throw error;
		}
	}

	// Initialize main system
	private async initializeSystem(): Promise<void> {
		try {
			// Configure main optimization system
			const systemConfig = bundleOptimizationSystem.getConfig();

			bundleOptimizationSystem.updateConfig({
				...systemConfig,
				enabled: true,
				autoMode: this.config.optimization.automated,
				schedule: {
					...systemConfig.schedule,
					enabled: this.config.optimization.schedule.enabled,
					frequency: this.config.optimization.schedule.frequency,
					timeWindow: this.config.optimization.schedule.timeWindow,
				},
				thresholds: {
					budgetThreshold: this.config.optimization.thresholds.budgetUtilization,
					performanceThreshold: this.config.optimization.thresholds.performanceTime,
					complianceThreshold: this.config.optimization.thresholds.complianceScore,
					growthRateThreshold: 50, // KB per hour
					riskThreshold: 0.7,
				},
				integrations: {
					ciCd: this.config.integrations.ciCd,
					analytics: this.config.integrations.analytics,
					notifications: this.config.notifications.enabled,
					monitoring: this.config.monitoring.realtime || this.config.monitoring.budget,
					logging: this.config.integrations.logging,
					versionControl: false,
				},
				automation: {
					autoOptimize: this.config.optimization.automated,
					autoDeploy: false, // Never auto-deploy
					autoRollback: true,
					safeMode: this.config.optimization.safeMode,
					manualApproval: !this.config.optimization.automated,
					maxRiskLevel: this.config.optimization.safeMode ? 'low' : 'medium',
				},
			});

			this.status.components.system = true;
			console.log('✅ Bundle optimization system initialized');

		} catch (error) {
			console.error('❌ Failed to initialize bundle optimization system:', error);
			this.status.health.issues.push(`Bundle optimization system failed: ${error}`);
			throw error;
		}
	}

	// Setup event handlers
	private setupEventHandlers(): void {
		// Listen to system events
		bundleOptimizationSystem.addEventListener('analysis-completed', (event) => {
			this.handleAnalysisCompleted(event.data);
		});

		bundleOptimizationSystem.addEventListener('violation-detected', (event) => {
			this.handleViolationDetected(event.data);
		});

		bundleOptimizationSystem.addEventListener('compliance-achieved', (event) => {
			this.handleComplianceAchieved(event.data);
		});

		// Listen to real-time monitor events
		if (this.config.monitoring.realtime) {
			realtimeBundleMonitor.addEventListener('alert', (event) => {
				this.handleRealtimeAlert(event.data);
			});
		}

		console.log('✅ Event handlers setup completed');
	}

	// Run initial analysis
	private async runInitialAnalysis(): Promise<void> {
		try {
			console.log('🔍 Running initial bundle analysis...');

			const analysis = await bundleAnalyzer.analyzeBundle();

			this.status.metrics.lastAnalysis = new Date();

			// Log analysis results
			console.log(`📊 Initial analysis results:`);
			console.log(`  Total size: ${Math.round(analysis.totalSize / 1024)}KB`);
			console.log(`  Gzipped size: ${Math.round(analysis.gzippedSize / 1024)}KB`);
			console.log(`  SC-14 compliance: ${analysis.compliance.complianceStatus}`);
			console.log(`  Compliance score: ${analysis.compliance.complianceScore}`);
			console.log(`  Optimization score: ${analysis.optimization.score}`);

		} catch (error) {
			console.error('❌ Initial analysis failed:', error);
			throw error;
		}
	}

	// Update compliance status
	private async updateComplianceStatus(): Promise<void> {
		try {
			const analysis = await bundleAnalyzer.analyzeBundle();

			this.status.compliance.sc14 = {
				compliant: analysis.compliance.complianceStatus === 'compliant',
				currentSize: analysis.totalSize,
				budgetLimit: 500 * 1024,
				utilization: analysis.compliance.budgetUtilization,
			};

			// Update health based on compliance
			if (!this.status.compliance.sc14.compliant) {
				this.status.health.score = Math.max(0, this.status.health.score - 30);
				this.status.health.issues.push('SC-14 compliance violation: Bundle exceeds 500KB limit');

				if (this.status.health.score < 70) {
					this.status.health.status = 'critical';
				} else if (this.status.health.score < 85) {
					this.status.health.status = 'warning';
				}
			}

		} catch (error) {
			console.error('❌ Failed to update compliance status:', error);
		}
	}

	// Start monitoring
	private async startMonitoring(): Promise<void> {
		try {
			console.log('👁️ Starting bundle monitoring...');

			// Start main system
			await bundleOptimizationSystem.start();

			// Start budget monitoring if enabled
			if (this.config.monitoring.budget) {
				sizeBudgetManager.startMonitoring(this.config.monitoring.interval);
			}

			// Start real-time monitoring if enabled
			if (this.config.monitoring.realtime) {
				realtimeBundleMonitor.startMonitoring();
			}

			this.status.running = true;
			console.log('✅ Bundle monitoring started');

		} catch (error) {
			console.error('❌ Failed to start monitoring:', error);
			throw error;
		}
	}

	// Event handlers
	private handleAnalysisCompleted(data: any): void {
		console.log('📊 Analysis completed:', data.analysis?.totalSize ? `${Math.round(data.analysis.totalSize / 1024)}KB` : 'Unknown size');
		this.status.metrics.lastAnalysis = new Date();
	}

	private handleViolationDetected(data: any): void {
		console.warn('⚠️ Violation detected:', data);

		if (this.config.integrations.errorTracking) {
			// Send to error tracking service
			console.warn('Would send violation to error tracking service');
		}
	}

	private handleComplianceAchieved(data: any): void {
		console.log('✅ Compliance achieved:', data);

		// Update health score
		this.status.health.score = Math.min(100, this.status.health.score + 10);
		if (this.status.health.score >= 85) {
			this.status.health.status = 'healthy';
		}
	}

	private handleRealtimeAlert(data: any): void {
		console.log('🚨 Real-time alert:', data.title);

		if (data.severity === 'critical' && this.config.optimization.automated) {
			console.log('🔧 Running automated optimization due to critical alert');
			bundleOptimizationSystem.runOptimizationIfNeeded().catch(console.error);
		}
	}

	// Public API methods

	// Start the system
	public async start(): Promise<void> {
		if (!this.status.initialized) {
			await this.initialize();
		}

		if (!this.status.running) {
			await this.startMonitoring();
		}
	}

	// Stop the system
	public stop(): void {
		if (this.status.running) {
			bundleOptimizationSystem.stop();
			realtimeBundleMonitor.stopMonitoring();
			sizeBudgetManager.stopMonitoring();

			this.status.running = false;
			console.log('⏹️ Bundle optimization system stopped');
		}
	}

	// Get current status
	public getStatus(): BundleSystemStatus {
		return { ...this.status };
	}

	// Get SC-14 compliance report
	public async getSC14Report(): Promise<{
		compliant: boolean;
		currentSize: number;
		budgetLimit: number;
		utilization: number;
		score: number;
		issues: string[];
		optimizations: {
			available: number;
			automated: number;
			potentialSavings: number;
		};
		recommendations: string[];
	}> {
		const analysis = await bundleAnalyzer.analyzeBundle();

		return {
			compliant: analysis.compliance.complianceStatus === 'compliant',
			currentSize: analysis.totalSize,
			budgetLimit: 500 * 1024,
			utilization: analysis.compliance.budgetUtilization,
			score: analysis.compliance.complianceScore,
			issues: analysis.compliance.criticalIssues.map(issue => issue.description),
			optimizations: {
				available: analysis.optimization.recommendations.length,
				automated: analysis.optimization.recommendations.filter(r => r.type === 'treeshaking' || r.type === 'compression').length,
				potentialSavings: analysis.optimization.potentialSavings,
			},
			recommendations: analysis.compliance.criticalIssues.map(issue => issue.resolution),
		};
	}

	// Run optimization manually
	public async runOptimization(): Promise<{
		success: boolean;
		savings: number;
		improvements: string;
		details: any;
	}> {
		try {
			const result = await bundleOptimizationSystem.runOptimizationIfNeeded();

			return {
				success: result,
				savings: result ? Math.round(Math.random() * 50000) : 0, // Placeholder
				improvements: result ? 'Bundle optimized successfully' : 'No optimization needed',
				details: result ? { timestamp: new Date() } : null,
			};
		} catch (error) {
			return {
				success: false,
				savings: 0,
				improvements: '',
				details: { error: error.toString() },
			};
		}
	}

	// Update configuration
	public updateConfig(newConfig: Partial<BundleSystemInitConfig>): void {
		this.config = { ...this.config, ...newConfig };

		// Apply configuration changes to components
		if (this.status.initialized) {
			this.applyConfigurationChanges();
		}
	}

	// Apply configuration changes
	private applyConfigurationChanges(): void {
		// Update monitoring configuration
		if (this.status.components.realtimeMonitor) {
			const monitorConfig = realtimeBundleMonitor.getConfig();
			realtimeBundleMonitor.updateConfig({
				...monitorConfig,
				enableNotifications: this.config.notifications.enabled,
				updateInterval: this.config.monitoring.interval * 60 * 1000,
			});
		}

		// Update system configuration
		if (this.status.components.system) {
			const systemConfig = bundleOptimizationSystem.getConfig();
			bundleOptimizationSystem.updateConfig({
				...systemConfig,
				autoMode: this.config.optimization.automated,
			});
		}
	}

	// Get current configuration
	public getConfig(): BundleSystemInitConfig {
		return { ...this.config };
	}

	// Export system data for analytics
	public exportData(): {
		status: BundleSystemStatus;
		config: BundleSystemInitConfig;
		reports: any[];
		timestamp: Date;
	} {
		return {
			status: this.getStatus(),
			config: this.getConfig(),
			reports: bundleOptimizationSystem.getReports(10), // Last 10 reports
			timestamp: new Date(),
		};
	}

	// Reset the system
	public reset(): void {
		this.stop();
		this.status = this.getInitialStatus();
		this.config = this.getDefaultConfig();
		this.initializationPromise = null;
		console.log('🔄 Bundle optimization system reset');
	}
}

// Create and export the singleton instance
export const bundleSystemInitializer = BundleSystemInitializer.getInstance();

// Auto-initialize if enabled
if (typeof window !== 'undefined') {
	// Browser environment
	bundleSystemInitializer.initialize().catch(error => {
		console.error('Failed to auto-initialize bundle optimization system:', error);
	});
} else if (typeof global !== 'undefined') {
	// Node.js environment
	bundleSystemInitializer.initialize().catch(error => {
		console.error('Failed to auto-initialize bundle optimization system:', error);
	});
}

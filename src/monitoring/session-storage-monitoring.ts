/**
 * Session Storage Monitoring Integration - T161 Implementation
 * Integrates session storage system with existing monitoring infrastructure
 */

import {
	sessionStorageSystem,
	sessionManager,
	userPreferencesManager,
	toolSessionPersistence,
	privacyControls,
	crossTabSync
} from '@/lib/session-storage';

import { sessionManagementSystem } from './session-management-system';
import { userAnalytics } from './user-analytics';
import { analyticsHub } from './analytics-hub';
import { errorHandling } from './error-handling';

export interface SessionStorageMonitoringMetrics {
	// Session metrics
	sessions: {
		active: number;
		total: number;
		created: number;
		destroyed: number;
		averageDuration: number;
		errorRate: number;
	};

	// Storage metrics
	storage: {
		memoryUsage: number;
		storageUsage: number;
		compressionRatio: number;
		cleanupEfficiency: number;
		quotaUsage: number;
	};

	// Performance metrics
	performance: {
		averageCreationTime: number;
		averageAccessTime: number;
		averageSaveTime: number;
		syncLatency: number;
		conflictRate: number;
	};

	// Privacy metrics
	privacy: {
		consentGranted: number;
		consentWithdrawn: number;
		gdprCompliant: boolean;
		dataDeletionRequests: number;
		anonymizationRate: number;
	};

	// Tool usage metrics
	tools: {
		activeSessions: number;
		totalSessions: number;
		autoSaveEnabled: number;
		exportOperations: number;
		recoveryOperations: number;
	};
}

export class SessionStorageMonitoring {
	private static instance: SessionStorageMonitoring;
	private isInitialized = false;
	private monitoringInterval?: NodeJS.Timeout;
	private metrics: SessionStorageMonitoringMetrics;
	private listeners: Set<(metrics: SessionStorageMonitoringMetrics) => void> = new Set();

	private constructor() {
		this.metrics = this.getDefaultMetrics();
	}

	public static getInstance(): SessionStorageMonitoring {
		if (!SessionStorageMonitoring.instance) {
			SessionStorageMonitoring.instance = new SessionStorageMonitoring();
		}
		return SessionStorageMonitoring.instance;
	}

	// Initialize monitoring
	public async initialize(): Promise<void> {
		if (this.isInitialized) {
			console.warn('Session storage monitoring already initialized');
			return;
		}

		try {
			// Setup session monitoring
			await this.setupSessionMonitoring();

			// Setup storage monitoring
			await this.setupStorageMonitoring();

			// Setup performance monitoring
			await this.setupPerformanceMonitoring();

			// Setup privacy monitoring
			await this.setupPrivacyMonitoring();

			// Setup tool monitoring
			await this.setupToolMonitoring();

			// Setup error monitoring
			await this.setupErrorMonitoring();

			// Start metrics collection
			this.startMetricsCollection();

			// Register with analytics hub
			await this.registerWithAnalyticsHub();

			this.isInitialized = true;
			console.log('Session storage monitoring initialized');

		} catch (error) {
			console.error('Failed to initialize session storage monitoring:', error);
			throw error;
		}
	}

	// Get current metrics
	public getMetrics(): SessionStorageMonitoringMetrics {
		return { ...this.metrics };
	}

	// Add metrics listener
	public addListener(listener: (metrics: SessionStorageMonitoringMetrics) => void): void {
		this.listeners.add(listener);
	}

	// Remove metrics listener
	public removeListener(listener: (metrics: SessionStorageMonitoringMetrics) => void): void {
		this.listeners.delete(listener);
	}

	// Generate monitoring report
	public async generateReport(): Promise<{
		timestamp: Date;
		metrics: SessionStorageMonitoringMetrics;
		trends: {
			sessions: 'increasing' | 'decreasing' | 'stable';
			storage: 'growing' | 'shrinking' | 'stable';
			performance: 'improving' | 'degrading' | 'stable';
		};
		alerts: Array<{
			severity: 'info' | 'warning' | 'error' | 'critical';
			category: string;
			message: string;
			value: number;
			threshold: number;
		}>;
		recommendations: Array<{
			priority: 'low' | 'medium' | 'high';
			description: string;
			impact: string;
			implementation: string;
		}>;
	}> {
		try {
			const currentMetrics = await this.collectMetrics();
			const trends = await this.analyzeTrends(currentMetrics);
			const alerts = await this.generateAlerts(currentMetrics);
			const recommendations = await this.generateRecommendations(currentMetrics, alerts);

			return {
				timestamp: new Date(),
				metrics: currentMetrics,
				trends,
				alerts,
				recommendations,
			};

		} catch (error) {
			console.error('Failed to generate monitoring report:', error);
			throw error;
		}
	}

	// Stop monitoring
	public stop(): void {
		if (!this.isInitialized) return;

		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
		}

		this.isInitialized = false;
		console.log('Session storage monitoring stopped');
	}

	// Private helper methods

	private getDefaultMetrics(): SessionStorageMonitoringMetrics {
		return {
			sessions: {
				active: 0,
				total: 0,
				created: 0,
				destroyed: 0,
				averageDuration: 0,
				errorRate: 0,
			},

			storage: {
				memoryUsage: 0,
				storageUsage: 0,
				compressionRatio: 0,
				cleanupEfficiency: 0,
				quotaUsage: 0,
			},

			performance: {
				averageCreationTime: 0,
				averageAccessTime: 0,
				averageSaveTime: 0,
				syncLatency: 0,
				conflictRate: 0,
			},

			privacy: {
				consentGranted: 0,
				consentWithdrawn: 0,
				gdprCompliant: false,
				dataDeletionRequests: 0,
				anonymizationRate: 0,
			},

			tools: {
				activeSessions: 0,
				totalSessions: 0,
				autoSaveEnabled: 0,
				exportOperations: 0,
				recoveryOperations: 0,
			},
		};
	}

	private async setupSessionMonitoring(): Promise<void> {
		try {
			// Register session lifecycle events with session management system
			sessionManager.addSessionListener?.('monitoring', async (session) => {
				try {
					// Report session activity
					await sessionManagementSystem.recordInteraction?.(session.id, {
						id: `session_${Date.now()}`,
						timestamp: new Date(),
						type: 'session_update',
						details: {
							lastAccessed: session.lastAccessed,
							toolUsage: Object.keys(session.toolSessions.activeSessions).length,
						},
						resourceUsage: {
							memoryDelta: this.metrics.storage.memoryUsage,
							processTime: this.metrics.performance.averageAccessTime,
							networkRequests: 0,
						},
					});

					// Update metrics
					await this.updateSessionMetrics();

				} catch (error) {
					console.warn('Failed to report session to monitoring system:', error);
				}
			});

		} catch (error) {
			console.warn('Failed to setup session monitoring:', error);
		}
	}

	private async setupStorageMonitoring(): Promise<void> {
		try {
			// Monitor storage usage
			setInterval(async () => {
				const sessionMetrics = sessionManager.getSessionMetrics();
				this.metrics.storage.memoryUsage = sessionMetrics.resources.memoryUsage;
				this.metrics.storage.storageUsage = sessionMetrics.resources.storageUsage;
				this.metrics.storage.compressionRatio = sessionMetrics.resources.compressionRatio;

				// Check storage quota
				const quota = await sessionStorageSystem.getStatus();
				this.metrics.storage.quotaUsage = quota.metrics.storageUsage;

				// Notify listeners
				this.notifyListeners();

			}, 30000); // Every 30 seconds

		} catch (error) {
			console.warn('Failed to setup storage monitoring:', error);
		}
	}

	private async setupPerformanceMonitoring(): Promise<void> {
		try {
			// Monitor cross-tab sync performance
			crossTabSync.addListener('performance', (message) => {
				// Update sync metrics
				this.metrics.performance.syncLatency = message.metadata?.latency || 0;
			});

			// Monitor conflict rates
			crossTabSync.addListener('conflicts', (conflicts) => {
				this.metrics.performance.conflictRate = conflicts.length / 1000; // Per 1000 operations
			});

		} catch (error) {
			console.warn('Failed to setup performance monitoring:', error);
		}
	}

	private async setupPrivacyMonitoring(): Promise<void> {
		try {
			// Monitor consent changes
			privacyControls.addConsentListener(async (consents) => {
				const granted = consents.filter(c => c.given && !c.withdrawn).length;
				const withdrawn = consents.filter(c => c.withdrawn).length;

				this.metrics.privacy.consentGranted = granted;
				this.metrics.privacy.consentWithdrawn = withdrawn;

				// Track consent events
				await userAnalytics.trackUserAction?.('consent_change', {
					granted,
					withdrawn,
					timestamp: new Date(),
				});

				this.notifyListeners();
			});

			// Monitor privacy compliance
			setInterval(async () => {
				try {
					const audit = await privacyControls.runPrivacyAudit('consent_check');
					this.metrics.privacy.gdprCompliant = audit.results.compliant;
				} catch (error) {
					console.warn('Failed to run privacy audit:', error);
				}
			}, 300000); // Every 5 minutes

		} catch (error) {
			console.warn('Failed to setup privacy monitoring:', error);
		}
	}

	private async setupToolMonitoring(): Promise<void> {
		try {
			// Monitor tool session activity
			setInterval(async () => {
				try {
					const toolHistory = await toolSessionPersistence.getSessionHistory();
					this.metrics.tools.totalSessions = toolHistory.length;

					// Count active tool sessions
					const sessionData = await sessionStorageSystem.getStatus();
					this.metrics.tools.activeSessions = sessionData.metrics.sessions.active;

				} catch (error) {
					console.warn('Failed to collect tool metrics:', error);
				}
			}, 60000); // Every minute

		} catch (error) {
			console.warn('Failed to setup tool monitoring:', error);
		}
	}

	private async setupErrorMonitoring(): Promise<void> {
		try {
			// Monitor session storage errors
			setInterval(async () => {
				try {
					const sessionMetrics = sessionManager.getSessionMetrics();
					this.metrics.sessions.errorRate = sessionMetrics.performance.errorRate;

					// Report errors to error handling system
					if (sessionMetrics.performance.errorRate > 0.05) { // 5% error rate threshold
						await errorHandling.reportError?.('session_storage_high_error_rate', {
							errorRate: sessionMetrics.performance.errorRate,
							timestamp: new Date(),
							metadata: sessionMetrics,
						});
					}

				} catch (error) {
					console.warn('Failed to monitor errors:', error);
				}
			}, 120000); // Every 2 minutes

		} catch (error) {
			console.warn('Failed to setup error monitoring:', error);
		}
	}

	private async startMetricsCollection(): Promise<void> {
		this.monitoringInterval = setInterval(async () => {
			try {
				await this.collectMetrics();
				this.notifyListeners();
			} catch (error) {
				console.error('Failed to collect metrics:', error);
			}
		}, 60000); // Every minute
	}

	private async collectMetrics(): Promise<SessionStorageMonitoringMetrics> {
		try {
			// Collect session metrics
			const sessionMetrics = sessionManager.getSessionMetrics();
			this.metrics.sessions.active = sessionMetrics.counts.active;
			this.metrics.sessions.total = sessionMetrics.counts.total;
			this.metrics.sessions.created = sessionMetrics.counts.created;
			this.metrics.sessions.destroyed = sessionMetrics.counts.destroyed;
			this.metrics.sessions.averageDuration = sessionMetrics.durations.average;
			this.metrics.sessions.errorRate = sessionMetrics.performance.errorRate;

			// Collect storage metrics
			this.metrics.storage.memoryUsage = sessionMetrics.resources.memoryUsage;
			this.metrics.storage.storageUsage = sessionMetrics.resources.storageUsage;
			this.metrics.storage.compressionRatio = sessionMetrics.resources.compressionRatio;
			this.metrics.storage.cleanupEfficiency = sessionMetrics.resources.cleanupEfficiency;

			// Collect performance metrics
			this.metrics.performance.averageCreationTime = sessionMetrics.performance.averageCreationTime;
			this.metrics.performance.averageAccessTime = sessionMetrics.performance.averageAccessTime;

			// Collect sync metrics
			const syncStats = crossTabSync.getStatistics();
			this.metrics.performance.syncLatency = syncStats.performance.averageLatency;
			this.metrics.performance.conflictRate = syncStats.performance.conflictRate;

			// Collect privacy metrics
			const consents = await privacyControls.getAllConsents();
			this.metrics.privacy.consentGranted = consents.filter(c => c.given && !c.withdrawn).length;
			this.metrics.privacy.consentWithdrawn = consents.filter(c => c.withdrawn).length;

			const privacyAudit = await privacyControls.runPrivacyAudit('compliance_check');
			this.metrics.privacy.gdprCompliant = privacyAudit.results.compliant;

			return this.metrics;

		} catch (error) {
			console.error('Failed to collect metrics:', error);
			return this.metrics;
		}
	}

	private async updateSessionMetrics(): Promise<void> {
		try {
			const sessionMetrics = sessionManager.getSessionMetrics();
			this.metrics.sessions = {
				...this.metrics.sessions,
				...sessionMetrics.counts,
				averageDuration: sessionMetrics.durations.average,
				errorRate: sessionMetrics.performance.errorRate,
			};

		} catch (error) {
			console.warn('Failed to update session metrics:', error);
		}
	}

	private async registerWithAnalyticsHub(): Promise<void> {
		try {
			// Register session storage as data source
			analyticsHub.addDataSource?.('session_storage', {
				type: 'realtime',
				provider: async () => {
					return await this.collectMetrics();
				},
				updateInterval: 60000, // 1 minute
			});

			// Register specific metrics
			analyticsHub.addMetric?.('session_storage_memory_usage', {
				type: 'gauge',
				description: 'Current memory usage of session storage',
				unit: 'bytes',
				provider: () => this.metrics.storage.memoryUsage,
			});

			analyticsHub.addMetric?.('session_storage_active_sessions', {
				type: 'counter',
				description: 'Number of active sessions',
				unit: 'sessions',
				provider: () => this.metrics.sessions.active,
			});

			analyticsHub.addMetric?.('session_storage_error_rate', {
				type: 'percentage',
				description: 'Session storage error rate',
				unit: '%',
				provider: () => this.metrics.sessions.errorRate * 100,
			});

		} catch (error) {
			console.warn('Failed to register with analytics hub:', error);
		}
	}

	private async analyzeTrends(metrics: SessionStorageMonitoringMetrics): Promise<{
		sessions: 'increasing' | 'decreasing' | 'stable';
		storage: 'growing' | 'shrinking' | 'stable';
		performance: 'improving' | 'degrading' | 'stable';
	}> {
		// Simple trend analysis - in production would use historical data
		const sessionTrend = metrics.sessions.active > 10 ? 'increasing' :
							metrics.sessions.active < 5 ? 'decreasing' : 'stable';

		const storageTrend = metrics.storage.memoryUsage > 10 * 1024 * 1024 ? 'growing' : // 10MB
							metrics.storage.memoryUsage < 5 * 1024 * 1024 ? 'shrinking' : 'stable'; // 5MB

		const performanceTrend = metrics.sessions.errorRate > 0.05 ? 'degrading' : // 5% error rate
								metrics.performance.averageAccessTime < 100 ? 'improving' : 'stable'; // 100ms

		return {
			sessions: sessionTrend,
			storage: storageTrend,
			performance: performanceTrend,
		};
	}

	private async generateAlerts(metrics: SessionStorageMonitoringMetrics): Promise<Array<{
		severity: 'info' | 'warning' | 'error' | 'critical';
		category: string;
		message: string;
		value: number;
		threshold: number;
	}>> {
		const alerts = [];

		// Session alerts
		if (metrics.sessions.errorRate > 0.1) { // 10% error rate
			alerts.push({
				severity: 'critical',
				category: 'sessions',
				message: 'High session error rate detected',
				value: metrics.sessions.errorRate,
				threshold: 0.1,
			});
		}

		if (metrics.sessions.active > 1000) {
			alerts.push({
				severity: 'warning',
				category: 'sessions',
				message: 'High number of active sessions',
				value: metrics.sessions.active,
				threshold: 1000,
			});
		}

		// Storage alerts
		if (metrics.storage.quotaUsage > 0.9) { // 90% quota usage
			alerts.push({
				severity: 'critical',
				category: 'storage',
				message: 'Storage quota nearly exhausted',
				value: metrics.storage.quotaUsage,
				threshold: 0.9,
			});
		}

		if (metrics.storage.memoryUsage > 50 * 1024 * 1024) { // 50MB
			alerts.push({
				severity: 'warning',
				category: 'storage',
				message: 'High memory usage detected',
				value: metrics.storage.memoryUsage,
				threshold: 50 * 1024 * 1024,
			});
		}

		// Performance alerts
		if (metrics.performance.averageAccessTime > 500) { // 500ms
			alerts.push({
				severity: 'warning',
				category: 'performance',
				message: 'Slow session access times',
				value: metrics.performance.averageAccessTime,
				threshold: 500,
			});
		}

		if (metrics.performance.conflictRate > 0.05) { // 5% conflict rate
			alerts.push({
				severity: 'error',
				category: 'performance',
				message: 'High sync conflict rate',
				value: metrics.performance.conflictRate,
				threshold: 0.05,
			});
		}

		// Privacy alerts
		if (!metrics.privacy.gdprCompliant) {
			alerts.push({
				severity: 'critical',
				category: 'privacy',
				message: 'GDPR compliance issues detected',
				value: 0,
				threshold: 1,
			});
		}

		return alerts;
	}

	private async generateRecommendations(
		metrics: SessionStorageMonitoringMetrics,
		alerts: any[]
	): Promise<Array<{
		priority: 'low' | 'medium' | 'high';
		description: string;
		impact: string;
		implementation: string;
	}>> {
		const recommendations = [];

		// Session recommendations
		if (metrics.sessions.errorRate > 0.05) {
			recommendations.push({
				priority: 'high',
				description: 'High session error rate affecting user experience',
				impact: 'Reduce errors by 50% and improve reliability',
				implementation: 'Add better error handling and validation in session management',
			});
		}

		// Storage recommendations
		if (metrics.storage.quotaUsage > 0.8) {
			recommendations.push({
				priority: 'medium',
				description: 'Storage usage approaching limits',
				impact: 'Prevent storage quota exhaustion and maintain performance',
				implementation: 'Enable compression and implement more aggressive cleanup policies',
			});
		}

		// Performance recommendations
		if (metrics.performance.averageAccessTime > 200) {
			recommendations.push({
				priority: 'medium',
				description: 'Session access times are slower than optimal',
				impact: 'Improve response time by 30-40%',
				implementation: 'Optimize data structures and enable lazy loading',
			});
		}

		// Privacy recommendations
		if (metrics.privacy.consentWithdrawn > metrics.privacy.consentGranted) {
			recommendations.push({
				priority: 'high',
				description: 'More users withdrawing consent than granting it',
				impact: 'Improve user trust and consent rates',
				implementation: 'Review consent presentation and improve privacy communication',
			});
		}

		// General recommendations
		if (alerts.length > 5) {
			recommendations.push({
				priority: 'low',
				description: 'Multiple system alerts detected',
				impact: 'Proactive monitoring and issue resolution',
				implementation: 'Setup automated alerting and escalation procedures',
			});
		}

		return recommendations;
	}

	private notifyListeners(): void {
		this.listeners.forEach(listener => {
			try {
				listener(this.metrics);
			} catch (error) {
				console.error('Error in monitoring listener:', error);
			}
		});
	}
}

// Export singleton instance
export const sessionStorageMonitoring = SessionStorageMonitoring.getInstance();

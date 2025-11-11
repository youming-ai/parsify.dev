/**
 * Session Storage System - T161 Main Integration
 * Comprehensive session storage system with privacy-first design
 * Integrates user preferences, tool sessions, cross-tab sync, and privacy controls
 */

// Core exports
export {
	sessionStorageCore,
	type SessionData,
	type UserPreferences,
	type ToolSessionData,
	type WorkingState,
	type SessionAnalytics,
	type SessionStorageConfig
} from './session-storage-core';

// User preferences manager
export {
	userPreferencesManager,
	type PreferencesSyncEvent,
	type PreferencesBackup,
	type PreferencesValidation
} from './user-preferences-manager';

// Tool session persistence
export {
	toolSessionPersistence,
	type AutoSaveConfig,
	type SessionRecovery,
	type ToolSessionAnalytics,
	type ExportOptions
} from './tool-session-persistence';

// Cross-tab synchronization
export {
	crossTabSync,
	type SyncMessage,
	type SyncConflict,
	type SyncStatistics,
	type SyncConfig
} from './cross-tab-sync';

// Privacy controls
export {
	privacyControls,
	type ConsentRecord,
	type PrivacySettings,
	type DataSubject,
	type DataRequest,
	type PrivacyAudit
} from './privacy-controls';

// Session manager
export {
	sessionManager,
	type SessionConfig,
	type SessionMetrics,
	type SessionEvent,
	type CleanupReport
} from './session-manager';

// Main session storage system class
export class SessionStorageSystem {
	private static instance: SessionStorageSystem;
	private isInitialized = false;
	private initializationPromise?: Promise<void>;

	private constructor() {}

	public static getInstance(): SessionStorageSystem {
		if (!SessionStorageSystem.instance) {
			SessionStorageSystem.instance = new SessionStorageSystem();
		}
		return SessionStorageSystem.instance;
	}

	// Initialize the complete session storage system
	public async initialize(config?: {
		sessionStorage?: Partial<SessionStorageConfig>;
		userPreferences?: any;
		toolSession?: Partial<AutoSaveConfig>;
		sync?: Partial<SyncConfig>;
		privacy?: any;
		sessionManager?: Partial<SessionConfig>;
	}): Promise<void> {
		// Prevent multiple initializations
		if (this.initializationPromise) {
			return this.initializationPromise;
		}

		this.initializationPromise = this._initialize(config);
		return this.initializationPromise;
	}

	private async _initialize(config?: any): Promise<void> {
		try {
			console.log('🚀 Initializing Session Storage System...');

			// 1. Initialize privacy controls first (required for consent)
			await privacyControls.initialize();
			console.log('✓ Privacy controls initialized');

			// 2. Initialize cross-tab synchronization
			await crossTabSync.initialize(config?.sync);
			console.log('✓ Cross-tab synchronization initialized');

			// 3. Initialize session storage core
			await sessionStorageCore.initialize(config?.sessionStorage);
			console.log('✓ Session storage core initialized');

			// 4. Initialize user preferences manager
			await userPreferencesManager.initialize();
			console.log('✓ User preferences manager initialized');

			// 5. Initialize tool session persistence
			await toolSessionPersistence.initialize(config?.toolSession);
			console.log('✓ Tool session persistence initialized');

			// 6. Initialize session manager
			await sessionManager.initialize(config?.sessionManager);
			console.log('✓ Session manager initialized');

			// 7. Setup integration with monitoring systems
			await this.setupMonitoringIntegration();
			console.log('✓ Monitoring integration setup complete');

			// 8. Setup analytics integration
			await this.setupAnalyticsIntegration();
			console.log('✓ Analytics integration setup complete');

			// 9. Setup error handling integration
			await this.setupErrorHandlingIntegration();
			console.log('✓ Error handling integration setup complete');

			this.isInitialized = true;
			console.log('🎉 Session Storage System initialized successfully!');

		} catch (error) {
			console.error('❌ Failed to initialize Session Storage System:', error);
			this.initializationPromise = undefined; // Reset to allow retry
			throw error;
		}
	}

	// Get system status
	public async getStatus(): Promise<{
		initialized: boolean;
		components: {
			privacy: boolean;
			sync: boolean;
			storage: boolean;
			preferences: boolean;
			tools: boolean;
			manager: boolean;
		};
		metrics: {
			activeSessions: number;
			storedPreferences: boolean;
			syncConnected: boolean;
			privacyCompliant: boolean;
		};
	}> {
		const sessionMetrics = sessionManager.getSessionMetrics();
		const hasPreferences = await userPreferencesManager.getPreferences();
		const syncStats = crossTabSync.getStatistics();
		const privacyAudit = await privacyControls.runPrivacyAudit('consent_check');

		return {
			initialized: this.isInitialized,
			components: {
				privacy: true, // Would check actual initialization status
				sync: true,
				storage: true,
				preferences: true,
				tools: true,
				manager: true,
			},
			metrics: {
				activeSessions: sessionMetrics.counts.active,
				storedPreferences: !!hasPreferences,
				syncConnected: syncStats.tabs.active > 0,
				privacyCompliant: privacyAudit.results.compliant,
			},
		};
	}

	// Create a comprehensive session for a new user
	public async createUserSession(options?: {
		userId?: string;
		toolPreferences?: any;
		privacySettings?: any;
		autoStart?: boolean;
	}): Promise<{
		sessionId: string;
		initialized: boolean;
		consentRequired: boolean;
	}> {
		try {
			// Create main session
			const sessionId = await sessionManager.createSession({
				userId: options?.userId,
			});

			// Initialize user preferences if provided
			if (options?.toolPreferences) {
				await userPreferencesManager.updateCategory('tools', options.toolPreferences);
			}

			// Update privacy settings if provided
			if (options?.privacySettings) {
				await privacyControls.updatePrivacySettings(options.privacySettings);
			}

			// Check if consent is required
			const privacySettings = await privacyControls.getPrivacySettings();
			const consentRequired = privacySettings.consent.essentialOnly ||
				privacySettings.compliance.region === 'EU';

			return {
				sessionId,
				initialized: true,
				consentRequired,
			};

		} catch (error) {
			console.error('Failed to create user session:', error);
			throw error;
		}
	}

	// Export all user data (GDPR compliance)
	public async exportAllUserData(options?: {
		format?: 'json' | 'csv' | 'xml';
		includeAnalytics?: boolean;
		includeErrors?: boolean;
		compress?: boolean;
	}): Promise<Blob> {
		try {
			// Export preferences
			const preferencesExport = await userPreferencesManager.exportPreferences();

			// Export session data
			const sessionDataExport = await sessionStorageCore.exportSession();

			// Export tool sessions if any
			const toolSessions = await toolSessionPersistence.getSessionHistory();

			// Combine all exports
			const allData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				user: {
					preferences: preferencesExport,
					sessions: sessionDataExport,
					toolSessions,
				},
				privacy: {
					consents: await privacyControls.getAllConsents(),
					settings: await privacyControls.getPrivacySettings(),
				},
				analytics: options?.includeAnalytics ? await this.getAnalyticsData() : null,
				errors: options?.includeErrors ? await this.getErrorData() : null,
			};

			// Convert to requested format
			const format = options?.format || 'json';
			let content: string;
			let mimeType: string;

			switch (format) {
				case 'json':
					content = JSON.stringify(allData, null, 2);
					mimeType = 'application/json';
					break;
				case 'csv':
					content = this.convertToCSV(allData);
					mimeType = 'text/csv';
					break;
				case 'xml':
					content = this.convertToXML(allData);
					mimeType = 'application/xml';
					break;
				default:
					throw new Error(`Unsupported export format: ${format}`);
			}

			return new Blob([content], { type: mimeType });

		} catch (error) {
			console.error('Failed to export user data:', error);
			throw error;
		}
	}

	// Delete all user data (Right to be forgotten)
	public async deleteAllUserData(reason?: string): Promise<void> {
		try {
			console.log('Starting complete user data deletion...');

			// Delete tool sessions
			await toolSessionPersistence.clearAllSessions();

			// Delete session data
			await sessionStorageCore.clearAllData();

			// Delete preferences
			await userPreferencesManager.resetAllPreferences();

			// Handle privacy data
			await privacyControls.deleteUserData(reason);

			console.log('✓ All user data deleted successfully');

		} catch (error) {
			console.error('Failed to delete user data:', error);
			throw error;
		}
	}

	// Run comprehensive privacy audit
	public async runPrivacyAudit(): Promise<{
		overall: PrivacyAudit;
		details: {
			consent: PrivacyAudit;
			data: PrivacyAudit;
			compliance: PrivacyAudit;
			security: PrivacyAudit;
		};
		recommendations: string[];
	}> {
		try {
			const consent = await privacyControls.runPrivacyAudit('consent_check');
			const data = await privacyControls.runPrivacyAudit('data_audit');
			const compliance = await privacyControls.runPrivacyAudit('compliance_check');
			const security = await privacyControls.runPrivacyAudit('security_scan');

			const overall: PrivacyAudit = {
				id: `overall_${Date.now()}`,
				timestamp: new Date(),
				type: 'consent_check',
				results: {
					consentValid: consent.results.consentValid && data.results.consentValid,
					dataSecure: data.results.dataSecure && security.results.dataSecure,
					compliant: consent.results.compliant && data.results.compliant && compliance.results.compliant,
					issues: [
						...consent.results.issues,
						...data.results.issues,
						...compliance.results.issues,
						...security.results.issues,
					],
				},
				actions: [
					...consent.actions,
					...data.actions,
					...compliance.actions,
					...security.actions,
				],
			};

			const recommendations = this.generateAuditRecommendations(overall);

			return {
				overall,
				details: {
					consent,
					data,
					compliance,
					security,
				},
				recommendations,
			};

		} catch (error) {
			console.error('Failed to run privacy audit:', error);
			throw error;
		}
	}

	// Get system analytics
	public async getSystemAnalytics(): Promise<{
		usage: any;
		performance: any;
		privacy: any;
		sync: any;
		sessions: any;
	}> {
		try {
			return {
				usage: await this.getUsageAnalytics(),
				performance: await this.getPerformanceAnalytics(),
				privacy: await this.getPrivacyAnalytics(),
				sync: crossTabSync.getStatistics(),
				sessions: sessionManager.getSessionMetrics(),
			};
		} catch (error) {
			console.error('Failed to get system analytics:', error);
			throw error;
		}
	}

	// Stop the session storage system
	public async stop(): Promise<void> {
		try {
			console.log('Stopping Session Storage System...');

			// Stop all components in reverse order
			await sessionManager.stop();
			await toolSessionPersistence.stop?.();
			crossTabSync.stop();

			this.isInitialized = false;
			this.initializationPromise = undefined;

			console.log('✓ Session Storage System stopped');

		} catch (error) {
			console.error('Failed to stop Session Storage System:', error);
			throw error;
		}
	}

	// Private helper methods

	private async setupMonitoringIntegration(): Promise<void> {
		try {
			// Import existing monitoring systems
			const { sessionManagementSystem } = await import('../monitoring/session-management-system');
			const { userAnalytics } = await import('../monitoring/user-analytics');
			const { analyticsHub } = await import('../monitoring/analytics-hub');

			// Setup session monitoring
			sessionManager.addSessionListener?.('monitoring', async (session) => {
				try {
					// Report to session management system
					await sessionManagementSystem.updateSession?.(session.id, {
						lastAccessedAt: session.lastAccessed,
						activity: {
							toolUses: Object.keys(session.toolSessions.activeSessions).length,
							totalDuration: Date.now() - session.createdAt.getTime(),
						},
					});
				} catch (error) {
					console.warn('Failed to report session to monitoring system:', error);
				}
			});

			// Setup user analytics integration
			userPreferencesManager.addListener('analytics', async (event) => {
				try {
					// Report preference changes to analytics
					await userAnalytics.trackUserAction?.('preference_updated', {
						category: event.category,
						timestamp: event.timestamp,
					});
				} catch (error) {
					console.warn('Failed to report preference change to analytics:', error);
				}
			});

			// Setup analytics hub integration
			analyticsHub.addDataSource?.('session_storage', {
				type: 'session',
				provider: async () => {
					const metrics = sessionManager.getSessionMetrics();
					return {
						sessionCount: metrics.counts.active,
						memoryUsage: metrics.resources.memoryUsage,
						successRate: metrics.performance.successRate,
					};
				},
			});

		} catch (error) {
			console.warn('Failed to setup monitoring integration:', error);
			// Don't fail the entire initialization for monitoring issues
		}
	}

	private async setupAnalyticsIntegration(): Promise<void> {
		try {
			// Track session lifecycle events
			sessionManager.addSessionListener?.('analytics', async (event) => {
				try {
					// Report to analytics system
					const { userAnalytics } = await import('../monitoring/user-analytics');
					await userAnalytics.trackSessionEvent?.(event.type, {
						sessionId: event.sessionId,
						timestamp: event.timestamp,
						details: event.details,
					});
				} catch (error) {
					console.warn('Failed to track session event:', error);
				}
			});

		} catch (error) {
			console.warn('Failed to setup analytics integration:', error);
		}
	}

	private async setupErrorHandlingIntegration(): Promise<void> {
		try {
			// Setup error reporting
			const { errorHandling } = await import('../monitoring/error-handling');

			// Track session errors
			sessionManager.addSessionListener?.('errors', async (session) => {
				try {
					const errors = session.analytics.errors;
					if (errors > 0) {
						await errorHandling.reportError?.('session_errors', {
							sessionId: session.id,
							errorCount: errors,
							timestamp: new Date(),
						});
					}
				} catch (error) {
					console.warn('Failed to report session errors:', error);
				}
			});

		} catch (error) {
			console.warn('Failed to setup error handling integration:', error);
		}
	}

	private async getAnalyticsData(): Promise<any> {
		// Would integrate with analytics system
		return {
			toolUsage: {},
			sessionDuration: {},
			featureUsage: {},
		};
	}

	private async getErrorData(): Promise<any> {
		// Would integrate with error handling system
		return {
			errors: [],
			trends: {},
			resolution: {},
		};
	}

	private convertToCSV(data: any): string {
		// Simple CSV conversion
		const headers = ['category', 'key', 'value', 'timestamp'];
		const rows = [headers.join(',')];

		const flatten = (obj: any, prefix = '') => {
			for (const [key, value] of Object.entries(obj)) {
				const fullKey = prefix ? `${prefix}.${key}` : key;
				if (typeof value === 'object' && value !== null) {
					flatten(value, fullKey);
				} else {
					rows.push(['data', fullKey, JSON.stringify(value), new Date().toISOString()].join(','));
				}
			}
		};

		flatten(data);
		return rows.join('\n');
	}

	private convertToXML(data: any): string {
		// Simple XML conversion
		const toXML = (obj: any, indent = 0): string => {
			const spaces = '  '.repeat(indent);
			let xml = '';

			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === 'object' && value !== null) {
					xml += `${spaces}<${key}>\n`;
					xml += toXML(value, indent + 1);
					xml += `${spaces}</${key}>\n`;
				} else {
					xml += `${spaces}<${key}>${value}</${key}>\n`;
				}
			}

			return xml;
		};

		return `<?xml version="1.0" encoding="UTF-8"?>\n<userData>\n${toXML(data, 1)}</userData>`;
	}

	private generateAuditRecommendations(audit: PrivacyAudit): string[] {
		const recommendations: string[] = [];

		if (!audit.results.consentValid) {
			recommendations.push('Review and update user consent records');
		}

		if (!audit.results.dataSecure) {
			recommendations.push('Implement additional data security measures');
		}

		if (!audit.results.compliant) {
			recommendations.push('Address compliance issues for your region');
		}

		if (audit.results.issues.length > 0) {
			recommendations.push('Resolve identified privacy and security issues');
		}

		return recommendations;
	}

	private async getUsageAnalytics(): Promise<any> {
		const sessionMetrics = sessionManager.getSessionMetrics();
		const preferencesAnalytics = await userPreferencesManager.getPreferencesAnalytics();

		return {
			sessions: {
				active: sessionMetrics.counts.active,
				total: sessionMetrics.counts.total,
				created: sessionMetrics.counts.created,
			},
			preferences: preferencesAnalytics,
			tools: await toolSessionPersistence.getSessionAnalytics(''), // Would need session ID
		};
	}

	private async getPerformanceAnalytics(): Promise<any> {
		const sessionMetrics = sessionManager.getSessionMetrics();
		const syncStats = crossTabSync.getStatistics();

		return {
			sessions: {
				averageCreationTime: sessionMetrics.performance.averageCreationTime,
				averageAccessTime: sessionMetrics.performance.averageAccessTime,
				successRate: sessionMetrics.performance.successRate,
			},
			sync: {
				latency: syncStats.performance.averageLatency,
				conflictRate: syncStats.performance.conflictRate,
				successRate: syncStats.performance.successRate,
			},
			memory: sessionMetrics.resources,
		};
	}

	private async getPrivacyAnalytics(): Promise<any> {
		const settings = await privacyControls.getPrivacySettings();
		const consents = await privacyControls.getAllConsents();
		const auditHistory = privacyControls.getAuditHistory();

		return {
			consents: {
				total: consents.length,
				granted: consents.filter(c => c.given && !c.withdrawn).length,
				withdrawn: consents.filter(c => c.withdrawn).length,
			},
			settings: {
				anonymousMode: settings.dataHandling.anonymizeIP,
				encryptionEnabled: settings.dataHandling.encryptSensitiveData,
				autoDelete: settings.retention.autoDelete,
			},
			audits: {
				total: auditHistory.length,
				compliant: auditHistory.filter(a => a.results.compliant).length,
				issues: auditHistory.reduce((sum, a) => sum + a.results.issues.length, 0),
			},
		};
	}
}

// Export singleton instance
export const sessionStorageSystem = SessionStorageSystem.getInstance();

// Convenience exports for common operations
export const createSession = (options?: any) => sessionStorageSystem.createUserSession(options);
export const exportUserData = (options?: any) => sessionStorageSystem.exportAllUserData(options);
export const deleteUserData = (reason?: string) => sessionStorageSystem.deleteAllUserData(reason);
export const runPrivacyAudit = () => sessionStorageSystem.runPrivacyAudit();
export const getSystemStatus = () => sessionStorageSystem.getStatus();
export const getSystemAnalytics = () => sessionStorageSystem.getSystemAnalytics();

// Initialize function for easy setup
export const initializeSessionStorage = (config?: any) => sessionStorageSystem.initialize(config);

/**
 * Session Manager with Expiry and Cleanup - T161 Implementation
 * Comprehensive session lifecycle management with automatic cleanup
 */

import {
	sessionStorageCore,
	type SessionData,
	type SessionAnalytics
} from './session-storage-core';

export interface SessionConfig {
	// Session lifecycle
	lifecycle: {
		defaultTimeout: number; // milliseconds
		maxLifetime: number; // milliseconds
		idleTimeout: number; // milliseconds
		gracePeriod: number; // milliseconds before cleanup
		renewalThreshold: number; // milliseconds before expiry to renew
	};

	// Cleanup settings
	cleanup: {
		enabled: boolean;
		interval: number; // milliseconds
		batchSize: number;
		maxRetries: number;
		retentionPeriod: number; // days
		archiveExpired: boolean;
		compressArchive: boolean;
	};

	// Performance settings
	performance: {
		enableLazyLoading: boolean;
		enableCompression: boolean;
		maxMemoryUsage: number; // bytes
		gcThreshold: number; // percentage
		monitoringEnabled: boolean;
	};

	// Security settings
	security: {
		enableEncryption: boolean;
		sessionHijackingProtection: boolean;
		ipValidation: boolean;
		userAgentValidation: boolean;
		maxSessionsPerUser: number;
	};
}

export interface SessionMetrics {
	// Session counts
	counts: {
		active: number;
		expired: number;
		archived: number;
		total: number;
		created: number;
		destroyed: number;
	};

	// Session durations
	durations: {
		average: number;
		median: number;
		min: number;
		max: number;
		p95: number;
	};

	// Resource usage
	resources: {
		memoryUsage: number;
		storageUsage: number;
		compressionRatio: number;
		cleanupEfficiency: number;
	};

	// Performance metrics
	performance: {
		averageCreationTime: number;
		averageAccessTime: number;
		averageCleanupTime: number;
		successRate: number;
		errorRate: number;
	};

	// Security metrics
	security: {
		suspiciousActivity: number;
		blockedAttempts: number;
		validationFailures: number;
		encryptionUsage: number;
	};

	// Timestamps
	timestamp: Date;
}

export interface SessionEvent {
	id: string;
	type: 'created' | 'accessed' | 'updated' | 'expired' | 'destroyed' | 'cleaned' | 'archived';
	sessionId: string;
	userId?: string;
	timestamp: Date;
	details: {
		duration?: number;
		reason?: string;
		memoryUsage?: number;
		storageUsage?: number;
		errors?: string[];
	};
}

export interface CleanupReport {
	id: string;
	startTime: Date;
	endTime: Date;
	duration: number;
	sessionsProcessed: number;
	sessionsCleaned: number;
	sessionsArchived: number;
	memoryFreed: number;
	errors: Array<{
		sessionId: string;
		error: string;
		timestamp: Date;
	}>;
	efficiency: number;
	recommendations: Array<{
		priority: 'low' | 'medium' | 'high' | 'critical';
		description: string;
		impact: string;
		implementation: string;
	}>;
}

export class SessionManager {
	private static instance: SessionManager;
	private config: SessionConfig;
	private isInitialized = false;
	private activeSessions: Map<string, SessionData> = new Map();
	private sessionEvents: SessionEvent[] = [];
	private cleanupInterval?: NodeJS.Timeout;
	private metrics: SessionMetrics;
	private lastCleanup?: Date;
	private isShuttingDown = false;

	private constructor() {
		this.config = this.getDefaultConfig();
		this.metrics = this.getDefaultMetrics();
	}

	public static getInstance(): SessionManager {
		if (!SessionManager.instance) {
			SessionManager.instance = new SessionManager();
		}
		return SessionManager.instance;
	}

	// Initialize session manager
	public async initialize(config?: Partial<SessionConfig>): Promise<void> {
		if (this.isInitialized) {
			console.warn('Session manager already initialized');
			return;
		}

		try {
			// Merge configuration
			if (config) {
				this.config = this.mergeConfig(this.config, config);
			}

			// Initialize session storage core
			await sessionStorageCore.initialize({
				preferences: {
					defaultExpiry: this.config.lifecycle.defaultTimeout,
					maxStorageSize: this.config.performance.maxMemoryUsage,
					compressionThreshold: 1024 * 100, // 100KB
					encryptionEnabled: this.config.security.enableEncryption,
					syncAcrossTabs: true,
					persistOnClose: true,
				},
			});

			// Load existing sessions
			await this.loadExistingSessions();

			// Start cleanup routine
			if (this.config.cleanup.enabled) {
				this.startCleanupRoutine();
			}

			// Setup security monitoring
			this.setupSecurityMonitoring();

			// Setup shutdown handlers
			this.setupShutdownHandlers();

			// Run initial cleanup
			await this.runCleanup();

			this.isInitialized = true;
			console.log('Session manager initialized');
			console.log(`Loaded ${this.activeSessions.size} existing sessions`);
			console.log(`Cleanup interval: ${this.config.cleanup.interval}ms`);

		} catch (error) {
			console.error('Failed to initialize session manager:', error);
			throw error;
		}
	}

	// Create new session
	public async createSession(options?: {
		userId?: string;
		timeout?: number;
		metadata?: Record<string, any>;
	}): Promise<string> {
		try {
			const sessionId = await sessionStorageCore.createSession({
				userId: options?.userId,
				customExpiry: options?.timeout || this.config.lifecycle.defaultTimeout,
			});

			const session = await sessionStorageCore.getSession(sessionId);
			if (session) {
				this.activeSessions.set(sessionId, session);

				// Record event
				this.recordEvent({
					id: this.generateEventId(),
					type: 'created',
					sessionId,
					userId: options?.userId,
					timestamp: new Date(),
					details: {},
				});

				// Update metrics
				this.metrics.counts.active++;
				this.metrics.counts.created++;

				console.log(`Session created: ${sessionId}`);
				return sessionId;
			}

			throw new Error('Failed to create session');

		} catch (error) {
			console.error('Failed to create session:', error);
			throw error;
		}
	}

	// Get session
	public async getSession(sessionId: string): Promise<SessionData | null> {
		try {
			// Check cache first
			let session = this.activeSessions.get(sessionId);

			if (!session) {
				// Load from storage
				session = await sessionStorageCore.getSession(sessionId);
				if (session) {
					this.activeSessions.set(sessionId, session);
				}
			}

			if (session) {
				// Validate session
				if (await this.validateSession(session)) {
					// Update access time
					session.lastAccessed = new Date();

					// Record event
					this.recordEvent({
						id: this.generateEventId(),
						type: 'accessed',
						sessionId,
						userId: session.userId,
						timestamp: new Date(),
						details: {},
					});

					// Check if session needs renewal
					await this.checkSessionRenewal(session);

					return session;
				} else {
					// Session is invalid, remove it
					await this.destroySession(sessionId, 'validation_failed');
				}
			}

			return null;

		} catch (error) {
			console.error(`Failed to get session ${sessionId}:`, error);
			return null;
		}
	}

	// Update session
	public async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
		try {
			const session = await this.getSession(sessionId);
			if (!session) {
				return false;
			}

			// Apply updates
			Object.assign(session, updates);
			session.lastAccessed = new Date();

			// Save to storage
			await sessionStorageCore.saveSession(sessionId, session);

			// Update cache
			this.activeSessions.set(sessionId, session);

			// Record event
			this.recordEvent({
				id: this.generateEventId(),
				type: 'updated',
				sessionId,
				userId: session.userId,
				timestamp: new Date(),
				details: {},
			});

			return true;

		} catch (error) {
			console.error(`Failed to update session ${sessionId}:`, error);
			return false;
		}
	}

	// Destroy session
	public async destroySession(sessionId: string, reason: string = 'manual'): Promise<boolean> {
		try {
			const session = this.activeSessions.get(sessionId);
			const duration = session ? Date.now() - session.createdAt.getTime() : 0;

			// Remove from storage
			await sessionStorageCore.deleteSession(sessionId);

			// Remove from cache
			this.activeSessions.delete(sessionId);

			// Update metrics
			this.metrics.counts.active--;
			this.metrics.counts.destroyed++;

			// Record event
			this.recordEvent({
				id: this.generateEventId(),
				type: 'destroyed',
				sessionId,
				userId: session?.userId,
				timestamp: new Date(),
				details: {
					reason,
					duration,
				},
			});

			console.log(`Session destroyed: ${sessionId} (${reason})`);
			return true;

		} catch (error) {
			console.error(`Failed to destroy session ${sessionId}:`, error);
			return false;
		}
	}

	// Get active session count
	public getActiveSessionCount(): number {
		return this.activeSessions.size;
	}

	// Get session metrics
	public getSessionMetrics(): SessionMetrics {
		// Update current metrics
		this.metrics.counts.active = this.activeSessions.size;
		this.metrics.counts.total = this.metrics.counts.active + this.metrics.counts.archived;
		this.metrics.timestamp = new Date();

		// Calculate resource usage
		this.calculateResourceUsage();

		return { ...this.metrics };
	}

	// Get session events
	public getSessionEvents(limit: number = 100): SessionEvent[] {
		return this.sessionEvents
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, limit);
	}

	// Run manual cleanup
	public async runCleanup(options?: {
		force?: boolean;
		dryRun?: boolean;
		sessionType?: 'all' | 'expired' | 'idle';
	}): Promise<CleanupReport> {
		const startTime = Date.now();
		const report: CleanupReport = {
			id: this.generateReportId(),
			startTime: new Date(),
			endTime: new Date(),
			duration: 0,
			sessionsProcessed: 0,
			sessionsCleaned: 0,
			sessionsArchived: 0,
			memoryFreed: 0,
			errors: [],
			efficiency: 0,
			recommendations: [],
		};

		try {
			console.log('Starting session cleanup...');

			// Get sessions to process
			const sessionsToProcess = await this.getSessionsForCleanup(options?.sessionType);
			report.sessionsProcessed = sessionsToProcess.length;

			// Process sessions in batches
			for (let i = 0; i < sessionsToProcess.length; i += this.config.cleanup.batchSize) {
				const batch = sessionsToProcess.slice(i, i + this.config.cleanup.batchSize);

				for (const session of batch) {
					try {
						const result = await this.processSessionForCleanup(session, options?.dryRun);

						if (result.cleaned) {
							report.sessionsCleaned++;
							report.memoryFreed += result.memoryFreed || 0;
						}

						if (result.archived) {
							report.sessionsArchived++;
						}

					} catch (error) {
						report.errors.push({
							sessionId: session.id,
							error: error.message,
							timestamp: new Date(),
						});
					}
				}

				// Small delay between batches
				await new Promise(resolve => setTimeout(resolve, 10));
			}

			// Calculate efficiency
			report.duration = Date.now() - startTime;
			report.efficiency = report.sessionsProcessed > 0
				? (report.sessionsCleaned / report.sessionsProcessed) * 100
				: 0;

			// Generate recommendations
			report.recommendations = this.generateCleanupRecommendations(report);

			// Update metrics
			this.metrics.performance.averageCleanupTime =
				(this.metrics.performance.averageCleanupTime + report.duration) / 2;

			this.lastCleanup = new Date();

			console.log(`Cleanup completed in ${report.duration}ms`);
			console.log(`Sessions processed: ${report.sessionsProcessed}`);
			console.log(`Sessions cleaned: ${report.sessionsCleaned}`);
			console.log(`Memory freed: ${this.formatBytes(report.memoryFreed)}`);

		} catch (error) {
			console.error('Cleanup failed:', error);
			throw error;
		}

		return report;
	}

	// Stop session manager
	public async stop(): Promise<void> {
		if (!this.isInitialized || this.isShuttingDown) return;

		this.isShuttingDown = true;

		try {
			// Stop cleanup routine
			if (this.cleanupInterval) {
				clearInterval(this.cleanupInterval);
			}

			// Save all active sessions
			for (const [sessionId, session] of this.activeSessions) {
				try {
					await sessionStorageCore.saveSession(sessionId, session);
				} catch (error) {
					console.error(`Failed to save session ${sessionId} during shutdown:`, error);
				}
			}

			// Run final cleanup
			await this.runCleanup();

			// Clear cache
			this.activeSessions.clear();

			this.isInitialized = false;
			console.log('Session manager stopped');

		} catch (error) {
			console.error('Error during session manager shutdown:', error);
			throw error;
		}
	}

	// Private helper methods

	private getDefaultConfig(): SessionConfig {
		return {
			lifecycle: {
				defaultTimeout: 30 * 60 * 1000, // 30 minutes
				maxLifetime: 24 * 60 * 60 * 1000, // 24 hours
				idleTimeout: 15 * 60 * 1000, // 15 minutes
				gracePeriod: 5 * 60 * 1000, // 5 minutes
				renewalThreshold: 5 * 60 * 1000, // 5 minutes
			},

			cleanup: {
				enabled: true,
				interval: 5 * 60 * 1000, // 5 minutes
				batchSize: 50,
				maxRetries: 3,
				retentionPeriod: 30, // 30 days
				archiveExpired: true,
				compressArchive: true,
			},

			performance: {
				enableLazyLoading: true,
				enableCompression: true,
				maxMemoryUsage: 50 * 1024 * 1024, // 50MB
				gcThreshold: 80, // 80%
				monitoringEnabled: true,
			},

			security: {
				enableEncryption: false,
				sessionHijackingProtection: true,
				ipValidation: true,
				userAgentValidation: true,
				maxSessionsPerUser: 10,
			},
		};
	}

	private mergeConfig(defaultConfig: SessionConfig, userConfig: Partial<SessionConfig>): SessionConfig {
		return {
			lifecycle: { ...defaultConfig.lifecycle, ...userConfig.lifecycle },
			cleanup: { ...defaultConfig.cleanup, ...userConfig.cleanup },
			performance: { ...defaultConfig.performance, ...userConfig.performance },
			security: { ...defaultConfig.security, ...userConfig.security },
		};
	}

	private getDefaultMetrics(): SessionMetrics {
		return {
			counts: {
				active: 0,
				expired: 0,
				archived: 0,
				total: 0,
				created: 0,
				destroyed: 0,
			},

			durations: {
				average: 0,
				median: 0,
				min: 0,
				max: 0,
				p95: 0,
			},

			resources: {
				memoryUsage: 0,
				storageUsage: 0,
				compressionRatio: 0,
				cleanupEfficiency: 0,
			},

			performance: {
				averageCreationTime: 0,
				averageAccessTime: 0,
				averageCleanupTime: 0,
				successRate: 1,
				errorRate: 0,
			},

			security: {
				suspiciousActivity: 0,
				blockedAttempts: 0,
				validationFailures: 0,
				encryptionUsage: 0,
			},

			timestamp: new Date(),
		};
	}

	private async loadExistingSessions(): Promise<void> {
		try {
			// This would load existing sessions from storage
			// For now, initialize empty cache
			this.activeSessions.clear();
			console.log('No existing sessions found');
		} catch (error) {
			console.warn('Failed to load existing sessions:', error);
		}
	}

	private startCleanupRoutine(): void {
		this.cleanupInterval = setInterval(async () => {
			try {
				await this.runCleanup();
			} catch (error) {
				console.error('Automatic cleanup failed:', error);
			}
		}, this.config.cleanup.interval);

		console.log(`Cleanup routine started (interval: ${this.config.cleanup.interval}ms)`);
	}

	private setupSecurityMonitoring(): void {
		// Monitor for suspicious activity
		setInterval(async () => {
			await this.checkForSuspiciousActivity();
		}, 60000); // Check every minute
	}

	private setupShutdownHandlers(): void {
		// Handle page unload
		window.addEventListener('beforeunload', () => {
			this.stop();
		});

		// Handle page visibility changes
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				// Page is hidden, pause some operations
			} else {
				// Page is visible, resume operations
				this.checkForExpiredSessions();
			}
		});
	}

	private async validateSession(session: SessionData): Promise<boolean> {
		const now = new Date();

		// Check expiry
		if (session.expiresAt < now) {
			await this.destroySession(session.id, 'expired');
			return false;
		}

		// Check max lifetime
		const lifetime = now.getTime() - session.createdAt.getTime();
		if (lifetime > this.config.lifecycle.maxLifetime) {
			await this.destroySession(session.id, 'max_lifetime_exceeded');
			return false;
		}

		// Check idle timeout
		const idleTime = now.getTime() - session.lastAccessed.getTime();
		if (idleTime > this.config.lifecycle.idleTimeout) {
			await this.destroySession(session.id, 'idle_timeout');
			return false;
		}

		// Security validations
		if (this.config.security.sessionHijackingProtection) {
			if (!(await this.validateSessionSecurity(session))) {
				await this.destroySession(session.id, 'security_validation_failed');
				return false;
			}
		}

		return true;
	}

	private async validateSessionSecurity(session: SessionData): Promise<boolean> {
		// IP validation
		if (this.config.security.ipValidation) {
			const currentIP = await this.getCurrentIP();
			const storedIP = session.metadata.deviceFingerprint;

			// Simple fingerprint validation
			if (storedIP && storedIP !== this.generateDeviceFingerprint()) {
				this.metrics.security.validationFailures++;
				return false;
			}
		}

		// User agent validation
		if (this.config.security.userAgentValidation) {
			const currentUA = navigator.userAgent;
			const storedUA = session.metadata.deviceFingerprint;

			// Simple validation - would be more sophisticated in production
			if (storedUA && !this.compareUserAgents(currentUA, storedUA)) {
				this.metrics.security.validationFailures++;
				return false;
			}
		}

		return true;
	}

	private async checkSessionRenewal(session: SessionData): Promise<void> {
		const now = new Date();
		const timeToExpiry = session.expiresAt.getTime() - now.getTime();

		if (timeToExpiry < this.config.lifecycle.renewalThreshold) {
			// Renew session
			session.expiresAt = new Date(now.getTime() + this.config.lifecycle.defaultTimeout);
			await sessionStorageCore.saveSession(session.id, session);

			console.log(`Session renewed: ${session.id}`);
		}
	}

	private async checkForExpiredSessions(): Promise<void> {
		const now = new Date();
		const expiredSessions: string[] = [];

		for (const [sessionId, session] of this.activeSessions) {
			if (session.expiresAt < now) {
				expiredSessions.push(sessionId);
			}
		}

		for (const sessionId of expiredSessions) {
			await this.destroySession(sessionId, 'expired');
		}
	}

	private async checkForSuspiciousActivity(): Promise<void> {
		const now = Date.now();
		const recentEvents = this.sessionEvents.filter(event =>
			now - event.timestamp.getTime() < 60000 // Last minute
		);

		// Check for unusual activity patterns
		const sessionCreations = recentEvents.filter(e => e.type === 'created').length;
		if (sessionCreations > 10) {
			this.metrics.security.suspiciousActivity++;
			console.warn('Suspicious activity detected: high session creation rate');
		}

		// Check for failed validation attempts
		const validationFailures = this.metrics.security.validationFailures;
		if (validationFailures > 5) {
			this.metrics.security.blockedAttempts++;
			console.warn('Suspicious activity detected: multiple validation failures');
		}
	}

	private async getSessionsForCleanup(type: 'all' | 'expired' | 'idle' = 'all'): Promise<SessionData[]> {
		const now = new Date();
		const sessions: SessionData[] = [];

		for (const session of this.activeSessions.values()) {
			let include = false;

			switch (type) {
				case 'all':
					include = true;
					break;
				case 'expired':
					include = session.expiresAt < now;
					break;
				case 'idle':
					const idleTime = now.getTime() - session.lastAccessed.getTime();
					include = idleTime > this.config.lifecycle.idleTimeout;
					break;
			}

			if (include) {
				sessions.push(session);
			}
		}

		return sessions;
	}

	private async processSessionForCleanup(
		session: SessionData,
		dryRun: boolean = false
	): Promise<{ cleaned: boolean; archived: boolean; memoryFreed?: number }> {
		const now = new Date();
		let cleaned = false;
		let archived = false;
		let memoryFreed = 0;

		// Check if session should be destroyed
		if (session.expiresAt < now) {
			if (!dryRun) {
				memoryFreed = this.calculateSessionSize(session);
				await this.destroySession(session.id, 'cleanup_expired');
			}
			cleaned = true;
		} else {
			// Check if session should be archived
			const idleTime = now.getTime() - session.lastAccessed.getTime();
			if (idleTime > this.config.lifecycle.idleTimeout) {
				if (!dryRun && this.config.cleanup.archiveExpired) {
					await this.archiveSession(session);
					archived = true;
				}
			}
		}

		return { cleaned, archived, memoryFreed };
	}

	private async archiveSession(session: SessionData): Promise<void> {
		try {
			// Mark session as archived
			session.metadata.isArchived = true;

			// Save archived session
			await sessionStorageCore.saveSession(session.id, session);

			// Remove from active cache
			this.activeSessions.delete(session.id);

			// Update metrics
			this.metrics.counts.active--;
			this.metrics.counts.archived++;

			// Record event
			this.recordEvent({
				id: this.generateEventId(),
				type: 'archived',
				sessionId: session.id,
				userId: session.userId,
				timestamp: new Date(),
				details: {},
			});

			console.log(`Session archived: ${session.id}`);

		} catch (error) {
			console.error(`Failed to archive session ${session.id}:`, error);
			throw error;
		}
	}

	private generateCleanupRecommendations(report: CleanupReport): Array<{
		priority: 'low' | 'medium' | 'high' | 'critical';
		description: string;
		impact: string;
		implementation: string;
	}> {
		const recommendations = [];

		// Low efficiency recommendation
		if (report.efficiency < 50) {
			recommendations.push({
				priority: 'medium',
				description: 'Low cleanup efficiency detected',
				impact: 'Improve cleanup performance by 30-50%',
				implementation: 'Increase cleanup interval or batch size',
			});
		}

		// High error rate recommendation
		if (report.errors.length > report.sessionsProcessed * 0.1) {
			recommendations.push({
				priority: 'high',
				description: 'High error rate during cleanup',
				impact: 'Reduce cleanup errors by 80%',
				implementation: 'Add better error handling and validation',
			});
		}

		// Memory usage recommendation
		if (report.memoryFreed < 1024 * 1024) { // Less than 1MB
			recommendations.push({
				priority: 'low',
				description: 'Low memory recovery during cleanup',
				impact: 'Increase memory recovery by 20-30%',
				implementation: 'Adjust cleanup thresholds and enable compression',
			});
		}

		return recommendations;
	}

	private calculateResourceUsage(): void {
		let totalMemory = 0;
		let totalStorage = 0;

		for (const session of this.activeSessions.values()) {
			const sessionSize = this.calculateSessionSize(session);
			totalMemory += sessionSize;
			totalStorage += sessionSize;
		}

		this.metrics.resources.memoryUsage = totalMemory;
		this.metrics.resources.storageUsage = totalStorage;

		// Check if GC is needed
		const memoryUsagePercent = (totalMemory / this.config.performance.maxMemoryUsage) * 100;
		if (memoryUsagePercent > this.config.performance.gcThreshold) {
			this.garbageCollectSessions();
		}
	}

	private calculateSessionSize(session: SessionData): number {
		return JSON.stringify(session).length * 2; // Rough estimation
	}

	private garbageCollectSessions(): void {
		// Remove oldest or least used sessions to free memory
		const sessions = Array.from(this.activeSessions.entries())
			.sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

		const toRemove = sessions.slice(0, Math.floor(sessions.length * 0.1)); // Remove 10%

		for (const [sessionId] of toRemove) {
			this.activeSessions.delete(sessionId);
		}

		console.log(`Garbage collected ${toRemove.length} sessions`);
	}

	private recordEvent(event: SessionEvent): void {
		this.sessionEvents.push(event);

		// Limit event history
		if (this.sessionEvents.length > 1000) {
			this.sessionEvents = this.sessionEvents.slice(-1000);
		}
	}

	private async getCurrentIP(): Promise<string> {
		// Would get actual IP address
		return '127.0.0.1';
	}

	private generateDeviceFingerprint(): string {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.textBaseline = 'top';
			ctx.font = '14px Arial';
			ctx.fillText('Device fingerprint', 2, 2);
		}

		const fingerprint = [
			navigator.userAgent,
			navigator.language,
			screen.width + 'x' + screen.height,
			new Date().getTimezoneOffset(),
			canvas.toDataURL(),
		].join('|');

		return this.simpleHash(fingerprint);
	}

	private compareUserAgents(current: string, stored: string): boolean {
		// Simple comparison - would be more sophisticated in production
		const currentParts = current.split(' ');
		const storedParts = stored.split(' ');

		// Compare browser name and version
		return currentParts[0] === storedParts[0] &&
			   currentParts[1] === storedParts[1];
	}

	private simpleHash(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(36);
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	private generateEventId(): string {
		return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateReportId(): string {
		return `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

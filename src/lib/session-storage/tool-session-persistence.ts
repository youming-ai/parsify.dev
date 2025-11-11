/**
 * Tool Session Persistence - T161 Implementation
 * Manages tool session data persistence with auto-save and recovery
 */

import {
	sessionStorageCore,
	type ToolSession,
	type ToolSessionData,
	type ToolInteraction,
	type ToolError,
	type ToolSessionHistoryEntry
} from './session-storage-core';

export interface AutoSaveConfig {
	enabled: boolean;
	interval: number; // milliseconds
	debounceMs: number;
	maxHistory: number;
	compressLargeData: boolean;
	encryptionEnabled: boolean;
	persistOnError: boolean;
}

export interface SessionRecovery {
	sessionId: string;
	toolId: string;
	recoveredAt: Date;
	data: any;
	metadata: {
		crashDetected: boolean;
		autoSaveEnabled: boolean;
		lastSaveAt?: Date;
		saveCount: number;
		dataIntegrity: 'intact' | 'partial' | 'corrupted';
	};
}

export interface ToolSessionAnalytics {
	sessionId: string;
	toolId: string;
	createdAt: Date;
	lastAccessed: Date;

	// Usage metrics
	usage: {
		totalTime: number;
		activeTime: number;
		idleTime: number;
		interactions: number;
		executions: number;
		errors: number;
		successRate: number;
	};

	// Performance metrics
	performance: {
		averageLoadTime: number;
		averageProcessTime: number;
		averageSaveTime: number;
		memoryUsage: number;
		dataSize: number;
	};

	// Feature usage
	features: Record<string, {
		usageCount: number;
		lastUsed: Date;
		effectiveness: number; // 0-1
	}>;

	// Error analysis
	errors: Array<{
		type: string;
		count: number;
		firstOccurred: Date;
		lastOccurred: Date;
		resolved: boolean;
	}>;
}

export interface ExportOptions {
	format: 'json' | 'csv' | 'xml' | 'yaml';
	includeHistory: boolean;
	includeAnalytics: boolean;
	includeErrors: boolean;
	compressOutput: boolean;
	encryptSensitive: boolean;
}

export class ToolSessionPersistence {
	private static instance: ToolSessionPersistence;
	private autoSaveIntervals: Map<string, NodeJS.Timeout> = new Map();
	private autoSaveDebouncers: Map<string, NodeJS.Timeout> = new Map();
	private sessionListeners: Map<string, Set<(session: ToolSession) => void>> = new Map();
	private recoveryCache: Map<string, SessionRecovery> = new Map();
	private config: AutoSaveConfig;

	private constructor() {
		this.config = this.getDefaultConfig();
	}

	public static getInstance(): ToolSessionPersistence {
		if (!ToolSessionPersistence.instance) {
			ToolSessionPersistence.instance = new ToolSessionPersistence();
		}
		return ToolSessionPersistence.instance;
	}

	// Initialize tool session persistence
	public async initialize(config?: Partial<AutoSaveConfig>): Promise<void> {
		try {
			// Merge configuration
			if (config) {
				this.config = { ...this.config, ...config };
			}

			// Ensure session storage is initialized
			await sessionStorageCore.initialize();

			// Setup crash detection
			this.setupCrashDetection();

			// Recover any interrupted sessions
			await this.recoverInterruptedSessions();

			console.log('Tool session persistence initialized');
			console.log(`Auto-save: ${this.config.enabled ? 'enabled' : 'disabled'}`);
			if (this.config.enabled) {
				console.log(`Auto-save interval: ${this.config.interval}ms`);
			}

		} catch (error) {
			console.error('Failed to initialize tool session persistence:', error);
			throw error;
		}
	}

	// Create new tool session
	public async createSession(
		toolId: string,
		options?: {
			title?: string;
			description?: string;
			initialData?: any;
			config?: Record<string, any>;
			autoSave?: boolean;
		}
	): Promise<string> {
		const sessionId = this.generateSessionId();
		const now = new Date();

		const session: ToolSession = {
			id: sessionId,
			toolId,
			toolCategory: this.getToolCategory(toolId),
			createdAt: now,
			lastAccessed: now,
			data: options?.initialData || null,
			input: '',
			output: '',
			config: options?.config || {},
			interactions: [],
			errors: [],
			autoSave: options?.autoSave ?? this.config.enabled,
			autoSaveInterval: this.config.interval,
			persistOutput: true,
			persistConfig: true,
			metadata: {
				version: '1.0.0',
				title: options?.title,
				description: options?.description,
				tags: [],
				isFavorite: false,
				isArchived: false,
				size: 0,
			},
		};

		// Save session
		await this.saveSession(session);

		// Start auto-save if enabled
		if (session.autoSave) {
			this.startAutoSave(sessionId);
		}

		// Add to history
		await this.addToHistory(session);

		console.log(`Created tool session: ${sessionId} for tool: ${toolId}`);
		return sessionId;
	}

	// Get tool session
	public async getSession(sessionId: string): Promise<ToolSession | null> {
		try {
			return await sessionStorageCore.getToolSession(sessionId);
		} catch (error) {
			console.error(`Failed to get tool session ${sessionId}:`, error);
			return null;
		}
	}

	// Save tool session
	public async saveSession(session: ToolSession, options?: {
		immediate?: boolean;
		silent?: boolean;
		force?: boolean;
	}): Promise<void> {
		try {
			// Update last accessed
			session.lastAccessed = new Date();

			// Calculate session size
			session.metadata.size = this.calculateSessionSize(session);

			// Save to storage
			await sessionStorageCore.saveToolSession(session.toolId, session);

			// Add to history if not silent
			if (!options?.silent) {
				await this.addToHistory(session);
			}

			// Notify listeners
			this.notifyListeners(session.toolId, session);

			// Update recovery cache
			if (!options?.silent) {
				this.updateRecoveryCache(session);
			}

		} catch (error) {
			console.error(`Failed to save tool session ${session.id}:`, error);

			// Persist on error if enabled
			if (this.config.persistOnError && !options?.force) {
				await this.persistOnError(session, error);
			}

			throw error;
		}
	}

	// Update tool session data
	public async updateSessionData(
		sessionId: string,
		updates: {
			data?: any;
			input?: string;
			output?: string;
			config?: Record<string, any>;
		},
		options?: {
			immediate?: boolean;
			silent?: boolean;
		}
	): Promise<void> {
		const session = await this.getSession(sessionId);
		if (!session) {
			throw new Error(`Tool session not found: ${sessionId}`);
		}

		// Apply updates
		if (updates.data !== undefined) session.data = updates.data;
		if (updates.input !== undefined) session.input = updates.input;
		if (updates.output !== undefined) session.output = updates.output;
		if (updates.config !== undefined) session.config = { ...session.config, ...updates.config };

		// Add interaction
		session.interactions.push({
			id: this.generateInteractionId(),
			timestamp: new Date(),
			type: 'input',
			details: {
				action: 'session_update',
				beforeValue: undefined,
				afterValue: updates.data,
				result: 'success',
			},
		});

		// Save session
		await this.saveSession(session, options);
	}

	// Record tool interaction
	public async recordInteraction(
		sessionId: string,
		interaction: Omit<ToolInteraction, 'id' | 'timestamp'>
	): Promise<void> {
		const session = await this.getSession(sessionId);
		if (!session) {
			console.warn(`Cannot record interaction for non-existent session: ${sessionId}`);
			return;
		}

		const fullInteraction: ToolInteraction = {
			...interaction,
			id: this.generateInteractionId(),
			timestamp: new Date(),
		};

		// Add to session
		session.interactions.push(fullInteraction);

		// Limit interactions history
		if (session.interactions.length > this.config.maxHistory) {
			session.interactions = session.interactions.slice(-this.config.maxHistory);
		}

		// Update analytics
		await this.updateSessionAnalytics(session, fullInteraction);

		// Debounced save
		this.debouncedSave(session.id, session);
	}

	// Record tool error
	public async recordError(
		sessionId: string,
		error: Omit<ToolError, 'id' | 'timestamp' | 'resolved'>
	): Promise<void> {
		const session = await this.getSession(sessionId);
		if (!session) {
			console.warn(`Cannot record error for non-existent session: ${sessionId}`);
			return;
		}

		const fullError: ToolError = {
			...error,
			id: this.generateErrorId(),
			timestamp: new Date(),
			resolved: false,
		};

		// Add to session
		session.errors.push(fullError);

		// Limit errors history
		if (session.errors.length > 100) {
			session.errors = session.errors.slice(-100);
		}

		// Save immediately for errors
		await this.saveSession(session, { immediate: true, silent: true });
	}

	// Resolve tool error
	public async resolveError(sessionId: string, errorId: string): Promise<void> {
		const session = await this.getSession(sessionId);
		if (!session) {
			throw new Error(`Tool session not found: ${sessionId}`);
		}

		const error = session.errors.find(e => e.id === errorId);
		if (error) {
			error.resolved = true;
			await this.saveSession(session, { silent: true });
		}
	}

	// Delete tool session
	public async deleteSession(sessionId: string, options?: {
		permanent?: boolean;
		archive?: boolean;
	}): Promise<void> {
		const session = await this.getSession(sessionId);
		if (!session) {
			console.warn(`Tool session not found for deletion: ${sessionId}`);
			return;
		}

		// Stop auto-save
		this.stopAutoSave(sessionId);

		// Clear debounced save
		const debouncer = this.autoSaveDebouncers.get(sessionId);
		if (debouncer) {
			clearTimeout(debouncer);
			this.autoSaveDebouncers.delete(sessionId);
		}

		// Archive instead of delete if requested
		if (options?.archive) {
			session.metadata.isArchived = true;
			await this.saveSession(session, { immediate: true, silent: true });
		} else {
			// Remove from storage
			const sessionData = await sessionStorageCore.getSession();
			if (sessionData) {
				delete sessionData.toolSessions.activeSessions[session.toolId];
				await sessionStorageCore.saveSession(sessionData.id, sessionData);
			}
		}

		// Clear listeners
		this.sessionListeners.delete(sessionId);

		// Remove from recovery cache
		this.recoveryCache.delete(sessionId);

		console.log(`Deleted tool session: ${sessionId}`);
	}

	// Export tool session
	public async exportSession(
		sessionId: string,
		options: ExportOptions
	): Promise<string | Blob> {
		const session = await this.getSession(sessionId);
		if (!session) {
			throw new Error(`Tool session not found: ${sessionId}`);
		}

		const exportData: any = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			session: {
				id: session.id,
				toolId: session.toolId,
				toolCategory: session.toolCategory,
				createdAt: session.createdAt,
				lastAccessed: session.lastAccessed,
				data: session.data,
				input: session.input,
				output: session.output,
				config: session.config,
				metadata: session.metadata,
			},
		};

		// Include optional data
		if (options.includeHistory) {
			exportData.history = session.interactions;
		}

		if (options.includeAnalytics) {
			exportData.analytics = await this.getSessionAnalytics(sessionId);
		}

		if (options.includeErrors) {
			exportData.errors = session.errors;
		}

		// Convert to requested format
		switch (options.format) {
			case 'json':
				return JSON.stringify(exportData, null, 2);

			case 'csv':
				return this.convertToCSV(exportData);

			case 'xml':
				return this.convertToXML(exportData);

			case 'yaml':
				return this.convertToYAML(exportData);

			default:
				throw new Error(`Unsupported export format: ${options.format}`);
		}
	}

	// Import tool session
	public async importSession(
		data: string,
		options?: {
			merge?: boolean;
			preserveExisting?: boolean;
		}
	): Promise<string> {
		try {
			const importData = JSON.parse(data);

			if (!importData.session) {
				throw new Error('Invalid import data format');
			}

			const importedSession = importData.session;

			// Create new session
			const sessionId = await this.createSession(
				importedSession.toolId,
				{
					title: importedSession.metadata?.title,
					description: importedSession.metadata?.description,
					initialData: importedSession.data,
					config: importedSession.config,
				}
			);

			// Update session with imported data
			const session = await this.getSession(sessionId);
			if (session) {
				session.input = importedSession.input || '';
				session.output = importedSession.output || '';

				if (options?.merge && importData.history) {
					session.interactions = [
						...session.interactions,
						...importData.history,
					].slice(-this.config.maxHistory);
				}

				if (importData.errors) {
					session.errors.push(...importData.errors);
				}

				await this.saveSession(session, { immediate: true });
			}

			console.log(`Imported tool session: ${sessionId}`);
			return sessionId;

		} catch (error) {
			console.error('Failed to import tool session:', error);
			throw error;
		}
	}

	// Get session analytics
	public async getSessionAnalytics(sessionId: string): Promise<ToolSessionAnalytics | null> {
		const session = await this.getSession(sessionId);
		if (!session) return null;

		const now = new Date();
		const totalTime = now.getTime() - session.createdAt.getTime();

		// Calculate usage metrics
		const executions = session.interactions.filter(i => i.type === 'execute').length;
		const errors = session.errors.filter(e => !e.resolved).length;
		const successRate = executions > 0 ? (executions - errors) / executions : 1;

		// Analyze errors
		const errorAnalysis = session.errors.reduce((acc, error) => {
			const key = error.type;
			if (!acc[key]) {
				acc[key] = {
					type: key,
					count: 0,
					firstOccurred: error.timestamp,
					lastOccurred: error.timestamp,
					resolved: error.resolved,
				};
			}
			acc[key].count++;
			if (error.timestamp > acc[key].lastOccurred) {
				acc[key].lastOccurred = error.timestamp;
			}
			return acc;
		}, {} as Record<string, any>);

		return {
			sessionId,
			toolId: session.toolId,
			createdAt: session.createdAt,
			lastAccessed: session.lastAccessed,

			usage: {
				totalTime,
				activeTime: totalTime * 0.7, // Estimate
				idleTime: totalTime * 0.3, // Estimate
				interactions: session.interactions.length,
				executions,
				errors,
				successRate,
			},

			performance: {
				averageLoadTime: 0, // Would track actual load times
				averageProcessTime: this.calculateAverageProcessTime(session),
				averageSaveTime: 0, // Would track actual save times
				memoryUsage: session.metadata.size,
				dataSize: JSON.stringify(session.data).length,
			},

			features: this.analyzeFeatureUsage(session),

			errors: Object.values(errorAnalysis),
		};
	}

	// Get session history
	public async getSessionHistory(toolId?: string, limit: number = 50): Promise<ToolSessionHistoryEntry[]> {
		const sessionData = await sessionStorageCore.getSession();
		if (!sessionData) return [];

		let history = sessionData.toolSessions.history;

		// Filter by tool ID if specified
		if (toolId) {
			history = history.filter(entry => entry.toolId === toolId);
		}

		// Sort by last accessed and limit
		return history
			.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
			.slice(0, limit);
	}

	// Add session change listener
	public addSessionListener(sessionId: string, callback: (session: ToolSession) => void): void {
		if (!this.sessionListeners.has(sessionId)) {
			this.sessionListeners.set(sessionId, new Set());
		}
		this.sessionListeners.get(sessionId)!.add(callback);
	}

	// Remove session change listener
	public removeSessionListener(sessionId: string, callback: (session: ToolSession) => void): void {
		const listeners = this.sessionListeners.get(sessionId);
		if (listeners) {
			listeners.delete(callback);
			if (listeners.size === 0) {
				this.sessionListeners.delete(sessionId);
			}
		}
	}

	// Get recovery data
	public async getRecoveryData(): Promise<SessionRecovery[]> {
		return Array.from(this.recoveryCache.values());
	}

	// Clear all session data
	public async clearAllSessions(): Promise<void> {
		try {
			// Stop all auto-save intervals
			for (const interval of this.autoSaveIntervals.values()) {
				clearInterval(interval);
			}
			this.autoSaveIntervals.clear();

			// Clear all debouncers
			for (const debouncer of this.autoSaveDebouncers.values()) {
				clearTimeout(debouncer);
			}
			this.autoSaveDebouncers.clear();

			// Clear listeners
			this.sessionListeners.clear();
			this.recoveryCache.clear();

			// Clear session storage
			const sessionData = await sessionStorageCore.getSession();
			if (sessionData) {
				sessionData.toolSessions = this.getDefaultToolSessionData();
				await sessionStorageCore.saveSession(sessionData.id, sessionData);
			}

			console.log('All tool sessions cleared');

		} catch (error) {
			console.error('Failed to clear all sessions:', error);
			throw error;
		}
	}

	// Private helper methods

	private getDefaultConfig(): AutoSaveConfig {
		return {
			enabled: true,
			interval: 30000, // 30 seconds
			debounceMs: 1000, // 1 second
			maxHistory: 100,
			compressLargeData: true,
			encryptionEnabled: false,
			persistOnError: true,
		};
	}

	private startAutoSave(sessionId: string): void {
		// Clear existing interval
		this.stopAutoSave(sessionId);

		// Start new interval
		const interval = setInterval(async () => {
			try {
				const session = await this.getSession(sessionId);
				if (session) {
					await this.saveSession(session, { silent: true });
				} else {
					// Session no longer exists, stop auto-save
					this.stopAutoSave(sessionId);
				}
			} catch (error) {
				console.error(`Auto-save failed for session ${sessionId}:`, error);
			}
		}, this.config.interval);

		this.autoSaveIntervals.set(sessionId, interval);
	}

	private stopAutoSave(sessionId: string): void {
		const interval = this.autoSaveIntervals.get(sessionId);
		if (interval) {
			clearInterval(interval);
			this.autoSaveIntervals.delete(sessionId);
		}
	}

	private debouncedSave(sessionId: string, session: ToolSession): void {
		// Clear existing debouncer
		const existingDebouncer = this.autoSaveDebouncers.get(sessionId);
		if (existingDebouncer) {
			clearTimeout(existingDebouncer);
		}

		// Set new debouncer
		const debouncer = setTimeout(async () => {
			try {
				await this.saveSession(session, { silent: true });
				this.autoSaveDebouncers.delete(sessionId);
			} catch (error) {
				console.error(`Debounced save failed for session ${sessionId}:`, error);
			}
		}, this.config.debounceMs);

		this.autoSaveDebouncers.set(sessionId, debouncer);
	}

	private async addToHistory(session: ToolSession): Promise<void> {
		const sessionData = await sessionStorageCore.getSession();
		if (!sessionData) return;

		const historyEntry: ToolSessionHistoryEntry = {
			id: this.generateHistoryId(),
			toolId: session.toolId,
			sessionId: session.id,
			title: session.metadata.title || `${session.toolId} Session`,
			description: session.metadata.description,
			createdAt: session.createdAt,
			lastAccessed: session.lastAccessed,
			tags: session.metadata.tags,
			isFavorite: session.metadata.isFavorite,
			size: session.metadata.size,
		};

		// Add to history
		sessionData.toolSessions.history.push(historyEntry);

		// Limit history size
		if (sessionData.toolSessions.history.length > 1000) {
			sessionData.toolSessions.history = sessionData.toolSessions.history.slice(-1000);
		}

		await sessionStorageCore.saveSession(sessionData.id, sessionData);
	}

	private notifyListeners(toolId: string, session: ToolSession): void {
		const listeners = this.sessionListeners.get(session.id);
		if (listeners) {
			listeners.forEach(listener => {
				try {
					listener(session);
				} catch (error) {
					console.error('Error in session listener:', error);
				}
			});
		}
	}

	private updateRecoveryCache(session: ToolSession): void {
		const recovery: SessionRecovery = {
			sessionId: session.id,
			toolId: session.toolId,
			recoveredAt: new Date(),
			data: session.data,
			metadata: {
				crashDetected: false,
				autoSaveEnabled: session.autoSave,
				lastSaveAt: session.lastAccessed,
				saveCount: session.interactions.filter(i => i.type === 'save').length,
				dataIntegrity: 'intact',
			},
		};

		this.recoveryCache.set(session.id, recovery);
	}

	private async updateSessionAnalytics(session: ToolSession, interaction: ToolInteraction): Promise<void> {
		// This would update detailed analytics
		// Implementation would depend on analytics system integration
	}

	private calculateSessionSize(session: ToolSession): number {
		return JSON.stringify(session).length * 2; // Rough estimation
	}

	private calculateAverageProcessTime(session: ToolSession): number {
		const executionInteractions = session.interactions.filter(i => i.type === 'execute');
		if (executionInteractions.length === 0) return 0;

		const totalTime = executionInteractions.reduce((sum, interaction) => {
			return sum + (interaction.details.duration || 0);
		}, 0);

		return totalTime / executionInteractions.length;
	}

	private analyzeFeatureUsage(session: ToolSession): Record<string, { usageCount: number; lastUsed: Date; effectiveness: number }> {
		// Analyze which features are used based on interactions
		const features: Record<string, { usageCount: number; lastUsed: Date; effectiveness: number }> = {};

		for (const interaction of session.interactions) {
			const featureKey = `${interaction.type}_${interaction.details.action}`;
			if (!features[featureKey]) {
				features[featureKey] = {
					usageCount: 0,
					lastUsed: interaction.timestamp,
					effectiveness: interaction.details.result === 'success' ? 1 : 0.5,
				};
			}
			features[featureKey].usageCount++;
			features[featureKey].lastUsed = interaction.timestamp;
			if (interaction.details.result === 'success') {
				features[featureKey].effectiveness =
					(features[featureKey].effectiveness + 1) / 2; // Running average
			}
		}

		return features;
	}

	private setupCrashDetection(): void {
		// Set up crash detection using beforeunload
		window.addEventListener('beforeunload', () => {
			// Mark sessions as potentially crashed
			this.recoveryCache.forEach(recovery => {
				recovery.metadata.crashDetected = true;
			});
		});

		// Check for crash on load
		const crashDetected = sessionStorage.getItem('crash_detected');
		if (crashDetected) {
			console.warn('Previous session crash detected, attempting recovery...');
			sessionStorage.removeItem('crash_detected');
		} else {
			sessionStorage.setItem('crash_detected', 'true');
		}
	}

	private async recoverInterruptedSessions(): Promise<void> {
		try {
			const sessionData = await sessionStorageCore.getSession();
			if (!sessionData) return;

			const sessions = sessionData.toolSessions.activeSessions;
			const recovered: string[] = [];

			for (const [toolId, session] of Object.entries(sessions)) {
				// Check if session was recently modified
				const timeSinceLastAccess = Date.now() - session.lastAccessed.getTime();
				if (timeSinceLastAccess < 5 * 60 * 1000) { // 5 minutes
					// Update recovery cache
					this.updateRecoveryCache(session);
					recovered.push(session.id);
				}
			}

			if (recovered.length > 0) {
				console.log(`Recovered ${recovered.length} interrupted sessions`);
			}

		} catch (error) {
			console.error('Failed to recover interrupted sessions:', error);
		}
	}

	private async persistOnError(session: ToolSession, error: any): Promise<void> {
		try {
			// Save to emergency backup
			const emergencyBackup = {
				session,
				error: {
					message: error.message,
					stack: error.stack,
					timestamp: new Date(),
				},
			};

			localStorage.setItem(`emergency_backup_${session.id}`, JSON.stringify(emergencyBackup));
			console.log(`Emergency backup created for session ${session.id}`);

		} catch (backupError) {
			console.error('Failed to create emergency backup:', backupError);
		}
	}

	private convertToCSV(data: any): string {
		// Simple CSV conversion - would need proper implementation
		const headers = Object.keys(data.session);
		const values = headers.map(header => JSON.stringify(data.session[header]));
		return [headers.join(','), values.join(',')].join('\n');
	}

	private convertToXML(data: any): string {
		// Simple XML conversion - would need proper implementation
		return `<?xml version="1.0" encoding="UTF-8"?>
<session>
${Object.entries(data.session).map(([key, value]) => `  <${key}>${JSON.stringify(value)}</${key}>`).join('\n')}
</session>`;
	}

	private convertToYAML(data: any): string {
		// Simple YAML conversion - would need proper implementation
		return `session:
${Object.entries(data.session).map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`).join('\n')}`;
	}

	private getToolCategory(toolId: string): string {
		// Extract category from tool ID
		if (toolId.includes('json')) return 'JSON Processing';
		if (toolId.includes('code')) return 'Code Processing';
		if (toolId.includes('file')) return 'File Processing';
		if (toolId.includes('text')) return 'Text Processing';
		if (toolId.includes('security')) return 'Security & Encryption';
		return 'Network Utilities';
	}

	private getDefaultToolSessionData(): ToolSessionData {
		return {
			activeSessions: {},
			history: [],
			autoSave: {},
			temporary: {},
			exportHistory: [],
		};
	}

	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateInteractionId(): string {
		return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateErrorId(): string {
		return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateHistoryId(): string {
		return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Export singleton instance
export const toolSessionPersistence = ToolSessionPersistence.getInstance();

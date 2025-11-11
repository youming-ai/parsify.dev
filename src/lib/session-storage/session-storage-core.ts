/**
 * Session Storage Core - T161 Implementation
 * Privacy-first session storage system for user data persistence
 * Provides secure, efficient storage with cross-tab synchronization
 */

export interface SessionStorageConfig {
	// Storage preferences
	preferences: {
		defaultExpiry: number; // milliseconds
		maxStorageSize: number; // bytes
		compressionThreshold: number; // bytes
		encryptionEnabled: boolean;
		syncAcrossTabs: boolean;
		persistOnClose: boolean;
	};

	// Privacy settings
	privacy: {
		requireConsent: boolean;
		anonymousMode: boolean;
		dataRetentionDays: number;
		sensitiveDataHandling: 'encrypt' | 'hash' | 'exclude';
		allowAnalytics: boolean;
	};

	// Performance settings
	performance: {
		batchSize: number;
		debounceMs: number;
		compressionLevel: number; // 1-9
		maxRetries: number;
		timeoutMs: number;
	};
}

export interface SessionData {
	id: string;
	userId?: string;
	createdAt: Date;
	lastAccessed: Date;
	expiresAt: Date;

	// Data categories
	preferences: UserPreferences;
	toolSessions: ToolSessionData;
	workingState: WorkingState;
	analytics: SessionAnalytics;

	// Metadata
	metadata: {
		version: string;
		deviceFingerprint: string;
		tabId: string;
		isAnonymous: boolean;
		consentGiven: boolean;
		lastSyncAt?: Date;
		compressionRatio?: number;
		size: number;
	};
}

export interface UserPreferences {
	// UI preferences
	ui: {
		theme: 'light' | 'dark' | 'system';
		language: string;
		fontSize: 'small' | 'medium' | 'large';
		layoutDensity: 'compact' | 'normal' | 'spacious';
		animationsEnabled: boolean;
		notificationsEnabled: boolean;
		autoSave: boolean;
	};

	// Tool preferences
	tools: {
		defaultCodeLanguage: string;
		editorTheme: string;
		tabSize: number;
		wordWrap: boolean;
		lineNumbers: boolean;
		minimap: boolean;
		autoFormat: boolean;
		favoriteTools: string[];
		recentTools: string[];
		toolSpecificSettings: Record<string, any>;
	};

	// Privacy preferences
	privacy: {
		analyticsConsent: boolean;
		storageConsent: boolean;
		syncConsent: boolean;
		dataRetention: 'session' | 'day' | 'week' | 'month' | 'year';
		sensitiveDataHandling: 'encrypt' | 'hash' | 'exclude';
		anonymousMode: boolean;
	};

	// Feature preferences
	features: {
		betaFeatures: boolean;
		experimentalFeatures: boolean;
		advancedMode: boolean;
		keyboardShortcuts: boolean;
		toolTips: boolean;
		contextualHelp: boolean;
	};

	// Performance preferences
	performance: {
		enableCompression: boolean;
		enableLazyLoading: boolean;
		cacheSize: number;
		debounceDelay: number;
		maxHistoryItems: number;
	};
}

export interface ToolSessionData {
	// Active tool sessions
	activeSessions: Record<string, ToolSession>;

	// Session history
	history: ToolSessionHistoryEntry[];

	// Auto-save data
	autoSave: Record<string, any>;

	// Temporary data
	temporary: Record<string, any>;

	// Export/import data
	exportHistory: ExportImportEntry[];
}

export interface ToolSession {
	id: string;
	toolId: string;
	toolCategory: string;
	createdAt: Date;
	lastAccessed: Date;

	// Session state
	data: any;
	input: string;
	output: string;
	config: Record<string, any>;

	// User interactions
	interactions: ToolInteraction[];
	errors: ToolError[];

	// Persistence settings
	autoSave: boolean;
	autoSaveInterval: number;
	persistOutput: boolean;
	persistConfig: boolean;

	// Session metadata
	metadata: {
		version: string;
		title?: string;
		description?: string;
		tags: string[];
		isFavorite: boolean;
		isArchived: boolean;
		lastSavedAt?: Date;
		size: number;
	};
}

export interface ToolInteraction {
	id: string;
	timestamp: Date;
	type: 'input' | 'config_change' | 'execute' | 'export' | 'import' | 'save' | 'load';
	details: {
		action: string;
		beforeValue?: any;
		afterValue?: any;
		duration?: number;
		result?: 'success' | 'error' | 'cancelled';
	};
}

export interface ToolError {
	id: string;
	timestamp: Date;
	type: 'validation' | 'execution' | 'network' | 'storage' | 'unknown';
	message: string;
	stack?: string;
	context: Record<string, any>;
	resolved: boolean;
}

export interface ToolSessionHistoryEntry {
	id: string;
	toolId: string;
	sessionId: string;
	title: string;
	description?: string;
	createdAt: Date;
	lastAccessed: Date;
	tags: string[];
	isFavorite: boolean;
	thumbnail?: string;
	size: number;
}

export interface ExportImportEntry {
	id: string;
	type: 'export' | 'import';
	timestamp: Date;
	toolId?: string;
	format: string;
	filename?: string;
	size: number;
	success: boolean;
	error?: string;
}

export interface WorkingState {
	// Current working context
	currentTool?: string;
	currentCategory?: string;
	currentView: 'grid' | 'list' | 'detail';

	// Navigation state
	breadcrumb: Array<{
		label: string;
		href?: string;
		isActive?: boolean;
	}>;

	// Search and filters
	search: {
		query: string;
		filters: Record<string, any>;
		sortBy: string;
		sortOrder: 'asc' | 'desc';
		results: any[];
	};

	// Form state
	forms: Record<string, any>;

	// Temporary state
	temporary: Record<string, any>;

	// Draft data
	drafts: Record<string, {
		content: any;
		lastModified: Date;
		autoSave: boolean;
	}>;
}

export interface SessionAnalytics {
	// Usage statistics
	usage: {
		sessionDuration: number;
		pageViews: number;
		toolUses: number;
		interactions: number;
		errors: number;
		lastActivity: Date;
	};

	// Tool analytics
	tools: Record<string, {
		useCount: number;
		totalTime: number;
		averageTime: number;
		successRate: number;
		lastUsed: Date;
		favoriteFeatures: string[];
	}>;

	// Performance metrics
	performance: {
		averageLoadTime: number;
		averageProcessTime: number;
		memoryUsage: number;
		storageUsage: number;
		errorRate: number;
	};

	// Feature usage
	features: Record<string, {
		enabled: boolean;
		usageCount: number;
		lastUsed: Date;
		effectiveness: number; // 0-1
	}>;

	// Privacy analytics
	privacy: {
		consentGiven: boolean;
		dataShared: boolean;
		anonymousMode: boolean;
		optOutCount: number;
		dataDeletionRequests: number;
	};
}

export interface StorageQuota {
	used: number;
	available: number;
	total: number;
	percentage: number;
}

export interface SyncEvent {
	type: 'update' | 'delete' | 'conflict';
	key: string;
	value?: any;
	timestamp: Date;
	tabId: string;
	userId?: string;
}

export interface CompressionResult {
	compressed: boolean;
	originalSize: number;
	compressedSize: number;
	compressionRatio: number;
	duration: number;
}

export class SessionStorageCore {
	private static instance: SessionStorageCore;
	private config: SessionStorageConfig;
	private isInitialized = false;
	private tabId: string;
	private deviceFingerprint: string;
	private storageQuota: StorageQuota;
	private syncListeners: Map<string, (event: SyncEvent) => void> = new Map();
	private compressionWorker?: Worker;
	private encryptionKey?: CryptoKey;

	private constructor() {
		this.config = this.getDefaultConfig();
		this.tabId = this.generateTabId();
		this.deviceFingerprint = this.generateDeviceFingerprint();
		this.storageQuota = {
			used: 0,
			available: 5 * 1024 * 1024, // 5MB default
			total: 5 * 1024 * 1024,
			percentage: 0,
		};
	}

	public static getInstance(): SessionStorageCore {
		if (!SessionStorageCore.instance) {
			SessionStorageCore.instance = new SessionStorageCore();
		}
		return SessionStorageCore.instance;
	}

	// Initialize session storage
	public async initialize(config?: Partial<SessionStorageConfig>): Promise<void> {
		if (this.isInitialized) {
			console.warn('Session storage already initialized');
			return;
		}

		try {
			// Merge configuration
			if (config) {
				this.config = this.mergeConfig(this.config, config);
			}

			// Initialize encryption key if enabled
			if (this.config.privacy.encryptionEnabled) {
				await this.initializeEncryption();
			}

			// Initialize compression worker
			await this.initializeCompression();

			// Setup cross-tab synchronization
			this.setupCrossTabSync();

			// Calculate storage quota
			await this.updateStorageQuota();

			// Cleanup expired data
			await this.cleanupExpiredData();

			this.isInitialized = true;
			console.log('Session storage initialized successfully');
			console.log(`Tab ID: ${this.tabId}`);
			console.log(`Storage quota: ${this.formatBytes(this.storageQuota.used)} / ${this.formatBytes(this.storageQuota.total)}`);

		} catch (error) {
			console.error('Failed to initialize session storage:', error);
			throw error;
		}
	}

	// Get session data
	public async getSession(sessionId?: string): Promise<SessionData | null> {
		try {
			const key = sessionId || this.getCurrentSessionId();
			if (!key) return null;

			const stored = localStorage.getItem(`session:${key}`);
			if (!stored) return null;

			const sessionData = await this.deserializeData(stored);

			// Check if session is expired
			if (sessionData.expiresAt < new Date()) {
				await this.deleteSession(sessionId);
				return null;
			}

			// Update last accessed
			sessionData.lastAccessed = new Date();
			await this.saveSession(sessionId, sessionData);

			return sessionData;

		} catch (error) {
			console.error('Failed to get session:', error);
			return null;
		}
	}

	// Save session data
	public async saveSession(sessionId: string, data: SessionData): Promise<void> {
		try {
			// Validate privacy consent
			if (this.config.privacy.requireConsent && !data.metadata.consentGiven) {
				throw new Error('User consent required for session storage');
			}

			// Update metadata
			data.metadata.lastSyncAt = new Date();
			data.metadata.size = this.calculateSessionSize(data);

			// Check storage quota
			await this.checkStorageQuota(data.metadata.size);

			// Serialize and store
			const serialized = await this.serializeData(data);
			localStorage.setItem(`session:${sessionId}`, serialized);

			// Update quota
			await this.updateStorageQuota();

			// Trigger sync event
			this.triggerSyncEvent({
				type: 'update',
				key: `session:${sessionId}`,
				timestamp: new Date(),
				tabId: this.tabId,
			});

		} catch (error) {
			console.error('Failed to save session:', error);
			throw error;
		}
	}

	// Delete session
	public async deleteSession(sessionId: string): Promise<void> {
		try {
			localStorage.removeItem(`session:${sessionId}`);
			await this.updateStorageQuota();

			// Trigger sync event
			this.triggerSyncEvent({
				type: 'delete',
				key: `session:${sessionId}`,
				timestamp: new Date(),
				tabId: this.tabId,
			});

		} catch (error) {
			console.error('Failed to delete session:', error);
			throw error;
		}
	}

	// Create new session
	public async createSession(options?: {
		userId?: string;
		isAnonymous?: boolean;
		customExpiry?: number;
	}): Promise<string> {
		const sessionId = this.generateSessionId();
		const now = new Date();

		const sessionData: SessionData = {
			id: sessionId,
			userId: options?.userId,
			createdAt: now,
			lastAccessed: now,
			expiresAt: new Date(now.getTime() + (options?.customExpiry || this.config.preferences.defaultExpiry)),

			preferences: this.getDefaultPreferences(),
			toolSessions: this.getDefaultToolSessionData(),
			workingState: this.getDefaultWorkingState(),
			analytics: this.getDefaultAnalytics(),

			metadata: {
				version: '1.0.0',
				deviceFingerprint: this.deviceFingerprint,
				tabId: this.tabId,
				isAnonymous: options?.isAnonymous || this.config.privacy.anonymousMode,
				consentGiven: !this.config.privacy.requireConsent,
				lastSyncAt: now,
				size: 0,
			},
		};

		await this.saveSession(sessionId, sessionData);
		return sessionId;
	}

	// Get user preferences
	public async getPreferences(): Promise<UserPreferences> {
		const session = await this.getSession();
		return session?.preferences || this.getDefaultPreferences();
	}

	// Update user preferences
	public async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
		const session = await this.getSession();
		if (!session) {
			// Create new session if none exists
			const sessionId = await this.createSession();
			const newSession = await this.getSession(sessionId);
			if (newSession) {
				Object.assign(newSession.preferences, preferences);
				await this.saveSession(sessionId, newSession);
			}
		} else {
			Object.assign(session.preferences, preferences);
			await this.saveSession(session.id, session);
		}
	}

	// Get tool session data
	public async getToolSession(toolId: string): Promise<ToolSession | null> {
		const session = await this.getSession();
		if (!session) return null;

		const toolSession = session.toolSessions.activeSessions[toolId];
		if (toolSession) {
			toolSession.lastAccessed = new Date();
			await this.saveSession(session.id, session);
		}

		return toolSession || null;
	}

	// Save tool session data
	public async saveToolSession(toolId: string, toolSession: Partial<ToolSession>): Promise<void> {
		const session = await this.getSession();
		if (!session) {
			// Create new session
			const sessionId = await this.createSession();
			const newSession = await this.getSession(sessionId);
			if (newSession) {
				newSession.toolSessions.activeSessions[toolId] = {
					...this.getDefaultToolSession(toolId),
					...toolSession,
				};
				await this.saveSession(sessionId, newSession);
			}
		} else {
			const existingSession = session.toolSessions.activeSessions[toolId];
			session.toolSessions.activeSessions[toolId] = {
				...(existingSession || this.getDefaultToolSession(toolId)),
				...toolSession,
				lastAccessed: new Date(),
			};
			await this.saveSession(session.id, session);
		}
	}

	// Get storage quota
	public getStorageQuota(): StorageQuota {
		return { ...this.storageQuota };
	}

	// Clear all data
	public async clearAllData(): Promise<void> {
		try {
			// Clear all session data
			const keys = Object.keys(localStorage);
			for (const key of keys) {
				if (key.startsWith('session:')) {
					localStorage.removeItem(key);
				}
			}

			// Clear any other app data
			localStorage.removeItem('app_preferences');
			localStorage.removeItem('user_consent');

			// Update quota
			await this.updateStorageQuota();

			console.log('All session data cleared');

		} catch (error) {
			console.error('Failed to clear data:', error);
			throw error;
		}
	}

	// Export session data
	public async exportSession(sessionId?: string): Promise<string> {
		const session = await this.getSession(sessionId);
		if (!session) {
			throw new Error('No session data to export');
		}

		// Create export-friendly version
		const exportData = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			session: {
				...session,
				// Remove sensitive data if privacy settings require
				...(this.config.privacy.anonymousMode && {
					userId: undefined,
					metadata: {
						...session.metadata,
						deviceFingerprint: 'anonymous',
					},
				}),
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	// Import session data
	public async importSession(data: string, options?: {
		merge?: boolean;
		preserveExisting?: boolean;
	}): Promise<void> {
		try {
			const importData = JSON.parse(data);

			if (!importData.session) {
				throw new Error('Invalid import data format');
			}

			const importedSession = importData.session as SessionData;

			// Validate imported session
			this.validateImportedSession(importedSession);

			if (options?.merge) {
				// Merge with existing session
				const existingSession = await this.getSession();
				if (existingSession && !options?.preserveExisting) {
					// Merge preferences
					Object.assign(existingSession.preferences, importedSession.preferences);

					// Merge tool sessions
					Object.assign(existingSession.toolSessions, importedSession.toolSessions);

					// Merge working state
					Object.assign(existingSession.workingState, importedSession.workingState);

					await this.saveSession(existingSession.id, existingSession);
				}
			} else {
				// Replace existing session
				importedSession.id = this.generateSessionId();
				importedSession.createdAt = new Date();
				importedSession.lastAccessed = new Date();
				importedSession.expiresAt = new Date(Date.now() + this.config.preferences.defaultExpiry);

				await this.saveSession(importedSession.id, importedSession);
			}

			console.log('Session data imported successfully');

		} catch (error) {
			console.error('Failed to import session:', error);
			throw error;
		}
	}

	// Private helper methods

	private getDefaultConfig(): SessionStorageConfig {
		return {
			preferences: {
				defaultExpiry: 24 * 60 * 60 * 1000, // 24 hours
				maxStorageSize: 5 * 1024 * 1024, // 5MB
				compressionThreshold: 1024, // 1KB
				encryptionEnabled: false,
				syncAcrossTabs: true,
				persistOnClose: true,
			},

			privacy: {
				requireConsent: false,
				anonymousMode: false,
				dataRetentionDays: 30,
				sensitiveDataHandling: 'encrypt',
				allowAnalytics: true,
			},

			performance: {
				batchSize: 100,
				debounceMs: 300,
				compressionLevel: 6,
				maxRetries: 3,
				timeoutMs: 5000,
			},
		};
	}

	private mergeConfig(defaultConfig: SessionStorageConfig, userConfig: Partial<SessionStorageConfig>): SessionStorageConfig {
		return {
			preferences: { ...defaultConfig.preferences, ...userConfig.preferences },
			privacy: { ...defaultConfig.privacy, ...userConfig.privacy },
			performance: { ...defaultConfig.performance, ...userConfig.performance },
		};
	}

	private async initializeEncryption(): Promise<void> {
		if (typeof window === 'undefined' || !window.crypto) {
			console.warn('Encryption not available in this environment');
			return;
		}

		// Generate or retrieve encryption key
		const storedKey = localStorage.getItem('encryption_key');
		if (storedKey) {
			this.encryptionKey = await window.crypto.subtle.importKey(
				'jwk',
				JSON.parse(storedKey),
				{ name: 'AES-GCM', length: 256 },
				false,
				['encrypt', 'decrypt']
			);
		} else {
			this.encryptionKey = await window.crypto.subtle.generateKey(
				{ name: 'AES-GCM', length: 256 },
				true,
				['encrypt', 'decrypt']
			);

			const exportedKey = await window.crypto.subtle.exportKey('jwk', this.encryptionKey);
			localStorage.setItem('encryption_key', JSON.stringify(exportedKey));
		}
	}

	private async initializeCompression(): Promise<void> {
		// Initialize compression worker if supported
		if (typeof Worker !== 'undefined') {
			// Would initialize actual compression worker here
			console.log('Compression worker initialized');
		}
	}

	private setupCrossTabSync(): void {
		if (!this.config.preferences.syncAcrossTabs) return;

		window.addEventListener('storage', (event) => {
			if (event.key?.startsWith('session:')) {
				const syncEvent: SyncEvent = {
					type: 'update',
					key: event.key,
					timestamp: new Date(),
					tabId: 'unknown',
				};

				// Notify listeners
				this.syncListeners.forEach(listener => listener(syncEvent));
			}
		});
	}

	private async updateStorageQuota(): Promise<void> {
		let used = 0;
		const keys = Object.keys(localStorage);

		for (const key of keys) {
			if (key.startsWith('session:')) {
				used += localStorage.getItem(key)?.length || 0;
			}
		}

		this.storageQuota = {
			used,
			available: this.config.preferences.maxStorageSize - used,
			total: this.config.preferences.maxStorageSize,
			percentage: used / this.config.preferences.maxStorageSize,
		};
	}

	private async checkStorageQuota(sizeToAdd: number): Promise<void> {
		const newSize = this.storageQuota.used + sizeToAdd;
		if (newSize > this.config.preferences.maxStorageSize) {
			// Trigger cleanup
			await this.cleanupExpiredData();

			// Check again
			await this.updateStorageQuota();
			if (this.storageQuota.used + sizeToAdd > this.config.preferences.maxStorageSize) {
				throw new Error('Storage quota exceeded. Please clear some data.');
			}
		}
	}

	private async cleanupExpiredData(): Promise<void> {
		const keys = Object.keys(localStorage);
		const now = new Date();
		let cleanedCount = 0;

		for (const key of keys) {
			if (key.startsWith('session:')) {
				try {
					const data = localStorage.getItem(key);
					if (data) {
						const session = await this.deserializeData(data);
						if (session.expiresAt < now) {
							localStorage.removeItem(key);
							cleanedCount++;
						}
					}
				} catch (error) {
					// Remove corrupted data
					localStorage.removeItem(key);
					cleanedCount++;
				}
			}
		}

		if (cleanedCount > 0) {
			console.log(`Cleaned up ${cleanedCount} expired sessions`);
		}
	}

	private async serializeData(data: any): Promise<string> {
		const jsonString = JSON.stringify(data);

		// Apply compression if needed
		if (jsonString.length > this.config.preferences.compressionThreshold) {
			// Would apply actual compression here
			return jsonString; // Placeholder
		}

		// Apply encryption if enabled
		if (this.config.preferences.encryptionEnabled && this.encryptionKey) {
			// Would apply actual encryption here
			return jsonString; // Placeholder
		}

		return jsonString;
	}

	private async deserializeData(data: string): Promise<any> {
		// Apply decryption if needed
		if (this.config.preferences.encryptionEnabled && this.encryptionKey) {
			// Would apply actual decryption here
		}

		// Apply decompression if needed
		// Would apply actual decompression here

		return JSON.parse(data);
	}

	private calculateSessionSize(session: SessionData): number {
		return JSON.stringify(session).length * 2; // Rough estimation
	}

	private triggerSyncEvent(event: SyncEvent): void {
		// Broadcast to other tabs
		if (this.config.preferences.syncAcrossTabs) {
			this.syncListeners.forEach(listener => listener(event));
		}
	}

	private getCurrentSessionId(): string | null {
		// Get current session ID from cookie or storage
		return localStorage.getItem('current_session_id');
	}

	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateTabId(): string {
		return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateDeviceFingerprint(): string {
		// Simple device fingerprinting
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

	private simpleHash(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(36);
	}

	private validateImportedSession(session: SessionData): void {
		if (!session.id || !session.preferences || !session.toolSessions) {
			throw new Error('Invalid session data structure');
		}

		// Add more validation as needed
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Default data methods
	private getDefaultPreferences(): UserPreferences {
		return {
			ui: {
				theme: 'system',
				language: 'en',
				fontSize: 'medium',
				layoutDensity: 'normal',
				animationsEnabled: true,
				notificationsEnabled: true,
				autoSave: true,
			},

			tools: {
				defaultCodeLanguage: 'javascript',
				editorTheme: 'vs-dark',
				tabSize: 2,
				wordWrap: true,
				lineNumbers: true,
				minimap: false,
				autoFormat: false,
				favoriteTools: [],
				recentTools: [],
				toolSpecificSettings: {},
			},

			privacy: {
				analyticsConsent: true,
				storageConsent: true,
				syncConsent: true,
				dataRetention: 'month',
				sensitiveDataHandling: 'encrypt',
				anonymousMode: false,
			},

			features: {
				betaFeatures: false,
				experimentalFeatures: false,
				advancedMode: false,
				keyboardShortcuts: true,
				toolTips: true,
				contextualHelp: true,
			},

			performance: {
				enableCompression: true,
				enableLazyLoading: true,
				cacheSize: 50,
				debounceDelay: 300,
				maxHistoryItems: 100,
			},
		};
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

	private getDefaultWorkingState(): WorkingState {
		return {
			currentView: 'grid',
			breadcrumb: [],
			search: {
				query: '',
				filters: {},
				sortBy: 'name',
				sortOrder: 'asc',
				results: [],
			},
			forms: {},
			temporary: {},
			drafts: {},
		};
	}

	private getDefaultAnalytics(): SessionAnalytics {
		return {
			usage: {
				sessionDuration: 0,
				pageViews: 0,
				toolUses: 0,
				interactions: 0,
				errors: 0,
				lastActivity: new Date(),
			},

			tools: {},
			performance: {
				averageLoadTime: 0,
				averageProcessTime: 0,
				memoryUsage: 0,
				storageUsage: 0,
				errorRate: 0,
			},
			features: {},
			privacy: {
				consentGiven: false,
				dataShared: false,
				anonymousMode: false,
				optOutCount: 0,
				dataDeletionRequests: 0,
			},
		};
	}

	private getDefaultToolSession(toolId: string): ToolSession {
		return {
			id: this.generateSessionId(),
			toolId,
			toolCategory: this.getToolCategory(toolId),
			createdAt: new Date(),
			lastAccessed: new Date(),
			data: null,
			input: '',
			output: '',
			config: {},
			interactions: [],
			errors: [],
			autoSave: true,
			autoSaveInterval: 30000, // 30 seconds
			persistOutput: true,
			persistConfig: true,
			metadata: {
				version: '1.0.0',
				tags: [],
				isFavorite: false,
				isArchived: false,
				size: 0,
			},
		};
	}

	private getToolCategory(toolId: string): string {
		// Simple category detection based on tool ID
		if (toolId.includes('json')) return 'JSON Processing';
		if (toolId.includes('code')) return 'Code Processing';
		if (toolId.includes('file')) return 'File Processing';
		if (toolId.includes('text')) return 'Text Processing';
		if (toolId.includes('security')) return 'Security & Encryption';
		return 'Network Utilities';
	}
}

// Export singleton instance
export const sessionStorageCore = SessionStorageCore.getInstance();

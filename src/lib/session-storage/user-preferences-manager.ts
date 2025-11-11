/**
 * User Preferences Manager - T161 Implementation
 * Manages user preferences with synchronization and privacy controls
 */

import { sessionStorageCore, type UserPreferences, type SessionData } from './session-storage-core';

export interface PreferencesSyncEvent {
	type: 'preference_updated' | 'preference_reset' | 'preference_exported' | 'preference_imported';
	category: keyof UserPreferences;
	key?: string;
	value?: any;
	timestamp: Date;
	tabId: string;
	userId?: string;
}

export interface PreferencesBackup {
	version: string;
	exportedAt: Date;
	preferences: UserPreferences;
	metadata: {
		deviceFingerprint: string;
		browser: string;
		platform: string;
		appVersion: string;
	};
}

export interface PreferencesValidation {
	isValid: boolean;
	errors: Array<{
		category: keyof UserPreferences;
		field: string;
		message: string;
		value: any;
		expectedType?: string;
	}>;
	warnings: Array<{
		category: keyof UserPreferences;
		field: string;
		message: string;
		value: any;
	}>;
}

export class UserPreferencesManager {
	private static instance: UserPreferencesManager;
	private listeners: Map<string, (event: PreferencesSyncEvent) => void> = new Map();
	private debouncedSave: Map<string, NodeJS.Timeout> = new Map();
	private validationRules: Map<keyof UserPreferences, ValidationRules> = new Map();
	private currentSessionId: string | null = null;

	private constructor() {
		this.initializeValidationRules();
	}

	public static getInstance(): UserPreferencesManager {
		if (!UserPreferencesManager.instance) {
			UserPreferencesManager.instance = new UserPreferencesManager();
		}
		return UserPreferencesManager.instance;
	}

	// Initialize preferences manager
	public async initialize(): Promise<void> {
		try {
			// Ensure session storage is initialized
			await sessionStorageCore.initialize();

			// Get or create session
			let session = await sessionStorageCore.getSession();
			if (!session) {
				this.currentSessionId = await sessionStorageCore.createSession();
				session = await sessionStorageCore.getSession(this.currentSessionId);
			} else {
				this.currentSessionId = session.id;
			}

			// Validate and migrate preferences if needed
			if (session) {
				await this.migratePreferences(session.preferences);
				await this.validatePreferences(session.preferences);
			}

			// Setup cross-tab synchronization
			this.setupCrossTabSync();

			console.log('User preferences manager initialized');

		} catch (error) {
			console.error('Failed to initialize preferences manager:', error);
			throw error;
		}
	}

	// Get all preferences
	public async getPreferences(): Promise<UserPreferences> {
		return await sessionStorageCore.getPreferences();
	}

	// Get specific preference category
	public async getCategory<T extends keyof UserPreferences>(category: T): Promise<UserPreferences[T]> {
		const preferences = await this.getPreferences();
		return preferences[category];
	}

	// Get specific preference value
	public async getValue<T extends keyof UserPreferences, K extends keyof UserPreferences[T]>(
		category: T,
		key: K
	): Promise<UserPreferences[T][K]> {
		const categoryData = await this.getCategory(category);
		return categoryData[key];
	}

	// Update preference category
	public async updateCategory<T extends keyof UserPreferences>(
		category: T,
		updates: Partial<UserPreferences[T]>,
		options?: {
			immediate?: boolean;
			silent?: boolean;
		}
	): Promise<void> {
		try {
			const preferences = await this.getPreferences();
			const oldValues = { ...preferences[category] };

			// Apply updates
			Object.assign(preferences[category], updates);

			// Validate updated preferences
			const validation = this.validateCategory(category, preferences[category]);
			if (!validation.isValid) {
				// Revert changes on validation error
				Object.assign(preferences[category], oldValues);
				throw new Error(`Invalid preference values: ${validation.errors.map(e => e.message).join(', ')}`);
			}

			// Save preferences
			await this.savePreferences(preferences, options?.immediate);

			// Trigger sync event if not silent
			if (!options?.silent) {
				this.triggerSyncEvent({
					type: 'preference_updated',
					category,
					timestamp: new Date(),
					tabId: await this.getTabId(),
					userId: await this.getUserId(),
				});
			}

			// Log warnings if any
			if (validation.warnings.length > 0) {
				console.warn('Preference warnings:', validation.warnings);
			}

		} catch (error) {
			console.error('Failed to update preference category:', error);
			throw error;
		}
	}

	// Update specific preference value
	public async updateValue<T extends keyof UserPreferences, K extends keyof UserPreferences[T]>(
		category: T,
		key: K,
		value: UserPreferences[T][K],
		options?: {
			immediate?: boolean;
			silent?: boolean;
		}
	): Promise<void> {
		await this.updateCategory(category, { [key]: value } as Partial<UserPreferences[T]>, options);
	}

	// Reset preference category to defaults
	public async resetCategory<T extends keyof UserPreferences>(
		category: T,
		options?: {
			immediate?: boolean;
			silent?: boolean;
		}
	): Promise<void> {
		try {
			const preferences = await this.getPreferences();
			const defaultPreferences = await this.getDefaultPreferences();

			// Reset to defaults
			preferences[category] = defaultPreferences[category];

			// Save preferences
			await this.savePreferences(preferences, options?.immediate);

			// Trigger sync event if not silent
			if (!options?.silent) {
				this.triggerSyncEvent({
					type: 'preference_reset',
					category,
					timestamp: new Date(),
					tabId: await this.getTabId(),
					userId: await this.getUserId(),
				});
			}

		} catch (error) {
			console.error('Failed to reset preference category:', error);
			throw error;
		}
	}

	// Reset all preferences to defaults
	public async resetAllPreferences(options?: {
		immediate?: boolean;
		silent?: boolean;
	}): Promise<void> {
		try {
			const defaultPreferences = await this.getDefaultPreferences();

			// Save default preferences
			await this.savePreferences(defaultPreferences, options?.immediate);

			// Trigger sync event if not silent
			if (!options?.silent) {
				this.triggerSyncEvent({
					type: 'preference_reset',
					category: 'ui' as any, // Use any since we're resetting all
					timestamp: new Date(),
					tabId: await this.getTabId(),
					userId: await this.getUserId(),
				});
			}

		} catch (error) {
			console.error('Failed to reset all preferences:', error);
			throw error;
		}
	}

	// Export preferences
	public async exportPreferences(): Promise<PreferencesBackup> {
		try {
			const preferences = await this.getPreferences();

			const backup: PreferencesBackup = {
				version: '1.0.0',
				exportedAt: new Date(),
				preferences,
				metadata: {
					deviceFingerprint: await this.getDeviceFingerprint(),
					browser: navigator.userAgent,
					platform: navigator.platform,
					appVersion: '1.0.0', // Would get from app config
				},
			};

			// Trigger sync event
			this.triggerSyncEvent({
				type: 'preference_exported',
				category: 'ui' as any,
				timestamp: new Date(),
				tabId: await this.getTabId(),
				userId: await this.getUserId(),
			});

			return backup;

		} catch (error) {
			console.error('Failed to export preferences:', error);
			throw error;
		}
	}

	// Import preferences
	public async importPreferences(
		backup: PreferencesBackup,
		options?: {
			merge?: boolean;
			preserveExisting?: boolean;
			skipValidation?: boolean;
		}
	): Promise<void> {
		try {
			// Validate backup
			if (!backup.version || !backup.preferences) {
				throw new Error('Invalid preferences backup format');
			}

			// Validate preferences if not skipped
			if (!options?.skipValidation) {
				const validation = await this.validatePreferences(backup.preferences);
				if (!validation.isValid) {
					throw new Error(`Invalid preferences in backup: ${validation.errors.map(e => e.message).join(', ')}`);
				}
			}

			let finalPreferences: UserPreferences;

			if (options?.merge) {
				// Merge with existing preferences
				const existingPreferences = await this.getPreferences();
				finalPreferences = this.mergePreferences(existingPreferences, backup.preferences, options?.preserveExisting);
			} else {
				// Replace all preferences
				finalPreferences = backup.preferences;
			}

			// Save imported preferences
			await this.savePreferences(finalPreferences, true);

			// Trigger sync event
			this.triggerSyncEvent({
				type: 'preference_imported',
				category: 'ui' as any,
				timestamp: new Date(),
				tabId: await this.getTabId(),
				userId: await this.getUserId(),
			});

			console.log('Preferences imported successfully');

		} catch (error) {
			console.error('Failed to import preferences:', error);
			throw error;
		}
	}

	// Validate preferences
	public async validatePreferences(preferences: UserPreferences): Promise<PreferencesValidation> {
		const validation: PreferencesValidation = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		// Validate each category
		for (const [category, rules] of this.validationRules) {
			const categoryData = preferences[category];
			const categoryValidation = this.validateCategory(category, categoryData);

			if (!categoryValidation.isValid) {
				validation.isValid = false;
			}

			validation.errors.push(...categoryValidation.errors);
			validation.warnings.push(...categoryValidation.warnings);
		}

		return validation;
	}

	// Add preferences change listener
	public addListener(id: string, callback: (event: PreferencesSyncEvent) => void): void {
		this.listeners.set(id, callback);
	}

	// Remove preferences change listener
	public removeListener(id: string): void {
		this.listeners.delete(id);
	}

	// Get preferences usage analytics
	public async getPreferencesAnalytics(): Promise<{
		mostUsedCategories: Array<{ category: keyof UserPreferences; usage: number }>;
		recentlyChanged: Array<{ category: keyof UserPreferences; changedAt: Date; changes: number }>;
		savedDataSize: number;
		lastSyncAt?: Date;
	}> {
		// This would integrate with analytics system
		return {
			mostUsedCategories: [],
			recentlyChanged: [],
			savedDataSize: 0,
		};
	}

	// Private helper methods

	private async savePreferences(preferences: UserPreferences, immediate: boolean = false): Promise<void> {
		if (immediate) {
			// Clear any pending debounced save
			const existingTimeout = this.debouncedSave.get('preferences');
			if (existingTimeout) {
				clearTimeout(existingTimeout);
				this.debouncedSave.delete('preferences');
			}

			// Save immediately
			await sessionStorageCore.updatePreferences(preferences);
		} else {
			// Debounced save
			const existingTimeout = this.debouncedSave.get('preferences');
			if (existingTimeout) {
				clearTimeout(existingTimeout);
			}

			const timeout = setTimeout(async () => {
				try {
					await sessionStorageCore.updatePreferences(preferences);
					this.debouncedSave.delete('preferences');
				} catch (error) {
					console.error('Failed to save preferences:', error);
				}
			}, 300); // 300ms debounce

			this.debouncedSave.set('preferences', timeout);
		}
	}

	private async getDefaultPreferences(): Promise<UserPreferences> {
		const session = await sessionStorageCore.getSession();
		if (session) {
			return session.preferences;
		}

		// Return hardcoded defaults if no session
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

	private validateCategory<T extends keyof UserPreferences>(
		category: T,
		data: UserPreferences[T]
	): PreferencesValidation {
		const validation: PreferencesValidation = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		const rules = this.validationRules.get(category);
		if (!rules) {
			return validation; // No validation rules for this category
		}

		// Validate each field
		for (const [fieldName, rule] of Object.entries(rules)) {
			const value = (data as any)[fieldName];

			// Type validation
			if (rule.type && typeof value !== rule.type) {
				validation.isValid = false;
				validation.errors.push({
					category,
					field: fieldName,
					message: `Expected type ${rule.type}, got ${typeof value}`,
					value,
					expectedType: rule.type,
				});
				continue;
			}

			// Enum validation
			if (rule.enum && !rule.enum.includes(value)) {
				validation.isValid = false;
				validation.errors.push({
					category,
					field: fieldName,
					message: `Invalid value. Expected one of: ${rule.enum.join(', ')}`,
					value,
				});
				continue;
			}

			// Range validation
			if (rule.min !== undefined && value < rule.min) {
				validation.isValid = false;
				validation.errors.push({
					category,
					field: fieldName,
					message: `Value must be >= ${rule.min}`,
					value,
				});
			}

			if (rule.max !== undefined && value > rule.max) {
				validation.isValid = false;
				validation.errors.push({
					category,
					field: fieldName,
					message: `Value must be <= ${rule.max}`,
					value,
				});
			}

			// Custom validation
			if (rule.validator && !rule.validator(value)) {
				validation.isValid = false;
				validation.errors.push({
					category,
					field: fieldName,
					message: rule.validationMessage || 'Invalid value',
					value,
				});
			}

			// Warnings
			if (rule.warning && rule.warning(value)) {
				validation.warnings.push({
					category,
					field: fieldName,
					message: rule.warningMessage || 'Warning about this value',
					value,
				});
			}
		}

		return validation;
	}

	private initializeValidationRules(): void {
		// UI preferences validation
		this.validationRules.set('ui', {
			theme: {
				type: 'string',
				enum: ['light', 'dark', 'system'],
				validator: (value: any) => ['light', 'dark', 'system'].includes(value),
				validationMessage: 'Theme must be one of: light, dark, system',
			},
			language: {
				type: 'string',
				validator: (value: any) => /^[a-z]{2}(-[A-Z]{2})?$/.test(value),
				validationMessage: 'Language must be a valid locale code (e.g., "en", "en-US")',
			},
			fontSize: {
				type: 'string',
				enum: ['small', 'medium', 'large'],
				validator: (value: any) => ['small', 'medium', 'large'].includes(value),
				validationMessage: 'Font size must be one of: small, medium, large',
			},
			layoutDensity: {
				type: 'string',
				enum: ['compact', 'normal', 'spacious'],
				validator: (value: any) => ['compact', 'normal', 'spacious'].includes(value),
				validationMessage: 'Layout density must be one of: compact, normal, spacious',
			},
			animationsEnabled: { type: 'boolean' },
			notificationsEnabled: { type: 'boolean' },
			autoSave: { type: 'boolean' },
		});

		// Tools preferences validation
		this.validationRules.set('tools', {
			defaultCodeLanguage: {
				type: 'string',
				validator: (value: any) => /^[a-z0-9+-]+$/.test(value),
				validationMessage: 'Language code must be valid',
			},
			editorTheme: {
				type: 'string',
				validator: (value: any) => value.length > 0,
				validationMessage: 'Editor theme must be specified',
			},
			tabSize: {
				type: 'number',
				min: 1,
				max: 8,
				validator: (value: any) => Number.isInteger(value),
				validationMessage: 'Tab size must be an integer between 1 and 8',
			},
			wordWrap: { type: 'boolean' },
			lineNumbers: { type: 'boolean' },
			minimap: { type: 'boolean' },
			autoFormat: { type: 'boolean' },
			favoriteTools: {
				type: 'object',
				validator: (value: any) => Array.isArray(value) && value.every(item => typeof item === 'string'),
				validationMessage: 'Favorite tools must be an array of strings',
			},
			recentTools: {
				type: 'object',
				validator: (value: any) => Array.isArray(value) && value.every(item => typeof item === 'string'),
				validationMessage: 'Recent tools must be an array of strings',
			},
			toolSpecificSettings: { type: 'object' },
		});

		// Privacy preferences validation
		this.validationRules.set('privacy', {
			analyticsConsent: { type: 'boolean' },
			storageConsent: { type: 'boolean' },
			syncConsent: { type: 'boolean' },
			dataRetention: {
				type: 'string',
				enum: ['session', 'day', 'week', 'month', 'year'],
				validator: (value: any) => ['session', 'day', 'week', 'month', 'year'].includes(value),
				validationMessage: 'Data retention must be one of: session, day, week, month, year',
			},
			sensitiveDataHandling: {
				type: 'string',
				enum: ['encrypt', 'hash', 'exclude'],
				validator: (value: any) => ['encrypt', 'hash', 'exclude'].includes(value),
				validationMessage: 'Sensitive data handling must be one of: encrypt, hash, exclude',
			},
			anonymousMode: { type: 'boolean' },
		});

		// Features preferences validation
		this.validationRules.set('features', {
			betaFeatures: { type: 'boolean' },
			experimentalFeatures: { type: 'boolean' },
			advancedMode: { type: 'boolean' },
			keyboardShortcuts: { type: 'boolean' },
			toolTips: { type: 'boolean' },
			contextualHelp: { type: 'boolean' },
		});

		// Performance preferences validation
		this.validationRules.set('performance', {
			enableCompression: { type: 'boolean' },
			enableLazyLoading: { type: 'boolean' },
			cacheSize: {
				type: 'number',
				min: 10,
				max: 1000,
				validator: (value: any) => Number.isInteger(value),
				validationMessage: 'Cache size must be an integer between 10 and 1000',
			},
			debounceDelay: {
				type: 'number',
				min: 50,
				max: 2000,
				validator: (value: any) => Number.isInteger(value),
				validationMessage: 'Debounce delay must be an integer between 50 and 2000ms',
			},
			maxHistoryItems: {
				type: 'number',
				min: 10,
				max: 1000,
				validator: (value: any) => Number.isInteger(value),
				validationMessage: 'Max history items must be an integer between 10 and 1000',
			},
		});
	}

	private mergePreferences(
		existing: UserPreferences,
		imported: UserPreferences,
		preserveExisting: boolean = false
	): UserPreferences {
		if (preserveExisting) {
			// Only add imported preferences that don't exist in existing
			const merged = { ...existing };

			for (const [category, importedData] of Object.entries(imported)) {
				const categoryKey = category as keyof UserPreferences;
				if (!existing[categoryKey] || typeof existing[categoryKey] !== typeof importedData) {
					merged[categoryKey] = importedData;
				} else {
					// Merge object properties
					if (typeof importedData === 'object' && importedData !== null) {
						merged[categoryKey] = {
							...existing[categoryKey],
							...importedData,
						} as any;
					}
				}
			}

			return merged;
		} else {
			// Import overrides existing
			return {
				...existing,
				...imported,
			};
		}
	}

	private async migratePreferences(preferences: UserPreferences): Promise<void> {
		// Handle preference migrations for different versions
		// This would be used when updating the app and changing preference structure

		// Example migration
		if (!preferences.performance.debounceDelay) {
			preferences.performance.debounceDelay = 300;
		}

		// Add more migrations as needed
	}

	private setupCrossTabSync(): void {
		// Listen for storage events from other tabs
		window.addEventListener('storage', (event) => {
			if (event.key?.startsWith('session:') && event.newValue) {
				try {
					const updatedSession = JSON.parse(event.newValue);
					if (updatedSession.preferences) {
						this.triggerSyncEvent({
							type: 'preference_updated',
							category: 'ui' as any, // Generic since we don't know which category changed
							timestamp: new Date(),
							tabId: 'other-tab',
						});
					}
				} catch (error) {
					console.warn('Failed to parse sync event:', error);
				}
			}
		});
	}

	private triggerSyncEvent(event: PreferencesSyncEvent): void {
		// Notify all listeners
		this.listeners.forEach(listener => {
			try {
				listener(event);
			} catch (error) {
				console.error('Error in preference sync listener:', error);
			}
		});
	}

	private async getTabId(): Promise<string> {
		// Get current tab ID from session storage
		const session = await sessionStorageCore.getSession();
		return session?.metadata.tabId || 'unknown';
	}

	private async getUserId(): Promise<string | undefined> {
		// Get current user ID from session storage
		const session = await sessionStorageCore.getSession();
		return session?.userId;
	}

	private async getDeviceFingerprint(): Promise<string> {
		// Generate device fingerprint
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
}

// Types for validation rules
interface ValidationRule {
	type?: 'string' | 'number' | 'boolean' | 'object';
	enum?: any[];
	min?: number;
	max?: number;
	validator?: (value: any) => boolean;
	validationMessage?: string;
	warning?: (value: any) => boolean;
	warningMessage?: string;
}

interface ValidationRules {
	[fieldName: string]: ValidationRule;
}

// Export singleton instance
export const userPreferencesManager = UserPreferencesManager.getInstance();

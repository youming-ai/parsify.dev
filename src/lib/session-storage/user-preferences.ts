/**
 * User Preferences Storage and Synchronization
 * Advanced preference management with validation, migration, and sync
 */

import { sessionStorageCore, type UserPreferences, type SessionData } from './session-storage-core';
import { EventEmitter } from 'events';

export interface PreferenceValidationRule {
	key: string;
	required?: boolean;
	type: 'string' | 'number' | 'boolean' | 'array' | 'object';
	validator?: (value: any) => boolean;
	defaultValue?: any;
	description?: string;
}

export interface PreferenceMigration {
	version: string;
	description: string;
	migrate: (preferences: any) => Promise<any>;
}

export interface PreferenceChangeEvent {
	key: string;
	oldValue: any;
	newValue: any;
	category: string;
	timestamp: Date;
	source: 'user' | 'sync' | 'migration' | 'default';
}

export interface PreferenceBackup {
	version: string;
	timestamp: Date;
	preferences: UserPreferences;
	metadata: {
		deviceFingerprint: string;
		tabId: string;
		exportReason: 'manual' | 'auto' | 'migration' | 'conflict';
	};
}

export interface PreferenceSyncConflict {
	key: string;
	localValue: any;
	remoteValue: any;
	timestamp: Date;
	resolution?: 'local' | 'remote' | 'merge';
}

export class UserPreferencesManager extends EventEmitter {
	private static instance: UserPreferencesManager;
	private preferences: UserPreferences | null = null;
	private validationRules: Map<string, PreferenceValidationRule[]> = new Map();
	private migrations: PreferenceMigration[] = [];
	private syncEnabled = true;
	private autoSaveEnabled = true;
	private autoSaveTimeout?: NodeJS.Timeout;
	private lastSyncAt?: Date;
	private conflictResolver?: (conflict: PreferenceSyncConflict) => Promise<any>;

	private constructor() {
		super();
		this.setupValidationRules();
		this.setupMigrations();
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
			// Load existing preferences
			await this.loadPreferences();

			// Run migrations if needed
			await this.runMigrations();

			// Setup auto-save
			this.setupAutoSave();

			// Setup sync listeners
			this.setupSyncListeners();

			console.log('User preferences manager initialized');

		} catch (error) {
			console.error('Failed to initialize preferences manager:', error);
			throw error;
		}
	}

	// Get all preferences
	public async getPreferences(): Promise<UserPreferences> {
		if (!this.preferences) {
			await this.loadPreferences();
		}
		return { ...this.preferences! } as UserPreferences;
	}

	// Get specific preference
	public async getPreference<T = any>(category: keyof UserPreferences, key?: string): Promise<T> {
		const preferences = await this.getPreferences();

		if (!key) {
			return preferences[category] as T;
		}

		return preferences[category]?.[key] as T;
	}

	// Update preference
	public async setPreference(
		category: keyof UserPreferences,
		key: string,
		value: any,
		options: {
			silent?: boolean;
			skipValidation?: boolean;
			noAutoSave?: boolean;
		} = {}
	): Promise<void> {
		try {
			const preferences = await this.getPreferences();
			const oldValue = preferences[category]?.[key];

			// Validate the new value
			if (!options.skipValidation) {
				await this.validatePreference(category, key, value);
			}

			// Update the value
			if (!preferences[category]) {
				preferences[category] = {} as any;
			}
			preferences[category][key] = value;

			// Save preferences
			if (!options.noAutoSave && this.autoSaveEnabled) {
				await this.savePreferences(preferences);
			}

			// Emit change event
			if (!options.silent && oldValue !== value) {
				this.emit('preferenceChange', {
					key: `${category}.${key}`,
					oldValue,
					newValue: value,
					category: category as string,
					timestamp: new Date(),
					source: 'user',
				} as PreferenceChangeEvent);
			}

		} catch (error) {
			console.error(`Failed to set preference ${category}.${key}:`, error);
			throw error;
		}
	}

	// Update multiple preferences
	public async setPreferences(
		updates: Array<{
			category: keyof UserPreferences;
			key: string;
			value: any;
		}>,
		options: {
			silent?: boolean;
			skipValidation?: boolean;
			noAutoSave?: boolean;
		} = {}
	): Promise<void> {
		try {
			const preferences = await this.getPreferences();
			const changes: PreferenceChangeEvent[] = [];

			for (const update of updates) {
				const oldValue = preferences[update.category]?.[update.key];

				// Validate
				if (!options.skipValidation) {
					await this.validatePreference(update.category, update.key, update.value);
				}

				// Update
				if (!preferences[update.category]) {
					preferences[update.category] = {} as any;
				}
				preferences[update.category][update.key] = update.value;

				// Track change
				if (oldValue !== update.value) {
					changes.push({
						key: `${update.category}.${update.key}`,
						oldValue,
						newValue: update.value,
						category: update.category as string,
						timestamp: new Date(),
						source: 'user',
					});
				}
			}

			// Save preferences
			if (!options.noAutoSave && this.autoSaveEnabled) {
				await this.savePreferences(preferences);
			}

			// Emit change events
			if (!options.silent && changes.length > 0) {
				changes.forEach(change => this.emit('preferenceChange', change));
				this.emit('preferencesChanged', changes);
			}

		} catch (error) {
			console.error('Failed to set multiple preferences:', error);
			throw error;
		}
	}

	// Reset preference to default
	public async resetPreference(category: keyof UserPreferences, key: string): Promise<void> {
		try {
			const defaultValue = await this.getDefaultValue(category, key);
			await this.setPreference(category, key, defaultValue);
			console.log(`Reset preference ${category}.${key} to default value`);

		} catch (error) {
			console.error(`Failed to reset preference ${category}.${key}:`, error);
			throw error;
		}
	}

	// Reset entire category
	public async resetCategory(category: keyof UserPreferences): Promise<void> {
		try {
			const defaults = await this.getDefaultCategoryValues(category);
			const preferences = await this.getPreferences();

			preferences[category] = defaults;
			await this.savePreferences(preferences);

			this.emit('categoryReset', {
				category,
				timestamp: new Date(),
			});

			console.log(`Reset category ${category} to defaults`);

		} catch (error) {
			console.error(`Failed to reset category ${category}:`, error);
			throw error;
		}
	}

	// Reset all preferences
	public async resetAllPreferences(): Promise<void> {
		try {
			const defaults = await sessionStorageCore.getSession() || await sessionStorageCore.createSession();
			this.preferences = defaults.preferences;

			await this.savePreferences(this.preferences);

			this.emit('allPreferencesReset', {
				timestamp: new Date(),
			});

			console.log('Reset all preferences to defaults');

		} catch (error) {
			console.error('Failed to reset all preferences:', error);
			throw error;
		}
	}

	// Import preferences
	public async importPreferences(
		preferences: Partial<UserPreferences>,
		options: {
			merge?: boolean;
			validate?: boolean;
			backup?: boolean;
		} = {}
	): Promise<void> {
		try {
			// Create backup if requested
			if (options.backup && this.preferences) {
				await this.createBackup('import');
			}

			let newPreferences: UserPreferences;

			if (options.merge && this.preferences) {
				// Merge with existing preferences
				newPreferences = this.deepMerge(this.preferences, preferences);
			} else {
				// Replace with imported preferences
				newPreferences = { ...this.preferences!, ...preferences } as UserPreferences;
			}

			// Validate if requested
			if (options.validate) {
				await this.validateAllPreferences(newPreferences);
			}

			// Save
			await this.savePreferences(newPreferences);

			this.emit('preferencesImported', {
				timestamp: new Date(),
				merged: options.merge || false,
			});

			console.log('Preferences imported successfully');

		} catch (error) {
			console.error('Failed to import preferences:', error);
			throw error;
		}
	}

	// Export preferences
	public async exportPreferences(options: {
		includeMetadata?: boolean;
		format?: 'json' | 'csv';
		filter?: Array<{ category: keyof UserPreferences; key?: string }>;
	} = {}): Promise<string> {
		try {
			let preferences = await this.getPreferences();

			// Apply filters if provided
			if (options.filter) {
				const filtered: any = {};
				for (const filter of options.filter) {
					if (!filtered[filter.category]) {
						filtered[filter.category] = {};
					}
					if (filter.key) {
						filtered[filter.category][filter.key] = preferences[filter.category]?.[filter.key];
					} else {
						filtered[filter.category] = preferences[filter.category];
					}
				}
				preferences = filtered;
			}

			const exportData: any = {
				preferences,
				exportedAt: new Date().toISOString(),
				version: '1.0.0',
			};

			if (options.includeMetadata) {
				exportData.metadata = {
					deviceFingerprint: 'current',
					tabId: 'current',
					totalPreferences: this.countPreferences(preferences),
				};
			}

			if (options.format === 'csv') {
				return this.convertToCSV(preferences);
			}

			return JSON.stringify(exportData, null, 2);

		} catch (error) {
			console.error('Failed to export preferences:', error);
			throw error;
		}
	}

	// Create backup
	public async createBackup(reason: 'manual' | 'auto' | 'migration' | 'conflict' = 'manual'): Promise<string> {
		try {
			const preferences = await this.getPreferences();
			const backup: PreferenceBackup = {
				version: '1.0.0',
				timestamp: new Date(),
				preferences,
				metadata: {
					deviceFingerprint: 'current',
					tabId: 'current',
					exportReason: reason,
				},
			};

			const backupKey = `preferences_backup_${Date.now()}`;
			localStorage.setItem(backupKey, JSON.stringify(backup));

			console.log(`Preferences backup created: ${backupKey}`);
			return backupKey;

		} catch (error) {
			console.error('Failed to create backup:', error);
			throw error;
		}
	}

	// Restore from backup
	public async restoreBackup(backupKey: string): Promise<void> {
		try {
			const backupData = localStorage.getItem(backupKey);
			if (!backupData) {
				throw new Error(`Backup not found: ${backupKey}`);
			}

			const backup: PreferenceBackup = JSON.parse(backupData);
			await this.savePreferences(backup.preferences);

			this.emit('preferencesRestored', {
				backupKey,
				backupDate: backup.timestamp,
				timestamp: new Date(),
			});

			console.log(`Preferences restored from backup: ${backupKey}`);

		} catch (error) {
			console.error('Failed to restore backup:', error);
			throw error;
		}
	}

	// List available backups
	public listBackups(): Array<{ key: string; timestamp: Date; reason: string }> {
		const backups: Array<{ key: string; timestamp: Date; reason: string }> = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith('preferences_backup_')) {
				try {
					const backup: PreferenceBackup = JSON.parse(localStorage.getItem(key)!);
					backups.push({
						key,
						timestamp: new Date(backup.timestamp),
						reason: backup.metadata.exportReason,
					});
				} catch (error) {
					console.warn(`Invalid backup: ${key}`);
				}
			}
		}

		return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
	}

	// Delete backup
	public deleteBackup(backupKey: string): void {
		localStorage.removeItem(backupKey);
		console.log(`Deleted backup: ${backupKey}`);
	}

	// Enable/disable sync
	public setSyncEnabled(enabled: boolean): void {
		this.syncEnabled = enabled;
		this.emit('syncStatusChanged', { enabled, timestamp: new Date() });
	}

	// Enable/disable auto-save
	public setAutoSaveEnabled(enabled: boolean): void {
		this.autoSaveEnabled = enabled;
		if (!enabled && this.autoSaveTimeout) {
			clearTimeout(this.autoSaveTimeout);
		}
		this.emit('autoSaveStatusChanged', { enabled, timestamp: new Date() });
	}

	// Get preference validation rules
	public getValidationRules(category: keyof UserPreferences): PreferenceValidationRule[] {
		return this.validationRules.get(category as string) || [];
	}

	// Add custom validation rule
	public addValidationRule(category: keyof UserPreferences, rule: PreferenceValidationRule): void {
		const existing = this.validationRules.get(category as string) || [];
		existing.push(rule);
		this.validationRules.set(category as string, existing);
	}

	// Add migration
	public addMigration(migration: PreferenceMigration): void {
		this.migrations.push(migration);
		this.migrations.sort((a, b) => a.version.localeCompare(b.version));
	}

	// Get last sync timestamp
	public getLastSyncAt(): Date | undefined {
		return this.lastSyncAt;
	}

	// Force sync with other tabs
	public async forceSync(): Promise<void> {
		try {
			const preferences = await this.getPreferences();
			await this.savePreferences(preferences);
			this.lastSyncAt = new Date();
			this.emit('syncCompleted', { timestamp: this.lastSyncAt });
		} catch (error) {
			console.error('Failed to force sync:', error);
			throw error;
		}
	}

	// Private methods

	private async loadPreferences(): Promise<void> {
		try {
			const session = await sessionStorageCore.getSession();
			if (session) {
				this.preferences = session.preferences;
			} else {
				// Create new session with default preferences
				const sessionId = await sessionStorageCore.createSession();
				const newSession = await sessionStorageCore.getSession(sessionId);
				this.preferences = newSession?.preferences || await this.getDefaultPreferences();
			}
		} catch (error) {
			console.error('Failed to load preferences:', error);
			this.preferences = await this.getDefaultPreferences();
		}
	}

	private async savePreferences(preferences: UserPreferences): Promise<void> {
		try {
			// Update core session
			const session = await sessionStorageCore.getSession();
			if (session) {
				session.preferences = preferences;
				await sessionStorageCore.saveSession(session.id, session);
			} else {
				// Create new session
				const sessionId = await sessionStorageCore.createSession();
				const newSession = await sessionStorageCore.getSession(sessionId);
				if (newSession) {
					newSession.preferences = preferences;
					await sessionStorageCore.saveSession(sessionId, newSession);
				}
			}

			this.preferences = preferences;
			this.lastSyncAt = new Date();

		} catch (error) {
			console.error('Failed to save preferences:', error);
			throw error;
		}
	}

	private setupAutoSave(): void {
		// Auto-save is handled by the session storage core
		// This is just for additional auto-save logic if needed
	}

	private setupSyncListeners(): void {
		// Listen for sync events from session storage core
		sessionStorageCore.on?.('sync', (event: any) => {
			if (event.key?.startsWith('session:')) {
				this.handleSyncEvent(event);
			}
		});
	}

	private handleSyncEvent(event: any): void {
		// Handle cross-tab sync events
		this.emit('syncEvent', event);
	}

	private async validatePreference(category: keyof UserPreferences, key: string, value: any): Promise<void> {
		const rules = this.validationRules.get(category as string);
		if (!rules) return;

		const rule = rules.find(r => r.key === key);
		if (!rule) return;

		// Type validation
		if (rule.type && typeof value !== rule.type) {
			throw new Error(`Invalid type for ${category}.${key}: expected ${rule.type}, got ${typeof value}`);
		}

		// Custom validation
		if (rule.validator && !rule.validator(value)) {
			throw new Error(`Validation failed for ${category}.${key}`);
		}

		// Required validation
		if (rule.required && (value === undefined || value === null)) {
			throw new Error(`Required preference ${category}.${key} is missing`);
		}
	}

	private async validateAllPreferences(preferences: UserPreferences): Promise<void> {
		for (const [categoryName, rules] of this.validationRules) {
			const category = categoryName as keyof UserPreferences;
			for (const rule of rules) {
				if (rule.required && preferences[category]?.[rule.key] === undefined) {
					throw new Error(`Required preference ${category}.${rule.key} is missing`);
				}
			}
		}
	}

	private async getDefaultValue(category: keyof UserPreferences, key: string): Promise<any> {
		const rules = this.validationRules.get(category as string);
		const rule = rules?.find(r => r.key === key);
		return rule?.defaultValue;
	}

	private async getDefaultCategoryValues(category: keyof UserPreferences): Promise<any> {
		const defaults: any = {};
		const rules = this.validationRules.get(category as string);
		if (rules) {
			for (const rule of rules) {
				if (rule.defaultValue !== undefined) {
					defaults[rule.key] = rule.defaultValue;
				}
			}
		}
		return defaults;
	}

	private async getDefaultPreferences(): Promise<UserPreferences> {
		// Get session from core for default preferences
		const session = await sessionStorageCore.createSession();
		const sessionData = await sessionStorageCore.getSession(session);
		return sessionData?.preferences || {} as UserPreferences;
	}

	private setupValidationRules(): void {
		// UI preferences validation
		this.validationRules.set('ui', [
			{
				key: 'theme',
				type: 'string',
				validator: (value) => ['light', 'dark', 'system'].includes(value),
				defaultValue: 'system',
				description: 'Theme preference',
			},
			{
				key: 'language',
				type: 'string',
				validator: (value) => /^[a-z]{2}(-[A-Z]{2})?$/.test(value),
				defaultValue: 'en',
				description: 'Language code',
			},
			{
				key: 'fontSize',
				type: 'string',
				validator: (value) => ['small', 'medium', 'large'].includes(value),
				defaultValue: 'medium',
				description: 'Font size preference',
			},
			{
				key: 'animationsEnabled',
				type: 'boolean',
				defaultValue: true,
				description: 'Enable animations',
			},
			{
				key: 'notificationsEnabled',
				type: 'boolean',
				defaultValue: true,
				description: 'Enable notifications',
			},
			{
				key: 'autoSave',
				type: 'boolean',
				defaultValue: true,
				description: 'Enable auto-save',
			},
		]);

		// Tool preferences validation
		this.validationRules.set('tools', [
			{
				key: 'defaultCodeLanguage',
				type: 'string',
				validator: (value) => ['javascript', 'python', 'java', 'cpp', 'typescript'].includes(value),
				defaultValue: 'javascript',
				description: 'Default code language',
			},
			{
				key: 'tabSize',
				type: 'number',
				validator: (value) => Number.isInteger(value) && value >= 1 && value <= 8,
				defaultValue: 2,
				description: 'Editor tab size',
			},
			{
				key: 'wordWrap',
				type: 'boolean',
				defaultValue: true,
				description: 'Enable word wrap',
			},
			{
				key: 'lineNumbers',
				type: 'boolean',
				defaultValue: true,
				description: 'Show line numbers',
			},
			{
				key: 'autoFormat',
				type: 'boolean',
				defaultValue: false,
				description: 'Auto-format code',
			},
		]);

		// Privacy preferences validation
		this.validationRules.set('privacy', [
			{
				key: 'analyticsConsent',
				type: 'boolean',
				defaultValue: true,
				description: 'Analytics consent',
			},
			{
				key: 'storageConsent',
				type: 'boolean',
				defaultValue: true,
				description: 'Storage consent',
			},
			{
				key: 'dataRetention',
				type: 'string',
				validator: (value) => ['session', 'day', 'week', 'month', 'year'].includes(value),
				defaultValue: 'month',
				description: 'Data retention period',
			},
			{
				key: 'anonymousMode',
				type: 'boolean',
				defaultValue: false,
				description: 'Anonymous mode',
			},
		]);
	}

	private setupMigrations(): void {
		// Add migration rules as needed for future updates
		// Example:
		// this.addMigration({
		//   version: '1.1.0',
		//   description: 'Add new privacy settings',
		//   migrate: async (preferences) => {
		//     if (!preferences.privacy.newSetting) {
		//       preferences.privacy.newSetting = 'default';
		//     }
		//     return preferences;
		//   }
		// });
	}

	private async runMigrations(): Promise<void> {
		// Run pending migrations
		// Implementation would track current version and apply necessary migrations
	}

	private deepMerge(target: any, source: any): any {
		const result = { ...target };

		for (const key in source) {
			if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
				result[key] = this.deepMerge(result[key] || {}, source[key]);
			} else {
				result[key] = source[key];
			}
		}

		return result;
	}

	private countPreferences(preferences: UserPreferences): number {
		let count = 0;
		for (const category of Object.values(preferences)) {
			if (category && typeof category === 'object') {
				count += Object.keys(category).length;
			}
		}
		return count;
	}

	private convertToCSV(preferences: any): string {
		const rows: string[] = [];
		rows.push('Category,Key,Value,Type');

		for (const [categoryName, category] of Object.entries(preferences)) {
			if (category && typeof category === 'object') {
				for (const [key, value] of Object.entries(category)) {
					const escapedValue = String(value).replace(/"/g, '""');
					rows.push(`"${categoryName}","${key}","${escapedValue}","${typeof value}"`);
				}
			}
		}

		return rows.join('\n');
	}
}

// Export singleton instance
export const userPreferencesManager = UserPreferencesManager.getInstance();

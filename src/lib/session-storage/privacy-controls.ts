/**
 * Privacy Controls and User Consent Management - T161 Implementation
 * Comprehensive privacy management with GDPR compliance and user control
 */

export interface ConsentRecord {
	id: string;
	type: 'analytics' | 'storage' | 'sync' | 'marketing' | 'personalization';
	given: boolean;
	timestamp: Date;
	version: string;
	purpose: string;
	dataCategories: string[];
	retentionPeriod: number; // days
	withdrawn?: Date;
	ipAddress?: string;
	userAgent?: string;
}

export interface PrivacySettings {
	// Consent settings
	consent: {
		analytics: boolean;
		storage: boolean;
		sync: boolean;
		marketing: boolean;
		personalization: boolean;
		essentialOnly: boolean; // Only essential cookies/features
	};

	// Data handling settings
	dataHandling: {
		anonymizeIP: boolean;
		hashIdentifiers: boolean;
		encryptSensitiveData: boolean;
		excludePersonalInfo: boolean;
		dontTrackHeader: boolean;
	};

	// Retention settings
	retention: {
		sessionData: 'session' | 'day' | 'week' | 'month' | 'year' | 'custom';
		analyticsData: 'day' | 'week' | 'month' | 'year' | 'custom';
		errorLogs: 'day' | 'week' | 'month' | 'year';
		customPeriod: number; // days
		autoDelete: boolean;
	};

	// Access and export settings
	access: {
		dataPortability: boolean;
		exportFormat: 'json' | 'csv' | 'xml';
		includeAnalytics: boolean;
		includeErrors: boolean;
		compressionEnabled: boolean;
	};

	// Regional compliance settings
	compliance: {
		region: 'EU' | 'US' | 'CA' | 'AU' | 'OTHER';
		gdprCompliant: boolean;
		ccpaCompliant: boolean;
		ageVerification: boolean;
		parentalConsent: boolean;
	};
}

export interface DataSubject {
	id: string;
	identifier: string; // Hashed user ID or anonymous identifier
	region: string;
	ageVerified: boolean;
	parentalConsent?: Date;
	consents: ConsentRecord[];
	preferences: PrivacySettings;
	created: Date;
	lastUpdated: Date;
	dataRequests: DataRequest[];
}

export interface DataRequest {
	id: string;
	type: 'access' | 'portability' | 'deletion' | 'rectification' | 'restriction';
	status: 'pending' | 'processing' | 'completed' | 'rejected';
	requestedAt: Date;
	completedAt?: Date;
	details: string;
	evidence?: string;
	contactEmail?: string;
}

export interface PrivacyAudit {
	id: string;
	timestamp: Date;
	type: 'consent_check' | 'data_audit' | 'compliance_check' | 'security_scan';
	results: {
		consentValid: boolean;
		dataSecure: boolean;
		compliant: boolean;
		issues: Array<{
			severity: 'low' | 'medium' | 'high' | 'critical';
			description: string;
			recommendation: string;
		}>;
	};
	actions: Array<{
		type: 'delete_data' | 'update_consent' | 'anonymize_data' | 'notify_user';
		description: string;
		completed: boolean;
	}>;
}

export interface SensitiveDataHandler {
	type: 'encrypt' | 'hash' | 'mask' | 'exclude';
	fields: string[];
	handler: (value: any, context: any) => any;
}

export class PrivacyControls {
	private static instance: PrivacyControls;
	private isInitialized = false;
	private consentRequired = false;
	private currentSubject: DataSubject | null = null;
	private sensitiveDataHandlers: Map<string, SensitiveDataHandler> = new Map();
	private consentListeners: Set<(consents: ConsentRecord[]) => void> = new Set();
	private auditHistory: PrivacyAudit[] = [];
	private config = {
		consentVersion: '1.0.0',
		defaultRegion: 'US' as const,
		auditRetentionDays: 365,
		maxDataRequestsPerMonth: 10,
		encryptionKey: '',
	};

	private constructor() {
		this.initializeSensitiveDataHandlers();
	}

	public static getInstance(): PrivacyControls {
		if (!PrivacyControls.instance) {
			PrivacyControls.instance = new PrivacyControls();
		}
		return PrivacyControls.instance;
	}

	// Initialize privacy controls
	public async initialize(): Promise<void> {
		try {
			// Check regional requirements
			await this.detectRegion();

			// Load existing consent if available
			await this.loadExistingConsent();

			// Initialize encryption keys
			await this.initializeEncryption();

			// Run privacy audit
			await this.runPrivacyAudit('consent_check');

			// Setup cleanup routines
			this.setupCleanupRoutines();

			this.isInitialized = true;
			console.log('Privacy controls initialized');
			console.log(`Region: ${this.config.defaultRegion}`);
			console.log(`Consent required: ${this.consentRequired}`);

		} catch (error) {
			console.error('Failed to initialize privacy controls:', error);
			throw error;
		}
	}

	// Request user consent
	public async requestConsent(
		types: Array<'analytics' | 'storage' | 'sync' | 'marketing' | 'personalization'>,
		options?: {
			required?: boolean;
			purpose?: string;
			detailed?: boolean;
		}
	): Promise<ConsentRecord[]> {
		const consents: ConsentRecord[] = [];

		for (const type of types) {
			const consent: ConsentRecord = {
				id: this.generateConsentId(),
				type,
				given: false, // Will be set by user action
				timestamp: new Date(),
				version: this.config.consentVersion,
				purpose: options?.purpose || this.getDefaultPurpose(type),
				dataCategories: this.getDataCategories(type),
				retentionPeriod: this.getDefaultRetentionPeriod(type),
				ipAddress: await this.getAnonymizedIP(),
				userAgent: navigator.userAgent,
			};

			consents.push(consent);
		}

		// If not required and not in privacy-focused region, grant default consent
		if (!options?.required && !this.consentRequired) {
			consents.forEach(consent => {
				consent.given = true;
			});
			await this.saveConsents(consents);
		}

		return consents;
	}

	// Grant consent
	public async grantConsent(
		consentId: string,
		data?: {
			ipAddress?: string;
			userAgent?: string;
		}
	): Promise<void> {
		const consent = await this.findConsent(consentId);
		if (!consent) {
			throw new Error(`Consent not found: ${consentId}`);
		}

		consent.given = true;
		consent.timestamp = new Date();
		if (data?.ipAddress) consent.ipAddress = data.ipAddress;
		if (data?.userAgent) consent.userAgent = data.userAgent;

		await this.saveConsents([consent]);
		await this.updateCurrentSubject();

		// Notify listeners
		this.notifyConsentChange(await this.getAllConsents());
	}

	// Withdraw consent
	public async withdrawConsent(consentId: string, reason?: string): Promise<void> {
		const consent = await this.findConsent(consentId);
		if (!consent) {
			throw new Error(`Consent not found: ${consentId}`);
		}

		consent.given = false;
		consent.withdrawn = new Date();

		await this.saveConsents([consent]);
		await this.updateCurrentSubject();

		// Trigger data cleanup based on withdrawn consent
		await this.handleConsentWithdrawal(consent);

		// Notify listeners
		this.notifyConsentChange(await this.getAllConsents());
	}

	// Check if consent is valid
	public async hasConsent(type: 'analytics' | 'storage' | 'sync' | 'marketing' | 'personalization'): Promise<boolean> {
		const consents = await this.getAllConsents();
		const consent = consents.find(c => c.type === type && c.given && !c.withdrawn);
		return !!consent;
	}

	// Get all consents
	public async getAllConsents(): Promise<ConsentRecord[]> {
		if (!this.currentSubject) return [];
		return this.currentSubject.consents;
	}

	// Update privacy settings
	public async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
		if (!this.currentSubject) {
			this.currentSubject = await this.createDataSubject();
		}

		// Merge with existing settings
		const updatedSettings = this.mergePrivacySettings(
			this.currentSubject.preferences,
			settings
		);

		// Validate settings
		this.validatePrivacySettings(updatedSettings);

		// Save updated settings
		this.currentSubject.preferences = updatedSettings;
		this.currentSubject.lastUpdated = new Date();

		await this.saveCurrentSubject();

		// Apply new settings
		await this.applyPrivacySettings(updatedSettings);
	}

	// Get privacy settings
	public async getPrivacySettings(): Promise<PrivacySettings> {
		if (!this.currentSubject) {
			this.currentSubject = await this.createDataSubject();
		}
		return this.currentSubject.preferences;
	}

	// Export user data (GDPR Article 20)
	public async exportUserData(options?: {
		format?: 'json' | 'csv' | 'xml';
		includeAnalytics?: boolean;
		includeErrors?: boolean;
		compress?: boolean;
	}): Promise<Blob> {
		if (!this.currentSubject) {
			throw new Error('No user data to export');
		}

		const format = options?.format || this.currentSubject.preferences.access.exportFormat;
		const includeAnalytics = options?.includeAnalytics ?? this.currentSubject.preferences.access.includeAnalytics;
		const includeErrors = options?.includeErrors ?? this.currentSubject.preferences.access.includeErrors;

		const userData = await this.collectUserData(includeAnalytics, includeErrors);

		let content: string;
		let mimeType: string;

		switch (format) {
			case 'json':
				content = JSON.stringify(userData, null, 2);
				mimeType = 'application/json';
				break;
			case 'csv':
				content = this.convertToCSV(userData);
				mimeType = 'text/csv';
				break;
			case 'xml':
				content = this.convertToXML(userData);
				mimeType = 'application/xml';
				break;
			default:
				throw new Error(`Unsupported export format: ${format}`);
		}

		// Compress if requested
		if (options?.compress || this.currentSubject.preferences.access.compressionEnabled) {
			// Would implement compression here
		}

		return new Blob([content], { type: mimeType });
	}

	// Delete user data (GDPR Article 17 - Right to be forgotten)
	public async deleteUserData(reason?: string, options?: {
		anonymize?: boolean;
		deleteAnalytics?: boolean;
		deleteErrors?: boolean;
	}): Promise<void> {
		if (!this.currentSubject) {
			throw new Error('No user data to delete');
		}

		const dataRequest: DataRequest = {
			id: this.generateRequestId(),
			type: 'deletion',
			status: 'processing',
			requestedAt: new Date(),
			details: reason || 'User requested data deletion',
		};

		this.currentSubject.dataRequests.push(dataRequest);

		try {
			// Delete session data
			await this.deleteSessionData();

			// Delete analytics data if requested
			if (options?.deleteAnalytics) {
				await this.deleteAnalyticsData();
			}

			// Delete error logs if requested
			if (options?.deleteErrors) {
				await this.deleteErrorData();
			}

			// Anonymize if requested
			if (options?.anonymize) {
				await this.anonymizeUserData();
			} else {
				// Complete deletion
				await this.completeDataDeletion();
			}

			dataRequest.status = 'completed';
			dataRequest.completedAt = new Date();

			console.log('User data deletion completed');

		} catch (error) {
			dataRequest.status = 'rejected';
			console.error('Data deletion failed:', error);
			throw error;
		}

		await this.saveCurrentSubject();
	}

	// Process sensitive data
	public async processSensitiveData(
		data: any,
		context: {
			category: string;
			operation: 'store' | 'retrieve' | 'export' | 'analyze';
			userConsent?: boolean;
		}
	): Promise<any> {
		const settings = await this.getPrivacySettings();

		// Check if user has given consent for this operation
		if (context.operation === 'analyze' && !await this.hasConsent('analytics')) {
			return null;
		}

		// Apply privacy transformations
		let processedData = data;

		// Anonymize IP if enabled
		if (settings.dataHandling.anonymizeIP && data.ipAddress) {
			processedData.ipAddress = this.anonymizeIP(data.ipAddress);
		}

		// Hash identifiers if enabled
		if (settings.dataHandling.hashIdentifiers) {
			processedData = await this.hashIdentifiers(processedData);
		}

		// Apply sensitive data handlers
		for (const [field, handler] of this.sensitiveDataHandlers) {
			if (processedData[field] !== undefined) {
				processedData[field] = handler.handler(processedData[field], context);
			}
		}

		// Exclude personal info if enabled
		if (settings.dataHandling.excludePersonalInfo) {
			processedData = await this.excludePersonalInfo(processedData);
		}

		return processedData;
	}

	// Run privacy audit
	public async runPrivacyAudit(type: 'consent_check' | 'data_audit' | 'compliance_check' | 'security_scan'): Promise<PrivacyAudit> {
		const audit: PrivacyAudit = {
			id: this.generateAuditId(),
			timestamp: new Date(),
			type,
			results: {
				consentValid: true,
				dataSecure: true,
				compliant: true,
				issues: [],
			},
			actions: [],
		};

		try {
			switch (type) {
				case 'consent_check':
					await this.auditConsent(audit);
					break;
				case 'data_audit':
					await this.auditDataSecurity(audit);
					break;
				case 'compliance_check':
					await this.auditCompliance(audit);
					break;
				case 'security_scan':
					await this.auditSecurity(audit);
					break;
			}

		} catch (error) {
			audit.results.compliant = false;
			audit.results.issues.push({
				severity: 'critical',
				description: `Audit failed: ${error.message}`,
				recommendation: 'Review privacy implementation',
			});
		}

		this.auditHistory.push(audit);

		// Limit audit history
		if (this.auditHistory.length > 100) {
			this.auditHistory.shift();
		}

		return audit;
	}

	// Get audit history
	public getAuditHistory(days: number = 30): PrivacyAudit[] {
		const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
		return this.auditHistory.filter(audit => audit.timestamp >= cutoff);
	}

	// Add consent change listener
	public addConsentListener(listener: (consents: ConsentRecord[]) => void): void {
		this.consentListeners.add(listener);
	}

	// Remove consent change listener
	public removeConsentListener(listener: (consents: ConsentRecord[]) => void): void {
		this.consentListeners.delete(listener);
	}

	// Private helper methods

	private async detectRegion(): Promise<void> {
		// Simple region detection based on timezone
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		if (timezone.includes('Europe')) {
			this.config.defaultRegion = 'EU';
		} else if (timezone.includes('America')) {
			this.config.defaultRegion = 'US';
		} else if (timezone.includes('Canada')) {
			this.config.defaultRegion = 'CA';
		} else if (timezone.includes('Australia')) {
			this.config.defaultRegion = 'AU';
		}

		// Set consent requirement based on region
		this.consentRequired = ['EU', 'CA'].includes(this.config.defaultRegion);
	}

	private async loadExistingConsent(): Promise<void> {
		try {
			const stored = localStorage.getItem('privacy_consents');
			if (stored) {
				const consents = JSON.parse(stored) as ConsentRecord[];

				// Validate consent version
				const validConsents = consents.filter(consent =>
					consent.version === this.config.consentVersion
				);

				if (validConsents.length > 0) {
					this.currentSubject = {
						id: this.generateSubjectId(),
						identifier: this.generateIdentifier(),
						region: this.config.defaultRegion,
						ageVerified: false,
						consents: validConsents,
						preferences: this.getDefaultPrivacySettings(),
						created: new Date(),
						lastUpdated: new Date(),
						dataRequests: [],
					};
				}
			}
		} catch (error) {
			console.warn('Failed to load existing consent:', error);
		}
	}

	private async initializeEncryption(): Promise<void> {
		// Initialize encryption for sensitive data
		if (typeof window !== 'undefined' && window.crypto) {
			// Generate encryption key
			const key = await window.crypto.subtle.generateKey(
				{ name: 'AES-GCM', length: 256 },
				true,
				['encrypt', 'decrypt']
			);

			// Store key reference (would be more secure in production)
			this.config.encryptionKey = 'generated';
		}
	}

	private initializeSensitiveDataHandlers(): void {
		// Email handler
		this.sensitiveDataHandlers.set('email', {
			type: 'hash',
			fields: ['email'],
			handler: (value: string) => this.hashString(value),
		});

		// Phone handler
		this.sensitiveDataHandlers.set('phone', {
			type: 'mask',
			fields: ['phone', 'phoneNumber'],
			handler: (value: string) => this.maskPhone(value),
		});

		// Name handler
		this.sensitiveDataHandlers.set('name', {
			type: 'exclude',
			fields: ['firstName', 'lastName', 'fullName', 'name'],
			handler: () => '[REDACTED]',
		});

		// Address handler
		this.sensitiveDataHandlers.set('address', {
			type: 'exclude',
			fields: ['address', 'street', 'city', 'postalCode'],
			handler: () => '[REDACTED]',
		});
	}

	private async createDataSubject(): Promise<DataSubject> {
		return {
			id: this.generateSubjectId(),
			identifier: this.generateIdentifier(),
			region: this.config.defaultRegion,
			ageVerified: false,
			consents: [],
			preferences: this.getDefaultPrivacySettings(),
			created: new Date(),
			lastUpdated: new Date(),
			dataRequests: [],
		};
	}

	private getDefaultPrivacySettings(): PrivacySettings {
		return {
			consent: {
				analytics: !this.consentRequired,
				storage: !this.consentRequired,
				sync: !this.consentRequired,
				marketing: false,
				personalization: !this.consentRequired,
				essentialOnly: this.consentRequired,
			},

			dataHandling: {
				anonymizeIP: true,
				hashIdentifiers: true,
				encryptSensitiveData: true,
				excludePersonalInfo: false,
				dontTrackHeader: false,
			},

			retention: {
				sessionData: this.consentRequired ? 'session' : 'month',
				analyticsData: 'month',
				errorLogs: 'week',
				customPeriod: 30,
				autoDelete: true,
			},

			access: {
				dataPortability: true,
				exportFormat: 'json',
				includeAnalytics: false,
				includeErrors: false,
				compressionEnabled: false,
			},

			compliance: {
				region: this.config.defaultRegion,
				gdprCompliant: this.config.defaultRegion === 'EU',
				ccpaCompliant: this.config.defaultRegion === 'US',
				ageVerification: false,
				parentalConsent: false,
			},
		};
	}

	private mergePrivacySettings(
		existing: PrivacySettings,
		updates: Partial<PrivacySettings>
	): PrivacySettings {
		return {
			consent: { ...existing.consent, ...updates.consent },
			dataHandling: { ...existing.dataHandling, ...updates.dataHandling },
			retention: { ...existing.retention, ...updates.retention },
			access: { ...existing.access, ...updates.access },
			compliance: { ...existing.compliance, ...updates.compliance },
		};
	}

	private validatePrivacySettings(settings: PrivacySettings): void {
		// Validate retention periods
		if (settings.retention.customPeriod < 1 || settings.retention.customPeriod > 3650) {
			throw new Error('Custom retention period must be between 1 and 3650 days');
		}

		// Validate compliance settings
		if (settings.compliance.ageVerification && !settings.consent.analytics) {
			throw new Error('Age verification requires analytics consent');
		}
	}

	private async applyPrivacySettings(settings: PrivacySettings): Promise<void> {
		// Apply DNT header if enabled
		if (settings.dataHandling.dontTrackHeader) {
			// Would set DNT header
		}

		// Setup automatic deletion
		if (settings.retention.autoDelete) {
			this.setupAutoDeletion(settings.retention);
		}
	}

	private setupCleanupRoutines(): void {
		// Clean up expired audit logs
		setInterval(() => {
			const cutoff = new Date(Date.now() - this.config.auditRetentionDays * 24 * 60 * 60 * 1000);
			this.auditHistory = this.auditHistory.filter(audit => audit.timestamp >= cutoff);
		}, 24 * 60 * 60 * 1000); // Daily cleanup
	}

	private setupAutoDeletion(retention: PrivacySettings['retention']): void {
		// Setup automatic data deletion based on retention settings
		const retentionMs = this.getRetentionMs(retention);

		setInterval(async () => {
			await this.deleteExpiredData(retentionMs);
		}, 60 * 60 * 1000); // Check hourly
	}

	private getRetentionMs(retention: PrivacySettings['retention']): number {
		switch (retention.sessionData) {
			case 'session': return 0;
			case 'day': return 24 * 60 * 60 * 1000;
			case 'week': return 7 * 24 * 60 * 60 * 1000;
			case 'month': return 30 * 24 * 60 * 60 * 1000;
			case 'year': return 365 * 24 * 60 * 60 * 1000;
			case 'custom': return retention.customPeriod * 24 * 60 * 60 * 1000;
			default: return 30 * 24 * 60 * 60 * 1000;
		}
	}

	private getDefaultPurpose(type: ConsentRecord['type']): string {
		const purposes = {
			analytics: 'To improve our services by analyzing usage patterns',
			storage: 'To save your preferences and session data',
			sync: 'To synchronize your data across devices',
			marketing: 'To send you relevant marketing communications',
			personalization: 'To personalize your experience',
		};
		return purposes[type];
	}

	private getDataCategories(type: ConsentRecord['type']): string[] {
		const categories = {
			analytics: ['usage_data', 'performance_data', 'error_logs'],
			storage: ['preferences', 'session_data', 'tool_data'],
			sync: ['preferences', 'session_data', 'working_state'],
			marketing: ['email', 'preferences', 'usage_patterns'],
			personalization: ['preferences', 'usage_data', 'interaction_data'],
		};
		return categories[type];
	}

	private getDefaultRetentionPeriod(type: ConsentRecord['type']): number {
		const periods = {
			analytics: 365, // 1 year
			storage: 30, // 30 days
			sync: 90, // 3 months
			marketing: 730, // 2 years
			personalization: 180, // 6 months
		};
		return periods[type];
	}

	private async getAnonymizedIP(): Promise<string> {
		// Would get actual IP and anonymize it
		return this.anonymizeIP('192.168.1.1');
	}

	private anonymizeIP(ip: string): string {
		const parts = ip.split('.');
		if (parts.length === 4) {
			// IPv4: Replace last octet with 0
			return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
		}
		return '0.0.0.0';
	}

	private async hashIdentifiers(data: any): Promise<any> {
		const hashed = { ...data };

		// Hash common identifier fields
		const identifierFields = ['userId', 'email', 'phone', 'name'];
		for (const field of identifierFields) {
			if (hashed[field]) {
				hashed[field] = await this.hashString(hashed[field]);
			}
		}

		return hashed;
	}

	private async hashString(str: string): Promise<string> {
		if (typeof window !== 'undefined' && window.crypto) {
			const encoder = new TextEncoder();
			const data = encoder.encode(str);
			const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		}
		return btoa(str);
	}

	private maskPhone(phone: string): string {
		// Simple phone masking - show last 4 digits
		const digits = phone.replace(/\D/g, '');
		if (digits.length >= 4) {
			return '*'.repeat(digits.length - 4) + digits.slice(-4);
		}
		return '****';
	}

	private async excludePersonalInfo(data: any): Promise<any> {
		const excluded = { ...data };
		const personalFields = ['name', 'email', 'phone', 'address', 'ssn', 'creditCard'];

		for (const field of personalFields) {
			if (excluded[field]) {
				excluded[field] = '[REDACTED]';
			}
		}

		return excluded;
	}

	private async saveConsents(consents: ConsentRecord[]): Promise<void> {
		if (!this.currentSubject) {
			this.currentSubject = await this.createDataSubject();
		}

		// Update or add consents
		for (const consent of consents) {
			const existingIndex = this.currentSubject.consents.findIndex(c => c.id === consent.id);
			if (existingIndex >= 0) {
				this.currentSubject.consents[existingIndex] = consent;
			} else {
				this.currentSubject.consents.push(consent);
			}
		}

		await this.saveCurrentSubject();
	}

	private async findConsent(consentId: string): Promise<ConsentRecord | null> {
		if (!this.currentSubject) return null;
		return this.currentSubject.consents.find(c => c.id === consentId) || null;
	}

	private async getAllConsents(): Promise<ConsentRecord[]> {
		if (!this.currentSubject) return [];
		return this.currentSubject.consents;
	}

	private async updateCurrentSubject(): Promise<void> {
		if (!this.currentSubject) return;
		this.currentSubject.lastUpdated = new Date();
		await this.saveCurrentSubject();
	}

	private async saveCurrentSubject(): Promise<void> {
		if (!this.currentSubject) return;

		try {
			localStorage.setItem('privacy_subject', JSON.stringify(this.currentSubject));
			localStorage.setItem('privacy_consents', JSON.stringify(this.currentSubject.consents));
		} catch (error) {
			console.error('Failed to save privacy data:', error);
		}
	}

	private notifyConsentChange(consents: ConsentRecord[]): void {
		this.consentListeners.forEach(listener => {
			try {
				listener(consents);
			} catch (error) {
				console.error('Error in consent listener:', error);
			}
		});
	}

	private async handleConsentWithdrawal(consent: ConsentRecord): Promise<void> {
		switch (consent.type) {
			case 'analytics':
				// Stop analytics collection
				await this.deleteAnalyticsData();
				break;
			case 'storage':
				// Clear stored data
				await this.deleteSessionData();
				break;
			case 'sync':
				// Stop synchronization
				await this.disableSync();
				break;
			case 'marketing':
				// Remove from marketing lists
				await this.removeMarketingConsent();
				break;
			case 'personalization':
				// Reset personalization settings
				await this.resetPersonalization();
				break;
		}
	}

	private async collectUserData(includeAnalytics: boolean, includeErrors: boolean): Promise<any> {
		if (!this.currentSubject) {
			throw new Error('No user data available');
		}

		const userData = {
			subject: {
				id: this.currentSubject.id,
				region: this.currentSubject.region,
				created: this.currentSubject.created,
				lastUpdated: this.currentSubject.lastUpdated,
			},
			consents: this.currentSubject.consents,
			preferences: this.currentSubject.preferences,
			dataRequests: this.currentSubject.dataRequests,
		};

		// Add session data
		try {
			const sessionData = localStorage.getItem('session_data');
			if (sessionData) {
				userData.sessionData = JSON.parse(sessionData);
			}
		} catch (error) {
			console.warn('Failed to collect session data:', error);
		}

		// Add analytics data if requested
		if (includeAnalytics) {
			try {
				const analyticsData = localStorage.getItem('analytics_data');
				if (analyticsData) {
					userData.analyticsData = JSON.parse(analyticsData);
				}
			} catch (error) {
				console.warn('Failed to collect analytics data:', error);
			}
		}

		// Add error data if requested
		if (includeErrors) {
			try {
				const errorData = localStorage.getItem('error_logs');
				if (errorData) {
					userData.errorData = JSON.parse(errorData);
				}
			} catch (error) {
				console.warn('Failed to collect error data:', error);
			}
		}

		return userData;
	}

	private convertToCSV(data: any): string {
		// Simple CSV conversion
		const headers = ['type', 'key', 'value', 'timestamp'];
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

	private async deleteSessionData(): Promise<void> {
		// Remove all session-related data
		const keys = Object.keys(localStorage);
		for (const key of keys) {
			if (key.startsWith('session:') || key.startsWith('tool_session:')) {
				localStorage.removeItem(key);
			}
		}
	}

	private async deleteAnalyticsData(): Promise<void> {
		localStorage.removeItem('analytics_data');
		localStorage.removeItem('user_analytics');
	}

	private async deleteErrorData(): Promise<void> {
		localStorage.removeItem('error_logs');
		localStorage.removeItem('error_reports');
	}

	private async anonymizeUserData(): Promise<void> {
		// Anonymize user data instead of deleting
		if (this.currentSubject) {
			this.currentSubject.identifier = this.generateIdentifier();
			this.currentSubject.consents = [];
			await this.saveCurrentSubject();
		}
	}

	private async completeDataDeletion(): Promise<void> {
		// Complete removal of user data
		await this.deleteSessionData();
		await this.deleteAnalyticsData();
		await this.deleteErrorData();

		if (this.currentSubject) {
			this.currentSubject = null;
			localStorage.removeItem('privacy_subject');
			localStorage.removeItem('privacy_consents');
		}
	}

	private async deleteExpiredData(retentionMs: number): Promise<void> {
		const cutoff = new Date(Date.now() - retentionMs);
		const keys = Object.keys(localStorage);

		for (const key of keys) {
			try {
				const value = localStorage.getItem(key);
				if (value) {
					const data = JSON.parse(value);
					if (data.timestamp && new Date(data.timestamp) < cutoff) {
						localStorage.removeItem(key);
					}
				}
			} catch (error) {
				// Ignore parsing errors
			}
		}
	}

	private async disableSync(): Promise<void> {
		// Disable cross-tab synchronization
		localStorage.removeItem('sync_enabled');
	}

	private async removeMarketingConsent(): Promise<void> {
		// Remove from marketing communications
		localStorage.removeItem('marketing_consent');
	}

	private async resetPersonalization(): Promise<void> {
		// Reset personalization settings
		if (this.currentSubject) {
			this.currentSubject.preferences.consent.personalization = false;
			await this.saveCurrentSubject();
		}
	}

	private async auditConsent(audit: PrivacyAudit): Promise<void> {
		const consents = await this.getAllConsents();

		// Check if consents are valid
		const expiredConsents = consents.filter(c => {
			const expiryDate = new Date(c.timestamp.getTime() + c.retentionPeriod * 24 * 60 * 60 * 1000);
			return expiryDate < new Date();
		});

		if (expiredConsents.length > 0) {
			audit.results.consentValid = false;
			audit.results.issues.push({
				severity: 'medium',
				description: `${expiredConsents.length} expired consents found`,
				recommendation: 'Remove expired consents or renew them',
			});
		}

		// Check for missing required consents
		const requiredConsents = ['analytics', 'storage'];
		const missingConsents = requiredConsents.filter(type =>
			!consents.some(c => c.type === type && c.given && !c.withdrawn)
		);

		if (missingConsents.length > 0 && this.consentRequired) {
			audit.results.consentValid = false;
			audit.results.issues.push({
				severity: 'high',
				description: `Missing required consents: ${missingConsents.join(', ')}`,
				recommendation: 'Request user consent for required categories',
			});
		}
	}

	private async auditDataSecurity(audit: PrivacyAudit): Promise<void> {
		// Check if data is encrypted
		const encryptionEnabled = localStorage.getItem('encryption_enabled') === 'true';
		if (!encryptionEnabled) {
			audit.results.dataSecure = false;
			audit.results.issues.push({
				severity: 'medium',
				description: 'Data encryption is not enabled',
				recommendation: 'Enable data encryption for sensitive information',
			});
		}

		// Check for sensitive data exposure
		const sensitiveKeys = ['password', 'token', 'secret', 'key'];
		const keys = Object.keys(localStorage);
		const exposedData = keys.filter(key =>
			sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
		);

		if (exposedData.length > 0) {
			audit.results.dataSecure = false;
			audit.results.issues.push({
				severity: 'critical',
				description: `Potentially exposed sensitive data: ${exposedData.join(', ')}`,
				recommendation: 'Encrypt or remove sensitive data from localStorage',
			});
		}
	}

	private async auditCompliance(audit: PrivacyAudit): Promise<void> {
		const settings = await this.getPrivacySettings();

		// Check GDPR compliance
		if (settings.compliance.region === 'EU') {
			if (!settings.compliance.gdprCompliant) {
				audit.results.compliant = false;
				audit.results.issues.push({
					severity: 'high',
					description: 'GDPR compliance not enabled for EU region',
					recommendation: 'Enable GDPR compliance features',
				});
			}
		}

		// Check CCPA compliance
		if (settings.compliance.region === 'US') {
			if (!settings.compliance.ccpaCompliant) {
				audit.results.compliant = false;
				audit.results.issues.push({
					severity: 'medium',
					description: 'CCPA compliance not enabled for US region',
					recommendation: 'Enable CCPA compliance features',
				});
			}
		}
	}

	private async auditSecurity(audit: PrivacyAudit): Promise<void> {
		// Check for security vulnerabilities
		const data = localStorage.getItem('session_data');
		if (data) {
			try {
				const parsed = JSON.parse(data);
				if (typeof parsed === 'object') {
					// Check for plain text sensitive data
					const sensitivePatterns = [
						/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
						/\b\d{3}-\d{2}-\d{4}\b/, // SSN
						/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
					];

					const dataString = JSON.stringify(parsed);
					for (const pattern of sensitivePatterns) {
						if (pattern.test(dataString)) {
							audit.results.dataSecure = false;
							audit.results.issues.push({
								severity: 'critical',
								description: 'Sensitive data detected in plain text',
								recommendation: 'Encrypt sensitive data or use hashing',
							});
							break;
						}
					}
				}
			} catch (error) {
				// Ignore parsing errors
			}
		}
	}

	private generateConsentId(): string {
		return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateSubjectId(): string {
		return `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateIdentifier(): string {
		return this.hashString(`${Date.now()}_${Math.random()}`);
	}

	private generateRequestId(): string {
		return `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateAuditId(): string {
		return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Export singleton instance
export const privacyControls = PrivacyControls.getInstance();

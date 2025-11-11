/**
 * Cross-Tab Synchronization - T161 Implementation
 * Provides real-time synchronization across browser tabs with conflict resolution
 */

export interface SyncMessage {
	id: string;
	type: 'update' | 'delete' | 'lock' | 'unlock' | 'ping' | 'pong';
	tabId: string;
	userId?: string;
	timestamp: Date;
	payload: {
		category: 'preferences' | 'tool_session' | 'working_state' | 'analytics';
		key: string;
		value?: any;
		version?: number;
		lock?: {
			tabId: string;
			timeout: number;
		};
	};
	metadata: {
		source: 'user_action' | 'auto_save' | 'system_event' | 'conflict_resolution';
		priority: 'low' | 'normal' | 'high' | 'critical';
		retryCount: number;
		maxRetries: number;
	};
}

export interface SyncConflict {
	id: string;
	key: string;
	category: string;
	localValue: any;
	remoteValue: any;
	localTimestamp: Date;
	remoteTimestamp: Date;
	tabId: string;
	remoteTabId: string;
	resolution?: 'local_wins' | 'remote_wins' | 'merge' | 'manual';
	resolvedAt?: Date;
}

export interface SyncStatistics {
	// Message statistics
	messages: {
		sent: number;
		received: number;
		failed: number;
		retried: number;
		dropped: number;
	};

	// Conflict statistics
	conflicts: {
		total: number;
		resolved: number;
		pending: number;
		localWins: number;
		remoteWins: number;
		merged: number;
		manual: number;
	};

	// Performance statistics
	performance: {
		averageLatency: number;
		maxLatency: number;
		minLatency: number;
		conflictRate: number; // conflicts per 1000 messages
		successRate: number;
	};

	// Tab statistics
	tabs: {
		active: number;
		totalCreated: number;
		totalClosed: number;
		averageLifetime: number;
	};
}

export interface SyncConfig {
	// Synchronization settings
	enabled: boolean;
	debounceMs: number;
	batchSize: number;
	maxRetries: number;
	retryDelay: number;
	timeoutMs: number;

	// Conflict resolution
	conflictResolution: 'local_wins' | 'remote_wins' | 'merge' | 'timestamp' | 'manual';
	askForResolution: boolean;
	mergeStrategy: 'shallow' | 'deep' | 'custom';

	// Performance settings
	compressionEnabled: boolean;
	encryptionEnabled: boolean;
	heartbeatInterval: number;
	heartbeatTimeout: number;

	// Security settings
	requireAuthentication: boolean;
	validateMessages: boolean;
	filterSensitiveData: boolean;
}

export class CrossTabSync {
	private static instance: CrossTabSync;
	private config: SyncConfig;
	private isInitialized = false;
	private tabId: string;
	private channel: BroadcastChannel;
	private messageQueue: SyncMessage[] = [];
	private pendingLocks: Map<string, { tabId: string; timeout: NodeJS.Timeout }> = new Map();
	private conflicts: Map<string, SyncConflict> = new Map();
	private listeners: Map<string, Set<(message: SyncMessage) => void>> = new Map();
	private statistics: SyncStatistics;
	private heartbeatInterval?: NodeJS.Timeout;
	private isLeader = false;
	private leaderElectionTimeout?: NodeJS.Timeout;
	private lastPing?: Date;
	private processingQueue = false;

	private constructor() {
		this.config = this.getDefaultConfig();
		this.tabId = this.generateTabId();
		this.channel = new BroadcastChannel('parsify_session_sync');
		this.statistics = this.getDefaultStatistics();
	}

	public static getInstance(): CrossTabSync {
		if (!CrossTabSync.instance) {
			CrossTabSync.instance = new CrossTabSync();
		}
		return CrossTabSync.instance;
	}

	// Initialize cross-tab synchronization
	public async initialize(config?: Partial<SyncConfig>): Promise<void> {
		if (this.isInitialized) {
			console.warn('Cross-tab sync already initialized');
			return;
		}

		try {
			// Merge configuration
			if (config) {
				this.config = { ...this.config, ...config };
			}

			// Setup message handlers
			this.setupMessageHandlers();

			// Start heartbeat
			this.startHeartbeat();

			// Start leader election
			this.startLeaderElection();

			// Process message queue
			this.startQueueProcessor();

			// Cleanup expired locks
			this.startLockCleanup();

			this.isInitialized = true;
			console.log('Cross-tab synchronization initialized');
			console.log(`Tab ID: ${this.tabId}`);
			console.log(`Sync enabled: ${this.config.enabled}`);

		} catch (error) {
			console.error('Failed to initialize cross-tab sync:', error);
			throw error;
		}
	}

	// Send update message
	public async sendUpdate(
		category: 'preferences' | 'tool_session' | 'working_state' | 'analytics',
		key: string,
		value: any,
		options?: {
			source?: 'user_action' | 'auto_save' | 'system_event';
			priority?: 'low' | 'normal' | 'high' | 'critical';
			immediate?: boolean;
		}
	): Promise<void> {
		if (!this.config.enabled) return;

		const message: SyncMessage = {
			id: this.generateMessageId(),
			type: 'update',
			tabId: this.tabId,
			timestamp: new Date(),
			payload: {
				category,
				key,
				value,
				version: Date.now(),
			},
			metadata: {
				source: options?.source || 'user_action',
				priority: options?.priority || 'normal',
				retryCount: 0,
				maxRetries: this.config.maxRetries,
			},
		};

		await this.sendMessage(message, options?.immediate);
	}

	// Send delete message
	public async sendDelete(
		category: 'preferences' | 'tool_session' | 'working_state' | 'analytics',
		key: string,
		options?: {
			immediate?: boolean;
		}
	): Promise<void> {
		if (!this.config.enabled) return;

		const message: SyncMessage = {
			id: this.generateMessageId(),
			type: 'delete',
			tabId: this.tabId,
			timestamp: new Date(),
			payload: {
				category,
				key,
			},
			metadata: {
				source: 'user_action',
				priority: 'normal',
				retryCount: 0,
				maxRetries: this.config.maxRetries,
			},
		};

		await this.sendMessage(message, options?.immediate);
	}

	// Acquire lock for a key
	public async acquireLock(
		key: string,
		timeout: number = 30000 // 30 seconds default
	): Promise<boolean> {
		if (!this.config.enabled) return true;

		// Check if key is already locked by this tab
		if (this.pendingLocks.has(key)) {
			return true;
		}

		const message: SyncMessage = {
			id: this.generateMessageId(),
			type: 'lock',
			tabId: this.tabId,
			timestamp: new Date(),
			payload: {
				category: 'tool_session', // Default category for locks
				key,
				lock: {
					tabId: this.tabId,
					timeout,
				},
			},
			metadata: {
				source: 'user_action',
				priority: 'high',
				retryCount: 0,
				maxRetries: this.config.maxRetries,
			},
		};

		await this.sendMessage(message, true);

		// Wait for lock confirmation
		return new Promise((resolve) => {
			const checkLock = () => {
				const lock = this.pendingLocks.get(key);
				if (lock && lock.tabId === this.tabId) {
					resolve(true);
				} else {
					setTimeout(checkLock, 100);
				}
			};
			checkLock();
		});
	}

	// Release lock for a key
	public async releaseLock(key: string): Promise<void> {
		if (!this.config.enabled) return;

		const message: SyncMessage = {
			id: this.generateMessageId(),
			type: 'unlock',
			tabId: this.tabId,
			timestamp: new Date(),
			payload: {
				category: 'tool_session',
				key,
			},
			metadata: {
				source: 'user_action',
				priority: 'high',
				retryCount: 0,
				maxRetries: this.config.maxRetries,
			},
		};

		await this.sendMessage(message, true);
		this.pendingLocks.delete(key);
	}

	// Add message listener
	public addListener(
		category: string,
		listener: (message: SyncMessage) => void
	): void {
		if (!this.listeners.has(category)) {
			this.listeners.set(category, new Set());
		}
		this.listeners.get(category)!.add(listener);
	}

	// Remove message listener
	public removeListener(
		category: string,
		listener: (message: SyncMessage) => void
	): void {
		const categoryListeners = this.listeners.get(category);
		if (categoryListeners) {
			categoryListeners.delete(listener);
			if (categoryListeners.size === 0) {
				this.listeners.delete(category);
			}
		}
	}

	// Get synchronization statistics
	public getStatistics(): SyncStatistics {
		// Update tab statistics
		this.statistics.tabs.active = this.getActiveTabCount();

		return { ...this.statistics };
	}

	// Get active conflicts
	public getConflicts(): SyncConflict[] {
		return Array.from(this.conflicts.values()).filter(conflict => !conflict.resolvedAt);
	}

	// Resolve conflict
	public async resolveConflict(
		conflictId: string,
		resolution: 'local_wins' | 'remote_wins' | 'merge' | 'manual',
		mergedValue?: any
	): Promise<void> {
		const conflict = this.conflicts.get(conflictId);
		if (!conflict) {
			throw new Error(`Conflict not found: ${conflictId}`);
		}

		conflict.resolution = resolution;
		conflict.resolvedAt = new Date();

		// Update statistics
		this.statistics.conflicts.resolved++;
		switch (resolution) {
			case 'local_wins':
				this.statistics.conflicts.localWins++;
				break;
			case 'remote_wins':
				this.statistics.conflicts.remoteWins++;
				break;
			case 'merge':
				this.statistics.conflicts.merged++;
				break;
			case 'manual':
				this.statistics.conflicts.manual++;
				break;
		}

		// Apply resolution
		await this.applyConflictResolution(conflict, resolution, mergedValue);

		// Notify listeners
		this.notifyConflictResolution(conflict);

		// Remove from active conflicts
		this.conflicts.delete(conflictId);
	}

	// Stop cross-tab synchronization
	public stop(): void {
		if (!this.isInitialized) return;

		// Clear heartbeat
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}

		// Clear leader election timeout
		if (this.leaderElectionTimeout) {
			clearTimeout(this.leaderElectionTimeout);
		}

		// Close broadcast channel
		this.channel.close();

		// Clear locks
		this.pendingLocks.clear();

		this.isInitialized = false;
		console.log('Cross-tab synchronization stopped');
	}

	// Private helper methods

	private getDefaultConfig(): SyncConfig {
		return {
			enabled: true,
			debounceMs: 100,
			batchSize: 10,
			maxRetries: 3,
			retryDelay: 1000,
			timeoutMs: 5000,

			conflictResolution: 'timestamp',
			askForResolution: false,
			mergeStrategy: 'shallow',

			compressionEnabled: false,
			encryptionEnabled: false,
			heartbeatInterval: 10000, // 10 seconds
			heartbeatTimeout: 30000, // 30 seconds

			requireAuthentication: false,
			validateMessages: true,
			filterSensitiveData: true,
		};
	}

	private getDefaultStatistics(): SyncStatistics {
		return {
			messages: {
				sent: 0,
				received: 0,
				failed: 0,
				retried: 0,
				dropped: 0,
			},

			conflicts: {
				total: 0,
				resolved: 0,
				pending: 0,
				localWins: 0,
				remoteWins: 0,
				merged: 0,
				manual: 0,
			},

			performance: {
				averageLatency: 0,
				maxLatency: 0,
				minLatency: Infinity,
				conflictRate: 0,
				successRate: 1,
			},

			tabs: {
				active: 1,
				totalCreated: 1,
				totalClosed: 0,
				averageLifetime: 0,
			},
		};
	}

	private setupMessageHandlers(): void {
		this.channel.addEventListener('message', (event) => {
			const message = event.data as SyncMessage;

			// Ignore messages from this tab
			if (message.tabId === this.tabId) return;

			// Validate message
			if (this.config.validateMessages && !this.validateMessage(message)) {
				console.warn('Invalid sync message received:', message);
				return;
			}

			// Update statistics
			this.statistics.messages.received++;

			// Handle message
			this.handleMessage(message);
		});
	}

	private async handleMessage(message: SyncMessage): Promise<void> {
		try {
			switch (message.type) {
				case 'update':
					await this.handleUpdate(message);
					break;
				case 'delete':
					await this.handleDelete(message);
					break;
				case 'lock':
					await this.handleLock(message);
					break;
				case 'unlock':
					await this.handleUnlock(message);
					break;
				case 'ping':
					await this.handlePing(message);
					break;
				case 'pong':
					await this.handlePong(message);
					break;
			}

			// Notify listeners
			const categoryListeners = this.listeners.get(message.payload.category);
			if (categoryListeners) {
				categoryListeners.forEach(listener => {
					try {
						listener(message);
					} catch (error) {
						console.error('Error in sync message listener:', error);
					}
				});
			}

		} catch (error) {
			console.error('Error handling sync message:', error);
			this.statistics.messages.failed++;
		}
	}

	private async handleUpdate(message: SyncMessage): Promise<void> {
		// Check for conflicts
		const conflict = await this.detectConflict(message);
		if (conflict) {
			await this.handleConflict(conflict);
			return;
		}

		// Apply update
		await this.applyUpdate(message);
	}

	private async handleDelete(message: SyncMessage): Promise<void> {
		// Apply deletion
		await this.applyDelete(message);
	}

	private async handleLock(message: SyncMessage): Promise<void> {
		const key = message.payload.key;
		const lockInfo = message.payload.lock;

		if (!this.pendingLocks.has(key)) {
			// Grant lock
			this.pendingLocks.set(key, {
				tabId: lockInfo!.tabId,
				timeout: setTimeout(() => {
					this.pendingLocks.delete(key);
				}, lockInfo!.timeout),
			});
		}
	}

	private async handleUnlock(message: SyncMessage): Promise<void> {
		const key = message.payload.key;
		const lock = this.pendingLocks.get(key);

		if (lock && lock.tabId === message.tabId) {
			clearTimeout(lock.timeout);
			this.pendingLocks.delete(key);
		}
	}

	private async handlePing(message: SyncMessage): Promise<void> {
		// Respond with pong
		const pong: SyncMessage = {
			...message,
			type: 'pong',
			tabId: this.tabId,
		};

		await this.sendMessage(pong, true);
	}

	private async handlePong(message: SyncMessage): Promise<void> {
		// Update latency statistics
		const latency = Date.now() - message.timestamp.getTime();
		this.updateLatencyStats(latency);
	}

	private async sendMessage(message: SyncMessage, immediate: boolean = false): Promise<void> {
		if (!this.config.enabled) return;

		try {
			// Apply compression if enabled
			let finalMessage = message;
			if (this.config.compressionEnabled) {
				finalMessage = await this.compressMessage(message);
			}

			// Apply encryption if enabled
			if (this.config.encryptionEnabled) {
				finalMessage = await this.encryptMessage(finalMessage);
			}

			if (immediate) {
				this.channel.postMessage(finalMessage);
				this.statistics.messages.sent++;
			} else {
				// Add to queue for batching
				this.messageQueue.push(finalMessage);
			}

		} catch (error) {
			console.error('Failed to send sync message:', error);
			this.statistics.messages.failed++;

			// Retry if configured
			if (message.metadata.retryCount < message.metadata.maxRetries) {
				message.metadata.retryCount++;
				this.statistics.messages.retried++;

				setTimeout(() => {
					this.sendMessage(message, immediate);
				}, this.config.retryDelay);
			} else {
				this.statistics.messages.dropped++;
			}
		}
	}

	private startQueueProcessor(): void {
		setInterval(() => {
			if (this.processingQueue || this.messageQueue.length === 0) return;

			this.processingQueue = true;

			try {
				const batch = this.messageQueue.splice(0, this.config.batchSize);
				batch.forEach(message => {
					this.channel.postMessage(message);
					this.statistics.messages.sent++;
				});
			} catch (error) {
				console.error('Error processing sync message queue:', error);
			} finally {
				this.processingQueue = false;
			}
		}, this.config.debounceMs);
	}

	private startHeartbeat(): void {
		this.heartbeatInterval = setInterval(() => {
			const ping: SyncMessage = {
				id: this.generateMessageId(),
				type: 'ping',
				tabId: this.tabId,
				timestamp: new Date(),
				payload: {
					category: 'analytics',
					key: 'heartbeat',
				},
				metadata: {
					source: 'system_event',
					priority: 'low',
					retryCount: 0,
					maxRetries: 1,
				},
			};

			this.sendMessage(ping, true);
			this.lastPing = new Date();
		}, this.config.heartbeatInterval);
	}

	private startLeaderElection(): void {
		// Simple leader election - first tab becomes leader
		setTimeout(() => {
			this.isLeader = true;
			console.log('This tab is now the leader');
		}, Math.random() * 1000);
	}

	private startLockCleanup(): void {
		setInterval(() => {
			const now = Date.now();
			for (const [key, lock] of this.pendingLocks) {
				// Remove expired locks
				if (lock.timeout as any < now) {
					this.pendingLocks.delete(key);
				}
			}
		}, 5000); // Check every 5 seconds
	}

	private async detectConflict(message: SyncMessage): Promise<SyncConflict | null> {
		// This would integrate with actual storage to detect conflicts
		// For now, return null (no conflicts)
		return null;
	}

	private async handleConflict(conflict: SyncConflict): Promise<void> {
		this.conflicts.set(conflict.id, conflict);
		this.statistics.conflicts.total++;
		this.statistics.conflicts.pending++;

		// Auto-resolve based on configuration
		if (this.config.conflictResolution !== 'manual') {
			await this.resolveConflict(conflict.id, this.config.conflictResolution);
		} else if (this.config.askForResolution) {
			// Notify user for manual resolution
			console.warn(`Sync conflict detected for key: ${conflict.key}`, conflict);
		}
	}

	private async applyUpdate(message: SyncMessage): Promise<void> {
		// This would integrate with actual storage system
		// For now, just log the update
		console.log(`Applying update: ${message.payload.key}`, message.payload.value);
	}

	private async applyDelete(message: SyncMessage): Promise<void> {
		// This would integrate with actual storage system
		console.log(`Applying delete: ${message.payload.key}`);
	}

	private async applyConflictResolution(
		conflict: SyncConflict,
		resolution: string,
		mergedValue?: any
	): Promise<void> {
		// Apply the resolved conflict to storage
		let finalValue: any;

		switch (resolution) {
			case 'local_wins':
				finalValue = conflict.localValue;
				break;
			case 'remote_wins':
				finalValue = conflict.remoteValue;
				break;
			case 'merge':
				finalValue = mergedValue || await this.mergeValues(conflict.localValue, conflict.remoteValue);
				break;
			case 'manual':
				// Value should be provided in mergedValue
				finalValue = mergedValue;
				break;
		}

		// Apply the resolved value
		await this.applyUpdate({
			id: this.generateMessageId(),
			type: 'update',
			tabId: this.tabId,
			timestamp: new Date(),
			payload: {
				category: conflict.category as any,
				key: conflict.key,
				value: finalValue,
			},
			metadata: {
				source: 'conflict_resolution',
				priority: 'high',
				retryCount: 0,
				maxRetries: this.config.maxRetries,
			},
		});
	}

	private async mergeValues(localValue: any, remoteValue: any): Promise<any> {
		// Simple merge strategy
		if (typeof localValue === 'object' && typeof remoteValue === 'object') {
			return { ...localValue, ...remoteValue };
		}
		return remoteValue; // Default to remote value for primitives
	}

	private notifyConflictResolution(conflict: SyncConflict): void {
		// Notify listeners about conflict resolution
		const listeners = this.listeners.get('conflict_resolution');
		if (listeners) {
			listeners.forEach(listener => {
				try {
					listener({
						id: this.generateMessageId(),
						type: 'update',
						tabId: this.tabId,
						timestamp: new Date(),
						payload: {
							category: 'analytics',
							key: 'conflict_resolved',
							value: conflict,
						},
						metadata: {
							source: 'system_event',
							priority: 'normal',
							retryCount: 0,
							maxRetries: 0,
						},
					});
				} catch (error) {
					console.error('Error in conflict resolution listener:', error);
				}
			});
		}
	}

	private validateMessage(message: SyncMessage): boolean {
		return !!(
			message.id &&
			message.type &&
			message.tabId &&
			message.timestamp &&
			message.payload &&
			message.metadata
		);
	}

	private async compressMessage(message: SyncMessage): Promise<SyncMessage> {
		// Placeholder for compression implementation
		return message;
	}

	private async encryptMessage(message: SyncMessage): Promise<SyncMessage> {
		// Placeholder for encryption implementation
		return message;
	}

	private updateLatencyStats(latency: number): void {
		const stats = this.statistics.performance;
		stats.averageLatency = (stats.averageLatency + latency) / 2;
		stats.maxLatency = Math.max(stats.maxLatency, latency);
		stats.minLatency = Math.min(stats.minLatency, latency);
	}

	private getActiveTabCount(): number {
		// This would be tracked through heartbeat messages
		return 1; // Placeholder
	}

	private generateMessageId(): string {
		return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateTabId(): string {
		return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Export singleton instance
export const crossTabSync = CrossTabSync.getInstance();

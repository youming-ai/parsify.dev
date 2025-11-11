// Background Sync for User Preferences and Data

export interface SyncQueueItem {
	id: string;
	type: 'user-preferences' | 'tool-data' | 'analytics' | 'bookmarks';
	data: any;
	timestamp: number;
	retries: number;
	maxRetries: number;
	priority: 'high' | 'medium' | 'low';
}

export interface SyncResult {
	success: boolean;
	itemId: string;
	error?: string;
}

export interface SyncStats {
	totalQueued: number;
	synced: number;
	failed: number;
	lastSync: Date | null;
}

class BackgroundSyncManager {
	private static instance: BackgroundSyncManager;
	private db: IDBDatabase | null = null;
	private isInitialized = false;
	private syncInProgress = false;
	private syncListeners: Set<(result: SyncResult) => void> = new Set();

	private constructor() {
		this.initializeDB();
	}

	public static getInstance(): BackgroundSyncManager {
		if (!BackgroundSyncManager.instance) {
			BackgroundSyncManager.instance = new BackgroundSyncManager();
		}
		return BackgroundSyncManager.instance;
	}

	public async addItem(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
		await this.waitForInitialization();

		const queueItem: SyncQueueItem = {
			...item,
			id: this.generateId(),
			timestamp: Date.now(),
			retries: 0,
		};

		try {
			await this.saveToQueue(queueItem);
			await this.registerSyncIfNeeded();
		} catch (error) {
			console.error('[Sync] Failed to add item to queue:', error);
			throw error;
		}
	}

	public async getQueue(type?: string): Promise<SyncQueueItem[]> {
		await this.waitForInitialization();
		return this.loadFromQueue(type);
	}

	public async removeItem(id: string): Promise<void> {
		await this.waitForInitialization();

		const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
		const store = transaction.objectStore('syncQueue');
		await store.delete(id);
	}

	public async clearQueue(type?: string): Promise<void> {
		await this.waitForInitialization();

		const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
		const store = transaction.objectStore('syncQueue');

		if (type) {
			const items = await this.loadFromQueue(type);
			await Promise.all(items.map(item => store.delete(item.id)));
		} else {
			await store.clear();
		}
	}

	public async getSyncStats(): Promise<SyncStats> {
		await this.waitForInitialization();

		const queue = await this.loadFromQueue();
		const lastSync = await this.getLastSyncTime();

		return {
			totalQueued: queue.length,
			synced: 0, // This would be tracked separately
			failed: 0, // This would be tracked separately
			lastSync,
		};
	}

	public async forceSync(): Promise<SyncResult[]> {
		if (this.syncInProgress) {
			throw new Error('Sync already in progress');
		}

		this.syncInProgress = true;
		const results: SyncResult[] = [];

		try {
			const queue = await this.loadFromQueue();
			const sortedQueue = this.sortQueueByPriority(queue);

			for (const item of sortedQueue) {
				const result = await this.syncItem(item);
				results.push(result);

				if (result.success) {
					await this.removeItem(item.id);
				} else if (item.retries >= item.maxRetries) {
					await this.removeItem(item.id);
				}
			}

			await this.updateLastSyncTime();
		} catch (error) {
			console.error('[Sync] Force sync failed:', error);
		} finally {
			this.syncInProgress = false;
		}

		return results;
	}

	public subscribe(listener: (result: SyncResult) => void): () => void {
		this.syncListeners.add(listener);
		return () => this.syncListeners.delete(listener);
	}

	public async setOfflineData(data: any, key: string): Promise<void> {
		await this.waitForInitialization();

		const transaction = this.db!.transaction(['offlineData'], 'readwrite');
		const store = transaction.objectStore('offlineData');
		await store.put({ key, data, timestamp: Date.now() });
	}

	public async getOfflineData(key: string): Promise<any> {
		await this.waitForInitialization();

		const transaction = this.db!.transaction(['offlineData'], 'readonly');
		const store = transaction.objectStore('offlineData');
		const result = await store.get(key);

		return result?.data || null;
	}

	public async clearOfflineData(): Promise<void> {
		await this.waitForInitialization();

		const transaction = this.db!.transaction(['offlineData'], 'readwrite');
		const store = transaction.objectStore('offlineData');
		await store.clear();
	}

	// Private methods
	private async initializeDB(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('ParsifyBackgroundSync', 2);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.db = request.result;
				this.isInitialized = true;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Sync queue store
				if (!db.objectStoreNames.contains('syncQueue')) {
					const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
					queueStore.createIndex('type', 'type', { unique: false });
					queueStore.createIndex('priority', 'priority', { unique: false });
					queueStore.createIndex('timestamp', 'timestamp', { unique: false });
				}

				// Offline data store
				if (!db.objectStoreNames.contains('offlineData')) {
					db.createObjectStore('offlineData', { keyPath: 'key' });
				}

				// Sync metadata store
				if (!db.objectStoreNames.contains('syncMetadata')) {
					db.createObjectStore('syncMetadata', { keyPath: 'key' });
				}
			};
		});
	}

	private async waitForInitialization(): Promise<void> {
		if (this.isInitialized) return;

		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if (this.isInitialized) {
					clearInterval(checkInterval);
					resolve();
				}
			}, 10);
		});
	}

	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private async saveToQueue(item: SyncQueueItem): Promise<void> {
		const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
		const store = transaction.objectStore('syncQueue');
		await store.put(item);
	}

	private async loadFromQueue(type?: string): Promise<SyncQueueItem[]> {
		const transaction = this.db!.transaction(['syncQueue'], 'readonly');
		const store = transaction.objectStore('syncQueue');

		if (type) {
			const index = store.index('type');
			const request = index.getAll(type);
			return new Promise((resolve) => {
				request.onsuccess = () => resolve(request.result || []);
				request.onerror = () => resolve([]);
			});
		} else {
			const request = store.getAll();
			return new Promise((resolve) => {
				request.onsuccess = () => resolve(request.result || []);
				request.onerror = () => resolve([]);
			});
		}
	}

	private sortQueueByPriority(queue: SyncQueueItem[]): SyncQueueItem[] {
		const priorityOrder = { high: 3, medium: 2, low: 1 };

		return queue.sort((a, b) => {
			const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
			if (priorityDiff !== 0) return priorityDiff;

			// If same priority, sort by timestamp (oldest first)
			return a.timestamp - b.timestamp;
		});
	}

	private async syncItem(item: SyncQueueItem): Promise<SyncResult> {
		try {
			switch (item.type) {
				case 'user-preferences':
					await this.syncUserPreferences(item.data);
					break;
				case 'tool-data':
					await this.syncToolData(item.data);
					break;
				case 'analytics':
					await this.syncAnalytics(item.data);
					break;
				case 'bookmarks':
					await this.syncBookmarks(item.data);
					break;
				default:
					throw new Error(`Unknown sync item type: ${item.type}`);
			}

			return { success: true, itemId: item.id };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`[Sync] Failed to sync item ${item.id}:`, error);

			// Update retry count
			item.retries++;
			if (item.retries <= item.maxRetries) {
				await this.saveToQueue(item);
			}

			return { success: false, itemId: item.id, error: errorMessage };
		}
	}

	private async syncUserPreferences(data: any): Promise<void> {
		const response = await fetch('/api/user/preferences/sync', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`Failed to sync preferences: ${response.statusText}`);
		}
	}

	private async syncToolData(data: any): Promise<void> {
		const response = await fetch('/api/tools/data/sync', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`Failed to sync tool data: ${response.statusText}`);
		}
	}

	private async syncAnalytics(data: any): Promise<void> {
		const response = await fetch('/api/analytics/batch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ events: [data] }),
		});

		if (!response.ok) {
			throw new Error(`Failed to sync analytics: ${response.statusText}`);
		}
	}

	private async syncBookmarks(data: any): Promise<void> {
		const response = await fetch('/api/user/bookmarks/sync', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`Failed to sync bookmarks: ${response.statusText}`);
		}
	}

	private async registerSyncIfNeeded(): Promise<void> {
		if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
			return;
		}

		try {
			const registration = await navigator.serviceWorker.ready;
			if (registration.sync) {
				await registration.sync.register('background-sync');
			}
		} catch (error) {
			console.warn('[Sync] Failed to register background sync:', error);
		}
	}

	private async getLastSyncTime(): Promise<Date | null> {
		const transaction = this.db!.transaction(['syncMetadata'], 'readonly');
		const store = transaction.objectStore('syncMetadata');
		const result = await store.get('lastSync');

		return result?.timestamp ? new Date(result.timestamp) : null;
	}

	private async updateLastSyncTime(): Promise<void> {
		const transaction = this.db!.transaction(['syncMetadata'], 'readwrite');
		const store = transaction.objectStore('syncMetadata');
		await store.put({
			key: 'lastSync',
			timestamp: Date.now(),
		});
	}

	private notifyListeners(result: SyncResult): void {
		this.syncListeners.forEach(listener => listener(result));
	}
}

// Export singleton instance
export const backgroundSyncManager = BackgroundSyncManager.getInstance();

// Export types
export type { SyncQueueItem, SyncResult, SyncStats };

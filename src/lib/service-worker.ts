// Service Worker Registration and Management for Parsify.dev

export interface ServiceWorkerStatus {
	supported: boolean;
	enabled: boolean;
	controlled: boolean;
	offline: boolean;
	updateAvailable: boolean;
	installing: boolean;
	activating: boolean;
}

export interface CacheInfo {
	name: string;
	size: number;
	entries: number;
	lastUpdated: Date;
}

export interface OfflineQueueItem<T = any> {
	id: string;
	type: 'user-preferences' | 'tool-data' | 'analytics';
	data: T;
	timestamp: number;
	retries: number;
	maxRetries: number;
}

class ServiceWorkerManager {
	private swRegistration: ServiceWorkerRegistration | null = null;
	private status: ServiceWorkerStatus;
	private listeners: Set<(status: ServiceWorkerStatus) => void> = new Set();
	private offlineQueue: OfflineQueueItem[] = [];
	private db: IDBDatabase | null = null;

	constructor() {
		this.status = {
			supported: 'serviceWorker' in navigator,
			enabled: false,
			controlled: false,
			offline: !navigator.onLine,
			updateAvailable: false,
			installing: false,
			activating: false,
		};

		this.initializeEventListeners();
	}

	// Initialize service worker
	async register(): Promise<boolean> {
		if (!this.status.supported) {
			console.warn('[SW] Service workers not supported');
			return false;
		}

		try {
			// Register service worker
			this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
				scope: '/',
			});

			console.log('[SW] Service worker registered:', this.swRegistration.scope);
			this.status.enabled = true;
			this.status.controlled = !!navigator.serviceWorker.controller;

			// Initialize IndexedDB for offline queue
			await this.initializeDB();

			// Setup update checking
			this.setupUpdateChecking();

			// Listen for controller changes
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				this.status.controlled = true;
				this.status.updateAvailable = false;
				this.notifyListeners();
			});

			this.notifyListeners();
			return true;
		} catch (error) {
			console.error('[SW] Service worker registration failed:', error);
			return false;
		}
	}

	// Get current status
	getStatus(): ServiceWorkerStatus {
		return { ...this.status };
	}

	// Subscribe to status changes
	subscribe(listener: (status: ServiceWorkerStatus) => void): () => void {
		this.listeners.add(listener);
		listener(this.getStatus());
		return () => this.listeners.delete(listener);
	}

	// Force update check
	async checkForUpdates(): Promise<boolean> {
		if (!this.swRegistration) return false;

		try {
			await this.swRegistration.update();
			return true;
		} catch (error) {
			console.error('[SW] Update check failed:', error);
			return false;
		}
	}

	// Skip waiting and activate new service worker
	async activateUpdate(): Promise<boolean> {
		if (!this.swRegistration?.installing) return false;

		try {
			this.swRegistration.installing.postMessage({ type: 'SKIP_WAITING' });
			return true;
		} catch (error) {
			console.error('[SW] Failed to activate update:', error);
			return false;
		}
	}

	// Clear all caches
	async clearCaches(): Promise<boolean> {
		if (!this.swRegistration) return false;

		try {
			this.swRegistration.active?.postMessage({ type: 'CACHE_CLEAR' });
			await this.clearOfflineQueue();
			return true;
		} catch (error) {
			console.error('[SW] Failed to clear caches:', error);
			return false;
		}
	}

	// Get cache information
	async getCacheInfo(): Promise<CacheInfo[]> {
		if (!('caches' in window)) return [];

		try {
			const cacheNames = await caches.keys();
			const cacheInfo: CacheInfo[] = [];

			for (const name of cacheNames) {
				const cache = await caches.open(name);
				const keys = await cache.keys();

				// Calculate cache size (approximation)
				let size = 0;
				for (const request of keys.slice(0, 10)) { // Sample first 10 entries
					const response = await cache.match(request);
					if (response) {
						const text = await response.text();
						size += text.length;
					}
				}

				cacheInfo.push({
					name,
					size: size * Math.ceil(keys.length / Math.min(keys.length, 10)), // Estimate total size
					entries: keys.length,
					lastUpdated: new Date(),
				});
			}

			return cacheInfo;
		} catch (error) {
			console.error('[SW] Failed to get cache info:', error);
			return [];
		}
	}

	// Add item to offline queue
	async addToOfflineQueue<T>(item: Omit<OfflineQueueItem<T>, 'id' | 'timestamp' | 'retries'>): Promise<void> {
		const queueItem: OfflineQueueItem<T> = {
			...item,
			id: this.generateId(),
			timestamp: Date.now(),
			retries: 0,
		};

		try {
			await this.saveToOfflineQueue(queueItem);
			this.offlineQueue.push(queueItem);
		} catch (error) {
			console.error('[SW] Failed to add to offline queue:', error);
		}
	}

	// Process offline queue when back online
	async processOfflineQueue(): Promise<void> {
		if (this.status.offline || this.offlineQueue.length === 0) return;

		const queue = [...this.offlineQueue];
		this.offlineQueue = [];

		for (const item of queue) {
			try {
				await this.syncOfflineItem(item);
				await this.removeFromOfflineQueue(item.id);
			} catch (error) {
				console.error('[SW] Failed to sync offline item:', error);

				// Retry logic
				if (item.retries < item.maxRetries) {
					this.offlineQueue.push({
						...item,
						retries: item.retries + 1,
					});
					await this.saveToOfflineQueue(item);
				}
			}
		}
	}

	// Request notification permission
	async requestNotificationPermission(): Promise<boolean> {
		if (!('Notification' in window)) return false;

		try {
			const permission = await Notification.requestPermission();
			return permission === 'granted';
		} catch (error) {
			console.error('[SW] Failed to request notification permission:', error);
			return false;
		}
	}

	// Show notification
	async showNotification(title: string, options?: NotificationOptions): Promise<boolean> {
		if (!this.swRegistration || !('Notification' in window)) return false;
		if (Notification.permission !== 'granted') return false;

		try {
			await this.swRegistration.showNotification(title, {
				icon: '/favicon.ico',
				badge: '/favicon.ico',
				...options,
			});
			return true;
		} catch (error) {
			console.error('[SW] Failed to show notification:', error);
			return false;
		}
	}

	// Private methods
	private initializeEventListeners(): void {
		// Network status
		window.addEventListener('online', () => {
			this.status.offline = false;
			this.notifyListeners();
			this.processOfflineQueue();
		});

		window.addEventListener('offline', () => {
			this.status.offline = true;
			this.notifyListeners();
		});

		// Service worker messages
		navigator.serviceWorker?.addEventListener('message', (event) => {
			switch (event.data?.type) {
				case 'CACHE_UPDATED':
					console.log('[SW] Cache updated for:', event.data.url);
					break;
			}
		});
	}

	private setupUpdateChecking(): void {
		if (!this.swRegistration) return;

		// Check for updates every 30 minutes
		setInterval(async () => {
			if (!this.status.offline) {
				await this.checkForUpdates();
			}
		}, 30 * 60 * 1000);

		// Listen for update found
		this.swRegistration.addEventListener('updatefound', () => {
			const installingWorker = this.swRegistration?.installing;

			if (installingWorker) {
				this.status.installing = true;
				this.notifyListeners();

				installingWorker.addEventListener('statechange', () => {
					if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
						this.status.updateAvailable = true;
						this.status.installing = false;
						this.notifyListeners();
					}
				});
			}
		});
	}

	private notifyListeners(): void {
		this.listeners.forEach(listener => listener(this.getStatus()));
	}

	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// IndexedDB operations
	private async initializeDB(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('ParsifyOfflineDB', 1);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains('offlineQueue')) {
					db.createObjectStore('offlineQueue', { keyPath: 'id' });
				}

				if (!db.objectStoreNames.contains('userPreferences')) {
					db.createObjectStore('userPreferences', { keyPath: 'key' });
				}
			};
		});
	}

	private async saveToOfflineQueue(item: OfflineQueueItem): Promise<void> {
		if (!this.db) return;

		const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
		const store = transaction.objectStore('offlineQueue');
		await store.put(item);
	}

	private async removeFromOfflineQueue(id: string): Promise<void> {
		if (!this.db) return;

		const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
		const store = transaction.objectStore('offlineQueue');
		await store.delete(id);
	}

	private async clearOfflineQueue(): Promise<void> {
		if (!this.db) return;

		const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
		const store = transaction.objectStore('offlineQueue');
		await store.clear();
		this.offlineQueue = [];
	}

	private async syncOfflineItem(item: OfflineQueueItem): Promise<void> {
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
		}
	}

	private async syncUserPreferences(data: any): Promise<void> {
		try {
			await fetch('/api/user/preferences', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
		} catch (error) {
			console.error('[SW] Failed to sync user preferences:', error);
			throw error;
		}
	}

	private async syncToolData(data: any): Promise<void> {
		try {
			await fetch('/api/tools/data/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
		} catch (error) {
			console.error('[SW] Failed to sync tool data:', error);
			throw error;
		}
	}

	private async syncAnalytics(data: any): Promise<void> {
		try {
			await fetch('/api/analytics/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ events: [data] }),
			});
		} catch (error) {
			console.error('[SW] Failed to sync analytics:', error);
			throw error;
		}
	}
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Export the service worker manager for use in React components
export { ServiceWorkerManager };

// React hook for service worker status (to be used in React components)
export function createServiceWorkerHook() {
	// This will be imported and used in React components
	return function useServiceWorker() {
		const [status, setStatus] = React.useState<ServiceWorkerStatus>(serviceWorkerManager.getStatus());

		React.useEffect(() => {
			return serviceWorkerManager.subscribe(setStatus);
		}, []);

		return {
			status,
			register: () => serviceWorkerManager.register(),
			checkForUpdates: () => serviceWorkerManager.checkForUpdates(),
			activateUpdate: () => serviceWorkerManager.activateUpdate(),
			clearCaches: () => serviceWorkerManager.clearCaches(),
			getCacheInfo: () => serviceWorkerManager.getCacheInfo(),
			addToOfflineQueue: <T>(item: Omit<OfflineQueueItem<T>, 'id' | 'timestamp' | 'retries'>) =>
				serviceWorkerManager.addToOfflineQueue(item),
			requestNotificationPermission: () => serviceWorkerManager.requestNotificationPermission(),
			showNotification: (title: string, options?: NotificationOptions) =>
				serviceWorkerManager.showNotification(title, options),
		};
	};
}

// Offline Detection and Status Management for Parsify.dev

export interface NetworkStatus {
	online: boolean;
	connectionType?: string;
	effectiveType?: string;
	downlink?: number;
	rtt?: number;
	saveData?: boolean;
	lastChanged: Date;
}

export interface OfflineCapabilities {
	serviceWorkerSupported: boolean;
	indexedDBSupported: boolean;
	cacheStorageSupported: boolean;
	backgroundSyncSupported: boolean;
	notificationsSupported: boolean;
}

export interface OfflineStorageInfo {
	quota: number;
	usage: number;
	usageDetails?: {
		caches?: number;
		indexedDB?: number;
		serviceWorkers?: number;
	};
}

class OfflineManager {
	private static instance: OfflineManager;
	private networkStatus: NetworkStatus;
	private capabilities: OfflineCapabilities;
	private listeners: Set<(status: NetworkStatus) => void> = new Set();
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000; // Start with 1 second
	private pingInterval: NodeJS.Timeout | null = null;

	private constructor() {
		this.networkStatus = {
			online: navigator.onLine,
			lastChanged: new Date(),
		};

		this.capabilities = this.detectCapabilities();
		this.initializeEventListeners();
		this.startConnectionMonitoring();
	}

	public static getInstance(): OfflineManager {
		if (!OfflineManager.instance) {
			OfflineManager.instance = new OfflineManager();
		}
		return OfflineManager.instance;
	}

	public getNetworkStatus(): NetworkStatus {
		return { ...this.networkStatus };
	}

	public getCapabilities(): OfflineCapabilities {
		return { ...this.capabilities };
	}

	public isOnline(): boolean {
		return this.networkStatus.online;
	}

	public isSlowConnection(): boolean {
		const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
		if (!connection) return false;

		return (
			connection.effectiveType === 'slow-2g' ||
			connection.effectiveType === '2g' ||
			connection.saveData === true ||
			(connection.downlink && connection.downlink < 0.5) // Less than 0.5 Mbps
		);
	}

	public subscribe(listener: (status: NetworkStatus) => void): () => void {
		this.listeners.add(listener);
		listener(this.getNetworkStatus());
		return () => this.listeners.delete(listener);
	}

	public async checkConnectivity(): Promise<boolean> {
		try {
			// Try to fetch a small resource to verify actual connectivity
			const response = await fetch('/api/health', {
				method: 'HEAD',
				cache: 'no-cache',
				signal: AbortSignal.timeout(5000), // 5 second timeout
			});

			return response.ok;
		} catch (error) {
			// If fetch fails, try to ping Google as a fallback
			try {
				const response = await fetch('https://www.google.com/favicon.ico', {
					method: 'HEAD',
					cache: 'no-cache',
					signal: AbortSignal.timeout(3000),
				});
				return response.ok;
			} catch (fallbackError) {
				return false;
			}
		}
	}

	public async getStorageInfo(): Promise<OfflineStorageInfo> {
		if ('storage' in navigator && 'estimate' in navigator.storage) {
			try {
				const estimate = await navigator.storage.estimate();
				return {
					quota: estimate.quota || 0,
					usage: estimate.usage || 0,
					usageDetails: estimate.usageDetails || {},
				};
			} catch (error) {
				console.warn('[Offline] Failed to get storage estimate:', error);
			}
		}

		return {
			quota: 0,
			usage: 0,
		};
	}

	public async requestPersistentStorage(): Promise<boolean> {
		if ('storage' in navigator && 'persist' in navigator.storage) {
			try {
				const isPersistent = await navigator.storage.persist();
				return isPersistent;
			} catch (error) {
				console.warn('[Offline] Failed to request persistent storage:', error);
				return false;
			}
		}
		return false;
	}

	public startReconnectMonitoring(): void {
		if (this.pingInterval) return;

		this.pingInterval = setInterval(async () => {
			if (!this.networkStatus.online) {
				const isOnline = await this.checkConnectivity();
				if (isOnline) {
					this.updateNetworkStatus({ online: true });
					this.reconnectAttempts = 0;
					this.reconnectDelay = 1000;
				} else {
					this.scheduleReconnect();
				}
			}
		}, 30000); // Check every 30 seconds when offline
	}

	public stopReconnectMonitoring(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	}

	public getReconnectStatus(): { attempts: number; nextAttemptIn?: number } {
		return {
			attempts: this.reconnectAttempts,
			nextAttemptIn: this.networkStatus.online ? undefined : this.reconnectDelay,
		};
	}

	public async prefetchCriticalResources(): Promise<void> {
		if (!this.isOnline()) return;

		const criticalResources = [
			'/',
			'/tools',
			'/tools/json',
			'/api/tools',
			'/api/categories',
		];

		const promises = criticalResources.map(async (url) => {
			try {
				const response = await fetch(url, { cache: 'force-cache' });
				if (response.ok) {
					const cache = await caches.open('parsify-critical-v1');
					await cache.put(url, response);
				}
			} catch (error) {
				console.warn(`[Offline] Failed to prefetch ${url}:`, error);
			}
		});

		await Promise.allSettled(promises);
	}

	// Private methods
	private detectCapabilities(): OfflineCapabilities {
		return {
			serviceWorkerSupported: 'serviceWorker' in navigator,
			indexedDBSupported: 'indexedDB' in window,
			cacheStorageSupported: 'caches' in window,
			backgroundSyncSupported: 'serviceWorker' in navigator && 'SyncManager' in window,
			notificationsSupported: 'Notification' in window,
		};
	}

	private initializeEventListeners(): void {
		// Browser online/offline events
		window.addEventListener('online', () => {
			this.updateNetworkStatus({ online: true });
			this.reconnectAttempts = 0;
			this.reconnectDelay = 1000;
		});

		window.addEventListener('offline', () => {
			this.updateNetworkStatus({ online: false });
			this.startReconnectMonitoring();
		});

		// Connection API if available
		const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
		if (connection) {
			const updateConnectionInfo = () => {
				this.updateNetworkStatus({
					connectionType: connection.type,
					effectiveType: connection.effectiveType,
					downlink: connection.downlink,
					rtt: connection.rtt,
					saveData: connection.saveData,
				});
			};

			connection.addEventListener('change', updateConnectionInfo);
			updateConnectionInfo();
		}

		// Page visibility changes
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden && !this.networkStatus.online) {
				// Page became visible, check connectivity
				this.checkConnectivity().then((isOnline) => {
					if (isOnline) {
						this.updateNetworkStatus({ online: true });
					}
				});
			}
		});

		// Focus/blur events
		window.addEventListener('focus', () => {
			if (!this.networkStatus.online) {
				this.checkConnectivity().then((isOnline) => {
					if (isOnline) {
						this.updateNetworkStatus({ online: true });
					}
				});
			}
		});
	}

	private startConnectionMonitoring(): void {
		// Initial connectivity check
		this.checkConnectivity().then((isOnline) => {
			this.updateNetworkStatus({ online: isOnline });
		});

		// Periodic connectivity checks
		setInterval(async () => {
			const isOnline = await this.checkConnectivity();
			if (isOnline !== this.networkStatus.online) {
				this.updateNetworkStatus({ online: isOnline });
			}
		}, 60000); // Check every minute
	}

	private updateNetworkStatus(updates: Partial<NetworkStatus>): void {
		const oldStatus = { ...this.networkStatus };
		this.networkStatus = {
			...this.networkStatus,
			...updates,
			lastChanged: new Date(),
		};

		// Only notify if status actually changed
		if (oldStatus.online !== this.networkStatus.online) {
			this.notifyListeners();

			if (this.networkStatus.online) {
				this.onConnectionRestored();
			} else {
				this.onConnectionLost();
			}
		}
	}

	private notifyListeners(): void {
		this.listeners.forEach(listener => listener(this.getNetworkStatus()));
	}

	private scheduleReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			this.stopReconnectMonitoring();
			return;
		}

		this.reconnectAttempts++;

		// Exponential backoff with jitter
		const jitter = Math.random() * 0.3; // 30% jitter
		const delay = Math.min(this.reconnectDelay * (1 + jitter), 30000); // Max 30 seconds

		setTimeout(async () => {
			const isOnline = await this.checkConnectivity();
			if (isOnline) {
				this.updateNetworkStatus({ online: true });
				this.reconnectAttempts = 0;
				this.reconnectDelay = 1000;
			} else {
				this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
			}
		}, delay);
	}

	private onConnectionRestored(): void {
		console.log('[Offline] Connection restored');
		this.stopReconnectMonitoring();

		// Trigger background sync if service worker is available
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.ready.then((registration) => {
				if (registration.sync) {
					registration.sync.register('user-data-sync');
				}
			}).catch(error => {
				console.warn('[Offline] Failed to trigger background sync:', error);
			});
		}

		// Prefetch critical resources
		this.prefetchCriticalResources();
	}

	private onConnectionLost(): void {
		console.log('[Offline] Connection lost');
		this.startReconnectMonitoring();
	}
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();

// Export types
export type { NetworkStatus, OfflineCapabilities, OfflineStorageInfo };

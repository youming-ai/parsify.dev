// Main Offline Integration Point for Parsify.dev

import { serviceWorkerManager } from './service-worker';
import { offlineManager } from './offline-manager';
import { cacheManager } from './cache-manager';
import { backgroundSyncManager } from './background-sync';
import { cacheInvalidationManager } from './cache-invalidation';
import { serviceWorkerMonitor } from '@/monitoring/service-worker-monitor';

export interface OfflineConfig {
	enableServiceWorker: boolean;
	enableBackgroundSync: boolean;
	enableCacheInvalidation: boolean;
	enableMonitoring: boolean;
	autoRegister: boolean;
	cacheConfig: {
		enableStaticCaching: boolean;
		enableAPICaching: boolean;
		enableToolCaching: boolean;
	};
	syncConfig: {
		maxRetries: number;
		syncInterval: number;
		enableNotifications: boolean;
	};
}

export class OfflineIntegration {
	private static instance: OfflineIntegration;
	private isInitialized = false;
	private config: OfflineConfig;

	private constructor(config: Partial<OfflineConfig> = {}) {
		this.config = {
			enableServiceWorker: true,
			enableBackgroundSync: true,
			enableCacheInvalidation: true,
			enableMonitoring: true,
			autoRegister: true,
			cacheConfig: {
				enableStaticCaching: true,
				enableAPICaching: true,
				enableToolCaching: true,
			},
			syncConfig: {
				maxRetries: 3,
				syncInterval: 5 * 60 * 1000, // 5 minutes
				enableNotifications: true,
			},
			...config,
		};
	}

	public static getInstance(config?: Partial<OfflineConfig>): OfflineIntegration {
		if (!OfflineIntegration.instance) {
			OfflineIntegration.instance = new OfflineIntegration(config);
		}
		return OfflineIntegration.instance;
	}

	public async initialize(): Promise<void> {
		if (this.isInitialized) {
			console.warn('[OfflineIntegration] Already initialized');
			return;
		}

		try {
			console.log('[OfflineIntegration] Initializing offline functionality...');

			// Check capabilities first
			const capabilities = offlineManager.getCapabilities();
			if (!capabilities.serviceWorkerSupported && this.config.enableServiceWorker) {
				console.warn('[OfflineIntegration] Service workers not supported, disabling related features');
				this.config.enableServiceWorker = false;
				this.config.enableBackgroundSync = false;
			}

			// Initialize service worker
			if (this.config.enableServiceWorker) {
				await this.initializeServiceWorker();
			}

			// Initialize background sync
			if (this.config.enableBackgroundSync) {
				await this.initializeBackgroundSync();
			}

			// Initialize cache invalidation
			if (this.config.enableCacheInvalidation) {
				await this.initializeCacheInvalidation();
			}

			// Initialize monitoring
			if (this.config.enableMonitoring) {
				await this.initializeMonitoring();
			}

			// Setup periodic tasks
			this.setupPeriodicTasks();

			// Prefetch critical resources
			await this.prefetchCriticalResources();

			// Request persistent storage
			await this.requestPersistentStorage();

			this.isInitialized = true;
			console.log('[OfflineIntegration] Offline functionality initialized successfully');

		} catch (error) {
			console.error('[OfflineIntegration] Failed to initialize offline functionality:', error);
			throw error;
		}
	}

	public async destroy(): Promise<void> {
		if (!this.isInitialized) return;

		console.log('[OfflineIntegration] Destroying offline functionality...');

		try {
			// Clear caches
			await cacheManager.clearCache();

			// Clear background sync queue
			await backgroundSyncManager.clearQueue();

			// Unregister service worker
			if (this.config.enableServiceWorker && 'serviceWorker' in navigator) {
				const registration = await navigator.serviceWorker.getRegistration();
				if (registration) {
					await registration.unregister();
				}
			}

			this.isInitialized = false;
			console.log('[OfflineIntegration] Offline functionality destroyed');

		} catch (error) {
			console.error('[OfflineIntegration] Failed to destroy offline functionality:', error);
		}
	}

	public async getStatus(): Promise<any> {
		const [
			swStatus,
			networkStatus,
			cacheStats,
			syncStats,
			monitoringMetrics,
		] = await Promise.all([
			serviceWorkerManager.getStatus(),
			offlineManager.getNetworkStatus(),
			cacheManager.getCacheStats(),
			backgroundSyncManager.getSyncStats(),
			this.config.enableMonitoring ? serviceWorkerMonitor.getMetrics() : null,
		]);

		const storageInfo = await offlineManager.getStorageInfo();

		return {
			initialized: this.isInitialized,
			config: this.config,
			serviceWorker: swStatus,
			network: networkStatus,
			cache: {
				stats: cacheStats,
				totalSize: cacheStats.reduce((sum, cache) => sum + cache.size, 0),
				totalEntries: cacheStats.reduce((sum, cache) => sum + cache.entries, 0),
			},
			sync: syncStats,
			storage: storageInfo,
			monitoring: monitoringMetrics,
		};
	}

	public async clearAllData(): Promise<void> {
		console.log('[OfflineIntegration] Clearing all offline data...');

		await Promise.all([
			cacheManager.clearCache(),
			backgroundSyncManager.clearQueue(),
			offlineManager.clearOfflineData?.(),
		]);

		console.log('[OfflineIntegration] All offline data cleared');
	}

	public async forceSync(): Promise<void> {
		if (!this.config.enableBackgroundSync) {
			console.warn('[OfflineIntegration] Background sync is disabled');
			return;
		}

		console.log('[OfflineIntegration] Forcing background sync...');
		await backgroundSyncManager.forceSync();
	}

	public async updateCaches(): Promise<void> {
		console.log('[OfflineIntegration] Updating caches...');
		await cacheInvalidationManager.updateCaches();
	}

	public async generateReport(): Promise<string> {
		const status = await this.getStatus();
		const cacheInvalidationReport = cacheInvalidationManager.generateInvalidationReport();
		const monitoringReport = this.config.enableMonitoring
			? serviceWorkerMonitor.generateReport()
			: 'Monitoring disabled';

		return `
Offline Integration Report
==========================
Generated: ${new Date().toLocaleString()}

Configuration:
- Service Worker: ${this.config.enableServiceWorker ? 'Enabled' : 'Disabled'}
- Background Sync: ${this.config.enableBackgroundSync ? 'Enabled' : 'Disabled'}
- Cache Invalidation: ${this.config.enableCacheInvalidation ? 'Enabled' : 'Disabled'}
- Monitoring: ${this.config.enableMonitoring ? 'Enabled' : 'Disabled'}

Current Status:
- Initialized: ${status.initialized}
- Online: ${status.network.online}
- Cache Size: ${(status.cache.totalSize / 1024 / 1024).toFixed(2)}MB
- Cache Entries: ${status.cache.totalEntries}
- Pending Sync: ${status.sync.totalQueued}

${monitoringReport}

${cacheInvalidationReport}
		`.trim();
	}

	// Private methods
	private async initializeServiceWorker(): Promise<void> {
		if (!this.config.autoRegister) {
			console.log('[OfflineIntegration] Auto-registration disabled, skipping service worker');
			return;
		}

		const registered = await serviceWorkerManager.register();
		if (!registered) {
			throw new Error('Failed to register service worker');
		}

		console.log('[OfflineIntegration] Service worker registered successfully');
	}

	private async initializeBackgroundSync(): Promise<void> {
		// Background sync is initialized when service worker is ready
		// This is mainly about setup and configuration
		console.log('[OfflineIntegration] Background sync initialized');
	}

	private async initializeCacheInvalidation(): Promise<void> {
		// Schedule periodic cache invalidation tasks
		await cacheInvalidationManager.schedulePeriodicTasks();
		console.log('[OfflineIntegration] Cache invalidation initialized');
	}

	private async initializeMonitoring(): Promise<void> {
		// Start collecting metrics
		await serviceWorkerMonitor.getMetrics();
		console.log('[OfflineIntegration] Monitoring initialized');
	}

	private setupPeriodicTasks(): void {
		// Setup periodic status checks
		setInterval(async () => {
			if (this.config.enableMonitoring) {
				await serviceWorkerMonitor.getMetrics();
			}
		}, 60000); // Every minute

		// Setup periodic sync checks
		if (this.config.enableBackgroundSync) {
			setInterval(async () => {
				const isOnline = offlineManager.isOnline();
				if (isOnline) {
					await backgroundSyncManager.forceSync();
				}
			}, this.config.syncConfig.syncInterval);
		}
	}

	private async prefetchCriticalResources(): Promise<void> {
		if (!this.config.cacheConfig.enableStaticCaching) return;

		const criticalResources = [
			'/',
			'/tools',
			'/tools/json',
			'/api/tools',
			'/api/categories',
		];

		await cacheManager.warmupCache(criticalResources);
		console.log('[OfflineIntegration] Critical resources prefetched');
	}

	private async requestPersistentStorage(): Promise<void> {
		try {
			const isPersistent = await offlineManager.requestPersistentStorage();
			if (isPersistent) {
				console.log('[OfflineIntegration] Persistent storage granted');
			} else {
				console.warn('[OfflineIntegration] Persistent storage denied');
			}
		} catch (error) {
			console.warn('[OfflineIntegration] Failed to request persistent storage:', error);
		}
	}
}

// Export singleton instance
export const offlineIntegration = OfflineIntegration.getInstance();

// Export types
export type { OfflineConfig };

// Convenience function for quick initialization
export async function initializeOffline(config?: Partial<OfflineConfig>): Promise<OfflineIntegration> {
	const integration = OfflineIntegration.getInstance(config);
	await integration.initialize();
	return integration;
}

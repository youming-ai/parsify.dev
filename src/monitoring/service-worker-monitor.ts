// Service Worker Monitoring Integration for Parsify.dev

import { cacheManager, type CacheStats } from '@/lib/cache-manager';
import { offlineManager, type NetworkStatus } from '@/lib/offline-manager';
import { backgroundSyncManager, type SyncStats } from '@/lib/background-sync';
import { serviceWorkerManager } from '@/lib/service-worker';

export interface ServiceWorkerMetrics {
	cacheStats: CacheStats[];
	networkStatus: NetworkStatus;
	syncStats: SyncStats;
	serviceWorkerStatus: {
		supported: boolean;
		enabled: boolean;
		controlled: boolean;
		updateAvailable: boolean;
	};
	storageInfo: {
		quota: number;
		usage: number;
		usagePercent: number;
	};
	performance: {
		cacheHitRate: number;
		syncSuccessRate: number;
		offlineTime: number;
		dataSynced: number;
	};
	timestamp: Date;
}

export interface ServiceWorkerAlert {
	type: 'cache-full' | 'sync-failed' | 'offline-duration' | 'performance-degradation';
	severity: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	details: any;
	timestamp: Date;
	resolved: boolean;
}

class ServiceWorkerMonitor {
	private static instance: ServiceWorkerMonitor;
	private metrics: ServiceWorkerMetrics | null = null;
	private alerts: ServiceWorkerAlert[] = [];
	private listeners: Set<(metrics: ServiceWorkerMetrics) => void> = new Set();
	private alertListeners: Set<(alert: ServiceWorkerAlert) => void> = new Set();
	private offlineStartTime: Date | null = null;
	private totalOfflineTime = 0;
	private lastSyncTime = new Date();
	private dataSynced = 0;

	private constructor() {
		this.initializeMonitoring();
	}

	public static getInstance(): ServiceWorkerMonitor {
		if (!ServiceWorkerMonitor.instance) {
			ServiceWorkerMonitor.instance = new ServiceWorkerMonitor();
		}
		return ServiceWorkerMonitor.instance;
	}

	public async getMetrics(): Promise<ServiceWorkerMetrics> {
		const [cacheStats, networkStatus, syncStats, storageInfo] = await Promise.all([
			cacheManager.getCacheStats(),
			Promise.resolve(offlineManager.getNetworkStatus()),
			backgroundSyncManager.getSyncStats(),
			offlineManager.getStorageInfo(),
		]);

		const swStatus = serviceWorkerManager.getStatus();

		const totalCacheSize = cacheStats.reduce((sum, cache) => sum + cache.size, 0);
		const totalCacheEntries = cacheStats.reduce((sum, cache) => sum + cache.entries, 0);
		const averageHitRate = cacheStats.reduce((sum, cache) => sum + cache.hitRate, 0) / Math.max(cacheStats.length, 1);

		const syncSuccessRate = syncStats.synced / Math.max(syncStats.synced + syncStats.failed, 1) * 100;

		this.metrics = {
			cacheStats,
			networkStatus,
			syncStats,
			serviceWorkerStatus: {
				supported: swStatus.supported,
				enabled: swStatus.enabled,
				controlled: swStatus.controlled,
				updateAvailable: swStatus.updateAvailable,
			},
			storageInfo: {
				quota: storageInfo.quota,
				usage: storageInfo.usage,
				usagePercent: (storageInfo.usage / storageInfo.quota) * 100,
			},
			performance: {
				cacheHitRate: averageHitRate,
				syncSuccessRate,
				offlineTime: this.totalOfflineTime,
				dataSynced: this.dataSynced,
			},
			timestamp: new Date(),
		};

		this.checkAlerts();
		this.notifyListeners();

		return this.metrics;
	}

	public getAlerts(): ServiceWorkerAlert[] {
		return [...this.alerts];
	}

	public subscribe(listener: (metrics: ServiceWorkerMetrics) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	public subscribeToAlerts(listener: (alert: ServiceWorkerAlert) => void): () => void {
		this.alertListeners.add(listener);
		return () => this.alertListeners.delete(listener);
	}

	public async clearCache(cacheName?: string): Promise<void> {
		await cacheManager.clearCache(cacheName);
		await this.getMetrics(); // Refresh metrics
	}

	public async forceSync(): Promise<void> {
		const results = await backgroundSyncManager.forceSync();
		const successful = results.filter(r => r.success).length;
		this.dataSynced += successful;
		this.lastSyncTime = new Date();
		await this.getMetrics(); // Refresh metrics
	}

	public generateReport(): string {
		if (!this.metrics) {
			return 'No metrics available';
		}

		const { cacheStats, networkStatus, syncStats, serviceWorkerStatus, storageInfo, performance, timestamp } = this.metrics;

		return `
Service Worker Performance Report
=================================
Generated: ${timestamp.toLocaleString()}

Service Worker Status:
- Supported: ${serviceWorkerStatus.supported ? 'Yes' : 'No'}
- Enabled: ${serviceWorkerStatus.enabled ? 'Yes' : 'No'}
- Controlling Page: ${serviceWorkerStatus.controlled ? 'Yes' : 'No'}
- Update Available: ${serviceWorkerStatus.updateAvailable ? 'Yes' : 'No'}

Network Status:
- Online: ${networkStatus.online ? 'Yes' : 'No'}
- Connection Type: ${networkStatus.connectionType || 'Unknown'}
- Effective Type: ${networkStatus.effectiveType || 'Unknown'}
- Last Changed: ${networkStatus.lastChanged.toLocaleString()}

Cache Statistics:
${cacheStats.map(cache => `- ${cache.name}: ${cache.entries} entries, ${(cache.size / 1024 / 1024).toFixed(2)}MB, Hit Rate: ${(cache.hitRate * 100).toFixed(1)}%`).join('\n')}

Sync Statistics:
- Total Queued: ${syncStats.totalQueued}
- Synced: ${syncStats.synced}
- Failed: ${syncStats.failed}
- Last Sync: ${syncStats.lastSync?.toLocaleString() || 'Never'}

Storage Information:
- Quota: ${(storageInfo.quota / 1024 / 1024 / 1024).toFixed(2)}GB
- Used: ${(storageInfo.usage / 1024 / 1024).toFixed(2)}MB
- Usage: ${storageInfo.usagePercent.toFixed(1)}%

Performance Metrics:
- Cache Hit Rate: ${(performance.cacheHitRate * 100).toFixed(1)}%
- Sync Success Rate: performance.syncSuccessRate.toFixed(1)}%
- Total Offline Time: ${(performance.offlineTime / 1000 / 60).toFixed(1)} minutes
- Data Synced: ${performance.dataSynced} items

Active Alerts:
${this.alerts.filter(a => !a.resolved).map(alert =>
  `- [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`
).join('\n') || '- None'}
		`.trim();
	}

	public async exportMetrics(): Promise<any> {
		const metrics = await this.getMetrics();
		return {
			version: '1.0.0',
			timestamp: metrics.timestamp.toISOString(),
			metrics: {
				...metrics,
				timestamp: metrics.timestamp.toISOString(),
			},
			alerts: this.alerts.map(alert => ({
				...alert,
				timestamp: alert.timestamp.toISOString(),
			})),
		};
	}

	// Private methods
	private initializeMonitoring(): void {
		// Monitor network status changes
		offlineManager.subscribe((status) => {
			if (!status.online) {
				this.offlineStartTime = new Date();
			} else if (this.offlineStartTime) {
				const offlineDuration = Date.now() - this.offlineStartTime.getTime();
				this.totalOfflineTime += offlineDuration;
				this.offlineStartTime = null;
			}
		});

		// Monitor sync events
		backgroundSyncManager.subscribe((result) => {
			if (result.success) {
				this.dataSynced++;
			} else {
				this.createAlert('sync-failed', 'medium', 'Background sync failed', result);
			}
		});

		// Periodic metrics collection
		setInterval(() => {
			this.getMetrics().catch(console.error);
		}, 60000); // Every minute
	}

	private checkAlerts(): void {
		if (!this.metrics) return;

		// Check storage usage
		if (this.metrics.storageInfo.usagePercent > 90) {
			this.createAlert('cache-full', 'critical', 'Storage usage is above 90%', {
				usagePercent: this.metrics.storageInfo.usagePercent,
			});
		} else if (this.metrics.storageInfo.usagePercent > 75) {
			this.createAlert('cache-full', 'medium', 'Storage usage is above 75%', {
				usagePercent: this.metrics.storageInfo.usagePercent,
			});
		}

		// Check sync failures
		if (this.metrics.syncStats.failed > 10) {
			this.createAlert('sync-failed', 'high', 'Multiple sync failures detected', {
				failedCount: this.metrics.syncStats.failed,
			});
		}

		// Check offline duration
		const offlineMinutes = this.totalOfflineTime / 1000 / 60;
		if (offlineMinutes > 60) {
			this.createAlert('offline-duration', 'medium', 'Extended offline period detected', {
				durationMinutes: offlineMinutes,
			});
		}

		// Check performance degradation
		if (this.metrics.performance.cacheHitRate < 50) {
			this.createAlert('performance-degradation', 'medium', 'Low cache hit rate detected', {
				hitRate: this.metrics.performance.cacheHitRate,
			});
		}

		if (this.metrics.performance.syncSuccessRate < 80) {
			this.createAlert('performance-degradation', 'medium', 'Low sync success rate detected', {
				successRate: this.metrics.performance.syncSuccessRate,
			});
		}
	}

	private createAlert(type: ServiceWorkerAlert['type'], severity: ServiceWorkerAlert['severity'], message: string, details: any): void {
		// Check if similar alert already exists and is not resolved
		const existingAlert = this.alerts.find(
			alert => alert.type === type && !alert.resolved
		);

		if (existingAlert) {
			// Update existing alert
			existingAlert.details = details;
			existingAlert.timestamp = new Date();
		} else {
			// Create new alert
			const alert: ServiceWorkerAlert = {
				type,
				severity,
				message,
				details,
				timestamp: new Date(),
				resolved: false,
			};

			this.alerts.push(alert);
			this.notifyAlertListeners(alert);
		}
	}

	private notifyListeners(): void {
		if (this.metrics) {
			this.listeners.forEach(listener => listener(this.metrics!));
		}
	}

	private notifyAlertListeners(alert: ServiceWorkerAlert): void {
		this.alertListeners.forEach(listener => listener(alert));
	}

	public resolveAlert(alertId: string): void {
		const alert = this.alerts.find(a => a.type === alertId && !a.resolved);
		if (alert) {
			alert.resolved = true;
		}
	}

	public clearResolvedAlerts(): void {
		this.alerts = this.alerts.filter(alert => !alert.resolved);
	}
}

// Export singleton instance
export const serviceWorkerMonitor = ServiceWorkerMonitor.getInstance();

// Export types
export type { ServiceWorkerMetrics, ServiceWorkerAlert };

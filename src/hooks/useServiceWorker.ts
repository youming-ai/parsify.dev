import { useState, useEffect } from 'react';
import { serviceWorkerManager, type ServiceWorkerStatus, type OfflineQueueItem } from '@/lib/service-worker';

// React hook for service worker status and management
export function useServiceWorker() {
	const [status, setStatus] = useState<ServiceWorkerStatus>(serviceWorkerManager.getStatus());

	useEffect(() => {
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
}

// Hook for offline status specifically
export function useOfflineStatus() {
	const [isOnline, setIsOnline] = useState(() => navigator.onLine);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	return isOnline;
}

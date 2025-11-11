// Cache Management Utilities for Parsify.dev Service Worker

export interface CacheConfig {
	name: string;
	maxAge: number; // in milliseconds
	maxEntries: number;
	strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

export interface CacheStats {
	name: string;
	size: number;
	entries: number;
	lastAccessed: Date;
	hitRate: number;
}

export interface CacheEntry {
	url: string;
	response: Response;
	timestamp: number;
	accessCount: number;
	lastAccessed: number;
}

class CacheManager {
	private static instance: CacheManager;
	private cacheConfigs: Map<string, CacheConfig> = new Map();
	private cacheStats: Map<string, CacheStats> = new Map();

	private constructor() {
		this.initializeCacheConfigs();
	}

	public static getInstance(): CacheManager {
		if (!CacheManager.instance) {
			CacheManager.instance = new CacheManager();
		}
		return CacheManager.instance;
	}

	private initializeCacheConfigs(): void {
		// Static assets cache
		this.cacheConfigs.set('parsify-static-v1', {
			name: 'parsify-static-v1',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			maxEntries: 100,
			strategy: 'cache-first',
		});

		// Dynamic content cache
		this.cacheConfigs.set('parsify-dynamic-v1', {
			name: 'parsify-dynamic-v1',
			maxAge: 24 * 60 * 60 * 1000, // 1 day
			maxEntries: 50,
			strategy: 'network-first',
		});

		// Runtime cache for API responses
		this.cacheConfigs.set('parsify-runtime-v1', {
			name: 'parsify-runtime-v1',
			maxAge: 60 * 60 * 1000, // 1 hour
			maxEntries: 200,
			strategy: 'stale-while-revalidate',
		});

		// Tool-specific cache
		this.cacheConfigs.set('parsify-tools-v1', {
			name: 'parsify-tools-v1',
			maxAge: 2 * 60 * 60 * 1000, // 2 hours
			maxEntries: 30,
			strategy: 'stale-while-revalidate',
		});
	}

	public async getCache(cacheName: string): Promise<Cache> {
		try {
			return await caches.open(cacheName);
		} catch (error) {
			console.error(`[Cache] Failed to open cache ${cacheName}:`, error);
			throw error;
		}
	}

	public async getCachedResponse(request: Request, cacheName?: string): Promise<Response | null> {
		const cache = await this.getCache(cacheName || this.getCacheNameForRequest(request));
		const cached = await cache.match(request);

		if (!cached) return null;

		// Check if cache entry is expired
		if (this.isExpired(cached)) {
			await cache.delete(request);
			return null;
		}

		// Update access statistics
		await this.updateAccessStats(request, cacheName || this.getCacheNameForRequest(request));

		return cached;
	}

	public async cacheResponse(request: Request, response: Response, cacheName?: string): Promise<void> {
		const targetCacheName = cacheName || this.getCacheNameForRequest(request);
		const config = this.cacheConfigs.get(targetCacheName);

		if (!config) {
			console.warn(`[Cache] No configuration found for cache: ${targetCacheName}`);
			return;
		}

		const cache = await this.getCache(targetCacheName);

		// Check cache size limit
		await this.enforceMaxEntries(targetCacheName, config.maxEntries);

		// Add cache headers
		const cachedResponse = this.addCacheHeaders(response, config);

		await cache.put(request, cachedResponse);
		await this.updateCacheStats(targetCacheName);
	}

	public async invalidateCache(pattern: string | RegExp, cacheName?: string): Promise<void> {
		const cacheNames = cacheName ? [cacheName] : Array.from(this.cacheConfigs.keys());

		for (const name of cacheNames) {
			const cache = await this.getCache(name);
			const requests = await cache.keys();

			for (const request of requests) {
				const url = request.url;
				const shouldDelete = typeof pattern === 'string'
					? url.includes(pattern)
					: pattern.test(url);

				if (shouldDelete) {
					await cache.delete(request);
				}
			}
		}
	}

	public async clearCache(cacheName?: string): Promise<void> {
		if (cacheName) {
			const cache = await caches.open(cacheName);
			const requests = await cache.keys();
			await Promise.all(requests.map(request => cache.delete(request)));
		} else {
			// Clear all caches
			const cacheNames = await caches.keys();
			await Promise.all(cacheNames.map(name => caches.delete(name)));
		}
	}

	public async getCacheStats(cacheName?: string): Promise<CacheStats[]> {
		if (cacheName) {
			const stats = await this.calculateCacheStats(cacheName);
			return stats ? [stats] : [];
		}

		const allStats: CacheStats[] = [];
		for (const name of this.cacheConfigs.keys()) {
			const stats = await this.calculateCacheStats(name);
			if (stats) allStats.push(stats);
		}

		return allStats;
	}

	public async warmupCache(urls: string[]): Promise<void> {
		const promises = urls.map(async (url) => {
			try {
				const request = new Request(url);
				const response = await fetch(request);

				if (response.ok) {
					await this.cacheResponse(request, response);
				}
			} catch (error) {
				console.warn(`[Cache] Failed to warmup cache for ${url}:`, error);
			}
		});

		await Promise.allSettled(promises);
	}

	public getCacheNameForRequest(request: Request): string {
		const url = new URL(request.url);
		const path = url.pathname;

		// Static assets
		if (path.includes('/_next/static/') ||
			path.includes('/static/') ||
			path.match(/\.(css|js|woff|woff2|ttf|ico|png|jpg|jpeg|svg|gif)$/)) {
			return 'parsify-static-v1';
		}

		// API endpoints
		if (path.startsWith('/api/')) {
			return 'parsify-runtime-v1';
		}

		// Tools pages
		if (path.startsWith('/tools/')) {
			return 'parsify-tools-v1';
		}

		// Default dynamic cache
		return 'parsify-dynamic-v1';
	}

	public getCacheStrategy(request: Request): string {
		const cacheName = this.getCacheNameForRequest(request);
		return this.cacheConfigs.get(cacheName)?.strategy || 'network-first';
	}

	// Private methods
	private addCacheHeaders(response: Response, config: CacheConfig): Response {
		const headers = new Headers(response.headers);

		headers.set('sw-cache-date', new Date().toISOString());
		headers.set('sw-cache-ttl', config.maxAge.toString());
		headers.set('sw-cache-strategy', config.strategy);

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}

	private isExpired(response: Response): boolean {
		const cacheDate = response.headers.get('sw-cache-date');
		const ttl = response.headers.get('sw-cache-ttl');

		if (!cacheDate || !ttl) return true;

		const cachedTime = new Date(cacheDate).getTime();
		const maxAge = parseInt(ttl);

		return Date.now() - cachedTime > maxAge;
	}

	private async enforceMaxEntries(cacheName: string, maxEntries: number): Promise<void> {
		const cache = await this.getCache(cacheName);
		const requests = await cache.keys();

		if (requests.length >= maxEntries) {
			// Get entries with their timestamps
			const entries: Array<{ request: Request; timestamp: number }> = [];

			for (const request of requests) {
				const response = await cache.match(request);
				const timestamp = response?.headers.get('sw-cache-date');
				entries.push({
					request,
					timestamp: timestamp ? new Date(timestamp).getTime() : 0,
				});
			}

			// Sort by timestamp (oldest first) and remove excess
			entries.sort((a, b) => a.timestamp - b.timestamp);
			const toDelete = entries.slice(0, entries.length - maxEntries + 1);

			await Promise.all(toDelete.map(entry => cache.delete(entry.request)));
		}
	}

	private async updateAccessStats(request: Request, cacheName: string): Promise<void> {
		// This would typically update a database or persistent storage
		// For now, we'll just track in memory
		const stats = this.cacheStats.get(cacheName);
		if (stats) {
			stats.hitRate = Math.min(1, stats.hitRate + 0.01);
			stats.lastAccessed = new Date();
		}
	}

	private async updateCacheStats(cacheName: string): Promise<void> {
		const stats = await this.calculateCacheStats(cacheName);
		if (stats) {
			this.cacheStats.set(cacheName, stats);
		}
	}

	private async calculateCacheStats(cacheName: string): Promise<CacheStats | null> {
		try {
			const cache = await this.getCache(cacheName);
			const requests = await cache.keys();
			let totalSize = 0;
			let totalAccessCount = 0;
			let oldestAccess = Date.now();

			for (const request of requests.slice(0, 50)) { // Sample first 50 for performance
				const response = await cache.match(request);
				if (response) {
					const text = await response.text();
					totalSize += text.length;

					const accessCount = parseInt(response.headers.get('sw-access-count') || '0');
					totalAccessCount += accessCount;

					const lastAccessed = response.headers.get('sw-last-accessed');
					if (lastAccessed) {
						oldestAccess = Math.min(oldestAccess, new Date(lastAccessed).getTime());
					}
				}
			}

			return {
				name: cacheName,
				size: totalSize * Math.ceil(requests.length / Math.min(requests.length, 50)),
				entries: requests.length,
				lastAccessed: new Date(oldestAccess),
				hitRate: totalAccessCount / Math.max(requests.length, 1),
			};
		} catch (error) {
			console.error(`[Cache] Failed to calculate stats for ${cacheName}:`, error);
			return null;
		}
	}

	public createOfflineResponse(request: Request): Response {
		const url = new URL(request.url);

		if (request.headers.get('accept')?.includes('text/html')) {
			// HTML request
			return new Response(this.getOfflineHTML(), {
				status: 200,
				headers: { 'Content-Type': 'text/html' },
			});
		}

		if (request.headers.get('accept')?.includes('application/json')) {
			// JSON request
			return new Response(JSON.stringify({
				offline: true,
				message: 'No network connection',
				cached: false
			}), {
				status: 503,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response('Offline', { status: 503 });
	}

	private getOfflineHTML(): string {
		return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Parsify.dev</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
            padding: 2rem;
            max-width: 400px;
            margin: 0 auto;
            line-height: 1.6;
        }
        .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
        .offline-message { color: #666; margin-bottom: 2rem; }
        .offline-tools {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            text-align: left;
        }
        .offline-tools h3 { margin-top: 0; color: #333; }
        .offline-tools ul { margin: 0; padding-left: 1.2rem; }
        .retry-button {
            background: #007acc;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.5rem;
        }
        .retry-button:hover { background: #005a9e; }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        .status-offline { background: #ff4444; }
    </style>
</head>
<body>
    <div class="offline-icon">📱</div>
    <h1><span class="status-indicator status-offline"></span>You're Offline</h1>
    <p class="offline-message">
        It looks like you've lost your internet connection.
        Some tools may still work with cached data.
    </p>

    <div class="offline-tools">
        <h3>Available Offline Tools:</h3>
        <ul>
            <li>JSON Formatter & Validator</li>
            <li>Base64 Encoder/Decoder</li>
            <li>URL Encoder/Decoder</li>
            <li>Hash Generator</li>
            <li>Text Diff Tool</li>
        </ul>
    </div>

    <div>
        <button class="retry-button" onclick="window.location.reload()">
            Try Again
        </button>
        <button class="retry-button" onclick="window.history.back()">
            Go Back
        </button>
    </div>

    <script>
        // Listen for connection changes
        window.addEventListener('online', () => window.location.reload());

        // Periodically check connection
        setInterval(() => {
            if (navigator.onLine) {
                window.location.reload();
            }
        }, 5000);
    </script>
</body>
</html>`;
	}
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Export types for external use
export type { CacheConfig, CacheStats, CacheEntry };

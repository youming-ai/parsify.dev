// Service Worker for Parsify.dev - Offline Caching and Background Sync
const CACHE_NAME = 'parsify-dev-v1';
const STATIC_CACHE = 'parsify-static-v1';
const DYNAMIC_CACHE = 'parsify-dynamic-v1';
const RUNTIME_CACHE = 'parsify-runtime-v1';

// Cache configuration
const CACHE_CONFIG = {
	// Static assets that should be cached immediately
	STATIC_ASSETS: [
		'/',
		'/tools',
		'/tools/json',
		'/tools/code',
		'/tools/file',
		'/tools/data',
		'/tools/utilities',
		'/_next/static/css/',
		'/_next/static/chunks/',
		'/favicon.ico',
		'/manifest.json',
	],

	// API endpoints that can be cached
	CACHEABLE_APIS: [
		'/api/tools',
		'/api/categories',
	],

	// Resources that should never be cached
	NEVER_CACHE: [
		'/api/analytics',
		'/api/user-data',
		'/admin/',
		'/debug/',
	],

	// Cache TTL in milliseconds
	TTL: {
		STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
		DYNAMIC: 24 * 60 * 60 * 1000,    // 1 day
		RUNTIME: 60 * 60 * 1000,         // 1 hour
		API: 5 * 60 * 1000,              // 5 minutes
	},
};

// Cache strategies
const CacheStrategies = {
	// Cache first with network fallback for static assets
	cacheFirst: async (request) => {
		const cache = await caches.open(STATIC_CACHE);
		const cached = await cache.match(request);

		if (cached && !isExpired(cached)) {
			return cached;
		}

		try {
			const network = await fetch(request);
			if (network.ok) {
				const response = await addCacheHeaders(network, 'static');
				cache.put(request, response.clone());
				return network;
			}
			return cached;
		} catch (error) {
			return cached || createOfflineResponse(request);
		}
	},

	// Network first with cache fallback for dynamic content
	networkFirst: async (request) => {
		const cache = await caches.open(DYNAMIC_CACHE);
		const cached = await cache.match(request);

		try {
			const network = await fetch(request);
			if (network.ok) {
				const response = await addCacheHeaders(network, 'dynamic');
				cache.put(request, response.clone());
				return network;
			}
		} catch (error) {
			// Network failed, try cache
		}

		return cached || createOfflineResponse(request);
	},

	// Stale while revalidate for frequently updated content
	staleWhileRevalidate: async (request) => {
		const cache = await caches.open(DYNAMIC_CACHE);
		const cached = await cache.match(request);

		// Start network request in background
		const networkPromise = fetch(request).then(async (response) => {
			if (response.ok) {
				const responseWithHeaders = await addCacheHeaders(response, 'dynamic');
				cache.put(request, responseWithHeaders.clone());
			}
			return response;
		}).catch(() => null);

		// Return cached version immediately if available
		if (cached) {
			networkPromise; // Don't await, let it update in background
			return cached;
		}

		// If no cache, wait for network
		const network = await networkPromise;
		return network || createOfflineResponse(request);
	},

	// Network only for sensitive data
	networkOnly: async (request) => {
		try {
			return await fetch(request);
		} catch (error) {
			return createOfflineResponse(request);
		}
	},
};

// Utility functions
function isExpired(response) {
	const dateHeader = response.headers.get('sw-cache-date');
	if (!dateHeader) return true;

	const cacheDate = new Date(dateHeader);
	const ttl = response.headers.get('sw-cache-ttl') || CACHE_CONFIG.TTL.DYNAMIC;

	return Date.now() - cacheDate.getTime() > parseInt(ttl);
}

async function addCacheHeaders(response, type) {
	const ttl = CACHE_CONFIG.TTL[type.toUpperCase()];
	const headers = new Headers(response.headers);

	headers.set('sw-cache-date', new Date().toISOString());
	headers.set('sw-cache-ttl', ttl.toString());
	headers.set('sw-cached-by', 'parsify-sw');

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

function createOfflineResponse(request) {
	const url = new URL(request.url);

	// Return different responses based on request type
	if (request.headers.get('accept')?.includes('text/html')) {
		// HTML request - return offline page
		return new Response(OFFLINE_HTML, {
			status: 200,
			headers: { 'Content-Type': 'text/html' },
		});
	}

	if (request.headers.get('accept')?.includes('application/json')) {
		// JSON request - return offline data
		return new Response(JSON.stringify({
			offline: true,
			message: 'No network connection',
			cached: false
		}), {
			status: 503,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Default offline response
	return new Response('Offline', { status: 503 });
}

// Route handler
function getRouteStrategy(request) {
	const url = new URL(request.url);
	const path = url.pathname;

	// Never cache these routes
	if (CACHE_CONFIG.NEVER_CACHE.some(route => path.startsWith(route))) {
		return CacheStrategies.networkOnly;
	}

	// Static assets - cache first
	if (
		path.includes('/_next/static/') ||
		path.includes('/static/') ||
		path.endsWith('.css') ||
		path.endsWith('.js') ||
		path.endsWith('.woff') ||
		path.endsWith('.woff2') ||
		path.endsWith('.ttf')
	) {
		return CacheStrategies.cacheFirst;
	}

	// API endpoints
	if (path.startsWith('/api/')) {
		if (CACHE_CONFIG.CACHEABLE_APIS.some(route => path.startsWith(route))) {
			return CacheStrategies.staleWhileRevalidate;
		}
		return CacheStrategies.networkOnly;
	}

	// Tools pages - stale while revalidate for fresh content
	if (path.startsWith('/tools/')) {
		return CacheStrategies.staleWhileRevalidate;
	}

	// HTML pages - network first with cache fallback
	if (request.headers.get('accept')?.includes('text/html')) {
		return CacheStrategies.networkFirst;
	}

	// Default to network first
	return CacheStrategies.networkFirst;
}

// Background sync for user data
async function syncUserData() {
	try {
		// Get pending user data from IndexedDB
		const pendingData = await getPendingSyncData();

		for (const data of pendingData) {
			try {
				const response = await fetch('/api/user-data/sync', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});

				if (response.ok) {
					await removePendingSyncData(data.id);
				}
			} catch (error) {
				console.error('Failed to sync user data:', error);
			}
		}
	} catch (error) {
		console.error('Background sync failed:', error);
	}
}

// IndexedDB helpers for pending sync data
async function getPendingSyncData() {
	// Implementation would use IndexedDB to store pending sync data
	return [];
}

async function removePendingSyncData(id) {
	// Implementation would remove data from IndexedDB
}

// Offline page HTML
const OFFLINE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Parsify.dev</title>
    <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
        .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
        .offline-message { color: #666; margin-bottom: 2rem; }
        .retry-button {
            background: #007acc;
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="offline-icon">📱</div>
    <h1>You're Offline</h1>
    <p class="offline-message">
        It looks like you've lost your internet connection.
        Some tools may still work with cached data.
    </p>
    <button class="retry-button" onclick="window.location.reload()">
        Try Again
    </button>
    <script>
        // Listen for connection changes
        window.addEventListener('online', () => window.location.reload());
    </script>
</body>
</html>
`;

// Service Worker Events
self.addEventListener('install', (event) => {
	console.log('[SW] Installing service worker');

	event.waitUntil(
		caches.open(STATIC_CACHE)
			.then((cache) => {
				console.log('[SW] Caching static assets');
				return cache.addAll(CACHE_CONFIG.STATIC_ASSETS);
			})
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	console.log('[SW] Activating service worker');

	event.waitUntil(
		Promise.all([
			// Clean up old caches
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((name) => name !== STATIC_CACHE &&
								name !== DYNAMIC_CACHE &&
								name !== RUNTIME_CACHE)
						.map((name) => {
							console.log('[SW] Deleting old cache:', name);
							return caches.delete(name);
						})
				);
			}),
			// Take control of all open pages
			self.clients.claim(),
		])
	);
});

self.addEventListener('fetch', (event) => {
	const strategy = getRouteStrategy(event.request);

	event.respondWith(
		strategy(event.request).catch((error) => {
			console.error('[SW] Request failed:', error);
			return createOfflineResponse(event.request);
		})
	);
});

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data?.type === 'CACHE_UPDATE') {
		// Manual cache update requested
		event.waitUntil(
			caches.open(DYNAMIC_CACHE).then((cache) => {
				return cache.add(event.data.url);
			})
		);
	}

	if (event.data?.type === 'CACHE_CLEAR') {
		// Clear all caches
		event.waitUntil(
			Promise.all([
				caches.delete(STATIC_CACHE),
				caches.delete(DYNAMIC_CACHE),
				caches.delete(RUNTIME_CACHE),
			])
		);
	}
});

self.addEventListener('sync', (event) => {
	if (event.tag === 'user-data-sync') {
		console.log('[SW] Background sync triggered');
		event.waitUntil(syncUserData());
	}
});

self.addEventListener('push', (event) => {
	if (event.data) {
		const options = {
			body: event.data.text(),
			icon: '/favicon.ico',
			badge: '/favicon.ico',
		};

		event.waitUntil(
			self.registration.showNotification('Parsify.dev', options)
		);
	}
});

// Periodic sync for cache updates (if supported)
self.addEventListener('periodicsync', (event) => {
	if (event.tag === 'cache-update') {
		console.log('[SW] Periodic sync triggered');
		event.waitUntil(updateCache());
	}
});

async function updateCache() {
	try {
		const cache = await caches.open(DYNAMIC_CACHE);
		const urls = [
			'/api/tools',
			'/api/categories',
			'/tools',
		];

		await Promise.all(
			urls.map(url => cache.add(url))
		);
	} catch (error) {
		console.error('[SW] Cache update failed:', error);
	}
}

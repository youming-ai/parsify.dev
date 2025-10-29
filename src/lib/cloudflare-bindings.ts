// Type definitions for Cloudflare bindings
export interface Env {
	// D1 Database binding
	DB: D1Database;

	// KV Namespace bindings
	CACHE: KVNamespace;
	ANALYTICS: KVNamespace;
	SESSIONS: KVNamespace;

	// R2 Bucket binding
	FILES: R2Bucket;

	// Static files binding
	STATIC_FILES: Fetcher;

	// Environment variables
	NEXT_PUBLIC_MICROSOFT_CLARITY_ID: string;
}

// Helper functions for working with Cloudflare resources
export const cloudflareHelpers = {
	// D1 Database operations
	async queryDB<T>(env: Env, query: string, params?: any[]): Promise<T[]> {
		try {
			const stmt = env.DB.prepare(query);
			const result = params ? await stmt.bind(...params).all() : await stmt.all();
			return result.results as T[];
		} catch (error) {
			console.error('D1 query error:', error);
			throw error;
		}
	},

	// KV Cache operations
	async getFromCache<T>(env: Env, key: string): Promise<T | null> {
		try {
			const value = await env.CACHE.get(key);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error('KV get error:', error);
			return null;
		}
	},

	async setCache(env: Env, key: string, value: any, ttl?: number): Promise<void> {
		try {
			const options = ttl ? { expirationTtl: ttl } : undefined;
			await env.CACHE.put(key, JSON.stringify(value), options);
		} catch (error) {
			console.error('KV set error:', error);
			throw error;
		}
	},

	// R2 Bucket operations
	async uploadToR2(
		env: Env,
		key: string,
		data: ArrayBuffer | ReadableStream | Uint8Array,
		metadata?: Record<string, string>,
	): Promise<void> {
		try {
			await env.FILES.put(key, data, {
				customMetadata: metadata,
			});
		} catch (error) {
			console.error('R2 upload error:', error);
			throw error;
		}
	},

	async getFromR2(env: Env, key: string): Promise<R2ObjectBody | null> {
		try {
			return await env.FILES.get(key);
		} catch (error) {
			console.error('R2 get error:', error);
			return null;
		}
	},

	async deleteFromR2(env: Env, key: string): Promise<void> {
		try {
			await env.FILES.delete(key);
		} catch (error) {
			console.error('R2 delete error:', error);
			throw error;
		}
	},

	// Analytics KV operations
	async trackAnalytics(env: Env, event: string, data: Record<string, any>): Promise<void> {
		try {
			const key = `${event}:${Date.now()}:${Math.random().toString(36).substring(7)}`;
			await env.ANALYTICS.put(
				key,
				JSON.stringify({
					event,
					data,
					timestamp: new Date().toISOString(),
				}),
				{
					expirationTtl: 86400, // 24 hours
				},
			);
		} catch (error) {
			console.error('Analytics tracking error:', error);
			throw error;
		}
	},

	// Session KV operations
	async getSession(env: Env, sessionId: string): Promise<Record<string, any> | null> {
		try {
			const value = await env.SESSIONS.get(sessionId);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error('Session get error:', error);
			return null;
		}
	},

	async setSession(env: Env, sessionId: string, data: Record<string, any>, ttl: number = 3600): Promise<void> {
		try {
			await env.SESSIONS.put(
				sessionId,
				JSON.stringify({
					...data,
					lastUpdated: new Date().toISOString(),
				}),
				{
					expirationTtl: ttl,
				},
			);
		} catch (error) {
			console.error('Session set error:', error);
			throw error;
		}
	},
};

// Example usage in Pages Functions:
/*
export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  // Use D1 database
  const users = await cloudflareHelpers.queryDB(env, 'SELECT * FROM users WHERE active = ?', [true]);

  // Use KV cache
  const cachedData = await cloudflareHelpers.getFromCache(env, 'api-key');
  if (!cachedData) {
    const freshData = await fetchSomeData();
    await cloudflareHelpers.setCache(env, 'api-key', freshData, 3600);
  }

  // Use R2 bucket
  await cloudflareHelpers.uploadToR2(env, 'file.txt', new TextEncoder().encode('Hello World'), {
    contentType: 'text/plain'
  });

  return new Response('Success');
};
*/

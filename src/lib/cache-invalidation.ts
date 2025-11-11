// Cache Invalidation and Update Strategies for Parsify.dev

import { cacheManager, type CacheConfig } from './cache-manager';

export interface InvalidationRule {
	id: string;
	name: string;
	pattern: string | RegExp;
	cacheName?: string;
	strategy: 'immediate' | 'versioned' | 'ttl' | 'manual';
	priority: 'high' | 'medium' | 'low';
	conditions?: {
		maxAge?: number;
		maxSize?: number;
		maxEntries?: number;
	};
}

export interface InvalidationResult {
	rule: InvalidationRule;
	invalidatedItems: number;
	freedSpace: number;
	duration: number;
	success: boolean;
	error?: string;
}

export interface UpdateStrategy {
	name: string;
	description: string;
	cacheNames: string[];
	updateInterval: number;
	strategy: 'stale-while-revalidate' | 'background-update' | 'on-demand';
	conditions: {
		networkConditions?: string[];
		batteryLevel?: number;
		deviceMemory?: number;
	};
}

class CacheInvalidationManager {
	private static instance: CacheInvalidationManager;
	private rules: InvalidationRule[] = [];
	private strategies: UpdateStrategy[] = [];
	private isInitialized = false;

	private constructor() {
		this.initializeDefaultRules();
		this.initializeDefaultStrategies();
	}

	public static getInstance(): CacheInvalidationManager {
		if (!CacheInvalidationManager.instance) {
			CacheInvalidationManager.instance = new CacheInvalidationManager();
		}
		return CacheInvalidationManager.instance;
	}

	public addRule(rule: Omit<InvalidationRule, 'id'>): string {
		const id = this.generateId();
		const fullRule: InvalidationRule = { ...rule, id };
		this.rules.push(fullRule);
		this.sortRulesByPriority();
		return id;
	}

	public removeRule(ruleId: string): boolean {
		const index = this.rules.findIndex(rule => rule.id === ruleId);
		if (index !== -1) {
			this.rules.splice(index, 1);
			return true;
		}
		return false;
	}

	public getRules(): InvalidationRule[] {
		return [...this.rules];
	}

	public addStrategy(strategy: UpdateStrategy): void {
		this.strategies.push(strategy);
	}

	public removeStrategy(strategyName: string): boolean {
		const index = this.strategies.findIndex(s => s.name === strategyName);
		if (index !== -1) {
			this.strategies.splice(index, 1);
			return true;
		}
		return false;
	}

	public getStrategies(): UpdateStrategy[] {
		return [...this.strategies];
	}

	public async invalidateByRule(ruleId: string): Promise<InvalidationResult | null> {
		const rule = this.rules.find(r => r.id === ruleId);
		if (!rule) return null;

		const startTime = Date.now();
		let invalidatedItems = 0;
		let freedSpace = 0;

		try {
			switch (rule.strategy) {
				case 'immediate':
					const result = await this.immediateInvalidation(rule);
					invalidatedItems = result.items;
					freedSpace = result.space;
					break;

				case 'versioned':
					const versionedResult = await this.versionedInvalidation(rule);
					invalidatedItems = versionedResult.items;
					freedSpace = versionedResult.space;
					break;

				case 'ttl':
					const ttlResult = await this.ttlInvalidation(rule);
					invalidatedItems = ttlResult.items;
					freedSpace = ttlResult.space;
					break;

				case 'manual':
					// Manual invalidation requires external trigger
					break;
			}

			return {
				rule,
				invalidatedItems,
				freedSpace,
				duration: Date.now() - startTime,
				success: true,
			};
		} catch (error) {
			return {
				rule,
				invalidatedItems: 0,
				freedSpace: 0,
				duration: Date.now() - startTime,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	public async invalidateAll(): Promise<InvalidationResult[]> {
		const results: InvalidationResult[] = [];

		for (const rule of this.rules.filter(r => r.strategy !== 'manual')) {
			const result = await this.invalidateByRule(rule.id);
			if (result) {
				results.push(result);
			}
		}

		return results;
	}

	public async runAutomaticInvalidation(): Promise<InvalidationResult[]> {
		const results: InvalidationResult[] = [];

		for (const rule of this.rules) {
			const shouldInvalidate = await this.shouldInvalidate(rule);
			if (shouldInvalidate) {
				const result = await this.invalidateByRule(rule.id);
				if (result) {
					results.push(result);
				}
			}
		}

		return results;
	}

	public async updateCaches(): Promise<void> {
		const networkConditions = this.getNetworkConditions();

		for (const strategy of this.strategies) {
			const shouldUpdate = this.shouldUpdate(strategy, networkConditions);
			if (shouldUpdate) {
				await this.executeUpdateStrategy(strategy);
			}
		}
	}

	public async schedulePeriodicTasks(): Promise<void> {
		// Schedule cache invalidation
		setInterval(async () => {
			await this.runAutomaticInvalidation();
		}, 60 * 60 * 1000); // Every hour

		// Schedule cache updates
		setInterval(async () => {
			await this.updateCaches();
		}, 30 * 60 * 1000); // Every 30 minutes
	}

	public generateInvalidationReport(): string {
		const report = [];
		report.push('Cache Invalidation Report');
		report.push('========================');
		report.push(`Generated: ${new Date().toLocaleString()}`);
		report.push('');

		report.push(`Active Rules: ${this.rules.length}`);
		report.push('');

		for (const rule of this.rules) {
			report.push(`- ${rule.name} (${rule.strategy})`);
			report.push(`  Priority: ${rule.priority}`);
			report.push(`  Pattern: ${rule.pattern}`);
			report.push(`  Cache: ${rule.cacheName || 'All'}`);
			if (rule.conditions) {
				report.push(`  Conditions: ${JSON.stringify(rule.conditions, null, 2)}`);
			}
			report.push('');
		}

		report.push(`Active Strategies: ${this.strategies.length}`);
		report.push('');

		for (const strategy of this.strategies) {
			report.push(`- ${strategy.name}`);
			report.push(`  Description: ${strategy.description}`);
			report.push(`  Interval: ${strategy.updateInterval}ms`);
			report.push(`  Strategy: ${strategy.strategy}`);
			report.push(`  Caches: ${strategy.cacheNames.join(', ')}`);
			report.push('');
		}

		return report.join('\n');
	}

	// Private methods
	private initializeDefaultRules(): void {
		// API responses - TTL based
		this.addRule({
			name: 'API Response TTL',
			pattern: '/api/',
			strategy: 'ttl',
			priority: 'high',
			conditions: {
				maxAge: 5 * 60 * 1000, // 5 minutes
			},
		});

		// Static assets - Version based
		this.addRule({
			name: 'Static Assets Versioned',
			pattern: '/_next/static/',
			strategy: 'versioned',
			priority: 'low',
		});

		// Tool pages - Size based
		this.addRule({
			name: 'Tool Pages Size Limit',
			pattern: '/tools/',
			strategy: 'ttl',
			priority: 'medium',
			conditions: {
				maxEntries: 50,
				maxAge: 24 * 60 * 60 * 1000, // 1 day
			},
		});

		// Temporary cache entries - Immediate invalidation
		this.addRule({
			name: 'Temporary Cache Entries',
			pattern: /^.*temp-.*$/,
			strategy: 'immediate',
			priority: 'high',
		});
	}

	private initializeDefaultStrategies(): void {
		// Critical tools - background update
		this.addStrategy({
			name: 'Critical Tools Update',
			description: 'Update critical tool pages in background',
			cacheNames: ['parsify-tools-v1'],
			updateInterval: 30 * 60 * 1000, // 30 minutes
			strategy: 'background-update',
			conditions: {
				networkConditions: ['4g', 'wifi'],
			},
		});

		// Static assets - stale while revalidate
		this.addStrategy({
			name: 'Static Assets Refresh',
			description: 'Refresh static assets with stale-while-revalidate',
			cacheNames: ['parsify-static-v1'],
			updateInterval: 60 * 60 * 1000, // 1 hour
			strategy: 'stale-while-revalidate',
		});

		// API data - on-demand update
		this.addStrategy({
			name: 'API Data Update',
			description: 'Update API data on demand',
			cacheNames: ['parsify-runtime-v1'],
			updateInterval: 5 * 60 * 1000, // 5 minutes
			strategy: 'on-demand',
			conditions: {
				networkConditions: ['4g', 'wifi', '3g'],
			},
		});
	}

	private generateId(): string {
		return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private sortRulesByPriority(): void {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		this.rules.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
	}

	private async shouldInvalidate(rule: InvalidationRule): Promise<boolean> {
		if (!rule.conditions) return false;

		const stats = await cacheManager.getCacheStats(rule.cacheName);
		const cacheStat = stats.find(s => s.name === rule.cacheName) || stats[0];

		if (rule.conditions.maxAge) {
			const oldestEntry = cacheStat.lastAccessed;
			const age = Date.now() - oldestEntry.getTime();
			if (age > rule.conditions.maxAge) return true;
		}

		if (rule.conditions.maxSize && cacheStat.size > rule.conditions.maxSize) {
			return true;
		}

		if (rule.conditions.maxEntries && cacheStat.entries > rule.conditions.maxEntries) {
			return true;
		}

		return false;
	}

	private async immediateInvalidation(rule: InvalidationRule): Promise<{ items: number; space: number }> {
		const cacheName = rule.cacheName || 'parsify-dynamic-v1';
		const cache = await cacheManager.getCache(cacheName);
		const requests = await cache.keys();

		let items = 0;
		let space = 0;

		for (const request of requests) {
			const shouldDelete = typeof rule.pattern === 'string'
				? request.url.includes(rule.pattern)
				: rule.pattern.test(request.url);

			if (shouldDelete) {
				const response = await cache.match(request);
				if (response) {
					const text = await response.text();
					space += text.length;
				}
				await cache.delete(request);
				items++;
			}
		}

		return { items, space };
	}

	private async versionedInvalidation(rule: InvalidationRule): Promise<{ items: number; space: number }> {
		// Versioned invalidation creates a new cache version
		// and deletes the old one
		const timestamp = Date.now();
		const oldCacheName = rule.cacheName || 'parsify-dynamic-v1';
		const newCacheName = `${oldCacheName}-${timestamp}`;

		// This would typically involve creating a new cache
		// and updating references to use the new cache
		// For now, we'll just clear the old cache
		return this.immediateInvalidation(rule);
	}

	private async ttlInvalidation(rule: InvalidationRule): Promise<{ items: number; space: number }> {
		const cacheName = rule.cacheName || 'parsify-dynamic-v1';
		const cache = await cacheManager.getCache(cacheName);
		const requests = await cache.keys();

		let items = 0;
		let space = 0;
		const maxAge = rule.conditions?.maxAge || 24 * 60 * 60 * 1000;

		for (const request of requests) {
			const shouldDelete = typeof rule.pattern === 'string'
				? request.url.includes(rule.pattern)
				: rule.pattern.test(request.url);

			if (shouldDelete) {
				const response = await cache.match(request);
				if (response) {
					const cacheDate = response.headers.get('sw-cache-date');
					if (cacheDate) {
						const cachedTime = new Date(cacheDate).getTime();
						const age = Date.now() - cachedTime;

						if (age > maxAge) {
							const text = await response.text();
							space += text.length;
							await cache.delete(request);
							items++;
						}
					}
				}
			}
		}

		return { items, space };
	}

	private getNetworkConditions(): string[] {
		const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

		if (connection) {
			return [connection.effectiveType || 'unknown'];
		}

		return navigator.onLine ? ['wifi'] : ['offline'];
	}

	private shouldUpdate(strategy: UpdateStrategy, networkConditions: string[]): boolean {
		if (strategy.conditions.networkConditions) {
			const hasMatchingCondition = strategy.conditions.networkConditions.some(
				condition => networkConditions.includes(condition)
			);
			if (!hasMatchingCondition) return false;
		}

		if (strategy.conditions.batteryLevel) {
			const battery = (navigator as any).battery;
			if (battery && battery.level < strategy.conditions.batteryLevel) {
				return false;
			}
		}

		if (strategy.conditions.deviceMemory) {
			const memory = (navigator as any).deviceMemory;
			if (memory && memory < strategy.conditions.deviceMemory) {
				return false;
			}
		}

		return true;
	}

	private async executeUpdateStrategy(strategy: UpdateStrategy): Promise<void> {
		switch (strategy.strategy) {
			case 'stale-while-revalidate':
				await this.staleWhileRevalidateUpdate(strategy);
				break;
			case 'background-update':
				await this.backgroundUpdate(strategy);
				break;
			case 'on-demand':
				await this.onDemandUpdate(strategy);
				break;
		}
	}

	private async staleWhileRevalidateUpdate(strategy: UpdateStrategy): Promise<void> {
		// Implementation would fetch and cache updates while serving stale content
		// This is a simplified version
		const urls = this.getUrlsForCaches(strategy.cacheNames);

		for (const url of urls) {
			try {
				const request = new Request(url);
				const response = await fetch(request);
				if (response.ok) {
					await cacheManager.cacheResponse(request, response);
				}
			} catch (error) {
				console.warn(`Failed to update ${url}:`, error);
			}
		}
	}

	private async backgroundUpdate(strategy: UpdateStrategy): Promise<void> {
		// Implementation would update caches in background when conditions are favorable
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.ready;
			if (registration.sync) {
				await registration.sync.register('cache-update');
			}
		}
	}

	private async onDemandUpdate(strategy: UpdateStrategy): Promise<void> {
		// Implementation would update caches only when explicitly requested
		// This would typically be triggered by user action or specific events
	}

	private getUrlsForCaches(cacheNames: string[]): string[] {
		// This would return URLs that should be updated for each cache
		// For now, return some common URLs
		return [
			'/',
			'/tools',
			'/api/tools',
			'/api/categories',
		];
	}
}

// Export singleton instance
export const cacheInvalidationManager = CacheInvalidationManager.getInstance();

// Export types
export type { InvalidationRule, InvalidationResult, UpdateStrategy };

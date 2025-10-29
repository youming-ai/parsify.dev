/**
 * 动态导入管理器
 * 智能管理组件和资源的按需加载
 */

interface DynamicImportConfig {
	preload?: boolean;
	retryCount?: number;
	retryDelay?: number;
	timeout?: number;
	cacheKey?: string;
}

interface LoadedModule<T> {
	module: T;
	loadTime: number;
	timestamp: number;
}

class DynamicImportManager {
	private loadedModules = new Map<string, LoadedModule<unknown>>();
	private loadingPromises = new Map<string, Promise<unknown>>();
	private preloadedModules = new Set<string>();

	/**
	 * 动态导入模块
	 */
	async import<T>(importFn: () => Promise<T>, config: DynamicImportConfig = {}): Promise<T> {
		const { retryCount = 3, retryDelay = 1000, timeout = 10000, cacheKey } = config;

		const key = cacheKey || this.generateCacheKey(importFn.toString());

		// 检查缓存
		if (this.loadedModules.has(key)) {
			console.debug('Module loaded from cache', { moduleKey: key });
			return this.loadedModules.get(key)?.module as T;
		}

		// 检查是否正在加载
		if (this.loadingPromises.has(key)) {
			console.debug('Module loading in progress', { moduleKey: key });
			return this.loadingPromises.get(key) as Promise<T>;
		}

		// 开始加载
		const loadingPromise = this.loadModuleWithRetry<T>(importFn, retryCount, retryDelay, timeout, key);

		this.loadingPromises.set(key, loadingPromise);

		try {
			const module = await loadingPromise;
			this.loadedModules.set(key, {
				module,
				loadTime: Date.now(),
				timestamp: Date.now(),
			});
			this.loadingPromises.delete(key);

			console.log('Dynamic import loaded', Date.now(), {
				moduleKey: key,
				type: 'dynamic_import',
			});

			return module;
		} catch (error) {
			this.loadingPromises.delete(key);
			console.error('Dynamic import failed', error as Error, {
				moduleKey: key,
			});
			throw error;
		}
	}

	/**
	 * 带重试的模块加载
	 */
	private async loadModuleWithRetry<T>(
		importFn: () => Promise<T>,
		retryCount: number,
		retryDelay: number,
		timeout: number,
		moduleKey: string,
	): Promise<T> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= retryCount; attempt++) {
			try {
				const startTime = Date.now();

				// 添加超时控制
				const module = await Promise.race([
					importFn(),
					new Promise<never>((_, reject) => {
						setTimeout(() => reject(new Error(`Module load timeout after ${timeout}ms`)), timeout);
					}),
				]);

				const loadTime = Date.now() - startTime;
				console.debug('Module loaded successfully', {
					moduleKey,
					attempt,
					loadTime,
					type: 'module_load_success',
				});

				return module;
			} catch (error) {
				lastError = error as Error;
				console.warn('Module load failed, retrying', {
					moduleKey,
					attempt,
					error: error instanceof Error ? error.message : 'Unknown error',
					type: 'module_load_retry',
				});

				if (attempt < retryCount) {
					await this.delay(retryDelay * attempt); // 指数退避
				}
			}
		}

		throw lastError || new Error('Module load failed after all retries');
	}

	/**
	 * 预加载模块
	 */
	async preload<T>(importFn: () => Promise<T>, config: DynamicImportConfig = {}): Promise<void> {
		const key = config.cacheKey || this.generateCacheKey(importFn.toString());

		if (this.loadedModules.has(key) || this.loadingPromises.has(key)) {
			return; // 已经加载或正在加载
		}

		this.preloadedModules.add(key);

		try {
			await this.import(importFn, { ...config, cacheKey: key });
			console.debug('Module preloaded successfully', { moduleKey: key });
		} catch (error) {
			this.preloadedModules.delete(key);
			console.warn('Module preload failed', error as Error, { moduleKey: key });
		}
	}

	/**
	 * 批量预加载模块
	 */
	async preloadBatch(
		imports: Array<{
			importFn: () => Promise<any>;
			config?: DynamicImportConfig;
		}>,
	): Promise<void> {
		const preloadPromises = imports.map(({ importFn, config }) =>
			this.preload(importFn, config).catch((error) => {
				console.warn('Batch preload item failed', error as Error);
			}),
		);

		await Promise.allSettled(preloadPromises);
		console.info('Batch preload completed', { count: imports.length });
	}

	/**
	 * 清理缓存
	 */
	clearCache(maxAge = 3600000): void {
		// 默认1小时
		const now = Date.now();
		const keysToDelete: string[] = [];

		for (const [key, loadedModule] of this.loadedModules) {
			if (now - loadedModule.timestamp > maxAge) {
				keysToDelete.push(key);
			}
		}

		keysToDelete.forEach((key) => {
			this.loadedModules.delete(key);
		});

		if (keysToDelete.length > 0) {
			console.debug('Cache cleaned up', {
				deletedCount: keysToDelete.length,
				remainingCount: this.loadedModules.size,
			});
		}
	}

	/**
	 * 获取缓存统计
	 */
	getCacheStats() {
		return {
			loadedModulesCount: this.loadedModules.size,
			loadingPromisesCount: this.loadingPromises.size,
			preloadedModulesCount: this.preloadedModules.size,
			totalLoadedModules: this.loadedModules.size + this.loadingPromises.size,
		};
	}

	/**
	 * 检查模块是否已加载
	 */
	isLoaded(cacheKey: string): boolean {
		return this.loadedModules.has(cacheKey);
	}

	/**
	 * 获取已加载的模块
	 */
	getLoadedModule<T>(cacheKey: string): T | undefined {
		return this.loadedModules.get(cacheKey)?.module as T | undefined;
	}

	/**
	 * 智能预加载策略
	 */
	async intelligentPreload(): Promise<void> {
		// 根据用户行为预加载相关模块
		if (typeof window !== 'undefined') {
			// 监听用户交互
			const interactionPreload = () => {
				this.preloadCommonComponents();
			};

			// 监听网络状态
			if ('connection' in navigator) {
				const connection = (navigator as any).connection;
				if (connection && connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g') {
					this.preloadCommonComponents();
				}
			}

			// 延迟预加载
			setTimeout(interactionPreload, 3000);
		}
	}

	/**
	 * 预加载常用组件
	 */
	private async preloadCommonComponents(): Promise<void> {
		const commonImports = [
			{
				importFn: () => import('@/components/tools/json/json-formatter'),
				config: { cacheKey: 'json-formatter' },
			},
			{
				importFn: () => import('@/components/tools/code/code-formatter'),
				config: { cacheKey: 'code-formatter' },
			},
			{
				importFn: () => import('@/components/file-upload/file-upload-component'),
				config: { cacheKey: 'file-upload' },
			},
		];

		await this.preloadBatch(commonImports);
	}

	/**
	 * 生成缓存键
	 */
	private generateCacheKey(importFnStr: string): string {
		return btoa(importFnStr).substring(0, 16);
	}

	/**
	 * 延迟函数
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// 创建全局实例
export const dynamicImportManager = new DynamicImportManager();

// 便捷函数
export const dynamicImport = <T>(importFn: () => Promise<T>, config?: DynamicImportConfig) =>
	dynamicImportManager.import(importFn, config);

export const preloadModule = <T>(importFn: () => Promise<T>, config?: DynamicImportConfig) =>
	dynamicImportManager.preload(importFn, config);

// 预定义的导入配置
export const COMMON_IMPORTS = {
	JSON_FORMATTER: () => import('@/components/tools/json/json-formatter'),
	JSON_VALIDATOR: () => import('@/components/tools/json/json-validator'),
	CODE_FORMATTER: () => import('@/components/tools/code/code-formatter'),
	CODE_EXECUTOR: () => import('@/components/tools/code/code-execution'),
	FILE_UPLOAD: () => import('@/components/file-upload/file-upload-component'),
	USER_PROFILE: () => import('@/components/auth/user-profile'),
	AUTH_LOGIN: () => import('@/app/auth/login/page'),
	AUTH_SIGNUP: () => import('@/app/auth/signup/page'),
} as const;

// 启动智能预加载
if (typeof window !== 'undefined') {
	dynamicImportManager.intelligentPreload();
}

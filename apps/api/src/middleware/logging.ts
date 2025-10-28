import type { Context, Next } from 'hono';
import type { CloudflareService } from '../services/cloudflare';
import type { AuthContext } from './auth';

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry interface
export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	requestId: string;
	correlationId?: string;
	method: string;
	url: string;
	statusCode?: number;
	responseTime?: number;
	requestSize?: number;
	responseSize?: number;
	userAgent?: string;
	ipAddress?: string;
	userId?: string;
	sessionId?: string;
	subscriptionTier?: string;
	endpoint?: string;
	error?: {
		name: string;
		message: string;
		code?: string;
		stack?: string;
	};
	metadata?: Record<string, any>;
	performance?: {
		cpuTime?: number;
		memoryUsage?: number;
		cacheHits?: number;
		cacheMisses?: number;
	};
	analytics?: {
		eventCategory?: string;
		eventAction?: string;
		customDimensions?: Record<string, string>;
		customMetrics?: Record<string, number>;
	};
}

// Logging middleware options
export interface LoggingMiddlewareOptions {
	logLevel?: LogLevel;
	enablePerformanceMetrics?: boolean;
	enableAnalyticsTracking?: boolean;
	enableUserContext?: boolean;
	enableCorrelationIds?: boolean;
	sensitiveFields?: string[];
	excludePaths?: string[];
	includeHeaders?: string[];
	sanitizeRequestBody?: boolean;
	sanitizeResponseBody?: boolean;
	maxRequestSize?: number;
	maxResponseSize?: number;
	customLogger?: (entry: LogEntry) => void;
	analyticsEndpoint?: string;
	enableStructuredLogging?: boolean;
	logFormat?: 'json' | 'text';
}

// Default sensitive fields to filter
const DEFAULT_SENSITIVE_FIELDS = [
	'password',
	'token',
	'secret',
	'key',
	'auth',
	'authorization',
	'cookie',
	'session',
	'credential',
	'private',
	'confidential',
];

// Default paths to exclude from detailed logging
const DEFAULT_EXCLUDE_PATHS = [
	'/health',
	'/metrics',
	'/favicon.ico',
	'/robots.txt',
];

/**
 * Request logging middleware for Hono
 * Provides comprehensive request/response logging with performance metrics,
 * user context tracking, and analytics integration
 */
export const loggingMiddleware = (options: LoggingMiddlewareOptions = {}) => {
	const {
		logLevel = 'info',
		enablePerformanceMetrics = true,
		enableAnalyticsTracking = true,
		enableUserContext = true,
		enableCorrelationIds = true,
		sensitiveFields = DEFAULT_SENSITIVE_FIELDS,
		excludePaths = DEFAULT_EXCLUDE_PATHS,
		includeHeaders = [],
		sanitizeRequestBody = true,
		sanitizeResponseBody = true,
		maxRequestSize = 1024 * 1024, // 1MB
		maxResponseSize = 1024 * 1024, // 1MB
		customLogger,
		analyticsEndpoint,
		enableStructuredLogging = true,
		logFormat = 'json',
	} = options;

	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		const startTime = Date.now();
		const requestId = c.get('requestId') || generateRequestId();
		const correlationId = enableCorrelationIds
			? generateCorrelationId()
			: undefined;

		// Get request details
		const method = c.req.method;
		const url = c.req.url;
		const userAgent = c.req.header('User-Agent');
		const ipAddress =
			c.req.header('CF-Connecting-IP') ||
			c.req.header('X-Forwarded-For') ||
			c.req.header('X-Real-IP') ||
			'unknown';

		// Get user context if available
		let userContext: AuthContext | undefined;
		let userId: string | undefined;
		let sessionId: string | undefined;
		let subscriptionTier: string | undefined;

		if (enableUserContext) {
			userContext = c.get('auth') as AuthContext;
			if (userContext) {
				userId = userContext.user?.id;
				sessionId = userContext.sessionId;
				subscriptionTier = userContext.user?.subscription_tier;
			}
		}

		// Initialize log entry
		const logEntry: LogEntry = {
			timestamp: new Date().toISOString(),
			level: logLevel,
			requestId,
			correlationId,
			method,
			url,
			userAgent,
			ipAddress,
			userId,
			sessionId,
			subscriptionTier,
			endpoint: c.req.path,
		};

		// Get request headers if specified
		if (includeHeaders.length > 0) {
			const headers: Record<string, string> = {};
			includeHeaders.forEach((headerName) => {
				const value = c.req.header(headerName);
				if (value) {
					headers[headerName] = sanitizeSensitiveData(value, sensitiveFields);
				}
			});
			if (Object.keys(headers).length > 0) {
				logEntry.metadata = { ...logEntry.metadata, headers };
			}
		}

		// Get request size and content
		let requestSize = 0;
		let requestBody: any = null;

		try {
			const contentLength = c.req.header('Content-Length');
			if (contentLength) {
				requestSize = Number.parseInt(contentLength, 10);
			}

			// Only read request body if it's within limits and we want to log it
			if (requestSize <= maxRequestSize && logLevel === 'debug') {
				const contentType = c.req.header('Content-Type') || '';
				if (contentType.includes('application/json')) {
					try {
						const body = await c.req.json();
						requestBody = sanitizeRequestBody
							? sanitizeSensitiveData(body, sensitiveFields)
							: body;
					} catch {
						// Failed to parse JSON, ignore
					}
				}
			}
		} catch (_error) {
			// Failed to read request body, continue without it
		}

		logEntry.requestSize = requestSize;
		if (requestBody && logLevel === 'debug') {
			logEntry.metadata = { ...logEntry.metadata, requestBody };
		}

		// Store original response methods to capture response data
		const originalJson = c.json.bind(c);
		const originalText = c.text.bind(c);
		const originalBlob = c.blob.bind(c);
		let responseSize = 0;
		let responseStatus = 200;
		let responseData: any = null;

		// Override response methods to capture response data
		c.json = (data: any, status?: number, headers?: Record<string, string>) => {
			responseStatus = status || 200;
			responseData = sanitizeResponseBody
				? sanitizeSensitiveData(data, sensitiveFields)
				: data;

			const jsonString = JSON.stringify(data);
			responseSize = new Blob([jsonString]).size;

			if (headers) {
				Object.entries(headers).forEach(([key, value]) => {
					c.header(key, value);
				});
			}

			return originalJson(data, status, headers);
		};

		c.text = (
			text: string,
			status?: number,
			headers?: Record<string, string>
		) => {
			responseStatus = status || 200;
			responseData = text;
			responseSize = new Blob([text]).size;

			if (headers) {
				Object.entries(headers).forEach(([key, value]) => {
					c.header(key, value);
				});
			}

			return originalText(text, status, headers);
		};

		c.blob = (
			blob: Blob,
			status?: number,
			headers?: Record<string, string>
		) => {
			responseStatus = status || 200;
			responseSize = blob.size;

			if (headers) {
				Object.entries(headers).forEach(([key, value]) => {
					c.header(key, value);
				});
			}

			return originalBlob(blob, status, headers);
		};

		// Performance metrics collection
		let performanceMetrics: any = null;
		if (enablePerformanceMetrics) {
			const startMemory = getMemoryUsage();
			const startCpuTime = getCpuTime();

			try {
				await next();
			} finally {
				const endMemory = getMemoryUsage();
				const endCpuTime = getCpuTime();

				performanceMetrics = {
					memoryUsage: endMemory - startMemory,
					cpuTime: endCpuTime - startCpuTime,
				};

				// Add cache performance if available
				const cloudflare = c.get('cloudflare') as CloudflareService;
				if (cloudflare) {
					const metrics = cloudflare.getMetrics();
					performanceMetrics.cacheHits = metrics.kv.cache?.operationsCount || 0;
					performanceMetrics.cacheMisses = metrics.kv.cache?.errorCount || 0;
				}

				logEntry.performance = performanceMetrics;
			}
		} else {
			await next();
		}

		// Calculate response time
		const responseTime = Date.now() - startTime;
		logEntry.responseTime = responseTime;
		logEntry.statusCode = responseStatus;
		logEntry.responseSize = responseSize;

		// Add response data for debug level
		if (
			responseData &&
			logLevel === 'debug' &&
			responseSize <= maxResponseSize
		) {
			logEntry.metadata = {
				...logEntry.metadata,
				responseBody: responseData,
			};
		}

		// Determine log level based on status code
		if (responseStatus >= 500) {
			logEntry.level = 'error';
		} else if (responseStatus >= 400) {
			logEntry.level = 'warn';
		} else if (responseStatus >= 300) {
			logEntry.level = 'info';
		}

		// Check if this path should be excluded from detailed logging
		const shouldExcludePath = excludePaths.some((path) =>
			c.req.path.startsWith(path)
		);

		// Log the request
		if (!shouldExcludePath || logEntry.level === 'error') {
			await logRequest(c, logEntry, {
				customLogger,
				enableStructuredLogging,
				logFormat,
				enableAnalyticsTracking,
				analyticsEndpoint,
			});
		}

		// Store analytics data
		if (enableAnalyticsTracking && !shouldExcludePath) {
			await storeAnalyticsData(c, logEntry);
		}
	};
};

/**
 * Log the request using the specified logger
 */
async function logRequest(
	c: Context<{ Bindings: Env }>,
	logEntry: LogEntry,
	options: {
		customLogger?: (entry: LogEntry) => void;
		enableStructuredLogging: boolean;
		logFormat: 'json' | 'text';
		enableAnalyticsTracking: boolean;
		analyticsEndpoint?: string;
	}
): Promise<void> {
	const {
		customLogger,
		enableStructuredLogging,
		logFormat,
		enableAnalyticsTracking,
		analyticsEndpoint,
	} = options;

	try {
		// Use custom logger if provided
		if (customLogger) {
			customLogger(logEntry);
			return;
		}

		// Log to console based on level and format
		if (enableStructuredLogging && logFormat === 'json') {
			console.log(JSON.stringify(logEntry));
		} else if (logFormat === 'text') {
			const textMessage = formatLogEntryAsText(logEntry);
			console.log(textMessage);
		}

		// Store in Cloudflare analytics if available
		const cloudflare = c.get('cloudflare') as CloudflareService;
		if (cloudflare && enableAnalyticsTracking) {
			const analyticsKey = `request_log:${logEntry.requestId}`;
			await cloudflare.cacheSet('analytics', analyticsKey, logEntry, {
				ttl: 86400, // 24 hours
			});

			// Store aggregated metrics
			await updateRequestMetrics(cloudflare, logEntry);
		}
	} catch (error) {
		console.error('Failed to log request:', error);
	}
}

/**
 * Store analytics data for monitoring and analysis
 */
async function storeAnalyticsData(
	c: Context<{ Bindings: Env }>,
	logEntry: LogEntry
): Promise<void> {
	try {
		const cloudflare = c.get('cloudflare') as CloudflareService;
		if (!cloudflare) return;

		// Create analytics event
		const analyticsEvent = {
			eventCategory: 'api_request',
			eventAction: `${logEntry.method} ${logEntry.endpoint}`,
			eventLabel: logEntry.statusCode?.toString(),
			value: logEntry.responseTime,
			customDimensions: {
				userId: logEntry.userId,
				sessionId: logEntry.sessionId,
				subscriptionTier: logEntry.subscriptionTier,
				userAgent: logEntry.userAgent,
				ipAddress: logEntry.ipAddress,
				method: logEntry.method,
				endpoint: logEntry.endpoint,
				statusCode: logEntry.statusCode?.toString(),
			},
			customMetrics: {
				responseTime: logEntry.responseTime || 0,
				requestSize: logEntry.requestSize || 0,
				responseSize: logEntry.responseSize || 0,
				memoryUsage: logEntry.performance?.memoryUsage || 0,
				cpuTime: logEntry.performance?.cpuTime || 0,
			},
			timestamp: logEntry.timestamp,
			requestId: logEntry.requestId,
			correlationId: logEntry.correlationId,
		};

		// Store analytics event
		const eventKey = `analytics_event:${logEntry.requestId}`;
		await cloudflare.cacheSet('analytics', eventKey, analyticsEvent, {
			ttl: 86400 * 7, // 7 days for analytics
		});

		// Update aggregated analytics
		await updateAggregatedAnalytics(cloudflare, analyticsEvent);
	} catch (error) {
		console.error('Failed to store analytics data:', error);
	}
}

/**
 * Update request metrics in the analytics store
 */
async function updateRequestMetrics(
	cloudflare: CloudflareService,
	logEntry: LogEntry
): Promise<void> {
	try {
		const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		const hour = new Date().getHours();

		// Update daily metrics
		const dailyKey = `metrics:daily:${date}`;
		const dailyMetrics = (await cloudflare.cacheGet<any>(
			'analytics',
			dailyKey
		)) || {
			totalRequests: 0,
			totalResponseTime: 0,
			errors: 0,
			requestsByHour: {},
			requestsByStatus: {},
			requestsByEndpoint: {},
			requestsByUser: {},
			topEndpoints: {},
		};

		dailyMetrics.totalRequests++;
		dailyMetrics.totalResponseTime += logEntry.responseTime || 0;

		if (logEntry.statusCode && logEntry.statusCode >= 400) {
			dailyMetrics.errors++;
		}

		// Hourly distribution
		dailyMetrics.requestsByHour[hour] =
			(dailyMetrics.requestsByHour[hour] || 0) + 1;

		// Status code distribution
		const statusCode = logEntry.statusCode || 0;
		dailyMetrics.requestsByStatus[statusCode] =
			(dailyMetrics.requestsByStatus[statusCode] || 0) + 1;

		// Endpoint distribution
		const endpoint = logEntry.endpoint || 'unknown';
		dailyMetrics.requestsByEndpoint[endpoint] =
			(dailyMetrics.requestsByEndpoint[endpoint] || 0) + 1;

		// User distribution
		if (logEntry.userId) {
			dailyMetrics.requestsByUser[logEntry.userId] =
				(dailyMetrics.requestsByUser[logEntry.userId] || 0) + 1;
		}

		// Update top endpoints
		if (
			!dailyMetrics.topEndpoints[endpoint] ||
			dailyMetrics.topEndpoints[endpoint].count <
				dailyMetrics.requestsByEndpoint[endpoint]
		) {
			dailyMetrics.topEndpoints[endpoint] = {
				count: dailyMetrics.requestsByEndpoint[endpoint],
				avgResponseTime:
					(dailyMetrics.topEndpoints[endpoint]?.avgResponseTime || 0) +
					(logEntry.responseTime || 0) / 2,
			};
		}

		await cloudflare.cacheSet('analytics', dailyKey, dailyMetrics, {
			ttl: 86400 * 30, // Keep for 30 days
		});
	} catch (error) {
		console.error('Failed to update request metrics:', error);
	}
}

/**
 * Update aggregated analytics data
 */
async function updateAggregatedAnalytics(
	cloudflare: CloudflareService,
	event: any
): Promise<void> {
	try {
		const date = new Date().toISOString().split('T')[0];

		// Update performance metrics
		const perfKey = `performance:${date}`;
		const perfMetrics = (await cloudflare.cacheGet<any>(
			'analytics',
			perfKey
		)) || {
			avgResponseTime: 0,
			totalRequests: 0,
			slowRequests: 0,
			fastRequests: 0,
			errors: 0,
			memoryUsage: [],
		};

		perfMetrics.totalRequests++;
		perfMetrics.avgResponseTime =
			(perfMetrics.avgResponseTime * (perfMetrics.totalRequests - 1) +
				event.value) /
			perfMetrics.totalRequests;

		if (event.value > 1000) {
			// Slow requests > 1s
			perfMetrics.slowRequests++;
		} else if (event.value < 100) {
			// Fast requests < 100ms
			perfMetrics.fastRequests++;
		}

		if (Number.parseInt(event.customDimensions.statusCode || '0', 10) >= 400) {
			perfMetrics.errors++;
		}

		if (event.customMetrics.memoryUsage) {
			perfMetrics.memoryUsage.push(event.customMetrics.memoryUsage);
			// Keep only last 1000 samples
			if (perfMetrics.memoryUsage.length > 1000) {
				perfMetrics.memoryUsage = perfMetrics.memoryUsage.slice(-1000);
			}
		}

		await cloudflare.cacheSet('analytics', perfKey, perfMetrics, {
			ttl: 86400 * 30,
		});
	} catch (error) {
		console.error('Failed to update aggregated analytics:', error);
	}
}

/**
 * Sanitize sensitive data from objects
 */
function sanitizeSensitiveData(data: any, sensitiveFields: string[]): any {
	if (!data || typeof data !== 'object') {
		return data;
	}

	if (Array.isArray(data)) {
		return data.map((item) => sanitizeSensitiveData(item, sensitiveFields));
	}

	const sanitized: any = {};

	Object.keys(data).forEach((key) => {
		const lowerKey = key.toLowerCase();

		if (
			sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))
		) {
			sanitized[key] = '[REDACTED]';
		} else if (typeof data[key] === 'object' && data[key] !== null) {
			sanitized[key] = sanitizeSensitiveData(data[key], sensitiveFields);
		} else {
			sanitized[key] = data[key];
		}
	});

	return sanitized;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
	return crypto.randomUUID();
}

/**
 * Generate a correlation ID for tracking related requests
 */
function generateCorrelationId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return `${timestamp}-${random}`;
}

/**
 * Get current memory usage in bytes
 */
function getMemoryUsage(): number {
	if (typeof performance !== 'undefined' && performance.memory) {
		return performance.memory.usedJSHeapSize;
	}
	return 0;
}

/**
 * Get current CPU time in milliseconds
 */
function getCpuTime(): number {
	if (typeof performance !== 'undefined') {
		return performance.now();
	}
	return Date.now();
}

/**
 * Format log entry as text for console output
 */
function formatLogEntryAsText(logEntry: LogEntry): string {
	const {
		timestamp,
		level,
		requestId,
		correlationId,
		method,
		url,
		statusCode,
		responseTime,
		userId,
		endpoint,
	} = logEntry;

	const statusEmoji = statusCode && statusCode >= 400 ? '❌' : '✅';
	const userStr = userId ? ` [user:${userId}]` : '';
	const correlationStr = correlationId ? ` [corr:${correlationId}]` : '';

	return `${statusEmoji} ${timestamp} [${level.toUpperCase()}] ${method} ${endpoint} ${statusCode} (${responseTime}ms) [req:${requestId}]${userStr}${correlationStr}`;
}

/**
 * Middleware factory for different log levels
 */
export const createDebugLogger = (
	options?: Partial<LoggingMiddlewareOptions>
) => loggingMiddleware({ ...options, logLevel: 'debug' });

export const createInfoLogger = (options?: Partial<LoggingMiddlewareOptions>) =>
	loggingMiddleware({ ...options, logLevel: 'info' });

export const createWarnLogger = (options?: Partial<LoggingMiddlewareOptions>) =>
	loggingMiddleware({ ...options, logLevel: 'warn' });

export const createErrorLogger = (
	options?: Partial<LoggingMiddlewareOptions>
) => loggingMiddleware({ ...options, logLevel: 'error' });

/**
 * Middleware for API-only logging (excludes health checks and metrics)
 */
export const createApiLogger = (options?: Partial<LoggingMiddlewareOptions>) =>
	loggingMiddleware({
		...options,
		excludePaths: [
			...DEFAULT_EXCLUDE_PATHS,
			'/health',
			'/metrics',
			'/admin',
			'/favicon.ico',
			'/robots.txt',
		],
		enableAnalyticsTracking: true,
		enablePerformanceMetrics: true,
	});

/**
 * Middleware for development logging with full request/response bodies
 */
export const createDevelopmentLogger = (
	options?: Partial<LoggingMiddlewareOptions>
) =>
	loggingMiddleware({
		...options,
		logLevel: 'debug',
		enableStructuredLogging: true,
		logFormat: 'json',
		maxRequestSize: 10 * 1024 * 1024, // 10MB
		maxResponseSize: 10 * 1024 * 1024, // 10MB
		includeHeaders: [
			'Content-Type',
			'Authorization',
			'X-Request-ID',
			'User-Agent',
		],
	});

/**
 * Middleware for production logging with optimized performance
 */
export const createProductionLogger = (
	options?: Partial<LoggingMiddlewareOptions>
) =>
	loggingMiddleware({
		...options,
		logLevel: 'info',
		enableStructuredLogging: true,
		logFormat: 'json',
		enablePerformanceMetrics: true,
		enableAnalyticsTracking: true,
		excludePaths: [
			...DEFAULT_EXCLUDE_PATHS,
			'/health',
			'/metrics',
			'/favicon.ico',
			'/robots.txt',
		],
		sanitizeRequestBody: true,
		sanitizeResponseBody: true,
		maxRequestSize: 1024 * 1024, // 1MB
		maxResponseSize: 1024 * 1024, // 1MB
	});

/**
 * Utility function to log custom events
 */
export const logCustomEvent = async (
	c: Context<{ Bindings: Env }>,
	event: string,
	data: Record<string, any>,
	level: LogLevel = 'info'
): Promise<void> => {
	try {
		const cloudflare = c.get('cloudflare') as CloudflareService;
		const requestId = c.get('requestId');
		const auth = c.get('auth') as AuthContext;

		const logEntry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			requestId,
			method: 'CUSTOM',
			url: event,
			userId: auth?.user?.id,
			sessionId: auth?.sessionId,
			subscriptionTier: auth?.user?.subscription_tier,
			endpoint: event,
			metadata: data,
			analytics: {
				eventCategory: 'custom_event',
				eventAction: event,
				customDimensions: {
					userId: auth?.user?.id,
					sessionId: auth?.sessionId,
				},
			},
		};

		// Store the custom event
		if (cloudflare) {
			const eventKey = `custom_event:${requestId}:${Date.now()}`;
			await cloudflare.cacheSet('analytics', eventKey, logEntry, {
				ttl: 86400 * 7, // 7 days
			});
		}

		console.log(JSON.stringify(logEntry));
	} catch (error) {
		console.error('Failed to log custom event:', error);
	}
};

export default loggingMiddleware;

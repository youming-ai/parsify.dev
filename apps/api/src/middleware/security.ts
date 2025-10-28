import type { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import type { CloudflareService } from '../services/cloudflare';
import type { AuthContext } from './auth';

// Security configuration interface
export interface SecurityConfig {
	// CORS configuration
	cors?: {
		origin: string | string[] | boolean;
		allowMethods?: string[];
		allowHeaders?: string[];
		exposeHeaders?: string[];
		credentials?: boolean;
		maxAge?: number;
		optionsSuccessStatus?: number;
	};

	// Content Security Policy configuration
	csp?: {
		defaultSrc?: string[];
		scriptSrc?: string[];
		styleSrc?: string[];
		imgSrc?: string[];
		connectSrc?: string[];
		fontSrc?: string[];
		objectSrc?: string[];
		mediaSrc?: string[];
		frameSrc?: string[];
		childSrc?: string[];
		workerSrc?: string[];
		manifestSrc?: string[];
		upgradeInsecureRequests?: boolean;
		blockAllMixedContent?: boolean;
		reportUri?: string;
		reportOnly?: boolean;
	};

	// Security headers
	security?: {
		// Strict Transport Security
		hsts?: {
			enabled: boolean;
			maxAge: number;
			includeSubDomains: boolean;
			preload: boolean;
		};

		// Frame protection
		frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
		frameOptionsAllowFrom?: string;

		// Content type options
		contentTypeOptions?: boolean;

		// XSS protection
		xssProtection?: boolean;

		// Referrer policy
		referrerPolicy?:
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url';

		// Permissions policy
		permissionsPolicy?: Record<string, string[]>;

		// Custom headers
		customHeaders?: Record<string, string>;
	};

	// Rate limiting headers
	rateLimitHeaders?: {
		enabled: boolean;
		hideLimit?: boolean;
		hideRemaining?: boolean;
		hideReset?: boolean;
	};

	// Environment-specific settings
	environments?: {
		development?: Partial<SecurityConfig>;
		staging?: Partial<SecurityConfig>;
		production?: Partial<SecurityConfig>;
	};

	// Path-specific configurations
	paths?: Record<string, Partial<SecurityConfig>>;

	// Skip security for certain paths
	skipPaths?: string[];

	// Custom security validation
	customValidation?: (c: Context) => boolean | Promise<boolean>;

	// Security logging
	enableLogging?: boolean;
	logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// Security violation interface
export interface SecurityViolation {
	type:
		| 'cors'
		| 'csp'
		| 'missing_header'
		| 'invalid_header'
		| 'rate_limit'
		| 'custom';
	message: string;
	path: string;
	method: string;
	origin?: string;
	userAgent?: string;
	ip?: string;
	timestamp: Date;
	requestId?: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

// Default security configurations
const DEFAULT_CORS = {
	origin: false, // Disabled by default, must be explicitly enabled
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowHeaders: [
		'Content-Type',
		'Authorization',
		'X-Requested-With',
		'X-Request-ID',
		'Accept',
		'Origin',
		'User-Agent',
		'DNT',
		'Cache-Control',
		'Pragma',
	],
	exposeHeaders: [
		'X-Total-Count',
		'X-Rate-Limit-Limit',
		'X-Rate-Limit-Remaining',
		'X-Rate-Limit-Reset',
		'X-Request-ID',
		'Content-Length',
	],
	credentials: false,
	maxAge: 86400, // 24 hours
	optionsSuccessStatus: 204,
};

const DEFAULT_CSP = {
	defaultSrc: ["'self'"],
	scriptSrc: ["'self'", "'unsafe-inline'"],
	styleSrc: ["'self'", "'unsafe-inline'"],
	imgSrc: ["'self'", 'data:', 'https:'],
	connectSrc: ["'self'"],
	fontSrc: ["'self'", 'data:'],
	objectSrc: ["'none'"],
	mediaSrc: ["'self'"],
	frameSrc: ["'none'"],
	childSrc: ["'none'"],
	workerSrc: ["'self'"],
	manifestSrc: ["'self'"],
	upgradeInsecureRequests: false,
	blockAllMixedContent: false,
	reportOnly: false,
};

const DEFAULT_SECURITY = {
	hsts: {
		enabled: false, // Disabled by default, enable only with HTTPS
		maxAge: 31536000, // 1 year
		includeSubDomains: true,
		preload: false,
	},
	frameOptions: 'SAMEORIGIN',
	contentTypeOptions: true,
	xssProtection: true,
	referrerPolicy: 'strict-origin-when-cross-origin',
	permissionsPolicy: {},
	customHeaders: {},
};

const DEFAULT_RATE_LIMIT_HEADERS = {
	enabled: true,
	hideLimit: false,
	hideRemaining: false,
	hideReset: false,
};

/**
 * Security middleware for Hono with comprehensive CORS, CSP, and security headers
 * Integrates with Cloudflare Workers and follows security best practices
 */
export const securityMiddleware = (config: SecurityConfig = {}) => {
	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		const environment = c.env.ENVIRONMENT || 'development';
		const requestId = c.get('requestId');
		const clientIP =
			c.req.header('CF-Connecting-IP') ||
			c.req.header('X-Forwarded-For') ||
			'unknown';

		// Merge default config with environment-specific config
		const mergedConfig = mergeSecurityConfig(config, environment);

		// Skip security for specified paths
		if (mergedConfig.skipPaths?.some((path) => c.req.path.startsWith(path))) {
			await next();
			return;
		}

		// Get path-specific configuration
		const pathConfig = getPathSpecificConfig(mergedConfig, c.req.path);

		// Validate origin if CORS is configured
		if (pathConfig.cors) {
			const originValidation = await validateOrigin(
				c,
				pathConfig.cors,
				requestId,
				clientIP
			);
			if (!originValidation.valid) {
				await logSecurityViolation(
					c,
					{
						type: 'cors',
						message: originValidation.message || 'Invalid origin',
						path: c.req.path,
						method: c.req.method,
						origin: c.req.header('Origin'),
						userAgent: c.req.header('User-Agent'),
						ip: clientIP,
						timestamp: new Date(),
						requestId,
						severity: 'medium',
					},
					mergedConfig
				);

				return c.json(
					{
						error: 'CORS Error',
						message: 'Origin not allowed',
						requestId,
					},
					403
				);
			}
		}

		// Apply custom validation if configured
		if (pathConfig.customValidation) {
			const isValid = await pathConfig.customValidation(c);
			if (!isValid) {
				await logSecurityViolation(
					c,
					{
						type: 'custom',
						message: 'Custom security validation failed',
						path: c.req.path,
						method: c.req.method,
						origin: c.req.header('Origin'),
						userAgent: c.req.header('User-Agent'),
						ip: clientIP,
						timestamp: new Date(),
						requestId,
						severity: 'high',
					},
					mergedConfig
				);

				return c.json(
					{
						error: 'Security Violation',
						message: 'Request blocked by security policy',
						requestId,
					},
					403
				);
			}
		}

		// Apply CORS middleware if configured
		if (pathConfig.cors) {
			const corsMiddleware = cors(pathConfig.cors);
			await corsMiddleware(c, async () => {});
		}

		// Apply security headers
		await applySecurityHeaders(c, pathConfig);

		// Apply CSP headers
		await applyCSPHeaders(c, pathConfig);

		// Apply rate limiting headers
		await applyRateLimitHeaders(c, pathConfig);

		// Apply custom headers
		if (pathConfig.security?.customHeaders) {
			for (const [header, value] of Object.entries(
				pathConfig.security.customHeaders
			)) {
				c.header(header, value);
			}
		}

		await next();
	};
};

/**
 * Merge security configurations with defaults and environment-specific overrides
 */
function mergeSecurityConfig(
	config: SecurityConfig,
	environment: string
): SecurityConfig {
	const baseConfig: SecurityConfig = {
		cors: { ...DEFAULT_CORS },
		csp: { ...DEFAULT_CSP },
		security: { ...DEFAULT_SECURITY },
		rateLimitHeaders: { ...DEFAULT_RATE_LIMIT_HEADERS },
		environments: {},
		paths: {},
		skipPaths: [],
		enableLogging: true,
		logLevel: 'warn',
	};

	// Apply environment-specific overrides
	const envConfig = config.environments?.[environment] || {};
	const merged = deepMerge(baseConfig, config);
	return deepMerge(merged, envConfig);
}

/**
 * Get path-specific security configuration
 */
function getPathSpecificConfig(
	config: SecurityConfig,
	path: string
): SecurityConfig {
	for (const [pathPattern, pathConfig] of Object.entries(config.paths || {})) {
		if (path.startsWith(pathPattern)) {
			return deepMerge(config, pathConfig);
		}
	}
	return config;
}

/**
 * Deep merge objects
 */
function deepMerge<T extends Record<string, any>>(
	target: T,
	source: Partial<T>
): T {
	const result = { ...target };
	for (const key in source) {
		if (source[key] !== undefined) {
			if (
				source[key] !== null &&
				typeof source[key] === 'object' &&
				!Array.isArray(source[key]) &&
				source[key].constructor === Object
			) {
				result[key] = deepMerge(result[key] || {}, source[key] as any);
			} else {
				result[key] = source[key] as any;
			}
		}
	}
	return result;
}

/**
 * Validate request origin based on CORS configuration
 */
async function validateOrigin(
	c: Context,
	corsConfig: SecurityConfig['cors'],
	_requestId: string,
	_clientIP: string
): Promise<{ valid: boolean; message?: string }> {
	if (!corsConfig) return { valid: true };

	const origin = c.req.header('Origin');
	const allowedOrigin = corsConfig.origin;

	// If origin is not set in request, allow it (not a cross-origin request)
	if (!origin) {
		return { valid: true };
	}

	// Handle different origin configurations
	if (typeof allowedOrigin === 'boolean') {
		return { valid: allowedOrigin };
	}

	if (typeof allowedOrigin === 'string') {
		if (allowedOrigin === '*') {
			return { valid: true };
		}
		return {
			valid: origin === allowedOrigin,
			message: `Origin ${origin} not allowed`,
		};
	}

	if (Array.isArray(allowedOrigin)) {
		const isValid = allowedOrigin.some((allowed) => {
			if (allowed === '*') return true;
			if (allowed === origin) return true;

			// Support wildcard patterns
			const pattern = allowed.replace(/\*/g, '.*');
			const regex = new RegExp(`^${pattern}$`);
			return regex.test(origin);
		});

		return {
			valid: isValid,
			message: isValid ? undefined : `Origin ${origin} not in allowed list`,
		};
	}

	// Function-based origin validation
	if (typeof allowedOrigin === 'function') {
		try {
			const result = await allowedOrigin(origin, c);
			return {
				valid: result,
				message: result
					? undefined
					: `Origin ${origin} rejected by validation function`,
			};
		} catch (error) {
			console.error('Origin validation function error:', error);
			return { valid: false, message: 'Origin validation failed' };
		}
	}

	return { valid: false, message: 'Invalid origin configuration' };
}

/**
 * Apply security headers to response
 */
async function applySecurityHeaders(
	c: Context,
	config: SecurityConfig
): Promise<void> {
	const security = config.security;
	if (!security) return;

	// HSTS header (only apply if HTTPS is detected)
	if (security.hsts?.enabled && isSecureRequest(c)) {
		const hstsParts = [`max-age=${security.hsts.maxAge}`];

		if (security.hsts.includeSubDomains) {
			hstsParts.push('includeSubDomains');
		}

		if (security.hsts.preload) {
			hstsParts.push('preload');
		}

		c.header('Strict-Transport-Security', hstsParts.join('; '));
	}

	// Frame protection headers
	if (security.frameOptions) {
		if (
			security.frameOptions === 'ALLOW-FROM' &&
			security.frameOptionsAllowFrom
		) {
			c.header(
				'X-Frame-Options',
				`ALLOW-FROM ${security.frameOptionsAllowFrom}`
			);
		} else {
			c.header('X-Frame-Options', security.frameOptions);
		}
	}

	// Content type protection
	if (security.contentTypeOptions) {
		c.header('X-Content-Type-Options', 'nosniff');
	}

	// XSS protection
	if (security.xssProtection) {
		c.header('X-XSS-Protection', '1; mode=block');
	}

	// Referrer policy
	if (security.referrerPolicy) {
		c.header('Referrer-Policy', security.referrerPolicy);
	}

	// Permissions policy
	if (
		security.permissionsPolicy &&
		Object.keys(security.permissionsPolicy).length > 0
	) {
		const permissions = Object.entries(security.permissionsPolicy)
			.map(([feature, directives]) => {
				const directiveList = Array.isArray(directives)
					? directives
					: [directives];
				return `${feature}=(${directiveList.join(' ')})`;
			})
			.join(', ');

		c.header('Permissions-Policy', permissions);
	}

	// Additional security headers for Cloudflare
	c.header('X-Cloudflare-Request-ID', c.get('requestId'));
	c.header('X-Request-ID', c.get('requestId'));
}

/**
 * Apply Content Security Policy headers
 */
async function applyCSPHeaders(
	c: Context,
	config: SecurityConfig
): Promise<void> {
	const cspConfig = config.csp;
	if (!cspConfig) return;

	const directives: string[] = [];

	// Build CSP directives
	if (cspConfig.defaultSrc) {
		directives.push(`default-src ${cspConfig.defaultSrc.join(' ')}`);
	}

	if (cspConfig.scriptSrc) {
		directives.push(`script-src ${cspConfig.scriptSrc.join(' ')}`);
	}

	if (cspConfig.styleSrc) {
		directives.push(`style-src ${cspConfig.styleSrc.join(' ')}`);
	}

	if (cspConfig.imgSrc) {
		directives.push(`img-src ${cspConfig.imgSrc.join(' ')}`);
	}

	if (cspConfig.connectSrc) {
		directives.push(`connect-src ${cspConfig.connectSrc.join(' ')}`);
	}

	if (cspConfig.fontSrc) {
		directives.push(`font-src ${cspConfig.fontSrc.join(' ')}`);
	}

	if (cspConfig.objectSrc) {
		directives.push(`object-src ${cspConfig.objectSrc.join(' ')}`);
	}

	if (cspConfig.mediaSrc) {
		directives.push(`media-src ${cspConfig.mediaSrc.join(' ')}`);
	}

	if (cspConfig.frameSrc) {
		directives.push(`frame-src ${cspConfig.frameSrc.join(' ')}`);
	}

	if (cspConfig.childSrc) {
		directives.push(`child-src ${cspConfig.childSrc.join(' ')}`);
	}

	if (cspConfig.workerSrc) {
		directives.push(`worker-src ${cspConfig.workerSrc.join(' ')}`);
	}

	if (cspConfig.manifestSrc) {
		directives.push(`manifest-src ${cspConfig.manifestSrc.join(' ')}`);
	}

	if (cspConfig.upgradeInsecureRequests) {
		directives.push('upgrade-insecure-requests');
	}

	if (cspConfig.blockAllMixedContent) {
		directives.push('block-all-mixed-content');
	}

	if (cspConfig.reportUri) {
		directives.push(`report-uri ${cspConfig.reportUri}`);
	}

	// Set CSP header
	const headerName = cspConfig.reportOnly
		? 'Content-Security-Policy-Report-Only'
		: 'Content-Security-Policy';
	c.header(headerName, directives.join('; '));
}

/**
 * Apply rate limiting headers if they exist from rate limiting middleware
 */
async function applyRateLimitHeaders(
	c: Context,
	config: SecurityConfig
): Promise<void> {
	const rateLimitConfig = config.rateLimitHeaders;
	if (!rateLimitConfig?.enabled) return;

	// Get rate limit information from context (set by rate limiting middleware)
	const rateLimit = c.get('rateLimit');

	if (rateLimit) {
		if (!rateLimitConfig.hideLimit && rateLimit.limit) {
			c.header('X-Rate-Limit-Limit', rateLimit.limit.toString());
		}

		if (!rateLimitConfig.hideRemaining && rateLimit.remaining !== undefined) {
			c.header('X-Rate-Limit-Remaining', rateLimit.remaining.toString());
		}

		if (!rateLimitConfig.hideReset && rateLimit.resetTime) {
			c.header('X-Rate-Limit-Reset', rateLimit.resetTime.toString());
		}

		if (rateLimit.retryAfter) {
			c.header(
				'Retry-After',
				Math.ceil(rateLimit.retryAfter / 1000).toString()
			);
		}
	}
}

/**
 * Check if request is secure (HTTPS)
 */
function isSecureRequest(c: Context): boolean {
	const protocol = c.req.header('CF-Visitor')?.includes('"scheme":"https"');
	const forwardedProto = c.req.header('X-Forwarded-Proto') === 'https';
	const cfEdgeHttps =
		c.req.header('X-Forwarded-Proto') ||
		c.req.header('CF-Visitor') ||
		c.req.url.startsWith('https://');

	return protocol || forwardedProto || cfEdgeHttps;
}

/**
 * Log security violations for monitoring and analysis
 */
async function logSecurityViolation(
	c: Context,
	violation: SecurityViolation,
	config: SecurityConfig
): Promise<void> {
	if (!config.enableLogging) return;

	const logLevel = config.logLevel || 'warn';
	const message = `Security violation: ${violation.type} - ${violation.message}`;

	const logData = {
		violation,
		request: {
			path: c.req.path,
			method: c.req.method,
			headers: Object.fromEntries(c.req.header()),
			url: c.req.url,
		},
		timestamp: new Date().toISOString(),
	};

	// Log based on severity and configured log level
	if (violation.severity === 'critical' || logLevel === 'debug') {
		console.error('[SECURITY]', message, logData);
	} else if (violation.severity === 'high' || logLevel === 'info') {
		console.warn('[SECURITY]', message, logData);
	} else if (logLevel === 'warn') {
		console.warn('[SECURITY]', message, {
			type: violation.type,
			path: violation.path,
			ip: violation.ip,
		});
	}

	// Store violation in analytics if Cloudflare service is available
	try {
		const cloudflare = c.get('cloudflare') as CloudflareService;
		if (cloudflare) {
			await cloudflare.cacheSet(
				'analytics',
				`security_violation:${violation.requestId}`,
				violation,
				{
					ttl: 86400 * 7, // Keep for 7 days
				}
			);
		}
	} catch (error) {
		console.error('Failed to store security violation:', error);
	}
}

// Predefined security configurations
export const SecurityPresets = {
	// Development configuration with relaxed security
	DEVELOPMENT: {
		cors: {
			origin: [
				'http://localhost:3000',
				'http://localhost:5173',
				'http://127.0.0.1:3000',
			],
			credentials: true,
			allowHeaders: ['*'],
		},
		csp: {
			defaultSrc: ["'self'", 'localhost:*', '127.0.0.1:*'],
			scriptSrc: [
				"'self'",
				"'unsafe-inline'",
				"'unsafe-eval'",
				'localhost:*',
				'127.0.0.1:*',
			],
			styleSrc: ["'self'", "'unsafe-inline'", 'localhost:*', '127.0.0.1:*'],
			connectSrc: ["'self'", 'localhost:*', '127.0.0.1:*', 'ws:', 'wss:'],
			reportOnly: true,
		},
		security: {
			hsts: { enabled: false },
			frameOptions: 'SAMEORIGIN',
			contentTypeOptions: true,
			xssProtection: true,
			referrerPolicy: 'strict-origin-when-cross-origin',
		},
		enableLogging: true,
		logLevel: 'debug',
	} as SecurityConfig,

	// Production configuration with strict security
	PRODUCTION: {
		cors: {
			origin: ['https://parsify.dev', 'https://app.parsify.dev'],
			credentials: true,
		},
		csp: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			imgSrc: ["'self'", 'data:', 'https:'],
			connectSrc: ["'self'"],
			fontSrc: ["'self'", 'data:'],
			objectSrc: ["'none'"],
			mediaSrc: ["'self'"],
			frameSrc: ["'none'"],
			upgradeInsecureRequests: true,
			blockAllMixedContent: true,
		},
		security: {
			hsts: {
				enabled: true,
				maxAge: 31536000,
				includeSubDomains: true,
				preload: true,
			},
			frameOptions: 'DENY',
			contentTypeOptions: true,
			xssProtection: true,
			referrerPolicy: 'strict-origin-when-cross-origin',
			permissionsPolicy: {
				geolocation: [],
				microphone: [],
				camera: [],
				payment: [],
				usb: [],
			},
			customHeaders: {
				'X-Content-Type-Options': 'nosniff',
				'X-Frame-Options': 'DENY',
			},
		},
		enableLogging: true,
		logLevel: 'warn',
	} as SecurityConfig,

	// Public API configuration with CORS for external access
	PUBLIC_API: {
		cors: {
			origin: '*',
			allowMethods: ['GET', 'POST', 'OPTIONS'],
			allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
			credentials: false,
		},
		csp: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'"],
			styleSrc: ["'self'"],
			connectSrc: ["'self'", 'https:'],
		},
		security: {
			hsts: { enabled: false },
			frameOptions: 'DENY',
			contentTypeOptions: true,
			xssProtection: true,
			referrerPolicy: 'no-referrer',
		},
		rateLimitHeaders: {
			enabled: true,
			hideLimit: false,
			hideRemaining: false,
			hideReset: false,
		},
	} as SecurityConfig,

	// Admin panel configuration with strict security
	ADMIN: {
		cors: {
			origin: ['https://admin.parsify.dev'],
			credentials: true,
		},
		csp: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			imgSrc: ["'self'", 'data:'],
			connectSrc: ["'self'"],
			frameSrc: ["'none'"],
		},
		security: {
			hsts: {
				enabled: true,
				maxAge: 31536000,
				includeSubDomains: true,
				preload: true,
			},
			frameOptions: 'DENY',
			contentTypeOptions: true,
			xssProtection: true,
			referrerPolicy: 'strict-origin-when-cross-origin',
			customHeaders: {
				'X-Admin-Panel': 'true',
			},
		},
		customValidation: async (c) => {
			// Add custom admin validation logic here
			const auth = c.get('auth') as AuthContext;
			return (
				auth.isAuthenticated && auth.user?.subscription_tier === 'enterprise'
			);
		},
	} as SecurityConfig,
};

// Middleware factory functions
export const createDevelopmentSecurity = (
	customConfig?: Partial<SecurityConfig>
) => {
	return securityMiddleware(
		deepMerge(SecurityPresets.DEVELOPMENT, customConfig || {})
	);
};

export const createProductionSecurity = (
	customConfig?: Partial<SecurityConfig>
) => {
	return securityMiddleware(
		deepMerge(SecurityPresets.PRODUCTION, customConfig || {})
	);
};

export const createPublicApiSecurity = (
	customConfig?: Partial<SecurityConfig>
) => {
	return securityMiddleware(
		deepMerge(SecurityPresets.PUBLIC_API, customConfig || {})
	);
};

export const createAdminSecurity = (customConfig?: Partial<SecurityConfig>) => {
	return securityMiddleware(
		deepMerge(SecurityPresets.ADMIN, customConfig || {})
	);
};

// Helper functions
export const createOriginValidator = (allowedOrigins: string[]) => {
	return (origin: string) => {
		return allowedOrigins.some((allowed) => {
			if (allowed === '*') return true;
			if (allowed === origin) return true;

			const pattern = allowed.replace(/\*/g, '.*');
			const regex = new RegExp(`^${pattern}$`);
			return regex.test(origin);
		});
	};
};

export const createCSPDirective = (directives: string[]): string => {
	return directives.join(' ');
};

export const createPermissionsPolicy = (
	policies: Record<string, string[]>
): string => {
	return Object.entries(policies)
		.map(([feature, directives]) => `${feature}=(${directives.join(' ')})`)
		.join(', ');
};

export const isSecureConnection = (c: Context): boolean => {
	return isSecureRequest(c);
};

export const getClientOrigin = (c: Context): string | null => {
	return c.req.header('Origin') || c.req.header('Referer') || null;
};

export const isAPIRequest = (c: Context): boolean => {
	return (
		c.req.path.startsWith('/api/') ||
		c.req.header('Accept')?.includes('application/json') ||
		c.req.header('Content-Type')?.includes('application/json')
	);
};

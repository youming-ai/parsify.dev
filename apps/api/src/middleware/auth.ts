import type { Context, Next } from 'hono';
import type { User } from '../models/user';
import { getSentryClient } from '../monitoring/sentry';
import { AuthService, type TokenPayload } from '../services/auth_service';
import type { CloudflareService } from '../services/cloudflare';

// Extended context type to include auth data
export interface AuthContext {
	user?: User;
	sessionId?: string;
	tokenPayload?: TokenPayload;
	isAuthenticated: boolean;
}

// Middleware options
export interface AuthMiddlewareOptions {
	required?: boolean; // Whether authentication is required
	roles?: string[]; // Required user roles/subscription tiers
	skipPaths?: string[]; // Paths to skip authentication
	refreshToken?: boolean; // Whether to attempt token refresh
}

// Authentication error types
export enum AuthError {
	MISSING_TOKEN = 'MISSING_TOKEN',
	INVALID_TOKEN = 'INVALID_TOKEN',
	EXPIRED_TOKEN = 'EXPIRED_TOKEN',
	SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
	USER_NOT_FOUND = 'USER_NOT_FOUND',
	INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
	RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
	SERVICE_ERROR = 'SERVICE_ERROR',
}

// Authentication error response
export interface AuthErrorResponse {
	error: string;
	message: string;
	code: AuthError;
	requestId?: string;
	retryAfter?: number;
}

/**
 * Authentication middleware for Hono
 * Validates JWT tokens and enriches request context with user data
 */
export const authMiddleware = (options: AuthMiddlewareOptions = {}) => {
	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		const {
			required = false,
			roles = [],
			skipPaths = [],
			refreshToken = true,
		} = options;

		// Skip authentication for specified paths
		if (skipPaths.some((path) => c.req.path.startsWith(path))) {
			await next();
			return;
		}

		const requestId = c.get('requestId');
		const clientIP =
			c.req.header('CF-Connecting-IP') ||
			c.req.header('X-Forwarded-For') ||
			'unknown';

		try {
			// Initialize services
			const cloudflare = c.get('cloudflare') as CloudflareService;
			const authService = new AuthService({
				db: c.env.DB,
				kv: c.env.SESSIONS,
				jwtSecret: c.env.JWT_SECRET || 'default-secret-change-in-production',
				auditEnabled: true,
				sessionTimeoutMinutes: 30,
				databaseConfig: {
					maxConnections: 10,
					connectionTimeoutMs: 5000,
					retryAttempts: 3,
					enableMetrics: true,
				},
			});

			// Extract token from Authorization header
			const authHeader = c.req.header('Authorization');
			let token: string | null = null;

			if (authHeader) {
				const parts = authHeader.split(' ');
				if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
					token = parts[1];
				}
			}

			// Set initial auth context
			const authContext: AuthContext = {
				isAuthenticated: false,
			};
			c.set('auth', authContext);

			// If no token and authentication is required, return error
			if (!token) {
				if (required) {
					return handleAuthError(c, AuthError.MISSING_TOKEN, requestId);
				}
				await next();
				return;
			}

			// Verify token and extract payload
			const tokenPayload = await authService.verifyToken(token, clientIP);

			if (!tokenPayload) {
				if (required) {
					return handleAuthError(c, AuthError.INVALID_TOKEN, requestId);
				}
				await next();
				return;
			}

			// Check if token is expired
			const now = Math.floor(Date.now() / 1000);
			if (tokenPayload.exp < now) {
				if (refreshToken) {
					// Attempt to refresh the token
					const refreshed = await attemptTokenRefresh(
						authService,
						tokenPayload.sessionId,
						clientIP,
						c.req.header('User-Agent') || ''
					);

					if (!refreshed) {
						if (required) {
							return handleAuthError(c, AuthError.EXPIRED_TOKEN, requestId);
						}
						await next();
						return;
					}

					// Update token with refreshed one
					token = refreshed.token;
					Object.assign(tokenPayload, refreshed.payload);
				} else {
					if (required) {
						return handleAuthError(c, AuthError.EXPIRED_TOKEN, requestId);
					}
					await next();
					return;
				}
			}

			// Get session data
			const session = await authService.getSession(tokenPayload.sessionId);
			if (!session) {
				if (required) {
					return handleAuthError(c, AuthError.SESSION_NOT_FOUND, requestId);
				}
				await next();
				return;
			}

			// Get user data if user ID exists
			let user: User | null = null;
			if (session.userId) {
				user = await authService.getUserById(session.userId);
				if (!user && required) {
					return handleAuthError(c, AuthError.USER_NOT_FOUND, requestId);
				}
			}

			// Check role/subscription requirements
			if (user && roles.length > 0) {
				if (!roles.includes(user.subscription_tier)) {
					return handleAuthError(
						c,
						AuthError.INSUFFICIENT_PERMISSIONS,
						requestId
					);
				}
			}

			// Update auth context with user data
			authContext.user = user || undefined;
			authContext.sessionId = tokenPayload.sessionId;
			authContext.tokenPayload = tokenPayload;
			authContext.isAuthenticated = true;
			c.set('auth', authContext);

			// Set user context in Sentry for error tracking
			const sentryClient = getSentryClient();
			if (sentryClient && user) {
				sentryClient.setUserContext({
					id: user.id,
					email: user.email,
					username: user.username,
					subscription_tier: user.subscription_tier,
					ip_address: clientIP,
					user_agent: c.req.header('User-Agent'),
				});

				// Add authentication breadcrumb
				sentryClient.addBreadcrumb({
					category: 'auth',
					message: 'User authenticated successfully',
					level: 'info',
					data: {
						user_id: user.id,
						subscription_tier: user.subscription_tier,
						session_id: tokenPayload.sessionId,
						method: c.req.method,
						path: c.req.path,
					},
				});

				// Set user-related tags
				sentryClient.setTags({
					user_authenticated: 'true',
					user_subscription_tier: user.subscription_tier || 'unknown',
					user_id: user.id,
				});
			}

			// Update session last access time
			if (session) {
				await authService.updateSession(tokenPayload.sessionId, {
					lastAccessAt: now,
				});
			}

			// Log successful authentication
			await logAuthEvent(
				cloudflare,
				'auth_success',
				{
					userId: user?.id,
					sessionId: tokenPayload.sessionId,
					ipAddress: clientIP,
					userAgent: c.req.header('User-Agent'),
				},
				requestId
			);

			// Continue to next middleware
			await next();
		} catch (error) {
			console.error('Authentication middleware error:', {
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				path: c.req.path,
				method: c.req.method,
				requestId,
			});

			// Log authentication failure
			const cloudflare = c.get('cloudflare') as CloudflareService;
			await logAuthEvent(
				cloudflare,
				'auth_error',
				{
					error: error instanceof Error ? error.message : 'Unknown error',
					ipAddress: clientIP,
					userAgent: c.req.header('User-Agent'),
				},
				requestId
			);

			if (required) {
				return handleAuthError(c, AuthError.SERVICE_ERROR, requestId);
			}

			await next();
		}
	};
};

/**
 * Handle authentication errors with appropriate responses
 */
function handleAuthError(
	c: Context<{ Bindings: Env }>,
	error: AuthError,
	requestId?: string
): Response {
	// Add authentication failure breadcrumb to Sentry
	const sentryClient = getSentryClient();
	if (sentryClient) {
		sentryClient.addBreadcrumb({
			category: 'auth',
			message: `Authentication failed: ${error}`,
			level: 'warning',
			data: {
				error_type: error,
				endpoint: c.req.path,
				method: c.req.method,
				user_agent: c.req.header('User-Agent'),
				ip_address:
					c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
				request_id: requestId,
			},
		});

		// Set auth-related tags
		sentryClient.setTags({
			auth_error_type: error,
			user_authenticated: 'false',
		});
	}

	const responses: Record<AuthError, AuthErrorResponse> = {
		[AuthError.MISSING_TOKEN]: {
			error: 'Authentication Required',
			message: 'Authorization header with Bearer token is required',
			code: AuthError.MISSING_TOKEN,
			requestId,
		},
		[AuthError.INVALID_TOKEN]: {
			error: 'Invalid Token',
			message: 'The provided token is invalid or malformed',
			code: AuthError.INVALID_TOKEN,
			requestId,
		},
		[AuthError.EXPIRED_TOKEN]: {
			error: 'Token Expired',
			message: 'The provided token has expired. Please refresh your token',
			code: AuthError.EXPIRED_TOKEN,
			requestId,
		},
		[AuthError.SESSION_NOT_FOUND]: {
			error: 'Session Not Found',
			message: 'The session associated with this token could not be found',
			code: AuthError.SESSION_NOT_FOUND,
			requestId,
		},
		[AuthError.USER_NOT_FOUND]: {
			error: 'User Not Found',
			message: 'The user associated with this session could not be found',
			code: AuthError.USER_NOT_FOUND,
			requestId,
		},
		[AuthError.INSUFFICIENT_PERMISSIONS]: {
			error: 'Insufficient Permissions',
			message:
				'You do not have the required permissions to access this resource',
			code: AuthError.INSUFFICIENT_PERMISSIONS,
			requestId,
		},
		[AuthError.RATE_LIMIT_EXCEEDED]: {
			error: 'Rate Limit Exceeded',
			message: 'Too many authentication attempts. Please try again later',
			code: AuthError.RATE_LIMIT_EXCEEDED,
			requestId,
			retryAfter: 300, // 5 minutes
		},
		[AuthError.SERVICE_ERROR]: {
			error: 'Authentication Service Error',
			message: 'An error occurred while processing your authentication',
			code: AuthError.SERVICE_ERROR,
			requestId,
		},
	};

	const response = responses[error];
	const statusCode = getStatusCodeForError(error);

	return c.json(response, statusCode);
}

/**
 * Get appropriate HTTP status code for authentication error
 */
function getStatusCodeForError(error: AuthError): number {
	switch (error) {
		case AuthError.MISSING_TOKEN:
		case AuthError.INVALID_TOKEN:
		case AuthError.EXPIRED_TOKEN:
		case AuthError.SESSION_NOT_FOUND:
		case AuthError.USER_NOT_FOUND:
			return 401;
		case AuthError.INSUFFICIENT_PERMISSIONS:
			return 403;
		case AuthError.RATE_LIMIT_EXCEEDED:
			return 429;
		case AuthError.SERVICE_ERROR:
			return 500;
		default:
			return 500;
	}
}

/**
 * Attempt to refresh an expired token
 */
async function attemptTokenRefresh(
	authService: AuthService,
	sessionId: string,
	ipAddress: string,
	_userAgent: string
): Promise<{ token: string; payload: TokenPayload } | null> {
	try {
		// Get the session to ensure it's still valid
		const session = await authService.getSession(sessionId);
		if (!session || !session.userId) {
			return null;
		}

		// Generate new token
		const user = await authService.getUserById(session.userId);
		const newToken = authService.generateToken(
			sessionId,
			session.userId,
			user?.subscription_tier
		);

		// Verify the new token to get the payload
		const payload = await authService.verifyToken(newToken, ipAddress);
		if (!payload) {
			return null;
		}

		return { token: newToken, payload };
	} catch (error) {
		console.error('Token refresh failed:', error);
		return null;
	}
}

/**
 * Log authentication events for monitoring and audit
 */
async function logAuthEvent(
	cloudflare: CloudflareService,
	event: string,
	data: Record<string, any>,
	requestId?: string
): Promise<void> {
	try {
		const logData = {
			event,
			timestamp: new Date().toISOString(),
			requestId,
			...data,
		};

		// Store in analytics KV for monitoring
		await cloudflare.cacheSet('analytics', `auth_event:${requestId}`, logData, {
			ttl: 86400, // 24 hours
		});

		console.log('Auth event:', logData);
	} catch (error) {
		console.error('Failed to log auth event:', error);
	}
}

/**
 * Helper function to get current user from context
 */
export const getCurrentUser = (c: Context): User | undefined => {
	const auth = c.get('auth') as AuthContext;
	return auth.user;
};

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = (c: Context): boolean => {
	const auth = c.get('auth') as AuthContext;
	return auth.isAuthenticated;
};

/**
 * Helper function to check if user has required subscription tier
 */
export const hasSubscriptionTier = (
	c: Context,
	requiredTier: string
): boolean => {
	const auth = c.get('auth') as AuthContext;
	return auth.user?.subscription_tier === requiredTier;
};

/**
 * Helper function to check if user has premium features
 */
export const hasPremiumFeatures = (c: Context): boolean => {
	const auth = c.get('auth') as AuthContext;
	return auth.user?.subscription_tier !== 'free';
};

/**
 * Helper function to get user's API quota
 */
export const getUserQuota = (c: Context): number => {
	const auth = c.get('auth') as AuthContext;
	return auth.user?.dailyApiLimit || 100;
};

/**
 * Middleware factory for requiring specific subscription tiers
 */
export const requireSubscriptionTier = (tier: string) => {
	return authMiddleware({
		required: true,
		roles: [tier],
	});
};

/**
 * Middleware factory for requiring premium features
 */
export const requirePremium = () => {
	return authMiddleware({
		required: true,
		roles: ['pro', 'enterprise'],
	});
};

/**
 * Middleware factory for requiring enterprise features
 */
export const requireEnterprise = () => {
	return authMiddleware({
		required: true,
		roles: ['enterprise'],
	});
};

/**
 * Optional authentication middleware - doesn't require auth but enriches context if provided
 */
export const optionalAuth = () => {
	return authMiddleware({
		required: false,
	});
};

/**
 * Rate limiting middleware specifically for authentication endpoints
 */
export const authRateLimit = () => {
	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		const clientIP =
			c.req.header('CF-Connecting-IP') ||
			c.req.header('X-Forwarded-For') ||
			'unknown';
		const requestId = c.get('requestId');

		try {
			const authService = new AuthService({
				db: c.env.DB,
				kv: c.env.SESSIONS,
				jwtSecret: c.env.JWT_SECRET || 'default-secret',
			});

			const isAllowed = await authService.checkAuthRateLimit(clientIP);

			if (!isAllowed) {
				return handleAuthError(c, AuthError.RATE_LIMIT_EXCEEDED, requestId);
			}

			await next();
		} catch (error) {
			console.error('Auth rate limiting error:', error);
			await next();
		}
	};
};

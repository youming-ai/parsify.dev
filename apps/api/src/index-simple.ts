import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Types for Cloudflare Workers
export interface Env {
	// Cloudflare bindings
	DB: D1Database;
	CACHE: KVNamespace;
	SESSIONS: KVNamespace;
	UPLOADS: KVNamespace;
	ANALYTICS: KVNamespace;
	FILES: R2Bucket;

	// Environment variables
	ENVIRONMENT: string;
	API_VERSION: string;
	ENABLE_METRICS: string;
	LOG_LEVEL: string;
	ENABLE_HEALTH_CHECKS: string;
	ENABLE_CORS: string;
	JWT_SECRET: string;
	SENTRY_DSN: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use('*', async (c, next) => {
	const environment = c.env.ENVIRONMENT || 'development';

	// Get appropriate CORS configuration
	if (c.req.path.startsWith('/api/v1/public/')) {
		const corsConfig = {
			origin: '*',
			allowMethods: ['GET', 'POST', 'OPTIONS'],
			allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
			credentials: false,
			maxAge: 3600,
		};
		const corsMiddleware = cors(corsConfig);
		return corsMiddleware(c, next);
	}
	if (c.req.path.startsWith('/api/v1/admin/')) {
		const corsConfig = {
			origin: ['https://admin.parsify.dev'],
			allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
			allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
			credentials: true,
			maxAge: 86400,
		};
		const corsMiddleware = cors(corsConfig);
		return corsMiddleware(c, next);
	}
	const allowedOrigins = {
		production: [
			'https://parsify.dev',
			'https://www.parsify.dev',
			'https://app.parsify.dev',
		],
		staging: [
			'https://parsify.dev',
			'https://staging.parsify.dev',
			'https://preview.parsify.dev',
		],
		development: [
			'http://localhost:3000',
			'http://localhost:5173',
			'http://127.0.0.1:3000',
		],
	};

	const origins =
		allowedOrigins[environment as keyof typeof allowedOrigins] ||
		allowedOrigins.development;
	const corsConfig = {
		origin: origins,
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowHeaders: [
			'Content-Type',
			'Authorization',
			'X-Requested-With',
			'Accept',
			'Origin',
		],
		credentials: true,
		maxAge: 86400,
	};
	const corsMiddleware = cors(corsConfig);
	return corsMiddleware(c, next);
});

// Request ID middleware
app.use('*', async (c, next) => {
	const requestId = crypto.randomUUID();
	c.header('X-Request-ID', requestId);
	await next();
});

// Logger middleware
app.use('*', logger());

// Health check endpoint
app.get('/health', (c) => {
	return c.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		environment: c.env.ENVIRONMENT || 'unknown',
		version: c.env.API_VERSION || 'v1',
	});
});

// JSON Tools endpoints
app.post('/api/v1/json/format', async (c) => {
	try {
		const { json, options = {} } = await c.req.json();

		if (!json) {
			return c.json({ error: 'JSON input is required' }, 400);
		}

		const parsed = JSON.parse(json);
		const indent = options.indent || 2;
		const sortKeys = options.sortKeys || false;

		let formatted = parsed;
		if (sortKeys) {
			formatted = sortObjectKeys(parsed);
		}

		return c.json({
			success: true,
			data: {
				original: json,
				formatted: JSON.stringify(formatted, null, indent),
				size: {
					original: json.length,
					formatted: JSON.stringify(formatted, null, indent).length,
				},
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: 'Invalid JSON format',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			400
		);
	}
});

// Code execution endpoint
app.post('/api/v1/code/execute', async (c) => {
	try {
		const { code, language = 'javascript', options = {} } = await c.req.json();

		if (!code) {
			return c.json({ error: 'Code is required' }, 400);
		}

		const timeout = options.timeout || 5000;

		// Simple validation for demonstration
		if (language === 'javascript') {
			// Basic JavaScript execution (in production, use sandbox)
			const result = evaluateJavaScript(code, timeout);
			return c.json({
				success: true,
				data: {
					output: result,
					language,
					executionTime: 0, // Mock execution time
				},
			});
		}
		return c.json(
			{
				error: `Language ${language} not yet supported`,
				supportedLanguages: ['javascript'],
			},
			400
		);
	} catch (error) {
		return c.json(
			{
				success: false,
				error: 'Code execution failed',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		);
	}
});

// Utility endpoints
app.post('/api/v1/utils/encode', async (c) => {
	try {
		const { text, encoding } = await c.req.json();

		if (!text || !encoding) {
			return c.json({ error: 'Text and encoding are required' }, 400);
		}

		let encoded = '';
		switch (encoding) {
			case 'base64':
				encoded = btoa(text);
				break;
			case 'url':
				encoded = encodeURIComponent(text);
				break;
			default:
				return c.json({ error: 'Unsupported encoding' }, 400);
		}

		return c.json({
			success: true,
			data: {
				original: text,
				encoded,
				encoding,
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: 'Encoding failed',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		);
	}
});

app.get('/api/v1/utils/uuid', (c) => {
	const version = c.req.query('version') || '4';
	const uuid = crypto.randomUUID();

	return c.json({
		success: true,
		data: {
			uuid,
			version,
		},
	});
});

// Root endpoint
app.get('/', (c) => {
	return c.json({
		name: 'Parsify API',
		version: c.env.API_VERSION || 'v1',
		environment: c.env.ENVIRONMENT || 'unknown',
		status: 'operational',
		timestamp: new Date().toISOString(),
		endpoints: {
			health: '/health',
			api: '/api/v1',
			tools: {
				json: '/api/v1/json/format',
				code: '/api/v1/code/execute',
				utils: {
					encode: '/api/v1/utils/encode',
					uuid: '/api/v1/utils/uuid',
				},
			},
		},
	});
});

// 404 handler
app.notFound((c) => {
	return c.json(
		{
			error: 'Not Found',
			message: `The requested endpoint ${c.req.path} was not found`,
			availableEndpoints: ['/health', '/api/v1', '/'],
		},
		404
	);
});

// Error handler
app.onError((err, c) => {
	const environment = c.env.ENVIRONMENT || 'development';
	const isDevelopment = environment === 'development';

	return c.json(
		{
			error: 'Internal Server Error',
			message: isDevelopment ? err.message : 'An unexpected error occurred',
			timestamp: new Date().toISOString(),
			...(isDevelopment && { stack: err.stack }),
		},
		500
	);
});

// Helper functions
function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
	if (typeof obj !== 'object' || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(sortObjectKeys);
	}

	const sorted: Record<string, unknown> = {};
	const keys = Object.keys(obj).sort();

	for (const key of keys) {
		sorted[key] = sortObjectKeys(obj[key] as Record<string, unknown>);
	}

	return sorted;
}

function evaluateJavaScript(code: string, timeout: number): string {
	// This is a simplified version - in production, use a proper sandbox
	try {
		// Basic safety check
		if (
			code.includes('require') ||
			code.includes('import') ||
			code.includes('fetch')
		) {
			throw new Error(' potentially unsafe code detected');
		}

		const func = new Function(code);
		const result = func();
		return String(result || 'undefined');
	} catch (error) {
		throw new Error(
			`Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

export { app };

export default {
	fetch: app.fetch,
};

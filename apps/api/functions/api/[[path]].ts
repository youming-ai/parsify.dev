/**
 * Cloudflare Pages Functions - API Handler
 * 将 Hono API 转换为 Pages Functions
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Type definitions for environment
export interface Env {
	// Cloudflare bindings
	DB?: D1Database;
	CACHE?: KVNamespace;
	SESSIONS?: KVNamespace;
	UPLOADS?: KVNamespace;
	ANALYTICS?: KVNamespace;
	FILES?: R2Bucket;

	// Environment variables
	ENVIRONMENT: string;
	API_VERSION: string;
	JWT_SECRET: string;

	// Optional Sentry configuration
	SENTRY_DSN?: string;
	SENTRY_ENVIRONMENT?: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use(
	'*',
	cors({
		origin: [
			'http://localhost:3000',
			'https://parsify-dev.pages.dev',
			'https://parsify.dev',
		],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
		credentials: true,
	})
);

// Logger middleware
app.use('*', logger());

// Request ID middleware
app.use('*', async (c, next) => {
	const requestId = crypto.randomUUID();
	c.set('requestId', requestId);
	c.header('X-Request-ID', requestId);
	await next();
});

// Health check endpoint
app.get('/health', (c) => {
	return c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		environment: c.env.ENVIRONMENT || 'development',
	});
});

// Root endpoint
app.get('/', (c) => {
	return c.json({
		name: 'Parsify API',
		version: '1.0.0',
		status: 'operational',
		timestamp: new Date().toISOString(),
		environment: c.env.ENVIRONMENT || 'development',
		endpoints: {
			health: '/health',
			tools: '/api/tools',
			jsonFormat: '/api/json/format',
			jsonValidate: '/api/json/validate',
		},
	});
});

// API routes
app.get('/api/tools', (c) => {
	return c.json({
		success: true,
		data: [
			{
				id: 'json-formatter',
				name: 'JSON Formatter',
				description: 'Format and validate JSON data',
				category: 'utilities',
				endpoint: '/api/json/format',
			},
			{
				id: 'json-validator',
				name: 'JSON Validator',
				description: 'Validate JSON syntax and structure',
				category: 'utilities',
				endpoint: '/api/json/validate',
			},
			{
				id: 'code-formatter',
				name: 'Code Formatter',
				description: 'Format code in multiple languages',
				category: 'development',
				endpoint: '/api/code/format',
			},
		],
	});
});

// JSON format endpoint
app.post('/api/json/format', async (c) => {
	try {
		const body = await c.req.json();
		const { json, indent = 2 } = body;

		if (!json) {
			return c.json(
				{
					success: false,
					error: 'JSON data is required',
				},
				400
			);
		}

		// Simple JSON formatting
		let parsed;
		try {
			parsed = typeof json === 'string' ? JSON.parse(json) : json;
		} catch (error) {
			return c.json(
				{
					success: false,
					error: 'Invalid JSON',
					details: (error as Error).message,
				},
				400
			);
		}

		return c.json({
			success: true,
			data: {
				formatted: JSON.stringify(parsed, null, indent),
				valid: true,
				size: JSON.stringify(parsed).length,
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: 'Internal server error',
				details: (error as Error).message,
			},
			500
		);
	}
});

// JSON validate endpoint
app.post('/api/json/validate', async (c) => {
	try {
		const body = await c.req.json();
		const { json } = body;

		if (!json) {
			return c.json(
				{
					success: false,
					error: 'JSON data is required',
				},
				400
			);
		}

		// Simple JSON validation
		let parsed;
		try {
			parsed = typeof json === 'string' ? JSON.parse(json) : json;
		} catch (error) {
			return c.json(
				{
					success: false,
					error: 'Invalid JSON',
					details: (error as Error).message,
					position: (error as Error).message.match(/position (\d+)/)?.[1],
				},
				400
			);
		}

		return c.json({
			success: true,
			data: {
				valid: true,
				parsed: parsed,
				type: Array.isArray(parsed) ? 'array' : typeof parsed,
				keys:
					typeof parsed === 'object' && parsed !== null
						? Object.keys(parsed)
						: undefined,
				size: JSON.stringify(parsed).length,
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: 'Internal server error',
				details: (error as Error).message,
			},
			500
		);
	}
});

// Code format endpoint (basic)
app.post('/api/code/format', async (c) => {
	try {
		const body = await c.req.json();
		const { code, language = 'javascript' } = body;

		if (!code) {
			return c.json(
				{
					success: false,
					error: 'Code data is required',
				},
				400
			);
		}

		// Basic formatting based on language
		let formatted = code;
		try {
			switch (language.toLowerCase()) {
				case 'json':
					const parsed = JSON.parse(code);
					formatted = JSON.stringify(parsed, null, 2);
					break;
				case 'javascript':
				case 'js':
					// Basic JS formatting - just add proper indentation
					formatted = code
						.split('\n')
						.map((line) => line.trim())
						.filter((line) => line.length > 0)
						.join('\n');
					break;
				default:
					formatted = code;
			}
		} catch (error) {
			return c.json(
				{
					success: false,
					error: `Failed to format ${language} code`,
					details: (error as Error).message,
				},
				400
			);
		}

		return c.json({
			success: true,
			data: {
				formatted: formatted,
				language: language,
				originalSize: code.length,
				formattedSize: formatted.length,
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: 'Internal server error',
				details: (error as Error).message,
			},
			500
		);
	}
});

// 404 handler
app.notFound((c) => {
	return c.json(
		{
			error: 'Not Found',
			message: `The requested endpoint ${c.req.path} was not found`,
			availableEndpoints: [
				'/health',
				'/',
				'/api/tools',
				'/api/json/format',
				'/api/json/validate',
				'/api/code/format',
			],
			requestId: c.get('requestId'),
		},
		404
	);
});

// Error handler
app.onError((err, c) => {
	console.error('API Error:', {
		error: err.message,
		stack: err.stack,
		path: c.req.path,
		method: c.req.method,
		requestId: c.get('requestId'),
	});

	const isDevelopment = c.env.ENVIRONMENT === 'development';

	return c.json(
		{
			error: 'Internal Server Error',
			message: isDevelopment ? err.message : 'An unexpected error occurred',
			timestamp: new Date().toISOString(),
			requestId: c.get('requestId'),
			...(isDevelopment && { stack: err.stack }),
		},
		500
	);
});

// Export for Cloudflare Pages Functions
export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		return app.fetch(request, env, ctx);
	},
};

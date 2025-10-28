import { Hono } from 'hono';

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
	return c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
	});
});

// Simple tools endpoint
app.get('/tools', (c) => {
	return c.json({
		success: true,
		data: [
			{
				id: 'json-formatter',
				name: 'JSON Formatter',
				description: 'Format and validate JSON data',
				category: 'utilities',
			},
			{
				id: 'code-formatter',
				name: 'Code Formatter',
				description: 'Format code in multiple languages',
				category: 'development',
			},
		],
	});
});

// Simple JSON format endpoint
app.post('/json/format', async (c) => {
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

		// Simple JSON formatting
		let parsed;
		try {
			parsed = typeof json === 'string' ? JSON.parse(json) : json;
		} catch (error) {
			return c.json(
				{
					success: false,
					error: 'Invalid JSON',
				},
				400
			);
		}

		return c.json({
			success: true,
			data: {
				formatted: JSON.stringify(parsed, null, 2),
				valid: true,
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: 'Internal server error',
			},
			500
		);
	}
});

export default app;

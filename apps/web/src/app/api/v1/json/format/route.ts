import { NextRequest, NextResponse } from 'next/server';

interface FormatRequest {
	json: string;
	options?: {
		indent?: number;
		sortKeys?: boolean;
	};
}

interface FormatResponse {
	success: boolean;
	data?: {
		original: string;
		formatted: string;
		size: {
			original: number;
			formatted: number;
		};
	};
	error?: string;
	message?: string;
}

// Helper function to sort object keys recursively
function sortObjectKeys(obj: unknown): unknown {
	if (typeof obj !== 'object' || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(sortObjectKeys);
	}

	const recordObj = obj as Record<string, unknown>;
	const sorted: Record<string, unknown> = {};
	const keys = Object.keys(recordObj).sort();

	for (const key of keys) {
		sorted[key] = sortObjectKeys(recordObj[key]);
	}

	return sorted;
}

export async function POST(request: NextRequest): Promise<NextResponse<FormatResponse>> {
	try {
		const body: FormatRequest = await request.json();

		if (!body.json) {
			return NextResponse.json(
				{
					success: false,
					error: 'JSON input is required',
					message: 'Please provide valid JSON string to format',
				},
				{ status: 400 }
			);
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(body.json);
		} catch (parseError) {
			return NextResponse.json(
				{
					success: false,
					error: 'Invalid JSON format',
					message: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
				},
				{ status: 400 }
			);
		}

		const options = body.options || {};
		const indent = options.indent || 2;
		const sortKeys = options.sortKeys || false;

		let formatted = parsed;
		if (sortKeys) {
			formatted = sortObjectKeys(parsed);
		}

		const formattedString = JSON.stringify(formatted, null, indent);

		const response: FormatResponse = {
			success: true,
			data: {
				original: body.json,
				formatted: formattedString,
				size: {
					original: body.json.length,
					formatted: formattedString.length,
				},
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error('JSON format API error:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error occurred',
			},
			{ status: 500 }
		);
	}
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
		},
	});
}

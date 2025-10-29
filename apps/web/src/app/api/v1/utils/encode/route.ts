import { NextRequest, NextResponse } from 'next/server';

interface EncodeRequest {
	text: string;
	encoding: 'base64' | 'url';
}

interface EncodeResponse {
	success: boolean;
	data?: {
		original: string;
		encoded: string;
		encoding: string;
	};
	error?: string;
	message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<EncodeResponse>> {
	try {
		const body: EncodeRequest = await request.json();

		if (!body.text || !body.encoding) {
			return NextResponse.json(
				{
					success: false,
					error: 'Text and encoding are required',
					message: 'Please provide both text and encoding type',
				},
				{ status: 400 }
			);
		}

		let encoded = '';
		try {
			switch (body.encoding) {
				case 'base64':
					// Use Buffer for Node.js compatible base64 encoding
					if (typeof Buffer !== 'undefined') {
						encoded = Buffer.from(body.text).toString('base64');
					} else {
						// Fallback for browser environment
						encoded = btoa(body.text);
					}
					break;
				case 'url':
					encoded = encodeURIComponent(body.text);
					break;
				default:
					return NextResponse.json(
						{
							success: false,
							error: 'Unsupported encoding',
							message: 'Supported encodings: base64, url',
						},
						{ status: 400 }
					);
			}
		} catch (encodeError) {
			return NextResponse.json(
				{
					success: false,
					error: 'Encoding failed',
					message: encodeError instanceof Error ? encodeError.message : 'Unknown encoding error',
				},
				{ status: 400 }
			);
		}

		const response: EncodeResponse = {
			success: true,
			data: {
				original: body.text,
				encoded,
				encoding: body.encoding,
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error('Encoding API error:', error);
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

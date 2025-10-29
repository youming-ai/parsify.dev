import { NextRequest, NextResponse } from 'next/server';

interface UuidResponse {
	success: boolean;
	data?: {
		uuid: string;
		version: string;
	};
	error?: string;
	message?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<UuidResponse>> {
	try {
		const { searchParams } = new URL(request.url);
		const version = searchParams.get('version') || '4';

		let uuid: string;
		try {
			if (version === '4') {
				uuid = crypto.randomUUID();
			} else {
				return NextResponse.json(
					{
						success: false,
						error: 'Unsupported UUID version',
						message: 'Currently only UUID v4 is supported',
					},
					{ status: 400 }
				);
			}
		} catch (uuidError) {
			return NextResponse.json(
				{
					success: false,
					error: 'UUID generation failed',
					message: uuidError instanceof Error ? uuidError.message : 'Unknown UUID generation error',
				},
				{ status: 500 }
			);
		}

		const response: UuidResponse = {
			success: true,
			data: {
				uuid,
				version,
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error('UUID API error:', error);
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

export async function POST(request: NextRequest): Promise<NextResponse<UuidResponse>> {
	// Support POST method for consistency with other endpoints
	return GET(request);
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

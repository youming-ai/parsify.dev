import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const environment = process.env.NODE_ENV || 'development';
	const apiVersion = 'v1';

	return NextResponse.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		environment,
		version: apiVersion,
		nextjs: '16.0.1',
		react: '19.0.0',
	});
}

export async function OPTIONS(request: NextRequest) {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}

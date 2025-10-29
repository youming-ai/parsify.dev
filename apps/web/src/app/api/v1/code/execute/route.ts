import { NextRequest, NextResponse } from 'next/server';

interface ExecuteRequest {
	code: string;
	language?: string;
	options?: {
		timeout?: number;
	};
}

interface ExecuteResponse {
	success: boolean;
	data?: {
		output: string;
		language: string;
		executionTime: number;
	};
	error?: string;
	message?: string;
}

// Simple JavaScript evaluation function with security checks
function evaluateJavaScript(code: string, timeout: number): string {
	try {
		// Basic security checks
		if (
			code.includes('require') ||
			code.includes('import') ||
			code.includes('fetch') ||
			code.includes('XMLHttpRequest') ||
			code.includes('document') ||
			code.includes('window') ||
			code.includes('global') ||
			code.includes('process')
		) {
			throw new Error('Code contains potentially unsafe operations');
		}

		// Create a safe execution context
		const safeCode = `
			(function() {
				${code}
			})()
		`;

		const func = new Function(safeCode);
		const result = func();

		return String(result !== undefined ? result : 'undefined');
	} catch (error) {
		throw new Error(
			`Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

export async function POST(request: NextRequest): Promise<NextResponse<ExecuteResponse>> {
	try {
		const body: ExecuteRequest = await request.json();

		if (!body.code) {
			return NextResponse.json(
				{
					success: false,
					error: 'Code is required',
					message: 'Please provide code to execute',
				},
				{ status: 400 }
			);
		}

		const language = body.language || 'javascript';
		const options = body.options || {};
		const timeout = options.timeout || 5000;

		const startTime = Date.now();

		if (language === 'javascript') {
			try {
				const output = evaluateJavaScript(body.code, timeout);
				const executionTime = Date.now() - startTime;

				const response: ExecuteResponse = {
					success: true,
					data: {
						output,
						language,
						executionTime,
					},
				};

				return NextResponse.json(response);
			} catch (execError) {
				return NextResponse.json(
					{
						success: false,
						error: 'Code execution failed',
						message: execError instanceof Error ? execError.message : 'Unknown execution error',
					},
					{ status: 400 }
				);
			}
		}

		return NextResponse.json(
			{
				success: false,
				error: `Language ${language} not yet supported`,
				message: 'Currently only JavaScript execution is supported',
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error('Code execution API error:', error);
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

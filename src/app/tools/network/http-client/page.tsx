/**
 * HTTP Client Page
 * Test HTTP requests with custom headers, methods, and body content
 */

import { HTTPClient } from '@/components/tools/network/http-client';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'HTTP Client - Test HTTP Requests | Parsify.dev',
	description:
		'Test HTTP requests with custom headers, methods, and body content. Support for REST API testing and debugging.',
	keywords: ['http client', 'http tester', 'api testing', 'rest api', 'http requests', 'curl alternative'],
};

export default function HTTPClientPage() {
	return (
		<ToolPageWrapper
			title="HTTP Client"
			description="Test HTTP requests with custom headers, methods, and body content"
			toolId="http-client"
		>
			<HTTPClient />
		</ToolPageWrapper>
	);
}

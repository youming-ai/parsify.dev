/**
 * JSON5 Parser Page
 * Parse and convert JSON5 files with extended syntax support
 */

import { JSON5Parser } from '@/components/tools/json/json5-parser';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'JSON5 Parser - Parse Extended JSON Syntax | Parsify.dev',
	description:
		'Parse and convert JSON5 files with extended syntax support including comments, trailing commas, single quotes, and unquoted keys.',
	keywords: ['json5 parser', 'json5', 'extended json', 'json parser', 'json comments', 'trailing commas'],
};

export default function JSON5ParserPage() {
	return (
		<ToolPageWrapper
			title="JSON5 Parser"
			description="Parse and convert JSON5 files with extended syntax support"
			toolId="json5-parser"
		>
			<JSON5Parser />
		</ToolPageWrapper>
	);
}

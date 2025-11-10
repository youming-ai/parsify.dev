/**
 * JSON Minifier Page
 * Minify JSON files by removing whitespace and unnecessary characters
 */

import { JSONMinifier } from '@/components/tools/json/json-minifier';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'JSON Minifier - Compress JSON Files | Parsify.dev',
	description:
		'Minify JSON files by removing whitespace, comments, and unnecessary characters. Reduce file size and improve loading times.',
	keywords: ['json minifier', 'compress json', 'json optimizer', 'reduce file size', 'json compression'],
};

export default function JSONMinifierPage() {
	return (
		<ToolPageWrapper
			title="JSON Minifier"
			description="Minify JSON files by removing whitespace and unnecessary characters"
			toolId="json-minifier"
		>
			<JSONMinifier />
		</ToolPageWrapper>
	);
}

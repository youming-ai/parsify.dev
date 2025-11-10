/**
 * JSON Sorter Page
 * Sort JSON object keys alphabetically or by custom order
 */

import { JSONSorter } from '@/components/tools/json/json-sorter';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'JSON Sorter - Sort JSON Keys Alphabetically | Parsify.dev',
	description:
		'Sort JSON object keys alphabetically, by length, type, or custom order. Perfect for organizing and cleaning JSON data structures.',
	keywords: ['json sorter', 'json keys', 'organize json', 'sort json', 'json formatter'],
};

export default function JSONSorterPage() {
	return (
		<ToolPageWrapper
			title="JSON Sorter"
			description="Sort JSON object keys alphabetically or by custom order with advanced sorting options"
			toolId="json-sorter"
		>
			<JSONSorter />
		</ToolPageWrapper>
	);
}

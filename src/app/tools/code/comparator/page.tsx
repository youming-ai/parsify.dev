/**
 * Code Comparator Page
 * Compare two code snippets and highlight differences with detailed analysis
 */

import { CodeComparator } from '@/components/tools/code/code-comparator';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Code Comparator - Compare Code Differences | Parsify.dev',
	description:
		'Compare two code snippets and highlight differences with detailed analysis. Support for multiple programming languages and various comparison modes.',
	keywords: ['code comparator', 'code diff', 'compare code', 'code differences', 'diff tool', 'code comparison'],
};

export default function CodeComparatorPage() {
	return (
		<ToolPageWrapper
			title="Code Comparator"
			description="Compare two code snippets and highlight differences with detailed analysis"
			toolId="code-comparator"
		>
			<CodeComparator />
		</ToolPageWrapper>
	);
}

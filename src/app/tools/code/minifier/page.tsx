/**
 * Code Minifier Page
 * Minify JavaScript, CSS, and other code files by removing whitespace and comments
 */

import { CodeMinifier } from '@/components/tools/code/code-minifier';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Code Minifier - Compress JavaScript, CSS, HTML | Parsify.dev',
	description:
		'Minify JavaScript, TypeScript, CSS, SCSS, HTML, JSON, and XML code. Remove whitespace, comments, and optimize code for production.',
	keywords: ['code minifier', 'javascript minifier', 'css minifier', 'compress code', 'uglify js', 'optimize code'],
};

export default function CodeMinifierPage() {
	return (
		<ToolPageWrapper
			title="Code Minifier"
			description="Minify code files by removing whitespace and comments"
			toolId="code-minifier"
		>
			<CodeMinifier />
		</ToolPageWrapper>
	);
}

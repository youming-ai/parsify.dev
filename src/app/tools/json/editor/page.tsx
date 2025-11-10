/**
 * JSON Editor Page
 * Interactive JSON editor with real-time validation and formatting
 */

import { JSONEditor } from '@/components/tools/json/json-editor';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'JSON Editor - Interactive JSON Validator & Formatter | Parsify.dev',
	description:
		'Interactive JSON editor with real-time validation, syntax highlighting, auto-formatting, and error detection. Edit and validate JSON files with professional tools.',
	keywords: ['json editor', 'json validator', 'json formatter', 'syntax highlighting', 'json viewer'],
};

export default function JSONEditorPage() {
	return (
		<ToolPageWrapper
			title="JSON Editor"
			description="Interactive JSON editor with real-time validation, formatting, and syntax highlighting"
			toolId="json-editor"
		>
			<JSONEditor />
		</ToolPageWrapper>
	);
}

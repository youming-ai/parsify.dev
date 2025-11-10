/**
 * Code Obfuscator Page
 * Obfuscate JavaScript code to protect intellectual property and make reverse engineering difficult
 */

import { CodeObfuscator } from '@/components/tools/code/code-obfuscator';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Code Obfuscator - Protect JavaScript Code | Parsify.dev',
	description:
		'Obfuscate JavaScript code with variable renaming, string encryption, control flow flattening, and debug protection. Protect your intellectual property.',
	keywords: [
		'code obfuscator',
		'javascript obfuscator',
		'protect code',
		'variable renaming',
		'string encryption',
		'anti-debug',
	],
};

export default function CodeObfuscatorPage() {
	return (
		<ToolPageWrapper
			title="Code Obfuscator"
			description="Obfuscate code to protect intellectual property and make reverse engineering difficult"
			toolId="code-obfuscator"
		>
			<CodeObfuscator />
		</ToolPageWrapper>
	);
}

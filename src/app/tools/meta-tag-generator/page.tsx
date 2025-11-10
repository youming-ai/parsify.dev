/**
 * Meta Tag Generator Page
 * Generate HTML meta tags for SEO and social media sharing
 */

import { MetaTagGenerator } from '@/components/tools/file/meta-tag-generator';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Meta Tag Generator - Create HTML Meta Tags | Parsify.dev',
	description:
		'Generate HTML meta tags for SEO and social media sharing. Supports multiple formats including JSON, and more.',
	keywords: [
		'meta tag generator',
		'meta tag generator',
		'html meta',
		'meta tags',
		'seo generator',
		'meta tags creator',
	],
};

export default function MetaTagGeneratorPage() {
	return (
		<ToolPageWrapper
			title="Meta Tag Generator"
			description="Generate HTML meta tags for SEO and social media sharing"
			toolId="meta-tag-generator"
		>
			<MetaTagGenerator />
		</ToolPageWrapper>
	);
}

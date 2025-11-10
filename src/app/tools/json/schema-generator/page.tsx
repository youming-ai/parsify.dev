/**
 * JSON Schema Generator Page
 * Generate JSON Schema from sample JSON data
 */

import { JSONSchemaGenerator } from '@/components/tools/json/json-schema-generator';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'JSON Schema Generator - Generate Schemas from JSON | Parsify.dev',
	description:
		'Generate JSON Schema from sample JSON data with type inference, validation rules, and examples. Supports multiple schema drafts and output formats.',
	keywords: ['json schema generator', 'json schema', 'json validation', 'schema inference', 'json draft 7'],
};

export default function JSONSchemaGeneratorPage() {
	return (
		<ToolPageWrapper
			title="JSON Schema Generator"
			description="Generate JSON Schema from JSON data samples with type inference and validation rules"
			toolId="json-schema-generator"
		>
			<JSONSchemaGenerator />
		</ToolPageWrapper>
	);
}

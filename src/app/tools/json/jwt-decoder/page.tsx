/**
 * JWT Decoder Page
 * Decode and analyze JSON Web Tokens
 */

import { JWTDecoder } from '@/components/tools/json/jwt-decoder';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'JWT Decoder - Decode JSON Web Tokens | Parsify.dev',
	description:
		'Decode and validate JSON Web Tokens (JWT) with header and payload analysis. Expiration time validation and security information.',
	keywords: ['jwt decoder', 'json web token', 'jwt analyzer', 'token decoder', 'jwt validation'],
};

export default function JWTDecoderPage() {
	return (
		<ToolPageWrapper
			title="JWT Decoder"
			description="Decode and validate JSON Web Tokens (JWT) with header and payload analysis"
			toolId="jwt-decoder"
		>
			<JWTDecoder />
		</ToolPageWrapper>
	);
}

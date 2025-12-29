import { JsonLd } from '@/components/seo/json-ld';
import { JWTDecoder } from '@/components/tools/security/jwt-decoder';
import { JWTDecoderDocs } from '@/components/tools/security/jwt-decoder-docs';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'jwt-decoder',
  customTitle: 'JWT Decoder - Parse & Decode JSON Web Tokens',
  customDescription:
    'Decode and verify JSON Web Tokens (JWT) instantly. View header, payload, and signature information.',
  extraKeywords: ['JSON Web Token', 'parser', 'authentication', 'token'],
});

export default function JWTDecoderPage() {
  const structuredData = generateToolStructuredData('jwt-decoder');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="mb-8 border-l-4 border-yellow-500 bg-yellow-100 p-4 font-mono text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          <strong className="uppercase">[ Privacy Notice ]</strong>
          <br />
          JWT decoding is performed entirely in your browser. Your tokens never leave your device.
        </div>

        <JWTDecoder />
        <JWTDecoderDocs />
      </div>
    </>
  );
}

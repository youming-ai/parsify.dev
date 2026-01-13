import { JsonLd } from '@/components/seo/json-ld';
import { JWTDecoderDocs } from '@/components/tools/security/jwt-decoder-docs';
import { ToolLoading } from '@/components/tools/tool-loading';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { generateToolSEOMetadata, generateToolStructuredData } from '@/lib/tool-seo';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'jwt-decoder',
  customTitle: 'JWT Decoder - Parse & Decode JSON Web Tokens',
  customDescription:
    'Decode and verify JSON Web Tokens (JWT) instantly. View header, payload, and signature information.',
  extraKeywords: ['JSON Web Token', 'parser', 'authentication', 'token'],
});

const JWTDecoder = dynamic(
  () =>
    import('@/components/tools/security/jwt-decoder').then((mod) => ({ default: mod.JWTDecoder })),
  {
    loading: () => <ToolLoading message="Loading JWT Decoder..." />,
  }
);

export default function JWTDecoderPage() {
  const structuredData = generateToolStructuredData('jwt-decoder');

  return (
    <>
      {structuredData.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
      <div className="container mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <PrivacyNotice message="JWT decoding is performed entirely in your browser. Your tokens never leave your device." />
        <JWTDecoder />
        <JWTDecoderDocs />
      </div>
    </>
  );
}

import TextAnalyzer from '@/components/tools/text/text-analyzer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Analyzer - Comprehensive Text Analysis | Parsify',
  description:
    'Analyze text with readability scores, sentiment analysis, word frequency, and comprehensive statistics. Professional text analysis tool.',
  keywords: [
    'text analyzer',
    'readability analysis',
    'sentiment analysis',
    'word frequency',
    'text statistics',
    'linguistic analysis',
    'content analysis',
  ],
  openGraph: {
    title: 'Text Analyzer - Comprehensive Text Analysis',
    description:
      'Analyze text with readability scores, sentiment analysis, and detailed statistics',
    type: 'website',
  },
};

export default function TextAnalyzerPage() {
  return (
    <div className="container mx-auto py-8">
      <TextAnalyzer />
    </div>
  );
}

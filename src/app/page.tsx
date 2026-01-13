import { HeroSection } from '@/components/home/hero-section';
import { ToolsGrid } from '@/components/home/tools-grid';
import { MainLayout } from '@/components/layout/main-layout';
import { PerformanceStats } from '@/components/performance-stats';
import { JsonLd } from '@/components/seo/json-ld';
import { toolCategories, toolsData } from '@/data/tools-data';
import { SEO_CONFIG } from '@/lib/seo-config';
import { generateStructuredData } from '@/lib/structured-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parsify.dev - Professional Developer Tools',
  description:
    'A privacy-first collection of utilities for your daily workflow. No server-side processing—your data never leaves your browser. Format JSON, generate IDs, convert colors, and more.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Parsify.dev - Professional Developer Tools',
    description:
      'A privacy-first collection of utilities for your daily workflow. No server-side processing—your data never leaves your browser. Format JSON, generate IDs, convert colors, and more.',
    url: SEO_CONFIG.BASE_URL,
    siteName: SEO_CONFIG.SITE_NAME,
    type: 'website',
    images: [
      {
        url: SEO_CONFIG.DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Parsify.dev - Professional Developer Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parsify.dev - Professional Developer Tools',
    description:
      'A privacy-first collection of utilities for your daily workflow. No server-side processing—your data never leaves your browser.',
    images: [SEO_CONFIG.DEFAULT_OG_IMAGE],
  },
  keywords: [
    'developer tools',
    'json formatter',
    'base64 encoder',
    'jwt decoder',
    'password generator',
    'hash generator',
    'url parser',
    'regex tester',
    'color converter',
    'timestamp converter',
    'privacy-first tools',
    'browser tools',
    'client-side processing',
  ],
};

export default function Home() {
  // Generate structured data for home page
  const webSiteStructuredData = generateStructuredData({
    type: 'WebSite',
    name: SEO_CONFIG.SITE_NAME,
    description:
      'Professional online developer tools for JSON processing, code execution, file transformation, and more. Privacy-first, client-side processing.',
    url: SEO_CONFIG.BASE_URL,
  });

  return (
    <MainLayout>
      <JsonLd data={webSiteStructuredData} />
      <div
        id="main-content"
        className="min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary"
      >
        {/* Performance monitoring (development only) */}
        {process.env.NODE_ENV === 'development' && <PerformanceStats />}

        <HeroSection tools={toolsData} categories={toolCategories} />
        <ToolsGrid tools={toolsData} categories={toolCategories} />
      </div>
    </MainLayout>
  );
}

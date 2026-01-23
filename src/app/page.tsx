import { HeroSection } from '@/components/home/hero-section';
import { ToolsGrid } from '@/components/home/tools-grid';
import { MainLayout } from '@/components/layout/main-layout';
import { PerformanceStats } from '@/components/performance-stats';
import { JsonLd } from '@/components/seo/json-ld';
import { toolCategories, toolsData } from '@/data/tools-data';
import { SEO_CONFIG } from '@/lib/seo-config';
import { generateStructuredData } from '@/lib/structured-data';
import type { StructuredData } from '@/types/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'Parsify.dev - Free Online Developer Tools | JSON Formatter, Base64, JWT, Password Generator',
  description:
    'Free online developer tools: JSON formatter/validator, Base64 encoder/decoder, JWT decoder, password generator, hash generator (MD5, SHA256), URL parser, color converter, and more. Privacy-first—all processing happens in your browser.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title:
      'Parsify.dev - Free Online Developer Tools | JSON Formatter, Base64, JWT, Password Generator',
    description:
      'Free online developer tools: JSON formatter/validator, Base64 encoder/decoder, JWT decoder, password generator, hash generator (MD5, SHA256), URL parser, color converter, and more. Privacy-first—all processing happens in your browser.',
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
    title:
      'Parsify.dev - Free Online Developer Tools | JSON Formatter, Base64, JWT, Password Generator',
    description:
      'Free online developer tools: JSON formatter, Base64 encoder, JWT decoder, password generator, hash generator. Privacy-first—all processing happens in your browser.',
    images: [SEO_CONFIG.DEFAULT_OG_IMAGE],
  },
  keywords: [
    'developer tools',
    'json formatter',
    'json validator',
    'json beautifier',
    'base64 encoder',
    'base64 decoder',
    'jwt decoder',
    'jwt verifier',
    'password generator',
    'hash generator',
    'md5',
    'sha256',
    'sha512',
    'url parser',
    'regex tester',
    'color converter',
    'timestamp converter',
    'uuid generator',
    'timestamp converter',
    'privacy-first tools',
    'browser tools',
    'client-side processing',
    'online tools',
    'free tools',
    'secure tools',
    'sql formatter',
    'html formatter',
    'markdown editor',
    'dns lookup',
    'text analyzer',
    'diff viewer',
  ],
};

export default function Home() {
  // Generate structured data for home page
  const webSiteStructuredData = generateStructuredData({
    type: 'WebSite',
    name: SEO_CONFIG.SITE_NAME,
    description:
      'Free online developer tools: JSON formatter/validator, Base64 encoder/decoder, JWT decoder, password generator, hash generator, URL parser, color converter, timestamp converter, and more. Privacy-first, client-side processing.',
    url: SEO_CONFIG.BASE_URL,
  });

  // Organization structured data for Google Knowledge Panel
  const organizationStructuredData: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Parsify.dev',
    url: SEO_CONFIG.BASE_URL,
    logo: `${SEO_CONFIG.BASE_URL}/logo.png`,
    sameAs: ['https://github.com/youming-ai/parsify.dev', 'https://x.com/um1ng_x'],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'ikashue@gmail.com',
      contactType: 'customer service',
    },
  };

  // ItemList for tools collection (improves search appearance)
  const toolsListStructuredData: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Developer Tools',
    description:
      'Free online developer tools for JSON formatting, Base64 encoding, JWT decoding, password generation, and more',
    numberOfItems: toolsData.length,
    itemListElement: toolsData.slice(0, 10).map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool.name,
      description: tool.description,
      url: `${SEO_CONFIG.BASE_URL}${tool.href}`,
    })),
  };

  return (
    <MainLayout>
      <JsonLd data={webSiteStructuredData} />
      <JsonLd data={organizationStructuredData} />
      <JsonLd data={toolsListStructuredData} />
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

import { createFileRoute } from '@tanstack/react-router';
import { HeroSection } from '~/components/home/hero-section';
import { useDocumentHead } from '~/components/seo/head';
import { toolsData } from '~/data/tools-data';
import { SEO_CONFIG } from '~/lib/seo-config';

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SEO_CONFIG.SITE_NAME,
  description: SEO_CONFIG.DEFAULT_DESCRIPTION,
  url: `${SEO_CONFIG.BASE_URL}/`,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SEO_CONFIG.BASE_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

function HomePage() {
  useDocumentHead({
    title: SEO_CONFIG.DEFAULT_TITLE,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    path: '/',
    appendSiteName: false,
    extraJsonLd: websiteJsonLd,
  });

  return (
    <div>
      <HeroSection tools={toolsData} />
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});

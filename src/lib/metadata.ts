import type { Metadata } from 'next';
import { SEO_CONFIG } from './seo-config';

interface PageMetadataProps {
  title?: string;
  description?: string;
  path: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
}

export function generatePageMetadata({
  title,
  description,
  path,
  keywords = [],
  image,
  noIndex = false,
}: PageMetadataProps): Metadata {
  const url = `${SEO_CONFIG.BASE_URL}${path}`;
  const defaultTitle = SEO_CONFIG.DEFAULT_TITLE;
  const defaultDescription = SEO_CONFIG.DEFAULT_DESCRIPTION;

  return {
    title: title ? `${title} | Parsify.dev` : defaultTitle,
    description: description || defaultDescription,
    keywords: [
      'developer tools',
      'json formatter',
      'json validator',
      'base64 encoder',
      'base64 decoder',
      'jwt decoder',
      'jwt verifier',
      'password generator',
      'hash generator',
      'md5',
      'sha256',
      'url parser',
      'regex tester',
      'color converter',
      'timestamp converter',
      'uuid generator',
      'privacy-first tools',
      'browser tools',
      'online tools',
      'free tools',
      'secure tools',
      ...keywords,
    ],
    openGraph: {
      title: title ? `${title} | Parsify.dev` : defaultTitle,
      description: description || defaultDescription,
      type: 'website',
      url,
      siteName: SEO_CONFIG.SITE_NAME,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: title || SEO_CONFIG.DEFAULT_TITLE,
            },
          ]
        : [
            {
              url: SEO_CONFIG.DEFAULT_OG_IMAGE,
              width: 1200,
              height: 630,
              alt: SEO_CONFIG.DEFAULT_TITLE,
            },
          ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title ? `${title} | Parsify.dev` : defaultTitle,
      description: description || defaultDescription,
      images: image || [SEO_CONFIG.DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': '-1',
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    metadataBase: new URL(SEO_CONFIG.BASE_URL),
  };
}

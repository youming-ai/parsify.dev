'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Head } from 'next/document';

interface I18nSEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
  alternateLanguages?: Record<string, string>;
  ogImage?: string;
  ogType?: string;
  structuredData?: Record<string, any>;
}

/**
 * SEO component with internationalization support
 */
export function I18nSEO({
  title,
  description,
  keywords,
  canonical,
  noIndex = false,
  alternateLanguages,
  ogImage = '/og-image.png',
  ogType = 'website',
  structuredData,
}: I18nSEOProps) {
  const locale = useLocale();
  const t = useTranslations('meta');
  const router = useRouter();
  const pathname = usePathname();

  // Get default translations
  const defaultTitle = title || t('title');
  const defaultDescription = description || t('description');
  const defaultKeywords = keywords || (t('keywords') as string).split(', ');

  // Generate canonical URL
  const canonicalUrl = canonical || `${process.env.NEXT_PUBLIC_SITE_URL}${pathname}`;

  // Generate alternate language URLs
  const supportedLocales = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de', 'ar', 'he'];
  const alternateUrls = alternateLanguages ||
    supportedLocales.reduce((acc, lang) => {
      const localizedPath = router.push(pathname, { locale: lang });
      acc[lang] = `${process.env.NEXT_PUBLIC_SITE_URL}${localizedPath}`;
      return acc;
    }, {} as Record<string, string>);

  // Generate structured data with internationalization
  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: defaultTitle,
      description: defaultDescription,
      url: canonicalUrl,
      inLanguage: locale,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Parsify.dev',
        url: process.env.NEXT_PUBLIC_SITE_URL,
      },
    };

    // Add alternate language references
    if (Object.keys(alternateUrls).length > 1) {
      baseData.inLanguage = supportedLocales.map(lang => ({
        '@type': 'Language',
        name: getLanguageName(lang),
        alternateName: lang,
      }));
    }

    return { ...baseData, ...structuredData };
  };

  // Get language display name
  const getLanguageName = (code: string): string => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'ja': 'Japanese',
      'ko': 'Korean',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ar': 'Arabic',
      'he': 'Hebrew',
    };
    return languageNames[code] || code;
  };

  // Generate hreflang tags
  const hreflangTags = Object.entries(alternateUrls)
    .filter(([lang]) => lang !== locale)
    .map(([lang, url]) => (
      <link
        key={`hreflang-${lang}`}
        rel="alternate"
        hrefLang={lang}
        href={url}
      />
    ));

  // Add x-default for international targeting
  const defaultLanguageUrl = alternateUrls['en'] || canonicalUrl;

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{defaultTitle}</title>
      <meta name="description" content={defaultDescription} />
      <meta name="keywords" content={defaultKeywords.join(', ')} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />

      {/* Language and Direction */}
      <html lang={locale} dir={isRTLLocale(locale) ? 'rtl' : 'ltr'} />
      <meta httpEquiv="content-language" content={locale} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang Tags */}
      {hreflangTags}
      <link rel="alternate" hrefLang="x-default" href={defaultLanguageUrl} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={defaultTitle} />
      <meta property="og:description" content={defaultDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={getOpenGraphLocale(locale)} />

      {/* Additional Open Graph locales */}
      {Object.entries(alternateUrls)
        .filter(([lang]) => lang !== locale)
        .map(([lang]) => (
          <meta
            key={`og-locale-${lang}`}
            property="og:locale:alternate"
            content={getOpenGraphLocale(lang)}
          />
        ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={defaultTitle} />
      <meta name="twitter:description" content={defaultDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData(), null, 2),
        }}
      />

      {/* Additional SEO Meta Tags */}
      <meta name="author" content="Parsify.dev Team" />
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Web App Manifest */}
      <link rel="manifest" href={`/manifest-${locale}.json`} />
    </>
  );
}

/**
 * Get Open Graph locale format
 */
function getOpenGraphLocale(locale: string): string {
  const ogLocales: Record<string, string> = {
    'en': 'en_US',
    'zh-CN': 'zh_CN',
    'zh-TW': 'zh_TW',
    'ja': 'ja_JP',
    'ko': 'ko_KR',
    'es': 'es_ES',
    'fr': 'fr_FR',
    'de': 'de_DE',
    'ar': 'ar_SA',
    'he': 'he_IL',
  };
  return ogLocales[locale] || locale;
}

/**
 * Check if locale is RTL
 */
function isRTLLocale(locale: string): boolean {
  return ['ar', 'he', 'fa', 'ur'].includes(locale);
}

/**
 * Generate breadcrumbs structured data for SEO
 */
export function BreadcrumbStructuredData({
  breadcrumbs,
}: {
  breadcrumbs: Array<{ name: string; url: string }>;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

/**
 * Generate organization structured data
 */
export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Parsify.dev',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
    description: 'Modern online developer tools platform',
    sameAs: [
      'https://github.com/parsify-dev',
      'https://twitter.com/parsifydev',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Chinese', 'Japanese', 'Korean', 'Spanish', 'French', 'German', 'Arabic', 'Hebrew'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

/**
 * Generate FAQ structured data for tool pages
 */
export function FAQStructuredData({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

/**
 * Generate software application structured data for tools
 */
export function SoftwareApplicationStructuredData({
  name,
  description,
  url,
  applicationCategory,
  operatingSystem,
  offers,
}: {
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory,
    operatingSystem,
    offers: offers || {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'Parsify.dev',
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

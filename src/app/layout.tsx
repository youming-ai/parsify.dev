import { Clarity } from '@/components/analytics/clarity';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import { SEO_CONFIG } from '@/lib/seo-config';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type React from 'react';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.BASE_URL),
  title: {
    default: SEO_CONFIG.DEFAULT_TITLE,
    template: '%s | Parsify.dev',
  },
  description: SEO_CONFIG.DEFAULT_DESCRIPTION,
  keywords: [
    'developer tools',
    'online tools',
    'json formatter',
    'json beautifier',
    'json validator',
    'base64 encoder',
    'base64 decoder',
    'jwt decoder',
    'jwt debugger',
    'password generator',
    'secure password',
    'hash generator',
    'md5 hash',
    'sha256 hash',
    'url parser',
    'url encoder',
    'regex tester',
    'regex validator',
    'color converter',
    'hex to rgb',
    'timestamp converter',
    'unix timestamp',
    'privacy-first tools',
    'browser tools',
    'client-side processing',
    'no server upload',
    'free developer tools',
  ],
  authors: [{ name: 'Parsify.dev Team', url: SEO_CONFIG.BASE_URL }],
  creator: 'Parsify.dev',
  publisher: 'Parsify.dev',
  category: 'Developer Tools',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: SEO_CONFIG.DEFAULT_TITLE,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    type: 'website',
    url: SEO_CONFIG.BASE_URL,
    siteName: SEO_CONFIG.SITE_NAME,
    locale: 'en_US',
    images: [
      {
        url: SEO_CONFIG.DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SEO_CONFIG.DEFAULT_TITLE,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONFIG.DEFAULT_TITLE,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    images: [SEO_CONFIG.DEFAULT_OG_IMAGE],
    creator: SEO_CONFIG.TWITTER_HANDLE,
    site: SEO_CONFIG.TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: SEO_CONFIG.BASE_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SEO_CONFIG.SITE_NAME,
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f4' },
    { media: '(prefers-color-scheme: dark)', color: '#14120b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background font-sans antialiased ${inter.variable} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to main content
          </a>

          <ErrorBoundary maxRetries={3}>{children}</ErrorBoundary>
          {/* Microsoft Clarity Analytics */}
          <Clarity projectId="uxo2bgwtio" />
        </ThemeProvider>
        {/* Cloudflare Web Analytics - add script in Cloudflare Dashboard */}
      </body>
    </html>
  );
}

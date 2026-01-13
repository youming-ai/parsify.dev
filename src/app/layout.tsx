import { Clarity } from '@/components/analytics/clarity';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
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
  metadataBase: new URL('https://parsify.dev'),
  title: {
    default: 'Parsify.dev - Professional Developer Tools',
    template: '%s | Parsify.dev',
  },
  description:
    'Professional online developer tools for JSON processing, code execution, file transformation, and more. Run securely in your browser with no data sent to servers.',
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
  ],
  authors: [{ name: 'Parsify.dev Team' }],
  creator: 'Parsify.dev',
  publisher: 'Parsify.dev',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Parsify.dev - Professional Developer Tools',
    description:
      'Professional online developer tools for JSON processing, code execution, file transformation, and more. Run securely in your browser with no data sent to servers.',
    type: 'website',
    url: 'https://parsify.dev',
    siteName: 'Parsify.dev',
    images: [
      {
        url: 'https://parsify.dev/og-image.png',
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
      'Professional online developer tools for JSON processing, code execution, file transformation, and more.',
    images: ['https://parsify.dev/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': '-1',
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://parsify.dev/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Parsify.dev',
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

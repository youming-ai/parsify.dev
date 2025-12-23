import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import type React from 'react';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const paperMono = localFont({
  src: [
    {
      path: './fonts/PaperMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
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
    'json validator',
    'code executor',
    'code formatter',
    'file processor',
    'online utilities',
    'browser tools',
    'wasm sandbox',
    'next.js tools',
    'typescript formatter',
    'css minifier',
    'base64 encoder',
    'url encoder',
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
        className={`min-h-screen bg-background font-sans antialiased ${inter.variable} ${paperMono.variable}`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary maxRetries={3}>{children}</ErrorBoundary>
        </ThemeProvider>
        {/* Cloudflare Web Analytics - add script in Cloudflare Dashboard */}
      </body>
    </html>
  );
}

import './globals.css'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/auth/auth-context'

export const metadata: Metadata = {
  title: 'Parsify.dev - Online Developer Tools',
  description:
    'A comprehensive online platform for developers with JSON processing, code formatting, and execution tools.',
  keywords: [
    'JSON formatter',
    'code executor',
    'developer tools',
    'online utilities',
    'WASM sandbox',
    'TypeScript tools',
  ],
  authors: [{ name: 'Parsify.dev Team' }],
  openGraph: {
    title: 'Parsify.dev - Online Developer Tools Platform',
    description:
      'Professional online tools for JSON processing, code execution, and file transformation',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parsify.dev - Online Developer Tools Platform',
    description:
      'Professional online tools for JSON processing, code execution, and file transformation',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

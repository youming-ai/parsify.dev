import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { I18nSEO, OrganizationStructuredData } from '@/components/seo/i18n-seo';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { setDocumentDirection } from '@/lib/rtl-utils';
import { AccessibilityProvider } from '@/components/ui/accessibility-provider';
import { OfflineBanner } from '@/components/offline/offline-banner';
import { initializeOffline } from '@/lib/offline-integration';

const inter = Inter({ subsets: ['latin'] });

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Set document direction for RTL support
  setDocumentDirection(locale);

  // Initialize offline functionality
  if (typeof window !== 'undefined') {
    initializeOffline({
      enableServiceWorker: true,
      enableBackgroundSync: true,
      enableCacheInvalidation: true,
      enableMonitoring: process.env.NODE_ENV === 'production',
      autoRegister: true,
    }).catch(console.error);
  }

  // Providing all messages to the client
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr'}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AccessibilityProvider
            config={{
              enableAutoTesting: process.env.NODE_ENV === 'development',
              enablePerformanceMonitoring: true,
              enableChangeDetection: false,
              runTestsOnLoad: false,
              testIntervalMinutes: 60,
              debugMode: process.env.NODE_ENV === 'development',
            }}
          >
            <div className="min-h-screen bg-background font-sans antialiased">
              {/* Language Switcher */}
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                  <div className="mr-auto flex items-center space-x-2">
                    <span className="hidden font-bold sm:inline-block">
                      Parsify.dev
                    </span>
                  </div>
                  <nav className="flex items-center space-x-2">
                    <LanguageSwitcher />
                  </nav>
                </div>
              </header>

              {/* Main Content */}
              <main className="flex-1">
                {children}
              </main>

              {/* Footer */}
              <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
                  <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                      Built with ❤️ for developers worldwide
                    </p>
                  </div>
                </div>
              </footer>
            </div>

            <OfflineBanner />

            {/* SEO Components */}
            <I18nSEO />
            <OrganizationStructuredData />
          </AccessibilityProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

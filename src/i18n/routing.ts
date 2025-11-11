import { defineRouting } from 'next-intl/routing';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de', 'ar', 'he'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Set to `false` to disable automatic locale detection
  localeDetection: true,

  // Define locale-specific paths
  pathnames: {
    '/': '/',
    '/tools': {
      en: '/tools',
      'zh-CN': '/tools',
      'zh-TW': '/tools',
      ja: '/tools',
      ko: '/tools',
      es: '/herramientas',
      fr: '/outils',
      de: '/werkzeuge',
      ar: '/أدوات',
      he: '/כלים'
    },
    '/tools/[slug]': {
      en: '/tools/[slug]',
      'zh-CN': '/tools/[slug]',
      'zh-TW': '/tools/[slug]',
      ja: '/tools/[slug]',
      ko: '/tools/[slug]',
      es: '/herramientas/[slug]',
      fr: '/outils/[slug]',
      de: '/werkzeuge/[slug]',
      ar: '/أدوات/[slug]',
      he: '/כלים/[slug]'
    }
  }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation(routing);

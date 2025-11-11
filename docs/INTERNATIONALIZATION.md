# Internationalization (i18n) Documentation

This document describes the internationalization implementation for Parsify.dev, which provides comprehensive multi-language support including Chinese content and RTL layout support.

## Overview

The platform supports 10 languages with full internationalization capabilities:

- **English** (en) - Default language
- **Chinese Simplified** (zh-CN) - 简体中文
- **Chinese Traditional** (zh-TW) - 繁體中文
- **Japanese** (ja) - 日本語
- **Korean** (ko) - 한국어
- **Spanish** (es) - Español
- **French** (fr) - Français
- **German** (de) - Deutsch
- **Arabic** (ar) - العربية (RTL)
- **Hebrew** (he) - עברית (RTL)

## Architecture

### Framework

We use **next-intl** for internationalization, which provides:

- Server-side rendering support
- Automatic locale detection
- Type-safe translations
- SEO optimization
- RTL layout support

### Directory Structure

```
src/
├── i18n/
│   ├── config.ts          # i18n configuration
│   ├── request.ts         # Next.js request handler
│   └── routing.ts         # Locale routing configuration
├── messages/
│   ├── en.json            # English translations
│   ├── zh-CN.json         # Chinese Simplified
│   ├── zh-TW.json         # Chinese Traditional
│   ├── ja.json            # Japanese
│   ├── ko.json            # Korean
│   ├── es.json            # Spanish
│   ├── fr.json            # French
│   ├── de.json            # German
│   ├── ar.json            # Arabic (RTL)
│   └── he.json            # Hebrew (RTL)
├── lib/
│   ├── rtl-utils.ts       # RTL/LTR layout utilities
│   └── format-utils.ts    # Date/number formatting
├── components/
│   ├── ui/
│   │   └── language-switcher.tsx
│   └── seo/
│       └── i18n-seo.tsx   # SEO optimization
└── hooks/
    └── use-i18n-utils.ts  # i18n React hooks
```

## Implementation Details

### 1. Translation Management

#### Translation Files Structure

Each translation file follows this structure:

```json
{
  "meta": {
    "title": "Page title",
    "description": "Page description",
    "keywords": "keywords,for,seo"
  },
  "nav": {
    "home": "Home",
    "tools": "Tools",
    "categories": "Categories"
  },
  "home": {
    "title": "Main title",
    "subtitle": "Subtitle",
    "search": {
      "placeholder": "Search placeholder"
    }
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  }
}
```

#### Adding New Translations

1. Add the key to all translation files
2. Use consistent naming conventions
3. Provide context-specific translations
4. Test with all supported languages

### 2. RTL/LTR Layout Support

#### RTL Detection

```typescript
import { isRTLLocale, getTextDirection } from '@/lib/rtl-utils';

const isRTL = isRTLLocale(locale);
const direction = getTextDirection(locale);
```

#### CSS Classes

Use logical properties and RTL-aware classes:

```css
/* Use logical properties */
margin-inline-start: 1rem;
padding-inline-end: 2rem;
border-inline-start: 1px solid;

/* Or use provided utility classes */
.ms-4  /* margin-inline-start */
.me-4  /* margin-inline-end */
.ps-4  /* padding-inline-start */
.pe-4  /* padding-inline-end */
```

#### React Components

```typescript
import { useI18nUtils } from '@/hooks/use-i18n-utils';

function MyComponent() {
  const { isRTL, conditionalClass, logicalMargin } = useI18nUtils();
  
  return (
    <div 
      className={conditionalClass('text-left', 'text-right')}
      style={logicalMargin(16, 8)}
    >
      Content
    </div>
  );
}
```

### 3. Date, Number, and Currency Formatting

#### Date Formatting

```typescript
import { formatDate, formatDateTime } from '@/lib/format-utils';

const date = new Date();
const formattedDate = formatDate(date, 'zh-CN'); // 2024年3月15日
const formattedDateTime = formatDateTime(date, 'ar'); // Arabic date format
```

#### Number Formatting

```typescript
import { formatNumber, formatCurrency } from '@/lib/format-utils';

const formattedNumber = formatNumber(1234.56, 'de'); // 1.234,56
const formattedCurrency = formatCurrency(1234.56, 'ja', 'JPY'); // ￥1,235
```

#### File Size Formatting

```typescript
import { formatFileSize } from '@/lib/format-utils';

const formattedSize = formatFileSize(1536, 'en'); // 1.5 KB
```

### 4. SEO Optimization

#### Meta Tags

Each locale gets proper SEO meta tags:

```typescript
import { I18nSEO } from '@/components/seo/i18n-seo';

<I18nSEO 
  title="Page Title"
  description="Page description"
  canonical="/tools"
/>
```

#### Hreflang Tags

Automatic hreflang generation for all supported languages:

```html
<link rel="alternate" hrefLang="en" href="/en/tools" />
<link rel="alternate" hrefLang="zh-CN" href="/zh-CN/tools" />
<link rel="alternate" hrefLang="x-default" href="/en/tools" />
```

#### Structured Data

Locale-aware structured data for search engines:

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "inLanguage": "zh-CN",
  "name": "页面标题"
}
```

### 5. Language Switching

#### Language Switcher Component

```typescript
import { LanguageSwitcher } from '@/components/ui/language-switcher';

<LanguageSwitcher />
```

Features:
- Dropdown with all supported languages
- Flag emojis and native language names
- Current language indication
- RTL support for Arabic and Hebrew

#### Programmatic Language Switching

```typescript
import { useRouter, usePathname } from '@/i18n/routing';

const router = useRouter();
const pathname = usePathname();

// Switch to Chinese
router.replace(pathname, { locale: 'zh-CN' });
```

## Configuration

### Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  // No explicit i18n config needed with next-intl
  // Middleware handles locale routing
};

// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(zh-CN|zh-TW|ja|ko|es|fr|de|ar|he)/:path*']
};
```

### Routing Configuration

```typescript
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de', 'ar', 'he'],
  defaultLocale: 'en',
  localeDetection: true,
  pathnames: {
    '/tools': {
      en: '/tools',
      es: '/herramientas',
      ar: '/أدوات'
    }
  }
});
```

### Tailwind CSS Configuration

Enhanced with RTL utilities:

```typescript
// tailwind.config.ts
plugins: [
  plugin(({ addUtilities }) => {
    addUtilities({
      '.dir-rtl': { direction: 'rtl' },
      '.dir-ltr': { direction: 'ltr' },
      '.ms-4': { 'margin-inline-start': '1rem' },
      '.me-4': { 'margin-inline-end': '1rem' },
      // ... more RTL utilities
    });
  }),
]
```

## Development Guidelines

### 1. Adding New Languages

1. Update `src/i18n/routing.ts` to include the new locale
2. Create translation file in `src/messages/[locale].json`
3. Add locale configuration to `src/lib/rtl-utils.ts`
4. Update Tailwind CSS if needed for special requirements
5. Add tests for the new language

### 2. Updating Translations

1. Always update all language files simultaneously
2. Use consistent key naming
3. Provide context-specific translations
4. Test with actual users when possible

### 3. RTL Development

1. Always test RTL layouts
2. Use logical CSS properties
3. Test with Arabic and Hebrew content
4. Verify text direction in all components

### 4. Performance Considerations

1. Translation files are loaded on demand
2. Use dynamic imports for large translation sets
3. Implement proper caching strategies
4. Consider bundle size impact

## Testing

### Unit Tests

```bash
# Run i18n tests
pnpm test src/__tests__/lib/rtl-utils.test.ts
pnpm test src/__tests__/lib/format-utils.test.ts
pnpm test src/__tests__/components/language-switcher.test.tsx
```

### E2E Tests

Test language switching and RTL functionality:

```typescript
// Example Playwright test
test('should switch languages correctly', async ({ page }) => {
  await page.goto('/');
  
  // Switch to Chinese
  await page.click('[data-testid="language-switcher"]');
  await page.click('[data-testid="lang-zh-CN"]');
  
  // Verify Chinese content
  expect(await page.textContent('h1')).toContain('现代开发者工具');
});
```

### Manual Testing Checklist

- [ ] All languages display correctly
- [ ] RTL layouts work for Arabic and Hebrew
- [ ] Language switching preserves page state
- [ ] Date/number formatting is correct
- [ ] SEO meta tags are properly localized
- [ ] URLs are correctly localized

## Deployment

### Environment Variables

```env
NEXT_PUBLIC_SITE_URL=https://parsify.dev
```

### Build Process

1. All translation files are built into the bundle
2. Middleware handles locale routing at edge
3. Static generation works for all locales
4. SEO optimization is applied at build time

## Maintenance

### Regular Tasks

1. Review and update translations
2. Test new features with all languages
3. Monitor bundle size impact
4. Update language detection algorithms
5. Review SEO performance per locale

### Updating next-intl

Check for breaking changes when updating:

```bash
pnpm add next-intl@latest
pnpm test
```

## Troubleshooting

### Common Issues

1. **Missing translations**: Check all language files for required keys
2. **RTL layout issues**: Verify logical CSS properties usage
3. **Language detection problems**: Check browser and system settings
4. **SEO meta tags missing**: Verify I18nSEO component usage
5. **Build errors**: Check middleware and routing configuration

### Debug Tools

1. Browser language settings
2. Next.js development tools
3. Translation key validation
4. Bundle analysis for translation files

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [MDN Internationalization Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [W3C Internationalization Best Practices](https://www.w3.org/International/i18n-activity/)
- [Google Internationalization SEO Guide](https://developers.google.com/search/docs/specialty/international/localized-versions)

## Support

For questions about internationalization implementation:

1. Check this documentation first
2. Review the next-intl documentation
3. Consult the MDN Web Docs for internationalization APIs
4. Reach out to the development team for specific issues
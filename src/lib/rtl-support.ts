/**
 * RTL (Right-to-Left) layout support utilities
 */

// List of RTL locales
export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

// List of LTR locales
export const LTR_LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de', 'ru'];

/**
 * Check if a locale is RTL
 */
export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Check if a locale is LTR
 */
export function isLTR(locale: string): boolean {
  return LTR_LOCALES.includes(locale);
}

/**
 * Get text direction for a locale
 */
export function getTextDirection(locale: string): 'rtl' | 'ltr' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get text alignment for a locale
 */
export function getTextAlign(locale: string): 'right' | 'left' {
  return isRTL(locale) ? 'right' : 'left';
}

/**
 * Get text alignment opposite for a locale
 */
export function getTextAlignOpposite(locale: string): 'right' | 'left' {
  return isRTL(locale) ? 'left' : 'right';
}

/**
 * Get flex direction for a locale
 */
export function getFlexDirection(locale: string): 'row-reverse' | 'row' {
  return isRTL(locale) ? 'row-reverse' : 'row';
}

/**
 * Get margin start for a locale
 */
export function getMarginStart(locale: string): 'mr' | 'ml' {
  return isRTL(locale) ? 'mr' : 'ml';
}

/**
 * Get margin end for a locale
 */
export function getMarginEnd(locale: string): 'ml' | 'mr' {
  return isRTL(locale) ? 'ml' : 'mr';
}

/**
 * Get padding start for a locale
 */
export function getPaddingStart(locale: string): 'pr' | 'pl' {
  return isRTL(locale) ? 'pr' : 'pl';
}

/**
 * Get padding end for a locale
 */
export function getPaddingEnd(locale: string): 'pl' | 'pr' {
  return isRTL(locale) ? 'pl' : 'pr';
}

/**
 * Get border radius classes for RTL support
 */
export function getBorderRadius(locale: string): {
  start: string;
  end: string;
  startTop: string;
  startBottom: string;
  endTop: string;
  endBottom: string;
} {
  if (isRTL(locale)) {
    return {
      start: 'rounded-r',
      end: 'rounded-l',
      startTop: 'rounded-tr',
      startBottom: 'rounded-br',
      endTop: 'rounded-tl',
      endBottom: 'rounded-bl',
    };
  }

  return {
    start: 'rounded-l',
    end: 'rounded-r',
    startTop: 'rounded-tl',
    startBottom: 'rounded-bl',
    endTop: 'rounded-tr',
    endBottom: 'rounded-br',
  };
}

/**
 * Transform Tailwind CSS classes for RTL support
 */
export function transformClassesForRTL(classes: string, locale: string): string {
  if (!isRTL(locale)) {
    return classes;
  }

  // Replace left/right classes
  return classes
    .replace(/\bleft\b/g, 'right')
    .replace(/\bright\b/g, 'left')
    .replace(/\bl-/g, 'r-')
    .replace(/\br-/g, 'l-')
    .replace(/\bml-/g, 'mr-')
    .replace(/\bmr-/g, 'ml-')
    .replace(/\bpl-/g, 'pr-')
    .replace(/\bpr-/g, 'pl-')
    .replace(/\border-l\b/g, 'border-r')
    .replace(/\border-r\b/g, 'border-l')
    .replace(/\bbox-border-l\b/g, 'box-border-r')
    .replace(/\bbox-border-r\b/g, 'box-border-l');
}

/**
 * Get locale-specific font family
 */
export function getLocaleFontFamily(locale: string): string {
  const fontMap: Record<string, string> = {
    'ar': 'Noto Sans Arabic, sans-serif',
    'he': 'Noto Sans Hebrew, sans-serif',
    'fa': 'Noto Sans Persian, sans-serif',
    'ur': 'Noto Sans Urdu, sans-serif',
    'zh-CN': 'Noto Sans SC, sans-serif',
    'zh-TW': 'Noto Sans TC, sans-serif',
    'ja': 'Noto Sans JP, sans-serif',
    'ko': 'Noto Sans KR, sans-serif',
    'th': 'Noto Sans Thai, sans-serif',
  };

  return fontMap[locale] || 'Inter, system-ui, sans-serif';
}

/**
 * Get CSS properties for RTL layout
 */
export function getRTLCSSProperties(locale: string): React.CSSProperties {
  if (!isRTL(locale)) {
    return {};
  }

  return {
    direction: 'rtl',
    textAlign: 'right',
  };
}

/**
 * Get font loading configuration for different locales
 */
export function getFontConfiguration() {
  return {
    fonts: [
      {
        family: 'Noto Sans',
        display: 'swap',
        preload: true,
        variable: '--font-noto-sans',
      },
      {
        family: 'Noto Sans Arabic',
        display: 'swap',
        preload: true,
        variable: '--font-noto-sans-arabic',
      },
      {
        family: 'Noto Sans Hebrew',
        display: 'swap',
        preload: true,
        variable: '--font-noto-sans-hebrew',
      },
      {
        family: 'Noto Sans SC',
        display: 'swap',
        preload: true,
        variable: '--font-noto-sans-sc',
      },
      {
        family: 'Noto Sans TC',
        display: 'swap',
        preload: true,
        variable: '--font-noto-sans-tc',
      },
      {
        family: 'Noto Sans JP',
        display: 'swap',
        preload: true,
        variable: '--font-noto-sans-jp',
      },
      {
        family: 'Noto Sans KR',
        display: 'swap',
        preload: true,
        variable: '--font-noto-sans-kr',
      },
    ],
  };
}

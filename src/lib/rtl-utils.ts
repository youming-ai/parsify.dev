/**
 * RTL/LTR Layout Support Utilities
 * Provides utilities for handling right-to-left and left-to-right layouts
 */

export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export const LOCALES: LocaleConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇺🇸' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', dir: 'ltr', flag: '🇹🇼' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', flag: '🇰🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl', flag: '🇮🇱' },
];

/**
 * Check if a locale is RTL (Right-to-Left)
 */
export function isRTLLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Get the text direction for a locale
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
}

/**
 * Get the opposite text direction
 */
export function getOppositeDirection(dir: 'ltr' | 'rtl'): 'ltr' | 'rtl' {
  return dir === 'ltr' ? 'rtl' : 'ltr';
}

/**
 * Get locale configuration
 */
export function getLocaleConfig(locale: string): LocaleConfig | undefined {
  return LOCALES.find(config => config.code === locale);
}

/**
 * Get CSS classes for RTL support
 */
export function getRTLCssClasses(locale: string) {
  const isRTL = isRTLLocale(locale);
  return {
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'text-right' : 'text-left',
    float: isRTL ? 'float-right' : 'float-left',
    marginLeft: isRTL ? 'ml-0 mr-4' : 'ml-4 mr-0',
    paddingLeft: isRTL ? 'pl-0 pr-4' : 'pl-4 pr-0',
    borderLeft: isRTL ? 'border-l-0 border-r-4' : 'border-l-4 border-r-0',
  };
}

/**
 * Get margin/padding classes for RTL support
 */
export function getSpacingClasses(locale: string, spacing: string) {
  const isRTL = isRTLLocale(locale);
  const baseClasses = {
    'xs': { start: isRTL ? 'pr-1' : 'pl-1', end: isRTL ? 'pl-1' : 'pr-1' },
    'sm': { start: isRTL ? 'pr-2' : 'pl-2', end: isRTL ? 'pl-2' : 'pr-2' },
    'md': { start: isRTL ? 'pr-4' : 'pl-4', end: isRTL ? 'pl-4' : 'pr-4' },
    'lg': { start: isRTL ? 'pr-6' : 'pl-6', end: isRTL ? 'pl-6' : 'pr-6' },
    'xl': { start: isRTL ? 'pr-8' : 'pl-8', end: isRTL ? 'pl-8' : 'pr-8' },
  };

  return baseClasses[spacing as keyof typeof baseClasses] || baseClasses.md;
}

/**
 * Transform a URL path for RTL/LTR navigation
 */
export function transformPathForDirection(path: string, fromDir: 'ltr' | 'rtl', toDir: 'ltr' | 'rtl'): string {
  // For now, return the path as-is since we're using locale-based routing
  // In the future, this could transform direction-specific paths
  return path;
}

/**
 * Get appropriate icon for a direction
 */
export function getDirectionIcon(dir: 'ltr' | 'rtl', type: 'arrow' | 'chevron' = 'arrow') {
  if (type === 'arrow') {
    return dir === 'ltr' ? '→' : '←';
  }
  return dir === 'ltr' ? '›' : '‹';
}

/**
 * CSS-in-JS styles for RTL support
 */
export const rtlStyles = {
  // Base styles
  rtlBase: {
    direction: 'rtl' as const,
    textAlign: 'right' as const,
  },
  ltrBase: {
    direction: 'ltr' as const,
    textAlign: 'left' as const,
  },

  // Flex utilities
  rtlFlex: {
    justifyContent: 'flex-end' as const,
  },
  ltrFlex: {
    justifyContent: 'flex-start' as const,
  },

  // Position utilities
  rtlPosition: {
    left: 'auto' as const,
    right: 0,
  },
  ltrPosition: {
    left: 0,
    right: 'auto' as const,
  },
};

/**
 * Tailwind CSS utilities for RTL support
 */
export const tailwindRTLUtils = {
  // Base classes
  rtl: 'rtl',
  ltr: 'ltr',

  // Text alignment
  rtlText: 'text-right',
  ltrText: 'text-left',

  // Margins and padding
  rtlMarginStart: 'mr-4',
  ltrMarginStart: 'ml-4',
  rtlMarginEnd: 'ml-4',
  ltrMarginEnd: 'mr-4',

  // Borders
  rtlBorderStart: 'border-r-4',
  ltrBorderStart: 'border-l-4',
  rtlBorderEnd: 'border-l-4',
  ltrBorderEnd: 'border-r-4',

  // Float
  rtlFloat: 'float-right',
  ltrFloat: 'float-left',
};

/**
 * Check if browser supports RTL layout
 */
export function supportsRTLLayout(): boolean {
  // Modern browsers support RTL, but we can check for specific features
  return (
    typeof document !== 'undefined' &&
    'documentElement' in document &&
    'dir' in document.documentElement
  );
}

/**
 * Set document direction for a locale
 */
export function setDocumentDirection(locale: string) {
  if (typeof document !== 'undefined' && document.documentElement) {
    const dir = getTextDirection(locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }
}

/**
 * Get reading order for list items
 */
export function getReadingOrder(locale: string): number[] {
  // For RTL locales, some UI elements might need reverse ordering
  return isRTLLocale(locale) ? [1, 0] : [0, 1];
}

/**
 * Transform layout for RTL/LTR
 */
export function transformLayoutForDirection(
  element: HTMLElement,
  locale: string
) {
  const isRTL = isRTLLocale(locale);
  const dir = getTextDirection(locale);

  // Set direction
  element.style.direction = dir;

  // Apply RTL-specific transforms if needed
  if (isRTL) {
    element.style.textAlign = 'right';
  } else {
    element.style.textAlign = 'left';
  }

  return element;
}

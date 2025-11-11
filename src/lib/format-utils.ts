/**
 * Date, Number, and Currency Formatting Utilities for Internationalization
 * Provides locale-aware formatting for different regions
 */

import { LocaleConfig } from './rtl-utils';

// Format configurations for different locales
export const FORMAT_CONFIGS: Record<string, {
  date: Intl.DateTimeFormatOptions;
  number: Intl.NumberFormatOptions;
  currency: Intl.NumberFormatOptions;
  time: Intl.DateTimeFormatOptions;
  relativeTime: Intl.RelativeTimeFormatOptions;
}> = {
  'en': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'USD'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  },
  'zh-CN': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Shanghai'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'CNY'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  },
  'zh-TW': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Taipei'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'TWD'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Taipei'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  },
  'ja': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      era: 'long',
      timeZone: 'Asia/Tokyo'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'JPY'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Tokyo'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  },
  'ko': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'KRW'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Seoul'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  },
  'es': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Madrid'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'EUR'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Europe/Madrid'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  },
  'fr': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Paris'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'EUR'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Paris'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  },
  'de': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Berlin'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'EUR'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Berlin'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  },
  'ar': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Riyadh',
      calendar: 'islamic'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2,
      useGrouping: true
    },
    currency: {
      style: 'currency',
      currency: 'SAR'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Riyadh'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  },
  'he': {
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jerusalem',
      calendar: 'hebrew'
    },
    number: {
      style: 'decimal',
      maximumFractionDigits: 2
    },
    currency: {
      style: 'currency',
      currency: 'ILS'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Jerusalem'
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long'
    }
  }
};

/**
 * Get format configuration for a locale
 */
function getFormatConfig(locale: string) {
  return FORMAT_CONFIGS[locale] || FORMAT_CONFIGS['en'];
}

/**
 * Format a date according to locale conventions
 */
export function formatDate(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const config = getFormatConfig(locale);
  const mergedOptions = { ...config.date, ...options };

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return new Intl.DateTimeFormat(locale, mergedOptions).format(dateObj);
  } catch (error) {
    console.warn(`Date formatting error for locale ${locale}:`, error);
    return String(date);
  }
}

/**
 * Format time according to locale conventions
 */
export function formatTime(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const config = getFormatConfig(locale);
  const mergedOptions = { ...config.time, ...options };

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return new Intl.DateTimeFormat(locale, mergedOptions).format(dateObj);
  } catch (error) {
    console.warn(`Time formatting error for locale ${locale}:`, error);
    return String(date);
  }
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const config = getFormatConfig(locale);
  const mergedOptions = {
    ...config.date,
    ...config.time,
    ...options
  };

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return new Intl.DateTimeFormat(locale, mergedOptions).format(dateObj);
  } catch (error) {
    console.warn(`DateTime formatting error for locale ${locale}:`, error);
    return String(date);
  }
}

/**
 * Format a number according to locale conventions
 */
export function formatNumber(
  number: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  const config = getFormatConfig(locale);
  const mergedOptions = { ...config.number, ...options };

  try {
    return new Intl.NumberFormat(locale, mergedOptions).format(number);
  } catch (error) {
    console.warn(`Number formatting error for locale ${locale}:`, error);
    return String(number);
  }
}

/**
 * Format currency according to locale conventions
 */
export function formatCurrency(
  amount: number,
  locale: string,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string {
  const config = getFormatConfig(locale);
  const currencyCode = currency || config.currency.currency;
  const mergedOptions = {
    ...config.currency,
    currency: currencyCode,
    ...options
  };

  try {
    return new Intl.NumberFormat(locale, mergedOptions).format(amount);
  } catch (error) {
    console.warn(`Currency formatting error for locale ${locale}:`, error);
    return `${currencyCode} ${amount}`;
  }
}

/**
 * Format percentage according to locale conventions
 */
export function formatPercentage(
  number: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      maximumFractionDigits: 2,
      ...options
    }).format(number);
  } catch (error) {
    console.warn(`Percentage formatting error for locale ${locale}:`, error);
    return `${(number * 100).toFixed(2)}%`;
  }
}

/**
 * Format file size according to locale conventions
 */
export function formatFileSize(
  bytes: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formattedSize = formatNumber(size, locale, {
    maximumFractionDigits: unitIndex === 0 ? 0 : 2,
    ...options
  });

  return `${formattedSize} ${units[unitIndex]}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string,
  options?: Intl.RelativeTimeFormatOptions
): string {
  const config = getFormatConfig(locale);
  const mergedOptions = { ...config.relativeTime, ...options };

  try {
    return new Intl.RelativeTimeFormat(locale, mergedOptions).format(value, unit);
  } catch (error) {
    console.warn(`Relative time formatting error for locale ${locale}:`, error);
    return `${value} ${unit}${value !== 1 ? 's' : ''}`;
  }
}

/**
 * Format a duration in seconds to a human-readable format
 */
export function formatDuration(
  seconds: number,
  locale: string,
  options?: { showSeconds?: boolean; compact?: boolean }
): string {
  const { showSeconds = true, compact = false } = options || {};

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`);
  }

  if (showSeconds && (remainingSeconds > 0 || parts.length === 0)) {
    parts.push(`${remainingSeconds}s`);
  }

  return compact ? parts.join('') : parts.join(' ');
}

/**
 * Format a list of items according to locale conventions
 */
export function formatList(
  items: string[],
  locale: string,
  options?: Intl.ListFormatOptions
): string {
  try {
    return new Intl.ListFormat(locale, {
      style: 'long',
      type: 'conjunction',
      ...options
    }).format(items);
  } catch (error) {
    console.warn(`List formatting error for locale ${locale}:`, error);
    return items.join(', ');
  }
}

/**
 * Format an address according to locale conventions
 */
export function formatAddress(
  address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  },
  locale: string
): string {
  const config = getFormatConfig(locale);

  // This is a simplified address formatting
  // In a real application, you'd want more sophisticated address formatting
  const parts: string[] = [];

  if (address.street) parts.push(address.street);
  if (address.city && address.state) {
    parts.push(`${address.city}, ${address.state}`);
  } else if (address.city) {
    parts.push(address.city);
  }
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);

  return parts.join('\n');
}

/**
 * Get currency symbol for a locale
 */
export function getCurrencySymbol(locale: string, currency?: string): string {
  try {
    const config = getFormatConfig(locale);
    const currencyCode = currency || config.currency.currency;

    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    const parts = formatter.formatToParts(1);
    const symbolPart = parts.find(part => part.type === 'currency');

    return symbolPart?.value || currencyCode || '$';
  } catch (error) {
    console.warn(`Currency symbol error for locale ${locale}:`, error);
    return currency || '$';
  }
}

/**
 * Get decimal separator for a locale
 */
export function getDecimalSeparator(locale: string): string {
  try {
    const formatter = new Intl.NumberFormat(locale);
    const parts = formatter.formatToParts(1.1);
    const decimalPart = parts.find(part => part.type === 'decimal');

    return decimalPart?.value || '.';
  } catch (error) {
    console.warn(`Decimal separator error for locale ${locale}:`, error);
    return '.';
  }
}

/**
 * Get thousands separator for a locale
 */
export function getThousandsSeparator(locale: string): string {
  try {
    const formatter = new Intl.NumberFormat(locale);
    const parts = formatter.formatToParts(1111);
    const groupPart = parts.find(part => part.type === 'group');

    return groupPart?.value || ',';
  } catch (error) {
    console.warn(`Thousands separator error for locale ${locale}:`, error);
    return ',';
  }
}

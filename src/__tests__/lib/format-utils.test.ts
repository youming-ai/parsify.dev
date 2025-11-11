import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatFileSize,
  formatRelativeTime,
  formatDuration,
  formatList,
  getCurrencySymbol,
  getDecimalSeparator,
  getThousandsSeparator,
} from '@/lib/format-utils';

describe('Format Utils', () => {
  const testDate = new Date('2024-03-15T14:30:00Z');

  describe('formatDate', () => {
    it('should format date correctly for English', () => {
      const result = formatDate(testDate, 'en');
      expect(result).toMatch(/March 15, 2024/);
    });

    it('should format date correctly for Chinese Simplified', () => {
      const result = formatDate(testDate, 'zh-CN');
      expect(result).toMatch(/2024年3月15日/);
    });

    it('should format date correctly for Arabic', () => {
      const result = formatDate(testDate, 'ar');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle string dates', () => {
      const result = formatDate('2024-03-15', 'en');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return string on error', () => {
      const result = formatDate('invalid-date', 'en');
      expect(typeof result).toBe('string');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly for English', () => {
      const result = formatTime(testDate, 'en');
      expect(result).toMatch(/2:30/);
    });

    it('should format time correctly for Japanese (24-hour)', () => {
      const result = formatTime(testDate, 'ja');
      expect(result).toMatch(/14:30/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const result = formatDateTime(testDate, 'en');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatNumber', () => {
    it('should format basic numbers correctly', () => {
      expect(formatNumber(1234.56, 'en')).toBe('1,234.56');
      expect(formatNumber(1234.56, 'de')).toBe('1.234,56');
    });

    it('should handle integers', () => {
      expect(formatNumber(1000, 'en')).toBe('1,000');
    });

    it('should handle decimals', () => {
      expect(formatNumber(3.14159, 'en')).toBe('3.14');
    });

    it('should accept custom options', () => {
      const result = formatNumber(1234.56, 'en', { minimumFractionDigits: 0 });
      expect(result).toBe('1,235');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56, 'en', 'USD')).toMatch(/\$1,234\.56/);
    });

    it('should format EUR correctly', () => {
      const result = formatCurrency(1234.56, 'de', 'EUR');
      expect(result).toMatch(/1\.234,56\s*€/);
    });

    it('should format JPY correctly (no decimals)', () => {
      expect(formatCurrency(1234.56, 'ja', 'JPY')).toMatch(/¥1,235/);
    });

    it('should use default currency for locale', () => {
      const result = formatCurrency(100, 'en');
      expect(result).toMatch(/\$100/);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.25, 'en')).toBe('25%');
      expect(formatPercentage(0.1234, 'en')).toBe('12.34%');
    });

    it('should handle whole numbers', () => {
      expect(formatPercentage(1, 'en')).toBe('100%');
      expect(formatPercentage(0, 'en')).toBe('0%');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0, 'en')).toBe('0 B');
      expect(formatFileSize(1024, 'en')).toBe('1 KB');
      expect(formatFileSize(1536, 'en')).toBe('1.5 KB');
      expect(formatFileSize(1048576, 'en')).toBe('1 MB');
    });

    it('should handle large file sizes', () => {
      expect(formatFileSize(1073741824, 'en')).toBe('1 GB');
      expect(formatFileSize(1099511627776, 'en')).toBe('1 TB');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time correctly', () => {
      const result = formatRelativeTime(-2, 'hours', 'en');
      expect(result).toMatch(/2 hours ago/);
    });

    it('should format future time correctly', () => {
      const result = formatRelativeTime(3, 'days', 'en');
      expect(result).toMatch(/in 3 days/);
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(3661, 'en')).toBe('1h 1m 1s');
      expect(formatDuration(90, 'en')).toBe('1m 30s');
      expect(formatDuration(45, 'en')).toBe('45s');
    });

    it('should format compact duration', () => {
      expect(formatDuration(3661, 'en', { compact: true })).toBe('1h1m1s');
    });

    it('should hide seconds when requested', () => {
      expect(formatDuration(3661, 'en', { showSeconds: false })).toBe('1h 1m');
    });
  });

  describe('formatList', () => {
    it('should format lists correctly for English', () => {
      const result = formatList(['apples', 'oranges', 'bananas'], 'en');
      expect(result).toBe('apples, oranges, and bananas');
    });

    it('should handle two items', () => {
      const result = formatList(['apples', 'oranges'], 'en');
      expect(result).toBe('apples and oranges');
    });

    it('should handle single item', () => {
      const result = formatList(['apples'], 'en');
      expect(result).toBe('apples');
    });

    it('should return comma-separated on error', () => {
      const result = formatList(['apples', 'oranges', 'bananas'], 'invalid-locale');
      expect(result).toBe('apples, oranges, bananas');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbols', () => {
      expect(getCurrencySymbol('en', 'USD')).toBe('$');
      expect(getCurrencySymbol('en', 'EUR')).toBe('€');
      expect(getCurrencySymbol('ja', 'JPY')).toBe('￥');
    });

    it('should use default currency for locale', () => {
      expect(getCurrencySymbol('en')).toBe('$');
      expect(getCurrencySymbol('ja')).toBe('￥');
    });

    it('should return currency code on error', () => {
      expect(getCurrencySymbol('invalid', 'XYZ')).toBe('XYZ');
    });
  });

  describe('getDecimalSeparator', () => {
    it('should return correct separators', () => {
      expect(getDecimalSeparator('en')).toBe('.');
      expect(getDecimalSeparator('de')).toBe(',');
    });

    it('should return default separator on error', () => {
      expect(getDecimalSeparator('invalid')).toBe('.');
    });
  });

  describe('getThousandsSeparator', () => {
    it('should return correct separators', () => {
      expect(getThousandsSeparator('en')).toBe(',');
      expect(getThousandsSeparator('de')).toBe('.');
    });

    it('should return default separator on error', () => {
      expect(getThousandsSeparator('invalid')).toBe(',');
    });
  });
});

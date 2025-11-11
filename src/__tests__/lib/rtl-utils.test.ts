import { describe, it, expect } from 'vitest';
import {
  isRTLLocale,
  getTextDirection,
  getLocaleConfig,
  getRTLCssClasses,
  getSpacingClasses,
  getDirectionIcon,
  supportsRTLLayout,
  setDocumentDirection,
  RTL_LOCALES,
  LOCALES,
} from '@/lib/rtl-utils';

// Mock document for testing
const mockDocument = {
  documentElement: {
    dir: '',
    lang: '',
  },
};

// Mock global document
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

describe('RTL Utils', () => {
  describe('isRTLLocale', () => {
    it('should return true for RTL locales', () => {
      expect(isRTLLocale('ar')).toBe(true);
      expect(isRTLLocale('he')).toBe(true);
      expect(isRTLLocale('fa')).toBe(true);
      expect(isRTLLocale('ur')).toBe(true);
    });

    it('should return false for LTR locales', () => {
      expect(isRTLLocale('en')).toBe(false);
      expect(isRTLLocale('zh-CN')).toBe(false);
      expect(isRTLLocale('ja')).toBe(false);
      expect(isRTLLocale('ko')).toBe(false);
    });
  });

  describe('getTextDirection', () => {
    it('should return rtl for RTL locales', () => {
      expect(getTextDirection('ar')).toBe('rtl');
      expect(getTextDirection('he')).toBe('rtl');
    });

    it('should return ltr for LTR locales', () => {
      expect(getTextDirection('en')).toBe('ltr');
      expect(getTextDirection('zh-CN')).toBe('ltr');
      expect(getTextDirection('ja')).toBe('ltr');
    });
  });

  describe('getLocaleConfig', () => {
    it('should return correct configuration for supported locales', () => {
      const enConfig = getLocaleConfig('en');
      expect(enConfig).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English',
        dir: 'ltr',
        flag: '🇺🇸',
      });

      const arConfig = getLocaleConfig('ar');
      expect(arConfig).toEqual({
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        dir: 'rtl',
        flag: '🇸🇦',
      });
    });

    it('should return undefined for unsupported locales', () => {
      expect(getLocaleConfig('invalid')).toBeUndefined();
    });
  });

  describe('getRTLCssClasses', () => {
    it('should return LTR classes for LTR locales', () => {
      const ltrClasses = getRTLCssClasses('en');
      expect(ltrClasses).toEqual({
        direction: 'ltr',
        textAlign: 'text-left',
        float: 'float-left',
        marginLeft: 'ml-4 mr-0',
        paddingLeft: 'pl-4 pr-0',
        borderLeft: 'border-l-4 border-r-0',
      });
    });

    it('should return RTL classes for RTL locales', () => {
      const rtlClasses = getRTLCssClasses('ar');
      expect(rtlClasses).toEqual({
        direction: 'rtl',
        textAlign: 'text-right',
        float: 'float-right',
        marginLeft: 'ml-0 mr-4',
        paddingLeft: 'pl-0 pr-4',
        borderLeft: 'border-l-0 border-r-4',
      });
    });
  });

  describe('getSpacingClasses', () => {
    it('should return correct spacing classes for LTR', () => {
      const ltrSpacing = getSpacingClasses('en', 'md');
      expect(ltrSpacing).toEqual({
        start: 'pl-4',
        end: 'pr-4',
      });
    });

    it('should return correct spacing classes for RTL', () => {
      const rtlSpacing = getSpacingClasses('ar', 'md');
      expect(rtlSpacing).toEqual({
        start: 'pr-4',
        end: 'pl-4',
      });
    });

    it('should handle different spacing sizes', () => {
      const smallSpacing = getSpacingClasses('en', 'sm');
      expect(smallSpacing).toEqual({
        start: 'pl-2',
        end: 'pr-2',
      });

      const largeSpacing = getSpacingClasses('en', 'lg');
      expect(largeSpacing).toEqual({
        start: 'pl-6',
        end: 'pr-6',
      });
    });
  });

  describe('getDirectionIcon', () => {
    it('should return right arrow for LTR', () => {
      expect(getDirectionIcon('ltr')).toBe('→');
      expect(getDirectionIcon('ltr', 'chevron')).toBe('›');
    });

    it('should return left arrow for RTL', () => {
      expect(getDirectionIcon('rtl')).toBe('←');
      expect(getDirectionIcon('rtl', 'chevron')).toBe('‹');
    });
  });

  describe('supportsRTLLayout', () => {
    it('should return true when document is available', () => {
      expect(supportsRTLLayout()).toBe(true);
    });
  });

  describe('setDocumentDirection', () => {
    beforeEach(() => {
      mockDocument.documentElement.dir = '';
      mockDocument.documentElement.lang = '';
    });

    it('should set document direction for RTL locale', () => {
      setDocumentDirection('ar');
      expect(mockDocument.documentElement.dir).toBe('rtl');
      expect(mockDocument.documentElement.lang).toBe('ar');
    });

    it('should set document direction for LTR locale', () => {
      setDocumentDirection('en');
      expect(mockDocument.documentElement.dir).toBe('ltr');
      expect(mockDocument.documentElement.lang).toBe('en');
    });

    it('should not throw when document is undefined', () => {
      const originalDocument = global.document;
      delete (global as any).document;

      expect(() => setDocumentDirection('ar')).not.toThrow();

      global.document = originalDocument;
    });
  });

  describe('Constants', () => {
    it('should have correct RTL locales', () => {
      expect(RTL_LOCALES).toEqual(['ar', 'he', 'fa', 'ur']);
    });

    it('should have all locale configurations', () => {
      expect(LOCALES).toHaveLength(10);
      expect(LOCALES.map(l => l.code)).toContain('en');
      expect(LOCALES.map(l => l.code)).toContain('zh-CN');
      expect(LOCALES.map(l => l.code)).toContain('ar');
      expect(LOCALES.map(l => l.code)).toContain('he');
    });

    it('should have consistent locale data', () => {
      LOCALES.forEach(locale => {
        expect(locale).toHaveProperty('code');
        expect(locale).toHaveProperty('name');
        expect(locale).toHaveProperty('nativeName');
        expect(locale).toHaveProperty('dir');
        expect(locale).toHaveProperty('flag');
        expect(['ltr', 'rtl']).toContain(locale.dir);
      });
    });
  });
});

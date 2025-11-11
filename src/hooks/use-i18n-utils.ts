'use client';

import { useLocale } from 'next-intl';
import { useCallback } from 'react';
import {
  isRTLLocale,
  getTextDirection,
  getLocaleConfig,
  getSpacingClasses,
  getRTLCssClasses,
  setDocumentDirection
} from '@/lib/rtl-utils';

/**
 * Hook for internationalization utilities
 */
export function useI18nUtils() {
  const locale = useLocale();

  // Set document direction on locale change
  React.useEffect(() => {
    setDocumentDirection(locale);
  }, [locale]);

  // Text direction utilities
  const isRTL = useCallback(() => isRTLLocale(locale), [locale]);
  const textDirection = useCallback(() => getTextDirection(locale), [locale]);
  const isLTR = useCallback(() => !isRTLLocale(locale), [locale]);

  // Locale configuration
  const localeConfig = useCallback(() => getLocaleConfig(locale), [locale]);

  // CSS classes
  const rtlClasses = useCallback(() => getRTLCssClasses(locale), [locale]);
  const spacing = useCallback((size: string) => getSpacingClasses(locale, size), [locale]);

  // Conditional classes
  const conditionalClass = useCallback((ltrClass: string, rtlClass: string) => {
    return isRTL() ? rtlClass : ltrClass;
  }, [isRTL]);

  // CSS-in-JS styles
  const directionStyles = useCallback(() => ({
    direction: textDirection(),
  }), [textDirection]);

  // Logical positioning
  const logicalPosition = useCallback((start: number | string, end?: number | string) => {
    if (isRTL()) {
      return {
        left: end || 'auto',
        right: start
      };
    }
    return {
      left: start,
      right: end || 'auto'
    };
  }, [isRTL]);

  // Logical margins
  const logicalMargin = useCallback((start: number | string, end?: number | string) => {
    if (isRTL()) {
      return {
        marginLeft: end || 0,
        marginRight: start
      };
    }
    return {
      marginLeft: start,
      marginRight: end || 0
    };
  }, [isRTL]);

  // Logical padding
  const logicalPadding = useCallback((start: number | string, end?: number | string) => {
    if (isRTL()) {
      return {
        paddingLeft: end || 0,
        paddingRight: start
      };
    }
    return {
      paddingLeft: start,
      paddingRight: end || 0
    };
  }, [isRTL]);

  // Border utilities
  const logicalBorder = useCallback((startWidth: number | string, endWidth?: number | string) => {
    if (isRTL()) {
      return {
        borderLeftWidth: endWidth || 0,
        borderRightWidth: startWidth
      };
    }
    return {
      borderLeftWidth: startWidth,
      borderRightWidth: endWidth || 0
    };
  }, [isRTL]);

  // Arrow icon direction
  const getArrowIcon = useCallback(() => {
    return isRTL() ? '←' : '→';
  }, [isRTL]);

  // Reading order for lists
  const getReadingOrder = useCallback(() => {
    return isRTL() ? [1, 0] : [0, 1];
  }, [isRTL]);

  return {
    // Locale information
    locale,
    isRTL,
    isLTR,
    textDirection,
    localeConfig,

    // CSS utilities
    rtlClasses,
    spacing,
    conditionalClass,
    directionStyles,

    // Logical properties
    logicalPosition,
    logicalMargin,
    logicalPadding,
    logicalBorder,

    // UI helpers
    getArrowIcon,
    getReadingOrder,
  };
}

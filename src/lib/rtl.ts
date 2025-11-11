/**
 * RTL (Right-to-Left) layout utilities for internationalization
 */

// List of RTL languages
export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur', 'yi'];

/**
 * Check if a locale is RTL
 */
export function isRTL(locale?: string): boolean {
  if (!locale) return false;
  return RTL_LOCALES.includes(locale);
}

/**
 * Get text direction for a locale
 */
export function getTextDirection(locale?: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get margin and padding utilities for RTL support
 */
export function getRTLMargins(locale?: string) {
  const isRTLDirection = isRTL(locale);

  return {
    // Margin utilities
    mlAuto: isRTLDirection ? 'mr-auto' : 'ml-auto',
    mrAuto: isRTLDirection ? 'ml-auto' : 'mr-auto',

    // Padding utilities
    plAuto: isRTLDirection ? 'pr-auto' : 'pl-auto',
    prAuto: isRTLDirection ? 'pl-auto' : 'pr-auto',

    // Margin for positioning
    left: isRTLDirection ? 'right' : 'left',
    right: isRTLDirection ? 'left' : 'right',
  };
}

/**
 * Get flex utilities for RTL support
 */
export function getRTLFlex(locale?: string) {
  const isRTLDirection = isRTL(locale);

  return {
    justifyContent: {
      start: isRTLDirection ? 'justify-end' : 'justify-start',
      end: isRTLDirection ? 'justify-start' : 'justify-end',
    },
    textAlign: {
      left: isRTLDirection ? 'text-right' : 'text-left',
      right: isRTLDirection ? 'text-left' : 'text-right',
    },
  };
}

/**
 * Transform CSS properties for RTL
 */
export function transformForRTL(
  properties: Record<string, any>,
  locale?: string
): Record<string, any> {
  if (!isRTL(locale)) {
    return properties;
  }

  const transformed: Record<string, any> = { ...properties };

  // Transform directional properties
  const propertyMap: Record<string, string> = {
    marginLeft: 'marginRight',
    marginRight: 'marginLeft',
    paddingLeft: 'paddingRight',
    paddingRight: 'paddingLeft',
    borderLeft: 'borderRight',
    borderRight: 'borderLeft',
    borderLeftWidth: 'borderRightWidth',
    borderRightWidth: 'borderLeftWidth',
    borderLeftColor: 'borderRightColor',
    borderRightColor: 'borderLeftColor',
    borderLeftStyle: 'borderRightStyle',
    borderRightStyle: 'borderLeftStyle',
    textAlign: 'textAlign',
    float: 'float',
  };

  Object.keys(transformed).forEach((key) => {
    if (propertyMap[key]) {
      const newKey = propertyMap[key];

      // Special handling for text alignment
      if (key === 'textAlign' || key === 'float') {
        const value = transformed[key];
        if (value === 'left') {
          transformed[newKey] = 'right';
        } else if (value === 'right') {
          transformed[newKey] = 'left';
        }
      } else {
        transformed[newKey] = transformed[key];
      }

      delete transformed[key];
    }
  });

  return transformed;
}

/**
 * Get Tailwind CSS classes for RTL support
 */
export function getRTLClasses(locale?: string) {
  const isRTLDirection = isRTL(locale);

  return {
    base: isRTLDirection ? 'rtl' : 'ltr',
    text: isRTLDirection ? 'text-right' : 'text-left',
    start: isRTLDirection ? 'right' : 'left',
    end: isRTLDirection ? 'left' : 'right',
    // Flex utilities
    flexStart: isRTLDirection ? 'justify-end' : 'justify-start',
    flexEnd: isRTLDirection ? 'justify-start' : 'justify-end',
    // Margin utilities
    marginStart: isRTLDirection ? 'mr' : 'ml',
    marginEnd: isRTLDirection ? 'ml' : 'mr',
    // Padding utilities
    paddingStart: isRTLDirection ? 'pr' : 'pl',
    paddingEnd: isRTLDirection ? 'pl' : 'pr',
    // Border utilities
    borderStart: isRTLDirection ? 'border-r' : 'border-l',
    borderEnd: isRTLDirection ? 'border-l' : 'border-r',
    // Float utilities
    floatStart: isRTLDirection ? 'float-right' : 'float-left',
    floatEnd: isRTLDirection ? 'float-left' : 'float-right',
  };
}

/**
 * Hook to get RTL utilities
 */
export function useRTL(locale?: string) {
  const isRTLDirection = isRTL(locale);
  const direction = getTextDirection(locale);
  const margins = getRTLMargins(locale);
  const flex = getRTLFlex(locale);
  const classes = getRTLClasses(locale);

  return {
    isRTL: isRTLDirection,
    direction,
    margins,
    flex,
    classes,
    transform: (properties: Record<string, any>) => transformForRTL(properties, locale),
  };
}

/**
 * Responsive layout hooks for mobile optimization
 */

import { useState, useEffect, useCallback } from 'react';
import { MobileUtils, useMobileUtils } from '@/lib/mobile-utils';

export interface ResponsiveLayoutConfig {
  breakpoints?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  containerPadding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  gridColumns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  itemSpacing?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export const defaultLayoutConfig: ResponsiveLayoutConfig = {
  breakpoints: {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  containerPadding: {
    mobile: '1rem',
    tablet: '1.5rem',
    desktop: '2rem',
  },
  gridColumns: {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  },
  itemSpacing: {
    mobile: '0.75rem',
    tablet: '1rem',
    desktop: '1rem',
  },
};

export function useResponsiveLayout(config: ResponsiveLayoutConfig = {}) {
  const finalConfig = { ...defaultLayoutConfig, ...config };
  const mobileUtils = useMobileUtils();

  const [layoutState, setLayoutState] = useState({
    containerWidth: 0,
    itemWidth: 0,
    columns: finalConfig.gridColumns?.desktop || 4,
    padding: finalConfig.containerPadding?.desktop || '2rem',
    spacing: finalConfig.itemSpacing?.desktop || '1rem',
    shouldUseMobileLayout: false,
  });

  const calculateLayout = useCallback(() => {
    const width = window.innerWidth;
    const deviceType = MobileUtils.getDeviceType();

    let columns = finalConfig.gridColumns?.desktop || 4;
    let padding = finalConfig.containerPadding?.desktop || '2rem';
    let spacing = finalConfig.itemSpacing?.desktop || '1rem';

    switch (deviceType) {
      case 'mobile':
        columns = finalConfig.gridColumns?.mobile || 1;
        padding = finalConfig.containerPadding?.mobile || '1rem';
        spacing = finalConfig.itemSpacing?.mobile || '0.75rem';
        break;
      case 'tablet':
        columns = finalConfig.gridColumns?.tablet || 2;
        padding = finalConfig.containerPadding?.tablet || '1.5rem';
        spacing = finalConfig.itemSpacing?.tablet || '1rem';
        break;
    }

    // Calculate actual container width (viewport width minus padding)
    const paddingNum = parseFloat(padding) * 16; // Convert rem to px
    const containerWidth = width - (paddingNum * 2);

    // Calculate item width based on columns and spacing
    const spacingNum = parseFloat(spacing) * 16;
    const totalSpacing = spacingNum * (columns - 1);
    const itemWidth = (containerWidth - totalSpacing) / columns;

    setLayoutState({
      containerWidth,
      itemWidth,
      columns,
      padding,
      spacing,
      shouldUseMobileLayout: deviceType === 'mobile',
    });
  }, [finalConfig]);

  useEffect(() => {
    calculateLayout();

    const debouncedResize = MobileUtils.debounceResize(calculateLayout);
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', calculateLayout);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', calculateLayout);
    };
  }, [calculateLayout]);

  return {
    ...layoutState,
    ...mobileUtils,
    layoutConfig: finalConfig,
    recalculate: calculateLayout,
  };
}

export function useResponsiveValue<T>(values: Partial<Record<ReturnType<typeof MobileUtils.getDeviceType>, T>>, defaultValue: T): T {
  const mobileUtils = useMobileUtils();

  return values[mobileUtils.deviceType] ?? defaultValue;
}

export function useBreakpointValue<T>(values: Partial<Record<ReturnType<typeof MobileUtils.getBreakpoint>, T>>, defaultValue: T): T {
  const mobileUtils = useMobileUtils();

  return values[mobileUtils.breakpoint] ?? defaultValue;
}

export function useResponsiveGrid(config: {
  minItemWidth?: number;
  maxColumns?: number;
  gap?: string;
  containerPadding?: string;
} = {}) {
  const { minItemWidth = 280, maxColumns = 4, gap = '1rem', containerPadding = '1rem' } = config;
  const [gridState, setGridState] = useState({
    columns: 1,
    itemWidth: 0,
  });

  const calculateGrid = useCallback(() => {
    const width = window.innerWidth;
    const paddingNum = parseFloat(containerPadding) * 16;
    const gapNum = parseFloat(gap) * 16;

    const availableWidth = width - (paddingNum * 2);
    let columns = Math.floor(availableWidth / (minItemWidth + gapNum));
    columns = Math.max(1, Math.min(columns, maxColumns));

    const totalGap = gapNum * (columns - 1);
    const itemWidth = (availableWidth - totalGap) / columns;

    setGridState({ columns, itemWidth });
  }, [minItemWidth, maxColumns, gap, containerPadding]);

  useEffect(() => {
    calculateGrid();

    const debouncedResize = MobileUtils.debounceResize(calculateGrid);
    window.addEventListener('resize', debouncedResize);

    return () => window.removeEventListener('resize', debouncedResize);
  }, [calculateGrid]);

  return gridState;
}

export function useInfiniteScroll(config: {
  threshold?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
} = {}) {
  const { threshold = 100, hasMore = false, onLoadMore } = config;
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    const target = document.querySelector('[data-infinite-scroll-trigger]');
    if (target) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, [threshold, hasMore, onLoadMore]);

  return { isIntersecting };
}

export function useViewportSize() {
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const debouncedUpdate = MobileUtils.debounceResize(updateSize);
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', updateSize);

    updateSize();

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  return viewportSize;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

// Common media query hooks
export function useIsMobile() {
  return useMediaQuery('(max-width: 640px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1025px)');
}

export function useIsPortrait() {
  return useMediaQuery('(orientation: portrait)');
}

export function useIsLandscape() {
  return useMediaQuery('(orientation: landscape)');
}

export function usePrefersDark() {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function useHover() {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    // On touch devices, hover should behave differently
    if (MobileUtils.isTouchDevice()) {
      setIsHovered(false);
      return;
    }

    // Add global listeners to detect hover state changes
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
    };
  }, []);

  return isHovered;
}

export function useTouchFeedback() {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  return {
    isPressed,
    touchProps: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  };
}

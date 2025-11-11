'use client';

import { useEffect, ReactNode, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MobileUtils, MobilePerformanceOptimizer, TouchGestureHandler } from '@/lib/mobile-utils';
import { useResponsiveLayout, useIsMobile, useIsTouchDevice } from '@/hooks/use-responsive-layout';

interface ResponsiveLayoutWrapperProps {
  children: ReactNode;
  className?: string;
  enablePerformanceOptimizations?: boolean;
  enableTouchGestures?: boolean;
  maxContainerWidth?: string;
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export function ResponsiveLayoutWrapper({
  children,
  className,
  enablePerformanceOptimizations = true,
  enableTouchGestures = true,
  maxContainerWidth = '100%',
  padding,
}: ResponsiveLayoutWrapperProps) {
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const { shouldUseMobileLayout, containerWidth, getOptimalTouchTargetSize } = useResponsiveLayout({
    containerPadding: padding,
  });

  // Performance optimizations for mobile
  useEffect(() => {
    if (!enablePerformanceOptimizations || typeof window === 'undefined') return;

    // Optimize scrolling performance
    MobilePerformanceOptimizer.optimizeScrolling();

    // Lazy load images
    MobilePerformanceOptimizer.lazyLoadImages();

    // Preload critical resources
    if (isMobile) {
      const criticalResources = [
        '/fonts/inter-var.woff2',
        '/icons/material-symbols-rounded.woff2',
      ];
      MobilePerformanceOptimizer.preloadCriticalResources(criticalResources);
    }

    // Add safe area support for notched devices
    if (MobileUtils.hasNotch()) {
      document.documentElement.style.setProperty(
        '--safe-area-top',
        `env(safe-area-inset-top, 0px)`
      );
      document.documentElement.style.setProperty(
        '--safe-area-bottom',
        `env(safe-area-inset-bottom, 0px)`
      );
    }

    // Optimize for reduced motion
    if (MobileUtils.prefersReducedMotion()) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Network-aware optimizations
    if (MobileUtils.isSlowNetwork()) {
      document.documentElement.classList.add('slow-network');
    }

    return () => {
      // Cleanup optimizations
      document.documentElement.classList.remove('reduce-motion', 'slow-network');
    };
  }, [enablePerformanceOptimizations, isMobile]);

  // Touch gesture setup
  useEffect(() => {
    if (!enableTouchGestures || !isTouchDevice || typeof window === 'undefined') return;

    const gestureHandler = new TouchGestureHandler({
      touchThreshold: 10,
      swipeThreshold: 50,
      longPressDelay: 500,
    });

    // Setup swipe navigation for mobile
    gestureHandler.on('swipeLeft', (gesture) => {
      // Navigate to next page or section
      const navigationEvent = new CustomEvent('mobileSwipe', {
        detail: { direction: 'left', target: gesture.target }
      });
      window.dispatchEvent(navigationEvent);
    });

    gestureHandler.on('swipeRight', (gesture) => {
      // Navigate to previous page or section
      const navigationEvent = new CustomEvent('mobileSwipe', {
        detail: { direction: 'right', target: gesture.target }
      });
      window.dispatchEvent(navigationEvent);
    });

    // Attach to main content area
    const mainContent = document.querySelector('main');
    if (mainContent) {
      gestureHandler.attach(mainContent);
    }

    return () => {
      if (mainContent) {
        gestureHandler.detach(mainContent);
      }
    };
  }, [enableTouchGestures, isTouchDevice]);

  // Responsive container styles
  const containerStyles = useMemo(() => {
    const baseStyles = {
      maxWidth: maxContainerWidth,
      margin: '0 auto',
      transition: 'all 0.3s ease-in-out',
    };

    if (isMobile) {
      return {
        ...baseStyles,
        paddingLeft: padding?.mobile || '1rem',
        paddingRight: padding?.mobile || '1rem',
      };
    }

    return baseStyles;
  }, [isMobile, maxContainerWidth, padding]);

  // Touch-friendly interaction classes
  const touchClasses = useMemo(() => {
    if (!isTouchDevice) return '';

    return cn(
      'touch-manipulation',
      MobileUtils.isMobile() && 'mobile-touch-optimized',
      shouldUseMobileLayout && 'mobile-layout'
    );
  }, [isTouchDevice, isMobile, shouldUseMobileLayout]);

  return (
    <div
      className={cn(
        'responsive-layout-wrapper',
        touchClasses,
        className
      )}
      style={containerStyles}
      data-device-type={MobileUtils.getDeviceType()}
      data-breakpoint={MobileUtils.getBreakpoint()}
      data-touch-device={isTouchDevice}
      data-orientation={MobileUtils.isPortrait() ? 'portrait' : 'landscape'}
    >
      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="fixed top-0 left-0 bg-red-500 text-white text-xs px-2 py-1 z-50 lg:hidden"
          style={{
            display: isMobile ? 'block' : 'none',
          }}
        >
          Mobile: {containerWidth}px | {MobileUtils.getBreakpoint()}
        </div>
      )}

      {/* Safe area support for notched devices */}
      <div
        className="safe-area-container"
        style={{
          paddingTop: 'var(--safe-area-top, 0px)',
          paddingBottom: 'var(--safe-area-bottom, 0px)',
        }}
      >
        {children}
      </div>

      {/* Mobile-specific optimizations */}
      {isMobile && (
        <>
          {/* Viewport height fix for mobile browsers */}
          <style jsx>{`
            @supports (-webkit-touch-callout: none) {
              .mobile-layout {
                height: -webkit-fill-available;
              }
            }

            .reduce-motion * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }

            .slow-network img {
              content-visibility: auto;
              contain-intrinsic-size: 400px 300px;
            }
          `}</style>

          {/* Touch feedback styles */}
          <style jsx>{`
            .mobile-touch-optimized {
              -webkit-tap-highlight-color: transparent;
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              user-select: none;
            }

            .mobile-touch-optimized *:active {
              transform: scale(0.95);
              transition: transform 0.1s ease;
            }

            .mobile-touch-optimized input,
            .mobile-touch-optimized textarea,
            .mobile-touch-optimized [contenteditable] {
              -webkit-user-select: text;
              user-select: text;
            }
          `}</style>
        </>
      )}
    </div>
  );
}

// Grid component with responsive behavior
interface ResponsiveGridProps {
  children: ReactNode;
  minItemWidth?: number;
  maxColumns?: number;
  gap?: string;
  className?: string;
}

export function ResponsiveGrid({
  children,
  minItemWidth = 280,
  maxColumns = 4,
  gap = '1rem',
  className,
}: ResponsiveGridProps) {
  const { columns } = useResponsiveLayout({
    gridColumns: {
      mobile: 1,
      tablet: 2,
      desktop: maxColumns,
    },
  });

  return (
    <div
      className={cn(
        'responsive-grid',
        'grid',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
      }}
      data-columns={columns}
    >
      {children}
    </div>
  );
}

// Card component with mobile optimizations
interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
}

export function ResponsiveCard({
  children,
  className,
  onClick,
  as: Component = 'div',
  ...props
}: ResponsiveCardProps) {
  const { isMobile } = useResponsiveLayout();
  const { getOptimalTouchTargetSize } = useResponsiveLayout();

  return (
    <Component
      className={cn(
        'responsive-card',
        'bg-white dark:bg-gray-800',
        'rounded-lg',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        'border border-gray-200 dark:border-gray-700',
        isMobile && 'touch-manipulation active:scale-95',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={
        onClick
          ? {
              minHeight: `${getOptimalTouchTargetSize().height}px`,
              WebkitTapHighlightColor: 'transparent',
            }
          : undefined
      }
      {...props}
    >
      {children}
    </Component>
  );
}

// Button component with mobile optimizations
interface ResponsiveButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function ResponsiveButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  ...props
}: ResponsiveButtonProps) {
  const { isMobile } = useResponsiveLayout();
  const { getOptimalTouchTargetSize } = useResponsiveLayout();

  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'responsive-button',
        'inline-flex items-center justify-center',
        'font-medium rounded-md',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isMobile && 'touch-manipulation active:scale-95',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        minHeight: `${getOptimalTouchTargetSize().height}px`,
        minWidth: `${getOptimalTouchTargetSize().width}px`,
        WebkitTapHighlightColor: 'transparent',
      }}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

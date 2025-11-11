'use client';

import { useEffect, useRef, useState } from 'react';
import { MobileUtils, MobilePerformanceOptimizer } from '@/lib/mobile-utils';

interface MobileOptimizerProps {
  children: React.ReactNode;
  enableImageOptimization?: boolean;
  enableScrollOptimization?: boolean;
  enableResourcePreloading?: boolean;
  preloadResources?: string[];
  lazyLoadThreshold?: number;
  className?: string;
}

export function MobileOptimizer({
  children,
  enableImageOptimization = true,
  enableScrollOptimization = true,
  enableResourcePreloading = true,
  preloadResources = [],
  lazyLoadThreshold = 100,
  className,
}: MobileOptimizerProps) {
  const [isClient, setIsClient] = useState(false);
  const hasOptimized = useRef(false);

  useEffect(() => {
    setIsClient(true);

    if (hasOptimized.current) return;
    hasOptimized.current = true;

    // Only run optimizations on client-side
    if (typeof window === 'undefined') return;

    // Preload critical resources
    if (enableResourcePreloading && preloadResources.length > 0) {
      MobilePerformanceOptimizer.preloadCriticalResources(preloadResources);
    }

    // Optimize scrolling
    if (enableScrollOptimization) {
      MobilePerformanceOptimizer.optimizeScrolling();
    }

    // Lazy load images
    if (enableImageOptimization) {
      MobilePerformanceOptimizer.lazyLoadImages();
    }

    // Add performance monitoring
    if (process.env.NODE_ENV === 'development') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }

    // Optimize for slow networks
    if (MobileUtils.isSlowNetwork()) {
      document.body.classList.add('slow-network');
      // Reduce animations and transitions for slow networks
      const style = document.createElement('style');
      style.textContent = `
        .slow-network * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Optimize for reduced motion preferences
    if (MobileUtils.prefersReducedMotion()) {
      document.body.classList.add('reduce-motion');
    }

  }, [enableImageOptimization, enableScrollOptimization, enableResourcePreloading, preloadResources]);

  if (!isClient) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      data-device-type={MobileUtils.getDeviceType()}
      data-breakpoint={MobileUtils.getBreakpoint()}
      data-touch-device={MobileUtils.isTouchDevice()}
      data-network-info={JSON.stringify(MobileUtils.getNetworkInfo())}
    >
      {children}
    </div>
  );
}

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  className?: string;
}

export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEwxNiAyNEwyMCAyOEwyNCAyNFYyMEgyMFoiIGZpbGw9IiNEREREREQiLz4KPC9zdmc+',
  threshold = 100,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  const optimizedSrc = MobileUtils.getOptimalImageSrc(src);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={isInView ? optimizedSrc : placeholder}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${hasError ? 'hidden' : ''}
        `}
        loading="lazy"
        {...props}
      />
      {hasError && (
        <div className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700">
          <span className="text-gray-500 dark:text-gray-400 text-sm">Failed to load</span>
        </div>
      )}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
      )}
    </div>
  );
}

interface ResponsiveImageProps extends Omit<LazyImageProps, 'src'> {
  sources: {
    src: string;
    media?: string;
    type?: string;
  }[];
  fallbackSrc: string;
}

export function ResponsiveImage({
  sources,
  fallbackSrc,
  alt,
  className,
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <picture className={className}>
      {sources.map(({ src, media, type }, index) => (
        <source
          key={index}
          srcSet={MobileUtils.getOptimalImageSrc(src)}
          media={media}
          type={type}
        />
      ))}
      <LazyImage
        src={fallbackSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </picture>
  );
}

interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  scale?: number;
  opacity?: number;
}

export function TouchFeedback({
  children,
  className,
  disabled = false,
  scale = 0.95,
  opacity = 0.8,
}: TouchFeedbackProps) {
  const [isActive, setIsActive] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsActive(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsActive(false);
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsActive(false);
  };

  const style = isActive && !disabled ? {
    transform: `scale(${scale})`,
    opacity,
    transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
  } : {
    transition: 'transform 0.2s ease-in, opacity 0.2s ease-in',
  };

  return (
    <div
      className={className}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  );
}

interface SafeAreaProps {
  children: React.ReactNode;
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
  className?: string;
}

export function SafeArea({
  children,
  top = false,
  right = false,
  bottom = false,
  left = false,
  className,
}: SafeAreaProps) {
  const safeAreaStyles: React.CSSProperties = {};

  if (top) {
    safeAreaStyles.paddingTop = 'calc(1rem + env(safe-area-inset-top, 0px))';
  }
  if (right) {
    safeAreaStyles.paddingRight = 'calc(1rem + env(safe-area-inset-right, 0px))';
  }
  if (bottom) {
    safeAreaStyles.paddingBottom = 'calc(1rem + env(safe-area-inset-bottom, 0px))';
  }
  if (left) {
    safeAreaStyles.paddingLeft = 'calc(1rem + env(safe-area-inset-left, 0px))';
  }

  return (
    <div className={className} style={safeAreaStyles}>
      {children}
    </div>
  );
}

interface NetworkAwareProps {
  children: React.ReactNode;
  slowNetworkFallback?: React.ReactNode;
  offlineFallback?: React.ReactNode;
  className?: string;
}

export function NetworkAware({
  children,
  slowNetworkFallback,
  offlineFallback,
  className,
}: NetworkAwareProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
      setNetworkInfo(MobileUtils.getNetworkInfo());
    };

    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  if (!isOnline && offlineFallback) {
    return <div className={className}>{offlineFallback}</div>;
  }

  if (networkInfo?.saveData && slowNetworkFallback) {
    return <div className={className}>{slowNetworkFallback}</div>;
  }

  return <div className={className}>{children}</div>;
}

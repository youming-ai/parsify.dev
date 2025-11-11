/**
 * Mobile utilities and touch interaction helpers
 */

import { useState, useEffect } from "react";

export interface TouchInteractionConfig {
  touchThreshold?: number;
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
}

export interface TouchGesture {
  type:
    | "tap"
    | "doubleTap"
    | "longPress"
    | "swipeLeft"
    | "swipeRight"
    | "swipeUp"
    | "swipeDown";
  target: HTMLElement;
  startTime: number;
  startX: number;
  startY: number;
}

export class MobileUtils {
  // Detect if device is mobile
  static isMobile(): boolean {
    if (typeof window === "undefined") return false;

    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.innerWidth <= 768
    );
  }

  // Detect if device supports touch
  static isTouchDevice(): boolean {
    if (typeof window === "undefined") return false;

    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  // Get device type
  static getDeviceType(): "mobile" | "tablet" | "desktop" {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width <= 640) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  }

  // Check if viewport is in portrait mode
  static isPortrait(): boolean {
    if (typeof window === "undefined") return false;
    return window.innerHeight > window.innerWidth;
  }

  // Check if viewport is in landscape mode
  static isLandscape(): boolean {
    return !this.isPortrait();
  }

  // Get safe area insets for notched devices
  static getSafeAreaInsets() {
    if (typeof window === "undefined")
      return { top: 0, right: 0, bottom: 0, left: 0 };

    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue("env(safe-area-inset-top)") || "0"),
      right: parseInt(
        style.getPropertyValue("env(safe-area-inset-right)") || "0",
      ),
      bottom: parseInt(
        style.getPropertyValue("env(safe-area-inset-bottom)") || "0",
      ),
      left: parseInt(
        style.getPropertyValue("env(safe-area-inset-left)") || "0",
      ),
    };
  }

  // Check if device has notched display
  static hasNotch(): boolean {
    if (typeof window === "undefined") return false;

    const insets = this.getSafeAreaInsets();
    return insets.top > 0 || insets.left > 0 || insets.right > 0;
  }

  // Optimize images for mobile
  static getOptimalImageSrc(baseSrc: string, width?: number): string {
    const devicePixelRatio =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const targetWidth = (width || window.innerWidth || 375) * devicePixelRatio;

    // Add sizing parameters if supported (Cloudinary, Imgix, etc.)
    if (baseSrc.includes("cloudinary") || baseSrc.includes("imgix")) {
      const separator = baseSrc.includes("?") ? "&" : "?";
      return `${baseSrc}${separator}w=${Math.round(targetWidth)}&q=80&auto=format`;
    }

    return baseSrc;
  }

  // Throttle scroll events for better performance
  static throttleScroll(callback: () => void, delay: number = 16): () => void {
    let ticking = false;

    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback();
          ticking = false;
        });
        ticking = true;
      }
    };
  }

  // Debounce resize events
  static debounceResize(callback: () => void, delay: number = 250): () => void {
    let timeoutId: NodeJS.Timeout;

    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  }

  // Get viewport breakpoints
  static getBreakpoint(): "xs" | "sm" | "md" | "lg" | "xl" | "2xl" {
    if (typeof window === "undefined") return "md";

    const width = window.innerWidth;
    if (width < 475) return "xs";
    if (width < 640) return "sm";
    if (width < 768) return "md";
    if (width < 1024) return "lg";
    if (width < 1280) return "xl";
    return "2xl";
  }

  // Check if device prefers reduced motion
  static prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false;

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Get optimal touch target size (minimum 44x44 pixels per iOS guidelines)
  static getOptimalTouchTargetSize(): { width: number; height: number } {
    const deviceType = this.getDeviceType();

    switch (deviceType) {
      case "mobile":
        return { width: 44, height: 44 };
      case "tablet":
        return { width: 40, height: 40 };
      default:
        return { width: 32, height: 32 };
    }
  }

  // Check if network is slow (for optimization)
  static isSlowNetwork(): boolean {
    if (typeof navigator === "undefined") return false;

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) return false;

    return (
      connection.saveData ||
      connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g"
    );
  }

  // Get network information
  static getNetworkInfo() {
    if (typeof navigator === "undefined") return null;

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
}

export class TouchGestureHandler {
  private config: TouchInteractionConfig;
  private gesture: Partial<TouchGesture> | null = null;
  private callbacks: Map<string, ((gesture: TouchGesture) => void)[]> =
    new Map();

  constructor(config: TouchInteractionConfig = {}) {
    this.config = {
      touchThreshold: 10,
      swipeThreshold: 50,
      longPressDelay: 500,
      doubleTapDelay: 300,
      ...config,
    };
  }

  // Register callback for specific gesture type
  on(
    type: TouchGesture["type"],
    callback: (gesture: TouchGesture) => void,
  ): void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    this.callbacks.get(type)!.push(callback);
  }

  // Remove callback for specific gesture type
  off(
    type: TouchGesture["type"],
    callback: (gesture: TouchGesture) => void,
  ): void {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Handle touch start
  handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    const target = event.target as HTMLElement;

    this.gesture = {
      type: "tap",
      target,
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
    };

    // Check for long press
    setTimeout(() => {
      if (
        this.gesture &&
        this.gesture.startTime === Date.now() - this.config.longPressDelay!
      ) {
        this.gesture.type = "longPress";
        this.emit("longPress", this.gesture as TouchGesture);
      }
    }, this.config.longPressDelay);
  };

  // Handle touch move
  handleTouchMove = (event: TouchEvent): void => {
    if (!this.gesture || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.gesture.startX!);
    const deltaY = Math.abs(touch.clientY - this.gesture.startY!);

    // Cancel long press if moved too much
    if (
      deltaX > this.config.touchThreshold! ||
      deltaY > this.config.touchThreshold!
    ) {
      this.gesture.startTime = 0;
    }
  };

  // Handle touch end
  handleTouchEnd = (event: TouchEvent): void => {
    if (!this.gesture || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.gesture.startX!;
    const deltaY = touch.clientY - this.gesture.startY!;
    const deltaTime = Date.now() - this.gesture.startTime!;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine gesture type
    if (
      deltaTime < this.config.doubleTapDelay! &&
      distance < this.config.touchThreshold!
    ) {
      this.gesture.type = "tap";
      this.emit("tap", this.gesture as TouchGesture);
    } else if (distance > this.config.swipeThreshold!) {
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        this.gesture.type = deltaX > 0 ? "swipeRight" : "swipeLeft";
      } else {
        this.gesture.type = deltaY > 0 ? "swipeDown" : "swipeUp";
      }
      this.emit(this.gesture.type, this.gesture as TouchGesture);
    }

    this.gesture = null;
  };

  // Emit gesture event
  private emit(type: TouchGesture["type"], gesture: TouchGesture): void {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(gesture));
    }
  }

  // Attach to element
  attach(element: HTMLElement): void {
    element.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    element.addEventListener("touchend", this.handleTouchEnd, {
      passive: false,
    });
  }

  // Detach from element
  detach(element: HTMLElement): void {
    element.removeEventListener("touchstart", this.handleTouchStart);
    element.removeEventListener("touchmove", this.handleTouchMove);
    element.removeEventListener("touchend", this.handleTouchEnd);
  }
}

// Performance optimization utilities
export class MobilePerformanceOptimizer {
  private static intersectionObserver: IntersectionObserver | null = null;

  // Lazy load images
  static lazyLoadImages(): void {
    if (!("IntersectionObserver" in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
              this.intersectionObserver?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      },
    );

    document.querySelectorAll("img[data-src]").forEach((img) => {
      this.intersectionObserver?.observe(img);
    });
  }

  // Optimize scrolling performance
  static optimizeScrolling(): void {
    let ticking = false;

    const updateScroll = () => {
      // Add scroll-based optimizations here
      ticking = false;
    };

    const optimizedScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", optimizedScroll, { passive: true });
  }

  // Preload critical resources
  static preloadCriticalResources(resources: string[]): void {
    resources.forEach((resource) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = resource;

      if (resource.endsWith(".css")) {
        link.as = "style";
      } else if (resource.endsWith(".js")) {
        link.as = "script";
      } else if (resource.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        link.as = "image";
      }

      document.head.appendChild(link);
    });
  }
}

// Hook for responsive utilities
export function useMobileUtils() {
  const [deviceType, setDeviceType] =
    useState<ReturnType<typeof MobileUtils.getDeviceType>>("desktop");
  const [breakpoint, setBreakpoint] =
    useState<ReturnType<typeof MobileUtils.getBreakpoint>>("md");
  const [isPortrait, setIsPortrait] = useState(MobileUtils.isPortrait());

  useEffect(() => {
    const updateDeviceType = () => setDeviceType(MobileUtils.getDeviceType());
    const updateBreakpoint = () => setBreakpoint(MobileUtils.getBreakpoint());
    const updateOrientation = () => setIsPortrait(MobileUtils.isPortrait());

    const debouncedUpdate = MobileUtils.debounceResize(() => {
      updateDeviceType();
      updateBreakpoint();
      updateOrientation();
    });

    updateDeviceType();
    updateBreakpoint();
    updateOrientation();

    window.addEventListener("resize", debouncedUpdate);
    window.addEventListener("orientationchange", updateOrientation);

    return () => {
      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  return {
    deviceType,
    breakpoint,
    isPortrait,
    isLandscape: !isPortrait,
    isMobile: MobileUtils.isMobile(),
    isTouchDevice: MobileUtils.isTouchDevice(),
    hasNotch: MobileUtils.hasNotch(),
    prefersReducedMotion: MobileUtils.prefersReducedMotion(),
    getOptimalTouchTargetSize: MobileUtils.getOptimalTouchTargetSize(),
    isSlowNetwork: MobileUtils.isSlowNetwork(),
  };
}

// CSS-in-JS utilities for mobile styles
export const mobileStyles = {
  // Safe area utilities
  safeArea: (inset: "top" | "right" | "bottom" | "left", value: string) => ({
    [`padding${inset.charAt(0).toUpperCase() + inset.slice(1)}`]: `calc(${value} + env(safe-area-inset-${inset}, 0px))`,
  }),

  // Responsive font sizes
  responsiveFontSize: {
    xs: "clamp(0.75rem, 2vw, 0.875rem)",
    sm: "clamp(0.875rem, 2.5vw, 1rem)",
    base: "clamp(1rem, 3vw, 1.125rem)",
    lg: "clamp(1.125rem, 3.5vw, 1.25rem)",
    xl: "clamp(1.25rem, 4vw, 1.5rem)",
  },

  // Touch-friendly spacing
  touchSpacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
  },

  // Responsive spacing
  responsiveSpacing: {
    xs: "clamp(0.5rem, 2vw, 1rem)",
    sm: "clamp(0.75rem, 3vw, 1.5rem)",
    md: "clamp(1rem, 4vw, 2rem)",
    lg: "clamp(1.5rem, 5vw, 3rem)",
    xl: "clamp(2rem, 6vw, 4rem)",
  },
};

/**
 * Google Analytics 4 Integration
 * Provides a wrapper around gtag for Google Analytics tracking
 */

export interface GoogleAnalyticsConfig {
  measurementId?: string;
  enabled?: boolean;
  debug?: boolean;
  anonymizeIp?: boolean;
  allowAdPersonalization?: boolean;
  sendPageView?: boolean;
  trackingOptions?: {
    link_attribution?: boolean;
    anonymize_ip?: boolean;
    allow_ad_personalization_signals?: boolean;
    allow_google_signals?: boolean;
    restricted_data_processing?: boolean;
  };
}

export interface GAEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  non_interaction?: boolean;
  custom_parameters?: Record<string, unknown>;
}

export interface GAUser {
  user_id?: string;
  session_id?: string;
  custom_parameters?: Record<string, unknown>;
}

/**
 * Google Analytics 4 Service
 * Handles initialization, configuration, and event tracking for Google Analytics
 */
export class GoogleAnalyticsService {
  private isInitialized = false;
  private config: GoogleAnalyticsConfig;
  private eventQueue: GAEvent[] = [];
  private debugMode: boolean;
  private measurementId: string;

  constructor(config?: Partial<GoogleAnalyticsConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV !== "development",
      debug: process.env.NODE_ENV === "development",
      anonymizeIp: true,
      allowAdPersonalization: false,
      sendPageView: true,
      ...config,
    };
    this.debugMode = this.config.debug || false;
    this.measurementId =
      this.config.measurementId ||
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
      "";
  }

  /**
   * Initialize Google Analytics with the provided configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.debug("Google Analytics already initialized");
      return;
    }

    if (!this.config.enabled) {
      this.debug("Google Analytics is disabled");
      return;
    }

    if (!this.measurementId) {
      this.debug("Google Analytics measurement ID not provided");
      return;
    }

    if (typeof window === "undefined") {
      this.debug(
        "Google Analytics can only be initialized in browser environment",
      );
      return;
    }

    try {
      // Initialize gtag if not available
      if (!window.gtag) {
        this.injectGtagScript();
      }

      // Configure gtag
      window.gtag("config", this.measurementId, {
        debug_mode: this.debugMode,
        anonymize_ip: this.config.anonymizeIp,
        allow_google_signals: this.config.allowAdPersonalization,
        send_page_view: false, // We'll handle page views manually
        ...this.config.trackingOptions,
      });

      // Process any queued events
      this.processEventQueue();

      this.isInitialized = true;
      this.debug("Google Analytics initialized successfully", {
        measurementId: this.measurementId,
      });

      // Track initialization event
      this.trackEvent("ga_initialized", {
        measurement_id: this.measurementId,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.debug("Failed to initialize Google Analytics", error);
      throw error;
    }
  }

  /**
   * Inject gtag script into the page
   */
  private injectGtagScript(): void {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;

    // Add error handling
    script.onerror = () => {
      this.debug("Failed to load Google Analytics script");
    };

    document.head.appendChild(script);

    // Initialize gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  /**
   * Track a custom event in Google Analytics
   */
  trackEvent(action: string, parameters?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      this.queueEvent(action, parameters);
      return;
    }

    try {
      const eventParams = {
        ...parameters,
        custom_map: parameters?.custom_map || {},
      };

      window.gtag("event", action, eventParams);
      this.debug("Event tracked in GA", { action, parameters: eventParams });
    } catch (error) {
      this.debug("Failed to track event in GA", {
        action,
        parameters,
        error,
      });
    }
  }

  /**
   * Track a page view in Google Analytics
   */
  trackPageView(path?: string, title?: string): void {
    if (!this.isInitialized) {
      this.queuePageView(path, title);
      return;
    }

    try {
      const pagePath = path || window.location.pathname;
      const pageTitle = title || document.title;

      window.gtag("config", this.measurementId, {
        page_path: pagePath,
        page_title: pageTitle,
        page_location: window.location.href,
      });

      this.debug("Page view tracked in GA", {
        path: pagePath,
        title: pageTitle,
      });
    } catch (error) {
      this.debug("Failed to track page view in GA", { path, title, error });
    }
  }

  /**
   * Set user ID for Google Analytics
   */
  setUserId(userId: string): void {
    if (!this.isInitialized) {
      this.debug("Cannot set user ID - GA not initialized");
      return;
    }

    try {
      window.gtag("config", this.measurementId, {
        user_id: userId,
      });
      this.debug("User ID set in GA", { userId });
    } catch (error) {
      this.debug("Failed to set user ID in GA", { userId, error });
    }
  }

  /**
   * Set custom user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) {
      this.debug("Cannot set user properties - GA not initialized");
      return;
    }

    try {
      window.gtag("config", this.measurementId, {
        custom_map: properties,
      });
      this.debug("User properties set in GA", properties);
    } catch (error) {
      this.debug("Failed to set user properties in GA", {
        properties,
        error,
      });
    }
  }

  /**
   * Track tool usage
   */
  trackToolUsage(
    toolId: string,
    toolName: string,
    action: string,
    metadata?: Record<string, any>,
  ): void {
    this.trackEvent("tool_usage", {
      tool_id: toolId,
      tool_name: toolName,
      action,
      ...metadata,
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(
    interactionType: string,
    elementId?: string,
    metadata?: Record<string, any>,
  ): void {
    this.trackEvent("user_interaction", {
      interaction_type: interactionType,
      element_id: elementId,
      ...metadata,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error | string, context?: Record<string, any>): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.trackEvent("error", {
      description: errorMessage,
      fatal: false,
      ...context,
    });
  }

  /**
   * Track exception
   */
  trackException(error: Error | string, fatal: boolean = false): void {
    try {
      (window as any).gtag("event", "exception", {
        description: error instanceof Error ? error.message : error,
        fatal: fatal,
      });
    } catch (e) {
      this.debug("Failed to track exception in GA", { error, fatal });
    }
  }

  /**
   * Disable tracking for user privacy
   */
  disableTracking(): void {
    if (typeof window !== "undefined") {
      (window as any)["ga-disable-" + this.measurementId] = true;
      this.debug("Google Analytics tracking disabled");
    }
  }

  /**
   * Enable tracking
   */
  enableTracking(): void {
    if (typeof window !== "undefined") {
      delete (window as any)["ga-disable-" + this.measurementId];
      this.debug("Google Analytics tracking enabled");
    }
  }

  /**
   * Queue an event to be processed once GA is initialized
   */
  private queueEvent(action: string, parameters?: Record<string, any>): void {
    this.eventQueue.push({
      action,
      custom_parameters: parameters || {},
    });
    this.debug("Event queued for GA", { action, parameters });
  }

  /**
   * Queue a page view to be processed once GA is initialized
   */
  private queuePageView(path?: string, title?: string): void {
    this.eventQueue.push({
      action: "page_view",
      custom_parameters: {
        path: path || window.location.pathname,
        title: title || document.title,
      },
    });
    this.debug("Page view queued for GA", { path, title });
  }

  /**
   * Process all queued events
   */
  private processEventQueue(): void {
    if (this.eventQueue.length === 0) return;

    this.debug("Processing queued events", { count: this.eventQueue.length });

    this.eventQueue.forEach((event) => {
      if (event.action === "page_view") {
        const params =
          (event.custom_parameters as Record<string, string | undefined>) || {};
        const { path, title } = params;
        this.trackPageView(path, title);
      } else {
        this.trackEvent(event.action, event.custom_parameters);
      }
    });

    // Clear the queue
    this.eventQueue = [];
  }

  /**
   * Get initialization status
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): GoogleAnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (only works before initialization)
   */
  updateConfig(newConfig: Partial<GoogleAnalyticsConfig>): void {
    if (this.isInitialized) {
      this.debug("Cannot update config - GA already initialized");
      return;
    }

    this.config = { ...this.config, ...newConfig };
    this.debug("Google Analytics configuration updated", {
      config: this.config,
    });
  }

  /**
   * Debug logging utility
   */
  private debug(message: string, data?: any): void {
    if (this.debugMode) {
      if (data) {
        console.log(`[Google Analytics] ${message}`, data);
      } else {
        console.log(`[Google Analytics] ${message}`);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.isInitialized) {
      try {
        // Google Analytics doesn't provide a destroy method
        // This would be for cleanup if needed in future versions
        this.debug("Google Analytics service destroyed");
      } catch (error) {
        this.debug("Error during GA cleanup", error);
      }
    }

    this.isInitialized = false;
    this.eventQueue = [];
  }
}

/**
 * Create and initialize a Google Analytics service instance
 */
export function createGoogleAnalyticsService(
  config?: Partial<GoogleAnalyticsConfig>,
): GoogleAnalyticsService {
  const service = new GoogleAnalyticsService(config);

  // Auto-initialize if we're in a browser environment
  if (typeof window !== "undefined") {
    service.initialize().catch((error) => {
      console.error("Failed to initialize Google Analytics:", error);
    });
  }

  return service;
}

/**
 * Singleton instance for easy access
 */
let gaServiceInstance: GoogleAnalyticsService | null = null;

export function getGoogleAnalyticsService(): GoogleAnalyticsService {
  if (!gaServiceInstance) {
    gaServiceInstance = createGoogleAnalyticsService();
  }
  return gaServiceInstance;
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>,
    ) => void;
    dataLayer: unknown[];
  }
}

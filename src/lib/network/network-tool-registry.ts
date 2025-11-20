/**
 * Network Tools Registry
 * Central registry for all network utility tools with browser API integration
 */

import { ToolRegistry, type ToolMetadata, type ToolConfig } from "@/lib/registry/tool-registry";

// Network Tool Imports (lazy-loaded)
const importHTTPRequestSimulator = () =>
  import("@/components/tools/network/http-request-simulator").then(
    (mod) => mod.HTTPRequestSimulator,
  );
const importIPGeolocationTool = () =>
  import("@/components/tools/network/ip-geolocation").then((mod) => mod.IPGeolocationTool);
const importURLShortener = () =>
  import("@/components/tools/network/url-shortener").then((mod) => mod.URLShortener);
const importWebConnectivity = () =>
  import("@/components/tools/network/web-connectivity").then((mod) => mod.WebConnectivity);
const importUserAgentAnalyzer = () =>
  import("@/components/tools/network/useragent-analyzer").then((mod) => mod.UserAgentAnalyzer);

// Network Service Library Imports (lazy-loaded)
const importNetworkDiagnostics = () =>
  import("@/components/tools/network/network-diagnostics").then((mod) => mod.NetworkDiagnostics);

/**
 * Network Tools Metadata Configuration
 * Browser-based network tools with CORS and security considerations
 */
const NETWORK_TOOLS_METADATA: ToolMetadata[] = [
  // Core Network Tools
  {
    id: "http-request-simulator",
    name: "HTTP Request Simulator",
    description:
      "Simulate HTTP requests with timing analysis, headers inspection, and response details",
    category: "network",
    version: "1.0.0",
    bundleSize: 28500, // 28.5KB
    loadTime: 95, // 95ms initialization
    dependencies: [],
    tags: ["http", "request", "api", "testing", "timing", "headers"],
    enabled: true,
    priority: 10, // High priority - core network functionality
    icon: "Globe",
    author: "Parsify Team",
    license: "MIT",
    requiresNetworkAccess: true,
    supportedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    corsRestrictions: true,
  },
  {
    id: "ip-geolocation",
    name: "IP Geolocation Tool",
    description:
      "Get geographical information for IP addresses using multiple geolocation services",
    category: "network",
    version: "1.0.0",
    bundleSize: 24200,
    loadTime: 120,
    dependencies: [],
    tags: ["ip", "geolocation", "location", "isp", "asn", "analytics"],
    enabled: true,
    priority: 9,
    icon: "MapPin",
    author: "Parsify Team",
    license: "MIT",
    requiresNetworkAccess: true,
    externalServices: ["ip-api.com", "ipapi.co", "ipinfo.io"],
  },
  {
    id: "url-shortener",
    name: "URL Shortener",
    description: "Create and manage short URLs with localStorage persistence and analytics",
    category: "network",
    version: "1.0.0",
    bundleSize: 18900,
    loadTime: 75,
    dependencies: [],
    tags: ["url", "shortener", "link", "analytics", "qr-code"],
    enabled: true,
    priority: 7,
    icon: "Link",
    author: "Parsify Team",
    license: "MIT",
    requiresNetworkAccess: false, // Can work offline
    storageType: "localStorage",
  },
  {
    id: "web-connectivity",
    name: "Web Connectivity Checker",
    description: "Test internet connectivity and network performance using WebRTC and ping tests",
    category: "network",
    version: "1.0.0",
    bundleSize: 22600,
    loadTime: 110,
    dependencies: [],
    tags: ["connectivity", "network", "webrtc", "ping", "performance", "diagnostics"],
    enabled: true,
    priority: 8,
    icon: "Wifi",
    author: "Parsify Team",
    license: "MIT",
    requiresNetworkAccess: true,
    browserAPIs: ["RTCPeerConnection", "Navigator.connection"],
  },
  {
    id: "useragent-analyzer",
    name: "User Agent Analyzer",
    description:
      "Analyze browser user agent strings and provide detailed browser and device information",
    category: "network",
    version: "1.0.0",
    bundleSize: 16800,
    loadTime: 60,
    dependencies: [],
    tags: ["useragent", "browser", "device", "detection", "capabilities", "analytics"],
    enabled: true,
    priority: 6,
    icon: "Monitor",
    author: "Parsify Team",
    license: "MIT",
    requiresNetworkAccess: false, // Works entirely offline
    browserAPIs: ["navigator.userAgent", "navigator.platform"],
  },

  // Network Library Services
  {
    id: "network-diagnostics",
    name: "Network Diagnostics Service",
    description: "Comprehensive network diagnostics and troubleshooting utilities",
    category: "network",
    version: "1.0.0",
    bundleSize: 0, // Library only
    loadTime: 0,
    dependencies: [],
    tags: ["diagnostics", "network", "troubleshooting", "analysis", "library"],
    enabled: true,
    priority: 0, // Library only
    icon: "Activity",
    author: "Parsify Team",
    license: "MIT",
  },
];

/**
 * Network Tools Configuration
 * Lazy loading configuration optimized for network operations
 */
const NETWORK_CONFIGS: Omit<ToolConfig, "metadata">[] = [
  // Core Network Tools Configurations
  {
    component: undefined as any,
    importer: importHTTPRequestSimulator,
  },
  {
    component: undefined as any,
    importer: importIPGeolocationTool,
  },
  {
    component: undefined as any,
    importer: importURLShortener,
  },
  {
    component: undefined as any,
    importer: importWebConnectivity,
  },
  {
    component: undefined as any,
    importer: importUserAgentAnalyzer,
  },

  // Library Services Configurations
  {
    component: undefined as any,
    importer: importNetworkDiagnostics,
  },
];

/**
 * Network Capabilities and Constraints
 */
export interface NetworkCapabilities {
  online: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Network Security Constraints
 */
export interface NetworkSecurityConstraints {
  allowedDomains: string[];
  blockedDomains: string[];
  corsEnabled: boolean;
  httpsOnly: boolean;
  maxRequestSize: number; // bytes
  requestTimeout: number; // milliseconds
}

/**
 * Network Tools Registry Class
 * Manages network tools with security and performance considerations
 */
export class NetworkToolsRegistry {
  private toolRegistry: ToolRegistry;
  private static instance: NetworkToolsRegistry | null = null;
  private securityConstraints: NetworkSecurityConstraints;

  private constructor() {
    this.toolRegistry = ToolRegistry.getInstance({
      enableLazyLoading: true,
      preloadPriority: 6, // Medium priority for network tools
      maxConcurrentLoads: 3, // Network tools can run concurrently
      retryAttempts: 2,
      cacheStrategy: "memory",
    });

    this.securityConstraints = {
      allowedDomains: [
        // Common APIs for network tools
        "ip-api.com",
        "ipapi.co",
        "ipinfo.io",
        "api.ipify.org",
        "httpbin.org",
        "jsonplaceholder.typicode.com",
      ],
      blockedDomains: [
        // Blocked for security
        "*.internal",
        "*.local",
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
      ],
      corsEnabled: true,
      httpsOnly: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      requestTimeout: 30000, // 30 seconds
    };

    this.initializeTools();
    this.setupNetworkListeners();
  }

  /**
   * Get singleton instance of Network Tools Registry
   */
  public static getInstance(): NetworkToolsRegistry {
    if (!NetworkToolsRegistry.instance) {
      NetworkToolsRegistry.instance = new NetworkToolsRegistry();
    }
    return NetworkToolsRegistry.instance;
  }

  /**
   * Initialize all network tools with security validation
   */
  private initializeTools(): void {
    NETWORK_TOOLS_METADATA.forEach((metadata, index) => {
      const config = NETWORK_CONFIGS[index];

      if (config) {
        // Validate network constraints
        this.validateToolNetworkConstraints(metadata);

        this.toolRegistry.registerTool({
          metadata,
          ...config,
        });
      }
    });
  }

  /**
   * Validate tool network constraints
   */
  private validateToolNetworkConstraints(metadata: ToolMetadata): void {
    const requiresNetworkAccess = (metadata as any).requiresNetworkAccess;
    const externalServices = (metadata as any).externalServices;

    if (requiresNetworkAccess && externalServices) {
      for (const service of externalServices) {
        // Check if external service is in allowed domains
        const isAllowed = this.securityConstraints.allowedDomains.some(
          (allowed) => service.includes(allowed) || allowed.includes(service),
        );

        if (!isAllowed) {
          console.warn(
            `Tool ${metadata.id} uses external service ${service} which may not be explicitly allowed`,
          );
        }
      }
    }

    // Check CORS restrictions
    if ((metadata as any).corsRestrictions && this.securityConstraints.corsEnabled) {
      console.info(`Tool ${metadata.id} requires CORS - CORS is enabled`);
    }
  }

  /**
   * Setup network event listeners
   */
  private setupNetworkListeners(): void {
    // Monitor online/offline status
    const updateNetworkStatus = () => {
      this.toolRegistry.emit("network:status:changed", {
        online: navigator.onLine,
        connection: this.getConnectionInfo(),
      });
    };

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    // Monitor connection changes if available
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener("change", updateNetworkStatus);
    }
  }

  /**
   * Get current connection information
   */
  public getConnectionInfo(): NetworkCapabilities {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    return {
      online: navigator.onLine,
      connectionType: connection?.type || "unknown",
      effectiveType: connection?.effectiveType || "unknown",
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
    };
  }

  /**
   * Get all network tools (excluding libraries)
   */
  public getNetworkTools(): ToolMetadata[] {
    return this.toolRegistry
      .getAllToolsMetadata()
      .filter((tool) => tool.category === "network" && tool.priority > 0);
  }

  /**
   * Get network utility libraries
   */
  public getNetworkLibraries(): ToolMetadata[] {
    return this.toolRegistry
      .getAllToolsMetadata()
      .filter((tool) => tool.category === "network" && tool.priority === 0);
  }

  /**
   * Get security constraints
   */
  public getSecurityConstraints(): NetworkSecurityConstraints {
    return { ...this.securityConstraints };
  }

  /**
   * Validate network request against security constraints
   */
  public validateNetworkRequest(
    url: string,
    method: string = "GET",
  ): {
    valid: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check HTTPS requirement
    if (this.securityConstraints.httpsOnly && !url.startsWith("https://")) {
      violations.push("URL must use HTTPS protocol");
      recommendations.push("Use HTTPS:// instead of HTTP://");
    }

    // Check blocked domains
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    const isBlocked = this.securityConstraints.blockedDomains.some(
      (blocked) => hostname === blocked || hostname.endsWith(blocked.replace("*.", "")),
    );

    if (isBlocked) {
      violations.push(`Domain ${hostname} is blocked for security reasons`);
      recommendations.push("Use a different domain or remove from blocked list");
    }

    // Check method support
    const httpSimulator = NETWORK_TOOLS_METADATA.find(
      (tool) => tool.id === "http-request-simulator",
    );
    if (httpSimulator) {
      const supportedMethods = (httpSimulator as any).supportedMethods;
      if (supportedMethods && !supportedMethods.includes(method.toUpperCase())) {
        violations.push(`HTTP method ${method} is not supported`);
        recommendations.push(`Use one of: ${supportedMethods.join(", ")}`);
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      recommendations,
    };
  }

  /**
   * Test network connectivity
   */
  public async testConnectivity(): Promise<{
    online: boolean;
    latency: number;
    connection: NetworkCapabilities;
    services: Record<string, boolean>;
  }> {
    const startTime = performance.now();
    let connectivityTest = false;

    try {
      // Simple connectivity test
      const response = await fetch("https://httpbin.org/status/200", {
        method: "HEAD",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000),
      });
      connectivityTest = response.ok;
    } catch (error) {
      connectivityTest = false;
    }

    const latency = performance.now() - startTime;
    const connection = this.getConnectionInfo();

    // Test external services
    const services: Record<string, boolean> = {};
    for (const service of this.securityConstraints.allowedDomains) {
      try {
        const testUrl = `https://${service}/status/200`;
        const response = await fetch(testUrl, {
          method: "HEAD",
          cache: "no-cache",
          signal: AbortSignal.timeout(3000),
        });
        services[service] = response.ok;
      } catch (error) {
        services[service] = false;
      }
    }

    return {
      online: navigator.onLine && connectivityTest,
      latency,
      connection,
      services,
    };
  }

  /**
   * Get network statistics
   */
  public getNetworkStatistics(): {
    totalTools: number;
    enabledTools: number;
    libraries: number;
    onlineStatus: NetworkCapabilities;
    securityLevel: "high" | "medium" | "low";
  } {
    const tools = this.getNetworkTools();
    const libraries = this.getNetworkLibraries();
    const enabledTools = tools.filter((tool) => tool.enabled);

    // Determine security level
    const securityLevel =
      this.securityConstraints.httpsOnly &&
      this.securityConstraints.corsEnabled &&
      this.securityConstraints.blockedDomains.length > 0
        ? "high"
        : "medium";

    return {
      totalTools: tools.length,
      enabledTools: enabledTools.length,
      libraries: libraries.length,
      onlineStatus: this.getConnectionInfo(),
      securityLevel,
    };
  }

  /**
   * Dispose of registry resources
   */
  public dispose(): void {
    this.toolRegistry.dispose();
    NetworkToolsRegistry.instance = null;
  }
}

/**
 * Export singleton instance for immediate use
 */
export const networkToolsRegistry = NetworkToolsRegistry.getInstance();

/**
 * Export utility functions for common operations
 */
export const getNetworkTools = () => networkToolsRegistry.getNetworkTools();
export const getNetworkLibraries = () => networkToolsRegistry.getNetworkLibraries();
export const validateNetworkRequest = (url: string, method?: string) =>
  networkToolsRegistry.validateNetworkRequest(url, method);
export const testConnectivity = () => networkToolsRegistry.testConnectivity();
export const getConnectionInfo = () => networkToolsRegistry.getConnectionInfo();

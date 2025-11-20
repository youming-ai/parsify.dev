/**
 * Security Tools Registry
 * Central registry for all security and encryption tools with Web Crypto API integration
 */

import { ToolRegistry, type ToolMetadata, type ToolConfig } from "@/lib/registry/tool-registry";

// Security Tool Imports (lazy-loaded)
const importAESEncryption = () =>
  import("@/components/tools/security/aes-encryption").then((mod) => mod.AESEncryption);
const importRSAEncryption = () =>
  import("@/components/tools/security/rsa-encryption").then((mod) => mod.RSAEncryption);
const importPasswordGenerator = () =>
  import("@/components/tools/security/password-generator").then((mod) => mod.PasswordGenerator);
const importCRCCalculator = () =>
  import("@/components/tools/security/crc-calculator").then((mod) => mod.CRCCalculator);
const importAdvancedHash = () =>
  import("@/components/tools/security/advanced-hash").then((mod) => mod.AdvancedHash);
const importMorseCodeConverter = () =>
  import("@/components/tools/security/morse-code-converter").then((mod) => mod.MorseCodeConverter);

// Security Utility Library Imports (lazy-loaded)
const importAESOperations = () =>
  import("@/lib/crypto/aes-operations").then((mod) => mod.AESOperations);
const importRSAOperations = () =>
  import("@/lib/crypto/rsa-operations").then((mod) => mod.RSAOperations);
const importHashOperations = () =>
  import("@/lib/crypto/hash-operations").then((mod) => mod.HashOperations);

/**
 * Security Tools Metadata Configuration
 * Web Crypto API-based tools with client-side encryption capabilities
 */
const SECURITY_TOOLS_METADATA: ToolMetadata[] = [
  // Core Security Tools
  {
    id: "aes-encryption",
    name: "AES Encryption",
    description:
      "Advanced Encryption Standard (AES) encryption and decryption with multiple modes (GCM, CBC, CTR)",
    category: "security",
    version: "1.0.0",
    bundleSize: 31200, // 31.2KB
    loadTime: 85, // 85ms initialization
    dependencies: [],
    tags: ["aes", "encryption", "decryption", "web-crypto", "gcm", "cbc", "ctr"],
    enabled: true,
    priority: 10, // Highest priority - core security feature
    icon: "Lock",
    author: "Parsify Team",
    license: "MIT",
    requiresSecureContext: true,
    supportedAlgorithms: ["AES-GCM", "AES-CBC", "AES-CTR"],
    keySizes: [128, 192, 256],
  },
  {
    id: "rsa-encryption",
    name: "RSA Encryption",
    description:
      "RSA asymmetric encryption with key generation, digital signatures, and PKCS#1 padding",
    category: "security",
    version: "1.0.0",
    bundleSize: 28900,
    loadTime: 95,
    dependencies: [],
    tags: ["rsa", "encryption", "decryption", "asymmetric", "key-generation", "signatures"],
    enabled: true,
    priority: 9,
    icon: "Key",
    author: "Parsify Team",
    license: "MIT",
    requiresSecureContext: true,
    supportedAlgorithms: ["RSA-OAEP", "RSA-PSS", "RSAES-PKCS1-v1_5"],
    keySizes: [2048, 3072, 4096],
  },
  {
    id: "password-generator",
    name: "Password Generator",
    description:
      "Generate secure passwords with customizable complexity, length, and character sets",
    category: "security",
    version: "1.0.0",
    bundleSize: 18900,
    loadTime: 65,
    dependencies: [],
    tags: ["password", "generator", "security", "random", "entropy", "complexity"],
    enabled: true,
    priority: 8,
    icon: "Shield",
    author: "Parsify Team",
    license: "MIT",
    requiresSecureContext: true,
    maxLength: 256,
    entropySources: ["crypto.getRandomValues"],
  },
  {
    id: "crc-calculator",
    name: "CRC Calculator",
    description: "Calculate CRC-16 and CRC-32 checksums for data integrity verification",
    category: "security",
    version: "1.0.0",
    bundleSize: 15600,
    loadTime: 45,
    dependencies: [],
    tags: ["crc", "checksum", "integrity", "crc16", "crc32", "verification"],
    enabled: true,
    priority: 6,
    icon: "CheckSquare",
    author: "Parsify Team",
    license: "MIT",
    requiresSecureContext: false, // Can work without secure context
    algorithms: ["CRC-16", "CRC-32"],
  },
  {
    id: "advanced-hash",
    name: "Advanced Hash Calculator",
    description:
      "Calculate multiple hash algorithms including SHA-2, SHA-3, and Blake2 with HMAC support",
    category: "security",
    version: "1.0.0",
    bundleSize: 22400,
    loadTime: 70,
    dependencies: [],
    tags: ["hash", "sha", "sha2", "sha3", "blake2", "hmac", "checksum"],
    enabled: true,
    priority: 7,
    icon: "Hash",
    author: "Parsify Team",
    license: "MIT",
    requiresSecureContext: true,
    supportedAlgorithms: [
      "SHA-1",
      "SHA-256",
      "SHA-384",
      "SHA-512",
      "SHA3-256",
      "SHA3-384",
      "SHA3-512",
      "BLAKE2b-256",
      "BLAKE2b-512",
    ],
  },
  {
    id: "morse-code-converter",
    name: "Morse Code Converter",
    description: "Convert text to/from Morse code with audio playback and visual signals",
    category: "security",
    version: "1.0.0",
    bundleSize: 17800,
    loadTime: 55,
    dependencies: [],
    tags: ["morse", "converter", "audio", "signaling", "encoding", "telegraph"],
    enabled: true,
    priority: 5,
    icon: "Radio",
    author: "Parsify Team",
    license: "MIT",
    requiresSecureContext: false,
    features: ["text-to-morse", "morse-to-text", "audio-playback", "visual-signals"],
  },

  // Security Utility Libraries
  {
    id: "aes-operations",
    name: "AES Operations Library",
    description: "Advanced AES cryptographic operations with key management and mode switching",
    category: "security",
    version: "1.0.0",
    bundleSize: 0, // Library only
    loadTime: 0,
    dependencies: [],
    tags: ["aes", "library", "operations", "key-management", "encryption"],
    enabled: true,
    priority: 0, // Library only
    icon: "Database",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "rsa-operations",
    name: "RSA Operations Library",
    description: "RSA cryptographic operations with key generation and digital signatures",
    category: "security",
    version: "1.0.0",
    bundleSize: 0,
    loadTime: 0,
    dependencies: [],
    tags: ["rsa", "library", "operations", "key-generation", "signatures"],
    enabled: true,
    priority: 0,
    icon: "Database",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "hash-operations",
    name: "Hash Operations Library",
    description: "Comprehensive hash function implementations with HMAC and key derivation",
    category: "security",
    version: "1.0.0",
    bundleSize: 0,
    loadTime: 0,
    dependencies: [],
    tags: ["hash", "library", "operations", "hmac", "key-derivation"],
    enabled: true,
    priority: 0,
    icon: "Database",
    author: "Parsify Team",
    license: "MIT",
  },
];

/**
 * Security Tools Configuration
 * Lazy loading configuration optimized for cryptographic operations
 */
const SECURITY_CONFIGS: Omit<ToolConfig, "metadata">[] = [
  // Core Security Tools Configurations
  {
    component: undefined as any,
    importer: importAESEncryption,
  },
  {
    component: undefined as any,
    importer: importRSAEncryption,
  },
  {
    component: undefined as any,
    importer: importPasswordGenerator,
  },
  {
    component: undefined as any,
    importer: importCRCCalculator,
  },
  {
    component: undefined as any,
    importer: importAdvancedHash,
  },
  {
    component: undefined as any,
    importer: importMorseCodeConverter,
  },

  // Library Services Configurations
  {
    component: undefined as any,
    importer: importAESOperations,
  },
  {
    component: undefined as any,
    importer: importRSAOperations,
  },
  {
    component: undefined as any,
    importer: importHashOperations,
  },
];

/**
 * Security Capabilities
 */
export interface SecurityCapabilities {
  secureContext: boolean;
  webCryptoAvailable: boolean;
  supportedAlgorithms: string[];
  randomNumbersAvailable: boolean;
  storageAvailable: boolean;
}

/**
 * Security Constraints
 */
export interface SecurityConstraints {
  maxKeySize: number;
  maxDataSize: number;
  requiresHTTPS: boolean;
  allowedOperations: string[];
}

/**
 * Security Tools Registry Class
 * Manages security tools with Web Crypto API integration and security validation
 */
export class SecurityToolsRegistry {
  private toolRegistry: ToolRegistry;
  private static instance: SecurityToolsRegistry | null = null;
  private securityConstraints: SecurityConstraints;
  private capabilities: SecurityCapabilities;

  private constructor() {
    this.toolRegistry = ToolRegistry.getInstance({
      enableLazyLoading: true,
      preloadPriority: 7, // Medium priority for security tools
      maxConcurrentLoads: 2, // Crypto operations can be CPU intensive
      retryAttempts: 2,
      cacheStrategy: "memory",
    });

    this.securityConstraints = {
      maxKeySize: 4096, // 4KB max key size
      maxDataSize: 50 * 1024 * 1024, // 50MB max data size
      requiresHTTPS: true,
      allowedOperations: [
        "encrypt",
        "decrypt",
        "sign",
        "verify",
        "digest",
        "generateKey",
        "deriveKey",
        "deriveBits",
      ],
    };

    this.capabilities = this.detectSecurityCapabilities();
    this.initializeTools();
  }

  /**
   * Get singleton instance of Security Tools Registry
   */
  public static getInstance(): SecurityToolsRegistry {
    if (!SecurityToolsRegistry.instance) {
      SecurityToolsRegistry.instance = new SecurityToolsRegistry();
    }
    return SecurityToolsRegistry.instance;
  }

  /**
   * Detect browser security capabilities
   */
  private detectSecurityCapabilities(): SecurityCapabilities {
    const secureContext = window.isSecureContext;
    const webCryptoAvailable = !!(window.crypto && window.crypto.subtle);
    const randomNumbersAvailable = !!(window.crypto && window.crypto.getRandomValues);
    const storageAvailable = typeof Storage !== "undefined" && !!window.localStorage;

    let supportedAlgorithms: string[] = [];
    if (webCryptoAvailable) {
      // Commonly supported algorithms
      supportedAlgorithms = [
        "AES-GCM",
        "AES-CBC",
        "AES-CTR",
        "RSA-OAEP",
        "RSA-PSS",
        "RSASSA-PKCS1-v1_5",
        "SHA-1",
        "SHA-256",
        "SHA-384",
        "SHA-512",
        "HMAC",
        "HKDF",
        "PBKDF2",
      ];
    }

    return {
      secureContext,
      webCryptoAvailable,
      supportedAlgorithms,
      randomNumbersAvailable,
      storageAvailable,
    };
  }

  /**
   * Initialize all security tools with capability validation
   */
  private initializeTools(): void {
    SECURITY_TOOLS_METADATA.forEach((metadata, index) => {
      const config = SECURITY_CONFIGS[index];

      if (config) {
        // Validate security capabilities
        this.validateToolCapabilities(metadata);

        this.toolRegistry.registerTool({
          metadata,
          ...config,
        });
      }
    });
  }

  /**
   * Validate tool capabilities against browser support
   */
  private validateToolCapabilities(metadata: ToolMetadata): void {
    const requiresSecureContext = (metadata as any).requiresSecureContext;

    if (requiresSecureContext && !this.capabilities.secureContext) {
      console.warn(`Tool ${metadata.id} requires secure context (HTTPS) which is not available`);
      // Tool will be disabled automatically
    }

    const algorithms = (metadata as any).supportedAlgorithms;
    if (algorithms && algorithms.length > 0) {
      const unsupportedAlgorithms = algorithms.filter(
        (algo: string) => !this.capabilities.supportedAlgorithms.includes(algo),
      );

      if (unsupportedAlgorithms.length > 0) {
        console.warn(
          `Tool ${metadata.id} uses unsupported algorithms: ${unsupportedAlgorithms.join(", ")}`,
        );
      }
    }
  }

  /**
   * Get all security tools (excluding libraries)
   */
  public getSecurityTools(): ToolMetadata[] {
    return this.toolRegistry
      .getAllToolsMetadata()
      .filter((tool) => tool.category === "security" && tool.priority > 0);
  }

  /**
   * Get security utility libraries
   */
  public getSecurityLibraries(): ToolMetadata[] {
    return this.toolRegistry
      .getAllToolsMetadata()
      .filter((tool) => tool.category === "security" && tool.priority === 0);
  }

  /**
   * Get security capabilities
   */
  public getSecurityCapabilities(): SecurityCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Get security constraints
   */
  public getSecurityConstraints(): SecurityConstraints {
    return { ...this.securityConstraints };
  }

  /**
   * Validate cryptographic operation against constraints
   */
  public validateCryptoOperation(operation: {
    algorithm: string;
    keySize?: number;
    dataSize?: number;
  }): {
    valid: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check algorithm support
    if (!this.capabilities.supportedAlgorithms.includes(operation.algorithm)) {
      violations.push(`Algorithm ${operation.algorithm} is not supported`);
      recommendations.push(`Use one of: ${this.capabilities.supportedAlgorithms.join(", ")}`);
    }

    // Check key size constraints
    if (operation.keySize && operation.keySize > this.securityConstraints.maxKeySize) {
      violations.push(
        `Key size ${operation.keySize} exceeds maximum ${this.securityConstraints.maxKeySize}`,
      );
      recommendations.push(
        `Use a smaller key size (maximum ${this.securityConstraints.maxKeySize})`,
      );
    }

    // Check data size constraints
    if (operation.dataSize && operation.dataSize > this.securityConstraints.maxDataSize) {
      violations.push(
        `Data size ${operation.dataSize} exceeds maximum ${this.securityConstraints.maxDataSize}`,
      );
      recommendations.push(`Split data into smaller chunks or use streaming encryption`);
    }

    // Check secure context requirement
    if (this.securityConstraints.requiresHTTPS && !this.capabilities.secureContext) {
      violations.push("HTTPS is required for cryptographic operations");
      recommendations.push("Use a secure connection (HTTPS) to enable cryptographic features");
    }

    return {
      valid: violations.length === 0,
      violations,
      recommendations,
    };
  }

  /**
   * Test cryptographic capabilities
   */
  public async testCryptoCapabilities(): Promise<{
    secureContext: boolean;
    webCryptoAvailable: boolean;
    algorithmsTested: Record<string, boolean>;
    randomNumbersWorking: boolean;
    overallStatus: "full" | "partial" | "minimal";
  }> {
    const results: Record<string, boolean> = {};

    // Test basic algorithms
    const algorithmsToTest = ["AES-GCM", "SHA-256", "RSA-OAEP"];

    for (const algorithm of algorithmsToTest) {
      try {
        if (algorithm === "AES-GCM") {
          const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
            "encrypt",
          ]);
          results[algorithm] = !!key;
        } else if (algorithm === "SHA-256") {
          const encoder = new TextEncoder();
          const data = encoder.encode("test");
          const hash = await crypto.subtle.digest("SHA-256", data);
          results[algorithm] = !!hash;
        } else if (algorithm === "RSA-OAEP") {
          const keyPair = await crypto.subtle.generateKey(
            { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
            false,
            ["encrypt"],
          );
          results[algorithm] = !!keyPair;
        }
      } catch (error) {
        results[algorithm] = false;
      }
    }

    // Test random number generation
    let randomNumbersWorking = false;
    try {
      const random = new Uint8Array(32);
      crypto.getRandomValues(random);
      randomNumbersWorking = random.length === 32;
    } catch (error) {
      randomNumbersWorking = false;
    }

    // Determine overall status
    const workingAlgorithms = Object.values(results).filter(Boolean).length;
    const totalAlgorithms = algorithmsToTest.length;

    let overallStatus: "full" | "partial" | "minimal";
    if (workingAlgorithms === totalAlgorithms && this.capabilities.secureContext) {
      overallStatus = "full";
    } else if (workingAlgorithms >= totalAlgorithms / 2) {
      overallStatus = "partial";
    } else {
      overallStatus = "minimal";
    }

    return {
      secureContext: this.capabilities.secureContext,
      webCryptoAvailable: this.capabilities.webCryptoAvailable,
      algorithmsTested: results,
      randomNumbersWorking,
      overallStatus,
    };
  }

  /**
   * Get security statistics
   */
  public getSecurityStatistics(): {
    totalTools: number;
    enabledTools: number;
    libraries: number;
    capabilities: SecurityCapabilities;
    constraints: SecurityConstraints;
    securityLevel: "high" | "medium" | "low";
  } {
    const tools = this.getSecurityTools();
    const libraries = this.getSecurityLibraries();
    const enabledTools = tools.filter((tool) => tool.enabled);

    // Determine security level
    const securityLevel =
      this.capabilities.secureContext &&
      this.capabilities.webCryptoAvailable &&
      this.securityConstraints.requiresHTTPS
        ? "high"
        : "medium";

    return {
      totalTools: tools.length,
      enabledTools: enabledTools.length,
      libraries: libraries.length,
      capabilities: this.capabilities,
      constraints: this.securityConstraints,
      securityLevel,
    };
  }

  /**
   * Dispose of registry resources
   */
  public dispose(): void {
    this.toolRegistry.dispose();
    SecurityToolsRegistry.instance = null;
  }
}

/**
 * Export singleton instance for immediate use
 */
export const securityToolsRegistry = SecurityToolsRegistry.getInstance();

/**
 * Export utility functions for common operations
 */
export const getSecurityTools = () => securityToolsRegistry.getSecurityTools();
export const getSecurityLibraries = () => securityToolsRegistry.getSecurityLibraries();
export const getSecurityCapabilities = () => securityToolsRegistry.getSecurityCapabilities();
export const validateCryptoOperation = (operation: any) =>
  securityToolsRegistry.validateCryptoOperation(operation);
export const testCryptoCapabilities = () => securityToolsRegistry.testCryptoCapabilities();

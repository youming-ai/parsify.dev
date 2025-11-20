/**
 * Image Processing Tools Registry
 * Central registry for all image processing tools with Canvas API integration
 */

import { ToolRegistry, type ToolMetadata, type ToolConfig } from "@/lib/registry/tool-registry";

// Image Processing Tool Imports (lazy-loaded)
const importImageConverter = () =>
  import("@/components/tools/image/image-converter").then((mod) => mod.ImageConverter);
const importImageCropper = () =>
  import("@/components/tools/image/image-cropper").then((mod) => mod.ImageCropper);
const importImageResizer = () =>
  import("@/components/tools/image/image-resizer").then((mod) => mod.ImageResizer);
const importQRCodeReader = () =>
  import("@/components/tools/image/qr-code-reader").then((mod) => mod.QRCodeReader);
const importScreenshotTool = () =>
  import("@/components/tools/image/screenshot-tool").then((mod) => mod.ScreenshotTool);
const importWatermarkAdder = () =>
  import("@/components/tools/image/watermark-adder").then((mod) => mod.WatermarkAdder);

// Image Utility Library Imports (lazy-loaded)
const importCanvasOperations = () =>
  import("@/lib/image/canvas-operations").then((mod) => mod.CanvasOperations);
const importQRScanner = () => import("@/lib/image/qr-scanner").then((mod) => mod.QRScanner);
const importFormatConverters = () =>
  import("@/lib/image/format-converters").then((mod) => mod.FormatConverters);

/**
 * Image Processing Tools Metadata Configuration
 * Canvas API-based tools with performance constraints for large files
 */
const IMAGE_PROCESSING_TOOLS_METADATA: ToolMetadata[] = [
  // Core Image Tools
  {
    id: "image-converter",
    name: "Image Format Converter",
    description:
      "Convert images between formats (JPEG, PNG, WebP, GIF, BMP, TIFF) with quality control",
    category: "image",
    version: "1.0.0",
    bundleSize: 28500, // 28.5KB
    loadTime: 120, // 120ms initialization
    dependencies: [],
    tags: ["image", "converter", "format", "jpeg", "png", "webp", "gif"],
    enabled: true,
    priority: 10, // High priority - core functionality
    icon: "RefreshCw",
    author: "Parsify Team",
    license: "MIT",
    maxFileSize: 10 * 1024 * 1024, // 10MB max file size
    maxProcessingTime: 3000, // 3 seconds max processing
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    description: "Crop images with live preview, aspect ratio presets, and precision controls",
    category: "image",
    version: "1.0.0",
    bundleSize: 24200,
    loadTime: 95,
    dependencies: [],
    tags: ["image", "cropper", "crop", "aspect-ratio", "preview"],
    enabled: true,
    priority: 9,
    icon: "Crop",
    author: "Parsify Team",
    license: "MIT",
    maxFileSize: 15 * 1024 * 1024, // 15MB for cropping
    maxProcessingTime: 2000,
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description:
      "Resize images with dimension controls, quality preservation, and batch processing",
    category: "image",
    version: "1.0.0",
    bundleSize: 26800,
    loadTime: 110,
    dependencies: [],
    tags: ["image", "resizer", "resize", "dimensions", "quality"],
    enabled: true,
    priority: 9,
    icon: "Maximize2",
    author: "Parsify Team",
    license: "MIT",
    maxFileSize: 20 * 1024 * 1024, // 20MB for resizing
    maxProcessingTime: 3000,
  },
  {
    id: "qr-code-reader",
    name: "QR Code Reader",
    description: "Scan and extract data from QR codes with error correction for damaged codes",
    category: "image",
    version: "1.0.0",
    bundleSize: 45600, // Includes qr-scanner library
    loadTime: 180,
    dependencies: ["qr-scanner"],
    tags: ["qr", "scanner", "barcode", "reader", "extraction"],
    enabled: true,
    priority: 8,
    icon: "Scan",
    author: "Parsify Team",
    license: "MIT",
    maxFileSize: 5 * 1024 * 1024, // 5MB for QR codes
    maxProcessingTime: 2000,
  },
  {
    id: "screenshot-tool",
    name: "Screenshot Tool",
    description: "Capture screenshots using Screen Capture API with annotation tools",
    category: "image",
    version: "1.0.0",
    bundleSize: 18900,
    loadTime: 75,
    dependencies: [],
    tags: ["screenshot", "capture", "screen", "annotation", "recording"],
    enabled: true,
    priority: 7,
    icon: "Camera",
    author: "Parsify Team",
    license: "MIT",
    requiresBrowserAPI: "navigator.mediaDevices.getDisplayMedia",
    maxFileSize: 10 * 1024 * 1024,
    maxProcessingTime: 1000,
  },
  {
    id: "watermark-adder",
    name: "Watermark Adder",
    description: "Add text and image watermarks with positioning, opacity, and styling controls",
    category: "image",
    version: "1.0.0",
    bundleSize: 32100,
    loadTime: 145,
    dependencies: [],
    tags: ["watermark", "copyright", "branding", "text", "overlay"],
    enabled: true,
    priority: 6,
    icon: "Droplet",
    author: "Parsify Team",
    license: "MIT",
    maxFileSize: 25 * 1024 * 1024, // 25MB for watermarking
    maxProcessingTime: 4000,
  },

  // Image Utility Libraries
  {
    id: "canvas-operations",
    name: "Canvas Operations Library",
    description: "Canvas API utilities for image manipulation and processing operations",
    category: "image",
    version: "1.0.0",
    bundleSize: 0, // Library only
    loadTime: 0,
    dependencies: [],
    tags: ["canvas", "operations", "utilities", "manipulation", "library"],
    enabled: true,
    priority: 0, // Library only
    icon: "Palette",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "qr-scanner",
    name: "QR Scanner Library",
    description: "QR code scanning and extraction library with error correction support",
    category: "image",
    version: "1.0.0",
    bundleSize: 0, // Library only
    loadTime: 0,
    dependencies: ["qr-scanner"],
    tags: ["qr", "scanner", "library", "extraction", "error-correction"],
    enabled: true,
    priority: 0, // Library only
    icon: "Scan",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "format-converters",
    name: "Format Converters Library",
    description: "Image format conversion utilities with quality control and optimization",
    category: "image",
    version: "1.0.0",
    bundleSize: 0, // Library only
    loadTime: 0,
    dependencies: [],
    tags: ["format", "converter", "library", "quality", "optimization"],
    enabled: true,
    priority: 0, // Library only
    icon: "RefreshCw",
    author: "Parsify Team",
    license: "MIT",
  },
];

/**
 * Image Processing Tools Configuration
 * Lazy loading configuration optimized for Canvas API performance
 */
const IMAGE_PROCESSING_CONFIGS: Omit<ToolConfig, "metadata">[] = [
  // Core Image Tools Configurations
  {
    component: undefined as any,
    importer: importImageConverter,
  },
  {
    component: undefined as any,
    importer: importImageCropper,
  },
  {
    component: undefined as any,
    importer: importImageResizer,
  },
  {
    component: undefined as any,
    importer: importQRCodeReader,
  },
  {
    component: undefined as any,
    importer: importScreenshotTool,
  },
  {
    component: undefined as any,
    importer: importWatermarkAdder,
  },

  // Library Services Configurations
  {
    component: undefined as any,
    importer: importCanvasOperations,
  },
  {
    component: undefined as any,
    importer: importQRScanner,
  },
  {
    component: undefined as any,
    importer: importFormatConverters,
  },
];

/**
 * Supported Image Formats
 */
export interface ImageFormatSupport {
  inputFormats: string[];
  outputFormats: string[];
  lossyFormats: string[];
  losslessFormats: string[];
  animatedFormats: string[];
}

/**
 * Image Processing Constraints
 */
export interface ImageProcessingConstraints {
  maxFileSize: number; // 25MB for processing, 10MB for conversion
  maxDimensions: { width: number; height: number }; // 8192x8192 pixels
  maxProcessingTime: number; // 4 seconds maximum
  supportedFormats: ImageFormatSupport;
  browserCapabilities: {
    webp: boolean;
    webpAnimated: boolean;
    heic: boolean;
    avif: boolean;
    screenCapture: boolean;
  };
}

/**
 * Image Processing Tools Registry Class
 * Manages image processing tools with Canvas API optimization
 */
export class ImageProcessingToolsRegistry {
  private toolRegistry: ToolRegistry;
  private static instance: ImageProcessingToolsRegistry | null = null;
  private constraints: ImageProcessingConstraints;

  private constructor() {
    this.toolRegistry = ToolRegistry.getInstance({
      enableLazyLoading: true,
      preloadPriority: 7, // Preload frequently used tools
      maxConcurrentLoads: 2, // Canvas API can be resource intensive
      retryAttempts: 2,
      cacheStrategy: "memory",
    });

    this.constraints = this.detectBrowserCapabilities();
    this.initializeTools();
  }

  /**
   * Get singleton instance of Image Processing Tools Registry
   */
  public static getInstance(): ImageProcessingToolsRegistry {
    if (!ImageProcessingToolsRegistry.instance) {
      ImageProcessingToolsRegistry.instance = new ImageProcessingToolsRegistry();
    }
    return ImageProcessingToolsRegistry.instance;
  }

  /**
   * Detect browser capabilities for image processing
   */
  private detectBrowserCapabilities(): ImageProcessingConstraints {
    const canvas = document.createElement("canvas");
    const webpSupported = canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    const avifSupported = (() => {
      const avif = new Image();
      return new Promise((resolve) => {
        avif.onload = () => resolve(true);
        avif.onerror = () => resolve(false);
        avif.src =
          "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=";
      })();
    })();

    return {
      maxFileSize: 25 * 1024 * 1024, // 25MB
      maxDimensions: { width: 8192, height: 8192 },
      maxProcessingTime: 4000, // 4 seconds
      supportedFormats: {
        inputFormats: ["jpeg", "jpg", "png", "webp", "gif", "bmp", "tiff", "ico"],
        outputFormats: ["jpeg", "png", "webp", "gif", "bmp"],
        lossyFormats: ["jpeg", "jpg", "webp"],
        losslessFormats: ["png", "gif", "bmp", "tiff"],
        animatedFormats: ["gif", "webp"], // WebP animation support varies
      },
      browserCapabilities: {
        webp: webpSupported,
        webpAnimated: false, // Complex to detect, assume false
        heic: false, // Not widely supported in browsers
        avif: avifSupported as boolean,
        screenCapture: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
      },
    };
  }

  /**
   * Initialize all image processing tools with capability validation
   */
  private initializeTools(): void {
    IMAGE_PROCESSING_TOOLS_METADATA.forEach((metadata, index) => {
      const config = IMAGE_PROCESSING_CONFIGS[index];

      if (config) {
        // Validate browser capabilities
        this.validateToolCapabilities(metadata);

        this.toolRegistry.registerTool({
          metadata,
          ...config,
        });
      }
    });

    // Preload core image tools
    this.preloadCoreTools();
  }

  /**
   * Validate tool capabilities against browser support
   */
  private validateToolCapabilities(metadata: ToolMetadata): void {
    const requiresScreenCapture =
      (metadata as any).requiresBrowserAPI === "navigator.mediaDevices.getDisplayMedia";

    if (requiresScreenCapture && !this.constraints.browserCapabilities.screenCapture) {
      console.warn(`Tool ${metadata.id} requires Screen Capture API which is not available`);
      // Tool will be disabled automatically
    }

    // Check format support
    if (metadata.id === "image-converter") {
      const unsupportedFormats = [];
      if (!this.constraints.browserCapabilities.webp) {
        unsupportedFormats.push("WebP");
      }
      if (unsupportedFormats.length > 0) {
        console.warn(`Image converter limitations: ${unsupportedFormats.join(", ")} not supported`);
      }
    }
  }

  /**
   * Preload essential image processing tools
   */
  private async preloadCoreTools(): Promise<void> {
    const coreToolIds = ["image-converter", "image-resizer"];

    try {
      await Promise.allSettled(coreToolIds.map((toolId) => this.toolRegistry.loadTool(toolId)));
    } catch (error) {
      console.warn("Failed to preload some core image tools:", error);
    }
  }

  /**
   * Get all image processing tools (excluding libraries)
   */
  public getImageProcessingTools(): ToolMetadata[] {
    return this.toolRegistry
      .getAllToolsMetadata()
      .filter((tool) => tool.category === "image" && tool.priority > 0);
  }

  /**
   * Get image utility libraries
   */
  public getImageLibraries(): ToolMetadata[] {
    return this.toolRegistry
      .getAllToolsMetadata()
      .filter((tool) => tool.category === "image" && tool.priority === 0);
  }

  /**
   * Get browser capabilities and constraints
   */
  public getBrowserCapabilities(): ImageProcessingConstraints {
    return { ...this.constraints };
  }

  /**
   * Validate image file against processing constraints
   */
  public validateImageFile(file: File): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check file size
    if (file.size > this.constraints.maxFileSize) {
      issues.push(
        `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum ${(this.constraints.maxFileSize / 1024 / 1024).toFixed(1)}MB`,
      );
      recommendations.push("Consider compressing the image or using a smaller file");
    }

    // Check file type
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension && !this.constraints.supportedFormats.inputFormats.includes(extension)) {
      issues.push(`Unsupported file format: .${extension}`);
      recommendations.push(
        `Supported formats: ${this.constraints.supportedFormats.inputFormats.join(", ")}`,
      );
    }

    // Estimate image dimensions (this would require actual loading)
    const potentialDimensions = this.estimateImageDimensions(file);
    if (
      potentialDimensions.width > this.constraints.maxDimensions.width ||
      potentialDimensions.height > this.constraints.maxDimensions.height
    ) {
      issues.push(
        `Image dimensions may exceed maximum ${this.constraints.maxDimensions.width}x${this.constraints.maxDimensions.height}px`,
      );
      recommendations.push("Consider resizing the image before processing");
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Estimate image dimensions based on file size (rough estimate)
   */
  private estimateImageDimensions(file: File): { width: number; height: number } {
    // Very rough estimation based on typical compression ratios
    const bytesPerPixel = 3; // RGB
    const totalPixels = file.size / bytesPerPixel;
    const sideLength = Math.sqrt(totalPixels);

    return {
      width: Math.round(sideLength),
      height: Math.round(sideLength),
    };
  }

  /**
   * Get processing statistics
   */
  public getProcessingStatistics(): {
    totalTools: number;
    enabledTools: number;
    libraries: number;
    browserSupport: Record<string, boolean>;
    constraints: ImageProcessingConstraints;
  } {
    const tools = this.getImageProcessingTools();
    const libraries = this.getImageLibraries();
    const enabledTools = tools.filter((tool) => tool.enabled);

    return {
      totalTools: tools.length,
      enabledTools: enabledTools.length,
      libraries: libraries.length,
      browserSupport: this.constraints.browserCapabilities,
      constraints: this.constraints,
    };
  }

  /**
   * Dispose of registry resources
   */
  public dispose(): void {
    this.toolRegistry.dispose();
    ImageProcessingToolsRegistry.instance = null;
  }
}

/**
 * Export singleton instance for immediate use
 */
export const imageProcessingRegistry = ImageProcessingToolsRegistry.getInstance();

/**
 * Export utility functions for common operations
 */
export const getImageProcessingTools = () => imageProcessingRegistry.getImageProcessingTools();
export const getImageLibraries = () => imageProcessingRegistry.getImageLibraries();
export const validateImageFile = (file: File) => imageProcessingRegistry.validateImageFile(file);
export const getBrowserCapabilities = () => imageProcessingRegistry.getBrowserCapabilities();

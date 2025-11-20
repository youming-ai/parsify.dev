/**
 * Comprehensive Tools Registration
 * Registers all tools with the ToolRegistry for lazy loading and management
 */

import { lazy } from "react";
import { ToolRegistry } from "@/lib/registry/tool-registry";

// Get registry instance
const registry = ToolRegistry.getInstance();

// Lazy loading imports for all tools
const toolImporters = {
  // JSON Tools
  "json-validator": () =>
    import("@/components/tools/json/json-validator").then((module) => ({
      default: module.JsonValidator,
    })),
  "json-formatter": () =>
    import("@/components/tools/json/json-formatter").then((module) => ({
      default: module.JsonFormatter,
    })),
  "json-minifier": () =>
    import("@/components/tools/json/json-minifier").then((module) => ({
      default: module.JsonMinifier,
    })),
  "json-converter": () =>
    import("@/components/tools/json/json-converter").then((module) => ({
      default: module.JsonConverter,
    })),
  "json-merger": () =>
    import("@/components/tools/json/json-merger").then((module) => ({
      default: module.JsonMerger,
    })),
  "json-differ": () =>
    import("@/components/tools/json/json-differ").then((module) => ({
      default: module.JsonDiffer,
    })),
  "json-path": () =>
    import("@/components/tools/json/json-path").then((module) => ({
      default: module.JsonPath,
    })),
  "json-schema-validator": () =>
    import("@/components/tools/json/json-schema-validator").then((module) => ({
      default: module.JsonSchemaValidator,
    })),
  "json-generator": () =>
    import("@/components/tools/json/json-generator").then((module) => ({
      default: module.JsonGenerator,
    })),
  "json-beautifier": () =>
    import("@/components/tools/json/json-beautifier").then((module) => ({
      default: module.JsonBeautifier,
    })),
  "json-sorter": () =>
    import("@/components/tools/json/json-sorter").then((module) => ({
      default: module.JsonSorter,
    })),
  "json-comparator": () =>
    import("@/components/tools/json/json-comparator").then((module) => ({
      default: module.JsonComparator,
    })),
  "json-transformer": () =>
    import("@/components/tools/json/json-transformer").then((module) => ({
      default: module.JsonTransformer,
    })),
  "json-parser": () =>
    import("@/components/tools/json/json-parser").then((module) => ({
      default: module.JsonParser,
    })),
  "json-colorizer": () =>
    import("@/components/tools/json/json-colorizer").then((module) => ({
      default: module.JsonColorizer,
    })),
  "json-yaml-converter": () =>
    import("@/components/tools/json/json-yaml-converter").then((module) => ({
      default: module.JsonYamlConverter,
    })),
  "json-csv-converter": () =>
    import("@/components/tools/json/json-csv-converter").then((module) => ({
      default: module.JsonCsvConverter,
    })),
  "json-xml-converter": () =>
    import("@/components/tools/json/json-xml-converter").then((module) => ({
      default: module.JsonXmlConverter,
    })),
  "json-base64-encoder": () =>
    import("@/components/tools/json/json-base64-encoder").then((module) => ({
      default: module.JsonBase64Encoder,
    })),
  "json-url-encoder": () =>
    import("@/components/tools/json/json-url-encoder").then((module) => ({
      default: module.JsonUrlEncoder,
    })),

  // Code Execution Tools
  "code-executor": () =>
    import("@/components/tools/code-execution/code-executor").then((module) => ({
      default: module.CodeExecutor,
    })),
  "typescript-transpiler": () =>
    import("@/components/tools/code-execution/typescript-transpiler").then((module) => ({
      default: module.TypeScriptTranspiler,
    })),
  "javascript-runner": () =>
    import("@/components/tools/code-execution/javascript-runner").then((module) => ({
      default: module.JavaScriptRunner,
    })),
  "python-executor": () =>
    import("@/components/tools/code-execution/python-executor").then((module) => ({
      default: module.PythonExecutor,
    })),
  "html-runner": () =>
    import("@/components/tools/code-execution/html-runner").then((module) => ({
      default: module.HTMLRunner,
    })),
  "css-editor": () =>
    import("@/components/tools/code-execution/css-editor").then((module) => ({
      default: module.CSSEditor,
    })),

  // Image Processing Tools
  "image-converter": () =>
    import("@/components/tools/image/image-converter").then((module) => ({
      default: module.ImageConverter,
    })),
  "image-cropper": () =>
    import("@/components/tools/image/image-cropper").then((module) => ({
      default: module.ImageCropper,
    })),
  "image-resizer": () =>
    import("@/components/tools/image/image-resizer").then((module) => ({
      default: module.ImageResizer,
    })),
  "qr-code-reader": () =>
    import("@/components/tools/image/qr-code-reader").then((module) => ({
      default: module.QRCodeReader,
    })),
  "screenshot-tool": () =>
    import("@/components/tools/image/screenshot-tool").then((module) => ({
      default: module.ScreenshotTool,
    })),
  "watermark-adder": () =>
    import("@/components/tools/image/watermark-adder").then((module) => ({
      default: module.WatermarkAdder,
    })),

  // Network Tools
  "http-request-simulator": () =>
    import("@/components/tools/network/http-request-simulator").then((module) => ({
      default: module.HTTPRequestSimulator,
    })),
  "ip-geolocation": () =>
    import("@/components/tools/network/ip-geolocation").then((module) => ({
      default: module.IPGeolocationTool,
    })),
  "url-shortener": () =>
    import("@/components/tools/network/url-shortener").then((module) => ({
      default: module.URLShortener,
    })),
  "web-connectivity": () =>
    import("@/components/tools/network/web-connectivity").then((module) => ({
      default: module.WebConnectivity,
    })),
  "user-agent-analyzer": () =>
    import("@/components/tools/network/user-agent-analyzer").then((module) => ({
      default: module.UserAgentAnalyzer,
    })),
  "network-diagnostics": () =>
    import("@/components/tools/network/network-diagnostics").then((module) => ({
      default: module.NetworkDiagnostics,
    })),
};

// Tool metadata for all tools
const toolsMetadata = [
  // JSON Tools
  {
    id: "json-validator",
    name: "JSON Validator",
    description: "Validate JSON syntax with detailed error reporting and suggestions",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 12000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "validator", "syntax", "error"],
    enabled: true,
    priority: 3,
    icon: "check-circle",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format and beautify JSON with customizable indentation and spacing",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 10000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "formatter", "beautify", "indent"],
    enabled: true,
    priority: 3,
    icon: "code",
  },
  {
    id: "json-minifier",
    name: "JSON Minifier",
    description: "Minify JSON to reduce file size and improve loading performance",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 8000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "minify", "compress", "optimize"],
    enabled: true,
    priority: 2,
    icon: "minimize",
  },
  {
    id: "json-converter",
    name: "JSON Converter",
    description: "Convert JSON to/from multiple formats like XML, CSV, YAML, and more",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 25000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "converter", "xml", "csv", "yaml"],
    enabled: true,
    priority: 3,
    icon: "refresh-cw",
  },
  {
    id: "json-merger",
    name: "JSON Merger",
    description: "Merge multiple JSON files with configurable merge strategies",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 15000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "merge", "combine", "array"],
    enabled: true,
    priority: 2,
    icon: "git-merge",
  },
  {
    id: "json-differ",
    name: "JSON Differ",
    description: "Compare JSON objects and highlight differences with detailed analysis",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 18000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "diff", "compare", "changes"],
    enabled: true,
    priority: 2,
    icon: "git-compare",
  },
  {
    id: "json-path",
    name: "JSON Path",
    description: "Query JSON data using JSONPath expressions with auto-completion",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 20000,
    loadTime: 0,
    dependencies: ["jsonpath-plus"],
    tags: ["json", "path", "query", "search"],
    enabled: true,
    priority: 2,
    icon: "search",
  },
  {
    id: "json-schema-validator",
    name: "JSON Schema Validator",
    description: "Validate JSON against schemas with comprehensive error reporting",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 30000,
    loadTime: 0,
    dependencies: ["ajv"],
    tags: ["json", "schema", "validate", "draft"],
    enabled: true,
    priority: 2,
    icon: "file-check",
  },
  {
    id: "json-generator",
    name: "JSON Generator",
    description: "Generate JSON data from templates and schemas with smart defaults",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 22000,
    loadTime: 0,
    dependencies: ["faker"],
    tags: ["json", "generator", "mock", "fake"],
    enabled: true,
    priority: 2,
    icon: "plus-circle",
  },
  {
    id: "json-beautifier",
    name: "JSON Beautifier",
    description: "Beautify JSON with advanced formatting options and color coding",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 14000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "beautify", "format", "color"],
    enabled: true,
    priority: 2,
    icon: "sparkles",
  },
  {
    id: "json-sorter",
    name: "JSON Sorter",
    description: "Sort JSON keys and arrays with custom sorting rules",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 12000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "sort", "organize", "keys"],
    enabled: true,
    priority: 1,
    icon: "sort-asc",
  },
  {
    id: "json-comparator",
    name: "JSON Comparator",
    description: "Deep comparison of JSON objects with side-by-side visualization",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 16000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "compare", "diff", "visual"],
    enabled: true,
    priority: 2,
    icon: "columns",
  },
  {
    id: "json-transformer",
    name: "JSON Transformer",
    description: "Transform JSON data using custom rules and functions",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 24000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "transform", "map", "convert"],
    enabled: true,
    priority: 2,
    icon: "transform",
  },
  {
    id: "json-parser",
    name: "JSON Parser",
    description: "Parse JSON with error recovery and syntax highlighting",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 11000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "parse", "syntax", "highlight"],
    enabled: true,
    priority: 3,
    icon: "code-2",
  },
  {
    id: "json-colorizer",
    name: "JSON Colorizer",
    description: "Add syntax highlighting and color coding to JSON",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 9000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "color", "syntax", "highlight"],
    enabled: true,
    priority: 1,
    icon: "palette",
  },
  {
    id: "json-yaml-converter",
    name: "JSON-YAML Converter",
    description: "Convert between JSON and YAML formats",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 13000,
    loadTime: 0,
    dependencies: ["js-yaml"],
    tags: ["json", "yaml", "converter", "format"],
    enabled: true,
    priority: 2,
    icon: "file-text",
  },
  {
    id: "json-csv-converter",
    name: "JSON-CSV Converter",
    description: "Convert JSON arrays to CSV and vice versa",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 14000,
    loadTime: 0,
    dependencies: ["papaparse"],
    tags: ["json", "csv", "converter", "table"],
    enabled: true,
    priority: 2,
    icon: "table",
  },
  {
    id: "json-xml-converter",
    name: "JSON-XML Converter",
    description: "Convert between JSON and XML formats",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 15000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "xml", "converter", "markup"],
    enabled: true,
    priority: 2,
    icon: "file-code",
  },
  {
    id: "json-base64-encoder",
    name: "JSON Base64 Encoder",
    description: "Encode and decode JSON to/from Base64",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 7000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "base64", "encode", "decode"],
    enabled: true,
    priority: 1,
    icon: "shield",
  },
  {
    id: "json-url-encoder",
    name: "JSON URL Encoder",
    description: "URL encode and decode JSON strings",
    category: "json" as const,
    version: "1.0.0",
    bundleSize: 6000,
    loadTime: 0,
    dependencies: [],
    tags: ["json", "url", "encode", "decode"],
    enabled: true,
    priority: 1,
    icon: "link",
  },

  // Code Execution Tools
  {
    id: "code-executor",
    name: "Code Executor",
    description: "Execute code with WASM sandboxing and real-time output",
    category: "code" as const,
    version: "1.0.0",
    bundleSize: 45000,
    loadTime: 0,
    dependencies: ["@/lib/execution/wasm-runtime"],
    tags: ["code", "execute", "wasm", "sandbox"],
    enabled: true,
    priority: 3,
    requiresWasm: true,
    requiresWorker: true,
    icon: "play",
  },
  {
    id: "typescript-transpiler",
    name: "TypeScript Transpiler",
    description: "Transpile TypeScript to JavaScript with type checking",
    category: "code" as const,
    version: "1.0.0",
    bundleSize: 38000,
    loadTime: 0,
    dependencies: ["typescript"],
    tags: ["typescript", "transpile", "javascript", "types"],
    enabled: true,
    priority: 2,
    requiresWasm: true,
    icon: "typescript",
  },
  {
    id: "javascript-runner",
    name: "JavaScript Runner",
    description: "Run JavaScript code with console output and error handling",
    category: "code" as const,
    version: "1.0.0",
    bundleSize: 22000,
    loadTime: 0,
    dependencies: [],
    tags: ["javascript", "run", "execute", "console"],
    enabled: true,
    priority: 3,
    icon: "javascript",
  },
  {
    id: "python-executor",
    name: "Python Executor",
    description: "Execute Python code with Pyodide in the browser",
    category: "code" as const,
    version: "1.0.0",
    bundleSize: 120000,
    loadTime: 0,
    dependencies: ["pyodide"],
    tags: ["python", "execute", "pyodide", "browser"],
    enabled: true,
    priority: 2,
    requiresWasm: true,
    icon: "python",
  },
  {
    id: "html-runner",
    name: "HTML Runner",
    description: "Run HTML code with live preview and CSS styling",
    category: "code" as const,
    version: "1.0.0",
    bundleSize: 18000,
    loadTime: 0,
    dependencies: [],
    tags: ["html", "preview", "css", "live"],
    enabled: true,
    priority: 3,
    icon: "globe",
  },
  {
    id: "css-editor",
    name: "CSS Editor",
    description: "Edit CSS with live preview and autocomplete",
    category: "code" as const,
    version: "1.0.0",
    bundleSize: 20000,
    loadTime: 0,
    dependencies: [],
    tags: ["css", "editor", "preview", "autocomplete"],
    enabled: true,
    priority: 2,
    icon: "css",
  },

  // Image Processing Tools
  {
    id: "image-converter",
    name: "Image Converter",
    description: "Convert images between PNG, JPEG, WebP, and BMP formats with quality control",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 45000,
    loadTime: 0,
    dependencies: ["@/lib/image/format-converters", "@/lib/image/canvas-operations"],
    tags: ["image", "converter", "format", "png", "jpeg", "webp", "bmp"],
    enabled: true,
    priority: 2,
    icon: "image",
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    description: "Crop images with precision controls, aspect ratios, and live preview",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 52000,
    loadTime: 0,
    dependencies: ["@/lib/image/canvas-operations"],
    tags: ["image", "crop", "aspect-ratio", "preview", "edit"],
    enabled: true,
    priority: 2,
    icon: "crop",
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize images with quality preservation and intelligent scaling",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 48000,
    loadTime: 0,
    dependencies: ["@/lib/image/canvas-operations", "@/lib/image/format-converters"],
    tags: ["image", "resize", "scale", "quality", "dimensions"],
    enabled: true,
    priority: 2,
    icon: "maximize",
  },
  {
    id: "qr-code-reader",
    name: "QR Code Reader",
    description: "Scan QR codes from images or camera with intelligent content detection",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 65000,
    loadTime: 0,
    dependencies: ["@/lib/image/qr-scanner", "qr-scanner"],
    tags: ["qr", "scanner", "camera", "barcode", "decode"],
    enabled: true,
    priority: 2,
    icon: "qrcode",
  },
  {
    id: "screenshot-tool",
    name: "Screenshot Tool",
    description:
      "Capture screenshots from your screen, windows, or browser tabs with annotation support",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 38000,
    loadTime: 0,
    dependencies: ["@/lib/image/canvas-operations"],
    tags: ["screenshot", "capture", "screen", "annotation", "browser"],
    enabled: true,
    priority: 1,
    requiresBrowserAPI: true,
    icon: "camera",
  },
  {
    id: "watermark-adder",
    name: "Watermark Adder",
    description: "Add text or image watermarks with precise positioning and styling",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 55000,
    loadTime: 0,
    dependencies: ["@/lib/image/canvas-operations"],
    tags: ["watermark", "text", "image", "branding", "protect"],
    enabled: true,
    priority: 2,
    icon: "layers",
  },

  // Network Tools
  {
    id: "http-request-simulator",
    name: "HTTP Request Simulator",
    description:
      "Simulate HTTP requests with timing analysis and comprehensive response inspection",
    category: "network" as const,
    version: "1.0.0",
    bundleSize: 42000,
    loadTime: 0,
    dependencies: [],
    tags: ["http", "request", "timing", "api", "testing"],
    enabled: true,
    priority: 2,
    icon: "send",
  },
  {
    id: "ip-geolocation",
    name: "IP Geolocation",
    description:
      "Get comprehensive IP geolocation data from multiple sources with detailed network information",
    category: "network" as const,
    version: "1.0.0",
    bundleSize: 38000,
    loadTime: 0,
    dependencies: [],
    tags: ["ip", "geolocation", "location", "network", "mapping"],
    enabled: true,
    priority: 2,
    icon: "map-pin",
  },
  {
    id: "url-shortener",
    name: "URL Shortener",
    description:
      "Create short URLs with custom aliases, password protection, and analytics tracking",
    category: "network" as const,
    version: "1.0.0",
    bundleSize: 35000,
    loadTime: 0,
    dependencies: [],
    tags: ["url", "shortener", "link", "analytics", "tracking"],
    enabled: true,
    priority: 2,
    icon: "link",
  },
  {
    id: "web-connectivity",
    name: "Web Connectivity Test",
    description:
      "Comprehensive network connectivity testing with WebRTC, HTTP, WebSocket, and speed measurements",
    category: "network" as const,
    version: "1.0.0",
    bundleSize: 45000,
    loadTime: 0,
    dependencies: [],
    tags: ["connectivity", "webrtc", "websocket", "speed", "network"],
    enabled: true,
    priority: 2,
    requiresBrowserAPI: true,
    icon: "wifi",
  },
  {
    id: "user-agent-analyzer",
    name: "User Agent Analyzer",
    description: "Analyze browser user agent strings with detailed device and capability detection",
    category: "network" as const,
    version: "1.0.0",
    bundleSize: 28000,
    loadTime: 0,
    dependencies: [],
    tags: ["user-agent", "browser", "device", "detection", "analysis"],
    enabled: true,
    priority: 2,
    icon: "monitor",
  },
  {
    id: "network-diagnostics",
    name: "Network Diagnostics",
    description:
      "Comprehensive network diagnostics with connectivity, performance, and security analysis",
    category: "network" as const,
    version: "1.0.0",
    bundleSize: 52000,
    loadTime: 0,
    dependencies: [],
    tags: ["diagnostics", "network", "performance", "security", "analysis"],
    enabled: true,
    priority: 2,
    icon: "activity",
  },
];

// Register all tools with the registry
export function registerAllTools(): void {
  toolsMetadata.forEach((metadata) => {
    const importer = toolImporters[metadata.id as keyof typeof toolImporters];

    if (!importer) {
      console.warn(`No importer found for tool: ${metadata.id}`);
      return;
    }

    try {
      registry.registerTool({
        component: () => null, // Will be loaded dynamically
        metadata,
        importer,
      });
    } catch (error) {
      console.error(`Failed to register tool ${metadata.id}:`, error);
    }
  });
}

// Initialize all tools when this module is imported
registerAllTools();

// Export registry instance and tools
export { registry };

// Export lazy loading components for direct use
export const JsonValidator = lazy(() =>
  import("@/components/tools/json/json-validator").then((module) => ({
    default: module.JsonValidator,
  })),
);
export const JsonFormatter = lazy(() =>
  import("@/components/tools/json/json-formatter").then((module) => ({
    default: module.JsonFormatter,
  })),
);
export const JsonMinifier = lazy(() =>
  import("@/components/tools/json/json-minifier").then((module) => ({
    default: module.JsonMinifier,
  })),
);
export const JsonConverter = lazy(() =>
  import("@/components/tools/json/json-converter").then((module) => ({
    default: module.JsonConverter,
  })),
);
export const JsonMerger = lazy(() =>
  import("@/components/tools/json/json-merger").then((module) => ({
    default: module.JsonMerger,
  })),
);
export const JsonDiffer = lazy(() =>
  import("@/components/tools/json/json-differ").then((module) => ({
    default: module.JsonDiffer,
  })),
);
export const JsonPath = lazy(() =>
  import("@/components/tools/json/json-path").then((module) => ({
    default: module.JsonPath,
  })),
);
export const JsonSchemaValidator = lazy(() =>
  import("@/components/tools/json/json-schema-validator").then((module) => ({
    default: module.JsonSchemaValidator,
  })),
);
export const JsonGenerator = lazy(() =>
  import("@/components/tools/json/json-generator").then((module) => ({
    default: module.JsonGenerator,
  })),
);
export const JsonBeautifier = lazy(() =>
  import("@/components/tools/json/json-beautifier").then((module) => ({
    default: module.JsonBeautifier,
  })),
);
export const JsonSorter = lazy(() =>
  import("@/components/tools/json/json-sorter").then((module) => ({
    default: module.JsonSorter,
  })),
);
export const JsonComparator = lazy(() =>
  import("@/components/tools/json/json-comparator").then((module) => ({
    default: module.JsonComparator,
  })),
);
export const JsonTransformer = lazy(() =>
  import("@/components/tools/json/json-transformer").then((module) => ({
    default: module.JsonTransformer,
  })),
);
export const JsonParser = lazy(() =>
  import("@/components/tools/json/json-parser").then((module) => ({
    default: module.JsonParser,
  })),
);
export const JsonColorizer = lazy(() =>
  import("@/components/tools/json/json-colorizer").then((module) => ({
    default: module.JsonColorizer,
  })),
);
export const JsonYamlConverter = lazy(() =>
  import("@/components/tools/json/json-yaml-converter").then((module) => ({
    default: module.JsonYamlConverter,
  })),
);
export const JsonCsvConverter = lazy(() =>
  import("@/components/tools/json/json-csv-converter").then((module) => ({
    default: module.JsonCsvConverter,
  })),
);
export const JsonXmlConverter = lazy(() =>
  import("@/components/tools/json/json-xml-converter").then((module) => ({
    default: module.JsonXmlConverter,
  })),
);
export const JsonBase64Encoder = lazy(() =>
  import("@/components/tools/json/json-base64-encoder").then((module) => ({
    default: module.JsonBase64Encoder,
  })),
);
export const JsonUrlEncoder = lazy(() =>
  import("@/components/tools/json/json-url-encoder").then((module) => ({
    default: module.JsonUrlEncoder,
  })),
);

export const CodeExecutor = lazy(() =>
  import("@/components/tools/code-execution/code-executor").then((module) => ({
    default: module.CodeExecutor,
  })),
);
export const TypeScriptTranspiler = lazy(() =>
  import("@/components/tools/code-execution/typescript-transpiler").then((module) => ({
    default: module.TypeScriptTranspiler,
  })),
);
export const JavaScriptRunner = lazy(() =>
  import("@/components/tools/code-execution/javascript-runner").then((module) => ({
    default: module.JavaScriptRunner,
  })),
);
export const PythonExecutor = lazy(() =>
  import("@/components/tools/code-execution/python-executor").then((module) => ({
    default: module.PythonExecutor,
  })),
);
export const HTMLRunner = lazy(() =>
  import("@/components/tools/code-execution/html-runner").then((module) => ({
    default: module.HTMLRunner,
  })),
);
export const CSSEditor = lazy(() =>
  import("@/components/tools/code-execution/css-editor").then((module) => ({
    default: module.CSSEditor,
  })),
);

export const ImageConverter = lazy(() =>
  import("@/components/tools/image/image-converter").then((module) => ({
    default: module.ImageConverter,
  })),
);
export const ImageCropper = lazy(() =>
  import("@/components/tools/image/image-cropper").then((module) => ({
    default: module.ImageCropper,
  })),
);
export const ImageResizer = lazy(() =>
  import("@/components/tools/image/image-resizer").then((module) => ({
    default: module.ImageResizer,
  })),
);
export const QRCodeReader = lazy(() =>
  import("@/components/tools/image/qr-code-reader").then((module) => ({
    default: module.QRCodeReader,
  })),
);
export const ScreenshotTool = lazy(() =>
  import("@/components/tools/image/screenshot-tool").then((module) => ({
    default: module.ScreenshotTool,
  })),
);
export const WatermarkAdder = lazy(() =>
  import("@/components/tools/image/watermark-adder").then((module) => ({
    default: module.WatermarkAdder,
  })),
);

export const HTTPRequestSimulator = lazy(() =>
  import("@/components/tools/network/http-request-simulator").then((module) => ({
    default: module.HTTPRequestSimulator,
  })),
);
export const IPGeolocationTool = lazy(() =>
  import("@/components/tools/network/ip-geolocation").then((module) => ({
    default: module.IPGeolocationTool,
  })),
);
export const URLShortener = lazy(() =>
  import("@/components/tools/network/url-shortener").then((module) => ({
    default: module.URLShortener,
  })),
);
export const WebConnectivity = lazy(() =>
  import("@/components/tools/network/web-connectivity").then((module) => ({
    default: module.WebConnectivity,
  })),
);
export const UserAgentAnalyzer = lazy(() =>
  import("@/components/tools/network/user-agent-analyzer").then((module) => ({
    default: module.UserAgentAnalyzer,
  })),
);
export const NetworkDiagnostics = lazy(() =>
  import("@/components/tools/network/network-diagnostics").then((module) => ({
    default: module.NetworkDiagnostics,
  })),
);

// Export tools metadata for external use
export { toolsMetadata };

// Utility functions for tool management
export async function preloadToolsByCategory(category: string): Promise<void> {
  const categoryTools = registry.getToolsByCategory(category);

  await Promise.allSettled(
    categoryTools
      .filter((tool) => tool.enabled && tool.priority >= 3) // Only preload high priority tools
      .map(async (tool) => {
        try {
          await registry.loadTool(tool.id);
        } catch (error) {
          console.warn(`Failed to preload tool ${tool.id}:`, error);
        }
      }),
  );
}

export async function preloadHighPriorityTools(): Promise<void> {
  const allTools = registry.getAllToolsMetadata();

  await Promise.allSettled(
    allTools
      .filter((tool) => tool.enabled && tool.priority >= 3)
      .map(async (tool) => {
        try {
          await registry.loadTool(tool.id);
        } catch (error) {
          console.warn(`Failed to preload high priority tool ${tool.id}:`, error);
        }
      }),
  );
}

// Get tools by category with lazy loading
export function getToolsByCategory(category: string) {
  return registry.getToolsByCategory(category);
}

// Search tools with metadata
export function searchTools(query: string) {
  return registry.searchTools(query);
}

// Get registry statistics
export function getRegistryStatistics() {
  return registry.getStatistics();
}

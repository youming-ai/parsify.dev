import type { Tool } from "@/types/tools";

// Tools data organized by new category structure
export const toolsData: Tool[] = [
  // JSON Tools
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description:
      "Format, beautify, and validate JSON data with customizable indentation and sorting options",
    category: "JSON Tools",
    icon: "FileJson",
    features: [
      "Format & Beautify",
      "Syntax Validation",
      "Custom Indentation",
      "Key Sorting",
      "Error Detection",
    ],
    tags: ["json", "formatter", "validator", "beautifier"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/json/formatter",
    isPopular: true,
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "json-validator",
    name: "JSON Validator",
    description: "Comprehensive JSON validation with detailed error messages and schema support",
    category: "JSON Tools",
    icon: "FileJson",
    features: ["Syntax Validation", "Schema Validation", "Detailed Errors", "Real-time Validation"],
    tags: ["json", "validator", "schema", "error-detection"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/json/validator",
    isPopular: true,
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "json-converter",
    name: "JSON to YAML",
    description: "Convert JSON to various formats like XML, CSV, YAML, and vice versa",
    category: "JSON Tools",
    icon: "FileJson",
    features: ["Multiple Formats", "Batch Conversion", "Custom Mapping", "Preview Mode"],
    tags: ["json", "converter", "xml", "csv", "yaml"],
    difficulty: "intermediate",
    status: "stable",
    href: "/tools/json/converter",
    isNew: true,
    processingType: "hybrid",
    security: "local-only",
  },
  {
    id: "json-path-queries",
    name: "JSON Path Evaluator",
    description: "Extract and query data from JSON using JSONPath expressions",
    category: "JSON Tools",
    icon: "FileJson",
    features: ["JSONPath Expressions", "Real-time Results", "Syntax Highlighting", "Query History"],
    tags: ["json", "jsonpath", "query", "extract"],
    difficulty: "intermediate",
    status: "beta",
    href: "/tools/json/path-queries",
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "json-java-converter",
    name: "JSON to Java Converter",
    description: "Convert JSON to Java classes and POJOs with proper type mapping",
    category: "JSON Tools",
    icon: "FileJson",
    features: ["Java Class Generation", "Type Mapping", "Package Support", "Annotations"],
    tags: ["json", "java", "converter", "pojo", "class"],
    difficulty: "intermediate",
    status: "stable",
    href: "/tools/json/java-converter",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "json-python-converter",
    name: "JSON to Python Converter",
    description: "Convert JSON to Python dataclasses and type hints",
    category: "JSON Tools",
    icon: "FileJson",
    features: ["Dataclass Generation", "Type Hints", "Validation", "Import Support"],
    tags: ["json", "python", "converter", "dataclass", "types"],
    difficulty: "intermediate",
    status: "stable",
    href: "/tools/json/python-converter",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "json-jwt-decoder",
    name: "JWT Debugger",
    description: "Decode and debug JSON Web Tokens with header and payload analysis",
    category: "JSON Tools",
    icon: "FileJson",
    features: ["Token Decoding", "Header Analysis", "Payload Inspection", "Signature Verification"],
    tags: ["json", "jwt", "token", "decoder", "debugger"],
    difficulty: "intermediate",
    status: "stable",
    href: "/tools/json/jwt-decoder",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },

  // Common/Auxiliary Tools - Formatting Subcategory
  {
    id: "code-formatter",
    name: "Code Formatter",
    description: "Format and beautify code in multiple programming languages",
    category: "Common/Auxiliary Tools",
    subcategory: "Formatting",
    icon: "Code",
    features: ["Multiple Languages", "Prettier Integration", "Custom Rules", "Batch Formatting"],
    tags: ["code", "formatter", "prettier", "beautifier"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/code/formatter",
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "sql-formatter",
    name: "SQL Formatter",
    description: "Format and beautify SQL queries with proper indentation and syntax highlighting",
    category: "Common/Auxiliary Tools",
    subcategory: "Formatting",
    icon: "Database",
    features: ["SQL Formatting", "Syntax Highlighting", "Query Optimization", "Multiple Dialects"],
    tags: ["sql", "formatter", "query", "database", "beautifier"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/code/sql-formatter",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "xml-formatter",
    name: "XML Formatter",
    description: "Format and beautify XML documents with proper indentation and structure",
    category: "Common/Auxiliary Tools",
    subcategory: "Formatting",
    icon: "Code",
    features: ["XML Formatting", "Syntax Validation", "Pretty Print", "Structure Analysis"],
    tags: ["xml", "formatter", "beautifier", "validation", "structure"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/code/xml-formatter",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "css-formatter",
    name: "CSS Formatter",
    description: "Format and beautify CSS with proper indentation and property organization",
    category: "Common/Auxiliary Tools",
    subcategory: "Formatting",
    icon: "Code",
    features: ["CSS Formatting", "Property Sorting", "Selector Organization", "Minification"],
    tags: ["css", "formatter", "beautifier", "styling", "prettier"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/code/css-formatter",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },

  // Common/Auxiliary Tools - Online Language Support Subcategory
  {
    id: "code-executor",
    name: "Code Editor",
    description: "Execute code in a secure WASM sandbox with multiple language support",
    category: "Common/Auxiliary Tools",
    subcategory: "Online Language Support",
    icon: "Terminal",
    features: ["Multi-language Support", "Secure Sandboxing", "Real-time Output", "Debug Mode"],
    tags: ["code", "executor", "wasm", "sandbox", "javascript", "python"],
    difficulty: "intermediate",
    status: "stable",
    href: "/tools/code/executor",
    isPopular: true,
    processingType: "client-side",
    security: "secure-sandbox",
  },

  // Common/Auxiliary Tools - Other Tools Subcategory
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test and debug regular expressions with real-time matching and explanation",
    category: "Common/Auxiliary Tools",
    subcategory: "Other Tools",
    icon: "Pattern",
    features: ["Real-time Testing", "Match Explanation", "Pattern Library", "Export Patterns"],
    tags: ["regex", "testing", "pattern", "validation"],
    difficulty: "intermediate",
    status: "stable",
    href: "/tools/code/regex",
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "data-validator",
    name: "Data Validator",
    description: "Validate data against custom rules and schemas",
    category: "Common/Auxiliary Tools",
    subcategory: "Other Tools",
    icon: "Shield",
    features: ["Custom Rules", "Schema Validation", "Batch Validation", "Detailed Reports"],
    tags: ["data", "validation", "schema", "rules"],
    difficulty: "advanced",
    status: "experimental",
    href: "/tools/data/validator",
    processingType: "hybrid",
    security: "local-only",
  },

  // Image/Media Tools
  {
    id: "image-compression",
    name: "Base64 Image Encoder",
    description: "Convert images to Base64 encoding and compress images for web optimization",
    category: "Image/Media Tools",
    icon: "Image",
    features: ["Image Compression", "Base64 Encoding", "Format Conversion", "Quality Control"],
    tags: ["image", "compression", "base64", "encoder", "optimization"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/image/compression",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },

  // Network/Ops/Encoding Tools
  {
    id: "url-encoder",
    name: "URL Encoder/Decoder",
    description: "Encode and decode URLs and URL components",
    category: "Network/Ops/Encoding Tools",
    icon: "Http",
    features: ["URL Encoding", "Component Encoding", "Batch Processing", "Format Detection"],
    tags: ["url", "encode", "decode", "encoding"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/utilities/url-encoder",
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "base64-converter",
    name: "Base64 Encoder/Decoder",
    description: "Convert between text and Base64 encoding",
    category: "Network/Ops/Encoding Tools",
    icon: "Password",
    features: ["Text to Base64", "File to Base64", "Batch Conversion", "Preview Mode"],
    tags: ["base64", "encoding", "conversion", "file"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/utilities/base64-converter",
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "base32-converter",
    name: "Base32 Converter",
    description: "Convert between text and Base32 encoding for various applications",
    category: "Network/Ops/Encoding Tools",
    icon: "Code",
    features: ["Base32 Encoding", "Text Conversion", "File Support", "Validation"],
    tags: ["base32", "encoding", "conversion", "text"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/utilities/base32-converter",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "qr-generator",
    name: "QR Code Generator",
    description: "Generate QR codes for URLs, text, and other data",
    category: "Network/Ops/Encoding Tools",
    icon: "QrCode",
    features: ["QR Generation", "Custom Design", "Multiple Data Types", "High Resolution"],
    tags: ["qr", "generator", "code", "barcode", "url"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/utilities/qr-generator",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },

  // Text Tools
  {
    id: "text-processor",
    name: "Diff Checker",
    description: "Compare text and find differences between two text inputs",
    category: "Text Tools",
    icon: "Difference",
    features: ["Text Comparison", "Difference Highlighting", "Merge Options", "Export Results"],
    tags: ["text", "diff", "comparison", "merge"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/file/text-processor",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "character-counter",
    name: "Character Counter",
    description: "Count characters, words, lines, and other text statistics",
    category: "Text Tools",
    icon: "FormatAlignLeft",
    features: ["Character Count", "Word Count", "Line Count", "Text Statistics"],
    tags: ["text", "counter", "character", "word", "statistics"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/text/character-counter",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },

  {
    id: "unix-converter",
    name: "Unix Timestamp Converter",
    description: "Convert between Unix timestamps and human-readable dates",
    category: "Text Tools",
    icon: "Schedule",
    features: ["Timestamp Conversion", "Multiple Formats", "Batch Conversion", "Time Zones"],
    tags: ["unix", "timestamp", "converter", "date", "time"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/time/unix-converter",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },

  // Encryption/Hashing/Generation Tools
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate various hash types for data integrity and security",
    category: "Encryption/Hashing/Generation",
    icon: "EnhancedEncryption",
    features: ["Multiple Algorithms", "File & Text Hashing", "Batch Processing", "Compare Hashes"],
    tags: ["hash", "checksum", "md5", "sha256", "security"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/data/hash-generator",
    processingType: "client-side",
    security: "local-only",
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate UUIDs and GUIDs in various formats",
    category: "Encryption/Hashing/Generation",
    icon: "Fingerprint",
    features: ["UUID Generation", "Multiple Versions", "Bulk Generation", "Format Options"],
    tags: ["uuid", "generator", "guid", "identifier", "unique"],
    difficulty: "beginner",
    status: "stable",
    href: "/tools/utilities/uuid-generator",
    isNew: true,
    processingType: "client-side",
    security: "local-only",
  },
];

// New category structure definition
export const categoryStructure = [
  {
    id: "json-tools",
    name: "JSON Tools",
    description: "JSON processing, validation, and conversion tools",
  },
  {
    id: "common-auxiliary-tools",
    name: "Common/Auxiliary Tools",
    description: "General development and formatting utilities",
    subcategories: [
      {
        id: "formatting",
        name: "Formatting",
        description: "Code and data formatting tools",
      },
      {
        id: "online-language-support",
        name: "Online Language Support",
        description: "Code execution and language tools",
      },
      {
        id: "other-tools",
        name: "Other Tools",
        description: "Miscellaneous development utilities",
      },
    ],
  },
  {
    id: "image-media-tools",
    name: "Image/Media Tools",
    description: "Image processing and media conversion tools",
  },
  {
    id: "network-ops-encoding-tools",
    name: "Network/Ops/Encoding Tools",
    description: "Network utilities and encoding tools",
  },
  {
    id: "text-tools",
    name: "Text Tools",
    description: "Text processing and analysis tools",
  },
  {
    id: "encryption-hashing-generation",
    name: "Encryption/Hashing/Generation",
    description: "Security and generation utilities",
  },
] as const;

// Categories extraction
export const categories = Array.from(new Set(toolsData.map((tool) => tool.category)));

// Get all unique tags
export const getAllTags = (): string[] => {
  const tags = new Set<string>();
  toolsData.forEach((tool) => {
    tool.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
};

// Get tools by category
export const getToolsByCategory = (category: string): Tool[] => {
  return toolsData.filter((tool) => tool.category === category);
};

// Get tools by category and subcategory
export const getToolsByCategoryAndSubcategory = (
  category: string,
  subcategory?: string,
): Tool[] => {
  return toolsData.filter(
    (tool) =>
      tool.category === category &&
      (subcategory ? tool.subcategory === subcategory : !tool.subcategory),
  );
};

// Get subcategories for a category
export const getSubcategoriesForCategory = (category: string): string[] => {
  const subcategories = new Set<string>();
  toolsData
    .filter((tool) => tool.category === category && tool.subcategory)
    .forEach((tool) => subcategories.add(tool.subcategory!));
  return Array.from(subcategories);
};

// Get popular tools
export const getPopularTools = (): Tool[] => {
  return toolsData.filter((tool) => tool.isPopular);
};

// Get new tools
export const getNewTools = (): Tool[] => {
  return toolsData.filter((tool) => tool.isNew);
};

// Search tools
export const searchTools = (query: string): Tool[] => {
  const lowercaseQuery = query.toLowerCase();
  return toolsData.filter(
    (tool) =>
      tool.name.toLowerCase().includes(lowercaseQuery) ||
      tool.description.toLowerCase().includes(lowercaseQuery) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
      tool.category.toLowerCase().includes(lowercaseQuery) ||
      tool.subcategory?.toLowerCase().includes(lowercaseQuery),
  );
};

// Get tool by ID
export const getToolById = (id: string): Tool | undefined => {
  return toolsData.find((tool) => tool.id === id);
};

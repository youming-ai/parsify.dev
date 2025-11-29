import type { Tool } from '@/types/tools';

// Updated tools data - expanded coverage aligned with SelfDevKit
export const toolsData: Tool[] = [
  // JSON Tools (8 core tools)
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description:
      'Instantly format, beautify, and validate JSON data with customizable indentation levels, alphabetical key sorting, and syntax highlighting. Perfect for debugging API responses and configuration files.',
    category: 'JSON Tools',
    icon: 'FileJson',
    features: [
      'Format & Beautify',
      'Syntax Validation',
      'Custom Indentation',
      'Key Sorting',
      'Error Detection',
    ],
    tags: ['json', 'formatter', 'validator', 'beautifier'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/json/formatter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-validator',
    name: 'JSON Validator',
    description:
      'Validate JSON syntax with detailed error messages, line numbers, and JSON Schema support. Quickly identify malformed data, missing brackets, and invalid escape sequences in your JSON documents.',
    category: 'JSON Tools',
    icon: 'FileJson',
    features: ['Syntax Validation', 'Schema Validation', 'Detailed Errors', 'Real-time Validation'],
    tags: ['json', 'validator', 'schema', 'error-detection'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/json/validator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-converter',
    name: 'JSON to YAML',
    description:
      'Seamlessly convert JSON to YAML, XML, CSV, and TOML formats with bidirectional support. Ideal for config file migration, data transformation, and cross-platform compatibility workflows.',
    category: 'JSON Tools',
    icon: 'FileJson',
    features: ['Multiple Formats', 'Batch Conversion', 'Custom Mapping', 'Preview Mode'],
    tags: ['json', 'converter', 'xml', 'csv', 'yaml'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/json/converter',
    isNew: true,
    processingType: 'hybrid',
    security: 'local-only',
  },
  {
    id: 'json-path-queries',
    name: 'JSON Path Evaluator',
    description:
      'Query and extract data from complex JSON structures using JSONPath expressions. Test queries in real-time with syntax highlighting, auto-completion, and result previews for efficient data extraction.',
    category: 'JSON Tools',
    icon: 'FileJson',
    features: ['JSONPath Expressions', 'Real-time Results', 'Syntax Highlighting', 'Query History'],
    tags: ['json', 'jsonpath', 'query', 'extract'],
    difficulty: 'intermediate',
    status: 'beta',
    href: '/tools/json/path-queries',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-jwt-decoder',
    name: 'JWT Debugger',
    description:
      'Decode, inspect, and debug JSON Web Tokens (JWT) with detailed header and payload analysis. View claims, expiration times, and issuer information without exposing sensitive data to external servers.',
    category: 'JSON Tools',
    icon: 'FileJson',
    features: ['Token Decoding', 'Header Analysis', 'Payload Inspection', 'Signature Verification'],
    tags: ['json', 'jwt', 'token', 'decoder', 'debugger'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/json/jwt-decoder',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-hero-viewer',
    name: 'JSON Hero Viewer',
    description:
      'Explore JSON data with an intuitive tree view, collapsible nodes, and breadcrumb navigation. Features search, filtering, path copying, and beautiful syntax highlighting for effortless data exploration.',
    category: 'JSON Tools',
    icon: 'FileJson',
    features: ['Tree View', 'Path Navigation', 'Search & Filter', 'Export Options'],
    tags: ['json', 'viewer', 'tree', 'navigation', 'hero'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/json/hero-viewer',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-to-code',
    name: 'JSON to Code Generator',
    description:
      'Transform JSON data into strongly-typed code for TypeScript, Python, Java, Go, Rust, and more. Auto-generate interfaces, classes, and data models with proper naming conventions and type inference.',
    category: 'JSON Tools',
    icon: 'FileJson',
    features: ['Multi-Language Support', 'Type Generation', 'Code Templates', 'Export Options'],
    tags: ['json', 'code', 'generator', 'typescript', 'python', 'java', 'go', 'rust'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/json/to-code',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-to-types',
    name: 'JSON to Types',
    description:
      'Generate type definitions and data models from JSON samples for TypeScript, Python, Go, and Java. Accelerate development with accurate type inference and ready-to-use code snippets.',
    category: 'JSON Tools',
    icon: 'FileJson',
    features: [
      'TypeScript/Python/Go/Java',
      'Inline Preview',
      'Copy & Download',
      'Local Processing',
    ],
    tags: ['json', 'types', 'models', 'codegen'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/json/to-types',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // Code Tools (4 core tools)
  {
    id: 'code-formatter',
    name: 'Code Formatter',
    description:
      'Format and beautify code in JavaScript, TypeScript, Python, HTML, CSS, and more using industry-standard formatters like Prettier. Ensure consistent code style across your projects.',
    category: 'Code Tools',
    icon: 'Code',
    features: ['Multiple Languages', 'Prettier Integration', 'Custom Rules', 'Batch Formatting'],
    tags: ['code', 'formatter', 'beautifier'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/code/formatter',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'code-executor',
    name: 'Code Executor',
    description:
      'Run JavaScript, TypeScript, and Python code directly in your browser with a secure WebAssembly sandbox. Perfect for testing snippets, learning programming, and quick prototyping without setup.',
    category: 'Code Tools',
    icon: 'Terminal',
    features: ['Multi-Language Support', 'Real-time Execution', 'Console Output', 'Error Handling'],
    tags: ['code', 'executor', 'runner', 'playground'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/code/executor',
    isPopular: true,
    processingType: 'client-side',
    security: 'secure-sandbox',
  },
  {
    id: 'html-viewer',
    name: 'HTML Viewer',
    description:
      'Preview HTML, CSS, and JavaScript code in a secure sandboxed iframe. Test responsive layouts, debug styling issues, and prototype UI components with instant live rendering and theme switching.',
    category: 'Code Tools',
    icon: 'Globe',
    features: ['Live Preview', 'Theme Toggle', 'Sample Templates', 'Sandboxed'],
    tags: ['html', 'viewer', 'preview'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/code/html-viewer',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'html-tools',
    name: 'HTML Tools',
    description:
      'All-in-one HTML toolkit for formatting, minifying, validating structure, and encoding special characters. Optimize HTML for production or make it readable for debugging and code reviews.',
    category: 'Code Tools',
    icon: 'Code',
    features: ['Format', 'Minify', 'Validate', 'Encode Entities'],
    tags: ['html', 'format', 'validate', 'minify'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/code/html-tools',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // Image Tools (5 core tools)
  {
    id: 'image-compression',
    name: 'Image Compressor',
    description:
      'Reduce image file sizes by up to 80% while preserving visual quality using advanced lossy and lossless compression algorithms. Supports JPEG, PNG, WebP, and GIF formats with batch processing.',
    category: 'Image Tools',
    icon: 'Image',
    features: ['Quality Control', 'Batch Processing', 'Format Conversion', 'Size Optimization'],
    tags: ['image', 'compression', 'optimization', 'quality'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/image/compression',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description:
      'Convert images between PNG, JPEG, WebP, GIF, and AVIF formats with quality control and metadata preservation. Optimize images for web performance or specific platform requirements.',
    category: 'Image Tools',
    icon: 'Image',
    features: ['Multiple Formats', 'Batch Conversion', 'Quality Settings', 'Preview'],
    tags: ['image', 'converter', 'format', 'png', 'jpeg', 'webp'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/image/converter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    description:
      'Resize images to exact dimensions or scale proportionally with aspect ratio lock. Supports percentage-based scaling, preset sizes for social media, and high-quality resampling algorithms.',
    category: 'Image Tools',
    icon: 'Image',
    features: ['Custom Dimensions', 'Aspect Ratio', 'Batch Resize', 'Quality Control'],
    tags: ['image', 'resize', 'scale', 'dimensions'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/image/resizer',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'qr-reader',
    name: 'QR Code Reader',
    description:
      'Instantly scan and decode QR codes from uploaded images or live camera feed. Extract URLs, text, contact info, and other encoded data with support for multiple barcode formats.',
    category: 'Image Tools',
    icon: 'QrCode',
    features: ['Image Upload', 'Camera Scan', 'Batch Processing', 'Export Results'],
    tags: ['qr', 'code', 'reader', 'scanner', 'decode'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/image/qr-reader',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'base64-image',
    name: 'Base64 Image Converter',
    description:
      'Encode images to Base64 data URIs for embedding in HTML, CSS, or JSON. Decode Base64 strings back to images with instant preview, format detection, and one-click download.',
    category: 'Image Tools',
    icon: 'Image',
    features: ['Encode & Decode', 'Live Preview', 'Copy & Download', 'Local Processing'],
    tags: ['base64', 'image', 'encode', 'decode'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/image/base64',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // Network Tools (4 core tools)
  {
    id: 'http-simulator',
    name: 'HTTP Request Simulator',
    description:
      'Test REST APIs with custom HTTP methods, headers, query parameters, and request bodies. Inspect responses with syntax highlighting, timing metrics, and request history for debugging.',
    category: 'Network Tools',
    icon: 'Network',
    features: ['Custom Headers', 'Request Methods', 'Response Preview', 'History'],
    tags: ['http', 'request', 'api', 'testing', 'debug'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/network/http-simulator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'ip-geolocation',
    name: 'IP Geolocation',
    description:
      'Look up geographic location, ISP, organization, and timezone information for any IP address. Useful for security analysis, content localization, and network troubleshooting.',
    category: 'Network Tools',
    icon: 'MapPin',
    features: ['IP Lookup', 'Location Data', 'ISP Information', 'Batch Processing'],
    tags: ['ip', 'geolocation', 'location', 'lookup'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/network/ip-geolocation',
    processingType: 'hybrid',
    security: 'local-only',
  },
  {
    id: 'url-shortener',
    name: 'URL Shortener',
    description:
      'Create compact, shareable short URLs with optional custom aliases. Generate QR codes for links and track basic click analytics for marketing and social media campaigns.',
    category: 'Network Tools',
    icon: 'Link',
    features: ['Short URLs', 'Custom Aliases', 'Analytics', 'QR Codes'],
    tags: ['url', 'shortener', 'link', 'redirect'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/network/url-shortener',
    processingType: 'hybrid',
    security: 'local-only',
  },
  {
    id: 'dns-lookup',
    name: 'DNS Lookup',
    description:
      'Query DNS records including A, AAAA, MX, TXT, CNAME, NS, and SOA types. Diagnose domain configuration issues, verify email settings, and troubleshoot DNS propagation.',
    category: 'Network Tools',
    icon: 'Globe',
    features: ['Record Queries', 'TTL Display', 'Multiple Record Types', 'Inline Results'],
    tags: ['dns', 'lookup', 'network', 'resolver'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/network/dns-lookup',
    processingType: 'server-side',
    security: 'network-required',
  },

  // Text Tools (4 core tools)
  {
    id: 'character-counter',
    name: 'Character Counter',
    description:
      'Analyze text with detailed statistics including character count, word count, sentence count, paragraph count, and estimated reading time. Essential for content writers and SEO professionals.',
    category: 'Text Tools',
    icon: 'Type',
    features: ['Character Count', 'Word Count', 'Line Count', 'Reading Time'],
    tags: ['text', 'counter', 'statistics', 'analysis'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/text/character-counter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'case-converter',
    name: 'Case Converter',
    description:
      'Transform text between uppercase, lowercase, title case, sentence case, camelCase, snake_case, kebab-case, and more. Perfect for formatting variable names, titles, and content.',
    category: 'Text Tools',
    icon: 'Type',
    features: ['Multiple Cases', 'Batch Processing', 'Custom Rules', 'Preview'],
    tags: ['text', 'case', 'converter', 'uppercase', 'lowercase'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/text/case-converter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'encoding-converter',
    name: 'Text Encoding Converter',
    description:
      'Convert text between UTF-8, UTF-16, ASCII, ISO-8859-1, and other character encodings. Detect encoding automatically, fix mojibake issues, and ensure cross-platform text compatibility.',
    category: 'Text Tools',
    icon: 'Type',
    features: ['Multiple Encodings', 'Auto-Detection', 'Batch Processing', 'Validation'],
    tags: ['text', 'encoding', 'converter', 'utf8', 'ascii'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/text/encoding-converter',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'text-analyzer',
    name: 'Text Analyzer',
    description:
      'Comprehensive text analysis with readability scores (Flesch-Kincaid, Gunning Fog), keyword density, sentiment analysis, and linguistic pattern detection for content optimization.',
    category: 'Text Tools',
    icon: 'Type',
    features: ['Readability Score', 'Sentiment Analysis', 'Keyword Extraction', 'Statistics'],
    tags: ['text', 'analyzer', 'sentiment', 'readability'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/text/analyzer',
    processingType: 'client-side',
    security: 'local-only',
  },

  // Security Tools (5 core tools)
  {
    id: 'password-generator',
    name: 'Password Generator',
    description:
      'Generate cryptographically secure passwords with customizable length, character sets (uppercase, lowercase, numbers, symbols), and exclusion rules. Never reuse weak passwords again.',
    category: 'Security Tools',
    icon: 'Lock',
    features: ['Custom Length', 'Character Sets', 'Strength Meter', 'Batch Generation'],
    tags: ['password', 'generator', 'security', 'random'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/security/password-generator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description:
      'Generate cryptographic hashes using MD5, SHA-1, SHA-256, SHA-512, and other algorithms. Hash text or files, verify checksums, and compare hashes for data integrity verification.',
    category: 'Security Tools',
    icon: 'Hash',
    features: ['Multiple Algorithms', 'File Hashing', 'Batch Processing', 'Verification'],
    tags: ['hash', 'generator', 'md5', 'sha256', 'crypto'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/data/hash-generator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'aes-encryption',
    name: 'AES Encryption',
    description:
      'Encrypt and decrypt sensitive data using AES-256 encryption with secure key derivation. Protect passwords, API keys, and confidential information with military-grade encryption locally.',
    category: 'Security Tools',
    icon: 'Lock',
    features: ['AES-256', 'Encryption/Decryption', 'Key Management', 'Secure'],
    tags: ['aes', 'encryption', 'decrypt', 'security', 'crypto'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/security/aes-encryption',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'secret-generator',
    name: 'Secret Generator',
    description:
      'Generate secure API keys, access tokens, and secrets with customizable formats. Support for prefixes (sk_, pk_), custom character sets, and specific length requirements for various platforms.',
    category: 'Security Tools',
    icon: 'KeyRound',
    features: ['Custom Length', 'Character Sets', 'Prefix Support', 'Copy'],
    tags: ['secret', 'token', 'api-key', 'generator'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/security/secret-generator',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'id-analyzer',
    name: 'ID Analyzer',
    description:
      'Detect, validate, and decode unique identifiers including UUID v1-v7, ULID, MongoDB ObjectId, and Twitter Snowflake IDs. Extract embedded timestamps and metadata from supported formats.',
    category: 'Security Tools',
    icon: 'ScanLine',
    features: ['Pattern Detection', 'Metadata Extraction', 'Local Analysis', 'Copy'],
    tags: ['id', 'uuid', 'ulid', 'objectid', 'snowflake'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/security/id-analyzer',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // Utilities (6 core tools)
  {
    id: 'url-encoder',
    name: 'URL Encoder/Decoder',
    description:
      'Encode special characters for safe URL transmission using percent-encoding, or decode encoded URLs back to readable text. Essential for working with query strings and API parameters.',
    category: 'Utilities',
    icon: 'Link',
    features: ['URL Encoding', 'URL Decoding', 'Component Encoding', 'Batch Processing'],
    tags: ['url', 'encoder', 'decoder', 'uri', 'percent-encoding'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/utilities/url-encoder',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'base64-converter',
    name: 'Base64 Encoder/Decoder',
    description:
      'Convert text and binary files to Base64 encoding for safe transmission in URLs, emails, and JSON. Decode Base64 strings back to original content with automatic format detection.',
    category: 'Utilities',
    icon: 'Binary',
    features: ['Text Encoding', 'File Encoding', 'Decoding', 'Validation'],
    tags: ['base64', 'encoder', 'decoder', 'encoding'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/utilities/base64-converter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description:
      'Create customizable QR codes for URLs, text, WiFi credentials, contact cards (vCard), and more. Adjust size, colors, and error correction levels, then download as PNG or SVG.',
    category: 'Utilities',
    icon: 'QrCode',
    features: ['Custom Data', 'Size Control', 'Color Options', 'Download'],
    tags: ['qr', 'code', 'generator', 'barcode'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/utilities/qr-generator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'compression-tool',
    name: 'Compression Tools',
    description:
      'Compress text and data using gzip or deflate algorithms directly in your browser. Decompress compressed content, compare sizes, and optimize data for storage or transmission.',
    category: 'Utilities',
    icon: 'Compress',
    features: ['Gzip & Deflate', 'Compress/Decompress', 'Size Stats', 'Local Processing'],
    tags: ['compression', 'gzip', 'deflate'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/utilities/compression',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'file-generator',
    name: 'File Generator',
    description:
      'Generate test files of specific sizes with customizable content patterns. Create dummy files for upload testing, storage benchmarks, or placeholder data with precise size control.',
    category: 'Utilities',
    icon: 'File',
    features: ['Size Control', 'Presets', 'Custom Content', 'Download'],
    tags: ['file', 'generator', 'test-data'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/file/generator',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // Converters (3 core tools)
  {
    id: 'number-base-converter',
    name: 'Number Base Converter',
    description:
      'Convert integers between binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16). Essential for low-level programming, debugging, and understanding computer number systems.',
    category: 'Converters',
    icon: 'Binary',
    features: [
      'Binary Conversion',
      'Octal Conversion',
      'Decimal Conversion',
      'Hexadecimal Conversion',
    ],
    tags: ['number', 'base', 'binary', 'hex', 'octal', 'decimal', 'converter'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/converters/number-base',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description:
      'Convert colors between HEX, RGB, HSL, HSV, CMYK, and other formats with live preview. Pick colors visually, copy values in any format, and explore color harmonies for design projects.',
    category: 'Converters',
    icon: 'Palette',
    features: ['HEX to RGB', 'RGB to HSL', 'Color Preview', 'Copy Values'],
    tags: ['color', 'hex', 'rgb', 'hsl', 'converter', 'palette'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/converters/color',
    isNew: true,
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'html-entity-encoder',
    name: 'HTML Entity Encoder',
    description:
      'Convert special characters to HTML entities (like &amp;, &lt;, &quot;) and decode entities back to characters. Prevent XSS vulnerabilities and ensure proper HTML rendering.',
    category: 'Converters',
    icon: 'Code',
    features: ['Entity Encoding', 'Entity Decoding', 'Special Characters', 'Batch Processing'],
    tags: ['html', 'entity', 'encode', 'decode', 'escape'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/converters/html-entity',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    description:
      'Generate classic Lorem Ipsum placeholder text for UI designs, mockups, and prototypes. Customize output by paragraphs, sentences, or word count for perfect content simulation.',
    category: 'Generators',
    icon: 'FileText',
    features: ['Paragraphs', 'Words', 'Sentences', 'Custom Length'],
    tags: ['lorem', 'ipsum', 'placeholder', 'text', 'generator', 'dummy'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/generators/lorem-ipsum',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'cron-parser',
    name: 'Cron Expression Parser',
    description:
      'Decode cron expressions into human-readable schedules and preview upcoming execution times. Build and validate cron syntax for scheduled tasks, CI/CD pipelines, and automation workflows.',
    category: 'Utilities',
    icon: 'Clock',
    features: ['Cron Parsing', 'Human Readable', 'Next Run Times', 'Validation'],
    tags: ['cron', 'parser', 'schedule', 'expression', 'time'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/utilities/cron-parser',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // Time Tools (1 core tool)
  {
    id: 'unix-converter',
    name: 'Unix Timestamp Converter',
    description:
      'Convert Unix timestamps (seconds/milliseconds since epoch) to human-readable dates and vice versa. Supports multiple timezones, date formats, and relative time calculations.',
    category: 'Time Tools',
    icon: 'Clock',
    features: ['Timestamp Conversion', 'Date Formatting', 'Timezone Support', 'Batch Processing'],
    tags: ['unix', 'timestamp', 'date', 'time', 'converter'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/time/unix-converter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
];

// Export tool categories for navigation
export const toolCategories = [
  'JSON Tools',
  'Code Tools',
  'Image Tools',
  'Network Tools',
  'Text Tools',
  'Security Tools',
  'Utilities',
  'Converters',
  'Generators',
  'Time Tools',
];

// Legacy export for compatibility
export const categories = toolCategories;

// Export popular tools
export const popularTools = toolsData.filter((tool) => tool.isPopular);

// Export new tools
export const newTools = toolsData.filter((tool) => tool.isNew);

// Helper functions
export const getToolById = (id: string): Tool | undefined => {
  return toolsData.find((tool) => tool.id === id);
};

export const getToolsByCategory = (category: string): Tool[] => {
  return toolsData.filter((tool) => tool.category === category);
};

export const getPopularTools = (): Tool[] => {
  return popularTools;
};

export const getNewTools = (): Tool[] => {
  return newTools;
};

export const getAllCategories = (): string[] => {
  return toolCategories;
};

export const searchTools = (query: string): Tool[] => {
  const lowerQuery = query.toLowerCase();
  return toolsData.filter(
    (tool) =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};

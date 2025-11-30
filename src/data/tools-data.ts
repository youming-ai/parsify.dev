import type { Tool } from '@/types/tools';

/**
 * Tools data aligned with SelfDevKit - 28 tools across 6 categories
 * https://selfdevkit.com/features/
 */
export const toolsData: Tool[] = [
  // ============================================
  // Data Format & Conversion (9 tools)
  // ============================================
  {
    id: 'json-tools',
    name: 'JSON Tools',
    description:
      'Format, validate, and manipulate JSON data. Includes JSON beautifier, minifier, and validator with dual-pane viewer.',
    category: 'Data Format & Conversion',
    icon: 'FileJson',
    features: [
      'Dual-pane JSON Viewer',
      'Search & Filter',
      'Validation & Error Highlighting',
      'Indentation Options',
      'Offline & Private',
    ],
    tags: ['json', 'formatter', 'validator', 'beautifier', 'viewer'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/data-format/json-tools',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'base64-string',
    name: 'Base64 String',
    description:
      'Encode and decode text to/from Base64. Useful for data encoding and transmission with real-time results.',
    category: 'Data Format & Conversion',
    icon: 'Binary',
    features: [
      'Encode & Decode Modes',
      'Real-Time Results',
      'One-Click Actions',
      'Minimal UI',
      'Offline & Private',
    ],
    tags: ['base64', 'encoder', 'decoder', 'text', 'encoding'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/data-format/base64-string',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'base64-image',
    name: 'Base64 Image',
    description:
      'Convert images to Base64 and vice versa. Embed images in CSS or HTML with instant preview.',
    category: 'Data Format & Conversion',
    icon: 'Image',
    features: [
      'Encode & Decode Modes',
      'Output Preview',
      'Image Info',
      'Real-Time Results',
      'Offline & Private',
    ],
    tags: ['base64', 'image', 'encode', 'decode', 'data-uri'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/data-format/base64-image',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'html-viewer',
    name: 'HTML Viewer',
    description:
      'Preview and render HTML code. Test HTML snippets and templates with live preview.',
    category: 'Data Format & Conversion',
    icon: 'Globe',
    features: ['Live HTML Preview', 'Offline & Private', 'Lightning Fast & Secure'],
    tags: ['html', 'viewer', 'preview', 'render'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/data-format/html-viewer',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'html-tools',
    name: 'HTML Tools',
    description:
      'Format, minify, and validate HTML code. Clean and optimize HTML markup with entity encoding.',
    category: 'Data Format & Conversion',
    icon: 'Code',
    features: [
      'Format HTML',
      'Minify HTML',
      'Encode & Decode Entities',
      'Validate HTML',
      'Preview HTML',
      'Offline & Private',
    ],
    tags: ['html', 'format', 'minify', 'validate', 'entities'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/data-format/html-tools',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'markdown-editor',
    name: 'Markdown Editor',
    description:
      'Edit and preview Markdown content. Convert Markdown to HTML with GitHub Flavored Markdown support.',
    category: 'Data Format & Conversion',
    icon: 'FileText',
    features: [
      'Live Preview',
      'Syntax Highlighting',
      'GitHub Flavored Markdown',
      'Export to HTML/PDF',
      'Offline & Private',
    ],
    tags: ['markdown', 'editor', 'preview', 'gfm', 'html'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/data-format/markdown-editor',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'sql-tools',
    name: 'SQL Tools',
    description:
      'Format and validate SQL queries. Beautify and optimize SQL code with syntax highlighting.',
    category: 'Data Format & Conversion',
    icon: 'Database',
    features: [
      'SQL Editor with Syntax Highlighting',
      'Validate SQL',
      'Format SQL',
      'Sample Queries',
      'Offline & Private',
    ],
    tags: ['sql', 'formatter', 'validator', 'query', 'database'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/data-format/sql-tools',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'compression-tools',
    name: 'Compression Tools',
    description:
      'Compress and decompress data using Brotli and Gzip algorithms. Optimize file sizes with detailed stats.',
    category: 'Data Format & Conversion',
    icon: 'Minimize2',
    features: [
      'Compress & Decompress',
      'GZIP & Brotli Support',
      'Size & Compression Stats',
      'Input & Output Details',
      'Offline & Private',
    ],
    tags: ['compression', 'gzip', 'brotli', 'decompress', 'optimize'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/data-format/compression-tools',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-to-types',
    name: 'JSON to Types',
    description:
      'Convert JSON to strongly-typed models in TypeScript, Rust, Python, Go, or Ruby. Generate type-safe code from JSON.',
    category: 'Data Format & Conversion',
    icon: 'FileJson',
    features: [
      'Convert JSON to Types',
      'Multiple Language Support',
      'Customizable Settings',
      'Offline & Private',
    ],
    tags: ['json', 'types', 'typescript', 'python', 'rust', 'go', 'ruby'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/data-format/json-to-types',
    processingType: 'client-side',
    security: 'local-only',
  },

  // ============================================
  // Security & Authentication (5 tools)
  // ============================================
  {
    id: 'jwt-tools',
    name: 'JWT Tools',
    description:
      'Decode, verify, and debug JSON Web Tokens. JWK signature verification with automatic key fetching.',
    category: 'Security & Authentication',
    icon: 'KeyRound',
    features: [
      'Decode JWT',
      'Verify & Sign JWT',
      'Multiple Algorithm Support',
      'Offline & Private',
    ],
    tags: ['jwt', 'token', 'decoder', 'verify', 'sign', 'auth'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/security/jwt-decoder',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description:
      'Generate secure passwords with customizable options. Create strong, random passwords with strength analysis.',
    category: 'Security & Authentication',
    icon: 'Lock',
    features: [
      'Generate Strong Passwords',
      'Customizable Options',
      'Password Strength & Analysis',
      'Offline & Private',
    ],
    tags: ['password', 'generator', 'security', 'random', 'strength'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/security/password-generator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'secret-generator',
    name: 'Secret Generator',
    description:
      'Generate secure secrets and API keys. Create random strings for API keys, JWT secrets, encryption keys, and more.',
    category: 'Security & Authentication',
    icon: 'KeyRound',
    features: ['Generate Wide Range of Secrets', 'Copy with One Click', 'Offline & Private'],
    tags: ['secret', 'api-key', 'token', 'generator', 'random'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/security/secret-generator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'key-pair-generator',
    name: 'Key Pair Generator',
    description:
      'Generate RSA key pairs for encryption, authentication, and digital signatures with customizable key sizes.',
    category: 'Security & Authentication',
    icon: 'Key',
    features: [
      'Generate RSA Key Pairs',
      'Customizable Key Size',
      'View Private & Public Keys',
      'Key Statistics & Security Info',
      'Offline & Private',
    ],
    tags: ['rsa', 'key-pair', 'encryption', 'public-key', 'private-key'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/security/key-pair-generator',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description:
      'Generate hashes using MD5, SHA1, SHA256, SHA512, SHA3, RIPEMD, Whirlpool, BLAKE, and more algorithms.',
    category: 'Security & Authentication',
    icon: 'Hash',
    features: [
      'Generate Hashes for Your Data',
      'Wide Range of Algorithms',
      'Copy & Clear',
      'Offline & Private',
    ],
    tags: ['hash', 'md5', 'sha256', 'sha512', 'crypto', 'checksum'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/security/hash-generator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // ============================================
  // Development & Testing (6 tools)
  // ============================================
  {
    id: 'id-analyzer',
    name: 'ID Analyzer',
    description:
      'Analyze and decode UUIDs, GUIDs, ULIDs, Nano IDs, MongoDB ObjectIDs and more. Get detailed breakdowns and metadata.',
    category: 'Development & Testing',
    icon: 'ScanLine',
    features: ['Analyze All Major ID Types', 'Inspect, Validate & Convert', 'Offline & Private'],
    tags: ['uuid', 'ulid', 'guid', 'objectid', 'nanoid', 'analyzer'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/development/id-analyzer',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'id-generator',
    name: 'ID Generator',
    description:
      'Generate UUIDs (v1, v4, v7), GUIDs, ULIDs, Nano IDs, and KSUIds. Batch generation with one-click copy.',
    category: 'Development & Testing',
    icon: 'Fingerprint',
    features: ['Generate Multiple Types of IDs', 'Batch Generation & Copy', 'Offline & Private'],
    tags: ['uuid', 'ulid', 'guid', 'nanoid', 'generator', 'batch'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/development/id-generator',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'regex-validator',
    name: 'Regex Validator',
    description:
      'Validate and test regular expressions against sample text. See matches, groups, and indices in real time.',
    category: 'Development & Testing',
    icon: 'Regex',
    features: [
      'Instant Regex Validation & Testing',
      'Regex Flags & Cheat Sheet',
      'Match Highlighting & Debugging',
      'Offline & Private',
    ],
    tags: ['regex', 'regular-expression', 'validator', 'tester', 'pattern'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/development/regex-validator',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'text-inspector',
    name: 'Text Inspector',
    description:
      'Analyze text for character, word, line, sentence counts. Get encoding info, byte size, and formatting breakdowns.',
    category: 'Development & Testing',
    icon: 'Type',
    features: [
      'Instant Text Analysis & Statistics',
      'Encoding & Formatting Insights',
      'Developer-Focused Details',
      'Offline & Private',
    ],
    tags: ['text', 'analyzer', 'counter', 'statistics', 'encoding'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/development/text-inspector',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'lorem-generator',
    name: 'Lorem Generator',
    description:
      'Generate lorem ipsum placeholder text for designs and mockups. Customize paragraphs, words, or sentences.',
    category: 'Development & Testing',
    icon: 'FileText',
    features: [
      'Customizable Placeholder Text',
      'Flexible Controls & Options',
      'Real-Time Stats',
      'Offline & Private',
    ],
    tags: ['lorem', 'ipsum', 'placeholder', 'text', 'generator'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/development/lorem-ipsum',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'diff-viewer',
    name: 'Diff Viewer',
    description:
      'Compare and edit text or code side-by-side. See all changes and differences highlighted in real time.',
    category: 'Development & Testing',
    icon: 'GitCompare',
    features: [
      'Side-by-Side Diff & Editing',
      'Powerful for Code & Text',
      'Developer Productivity',
      'Offline & Private',
    ],
    tags: ['diff', 'compare', 'merge', 'text', 'code'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/development/diff-viewer',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // ============================================
  // Network & Web (2 tools)
  // ============================================
  {
    id: 'url-parser',
    name: 'URL Parser',
    description:
      'Parse and inspect URLs. View all components: protocol, host, port, path, hash, and query string parameters.',
    category: 'Network & Web',
    icon: 'Link',
    features: [
      'Parse & Inspect URLs Instantly',
      'Edit Query Strings & Parameters',
      'Developer Productivity',
      'Offline & Private',
    ],
    tags: ['url', 'parser', 'query', 'encode', 'decode'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/network/url-parser',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'dns-lookup',
    name: 'DNS Lookup',
    description:
      'Query DNS records including A, AAAA, MX, TXT, CNAME, NS, and SOA types for any domain.',
    category: 'Network & Web',
    icon: 'Globe',
    features: ['Query DNS Records', 'Multiple Record Types', 'TTL Display'],
    tags: ['dns', 'lookup', 'domain', 'records', 'network'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/network/dns-lookup',
    processingType: 'server-side',
    security: 'network-required',
  },

  // ============================================
  // File Tools (3 tools)
  // ============================================
  {
    id: 'file-generator',
    name: 'File Generator',
    description:
      'Generate test files in PDF, Word, CSV, JSON, PNG, JPG, SVG, Excel, and text formats with customizable content and size.',
    category: 'File Tools',
    icon: 'File',
    features: [
      'Generate Any File Type Instantly',
      'Fully Customizable Content & Size',
      'Batch Generation & Automation',
      'Developer & QA Focused',
      'Offline & Privacy-First',
    ],
    tags: ['file', 'generator', 'test', 'pdf', 'csv', 'json'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/file/generator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description:
      'Convert images between PNG, JPG, WebP, GIF, TIFF, SVG formats. Batch conversion with preview.',
    category: 'File Tools',
    icon: 'Image',
    features: [
      'Convert Between All Major Image Formats',
      'Batch Conversion & Automation',
      'Preview & Download Instantly',
      'Offline & Privacy-First',
    ],
    tags: ['image', 'converter', 'png', 'jpg', 'webp', 'format'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/file/image-converter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'image-operations',
    name: 'Image Operations',
    description:
      'Crop, rotate, and resize images to any dimension. Batch editing with aspect ratio control.',
    category: 'File Tools',
    icon: 'Crop',
    features: [
      'Crop, Rotate, and Resize Instantly',
      'Batch Image Editing',
      'Preview & Download Instantly',
      'Supports All Major Formats',
      'Offline & Privacy-First',
    ],
    tags: ['image', 'crop', 'rotate', 'resize', 'edit'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/file/image-operations',
    processingType: 'client-side',
    security: 'local-only',
  },

  // ============================================
  // Utility (3 tools)
  // ============================================
  {
    id: 'timestamps',
    name: 'Timestamps',
    description:
      'Convert between Unix timestamps, ISO 8601, UTC, and local time. Timezone conversion and calendar info.',
    category: 'Utility',
    icon: 'Clock',
    features: [
      'Convert & Inspect Timestamps Instantly',
      'Timezone Conversion & Calendar Info',
      'Flexible Date & Time Formatting',
      'Developer Productivity',
      'Offline & Privacy-First',
    ],
    tags: ['timestamp', 'unix', 'date', 'time', 'timezone', 'epoch'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/utility/timestamps',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'color-tools',
    name: 'Color Tools',
    description:
      'Convert colors between HEX, RGB, HSL, CMYK, OKLCH formats. Generate harmonies and check contrast for accessibility.',
    category: 'Utility',
    icon: 'Palette',
    features: [
      'Convert Between All Major Color Formats',
      'Generate Color Harmonies',
      'Contrast Checker & Accessibility',
      'Offline & Privacy-First',
    ],
    tags: ['color', 'hex', 'rgb', 'hsl', 'converter', 'palette', 'accessibility'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/tools/utility/color-tools',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'cronjob-generator',
    name: 'Cronjob Generator',
    description:
      'Generate and inspect cron expressions for any schedule. Preview next trigger dates with human-readable descriptions.',
    category: 'Utility',
    icon: 'Calendar',
    features: [
      'Generate & Inspect Cron Expressions',
      'Preview Next Trigger Dates',
      'Use Presets & Learn Syntax',
      'Offline & Privacy-First',
    ],
    tags: ['cron', 'cronjob', 'scheduler', 'time', 'automation'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/tools/utility/cronjob-generator',
    processingType: 'client-side',
    security: 'local-only',
  },
];

// Export tool categories for navigation (matching SelfDevKit)
export const toolCategories = [
  'Data Format & Conversion',
  'Security & Authentication',
  'Development & Testing',
  'Network & Web',
  'File Tools',
  'Utility',
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

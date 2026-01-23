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
      'Online JSON formatter, validator, and beautifier tool. Format, minify, validate JSON data with real-time syntax highlighting and error detection. Free, fast, and privacy-first JSON editor.',
    category: 'Data Format & Conversion',
    icon: 'FileJson',
    features: [
      'Dual-pane JSON Viewer',
      'Search & Filter',
      'Validation & Error Highlighting',
      'Indentation Options',
      'Offline & Private',
    ],
    tags: [
      'json',
      'formatter',
      'validator',
      'beautifier',
      'viewer',
      'minify',
      'editor',
      'parser',
      'json-formatter',
      'json-validator',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/data-format/json-tools',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'base64-string',
    name: 'Base64 Encoder/Decoder',
    description:
      'Free online Base64 encoder and decoder tool. Convert text to Base64 and decode Base64 strings instantly. Perfect for data encoding, API development, and transmission with real-time conversion.',
    category: 'Data Format & Conversion',
    icon: 'Binary',
    features: [
      'Encode & Decode Modes',
      'Real-Time Results',
      'One-Click Actions',
      'Minimal UI',
      'Offline & Private',
    ],
    tags: [
      'base64',
      'encoder',
      'decoder',
      'text',
      'encoding',
      'convert',
      'base64-encode',
      'base64-decode',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/data-format/base64-string',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'base64-image',
    name: 'Base64 Image Converter',
    description:
      'Convert images to Base64 data URI and decode Base64 to images online. Perfect for embedding images in HTML, CSS, or data URLs. Supports PNG, JPG, GIF, SVG formats with instant preview.',
    category: 'Data Format & Conversion',
    icon: 'Image',
    features: [
      'Encode & Decode Modes',
      'Output Preview',
      'Image Info',
      'Real-Time Results',
      'Offline & Private',
    ],
    tags: ['base64', 'image', 'encode', 'decode', 'data-uri', 'img-to-base64', 'png-to-base64'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/data-format/base64-image',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'html-viewer',
    name: 'HTML Viewer & Previewer',
    description:
      'Online HTML viewer with live preview. Render HTML code instantly and see the visual output. Perfect for testing HTML snippets, templates, and markup with real-time rendering in browser.',
    category: 'Data Format & Conversion',
    icon: 'Globe',
    features: ['Live HTML Preview', 'Offline & Private', 'Lightning Fast & Secure'],
    tags: ['html', 'viewer', 'preview', 'render', 'html-preview', 'test-html'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/data-format/html-viewer',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'html-tools',
    name: 'HTML Formatter & Minifier',
    description:
      'Free online HTML formatter, beautifier, and minifier tool. Format pretty-print HTML, minify for production, validate markup, and encode/decode HTML entities. Optimize your HTML code instantly.',
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
    tags: [
      'html',
      'format',
      'minify',
      'validate',
      'entities',
      'beautify',
      'html-formatter',
      'html-minifier',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/data-format/html-tools',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'markdown-editor',
    name: 'Markdown Editor & Previewer',
    description:
      'Online Markdown editor with live preview and GitHub Flavored Markdown support. Write, preview, and convert Markdown to HTML. Perfect for documentation, README files, and content creation.',
    category: 'Data Format & Conversion',
    icon: 'FileText',
    features: [
      'Live Preview',
      'Syntax Highlighting',
      'GitHub Flavored Markdown',
      'Export to HTML/PDF',
      'Offline & Private',
    ],
    tags: ['markdown', 'editor', 'preview', 'gfm', 'html', 'markdown-preview', 'markdown-to-html'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/data-format/markdown-editor',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'sql-tools',
    name: 'SQL Formatter & Beautifier',
    description:
      'Free online SQL formatter and beautifier tool. Format pretty-print SQL queries, validate syntax, and optimize SQL code. Supports MySQL, PostgreSQL, SQLite, and more with syntax highlighting.',
    category: 'Data Format & Conversion',
    icon: 'Database',
    features: [
      'SQL Editor with Syntax Highlighting',
      'Validate SQL',
      'Format SQL',
      'Sample Queries',
      'Offline & Private',
    ],
    tags: ['sql', 'formatter', 'validator', 'query', 'database', 'beautify', 'sql-formatter'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/data-format/sql-tools',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'compression-tools',
    name: 'Gzip & Brotli Compression Tool',
    description:
      'Online Gzip and Brotli compression/decompression tool. Compress and decompress text data instantly. Compare compression ratios, view stats, and optimize file sizes for web performance.',
    category: 'Data Format & Conversion',
    icon: 'Minimize2',
    features: [
      'Compress & Decompress',
      'GZIP & Brotli Support',
      'Size & Compression Stats',
      'Input & Output Details',
      'Offline & Private',
    ],
    tags: [
      'compression',
      'gzip',
      'brotli',
      'decompress',
      'optimize',
      'compress',
      'gzip-compressor',
    ],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/data-format/compression-tools',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'json-to-toml',
    name: 'JSON to TOML Converter',
    description:
      'Convert JSON to TOML format online instantly. Free JSON to TOML converter for configuration files. Perfect for developers working with TOML configs, Rust projects, and modern config formats.',
    category: 'Data Format & Conversion',
    icon: 'FileCode',
    features: [
      'JSON to TOML Conversion',
      'Real-time Preview',
      'One-click Copy',
      'Offline & Private',
    ],
    tags: ['json', 'toml', 'format', 'convert', 'config', 'json-to-toml', 'toml-config'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/data-format/json-to-toml',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // ============================================
  // Security & Authentication (5 tools)
  // ============================================
  {
    id: 'jwt-tools',
    name: 'JWT Decoder & Verifier',
    description:
      'Online JWT decoder and verifier tool. Decode JSON Web Tokens, view payload and header, verify signatures, and debug JWTs instantly. Free tool for developers working with authentication tokens.',
    category: 'Security & Authentication',
    icon: 'KeyRound',
    features: [
      'Decode JWT',
      'Verify & Sign JWT',
      'Multiple Algorithm Support',
      'Offline & Private',
    ],
    tags: [
      'jwt',
      'token',
      'decoder',
      'verify',
      'sign',
      'auth',
      'jwt-decoder',
      'jwt-verifier',
      'json-web-token',
    ],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/security/jwt-decoder',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'password-generator',
    name: 'Strong Password Generator',
    description:
      'Free online secure password generator. Create strong, random passwords with customizable length, characters, and options. Includes password strength analyzer and entropy calculation for maximum security.',
    category: 'Security & Authentication',
    icon: 'Lock',
    features: [
      'Generate Strong Passwords',
      'Customizable Options',
      'Password Strength & Analysis',
      'Offline & Private',
    ],
    tags: [
      'password',
      'generator',
      'security',
      'random',
      'strength',
      'strong-password',
      'secure-password',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/security/password-generator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'secret-generator',
    name: 'API Key & Secret Generator',
    description:
      'Generate secure API keys, secrets, and random strings online. Perfect for JWT secrets, OAuth tokens, encryption keys, and application secrets. Cryptographically secure random generation.',
    category: 'Security & Authentication',
    icon: 'KeyRound',
    features: ['Generate Wide Range of Secrets', 'Copy with One Click', 'Offline & Private'],
    tags: ['secret', 'api-key', 'token', 'generator', 'random', 'api-key-generator', 'jwt-secret'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/security/secret-generator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'key-pair-generator',
    name: 'RSA Key Pair Generator',
    description:
      'Generate RSA key pairs online for encryption, authentication, and digital signatures. Create public and private RSA keys with customizable bit lengths (1024, 2048, 4096). Perfect for SSH keys and SSL certificates.',
    category: 'Security & Authentication',
    icon: 'Key',
    features: [
      'Generate RSA Key Pairs',
      'Customizable Key Size',
      'View Private & Public Keys',
      'Key Statistics & Security Info',
      'Offline & Private',
    ],
    tags: [
      'rsa',
      'key-pair',
      'encryption',
      'public-key',
      'private-key',
      'rsa-generator',
      'ssh-key',
    ],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/security/key-pair-generator',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator - MD5, SHA256, SHA512',
    description:
      'Free online hash generator tool. Generate MD5, SHA1, SHA256, SHA512, SHA3, RIPEMD, Whirlpool, and BLAKE hashes instantly. Calculate checksums for file verification, data integrity, and cryptographic applications.',
    category: 'Security & Authentication',
    icon: 'Hash',
    features: [
      'Generate Hashes for Your Data',
      'Wide Range of Algorithms',
      'Copy & Clear',
      'Offline & Private',
    ],
    tags: [
      'hash',
      'md5',
      'sha256',
      'sha512',
      'crypto',
      'checksum',
      'hash-generator',
      'sha1',
      'sha3',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/security/hash-generator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // ============================================
  // Development & Testing (6 tools)
  // ============================================
  {
    id: 'id-analyzer',
    name: 'UUID, ULID & ID Analyzer',
    description:
      'Online UUID, ULID, GUID, Nano ID, and MongoDB ObjectId analyzer. Decode and inspect unique identifiers, extract metadata, validate formats, and convert between ID types instantly.',
    category: 'Development & Testing',
    icon: 'ScanLine',
    features: ['Analyze All Major ID Types', 'Inspect, Validate & Convert', 'Offline & Private'],
    tags: [
      'uuid',
      'ulid',
      'guid',
      'objectid',
      'nanoid',
      'analyzer',
      'uuid-analyzer',
      'guid-decoder',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/development/id-analyzer',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'id-generator',
    name: 'UUID, ULID & ID Generator',
    description:
      'Generate unique IDs online - UUID v1/v4/v7, ULID, Nano ID, GUID, and KSUID. Batch generation with one-click copy. Perfect for database IDs, session tokens, and unique identifiers.',
    category: 'Development & Testing',
    icon: 'Fingerprint',
    features: ['Generate Multiple Types of IDs', 'Batch Generation & Copy', 'Offline & Private'],
    tags: [
      'uuid',
      'ulid',
      'guid',
      'nanoid',
      'generator',
      'batch',
      'uuid-generator',
      'ulid-generator',
      'nanoid-generator',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/development/id-generator',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'regex-validator',
    name: 'Regex Tester & Validator',
    description:
      'Free online regex tester and validator. Test regular expressions against sample text, see matches, groups, and indices in real-time. Includes regex flags, cheat sheet, and match highlighting.',
    category: 'Development & Testing',
    icon: 'Regex',
    features: [
      'Instant Regex Validation & Testing',
      'Regex Flags & Cheat Sheet',
      'Match Highlighting & Debugging',
      'Offline & Private',
    ],
    tags: [
      'regex',
      'regular-expression',
      'validator',
      'tester',
      'pattern',
      'regex-tester',
      'regex-debugger',
    ],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/development/regex-validator',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'text-inspector',
    name: 'Text Analyzer & Counter',
    description:
      'Online text analyzer and counter tool. Get character, word, line, sentence counts, encoding info, byte size, and formatting breakdowns. Perfect for developers analyzing text content and strings.',
    category: 'Development & Testing',
    icon: 'Type',
    features: [
      'Instant Text Analysis & Statistics',
      'Encoding & Formatting Insights',
      'Developer-Focused Details',
      'Offline & Private',
    ],
    tags: [
      'text',
      'analyzer',
      'counter',
      'statistics',
      'encoding',
      'word-count',
      'character-count',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/development/text-inspector',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'lorem-generator',
    name: 'Lorem Ipsum Generator',
    description:
      'Generate lorem ipsum placeholder text online for designs and mockups. Customize paragraphs, words, or sentences. Perfect for UI design, website mockups, and testing layouts with dummy text.',
    category: 'Development & Testing',
    icon: 'FileText',
    features: [
      'Customizable Placeholder Text',
      'Flexible Controls & Options',
      'Real-Time Stats',
      'Offline & Private',
    ],
    tags: ['lorem', 'ipsum', 'placeholder', 'text', 'generator', 'dummy-text', 'lorem-ipsum'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/development/lorem-ipsum',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'diff-viewer',
    name: 'Diff Viewer & Compare Tool',
    description:
      'Online diff viewer and compare tool. Compare text or code side-by-side with highlighted differences. Perfect for code reviews, merge conflicts, and tracking changes with visual diff.',
    category: 'Development & Testing',
    icon: 'GitCompare',
    features: [
      'Side-by-Side Diff & Editing',
      'Powerful for Code & Text',
      'Developer Productivity',
      'Offline & Private',
    ],
    tags: ['diff', 'compare', 'merge', 'text', 'code', 'diff-viewer', 'code-diff', 'text-compare'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/development/diff-viewer',
    isNew: true,
    processingType: 'client-side',
    security: 'local-only',
  },

  // ============================================
  // Network & Utility (4 tools)
  // ============================================
  {
    id: 'url-parser',
    name: 'URL Parser & Analyzer',
    description:
      'Online URL parser and analyzer tool. Parse and inspect URLs instantly. View all components: protocol, host, port, path, hash, and query string parameters. Perfect for debugging URLs and API endpoints.',
    category: 'Network & Utility',
    icon: 'Link',
    features: [
      'Parse & Inspect URLs Instantly',
      'Edit Query Strings & Parameters',
      'Developer Productivity',
      'Offline & Private',
    ],
    tags: [
      'url',
      'parser',
      'query',
      'encode',
      'decode',
      'url-parser',
      'url-analyzer',
      'query-string',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/network/url-parser',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'dns-lookup',
    name: 'DNS Lookup Tool',
    description:
      'Free online DNS lookup tool. Query DNS records including A, AAAA, MX, TXT, CNAME, NS, and SOA for any domain. Debug DNS configurations and verify domain records instantly.',
    category: 'Network & Utility',
    icon: 'Globe',
    features: ['Query DNS Records', 'Multiple Record Types', 'TTL Display'],
    tags: ['dns', 'lookup', 'domain', 'records', 'network', 'dns-lookup', 'domain-lookup'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/network/dns-lookup',
    processingType: 'server-side',
    security: 'network-required',
  },
  {
    id: 'timestamps',
    name: 'Timestamp Converter - Unix & ISO',
    description:
      'Free online timestamp converter. Convert between Unix timestamps (epoch), ISO 8601, UTC, and local time. Timezone conversion and calendar info. Perfect for developers working with dates and times.',
    category: 'Network & Utility',
    icon: 'Clock',
    features: [
      'Convert & Inspect Timestamps Instantly',
      'Timezone Conversion & Calendar Info',
      'Flexible Date & Time Formatting',
      'Developer Productivity',
      'Offline & Privacy-First',
    ],
    tags: [
      'timestamp',
      'unix',
      'date',
      'time',
      'timezone',
      'epoch',
      'timestamp-converter',
      'unix-timestamp',
      'iso8601',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/network/timestamps',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'color-tools',
    name: 'Color Converter',
    description:
      'Free online color converter tool. Convert colors between HEX, RGB, and HSL formats instantly. Perfect for designers and developers working with colors. Real-time preview and copy functionality.',
    category: 'Network & Utility',
    icon: 'PaintBrush',
    features: [
      'HEX, RGB, HSL Conversion',
      'Real-Time Color Preview',
      'One-Click Copy',
      'Offline & Private',
    ],
    tags: [
      'color',
      'converter',
      'hex',
      'rgb',
      'hsl',
      'color-picker',
      'hex-to-rgb',
      'color-converter',
    ],
    difficulty: 'beginner',
    status: 'stable',
    href: '/network/color-tools',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'cron-parser',
    name: 'Cron Expression Parser',
    description:
      'Free online cron expression parser tool. Parse and understand cron schedule expressions. Convert cron syntax to human-readable descriptions. Perfect for developers working with scheduled tasks.',
    category: 'Network & Utility',
    icon: 'Clock',
    features: [
      'Parse Cron Expressions',
      'Human-Readable Descriptions',
      'Preset Schedules',
      'Next Run Times',
      'Offline & Private',
    ],
    tags: [
      'cron',
      'parser',
      'scheduler',
      'crontab',
      'schedule',
      'cron-parser',
      'cron-expression',
      'scheduled-task',
    ],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/network/cron-parser',
    processingType: 'client-side',
    security: 'local-only',
  },
];

// Export tool categories for navigation (matching SelfDevKit)
export const toolCategories = [
  'Data Format & Conversion',
  'Security & Authentication',
  'Development & Testing',
  'Network & Utility',
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

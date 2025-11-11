/**
 * Category-Specific Error Recovery Guidance Templates
 * Provides specialized guidance for different tool categories in Parsify.dev
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileJson,
  Terminal,
  Database,
  Globe,
  Type,
  Shield,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ExternalLink,
  Info,
  Wrench,
  BookOpen,
  Video,
  Code,
  Settings,
  Zap,
  Clock,
  Target,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ErrorInfo, RecoveryStep } from "@/lib/error-recovery";
import { InteractiveWalkthrough, JSONErrorWalkthrough } from "./interactive-walkthrough";

export interface CategoryGuidanceTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  commonErrors: CategoryError[];
  quickFixes: QuickFix[];
  walkthroughs: CategoryWalkthrough[];
  resources: CategoryResource[];
  preventiveTips: string[];
}

export interface CategoryError {
  type: string;
  pattern: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  examples: string[];
}

export interface QuickFix {
  title: string;
  description: string;
  action: string;
  tool?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  successRate: number;
  estimatedTime: number;
}

export interface CategoryWalkthrough {
  id: string;
  title: string;
  description: string;
  errorPattern: string;
  steps: RecoveryStep[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
}

export interface CategoryResource {
  type: 'documentation' | 'video' | 'tool' | 'example' | 'article';
  title: string;
  url?: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * JSON Processing Category Guidance
 */
export const jsonProcessingGuidance: CategoryGuidanceTemplate = {
  id: 'json-processing',
  name: 'JSON Processing',
  description: 'Tools for formatting, validating, and converting JSON data',
  icon: FileJson,
  color: 'text-green-600',
  bgColor: 'bg-green-50',
  borderColor: 'border-green-200',
  commonErrors: [
    {
      type: 'Syntax Error',
      pattern: /Unexpected token|JSON\.parse|Unexpected end of JSON input/i,
      description: 'Invalid JSON syntax preventing parsing',
      severity: 'high',
      examples: [
        'Missing commas between properties',
        'Unmatched brackets or braces',
        'Invalid escape sequences',
        'Trailing commas (strict mode)',
        'Single quotes instead of double quotes'
      ]
    },
    {
      type: 'Schema Validation',
      pattern: /schema|validation|required/i,
      description: 'JSON data does not conform to expected schema',
      severity: 'medium',
      examples: [
        'Missing required fields',
        'Wrong data types',
        'Additional unexpected properties',
        'Invalid nested structures'
      ]
    },
    {
      type: 'Conversion Error',
      pattern: /convert|transform|mapping/i,
      description: 'Failed to convert JSON to/from other formats',
      severity: 'medium',
      examples: [
        'Unsupported data types for conversion',
        'Circular references',
        'Deep nesting beyond limits',
        'Incompatible format mappings'
      ]
    }
  ],
  quickFixes: [
    {
      title: 'Validate Syntax',
      description: 'Use JSON Validator to check and fix syntax errors',
      action: 'Paste JSON into validator tool and follow error messages',
      tool: 'JSON Validator',
      difficulty: 'easy',
      successRate: 0.95,
      estimatedTime: 30
    },
    {
      title: 'Auto-format JSON',
      description: 'Format JSON to make syntax errors more visible',
      action: 'Use JSON Formatter with pretty-print option',
      tool: 'JSON Formatter',
      difficulty: 'easy',
      successRate: 0.90,
      estimatedTime: 15
    },
    {
      title: 'Repair Common Issues',
      description: 'Automatically fix common JSON syntax problems',
      action: 'Run JSON repair tool to fix trailing commas, quotes, etc.',
      tool: 'JSON Validator',
      difficulty: 'medium',
      successRate: 0.85,
      estimatedTime: 45
    }
  ],
  walkthroughs: [
    {
      id: 'json-syntax-repair',
      title: 'JSON Syntax Repair Walkthrough',
      description: 'Step-by-step guide to fix JSON syntax errors',
      errorPattern: /syntax|parse|json/i,
      steps: [
        {
          id: 'identify-error',
          title: 'Identify the Error',
          description: 'Locate the syntax error in your JSON',
          action: 'Check error message for line numbers and specific issues',
          type: 'instruction',
          priority: 1,
          estimatedTime: 30
        },
        {
          id: 'use-validator',
          title: 'Use JSON Validator',
          description: 'Validate your JSON to get detailed error information',
          action: 'Paste JSON into the validator tool',
          type: 'manual',
          priority: 2,
          estimatedTime: 60
        },
        {
          id: 'fix-syntax',
          title: 'Fix Syntax Issues',
          description: 'Correct the identified syntax errors',
          action: 'Follow validator suggestions to fix syntax',
          type: 'manual',
          priority: 3,
          estimatedTime: 120
        }
      ],
      difficulty: 'medium',
      estimatedTime: 210
    }
  ],
  resources: [
    {
      type: 'documentation',
      title: 'JSON Official Documentation',
      url: 'https://www.json.org/',
      description: 'Official JSON specification and documentation',
      icon: BookOpen
    },
    {
      type: 'tool',
      title: 'JSONLint Online Validator',
      url: 'https://jsonlint.com/',
      description: 'Free online JSON validator and formatter',
      icon: Wrench
    },
    {
      type: 'article',
      title: 'Common JSON Mistakes and How to Fix Them',
      description: 'Guide to avoiding and fixing common JSON errors',
      icon: Info
    }
  ],
  preventiveTips: [
    'Always validate JSON before processing',
    'Use a proper code editor with JSON syntax highlighting',
    'Test with small data samples before processing large datasets',
    'Keep backup copies of original JSON data',
    'Use consistent formatting and naming conventions'
  ]
};

/**
 * Code Execution Category Guidance
 */
export const codeExecutionGuidance: CategoryGuidanceTemplate = {
  id: 'code-execution',
  name: 'Code Execution',
  description: 'Tools for executing and testing code in various programming languages',
  icon: Terminal,
  color: 'text-blue-600',
  bgColor: 'bg-blue-50',
  borderColor: 'border-blue-200',
  commonErrors: [
    {
      type: 'Syntax Error',
      pattern: /syntax|unexpected|parse/i,
      description: 'Invalid code syntax preventing execution',
      severity: 'high',
      examples: [
        'Missing semicolons or brackets',
        'Incorrect variable declarations',
        'Invalid function definitions',
        'Improper indentation (Python)',
        'Mismatched parentheses or braces'
      ]
    },
    {
      type: 'Runtime Error',
      pattern: /runtime|exception|error/i,
      description: 'Error occurring during code execution',
      severity: 'high',
      examples: [
        'Null or undefined references',
        'Type conversion errors',
        'Array index out of bounds',
        'Division by zero',
        'Memory allocation failures'
      ]
    },
    {
      type: 'Timeout Error',
      pattern: /timeout|slow|performance/i,
      description: 'Code execution exceeds time limits',
      severity: 'medium',
      examples: [
        'Infinite loops',
        'Inefficient algorithms',
        'Large dataset processing',
        'Network request delays',
        'Complex recursive operations'
      ]
    }
  ],
  quickFixes: [
    {
      title: 'Check Syntax',
      description: 'Use code highlighting and linting to catch syntax errors',
      action: 'Enable syntax highlighting and use linting tools',
      tool: 'Code Editor',
      difficulty: 'easy',
      successRate: 0.92,
      estimatedTime: 30
    },
    {
      title: 'Add Error Handling',
      description: 'Wrap code in try-catch blocks to handle exceptions',
      action: 'Add proper error handling around risky operations',
      tool: 'Code Editor',
      difficulty: 'medium',
      successRate: 0.88,
      estimatedTime: 60
    },
    {
      title: 'Optimize Performance',
      description: 'Improve algorithm efficiency and reduce complexity',
      action: 'Analyze and optimize slow operations',
      tool: 'Performance Profiler',
      difficulty: 'hard',
      successRate: 0.75,
      estimatedTime: 300
    }
  ],
  walkthroughs: [
    {
      id: 'code-debug-basics',
      title: 'Basic Code Debugging',
      description: 'Learn how to debug common code errors',
      errorPattern: /error|exception|bug/i,
      steps: [
        {
          id: 'identify-error',
          title: 'Identify the Error Type',
          description: 'Determine if it\'s syntax, runtime, or logic error',
          action: 'Read error messages and examine code flow',
          type: 'instruction',
          priority: 1,
          estimatedTime: 45
        },
        {
          id: 'add-logging',
          title: 'Add Debug Logging',
          description: 'Add console.log statements to trace execution',
          action: 'Insert logging statements at key points',
          type: 'manual',
          priority: 2,
          estimatedTime: 30
        },
        {
          id: 'test-fixes',
          title: 'Test Potential Fixes',
          description: 'Apply and test potential solutions',
          action: 'Implement fixes one at a time and test',
          type: 'manual',
          priority: 3,
          estimatedTime: 120
        }
      ],
      difficulty: 'medium',
      estimatedTime: 195
    }
  ],
  resources: [
    {
      type: 'documentation',
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org/',
      description: 'Comprehensive web development documentation',
      icon: BookOpen
    },
    {
      type: 'tool',
      title: 'JSFiddle',
      url: 'https://jsfiddle.net/',
      description: 'Online playground for testing JavaScript',
      icon: Code
    },
    {
      type: 'article',
      title: 'Debugging Best Practices',
      description: 'Guide to effective debugging techniques',
      icon: Info
    }
  ],
  preventiveTips: [
    'Write code in small, testable chunks',
    'Use meaningful variable names',
    'Add comments to explain complex logic',
    'Test edge cases and error conditions',
    'Use version control to track changes'
  ]
};

/**
 * File Processing Category Guidance
 */
export const fileProcessingGuidance: CategoryGuidanceTemplate = {
  id: 'file-processing',
  name: 'File Processing',
  description: 'Tools for converting, compressing, and processing various file formats',
  icon: Database,
  color: 'text-purple-600',
  bgColor: 'bg-purple-50',
  borderColor: 'border-purple-200',
  commonErrors: [
    {
      type: 'File Size Error',
      pattern: /too large|size|limit/i,
      description: 'File exceeds processing size limits',
      severity: 'medium',
      examples: [
        'File larger than 10MB limit',
        'Memory insufficient for processing',
        'Upload timeout due to size',
        'Browser memory limitations'
      ]
    },
    {
      type: 'Format Error',
      pattern: /format|unsupported|invalid/i,
      description: 'Unsupported or corrupted file format',
      severity: 'high',
      examples: [
        'Unsupported file extension',
        'Corrupted file headers',
        'Invalid encoding detected',
        'Malformed file structure'
      ]
    },
    {
      type: 'Permission Error',
      pattern: /permission|access|denied/i,
      description: 'Insufficient permissions to access file',
      severity: 'high',
      examples: [
        'File access denied by browser',
        'Cross-origin file access blocked',
        'Security policy violations',
        'Protected file system areas'
      ]
    }
  ],
  quickFixes: [
    {
      title: 'Compress File',
      description: 'Reduce file size before processing',
      action: 'Use compression tools or reduce file content',
      tool: 'File Compressor',
      difficulty: 'easy',
      successRate: 0.85,
      estimatedTime: 120
    },
    {
      title: 'Convert Format',
      description: 'Convert to supported file format',
      action: 'Use file converter to change format',
      tool: 'File Converter',
      difficulty: 'medium',
      successRate: 0.90,
      estimatedTime: 180
    },
    {
      title: 'Split Large Files',
      description: 'Break large files into smaller chunks',
      action: 'Split file into manageable pieces',
      tool: 'File Splitter',
      difficulty: 'medium',
      successRate: 0.80,
      estimatedTime: 240
    }
  ],
  walkthroughs: [
    {
      id: 'large-file-processing',
      title: 'Large File Processing Guide',
      description: 'Handle files that exceed size limits',
      errorPattern: /large|size|limit/i,
      steps: [
        {
          id: 'check-size',
          title: 'Check File Size',
          description: 'Verify current file size and limits',
          action: 'Compare file size against processing limits',
          type: 'manual',
          priority: 1,
          estimatedTime: 15
        },
        {
          id: 'compress-file',
          title: 'Compress the File',
          description: 'Apply compression to reduce size',
          action: 'Use appropriate compression method',
          type: 'manual',
          priority: 2,
          estimatedTime: 180
        },
        {
          id: 'verify-result',
          title: 'Verify Compression Results',
          description: 'Check if file is now within limits',
          action: 'Confirm compressed file meets requirements',
          type: 'manual',
          priority: 3,
          estimatedTime: 30
        }
      ],
      difficulty: 'medium',
      estimatedTime: 225
    }
  ],
  resources: [
    {
      type: 'documentation',
      title: 'File Format Documentation',
      description: 'Comprehensive file format specifications',
      icon: BookOpen
    },
    {
      type: 'tool',
      title: 'Online File Converter',
      description: 'Convert between different file formats',
      icon: Wrench
    },
    {
      type: 'article',
      title: 'File Compression Guide',
      description: 'Understanding file compression techniques',
      icon: Info
    }
  ],
  preventiveTips: [
    'Check file size limits before processing',
    'Use appropriate file formats for your data',
    'Keep backups of original files',
    'Test with smaller files first',
    'Consider processing in chunks for large files'
  ]
};

/**
 * Network Tools Category Guidance
 */
export const networkToolsGuidance: CategoryGuidanceTemplate = {
  id: 'network-tools',
  name: 'Network Tools',
  description: 'Tools for testing network connectivity and processing web-based data',
  icon: Globe,
  color: 'text-cyan-600',
  bgColor: 'bg-cyan-50',
  borderColor: 'border-cyan-200',
  commonErrors: [
    {
      type: 'Connection Error',
      pattern: /connection|network|offline/i,
      description: 'Unable to establish network connection',
      severity: 'high',
      examples: [
        'No internet connection',
        'DNS resolution failed',
        'Server not responding',
        'Connection timeout',
        'Firewall blocking access'
      ]
    },
    {
      type: 'SSL/TLS Error',
      pattern: /ssl|tls|certificate|https/i,
      description: 'Security certificate or protocol errors',
      severity: 'high',
      examples: [
        'Expired SSL certificates',
        'Certificate chain issues',
        'Protocol version mismatch',
        'Self-signed certificates',
        'Mixed content warnings'
      ]
    },
    {
      type: 'API Error',
      pattern: /api|endpoint|response/i,
      description: 'API request failures or invalid responses',
      severity: 'medium',
      examples: [
        '404 Not Found errors',
        'Rate limiting exceeded',
        'Authentication failures',
        'Invalid request format',
        'Server error responses'
      ]
    }
  ],
  quickFixes: [
    {
      title: 'Check Connection',
      description: 'Verify internet connectivity',
      action: 'Test with other websites or services',
      tool: 'Network Status',
      difficulty: 'easy',
      successRate: 0.95,
      estimatedTime: 30
    },
    {
      title: 'Try HTTP Instead of HTTPS',
      description: 'Use non-secure connection if SSL issues',
      action: 'Change URL from https:// to http://',
      tool: 'URL Editor',
      difficulty: 'easy',
      successRate: 0.70,
      estimatedTime: 15
    },
    {
      title: 'Check API Documentation',
      description: 'Verify correct API usage and parameters',
      action: 'Review API docs for correct implementation',
      tool: 'API Docs',
      difficulty: 'medium',
      successRate: 0.88,
      estimatedTime: 120
    }
  ],
  walkthroughs: [
    {
      id: 'network-troubleshooting',
      title: 'Network Connection Troubleshooting',
      description: 'Diagnose and fix network connectivity issues',
      errorPattern: /network|connection|dns/i,
      steps: [
        {
          id: 'check-connectivity',
          title: 'Check Basic Connectivity',
          description: 'Test if you can reach other websites',
          action: 'Try accessing different websites',
          type: 'manual',
          priority: 1,
          estimatedTime: 30
        },
        {
          id: 'verify-url',
          title: 'Verify URL Format',
          description: 'Check if URL is correctly formatted',
          action: 'Validate URL syntax and protocol',
          type: 'manual',
          priority: 2,
          estimatedTime: 15
        },
        {
          id: 'test-alternatives',
          title: 'Test Alternative Endpoints',
          description: 'Try different servers or endpoints',
          action: 'Use backup or mirror URLs',
          type: 'manual',
          priority: 3,
          estimatedTime: 60
        }
      ],
      difficulty: 'easy',
      estimatedTime: 105
    }
  ],
  resources: [
    {
      type: 'tool',
      title: 'DownDetector',
      url: 'https://downdetector.com/',
      description: 'Check service status and outages',
      icon: Globe
    },
    {
      type: 'documentation',
      title: 'HTTP Status Code Reference',
      description: 'Complete reference for HTTP status codes',
      icon: BookOpen
    },
    {
      type: 'article',
      title: 'Network Debugging Guide',
      description: 'Common network issues and solutions',
      icon: Info
    }
  ],
  preventiveTips: [
    'Always validate URLs before making requests',
    'Implement proper error handling for network requests',
    'Use appropriate timeout values',
    'Check for CORS and security restrictions',
    'Monitor API rate limits and quotas'
  ]
};

/**
 * Text Processing Category Guidance
 */
export const textProcessingGuidance: CategoryGuidanceTemplate = {
  id: 'text-processing',
  name: 'Text Processing',
  description: 'Tools for text manipulation, encoding, and format conversion',
  icon: Type,
  color: 'text-orange-600',
  bgColor: 'bg-orange-50',
  borderColor: 'border-orange-200',
  commonErrors: [
    {
      type: 'Encoding Error',
      pattern: /encoding|charset|utf-8/i,
      description: 'Text encoding issues causing display problems',
      severity: 'medium',
      examples: [
        'Invalid UTF-8 sequences',
        'Mixed character encodings',
        'BOM (Byte Order Mark) issues',
        'Unsupported character sets',
        'Mojibake (garbled text)'
      ]
    },
    {
      type: 'Regex Error',
      pattern: /regex|pattern|regular expression/i,
      description: 'Invalid regular expression patterns',
      severity: 'medium',
      examples: [
        'Unbalanced parentheses or brackets',
        'Invalid escape sequences',
        'Unsupported regex features',
        'Catastrophic backtracking',
        'Invalid quantifiers'
      ]
    },
    {
      type: 'Size Limit Error',
      pattern: /too long|large|limit/i,
      description: 'Text exceeds processing size limits',
      severity: 'low',
      examples: [
        'Text too long for processing',
        'Memory limitations with large text',
        'Timeout with huge strings',
        'Browser string length limits'
      ]
    }
  ],
  quickFixes: [
    {
      title: 'Fix Encoding',
      description: 'Convert text to proper UTF-8 encoding',
      action: 'Use encoding conversion tools',
      tool: 'Encoding Converter',
      difficulty: 'medium',
      successRate: 0.85,
      estimatedTime: 60
    },
    {
      title: 'Validate Regex',
      description: 'Test and fix regular expression patterns',
      action: 'Use regex tester to validate patterns',
      tool: 'Regex Tester',
      difficulty: 'easy',
      successRate: 0.92,
      estimatedTime: 30
    },
    {
      title: 'Split Text',
      description: 'Break large text into manageable chunks',
      action: 'Process text in smaller segments',
      tool: 'Text Splitter',
      difficulty: 'easy',
      successRate: 0.95,
      estimatedTime: 45
    }
  ],
  walkthroughs: [
    {
      id: 'encoding-fix',
      title: 'Text Encoding Repair',
      description: 'Fix common text encoding issues',
      errorPattern: /encoding|charset|utf/i,
      steps: [
        {
          id: 'detect-encoding',
          title: 'Detect Current Encoding',
          description: 'Identify the current text encoding',
          action: 'Use encoding detection tools',
          type: 'automatic',
          priority: 1,
          estimatedTime: 30
        },
        {
          id: 'convert-encoding',
          title: 'Convert to UTF-8',
          description: 'Convert text to standard UTF-8 encoding',
          action: 'Apply encoding conversion',
          type: 'automatic',
          priority: 2,
          estimatedTime: 45
        },
        {
          id: 'verify-result',
          title: 'Verify Text Display',
          description: 'Check if text displays correctly',
          action: 'Review converted text for proper display',
          type: 'manual',
          priority: 3,
          estimatedTime: 15
        }
      ],
      difficulty: 'medium',
      estimatedTime: 90
    }
  ],
  resources: [
    {
      type: 'tool',
      title: 'Unicode Code Converter',
      description: 'Convert between different text encodings',
      icon: Wrench
    },
    {
      type: 'documentation',
      title: 'Regex101',
      url: 'https://regex101.com/',
      description: 'Interactive regex tester and debugger',
      icon: Code
    },
    {
      type: 'article',
      title: 'Text Encoding Guide',
      description: 'Understanding character encodings',
      icon: Info
    }
  ],
  preventiveTips: [
    'Always use UTF-8 encoding when possible',
    'Test regex patterns with various inputs',
    'Handle edge cases in text processing',
    'Validate input text before processing',
    'Use appropriate string methods for your language'
  ]
};

/**
 * Security Tools Category Guidance
 */
export const securityToolsGuidance: CategoryGuidanceTemplate = {
  id: 'security-tools',
  name: 'Security Tools',
  description: 'Tools for encryption, hashing, and security validation',
  icon: Shield,
  color: 'text-red-600',
  bgColor: 'bg-red-50',
  borderColor: 'border-red-200',
  commonErrors: [
    {
      type: 'Algorithm Error',
      pattern: /algorithm|hash|encrypt|decrypt/i,
      description: 'Unsupported or invalid security algorithms',
      severity: 'high',
      examples: [
        'Unsupported hash algorithm',
        'Invalid encryption parameters',
        'Weak cryptographic algorithms',
        'Deprecated security methods',
        'Missing algorithm specifications'
      ]
    },
    {
      type: 'Input Format Error',
      pattern: /input|format|invalid/i,
      description: 'Invalid input format for security operations',
      severity: 'medium',
      examples: [
        'Invalid base64 format',
        'Incorrect hex string format',
        'Malformed certificate data',
        'Invalid key format',
        'Improper padding'
      ]
    },
    {
      type: 'Permission Error',
      pattern: /permission|access|denied|security/i,
      description: 'Security restrictions preventing operations',
      severity: 'high',
      examples: [
        'Browser security restrictions',
        'CORS policy violations',
        'Mixed content blocking',
        'Insufficient permissions',
        'Security policy conflicts'
      ]
    }
  ],
  quickFixes: [
    {
      title: 'Use Supported Algorithms',
      description: 'Switch to supported security algorithms',
      action: 'Use modern, supported cryptographic methods',
      tool: 'Algorithm Selector',
      difficulty: 'medium',
      successRate: 0.90,
      estimatedTime: 60
    },
    {
      title: 'Validate Input Format',
      description: 'Ensure input is in correct format',
      action: 'Use input validation and formatting tools',
      tool: 'Input Validator',
      difficulty: 'easy',
      successRate: 0.95,
      estimatedTime: 30
    },
    {
      title: 'Check Security Settings',
      description: 'Verify browser security configurations',
      action: 'Review and adjust security settings',
      tool: 'Security Settings',
      difficulty: 'medium',
      successRate: 0.75,
      estimatedTime: 120
    }
  ],
  walkthroughs: [
    {
      id: 'hash-generation',
      title: 'Secure Hash Generation',
      description: 'Generate secure hashes properly',
      errorPattern: /hash|generate|create/i,
      steps: [
        {
          id: 'select-algorithm',
          title: 'Select Hash Algorithm',
          description: 'Choose appropriate hash algorithm',
          action: 'Select from SHA-256, SHA-512, etc.',
          type: 'manual',
          priority: 1,
          estimatedTime: 30
        },
        {
          id: 'prepare-input',
          title: 'Prepare Input Data',
          description: 'Format input data correctly',
          action: 'Ensure proper string or binary format',
          type: 'manual',
          priority: 2,
          estimatedTime: 15
        },
        {
          id: 'generate-hash',
          title: 'Generate Hash',
          description: 'Create the hash value',
          action: 'Execute hash generation',
          type: 'automatic',
          priority: 3,
          estimatedTime: 15
        }
      ],
      difficulty: 'easy',
      estimatedTime: 60
    }
  ],
  resources: [
    {
      type: 'documentation',
      title: 'OWASP Cryptographic Storage',
      url: 'https://owasp.org/www-project-cheat-sheets/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html',
      description: 'Best practices for cryptographic storage',
      icon: Shield
    },
    {
      type: 'tool',
      title: 'Online Hash Generator',
      description: 'Generate hashes with various algorithms',
      icon: Wrench
    },
    {
      type: 'article',
      title: 'Security Best Practices',
      description: 'Essential security guidelines for developers',
      icon: Info
    }
  ],
  preventiveTips: [
    'Always use strong, modern cryptographic algorithms',
    'Never implement your own cryptography',
    'Keep security libraries updated',
    'Validate all inputs and outputs',
    'Follow security best practices and guidelines'
  ]
};

/**
 * All category guidance templates
 */
export const categoryGuidanceTemplates: Record<string, CategoryGuidanceTemplate> = {
  'JSON Processing': jsonProcessingGuidance,
  'Code Execution': codeExecutionGuidance,
  'File Processing': fileProcessingGuidance,
  'Network Tools': networkToolsGuidance,
  'Text Processing': textProcessingGuidance,
  'Security Tools': securityToolsGuidance,
};

/**
 * Category Guidance Component
 */
export interface CategoryGuidanceProps {
  category: string;
  error?: ErrorInfo;
  onQuickFixSelect?: (fix: QuickFix) => void;
  onWalkthroughStart?: (walkthrough: CategoryWalkthrough) => void;
  className?: string;
  compact?: boolean;
}

export function CategoryGuidance({
  category,
  error,
  onQuickFixSelect,
  onWalkthroughStart,
  className,
  compact = false,
}: CategoryGuidanceProps) {
  const template = categoryGuidanceTemplates[category];

  if (!template) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No specific guidance available for this category.
        </AlertDescription>
      </Alert>
    );
  }

  const Icon = template.icon;

  if (compact) {
    return (
      <Card className={cn("border-l-4", template.borderColor, template.bgColor, className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Icon className={cn("h-5 w-5", template.color)} />
            <div className="flex-1">
              <h4 className="font-medium">{category} Guidance</h4>
              <p className="text-sm text-muted-foreground">
                {template.quickFixes.length} quick fixes available
              </p>
            </div>
            <Button size="sm" variant="outline">
              View Help
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Category Header */}
      <Card className={cn("border-l-4", template.borderColor, template.bgColor)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon className={cn("h-6 w-6", template.color)} />
            <div>
              <CardTitle className="text-xl">{template.name} Error Recovery</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Fixes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Fixes
          </CardTitle>
          <CardDescription>
            Fast solutions for common {template.name.toLowerCase()} errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.quickFixes.map((fix, index) => (
              <Card key={index} className="border-l-4 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{fix.title}</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs">
                            {fix.successRate * 100}% success
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Historical success rate</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {fix.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {fix.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ~{fix.estimatedTime}s
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onQuickFixSelect?.(fix)}
                    >
                      Apply Fix
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Common Errors
          </CardTitle>
          <CardDescription>
            Frequently encountered errors and their solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {template.commonErrors.map((errorType, index) => (
              <Collapsible key={index}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 h-auto"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        errorType.severity === 'critical' && "bg-red-500",
                        errorType.severity === 'high' && "bg-red-400",
                        errorType.severity === 'medium' && "bg-yellow-400",
                        errorType.severity === 'low' && "bg-green-400"
                      )} />
                      <div>
                        <h4 className="font-medium">{errorType.type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {errorType.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pr-3 pb-3">
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Examples:</strong></p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      {errorType.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preventive Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Preventive Tips
          </CardTitle>
          <CardDescription>
            How to avoid common {template.name.toLowerCase()} errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {template.preventiveTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Learning Resources
          </CardTitle>
          <CardDescription>
            Helpful resources for mastering {template.name.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {template.resources.map((resource, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-muted">
                  {resource.icon || <Info className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-sm">{resource.title}</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    {resource.description}
                  </p>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      Learn more
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default {
  CategoryGuidance,
  categoryGuidanceTemplates,
  jsonProcessingGuidance,
  codeExecutionGuidance,
  fileProcessingGuidance,
  networkToolsGuidance,
  textProcessingGuidance,
  securityToolsGuidance,
};

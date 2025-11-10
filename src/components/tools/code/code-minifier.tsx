/**
 * Code Minifier Component
 * Minify JavaScript, CSS, and other code files by removing whitespace and comments
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Compress,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Code,
  Zap,
  BarChart3,
  TrendingDown,
  RefreshCw,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface MinifyResult {
  original: string;
  minified: string;
  language: string;
  stats: {
    originalSize: number;
    minifiedSize: number;
    compressionRatio: number;
    spaceSavings: number;
    processingTime: number;
    linesRemoved: number;
    commentsRemoved: number;
  };
}

type SupportedLanguage = 'javascript' | 'typescript' | 'css' | 'scss' | 'html' | 'json' | 'xml';

export function CodeMinifier({ className }: { className?: string }) {
  const [codeInput, setCodeInput] = useState('');
  const [minifyResult, setMinifyResult] = useState<MinifyResult | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [removeComments, setRemoveComments] = useState(true);
  const [removeWhitespace, setRemoveWhitespace] = useState(true);
  const [mangleVariables, setMangleVariables] = useState(false);
  const [preserveImportant, setPreserveImportant] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session
  useEffect(() => {
    const session = createSession('code-minifier', {
      initialInput: '',
      language,
      options: { removeComments, removeWhitespace, mangleVariables, preserveImportant }
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setCodeInput(value);

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { text: value, language, options: { removeComments, removeWhitespace, mangleVariables, preserveImportant } },
        lastActivity: new Date()
      });
    }
  }, [sessionId, language, removeComments, removeWhitespace, mangleVariables, preserveImportant]);

  // Minify code
  const minifyCode = useCallback(async () => {
    if (!codeInput.trim()) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      let minified = codeInput;
      let linesRemoved = 0;
      let commentsRemoved = 0;
      const originalLines = codeInput.split('\n').length;

      // Remove comments
      if (removeComments) {
        switch (language) {
          case 'javascript':
          case 'typescript':
            // Remove single-line comments
            minified = minified.replace(/\/\/.*$/gm, '');
            // Remove multi-line comments
            const commentMatches = minified.match(/\/\*[\s\S]*?\*\//g) || [];
            commentsRemoved += commentMatches.length;
            minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
            break;

          case 'css':
          case 'scss':
            // Remove CSS comments
            const cssCommentMatches = minified.match(/\/\*[\s\S]*?\*\//g) || [];
            commentsRemoved += cssCommentMatches.length;
            minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
            break;

          case 'html':
            // Remove HTML comments (but keep conditional comments)
            const htmlCommentMatches = minified.match(/<!--(?!\[if)[\s\S]*?-->/g) || [];
            commentsRemoved += htmlCommentMatches.length;
            minified = minified.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
            break;
        }
      }

      // Remove whitespace
      if (removeWhitespace) {
        // Remove leading/trailing whitespace from lines
        minified = minified.replace(/^\s+|\s+$/gm, '');

        // Remove empty lines
        const linesBefore = minified.split('\n').length;
        minified = minified.replace(/\n\s*\n/g, '\n');
        const linesAfter = minified.split('\n').length;
        linesRemoved = linesBefore - linesAfter;

        // Remove extra spaces
        minified = minified.replace(/\s+/g, ' ');

        // Remove spaces around brackets, braces, etc.
        if (language === 'javascript' || language === 'typescript') {
          minified = minified.replace(/\s*([{}()\[\];,])\s*/g, '$1');
        } else if (language === 'css' || language === 'scss') {
          minified = minified.replace(/\s*([{};,:])\s*/g, '$1');
        }

        // Remove unnecessary semicolons
        if (language === 'javascript' || language === 'typescript') {
          minified = minified.replace(/;+/g, ';');
        }
      }

      // Variable mangling (basic implementation)
      if (mangleVariables && (language === 'javascript' || language === 'typescript')) {
        try {
          const variableMap = new Map<string, string>();
          let varCounter = 0;

          // Simple variable name mangling
          minified = minified.replace(/\b(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, (match, keyword, varName) => {
            if (!variableMap.has(varName)) {
              variableMap.set(varName, `_${varCounter++}`);
            }
            return `${keyword} ${variableMap.get(varName)}`;
          });

          // Replace variable usage
          variableMap.forEach((mangledName, originalName) => {
            const regex = new RegExp(`\\b${originalName}\\b`, 'g');
            minified = minified.replace(regex, mangledName);
          });
        } catch (error) {
          console.warn('Variable mangling failed:', error);
        }
      }

      // Preserve important comments
      if (preserveImportant && removeComments) {
        // Re-add license headers and important comments
        const importantComments = [
          /\/\*\!*[\s\S]*?\*\//g, // /*! comments
          /\/\*\s*@license[\s\S]*?\*\//gi, // @license comments
          /\/\*\s*@preserve[\s\S]*?\*\//gi // @preserve comments
        ];

        const originalCode = codeInput;
        let preservedComments = '';

        importantComments.forEach(regex => {
          const matches = originalCode.match(regex) || [];
          preservedComments += matches.join('\n') + '\n';
        });

        if (preservedComments.trim()) {
          minified = preservedComments.trim() + '\n' + minified;
        }
      }

      // Calculate statistics
      const originalSize = codeInput.length;
      const minifiedSize = minified.length;
      const compressionRatio = originalSize > 0 ? (minifiedSize / originalSize) : 1;
      const spaceSavings = originalSize > 0 ? ((originalSize - minifiedSize) / originalSize * 100) : 0;
      const processingTime = Date.now() - startTime;

      const stats = {
        originalSize,
        minifiedSize,
        compressionRatio,
        spaceSavings,
        processingTime,
        linesRemoved,
        commentsRemoved
      };

      setMinifyResult({
        original: codeInput,
        minified,
        language,
        stats
      });

      toast.success(`Code minified successfully! Saved ${spaceSavings.toFixed(1)}% space`);

      if (sessionId) {
        updateSession(sessionId, {
          results: { minified, stats, language },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'minify', true);
      }

    } catch (error) {
      toast.error('Failed to minify code');
      if (sessionId) addToHistory(sessionId, 'minify', false);
    } finally {
      setIsProcessing(false);
    }
  }, [codeInput, language, removeComments, removeWhitespace, mangleVariables, preserveImportant, sessionId]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${type}`);
    });
  }, []);

  // Download minified code
  const downloadMinified = useCallback(() => {
    if (!minifyResult) return;

    const extensions = {
      javascript: 'js',
      typescript: 'ts',
      css: 'css',
      scss: 'scss',
      html: 'html',
      json: 'json',
      xml: 'xml'
    };

    const extension = extensions[minifyResult.language] || 'txt';
    const blob = new Blob([minifyResult.minified], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minified.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Minified file downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [minifyResult, sessionId]);

  // Upload code file
  const uploadCode = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCodeInput(content);

      // Auto-detect language from file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const languageMap: { [key: string]: SupportedLanguage } = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'css': 'css',
        'scss': 'scss',
        'sass': 'scss',
        'html': 'html',
        'htm': 'html',
        'json': 'json',
        'xml': 'xml'
      };

      if (extension && languageMap[extension]) {
        setLanguage(languageMap[extension]);
      }

      toast.success('File uploaded successfully');

      if (sessionId) {
        updateSession(sessionId, {
          inputs: { text: content, fileName: file.name, language: language },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'upload', true);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      if (sessionId) addToHistory(sessionId, 'upload', false);
    };
    reader.readAsText(file);
  }, [sessionId, language]);

  // Load sample code
  const loadSample = useCallback(() => {
    const samples = {
      javascript: `// JavaScript sample code
function calculateTotal(items) {
  // Calculate total with tax
  const tax = 0.08; // 8% tax rate
  let total = 0;

  // Iterate through items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Calculate item total
    const itemTotal = item.price * item.quantity;
    total += itemTotal + (itemTotal * tax);
  }

  return total;
}

// Example usage
const shoppingCart = [
  { name: 'Laptop', price: 999.99, quantity: 1 },
  { name: 'Mouse', price: 29.99, quantity: 1 },
  { name: 'Keyboard', price: 79.99, quantity: 1 }
];

const total = calculateTotal(shoppingCart);
console.log('Total:', total);`,

      css: `/* CSS sample code */
.container {
  /* Main container styles */
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  /* Background and border */
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card {
  /* Card component styles */
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;

  /* Hover effect */
  transition: all 0.2s ease-in-out;
}

.card:hover {
  /* Hover state */
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}`,

      html: `<!-- HTML sample code -->
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Meta tags -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Page</title>

  <!-- Styles -->
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <nav class="navigation">
      <ul class="nav-list">
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <!-- Main content -->
  <main class="main-content">
    <h1>Welcome to Our Website</h1>
    <p>This is a sample HTML page for testing the minifier.</p>
  </main>
</body>
</html>`
    };

    setCodeInput(samples[language] || samples.javascript);
    toast.success(`Sample ${language} code loaded`);
  }, [language]);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Compress className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">Code Minifier</h1>
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={loadSample}
          >
            Load Sample
          </Button>
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className=\"h-4 w-4 mr-2\" />
            Upload
          </Button>
          <input
            id=\"file-upload\"
            type=\"file\"
            accept=\".js,.jsx,.ts,.tsx,.css,.scss,.html,.htm,.json,.xml\"
            onChange={uploadCode}
            className=\"hidden\"
          />
        </div>
      </div>

      {/* Language Selection and Options */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <Settings className=\"h-5 w-5 mr-2\" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-4\">
            {/* Language Selection */}
            <div className=\"flex items-center space-x-4\">
              <Label htmlFor=\"language\">Language:</Label>
              <Select value={language} onValueChange={(value: SupportedLanguage) => setLanguage(value)}>
                <SelectTrigger className=\"w-48\">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"javascript\">JavaScript</SelectItem>
                  <SelectItem value=\"typescript\">TypeScript</SelectItem>
                  <SelectItem value=\"css\">CSS</SelectItem>
                  <SelectItem value=\"scss\">SCSS</SelectItem>
                  <SelectItem value=\"html\">HTML</SelectItem>
                  <SelectItem value=\"json\">JSON</SelectItem>
                  <SelectItem value=\"xml\">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Minification Options */}
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"remove-comments\"
                  checked={removeComments}
                  onCheckedChange={setRemoveComments}
                />
                <Label htmlFor=\"remove-comments\">Remove comments</Label>
              </div>

              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"remove-whitespace\"
                  checked={removeWhitespace}
                  onCheckedChange={setRemoveWhitespace}
                />
                <Label htmlFor=\"remove-whitespace\">Remove whitespace</Label>
              </div>

              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"preserve-important\"
                  checked={preserveImportant}
                  onCheckedChange={setPreserveImportant}
                />
                <Label htmlFor=\"preserve-important\">Preserve important comments</Label>
              </div>

              {(language === 'javascript' || language === 'typescript') && (
                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"mangle-variables\"
                    checked={mangleVariables}
                    onCheckedChange={setMangleVariables}
                  />
                  <Label htmlFor=\"mangle-variables\">Mangle variables</Label>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className=\"flex items-center space-x-4\">
              <Button
                onClick={minifyCode}
                disabled={isProcessing || !codeInput.trim()}
                className=\"flex items-center space-x-2\"
              >
                <Zap className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
                <span>{isProcessing ? 'Minifying...' : 'Minify Code'}</span>
              </Button>

              {minifyResult && (
                <>
                  <Button
                    variant=\"outline\"
                    onClick={() => copyToClipboard(minifyResult.minified, 'Minified code')}
                  >
                    <Copy className=\"h-4 w-4 mr-2\" />
                    Copy
                  </Button>

                  <Button
                    variant=\"outline\"
                    onClick={downloadMinified}
                  >
                    <Download className=\"h-4 w-4 mr-2\" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Original Code */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <Code className=\"h-5 w-5 mr-2\" />
                Original {language.charAt(0).toUpperCase() + language.slice(1)}
              </div>
              {minifyResult && (
                <Badge variant=\"outline\">
                  {formatBytes(minifyResult.stats.originalSize)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={codeInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={`Paste your ${language} code here...`}
              className=\"min-h-[400px] font-mono text-sm\"
            />
          </CardContent>
        </Card>

        {/* Minified Code */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <BarChart3 className=\"h-5 w-5 mr-2\" />
                Minified {language.charAt(0).toUpperCase() + language.slice(1)}
              </div>
              <div className=\"flex items-center space-x-2\">
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className=\"h-4 w-4\" /> : <Eye className=\"h-4 w-4\" />}
                </Button>
                {minifyResult && (
                  <Badge variant=\"outline\">
                    {formatBytes(minifyResult.stats.minifiedSize)}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {minifyResult ? (
              <div className=\"space-y-3\">
                {showPreview ? (
                  <Textarea
                    value={minifyResult.minified}
                    readOnly
                    className=\"min-h-[400px] font-mono text-sm bg-muted/50\"
                  />
                ) : (
                  <div className=\"text-sm text-muted-foreground p-3 bg-muted/50 rounded h-80 flex items-center justify-center\">
                    Minified code hidden
                  </div>
                )}
              </div>
            ) : (
              <div className=\"text-sm text-muted-foreground p-3 bg-muted/50 rounded h-80 flex items-center justify-center\">
                Minified code will appear here...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {minifyResult && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <TrendingDown className=\"h-5 w-5 mr-2\" />
              Minification Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mb-6\">
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-blue-600\">
                  {formatBytes(minifyResult.stats.originalSize)}
                </div>
                <div className=\"text-sm text-muted-foreground\">Original Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-green-600\">
                  {formatBytes(minifyResult.stats.minifiedSize)}
                </div>
                <div className=\"text-sm text-muted-foreground\">Minified Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-purple-600\">
                  {minifyResult.stats.spaceSavings.toFixed(1)}%
                </div>
                <div className=\"text-sm text-muted-foreground\">Space Saved</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-orange-600\">
                  {minifyResult.stats.compressionRatio.toFixed(2)}x
                </div>
                <div className=\"text-sm text-muted-foreground\">Compression Ratio</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className=\"space-y-2 mb-6\">
              <div className=\"flex justify-between text-sm\">
                <span>Compression Progress</span>
                <span>{minifyResult.stats.spaceSavings.toFixed(1)}% saved</span>
              </div>
              <Progress value={minifyResult.stats.spaceSavings} className=\"h-2\" />
            </div>

            {/* Additional Stats */}
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-center\">
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {minifyResult.stats.processingTime}ms
                </div>
                <div className=\"text-xs text-muted-foreground\">Processing Time</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {minifyResult.stats.linesRemoved}
                </div>
                <div className=\"text-xs text-muted-foreground\">Lines Removed</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {minifyResult.stats.commentsRemoved}
                </div>
                <div className=\"text-xs text-muted-foreground\">Comments Removed</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {minifyResult.stats.originalSize - minifyResult.stats.minifiedSize}
                </div>
                <div className=\"text-xs text-muted-foreground\">Bytes Saved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

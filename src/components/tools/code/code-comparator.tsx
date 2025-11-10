/**
 * Code Comparator Component
 * Compare two code snippets and highlight differences with detailed analysis
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  GitCompare,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Code,
  ArrowLeftRight,
  RefreshCw,
  FileText,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface ComparisonResult {
  original: string;
  modified: string;
  language: string;
  stats: {
    originalLines: number;
    modifiedLines: number;
    additions: number;
    deletions: number;
    modifications: number;
    similarity: number;
    changes: Change[];
  };
}

interface Change {
  type: 'addition' | 'deletion' | 'modification' | 'unchanged';
  lineNumber: number;
  originalLine?: string;
  modifiedLine?: string;
  content: string;
}

type ComparisonMode = 'side-by-side' | 'unified' | 'context' | 'statistical';
type ProgrammingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'csharp' | 'go' | 'rust' | 'php' | 'ruby' | 'sql' | 'html' | 'css' | 'json' | 'xml' | 'plaintext';

export function CodeComparator({ className }: { className?: string }) {
  const [originalCode, setOriginalCode] = useState('');
  const [modifiedCode, setModifiedCode] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [language, setLanguage] = useState<ProgrammingLanguage>('javascript');
  const [isProcessing, setIsProcessing] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('side-by-side');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreComments, setIgnoreComments] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session
  useEffect(() => {
    const session = createSession('code-comparator', {
      originalInput: '',
      modifiedInput: '',
      language,
      options: { ignoreWhitespace, ignoreComments, caseSensitive, comparisonMode }
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Handle input changes
  const handleOriginalChange = useCallback((value: string) => {
    setOriginalCode(value);

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { originalText: value, modifiedText: modifiedCode, language, options: { ignoreWhitespace, ignoreComments, caseSensitive, comparisonMode } },
        lastActivity: new Date()
      });
    }
  }, [modifiedCode, sessionId, language, ignoreWhitespace, ignoreComments, caseSensitive, comparisonMode]);

  const handleModifiedChange = useCallback((value: string) => {
    setModifiedCode(value);

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { originalText: originalCode, modifiedText: value, language, options: { ignoreWhitespace, ignoreComments, caseSensitive, comparisonMode } },
        lastActivity: new Date()
      });
    }
  }, [originalCode, sessionId, language, ignoreWhitespace, ignoreComments, caseSensitive, comparisonMode]);

  // Compare code
  const compareCode = useCallback(() => {
    if (!originalCode.trim() || !modifiedCode.trim()) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      const result = performComparison(originalCode, modifiedCode);
      setComparisonResult(result);

      toast.success('Code comparison completed');

      if (sessionId) {
        updateSession(sessionId, {
          results: { comparison: result },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'compare', true);
      }

    } catch (error) {
      toast.error('Failed to compare code');
      if (sessionId) addToHistory(sessionId, 'compare', false);
    } finally {
      setIsProcessing(false);
    }
  }, [originalCode, modifiedCode, sessionId]);

  // Perform detailed comparison
  const performComparison = (original: string, modified: string): ComparisonResult => {
    const originalLines = preprocessText(original).split('\n');
    const modifiedLines = preprocessText(modified).split('\n');

    const changes: Change[] = [];
    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    // Simple line-by-line comparison
    for (let i = 0; i < maxLines; i++) {
      const originalLine = i < originalLines.length ? originalLines[i] : '';
      const modifiedLine = i < modifiedLines.length ? modifiedLines[i] : '';

      if (originalLine === '' && modifiedLine !== '') {
        changes.push({
          type: 'addition',
          lineNumber: i + 1,
          content: modifiedLine,
          modifiedLine
        });
        additions++;
      } else if (originalLine !== '' && modifiedLine === '') {
        changes.push({
          type: 'deletion',
          lineNumber: i + 1,
          content: originalLine,
          originalLine
        });
        deletions++;
      } else if (originalLine !== modifiedLine) {
        changes.push({
          type: 'modification',
          lineNumber: i + 1,
          content: modifiedLine || originalLine,
          originalLine,
          modifiedLine
        });
        modifications++;
      } else {
        changes.push({
          type: 'unchanged',
          lineNumber: i + 1,
          content: originalLine,
          originalLine,
          modifiedLine
        });
      }
    }

    // Calculate similarity
    const totalLines = Math.max(originalLines.length, modifiedLines.length);
    const unchangedLines = changes.filter(c => c.type === 'unchanged').length;
    const similarity = totalLines > 0 ? (unchangedLines / totalLines) * 100 : 100;

    return {
      original,
      modified,
      language,
      stats: {
        originalLines: originalLines.length,
        modifiedLines: modifiedLines.length,
        additions,
        deletions,
        modifications,
        similarity,
        changes
      }
    };
  };

  // Preprocess text based on options
  const preprocessText = (text: string): string => {
    let processed = text;

    // Remove comments if enabled
    if (ignoreComments) {
      switch (language) {
        case 'javascript':
        case 'typescript':
        case 'cpp':
        case 'csharp':
        case 'java':
          processed = processed.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
          break;
        case 'python':
        case 'ruby':
          processed = processed.replace(/#.*$/gm, '');
          break;
        case 'html':
        case 'xml':
          processed = processed.replace(/<!--[\s\S]*?-->/g, '');
          break;
        case 'css':
          processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');
          break;
      }
    }

    // Handle whitespace
    if (ignoreWhitespace) {
      processed = processed.replace(/\s+/g, ' ').trim();
    }

    // Handle case sensitivity
    if (!caseSensitive) {
      processed = processed.toLowerCase();
    }

    return processed;
  };

  // Swap original and modified
  const swapCode = useCallback(() => {
    const temp = originalCode;
    setOriginalCode(modifiedCode);
    setModifiedCode(temp);
    toast.success('Code snippets swapped');
  }, [originalCode, modifiedCode]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${type}`);
    });
  }, []);

  // Download comparison report
  const downloadReport = useCallback(() => {
    if (!comparisonResult) return;

    const report = generateComparisonReport(comparisonResult);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparison-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Comparison report downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [comparisonResult, sessionId]);

  // Generate comparison report
  const generateComparisonReport = (result: ComparisonResult): string => {
    return `
Code Comparison Report
=====================

Language: ${result.language}
Generated: ${new Date().toISOString()}

Summary:
--------
Original lines: ${result.stats.originalLines}
Modified lines: ${result.stats.modifiedLines}
Additions: ${result.stats.additions}
Deletions: ${result.stats.deletions}
Modifications: ${result.stats.modifications}
Similarity: ${result.stats.similarity.toFixed(2)}%

Detailed Changes:
---------------
${result.stats.changes.map(change => {
  const typeSymbol = change.type === 'addition' ? '+' :
                     change.type === 'deletion' ? '-' :
                     change.type === 'modification' ? '~' : ' ';
  return `${typeSymbol} Line ${change.lineNumber}: ${change.content}`;
}).join('\n')}
`.trim();
  };

  // Upload code files
  const uploadOriginal = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setOriginalCode(content);
      toast.success('Original file uploaded');

      if (sessionId) {
        updateSession(sessionId, {
          inputs: { originalText: content, fileName: file.name },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'upload-original', true);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      if (sessionId) addToHistory(sessionId, 'upload-original', false);
    };
    reader.readAsText(file);
  }, [sessionId]);

  const uploadModified = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setModifiedCode(content);
      toast.success('Modified file uploaded');

      if (sessionId) {
        updateSession(sessionId, {
          inputs: { modifiedText: content, fileName: file.name },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'upload-modified', true);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      if (sessionId) addToHistory(sessionId, 'upload-modified', false);
    };
    reader.readAsText(file);
  }, [sessionId]);

  // Load sample code
  const loadSample = useCallback(() => {
    const samples = {
      javascript: {
        original: `// Original JavaScript code
function calculateTotal(items, taxRate) {
  let total = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    total += item.price * item.quantity;
  }

  return total * (1 + taxRate);
}

const cart = [
  { name: 'Laptop', price: 999, quantity: 1 },
  { name: 'Mouse', price: 25, quantity: 1 }
];

console.log(calculateTotal(cart, 0.08));`,

        modified: `// Modified JavaScript code
function calculateTotal(items, taxRate = 0.08) {
  let total = 0;
  let itemCount = 0;

  // Calculate total and count items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    total += item.price * item.quantity;
    itemCount += item.quantity;
  }

  // Apply volume discount
  if (itemCount > 5) {
    total *= 0.95; // 5% discount
  }

  return total * (1 + taxRate);
}

const cart = [
  { name: 'Laptop', price: 999, quantity: 1 },
  { name: 'Mouse', price: 25, quantity: 1 },
  { name: 'Keyboard', price: 75, quantity: 1 }
];

console.log(calculateTotal(cart));`
      }
    };

    const sample = samples.javascript;
    if (sample) {
      setOriginalCode(sample.original);
      setModifiedCode(sample.modified);
      toast.success('Sample code loaded');
    }
  }, []);

  // Render side-by-side view
  const renderSideBySide = useCallback((changes: Change[]) => {
    return (
      <div className=\"space-y-1 max-h-96 overflow-auto\">
        {changes.map((change, index) => (
          <div key={index} className=\"flex border-l-4\" style={{
            borderColor: change.type === 'addition' ? '#22c55e' :
                         change.type === 'deletion' ? '#ef4444' :
                         change.type === 'modification' ? '#f59e0b' : '#e5e7eb'
          }}>
            <div className=\"flex items-center space-x-4 p-2 bg-muted/30\">
              <span className=\"text-sm font-mono text-muted-foreground w-16\">
                Line {change.lineNumber}
              </span>
              <div className=\"flex-1 space-y-1\">
                {change.originalLine !== undefined && (
                  <div className=\"flex items-center space-x-2\">
                    <span className=\"text-xs text-red-600 font-mono\">-</span>
                    <code className=\"text-sm font-mono line-through\">{change.originalLine}</code>
                  </div>
                )}
                {change.modifiedLine !== undefined && (
                  <div className=\"flex items-center space-x-2\">
                    <span className=\"text-xs text-green-600 font-mono\">+</span>
                    <code className=\"text-sm font-mono\">{change.modifiedLine}</code>
                  </div>
                )}
                {change.type === 'unchanged' && (
                  <code className=\"text-sm font-mono\">{change.content}</code>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <GitCompare className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">Code Comparator</h1>
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
            onClick={swapCode}
          >
            <ArrowLeftRight className=\"h-4 w-4 mr-2\" />
            Swap
          </Button>
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <Settings className=\"h-5 w-5 mr-2\" />
            Comparison Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-4\">
            <div className=\"flex items-center space-x-4\">
              <Label htmlFor=\"language\">Language:</Label>
              <Select value={language} onValueChange={(value: ProgrammingLanguage) => setLanguage(value)}>
                <SelectTrigger className=\"w-48\">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"javascript\">JavaScript</SelectItem>
                  <SelectItem value=\"typescript\">TypeScript</SelectItem>
                  <SelectItem value=\"python\">Python</SelectItem>
                  <SelectItem value=\"java\">Java</SelectItem>
                  <SelectItem value=\"cpp\">C++</SelectItem>
                  <SelectItem value=\"csharp\">C#</SelectItem>
                  <SelectItem value=\"go\">Go</SelectItem>
                  <SelectItem value=\"rust\">Rust</SelectItem>
                  <SelectItem value=\"php\">PHP</SelectItem>
                  <SelectItem value=\"ruby\">Ruby</SelectItem>
                  <SelectItem value=\"sql\">SQL</SelectItem>
                  <SelectItem value=\"html\">HTML</SelectItem>
                  <SelectItem value=\"css\">CSS</SelectItem>
                  <SelectItem value=\"json\">JSON</SelectItem>
                  <SelectItem value=\"xml\">XML</SelectItem>
                  <SelectItem value=\"plaintext\">Plain Text</SelectItem>
                </SelectContent>
              </Select>

              <Label htmlFor=\"mode\">Mode:</Label>
              <Select value={comparisonMode} onValueChange={(value: ComparisonMode) => setComparisonMode(value)}>
                <SelectTrigger className=\"w-32\">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"side-by-side\">Side by Side</SelectItem>
                  <SelectItem value=\"unified\">Unified</SelectItem>
                  <SelectItem value=\"context\">Context</SelectItem>
                  <SelectItem value=\"statistical\">Statistical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"ignore-whitespace\"
                  checked={ignoreWhitespace}
                  onCheckedChange={setIgnoreWhitespace}
                />
                <Label htmlFor=\"ignore-whitespace\">Ignore whitespace</Label>
              </div>

              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"ignore-comments\"
                  checked={ignoreComments}
                  onCheckedChange={setIgnoreComments}
                />
                <Label htmlFor=\"ignore-comments\">Ignore comments</Label>
              </div>

              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"case-sensitive\"
                  checked={caseSensitive}
                  onCheckedChange={setCaseSensitive}
                />
                <Label htmlFor=\"case-sensitive\">Case sensitive</Label>
              </div>
            </div>

            <div className=\"flex items-center space-x-4\">
              <Button
                onClick={compareCode}
                disabled={isProcessing || !originalCode.trim() || !modifiedCode.trim()}
                className=\"flex items-center space-x-2\"
              >
                <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Comparing...' : 'Compare Code'}</span>
              </Button>

              {comparisonResult && (
                <>
                  <Button
                    variant=\"outline\"
                    onClick={downloadReport}
                  >
                    <Download className=\"h-4 w-4 mr-2\" />
                    Report
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Input */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Original Code */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <FileText className=\"h-5 w-5 mr-2\" />
                Original Code
              </div>
              <div className=\"flex items-center space-x-2\">
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => document.getElementById('original-upload')?.click()}
                >
                  <Upload className=\"h-4 w-4 mr-2\" />
                  Upload
                </Button>
                <input
                  id=\"original-upload\"
                  type=\"file\"
                  accept=\".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cs,.go,.rs,.php,.rb,.sql,.html,.css,.json,.xml,.txt\"
                  onChange={uploadOriginal}
                  className=\"hidden\"
                />
                {comparisonResult && (
                  <Badge variant=\"outline\">
                    {comparisonResult.stats.originalLines} lines
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={originalCode}
              onChange={(e) => handleOriginalChange(e.target.value)}
              placeholder=\"Paste original code here...\"
              className=\"min-h-[400px] font-mono text-sm\"
            />
          </CardContent>
        </Card>

        {/* Modified Code */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <FileText className=\"h-5 w-5 mr-2\" />
                Modified Code
              </div>
              <div className=\"flex items-center space-x-2\">
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => document.getElementById('modified-upload')?.click()}
                >
                  <Upload className=\"h-4 w-4 mr-2\" />
                  Upload
                </Button>
                <input
                  id=\"modified-upload\"
                  type=\"file\"
                  accept=\".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cs,.go,.rs,.php,.rb,.sql,.html,.css,.json,.xml,.txt\"
                  onChange={uploadModified}
                  className=\"hidden\"
                />
                {comparisonResult && (
                  <Badge variant=\"outline\">
                    {comparisonResult.stats.modifiedLines} lines
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={modifiedCode}
              onChange={(e) => handleModifiedChange(e.target.value)}
              placeholder=\"Paste modified code here...\"
              className=\"min-h-[400px] font-mono text-sm\"
            />
          </CardContent>
        </Card>
      </div>

      {/* Comparison Results */}
      {comparisonResult && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <GitCompare className=\"h-5 w-5 mr-2\" />
              Comparison Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue=\"overview\" className=\"w-full\">
              <TabsList className=\"grid w-full grid-cols-4\">
                <TabsTrigger value=\"overview\">Overview</TabsTrigger>
                <TabsTrigger value=\"changes\">Changes</TabsTrigger>
                <TabsTrigger value=\"details\">Details</TabsTrigger>
                <TabsTrigger value=\"view\">View</TabsTrigger>
              </TabsList>

              <TabsContent value=\"overview\" className=\"space-y-4 mt-4\">
                <div className=\"grid grid-cols-2 md:grid-cols-5 gap-4 text-center\">
                  <div className=\"p-4 bg-muted/50 rounded-lg\">
                    <div className=\"text-2xl font-bold text-blue-600\">
                      {comparisonResult.stats.additions}
                    </div>
                    <div className=\"text-sm text-muted-foreground\">Additions</div>
                  </div>
                  <div className=\"p-4 bg-muted/50 rounded-lg\">
                    <div className=\"text-2xl font-bold text-red-600\">
                      {comparisonResult.stats.deletions}
                    </div>
                    <div className=\"text-sm text-muted-foreground\">Deletions</div>
                  </div>
                  <div className=\"p-4 bg-muted/50 rounded-lg\">
                    <div className=\"text-2xl font-bold text-orange-600\">
                      {comparisonResult.stats.modifications}
                    </div>
                    <div className=\"text-sm text-muted-foreground\">Modifications</div>
                  </div>
                  <div className=\"p-4 bg-muted/50 rounded-lg\">
                    <div className=\"text-2xl font-bold text-green-600\">
                      {comparisonResult.stats.similarity.toFixed(1)}%
                    </div>
                    <div className=\"text-sm text-muted-foreground\">Similarity</div>
                  </div>
                  <div className=\"p-4 bg-muted/50 rounded-lg\">
                    <div className=\"text-2xl font-bold text-purple-600\">
                      {comparisonResult.stats.changes.length}
                    </div>
                    <div className=\"text-sm text-muted-foreground\">Total Changes</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value=\"changes\" className=\"mt-4\">
                <div className=\"space-y-2\">
                  <div className=\"flex items-center space-x-4 text-sm font-medium\">
                    <div className=\"flex items-center space-x-2\">
                      <div className=\"w-3 h-3 bg-green-500 rounded\"></div>
                      <span>Additions ({comparisonResult.stats.additions})</span>
                    </div>
                    <div className=\"flex items-center space-x-2\">
                      <div className=\"w-3 h-3 bg-red-500 rounded\"></div>
                      <span>Deletions ({comparisonResult.stats.deletions})</span>
                    </div>
                    <div className=\"flex items-center space-x-2\">
                      <div className=\"w-3 h-3 bg-yellow-500 rounded\"></div>
                      <span>Modifications ({comparisonResult.stats.modifications})</span>
                    </div>
                  </div>
                  {renderSideBySide(comparisonResult.stats.changes)}
                </div>
              </TabsContent>

              <TabsContent value=\"details\" className=\"mt-4\">
                <div className=\"grid grid-cols-2 gap-6\">
                  <div>
                    <h4 className=\"font-medium mb-2\">Original File</h4>
                    <div className=\"space-y-1 text-sm\">
                      <div>Lines: {comparisonResult.stats.originalLines}</div>
                      <div>Size: {comparisonResult.original.length} characters</div>
                      <div>Language: {comparisonResult.language}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className=\"font-medium mb-2\">Modified File</h4>
                    <div className=\"space-y-1 text-sm\">
                      <div>Lines: {comparisonResult.stats.modifiedLines}</div>
                      <div>Size: {comparisonResult.modified.length} characters</div>
                      <div>Language: {comparisonResult.language}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value=\"view\" className=\"mt-4\">
                <div className=\"text-center text-muted-foreground\">
                  <p>Advanced view modes coming soon:</p>
                  <ul className=\"list-disc list-inside mt-2 text-sm\">
                    <li>Unified diff format</li>
                    <li>Context diff with surrounding lines</li>
                    <li>Blame view with line history</li>
                    <li>Side-by-side with syntax highlighting</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

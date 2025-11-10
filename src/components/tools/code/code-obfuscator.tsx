/**
 * Code Obfuscator Component
 * Obfuscate JavaScript code to protect intellectual property and make reverse engineering difficult
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Code,
  Zap,
  Lock,
  RefreshCw,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface ObfuscationOptions {
  variableRenaming: boolean;
  stringEncryption: boolean;
  controlFlowFlattening: boolean;
  deadCodeInsertion: boolean;
  selfDefending: boolean;
  debugProtection: boolean;
  compactOutput: boolean;
  domainLock: string[];
}

interface ObfuscationResult {
  original: string;
  obfuscated: string;
  options: ObfuscationOptions;
  stats: {
    originalSize: number;
    obfuscatedSize: number;
    processingTime: number;
    variablesRenamed: number;
    stringsEncrypted: number;
    complexityIncrease: number;
  };
}

export function CodeObfuscator({ className }: { className?: string }) {
  const [codeInput, setCodeInput] = useState('');
  const [obfuscationResult, setObfuscationResult] = useState<ObfuscationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [obfuscationLevel, setObfuscationLevel] = useState([50]);
  const [sessionId, setSessionId] = useState<string>('');

  const [options, setOptions] = useState<ObfuscationOptions>({
    variableRenaming: true,
    stringEncryption: true,
    controlFlowFlattening: false,
    deadCodeInsertion: false,
    selfDefending: false,
    debugProtection: true,
    compactOutput: true,
    domainLock: []
  });

  // Initialize session
  useEffect(() => {
    const session = createSession('code-obfuscator', {
      initialInput: '',
      options,
      obfuscationLevel: obfuscationLevel[0]
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
        inputs: { text: value, options, obfuscationLevel: obfuscationLevel[0] },
        lastActivity: new Date()
      });
    }
  }, [sessionId, options, obfuscationLevel]);

  // Obfuscate code
  const obfuscateCode = useCallback(async () => {
    if (!codeInput.trim()) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      let obfuscated = codeInput;
      let variablesRenamed = 0;
      let stringsEncrypted = 0;

      // Variable renaming
      if (options.variableRenaming) {
        try {
          const variableMap = new Map<string, string>();
          let varCounter = 0;

          // Generate random variable names
          const generateRandomName = () => {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let result = '';
            for (let i = 0; i < 8; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };

          // Find and rename variables
          const varPattern = /\b(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
          obfuscated = obfuscated.replace(varPattern, (match, keyword, varName) => {
            if (!variableMap.has(varName)) {
              variableMap.set(varName, generateRandomName());
              variablesRenamed++;
            }
            return `${keyword} ${variableMap.get(varName)}`;
          });

          // Replace variable usage
          variableMap.forEach((newName, originalName) => {
            const regex = new RegExp(`\\b${originalName}\\b`, 'g');
            obfuscated = obfuscated.replace(regex, newName);
          });

        } catch (error) {
          console.warn('Variable renaming failed:', error);
        }
      }

      // String encryption
      if (options.stringEncryption) {
        try {
          const stringMap = new Map<string, string>();

          // Find string literals
          const stringPattern = /(["'`])([^"'`]*)\1/g;
          obfuscated = obfuscated.replace(stringPattern, (match, quote, content) => {
            if (!stringMap.has(content)) {
              // Simple "encryption" using character codes
              const encrypted = content.split('').map(char =>
                `\\x${char.charCodeAt(0).toString(16)}`
              ).join('');
              const varName = `_str_${stringMap.size}`;
              stringMap.set(content, varName);
              stringsEncrypted++;

              // Add decryption function at the top
              const decryption = `function ${varName}(){return String.fromCharCode(${content.split('').map(c => c.charCodeAt(0)).join(',')});}`;
              obfuscated = decryption + ';' + obfuscated;
              return varName + '()';
            }
            return match;
          });

        } catch (error) {
          console.warn('String encryption failed:', error);
        }
      }

      // Control flow flattening (basic)
      if (options.controlFlowFlattening) {
        try {
          // Wrap code in a switch statement for basic control flow flattening
          const functions = obfuscated.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g) || [];

          functions.forEach(func => {
            const funcName = func.match(/function\s+(\w+)/)?.[1];
            if (funcName) {
              const funcBody = func.match(/\{([^}]*)\}/)?.[1];
              if (funcBody) {
                const flattenedBody = `
                  switch(Math.floor(Math.random()*2)){
                    case 0: ${funcBody}; break;
                    case 1: ${funcBody}; break;
                  }
                `;
                obfuscated = obfuscated.replace(func, `function ${funcName}(){${flattenedBody}}`);
              }
            }
          });

        } catch (error) {
          console.warn('Control flow flattening failed:', error);
        }
      }

      // Dead code insertion
      if (options.deadCodeInsertion) {
        try {
          const deadCodeSnippets = [
            'if(false){console.log("dead code");}',
            'while(false){break;}',
            'for(let i=0;i<0;i++){continue;}',
            'switch(null){case null:break;}'
          ];

          // Insert dead code at random intervals
          const lines = obfuscated.split('\n');
          const insertInterval = Math.max(1, Math.floor(lines.length / 10));

          for (let i = insertInterval; i < lines.length; i += insertInterval) {
            const randomSnippet = deadCodeSnippets[Math.floor(Math.random() * deadCodeSnippets.length)];
            lines.splice(i, 0, randomSnippet);
          }

          obfuscated = lines.join('\n');

        } catch (error) {
          console.warn('Dead code insertion failed:', error);
        }
      }

      // Self-defending code
      if (options.selfDefending) {
        try {
          const selfDefendingCode = `
            (function(){
              var _0x${Math.random().toString(36).substr(2, 9)} = function(){return true;};
              var _0x${Math.random().toString(36).substr(2, 9)} = setInterval(function(){debugger;}, 100);
              if(typeof window !== 'undefined' && window.location.hostname !== 'localhost'){
                document.body.innerHTML = '<h1>Unauthorized Access</h1>';
              }
            })();
          `;
          obfuscated = selfDefendingCode + ';' + obfuscated;

        } catch (error) {
          console.warn('Self-defending code insertion failed:', error);
        }
      }

      // Debug protection
      if (options.debugProtection) {
        try {
          const debugProtectionCode = `
            (function(){
              var _debug = setInterval(function(){debugger;}, 50);
              setTimeout(function(){clearInterval(_debug);}, 100);
            })();
          `;
          obfuscated = debugProtectionCode + ';' + obfuscated;

        } catch (error) {
          console.warn('Debug protection failed:', error);
        }
      }

      // Compact output
      if (options.compactOutput) {
        obfuscated = obfuscated
          .replace(/\s+/g, ' ')
          .replace(/;\s*/g, ';')
          .replace(/\s*([{}();])\s*/g, '$1')
          .trim();
      }

      // Calculate statistics
      const originalSize = codeInput.length;
      const obfuscatedSize = obfuscated.length;
      const complexityIncrease = originalSize > 0 ? ((obfuscatedSize - originalSize) / originalSize * 100) : 0;
      const processingTime = Date.now() - startTime;

      const stats = {
        originalSize,
        obfuscatedSize,
        processingTime,
        variablesRenamed,
        stringsEncrypted,
        complexityIncrease
      };

      setObfuscationResult({
        original: codeInput,
        obfuscated,
        options: { ...options },
        stats
      });

      toast.success('Code obfuscated successfully!');

      if (sessionId) {
        updateSession(sessionId, {
          results: { obfuscated, stats, options },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'obfuscate', true);
      }

    } catch (error) {
      toast.error('Failed to obfuscate code');
      if (sessionId) addToHistory(sessionId, 'obfuscate', false);
    } finally {
      setIsProcessing(false);
    }
  }, [codeInput, options, sessionId]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${type}`);
    });
  }, []);

  // Download obfuscated code
  const downloadObfuscated = useCallback(() => {
    if (!obfuscationResult) return;

    const blob = new Blob([obfuscationResult.obfuscated], {
      type: 'text/javascript'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'obfuscated.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Obfuscated file downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [obfuscationResult, sessionId]);

  // Upload code file
  const uploadCode = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCodeInput(content);
      toast.success('File uploaded successfully');

      if (sessionId) {
        updateSession(sessionId, {
          inputs: { text: content, fileName: file.name },
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
  }, [sessionId]);

  // Load sample code
  const loadSample = useCallback(() => {
    const sample = `// Sample JavaScript code for obfuscation
function calculateTotal(items, taxRate = 0.08) {
  let total = 0;
  const discountThreshold = 100;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemTotal = item.price * item.quantity;

    // Apply discount for expensive items
    if (itemTotal > discountThreshold) {
      total += itemTotal * 0.9; // 10% discount
    } else {
      total += itemTotal;
    }
  }

  // Add tax
  total += total * taxRate;

  // Format to 2 decimal places
  return Math.round(total * 100) / 100;
}

const shoppingCart = [
  { name: 'Laptop', price: 999.99, quantity: 1 },
  { name: 'Mouse', price: 29.99, quantity: 1 },
  { name: 'Keyboard', price: 79.99, quantity: 1 }
];

const total = calculateTotal(shoppingCart);
console.log('Total amount: $' + total);

export { calculateTotal };`;

    setCodeInput(sample);
    toast.success('Sample code loaded');
  }, []);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate obfuscation score
  const calculateObfuscationScore = useCallback((): number => {
    let score = 0;

    if (options.variableRenaming) score += 25;
    if (options.stringEncryption) score += 20;
    if (options.controlFlowFlattening) score += 15;
    if (options.deadCodeInsertion) score += 10;
    if (options.selfDefending) score += 15;
    if (options.debugProtection) score += 10;
    if (options.compactOutput) score += 5;

    return Math.min(100, score + (obfuscationLevel[0] / 100) * 10);
  }, [options, obfuscationLevel]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Shield className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">Code Obfuscator</h1>
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
            accept=\".js,.jsx,.ts,.tsx\"
            onChange={uploadCode}
            className=\"hidden\"
          />
        </div>
      </div>

      {/* Security Warning */}
      <Alert>
        <AlertTriangle className=\"h-4 w-4\" />
        <AlertDescription>
          <strong>Important:</strong> This tool is for legitimate code protection purposes only.
          Obfuscated code can be difficult to debug and maintain. Always keep a clean, readable backup of your source code.
        </AlertDescription>
      </Alert>

      {/* Obfuscation Options */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <Settings className=\"h-5 w-5 mr-2\" />
            Obfuscation Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue=\"basic\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-3\">
              <TabsTrigger value=\"basic\">Basic</TabsTrigger>
              <TabsTrigger value=\"advanced\">Advanced</TabsTrigger>
              <TabsTrigger value=\"output\">Output</TabsTrigger>
            </TabsList>

            <TabsContent value=\"basic\" className=\"space-y-4 mt-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"variable-renaming\"
                    checked={options.variableRenaming}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, variableRenaming: checked }))
                    }
                  />
                  <Label htmlFor=\"variable-renaming\">Variable renaming</Label>
                </div>

                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"string-encryption\"
                    checked={options.stringEncryption}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, stringEncryption: checked }))
                    }
                  />
                  <Label htmlFor=\"string-encryption\">String encryption</Label>
                </div>

                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"debug-protection\"
                    checked={options.debugProtection}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, debugProtection: checked }))
                    }
                  />
                  <Label htmlFor=\"debug-protection\">Debug protection</Label>
                </div>

                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"compact-output\"
                    checked={options.compactOutput}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, compactOutput: checked }))
                    }
                  />
                  <Label htmlFor=\"compact-output\">Compact output</Label>
                </div>
              </div>

              <div className=\"space-y-2\">
                <Label>Obfuscation Level: {obfuscationLevel[0]}%</Label>
                <Slider
                  value={obfuscationLevel}
                  onValueChange={setObfuscationLevel}
                  max={100}
                  min={10}
                  step={10}
                  className=\"w-full\"
                />
              </div>
            </TabsContent>

            <TabsContent value=\"advanced\" className=\"space-y-4 mt-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"control-flow-flattening\"
                    checked={options.controlFlowFlattening}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, controlFlowFlattening: checked }))
                    }
                  />
                  <Label htmlFor=\"control-flow-flattening\">Control flow flattening</Label>
                </div>

                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"dead-code-insertion\"
                    checked={options.deadCodeInsertion}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, deadCodeInsertion: checked }))
                    }
                  />
                  <Label htmlFor=\"dead-code-insertion\">Dead code insertion</Label>
                </div>

                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"self-defending\"
                    checked={options.selfDefending}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, selfDefending: checked }))
                    }
                  />
                  <Label htmlFor=\"self-defending\">Self-defending code</Label>
                </div>
              </div>

              <div className=\"text-sm text-muted-foreground\">
                <p>Advanced techniques increase protection but may impact performance and readability.</p>
              </div>
            </TabsContent>

            <TabsContent value=\"output\" className=\"space-y-4 mt-4\">
              <div className=\"text-center space-y-2\">
                <div className=\"text-2xl font-bold text-blue-600\">
                  {calculateObfuscationScore()}%
                </div>
                <div className=\"text-sm text-muted-foreground\">Protection Score</div>
                <Progress value={calculateObfuscationScore()} className=\"h-2 mt-2\" />
              </div>
            </TabsContent>
          </Tabs>

          <div className=\"flex items-center space-x-4 pt-4 border-t\">
            <Button
              onClick={obfuscateCode}
              disabled={isProcessing || !codeInput.trim()}
              className=\"flex items-center space-x-2\"
            >
              <Lock className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
              <span>{isProcessing ? 'Obfuscating...' : 'Obfuscate Code'}</span>
            </Button>

            {obfuscationResult && (
              <>
                <Button
                  variant=\"outline\"
                  onClick={() => copyToClipboard(obfuscationResult.obfuscated, 'Obfuscated code')}
                >
                  <Copy className=\"h-4 w-4 mr-2\" />
                  Copy
                </Button>

                <Button
                  variant=\"outline\"
                  onClick={downloadObfuscated}
                >
                  <Download className=\"h-4 w-4 mr-2\" />
                  Download
                </Button>
              </>
            )}
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
                Original Code
              </div>
              {obfuscationResult && (
                <Badge variant=\"outline\">
                  {formatBytes(obfuscationResult.stats.originalSize)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={codeInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder=\"Paste your JavaScript code here...\"
              className=\"min-h-[400px] font-mono text-sm\"
            />
          </CardContent>
        </Card>

        {/* Obfuscated Code */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <Zap className=\"h-5 w-5 mr-2\" />
                Obfuscated Code
              </div>
              <div className=\"flex items-center space-x-2\">
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className=\"h-4 w-4\" /> : <Eye className=\"h-4 w-4\" />}
                </Button>
                {obfuscationResult && (
                  <Badge variant=\"outline\">
                    {formatBytes(obfuscationResult.stats.obfuscatedSize)}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obfuscationResult ? (
              <div className=\"space-y-3\">
                {showPreview ? (
                  <Textarea
                    value={obfuscationResult.obfuscated}
                    readOnly
                    className=\"min-h-[400px] font-mono text-sm bg-muted/50\"
                  />
                ) : (
                  <div className=\"text-sm text-muted-foreground p-3 bg-muted/50 rounded h-80 flex items-center justify-center\">
                    Obfuscated code hidden
                  </div>
                )}
              </div>
            ) : (
              <div className=\"text-sm text-muted-foreground p-3 bg-muted/50 rounded h-80 flex items-center justify-center\">
                Obfuscated code will appear here...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {obfuscationResult && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <RefreshCw className=\"h-5 w-5 mr-2\" />
              Obfuscation Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mb-6\">
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-blue-600\">
                  {formatBytes(obfuscationResult.stats.originalSize)}
                </div>
                <div className=\"text-sm text-muted-foreground\">Original Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-green-600\">
                  {formatBytes(obfuscationResult.stats.obfuscatedSize)}
                </div>
                <div className=\"text-sm text-muted-foreground\">Obfuscated Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-purple-600\">
                  {obfuscationResult.stats.variablesRenamed}
                </div>
                <div className=\"text-sm text-muted-foreground\">Variables Renamed</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-2xl font-bold text-orange-600\">
                  {obfuscationResult.stats.stringsEncrypted}
                </div>
                <div className=\"text-sm text-muted-foreground\">Strings Encrypted</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className=\"grid grid-cols-2 md:grid-cols-3 gap-4 text-center pt-4 border-t\">
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {obfuscationResult.stats.processingTime}ms
                </div>
                <div className=\"text-xs text-muted-foreground\">Processing Time</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {obfuscationResult.stats.complexityIncrease.toFixed(1)}%
                </div>
                <div className=\"text-xs text-muted-foreground\">Complexity Increase</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {calculateObfuscationScore()}%
                </div>
                <div className=\"text-xs text-muted-foreground\">Protection Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

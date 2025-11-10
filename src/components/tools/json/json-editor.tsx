/**
 * JSON Editor Component
 * Interactive JSON editor with real-time validation, formatting, and syntax highlighting
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Format,
  TreePine
} from 'lucide-react';
import { toast } from 'sonner';
import { validateInput } from '@/lib/validation';
import { processJSON } from '@/lib/processing';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface JSONEditorProps {
  initialData?: string;
  onJSONChange?: (json: any, isValid: boolean) => void;
  className?: string;
}

export function JSONEditor({ initialData = '', onJSONChange, className }: JSONEditorProps) {
  const [jsonText, setJsonText] = useState(initialData);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [formattedJSON, setFormattedJSON] = useState('');
  const [showTree, setShowTree] = useState(false);
  const [realTimeValidation, setRealTimeValidation] = useState(true);
  const [autoFormat, setAutoFormat] = useState(true);
  const [indentation, setIndentation] = useState([2]);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const editorRef = useRef<any>(null);

  // Initialize session
  useEffect(() => {
    const session = createSession('json-editor', {
      initialData,
      options: { realTimeValidation, autoFormat, indentation: indentation[0] }
    });
    setSessionId(session.id);
    return () => {
      // Cleanup session on unmount
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Validate JSON in real-time
  const validateJSON = useCallback((text: string) => {
    if (!text.trim()) {
      setIsValid(true);
      setValidationError('');
      onJSONChange?.(null, true);
      return true;
    }

    const validation = validateInput('json-formatter', text);
    if (validation.isValid) {
      setIsValid(true);
      setValidationError('');

      try {
        const parsed = JSON.parse(text);
        onJSONChange?.(parsed, true);
        return true;
      } catch (error) {
        setIsValid(false);
        setValidationError(error instanceof Error ? error.message : 'Invalid JSON');
        onJSONChange?.(null, false);
        return false;
      }
    } else {
      setIsValid(false);
      setValidationError(validation.errors[0]?.message || 'Invalid JSON');
      onJSONChange?.(null, false);
      return false;
    }
  }, [onJSONChange]);

  // Handle text change
  const handleTextChange = useCallback((value: string | undefined) => {
    const newText = value || '';
    setJsonText(newText);

    if (realTimeValidation) {
      validateJSON(newText);
    }

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { text: newText },
        lastActivity: new Date()
      });
    }
  }, [realTimeValidation, validateJSON, sessionId]);

  // Format JSON
  const formatJSON = useCallback(async () => {
    if (!jsonText.trim()) return;

    setIsProcessing(true);
    try {
      const result = await processJSON(jsonText, 'format', {
        indentation: indentation[0]
      });

      if (result.success) {
        setFormattedJSON(result.result);
        setJsonText(result.result);
        validateJSON(result.result);
        toast.success('JSON formatted successfully');

        if (sessionId) {
          updateSession(sessionId, {
            results: { formatted: result.result },
            lastActivity: new Date()
          });
          addToHistory(sessionId, 'format', true);
        }
      } else {
        toast.error(result.error?.message || 'Failed to format JSON');

        if (sessionId) {
          addToHistory(sessionId, 'format', false);
        }
      }
    } catch (error) {
      toast.error('Failed to format JSON');
      if (sessionId) addToHistory(sessionId, 'format', false);
    } finally {
      setIsProcessing(false);
    }
  }, [jsonText, indentation, validateJSON, sessionId]);

  // Minify JSON
  const minifyJSON = useCallback(async () => {
    if (!jsonText.trim()) return;

    setIsProcessing(true);
    try {
      const result = await processJSON(jsonText, 'minify');

      if (result.success) {
        setJsonText(result.result);
        validateJSON(result.result);
        toast.success('JSON minified successfully');

        if (sessionId) {
          updateSession(sessionId, {
            results: { minified: result.result },
            lastActivity: new Date()
          });
          addToHistory(sessionId, 'minify', true);
        }
      } else {
        toast.error(result.error?.message || 'Failed to minify JSON');
        if (sessionId) addToHistory(sessionId, 'minify', false);
      }
    } catch (error) {
      toast.error('Failed to minify JSON');
      if (sessionId) addToHistory(sessionId, 'minify', false);
    } finally {
      setIsProcessing(false);
    }
  }, [jsonText, validateJSON, sessionId]);

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(jsonText).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  }, [jsonText]);

  // Download JSON file
  const downloadJSON = useCallback(() => {
    if (!jsonText.trim()) return;

    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('JSON file downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [jsonText, sessionId]);

  // Upload JSON file
  const uploadJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      validateJSON(content);
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
  }, [validateJSON, sessionId]);

  // Editor options
  const editorOptions = {
    minimap: { enabled: minimap },
    fontSize: 14,
    lineNumbers: lineNumbers ? 'on' : 'off',
    wordWrap: wordWrap ? 'on' : 'off',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    },
    suggest: {
      showKeywords: false,
      showSnippets: false
    }
  };

  // Auto-format on change if enabled
  useEffect(() => {
    if (autoFormat && isValid && jsonText.trim()) {
      const timer = setTimeout(() => {
        try {
          const parsed = JSON.parse(jsonText);
          const formatted = JSON.stringify(parsed, null, indentation[0]);
          if (formatted !== jsonText) {
            setFormattedJSON(formatted);
          }
        } catch {
          // Don't auto-format invalid JSON
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [jsonText, isValid, autoFormat, indentation]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with validation status */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          {isValid ? (
            <CheckCircle2 className=\"h-5 w-5 text-green-500\" />
          ) : (
            <XCircle className=\"h-5 w-5 text-red-500\" />
          )}
          <span className=\"text-sm font-medium\">
            {isValid ? 'Valid JSON' : 'Invalid JSON'}
          </span>
          {!isValid && validationError && (
            <span className=\"text-sm text-red-600 dark:text-red-400\">
              {validationError}
            </span>
          )}
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={() => setShowTree(!showTree)}
          >
            {showTree ? <EyeOff className=\"h-4 w-4 mr-2\" /> : <Eye className=\"h-4 w-4 mr-2\" />}
            {showTree ? 'Hide Tree' : 'Show Tree'}
          </Button>

          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={copyToClipboard}
          >
            <Copy className=\"h-4 w-4 mr-2\" />
            Copy
          </Button>

          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={downloadJSON}
          >
            <Download className=\"h-4 w-4 mr-2\" />
            Download
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
            accept=\".json,.json5\"
            onChange={uploadJSON}
            className=\"hidden\"
          />
        </div>
      </div>

      {/* Editor and Tree View */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-4\">
        {/* JSON Editor */}
        <Card>
          <CardHeader className=\"pb-3\">
            <CardTitle className=\"text-lg flex items-center\">
              <Format className=\"h-5 w-5 mr-2\" />
              JSON Editor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"border rounded-lg overflow-hidden\">
              <Editor
                height=\"500px\"
                language=\"json\"
                value={jsonText}
                onChange={handleTextChange}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                options={editorOptions}
                theme=\"vs-dark\"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tree View or Formatted Output */}
        {showTree && (
          <Card>
            <CardHeader className=\"pb-3\">
              <CardTitle className=\"text-lg flex items-center\">
                <TreePine className=\"h-5 w-5 mr-2\" />
                {isValid ? 'JSON Tree' : 'Formatted Output'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"border rounded-lg p-4 h-[500px] overflow-auto bg-muted/50\">
                {isValid ? (
                  <JSONTree data={jsonText} />
                ) : (
                  <pre className=\"text-sm whitespace-pre-wrap font-mono\">
                    {formattedJSON || jsonText}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className=\"text-lg\">Editor Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue=\"formatting\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-3\">
              <TabsTrigger value=\"formatting\">Formatting</TabsTrigger>
              <TabsTrigger value=\"editor\">Editor</TabsTrigger>
              <TabsTrigger value=\"validation\">Validation</TabsTrigger>
            </TabsList>

            <TabsContent value=\"formatting\" className=\"space-y-4 mt-4\">
              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"auto-format\"
                  checked={autoFormat}
                  onCheckedChange={setAutoFormat}
                />
                <Label htmlFor=\"auto-format\">Auto-format on valid JSON</Label>
              </div>

              <div className=\"space-y-2\">
                <Label>Indentation: {indentation[0]} spaces</Label>
                <Slider
                  value={indentation}
                  onValueChange={setIndentation}
                  max={8}
                  min={1}
                  step={1}
                  className=\"w-full\"
                />
              </div>

              <div className=\"flex space-x-2\">
                <Button onClick={formatJSON} disabled={isProcessing || !isValid}>
                  <Format className=\"h-4 w-4 mr-2\" />
                  Format
                </Button>
                <Button variant=\"outline\" onClick={minifyJSON} disabled={isProcessing || !isValid}>
                  Minify
                </Button>
              </div>
            </TabsContent>

            <TabsContent value=\"editor\" className=\"space-y-4 mt-4\">
              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"line-numbers\"
                  checked={lineNumbers}
                  onCheckedChange={setLineNumbers}
                />
                <Label htmlFor=\"line-numbers\">Show line numbers</Label>
              </div>

              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"word-wrap\"
                  checked={wordWrap}
                  onCheckedChange={setWordWrap}
                />
                <Label htmlFor=\"word-wrap\">Word wrap</Label>
              </div>

              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"minimap\"
                  checked={minimap}
                  onCheckedChange={setMinimap}
                />
                <Label htmlFor=\"minimap\">Show minimap</Label>
              </div>
            </TabsContent>

            <TabsContent value=\"validation\" className=\"space-y-4 mt-4\">
              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"real-time-validation\"
                  checked={realTimeValidation}
                  onCheckedChange={setRealTimeValidation}
                />
                <Label htmlFor=\"real-time-validation\">Real-time validation</Label>
              </div>

              {!realTimeValidation && (
                <Button onClick={() => validateJSON(jsonText)}>
                  Validate JSON
                </Button>
              )}

              {validationError && (
                <div className=\"p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg\">
                  <div className=\"flex items-start space-x-2\">
                    <AlertCircle className=\"h-5 w-5 text-red-500 mt-0.5\" />
                    <div className=\"flex-1\">
                      <p className=\"text-sm font-medium text-red-800 dark:text-red-200\">
                        Validation Error
                      </p>
                      <p className=\"text-sm text-red-600 dark:text-red-300 mt-1\">
                        {validationError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple JSON Tree component for visualization
function JSONTree({ data }: { data: string }) {
  try {
    const parsed = JSON.parse(data);
    return (
      <div className=\"space-y-2\">
        {renderTreeNode(parsed, '')}
      </div>
    );
  } catch {
    return (
      <pre className=\"text-sm text-red-600 dark:text-red-400\">
        Invalid JSON - cannot display tree
      </pre>
    );
  }
}

function renderTreeNode(obj: any, path: string): React.ReactNode {
  if (obj === null) {
    return <div className=\"text-gray-500\">null</div>;
  }

  if (typeof obj === 'string') {
    return <div className=\"text-green-600 dark:text-green-400\">\"{obj}\"</div>;
  }

  if (typeof obj === 'number') {
    return <div className=\"text-blue-600 dark:text-blue-400\">{obj}</div>;
  }

  if (typeof obj === 'boolean') {
    return <div className=\"text-purple-600 dark:text-purple-400\">{obj}</div>;
  }

  if (Array.isArray(obj)) {
    return (
      <div className=\"ml-4\">
        <span className=\"text-gray-600 dark:text-gray-400\">[{obj.length}]</span>
        {obj.map((item, index) => (
          <div key={index} className=\"ml-4 border-l border-gray-200 dark:border-gray-700 pl-2\">
            <span className=\"text-gray-500\">[{index}]:</span>
            {renderTreeNode(item, `${path}[${index}]`)}
          </div>
        ))}
      </div>
    );
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    return (
      <div className=\"ml-4\">
        <span className=\"text-gray-600 dark:text-gray-400\">{'{'}{keys.length}{'}'}</span>
        {keys.map(key => (
          <div key={key} className=\"ml-4 border-l border-gray-200 dark:border-gray-700 pl-2\">
            <span className=\"text-orange-600 dark:text-orange-400\">\"{key}\":</span>
            {renderTreeNode(obj[key], path ? `${path}.${key}` : key)}
          </div>
        ))}
      </div>
    );
  }

  return <div className=\"text-gray-500\">{String(obj)}</div>;
}

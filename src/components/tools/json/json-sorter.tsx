/**
 * JSON Sorter Component
 * Sort JSON object keys alphabetically or by custom order
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Alphabetical,
  Hash,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { validateInput } from '@/lib/validation';
import { processJSON } from '@/lib/processing';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface JSONSorterProps {
  initialData?: string;
  onSortedChange?: (sorted: string) => void;
  className?: string;
}

type SortOrder = 'alphabetical' | 'alphabetical-desc' | 'custom' | 'length' | 'type';

export function JSONSorter({ initialData = '', onSortedChange, className }: JSONSorterProps) {
  const [jsonText, setJsonText] = useState(initialData);
  const [sortedJSON, setSortedJSON] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('alphabetical');
  const [sortKeys, setSortKeys] = useState(true);
  const [sortArrays, setSortArrays] = useState(false);
  const [recursive, setRecursive] = useState(true);
  const [customOrder, setCustomOrder] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [stats, setStats] = useState({
    originalKeys: 0,
    sortedKeys: 0,
    processingTime: 0
  });

  // Initialize session
  useEffect(() => {
    const session = createSession('json-sorter', {
      initialData,
      options: { sortOrder, sortKeys, sortArrays, recursive, caseSensitive }
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Validate JSON
  const validateJSON = useCallback((text: string) => {
    if (!text.trim()) {
      setIsValid(true);
      setValidationError('');
      return true;
    }

    const validation = validateInput('json-formatter', text);
    if (validation.isValid) {
      try {
        JSON.parse(text);
        setIsValid(true);
        setValidationError('');
        return true;
      } catch (error) {
        setIsValid(false);
        setValidationError(error instanceof Error ? error.message : 'Invalid JSON');
        return false;
      }
    } else {
      setIsValid(false);
      setValidationError(validation.errors[0]?.message || 'Invalid JSON');
      return false;
    }
  }, []);

  // Handle text change
  const handleTextChange = useCallback((value: string) => {
    setJsonText(value);
    validateJSON(value);

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { text: value },
        lastActivity: new Date()
      });
    }
  }, [validateJSON, sessionId]);

  // Sort JSON
  const sortJSON = useCallback(async () => {
    if (!jsonText.trim() || !isValid) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      const options = {
        sortKeys,
        sortOrder,
        sortArrays,
        recursive,
        caseSensitive,
        customOrder: customOrder.split(',').map(s => s.trim()).filter(Boolean)
      };

      const result = await processJSON(jsonText, 'sort', options);

      if (result.success) {
        setSortedJSON(result.result);
        onSortedChange?.(result.result);

        const processingTime = Date.now() - startTime;
        setStats({
          originalKeys: countKeys(JSON.parse(jsonText)),
          sortedKeys: countKeys(JSON.parse(result.result)),
          processingTime
        });

        toast.success('JSON sorted successfully');

        if (sessionId) {
          updateSession(sessionId, {
            results: { sorted: result.result, stats: { processingTime } },
            lastActivity: new Date()
          });
          addToHistory(sessionId, 'sort', true);
        }
      } else {
        toast.error(result.error?.message || 'Failed to sort JSON');
        if (sessionId) addToHistory(sessionId, 'sort', false);
      }
    } catch (error) {
      toast.error('Failed to sort JSON');
      if (sessionId) addToHistory(sessionId, 'sort', false);
    } finally {
      setIsProcessing(false);
    }
  }, [jsonText, isValid, sortKeys, sortOrder, sortArrays, recursive, caseSensitive, customOrder, onSortedChange, sessionId]);

  // Count keys in JSON object
  const countKeys = (obj: any): number => {
    if (obj === null || typeof obj !== 'object') return 0;
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + countKeys(item), 0);
    }
    return Object.keys(obj).length + Object.values(obj).reduce((sum, value) => sum + countKeys(value), 0);
  };

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(sortedJSON || jsonText).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  }, [sortedJSON, jsonText]);

  // Download sorted JSON
  const downloadJSON = useCallback(() => {
    const content = sortedJSON || jsonText;
    if (!content.trim()) return;

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sorted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Sorted JSON file downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [sortedJSON, jsonText, sessionId]);

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

  // Auto-sort when options change
  useEffect(() => {
    if (jsonText.trim() && isValid && sortedJSON) {
      sortJSON();
    }
  }, [sortOrder, sortKeys, sortArrays, recursive, caseSensitive]);

  const getSortIcon = (order: SortOrder) => {
    switch (order) {
      case 'alphabetical':
      case 'alphabetical-desc':
        return <Alphabetical className=\"h-4 w-4\" />;
      case 'length':
        return <Hash className=\"h-4 w-4\" />;
      case 'type':
        return <RefreshCw className=\"h-4 w-4\" />;
      default:
        return <ArrowUpDown className=\"h-4 w-4\" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
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
            <Badge variant=\"destructive\">{validationError}</Badge>
          )}
        </div>

        <div className=\"flex items-center space-x-2\">
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
            accept=\".json\"
            onChange={uploadJSON}
            className=\"hidden\"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Input JSON */}
        <Card>
          <CardHeader>
            <CardTitle className=\"text-lg\">Original JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder=\"Paste your JSON here...\"
              className=\"min-h-[400px] font-mono text-sm\"
            />
          </CardContent>
        </Card>

        {/* Sorted JSON */}
        <Card>
          <CardHeader>
            <CardTitle className=\"text-lg flex items-center\">
              {getSortIcon(sortOrder)}
              <span className=\"ml-2\">Sorted JSON</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={sortedJSON}
              readOnly
              placeholder=\"Sorted JSON will appear here...\"
              className=\"min-h-[400px] font-mono text-sm bg-muted/50\"
            />
          </CardContent>
        </Card>
      </div>

      {/* Sorting Options */}
      <Card>
        <CardHeader>
          <CardTitle className=\"text-lg\">Sorting Options</CardTitle>
        </CardHeader>
        <CardContent className=\"space-y-6\">
          {/* Sort Order */}
          <div className=\"space-y-3\">
            <Label className=\"text-base font-medium\">Sort Order</Label>
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-3\">
              {[
                { value: 'alphabetical', label: 'A-Z', icon: <Alphabetical className=\"h-4 w-4\" /> },
                { value: 'alphabetical-desc', label: 'Z-A', icon: <Alphabetical className=\"h-4 w-4 rotate-180\" /> },
                { value: 'length', label: 'Length', icon: <Hash className=\"h-4 w-4\" /> },
                { value: 'type', label: 'Type', icon: <RefreshCw className=\"h-4 w-4\" /> }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={sortOrder === option.value ? \"default\" : \"outline\"}
                  onClick={() => setSortOrder(option.value as SortOrder)}
                  className=\"flex items-center space-x-2\"
                >
                  {option.icon}
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Sorting Options */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
            <div className=\"flex items-center space-x-2\">
              <Switch
                id=\"sort-keys\"
                checked={sortKeys}
                onCheckedChange={setSortKeys}
              />
              <Label htmlFor=\"sort-keys\">Sort object keys</Label>
            </div>

            <div className=\"flex items-center space-x-2\">
              <Switch
                id=\"sort-arrays\"
                checked={sortArrays}
                onCheckedChange={setSortArrays}
              />
              <Label htmlFor=\"sort-arrays\">Sort array values</Label>
            </div>

            <div className=\"flex items-center space-x-2\">
              <Switch
                id=\"recursive\"
                checked={recursive}
                onCheckedChange={setRecursive}
              />
              <Label htmlFor=\"recursive\">Recursive sort</Label>
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

          {/* Custom Order */}
          <div className=\"space-y-2\">
            <Label htmlFor=\"custom-order\">Custom Order (comma-separated)</Label>
            <Input
              id=\"custom-order\"
              value={customOrder}
              onChange={(e) => setCustomOrder(e.target.value)}
              placeholder=\"e.g., id,name,created_at,updated_at\"
              disabled={sortOrder !== 'custom'}
            />
            <p className=\"text-sm text-muted-foreground\">
              Define custom key order for sorting. Only used when \"Custom\" sort order is selected.
            </p>
          </div>

          {/* Action Button */}
          <div className=\"flex items-center space-x-4\">
            <Button
              onClick={sortJSON}
              disabled={isProcessing || !isValid || !jsonText.trim()}
              className=\"flex items-center space-x-2\"
            >
              <ArrowUpDown className=\"h-4 w-4\" />
              <span>{isProcessing ? 'Sorting...' : 'Sort JSON'}</span>
            </Button>

            {stats.processingTime > 0 && (
              <div className=\"text-sm text-muted-foreground\">
                Processed in {stats.processingTime}ms • {stats.originalKeys} keys
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {sortedJSON && (
        <Card>
          <CardHeader>
            <CardTitle className=\"text-lg\">Sorting Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-center\">
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-blue-600\">{stats.originalKeys}</div>
                <div className=\"text-sm text-muted-foreground\">Original Keys</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-green-600\">{stats.sortedKeys}</div>
                <div className=\"text-sm text-muted-foreground\">Sorted Keys</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-purple-600\">{stats.processingTime}</div>
                <div className=\"text-sm text-muted-foreground\">Processing Time (ms)</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-orange-600\">{sortOrder}</div>
                <div className=\"text-sm text-muted-foreground\">Sort Order</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

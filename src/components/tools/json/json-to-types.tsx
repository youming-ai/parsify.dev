'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Braces, Copy, Download, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

type Language = 'typescript' | 'python' | 'go' | 'java';

const sampleJson = `{
  "id": 123,
  "name": "Parsify",
  "active": true,
  "tags": ["tools", "dev"],
  "profile": {"website": "https://parsify.dev", "plan": "pro"}
}`;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getValueKind = (
  value: unknown
): 'null' | 'array' | 'object' | 'string' | 'number' | 'boolean' | 'unknown' => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
};

const typeMap: Record<Language, Record<string, string>> = {
  typescript: {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    null: 'null',
    unknown: 'unknown',
  },
  python: {
    string: 'str',
    number: 'float',
    boolean: 'bool',
    null: 'None',
    unknown: 'Any',
  },
  go: {
    string: 'string',
    number: 'float64',
    boolean: 'bool',
    null: 'interface{}',
    unknown: 'interface{}',
  },
  java: {
    string: 'String',
    number: 'Double',
    boolean: 'Boolean',
    null: 'Object',
    unknown: 'Object',
  },
};

const renderType = (value: unknown, language: Language): string => {
  const kind = getValueKind(value);
  if (kind !== 'array' && kind !== 'object') {
    return typeMap[language][kind];
  }

  if (kind === 'array') {
    const first = (value as unknown[])[0];
    const inner = first !== undefined ? renderType(first, language) : typeMap[language].unknown;
    if (language === 'typescript') return `${inner}[]`;
    if (language === 'python') return `List[${inner}]`;
    if (language === 'go') return `[]${inner}`;
    return `List<${inner}>`;
  }

  // object
  const entries = Object.entries(value as Record<string, unknown>);
  const body = entries
    .map(([key, val]) => {
      const fieldType = renderType(val, language);
      if (language === 'typescript') return `  ${key}: ${fieldType};`;
      if (language === 'python') return `    ${key}: ${fieldType}`;
      if (language === 'go') return `  ${capitalize(key)} ${fieldType} `;
      return `  private ${fieldType} ${key};`;
    })
    .join('\n');

  if (language === 'typescript')
    return `{
${body}\n}`;
  if (language === 'python') return `class Root:\n${body || '    pass'}`;
  if (language === 'go') return `struct Root {\n${body}\n}`;
  return `class Root {\n${body}\n}`;
};

const generateTypes = (data: unknown, language: Language): string => {
  if (language === 'typescript') {
    return `interface Root ${renderType(data, language)}`;
  }
  if (language === 'python') {
    return `from typing import Any, List\n\n${renderType(data, language)}`;
  }
  if (language === 'go') {
    return `type Root ${renderType(data, language)}`;
  }
  return `${renderType(data, language)}`;
};

export const JsonToTypes = () => {
  const [jsonInput, setJsonInput] = useState(sampleJson);
  const [language, setLanguage] = useState<Language>('typescript');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const handleConvert = () => {
    try {
      setError('');
      const parsed = JSON.parse(jsonInput);
      const result = generateTypes(parsed, language);
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  };

  const headerLabel = useMemo(() => {
    switch (language) {
      case 'typescript':
        return 'TypeScript Interface';
      case 'python':
        return 'Python Class';
      case 'go':
        return 'Go Struct';
      case 'java':
        return 'Java Class';
      default:
        return 'Output';
    }
  }, [language]);

  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Braces className="h-5 w-5" /> JSON to Types
        </CardTitle>
        <CardDescription>Generate strongly-typed models from JSON payloads.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="json-input">JSON Input</Label>
            <Textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="min-h-[320px] font-mono"
              placeholder="Paste JSON here"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setJsonInput(sampleJson)} variant="ghost">
                Sample
              </Button>
              <Button size="sm" onClick={() => setJsonInput('')} variant="ghost">
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Target Language</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="java">Java</SelectItem>
              </SelectContent>
            </Select>

            <Tabs defaultValue="output">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="output" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Output
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <Copy className="h-4 w-4" /> Actions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="output" className="mt-2 space-y-2">
                <Label>{headerLabel}</Label>
                <Textarea
                  value={output}
                  readOnly
                  className="min-h-[280px] font-mono"
                  placeholder="Converted types"
                />
              </TabsContent>
              <TabsContent value="actions" className="mt-2 space-y-2">
                <Button onClick={handleConvert}>
                  <Sparkles className="mr-2 h-4 w-4" /> Convert
                </Button>
                <Button variant="outline" onClick={handleCopy} disabled={!output}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (output) {
                      const blob = new Blob([output], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `types.${language === 'typescript' ? 'ts' : 'txt'}`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                  disabled={!output}
                >
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </TabsContent>
            </Tabs>
            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JsonToTypes;

'use client';

import { ArrowsClockwise, Copy, DownloadSimple, Gear } from '@phosphor-icons/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export type CaseType =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'alternating'
  | 'inverse'
  | 'random';

export interface CaseConversionResult {
  original: string;
  converted: string;
  caseType: CaseType;
  stats: {
    wordCount: number;
    charCount: number;
    lineCount: number;
    changesCount: number;
  };
}

interface TextCaseConverterProps {
  className?: string;
}

const caseConversions: {
  type: CaseType;
  label: string;
  description: string;
  example: string;
}[] = [
  {
    type: 'upper',
    label: 'UPPERCASE',
    description: 'Convert all text to uppercase',
    example: 'HELLO WORLD',
  },
  {
    type: 'lower',
    label: 'lowercase',
    description: 'Convert all text to lowercase',
    example: 'hello world',
  },
  {
    type: 'title',
    label: 'Title Case',
    description: 'Capitalize the first letter of each word',
    example: 'Hello World',
  },
  {
    type: 'sentence',
    label: 'Sentence case',
    description: 'Capitalize the first letter of each sentence',
    example: 'Hello world. This is a test.',
  },
  {
    type: 'camel',
    label: 'camelCase',
    description: 'First word lowercase, subsequent words capitalized',
    example: 'helloWorld',
  },
  {
    type: 'pascal',
    label: 'PascalCase',
    description: 'All words capitalized, no spaces',
    example: 'HelloWorld',
  },
  {
    type: 'snake',
    label: 'snake_case',
    description: 'Lowercase words separated by underscores',
    example: 'hello_world',
  },
  {
    type: 'kebab',
    label: 'kebab-case',
    description: 'Lowercase words separated by hyphens',
    example: 'hello-world',
  },
  {
    type: 'constant',
    label: 'CONSTANT_CASE',
    description: 'Uppercase words separated by underscores',
    example: 'HELLO_WORLD',
  },
  {
    type: 'alternating',
    label: 'aLtErNaTiNg',
    description: 'Alternating uppercase and lowercase letters',
    example: 'HeLlO wOrLd',
  },
  {
    type: 'inverse',
    label: 'INVERSE',
    description: 'Invert the case of all letters',
    example: 'hELLO WORLD',
  },
  {
    type: 'random',
    label: 'RaNdOm',
    description: 'Random uppercase and lowercase letters',
    example: 'HeLlO WoRLd',
  },
];

export function TextCaseConverter({ className }: TextCaseConverterProps) {
  const [inputText, setInputText] = React.useState('');
  const [results, setResults] = React.useState<CaseConversionResult[]>([]);
  const [selectedResult, setSelectedResult] = React.useState<CaseConversionResult | null>(null);
  const [batchMode, setBatchMode] = React.useState(false);
  const [customSeparator, setCustomSeparator] = React.useState('');

  const convertCase = React.useCallback((text: string, caseType: CaseType): string => {
    if (!text.trim()) return text;

    switch (caseType) {
      case 'upper':
        return text.toUpperCase();

      case 'lower':
        return text.toLowerCase();

      case 'title':
        return text.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );

      case 'sentence':
        return text.replace(/(^\w|\.\s+\w)/g, (letter) => letter.toUpperCase());

      case 'camel':
        return text
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
          )
          .replace(/\s+/g, '')
          .replace(/[^a-zA-Z0-9]/g, '');

      case 'pascal':
        return text
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
          .replace(/\s+/g, '')
          .replace(/[^a-zA-Z0-9]/g, '');

      case 'snake':
        return text
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');

      case 'kebab':
        return text
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

      case 'constant':
        return text
          .toUpperCase()
          .replace(/\s+/g, '_')
          .replace(/[^A-Z0-9_]/g, '');

      case 'alternating':
        return text
          .split('')
          .map((char, index) => (index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
          .join('');

      case 'inverse':
        return text
          .split('')
          .map((char) => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()))
          .join('');

      case 'random':
        return text
          .split('')
          .map((char) => (Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()))
          .join('');

      default:
        return text;
    }
  }, []);

  const calculateStats = React.useCallback((original: string, converted: string) => {
    const words = original
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const changes = original
      .split('')
      .filter((char, index) => converted[index] && char !== converted[index]).length;

    return {
      wordCount: words.length,
      charCount: original.length,
      lineCount: original.split('\n').length,
      changesCount: changes,
    };
  }, []);

  const handleConvert = React.useCallback(
    (caseType: CaseType) => {
      if (!inputText.trim()) return;

      const converted = convertCase(inputText, caseType);
      const stats = calculateStats(inputText, converted);

      const result: CaseConversionResult = {
        original: inputText,
        converted,
        caseType,
        stats,
      };

      if (batchMode) {
        setResults((prev) => {
          const filtered = prev.filter((r) => r.caseType !== caseType);
          return [...filtered, result];
        });
      } else {
        setSelectedResult(result);
      }
    },
    [inputText, convertCase, calculateStats, batchMode]
  );

  const handleBatchConvert = React.useCallback(() => {
    if (!inputText.trim()) return;

    const newResults: CaseConversionResult[] = [];

    // Convert to all common programming case types
    const commonCases: CaseType[] = ['camel', 'pascal', 'snake', 'kebab', 'constant'];

    commonCases.forEach((caseType) => {
      const converted = convertCase(inputText, caseType);
      const stats = calculateStats(inputText, converted);

      newResults.push({
        original: inputText,
        converted,
        caseType,
        stats,
      });
    });

    setResults(newResults);
    setBatchMode(true);
  }, [inputText, convertCase, calculateStats]);

  const handleCustomSeparator = React.useCallback(() => {
    if (!inputText.trim() || !customSeparator) return;

    const converted = inputText
      .toLowerCase()
      .replace(/\s+/g, customSeparator)
      .replace(/[^a-z0-9]/g, customSeparator)
      .replace(new RegExp(`${customSeparator}+`, 'g'), customSeparator)
      .replace(new RegExp(`^${customSeparator}|${customSeparator}$`, 'g'), '');

    const stats = calculateStats(inputText, converted);

    const result: CaseConversionResult = {
      original: inputText,
      converted,
      caseType: 'snake', // Using snake as base type
      stats,
    };

    setSelectedResult(result);
  }, [inputText, customSeparator, calculateStats]);

  const copyToClipboard = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (_error) {
        toast.error('Failed to copy text');
      }
      document.body.removeChild(textArea);
    }
  }, []);

  const downloadText = React.useCallback((text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const swapInputOutput = React.useCallback(() => {
    if (selectedResult) {
      setInputText(selectedResult.converted);
      setSelectedResult(null);
    }
  }, [selectedResult]);

  React.useEffect(() => {
    // Auto-convert on input change for non-batch mode
    if (!batchMode && inputText.trim() && selectedResult) {
      handleConvert(selectedResult.caseType);
    }
  }, [inputText, batchMode, selectedResult?.caseType, handleConvert]);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gear className="h-5 w-5" />
              Text Case Converter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-text">Input Text</Label>
              <Textarea
                id="input-text"
                placeholder="Enter text to convert case..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[300px]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setBatchMode(!batchMode)}
                variant={batchMode ? 'default' : 'outline'}
              >
                {batchMode ? 'Single Mode' : 'Batch Mode'}
              </Button>
              {batchMode && (
                <Button onClick={handleBatchConvert} variant="outline">
                  Convert All Cases
                </Button>
              )}
              {selectedResult && (
                <Button onClick={swapInputOutput} variant="outline">
                  <ArrowsClockwise className="mr-2 h-4 w-4" />
                  Swap Input/Output
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Case Conversion Options */}
        <Card>
          <CardHeader>
            <CardTitle>Case Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="common" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="common">Common</TabsTrigger>
                <TabsTrigger value="programming">Programming</TabsTrigger>
                <TabsTrigger value="fun">Fun & Other</TabsTrigger>
              </TabsList>

              <TabsContent value="common" className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {['upper', 'lower', 'title', 'sentence'].map((caseType) => {
                    const conversion = caseConversions.find((c) => c.type === caseType);
                    return (
                      <Button
                        key={caseType}
                        onClick={() => handleConvert(caseType as CaseType)}
                        variant="outline"
                        className="h-auto justify-start p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{conversion?.label}</div>
                          <div className="text-muted-foreground text-xs">{conversion?.example}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="programming" className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {['camel', 'pascal', 'snake', 'kebab', 'constant'].map((caseType) => {
                    const conversion = caseConversions.find((c) => c.type === caseType);
                    return (
                      <Button
                        key={caseType}
                        onClick={() => handleConvert(caseType as CaseType)}
                        variant="outline"
                        className="h-auto justify-start p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{conversion?.label}</div>
                          <div className="text-muted-foreground text-xs">{conversion?.example}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="fun" className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {['alternating', 'inverse', 'random'].map((caseType) => {
                    const conversion = caseConversions.find((c) => c.type === caseType);
                    return (
                      <Button
                        key={caseType}
                        onClick={() => handleConvert(caseType as CaseType)}
                        variant="outline"
                        className="h-auto justify-start p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{conversion?.label}</div>
                          <div className="text-muted-foreground text-xs">{conversion?.example}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>

                {/* Custom Separator */}
                <div className="border-t pt-4">
                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="custom-separator">Custom Separator</Label>
                      <Input
                        id="custom-separator"
                        placeholder="_, -, *, etc."
                        value={customSeparator}
                        onChange={(e) => setCustomSeparator(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleCustomSeparator} disabled={!customSeparator}>
                        Convert with Custom Separator
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Results */}
        {batchMode && results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.caseType} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{result.caseType}</h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(result.converted)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadText(result.converted, `${result.caseType}.txt`)}
                        >
                          <DownloadSimple className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="rounded bg-muted p-2 font-mono text-sm">
                      {result.converted || '(empty)'}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {result.stats.changesCount} changes • {result.stats.wordCount} words
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!batchMode && selectedResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Conversion Result</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(selectedResult.converted)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadText(selectedResult.converted, `${selectedResult.caseType}.txt`)
                    }
                  >
                    <DownloadSimple className="mr-2 h-4 w-4" />
                    DownloadSimple
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 text-sm md:grid-cols-4">
                <div>
                  <span className="font-medium">Case Type:</span>{' '}
                  <span className="capitalize">{selectedResult.caseType}</span>
                </div>
                <div>
                  <span className="font-medium">Words:</span> {selectedResult.stats.wordCount}
                </div>
                <div>
                  <span className="font-medium">Characters:</span> {selectedResult.stats.charCount}
                </div>
                <div>
                  <span className="font-medium">Lines:</span> {selectedResult.stats.lineCount}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Converted Text</Label>
                <Textarea
                  value={selectedResult.converted}
                  readOnly
                  className="min-h-[300px] font-mono"
                />
              </div>

              <div className="text-muted-foreground text-sm">
                {selectedResult.stats.changesCount} characters changed from original
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

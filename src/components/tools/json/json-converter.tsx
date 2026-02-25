'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ArrowRight, Copy, DownloadSimple, Play } from '@phosphor-icons/react';
import * as React from 'react';
import { toast } from 'sonner';
import type { JsonConversionOptions, JsonConverterProps } from './json-types';
import { convertJson, copyToClipboard, downloadFile } from './json-utils';

export function JsonConverter({
  input,
  options,
  onConvert,
  onError,
  className,
}: JsonConverterProps) {
  const [conversionOptions, setConversionOptions] = React.useState<JsonConversionOptions>(options);
  const [isConverting, setIsConverting] = React.useState(false);
  const [_showSettings, _setShowSettings] = React.useState(false);
  const [convertedOutput, setConvertedOutput] = React.useState('');
  const [showCopyNotification, setShowCopyNotification] = React.useState(false);

  const handleConvert = React.useCallback(async () => {
    if (!input.trim()) {
      onError('No input to convert');
      return;
    }

    setIsConverting(true);

    try {
      const converted = convertJson(input, conversionOptions.targetFormat, {
        rootElement: conversionOptions.rootElement,
        arrayItemName: conversionOptions.arrayItemName,
        flatten: conversionOptions.flatten,
        delimiter: conversionOptions.csvDelimiter,
      });

      setConvertedOutput(converted);
      onConvert(converted);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
      onError(errorMessage);
      setConvertedOutput('');
    } finally {
      setIsConverting(false);
    }
  }, [input, conversionOptions, onConvert, onError]);

  const handleCopy = async () => {
    if (!convertedOutput) return;

    try {
      await copyToClipboard(convertedOutput);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    if (!convertedOutput) return;

    const extensions = {
      xml: 'xml',
      yaml: 'yml',
      csv: 'csv',
    };

    const mimeTypes = {
      xml: 'application/xml',
      yaml: 'text/yaml',
      csv: 'text/csv',
    };

    const filename = `converted-json-${new Date().toISOString().slice(0, 10)}.${extensions[conversionOptions.targetFormat]}`;
    downloadFile(convertedOutput, filename, mimeTypes[conversionOptions.targetFormat]);
  };

  const handleOptionChange = (
    key: keyof JsonConversionOptions,
    value: string | boolean | undefined
  ) => {
    const newOptions = { ...conversionOptions, [key]: value };
    setConversionOptions(newOptions);
  };

  // Auto-convert when input changes if we have valid converted output
  React.useEffect(() => {
    if (input.trim() && convertedOutput) {
      handleConvert();
    }
  }, [input, convertedOutput, handleConvert]);

  const getTargetFormatInfo = () => {
    switch (conversionOptions.targetFormat) {
      case 'xml':
        return {
          name: 'XML',
          description: 'eXtensible Markup Language',
          icon: '📄',
        };
      case 'yaml':
        return {
          name: 'YAML',
          description: "YAML Ain't Markup Language",
          icon: '📝',
        };
      case 'csv':
        return {
          name: 'CSV',
          description: 'Comma-Separated Values',
          icon: '📊',
        };
      default:
        return {
          name: 'Unknown',
          description: 'Unknown format',
          icon: '❓',
        };
    }
  };

  const formatInfo = getTargetFormatInfo();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Format Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowRight className="h-5 w-5" />
            Convert to {formatInfo.name}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{formatInfo.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Format Selection Tabs */}
          <Tabs
            value={conversionOptions.targetFormat}
            onValueChange={(value) => handleOptionChange('targetFormat', value)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="xml" className="flex items-center gap-2">
                <span>📄</span>
                XML
              </TabsTrigger>
              <TabsTrigger value="yaml" className="flex items-center gap-2">
                <span>📝</span>
                YAML
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <span>📊</span>
                CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="xml" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    Root Element Name
                  </label>
                  <input
                    type="text"
                    value={conversionOptions.rootElement || 'root'}
                    onChange={(e) => handleOptionChange('rootElement', e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="root"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    Array Item Name
                  </label>
                  <input
                    type="text"
                    value={conversionOptions.arrayItemName || 'item'}
                    onChange={(e) => handleOptionChange('arrayItemName', e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="item"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="yaml" className="space-y-4">
              <p className="text-muted-foreground text-sm">
                YAML conversion uses standard YAML formatting with proper indentation.
              </p>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    CSV Delimiter
                  </label>
                  <select
                    value={conversionOptions.csvDelimiter || ','}
                    onChange={(e) => handleOptionChange('csvDelimiter', e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="\t">Tab</option>
                    <option value="|">Pipe (|)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    Flatten Objects
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="flatten-objects"
                      checked={conversionOptions.flatten || false}
                      onChange={(e) => handleOptionChange('flatten', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="flatten-objects" className="text-muted-foreground text-sm">
                      Flatten nested objects
                    </label>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> CSV conversion requires an array of objects. Each object's
                  keys will become the CSV headers.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Convert Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleConvert}
          disabled={isConverting || !input.trim()}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {isConverting ? 'Converting...' : `Convert to ${formatInfo.name}`}
        </Button>

        {convertedOutput && (
          <>
            <Button variant="outline" onClick={handleCopy} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy
            </Button>

            <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
              <DownloadSimple className="h-4 w-4" />
              DownloadSimple
            </Button>
          </>
        )}
      </div>

      {/* Converted Output */}
      {convertedOutput && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {formatInfo.icon} Converted {formatInfo.name} Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-foreground text-sm">
              {convertedOutput}
            </pre>
            <div className="mt-2 text-muted-foreground text-sm">
              {convertedOutput.split('\n').length} lines, {convertedOutput.length} characters
            </div>
          </CardContent>
        </Card>
      )}

      {/* Copy Notification */}
      {showCopyNotification && (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white shadow-lg">
          <span className="text-sm">Copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}

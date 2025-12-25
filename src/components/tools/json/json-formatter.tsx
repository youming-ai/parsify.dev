'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Copy, DownloadSimple, Faders, Play } from '@phosphor-icons/react';
import * as React from 'react';
import type { JsonFormatOptions, JsonFormatterProps } from './json-types';
import { copyToClipboard, downloadFile, formatJson } from './json-utils';

export function JsonFormatter({
  input,
  options = defaultFormatOptions,
  onFormat,
  onError,
  className,
}: JsonFormatterProps) {
  const [formatOptions, setFormatOptions] = React.useState<JsonFormatOptions>(options);
  const [isFormatting, setIsFormatting] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [formattedOutput, setFormattedOutput] = React.useState('');
  const [showCopyNotification, setShowCopyNotification] = React.useState(false);

  const handleFormat = React.useCallback(async () => {
    if (!input.trim()) {
      onError('No input to format');
      return;
    }

    setIsFormatting(true);

    try {
      const formatted = formatJson(input, formatOptions);
      setFormattedOutput(formatted);
      onFormat(formatted);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown formatting error';
      onError(errorMessage);
      setFormattedOutput('');
    } finally {
      setIsFormatting(false);
    }
  }, [input, formatOptions, onFormat, onError]);

  const handleCopy = async () => {
    if (!formattedOutput) return;

    try {
      await copyToClipboard(formattedOutput);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    if (!formattedOutput) return;

    const filename = `formatted-json-${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(formattedOutput, filename, 'application/json');
  };

  const handleOptionChange = (key: keyof JsonFormatOptions, value: boolean | number) => {
    const newOptions = { ...formatOptions, [key]: value };
    setFormatOptions(newOptions);

    // Auto-format if we have input
    if (input.trim()) {
      try {
        const formatted = formatJson(input, newOptions);
        setFormattedOutput(formatted);
        onFormat(formatted);
      } catch (_error) {
        // Don't show error for auto-format attempts
      }
    }
  };

  // Auto-format when input changes if we have valid formatted output
  React.useEffect(() => {
    if (input.trim() && formattedOutput) {
      handleFormat();
    }
  }, [input, formattedOutput, handleFormat]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Settings Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Faders className="h-5 w-5" />
              Format Options
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? 'Hide' : 'Show'} Settings
            </Button>
          </div>
        </CardHeader>

        {showSettings && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Indent Size */}
              <div className="space-y-2">
                <label className="font-medium text-gray-700 text-sm">
                  Indent Size: {formatOptions.indent}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={formatOptions.indent}
                    onChange={(e) =>
                      handleOptionChange('indent', Number.parseInt(e.target.value, 10))
                    }
                    className="flex-1"
                  />
                  <span className="w-8 text-muted-foreground text-sm">{formatOptions.indent}</span>
                </div>
              </div>

              {/* Sort Keys */}
              <div className="space-y-2">
                <label className="font-medium text-gray-700 text-sm">Sort Keys</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sort-keys"
                    checked={formatOptions.sortKeys}
                    onChange={(e) => handleOptionChange('sortKeys', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="sort-keys" className="text-muted-foreground text-sm">
                    Alphabetically sort object keys
                  </label>
                </div>
              </div>

              {/* Compact Mode */}
              <div className="space-y-2">
                <label className="font-medium text-gray-700 text-sm">Compact Mode</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="compact"
                    checked={formatOptions.compact}
                    onChange={(e) => handleOptionChange('compact', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="compact" className="text-muted-foreground text-sm">
                    Remove all whitespace
                  </label>
                </div>
              </div>

              {/* Trailing Commas */}
              <div className="space-y-2">
                <label className="font-medium text-gray-700 text-sm">Trailing Commas</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trailing-commas"
                    checked={formatOptions.trailingComma}
                    onChange={(e) => handleOptionChange('trailingComma', e.target.checked)}
                    disabled={formatOptions.compact}
                    className="mr-2"
                  />
                  <label htmlFor="trailing-commas" className="text-muted-foreground text-sm">
                    Add trailing commas
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Format Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleFormat}
          disabled={isFormatting || !input.trim()}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {isFormatting ? 'Formatting...' : 'Format JSON'}
        </Button>

        {formattedOutput && (
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

      {/* Formatted Output */}
      {formattedOutput && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formatted Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-4 font-mono text-foreground text-sm">
              {formattedOutput}
            </pre>
            <div className="mt-2 text-muted-foreground text-sm">
              {formattedOutput.split('\n').length} lines, {formattedOutput.length} characters
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

const defaultFormatOptions: JsonFormatOptions = {
  indent: 2,
  sortKeys: false,
  compact: false,
  trailingComma: false,
};

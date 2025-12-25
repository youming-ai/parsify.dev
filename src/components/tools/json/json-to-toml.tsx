'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BracketsCurly, Copy, DownloadSimple, Sparkle, Trash } from '@phosphor-icons/react';
import { useCallback, useState } from 'react';
import { stringify } from 'smol-toml';

const sampleJson = `{
  "title": "TOML Example",
  "owner": {
    "name": "Tom Preston-Werner",
    "dob": "1979-05-27T07:32:00Z"
  },
  "database": {
    "enabled": true,
    "ports": [ 8000, 8001, 8002 ],
    "data": [ ["delta", "phi"], [3.14] ],
    "temp_targets": { "cpu": 79.5, "case": 72.0 }
  },
  "servers": {
    "alpha": {
      "ip": "10.0.0.1",
      "role": "frontend"
    },
    "beta": {
      "ip": "10.0.0.2",
      "role": "backend"
    }
  }
}`;

export function JsonToToml() {
  const [jsonInput, setJsonInput] = useState(sampleJson);
  const [tomlOutput, setTomlOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = useCallback(() => {
    try {
      setError('');
      if (!jsonInput.trim()) {
        setTomlOutput('');
        return;
      }
      const parsed = JSON.parse(jsonInput);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(
          'TOML requires a top-level object/table. Arrays or primitive values at the root are not supported by the standard TOML format.'
        );
      }
      const result = stringify(parsed);
      setTomlOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON or conversion error');
      setTomlOutput('');
    }
  }, [jsonInput]);

  const handleCopy = async () => {
    if (!tomlOutput) return;
    await navigator.clipboard.writeText(tomlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setJsonInput('');
    setTomlOutput('');
    setError('');
  };

  const handleDownload = () => {
    if (!tomlOutput) return;
    const blob = new Blob([tomlOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'config.toml';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BracketsCurly className="h-5 w-5" /> JSON to TOML
        </CardTitle>
        <CardDescription>
          Convert JSON data to Tom's Obvious, Minimal Language (TOML) format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="json-input" className="text-base font-semibold">
                JSON Input
              </Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setJsonInput(sampleJson)}>
                  Sample
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={handleClear}
                >
                  <Trash className="mr-2 h-4 w-4" /> Clear
                </Button>
              </div>
            </div>
            <Textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="min-h-[400px] font-mono text-sm resize-none"
              placeholder="Paste your JSON here..."
            />
            <Button className="w-full" onClick={handleConvert} size="lg">
              <Sparkle className="mr-2 h-5 w-5" /> Convert to TOML
            </Button>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">TOML Output</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} disabled={!tomlOutput}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload} disabled={!tomlOutput}>
                  <DownloadSimple className="mr-2 h-4 w-4" /> Download
                </Button>
              </div>
            </div>
            <div className="relative">
              <Textarea
                value={tomlOutput}
                readOnly
                className="min-h-[400px] font-mono text-sm bg-muted/30 resize-none"
                placeholder="TOML output will appear here..."
              />
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-md">
                  <div className="max-w-[80%] rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default JsonToToml;

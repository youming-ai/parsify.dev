'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { BracketsCurly, CheckCircle, Scan, Sparkle, XCircle } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

type HtmlAction = 'format' | 'minify' | 'validate' | 'encode' | 'decode';

const sampleHtml = `<div class="card">
  <h2>Title</h2>
  <p>Example content with <strong>bold</strong> text.</p>
</div>`;

const formatHtml = (input: string) => {
  const breakLines = input.replace(/>(\s*)</g, '>$1\n<');
  const lines = breakLines.split(/\n/).filter((line) => line.trim().length > 0);
  let indent = 0;
  const formatted = lines
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.match(/^<\//)) {
        indent = Math.max(indent - 1, 0);
      }
      const prefix = '  '.repeat(indent);
      if (
        trimmed.match(/^<(?!.*\/>).*[^-]$/) &&
        !trimmed.startsWith('</') &&
        !trimmed.endsWith('/>')
      ) {
        indent += 1;
      }
      return `${prefix}${trimmed}`;
    })
    .join('\n');
  return formatted;
};

const minifyHtml = (input: string) => {
  return input
    .replace(/<!--.*?-->/gs, '')
    .replace(/\n+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const encodeEntities = (input: string) => {
  const el = document.createElement('textarea');
  el.textContent = input;
  return el.innerHTML;
};

const decodeEntities = (input: string) => {
  const el = document.createElement('textarea');
  el.innerHTML = input;
  return el.value;
};

export const HtmlTools = () => {
  const [action, setAction] = useState<HtmlAction>('format');
  const [input, setInput] = useState(sampleHtml);
  const [output, setOutput] = useState('');
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  const handleRun = () => {
    const value = input.trim();
    if (!value) {
      setOutput('');
      return;
    }
    if (action === 'format') {
      setOutput(formatHtml(value));
      setValidationMessages([]);
    } else if (action === 'minify') {
      setOutput(minifyHtml(value));
      setValidationMessages([]);
    } else if (action === 'encode') {
      setOutput(encodeEntities(value));
      setValidationMessages([]);
    } else if (action === 'decode') {
      setOutput(decodeEntities(value));
      setValidationMessages([]);
    } else if (action === 'validate') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, 'text/html');
      const errors: string[] = [];
      // DOMParser silently fixes many errors; surface basic issues
      if (!doc.doctype) {
        errors.push('Missing doctype declaration');
      }
      if (!doc.querySelector('html')) {
        errors.push('Missing <html> root element');
      }
      if (!doc.querySelector('head')) {
        errors.push('Missing <head> element');
      }
      if (!doc.querySelector('body')) {
        errors.push('Missing <body> element');
      }
      setValidationMessages(errors);
      setOutput(errors.length === 0 ? 'HTML looks valid.' : '');
    }
  };

  const validationState = useMemo(() => {
    if (action !== 'validate') return null;
    if (validationMessages.length === 0 && output) return 'pass';
    if (validationMessages.length > 0) return 'fail';
    return null;
  }, [action, output, validationMessages]);

  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BracketsCurly className="h-5 w-5" /> HTML Tools
        </CardTitle>
        <CardDescription>Format, minify, validate, and encode HTML in one place.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={action} onValueChange={(v) => setAction(v as HtmlAction)}>
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="minify">Minify</TabsTrigger>
            <TabsTrigger value="validate">Validate</TabsTrigger>
            <TabsTrigger value="encode">Encode Entities</TabsTrigger>
            <TabsTrigger value="decode">Decode Entities</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="html-input">Input HTML</Label>
            <Textarea
              id="html-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[320px] font-mono"
              placeholder="Paste HTML to process"
            />
            <div className="flex gap-2">
              <Button variant="default" size="sm" onClick={handleRun}>
                <Sparkle className="mr-2 h-4 w-4" /> Run
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput(sampleHtml)}>
                Sample
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput('')}>
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="html-output">Result</Label>
            <Textarea
              id="html-output"
              value={output}
              readOnly
              className="min-h-[320px] font-mono"
              placeholder="Output will appear here"
            />
            {validationState && (
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                {validationState === 'pass' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>
                  {validationState === 'pass'
                    ? 'HTML structure looks good.'
                    : 'Validation found issues.'}
                </span>
              </div>
            )}
            {validationMessages.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Scan className="h-4 w-4" /> Details
                </div>
                <ul className="list-disc space-y-1 pl-4 text-red-500">
                  {validationMessages.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <Separator />
        <div className="text-muted-foreground text-sm">
          Quick HTML utilities for formatting, compression, entity encoding, and light validation.
          Results are processed in-browser for privacy.
        </div>
      </CardContent>
    </Card>
  );
};

export default HtmlTools;

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowsClockwise, Code, Eye } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

const sampleHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Sample Preview</title>
    <style>
      body { font-family: system-ui; padding: 20px; }
      .cta { background: #2563eb; color: white; padding: 12px 16px; border-radius: 8px; }
    </style>
  </head>
  <body>
    <h1>Hello Parsify</h1>
    <p>Live HTML preview with inline styles and scripts.</p>
    <button class="cta" onclick="alert('Clicked!')">Click me</button>
  </body>
</html>`;

export const HtmlViewer = () => {
  const [html, setHtml] = useState(sampleHtml);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const iframeContent = useMemo(() => {
    return `<!doctype html><html><head><style>body { font-family: system-ui; margin: 0; padding: 24px; background: ${theme === 'dark' ? '#0f172a' : '#f8fafc'}; color: ${theme === 'dark' ? '#e2e8f0' : '#0f172a'}; }</style></head><body>${html}</body></html>`;
  }, [html, theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Eye className="h-5 w-5" /> HTML Viewer
        </CardTitle>
        <CardDescription>Live preview HTML snippets with sandboxed rendering.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('light')}
          >
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('dark')}
          >
            Dark
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setHtml(sampleHtml)}>
            <ArrowsClockwise className="mr-2 h-4 w-4" /> Sample
          </Button>
        </div>

        <Tabs defaultValue="edit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Code className="h-4 w-4" /> Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-3">
            <Label htmlFor="html-input" className="mb-2 block">
              HTML
            </Label>
            <Textarea
              id="html-input"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="min-h-[650px] font-mono"
              placeholder="Paste HTML to render"
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-3">
            <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-card">
              <iframe
                title="HTML Preview"
                className="h-[650px] w-full rounded-lg"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={iframeContent}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HtmlViewer;

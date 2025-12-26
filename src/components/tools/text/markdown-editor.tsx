'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowsClockwise,
  CheckCircle,
  Code,
  Copy,
  Download,
  Eye,
  FileText,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';

const defaultMarkdown = `# Welcome to Markdown Editor

This is a **live preview** Markdown editor. Start typing to see the rendered output!

## Features

- **Bold** and *italic* text
- [Links](https://parsify.dev)
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Tables and more!

### Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('Developer');
\`\`\`

### Table Example

| Feature | Status |
|---------|--------|
| Bold | ✅ |
| Italic | ✅ |
| Links | ✅ |
| Code | ✅ |

> This is a blockquote. It can span multiple lines and is great for highlighting important information.

---

**Enjoy writing in Markdown!** 🚀
`;

const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [html, setHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  // Simple Markdown to HTML converter
  const parseMarkdown = useCallback((text: string): string => {
    let result = text;

    // Escape HTML
    result = result.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks (must be before inline code)
    result = result.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">$2</code></pre>'
    );

    // Inline code
    result = result.replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    );

    // Headers
    result = result.replace(
      /^###### (.*$)/gim,
      '<h6 class="text-sm font-semibold mt-4 mb-2">$1</h6>'
    );
    result = result.replace(
      /^##### (.*$)/gim,
      '<h5 class="text-base font-semibold mt-4 mb-2">$1</h5>'
    );
    result = result.replace(
      /^#### (.*$)/gim,
      '<h4 class="text-lg font-semibold mt-4 mb-2">$1</h4>'
    );
    result = result.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
    result = result.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
    result = result.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>');

    // Horizontal rule
    result = result.replace(/^---$/gim, '<hr class="my-6 border-border" />');

    // Blockquote
    result = result.replace(
      /^> (.*$)/gim,
      '<blockquote class="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground">$1</blockquote>'
    );

    // Bold and italic
    result = result.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    result = result.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
    result = result.replace(/__(.*?)__/g, '<strong>$1</strong>');
    result = result.replace(/_(.*?)_/g, '<em>$1</em>');

    // Strikethrough
    result = result.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Links
    result = result.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Images
    result = result.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />'
    );

    // Tables
    result = result.replace(/^\|(.+)\|$/gim, (match) => {
      const cells = match
        .split('|')
        .filter((cell) => cell.trim())
        .map((cell) => cell.trim());

      if (cells.every((cell) => /^[-:]+$/.test(cell))) {
        return ''; // Skip separator row
      }

      const tag = 'td';
      return `<tr>${cells.map((cell) => `<${tag} class="border border-border px-4 py-2">${cell}</${tag}>`).join('')}</tr>`;
    });

    // Wrap table rows in table
    result = result.replace(
      /(<tr>[\s\S]*?<\/tr>\n?)+/g,
      '<table class="w-full border-collapse my-4">$&</table>'
    );

    // Unordered lists
    result = result.replace(/^[\*\-] (.*$)/gim, '<li class="ml-6 list-disc">$1</li>');

    // Ordered lists
    result = result.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal">$1</li>');

    // Wrap list items
    result = result.replace(
      /(<li class="ml-6 list-disc">[\s\S]*?<\/li>\n?)+/g,
      '<ul class="my-4">$&</ul>'
    );
    result = result.replace(
      /(<li class="ml-6 list-decimal">[\s\S]*?<\/li>\n?)+/g,
      '<ol class="my-4">$&</ol>'
    );

    // Paragraphs (empty lines)
    result = result
      .split(/\n\n+/)
      .map((para) => {
        if (para.startsWith('<') || para.trim() === '') {
          return para;
        }
        return `<p class="my-4 leading-relaxed">${para.replace(/\n/g, '<br />')}</p>`;
      })
      .join('\n');

    return result;
  }, []);

  useEffect(() => {
    setHtml(parseMarkdown(markdown));
  }, [markdown, parseMarkdown]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;
  const lineCount = markdown.split('\n').length;

  return (
    <div className="space-y-6">
      <Card className="rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Markdown Editor
              </CardTitle>
              <CardDescription>Write and preview Markdown with live rendering</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{wordCount} words</Badge>
              <Badge variant="outline">{charCount} chars</Badge>
              <Badge variant="outline">{lineCount} lines</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('edit')}
              >
                <PencilSimple className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant={viewMode === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('split')}
              >
                <Code className="mr-1 h-4 w-4" />
                Split
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
              >
                <Eye className="mr-1 h-4 w-4" />
                Preview
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMarkdown(defaultMarkdown)}>
                <ArrowsClockwise className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMarkdown('')}>
                <Trash className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(markdown)}>
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(markdown, 'document.md', 'text/markdown')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Editor/Preview */}
          <div className={`grid gap-4 ${viewMode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Markdown</label>
                <Textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className="min-h-[500px] resize-none font-mono text-sm"
                  placeholder="Type your Markdown here..."
                />
              </div>
            )}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview</label>
                <div
                  className="min-h-[500px] overflow-auto rounded-md border bg-card p-4"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            )}
          </div>

          {/* Export Options */}
          <Tabs defaultValue="markdown" className="w-full">
            <TabsList>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>
            <TabsContent value="markdown" className="space-y-2">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(markdown)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Markdown
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="html" className="space-y-2">
              <Textarea readOnly value={html} className="h-32 font-mono text-xs" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(html)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy HTML
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(html, 'document.html', 'text/html')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download HTML
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkdownEditor;

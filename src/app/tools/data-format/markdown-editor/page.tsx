'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Bold,
  Check,
  ClipboardCopy,
  Code,
  Download,
  Eye,
  EyeOff,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Table,
  Trash2,
} from 'lucide-react';
import { useCallback, useState } from 'react';

const SAMPLE_MARKDOWN = `# Welcome to Markdown Editor

## Features

This editor supports **GitHub Flavored Markdown** with:

- **Bold** and *italic* text
- ~~Strikethrough~~ text
- [Links](https://example.com)
- Inline \`code\` and code blocks

### Code Blocks

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### Tables

| Feature | Support |
|---------|---------|
| Tables | ✅ |
| Task Lists | ✅ |
| Syntax Highlighting | ✅ |

### Task Lists

- [x] Create markdown editor
- [x] Add live preview
- [ ] Export to PDF

> **Note:** All processing happens locally in your browser.
`;

export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [markdown]);

  const handleClear = useCallback(() => {
    setMarkdown('');
  }, []);

  const handleSample = useCallback(() => {
    setMarkdown(SAMPLE_MARKDOWN);
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setMarkdown(text);
  }, []);

  const insertMarkdown = useCallback(
    (before: string, after = '') => {
      const textarea = document.querySelector('textarea');
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = markdown.substring(start, end);

      const newText =
        markdown.substring(0, start) + before + selected + after + markdown.substring(end);

      setMarkdown(newText);

      // Set cursor position after insertion
      setTimeout(() => {
        textarea.focus();
        const newPos = start + before.length + selected.length + after.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [markdown]
  );

  const handleExportHTML = useCallback(() => {
    const html = convertToHTML(markdown);
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f4; }
    blockquote { border-left: 4px solid #ddd; margin: 16px 0; padding-left: 16px; color: #666; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markdown-export.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown]);

  // Simple markdown to HTML converter
  const convertToHTML = (md: string): string => {
    let html = md
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and Italic
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/~~(.*?)~~/gim, '<del>$1</del>')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />')
      // Blockquotes
      .replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>')
      // Horizontal rules
      .replace(/^---$/gim, '<hr />')
      // Task lists
      .replace(/^- \[x\] (.*$)/gim, '<li><input type="checkbox" checked disabled /> $1</li>')
      .replace(/^- \[ \] (.*$)/gim, '<li><input type="checkbox" disabled /> $1</li>')
      // Unordered lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n/gim, '</p><p>')
      // Line breaks
      .replace(/\n/gim, '<br />');

    // Wrap in paragraph tags
    html = `<p>${html}</p>`;

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');

    return html;
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: Strikethrough, action: () => insertMarkdown('~~', '~~'), title: 'Strikethrough' },
    { icon: Heading1, action: () => insertMarkdown('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### '), title: 'Heading 3' },
    { icon: List, action: () => insertMarkdown('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. '), title: 'Numbered List' },
    { icon: Quote, action: () => insertMarkdown('> '), title: 'Quote' },
    { icon: Code, action: () => insertMarkdown('`', '`'), title: 'Inline Code' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    {
      icon: Table,
      action: () => insertMarkdown('\n| Header | Header |\n|--------|--------|\n| Cell | Cell |\n'),
      title: 'Table',
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Markdown Editor</CardTitle>
                <CardDescription>
                  Edit and preview Markdown with GitHub Flavored Markdown support
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">GFM</Badge>
              <Badge variant="outline">Offline</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-slate-50 p-2 dark:bg-slate-800">
            {toolbarButtons.map((btn, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                onClick={btn.action}
                title={btn.title}
                className="h-8 w-8 p-0"
              >
                <btn.icon className="h-4 w-4" />
              </Button>
            ))}
            <div className="mx-2 h-6 w-px bg-slate-300 dark:bg-slate-600" />
            <Button variant="ghost" size="sm" onClick={handlePaste} title="Paste">
              <ClipboardCopy className="mr-1 h-4 w-4" />
              Paste
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSample} title="Sample">
              <FileText className="mr-1 h-4 w-4" />
              Sample
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy">
              {copied ? (
                <Check className="mr-1 h-4 w-4" />
              ) : (
                <ClipboardCopy className="mr-1 h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} title="Clear">
              <Trash2 className="mr-1 h-4 w-4" />
              Clear
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportHTML}>
              <Download className="mr-1 h-4 w-4" />
              Export HTML
            </Button>
          </div>

          {/* Editor and Preview */}
          <div className={`grid gap-4 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Editor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Markdown
              </label>
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Enter your Markdown here..."
                className="min-h-[500px] font-mono text-sm"
              />
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Preview
                </label>
                <div
                  className="prose prose-slate dark:prose-invert min-h-[500px] max-w-none overflow-auto rounded-lg border bg-white p-4 dark:bg-slate-900"
                  dangerouslySetInnerHTML={{ __html: convertToHTML(markdown) }}
                />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>{markdown.length} characters</span>
            <span>{markdown.split(/\s+/).filter(Boolean).length} words</span>
            <span>{markdown.split('\n').length} lines</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

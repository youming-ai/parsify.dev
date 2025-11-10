/**
 * Meta Tag Generator Component
 * Generate HTML meta tags for SEO and social media sharing
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@//components/ui/badge';
import {
  Mail,
  Share2,
  Smartphone,
  Link as LinkIcon,
  MapPin,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface MetaTag {
  name: string;
  content: string;
  description: string;
  keywords: string[];
  author?: string;
  authorUrl?: string;
  image?: string;
  url?: string;
  type: string;
  charset?: string;
  language?: string;
  openGraph?: boolean;
  robots?: string;
      refresh?: string;
      revisit-after?: string;
      canonical?: string;
      'og:title': string;
      'og:description': string;
      'og:image': string;
      'og:site_name': string;
      'og:url': string;
      'og:type': string;
      'og:locale': string;
      'og:site_name': string;
      'article:section': string;
      'article:tag': string;
    };
}

interface MetaTagPreview {
  tag: string;
  content: string;
    type: string;
    description: string;
    preview: string;
  }

interface MetaTagOptions {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  authorUrl?: string;
  metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogUrl?: string;
    ogType?: string;
    ogLocale: string;
    ogLocale: string;
    robots: string;
      refresh?: string;
      revisit-after?: string;
      canonical?: string;
    }
}

export function MetaTagGenerator({ className }: { className?: string }) {
  const [tagType, setTagType] = useState<'title' | 'description' | 'keywords'>('title')>('title'));
  const [tagPreview, setTagPreview] = useState<MetaTagPreview | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<'preview' | 'preview'>);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [author, setAuthor] = useState('');
  const [authorUrl, setAuthorUrl] = useState('');

  const [metaOptions, setMetaOptions] = useState<MetaTagOptions>({
    title,
    description,
    keywords,
    author,
    authorUrl,
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    ogType,
    ogLocale: 'en',
    robots: 'index,follow',
    refresh: '604800'
  });

  // Initialize session
  useEffect(() => {
    const session = createSession('meta-generator', {
      tagType,
      content,
      options: metaOptions
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Generate meta tags
  const generateMetaTags = useCallback(async () => {
    if (!title || !description) {
        toast.error('Title and description are required');
        return null;
    }

    try {
      const metaTags: string[] = [];

      // Create standard meta tags
      const tags = keywords.join(', ');

      metaTags.push({
        name: title,
        content: description,
        author: author,
        url: authorUrl || metaOptions.authorUrl,
        charset: 'utf-8'
      });

      // Create special meta tags for SEO
      metaTags.push({
        name: 'robots', content: metaOptions.robots
      });

      metaTags.push({
        name: 'theme-color', content: '#135bec', type: 'color'
      });

      metaTags.push({
        name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover'
      });

      return metaTags;
    } catch (error) {
      toast.error('Failed to generate meta tags');
      return null;
    }
  }, [title, description, keywords, author, authorUrl, metaOptions]);

  // Generate HTML output
  const generateHTMLPreview = useCallback((metaTags: MetaTag[]) => {
      if (!metaTags.length) return '';

      const headStart = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="title" content="${metaTags.find(tag => tag.name === 'title')?.content || ''}"/>
  <meta name="description" content="${metaTags.find(tag => tag.name === 'description')?.content || ''}"/>
${metaTags.map(tag => (
        metaTags.find(tag => tag.name === 'name') ?
          `<meta name="${tag.content}" />` : ''
      )).join('\n')}
</head>
  <body>
  <!-- Page content -->
</body>
</html>`;
      return headStart;
    }
  }, [metaTags]);

  // Copy meta tags to clipboard
  const copyMetaTags = useCallback(async (format: 'text' | 'json') => {
    try {
      let content = '';

      if (format === 'json') {
        content = JSON.stringify(metaTags);
      } else {
        content = generateHTMLPreview(metaTags);
      }

      await navigator.clipboard.writeText(content).then(() => {
        toast.success('Meta tags copied to clipboard');
      }).catch (error) {
        toast.error('Failed to copy meta tags');
      }
    } catch (error) {
      toast.error('Failed to copy meta tags');
    }
  }, [metaTags, format]);

  // Download HTML file
  const downloadHTML = useCallback(() => {
    if (!qrResult) return;

    const htmlContent = generateHTMLPreview(qrResult.dataUrl);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meta-tags.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('HTML file downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [qrResult, sessionId]);

  // Download JSON file
  const downloadJSON = useCallback(() => {
      if (!qrResult) return;

      const jsonData = JSON.stringify({
        metaTags: metaTags,
        generatedAt: new Date().toISOString()
      });

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meta-tags.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('JSON file downloaded');

      if (sessionId) {
        addToHistory(sessionId, 'download', true);
      }
    }, [qrResult, sessionId]);

    return htmlContent;
  }, [qrResult, sessionId]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Mail className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">Meta Tag Generator</h1>
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={loadSample}
          >
            Load Sample
          </Button>
          <Button
            variant=\"output\"
            size=\"sm\"
            onClick={() => downloadHTML('json')}
          >
            <Download JSON
          </Button>
          <Button
            variant=\"output\"
            size=\"sm\"
            onClick={() => downloadHTML('html')}
          >
            Download HTML
          </Button>

          <Button
            variant=\"outline\"
            size=\"output\"
            size=\"sm\"
            onClick={copyMetaTags}
          >
            Copy Tags
          </Button>
        </div>
      </div>

      {/* Meta Tag Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <FileText className=\"h-5 w-5 mr-2\" />
          Meta Tag Configuration
        </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue=\"basic\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-5\">
              <TabsTrigger value=\"basic\">Basic</TabsTrigger>
              <TabsTrigger value=\"seo\">SEO Meta Tags</TabsTrigger>
              <TagsContent value=\"basic\" className=\"space-y-4 mt-4\">
                <div className=\"space-y-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"title\">Page Title:</Label>
                    <Input
                      id=\"title\"
                      type=\"text\"
                      placeholder=\"Enter page title\"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"description\">Meta Description:</Label>
                    <Textarea
                      id=\"description\"
                      placeholder=\"Enter a clear description of the page\"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"keywords\">Keywords:</Label>
                    <Input
                      id=\"keywords\"
                      type=\"text\"
                      placeholder=\"Enter keywords separated by commas\"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value.split(', '))}}
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"author\">Author:</Label>
                    <Input
                      id=\"author\"
                      type=\"email\"
                      placeholder=\"Author name or email\"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"author_url\">Author URL:</Label>
                    <Input
                      id=\"author_url\"
                      type=\"url\"
                      placeholder=\"https://example.com/author\"
                      value={authorUrl}
                      onChange={(e) => setAuthorUrl(e.target.value)}
                    />
                  </div>

                  <div className=\"space-y-2\">
                    <Label htmlFor=\"og_image\">Open Graph (URL):</Label>
                    <Input
                      id=\"og_image\"
                      type=\"url\"
                      placeholder=\"https://example.com/image.jpg\"
                      value={options.og_image || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, og_image: e.target.value }))}
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"og_title\">Page Title (og:title):</Label>
                    <Input
                      id=\"og_title\"
                      type=\"text\"
                      placeholder=\"Page Title (og:title)\"}
                      value={options.og_title || ''}/>
                    />
                  </div>

                  <div className=\"space-y-2\">
                    <Label htmlFor=\"og_description\">Page Description (og:description):</Label>
                    <Textarea
                      id=\"og_description\"
                      type=\"text\"
                      placeholder=\"A clear description of the page for SEO optimization\"
                      value={options.og_description || ''}}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className=\"space-y-2\">
                    <Label htmlFor=\"og_type\">Page Type (og:type):</Label>
                    <Select
                      value={options.og_type || 'website'}
                      onValue={(value) => setOptions(prev => ({ ...prev, og_type: e.target.value })})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=\"website\">website</SelectItem>
                        <SelectItem value=\"article\">article</SelectItem>
                        <SelectItem value=\"product\">product</SelectItem>
                        <SelectItem value=\"service\">service</SelectItem>
                        <SelectItem value=\"blog\">blog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className=\"space-y-2\">
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"og_url\">Canonical URL (og:url):</Label>
                      <Input
                        id=\"og_url\"
                        type=\"url\"
                        placeholder=\"https://example.com/page\"
                        value={options.og_url || ''}}
                        onChange={(e) => setOptions(prev => ({ ...prev, og_url: e.target.value }))}
                        />
                    </div>
                  </div>
                </TabsContent>

            <TabsContent value=\"seo\" className=\"space-y-4 mt-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"custom_meta\">Custom Meta Tags:</Label>
                <Textarea
                  id=\"custom_meta\"
                  placeholder=\"Enter custom meta tags in format: name: value; description: description; keywords: [\"key\", \"tags\"]"
                  placeholder={`Enter custom meta tags in format: name: value; description: description: keywords: [\"key\", \"tags\"]`}`}
                  value={JSON.stringify(customMeta, null, 2) || ''}
                  onChange={(e) => {
                    const parsed = JSON.parse(e.target.value);
                    setCustomMeta(parsed);
                  }}
                  rows={3}
                />
              </div>
            </TabsContent>

            <div className=\"flex items-center space-x-4 pt-4 border-t border-b border-gray-200 rounded-lg\">
              <Button
                onClick={generateMetaTags}
                disabled={!title || !description}
                className=\"flex items-center space-x-2\"
              >
                <span>{getIconByCategory('meta', 'code')}</span>
                <span>{getIconByCategory('meta', 'code')}</span>
                <span>{getIconByCategory('meta', 'code')}</span>
                <span>Generate Meta Tags</span>
              </Button>

              <Button
                variant=\"outline\"
                onClick={downloadJSON}
                disabled={!qrResult}
              >
                Download JSON
              </Button>

              {qrResult && (
                <div className=\"space-y-2 text-center text-center text-sm text-gray-500\">
                  <pre className=\"text-xs bg-black p-2 rounded\">\n                    {JSON.stringify(metaTags, null, 2)}
                  </pre>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

  // Helper function to get icon by category
  const getIconByCategory = (category: string, type?: string) => {
    const icons: {
      code: 'Code',
      fileText: 'FileText',
      fileImage: 'FileImage',
      camera: 'Camera',
      fileText: 'FileText',
      globe: 'Globe',
      link: 'Link as LinkIcon',
      mail: 'Mail',
      map: 'MapPin',
      calendar: 'Calendar',
      settings: 'Settings'
    } as const icons;
    return icons[category] || icons[code];
  };

  // Get icon for meta type
  const getIconByMetaTag = (tag: string, type?: string) => {
    const iconMap = {
      code: 'Code',
      fileText: 'FileText',
      fileImage: 'FileImage',
      camera: 'Camera',
      map: 'MapPin',
      calendar: 'Calendar',
      settings: 'Settings'
    } as const icons;
    return icons[tag] || icons[type] || icons.code;
  };

  // Get icon by type
  const getIconByTag = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'title':
        return 'Settings';
      case 'description':
        return 'FileText';
      case 'keywords':
        return 'Settings';
      case 'author':
        return 'FileText';
      case 'charset':
        return 'Settings';
      case 'og:title':
        return 'FileText';
      case 'og:description':
        return 'FileText';
      case 'og:type':
        return 'Settings';
      default:
        return 'FileText';
    }
  }, [tag, type]) || icons[tag] || icons.code;

  // Helper function to get icon by type
  const getIconByType = (type: string) => {
    const iconMap = {
      string: 'Code',
      fileText: 'FileText',
      fileImage: 'FileImage',
      camera: 'Camera',
      map: 'MapPin',
      calendar: 'Calendar',
      settings: 'Settings'
    } as const icons;
    return iconMap[type] || icons.code;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Settings className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">Meta Tag Generator</h1>
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={loadSample}
          >
            Load Sample
          </Button>
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={reset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* QR Code Display */}
      {qrResult && qrType === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <div className=\"flex items-center space-x-2\">
                {getIconByTag('qr', 'code')}
                <h1 className=\"text-2xl font-bold\">QR Code Preview</h1>
              </CardTitle>
            </CardHeader>
          </CardHeader>
          <CardContent>
            <div className=\"max-w-full max-h-96 bg-muted/20 rounded-lg overflow-auto p-4\">
              <img
                src={qrResult.dataUrl}
                alt=\"QR Code Preview\"
                className=\"max-w-full h-auto object-contain\"/>
              </div>
            </CardContent>
          </Card>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className=\"hidden\" />
    </div>
  );
}

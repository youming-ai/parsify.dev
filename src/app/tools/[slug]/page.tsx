import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getToolById, toolsData } from '@/data/tools-data';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Code,
  Cpu,
  Database,
  File,
  FileJson,
  FileText,
  Globe,
  Hash,
  Image as ImageIcon,
  KeyRound,
  Link2,
  Minimize2,
  Palette,
  ScanLine,
  Search,
  Settings,
  Shield,
  Sparkles,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import * as React from 'react';

interface ToolPageProps {
  params: {
    slug: string;
  };
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileJson,
  Terminal,
  Code,
  Hash,
  Settings,
  Shield,
  Image: ImageIcon,
  Http: Link2,
  QrCode: Search,
  Link: Link2,
  Type: Code,
  Lock: Shield,
  Binary: Code,
  Clock: Clock3,
  MapPin: Search,
  Network: Link2,
  Palette,
  FileText,
  Globe,
  Minimize2,
  KeyRound,
  ScanLine,
  File,
};

// Core tool component mapping (28 tools)
const toolComponents: Record<string, React.ComponentType<any>> = {
  // JSON Tools (7)
  'json-formatter': React.lazy(() =>
    import('@/components/tools/json/json-tool-complete').then((module) => ({
      default: module.JsonToolComplete,
    }))
  ),
  'json-validator': React.lazy(() =>
    import('@/components/tools/json/json-validator').then((module) => ({
      default: module.JsonValidator,
    }))
  ),
  'json-converter': React.lazy(() =>
    import('@/components/tools/json/json-converter').then((module) => ({
      default: module.JsonConverter,
    }))
  ),
  'json-path-queries': React.lazy(() =>
    import('@/components/tools/json/jsonpath-queries').then((module) => ({
      default: module.JsonPathQueries,
    }))
  ),
  'json-jwt-decoder': React.lazy(() =>
    import('@/components/tools/json/json-validator').then((module) => ({
      default: module.JsonValidator, // Using validator as placeholder
    }))
  ),
  'json-hero-viewer': React.lazy(() =>
    import('@/components/tools/json/json-hero-viewer').then((module) => ({
      default: module.JsonHeroViewer,
    }))
  ),
  'json-to-code': React.lazy(() =>
    import('@/components/tools/json/json-tool-complete').then((module) => ({
      default: module.JsonToolComplete, // Placeholder, will create dedicated component
    }))
  ),
  'json-to-types': React.lazy(() =>
    import('@/components/tools/json/json-to-types').then((module) => ({
      default: module.JsonToTypes,
    }))
  ),

  // Code Tools (2)
  'code-formatter': React.lazy(() =>
    import('@/components/tools/code/code-formatter').then((module) => ({
      default: module.CodeFormatter,
    }))
  ),
  'code-executor': React.lazy(() =>
    import('@/components/tools/code/code-execution').then((module) => ({
      default: module.CodeExecution,
    }))
  ),
  'html-viewer': React.lazy(() =>
    import('@/components/tools/code/html-viewer').then((module) => ({
      default: module.HtmlViewer,
    }))
  ),
  'html-tools': React.lazy(() =>
    import('@/components/tools/code/html-tools').then((module) => ({
      default: module.HtmlTools,
    }))
  ),

  // Image Tools (4)
  'image-compression': React.lazy(() =>
    import('@/components/tools/image/image-converter').then((module) => ({
      default: module.ImageConverter,
    }))
  ),
  'image-converter': React.lazy(() =>
    import('@/components/tools/image/image-converter').then((module) => ({
      default: module.ImageConverter,
    }))
  ),
  'image-resizer': React.lazy(() =>
    import('@/components/tools/image/image-resizer').then((module) => ({
      default: module.ImageResizer,
    }))
  ),
  'qr-reader': React.lazy(() =>
    import('@/components/tools/image/qr-code-reader').then((module) => ({
      default: module.QRCodeReader,
    }))
  ),
  'base64-image': React.lazy(() =>
    import('@/components/tools/image/base64-image-converter').then((module) => ({
      default: module.Base64ImageConverter,
    }))
  ),

  // Network Tools (3)
  'http-simulator': React.lazy(() =>
    import('@/components/tools/network/http-request-simulator').then((module) => ({
      default: module.HTTPRequestSimulator,
    }))
  ),
  'ip-geolocation': React.lazy(() =>
    import('@/components/tools/network/ip-geolocation').then((module) => ({
      default: module.IPGeolocationTool,
    }))
  ),
  'url-shortener': React.lazy(() =>
    import('@/components/tools/network/url-shortener').then((module) => ({
      default: module.URLShortener,
    }))
  ),
  'dns-lookup': React.lazy(() =>
    import('@/components/tools/network/dns-lookup').then((module) => ({
      default: module.DNSLookup,
    }))
  ),

  // Text Tools (4)
  'character-counter': React.lazy(() =>
    import('@/components/tools/text/text-analyzer').then((module) => ({
      default: module.default, // Using analyzer as placeholder
    }))
  ),
  'case-converter': React.lazy(() =>
    import('@/components/tools/text/text-case-converter').then((module) => ({
      default: module.TextCaseConverter,
    }))
  ),
  'encoding-converter': React.lazy(() =>
    import('@/components/tools/utils/encoding-converter').then((module) => ({
      default: module.EncodingConverter,
    }))
  ),
  'text-analyzer': React.lazy(() =>
    import('@/components/tools/text/text-analyzer').then((module) => ({
      default: module.default,
    }))
  ),

  // Security Tools (3)
  'password-generator': React.lazy(() =>
    import('@/components/tools/security/password-generator').then((module) => ({
      default: module.default,
    }))
  ),
  'hash-generator': React.lazy(() =>
    import('@/components/tools/data/hash-generator').then((module) => ({
      default: module.HashGenerator,
    }))
  ),
  'aes-encryption': React.lazy(() =>
    import('@/components/tools/security/aes-encryption').then((module) => ({
      default: module.AESEncryption,
    }))
  ),
  'secret-generator': React.lazy(() =>
    import('@/components/tools/security/secret-generator').then((module) => ({
      default: module.default,
    }))
  ),
  'id-analyzer': React.lazy(() =>
    import('@/components/tools/security/id-analyzer').then((module) => ({
      default: module.IDAnalyzer,
    }))
  ),

  // Utilities (3)
  'url-encoder': React.lazy(() =>
    import('@/components/tools/utilities/url-encoder').then((module) => ({
      default: module.URLEncoder,
    }))
  ),
  'base64-converter': React.lazy(() =>
    import('@/components/tools/utilities/base64-converter').then((module) => ({
      default: module.Base64Converter,
    }))
  ),
  'qr-generator': React.lazy(() =>
    import('@/components/tools/utilities/base64-converter').then((module) => ({
      default: module.Base64Converter, // Using converter as placeholder
    }))
  ),
  'compression-tool': React.lazy(() =>
    import('@/components/tools/utilities/compression-tool').then((module) => ({
      default: module.CompressionTool,
    }))
  ),
  'file-generator': React.lazy(() =>
    import('@/components/tools/file/file-generator').then((module) => ({
      default: module.FileGenerator,
    }))
  ),

  // Converters (3 new)
  'number-base-converter': React.lazy(() =>
    import('@/components/tools/converters/number-base-converter').then((module) => ({
      default: module.NumberBaseConverter,
    }))
  ),
  'color-converter': React.lazy(() =>
    import('@/components/tools/converters/color-converter').then((module) => ({
      default: module.ColorConverter,
    }))
  ),
  'html-entity-encoder': React.lazy(() =>
    import('@/components/tools/converters/html-entity-encoder').then((module) => ({
      default: module.HtmlEntityEncoder,
    }))
  ),

  // Generators (1 new)
  'lorem-ipsum-generator': React.lazy(() =>
    import('@/components/tools/generators/lorem-ipsum-generator').then((module) => ({
      default: module.LoremIpsumGenerator,
    }))
  ),

  // Utilities (1 new)
  'cron-parser': React.lazy(() =>
    import('@/components/tools/utilities/cron-parser').then((module) => ({
      default: module.CronParser,
    }))
  ),

  // Time Tools (1)
  'unix-converter': React.lazy(() =>
    import('@/components/tools/utilities/base64-converter').then((module) => ({
      default: module.Base64Converter, // Using converter as placeholder
    }))
  ),
};

// Generate static params for all tools
export async function generateStaticParams() {
  return toolsData.map((tool) => ({
    slug: tool.id,
  }));
}

// Opt out of static generation for pages with interactive components
export const dynamic = 'force-dynamic';

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = params;
  const tool = getToolById(slug);

  // If tool doesn't exist, show 404
  if (!tool) {
    notFound();
  }

  const _Icon = iconMap[tool.icon] || Settings;

  // Get related tools
  const relatedTools = toolsData
    .filter(
      (t) =>
        t.id !== slug &&
        (t.category === tool.category || t.tags.some((tag) => tool.tags.includes(tag)))
    )
    .slice(0, 3);

  const ToolComponent = toolComponents[slug];

  return (
    <MainLayout>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-blue-500/15 via-indigo-400/10 to-cyan-400/10 blur-3xl dark:from-blue-600/15 dark:via-indigo-500/10 dark:to-purple-500/10" />

        <div className="relative mx-auto flex w-full flex-col gap-6 px-4 pt-6 pb-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-xl dark:text-white">
                    Workspace
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Use {tool.name} directly in your browser
                  </CardDescription>
                </CardHeader>
                <CardContent
                  id="tool-workspace"
                  className="rounded-xl bg-white/70 p-4 dark:bg-slate-900"
                >
                  {ToolComponent ? (
                    <React.Suspense
                      fallback={
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="mx-auto mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                            <p className="text-slate-600 text-sm dark:text-slate-300">
                              Loading {tool.name}...
                            </p>
                          </div>
                        </div>
                      }
                    >
                      <ToolComponent />
                    </React.Suspense>
                  ) : (
                    <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 p-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <AlertCircle className="h-5 w-5" /> Tool coming soon
                      </div>
                      <p className="mt-2 text-amber-900/80 text-sm dark:text-amber-100/80">
                        This tool is currently being built. Check back later!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">Features</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    What you get with this tool
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {tool.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-3 text-slate-700 text-sm dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-300" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-5">
              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">Tags</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {tag}
                    </span>
                  ))}
                </CardContent>
              </Card>

              {relatedTools.length > 0 && (
                <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                      Related tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relatedTools.map((relatedTool) => {
                      const RelatedIcon = iconMap[relatedTool.icon] || Settings;
                      return (
                        <Link
                          key={relatedTool.id}
                          href={relatedTool.href}
                          className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-3 transition hover:border-blue-500/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                            <RelatedIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {relatedTool.name}
                            </h4>
                            <p className="text-slate-600 text-xs dark:text-slate-300">
                              {relatedTool.description.slice(0, 60)}...
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-slate-400" />
                        </Link>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

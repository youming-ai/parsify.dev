import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getToolById, toolsData } from '@/data/tools-data';
import {
  AlertCircle,
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
const toolComponents: Record<string, React.ComponentType<unknown>> = {
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

  const Icon = iconMap[tool.icon] || Settings;

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

        <div className="relative mx-auto flex max-w-7xl w-full flex-col gap-8 px-6 pt-6 pb-12 lg:px-8">
          {/* Tool Workspace */}
          <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 text-xl dark:text-white">
                    {tool.name}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {tool.description.slice(0, 100)}...
                  </CardDescription>
                </div>
              </div>
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

          {/* About Section Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                About this tool
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Features, specifications, and related tools
              </p>
            </div>
          </div>

          {/* Three Column Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Features Card */}
            <Card className="group overflow-hidden rounded-2xl border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
              <CardHeader className="pb-4">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  Key Features
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  What makes this tool powerful
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tool.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 rounded-lg bg-slate-50/80 p-3 transition-colors dark:bg-slate-800/50"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Specifications Card */}
            <Card className="group overflow-hidden rounded-2xl border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
              <CardHeader className="pb-4">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <Cpu className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  Specifications
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Technical details and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Category */}
                  <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-3 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Category</span>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {tool.category}
                    </span>
                  </div>

                  {/* Processing */}
                  <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-3 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Processing</span>
                    </div>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 capitalize">
                      {tool.processingType?.replace('-', ' ') || 'Client Side'}
                    </span>
                  </div>

                  {/* Security */}
                  <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-3 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Security</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 capitalize">
                      {tool.security?.replace('-', ' ') || 'Local Only'}
                    </span>
                  </div>

                  {/* Difficulty */}
                  <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-3 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Difficulty</span>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 capitalize">
                      {tool.difficulty}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="pt-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tool.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Tools Card */}
            {relatedTools.length > 0 && (
              <Card className="group overflow-hidden rounded-2xl border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
                <CardHeader className="pb-4">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                    <ArrowUpRight className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Related Tools
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">
                    Explore similar utilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatedTools.map((relatedTool) => {
                      const RelatedIcon = iconMap[relatedTool.icon] || Settings;
                      return (
                        <Link
                          key={relatedTool.id}
                          href={relatedTool.href}
                          className="group/item flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-blue-500/50 hover:bg-blue-50/50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/30"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 transition-colors group-hover/item:from-blue-500 group-hover/item:to-indigo-500 group-hover/item:text-white dark:text-blue-400">
                            <RelatedIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-medium text-slate-900 dark:text-white">
                              {relatedTool.name}
                            </h4>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {relatedTool.description.slice(0, 50)}...
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover/item:text-blue-500" />
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

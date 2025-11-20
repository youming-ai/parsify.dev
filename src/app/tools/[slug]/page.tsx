import {
  AlertCircle,
  AlignLeft,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Code,
  Cpu,
  Database,
  FileJson,
  FileText,
  Fingerprint,
  GitCompare,
  Hash,
  Image as ImageIcon,
  Key,
  Link2,
  Play,
  QrCode,
  Regex,
  Search,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getToolById, toolsData } from "@/data/tools-data";

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
  FileText,
  Hash,
  Zap,
  Settings,
  Shield,
  Play,
  Search,
  Database,
  Regex,
  Pattern: Regex,
  Image: ImageIcon,
  Http: Link2,
  Password: Key,
  QrCode,
  Difference: GitCompare,
  FormatAlignLeft: AlignLeft,
  Schedule: Clock3,
  EnhancedEncryption: Shield,
  Fingerprint,
};

// Tool component mapping - only include existing components
const toolComponents: Record<string, React.ComponentType<any>> = {
  "json-formatter": React.lazy(() =>
    import("@/components/tools/json/json-formatter").then((module) => ({
      default: module.JsonFormatter,
    })),
  ),
  "json-validator": React.lazy(() =>
    import("@/components/tools/json/json-validator").then((module) => ({
      default: module.JsonValidator,
    })),
  ),
  "code-executor": React.lazy(() =>
    import("@/components/tools/code/code-execution").then((module) => ({
      default: module.CodeExecution,
    })),
  ),
  "code-formatter": React.lazy(() =>
    import("@/components/tools/code/code-formatter").then((module) => ({
      default: module.CodeFormatter,
    })),
  ),
};

// Generate static params for all tools
export async function generateStaticParams() {
  return toolsData.map((tool) => ({
    slug: tool.id,
  }));
}

// Opt out of static generation for pages with interactive components
export const dynamic = "force-dynamic";

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
        (t.category === tool.category || t.tags.some((tag) => tool.tags.includes(tag))),
    )
    .slice(0, 3);

  const ToolComponent = toolComponents[slug];

  return (
    <MainLayout>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-blue-500/15 via-indigo-400/10 to-cyan-400/10 blur-3xl dark:from-blue-600/15 dark:via-indigo-500/10 dark:to-purple-500/10" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-10">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <span className="text-slate-400">/</span>
            <Link href="/tools" className="hover:text-slate-900 dark:hover:text-white">
              Tools
            </Link>
            <span className="text-slate-400">/</span>
            <span className="font-medium text-slate-900 dark:text-white">{tool.name}</span>
          </nav>

          {/* Hero / summary */}
          <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_14px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-md transition hover:shadow-[0_18px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800/80 dark:bg-slate-900/70">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-blue-500/25">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-slate-900/5 text-slate-900 dark:bg-slate-100/10 dark:text-slate-100"
                    >
                      {tool.category}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {tool.difficulty}
                    </Badge>
                    <Badge
                      variant={tool.status === "stable" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {tool.status}
                    </Badge>
                    {tool.isNew && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> New
                      </Badge>
                    )}
                    {tool.isPopular && <Badge variant="outline">Popular</Badge>}
                  </div>

                  <div>
                    <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                      {tool.name}
                    </h1>
                    <p className="mt-2 max-w-3xl text-base text-slate-600 dark:text-slate-300">
                      {tool.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {tool.tags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Tag className="h-3.5 w-3.5 text-blue-500" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
                <Link href="#tool-workspace">
                  <Button size="lg" className="gap-2">
                    Launch tool
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/tools">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Search className="h-4 w-4" />
                    Browse tools
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Processing",
                  value: tool.processingType
                    ? tool.processingType.replace("-", " ")
                    : "Not specified",
                  icon: Cpu,
                },
                {
                  label: "Security",
                  value: tool.security ? tool.security.replace("-", " ") : "Not specified",
                  icon: Shield,
                },
                {
                  label: "Category",
                  value: tool.subcategory || tool.category,
                  icon: Database,
                },
                {
                  label: "Features",
                  value: `${tool.features.length}+ ready-to-use`,
                  icon: Sparkles,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/70"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-slate-900 capitalize dark:text-slate-100">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900 dark:text-white">
                      Workspace
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      Jump into {tool.name} without leaving this page.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/80">
                      <Shield className="h-3.5 w-3.5" /> {tool.security ?? "Local"}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 capitalize dark:bg-slate-800/80">
                      <Cpu className="h-3.5 w-3.5" /> {tool.processingType ?? "client"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent
                  id="tool-workspace"
                  className="rounded-xl border border-dashed border-slate-200/90 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  {ToolComponent ? (
                    <React.Suspense
                      fallback={
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="mx-auto mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Loading {tool.name}...
                            </p>
                          </div>
                        </div>
                      }
                    >
                      <div className="rounded-xl bg-slate-900/5 p-2 dark:bg-slate-800/50">
                        <ToolComponent />
                      </div>
                    </React.Suspense>
                  ) : (
                    <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 p-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <AlertCircle className="h-5 w-5" /> Tool coming soon
                      </div>
                      <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-100/80">
                        This experience is currently being built. Check back later or launch another
                        tool while we finish it.
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Link href="/tools">
                          <Button variant="outline" className="gap-2">
                            <Search className="h-4 w-4" />
                            Explore other tools
                          </Button>
                        </Link>
                        <Link href="/">
                          <Button
                            variant="ghost"
                            className="gap-2 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Back home
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    What you get
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Core capabilities and reasons this tool speeds up your workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {tool.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
                    >
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-5">
              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Quick facts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <GaugeChip label="Difficulty" value={tool.difficulty} />
                    <GaugeChip
                      label="Status"
                      value={tool.status}
                      tone={tool.status === "stable" ? "success" : "warning"}
                    />
                  </div>
                  <InfoRow
                    icon={<Cpu className="h-4 w-4" />}
                    label="Processing"
                    value={tool.processingType ? tool.processingType.replace("-", " ") : "Local"}
                  />
                  <InfoRow
                    icon={<Shield className="h-4 w-4" />}
                    label="Security"
                    value={tool.security ? tool.security.replace("-", " ") : "Local only"}
                  />
                  <InfoRow
                    icon={<Database className="h-4 w-4" />}
                    label="Category"
                    value={tool.subcategory || tool.category}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">Tags</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Use tags to discover related helpers faster.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      Explore similar utilities to pair with {tool.name}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relatedTools.map((relatedTool) => {
                      const RelatedIcon = iconMap[relatedTool.icon] || Settings;
                      return (
                        <Link
                          key={relatedTool.id}
                          href={relatedTool.href}
                          className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-blue-500/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-blue-500/50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition group-hover:bg-blue-500 group-hover:text-white dark:text-blue-300">
                            <RelatedIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {relatedTool.name}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {relatedTool.description}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
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

interface GaugeChipProps {
  label: string;
  value: string;
  tone?: "success" | "warning" | "neutral";
}

function GaugeChip({ label, value, tone = "neutral" }: GaugeChipProps) {
  const toneClasses = {
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-200",
    neutral: "bg-slate-500/10 text-slate-700 dark:text-slate-200",
  };

  return (
    <div className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide">
      <Clock3 className="h-3.5 w-3.5" />
      <span className={`rounded-full px-2 py-1 ${toneClasses[tone]}`}>{value}</span>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/60">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800 capitalize dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

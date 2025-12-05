'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toolsData } from '@/data/tools-data';
import type { Tool } from '@/types/tools';
import {
  Binary,
  Clock,
  Code,
  Database,
  File,
  FileJson,
  FileText,
  Globe,
  Hash,
  Image,
  KeyRound,
  Link as LinkIcon,
  Lock,
  MapPin,
  Network,
  Palette,
  QrCode,
  ScanLine,
  Search,
  Shield,
  Terminal,
  Type,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileJson,
  Database,
  Code,
  Terminal,
  Image,
  Palette,
  Hash,
  FileText,
  Shield,
  Globe,
  Network,
  MapPin,
  Link: LinkIcon,
  Type,
  Lock,
  KeyRound,
  ScanLine,
  Binary,
  QrCode,
  Clock,
  File,
  // Mappings for potential future use or aliases
  DataObject: Database,
  CheckCircle: Hash,
  Route: Network,
  Pattern: Database,
  Http: Globe,
  BugReport: Code,
  Password: Lock,
  Difference: FileText,
  FormatAlignLeft: FileText,
  TextFields: Type,
  Schedule: Clock,
  Fingerprint: ScanLine,
  EnhancedEncryption: Shield,
  Compress: File, // Fallback if Compress doesn't exist, or use FileArchive if available
};

import { MainLayout } from '@/components/layout/main-layout';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tools
  const filteredTools = toolsData.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group by category
  const categories = Array.from(new Set(filteredTools.map((tool) => tool.category)));
  const groupedTools = categories.reduce(
    (acc, category) => {
      acc[category] = filteredTools.filter((tool) => tool.category === category);
      return acc;
    },
    {} as Record<string, Tool[]>
  );

  const ToolCard = ({ tool }: { tool: Tool }) => {
    const IconComponent = iconMap[tool.icon] || Database;

    return (
      <Link
        href={tool.href}
        className="group hover:-translate-y-1 relative flex flex-col rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:ring-1 hover:ring-primary/20"
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <IconComponent className="h-5 w-5" />
          </div>
          {tool.isNew && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 text-xs dark:bg-green-900 dark:text-green-200"
            >
              New
            </Badge>
          )}
        </div>
        <h3 className="mb-1 font-semibold text-lg transition-colors group-hover:text-primary">
          {tool.name}
        </h3>
        <p className="line-clamp-2 text-muted-foreground text-sm">{tool.description}</p>
      </Link>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        {/* Hero Section */}
        <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden border-b bg-background px-6 pt-32 pb-16 text-center lg:px-8 lg:pt-40 lg:pb-32">
          {/* Background Effects */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-background">
            <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
            <div className="absolute top-0 left-0 right-0 h-[500px] w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-40 blur-3xl dark:opacity-20" />
            <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
          </div>

          <div className="fade-in slide-in-from-bottom-4 relative z-10 max-w-5xl animate-in duration-700">
            <div className="mb-8 flex justify-center">
              <Badge
                variant="outline"
                className="rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10"
              >
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                v1.0 is now live
              </Badge>
            </div>

            <h1 className="mb-8 font-extrabold text-5xl text-foreground tracking-tight sm:text-7xl">
              Developer Tools,{' '}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                Simplified
              </span>
              .
            </h1>

            <div className="mx-auto mb-12 max-w-2xl space-y-4">
              <p className="text-lg text-muted-foreground sm:text-xl">
                A collection of secure, client-side utilities for your daily development workflow.
              </p>
              <div className="flex justify-center">
                <span className="inline-flex items-center rounded-full bg-muted/50 px-4 py-1.5 text-sm text-foreground/80 backdrop-blur-sm">
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                  No server-side processing—your data never leaves your browser.
                </span>
              </div>
            </div>
          </div>

          <div className="fade-in slide-in-from-bottom-8 relative z-10 mx-auto w-full max-w-xl animate-in fill-mode-backwards delay-200 duration-1000">
            <div className="group relative">
              <div className="absolute -inset-0.5 animate-pulse rounded-full bg-gradient-to-r from-primary/50 to-blue-600/50 opacity-20 blur transition duration-500 group-hover:opacity-50" />
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  type="text"
                  placeholder="Search for tools (e.g., JSON, Base64, Format)..."
                  className="h-14 w-full rounded-full border-muted-foreground/20 bg-background/80 pl-12 pr-4 text-lg shadow-sm backdrop-blur-xl transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          {categories.length > 0 ? (
            categories.map((category, categoryIndex) => (
              <div
                key={category}
                className="fade-in slide-in-from-bottom-8 mb-16 animate-in fill-mode-backwards duration-700 last:mb-0"
                style={{ animationDelay: `${categoryIndex * 100}ms` }}
              >
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="font-bold text-2xl text-foreground">{category}</h2>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedTools[category].map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="fade-in zoom-in animate-in py-20 text-center duration-500">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-semibold text-xl">No tools found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse all tools.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 font-medium text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

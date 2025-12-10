'use client';

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
import { Press_Start_2P } from 'next/font/google';
import { MainLayout } from '@/components/layout/main-layout';

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
  Compress: File,
};

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
});

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
        className="group relative flex flex-row items-center justify-start border-2 border-foreground/80 bg-card p-3 text-card-foreground shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)] hover:border-primary active:translate-y-0 active:translate-x-0 active:shadow-[1px_1px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.2)] dark:hover:shadow-[5px_5px_0_0_rgba(255,255,255,0.2)] dark:active:shadow-[1px_1px_0_0_rgba(255,255,255,0.2)]"
      >
        <div className="flex shrink-0 items-center justify-center border-2 border-foreground/10 bg-muted/50 p-2 transition-colors group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary">
          <IconComponent className="h-4 w-4 stroke-[1.5]" />
        </div>

        <h3
          className={`${pixelFont.className} ml-3 flex-1 truncate text-xs text-left leading-tight tracking-wide transition-colors group-hover:text-primary`}
        >
          {tool.name.toUpperCase()}
        </h3>

        {/* Pixel Corner Decoration */}
        <div className="absolute bottom-0.5 right-0.5 h-0.5 w-0.5 bg-foreground/30"></div>
      </Link>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
        {/* Retro Pixel Hero Section */}
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden border-b-4 border-foreground/10 bg-background px-6 pt-32 pb-16 text-center lg:pt-40 lg:pb-32">
          {/* Pixel Grid Background */}
          <div
            className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Animated Gradient Spotlights */}
          <div className="absolute top-0 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px] dark:bg-primary/10" />

          <div className="relative z-10 mx-auto max-w-5xl">
            {/* Retro Label */}
            <div className="animate-bounce mb-8 flex justify-center">
              <div
                className={`${pixelFont.className} flex items-center gap-2 border-2 border-foreground/20 bg-background px-4 py-2 text-[10px] uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] dark:text-primary dark:border-primary/30`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                System Ready // v1.0.0
              </div>
            </div>

            {/* Main Headline */}
            <h1
              className={`${pixelFont.className} mb-10 text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-6xl text-foreground`}
            >
              DEVELOPER
              <span className="relative inline-block text-primary ml-3 sm:ml-5">
                TOOLS
                <span className="absolute -bottom-2 left-0 h-1 w-full bg-primary/30"></span>
                {/* Decorative Pixel Elements */}
                {/* Top Right Group */}
                <div className="absolute -top-3 -right-5 flex flex-col gap-0.5">
                  <span className="h-2 w-2 bg-yellow-400 animate-pulse shadow-[1px_1px_0_0_rgba(0,0,0,0.2)]"></span>
                  <span className="h-1 w-1 ml-auto bg-foreground/30"></span>
                </div>
                {/* Bottom Left Group */}
                <div className="absolute -bottom-1 -left-4 flex items-end gap-0.5 hidden sm:flex">
                  <span className="h-1 w-1 bg-foreground/30 mb-2"></span>
                  <span className="h-3 w-3 bg-blue-500 shadow-[1px_1px_0_0_rgba(0,0,0,0.2)]"></span>
                </div>
                {/* Tiny Floating Bit */}
                <span className="absolute top-1/2 -right-8 h-1 w-1 bg-red-500/50 animate-ping hidden sm:block"></span>
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground font-mono leading-relaxed">
              [ Offline-ready. Privacy-first. ]<br />
              <span className="text-sm opacity-80">
                No server-side processing—your data never leaves your browser.
              </span>
            </p>

            {/* Retro Search Box */}
            <div className="mx-auto w-full max-w-xl px-4">
              <div className="relative group">
                {/* Pixel shadow effect */}
                <div className="absolute inset-0 translate-x-1 translate-y-1 bg-foreground/10 rounded-none transition-transform group-hover:translate-x-2 group-hover:translate-y-2 dark:bg-primary/20" />

                <div className="relative flex items-center border-2 border-foreground bg-background p-1 transition-colors hover:border-primary dark:border-primary/50">
                  <div className="flex bg-muted/50 p-3 border-r-2 border-foreground/10 mr-1">
                    <Search className="h-6 w-6 text-foreground/70" />
                  </div>
                  <Input
                    type="text"
                    placeholder="SEARCH_COMMAND..."
                    className={`${pixelFont.className} h-12 w-full border-0 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 tracking-widest`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-2 hover:bg-destructive/10 text-destructive/50 hover:text-destructive transition-colors"
                    >
                      <span className="sr-only">Clear</span>
                      <span className="text-xs font-bold">X</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Decorative Floating Elements - Left */}
            <div className="absolute top-1/4 left-8 hidden lg:block opacity-20 dark:opacity-10 pointer-events-none select-none">
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <div className="h-3 w-3 bg-foreground"></div>
                  <div className="h-3 w-3 bg-transparent"></div>
                  <div className="h-3 w-3 bg-foreground/50"></div>
                </div>
                <div className="flex gap-1">
                  <div className="h-3 w-3 bg-foreground/80"></div>
                  <div className="h-3 w-3 bg-foreground"></div>
                  <div className="h-3 w-3 bg-foreground/20"></div>
                </div>
              </div>
            </div>

            {/* Decorative Floating Elements - Right */}
            <div className="absolute bottom-1/3 right-12 hidden lg:block opacity-30 dark:opacity-20 pointer-events-none select-none">
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-primary/40"></div>
                  <div className="h-2 w-2 bg-primary/60"></div>
                  <div className="h-2 w-2 bg-primary animate-pulse"></div>
                </div>
                <div className="h-1 w-12 bg-primary/20">
                  <div className="h-full w-2/3 bg-primary/40"></div>
                </div>
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
                <div className="mb-8 flex items-center gap-3 border-b-2 border-foreground/10 pb-2">
                  <div className="h-6 w-4 bg-primary animate-pulse hidden sm:block"></div>
                  <h2
                    className={`${pixelFont.className} text-xl text-foreground uppercase tracking-wider md:text-2xl`}
                  >
                    <span className="text-primary mr-2">&gt;</span>
                    {category}
                  </h2>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    [{groupedTools[category].length}_ITEMS]
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedTools[category].map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="fade-in zoom-in animate-in py-20 text-center duration-500 border-2 border-dashed border-foreground/20 p-12 bg-muted/10">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center border-4 border-foreground/10 bg-muted/30">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className={`${pixelFont.className} mb-4 text-xl uppercase`}>No tools found</h3>
              <p className="text-muted-foreground font-mono mb-6">
                ERROR: SEARCH_QUERY_YIELDED_NO_RESULTS
                <br />
                ADVICE: TRY_ADJUSTING_TERMS
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`${pixelFont.className} border-2 border-primary text-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors text-xs`}
              >
                [ CLEAR_SEARCH ]
              </button>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

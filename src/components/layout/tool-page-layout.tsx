'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  Cpu,
  ExternalLink,
  Info,
  Layers,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface ToolPageLayoutProps {
  title: string;
  description: string;
  category?: string;
  badges?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  features?: string[];
  info?: {
    category: string;
    processing: string;
    security: string;
    difficulty?: string;
    status?: string;
  };
  related?: Array<{
    name: string;
    description: string;
    href: string;
    icon?: React.ReactNode;
  }>;
}

export function ToolPageLayout({
  title,
  description,
  category = 'Tools',
  badges,
  icon,
  children,
  features,
  info,
  related,
}: ToolPageLayoutProps) {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Tool Area */}
      <div className="mb-12">{children}</div>

      {/* Details Section */}
      {(features || info || related) && (
        <div className="space-y-8">
          {/* Section Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Info className="h-5 w-5" />
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
            {features && features.length > 0 && (
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
                    {features.map((feature, index) => (
                      <li
                        key={index}
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
            )}

            {/* Information Card */}
            {info && (
              <Card className="group overflow-hidden rounded-2xl border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
                <CardHeader className="pb-4">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                    <Layers className="h-6 w-6" />
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
                        <Layers className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Category</span>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {info.category}
                      </span>
                    </div>

                    {/* Processing */}
                    <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-3 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Processing
                        </span>
                      </div>
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                        {info.processing}
                      </span>
                    </div>

                    {/* Security */}
                    <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-3 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Security</span>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        {info.security}
                      </span>
                    </div>

                    {/* Difficulty (optional) */}
                    {info.difficulty && (
                      <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-3 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Difficulty
                          </span>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium capitalize text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          {info.difficulty}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Tools Card */}
            {related && related.length > 0 && (
              <Card className="group overflow-hidden rounded-2xl border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
                <CardHeader className="pb-4">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                    <ExternalLink className="h-6 w-6" />
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
                    {related.map((tool, index) => (
                      <Link
                        key={index}
                        href={tool.href}
                        className="group/item flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-blue-500/50 hover:bg-blue-50/50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/30"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 transition-colors group-hover/item:from-blue-500 group-hover/item:to-indigo-500 group-hover/item:text-white dark:text-blue-400">
                          {tool.icon || <Layers className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-medium text-slate-900 dark:text-white">
                            {tool.name}
                          </h4>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {tool.description}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover/item:text-blue-500" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

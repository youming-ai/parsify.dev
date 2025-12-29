'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  Cpu,
  Database,
  Info,
  Lightning,
  Shield,
  Sparkle,
  Stack,
} from '@phosphor-icons/react';

export interface ToolInfoSectionProps {
  features?: string[];
  info?: {
    category: string;
    processing: string;
    security: string;
    difficulty?: string;
    status?: string;
  };

  tags?: string[];
}

export function ToolInfoSection({ features, info, tags }: ToolInfoSectionProps) {
  if (!features && !info) return null;

  return (
    <div className="space-y-8 mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-none border-2 border-foreground bg-primary text-primary-foreground">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">About this tool</h2>
          <p className="text-sm text-muted-foreground">Features and specifications</p>
        </div>
      </div>

      {/* Three Column Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Features Card */}
        {features && features.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-none border-2 border-foreground bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Sparkle className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-foreground">Key Features</CardTitle>
              <CardDescription className="text-muted-foreground">
                What makes this tool powerful
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 transition-colors"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Specifications Card */}
        {info && (
          <Card>
            <CardHeader className="pb-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-none border-2 border-foreground bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Stack className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-foreground">Specifications</CardTitle>
              <CardDescription className="text-muted-foreground">
                Technical details and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Category */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Category</span>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {info.category}
                  </span>
                </div>

                {/* Processing */}
                <div className="flex items-center justify-between rounded-lg bg-muted/80 p-3 dark:bg-card/50">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Processing</span>
                  </div>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    {info.processing}
                  </span>
                </div>

                {/* Security */}
                <div className="flex items-center justify-between rounded-lg bg-muted/80 p-3 dark:bg-card/50">
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
                  <div className="flex items-center justify-between rounded-lg bg-muted/80 p-3 dark:bg-card/50">
                    <div className="flex items-center gap-2">
                      <Lightning className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Difficulty</span>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium capitalize text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      {info.difficulty}
                    </span>
                  </div>
                )}

                {/* Tags (optional) */}
                {tags && tags.length > 0 && (
                  <div className="pt-2">
                    <span className="mb-2 block text-xs text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

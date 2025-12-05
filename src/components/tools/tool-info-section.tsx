'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Cpu, Database, Info, Layers, Shield, Sparkles, Zap } from 'lucide-react';

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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">About this tool</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Features and specifications</p>
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
              <CardTitle className="text-lg text-slate-900 dark:text-white">Key Features</CardTitle>
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

        {/* Specifications Card */}
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
                    <Database className="h-4 w-4 text-slate-400" />
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
                    <span className="text-sm text-slate-600 dark:text-slate-400">Processing</span>
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
                    <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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

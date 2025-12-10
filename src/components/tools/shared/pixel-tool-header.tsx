'use client';

import { ArrowLeft } from 'lucide-react';
import { Press_Start_2P } from 'next/font/google';
import Link from 'next/link';
import type React from 'react';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
});

interface PixelToolHeaderProps {
  title: string;
  description: string;
  category: string;
  icon?: React.ReactNode;
}

export function PixelToolHeader({ title, description, category, icon }: PixelToolHeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumb / Navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          <span>BACK_TO_HOME</span>
        </Link>
        <span>/</span>
        <span className="text-primary">{category.toUpperCase()}</span>
      </div>

      {/* Main Pixel Header Box */}
      <div className="relative border-4 border-foreground bg-card p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:border-primary/50 dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.1)]">
        {/* Decorative corner squares */}
        <div className="absolute top-0 left-0 h-4 w-4 bg-foreground dark:bg-primary"></div>
        <div className="absolute top-0 right-0 h-4 w-4 bg-foreground dark:bg-primary"></div>
        <div className="absolute bottom-0 left-0 h-4 w-4 bg-foreground dark:bg-primary"></div>
        <div className="absolute bottom-0 right-0 h-4 w-4 bg-foreground dark:bg-primary"></div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-2 w-2 bg-green-500 animate-pulse rounded-full"></span>
              <span
                className={`${pixelFont.className} text-[10px] text-green-600 dark:text-green-400`}
              >
                SYSTEM_ONLINE
              </span>
            </div>

            <h1
              className={`${pixelFont.className} mb-4 text-2xl md:text-3xl leading-tight text-foreground`}
            >
              {title}
            </h1>

            <p className="max-w-2xl border-l-4 border-primary/30 pl-4 py-1 text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          </div>

          {icon && (
            <div className="hidden md:flex flex-shrink-0 items-center justify-center p-4 border-2 border-dashed border-foreground/20 bg-muted/50 w-24 h-24">
              <div className="text-primary transform scale-150">{icon}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

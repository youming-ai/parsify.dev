'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ToolPageLayoutProps {
  title: string;
  description: string;
  category?: string;
  badges?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  features?: React.ReactNode;
  info?: React.ReactNode;
  related?: React.ReactNode;
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
    <div className="container mx-auto max-w-7xl px-6 lg:px-8">
      {/* Tool Area */}
      <div className="mb-12">{children}</div>

      {/* Details Tabs */}
      {(features || info || related) && (
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="related">Related</TabsTrigger>
          </TabsList>
          <TabsContent value="features" className="mt-6">
            {features}
          </TabsContent>
          <TabsContent value="info" className="mt-6">
            {info}
          </TabsContent>
          <TabsContent value="related" className="mt-6">
            {related}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

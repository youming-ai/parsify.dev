import { getToolById, toolsData } from '@/data/tools-data';
import { generatePageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

interface ToolPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all tools
export async function generateStaticParams() {
  return toolsData.map((tool) => ({
    slug: tool.id,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolById(slug);

  if (!tool) {
    return {
      title: 'Tool Not Found | Parsify.dev',
      description: 'The requested tool could not be found.',
      robots: { index: false, follow: false },
    };
  }

  return generatePageMetadata({
    title: tool.name,
    description: tool.description,
    path: tool.href,
    keywords: tool.tags,
    noIndex: false,
  });
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolById(slug);

  // If tool doesn't exist, show 404
  if (!tool) {
    notFound();
  }

  // Check if the slug matches the expected href
  // If it's an old format (just the tool id), redirect to the proper URL
  if (`/${slug}` !== tool.href) {
    permanentRedirect(tool.href);
  }

  // If we reach here, it means we're at the correct URL
  // This shouldn't happen with current routing, but just in case
  permanentRedirect(tool.href);
}

/**
 * SEO Analysis Response Schema
 *
 * Defines the structure for SEO analysis results including
 * SEO.md document, robots.txt, and llm.txt generation.
 */

export interface SeoFrontmatter {
  domain: string;
  generatedAt: string;
  industry: string;
  targetAudience: string;
  seoScore: number;
}

export interface SeoOverview {
  siteDescription: string;
  primaryKeywords: string[];
  competitors: string[];
}

export interface SeoSection {
  [key: string]: string | number;
  score: number;
}

export interface SeoRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  implementation: string;
}

export interface OptimizedContent {
  title: string;
  description: string;
  markdown: string;
}

export interface SeoMdDocument {
  frontmatter: SeoFrontmatter;
  overview: SeoOverview;
  technicalSeo: SeoSection;
  contentSeo: SeoSection;
  metaTags: SeoSection;
  linkStructure: SeoSection;
  recommendations: SeoRecommendation[];
  optimizedContent: OptimizedContent;
}

export interface SeoAnalysisResponse {
  seoMd: SeoMdDocument;
  robotsTxt: string;
  llmTxt: string;
}

// Helper function to validate SEO analysis response
export function isValidSeoResponse(data: unknown): data is SeoAnalysisResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check required top-level fields
  if (!obj['seoMd'] || !obj['robotsTxt'] || !obj['llmTxt']) {
    return false;
  }

  const seoMd = obj['seoMd'] as Record<string, unknown>;

  // Check required seoMd fields
  if (!seoMd['frontmatter'] || !seoMd['overview'] || !seoMd['recommendations']) {
    return false;
  }

  // Check frontmatter structure
  const frontmatter = seoMd['frontmatter'] as Record<string, unknown>;
  if (typeof frontmatter['domain'] !== 'string' || typeof frontmatter['seoScore'] !== 'number') {
    return false;
  }

  return true;
}

// Helper function to calculate overall SEO score
export function calculateOverallScore(seoMd: SeoMdDocument): number {
  const scores = [
    seoMd.technicalSeo.score,
    seoMd.contentSeo.score,
    seoMd.metaTags.score,
    seoMd.linkStructure.score,
  ];

  const validScores = scores.filter((score) => typeof score === 'number' && !Number.isNaN(score));

  if (validScores.length === 0) {
    return 0;
  }

  return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
}

// Helper function to get score color class
export function getScoreColorClass(score: number): string {
  if (score >= 90) return 'text-seo-excellent';
  if (score >= 70) return 'text-seo-good';
  if (score >= 50) return 'text-seo-fair';
  return 'text-seo-poor';
}

// Helper function to get score background color class
export function getScoreBgColorClass(score: number): string {
  if (score >= 90) return 'bg-seo-excellent';
  if (score >= 70) return 'bg-seo-good';
  if (score >= 50) return 'bg-seo-fair';
  return 'bg-seo-poor';
}

// Helper function to format score for display
export function formatScore(score: number): string {
  return `${score}/100`;
}

// Helper function to get priority label
export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return '高优先级';
    case 'medium':
      return '中优先级';
    case 'low':
      return '低优先级';
    default:
      return priority;
  }
}

// Helper function to get priority color class
export function getPriorityColorClass(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

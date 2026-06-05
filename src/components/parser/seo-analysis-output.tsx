import { Bot, Check, Copy, Download, FileText, Globe, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { SeoScore, SeoScoreBar, SeoScoreGrid } from '~/components/parser/seo-score';
import type { SeoAnalysisResponse } from '~/schemas/seo';
import { calculateOverallScore } from '~/schemas/seo';

interface SeoAnalysisOutputProps {
  seoData: SeoAnalysisResponse | null;
  isStreaming: boolean;
  error: string | null;
}

export function SeoAnalysisOutput({ seoData, isStreaming, error }: SeoAnalysisOutputProps) {
  const [activeTab, setActiveTab] = useState<'seo-md' | 'robots-txt' | 'llm-txt'>('seo-md');
  const [copied, setCopied] = useState(false);

  if (isStreaming) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing SEO...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (!seoData) {
    return null;
  }

  const overallScore = calculateOverallScore(seoData.seoMd);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in insecure contexts — silently ignore
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSeoMd = () => {
    const { seoMd } = seoData;

    return (
      <div className="space-y-6">
        {/* Header with score */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">SEO Analysis for {seoMd.frontmatter.domain}</h3>
            <p className="text-sm text-muted-foreground">
              Generated on {new Date(seoMd.frontmatter.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <SeoScore
            score={overallScore}
            label="Overall Score"
            size="md"
            showLabel={false}
            showBadge={true}
          />
        </div>

        {/* Overview */}
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Overview</h4>
          <p className="text-sm text-muted-foreground mb-3">{seoMd.overview.siteDescription}</p>
          <div className="flex flex-wrap gap-2">
            {seoMd.overview.primaryKeywords.map((keyword, index) => (
              <span key={index} className="px-2 py-1 bg-secondary rounded-md text-xs">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Scores grid */}
        <SeoScoreGrid
          scores={{
            technicalSeo: seoMd.technicalSeo.score,
            contentSeo: seoMd.contentSeo.score,
            metaTags: seoMd.metaTags.score,
            linkStructure: seoMd.linkStructure.score,
          }}
        />

        {/* Score bars */}
        <div className="rounded-lg border p-4 space-y-4">
          <h4 className="font-medium">Detailed Scores</h4>
          <SeoScoreBar score={seoMd.technicalSeo.score} label="Technical SEO" />
          <SeoScoreBar score={seoMd.contentSeo.score} label="Content SEO" />
          <SeoScoreBar score={seoMd.metaTags.score} label="Meta Tags" />
          <SeoScoreBar score={seoMd.linkStructure.score} label="Link Structure" />
        </div>

        {/* Recommendations */}
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-3">Recommendations</h4>
          <div className="space-y-3">
            {seoMd.recommendations.map((rec, index) => (
              <div key={index} className="flex gap-3">
                <div
                  className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    rec.priority === 'high'
                      ? 'bg-red-500'
                      : rec.priority === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                />
                <div>
                  <div className="font-medium text-sm">{rec.title}</div>
                  <div className="text-xs text-muted-foreground">{rec.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optimized content preview */}
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Optimized Content Preview</h4>
          <div className="bg-secondary p-3 rounded-md">
            <div className="font-medium text-sm mb-1">{seoMd.optimizedContent.title}</div>
            <div className="text-xs text-muted-foreground">
              {seoMd.optimizedContent.description}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRobotsTxt = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Generated robots.txt</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCopy(seoData.robotsTxt)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary rounded-md hover:bg-secondary/80"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => handleDownload(seoData.robotsTxt, 'robots.txt')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary rounded-md hover:bg-secondary/80"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>
        <pre className="bg-secondary p-4 rounded-md text-sm overflow-x-auto">
          <code>{seoData.robotsTxt}</code>
        </pre>
      </div>
    );
  };

  const renderLlmTxt = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Generated llm.txt</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCopy(seoData.llmTxt)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary rounded-md hover:bg-secondary/80"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => handleDownload(seoData.llmTxt, 'llm.txt')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary rounded-md hover:bg-secondary/80"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>
        <pre className="bg-secondary p-4 rounded-md text-sm overflow-x-auto">
          <code>{seoData.llmTxt}</code>
        </pre>
      </div>
    );
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab('seo-md')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
            activeTab === 'seo-md'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          SEO.md
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('robots-txt')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
            activeTab === 'robots-txt'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot className="h-4 w-4" />
          robots.txt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('llm-txt')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
            activeTab === 'llm-txt'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="h-4 w-4" />
          llm.txt
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'seo-md' && renderSeoMd()}
        {activeTab === 'robots-txt' && renderRobotsTxt()}
        {activeTab === 'llm-txt' && renderLlmTxt()}
      </div>
    </div>
  );
}

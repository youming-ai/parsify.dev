import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { BookOpen, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '~/components/link';
import { AgentOutput } from '~/components/parser/agent-output';
import { MarkdownOutput } from '~/components/parser/markdown-output';
import { OptimizationStats } from '~/components/parser/optimization-stats';
import { SeoAnalysisOutput } from '~/components/parser/seo-analysis-output';
import { type FormValues, URLAgentForm } from '~/components/parser/url-agent-form';
import { useDocumentHead } from '~/components/seo/head';
import { useAgent } from '~/lib/parser/use-agent';
import { useParse } from '~/lib/parser/use-parse';
import { SEO_CONFIG } from '~/lib/seo-config';

const DEFAULT_PROMPT = '请对这个网页进行全面的SEO分析，并生成SEO.md文档。';

function Home() {
  useDocumentHead({
    title: SEO_CONFIG.DEFAULT_TITLE,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    path: '/',
  });

  const search = useSearch({ strict: false }) as { q?: string };
  const navigate = useNavigate();
  const parse = useParse();
  const agent = useAgent();
  const [submitted, setSubmitted] = useState<FormValues | null>(null);
  const autoFired = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handle = useCallback(
    async (v: FormValues) => {
      setSubmitted(v);
      if (search.q !== v.url) {
        navigate({ to: '/', search: v.url ? { q: v.url } : undefined, replace: true });
      }
      await parse.run(v.url);
    },
    [parse, navigate, search.q]
  );

  useEffect(() => {
    if (autoFired.current) return;
    const q = search.q?.trim();
    if (!q) return;
    autoFired.current = true;
    handle({ url: q, prompt: DEFAULT_PROMPT });
  }, [search.q, handle]);

  useEffect(() => {
    if (parse.data && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [parse.data]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-fires when parse.data changes
  useEffect(() => {
    if (parse.status !== 'success' || !parse.data || !submitted) return;
    agent.run({
      markdown: parse.data.markdown,
      prompt: submitted.prompt,
      outputFormat: 'json',
    });
  }, [parse.data]);

  const isLoading = parse.status === 'loading' || agent.isStreaming;
  const initialUrl = autoFired.current ? (search.q ?? '') : '';

  return (
    <>
      <section className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">SEO Analyzer</h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              Paste a URL. Get comprehensive SEO analysis with SEO.md, robots.txt, and llm.txt.
            </p>
          </div>

          <URLAgentForm onSubmit={handle} disabled={isLoading} initialUrl={initialUrl} />

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {parse.status === 'loading' ? 'Fetching and cleaning…' : 'Analyzing SEO…'}
              </span>
            </div>
          )}
          {parse.status === 'error' && parse.error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {parse.error.message}
            </div>
          )}
        </div>
      </section>

      {parse.data && (
        <section ref={resultsRef} className="mx-auto max-w-5xl space-y-4 px-4 pb-16">
          <OptimizationStats data={parse.data} />
          {agent.seoData ? (
            <SeoAnalysisOutput
              seoData={agent.seoData}
              isStreaming={agent.isStreaming}
              error={agent.error}
            />
          ) : (
            <AgentOutput text={agent.text} isStreaming={agent.isStreaming} error={agent.error} />
          )}
          <MarkdownOutput markdown={parse.data.markdown} />
        </section>
      )}

      {!parse.data && (
        <section className="border-t px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
              What Parsify does
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              <FeatureCard
                title="SEO.md Generation"
                description="Generate comprehensive SEO analysis document inspired by DESIGN.md concept."
              />
              <FeatureCard
                title="Smart robots.txt"
                description="AI-generated robots.txt based on website content and structure."
              />
              <FeatureCard
                title="LLM-optimized llm.txt"
                description="Optimized llm.txt for AI crawlers to better understand your site."
              />
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <BookOpen className="h-4 w-4" />
                API 文档
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border p-5 space-y-2 text-left">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: Home,
});

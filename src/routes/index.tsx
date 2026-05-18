import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AgentOutput } from '~/components/parser/agent-output';
import { MarkdownOutput } from '~/components/parser/markdown-output';
import { OptimizationStats } from '~/components/parser/optimization-stats';
import { type FormValues, URLAgentForm } from '~/components/parser/url-agent-form';
import { useAgent } from '~/lib/parser/use-agent';
import { useParse } from '~/lib/parser/use-parse';

function Home() {
  const parse = useParse();
  const agent = useAgent();
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  async function handle(v: FormValues) {
    setSubmitted(v);
    await parse.run(v.url, v.prompt);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-fires when parse.data changes
  useEffect(() => {
    if (parse.status !== 'success' || !parse.data || !submitted) return;
    agent.run({
      markdown: parse.data.markdown,
      prompt: submitted.prompt,
    });
  }, [parse.data]);

  const isLoading = parse.status === 'loading' || agent.isStreaming;

  return (
    <>
      <section className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Parsify</h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              Paste a URL. Get clean, structured content — instantly ready for your AI.
            </p>
          </div>

          <URLAgentForm onSubmit={handle} disabled={isLoading} />

          {parse.status === 'loading' && (
            <p className="text-sm text-muted-foreground">Fetching and cleaning…</p>
          )}
          {parse.status === 'error' && parse.error && (
            <p className="text-sm text-destructive">{parse.error.message}</p>
          )}
        </div>
      </section>

      {parse.data && (
        <section className="mx-auto max-w-3xl space-y-4 px-4 pb-16">
          <OptimizationStats data={parse.data} />
          <AgentOutput text={agent.text} isStreaming={agent.isStreaming} error={agent.error} />
          <MarkdownOutput markdown={parse.data.markdown} />
        </section>
      )}

      <section className="border-t px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            What Parsify does
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              title="Noise-free content"
              description="Strips ads, navigation, cookie banners, and boilerplate. You get the actual article — nothing else."
            />
            <FeatureCard
              title="80–95% fewer tokens"
              description="Clean Markdown is dramatically smaller than raw HTML. Lower cost, faster inference, better results."
            />
            <FeatureCard
              title="One-step AI summary"
              description="A fast LLM agent reads the cleaned Markdown and streams a summary back — no extra prompting required."
            />
          </div>
        </div>
      </section>
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

import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AgentOutput } from '~/components/parser/agent-output';
import { MarkdownOutput } from '~/components/parser/markdown-output';
import { OptimizationStats } from '~/components/parser/optimization-stats';
import { type FormValues, URLAgentForm } from '~/components/parser/url-agent-form';
import { DEFAULT_MODEL } from '~/lib/parser/models';
import { useAgent } from '~/lib/parser/use-agent';
import { useParse } from '~/lib/parser/use-parse';

function Home() {
  const parse = useParse();
  const agent = useAgent();
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  async function handle(v: FormValues) {
    setSubmitted(v);
    await parse.run(v.url);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-fires when parse.data changes
  useEffect(() => {
    if (parse.status !== 'success' || !parse.data || !submitted) return;
    agent.run({
      markdown: parse.data.markdown,
      apiKey: submitted.apiKey,
      prompt: submitted.prompt,
      model: submitted.model,
    });
  }, [parse.data]);

  const activeModel = submitted?.model ?? DEFAULT_MODEL;

  return (
    <main id="main-content" className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Parsify · URL → Agent</h1>
        <p className="text-sm text-muted-foreground">
          Paste a URL. We clean it with curl.md, then run a Zhipu GLM agent. See how many tokens you
          save.
        </p>
      </header>

      <URLAgentForm onSubmit={handle} disabled={parse.status === 'loading' || agent.isStreaming} />

      {parse.status === 'loading' && <p className="text-sm">Fetching…</p>}
      {parse.status === 'error' && parse.error && (
        <p className="text-sm text-destructive">{parse.error.message}</p>
      )}

      {parse.data && (
        <>
          <OptimizationStats data={parse.data} model={activeModel} />
          <MarkdownOutput markdown={parse.data.markdown} />
          <AgentOutput text={agent.text} isStreaming={agent.isStreaming} error={agent.error} />
        </>
      )}
    </main>
  );
}

export const Route = createFileRoute('/')({
  component: Home,
});

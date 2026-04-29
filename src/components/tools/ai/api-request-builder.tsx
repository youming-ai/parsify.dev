'use client';

import { BYOKNotice } from '@/components/tools/ai/shared/byok-notice';
import { CodeExportTabs } from '@/components/tools/ai/shared/code-export-tabs';
import { ModelSelector } from '@/components/tools/ai/shared/model-selector';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSelectedModel } from '@/hooks/use-selected-model';
import { createLanguageModel } from '@/lib/llm/ai-client';
import {
  buildApiPayload,
  buildCurlCommand,
  buildFetchSnippet,
} from '@/lib/llm/api-request-builder';
import { generateText } from 'ai';
import { useMemo, useState } from 'react';

const PROVIDER_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
};

function normalizeProvider(p: string): 'openai' | 'anthropic' | 'google' | 'deepseek' | 'mistral' {
  if (
    p === 'openai' ||
    p === 'anthropic' ||
    p === 'google' ||
    p === 'deepseek' ||
    p === 'mistral'
  ) {
    return p;
  }
  return 'openai';
}

export function ApiRequestBuilder() {
  const [modelId, setModelId] = useState('gpt-4o');
  const model = useSelectedModel(modelId);
  const provider = model?.provider ?? 'openai';

  const [system, setSystem] = useState('');
  const [user, setUser] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [apiKey, setApiKey] = useState('');

  const [output, setOutput] = useState('');
  const [streaming, setStreaming] = useState(false);

  const normalizedProvider = normalizeProvider(provider);

  const payload = useMemo(
    () =>
      buildApiPayload({
        provider,
        model: modelId,
        system: system || undefined,
        user,
        temperature,
        maxTokens,
      }),
    [provider, modelId, system, user, temperature, maxTokens]
  );

  const payloadString = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  const url = (PROVIDER_URLS[provider] ?? PROVIDER_URLS['openai']) || '';

  const safeApiKey = apiKey || 'YOUR_API_KEY';

  const curlSnippet = useMemo(
    () => buildCurlCommand(url, safeApiKey, payload),
    [url, safeApiKey, payload]
  );

  const fetchSnippet = useMemo(() => buildFetchSnippet(url, payload), [url, payload]);

  // Vercel AI SDK snippet
  const aiSdkSnippet = useMemo(() => {
    return `import { streamText } from 'ai';
import { create${normalizedProvider.charAt(0).toUpperCase() + normalizedProvider.slice(1)} } from '@ai-sdk/${normalizedProvider}';

const provider = create${normalizedProvider.charAt(0).toUpperCase() + normalizedProvider.slice(1)}({ apiKey: '${apiKey || 'YOUR_API_KEY'}' });

const result = await streamText({
  model: provider.chat('${modelId}'),
  system: ${system ? `\`${system}\`` : 'undefined'},
  prompt: \`${user}\`,
  temperature: ${temperature},
  maxTokens: ${maxTokens},
});

for await (const textPart of result.textStream) {
  console.log(textPart);
}`;
  }, [normalizedProvider, modelId, apiKey, system, user, temperature, maxTokens]);

  const sendRequestRaw = async () => {
    if (!apiKey || !user.trim()) return;
    setOutput('');
    setStreaming(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${safeApiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      setOutput(`Status: ${response.status}\n\n${text.slice(0, 5000)}`);
    } catch (err) {
      setOutput(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setStreaming(false);
    }
  };

  const sendRequestAiSdk = async () => {
    if (!apiKey || !user.trim()) return;
    setOutput('');
    setStreaming(true);

    try {
      const languageModel = createLanguageModel({
        provider: normalizedProvider,
        modelId,
        apiKey,
      });

      const result = await generateText({
        model: languageModel,
        system: system || undefined,
        prompt: user,
        temperature,
        maxOutputTokens: maxTokens,
      });

      setOutput(result.text);
    } catch (err) {
      setOutput(err instanceof Error ? err.message : 'AI SDK request failed');
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LLM API Request Builder</CardTitle>
          <CardDescription>
            Build provider-specific LLM API payloads and export curl, TypeScript fetch, or Vercel AI
            SDK snippets. Send requests directly from your browser (BYOK).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelSelector value={modelId} onValueChange={setModelId} />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>System prompt</Label>
              <Input
                value={system}
                onChange={(event) => setSystem(event.target.value)}
                placeholder="Optional system prompt"
              />
            </div>
            <div className="space-y-2">
              <Label>User message</Label>
              <Textarea
                value={user}
                onChange={(event) => setUser(event.target.value)}
                placeholder="Your user message"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Temperature: {temperature}</Label>
              <Slider
                value={[temperature]}
                onValueChange={([v]) => setTemperature(v ?? 0.7)}
                min={0}
                max={2}
                step={0.1}
              />
            </div>
            <div className="space-y-2">
              <Label>Max tokens</Label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(event) => setMaxTokens(Number(event.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payload ({provider})</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={payloadString} readOnly rows={10} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeExportTabs
            examples={{ curl: curlSnippet, fetch: fetchSnippet, ['Vercel AI SDK']: aiSdkSnippet }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              Send request (BYOK)
              <Badge variant="outline" className="text-xs">
                AI SDK powered
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Send requests directly from your browser using raw HTTP or Vercel AI SDK. Your key never
            leaves this tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Key stays in your browser"
            />
          </div>
          <BYOKNotice />

          <Tabs defaultValue="raw">
            <TabsList>
              <TabsTrigger value="raw">Raw HTTP</TabsTrigger>
              <TabsTrigger value="aisdk">Vercel AI SDK</TabsTrigger>
            </TabsList>
            <TabsContent value="raw" className="space-y-3">
              <Button
                type="button"
                onClick={sendRequestRaw}
                disabled={!apiKey || !user.trim() || streaming}
              >
                Send with fetch()
              </Button>
            </TabsContent>
            <TabsContent value="aisdk" className="space-y-3">
              <Button
                type="button"
                onClick={sendRequestAiSdk}
                disabled={!apiKey || !user.trim() || streaming}
              >
                Stream with AI SDK
              </Button>
            </TabsContent>
          </Tabs>

          {output && (
            <div className="space-y-2">
              <Label>Response</Label>
              <Textarea value={output} readOnly rows={12} className="font-mono text-sm" />
            </div>
          )}
        </CardContent>
      </Card>

      <RelatedTools toolId="api-request-builder" />
    </div>
  );
}

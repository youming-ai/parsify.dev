'use client';

import { CodeExportTabs } from '@/components/tools/ai/shared/code-export-tabs';
import { ProviderSelector } from '@/components/tools/ai/shared/provider-selector';
import type { SupportedProvider } from '@/components/tools/ai/shared/provider-selector';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { normalizeToIR, serializeIRToProvider } from '@/lib/llm/prompt-format-converter';
import { useMemo, useState } from 'react';

export function PromptFormatConverter() {
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<SupportedProvider>('openai');

  const outputs = useMemo(() => {
    try {
      const ir = normalizeToIR(input);
      const providers: SupportedProvider[] = ['openai', 'anthropic', 'google'];
      return Object.fromEntries(
        providers.map((p) => [p, JSON.stringify(serializeIRToProvider(ir, p), null, 2)])
      );
    } catch {
      return {
        openai: 'Invalid input',
        anthropic: 'Invalid input',
        google: 'Invalid input',
      };
    }
  }, [input]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Format Converter</CardTitle>
          <CardDescription>
            Convert prompts between OpenAI, Anthropic, and Gemini payloads via a unified
            intermediate representation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <ProviderSelector value={provider} onValueChange={setProvider} />
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder='Paste a prompt in any format (e.g. [{"role":"user","content":"Hello"}])'
              rows={18}
            />
          </div>
          <CodeExportTabs examples={outputs} />
        </CardContent>
      </Card>
      <RelatedTools toolId="prompt-format-converter" />
    </div>
  );
}

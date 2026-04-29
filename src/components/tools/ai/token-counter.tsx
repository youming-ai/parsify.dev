'use client';

import { ModelSelector } from '@/components/tools/ai/shared/model-selector';
import { TokenCounterBar } from '@/components/tools/ai/shared/token-counter-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export function TokenCounter() {
  const [text, setText] = useState('Paste your prompt, messages, or RAG context here.');
  const [modelId, setModelId] = useState('gpt-4o');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Model Token Counter</CardTitle>
          <CardDescription>
            Estimate token usage locally before sending prompts to an LLM provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelSelector value={modelId} onValueChange={setModelId} />
          <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={12} />
          <TokenCounterBar text={text} modelId={modelId} />
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { DEFAULT_MODEL, MODEL_IDS, type ModelId } from '~/lib/parser/models';

const DEFAULT_PROMPT = '请用一段话总结这个网页的核心内容';

export type FormValues = {
  url: string;
  apiKey: string;
  prompt: string;
  model: ModelId;
};

type Props = {
  onSubmit: (v: FormValues) => void;
  disabled?: boolean;
};

export function URLAgentForm({ onSubmit, disabled }: Props) {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          url: url.trim(),
          apiKey: apiKey.trim(),
          prompt: prompt.trim() || DEFAULT_PROMPT,
          model,
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          required
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">Zhipu API key (BYOK · never persisted)</Label>
        <Input
          id="apiKey"
          required
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">Agent prompt</Label>
        <Input
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={DEFAULT_PROMPT}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
          <SelectTrigger id="model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={disabled}>
        Parse & Analyze
      </Button>
    </form>
  );
}

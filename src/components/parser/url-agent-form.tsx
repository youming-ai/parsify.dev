import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

const DEFAULT_PROMPT = '请用一段话总结这个网页的核心内容';

export type FormValues = {
  url: string;
  prompt: string;
};

type Props = {
  onSubmit: (v: FormValues) => void;
  disabled?: boolean;
};

export function URLAgentForm({ onSubmit, disabled }: Props) {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <form
      className="w-full space-y-3 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          url: url.trim(),
          prompt: prompt.trim() || DEFAULT_PROMPT,
        });
      }}
    >
      <div className="flex gap-2">
        <Input
          id="url"
          required
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-12 flex-1 text-base"
        />
        <Button type="submit" disabled={disabled} className="h-12 px-6">
          {disabled ? 'Working…' : 'Parse →'}
        </Button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {showAdvanced ? '▲ Hide prompt' : '▼ Custom prompt'}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-1 rounded-lg border p-4">
            <Label htmlFor="prompt" className="text-xs">
              Agent prompt
            </Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={DEFAULT_PROMPT}
            />
          </div>
        )}
      </div>
    </form>
  );
}

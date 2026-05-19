import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

const DEFAULT_PROMPT = '请用一段话总结这个网页的核心内容';

export type FormValues = {
  url: string;
  prompt: string;
};

type Props = {
  onSubmit: (v: FormValues) => void;
  disabled?: boolean;
  initialUrl?: string;
};

export function URLAgentForm({ onSubmit, disabled, initialUrl = '' }: Props) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
  }, [initialUrl]);

  return (
    <form
      className="w-full space-y-3 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ url: url.trim(), prompt: DEFAULT_PROMPT });
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
    </form>
  );
}

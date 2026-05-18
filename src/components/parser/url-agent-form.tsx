import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

export type FormValues = {
  url: string;
};

type Props = {
  onSubmit: (v: FormValues) => void;
  disabled?: boolean;
};

export function URLAgentForm({ onSubmit, disabled }: Props) {
  const [url, setUrl] = useState('');

  return (
    <form
      className="w-full text-left"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ url: url.trim() });
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

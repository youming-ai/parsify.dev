import { useState } from 'react';

type Props = { markdown: string };

export function MarkdownOutput({ markdown }: Props) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Cleaned markdown</h2>
        <CopyButton text={markdown} />
      </div>
      <pre className="max-h-[40rem] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
        {markdown}
      </pre>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      className="text-xs text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

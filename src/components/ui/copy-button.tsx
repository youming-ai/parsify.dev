import { useState } from 'react';

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

export function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      className={className ?? 'text-xs text-muted-foreground hover:text-foreground'}
      onClick={handleCopy}
    >
      {copied ? 'Copied!' : (label ?? 'Copy')}
    </button>
  );
}

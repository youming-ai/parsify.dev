import { useState } from 'react';
import type { Components } from 'react-markdown';
import Markdown from 'react-markdown';

type Props = { markdown: string };

export function MarkdownOutput({ markdown }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Cleaned markdown</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowRaw((v) => !v)}
          >
            {showRaw ? 'Preview' : 'Raw'}
          </button>
          <CopyButton text={markdown} />
        </div>
      </div>
      {showRaw ? (
        <pre className="max-h-[40rem] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
          {markdown}
        </pre>
      ) : (
        <div className="max-h-[40rem] overflow-auto rounded-md bg-muted p-4 text-sm leading-6">
          <Markdown components={mdComponents}>{markdown}</Markdown>
        </div>
      )}
    </div>
  );
}

const mdComponents: Components = {
  h1: ({ children }) => <h1 className="mb-3 mt-6 text-2xl font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-xl font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-6">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return <code className="block rounded bg-background p-3 font-mono text-xs">{children}</code>;
    }
    return (
      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">{children}</code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-muted-foreground/20" />,
  table: ({ children }) => (
    <div className="mb-3 overflow-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-muted-foreground/20 px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-muted-foreground/20 px-3 py-2">{children}</td>,
};

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

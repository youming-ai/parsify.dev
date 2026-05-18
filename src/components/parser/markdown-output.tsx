type Props = { markdown: string };

export function MarkdownOutput({ markdown }: Props) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Cleaned markdown</h2>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigator.clipboard.writeText(markdown)}
        >
          Copy
        </button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
        {markdown}
      </pre>
    </div>
  );
}

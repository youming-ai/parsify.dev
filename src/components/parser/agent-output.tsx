type Props = {
  text: string;
  isStreaming: boolean;
  error: string | null;
};

export function AgentOutput({ text, isStreaming, error }: Props) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Agent output
          {isStreaming && <span className="ml-2 text-xs text-muted-foreground">· streaming…</span>}
        </h2>
        {text && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigator.clipboard.writeText(text)}
          >
            Copy
          </button>
        )}
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-6">
          {text || (isStreaming ? 'Thinking…' : 'No output yet.')}
        </div>
      )}
    </div>
  );
}

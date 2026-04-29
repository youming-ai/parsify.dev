'use client';

export function BYOKNotice() {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
      Provider calls are sent directly from your browser to the provider. Parsify does not receive
      your API key or request body.
    </div>
  );
}

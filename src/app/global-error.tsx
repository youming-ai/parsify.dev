'use client';

import { Button } from '@/components/ui/button';
import { WarningOctagon } from '@phosphor-icons/react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
            <WarningOctagon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">Application error</h1>
          <p className="mb-2 max-w-2xl text-lg text-muted-foreground">
            A critical error occurred while rendering the application.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="mb-10 max-w-2xl break-all rounded-md bg-muted px-3 py-2 font-mono text-sm text-muted-foreground">
              {error.message}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" onClick={reset}>
              Retry
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="/">Go to Home</a>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

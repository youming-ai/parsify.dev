import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <MainLayout>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">404 - Page Not Found</h1>
        <p className="mb-10 max-w-md text-lg text-muted-foreground">
          Sorry, we couldn't find the tool or page you're looking for. It might have been moved or
          doesn't exist.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/">Back to All Tools</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/data-format/json-tools">Try JSON Tools</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-bold text-2xl text-gray-900 dark:text-white">
            404 - Page Not Found
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Link href="/tools" passHref>
              <Button variant="default" className="w-full">
                Browse Tools
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

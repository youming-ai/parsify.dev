// Type definitions for Cloudflare bindings
export interface Env {
  // Static files binding
  STATIC_FILES: Fetcher;

  // Environment variables
  NEXT_PUBLIC_MICROSOFT_CLARITY_ID: string;
}

// Helper functions for working with Cloudflare resources
export const cloudflareHelpers = {
  // Basic helper functions can be added here as needed
};

// Example usage in Pages Functions:
/*
export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  // Use D1 database
  const users = await cloudflareHelpers.queryDB(env, 'SELECT * FROM users WHERE active = ?', [true]);

  // Use KV cache
  const cachedData = await cloudflareHelpers.getFromCache(env, 'api-key');
  if (!cachedData) {
    const freshData = await fetchSomeData();
    await cloudflareHelpers.setCache(env, 'api-key', freshData, 3600);
  }

  // Use R2 bucket
  await cloudflareHelpers.uploadToR2(env, 'file.txt', new TextEncoder().encode('Hello World'), {
    contentType: 'text/plain'
  });

  return new Response('Success');
};
*/

import { app } from '../../src/server/hono';

export async function onRequest(context: {
  request: Request;
  env: Record<string, string | undefined>;
}) {
  return app.fetch(context.request, context.env);
}

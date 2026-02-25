import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_PROMPT_LENGTH = 12000;
const MAX_BODY_SIZE_BYTES = 50 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const rateLimitStore = new Map<string, number[]>();

function isRateLimited(ip: string, now: number = Date.now()): boolean {
  const existing = rateLimitStore.get(ip) ?? [];
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recentRequests = existing.filter((timestamp) => timestamp > windowStart);

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(ip, recentRequests);
    return true;
  }

  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);
  return false;
}

function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (!forwardedFor) {
    return 'unknown';
  }

  const firstIp = forwardedFor.split(',')[0]?.trim();
  return firstIp || 'unknown';
}

function isAllowedRequestOrigin(request: Request, allowedOrigins: Set<string>): boolean {
  const originHeader = request.headers.get('origin')?.trim();
  if (originHeader) {
    return allowedOrigins.has(originHeader);
  }

  const refererHeader = request.headers.get('referer');
  if (!refererHeader) {
    return false;
  }

  try {
    const refererOrigin = new URL(refererHeader).origin;
    return allowedOrigins.has(refererOrigin);
  } catch {
    return false;
  }
}

const ALLOWED_GROQ_MODELS = new Set([
  DEFAULT_GROQ_MODEL,
  'llama-3.1-8b-instant',
  'deepseek-r1-distill-llama-70b',
  'qwen-qwq-32b',
]);

const groqRequestSchema = z.object({
  prompt: z
    .string({ error: 'Prompt is required.' })
    .trim()
    .min(1, 'Prompt is required.')
    .max(MAX_PROMPT_LENGTH, `Prompt exceeds ${MAX_PROMPT_LENGTH} characters.`),
  model: z.string().trim().min(1).max(100).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env['GROQ_API_KEY'];
  const configuredAllowedOrigin = process.env['ALLOWED_ORIGIN']?.trim() || 'https://parsify.dev';

  const allowedOrigins = new Set([configuredAllowedOrigin]);

  try {
    allowedOrigins.add(new URL(request.url).origin);
  } catch {
    return NextResponse.json({ error: 'Request failed.' }, { status: 400 });
  }

  if (!isAllowedRequestOrigin(request, allowedOrigins)) {
    return NextResponse.json({ error: 'Request failed.' }, { status: 403 });
  }

  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const contentLengthHeader = request.headers.get('content-length')?.trim();
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return NextResponse.json({ error: 'Request failed.' }, { status: 400 });
    }

    if (contentLength > MAX_BODY_SIZE_BYTES) {
      return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
    }
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'Request failed.' }, { status: 500 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request failed.' }, { status: 400 });
  }

  const parsed = groqRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message || 'Invalid request payload.' },
      { status: 400 }
    );
  }

  const model = parsed.data.model ?? DEFAULT_GROQ_MODEL;
  if (!ALLOWED_GROQ_MODELS.has(model)) {
    return NextResponse.json({ error: 'Model is not allowed.' }, { status: 400 });
  }

  try {
    const groq = createGroq({ apiKey });
    const { text } = await generateText({
      model: groq(model),
      temperature: 0.2,
      prompt: parsed.data.prompt,
    });

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: 'Request failed.' }, { status: 500 });
  }
}

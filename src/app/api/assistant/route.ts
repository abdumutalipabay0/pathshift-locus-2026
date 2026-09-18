import { NextRequest, NextResponse } from 'next/server';
import { assistantInput, askAssistant } from '@/lib/admission-assistant';
import { profileSchema } from '@/lib/profile';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const limits = new Map<string, { count: number; until: number }>();
const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
  });
export async function POST(request: NextRequest) {
  let input, profile;
  try {
    const origin = request.headers.get('origin');
    if (!origin || new URL(origin).host !== request.headers.get('host'))
      return reply({ error: 'INVALID_ORIGIN' }, 403);
    const raw = await request.text();
    if (raw.length > 60000) return reply({ error: 'INVALID_INPUT' }, 413);
    input = assistantInput.parse(JSON.parse(raw));
    profile = profileSchema.parse(input.profile);
  } catch {
    return reply({ error: 'INVALID_INPUT' }, 400);
  }
  const now = Date.now();
  for (const [key, value] of limits) if (value.until <= now) limits.delete(key);
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const limit = limits.get(key);
  if ((limit?.count ?? 0) >= 6 || limits.size > 2000) return reply({ error: 'RATE_LIMIT' }, 429);
  limits.set(key, { count: (limit?.count ?? 0) + 1, until: limit?.until ?? now + 60000 });
  try {
    return reply(await askAssistant(profile, input, fetch, { signal: request.signal }));
  } catch {
    return reply({ error: 'ASSISTANT_UNAVAILABLE' }, 503);
  }
}

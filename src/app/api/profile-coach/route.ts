import { NextRequest, NextResponse } from 'next/server';
import { coach, coachInput } from '@/lib/profile-coach';
export const runtime = 'nodejs';
export const maxDuration = 60;
const limits = new Map<string, { count: number; until: number }>();
const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function POST(request: NextRequest) {
  let input;
  try {
    const origin = request.headers.get('origin');
    if (!origin || new URL(origin).host !== request.headers.get('host'))
      return reply({ error: 'INVALID_ORIGIN' }, 403);
    const text = await request.text();
    if (text.length > 22000) return reply({ error: 'INVALID_INPUT' }, 413);
    input = coachInput.parse(JSON.parse(text));
  } catch {
    return reply({ error: 'INVALID_INPUT' }, 400);
  }
  const now = Date.now();
  for (const [k, v] of limits) if (v.until <= now) limits.delete(k);
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const limit = limits.get(key);
  if ((limit?.count ?? 0) >= 8 || limits.size > 2000) return reply({ error: 'RATE_LIMIT' }, 429);
  limits.set(key, { count: (limit?.count ?? 0) + 1, until: limit?.until ?? now + 60000 });
  try {
    return reply(await coach(input, request.signal));
  } catch {
    return reply({ error: 'COACH_UNAVAILABLE' }, 503);
  }
}

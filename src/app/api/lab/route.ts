import { NextRequest, NextResponse } from 'next/server';
import { defaultAdvisorModel } from '@/lib/ai-provider';
import { z } from 'zod';
import { profileSchema } from '@/lib/profile';
import { analyseLab, answerQuestion, simulateFuture, receipts } from '@/lib/future-lab';
import { composerSchema, composerMutation, parseScenario } from '@/lib/scenario-composer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const reply = (value: unknown, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
const requests = new Map<string, { count: number; until: number }>();
export async function GET() {
  return reply({
    composer: !!process.env.CLOSEROUTER_API_KEY,
    model: process.env.SCENARIO_MODEL || defaultAdvisorModel,
  });
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.headers.get('host'))
      return reply({ error: 'Invalid request origin.' }, 403);
    const text = await request.text();
    if (text.length > 60000) return reply({ error: 'Request too large.' }, 413);
    const body = JSON.parse(text),
      profile = profileSchema.parse(body.profile),
      now = new Date().toISOString();
    if (body.action === 'compose') {
      const key = request.headers.get('x-forwarded-for')?.split(',')[0] || 'local';
      const time = Date.now();
      if (requests.size > 2000)
        for (const [k, v] of requests) if (v.until < time) requests.delete(k);
      const limit = requests.get(key);
      if (limit && limit.until > time && limit.count >= 6)
        return reply({ error: 'Please wait a minute before another AI request.' }, 429);
      requests.set(key, {
        count: limit && limit.until > time ? limit.count + 1 : 1,
        until: limit && limit.until > time ? limit.until : time + 60000,
      });
      const draft = await parseScenario(
        z.string().trim().min(4).max(1200).parse(body.text),
        z.enum(['ru', 'kk', 'en']).parse(body.locale),
      );
      let mutation: ReturnType<typeof composerMutation> | null = null,
        issue = '';
      try {
        mutation = composerMutation(profile, draft);
        simulateFuture(profile, mutation, now);
      } catch (e) {
        issue = e instanceof Error ? e.message : 'Invalid scenario.';
      }
      return reply({ draft, mutation, issue });
    }
    if (body.action === 'preview') {
      const mutation = body.draft
        ? composerMutation(profile, composerSchema.parse(body.draft))
        : z.record(z.string(), z.unknown()).parse(body.mutation);
      const simulation = simulateFuture(profile, mutation, now);
      return reply({ simulation, receipts: receipts(simulation.after, simulation.before) });
    }
    if (body.action === 'answer')
      return reply({ profile: answerQuestion(profile, z.string().parse(body.field), body.value) });
    const saved = z
      .array(
        z.object({
          id: z.string().max(100),
          name: z.string().max(80),
          savedAt: z.string().max(40),
          mutation: z.record(z.string(), z.unknown()),
        }),
      )
      .max(3)
      .parse(body.saved || []);
    return reply(
      analyseLab(
        profile,
        z
          .string()
          .max(60)
          .parse(body.target || 'waterloo'),
        now,
        saved,
      ),
    );
  } catch (e) {
    return reply(
      {
        error:
          e instanceof z.ZodError
            ? 'Check the profile fields and enter valid values.'
            : e instanceof Error && !(e instanceof SyntaxError)
              ? e.message
              : 'Invalid request.',
      },
      400,
    );
  }
}

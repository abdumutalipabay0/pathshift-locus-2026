import { NextRequest, NextResponse } from 'next/server';
import { dataset, evaluate, simulate } from '@/lib/engine';
import { demoProfile, profileSchema } from '@/lib/profile';
import { z } from 'zod';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
export async function GET(_: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path[0] === 'programs') {
    const p = path[1] ? dataset.programs.find((p) => p.id === path[1]) : null;
    return path[1]
      ? p
        ? reply({ program: p, facts: dataset.facts.filter((f) => f.scope.program === p.id) })
        : reply({ error: 'Program not found' }, 404)
      : reply({ programs: dataset.programs, facts: dataset.facts, version: dataset.version });
  }
  if (path[0] === 'demo-profiles')
    return reply({
      profiles: [demoProfile],
      note: 'Synthetic applicant; dates, component scores and course counts are demo assumptions.',
    });
  return reply({ error: 'Not found' }, 404);
}
async function handle(request: NextRequest, path: string[]) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 100000)
      return reply({ error: 'Request too large' }, 413);
    const body = await request.json();
    const profile = profileSchema.parse(body.profile);
    const now = new Date().toISOString();
    if (path[0] === 'simulate') {
      const mutation = z.record(z.string(), z.unknown()).parse(body.mutation);
      return reply(simulate(profile, mutation, now));
    }
    if (path[0] === 'evaluate' || path[0] === 'roadmap') {
      if (path[1] === 'tasks') {
        const task = evaluate(profile, now).roadmap.find((t) => t.id === path[2]);
        if (!task) return reply({ error: 'Task is not in the current roadmap' }, 404);
        if (task.requires_value)
          return reply(
            {
              error: 'Enter the actual result or AIF submission in your profile, then recalculate.',
            },
            422,
          );
        if (task.dependencies.some((id) => !profile.completed.includes(id)))
          return reply({ error: 'Complete the prerequisite steps first.' }, 422);
        const complete = z.boolean().parse(body.complete);
        profile.completed = complete
          ? [...new Set([...profile.completed, task.id])]
          : profile.completed.filter((id) => id !== task.id);
      }
      return reply(evaluate(profile, now));
    }
    return reply({ error: 'Not found' }, 404);
  } catch (error) {
    return reply(
      {
        error:
          error instanceof z.ZodError
            ? 'Check the profile fields and enter valid values.'
            : error instanceof Error
              ? error.message
              : 'Invalid request',
      },
      400,
    );
  }
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handle(request, (await params).path);
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handle(request, (await params).path);
}

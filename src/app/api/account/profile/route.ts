import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/server';
import { readAccountProfile, writeAccountProfile } from '@/lib/account-profile';
import { profileSchema } from '@/lib/profile';
export const dynamic = 'force-dynamic';
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  return NextResponse.json(
    { profile: await readAccountProfile(user.id) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin');
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin && new URL(origin).host === request.headers.get('host'));
  } catch {}
  if (!sameOrigin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const raw = await request.text();
  if (raw.length > 60000) return NextResponse.json({ error: 'Profile too large' }, { status: 413 });
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = profileSchema.safeParse(input.profile);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
  return NextResponse.json(
    { profile: await writeAccountProfile(user.id, parsed.data) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

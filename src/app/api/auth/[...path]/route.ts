import { getAuth, accountsConfigured } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const unavailable = () =>
  NextResponse.json(
    { message: 'Account service is not configured', code: 'ACCOUNTS_UNAVAILABLE' },
    { status: 503 },
  );
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!accountsConfigured()) return unavailable();
  return getAuth().handler().GET(request, context);
}
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!accountsConfigured()) return unavailable();
  return getAuth().handler().POST(request, context);
}

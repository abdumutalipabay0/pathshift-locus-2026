import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';
export function accountsConfigured() {
  return Boolean(
    process.env.NEON_AUTH_BASE_URL &&
    process.env.NEON_AUTH_COOKIE_SECRET &&
    process.env.DATABASE_URL,
  );
}
export function getAuth() {
  if (!accountsConfigured()) throw new Error('Account service is not configured');
  return createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET!, sessionDataTtl: 60 },
  });
}
export async function currentUser() {
  if (!accountsConfigured()) return null;
  const { data, error } = await getAuth().getSession();
  if (error) throw new Error('Account service is temporarily unavailable');
  return data?.user ?? null;
}

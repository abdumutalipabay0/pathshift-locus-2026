import 'server-only';
import { neon } from '@neondatabase/serverless';
import { profileSchema } from './profile';
import type { Profile } from './types';
function database() {
  if (!process.env.DATABASE_URL) throw new Error('Account storage is not configured');
  return neon(process.env.DATABASE_URL);
}
export async function readAccountProfile(userId: string): Promise<Profile | null> {
  const sql = database();
  const rows = await sql`SELECT profile FROM pathshift_profiles WHERE user_id = ${userId}`;
  return rows.length ? profileSchema.parse(rows[0].profile) : null;
}
export async function writeAccountProfile(userId: string, value: unknown) {
  const profile = profileSchema.parse(value);
  const sql = database();
  await sql`INSERT INTO pathshift_profiles (user_id, profile) VALUES (${userId}, ${JSON.stringify(profile)}::jsonb)
    ON CONFLICT (user_id) DO UPDATE SET profile = EXCLUDED.profile, updated_at = now()`;
  return profile;
}

import { redirect } from 'next/navigation';
import Workspace from '@/components/workspace';
import { currentUser } from '@/lib/auth/server';
import { readAccountProfile } from '@/lib/account-profile';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect('/auth/sign-in');
  const profile = await readAccountProfile(user.id);
  if (!profile) redirect('/onboarding');
  return <Workspace key={user.id} accountId={user.id} initialProfile={profile} />;
}

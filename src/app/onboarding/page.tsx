import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/server';
import { readAccountProfile } from '@/lib/account-profile';
import Onboarding from '@/components/onboarding';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect('/auth/sign-in');
  if (await readAccountProfile(user.id)) redirect('/app');
  return <Onboarding userId={user.id} name={user.name} />;
}

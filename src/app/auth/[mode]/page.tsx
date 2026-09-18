import { notFound, redirect } from 'next/navigation';
import { accountsConfigured, currentUser } from '@/lib/auth/server';
import AuthScreen from '@/components/auth-screen';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (
    mode !== 'sign-in' &&
    mode !== 'sign-up' &&
    mode !== 'forgot-password' &&
    mode !== 'reset-password'
  )
    notFound();
  if ((mode === 'sign-in' || mode === 'sign-up') && (await currentUser())) redirect('/app');
  return <AuthScreen mode={mode} enabled={accountsConfigured()} />;
}

'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { LanguagePicker, useLocale } from './locale-provider';
import { authClient } from '@/lib/auth/client';
export function SignOut() {
  const router = useRouter();
  const navigate = (path: string) => {
    router.replace(path);
    router.refresh();
  };
  const { tr } = useLocale();
  return (
    <button
      className="btn secondary small-btn"
      onClick={async () => {
        const result = await authClient.signOut();
        if (!result.error) navigate('/');
        else window.alert(tr('Could not sign out. Please try again.'));
      }}
    >
      {tr('Sign out')}
    </button>
  );
}
export default function EntryHeader({ account = false }: { account?: boolean }) {
  const { tr } = useLocale();
  return (
    <header className="entry-header">
      <a className="skip-link" href="#main">
        {tr('Skip to main content')}
      </a>
      <Link href="/" className="brand">
        <span className="brand-symbol">
          <ArrowUpRight />
        </span>
        pathshift<span className="brand-dot">.</span>
      </Link>
      <nav aria-label={tr('Account navigation')}>
        <LanguagePicker />
        {account ? (
          <SignOut />
        ) : (
          <Link className="btn secondary small-btn" href="/auth/sign-in">
            {tr('Sign in')}
          </Link>
        )}
      </nav>
    </header>
  );
}

'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { newAccountProfile, restoreOnboardingDraft } from '@/lib/onboarding';
import ProfileWizard from './profile-wizard';
import EntryHeader from './entry-header';
import { useLocale } from './locale-provider';
import type { Profile } from '@/lib/types';
const subscribe = () => () => {};
export default function Onboarding(props: { userId: string; name: string }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!hydrated)
    return (
      <div className="entry-page">
        <EntryHeader account />
      </div>
    );
  return <OnboardingForm {...props} />;
}
function OnboardingForm({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const navigate = (path: string) => {
    router.replace(path);
    router.refresh();
  };
  const { tr } = useLocale();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [initial] = useState<Profile>(() => {
    const fallback = newAccountProfile(name);
    try {
      return restoreOnboardingDraft(
        sessionStorage.getItem('pathshift-onboarding:' + userId),
        fallback,
      );
    } catch {
      return fallback;
    }
  });
  const draft = useCallback(
    (profile: Profile, step: number) => {
      try {
        sessionStorage.setItem('pathshift-onboarding:' + userId, JSON.stringify({ profile, step }));
      } catch {}
    },
    [userId],
  );
  return (
    <div className="entry-page">
      <EntryHeader account />
      <main className="onboarding-main">
        <p className="eyebrow">{tr('ACCOUNT CREATED · NEXT: YOUR PROFILE')}</p>
        <p className="muted">
          {tr(
            'Complete these steps to open your personal workspace. Missing scores can stay unanswered.',
          )}
        </p>
        {error && (
          <p role="alert" className="error-box">
            {tr(error)}
          </p>
        )}
        <fieldset disabled={busy} className="onboarding-fieldset">
          <ProfileWizard
            requireAllSteps
            initial={initial}
            onDraft={draft}
            onCancel={() => navigate('/')}
            onSave={async (profile) => {
              setBusy(true);
              setError('');
              try {
                const response = await fetch('/api/account/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ profile }),
                });
                if (!response.ok) throw new Error();
                sessionStorage.removeItem('pathshift-onboarding:' + userId);
                navigate('/app');
              } catch {
                setError('Your profile could not be saved. Please try again.');
                setBusy(false);
              }
            }}
          />
        </fieldset>
        {busy && <p role="status">{tr('Saving your profile…')}</p>}
      </main>
    </div>
  );
}

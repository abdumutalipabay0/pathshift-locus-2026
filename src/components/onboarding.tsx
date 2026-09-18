'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore, useRef } from 'react';
import { newAccountProfile, restoreOnboardingDraft } from '@/lib/onboarding';
import { profileSchema } from '@/lib/profile';
import EntryHeader from './entry-header';
import { useLocale } from './locale-provider';
import { InterestPicker } from './applicant-portfolio';
import { emptyBackground, planningInterest } from '@/lib/background';
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
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const [profile, setProfile] = useState<Profile>(() => {
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
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'pathshift-onboarding:' + userId,
        JSON.stringify({ profile, step: 0 }),
      );
    } catch {}
  }, [profile, userId]);
  return (
    <div className="entry-page">
      <EntryHeader account />
      <main id="main" className="onboarding-main">
        <section className="quick-start panel">
          <p className="eyebrow">{tr('ONE LAST STEP')}</p>
          <h1>{tr('Where would you like to study?')}</h1>
          <p className="muted">
            {tr(
              'Choose your study destination. Add grades and budget later to check requirements and costs.',
            )}
          </p>
          <p className="small muted">
            {tr('Current focus: Computer Science in the US and Canada, Fall 2027.')}
          </p>
          {error && (
            <p ref={errorRef} tabIndex={-1} role="alert" className="error-box">
              {tr(error)}
            </p>
          )}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              if (!profile.countries.length) {
                setError('Choose at least one country.');
                return;
              }
              const valid = profileSchema.safeParse(profile);
              if (!valid.success) {
                setError('Check the profile fields and enter valid values.');
                return;
              }
              setBusy(true);
              setError('');
              try {
                const response = await fetch('/api/account/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ profile: valid.data }),
                });
                if (!response.ok) throw new Error();
                sessionStorage.removeItem('pathshift-onboarding:' + userId);
                navigate('/app?view=portfolio');
              } catch {
                setError('Your profile could not be saved. Please try again.');
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy} className="onboarding-fieldset">
              {!name && (
                <label>
                  {tr('Your name ')}
                  <input
                    required
                    maxLength={60}
                    autoComplete="given-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </label>
              )}
              <div className="form-grid">
                <label>
                  {tr('Age ')}
                  <input
                    required
                    type="number"
                    min={10}
                    max={100}
                    value={profile.age || ''}
                    onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  />
                </label>
                <label>
                  {tr('Citizenship ')}
                  <input
                    required
                    maxLength={80}
                    autoComplete="country-name"
                    value={profile.citizenship}
                    onChange={(e) => setProfile({ ...profile, citizenship: e.target.value })}
                  />
                </label>
              </div>
              <fieldset className="quick-countries">
                <legend>{tr('Choose where to study')}</legend>
                {['US', 'Canada'].map((country) => (
                  <label key={country}>
                    <input
                      type="checkbox"
                      checked={profile.countries.includes(country)}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          countries: e.target.checked
                            ? [...profile.countries, country]
                            : profile.countries.filter((c) => c !== country),
                        })
                      }
                    />
                    {tr(country)}
                  </label>
                ))}
              </fieldset>
              <InterestPicker
                value={profile.background || emptyBackground}
                onChange={(background) =>
                  setProfile({
                    ...profile,
                    background,
                    interest: planningInterest(background, profile.interest),
                  })
                }
              />
              <button className="btn primary" type="submit">
                {tr(busy ? 'Saving your profile…' : 'Build my profile')}
              </button>
              <p className="small muted">
                {tr(
                  'No test scores or documents needed to start. This first list is for exploration, not a confirmation of eligibility.',
                )}
              </p>
            </fieldset>
          </form>
        </section>
        {busy && <p role="status">{tr('Saving your profile…')}</p>}
      </main>
    </div>
  );
}

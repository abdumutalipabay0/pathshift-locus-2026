'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useSyncExternalStore } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useLocale } from './locale-provider';
import EntryHeader from './entry-header';
const subscribe = () => () => {};
export default function AuthScreen({
  mode,
  enabled,
}: {
  mode: 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';
  enabled: boolean;
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const router = useRouter();
  const navigate = (path: string) => {
    router.replace(path);
    router.refresh();
  };
  const { tr } = useLocale();
  const signup = mode === 'sign-up',
    forgot = mode === 'forgot-password',
    reset = mode === 'reset-password';
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [visible, setVisible] = useState(false);
  const title = signup
    ? 'Create your account'
    : forgot
      ? 'Reset your password'
      : reset
        ? 'Choose a new password'
        : 'Welcome back';
  return (
    <div className="entry-page">
      <EntryHeader />
      <main id="main" className="auth-layout">
        <aside>
          <p className="eyebrow">{tr('YOUR ADMISSION JOURNEY')}</p>
          <h1>{tr('Your starting point. Your way forward.')}</h1>
          <p>
            {tr(
              'First create an account. Then add your own profile to unlock your personal workspace.',
            )}
          </p>
          <Link href="/demo">
            {tr('Just looking? Explore the demo')} <ArrowRight size={16} />
          </Link>
          <Image
            className="auth-illustration"
            src="/illustrations/starting-point.png"
            width={1254}
            height={1254}
            sizes="(max-width: 650px) 160px, 420px"
            alt=""
          />
        </aside>
        <section className="auth-card" aria-labelledby="auth-title">
          <h2 id="auth-title">{tr(title)}</h2>
          <p className="muted">
            {tr(
              signup ? 'Use an email address you can access.' : 'Continue your admission journey.',
            )}
          </p>
          {!enabled && (
            <p className="notice" role="status">
              {tr(
                'Registration is not open yet. Account setup is being completed. You can explore the demo meanwhile.',
              )}
            </p>
          )}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy || !enabled) return;
              setBusy(true);
              setError('');
              setMessage('');
              const data = new FormData(event.currentTarget),
                email = String(data.get('email') || '').trim(),
                password = String(data.get('password') || ''),
                name = String(data.get('name') || '').trim();
              try {
                if (forgot) {
                  const result = await authClient.requestPasswordReset({
                    email,
                    redirectTo: window.location.origin + '/auth/reset-password',
                  });
                  if (result.error) throw new Error('reset');
                  setMessage(
                    'If an account exists for this email, password reset instructions will arrive shortly.',
                  );
                } else if (reset) {
                  const token = new URL(window.location.href).searchParams.get('token');
                  if (!token) {
                    setError('This reset link is incomplete. Request a new one.');
                    return;
                  }
                  const result = await authClient.resetPassword({ newPassword: password, token });
                  if (result.error) {
                    setError('This reset link has expired or is invalid. Request a new one.');
                    return;
                  }
                  navigate('/auth/sign-in');
                } else {
                  const result = signup
                    ? await authClient.signUp.email({
                        email,
                        password,
                        name,
                        callbackURL: window.location.origin + '/onboarding',
                      })
                    : await authClient.signIn.email({
                        email,
                        password,
                        callbackURL: window.location.origin + '/app',
                      });
                  if (result.error) {
                    setError(
                      signup
                        ? 'Could not create the account. Check your details, or sign in if you already have an account.'
                        : 'Could not sign in. Check your email and password, and verify your email if requested.',
                    );
                    return;
                  }
                  const session = await authClient.getSession();
                  if (session.data?.user) navigate('/app');
                  else setMessage('Check your inbox to verify your email, then sign in.');
                }
              } catch {
                setError('The account service could not be reached. Please try again.');
              } finally {
                setBusy(false);
              }
            }}
          >
            {signup && (
              <label>
                {tr('Your name')}
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={60}
                  disabled={!enabled || busy || !hydrated}
                />
              </label>
            )}
            {!reset && (
              <label>
                {tr('Email address')}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  disabled={!enabled || busy || !hydrated}
                />
              </label>
            )}
            {!forgot && (
              <label>
                {tr('Password')}
                <span className="password-field">
                  <input
                    name="password"
                    aria-label={tr('Password')}
                    type={visible ? 'text' : 'password'}
                    autoComplete={signup || reset ? 'new-password' : 'current-password'}
                    required
                    minLength={signup || reset ? 8 : 1}
                    maxLength={128}
                    disabled={!enabled || busy || !hydrated}
                  />
                  <button
                    type="button"
                    disabled={!hydrated}
                    aria-label={tr(visible ? 'Hide password' : 'Show password')}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
                {(signup || reset) && (
                  <small>
                    {tr('Use at least 8 characters. A longer, unique password is better.')}
                  </small>
                )}
              </label>
            )}
            {signup && (
              <p className="small muted">
                {tr('Your admission profile is stored with your account.')}{' '}
                <Link href="/privacy">{tr('Privacy')}</Link>
              </p>
            )}
            {error && (
              <p className="error-box" role="alert">
                {tr(error)}
              </p>
            )}
            {message && (
              <p className="notice" role="status">
                {tr(message)}
              </p>
            )}
            <button className="btn primary" disabled={!enabled || busy || !hydrated}>
              {tr(
                busy
                  ? 'Please wait…'
                  : signup
                    ? 'Create account'
                    : forgot
                      ? 'Send reset instructions'
                      : reset
                        ? 'Save new password'
                        : 'Sign in',
              )}
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="auth-links">
            <Link href={signup ? '/auth/sign-in' : '/auth/sign-up'}>
              {tr(signup ? 'Already have an account? Sign in' : 'New here? Create an account')}
            </Link>
            {!signup && <Link href="/auth/forgot-password">{tr('Forgot your password?')}</Link>}
          </div>
          <Link className="auth-demo-link" href="/demo">
            {tr('Explore the demo')}
          </Link>
        </section>
      </main>
    </div>
  );
}

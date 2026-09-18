'use client';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, GitBranch, ShieldCheck, Route, Check } from 'lucide-react';
import EntryHeader from './entry-header';
import { useLocale } from './locale-provider';
export default function Landing() {
  const { tr } = useLocale();
  return (
    <div className="entry-page">
      <EntryHeader />
      <main id="main" className="landing-main">
        <section className="landing-hero">
          <div className="landing-intro">
            <p className="eyebrow">{tr('YOUR NEXT CHAPTER, WITH A PLAN')}</p>
            <h1>
              {tr('A university goal.')}
              <br />
              <span>{tr('More than one way forward.')}</span>
            </h1>
            <p className="landing-lead">
              {tr(
                'Turn your grades, budget and ambitions into a clear admission plan. See what fits today — and what could change tomorrow.',
              )}
            </p>
            <div className="landing-actions">
              <Link href="/auth/sign-up" className="btn primary">
                {tr('Create my profile')}
                <ArrowRight size={18} />
              </Link>
              <Link href="/demo" className="btn secondary">
                {tr('Explore the demo')}
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <p className="landing-note">
              {tr('Your account. Your own profile. No borrowed scores.')}
            </p>
          </div>
          <div className="landing-sheet">
            <div className="between">
              <span className="eyebrow">{tr('HOW A PATH TAKES SHAPE')}</span>
              <GitBranch size={22} />
            </div>
            <div className="landing-origin">
              <span className="landing-dot" />
              <div>
                <strong>{tr('Your starting point')}</strong>
                <p>{tr('Grades · language · budget · preferences')}</p>
              </div>
            </div>
            <div className="landing-branches">
              <article>
                <span className="mini-badge">{tr('TODAY')}</span>
                <h2>{tr('Understand your options')}</h2>
                <p>{tr('See requirements you meet and the details still needed.')}</p>
              </article>
              <article className="landing-alternative">
                <span className="mini-badge">{tr('WHAT IF?')}</span>
                <h2>{tr('Try a different future')}</h2>
                <p>
                  {tr('Change a planned score or budget. Compare the effect before committing.')}
                </p>
              </article>
            </div>
            <div className="landing-outcome">
              <Route size={22} />
              <div>
                <strong>{tr('One clear next action')}</strong>
                <p>{tr('A roadmap with deadlines and reasons you can inspect.')}</p>
              </div>
              <Check size={20} />
            </div>
            <p className="landing-caption">
              {tr('An illustration of the journey, not an admission prediction.')}
            </p>
          </div>
        </section>
        <section className="landing-scope">
          <ShieldCheck size={21} />
          <p>
            {tr(
              'Built around Computer Science, international first-year entry and Fall 2027. Start with six featured universities; inspect the evidence behind every result.',
            )}
          </p>
        </section>
        <section className="landing-process" aria-labelledby="journey-heading">
          <div>
            <p className="eyebrow">{tr('FROM QUESTION TO NEXT STEP')}</p>
            <h2 id="journey-heading">{tr('Make the plan yours.')}</h2>
          </div>
          <ol>
            {[
              ['Create your account', 'Keep your admission profile linked to your account.'],
              [
                'Tell us where you are',
                'Add your actual results and preferences. Leave unfinished tests unanswered.',
              ],
              [
                'Explore, compare, act',
                'Test possible futures, choose alternatives and follow your roadmap.',
              ],
            ].map(([title, body], i) => (
              <li key={title}>
                <span>{i + 1}</span>
                <h3>{tr(title)}</h3>
                <p>{tr(body)}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="landing-finish">
          <div>
            <h2>{tr('Start with your reality. Explore your possibilities.')}</h2>
            <p>
              {tr(
                'PathShift explains requirements and possible actions. Universities make the admission decisions.',
              )}
            </p>
          </div>
          <Link className="btn primary" href="/auth/sign-up">
            {tr('Create my profile')}
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="entry-footer">
        <span>PathShift · LOCUS 2026</span>
        <Link href="/demo?view=sources">{tr('Sources & evidence')}</Link>
        <Link href="/privacy">{tr('Privacy')}</Link>
      </footer>
    </div>
  );
}

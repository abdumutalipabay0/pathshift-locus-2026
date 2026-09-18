'use client';
import Link from 'next/link';
import Image from 'next/image';
import campus from '../../public/illustrations/campus-paths.png';
import { useState, useSyncExternalStore } from 'react';
import './landing.css';
import { ArrowUpRight, ArrowRight, ShieldCheck, Route, Compass, Columns3 } from 'lucide-react';
import EntryHeader from './entry-header';
import { useLocale } from './locale-provider';
const subscribe = () => () => {};
export default function Landing() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { tr } = useLocale();
  const [stage, setStage] = useState(0);
  const routes = [
    {
      title: 'Explore',
      icon: Compass,
      heading: 'Understand your options',
      body: 'See requirements you meet and the details still needed.',
      view: 'map',
    },
    {
      title: 'Compare',
      icon: Columns3,
      heading: 'Compare paths',
      body: 'Compare requirements, costs and deadlines side by side.',
      view: 'compare',
    },
    {
      title: 'Plan',
      icon: Route,
      heading: 'One clear next action',
      body: 'A roadmap with deadlines and reasons you can inspect.',
      view: 'roadmap',
    },
  ];
  const selected = routes[stage];
  return (
    <div className="entry-page landing-page">
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
          <div className="landing-art">
            <Image
              className="atlas-campus"
              src={campus}
              placeholder="blur"
              width={1536}
              height={1024}
              sizes="(max-width: 760px) 100vw, 60vw"
              alt=""
              preload
            />
            <p className="landing-caption">
              {tr('An illustration of the journey, not an admission prediction.')}
            </p>
          </div>
        </section>
        <section className="route-atlas" aria-labelledby="atlas-heading">
          <div className="atlas-selector">
            <p className="eyebrow" id="atlas-heading">
              {tr('HOW A PATH TAKES SHAPE')}
            </p>
            <div className="atlas-branches" role="group" aria-label={tr('Choose a direction')}>
              {routes.map((route, index) => (
                <button
                  key={route.title}
                  type="button"
                  disabled={!hydrated}
                  aria-pressed={stage === index}
                  onClick={() => setStage(index)}
                >
                  <route.icon size={22} />
                  <span>{tr(route.title)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="atlas-detail" aria-live="polite" aria-atomic="true">
            <div key={stage} className={`atlas-detail-content${stage ? ' atlas-switched' : ''}`}>
              <span className="eyebrow">{tr('YOUR NEXT MOVE')}</span>
              <h2>{tr(selected.heading)}</h2>
              <p>{tr(selected.body)}</p>
              <Link href={`/demo?view=${selected.view}`}>
                {tr('Try this in the demo')}
                <ArrowUpRight size={18} />
              </Link>
            </div>
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

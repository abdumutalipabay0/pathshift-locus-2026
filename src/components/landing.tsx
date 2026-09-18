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
      heading: 'Read university requirements',
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
      heading: 'Get an application checklist',
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
            <p className="eyebrow">{tr('PLAN YOUR UNIVERSITY APPLICATION')}</p>
            <h1>
              {tr('Which universities fit')}
              <br />
              <span>{tr('your grades and budget?')}</span>
            </h1>
            <p className="landing-lead">
              {tr(
                'Find suitable universities and what you need to apply. Computer Science · US and Canada.',
              )}
            </p>
            <div className="landing-actions">
              <Link href="/auth/sign-up" className="btn primary">
                {tr('Find universities')}
                <ArrowRight size={18} />
              </Link>
              <Link href="/demo" className="btn secondary">
                {tr('Explore the demo')}
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <p className="landing-note">
              {tr('Start with your country. Add grades and budget at your own pace.')}
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
          </div>
        </section>
        <section className="landing-problem">
          <h2>{tr('Too many university tabs. Still no clear plan?')}</h2>
          <p>
            {tr(
              'One website lists test scores, another explains tuition, and deadlines are somewhere else. PathShift brings them together and connects them to your own situation.',
            )}
          </p>
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
                {tr('See an example')}
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
        <section className="landing-finish">
          <div>
            <h2>{tr('Choose your first university. See your next step.')}</h2>
            <p>
              {tr(
                'PathShift explains requirements and possible actions. Universities make the admission decisions.',
              )}
            </p>
          </div>
          <Link className="btn primary" href="/auth/sign-up">
            {tr('Find universities')}
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

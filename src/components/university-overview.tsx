'use client';
import { ArrowRight, BookOpen, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import type { Result } from '@/lib/types';
import { universityStories, storyCheckedAt } from '@/lib/university-stories';
import Image from 'next/image';
import profiles from '@/lib/university-profiles.json';
import media from '@/lib/university-media.json';
import { useLocale } from './locale-provider';
export default function UniversityOverview({
  result,
  onCheck,
  onAsk,
}: {
  result: Result;
  onCheck: () => void;
  onAsk: () => void;
}) {
  const { tr, dateLabel } = useLocale();
  const story = universityStories[result.program.id];
  const identity = profiles[result.program.id as keyof typeof profiles];
  if (!identity) return null;
  return (
    <section className="university-overview" aria-label={tr('About this university')}>
      <div className="university-introduction">
        <h3>{story ? tr(story.tagline) : tr('Meet the university')}</h3>
        {story && <p>{tr(story.intro)}</p>}
      </div>
      <section className="university-history">
        <div className="history-year">{identity.year}</div>
        <div>
          <h3>{tr('The story behind the name')}</h3>
          <p>{tr(identity.history)}</p>
          <a href={identity.historySource} target="_blank" rel="noreferrer">
            {tr('Read the university history')} <ExternalLink size={13} />
          </a>
        </div>
      </section>
      <section className="university-milestone">
        <h3>{tr('Known for')}</h3>
        <p>{tr(identity.milestone)}</p>
        <a href={identity.milestoneSource} target="_blank" rel="noreferrer">
          {tr('University source')} <ExternalLink size={13} />
        </a>
      </section>
      <div className="university-highlights">
        {(story?.highlights || []).map((item) => (
          <article key={item.title}>
            <BookOpen size={20} aria-hidden="true" />
            <h4>{tr(item.title)}</h4>
            <p>{tr(item.body)}</p>
            <a href={item.url} target="_blank" rel="noreferrer">
              {tr('University source')}
              <ExternalLink size={13} />
            </a>
          </article>
        ))}
      </div>
      {story && (
        <div className="university-consider">
          <div>
            <span className="eyebrow">{tr('Would you enjoy studying here?')}</span>
            <p>{tr(story.consider)}</p>
            <span className="small muted">
              {tr('A guide to choosing, not an admission prediction.')}
            </span>
          </div>
          <div>
            <h4>{tr('Before you decide')}</h4>
            <p>{tr(story.note)}</p>
            <a href={story.url} target="_blank" rel="noreferrer">
              {tr('Explore the official programme')}
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}
      <div className="university-next">
        <div>
          <strong>{tr('Interested? Check your starting point.')}</strong>
          <p>{tr('See how your results compare with the checked requirements.')}</p>
        </div>
        <button className="btn primary" onClick={onCheck}>
          {tr('Check my profile')}
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="university-overview-footer">
        <button className="text-button" onClick={onAsk}>
          <Sparkles size={15} />
          {tr('Ask about this university')}
        </button>
        <span className="small muted">
          {tr('University overview checked')} · {dateLabel(storyCheckedAt)}
        </span>
      </div>
    </section>
  );
}

export function UniversityBanner({ result }: { result: Result }) {
  const { tr } = useLocale();
  const asset = media[result.program.id as keyof typeof media];
  if (!asset) return null;
  return (
    <header className="university-banner">
      <div className="university-cover">
        <Image
          src={asset.cover}
          alt={tr('University photograph') + ' · ' + result.program.name}
          fill
          sizes="(max-width: 700px) 100vw, 1000px"
          priority
        />
        <a href={asset.coverSource} target="_blank" rel="noreferrer">
          {tr('Photo source')} <ExternalLink size={11} />
        </a>
      </div>
      <div className="university-banner-body">
        <div className={'university-official-logo ' + (asset.dark ? 'dark' : '')}>
          <Image src={asset.logo} alt={result.program.name} width={180} height={86} unoptimized />
        </div>
        <div>
          <p className="university-place">
            <MapPin size={15} />
            {tr(result.program.city)} · {tr(result.program.country)}
          </p>
          <p className="university-title">{result.program.name}</p>
          <p>{tr(result.program.degree)}</p>
        </div>
      </div>
    </header>
  );
}

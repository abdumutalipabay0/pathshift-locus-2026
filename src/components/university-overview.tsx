'use client';
import { ArrowRight, BookOpen, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import type { Result } from '@/lib/types';
import { universityStories, storyCheckedAt } from '@/lib/university-stories';
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
  if (!story) return null;
  return (
    <section className="university-overview" aria-label={tr('About this university')}>
      <div className="university-identity">
        <div className="university-monogram" aria-hidden="true">
          {result.program.initials}
        </div>
        <div>
          <p className="university-place">
            <MapPin size={15} />
            {tr(result.program.city)} · {tr(result.program.country)}
          </p>
          <h3>{tr(story.tagline)}</h3>
          <p>{tr(story.intro)}</p>
        </div>
      </div>
      <div className="university-highlights">
        {story.highlights.map((item) => (
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

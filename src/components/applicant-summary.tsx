'use client';
import type { Evaluation } from '@/lib/types';
import { useLocale } from './locale-provider';
export default function ApplicantSummary({
  evaluation,
  onEdit,
  onOpen,
  onSave,
  onPlan,
  busy,
}: {
  evaluation: Evaluation;
  onEdit: () => void;
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  onPlan: () => void;
  busy: boolean;
}) {
  const { tr, money } = useLocale();
  const { profile, guidance, diagnosis } = evaluation;
  return (
    <section
      className="applicant-summary panel"
      aria-label={tr('Your profile and suggested universities')}
    >
      <div className="between">
        <h2>{tr('Your starting point')}</h2>
        <button className="text-button" onClick={onEdit}>
          {tr('Edit your details')}
        </button>
      </div>
      <p className="applicant-goal">
        <strong>{tr('Your goal')}</strong>: {tr(profile.major)} ·{' '}
        {profile.countries.map((c) => tr(c)).join(' / ')} ·{' '}
        {tr(profile.intake === 'FALL_2027' ? 'Fall 2027' : 'Fall 2028 · not yet verified')} ·{' '}
        {tr(profile.interest)}
      </p>
      <div className="applicant-profile-facts">
        <span>
          {tr(profile.curriculum || 'School results not added')}
          {profile.raw_grade
            ? `  ·  ${profile.raw_grade} / ${profile.raw_scale}`
            : profile.ib_total !== null
              ? `  ·  ${profile.ib_total}/45`
              : ''}
        </span>
        {profile.ielts.status === 'VALID' && profile.ielts.overall !== null && (
          <span>IELTS · {profile.ielts.overall}</span>
        )}
        {Object.entries(profile.budgets)
          .filter(([, value]) => value !== null)
          .map(([currency, value]) => (
            <span key={currency}>
              {tr('Annual budget')}: {currency} {money(value!)}
            </span>
          ))}
      </div>
      <details className="profile-check-details">
        <summary>{tr('Profile checks')}</summary>
        <div className="diagnostic-columns">
          {[
            ['Already confirmed', diagnosis.strengths],
            ['What needs attention', diagnosis.constraints],
            ['Details still needed', diagnosis.gaps],
          ].map(([title, items]) => (
            <div key={String(title)}>
              <h3>{tr(String(title))}</h3>
              <ul>
                {(items as string[]).map((x) => (
                  <li key={x}>{tr(x)}</li>
                ))}
              </ul>
              {!(items as string[]).length && (
                <p>{tr('No additional gaps identified in the checked data.')}</p>
              )}
            </div>
          ))}
        </div>
      </details>
      <h3>
        {tr(
          guidance.personalized
            ? 'Options to review for your profile'
            : 'Explore first, personalize with your results',
        )}
      </h3>
      {!guidance.personalized && (
        <button className="btn secondary" onClick={onEdit}>
          {tr('Add my grades and budget')}
        </button>
      )}
      <div className="suggested-universities">
        {guidance.recommendations.map((item) => {
          const result = evaluation.programs.find((r) => r.program.id === item.id)!;
          return (
            <article key={item.id}>
              <h4>{result.program.short}</h4>
              <ul>
                {item.reasons.slice(0, 2).map((x) => (
                  <li key={x}>{tr(x)}</li>
                ))}
              </ul>
              {!!item.cautions.length && (
                <p className="small">
                  <strong>{tr('Before applying')}</strong>:{' '}
                  {item.cautions.map((x) => tr(x)).join('; ')}
                </p>
              )}
              <div className="suggested-actions">
                <button className="text-button" onClick={() => onOpen(item.id)}>
                  {tr('See requirements and next steps')}
                </button>
                <button
                  className="btn secondary small-btn"
                  disabled={busy || profile.shortlist.includes(item.id)}
                  onClick={() => onSave(item.id)}
                >
                  {tr(
                    profile.shortlist.includes(item.id)
                      ? 'Saved to your plan'
                      : 'Save and build my tasks',
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!guidance.recommendations.length && (
        <p>
          {tr(
            'No candidates under your current constraints. Review your country, budget or intake instead of treating an unsuitable university as a match.',
          )}
        </p>
      )}
      {profile.shortlist.length > 0 && (
        <button className="btn primary" onClick={onPlan}>
          {tr('Open my roadmap')}
        </button>
      )}
    </section>
  );
}

'use client';
import { useState } from 'react';
import { useLocale } from './locale-provider';
import { downloadText } from '@/lib/journey';
import type { Evaluation, Fact } from '@/lib/types';

export function JourneyExtras({
  evaluation,
  facts,
  onProof,
}: {
  evaluation: Evaluation;
  facts: Fact[];
  onProof: (ids: string[]) => void;
}) {
  const { tr, dateLabel } = useLocale();
  const [question, setQuestion] = useState('');
  const shortlisted = evaluation.programs.filter((r) =>
    evaluation.profile.shortlist.includes(r.program.id),
  );
  const dates = shortlisted
    .flatMap((r) =>
      r.program.deadlines
        .filter((d) =>
          facts.some(
            (f) =>
              f.id === d.fact &&
              f.intake === evaluation.profile.intake &&
              f.evidence === 'VERIFIED',
          ),
        )
        .map((d) => ({ ...d, school: r.program.short })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <section className="journey-extras panel">
      <details>
        <summary>{tr('Your deadline calendar')}</summary>
        <p className="small muted">
          {tr(
            'Calendar dates are reminders. Check the official cutoff and timezone before submitting.',
          )}
        </p>
        {!dates.length && (
          <p>{tr('No verified deadlines for your current shortlist and intake.')}</p>
        )}
        <ol className="deadline-list">
          {dates.map((d) => (
            <li key={`${d.school}-${d.type}-${d.date}`}>
              <time dateTime={d.date}>{dateLabel(d.date)}</time>
              <strong>{d.school}</strong>
              <span>
                {tr(
                  d.type
                    .toLowerCase()
                    .replaceAll('_', ' ')
                    .replace(/^./, (c) => c.toUpperCase()),
                )}
              </span>
              <span className="small muted">
                {d.time} ·{' '}
                {d.timezone === 'APPLICANT_LOCAL'
                  ? tr('Your local timezone')
                  : d.timezone || tr('Time / timezone not verified')}
              </span>
              <button className="text-button" onClick={() => onProof([d.fact])}>
                {tr('Source')}
              </button>
            </li>
          ))}
        </ol>
      </details>
      <details>
        <summary>{tr('Turn an unknown into a next step')}</summary>
        <p>
          {tr(
            'Ask the admissions office a precise question. Save the reply and its date; a completed task alone never verifies a university rule.',
          )}
        </p>
        {shortlisted.flatMap((r) =>
          r.unknowns
            .filter((rule) => !rule.input_needed)
            .map((rule) => (
              <div className="verification-row" key={`${r.program.id}-${rule.id}`}>
                <strong>{r.program.short}</strong>
                <p>{tr(rule.label)}</p>
                <button
                  className="btn secondary small-btn"
                  onClick={() =>
                    setQuestion(
                      `${tr('Hello, I am considering your program for')} ${tr(evaluation.profile.intake === 'FALL_2027' ? 'Fall 2027' : 'Fall 2028 · not yet verified')}.\n${r.program.name} · ${r.program.degree}\n${tr('School curriculum')}: ${evaluation.profile.curriculum}\n${tr('Could you confirm the requirement below and send the official page for my curriculum and entry year?')}\n${tr(rule.label)}\n${tr('Thank you.')}`,
                    )
                  }
                >
                  {tr('Prepare a question')}
                </button>{' '}
                <button className="text-button" onClick={() => onProof(rule.facts)}>
                  {tr('View evidence')}
                </button>
              </div>
            )),
        )}
        {!shortlisted.some((r) => r.unknowns.some((rule) => !rule.input_needed)) && (
          <p>{tr('No unresolved rule questions in your current shortlist.')}</p>
        )}
        {question && (
          <div className="question-draft">
            <label>
              {tr('Your question — review before sending')}
              <textarea rows={9} value={question} onChange={(e) => setQuestion(e.target.value)} />
            </label>
            <button
              className="btn primary"
              onClick={() => downloadText(question, 'pathshift-admissions-question.txt')}
            >
              {tr('Download question')}
            </button>
            <p className="small muted">
              {tr(
                'Nothing is sent automatically. Use the contact information on the official university website.',
              )}
            </p>
          </div>
        )}
      </details>
    </section>
  );
}

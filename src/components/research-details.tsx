'use client';
import type { CSSProperties } from 'react';
import type { Program, Result } from '@/lib/types';
import { useLocale } from './locale-provider';
import { ArrowUpRight, ExternalLink } from 'lucide-react';

export function resultCaption(r: Result) {
  if (r.admission_state === 'INDETERMINATE') {
    if (r.blockers.length && r.unknowns.length) return 'Requirements and details to complete';
    if (r.unknowns.length && r.unknowns.every((x) => x.input_needed)) return 'Add profile details';
    if (!r.unknowns.length) return 'Complete remaining steps';
  }
  return {
    READY_TO_APPLY: 'Checked requirements met',
    WITHIN_REACH: 'A result needs improvement',
    CONDITIONAL_PATH: 'An alternative entry route exists',
    BLOCKED: 'Blocked for this intake',
    INDETERMINATE: 'Some requirements need clarification',
  }[r.admission_state];
}
export function ResearchDetails({ program }: { program: Program }) {
  const { tr } = useLocale();
  if (!program.research) return null;
  return (
    <section className="research-details">
      <h3>{tr('Published requirements, in one place')}</h3>
      <p className="field-note">
        {tr('Checked 17 September 2026 · international first-year applicants')}
      </p>
      {program.research.map((row) => (
        <details key={row.key} className="research-row">
          <summary>{tr(row.label)}</summary>
          <p>{tr(row.text)}</p>
          <a href={row.url} target="_blank" rel="noreferrer">
            {tr('Open official source')} <ExternalLink size={13} />
          </a>
          {row.key === 'cost' &&
            program.cost?.additional_sources?.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {tr('Housing source')} <ExternalLink size={13} />
              </a>
            ))}
        </details>
      ))}
    </section>
  );
}
const rows = [
  ['academic', 'Academic preparation'],
  ['english', 'English routes'],
  ['tests', 'SAT / ACT policy'],
  ['documents', 'Application documents'],
  ['dates', 'Application dates'],
  ['cost', 'Published cost breakdown'],
];
export function ResearchComparison({
  results,
  onOpen,
  onProfile,
}: {
  results: Result[];
  onOpen: (id: string) => void;
  onProfile: () => void;
}) {
  const { tr, money } = useLocale();
  return (
    <section className="research-comparison">
      <div className="comparison-intro">
        <p>
          {tr(
            'Compare the same criteria side by side. Costs retain their currency and academic year.',
          )}
        </p>
        <span>{tr('Swipe the table on a small screen')}</span>
      </div>
      <div
        className="comparison-scroll"
        role="region"
        aria-label={tr('University comparison')}
        tabIndex={0}
      >
        <table
          className="comparison-table"
          style={{ '--research-cols': results.length } as CSSProperties}
        >
          <caption className="sr-only">{tr('University comparison')}</caption>
          <thead>
            <tr>
              <th scope="col">{tr('Criteria')}</th>
              {results.map((r) => (
                <th scope="col" key={r.program.id}>
                  <article className="compare-card">
                    <span
                      className="school-logo"
                      style={{ color: r.program.color, background: r.program.color + '12' }}
                    >
                      {r.program.initials}
                    </span>
                    <h2>{r.program.short}</h2>
                    <p>{tr(r.program.degree)}</p>
                    <span className={`badge state-${r.admission_state.toLowerCase()}`}>
                      <span className="status-dot" />
                      {tr(resultCaption(r))}
                    </span>
                    <button className="btn secondary" onClick={() => onOpen(r.program.id)}>
                      {tr('Understand this path')} <ArrowUpRight size={14} />
                    </button>
                  </article>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{tr('For your profile')}</th>
              {results.map((r) => (
                <td key={r.program.id} data-school={r.program.short}>
                  <strong>{tr(`${r.passed} of ${r.total} required branches satisfied`)}</strong>
                  <p>
                    {tr(
                      r.blockers[0]?.label ||
                        'No known requirement gaps in the evaluated branches.',
                    )}
                  </p>
                  {r.unknowns.length > 0 && (
                    <>
                      <p>
                        {tr(
                          r.unknowns[0].input_needed
                            ? 'The rule is known. Add the missing value in your profile.'
                            : r.unknowns[0].label,
                        )}
                      </p>
                      {r.unknowns.some((u) => u.input_needed) && (
                        <button className="text-link" onClick={onProfile}>
                          {tr('Add profile details')} <ArrowUpRight size={13} />
                        </button>
                      )}
                    </>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">{tr('The route')}</th>
              {results.map((r) => (
                <td key={r.program.id} data-school={r.program.short}>
                  <p>{tr(r.program.structure)}</p>
                  {r.program.conditional && (
                    <p>
                      {tr(r.program.conditional.name)}: {tr(r.program.conditional.note)}
                    </p>
                  )}
                </td>
              ))}
            </tr>
            {rows.map(([key, label]) => (
              <tr key={key}>
                <th scope="row">{tr(label)}</th>
                {results.map((r) => {
                  const row = r.program.research?.find((x) => x.key === key);
                  return (
                    <td key={r.program.id} data-school={r.program.short}>
                      {key === 'cost' && r.program.cost && (
                        <div className="comparison-price">
                          <strong>
                            {r.program.cost.currency} {money(r.program.cost.min)}
                          </strong>
                          <span>
                            {r.program.cost.year} · {tr('Published reference')}
                          </span>
                        </div>
                      )}
                      {row ? (
                        <>
                          <p>{tr(row.text)}</p>
                          <a href={row.url} target="_blank" rel="noreferrer">
                            {tr('Open official source')} <ExternalLink size={12} />
                          </a>
                          {key === 'cost' &&
                            r.program.cost?.additional_sources?.map((url) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer">
                                {tr('Housing source')} <ExternalLink size={12} />
                              </a>
                            ))}
                        </>
                      ) : (
                        <p>
                          {tr(
                            key === 'tests'
                              ? 'This model evaluates the listed academic and English requirements; no SAT threshold is applied here.'
                              : 'Open this path to inspect the available rules and their sources.',
                          )}
                        </p>
                      )}
                      {key === 'cost' && (
                        <p className="field-note">
                          {tr('Fall 2027 total cost is not yet verified.')}
                        </p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

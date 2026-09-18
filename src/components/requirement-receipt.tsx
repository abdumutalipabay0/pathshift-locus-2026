'use client';
import type { Result } from '@/lib/types';
import { useLocale } from './locale-provider';
export default function RequirementReceipt({
  result,
  onEdit,
  onSource,
}: {
  result: Result;
  onEdit: () => void;
  onSource: (ids: string[]) => void;
}) {
  const { tr, money } = useLocale();
  const rows = result.score_checks || [];
  const main = rows.filter(
    (row, i) =>
      /^(ielts.overall|sat\.(score|status)|act\.(score|status)|ib_total|math_aa_hl)$/.test(
        row.field,
      ) &&
      !rows.slice(0, i).some((r) => r.field === row.field) &&
      !(
        row.field.endsWith('.status') &&
        rows.some((r) => r.field === row.field.replace('.status', '.score'))
      ),
  );
  const render = (row: (typeof rows)[number]) => (
    <article
      className={`score-receipt ${row.alternative ? 'alternative' : row.verdict.toLowerCase()}`}
      key={row.id}
    >
      <div>
        <strong>{tr(row.label)}</strong>
        <small className="muted">{tr(row.route)}</small>
        <button className="text-button small" onClick={() => onSource(row.facts)}>
          {tr('Source ')}
        </button>
      </div>
      <div className="score-values">
        <span>
          {tr('Your result')}
          <b>{row.current === null ? '—' : money(row.current)}</b>
        </span>
        <span>
          {tr('Requirement')}
          <b>{row.required === null ? tr('See policy') : '≥ ' + money(row.required)}</b>
        </span>
      </div>
      <div>
        <strong>
          {tr(
            row.alternative
              ? row.conditional_route
                ? 'An alternative entry route exists'
                : 'Covered by another route'
              : row.verdict === 'PASS'
                ? 'Score threshold met'
                : row.gap !== null && row.gap > 0
                  ? 'Score to improve'
                  : row.verdict === 'NOT_APPLICABLE'
                    ? 'Not an application blocker'
                    : 'Needs attention',
          )}
          {row.gap !== null && row.gap > 0 && !row.alternative ? ': +' + money(row.gap) : ''}
        </strong>
        <p>{tr(row.reason)}</p>
      </div>
    </article>
  );
  return (
    <section className="requirement-receipt" aria-label={tr('Your results and requirements')}>
      <div className="between">
        <h3>{tr('What do I need?')}</h3>
        <button className="text-button" onClick={onEdit}>
          {tr('Update my scores')}
        </button>
      </div>
      <p className="small muted">
        {tr(
          'Your saved results, compared with the checked rules. Alternative routes are shown separately.',
        )}
      </p>
      {rows.length ? (
        <>
          <div className="score-receipt-list">{main.map(render)}</div>
          <details className="score-route-details">
            <summary>{tr('Check component scores and alternative routes')}</summary>
            <p className="small muted">
              {tr('These are separate routes, not extra requirements to complete together.')}
            </p>
            {Array.from(new Set(rows.map((r) => r.route))).map((route) => (
              <section key={route}>
                <h4>{tr(route)}</h4>
                <div className="score-receipt-list">
                  {rows.filter((r) => r.route === route).map(render)}
                </div>
              </section>
            ))}
          </details>
        </>
      ) : (
        <p>
          {tr('See the programme-specific checks below. No numeric score threshold is inferred.')}
        </p>
      )}
    </section>
  );
}

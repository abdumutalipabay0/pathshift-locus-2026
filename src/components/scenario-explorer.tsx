'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  FlaskConical,
  MoveRight,
  PencilLine,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Profile, Result, RuleResult, Simulation, State } from '@/lib/types';
import { ieltsConsistencyError, ieltsOverallFromBands } from '@/lib/profile';
import { useLocale } from './locale-provider';

type ScenarioDraft = {
  english: boolean;
  overall: number | null;
  reading: number | null;
  writing: number | null;
  listening: number | null;
  speaking: number | null;
  sat: boolean;
  satScore: number | null;
  budget: boolean;
  USD: number | null;
  CAD: number | null;
  GBP: number | null;
  country: string;
  testDate: string;
};

const stateLabels: Record<State, string> = {
  READY_TO_APPLY: 'Checked requirements met',
  WITHIN_REACH: 'A result needs improvement',
  CONDITIONAL_PATH: 'An alternative entry route exists',
  BLOCKED: 'Blocked for this intake',
  INDETERMINATE: 'Some requirements need clarification',
};
const verdictLabels = {
  PASS: 'Requirement met',
  FAIL: 'Requirement not met',
  UNKNOWN: 'Needs verification',
  NOT_APPLICABLE: 'Not applicable',
};

function findRule(result: Result, id: string): RuleResult | null {
  const visit = (rules: RuleResult[]): RuleResult | null => {
    for (const rule of rules) {
      if (rule.id === id) return rule;
      const nested = visit(rule.children);
      if (nested) return nested;
    }
    return null;
  };
  return visit(result.rules);
}

function ruleFacts(rule: RuleResult | null): string[] {
  if (!rule) return [];
  return [...new Set([...rule.facts, ...rule.children.flatMap((child) => ruleFacts(child))])];
}

function StateChip({ state }: { state: State }) {
  const { tr } = useLocale();
  return (
    <span className={`scenario-state state-${state.toLowerCase()}`}>{tr(stateLabels[state])}</span>
  );
}

export default function ScenarioExplorer({
  profile,
  simulation,
  busy,
  error,
  onSimulate,
  onReset,
  onBack,
  onRoadmap,
  onProof,
  onSave,
}: {
  profile: Profile;
  simulation: Simulation | null;
  busy: boolean;
  error: string;
  onSimulate: (mutation: Partial<Profile>) => Promise<void>;
  onReset: () => void;
  onBack: () => void;
  onRoadmap: () => void;
  onProof: (ids: string[]) => void;
  onSave: () => void;
}) {
  const { tr, money, dateLabel } = useLocale();
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  const [draft, setDraft] = useState<ScenarioDraft>(() => ({
    english: true,
    overall: 6.5,
    reading: 6,
    writing: 6.5,
    listening: 6,
    speaking: 6.5,
    sat: false,
    satScore: 1450,
    budget: false,
    USD: profile.budgets.USD,
    CAD: profile.budgets.CAD,
    GBP: profile.budgets.GBP,
    country: 'keep',
    testDate: profile.expected_score_date || '',
  }));
  const bands = [draft.reading, draft.writing, draft.listening, draft.speaking];
  const calculatedOverall = ieltsOverallFromBands(bands);
  const validation = (() => {
    const issues: string[] = [];
    if (!draft.english && !draft.sat && !draft.budget && draft.country === 'keep')
      issues.push('Choose at least one change to compare.');
    if (draft.english) {
      if (draft.overall === null) issues.push('Enter a hypothetical IELTS overall score.');
      else {
        const mismatch = ieltsConsistencyError(draft.overall, bands);
        if (mismatch) issues.push(mismatch);
      }
      if (!draft.testDate)
        issues.push('Choose the assumed result date so timing is not treated as known.');
      if (profile.test_willingness?.IELTS === false)
        issues.push(
          'This profile says IELTS is not an available action. Change that preference first.',
        );
    }
    if (draft.sat) {
      if (
        draft.satScore === null ||
        !Number.isInteger(draft.satScore) ||
        draft.satScore < 400 ||
        draft.satScore > 1600
      )
        issues.push('Enter a hypothetical SAT score from 400 to 1600.');
      if (!draft.testDate)
        issues.push('Choose the assumed result date so timing is not treated as known.');
      if (profile.test_willingness?.SAT === false)
        issues.push(
          'This profile says SAT is not an available action. Change that preference first.',
        );
    }
    if (draft.budget) {
      const invalid = (['USD', 'CAD', 'GBP'] as const).some(
        (currency) =>
          draft[currency] === null ||
          !Number.isFinite(draft[currency]) ||
          draft[currency]! < 0 ||
          draft[currency]! > 10_000_000,
      );
      if (invalid) issues.push('Enter each annual budget as a non-negative amount.');
      const increased = (['USD', 'CAD', 'GBP'] as const).some(
        (currency) => (draft[currency] ?? 0) > (profile.budgets[currency] ?? 0),
      );
      if (increased && !profile.financial_flexibility)
        issues.push('Enable financial flexibility in your profile before testing a higher budget.');
    }
    if (
      draft.country !== 'keep' &&
      (!profile.geography_flexible || profile.country_locks.length > 0)
    )
      issues.push('Unlock country preferences in your profile before testing another country.');
    return [...new Set(issues)];
  })();

  const update = <K extends keyof ScenarioDraft>(key: K, value: ScenarioDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (simulation) onReset();
  };
  const submit = async () => {
    if (validation.length) return;
    const mutation: Partial<Profile> = {};
    if (draft.english)
      mutation.ielts = {
        status: 'VALID',
        overall: draft.overall,
        reading: draft.reading,
        writing: draft.writing,
        listening: draft.listening,
        speaking: draft.speaking,
        date: draft.testDate,
      };
    if (draft.sat) mutation.sat = { status: 'VALID', score: draft.satScore, date: draft.testDate };
    if (draft.budget) mutation.budgets = { USD: draft.USD, CAD: draft.CAD, GBP: draft.GBP };
    if (draft.country !== 'keep') mutation.countries = [draft.country];
    setRun((value) => value + 1);
    await onSimulate(mutation);
  };

  useEffect(() => {
    if (!simulation) return;
    requestAnimationFrame(() => resultRef.current?.focus());
  }, [simulation]);

  const affected = useMemo(() => {
    if (!simulation) return [];
    const ids = new Set([
      ...simulation.diff.changed_states.map((item) => item.id),
      ...simulation.diff.changed_rules.map((item) => item.program),
      ...simulation.diff.changed_costs.map((item) => item.id),
      ...simulation.diff.changed_timelines,
    ]);
    return [...ids]
      .map((id) => ({
        id,
        before: simulation.before.programs.find((result) => result.program.id === id)!,
        after: simulation.after.programs.find((result) => result.program.id === id)!,
        rules: simulation.diff.changed_rules.filter((item) => item.program === id),
        cost: simulation.diff.changed_costs.find((item) => item.id === id),
        timeline: simulation.diff.changed_timelines.includes(id),
      }))
      .filter((item) => item.before && item.after)
      .sort((a, b) => {
        const aSaved = profile.shortlist.indexOf(a.id);
        const bSaved = profile.shortlist.indexOf(b.id);
        if (aSaved >= 0 || bSaved >= 0)
          return (aSaved < 0 ? 99 : aSaved) - (bSaved < 0 ? 99 : bSaved);
        return Number(b.before.in_scope) - Number(a.before.in_scope);
      });
  }, [profile.shortlist, simulation]);

  const profileDate = profile.ielts.date ? dateLabel(profile.ielts.date) : tr('Unknown');
  return (
    <section className="scenario-explorer">
      <header className="scenario-page-heading">
        <div>
          <span className="eyebrow">{tr('WHAT IF · DECISION CHECK')}</span>
          <h1>{tr('Test one change. Keep your real profile intact.')}</h1>
          <p>
            {tr(
              'Compare your current results with one hypothetical scenario, then choose the next step.',
            )}
          </p>
        </div>
        <button className="btn secondary" onClick={onBack}>
          {tr('Back to my profile')}
        </button>
      </header>

      <ol className="scenario-steps" aria-label={tr('Scenario steps')}>
        {['My current profile', 'What I want to try', 'What changed', 'My next step'].map(
          (label, index) => (
            <li
              key={label}
              aria-current={
                busy
                  ? index === 2
                    ? 'step'
                    : undefined
                  : simulation
                    ? index === 3
                      ? 'step'
                      : undefined
                    : index === 1
                      ? 'step'
                      : undefined
              }
              className={
                index === 0 || (index === 1 && !simulation) || (index > 1 && simulation)
                  ? 'active'
                  : ''
              }
            >
              <span>{index + 1}</span>
              {tr(label)}
            </li>
          ),
        )}
      </ol>

      {!simulation && (
        <div className="scenario-setup" ref={formRef} tabIndex={-1}>
          <section className="scenario-baseline" aria-labelledby="baseline-title">
            <span className="scenario-kicker">{tr('CONFIRMED PROFILE')}</span>
            <h2 id="baseline-title">{tr('My current profile')}</h2>
            <p className="scenario-person">{profile.name}</p>
            <dl>
              <div>
                <dt>IELTS</dt>
                <dd>{profile.ielts.overall ?? '—'}</dd>
              </div>
              <div>
                <dt>{tr('IELTS bands')}</dt>
                <dd>
                  {[
                    profile.ielts.reading,
                    profile.ielts.writing,
                    profile.ielts.listening,
                    profile.ielts.speaking,
                  ]
                    .map((value) => value ?? '—')
                    .join(' · ')}
                </dd>
              </div>
              <div>
                <dt>{tr('Recorded test date')}</dt>
                <dd>{profileDate}</dd>
              </div>
              <div>
                <dt>{tr('Countries')}</dt>
                <dd>{profile.countries.join(' + ') || tr('Unknown')}</dd>
              </div>
            </dl>
            <p className="scenario-trust-note">
              <ShieldCheck size={15} />
              {tr('These are saved facts. The experiment below cannot overwrite them.')}
            </p>
          </section>

          <section className="scenario-builder panel" aria-labelledby="scenario-builder-title">
            <div className="scenario-builder-heading">
              <span className="scenario-kicker">{tr('SCENARIO ASSUMPTION')}</span>
              <h2 id="scenario-builder-title">{tr('What I want to try')}</h2>
              <p>{tr('Select only the change you want to test. Unknown inputs stay unknown.')}</p>
            </div>

            <label className="scenario-choice">
              <span>
                <strong>{tr('Hypothetical IELTS result')}</strong>
                <small>{tr('This is an assumption, not a completed exam.')}</small>
              </span>
              <input
                name="scenario-ielts-enabled"
                type="checkbox"
                role="switch"
                checked={draft.english}
                onChange={(event) => update('english', event.target.checked)}
              />
            </label>
            {draft.english && (
              <fieldset className="scenario-fields">
                <legend>{tr('IELTS assumption')}</legend>
                <label className="scenario-overall">
                  {tr('Overall score')}
                  <input
                    name="scenario-ielts-overall"
                    autoComplete="off"
                    aria-describedby="ielts-consistency-note"
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={draft.overall ?? ''}
                    onChange={(event) =>
                      update(
                        'overall',
                        event.target.value === '' ? null : Number(event.target.value),
                      )
                    }
                  />
                </label>
                <div className="scenario-band-grid">
                  {(['reading', 'writing', 'listening', 'speaking'] as const).map((band) => (
                    <label key={band}>
                      {tr(band.slice(0, 1).toUpperCase() + band.slice(1))}
                      <input
                        name={`scenario-ielts-${band}`}
                        autoComplete="off"
                        aria-label={tr(`Scenario ${band}`)}
                        type="number"
                        min="0"
                        max="9"
                        step="0.5"
                        value={draft[band] ?? ''}
                        onChange={(event) =>
                          update(
                            band,
                            event.target.value === '' ? null : Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
                <p id="ielts-consistency-note" className="scenario-inline-note">
                  {calculatedOverall === null
                    ? tr('Blank bands stay UNKNOWN for universities that require them.')
                    : `${tr('Calculated overall from these bands')}: ${money(calculatedOverall)}`}
                </p>
              </fieldset>
            )}

            <div className="scenario-secondary-grid">
              <label className="scenario-choice compact">
                <span>
                  <strong>{tr('Hypothetical SAT result')}</strong>
                  <small>{tr('Only programs with a verified SAT rule can change.')}</small>
                </span>
                <input
                  name="scenario-sat-enabled"
                  type="checkbox"
                  role="switch"
                  checked={draft.sat}
                  onChange={(event) => update('sat', event.target.checked)}
                />
              </label>
              {draft.sat && (
                <label className="scenario-input">
                  {tr('SAT score')}
                  <input
                    name="scenario-sat-score"
                    autoComplete="off"
                    type="number"
                    min="400"
                    max="1600"
                    step="10"
                    value={draft.satScore ?? ''}
                    onChange={(event) =>
                      update(
                        'satScore',
                        event.target.value === '' ? null : Number(event.target.value),
                      )
                    }
                  />
                </label>
              )}
              <label className="scenario-choice compact">
                <span>
                  <strong>{tr('Different annual budget')}</strong>
                  <small>{tr('Admission checks remain separate from cost.')}</small>
                </span>
                <input
                  name="scenario-budget-enabled"
                  type="checkbox"
                  role="switch"
                  checked={draft.budget}
                  onChange={(event) => update('budget', event.target.checked)}
                />
              </label>
              {draft.budget && (
                <div className="scenario-budget-grid">
                  {(['USD', 'CAD', 'GBP'] as const).map((currency) => (
                    <label key={currency}>
                      {currency}
                      <input
                        name={`scenario-budget-${currency.toLowerCase()}`}
                        autoComplete="off"
                        type="number"
                        min="0"
                        max="10000000"
                        step="1000"
                        value={draft[currency] ?? ''}
                        onChange={(event) =>
                          update(
                            currency,
                            event.target.value === '' ? null : Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {(draft.english || draft.sat) && (
              <label className="scenario-input scenario-date">
                <CalendarDays size={16} />
                <span>
                  {tr('Assumed result date')}
                  <small>
                    {tr('Required for this experiment; it is not saved as a completed test.')}
                  </small>
                </span>
                <input
                  name="scenario-result-date"
                  autoComplete="off"
                  type="date"
                  value={draft.testDate}
                  onChange={(event) => update('testDate', event.target.value)}
                />
              </label>
            )}
            <label className="scenario-input">
              {tr('Country preference')}
              <select
                name="scenario-country"
                autoComplete="off"
                disabled={!profile.geography_flexible || profile.country_locks.length > 0}
                value={draft.country}
                onChange={(event) => update('country', event.target.value)}
              >
                <option value="keep">{tr('Keep my countries')}</option>
                <option value="US">{tr('United States')}</option>
                <option value="Canada">{tr('Canada')}</option>
                <option value="UK">{tr('United Kingdom')}</option>
              </select>
            </label>

            {validation.length > 0 && (
              <div className="scenario-validation" role="alert">
                <CircleAlert size={18} />
                <div>
                  <strong>{tr('Check the scenario before comparing')}</strong>
                  <ul>
                    {validation.map((issue) => (
                      <li key={issue}>{tr(issue)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {error && (
              <p className="scenario-api-error" role="alert">
                {tr(error)}
              </p>
            )}
            <button
              className="btn primary scenario-run"
              onClick={() => void submit()}
              disabled={busy || validation.length > 0}
            >
              <FlaskConical size={17} />
              {tr('Compare this scenario')}
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}

      {busy && (
        <div className="scenario-comparing" role="status" aria-live="polite">
          <span className="scenario-comparing-mark" aria-hidden="true" />
          <div>
            <strong>{tr('Comparing paths…')}</strong>
            <p>{tr('Rechecking the same admission rules without changing your profile.')}</p>
          </div>
        </div>
      )}

      {simulation && !busy && (
        <div className="scenario-result" key={run} ref={resultRef} tabIndex={-1} aria-live="polite">
          <section className="scenario-result-hero">
            <div>
              <span className="scenario-kicker">{tr('WHAT CHANGED')}</span>
              <h2>
                {affected.length
                  ? tr('{count} university paths changed').replace(
                      '{count}',
                      String(affected.length),
                    )
                  : tr('The checked university paths did not change.')}
              </h2>
              <p>
                {tr(
                  'This is a rule-based comparison of your saved profile and one assumption. It is not an admission prediction.',
                )}
              </p>
            </div>
            <div className="scenario-result-counts" aria-label={tr('Change summary')}>
              <span>
                <strong>{simulation.diff.changed_rules.length}</strong>
                {tr('rules changed')}
              </span>
              <span>
                <strong>{simulation.diff.removed_blockers.length}</strong>
                {tr('gaps removed')}
              </span>
              <span>
                <strong>
                  {simulation.diff.tasks_removed.length + simulation.diff.tasks_added.length}
                </strong>
                {tr('task changes')}
              </span>
            </div>
          </section>

          <div className="scenario-snapshot-compare">
            <section>
              <span className="scenario-kicker">{tr('BASELINE · SAVED')}</span>
              <h3>{tr('My current profile')}</h3>
              <strong>IELTS {simulation.before.profile.ielts.overall ?? '—'}</strong>
              <p>{tr('Confirmed profile data')}</p>
            </section>
            <MoveRight size={22} aria-hidden="true" />
            <section>
              <span className="scenario-kicker">{tr('HYPOTHETICAL · NOT SAVED')}</span>
              <h3>{tr('Scenario')}</h3>
              <strong>IELTS {simulation.after.profile.ielts.overall ?? '—'}</strong>
              <p>{tr('Assumption for comparison only')}</p>
            </section>
          </div>

          {affected.length ? (
            <div className="scenario-change-list">
              {affected.map((item, index) => (
                <article
                  className="scenario-change-card"
                  key={item.id}
                  style={{ '--change-index': index } as React.CSSProperties}
                >
                  <header>
                    <div>
                      <span className="scenario-change-mark">
                        <Sparkles size={14} /> {tr('Changed')}
                      </span>
                      <h3>{item.after.program.short}</h3>
                    </div>
                    <div className="scenario-state-diff">
                      <StateChip state={item.before.admission_state} />
                      <MoveRight size={15} />
                      <StateChip state={item.after.admission_state} />
                    </div>
                  </header>
                  {item.rules.map((change) => {
                    const afterRule = findRule(item.after, change.rule);
                    const evidence = ruleFacts(afterRule);
                    return (
                      <div className="scenario-rule-diff" key={change.rule}>
                        <div>
                          <strong>{tr(change.label)}</strong>
                          <p>{tr(afterRule?.reason || 'The evaluated rule changed.')}</p>
                        </div>
                        <span className="scenario-verdict-diff">
                          {tr(verdictLabels[change.before])}
                          <MoveRight size={13} />
                          <strong>{tr(verdictLabels[change.after])}</strong>
                        </span>
                        {!!evidence.length && (
                          <button className="text-button" onClick={() => onProof(evidence)}>
                            <ShieldCheck size={14} />
                            {tr('Open rule source')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {item.cost && (
                    <div className="scenario-rule-diff">
                      <div>
                        <strong>{tr('Dated budget comparison')}</strong>
                        <p>
                          {tr('Only the cost state changed; academic checks stayed independent.')}
                        </p>
                      </div>
                      <span className="scenario-verdict-diff">
                        {tr(item.cost.before.replaceAll('_', ' '))}
                        <MoveRight size={13} />
                        <strong>{tr(item.cost.after.replaceAll('_', ' '))}</strong>
                      </span>
                    </div>
                  )}
                  {item.timeline && (
                    <div className="scenario-rule-diff">
                      <div>
                        <strong>{tr('Timeline check changed')}</strong>
                        <p>
                          {tr(
                            'The assumed date was compared with the published deadline evidence.',
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  <footer>
                    <span>
                      <ShieldCheck size={13} /> {tr('Official facts')}
                    </span>
                    <span>
                      <FlaskConical size={13} /> {tr('Scenario assumption')}
                    </span>
                    <span>
                      <Route size={13} /> {tr('PathShift inference')}
                    </span>
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <section className="scenario-no-change panel">
              <ShieldCheck size={22} />
              <div>
                <h3>{tr('No unsupported change was invented.')}</h3>
                <p>
                  {tr(
                    'The selected assumption did not alter the verified checks for these universities. Unrelated results stayed stable.',
                  )}
                </p>
              </div>
            </section>
          )}

          <section className="scenario-next-step">
            <div>
              <span className="scenario-kicker">{tr('MY NEXT STEP')}</span>
              <h2>
                {tr(simulation.after.next_action?.title || 'Choose a university for your plan')}
              </h2>
              <p>
                {simulation.diff.next_before === simulation.diff.next_after
                  ? tr('The next action stays the same after this experiment.')
                  : tr('The next action changed because the evaluated requirements changed.')}
              </p>
            </div>
            <button className="btn primary" onClick={onRoadmap}>
              {tr('Open my next step')} <ArrowRight size={16} />
            </button>
          </section>

          <div className="scenario-result-actions">
            <button
              className="btn secondary"
              onClick={() => {
                onReset();
                requestAnimationFrame(() => formRef.current?.focus());
              }}
            >
              <PencilLine size={16} /> {tr('Edit scenario')}
            </button>
            <button className="btn secondary" onClick={onSave}>
              <Check size={16} /> {tr('Save scenario')}
            </button>
            <button className="text-button" onClick={onBack}>
              {tr('Back to my profile')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

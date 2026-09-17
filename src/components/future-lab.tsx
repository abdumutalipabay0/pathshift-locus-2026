'use client';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  GitBranch,
  ScanLine,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  LoaderCircle,
  Save,
  HelpCircle,
} from 'lucide-react';
import { useLocale } from './locale-provider';
import type { Fact, Profile, Simulation } from '@/lib/types';
import type { DecisionGraph, DecisionReceipt, LabAnalysis } from '@/lib/lab-types';
import type { ComposerDraft } from '@/lib/scenario-composer';
import type { SavedScenario } from '@/lib/journey';
const stateLabels: Record<string, string> = {
  READY_TO_APPLY: 'Ready to apply',
  WITHIN_REACH: 'Within reach',
  CONDITIONAL_PATH: 'Conditional path',
  BLOCKED: 'Blocked for this intake',
  INDETERMINATE: 'Needs verification',
};
const fieldLabels: Record<string, string> = {
  'school.english': 'School English years',
  'school.math': 'School mathematics years',
  'school.science': 'Laboratory science years',
  'school.natural_science': 'Natural science years',
  'school.electives': 'Elective course years',
  'school.social': 'Social studies years',
  'school.language': 'World language years',
  'school.asu_gpa': 'ASU-equivalent school GPA / 4',
  'school.competency_gpa': 'ASU competency-course GPA / 4',
  'school.math_sequence': 'Algebra, geometry and advanced math',
  'school.precalculus': 'Math through precalculus',
  'school.chemistry_physics': 'Chemistry or physics studied',
  'school.non_english_country': 'School in a non-English-speaking country',
  'school.top_quarter': 'Top quarter of graduating class',
  'school.purdue_english_evidence': 'English evidence selected under Purdue policy',
  ib_courses: 'IB courses',
  hl_courses: 'HL courses',
  ib_diploma: 'IB diploma',
  senior_english: 'Senior English',
  overall: 'IELTS overall',
  reading: 'IELTS reading',
  writing: 'IELTS writing',
  listening: 'IELTS listening',
  speaking: 'IELTS speaking',
  date: 'Expected completion date',
  'ielts.overall': 'IELTS overall',
  'ielts.reading': 'IELTS reading',
  'ielts.writing': 'IELTS writing',
  'ielts.speaking': 'IELTS speaking',
  'ielts.listening': 'IELTS listening',
  'ielts.status': 'IELTS status',
  'ielts.date': 'IELTS test date',
  'sat.status': 'SAT status',
  'sat.score': 'SAT score',
  'sat.date': 'SAT test date',
  'act.status': 'ACT status',
  'act.score': 'ACT score',
  'act.date': 'ACT test date',
  ib_total: 'IB total',
  ib_core_points: 'IB bonus points',
  math_aa_hl: 'IB Math AA HL',
  english_a: 'English A',
  english_b_hl: 'English B HL',
  documents_ready: 'Documents ready',
  aif: 'AIF',
  test_willingness: 'Test preferences',
  budgets: 'Budget',
  countries: 'Country preference',
  expected_score_date: 'Expected completion date',
};
function downstream(graph: DecisionGraph, starts: string[]) {
  const seen = new Set(starts),
    queue = [...starts];
  while (queue.length) {
    const id = queue.shift();
    for (const e of graph.edges)
      if (e.from === id && !seen.has(e.to)) {
        seen.add(e.to);
        queue.push(e.to);
      }
  }
  return seen;
}
async function request<T>(body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch('/api/lab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Unable to reach the decision engine.');
  return value;
}
export default function FutureLab({
  profile,
  saved,
  facts,
  onProfile,
  onSave,
  onRoadmap,
  onEdit,
}: {
  profile: Profile;
  saved: SavedScenario[];
  facts: Fact[];
  onProfile: (p: Profile) => Promise<unknown>;
  onSave: (s: SavedScenario) => boolean;
  onRoadmap: () => void;
  onEdit: () => void;
}) {
  const { tr, locale, dateLabel } = useLocale();
  const [target, setTarget] = useState('waterloo'),
    [data, setData] = useState<LabAnalysis | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState<string[]>([]),
    [answer, setAnswer] = useState(''),
    [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState<string[]>(['input:ielts.overall']),
    [chosen, setChosen] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    simulation: Simulation;
    receipts: DecisionReceipt[];
  } | null>(null);
  const [text, setText] = useState(''),
    [composer, setComposer] = useState(false),
    [model, setModel] = useState(''),
    [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<{
      draft: ComposerDraft;
      mutation: Partial<Profile> | null;
      issue: string;
    } | null>(null),
    [message, setMessage] = useState('');
  const [date, setDate] = useState(profile.expected_score_date || '');
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [pendingWillingness, setPendingWillingness] = useState<Profile['test_willingness'] | null>(
    null,
  );
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/lab', { signal: controller.signal })
      .then((r) => r.json())
      .then((v) => {
        setComposer(v.composer);
        setModel(v.model);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    // Reset the remote snapshot when the server request is dispatched, and ignore stale replies.
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError('');
        setPreview(null);
        setChosen(null);
        setDraft(null);
        setAnswer('');
        setDate(profile.expected_score_date || '');
      }
    });
    request<LabAnalysis>({ profile, target, saved }, controller.signal)
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [profile, target, saved]);
  const question = data?.questions.find((q) => !skipped.includes(q.field));
  const path = data?.paths.find((p) => p.id === chosen);
  const current = preview?.simulation.after || path?.simulation.after || data?.evaluation;
  const graph = data?.graph;
  const highlighted = graph ? downstream(graph, selection) : new Set<string>();
  const displayReceipts =
    preview?.receipts ||
    (path
      ? data?.receipts.map((r) => {
          const result = path.simulation.after.programs.find((p) => p.program.id === r.program);
          const flatten = (rules: (typeof r.rule)[]): (typeof r.rule)[] =>
            rules.flatMap((v) => [v, ...flatten(v.children)]);
          const after = flatten(result?.rules || []).find((v) => v.id === r.rule.id);
          const read = (field: string) =>
            field
              .split('.')
              .reduce<unknown>(
                (v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : null),
                path.simulation.after.profile,
              );
          return {
            ...r,
            rule: after || r.rule,
            before: r.rule.result,
            state: result?.admission_state || r.state,
            inputs: r.inputs.map((i) => ({ ...i, value: read(i.field) ?? null })),
          };
        })
      : data?.receipts) ||
    [];
  const filtered = displayReceipts.filter((r) => highlighted.has(`rule:${r.rule.id}`));
  const receipt =
    displayReceipts.find((r) => r.rule.id === receiptId) ||
    filtered.find((r) => r.program === target) ||
    filtered[0];
  const names = (ids: string[]) =>
    ids
      .map((id) => data?.evaluation.programs.find((p) => p.program.id === id)?.program.short || id)
      .join(', ');
  const value = (v: unknown): string =>
    v === null || v === undefined
      ? tr('Not supplied')
      : typeof v === 'boolean'
        ? tr(v ? 'Yes' : 'No')
        : typeof v === 'object'
          ? JSON.stringify(v)
          : String(v);
  const label = (field: string) =>
    tr(
      field.startsWith('documents_by_program.')
        ? 'Documents ready'
        : fieldLabels[field] || data?.questions.find((q) => q.field === field)?.label || field,
    );
  const run = async (action: () => Promise<void>) => {
    setError('');
    setSaving(true);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const save = (simulation: Simulation) => {
    const before = simulation.before.profile,
      after = simulation.after.profile;
    const keys = [
      'ielts',
      'sat',
      'act',
      'budgets',
      'countries',
      'expected_score_date',
      'test_willingness',
      'aif',
      'documents_by_program',
    ] as const;
    const mutation = Object.fromEntries(
      keys
        .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
        .map((k) => [k, after[k]]),
    );
    if (
      onSave({
        id: crypto.randomUUID(),
        name: `${tr('Future Lab')} · ${names([target])}`,
        mutation,
        savedAt: new Date().toISOString(),
      })
    )
      setMessage(tr('Future saved. Your actual profile has not changed.'));
  };
  return (
    <section className="future-lab" aria-busy={loading}>
      <div className="lab-heading">
        <div>
          <div className="eyebrow">
            <GitBranch size={15} />
            {tr('ADMISSION DECISION LAB')}
          </div>
          <h1>{tr('Explore your possible futures.')}</h1>
          <p>{tr('Find the answer that matters. See which actions change your paths.')}</p>
        </div>
        <button className="btn secondary" onClick={onEdit}>
          {tr('Edit profile')}
        </button>
      </div>
      {error && (
        <div role="alert" className="error-box">
          {tr(error)}{' '}
          <button className="btn ghost" onClick={() => setError('')}>
            {tr('Dismiss notification')}
          </button>
        </div>
      )}
      {message && (
        <p role="status" className="lab-notice">
          {message}
        </p>
      )}
      {loading && (
        <p role="status">
          <LoaderCircle size={16} className="spin" /> {tr('Exploring your paths…')}
        </p>
      )}
      {data && (
        <>
          <div className="lab-topline">
            <span className="mini-badge">
              <ShieldCheck size={13} />
              {tr('Your actual profile')}
            </span>
            <span>
              {profile.name} · {tr('IELTS overall')} {profile.ielts.overall ?? '—'}
            </span>
            <span className="muted">{tr('Not a guarantee of admission.')}</span>
          </div>
          <div className="lab-controls">
            <label>
              {tr('Explore a target')}
              <select
                value={target}
                disabled={loading}
                onChange={(e) => {
                  setTarget(e.target.value);
                  setReceiptId(null);
                }}
              >
                {data.evaluation.programs
                  .filter(
                    (r) =>
                      ['uw', 'waterloo', 'gatech', 'purdue', 'rit', 'asu'].includes(r.program.id) ||
                      profile.shortlist.includes(r.program.id),
                  )
                  .map((r) => (
                    <option key={r.program.id} value={r.program.id}>
                      {r.program.short}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {tr('Expected completion date')}
              <input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <button
              className="btn secondary"
              disabled={saving || loading || date === (profile.expected_score_date || '')}
              onClick={() =>
                void run(async () => {
                  await onProfile({ ...profile, expected_score_date: date || null });
                })
              }
            >
              {tr('Update planning date')}
            </button>
            <p>
              {tr(
                'Assumed date when planned results and documents are available. Actual scores stay unchanged.',
              )}
            </p>
          </div>
          <div className="lab-question panel">
            <HelpCircle size={23} />
            <div>
              <span className="eyebrow">{tr('THE NEXT USEFUL ANSWER')}</span>
              {question ? (
                <>
                  <h2>
                    {tr(`One answer can clarify ${question.programs.length} program checks.`)}
                  </h2>
                  <p>{label(question.field)}</p>
                  <p className="small muted">
                    {tr('Why this question:')} {names(question.programs)} ·{' '}
                    {tr(`${question.resolvedRules} unresolved rules can be checked.`)}
                  </p>
                  <form
                    className="lab-answer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(async () => {
                        const next = await request<{ profile: Profile }>({
                          action: 'answer',
                          profile,
                          field: question.field,
                          value: question.type === 'boolean' ? answer === 'true' : Number(answer),
                        });
                        await onProfile(next.profile);
                        setAnswer('');
                      });
                    }}
                  >
                    <label>
                      <span className="sr-only">{tr('Your actual answer')}</span>
                      {question.type === 'boolean' ? (
                        <select
                          aria-label={tr('Your actual answer')}
                          value={answer}
                          required
                          onChange={(e) => setAnswer(e.target.value)}
                        >
                          <option value="">{tr('Choose an answer')}</option>
                          <option value="true">{tr('Yes')}</option>
                          <option value="false">{tr('No')}</option>
                        </select>
                      ) : (
                        <input
                          aria-label={tr('Your actual answer')}
                          type="number"
                          required
                          min={question.min}
                          max={question.max}
                          step={question.step}
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                        />
                      )}
                    </label>
                    <button className="btn primary" disabled={saving || loading || answer === ''}>
                      {tr('Save answer and update graph')}
                      <ArrowRight size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => {
                        setSkipped([...skipped, question.field]);
                        setAnswer('');
                      }}
                    >
                      {tr('I don’t know yet')}
                    </button>
                  </form>
                  <p className="small muted">
                    {tr(
                      'Enter a real profile value here. Future assumptions belong in the paths below.',
                    )}
                  </p>
                </>
              ) : (
                <>
                  <h2>{tr('No more supported questions to ask right now.')}</h2>
                  <p>
                    {tr('Review remaining source gaps and requirements in the decision receipt.')}
                  </p>
                  {skipped.length > 0 && (
                    <button className="btn ghost" onClick={() => setSkipped([])}>
                      {tr('Revisit skipped questions')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="lab-board" aria-label={tr('Future paths')}>
            <div className="lab-board-head">
              <div>
                <span className="eyebrow">{tr('FUTURE PATHS')}</span>
                <h2>{tr(`Paths to ${names([target])}`)}</h2>
              </div>
              <span className="small muted">{tr('Up to two actions · conditional outcomes')}</span>
            </div>
            <div className="lab-route-layout">
              <div className="lab-origin">
                <span className="lab-node-dot" />
                <strong>{tr('You, today')}</strong>
                <span>
                  {tr(
                    stateLabels[
                      data.evaluation.programs.find((r) => r.program.id === target)
                        ?.admission_state || 'INDETERMINATE'
                    ],
                  )}
                </span>
                <small>{tr('Your actual profile')}</small>
                <button
                  className="btn ghost small-btn"
                  onClick={() => {
                    setChosen(null);
                    setPreview(null);
                  }}
                >
                  {tr('View current state')}
                </button>
              </div>
              <div className="lab-branches">
                {data.paths.map((p, index) => (
                  <button
                    className={`lab-path ${chosen === p.id ? 'selected' : ''}`}
                    aria-pressed={chosen === p.id}
                    key={p.id}
                    disabled={loading}
                    onClick={() => {
                      setChosen(p.id);
                      setPreview(null);
                      setReceiptId(null);
                      setSelection(p.actions.flatMap((a) => a.fields.map((f) => `input:${f}`)));
                    }}
                  >
                    <span className="lab-path-title">
                      {tr('Path')} {String.fromCharCode(65 + index)}
                      <span
                        className={`mini-badge ${p.feasibility === 'UNKNOWN' ? '' : 'verified'}`}
                      >
                        {tr(
                          p.feasibility === 'UNKNOWN'
                            ? 'Timing needs verification'
                            : 'Fits the published deadline',
                        )}
                      </span>
                    </span>
                    <span className="lab-steps">
                      {p.actions.map((a, i) => (
                        <span className="lab-step" key={a.id}>
                          {i > 0 && <ArrowRight size={16} />}
                          <span>
                            <strong>{tr(a.label)}</strong>
                            <small>{tr('IF the planned outcome is achieved')}</small>
                            {a.assumptions
                              .filter((v) => !v.field.endsWith('status'))
                              .map((v) => (
                                <span className="lab-assumption" key={v.field}>
                                  {label(v.field)}: {value(v.value)}
                                </span>
                              ))}
                          </span>
                        </span>
                      ))}
                      <ChevronRight className="lab-end-arrow" size={22} />
                      <span className="lab-outcome">
                        <strong>
                          {tr(
                            stateLabels[
                              p.simulation.after.programs.find((r) => r.program.id === target)!
                                .admission_state
                            ],
                          )}
                        </strong>
                        <small>{tr(`${p.removed.length} failed checks resolved`)}</small>
                        <small>{tr(`${p.remaining.length} requirement groups remain`)}</small>
                      </span>
                    </span>
                  </button>
                ))}
                {!data.paths.length && (
                  <div className="lab-no-path">
                    <h3>{tr('No supported action sequence found.')}</h3>
                    <p>
                      {tr(
                        'Check the planning date, test preferences and remaining requirements. Academic history and unknown policies cannot be changed by a scenario.',
                      )}
                    </p>
                    <button className="btn secondary" onClick={onEdit}>
                      {tr('Edit profile')}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {(path || preview) && (
              <div className="lab-future-summary" role="status">
                <div>
                  <strong>{tr('Hypothetical result')}</strong>
                  <p>{tr('Your saved profile has not changed.')}</p>
                  <span>{tr('Costs and remaining requirements still apply.')}</span>
                  <p className="small">
                    {tr('Remaining requirements')}:{' '}
                    {(current?.programs.find((r) => r.program.id === target)?.blockers || [])
                      .concat(
                        current?.programs.find((r) => r.program.id === target)?.unknowns || [],
                      )
                      .map((r) => tr(r.label))
                      .join(' · ') || tr('None')}
                  </p>
                  <p className="small">
                    {tr('Reference cost')}:{' '}
                    {tr(
                      current?.programs
                        .find((r) => r.program.id === target)
                        ?.reference_cost_state.replaceAll('_', ' ') || 'UNKNOWN',
                    )}
                  </p>
                  <details>
                    <summary>{tr('Roadmap changes')}</summary>
                    {(preview?.simulation || path!.simulation).diff.tasks_removed.map((id) => (
                      <p key={id}>
                        {tr('Resolved task')}:{' '}
                        {tr(
                          (preview?.simulation || path!.simulation).before.roadmap.find(
                            (t) => t.id === id,
                          )?.title || id,
                        )}
                      </p>
                    ))}
                    {(preview?.simulation || path!.simulation).diff.tasks_added.map((id) => (
                      <p key={id}>
                        {tr('New task')}:{' '}
                        {tr(
                          (preview?.simulation || path!.simulation).after.roadmap.find(
                            (t) => t.id === id,
                          )?.title || id,
                        )}
                      </p>
                    ))}
                  </details>
                  {path?.deadlineFacts.map((id) => {
                    const f = facts.find((v) => v.id === id);
                    return f?.source_url ? (
                      <a
                        className="small"
                        key={id}
                        href={f.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {tr('Published deadline source')} ↗{' '}
                      </a>
                    ) : null;
                  })}
                </div>
                <button
                  className="btn primary"
                  disabled={saved.length >= 3}
                  onClick={() => save(preview?.simulation || path!.simulation)}
                >
                  <Save size={16} />
                  {tr('Save scenario')}
                </button>
                <button className="btn secondary" onClick={onRoadmap}>
                  {tr('Open actual roadmap')}
                </button>
                {saved.length >= 3 && (
                  <small>{tr('Three scenarios saved. Remove one before saving another.')}</small>
                )}
              </div>
            )}
          </div>
          <div className="lab-xray panel">
            <div className="lab-board-head">
              <div>
                <span className="eyebrow">
                  <ScanLine size={14} />
                  {tr('DECISION X-RAY')}
                </span>
                <h2>{tr('Follow the dependencies.')}</h2>
              </div>
              <p className="small muted">
                {tr('Connections explain our rules, not an admissions committee’s decision.')}
              </p>
            </div>
            <label className="lab-variable">
              {tr('Inspect an input')}
              <select
                value={selection.length === 1 ? selection[0] : ''}
                onChange={(e) => {
                  setSelection([e.target.value]);
                  setReceiptId(null);
                }}
              >
                <option value="">{tr('Selected action inputs')}</option>
                {graph?.nodes
                  .filter((n) => n.kind === 'input')
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {label(n.label)}
                    </option>
                  ))}
              </select>
            </label>
            <div className="lab-program-nodes">
              {data.evaluation.programs
                .filter((r) => graph?.nodes.some((n) => n.id === `program:${r.program.id}`))
                .map((r) => {
                  const isAffected = highlighted.has(`program:${r.program.id}`),
                    future = current?.programs.find((v) => v.program.id === r.program.id);
                  return (
                    <div
                      className={`lab-program-node ${isAffected ? 'affected' : ''}`}
                      key={r.program.id}
                    >
                      <span className="lab-node-dot" />
                      <strong>{r.program.short}</strong>
                      <span>{tr(stateLabels[future?.admission_state || r.admission_state])}</span>
                      <small>
                        {tr(
                          isAffected
                            ? 'Connected to selected input'
                            : 'No dependency on selected input',
                        )}
                      </small>
                    </div>
                  );
                })}
            </div>
            <div className="lab-inspector">
              <div className="lab-rule-list">
                <h3>{tr('Connected requirements')}</h3>
                {filtered.map((r) => (
                  <button
                    aria-pressed={receipt?.rule.id === r.rule.id}
                    key={r.rule.id}
                    onClick={() => setReceiptId(r.rule.id)}
                  >
                    <span>
                      {names([r.program])}
                      <strong>{tr(r.rule.label)}</strong>
                    </span>
                    <span className={`lab-verdict ${r.rule.result.toLowerCase()}`}>
                      {tr(r.rule.result)}
                    </span>
                  </button>
                ))}
                {!filtered.length && <p>{tr('Choose an input to inspect its rules.')}</p>}
              </div>
              <div className="lab-receipt">
                {receipt ? (
                  <>
                    <h3>{tr('Decision receipt')}</h3>
                    <dl>
                      <div>
                        <dt>{tr('Your input')}</dt>
                        <dd>
                          {receipt.inputs.map((i) => (
                            <span className="lab-assumption" key={i.field}>
                              {label(i.field)}: {value(i.value)}
                            </span>
                          ))}
                        </dd>
                      </div>
                      <div>
                        <dt>{tr('Official fact')}</dt>
                        <dd>
                          {receipt.rule.facts.map((id) => {
                            const f = facts.find((v) => v.id === id);
                            return f ? (
                              <p key={id}>
                                {tr(f.statement)}{' '}
                                <span className="mini-badge">{tr(f.evidence)}</span>
                                {f.source_url && (
                                  <a href={f.source_url} target="_blank" rel="noreferrer">
                                    {tr('Open official source')} ↗
                                  </a>
                                )}
                              </p>
                            ) : null;
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt>{tr('Rule')}</dt>
                        <dd>
                          <code>{receipt.expression}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>{tr('Evaluation result')}</dt>
                        <dd>
                          {receipt.before && receipt.before !== receipt.rule.result && (
                            <>{tr(receipt.before)} → </>
                          )}
                          {tr(receipt.rule.result)}
                          <p>{tr(receipt.rule.reason)}</p>
                        </dd>
                      </div>
                      <div>
                        <dt>{tr('PathShift inference')}</dt>
                        <dd>
                          {tr(stateLabels[receipt.state])}
                          <p>{tr('The program state also depends on its other requirements.')}</p>
                        </dd>
                      </div>
                      <div>
                        <dt>{tr('Available action')}</dt>
                        <dd>
                          {receipt.rule.action
                            ? tr(
                                data.actions.find((a) => a.kind === receipt.rule.action)?.label ||
                                  'Review the requirement and update your profile.',
                              )
                            : tr('Review the requirement and update your profile.')}
                        </dd>
                      </div>
                    </dl>
                    <p className="small muted">
                      {data.evaluation.dataset_version} ·{' '}
                      {dateLabel((current || data.evaluation).evaluated_at)}
                    </p>
                  </>
                ) : (
                  <p>{tr('Choose an input to inspect its rules.')}</p>
                )}
              </div>
            </div>
            <details>
              <summary>{tr('Connected roadmap tasks')}</summary>
              {graph?.nodes
                .filter((n) => n.kind === 'task' && highlighted.has(n.id))
                .map((n) => (
                  <p key={n.id}>{tr(n.label)}</p>
                ))}
            </details>
          </div>
          <div className="lab-options panel">
            <div className="lab-board-head">
              <div>
                <span className="eyebrow">{tr('KEEP DOORS OPEN')}</span>
                <h2>{tr('Which move helps more of your options?')}</h2>
              </div>
              <span>{tr('Verified failed checks · no admission score')}</span>
            </div>
            <p className="small muted">
              {tr(
                'Counts describe conditional rule improvements. Missing timing is shown separately.',
              )}
            </p>
            <div className="lab-locks">
              {(['IELTS', 'SAT', 'ACT'] as const).map((test) => (
                <label key={test}>
                  <input
                    type="checkbox"
                    checked={(pendingWillingness || profile.test_willingness)?.[test] !== false}
                    disabled={saving || loading}
                    onChange={(e) => {
                      const next = { ...profile.test_willingness, [test]: e.target.checked };
                      setPendingWillingness(next);
                      void run(async () => {
                        try {
                          await onProfile({ ...profile, test_willingness: next });
                        } finally {
                          setPendingWillingness(null);
                        }
                      });
                    }}
                  />
                  {tr(`Willing to take ${test}`)}
                </label>
              ))}
            </div>
            <div className="lab-impact-grid">
              {data.impacts
                .filter(
                  (impact, index, list) =>
                    list.findIndex((i) => i.action.kind === impact.action.kind) === index,
                )
                .slice(0, 4)
                .map((impact) => (
                  <article key={impact.action.id}>
                    <h3>{tr(impact.action.label)}</h3>
                    <strong className="lab-impact-count">
                      {impact.programs.length}
                      <small>{tr('current options improved')}</small>
                    </strong>
                    <p>{names(impact.programs)}</p>
                    <p className="small">
                      {tr(`${impact.blockers.length} verified failed checks resolved`)} ·{' '}
                      {impact.countries.join(' / ')}
                    </p>
                    <p className="small">
                      {tr(`${impact.scenarios.length} saved scenarios also benefit`)}
                    </p>
                    {impact.scenarios.map((s) => (
                      <p className="small muted" key={s.id}>
                        {s.name}: {names(s.programs)}
                      </p>
                    ))}
                    <span className="mini-badge">
                      {tr(
                        impact.feasibility === 'UNKNOWN'
                          ? 'Timing needs verification'
                          : 'Fits the published deadline',
                      )}
                    </span>
                    <p className="small muted">{tr('No budget or country locks relaxed.')}</p>
                    <button
                      className="btn secondary small-btn"
                      onClick={() => {
                        void run(async () => {
                          const result = await request<{
                            simulation: Simulation;
                            receipts: DecisionReceipt[];
                          }>({ action: 'preview', profile, mutation: impact.action.mutation });
                          setPreview(result);
                          setChosen(null);
                        });
                        setSelection(impact.action.fields.map((f) => `input:${f}`));
                        setReceiptId(null);
                        document
                          .querySelector('.lab-xray')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {tr('Inspect this action')}
                    </button>
                  </article>
                ))}
            </div>
            {data.omittedScenarios > 0 && (
              <p>
                {tr('Some saved scenarios conflict with current constraints and were excluded.')}
              </p>
            )}
          </div>
          <div className="lab-composer panel">
            <span className="eyebrow">
              <Sparkles size={15} />
              {tr('DESCRIBE A FUTURE')}
            </span>
            <h2>{tr('Your words. A scenario you can inspect.')}</h2>
            <p>
              {tr(
                'AI extracts only the changes you request. Review them before the rules are recalculated.',
              )}
            </p>
            <p className="small muted">
              {tr(
                'Only your scenario text is sent to the AI provider. Do not include personal documents or identifiers.',
              )}
            </p>
            {!composer ? (
              <p>{tr('Scenario AI is not configured. Use the available paths instead.')}</p>
            ) : (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setComposing(true);
                    setDraft(null);
                    setPreview(null);
                    setError('');
                    request<{
                      draft: ComposerDraft;
                      mutation: Partial<Profile> | null;
                      issue: string;
                    }>({ action: 'compose', profile, text, locale })
                      .then(setDraft)
                      .catch((e) => setError(e.message))
                      .finally(() => setComposing(false));
                  }}
                >
                  <label htmlFor="future-description" className="sr-only">
                    {tr('Describe your scenario')}
                  </label>
                  <textarea
                    id="future-description"
                    maxLength={1200}
                    rows={3}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setDraft(null);
                    }}
                    placeholder={tr('For example: IELTS 6.5, no SAT, and 3000 USD more per year.')}
                    required
                  />
                  <div className="between">
                    <small>{model} · CloseRouter</small>
                    <button
                      className="btn primary"
                      disabled={composing || loading || text.trim().length < 4}
                    >
                      {composing ? <LoaderCircle size={16} /> : <Sparkles size={16} />}{' '}
                      {tr(composing ? 'Interpreting your scenario…' : 'Preview changes')}
                    </button>
                  </div>
                </form>
                {draft && (
                  <div className="lab-draft">
                    <h3>{tr('Review what AI understood')}</h3>
                    {draft.draft.operations.map((o, i) => (
                      <p key={i}>
                        <strong>
                          {tr(
                            o.type === 'IELTS_SCORE'
                              ? 'IELTS score'
                              : o.type === 'WILLINGNESS'
                                ? 'Test preferences'
                                : o.type === 'BUDGET_DELTA'
                                  ? 'Budget change'
                                  : o.type === 'COUNTRIES'
                                    ? 'Country preference'
                                    : o.type === 'COMPLETION_DATE'
                                      ? 'Expected completion date'
                                      : o.type === 'SAT_SCORE'
                                        ? 'SAT score'
                                        : 'ACT score',
                          )}{' '}
                          · {label(o.field)}
                        </strong>
                        : {value(o.number ?? o.boolean ?? o.text ?? o.countries)}
                      </p>
                    ))}
                    {draft.draft.unresolved.map((u, i) => (
                      <p key={i}>{u}</p>
                    ))}
                    {draft.issue && <p role="alert">{tr(draft.issue)}</p>}
                    {draft.mutation?.ielts && (
                      <p>
                        {tr(
                          'Unspecified IELTS bands remain unknown; overall alone may not resolve English requirements.',
                        )}
                      </p>
                    )}
                    <button
                      className="btn primary"
                      disabled={!draft.mutation || !!draft.issue || saving}
                      onClick={() =>
                        void run(async () => {
                          const result = await request<{
                            simulation: Simulation;
                            receipts: DecisionReceipt[];
                          }>({ action: 'preview', profile, draft: draft.draft });
                          setChosen(null);
                          setPreview(result);
                          setSelection(
                            Object.entries(draft.mutation!).flatMap(([k, v]) =>
                              v && typeof v === 'object'
                                ? Object.keys(v).map((f) => `input:${k}.${f}`)
                                : [`input:${k}`],
                            ),
                          );
                          setMessage(
                            tr('Scenario calculated. Your actual profile has not changed.'),
                          );
                        })
                      }
                    >
                      {tr('Confirm and simulate')}
                    </button>
                  </div>
                )}
              </>
            )}
            {preview && (
              <div className="lab-draft">
                <h3>{tr('Scenario result')}</h3>
                <p>
                  {tr(`${preview.simulation.diff.changed_states.length} program states changed`)}
                </p>
                <p>
                  {tr(
                    `${preview.simulation.diff.removed_blockers.length} requirement groups resolved`,
                  )}
                </p>
                <button
                  className="btn secondary"
                  onClick={() =>
                    document.querySelector('.lab-xray')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  {tr('Inspect the result')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

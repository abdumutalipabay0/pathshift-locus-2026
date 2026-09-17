'use client';
import { useRef, useState } from 'react';
import { profileSchema } from '@/lib/profile';
import type { Profile } from '@/lib/types';
import { useLocale } from './locale-provider';
import { downloadText } from '@/lib/journey';

export function ProfileImport({
  busy,
  onRestore,
}: {
  busy: boolean;
  onRestore: (p: Profile) => Promise<boolean | undefined>;
}) {
  const { tr } = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  return (
    <div className="profile-import">
      <button
        className="btn ghost small-btn"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {tr('Import profile')}
      </button>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        aria-label={tr('Profile backup file')}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          setCandidate(null);
          setError('');
          if (!file) return;
          try {
            if (file.size > 250000)
              throw new Error('Choose a PathShift JSON backup smaller than 250 KB.');
            const value = JSON.parse(await file.text());
            if (value.version !== 1)
              throw new Error(
                'This backup version is not supported. Export a new copy from PathShift.',
              );
            const result = profileSchema.safeParse(value.profile);
            if (!result.success)
              throw new Error(
                'The backup contains invalid profile data. Your current profile has not changed.',
              );
            setCandidate(result.data);
          } catch (err) {
            setError(
              err instanceof SyntaxError
                ? 'Choose a valid JSON backup exported from PathShift.'
                : (err as Error).message,
            );
          }
        }}
      />
      {error && (
        <p className="error-text" role="alert">
          {tr(error)}
        </p>
      )}
      {candidate && (
        <section className="import-preview panel" aria-label={tr('Review imported profile')}>
          <h2>{tr('Review imported profile')}</h2>
          <p>
            <strong>{candidate.name}</strong> · {candidate.curriculum} ·{' '}
            {candidate.intake.replace('FALL_', '')}
          </p>
          <p>
            {tr(
              'Import replaces this profile. A local backup of your current profile will be kept for Undo demo reset. Only confirm results that you actually achieved.',
            )}
          </p>
          <button
            className="btn primary"
            disabled={busy}
            onClick={async () => {
              if (await onRestore(candidate)) setCandidate(null);
            }}
          >
            {tr('Confirm import')}
          </button>{' '}
          <button className="btn secondary" disabled={busy} onClick={() => setCandidate(null)}>
            {tr('Cancel')}
          </button>
        </section>
      )}
    </div>
  );
}

type PlanItem = NonNullable<Profile['personal_plan']>[number];
export function PersonalPlanner({
  profile,
  busy,
  hypothetical,
  onChange,
}: {
  profile: Profile;
  busy: boolean;
  hypothetical: boolean;
  onChange: (p: Profile) => Promise<boolean | undefined>;
}) {
  const { tr, dateLabel } = useLocale();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<PlanItem['kind']>('STUDY');
  const [due, setDue] = useState('');
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pendingCompleted, setPendingCompleted] = useState<Record<string, boolean>>({});
  const items = profile.personal_plan ?? [];
  const clear = () => {
    setTitle('');
    setDue('');
    setNotes('');
    setEditing(null);
    setError('');
  };
  const update = async (next: PlanItem[]) => {
    const p = { ...profile, personal_plan: next };
    const valid = profileSchema.safeParse(p);
    if (!valid.success) {
      setError('Check the title and date. You can save up to 40 personal tasks.');
      return false;
    }
    const saved = await onChange(valid.data);
    if (!saved) setError('Your changes were not saved. Try again.');
    else setError('');
    return saved;
  };
  return (
    <section className="panel personal-planner" aria-label={tr('Study and activities')}>
      <details>
        <summary>
          {tr('Study and activities')} · {items.filter((t) => t.complete).length}/{items.length}
        </summary>
        <p>
          {tr(
            'Build your preparation plan: subjects to practise, projects and extracurricular activities. These are your goals, not university requirements or an admission guarantee.',
          )}
        </p>
        {hypothetical && (
          <p role="status">{tr('Discard the scenario to edit your personal plan.')}</p>
        )}
        <fieldset disabled={busy || hypothetical}>
          <div className="planner-starters">
            <button
              type="button"
              className="btn secondary small-btn"
              onClick={() => {
                clear();
                setKind('STUDY');
                setTitle(tr('Review one challenging topic'));
              }}
            >
              {tr('Plan study time')}
            </button>
            <button
              type="button"
              className="btn secondary small-btn"
              onClick={() => {
                clear();
                setKind('ACTIVITY');
                setTitle(tr('Build a small project and record what I learned'));
              }}
            >
              {tr('Plan an activity')}
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const item: PlanItem = {
                id: editing ?? crypto.randomUUID(),
                title: title.trim(),
                kind,
                due: due || null,
                notes,
                complete: items.find((t) => t.id === editing)?.complete ?? false,
              };
              if (
                await update(
                  editing ? items.map((t) => (t.id === editing ? item : t)) : [...items, item],
                )
              )
                clear();
            }}
          >
            <div className="form-grid">
              <label>
                {tr('Personal task')}
                <input
                  name="personal-task"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                {tr('Task category')}
                <select
                  name="task-category"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as PlanItem['kind'])}
                >
                  <option value="STUDY">{tr('Study')}</option>
                  <option value="ACTIVITY">{tr('Activity')}</option>
                </select>
              </label>
              <label>
                {tr('My target date')}
                <input
                  name="target-date"
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </label>
            </div>
            <label>
              {tr('Notes and evidence of progress')}
              <textarea
                name="progress-notes"
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <button className="btn primary" type="submit">
              {tr(editing ? 'Save task changes' : 'Add personal task')}
            </button>
            {editing && (
              <button type="button" className="btn ghost" onClick={clear}>
                {tr('Cancel')}
              </button>
            )}
          </form>
          {error && (
            <p className="error-text" role="alert">
              {tr(error)}
            </p>
          )}
          {!items.length && (
            <p className="muted">
              {tr('Start with one study goal and one activity you can complete this week.')}
            </p>
          )}
          <ul className="personal-task-list">
            {[...items]
              .sort(
                (a, b) =>
                  Number(a.complete) - Number(b.complete) ||
                  (a.due || '9999').localeCompare(b.due || '9999'),
              )
              .map((item) => (
                <li key={item.id}>
                  <label className="personal-task-check">
                    <input
                      type="checkbox"
                      checked={pendingCompleted[item.id] ?? item.complete}
                      onChange={async (e) => {
                        const complete = e.target.checked;
                        setPendingCompleted((prev) => ({ ...prev, [item.id]: complete }));
                        await update(items.map((t) => (t.id === item.id ? { ...t, complete } : t)));
                        setPendingCompleted((prev) => {
                          const next = { ...prev };
                          delete next[item.id];
                          return next;
                        });
                      }}
                    />
                    <strong>{item.title}</strong>
                  </label>
                  <p className="small muted">
                    {tr(item.kind === 'STUDY' ? 'Study' : 'Activity')} ·{' '}
                    {item.due ? dateLabel(item.due) : tr('No target date')}
                  </p>
                  {item.notes && <p className="personal-notes">{item.notes}</p>}
                  <button
                    className="text-button"
                    onClick={() => {
                      setEditing(item.id);
                      setTitle(item.title);
                      setKind(item.kind);
                      setDue(item.due || '');
                      setNotes(item.notes);
                    }}
                  >
                    {tr('Edit task')}
                  </button>{' '}
                  <button className="text-button" onClick={() => setRemoving(item.id)}>
                    {tr('Remove task')}
                  </button>
                  {removing === item.id && (
                    <div role="group" aria-label={tr('Confirm task removal')}>
                      <p>{tr('Remove this personal task and its notes?')}</p>
                      <button
                        className="btn secondary small-btn"
                        onClick={async () => {
                          if (await update(items.filter((t) => t.id !== item.id))) {
                            setRemoving(null);
                            if (editing === item.id) clear();
                          }
                        }}
                      >
                        {tr('Confirm removal')}
                      </button>{' '}
                      <button className="btn ghost small-btn" onClick={() => setRemoving(null)}>
                        {tr('Cancel')}
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </fieldset>
        {!!items.length && (
          <button
            className="btn secondary small-btn"
            onClick={() =>
              downloadText(
                items
                  .map(
                    (t) =>
                      `${t.complete ? '[x]' : '[ ]'} ${t.title} — ${t.due ? dateLabel(t.due) : tr('No target date')}\n${t.notes}`,
                  )
                  .join('\n\n'),
                'pathshift-personal-plan.txt',
              )
            }
          >
            {tr('Download personal plan')}
          </button>
        )}
      </details>
    </section>
  );
}

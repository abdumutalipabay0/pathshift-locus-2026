'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Download, Sparkles, X } from 'lucide-react';
import {
  backgroundTopics,
  emptyBackground,
  interestOptions,
  topicQuestions,
  type Background,
} from '@/lib/background';
import type { Profile } from '@/lib/types';
import type { CoachOutput } from '@/lib/profile-coach';
import { useLocale } from './locale-provider';
import { downloadText } from '@/lib/journey';

export function InterestPicker({
  value,
  onChange,
}: {
  value: Background;
  onChange: (b: Background) => void;
}) {
  const { tr } = useLocale();
  return (
    <div className="interest-picker">
      <h3>{tr('What draws your curiosity?')}</h3>
      <p className="muted small">{tr('Choose a few interests. You can change them later.')}</p>
      <div className="interest-options">
        {interestOptions.map((interest) => (
          <button
            key={interest}
            type="button"
            aria-pressed={value.interests.includes(interest)}
            onClick={() =>
              onChange({
                ...value,
                interests: value.interests.includes(interest)
                  ? value.interests.filter((i) => i !== interest)
                  : [...value.interests, interest],
              })
            }
          >
            {value.interests.includes(interest) && <Check size={14} />} {tr(interest)}
          </button>
        ))}
      </div>
      <label>
        {tr('What do you enjoy doing?')}
        <textarea
          maxLength={1000}
          rows={3}
          value={value.enjoys}
          placeholder={tr(
            'For example: building games, explaining maths to friends, drawing or exploring how things work.',
          )}
          onChange={(e) => onChange({ ...value, enjoys: e.target.value })}
        />
      </label>
    </div>
  );
}
export default function ApplicantPortfolio({
  profile,
  onSave,
  onEdit,
  onExplore,
  busy,
  storageKey,
}: {
  profile: Profile;
  onSave: (b: Background) => Promise<boolean>;
  onEdit: () => void;
  onExplore: () => void;
  busy: boolean;
  storageKey: string;
}) {
  const { tr, locale } = useLocale();
  const [background, setBackground] = useState<Background>(
    profile.background || structuredClone(emptyBackground),
  );
  const [topic, setTopic] = useState<(typeof backgroundTopics)[number]>('projects');
  const [reply, setReply] = useState<CoachOutput | null>(null),
    [draft, setDraft] = useState<CoachOutput | null>(null),
    [error, setError] = useState(''),
    [working, setWorking] = useState(false),
    [saved, setSaved] = useState(false);
  const abort = useRef<AbortController | null>(null),
    revision = useRef(0);
  useEffect(
    () => () => {
      abort.current?.abort();
    },
    [],
  );
  useEffect(() => {
    let alive = true;
    const rev = revision.current;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.base === JSON.stringify(profile.background || emptyBackground)) {
          import('@/lib/background').then(({ backgroundSchema }) => {
            const valid = backgroundSchema.safeParse(parsed.draft);
            if (alive && rev === revision.current && valid.success) setBackground(valid.data);
          });
        }
      }
    } catch {}
    return () => {
      alive = false;
    };
  }, [storageKey, profile.background]);
  const change = (next: Background) => {
    if (busy) return;
    revision.current++;
    abort.current?.abort();
    setWorking(false);
    setDraft(null);
    setSaved(false);
    setBackground(next);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          base: JSON.stringify(profile.background || emptyBackground),
          draft: next,
        }),
      );
    } catch {
      setError('Your draft could not be saved on this device.');
    }
  };
  const answer = background.answers.find((a) => a.topic === topic)?.text || '';
  const setAnswer = (text: string) =>
    change({
      ...background,
      answers: [...background.answers.filter((a) => a.topic !== topic), { topic, text }],
    });
  async function ask(mode: 'interview' | 'resume') {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const rev = revision.current;
    setError('');
    setWorking(true);
    setReply(null);
    setDraft(null);
    try {
      const response = await fetch('/api/profile-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          background: {
            interests: background.interests,
            enjoys: background.enjoys,
            answers: background.answers,
          },
          locale,
          mode,
          topic,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error();
      const value = (await response.json()) as CoachOutput;
      if (rev !== revision.current || controller.signal.aborted) return;
      if (mode === 'resume') setDraft(value);
      else setReply(value);
    } catch {
      if (!controller.signal.aborted)
        setError('AI could not respond. Your notes are safe. Try again.');
    } finally {
      if (abort.current === controller) setWorking(false);
    }
  }
  async function save(next = background) {
    if (await onSave(next)) {
      setBackground(next);
      setSaved(true);
      setDraft(null);
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    } else setError('Your profile could not be saved. Please try again.');
  }
  function exportResume() {
    const b = background;
    downloadText(
      [
        profile.name,
        tr('Interests'),
        b.interests.map(tr).join(', '),
        b.enjoys,
        tr('Education'),
        `${profile.curriculum} · ${profile.raw_grade}${profile.raw_scale ? ' / ' + profile.raw_scale : ''}`,
        tr('Experience'),
        ...(b.resume?.bullets.map((x) => '• ' + x.text) ||
          b.answers
            .filter((a) => a.text.trim())
            .map((a) => tr(topicLabels[a.topic]) + ': ' + a.text)),
      ].join('\n\n'),
      'pathshift-resume.txt',
    );
  }
  return (
    <section className="portfolio-page">
      <header className="portfolio-header">
        <div>
          <span className="eyebrow">{tr('MY APPLICANT PROFILE')}</span>
          <h1>{tr('More than your test scores.')}</h1>
          <p>
            {tr(
              'Bring your interests, experience and goals together. Then explore universities with your own story in mind.',
            )}
          </p>
        </div>
        <div className="portfolio-avatar" aria-hidden="true">
          {profile.name.slice(0, 1)}
        </div>
      </header>
      <div className="portfolio-layout">
        <div className="portfolio-main">
          <section className="panel">
            <InterestPicker value={background} onChange={change} />
          </section>
          <section className="panel portfolio-interview">
            <div className="between">
              <h2>{tr('Build your story')}</h2>
              <span className="small muted">
                {background.answers.filter((a) => a.text.trim()).length} / 5
              </span>
            </div>
            <p className="muted">
              {tr('Small experiences count. You do not need awards to begin.')}
            </p>
            <div className="portfolio-topics" aria-label={tr('Experience topics')}>
              {backgroundTopics.map((t) => (
                <button
                  key={t}
                  aria-pressed={topic === t}
                  onClick={() => {
                    abort.current?.abort();
                    setWorking(false);
                    setTopic(t);
                    setReply(null);
                    setError('');
                  }}
                >
                  {background.answers.find((a) => a.topic === t)?.text.trim() && (
                    <Check size={13} />
                  )}{' '}
                  {tr(topicLabels[t])}
                </button>
              ))}
            </div>
            <label className="interview-question" htmlFor="experience-answer">
              {tr(topicQuestions[topic])}
            </label>
            <textarea
              id="experience-answer"
              maxLength={2000}
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={tr(
                'What happened? What was your contribution? What did you learn? You can also say “not yet”.',
              )}
            />
            <p className="small muted">
              {tr(
                'AI receives only these interests and notes when you ask for help. Leave out contact details and private information.',
              )}
            </p>
            <div className="portfolio-actions">
              <button
                className="btn secondary"
                disabled={working}
                onClick={() => void ask('interview')}
              >
                <Sparkles size={16} />
                {tr('Help me remember and explain')}
              </button>
              <button
                className="text-button"
                onClick={() => {
                  abort.current?.abort();
                  setWorking(false);
                  setTopic(backgroundTopics[(backgroundTopics.indexOf(topic) + 1) % 5]);
                  setReply(null);
                }}
              >
                {tr('Next topic')}
                <ArrowRight size={15} />
              </button>
            </div>
            {reply && (
              <div className="coach-reply" aria-live="polite">
                <Sparkles size={18} />
                <div>
                  <p>{reply.message}</p>
                  <strong>{reply.question}</strong>
                  <p className="small muted">
                    {tr(
                      'Add your answer to the notes above. Only your notes become part of your profile.',
                    )}
                  </p>
                </div>
              </div>
            )}
          </section>
          <section className="panel resume-section">
            <div className="between">
              <h2>{tr('Your resume')}</h2>
              <button
                className="btn secondary"
                disabled={working || !background.answers.some((a) => a.text.trim())}
                onClick={() => void ask('resume')}
              >
                <Sparkles size={16} />
                {tr('Draft with AI')}
              </button>
            </div>
            <p className="muted">
              {tr(
                'Turn your real experience into clear descriptions. Review every line before saving.',
              )}
            </p>
            {draft && (
              <div className="resume-draft">
                <p>{draft.message}</p>
                {draft.bullets.map((b, i) => (
                  <div className="resume-bullet" key={i}>
                    <label>
                      {tr('Draft description')}
                      <textarea
                        rows={3}
                        maxLength={600}
                        value={b.text}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            bullets: draft.bullets.map((x, n) =>
                              n === i ? { ...x, text: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    </label>
                    <details>
                      <summary>{tr('Based on your words')}</summary>
                      <blockquote>{b.evidence}</blockquote>
                    </details>
                    <button
                      className="text-button"
                      onClick={() =>
                        setDraft({ ...draft, bullets: draft.bullets.filter((_, n) => i !== n) })
                      }
                    >
                      {tr('Remove')}
                    </button>
                  </div>
                ))}
                {draft.question && <p>{draft.question}</p>}
                {!!draft.bullets.length && (
                  <button
                    className="btn primary"
                    disabled={busy || draft.bullets.some((b) => !b.text.trim())}
                    onClick={() => void save({ ...background, resume: { bullets: draft.bullets } })}
                  >
                    {tr('I checked it — save to my profile')}
                  </button>
                )}
              </div>
            )}
            {background.resume?.bullets.length ? (
              <article className="resume-paper">
                <h2>{profile.name}</h2>
                <p>{background.interests.map(tr).join(' · ')}</p>
                {(profile.curriculum || profile.raw_grade) && (
                  <p>
                    {tr('Education')}: {profile.curriculum} {profile.raw_grade}
                    {profile.raw_scale ? ' / ' + profile.raw_scale : ''}
                  </p>
                )}
                <h3>{tr('Experience')}</h3>
                <ul className="resume-preview">
                  {background.resume.bullets.map((b, i) => (
                    <li key={i}>{b.text}</li>
                  ))}
                </ul>
              </article>
            ) : (
              !draft && (
                <p className="resume-empty">
                  {tr(
                    'Your resume starts with the experiences above. Nothing is invented or added automatically.',
                  )}
                </p>
              )
            )}
            {!!background.resume?.bullets.length && (
              <button className="btn secondary" onClick={() => window.print()}>
                {tr('Print or save as PDF')}
              </button>
            )}
            <button className="text-button" onClick={exportResume}>
              <Download size={16} />
              {tr('Download my resume')}
            </button>
          </section>
        </div>
        <aside className="portfolio-aside">
          <section className="panel">
            <h2>{profile.name}</h2>
            <p>{tr('Interests → experience → university → application')}</p>
            <dl>
              <div>
                <dt>IELTS</dt>
                <dd>{profile.ielts.overall ?? '—'}</dd>
              </div>
              <div>
                <dt>SAT</dt>
                <dd>{profile.sat.score ?? '—'}</dd>
              </div>
              <div>
                <dt>{tr('Education')}</dt>
                <dd>{profile.curriculum || '—'}</dd>
              </div>
            </dl>
            <button className="btn secondary" onClick={onEdit}>
              {tr('Grades, tests and budget')}
            </button>
          </section>
          <section className="panel">
            <h3>{tr('Your next step')}</h3>
            <p>{tr('Save your story, then meet the universities and check their requirements.')}</p>
            <button className="btn primary" disabled={busy} onClick={() => void save()}>
              {tr(busy ? 'Saving your profile…' : 'Save my story')}
            </button>
            <button className="text-button" onClick={onExplore}>
              {tr('Explore universities')}
              <ArrowRight size={15} />
            </button>
          </section>
        </aside>
      </div>
      {working && (
        <div className="coach-progress" role="status">
          {tr('AI is helping with your story…')}
          <button
            className="text-button"
            onClick={() => {
              abort.current?.abort();
              setWorking(false);
            }}
          >
            <X size={15} />
            {tr('Stop')}
          </button>
        </div>
      )}
      {error && (
        <p className="error-box" role="alert">
          {tr(error)}
        </p>
      )}
      {saved && (
        <p role="status" className="success-box">
          {tr('Your story is saved.')}
        </p>
      )}
    </section>
  );
}
const topicLabels = {
  projects: 'Projects',
  competitions: 'Competitions',
  research: 'Research',
  community: 'Community and responsibility',
  goals: 'Goals',
};

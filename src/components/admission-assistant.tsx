'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CornerDownLeft, LoaderCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import type { AssistantAnswer } from '@/lib/admission-assistant';
import type { Evaluation } from '@/lib/types';
import { useLocale } from './locale-provider';
import { resultCaption } from './research-details';
const starters = [
  'I have IELTS 6.0 and I’m considering UW–Madison and Waterloo. What should I check first, and why?',
  'What should I do first, and why?',
  'What is missing from my application?',
  'How can I prepare for my area of interest?',
];
const actionLabels = {
  profile: 'Edit your details',
  roadmap: 'Open my roadmap',
  compare: 'Compare paths',
  lab: 'Test a what-if scenario',
  map: 'Explore universities',
  program: 'See requirements and next steps',
};
export default function AdmissionAssistant({
  evaluation,
  initialQuestion = '',
  onQuestionUsed,
  onAction,
}: {
  evaluation: Evaluation;
  initialQuestion?: string;
  onQuestionUsed?: () => void;
  onAction: (
    action: AssistantAnswer['action'],
    program: string | null,
    compareIds?: string[],
  ) => void;
}) {
  const { tr, locale } = useLocale();
  const [question, setQuestion] = useState(initialQuestion);
  const [turns, setTurns] = useState<{ question: string; answer: AssistantAnswer }[]>([]);
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [retryQuestion, setRetryQuestion] = useState('');
  const controller = useRef<AbortController | null>(null);
  const result = useRef<HTMLDivElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(text: string) {
    if (controller.current || text.trim().length < 4) return;
    const request = new AbortController();
    controller.current = request;
    setPending(text.trim());
    setRetryQuestion(text.trim());
    setError('');
    const timeout = setTimeout(() => request.abort(), 45000);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: request.signal,
        body: JSON.stringify({
          profile: evaluation.profile,
          question: text.trim(),
          locale,
          history: turns.slice(-3).flatMap((t) => [
            { role: 'user', content: t.question },
            {
              role: 'assistant',
              content: JSON.stringify({
                answer: t.answer.answer,
                points: t.answer.points,
                next_step: t.answer.next_step,
              }).slice(0, 6000),
            },
          ]),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error === 'RATE_LIMIT'
            ? 'Please wait a minute before another AI request.'
            : 'The assistant could not answer. Try again or open your plan.',
        );
      if (request.signal.aborted) return;
      setTurns((previous) => [...previous, { question: text.trim(), answer: data }].slice(-10));
      setQuestion('');
      requestAnimationFrame(() => result.current?.focus());
    } catch (e) {
      if (controller.current === request)
        setError(
          request.signal.aborted
            ? 'The request stopped. You can ask again.'
            : e instanceof Error
              ? e.message
              : 'The assistant could not answer. Try again or open your plan.',
        );
    } finally {
      clearTimeout(timeout);
      if (controller.current === request) {
        controller.current = null;
        setPending('');
      }
    }
  }
  const last = turns.at(-1);
  return (
    <section className="admission-assistant" aria-label={tr('AI admission assistant')}>
      <header className="assistant-heading">
        <div>
          <span className="eyebrow">{tr('LIVE AI · PROFILE + SOURCES')}</span>
          <h1>{tr('Turn your questions into a next step.')}</h1>
          <p>{tr('Your profile is included. Ask one question to get started.')}</p>
        </div>
        {turns.length > 0 && (
          <button
            className="btn secondary small-btn"
            onClick={() => {
              controller.current?.abort();
              controller.current = null;
              setPending('');
              setTurns([]);
              onQuestionUsed?.();
              setQuestion('');
              setError('');
            }}
          >
            <RotateCcw size={15} />
            {tr('New conversation')}
          </button>
        )}
      </header>
      <div className="assistant-layout">
        <div className="assistant-conversation panel">
          {!turns.length && !initialQuestion && (
            <div className="assistant-welcome">
              <div className="assistant-starters">
                {starters.map((s) => (
                  <button key={s} disabled={!!pending} onClick={() => void send(tr(s))}>
                    {tr(s)}
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="assistant-transcript" aria-label={tr('Conversation')}>
            {turns.map((turn, i) => (
              <article className="assistant-turn" key={i}>
                <p className="assistant-question">
                  <strong>{tr('Your question')}</strong>
                  {turn.question}
                </p>
                <div
                  ref={i === turns.length - 1 ? result : undefined}
                  tabIndex={-1}
                  className="assistant-answer"
                >
                  <span className="assistant-answer-status">
                    <ShieldCheck size={14} />
                    {tr('Checked against your saved profile and available evidence')}
                  </span>
                  <p>{turn.answer.answer}</p>
                  <ul>
                    {turn.answer.points.map((point, j) => (
                      <li key={j}>
                        {point.text}
                        {point.source_ids.length > 0 && (
                          <span className="assistant-citations">
                            {point.source_ids.map((id) => (
                              <a
                                key={id}
                                href={`#assistant-source-${i}-${id}`}
                                onClick={() => {
                                  const details = document
                                    .getElementById(`assistant-source-${i}-${id}`)
                                    ?.closest('details');
                                  if (details) details.open = true;
                                }}
                                aria-label={`${tr('Source proof ')}${turn.answer.sources.findIndex((s) => s.id === id) + 1}`}
                              >
                                [{turn.answer.sources.findIndex((s) => s.id === id) + 1}]
                              </a>
                            ))}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="assistant-next">
                    <span className="eyebrow">{tr('Your next move')}</span>
                    <p>{turn.answer.next_step}</p>
                    <button
                      className="btn primary small-btn"
                      onClick={() =>
                        onAction(
                          turn.answer.action,
                          turn.answer.program_id,
                          turn.answer.compare_ids,
                        )
                      }
                    >
                      {tr(actionLabels[turn.answer.action])}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  {!!turn.answer.program_ids?.length && (
                    <details className="assistant-checks">
                      <summary>{tr('Profile checks')}</summary>
                      <p className="small muted">
                        {tr(
                          'Calculated from your saved profile, separately from the AI explanation.',
                        )}
                      </p>
                      {turn.answer.program_ids.map((id) => {
                        const checked = evaluation.programs.find((r) => r.program.id === id);
                        return checked ? (
                          <div key={id}>
                            <button className="text-button" onClick={() => onAction('program', id)}>
                              {checked.program.short}
                            </button>
                            <p>{tr(resultCaption(checked))}</p>
                            {checked.program.conditional && (
                              <p className="small muted">{tr(checked.program.conditional.note)}</p>
                            )}
                          </div>
                        ) : null;
                      })}
                    </details>
                  )}
                  {!!turn.answer.sources.length && (
                    <details className="assistant-sources">
                      <summary>
                        <ShieldCheck size={15} />
                        {tr('Sources used in this answer')} ({turn.answer.sources.length})
                      </summary>
                      {turn.answer.sources.map((s, j) => (
                        <div key={s.id} id={`assistant-source-${i}-${s.id}`}>
                          <strong>
                            [{j + 1}] {tr(s.title)}
                          </strong>
                          <p>{tr(s.statement)}</p>
                          <span className="small muted">
                            {s.intake} · {tr(s.evidence)}
                          </span>
                          {s.url && (
                            <a href={s.url} target="_blank" rel="noreferrer">
                              {tr('Open official source ')}
                            </a>
                          )}
                        </div>
                      ))}
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
          {pending && (
            <div className="assistant-pending" role="status">
              <LoaderCircle size={18} className="spin" />
              {tr('Checking your profile and sources…')}
              <button className="text-button" onClick={() => controller.current?.abort()}>
                {tr('Stop response')}
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="assistant-error">
              {tr(error)}{' '}
              <button
                className="text-button"
                disabled={!!pending}
                onClick={() => void send(retryQuestion)}
              >
                {tr('Retry question')}
              </button>{' '}
              <button className="text-button" onClick={() => onAction('roadmap', null)}>
                {tr('Open my roadmap')}
              </button>
            </p>
          )}
          {last && !pending && (
            <div className="assistant-followups">
              {last.answer.followups.map((q, i) => (
                <button className="btn secondary small-btn" key={i} onClick={() => void send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(question);
            }}
            className="assistant-form"
          >
            <label htmlFor="assistant-question">{tr('Ask about your next step')}</label>
            <textarea
              id="assistant-question"
              value={question}
              maxLength={1600}
              rows={2}
              disabled={!!pending}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={tr('Ask about a university, a requirement or your next step.')}
            />
            <div className="between">
              <span className="small muted">{question.length}/1600</span>
              <button
                className="btn primary"
                disabled={!!pending || question.trim().length < 4}
                type="submit"
              >
                {tr('Ask assistant')}
                <CornerDownLeft size={16} />
              </button>
            </div>
            <p className="small muted">
              {tr(
                'Your question and academic profile are sent to AI. Verify sources before applying.',
              )}
            </p>
            <details className="assistant-disclosure">
              <summary>{tr('Privacy and conversation')}</summary>
              <p>
                {tr(
                  'Sending shares your question, recent conversation and selected academic profile data with CloseRouter. Your account email, name and personal notes are not sent automatically. Do not include private documents.',
                )}
              </p>
              <p>
                {tr(
                  'AI explanations can be mistaken. Check the linked evidence before applying. Conversation stays in this page and resets when you leave, change language or update your profile.',
                )}
              </p>
            </details>
          </form>
        </div>
      </div>
    </section>
  );
}

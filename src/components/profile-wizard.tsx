'use client';
import { useLocale } from './locale-provider';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  GraduationCap,
  BookOpen,
  Languages,
  Wallet,
  FileCheck2,
} from 'lucide-react';
import type { Profile } from '@/lib/types';
import { profileSchema } from '@/lib/profile';
import { SchoolFields } from './school-fields';
const steps = ['Your direction', 'Academics', 'Tests & language', 'Budget & readiness'];
export default function ProfileWizard({
  initial,
  onSave,
  onCancel,
  initialStep = 0,
  onDraft,
  programs = [],
}: {
  initial: Profile;
  onSave: (p: Profile) => void;
  onCancel: () => void;
  initialStep?: number;
  onDraft?: (p: Profile, step: number) => void;
  programs?: { id: string; short: string }[];
}) {
  const { tr } = useLocale();

  const [p, setP] = useState(() => structuredClone(initial));
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    onDraft?.(p, step);
  }, [p, step, onDraft]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error, step]);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setP((prev) => ({ ...prev, [key]: value }));
  const numeric = (v: string) => (v === '' ? null : Number(v));
  const save = () => {
    const result = profileSchema.safeParse(p);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = String(issue.path[0]);
      const target = ['name', 'age', 'citizenship', 'countries', 'major', 'intake'].includes(field)
        ? 0
        : ['ielts', 'sat', 'act', 'expected_score_date'].includes(field)
          ? 2
          : ['budgets', 'aif', 'documents_by_program'].includes(field)
            ? 3
            : 1;
      setStep(target);
      setError(
        field === 'age'
          ? 'Age must be between 10 and 100.'
          : field === 'name'
            ? 'Enter your name to continue.'
            : issue.code === 'custom'
              ? issue.message
              : 'Check the profile fields and enter valid values.',
      );
      return;
    }
    onSave(result.data);
  };
  return (
    <section className="wizard panel">
      <div className="eyebrow">{tr('YOUR ADMISSION PROFILE')}</div>
      <h1>{tr('Start with where you are.')}</h1>
      <p className="muted">
        {tr('A few details help us turn requirements into a plan that belongs to you. ')}
      </p>
      <p className="notice">
        {tr(
          'This workspace covers 12 Computer Science programs for international first-year entry in Fall 2027. IB is the best-supported curriculum; other routes may need verification.',
        )}
      </p>
      <p className="small muted">
        {tr('Your unfinished profile is saved as a draft on this device.')}
      </p>
      <ol className="wizard-steps">
        {steps.map((s, i) => (
          <li key={s} className={i === step ? 'active' : i < step ? 'done' : ''}>
            <button onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}>
              <span>{i < step ? <Check size={14} /> : i + 1}</span>
              {tr(s)}
            </button>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) {
            if (step === 0 && !p.name.trim()) {
              setError('Enter your name to continue.');
              return;
            }
            setError('');
            setStep(step + 1);
          } else save();
        }}
      >
        {step === 0 && (
          <div className="form-section">
            <GraduationCap className="section-icon" />
            <h2>{tr('What’s your next chapter?')}</h2>
            <div className="form-grid">
              <label>
                {tr('Your name ')}
                <input
                  autoComplete="given-name"
                  name="name"
                  value={p.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder={tr('e.g. Aruzhan')}
                  required
                  maxLength={60}
                />
              </label>
              <label>
                {tr('Age ')}
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={p.age}
                  onChange={(e) => set('age', Number(e.target.value))}
                />
              </label>
              <label>
                {tr('Citizenship ')}
                <input
                  value={p.citizenship}
                  onChange={(e) => set('citizenship', e.target.value)}
                  autoComplete="country-name"
                />
              </label>
              <label>
                {tr('Application type ')}
                <select
                  value={p.applicant_type}
                  onChange={(e) => set('applicant_type', e.target.value)}
                >
                  <option value="FIRST_YEAR_INTERNATIONAL">{tr('International first-year')}</option>
                  <option value="TRANSFER">{tr('Transfer · limited evidence')}</option>
                </select>
              </label>
              <label>
                {tr('Field of study ')}
                <select value={p.major} onChange={(e) => set('major', e.target.value)}>
                  <option value="Computer Science">{tr('Computer Science')}</option>
                  <option value="Medicine">{tr('Medicine')}</option>
                  <option value="Business">{tr('Business')}</option>
                </select>
              </label>
              <label>
                {tr('Start term ')}
                <select value={p.intake} onChange={(e) => set('intake', e.target.value)}>
                  <option value="FALL_2027">{tr('Fall 2027')}</option>
                  <option value="FALL_2028">{tr('Fall 2028 · not yet verified')}</option>
                </select>
              </label>
            </div>
            <fieldset>
              <legend>{tr('Where would you like to study?')}</legend>
              <div className="choice-row">
                {['US', 'Canada', 'UK'].map((c) => (
                  <label className={`choice ${p.countries.includes(c) ? 'selected' : ''}`} key={c}>
                    <input
                      type="checkbox"
                      checked={p.countries.includes(c)}
                      onChange={() =>
                        setP((prev) => {
                          const countries = prev.countries.includes(c)
                            ? prev.countries.filter((v) => v !== c)
                            : [...prev.countries, c];
                          return {
                            ...prev,
                            countries,
                            country_locks: prev.geography_flexible ? [] : countries,
                          };
                        })
                      }
                    />
                    {tr(c === 'US' ? 'United States' : c === 'UK' ? 'United Kingdom' : c)}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={!p.geography_flexible}
                onChange={(e) => {
                  set('geography_flexible', !e.target.checked);
                  set('country_locks', e.target.checked ? [...p.countries] : []);
                }}
              />
              {tr('Keep these countries as a hard constraint ')}
            </label>
            <label>
              {tr('Your current interest ')}
              <select value={p.interest} onChange={(e) => set('interest', e.target.value)}>
                <option value="Exploring CS">{tr('Exploring CS')}</option>
                <option value="Artificial intelligence">{tr('Artificial intelligence')}</option>
                <option value="Software engineering">{tr('Software engineering')}</option>
                <option value="Theory & mathematics">{tr('Theory & mathematics')}</option>
                <option value="Human-computer interaction">
                  {tr('Human-computer interaction')}
                </option>
              </select>
            </label>
            <p className="field-note">
              {tr(
                'We use interests to personalize planning prompts. They never change admission requirements. ',
              )}
            </p>
          </div>
        )}
        {step === 1 && (
          <div className="form-section">
            <BookOpen className="section-icon" />
            <h2>{tr('Your education, in its own terms.')}</h2>
            <p className="muted">
              {tr(
                'Keep your original grading scale. We never convert grades into an invented GPA. ',
              )}
            </p>
            <div className="form-grid">
              <label>
                {tr('School curriculum ')}
                <select value={p.curriculum} onChange={(e) => set('curriculum', e.target.value)}>
                  <option value="IB">{tr('IB')}</option>
                  <option value="Kazakhstan national">{tr('Kazakhstan national')}</option>
                  <option value="A-Level">{tr('A-Level')}</option>
                  <option value="US high school">{tr('US high school')}</option>
                  <option value="Other">{tr('Other')}</option>
                </select>
              </label>
              <label>
                {tr('School status ')}
                <select
                  value={String(p.academics_completed)}
                  onChange={(e) => set('academics_completed', e.target.value === 'true')}
                >
                  <option value="false">{tr('Currently studying')}</option>
                  <option value="true">{tr('Completed')}</option>
                </select>
              </label>
              <label>
                {tr('Grade / predicted total ')}
                <input
                  value={p.raw_grade}
                  onChange={(e) => set('raw_grade', e.target.value)}
                  placeholder={tr('e.g. 42 or 4.8')}
                />
              </label>
              <label>
                {tr('Original scale ')}
                <input
                  value={p.raw_scale}
                  onChange={(e) => set('raw_scale', e.target.value)}
                  placeholder={tr('e.g. 45 or 5.0')}
                />
              </label>
            </div>
            {p.curriculum === 'IB' && (
              <div className="form-grid">
                <label>
                  {tr('IB bonus points (TOK / EE)')}
                  <input
                    type="number"
                    min={0}
                    max={3}
                    step={1}
                    value={p.ib_core_points ?? ''}
                    onChange={(e) => set('ib_core_points', numeric(e.target.value))}
                  />
                </label>
                <label>
                  {tr('English B HL score')}
                  <input
                    type="number"
                    min={1}
                    max={7}
                    step={1}
                    value={p.english_b_hl ?? ''}
                    onChange={(e) => set('english_b_hl', numeric(e.target.value))}
                  />
                </label>
                <p className="field-note">
                  {tr(
                    'Waterloo counts subject points out of 42, excluding up to 3 bonus points. Keep your overall IB total on the original 45-point scale.',
                  )}
                </p>
              </div>
            )}
            {p.curriculum === 'IB' ? (
              <>
                <div className="form-grid">
                  <label>
                    {tr('IB total ')}
                    <input
                      type="number"
                      min="0"
                      max="45"
                      value={p.ib_total ?? ''}
                      onChange={(e) => set('ib_total', numeric(e.target.value))}
                    />
                  </label>
                  <label>
                    {tr('Math Analysis & Approaches HL ')}
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={p.math_aa_hl ?? ''}
                      onChange={(e) => set('math_aa_hl', numeric(e.target.value))}
                      placeholder={tr('Leave blank if not taken')}
                    />
                  </label>
                  <label>
                    {tr('Number of IB courses ')}
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={p.ib_courses ?? ''}
                      onChange={(e) => set('ib_courses', numeric(e.target.value))}
                    />
                  </label>
                  <label>
                    {tr('Higher Level courses ')}
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={p.hl_courses ?? ''}
                      onChange={(e) => set('hl_courses', numeric(e.target.value))}
                    />
                  </label>
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={p.ib_diploma === true}
                    onChange={(e) => set('ib_diploma', e.target.checked)}
                  />
                  {tr('IB Diploma completed or on track ')}
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={p.english_a === true}
                    onChange={(e) => set('english_a', e.target.checked)}
                  />
                  {tr('Taking / completed IB English A at HL or SL ')}
                </label>
              </>
            ) : (
              <div className="notice">
                {tr(
                  'We can assess supported test requirements. Academic equivalency for this curriculum still needs verification. ',
                )}
              </div>
            )}
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={p.senior_english === true}
                onChange={(e) => set('senior_english', e.target.checked)}
              />
              {tr('Taking / completed senior academic English ')}
            </label>
            <SchoolFields value={p.school} onChange={(school) => set('school', school)} />
          </div>
        )}
        {step === 2 && (
          <div className="form-section">
            <Languages className="section-icon" />
            <h2>{tr('Let’s look at your test results.')}</h2>
            <div className="form-grid">
              <label>
                {tr('IELTS Academic status ')}
                <select
                  value={p.ielts.status}
                  onChange={(e) => set('ielts', { ...p.ielts, status: e.target.value })}
                >
                  <option value="MISSING">{tr('Not taken')}</option>
                  <option value="PLANNED">{tr('Planned')}</option>
                  <option value="VALID">{tr('Completed')}</option>
                </select>
              </label>
              <label>
                {tr('IELTS test date ')}
                <input
                  type="date"
                  value={p.ielts.date || ''}
                  onChange={(e) => set('ielts', { ...p.ielts, date: e.target.value || null })}
                />
              </label>
            </div>
            <div className="score-grid">
              {(['overall', 'reading', 'writing', 'listening', 'speaking'] as const).map((key) => (
                <label key={key}>
                  {tr(key)}
                  <input
                    aria-label={tr(`IELTS ${key}`)}
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={p.ielts[key] ?? ''}
                    onChange={(e) => set('ielts', { ...p.ielts, [key]: numeric(e.target.value) })}
                  />
                </label>
              ))}
            </div>
            <p className="field-note">
              {tr(
                'Overall and individual bands are checked separately. Planned scores do not count as achieved results. ',
              )}
            </p>
            {(['sat', 'act'] as const).map((key) => (
              <div className="test-row form-grid" key={key}>
                <label>
                  {tr(key.toUpperCase())} {tr(' status ')}
                  <select
                    value={p[key].status}
                    onChange={(e) => set(key, { ...p[key], status: e.target.value })}
                  >
                    <option value="MISSING">{tr('Not taken')}</option>
                    <option value="PLANNED">{tr('Planned')}</option>
                    <option value="VALID">{tr('Completed')}</option>
                  </select>
                </label>
                <label>
                  {tr(key.toUpperCase())} {tr(' score ')}
                  <input
                    type="number"
                    min={key === 'sat' ? 400 : 1}
                    max={key === 'sat' ? 1600 : 36}
                    value={p[key].score ?? ''}
                    onChange={(e) => set(key, { ...p[key], score: numeric(e.target.value) })}
                  />
                </label>
                <label>
                  {tr(key.toUpperCase())} {tr(' test date ')}
                  <input
                    type="date"
                    value={p[key].date || ''}
                    onChange={(e) => set(key, { ...p[key], date: e.target.value || null })}
                  />
                </label>
              </div>
            ))}
            <label>
              {tr('Expected arrival date for your next result / documents ')}
              <input
                type="date"
                value={p.expected_score_date || ''}
                onChange={(e) => set('expected_score_date', e.target.value || null)}
              />
            </label>
            <p className="field-note">
              {tr(
                'Use a date that includes score delivery. Unknown timing stays unconfirmed. IELTS is the currently supported numeric English test in this workspace. ',
              )}
            </p>
          </div>
        )}
        {step === 3 && (
          <div className="form-section">
            <Wallet className="section-icon" />
            <h2>{tr('A plan that respects your budget.')}</h2>
            <p className="muted">
              {tr(
                'Your maximum annual budget, including tuition, required fees and living expenses. ',
              )}
            </p>
            <div className="form-grid three">
              {(['USD', 'CAD', 'GBP'] as const).map((c) => (
                <label key={c}>
                  {tr('Annual budget · ')}
                  {tr(c)}
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={p.budgets[c] ?? ''}
                    onChange={(e) => set('budgets', { ...p.budgets, [c]: numeric(e.target.value) })}
                    placeholder={tr('Unknown')}
                  />
                </label>
              ))}
            </div>
            <p className="field-note">
              {tr('Each currency is compared separately. No guessed exchange rates. ')}
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={p.budget_hard}
                onChange={(e) => set('budget_hard', e.target.checked)}
              />
              {tr('My budget is a hard limit ')}
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={p.financial_flexibility}
                onChange={(e) => set('financial_flexibility', e.target.checked)}
              />
              {tr('Allow scenarios with a higher budget ')}
            </label>
            <div className="form-divider" />
            <FileCheck2 className="section-icon" />
            <h2>{tr('Application readiness')}</h2>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={
                  p.shortlist.length > 0 &&
                  p.shortlist.every((id) => p.documents_by_program?.[id] === true)
                }
                disabled={!p.shortlist.length}
                onChange={(e) =>
                  setP((prev) => ({
                    ...prev,
                    documents_ready: false,
                    documents_by_program: {
                      ...prev.documents_by_program,
                      ...Object.fromEntries(prev.shortlist.map((id) => [id, e.target.checked])),
                    },
                  }))
                }
              />
              {tr(
                'I have checked the official document lists for my shortlist, prepared transcripts / translations, and completed required supplementary forms ',
              )}
            </label>
            {programs
              .filter((program) => p.shortlist.includes(program.id))
              .map((program) => (
                <label className="checkbox-row" key={program.id}>
                  <input
                    type="checkbox"
                    checked={p.documents_by_program?.[program.id] === true}
                    onChange={(e) =>
                      set('documents_by_program', {
                        ...p.documents_by_program,
                        [program.id]: e.target.checked,
                      })
                    }
                  />
                  {tr('Documents checked for')} {program.short}
                </label>
              ))}
            {!p.shortlist.length && (
              <p className="field-note">
                {tr(
                  'Save programs first, then confirm each institution’s document checklist here.',
                )}
              </p>
            )}
            <p className="field-note">
              {tr(
                'For Waterloo this includes DAE and the CS Supplementary Information Form. AIF is recorded separately below. This is your declaration; PathShift does not verify or send documents. ',
              )}
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={p.aif}
                onChange={(e) => set('aif', e.target.checked)}
              />
              {tr('I have submitted Waterloo’s Admission Information Form (AIF) ')}
            </label>
          </div>
        )}
        {tr(
          error && (
            <p ref={errorRef} tabIndex={-1} role="alert" className="error-box">
              {tr(error)}
            </p>
          ),
        )}
        <div className="wizard-footer">
          <button
            type="button"
            className="btn secondary"
            onClick={() => (step ? setStep(step - 1) : onCancel())}
          >
            <ArrowLeft size={16} />
            {tr(step ? 'Back' : 'Cancel')}
          </button>
          <span className="muted small">
            {tr('Step ')}
            {step + 1} {tr(' of 4')}
          </span>
          <button className="btn primary" type="submit">
            {tr(step === 3 ? 'Build my opportunity map' : 'Continue')}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </section>
  );
}

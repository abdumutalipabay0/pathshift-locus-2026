'use client';
import { useState } from 'react';
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
const steps = ['Your direction', 'Academics', 'Tests & language', 'Budget & readiness'];
export default function ProfileWizard({
  initial,
  onSave,
  onCancel,
}: {
  initial: Profile;
  onSave: (p: Profile) => void;
  onCancel: () => void;
}) {
  const [p, setP] = useState(() => structuredClone(initial));
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setP((prev) => ({ ...prev, [key]: value }));
  const numeric = (v: string) => (v === '' ? null : Number(v));
  const save = () => {
    const result = profileSchema.safeParse(p);
    if (!result.success) {
      setError(result.error.issues.map((i) => `${i.path.join(' ')}: ${i.message}`).join(' '));
      return;
    }
    onSave(result.data);
  };
  return (
    <section className="wizard panel">
      <div className="eyebrow">YOUR ADMISSION PROFILE</div>
      <h1>Start with where you are.</h1>
      <p className="muted">
        A few details help us turn requirements into a plan that belongs to you.
      </p>
      <ol className="wizard-steps">
        {steps.map((s, i) => (
          <li key={s} className={i === step ? 'active' : i < step ? 'done' : ''}>
            <button onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}>
              <span>{i < step ? <Check size={14} /> : i + 1}</span>
              {s}
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
            <h2>What’s your next chapter?</h2>
            <div className="form-grid">
              <label>
                Your name
                <input
                  autoComplete="given-name"
                  name="name"
                  value={p.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Aruzhan"
                  required
                  maxLength={60}
                />
              </label>
              <label>
                Age
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={p.age}
                  onChange={(e) => set('age', Number(e.target.value))}
                />
              </label>
              <label>
                Citizenship
                <input
                  value={p.citizenship}
                  onChange={(e) => set('citizenship', e.target.value)}
                  autoComplete="country-name"
                />
              </label>
              <label>
                Application type
                <select
                  value={p.applicant_type}
                  onChange={(e) => set('applicant_type', e.target.value)}
                >
                  <option value="FIRST_YEAR_INTERNATIONAL">International first-year</option>
                  <option value="TRANSFER">Transfer · limited evidence</option>
                </select>
              </label>
              <label>
                Field of study
                <select value={p.major} onChange={(e) => set('major', e.target.value)}>
                  <option>Computer Science</option>
                  <option>Medicine</option>
                  <option>Business</option>
                </select>
              </label>
              <label>
                Start term
                <select value={p.intake} onChange={(e) => set('intake', e.target.value)}>
                  <option value="FALL_2027">Fall 2027</option>
                  <option value="FALL_2028">Fall 2028 · not yet verified</option>
                </select>
              </label>
            </div>
            <fieldset>
              <legend>Where would you like to study?</legend>
              <div className="choice-row">
                {['US', 'Canada', 'UK'].map((c) => (
                  <label className={`choice ${p.countries.includes(c) ? 'selected' : ''}`} key={c}>
                    <input
                      type="checkbox"
                      checked={p.countries.includes(c)}
                      onChange={() =>
                        set(
                          'countries',
                          p.countries.includes(c)
                            ? p.countries.filter((v) => v !== c)
                            : [...p.countries, c],
                        )
                      }
                    />
                    {c === 'US' ? 'United States' : c === 'UK' ? 'United Kingdom' : c}
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
              Keep these countries as a hard constraint
            </label>
            <label>
              Your current interest
              <select value={p.interest} onChange={(e) => set('interest', e.target.value)}>
                <option>Exploring CS</option>
                <option>Artificial intelligence</option>
                <option>Software engineering</option>
                <option>Theory & mathematics</option>
                <option>Human-computer interaction</option>
              </select>
            </label>
            <p className="field-note">
              We use interests to personalize planning prompts. They never change admission
              requirements.
            </p>
          </div>
        )}
        {step === 1 && (
          <div className="form-section">
            <BookOpen className="section-icon" />
            <h2>Your education, in its own terms.</h2>
            <p className="muted">
              Keep your original grading scale. We never convert grades into an invented GPA.
            </p>
            <div className="form-grid">
              <label>
                School curriculum
                <select value={p.curriculum} onChange={(e) => set('curriculum', e.target.value)}>
                  <option>IB</option>
                  <option>Kazakhstan national</option>
                  <option>A-Level</option>
                  <option>US high school</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                School status
                <select
                  value={String(p.academics_completed)}
                  onChange={(e) => set('academics_completed', e.target.value === 'true')}
                >
                  <option value="false">Currently studying</option>
                  <option value="true">Completed</option>
                </select>
              </label>
              <label>
                Grade / predicted total
                <input
                  value={p.raw_grade}
                  onChange={(e) => set('raw_grade', e.target.value)}
                  placeholder="e.g. 42 or 4.8"
                />
              </label>
              <label>
                Original scale
                <input
                  value={p.raw_scale}
                  onChange={(e) => set('raw_scale', e.target.value)}
                  placeholder="e.g. 45 or 5.0"
                />
              </label>
            </div>
            {p.curriculum === 'IB' ? (
              <>
                <div className="form-grid">
                  <label>
                    IB total
                    <input
                      type="number"
                      min="0"
                      max="45"
                      value={p.ib_total ?? ''}
                      onChange={(e) => set('ib_total', numeric(e.target.value))}
                    />
                  </label>
                  <label>
                    Math Analysis & Approaches HL
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={p.math_aa_hl ?? ''}
                      onChange={(e) => set('math_aa_hl', numeric(e.target.value))}
                      placeholder="Leave blank if not taken"
                    />
                  </label>
                  <label>
                    Number of IB courses
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={p.ib_courses ?? ''}
                      onChange={(e) => set('ib_courses', numeric(e.target.value))}
                    />
                  </label>
                  <label>
                    Higher Level courses
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
                  IB Diploma completed or on track
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={p.english_a === true}
                    onChange={(e) => set('english_a', e.target.checked)}
                  />
                  Taking / completed IB English A at HL or SL
                </label>
              </>
            ) : (
              <div className="notice">
                We can assess supported test requirements. Academic equivalency for this curriculum
                still needs verification.
              </div>
            )}
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={p.senior_english === true}
                onChange={(e) => set('senior_english', e.target.checked)}
              />
              Taking / completed senior academic English
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="form-section">
            <Languages className="section-icon" />
            <h2>Let’s look at your test results.</h2>
            <div className="form-grid">
              <label>
                IELTS Academic status
                <select
                  value={p.ielts.status}
                  onChange={(e) => set('ielts', { ...p.ielts, status: e.target.value })}
                >
                  <option value="MISSING">Not taken</option>
                  <option value="PLANNED">Planned</option>
                  <option value="VALID">Completed</option>
                </select>
              </label>
              <label>
                IELTS test date
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
                  {key}
                  <input
                    aria-label={`IELTS ${key}`}
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
              Overall and individual bands are checked separately. Planned scores do not count as
              achieved results.
            </p>
            {(['sat', 'act'] as const).map((key) => (
              <div className="test-row form-grid" key={key}>
                <label>
                  {key.toUpperCase()} status
                  <select
                    value={p[key].status}
                    onChange={(e) => set(key, { ...p[key], status: e.target.value })}
                  >
                    <option value="MISSING">Not taken</option>
                    <option value="PLANNED">Planned</option>
                    <option value="VALID">Completed</option>
                  </select>
                </label>
                <label>
                  {key.toUpperCase()} score
                  <input
                    type="number"
                    min={key === 'sat' ? 400 : 1}
                    max={key === 'sat' ? 1600 : 36}
                    value={p[key].score ?? ''}
                    onChange={(e) => set(key, { ...p[key], score: numeric(e.target.value) })}
                  />
                </label>
                <label>
                  {key.toUpperCase()} test date
                  <input
                    type="date"
                    value={p[key].date || ''}
                    onChange={(e) => set(key, { ...p[key], date: e.target.value || null })}
                  />
                </label>
              </div>
            ))}
            <label>
              Expected arrival date for your next result / documents
              <input
                type="date"
                value={p.expected_score_date || ''}
                onChange={(e) => set('expected_score_date', e.target.value || null)}
              />
            </label>
            <p className="field-note">
              Use a date that includes score delivery. Unknown timing stays unconfirmed. IELTS is
              the currently supported numeric English test in this workspace.
            </p>
          </div>
        )}
        {step === 3 && (
          <div className="form-section">
            <Wallet className="section-icon" />
            <h2>A plan that respects your budget.</h2>
            <p className="muted">
              Your maximum annual budget, including tuition, required fees and living expenses.
            </p>
            <div className="form-grid three">
              {(['USD', 'CAD', 'GBP'] as const).map((c) => (
                <label key={c}>
                  Annual budget · {c}
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={p.budgets[c] ?? ''}
                    onChange={(e) => set('budgets', { ...p.budgets, [c]: numeric(e.target.value) })}
                    placeholder="Unknown"
                  />
                </label>
              ))}
            </div>
            <p className="field-note">
              Each currency is compared separately. No guessed exchange rates.
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={p.budget_hard}
                onChange={(e) => set('budget_hard', e.target.checked)}
              />
              My budget is a hard limit
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={p.financial_flexibility}
                onChange={(e) => set('financial_flexibility', e.target.checked)}
              />
              Allow scenarios with a higher budget
            </label>
            <div className="form-divider" />
            <FileCheck2 className="section-icon" />
            <h2>Application readiness</h2>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={p.documents_ready}
                onChange={(e) => set('documents_ready', e.target.checked)}
              />
              I have checked the official document lists for my shortlist, prepared transcripts /
              translations, and completed required supplementary forms
            </label>
            <p className="field-note">
              For Waterloo this includes DAE and the CS Supplementary Information Form. AIF is
              recorded separately below. This is your declaration; PathShift does not verify or send
              documents.
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={p.aif}
                onChange={(e) => set('aif', e.target.checked)}
              />
              I have submitted Waterloo’s Admission Information Form (AIF)
            </label>
          </div>
        )}
        {error && (
          <p role="alert" className="error-box">
            {error}
          </p>
        )}
        <div className="wizard-footer">
          <button
            type="button"
            className="btn secondary"
            onClick={() => (step ? setStep(step - 1) : onCancel())}
          >
            <ArrowLeft size={16} />
            {step ? 'Back' : 'Cancel'}
          </button>
          <span className="muted small">Step {step + 1} of 4</span>
          <button className="btn primary" type="submit">
            {step === 3 ? 'Build my opportunity map' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </section>
  );
}

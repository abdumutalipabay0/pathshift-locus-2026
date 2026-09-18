'use client';
import type { Profile } from '@/lib/types';
import { useLocale } from './locale-provider';
export function SchoolFields({
  value,
  onChange,
  defaultOpen = true,
}: {
  defaultOpen?: boolean;
  value: Profile['school'];
  onChange: (school: NonNullable<Profile['school']>) => void;
}) {
  const { tr } = useLocale();
  const school = value || {};
  const numeric = [
    ['english', 'School English years'],
    ['math', 'School mathematics years'],
    ['science', 'Laboratory science years'],
    ['natural_science', 'Natural science years'],
    ['electives', 'Elective course years'],
    ['social', 'Social studies years'],
    ['language', 'World language years'],
    ['asu_gpa', 'ASU-equivalent school GPA / 4'],
    ['competency_gpa', 'ASU competency-course GPA / 4'],
  ] as const;
  const boolean = [
    ['math_sequence', 'Algebra, geometry and advanced math'],
    ['precalculus', 'Math through precalculus'],
    ['chemistry_physics', 'Chemistry or physics studied'],
    ['non_english_country', 'School in a non-English-speaking country'],
    ['top_quarter', 'Top quarter of graduating class'],
    ['purdue_english_evidence', 'English evidence selected under Purdue policy'],
  ] as const;
  return (
    <details className="school-fields" open={defaultOpen}>
      <summary>{tr('School coursework · US universities')}</summary>
      <p className="field-note">
        {tr(
          'Use high-school course years, including current final-year subjects. For math through precalculus, confirm algebra, geometry, algebra II and precalculus. Leave an unknown value blank; it is not a failure.',
        )}
      </p>
      <div className="form-grid">
        {numeric.map(([key, label]) => (
          <label key={key}>
            {tr(label)}
            <input
              type="number"
              min={0}
              max={key.includes('gpa') ? 4 : 12}
              step={key.includes('gpa') ? 0.01 : 0.5}
              value={school[key] ?? ''}
              onChange={(e) =>
                onChange({
                  ...school,
                  [key]: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
      <p className="field-note">
        {tr(
          'Only enter GPA already reported on a 4.0 scale or confirmed by ASU. Do not convert IB or national grades yourself. School GPA and competency-course GPA are separate.',
        )}
      </p>
      <div className="form-grid">
        {boolean.map(([key, label]) => (
          <label key={key}>
            {tr(label)}
            <select
              aria-label={tr(label)}
              value={school[key] === undefined || school[key] === null ? '' : String(school[key])}
              onChange={(e) =>
                onChange({
                  ...school,
                  [key]: e.target.value === '' ? null : e.target.value === 'true',
                })
              }
            >
              <option value="">{tr('Not entered')}</option>
              <option value="true">{tr('Yes')}</option>
              <option value="false">{tr('No')}</option>
            </select>
          </label>
        ))}
      </div>
      <p className="field-note">
        {tr(
          'Purdue: confirm only after selecting valid English evidence under the official policy. This is your declaration, not confirmation from the university.',
        )}{' '}
        <a
          href="https://admissions.purdue.edu/become-student/english-proficiency/"
          target="_blank"
          rel="noreferrer"
        >
          {tr('Open official source')}
        </a>
      </p>
    </details>
  );
}

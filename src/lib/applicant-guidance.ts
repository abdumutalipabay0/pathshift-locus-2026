import type { Profile, Result } from './types';
const focus = new Set(['uw', 'waterloo', 'gatech', 'purdue', 'rit', 'asu']);
export function applicantGuidance(profile: Profile, results: Result[]) {
  const scoped = results.filter((r) => r.in_scope && focus.has(r.program.id));
  const knownGrades =
    !!profile.curriculum && (profile.ib_total !== null || !!profile.raw_grade.trim());
  const missing: string[] = [];
  if (!knownGrades) missing.push('Add your school results to check academic requirements.');
  if (!Object.values(profile.budgets).some((v) => v !== null))
    missing.push('Add an annual budget to compare published costs.');
  if (profile.ielts.overall === null && profile.toefl.score === null && profile.det === null)
    missing.push('Add your English results or review the published exemption rules.');
  const strengths = scoped
    .flatMap((r) =>
      r.rules
        .filter((x) => x.strength === 'HARD' && x.result === 'PASS')
        .slice(0, 1)
        .map((x) => `For ${r.program.short}: ${x.label}`),
    )
    .slice(0, 3);
  const constraints = scoped
    .flatMap((r) => r.blockers.slice(0, 1).map((x) => `For ${r.program.short}: ${x.label}`))
    .slice(0, 3);
  const over = scoped.filter((r) => r.reference_cost_state === 'OVER_BUDGET');
  if (over.length) constraints.push('Some published cost references exceed your annual budget.');
  const gaps = [...missing];
  if (scoped.some((r) => r.unknowns.some((x) => !x.input_needed)))
    gaps.push('Some university requirements still need confirmation from official sources.');
  if (scoped.some((r) => r.cost_state === 'UNKNOWN'))
    gaps.push(
      'Full costs for your intake are not confirmed; dated estimates are shown separately.',
    );
  const candidates = scoped
    .filter(
      (r) =>
        r.timeline_state !== 'MISSED' &&
        r.admission_state !== 'BLOCKED' &&
        !(profile.budget_hard && r.reference_cost_state === 'OVER_BUDGET'),
    )
    .slice(0, 3);
  return {
    personalized: knownGrades,
    missing,
    diagnosis: {
      strengths: strengths.length
        ? strengths
        : ['Add your results to identify requirements you already meet.'],
      constraints: constraints.length
        ? constraints
        : [
            'No known failed checks in the available data. Missing information can still change the result.',
          ],
      gaps,
    },
    recommendations: candidates.map((r) => ({
      id: r.program.id,
      reasons: [
        'Matches your selected country and Computer Science goal.',
        ...r.rules
          .filter((x) => x.strength === 'HARD' && x.result === 'PASS')
          .slice(0, 2)
          .map((x) => `Meets checked requirement: ${x.label}`),
        ...(r.reference_cost_state === 'WITHIN_BUDGET'
          ? [
              'The dated cost reference fits your budget; the final cost for your intake is not confirmed.',
            ]
          : []),
      ],
      cautions: [
        ...r.blockers.slice(0, 1).map((x) => x.label),
        ...r.unknowns.slice(0, 1).map((x) => x.label),
      ],
    })),
  };
}

export function preparationTasks(interest: string) {
  const activities: Record<string, [string, string]> = {
    'Artificial intelligence': [
      'Build a small data project',
      'Choose a public dataset, compare a simple baseline with one model, and document its limitations.',
    ],
    'Software engineering': [
      'Build and test a small application',
      'Solve one real problem, add a test, and write a short README explaining your decisions.',
    ],
    'Theory & mathematics': [
      'Write up a mathematical problem',
      'Choose a problem, explain your reasoning step by step, and ask someone to review it.',
    ],
    'Human-computer interaction': [
      'Test a prototype with a volunteer',
      'Create a simple prototype, observe one consenting volunteer using it, and record what you would improve.',
    ],
    'Exploring CS': [
      'Try two areas of Computer Science',
      'Try a small coding exercise and a design or mathematics activity. Record which you enjoyed and why.',
    ],
  };
  return activities[interest] ?? activities['Exploring CS'];
}

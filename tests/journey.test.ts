import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, dataset, simulate } from '../src/lib/engine';
import {
  demoProfile,
  ieltsConsistencyError,
  ieltsOverallFromBands,
  profileSchema,
} from '../src/lib/profile';
import { calendarExport, scenarioMutation } from '../src/lib/journey';
import { formatDate } from '../src/lib/i18n';
const now = '2026-09-17T12:00:00Z';

test('application submission is not blocked by later score or document delivery', () => {
  const e = evaluate(demoProfile, now);
  for (const t of e.roadmap.filter((t) => t.id.startsWith('application-'))) {
    assert.ok(t.dependencies.length > 0);
    for (const id of t.dependencies) {
      const prerequisite = e.roadmap.find((x) => x.id === id)!;
      assert.ok(prerequisite);
      assert.ok(!prerequisite.deadline || prerequisite.deadline <= t.deadline!);
    }
  }
  assert.equal(e.roadmap.find((t) => t.id === 'english')?.deadline, '2027-02-15');
  assert.deepEqual(e.roadmap.find((t) => t.id === 'application-ubc')?.dependencies, ['review-ubc']);
});
test('institution document declarations do not leak to another university', () => {
  const e = evaluate(
    { ...structuredClone(demoProfile), documents_ready: true, documents_by_program: { uw: true } },
    now,
  );
  assert.equal(
    e.programs.find((r) => r.program.id === 'uw')?.rules.find((r) => r.action === 'documents')
      ?.result,
    'PASS',
  );
  assert.equal(
    e.programs.find((r) => r.program.id === 'waterloo')?.rules.find((r) => r.action === 'documents')
      ?.result,
    'FAIL',
  );
  assert.ok(e.roadmap.some((t) => t.id === 'documents-waterloo'));
});
test('hard budget changes ordering without rewriting admission rules', () => {
  const p = { ...structuredClone(demoProfile), budgets: { USD: 1, CAD: 1, GBP: 1 } };
  const hard = evaluate({ ...p, budget_hard: true }, now),
    soft = evaluate({ ...p, budget_hard: false }, now);
  for (const r of hard.programs)
    assert.deepEqual(r.rules, soft.programs.find((s) => s.program.id === r.program.id)!.rules);
  const visible = hard.programs.filter((r) => r.in_scope);
  assert.ok(visible.findIndex((r) => r.reference_cost_state === 'OVER_BUDGET') > 0);
  assert.notDeepEqual(
    hard.programs.map((r) => r.program.id),
    soft.programs.map((r) => r.program.id),
  );
});
test('saved scenarios are only mutations and never overwrite baseline identity or progress', () => {
  const p = structuredClone(demoProfile),
    after = structuredClone(p);
  after.ielts.overall = 6.5;
  after.name = 'Another person';
  after.completed = ['anything'];
  const mutation = scenarioMutation(p, after);
  assert.deepEqual(Object.keys(mutation), ['ielts']);
  assert.equal(p.ielts.overall, 6);
  assert.throws(() => simulate(p, { citizenship: 'Other' }, now));
  assert.throws(() => simulate(p, { completed: ['review-uw'] }, now));
});
test('calendar exports only sourced intake dates and safely folds UTF-8', () => {
  const e = evaluate(demoProfile, now);
  const ics = calendarExport(e, (s) => s, dataset.facts);
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270115/);
  assert.match(ics, /DTEND;VALUE=DATE:20270116/);
  assert.match(ics, /https:/);
  assert.ok(ics.split('\r\n').every((line) => Buffer.byteLength(line) <= 75));
  assert.doesNotMatch(calendarExport(e), /BEGIN:VEVENT/);
  assert.doesNotMatch(
    calendarExport(evaluate({ ...demoProfile, intake: 'FALL_2028' }, now), (s) => s, dataset.facts),
    /BEGIN:VEVENT/,
  );
});
test('Kazakh dates have meaningful month names even without browser ICU locale data', () => {
  assert.equal(formatDate('2027-01-15', 'kk'), '15 қаңтар 2027 ж.');
});

test('IELTS checks official half-band rounding while preserving unknown components', () => {
  assert.equal(ieltsOverallFromBands([6, 6.5, 6, 6.5]), 6.5);
  assert.equal(ieltsOverallFromBands([6, 6, 6, 6]), 6);
  assert.equal(ieltsOverallFromBands([6, null, 6, 6]), null);
  assert.equal(ieltsConsistencyError(9, [6, 6.5, 6, 6.5]) !== null, true);
  assert.equal(ieltsConsistencyError(9, [6, null, 6, 6]), null);
  const p = structuredClone(demoProfile);
  p.ielts = { ...p.ielts, overall: 6.5, reading: 6, writing: 6.5, listening: 6, speaking: 6.5 };
  assert.equal(profileSchema.safeParse(p).success, true);
  p.ielts.overall = 7;
  assert.equal(profileSchema.safeParse(p).success, false);
  p.ielts.reading = null;
  assert.equal(profileSchema.safeParse(p).success, true);
  p.ielts = { ...p.ielts, overall: 7, reading: 7, writing: 7, listening: 6.5, speaking: 6.5 };
  assert.equal(profileSchema.safeParse(p).success, true);
});
test('a hypothetical score needs its own date and never mutates the recorded IELTS result', () => {
  const p = structuredClone(demoProfile);
  const scenario = simulate(
    p,
    {
      ielts: {
        status: 'VALID',
        overall: 6.5,
        reading: 6,
        writing: 6.5,
        listening: 6,
        speaking: 6.5,
        date: '2026-11-20',
      },
    },
    now,
  );
  assert.equal(p.ielts.overall, 6);
  assert.equal(p.ielts.date, '2026-08-15');
  assert.equal(scenario.before.profile.ielts.overall, 6);
  assert.equal(scenario.after.profile.ielts.overall, 6.5);
  assert.equal(scenario.after.profile.ielts.date, '2026-11-20');
  assert.throws(() =>
    simulate(
      p,
      {
        ielts: {
          status: 'VALID',
          overall: 6.5,
          reading: 6,
          writing: 6.5,
          listening: 6,
          speaking: 6.5,
          date: null,
        },
      },
      now,
    ),
  );
});
test('IB duplicate values agree only when the original scale is explicitly 45', () => {
  assert.equal(profileSchema.safeParse({ ...demoProfile, raw_grade: '40' }).success, false);
  assert.equal(
    profileSchema.safeParse({ ...demoProfile, raw_grade: '40', raw_scale: '100' }).success,
    true,
  );
});
test('personal preparation persists without changing admission and cannot be altered by scenarios', () => {
  const p = {
    ...structuredClone(demoProfile),
    personal_plan: [
      {
        id: 'study-1',
        title: 'Math practice',
        kind: 'STUDY' as const,
        due: '2026-10-01',
        notes: 'Two exercises',
        complete: false,
      },
    ],
  };
  assert.equal(profileSchema.safeParse(p).success, true);
  const before = evaluate(p, now);
  p.personal_plan[0].complete = true;
  const after = evaluate(p, now);
  assert.deepEqual(before.programs, after.programs);
  assert.equal(after.profile.personal_plan?.[0].complete, true);
  assert.throws(() => simulate(p, { personal_plan: [] }, now));
  assert.equal(
    profileSchema.safeParse({ ...p, personal_plan: [...p.personal_plan, ...p.personal_plan] })
      .success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...p, personal_plan: [{ ...p.personal_plan[0], due: '2026-02-30' }] })
      .success,
    false,
  );
});

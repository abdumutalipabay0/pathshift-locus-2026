import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, dataset, simulate } from '../src/lib/engine';
import { demoProfile } from '../src/lib/profile';
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, simulate } from '../src/lib/engine';
import { demoProfile } from '../src/lib/profile';
import { newAccountProfile } from '../src/lib/onboarding';
import { translateText } from '../src/lib/i18n';
const now = '2026-09-18T12:00:00Z';
test('blank profile is exploration, not an invented personalized match', () => {
  const e = evaluate(
    {
      ...newAccountProfile('Applicant'),
      age: 18,
      citizenship: 'Kazakhstan',
      countries: ['Canada'],
    },
    now,
  );
  assert.equal(e.guidance.personalized, false);
  assert.ok(e.guidance.missing.some((x) => x.includes('school results')));
  assert.equal(e.guidance.recommendations.length, 1);
  assert.equal(e.guidance.recommendations[0].id, 'waterloo');
  assert.ok(e.diagnosis.strengths.every((x) => !x.includes('IB profile')));
});
test('recommendations obey hard budget and country constraints, with reasons grounded in passing rules', () => {
  const e = evaluate({ ...structuredClone(demoProfile), countries: ['Canada'] }, now);
  for (const item of e.guidance.recommendations) {
    const r = e.programs.find((x) => x.program.id === item.id)!;
    assert.equal(r.program.country, 'Canada');
    for (const reason of item.reasons.filter((x) => x.startsWith('Meets checked requirement: ')))
      assert.ok(r.rules.some((rule) => rule.result === 'PASS' && reason.endsWith(rule.label)));
  }
  const low = evaluate(
    { ...structuredClone(demoProfile), budgets: { USD: 1, CAD: 1, GBP: 1 }, budget_hard: true },
    now,
  );
  assert.equal(low.guidance.recommendations.length, 0);
});
test('prepared demo receives three supported candidates and truthful diagnosis', () => {
  const p = structuredClone(demoProfile);
  p.ielts = { ...p.ielts, overall: 6.5, reading: 6, writing: 6.5, listening: 6, speaking: 6.5 };
  p.sat = { status: 'VALID', score: 1450, date: '2026-08-15' };
  p.aif = true;
  p.documents_by_program = { waterloo: true, uw: true, gatech: true };
  const e = evaluate(p, now);
  assert.equal(e.guidance.recommendations.length, 3);
  assert.deepEqual(
    new Set(e.guidance.recommendations.map((r) => r.id)),
    new Set(['uw', 'waterloo', 'gatech']),
  );
});
test('interest changes concrete preparation without rewriting admissions; completion only records progress', () => {
  const p = { ...structuredClone(demoProfile), interest: 'Artificial intelligence' };
  const e = evaluate(p, now),
    task = e.roadmap.find((t) => t.type === 'ACTIVITY')!;
  assert.equal(task.title, 'Build a small data project');
  assert.ok(e.roadmap.some((t) => t.type === 'STUDY'));
  const changed = simulate(p, { interest: 'Human-computer interaction' }, now);
  assert.equal(changed.diff.changed_rules.length, 0);
  assert.ok(changed.after.roadmap.some((t) => t.title === 'Test a prototype with a volunteer'));
  const done = evaluate({ ...p, completed: [task.id] }, now);
  assert.equal(done.roadmap.find((t) => t.id === task.id)?.complete, true);
  assert.deepEqual(
    done.programs.map((r) => r.admission_state),
    e.programs.map((r) => r.admission_state),
  );
});
test('guidance and preparation text translate in both languages', () => {
  for (const interest of [
    'Exploring CS',
    'Artificial intelligence',
    'Software engineering',
    'Theory & mathematics',
    'Human-computer interaction',
  ]) {
    const e = evaluate({ ...structuredClone(demoProfile), interest }, now);
    const texts = [
      ...e.guidance.missing,
      ...e.diagnosis.strengths,
      ...e.diagnosis.constraints,
      ...e.diagnosis.gaps,
      ...e.guidance.recommendations.flatMap((r) => r.reasons),
      ...e.roadmap
        .filter((t) => ['STUDY', 'ACTIVITY'].includes(t.type))
        .flatMap((t) => [t.title, t.description]),
    ];
    for (const locale of ['ru', 'kk'] as const)
      for (const text of texts)
        assert.notEqual(translateText(text, locale), text, `${locale}: ${text}`);
  }
});

test('changing curriculum does not reuse an unrelated IB total for personalization', () => {
  const profile = {
    ...structuredClone(demoProfile),
    curriculum: 'Other',
    raw_grade: '',
    raw_scale: '',
  };
  assert.equal(evaluate(profile, now).guidance.personalized, false);
});

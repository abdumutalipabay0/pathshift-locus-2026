import test from 'node:test';
import assert from 'node:assert/strict';
import { dataset, evaluate, simulate } from '../src/lib/engine';
import { blankProfile, demoProfile, profileSchema } from '../src/lib/profile';
import { translateText } from '../src/lib/i18n';
import type { Profile } from '../src/lib/types';
const now = '2026-09-17T12:00:00Z';
const result = (id: string, p: Profile = structuredClone(demoProfile)) =>
  evaluate(p, now).programs.find((r) => r.program.id === id)!;
const six = ['uw', 'waterloo', 'gatech', 'purdue', 'rit', 'asu'];
test('six focus universities have traceable cost components and substantive comparison data', () => {
  for (const id of six) {
    const p = dataset.programs.find((p) => p.id === id)!;
    assert.ok(p.research!.length >= 5, id);
    assert.equal(
      p.cost!.components!.reduce((sum, [, n]) => sum + n, 0),
      p.cost!.min,
      id,
    );
    assert.equal(p.cost!.year, '2026–27');
    for (const row of p.research!) {
      assert.match(row.url, /^https:\/\//);
      assert.ok(dataset.facts.some((f) => f.id === row.fact && f.source_url === row.url));
      for (const locale of ['ru', 'kk'] as const) {
        assert.notEqual(translateText(row.text, locale), row.text);
        assert.notEqual(translateText(row.label, locale), row.label);
      }
    }
  }
});
test('unanswered school inputs are distinguished from missing institutional evidence', () => {
  const r = result('rit');
  assert.ok(r.unknowns.length > 0);
  assert.ok(r.unknowns.every((u) => u.input_needed));
  assert.equal(r.evidence_state, 'VERIFIED');
  assert.notEqual(r.admission_state, 'READY_TO_APPLY');
  assert.ok(result('ubc').unknowns.some((u) => !u.input_needed));
});
test('RIT conditional English retains precalculus and science gates', () => {
  const p = structuredClone(demoProfile);
  p.documents_ready = true;
  p.school = { ...p.school, precalculus: true, chemistry_physics: true };
  assert.equal(result('rit', p).admission_state, 'CONDITIONAL_PATH');
  p.school.chemistry_physics = false;
  assert.notEqual(result('rit', p).admission_state, 'CONDITIONAL_PATH');
  assert.ok(result('rit', p).blockers.some((r) => r.field === 'school.chemistry_physics'));
});
test('ASU aptitude alternatives do not bypass international GPA and subject requirements', () => {
  const p = structuredClone(demoProfile);
  p.school = { ...p.school, asu_gpa: 3.2, competency_gpa: 3.1 };
  assert.equal(
    result('asu', p).rules.find((r) => r.id === 'asu.research.aptitude')!.result,
    'PASS',
  );
  p.school.asu_gpa = 2.8;
  p.sat = { status: 'VALID', score: 1500, date: '2026-08-01' };
  assert.ok(result('asu', p).blockers.some((r) => r.field === 'school.asu_gpa'));
  p.school.asu_gpa = 3.2;
  p.school.competency_gpa = null;
  p.sat.status = 'PLANNED';
  assert.notEqual(
    result('asu', p).rules.find((r) => r.id === 'asu.research.aptitude')!.result,
    'PASS',
  );
});
test('Waterloo removes diploma bonus points and supports English B HL alternative', () => {
  const p = structuredClone(demoProfile);
  p.ib_total = 34;
  p.ib_core_points = 3;
  assert.equal(
    result('waterloo', p).rules.find((r) => r.id === 'waterloo.academic')!.result,
    'FAIL',
  );
  p.ib_total = 35;
  p.english_a = false;
  p.english_b_hl = 5;
  assert.equal(
    result('waterloo', p).rules.find((r) => r.id === 'waterloo.academic')!.result,
    'PASS',
  );
  p.english_b_hl = 4;
  assert.notEqual(
    result('waterloo', p).rules.find((r) => r.id === 'waterloo.academic')!.result,
    'PASS',
  );
  p.english_a = true;
  p.ib_core_points = null;
  assert.equal(
    result('waterloo', p).rules.find((r) => r.id === 'waterloo.academic')!.result,
    'UNKNOWN',
  );
});
test('blank profiles never inherit synthetic school data and simulations cannot rewrite it', () => {
  assert.equal(blankProfile.school, undefined);
  assert.equal(blankProfile.ib_core_points, null);
  assert.equal(
    profileSchema.safeParse({ ...demoProfile, school: { asu_gpa: 4.8 } }).success,
    false,
  );
  assert.throws(() => simulate(demoProfile, { school: { math: 4 } }, now));
});
test('recurring Purdue and RIT dates are not fabricated into verified 2027 timestamps', () => {
  for (const id of ['purdue', 'rit']) {
    const r = result(id);
    assert.equal(r.deadline, null);
    assert.ok(r.program.research!.find((row) => row.key === 'dates')!.text.includes('November 1'));
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dataset,
  evaluate,
  evaluateRule,
  referenceCost,
  resolveFacts,
  simulate,
  timeline,
} from '../src/lib/engine';
import { demoProfile, profileSchema } from '../src/lib/profile';
import type { Fact, Profile, Rule } from '../src/lib/types';
const now = '2026-09-17T12:00:00Z';
const profile = (patch: Partial<Profile> = {}): Profile => ({
  ...structuredClone(demoProfile),
  ...patch,
});
const result = (p: Profile, id: string, at = now) =>
  evaluate(p, at).programs.find((r) => r.program.id === id)!;
const fact: Fact = {
  id: 'test.threshold',
  field: 'threshold',
  value: 6.5,
  statement: 'Synthetic test threshold',
  source_url: 'https://example.test/policy',
  page_title: 'Test policy',
  retrieved_at: '2026-09-17',
  intake: 'FALL_2027',
  scope: { institution: 'Synthetic', program: 'synthetic' },
  evidence: 'VERIFIED',
  provenance: 'OFFICIAL_FACT',
  notes: 'TEST FIXTURE ONLY; never shipped as an admission fact.',
};
const atom: Rule = {
  id: 'test.rule',
  label: 'Synthetic threshold',
  op: 'ATOM',
  strength: 'HARD',
  facts: [fact.id],
  field: 'ielts.overall',
  comparator: 'GTE',
};
const pass: Rule = { ...atom, value: 6 },
  fail: Rule = { ...atom, value: 7 },
  unknown: Rule = { ...atom, unknown: true };
const ready = () =>
  profile({
    documents_ready: true,
    aif: true,
    sat: { status: 'VALID', score: 1550, date: '2026-08-01' },
    ielts: { ...demoProfile.ielts, overall: 8, reading: 8, writing: 8, listening: 8, speaking: 8 },
  });
test('dataset has exactly 12 unique programs and unique evidence ids', () => {
  assert.equal(dataset.programs.length, 12);
  assert.equal(new Set(dataset.programs.map((p) => p.id)).size, 12);
  assert.equal(new Set(dataset.facts.map((f) => f.id)).size, dataset.facts.length);
});
test('every rule, deadline and cost reference resolves to a record', () => {
  const walk = (r: Rule) => {
    for (const id of r.facts)
      assert.ok(
        dataset.facts.some((f) => f.id === id),
        id,
      );
    for (const c of [
      ...(r.children || []),
      r.direct,
      r.alternative,
      r.requirement,
      r.exemption,
    ].filter(Boolean))
      walk(c!);
  };
  for (const p of dataset.programs) {
    p.rules.forEach(walk);
    for (const d of p.deadlines) assert.ok(dataset.facts.some((f) => f.id === d.fact));
    if (p.cost) assert.ok(dataset.facts.some((f) => f.id === p.cost!.fact));
  }
});
test('ALL preserves a known failure beside uncertainty', () => {
  const r = evaluateRule(
    { ...atom, op: 'ALL', children: [pass, fail, unknown] },
    profile(),
    [fact],
    now,
  );
  assert.equal(r.result, 'FAIL');
  assert.deepEqual(
    r.children.map((c) => c.result),
    ['PASS', 'FAIL', 'UNKNOWN'],
  );
});
test('ANY_OF accepts a verified branch without guessing unknown alternatives', () =>
  assert.equal(
    evaluateRule({ ...atom, op: 'ANY_OF', children: [unknown, pass] }, profile(), [fact], now)
      .result,
    'PASS',
  ));
test('ANY_OF fail plus unknown remains unknown', () =>
  assert.equal(
    evaluateRule({ ...atom, op: 'ANY_OF', children: [unknown, fail] }, profile(), [fact], now)
      .result,
    'UNKNOWN',
  ));
test('exemption is an OR, with a trace', () => {
  const r = evaluateRule(
    { ...atom, op: 'EXEMPTION', requirement: fail, exemption: pass },
    profile(),
    [fact],
    now,
  );
  assert.equal(r.result, 'PASS');
  assert.equal(r.children.length, 2);
});
test('post-enrolment rule is not a high-school blocker', () =>
  assert.equal(
    evaluateRule({ ...fail, op: 'POST_ENROLMENT' }, profile(), [fact], now).result,
    'NOT_APPLICABLE',
  ));
test('missing, partial, stale and assumed facts never establish a pass', () => {
  for (const evidence of ['UNKNOWN', 'PARTIAL', 'STALE'] as const)
    assert.equal(evaluateRule(pass, profile(), [{ ...fact, evidence }], now).result, 'UNKNOWN');
  assert.equal(evaluateRule(pass, profile(), [], now).result, 'UNKNOWN');
  assert.equal(
    evaluateRule(pass, profile(), [{ ...fact, provenance: 'PRODUCT_ASSUMPTION' }], now).result,
    'UNKNOWN',
  );
});
test('same-scope contradictions do not use last-write-wins', () => {
  const conflict = { ...fact, id: 'other', value: 7 };
  assert.equal(resolveFacts([fact.id], [fact, conflict], 'FALL_2027').state, 'CONFLICTING');
  assert.equal(evaluateRule(pass, profile(), [fact, conflict], now).result, 'UNKNOWN');
});
test('a different program scope does not contaminate a fact', () =>
  assert.equal(
    resolveFacts(
      [fact.id],
      [fact, { ...fact, id: 'other', value: 7, scope: { program: 'different' } }],
      'FALL_2027',
    ).state,
    'VERIFIED',
  ));
test('wrong intake cannot use a historical fact', () =>
  assert.equal(resolveFacts([fact.id], [fact], 'FALL_2028').state, 'UNKNOWN'));
test('Georgia Tech requires completed SAT or ACT, with score and date', () => {
  const p = ready();
  p.sat = { status: 'PLANNED', score: 1550, date: '2026-08-01' };
  assert.equal(result(p, 'gatech').rules.find((r) => r.id === 'gatech.test')!.result, 'FAIL');
  p.act = { status: 'VALID', score: 32, date: '2026-08-02' };
  assert.equal(result(p, 'gatech').admission_state, 'READY_TO_APPLY');
});
test('UIUC optional SAT does not create a hard blocker', () => {
  const r = result(profile(), 'uiuc');
  assert.equal(r.rules.find((r) => r.id === 'uiuc.optional')!.result, 'NOT_APPLICABLE');
  assert.ok(!r.blockers.some((r) => r.id.includes('sat') || r.id.includes('test')));
});
test('UW IELTS 6 to 6.5 changes English while records remain separate', () => {
  const p = profile();
  assert.equal(result(p, 'uw').rules.find((r) => r.id === 'uw.english')!.result, 'FAIL');
  p.ielts.overall = 6.5;
  assert.equal(result(p, 'uw').rules.find((r) => r.id === 'uw.english')!.result, 'PASS');
  assert.equal(result(p, 'uw').rules.find((r) => r.id === 'uw.documents')!.result, 'FAIL');
  p.documents_ready = true;
  assert.equal(result(p, 'uw').admission_state, 'READY_TO_APPLY');
});
test('UBC overall improvement cannot silently improve a component', () => {
  const p = profile();
  p.ielts.overall = 7;
  p.ielts.writing = 5.5;
  const english = result(p, 'ubc').rules.find((r) => r.id === 'ubc.english')!;
  assert.equal(english.result, 'FAIL');
  assert.equal(english.children.find((r) => r.field === 'ielts.writing')!.result, 'FAIL');
});
test('Waterloo BASE keeps academic, documents and AIF gates', () => {
  const p = profile({ aif: true, documents_ready: true });
  assert.equal(result(p, 'waterloo').admission_state, 'CONDITIONAL_PATH');
  p.math_aa_hl = 5;
  assert.notEqual(result(p, 'waterloo').admission_state, 'CONDITIONAL_PATH');
  p.academics_completed = true;
  assert.equal(result(p, 'waterloo').admission_state, 'BLOCKED');
});
test('Waterloo alternative direct route accepts overall 7 and all bands 6', () => {
  const p = profile({ aif: true, documents_ready: true });
  p.ielts.overall = 7;
  assert.equal(result(p, 'waterloo').admission_state, 'READY_TO_APPLY');
});
test('a critical academic unknown prevents READY despite strong scores', () => {
  for (const id of ['cmu', 'uiuc', 'ubc', 'uoft', 'utsc', 'rit', 'asu', 'manchester'])
    assert.equal(result(ready(), id).admission_state, 'INDETERMINATE', id);
});
test('non-IB raw grades are preserved, no citizenship-to-credential assumption', () => {
  const p = ready();
  p.curriculum = 'Kazakhstan national';
  p.raw_grade = '4.8';
  p.raw_scale = '5.0';
  const e = evaluate(p, now);
  assert.ok(e.programs.every((r) => r.admission_state === 'INDETERMINATE'));
  assert.equal(e.profile.raw_grade, '4.8');
  assert.equal(e.profile.raw_scale, '5.0');
});
test('budget mutation has no effect on academic rule results', () => {
  const s = simulate(ready(), { budgets: { USD: 20000, CAD: 25000, GBP: 15000 } }, now);
  assert.equal(s.diff.changed_rules.length, 0);
  assert.equal(s.diff.changed_states.length, 0);
  assert.equal(s.diff.changed_costs.length, 8);
  assert.ok(s.after.programs.every((r) => r.cost_state === 'UNKNOWN'));
});
test('subtotal cannot establish full annual affordability', () => {
  const p = dataset.programs.find((p) => p.id === 'waterloo')!;
  assert.equal(referenceCost(p, ready()), 'UNKNOWN');
  assert.equal(
    referenceCost(p, profile({ budgets: { USD: 1, CAD: 25000, GBP: 1 } })),
    'OVER_BUDGET',
  );
});
test('cost interval that crosses budget remains unknown; no guaranteed aid', () => {
  const p = dataset.programs.find((p) => p.id === 'uiuc')!;
  assert.equal(
    referenceCost(p, profile({ budgets: { USD: 65000, CAD: null, GBP: null } })),
    'UNKNOWN',
  );
  assert.equal(
    referenceCost(p, profile({ budgets: { USD: 20000, CAD: null, GBP: null } })),
    'OVER_BUDGET',
  );
});
test('conflicting cost evidence cannot establish affordability', () => {
  const p = dataset.programs.find((p) => p.id === 'cmu')!;
  const f = dataset.facts.find((f) => f.id === p.cost!.fact)!;
  assert.equal(
    referenceCost(p, ready(), [...dataset.facts, { ...f, id: 'conflicting-cost', value: 1 }]),
    'UNKNOWN',
  );
});
test('country preference changes inclusion but not admissions facts', () => {
  const s = simulate(ready(), { countries: ['Canada'] }, now);
  assert.equal(s.diff.changed_rules.length, 0);
  assert.ok(
    s.after.programs.filter((r) => r.in_scope).every((r) => r.program.country === 'Canada'),
  );
  assert.equal(s.after.profile.citizenship, 'Kazakhstan');
});
test('locked geography and finances reject prohibited scenario changes', () => {
  assert.throws(
    () => simulate(profile({ geography_flexible: false }), { countries: ['UK'] }, now),
    /Unlock geography/,
  );
  assert.throws(
    () => simulate(profile(), { budgets: { USD: 200000, CAD: 110000, GBP: 60000 } }, now),
    /financial flexibility/,
  );
});
test('a later intake is indeterminate and keeps dates unavailable', () => {
  const e = evaluate({ ...ready(), intake: 'FALL_2028' }, now);
  assert.ok(
    e.programs.every(
      (r) => r.admission_state === 'INDETERMINATE' && r.timeline_state === 'UNKNOWN',
    ),
  );
});
test('deadline boundary uses published time zone', () => {
  const d = {
    type: 'APPLICATION',
    plan: 'REGULAR',
    date: '2027-01-05',
    time: '23:59:00',
    timezone: 'America/Chicago',
    fact: 'test',
  };
  assert.equal(timeline(d, '2027-01-06T05:58:00Z'), 'TIGHT');
  assert.equal(timeline(d, '2027-01-06T06:01:00Z'), 'MISSED');
  assert.equal(timeline({ ...d, timezone: null }, '2027-01-05T12:00:00Z'), 'UNKNOWN');
});
test('expired deadlines block the current intake and do not propose a retake', () => {
  for (const id of ['gatech', 'uiuc', 'uw', 'waterloo', 'ubc']) {
    const r = result(ready(), id, '2027-02-20T12:00:00Z');
    assert.equal(r.admission_state, 'BLOCKED');
    assert.equal(r.recourse.length, 0);
  }
});
test('unknown recourse timing never establishes within reach', () => {
  const p = profile({ documents_ready: true, expected_score_date: null });
  assert.equal(result(p, 'uw').admission_state, 'INDETERMINATE');
  p.expected_score_date = '2026-11-20';
  assert.equal(result(p, 'uw').admission_state, 'WITHIN_REACH');
  p.expected_score_date = '2027-02-20';
  assert.equal(result(p, 'uw').admission_state, 'INDETERMINATE');
});
test('recourse never changes citizenship, academic history or hard geography', () => {
  const e = evaluate(
    profile({ academics_completed: true, math_aa_hl: 5, country_locks: ['Canada'] }),
    now,
  );
  for (const r of e.programs)
    for (const route of r.recourse)
      assert.ok(
        Object.keys(route.mutation).every((k) =>
          ['ielts', 'sat', 'act', 'aif', 'documents_ready'].includes(k),
        ),
      );
});
test('simulation is identical to evaluate and never mutates the original profile', () => {
  const p = profile(),
    copy = structuredClone(p);
  const mutation = {
    ielts: { ...p.ielts, overall: 7, reading: 7, writing: 7, listening: 7, speaking: 7 },
  };
  const s = simulate(p, mutation, now);
  assert.deepEqual(p, copy);
  assert.deepEqual(s.before, evaluate(p, now));
  assert.deepEqual(s.after, evaluate({ ...p, ...mutation }, now));
});
test('interests personalize planning without changing hard rules', () => {
  const s = simulate(ready(), { interest: 'Artificial intelligence' }, now);
  assert.equal(s.diff.changed_rules.length, 0);
  assert.ok(s.diff.tasks_added.some((t) => t.includes('artificial-intelligence')));
});
test('marking research progress does not improve unknown evidence or scores', () => {
  const p = profile();
  const e = evaluate(p, now);
  p.completed = e.roadmap
    .filter((t) => !t.requires_value && !t.dependencies.length)
    .map((t) => t.id);
  const after = evaluate(p, now);
  assert.deepEqual(
    after.programs.map((r) => r.rules),
    e.programs.map((r) => r.rules),
  );
  assert.deepEqual(after.profile.ielts, p.ielts);
});
test('expired or future IELTS results do not satisfy a current UW requirement', () => {
  const p = ready();
  p.ielts.date = '2024-01-01';
  assert.equal(result(p, 'uw').rules.find((r) => r.id === 'uw.english')!.result, 'FAIL');
  p.ielts.date = '2027-01-01';
  assert.equal(result(p, 'uw').rules.find((r) => r.id === 'uw.english')!.result, 'UNKNOWN');
});
test('invalid scores, impossible dates and extra profile fields are rejected', () => {
  assert.equal(
    profileSchema.safeParse({ ...ready(), ielts: { ...ready().ielts, date: '2026-02-30' } })
      .success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...ready(), ielts: { ...ready().ielts, overall: 10 } }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...ready(), admission_state: 'READY_TO_APPLY' }).success,
    false,
  );
});
test('golden path: three concrete improvements yield three supported ready routes', () => {
  const p = ready();
  const e = evaluate(p, now);
  assert.deepEqual(
    e.programs
      .filter((r) => r.admission_state === 'READY_TO_APPLY')
      .map((r) => r.program.id)
      .sort(),
    ['gatech', 'uw', 'waterloo'],
  );
  assert.ok(e.next_action);
  assert.ok(e.roadmap.length >= 3);
});

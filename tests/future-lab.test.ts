import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyseLab,
  rankQuestions,
  buildGraph,
  descendants,
  futurePaths,
  candidateActions,
  answerQuestion,
  receipts,
  simulateFuture,
} from '../src/lib/future-lab';
import { dataset, evaluate } from '../src/lib/engine';
import { demoProfile, profileSchema } from '../src/lib/profile';
import {
  composerSchema,
  composerMutation,
  parseScenario,
  type ComposerDraft,
} from '../src/lib/scenario-composer';
const now = '2026-09-18T12:00:00Z';
const profile = () => ({ ...structuredClone(demoProfile), documents_by_program: {} });
const op = (
  type: ComposerDraft['operations'][number]['type'],
  field: ComposerDraft['operations'][number]['field'],
  number: number | null = null,
  boolean: boolean | null = null,
): ComposerDraft['operations'][number] =>
  ({
    type,
    field,
    number,
    boolean,
    text: null,
    countries: [],
  }) as ComposerDraft['operations'][number];

test('questions rank real missing multi-program inputs and never invent policy answers', () => {
  const p = profile();
  p.school!.math = null;
  p.school!.english = null;
  const questions = rankQuestions(p, now);
  assert.ok(questions.length > 0);
  assert.ok(questions[0].programs.length >= 2);
  assert.ok(!questions.some((q) => q.field === 'interest' || q.field.includes('unknown_policy')));
  assert.ok(
    questions.every(
      (q) =>
        q.rules.length &&
        q.branches.every((b) => typeof b.value === 'number' || typeof b.value === 'boolean'),
    ),
  );
});
test('answer validation preserves real input provenance and unrelated values', () => {
  const p = profile(),
    copy = structuredClone(p);
  const answered = answerQuestion(p, 'school.precalculus', true);
  assert.equal(answered.school!.precalculus, true);
  assert.deepEqual(p, copy);
  assert.throws(() => answerQuestion(p, 'admission_state', 'READY_TO_APPLY'));
  assert.throws(() => answerQuestion(p, 'school.asu_gpa', 5));
});
test('X-ray traverses real rules: IELTS never reaches SAT rules and derived IB inputs are linked', () => {
  const e = evaluate(profile(), now),
    graph = buildGraph(e);
  const affected = descendants(graph, ['input:ielts.overall']);
  assert.ok(affected.includes('program:waterloo'));
  assert.ok(!affected.some((id) => id.startsWith('rule:gatech.sat')));
  assert.ok(
    descendants(graph, ['input:ib_core_points']).some((id) => id.startsWith('rule:waterloo')),
  );
  assert.ok(
    descendants(graph, ['input:documents_by_program.waterloo']).includes('program:waterloo'),
  );
  assert.ok(!descendants(graph, ['input:documents_by_program.waterloo']).includes('program:uw'));
  assert.ok(
    graph.edges.every(
      (edge) =>
        graph.nodes.some((n) => n.id === edge.from) && graph.nodes.some((n) => n.id === edge.to),
    ),
  );
});
test('future paths are bounded, source timed, conditional and leave real profile untouched', () => {
  const p = profile(),
    original = structuredClone(p),
    paths = futurePaths(p, 'waterloo', now);
  assert.ok(paths.length > 0 && paths.length <= 3);
  for (const path of paths) {
    assert.ok(path.actions.length <= 2);
    assert.ok(path.removed.length);
    assert.ok(
      path.deadlineFacts.every((id) =>
        dataset.facts.some((f) => f.id === id && f.evidence === 'VERIFIED'),
      ),
    );
    assert.equal(path.simulation.before.profile.ielts.overall, 6);
    profileSchema.parse(path.simulation.after.profile);
  }
  assert.deepEqual(p, original);
  assert.ok(paths.some((p) => p.actions.some((a) => a.kind === 'english')));
  for (const path of paths)
    if (!path.remaining.length)
      assert.equal(
        path.simulation.after.programs.find((r) => r.program.id === 'waterloo')!.admission_state,
        'CONDITIONAL_PATH',
      );
  assert.ok(
    paths.some(
      (path) =>
        path.actions.some((a) => a.kind === 'english') &&
        path.simulation.after.profile.ielts.overall === 6.5,
    ),
    'preserve the verified 6.5 branch instead of merging alternate 7.0 thresholds',
  );
});
test('refused tests and immutable academic changes never enter candidate actions', () => {
  const p = profile();
  p.test_willingness = { IELTS: false, SAT: false, ACT: false };
  const actions = candidateActions(p, now);
  assert.ok(actions.every((a) => !['english', 'sat', 'act'].includes(a.kind)));
  assert.ok(
    actions.every(
      (a) => !Object.keys(a.mutation).some((k) => ['ib_total', 'math_aa_hl', 'school'].includes(k)),
    ),
  );
});
test('unknown timing stays unknown and missed dates remove routes', () => {
  const p = profile();
  p.expected_score_date = null;
  assert.ok(futurePaths(p, 'waterloo', now).every((p) => p.feasibility === 'UNKNOWN'));
  p.expected_score_date = '2028-01-01';
  assert.equal(futurePaths(p, 'waterloo', now).length, 0);
  assert.ok(futurePaths(profile(), 'rit', now).every((p) => p.feasibility === 'UNKNOWN'));
});
test('saved scenario usefulness respects refusal and rejects changed academic history', () => {
  const p = profile();
  const r = analyseLab(p, 'waterloo', now, [
    {
      id: 'refusal',
      name: 'No IELTS',
      savedAt: now,
      mutation: { test_willingness: { IELTS: false } },
    },
    { id: 'invalid', name: 'Invent grades', savedAt: now, mutation: { ib_total: 45 } },
  ]);
  assert.equal(r.omittedScenarios, 1);
  assert.ok(
    r.impacts
      .filter((i) => i.action.kind === 'english')
      .every((i) => !i.scenarios.some((s) => s.id === 'refusal')),
  );
  assert.ok(r.impacts.every((i) => i.blockers.length && !i.requiresRelaxation));
});
test('receipts retain source IDs, actual values and separate derived program state', () => {
  const r = receipts(evaluate(profile(), now)).find((r) => r.rule.id === 'waterloo.ielts.overall')!;
  assert.equal(r.inputs.find((i) => i.field === 'ielts.overall')!.value, 6);
  assert.equal(r.rule.result, 'FAIL');
  assert.ok(r.expression.includes('GTE'));
  assert.ok(r.rule.facts.every((id) => dataset.facts.some((f) => f.id === id && f.source_url)));
});
test('composer rejects arbitrary facts, unsupported operations and duplicate changes', () => {
  assert.equal(
    composerSchema.safeParse({
      operations: [{ type: 'SET_ELIGIBLE', value: true }],
      unresolved: [],
    }).success,
    false,
  );
  assert.equal(
    composerSchema.safeParse({ operations: [], unresolved: [], facts: [] }).success,
    false,
  );
  const operation = op('IELTS_SCORE', 'overall', 6.5);
  assert.throws(() =>
    composerMutation(profile(), { operations: [operation, operation], unresolved: [] }),
  );
});
test('overall-only scenario explicitly clears unspecified bands, preserves actual profile and date', () => {
  const p = profile(),
    draft = { operations: [op('IELTS_SCORE', 'overall', 6.5)], unresolved: [] };
  const mutation = composerMutation(p, draft);
  assert.equal(mutation.ielts!.writing, null);
  assert.equal(mutation.ielts!.date, p.expected_score_date);
  const s = simulateFuture(p, mutation, now);
  assert.equal(s.before.profile.ielts.overall, 6);
  assert.equal(s.after.profile.ielts.overall, 6.5);
  const waterloo = s.after.programs.find((r) => r.program.id === 'waterloo')!;
  assert.notEqual(waterloo.admission_state, 'READY_TO_APPLY');
  assert.equal(p.ielts.writing, 6);
});
test('composer cannot bypass financial, geographic or willingness locks', () => {
  const p = profile();
  const mutation = composerMutation(p, {
    operations: [op('BUDGET_DELTA', 'USD', 3000)],
    unresolved: [],
  });
  assert.throws(() => simulateFuture(p, mutation, now), /financial flexibility/);
  assert.throws(() =>
    composerMutation(p, {
      operations: [op('IELTS_SCORE', 'overall', 6.5), op('WILLINGNESS', 'IELTS', null, false)],
      unresolved: [],
    }),
  );
  assert.throws(() => composerMutation(p, { operations: [], unresolved: ['Specify a currency'] }));
  p.expected_score_date = null;
  assert.throws(() =>
    composerMutation(p, { operations: [op('IELTS_SCORE', 'overall', 6.5)], unresolved: [] }),
  );
});
test('AI transport sends text only and rejects malformed provider output', async () => {
  const original = process.env.CLOSEROUTER_API_KEY;
  process.env.CLOSEROUTER_API_KEY = 'test-only';
  try {
    let payload: Record<string, unknown> = {};
    const fake: typeof fetch = async (_url, init) => {
      payload = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: 'stop',
              message: {
                content: JSON.stringify({
                  operations: [op('WILLINGNESS', 'SAT', null, false)],
                  unresolved: [],
                }),
              },
            },
          ],
        }),
      );
    };
    const d = await parseScenario('No SAT', 'en', fake);
    assert.equal(d.operations[0].boolean, false);
    assert.ok(!JSON.stringify(payload).includes('Aruzhan'));
    assert.ok(!Object.hasOwn(payload, 'profile'));
    await assert.rejects(
      () =>
        parseScenario(
          'No SAT',
          'en',
          async () =>
            new Response(
              JSON.stringify({
                choices: [{ finish_reason: 'stop', message: { content: 'not json' } }],
              }),
            ),
        ),
      /temporarily unavailable/,
    );
  } finally {
    if (original === undefined) delete process.env.CLOSEROUTER_API_KEY;
    else process.env.CLOSEROUTER_API_KEY = original;
  }
});

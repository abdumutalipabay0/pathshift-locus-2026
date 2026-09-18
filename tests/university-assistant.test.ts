import { decodeComposer } from '../src/lib/scenario-composer';
import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { structuredCompletion, defaultAdvisorModel } from '../src/lib/ai-provider';
import { universityStories } from '../src/lib/university-stories';
import { translateText } from '../src/lib/i18n';
import { assistantContext, validateAssistantAnswer } from '../src/lib/admission-assistant';
import { demoProfile } from '../src/lib/profile';
test('six university introductions have translated distinctions and official evidence', () => {
  assert.equal(Object.keys(universityStories).length, 6);
  for (const story of Object.values(universityStories)) {
    assert.equal(story.highlights.length, 2);
    for (const text of [
      story.tagline,
      story.intro,
      story.consider,
      story.note,
      ...story.highlights.flatMap((h) => [h.title, h.body]),
    ])
      for (const locale of ['ru', 'kk'] as const)
        assert.notEqual(translateText(text, locale), text);
    for (const url of [story.url, ...story.highlights.map((h) => h.url)])
      assert.match(
        new URL(url).hostname,
        /(?:wisc\.edu|uwaterloo\.ca|gatech\.edu|purdue\.edu|rit\.edu|asu\.edu)$/,
      );
  }
});
test('university discovery sources are resolved canonically and stay separate from admission rules', () => {
  const context = assistantContext(demoProfile, undefined, ['waterloo']);
  const fact = context.facts.find((f) => f.id === 'overview.waterloo.1')!;
  assert.ok(fact.statement.includes('Hack the North'));
  const answer = validateAssistantAnswer(
    {
      answer: 'A place to explore.',
      points: [{ text: fact.statement, source_ids: [fact.id] }],
      next_step: 'Explore Waterloo.',
      action: 'program',
      program_id: 'waterloo',
      compare_ids: [],
      followups: [],
    },
    context,
  );
  assert.equal(answer.sources[0].url, universityStories.waterloo.highlights[1].url);
  assert.deepEqual(answer.program_ids, ['waterloo']);
  assert.ok(
    context.programs.every((p) =>
      p.rules.every((r) => !r.facts.some((f) => f.startsWith('overview.'))),
    ),
  );
});
test('explicit admission promises and invented percentages fail validation', () => {
  const context = assistantContext(demoProfile);
  const base = {
    answer: 'You will be admitted.',
    points: [],
    next_step: 'Review.',
    action: 'map',
    program_id: null,
    compare_ids: [],
    followups: [],
  };
  assert.throws(() => validateAssistantAnswer(base, context), /promise/);
  assert.throws(
    () => validateAssistantAnswer({ ...base, answer: 'Your admission chance is 99%.' }, context),
    /probability/,
  );
});
test('provider repairs once, respects cancellation and does not retry authentication errors', async () => {
  const original = process.env.CLOSEROUTER_API_KEY;
  process.env.CLOSEROUTER_API_KEY = 'test-only';
  try {
    let calls = 0;
    const options = {
      model: defaultAdvisorModel,
      schema: z.object({ text: z.string() }),
      messages: [{ role: 'user', content: 'Explain' }],
      validate: (v: unknown) => z.object({ text: z.string() }).parse(v),
    };
    const answer = await structuredCompletion({
      ...options,
      fetcher: async () => {
        calls++;
        return Response.json({
          choices: [
            {
              finish_reason: 'stop',
              message: { content: calls === 1 ? 'invalid' : JSON.stringify({ text: 'Repaired' }) },
            },
          ],
        });
      },
    });
    assert.equal(answer.text, 'Repaired');
    assert.equal(calls, 2);
    calls = 0;
    await assert.rejects(
      structuredCompletion({
        ...options,
        fetcher: async () => {
          calls++;
          return new Response('', { status: 401 });
        },
      }),
    );
    assert.equal(calls, 1);
    const control = new AbortController();
    control.abort();
    calls = 0;
    await assert.rejects(
      structuredCompletion({
        ...options,
        signal: control.signal,
        fetcher: async () => {
          calls++;
          return new Response();
        },
      }),
    );
    assert.equal(calls, 0);
  } finally {
    if (original === undefined) delete process.env.CLOSEROUTER_API_KEY;
    else process.env.CLOSEROUTER_API_KEY = original;
  }
});

test('flat provider transport keeps budget, scores and willingness distinct without weakening domain validation', () => {
  const d = decodeComposer({
    operations: [
      { type: 'IELTS_SCORE', field: 'overall', value: '7.0' },
      { type: 'BUDGET_DELTA', field: 'CAD', value: '5000' },
      { type: 'WILLINGNESS', field: 'SAT', value: 'false' },
    ],
    unresolved: [],
  });
  assert.equal(d.operations[0].number, 7);
  assert.equal(d.operations[0].boolean, null);
  assert.equal(d.operations[1].field, 'CAD');
  assert.equal(d.operations[1].number, 5000);
  assert.equal(d.operations[2].boolean, false);
  assert.equal(d.operations[2].number, null);
  assert.throws(() =>
    decodeComposer({
      operations: [{ type: 'IELTS_SCORE', field: 'overall', value: '5000' }],
      unresolved: [],
    }),
  );
  assert.throws(() =>
    decodeComposer({
      operations: [{ type: 'WILLINGNESS', field: 'SAT', value: 'maybe' }],
      unresolved: [],
    }),
  );
});
test('wrong conditional duration and blocked verdict trigger repair', () => {
  const context = assistantContext(demoProfile, undefined, ['waterloo', 'gatech']);
  const base = {
    answer: 'Review these options.',
    points: [{ text: 'Подходит годичный BASE.', source_ids: ['waterloo.supplement.base_1term'] }],
    next_step: 'Review.',
    action: 'map',
    program_id: null,
    compare_ids: [],
    followups: [],
  };
  assert.throws(() => validateAssistantAnswer(base, context), /duration/);
  assert.throws(
    () =>
      validateAssistantAnswer(
        { ...base, answer: 'Georgia Tech is currently blocked.', points: [] },
        context,
      ),
    /verdict/,
  );
});

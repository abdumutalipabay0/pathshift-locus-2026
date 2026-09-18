import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  backgroundSchema,
  emptyBackground,
  backgroundTopics,
  topicQuestions,
  interestOptions,
} from '../src/lib/background';
import { coach, coachInput } from '../src/lib/profile-coach';
import { demoProfile, profileSchema } from '../src/lib/profile';
import { evaluate, dataset } from '../src/lib/engine';
import { translateText } from '../src/lib/i18n';
import identities from '../src/lib/university-profiles.json';
import media from '../src/lib/university-media.json';

test('experience survives profile parsing and does not change admissions decisions', () => {
  const profile = profileSchema.parse({
    ...demoProfile,
    background: {
      ...emptyBackground,
      interests: ['Building apps'],
      answers: [{ topic: 'projects', text: 'Built a club website.' }],
    },
  });
  assert.equal(profile.background?.answers[0].text, 'Built a club website.');
  assert.deepEqual(
    evaluate(profile).programs.map((p) => p.admission_state),
    evaluate(demoProfile).programs.map((p) => p.admission_state),
  );
  assert.equal(
    backgroundSchema.safeParse({
      ...emptyBackground,
      answers: [
        { topic: 'goals', text: 'One' },
        { topic: 'goals', text: 'Two' },
      ],
    }).success,
    false,
  );
  assert.equal(
    coachInput.safeParse({
      background: emptyBackground,
      locale: 'en',
      mode: 'resume',
      topic: 'projects',
      email: 'private',
    }).success,
    false,
  );
});
test('numeric receipts preserve optional tests, gaps, alternatives and unknown thresholds', () => {
  const e = evaluate(demoProfile);
  const uw = e.programs.find((p) => p.program.id === 'uw')!.score_checks!;
  assert.equal(uw.find((r) => r.field === 'ielts.overall')?.gap, 0.5);
  assert.equal(uw.find((r) => r.field === 'sat.status')?.verdict, 'NOT_APPLICABLE');
  const gt = e.programs.find((p) => p.program.id === 'gatech')!.score_checks!;
  assert.equal(gt.find((r) => r.field === 'sat.status')?.required, null);
  const w = e.programs.find((p) => p.program.id === 'waterloo')!.score_checks!;
  assert.ok(w.some((r) => r.field === 'ielts.overall' && r.alternative && r.conditional_route));
  assert.ok(new Set(w.filter((r) => r.field === 'ielts.overall').map((r) => r.route)).size >= 3);
  const expired = evaluate({
    ...demoProfile,
    ielts: { ...demoProfile.ielts, date: '2020-01-01' },
  }).programs.find((p) => p.program.id === 'uw')!.score_checks!;
  assert.equal(expired.find((r) => r.field === 'ielts.overall')?.gap, null);
});
test('planned SAT score never becomes a completed numeric receipt', () => {
  const p = { ...demoProfile, sat: { status: 'PLANNED', score: 1400, date: '2027-01-01' } };
  const r = evaluate(p)
    .programs.find((p) => p.program.id === 'asu')!
    .score_checks!.find((r) => r.field === 'sat.score');
  assert.notEqual(r?.verdict, 'PASS');
});
test('all twelve university identities have local official media and translated history', () => {
  for (const p of dataset.programs) {
    const identity = identities[p.id as keyof typeof identities],
      asset = media[p.id as keyof typeof media];
    assert.ok(identity && asset, p.id);
    for (const src of [asset.logo, asset.cover]) assert.ok(existsSync('public' + src), src);
    for (const url of [
      asset.logoSource,
      asset.coverSource,
      identity.historySource,
      identity.milestoneSource,
    ])
      assert.match(url, /^https:\/\//);
    for (const lang of ['ru', 'kk'] as const)
      for (const text of [identity.history, identity.milestone])
        assert.notEqual(translateText(text, lang), text);
  }
  for (const text of [...interestOptions, ...backgroundTopics.map((t) => topicQuestions[t])])
    for (const lang of ['ru', 'kk'] as const) assert.notEqual(translateText(text, lang), text);
  assert.equal(readFileSync('public/universities/uw-logo.svg', 'utf8').includes('viewBox'), true);
});
test('coach uses only supplied notes and rejects invented evidence without saving anything', async () => {
  const old = process.env.CLOSEROUTER_API_KEY;
  process.env.CLOSEROUTER_API_KEY = 'synthetic-test';
  try {
    let sent = '';
    const background = {
      ...emptyBackground,
      answers: [{ topic: 'projects' as const, text: 'I built a website for our school club.' }],
    };
    const input = {
      background,
      locale: 'en' as const,
      mode: 'resume' as const,
      topic: 'projects' as const,
    };
    const fake: typeof fetch = async (_u, init) => {
      sent = String(init?.body);
      return Response.json({
        choices: [
          {
            finish_reason: 'stop',
            message: {
              content: JSON.stringify({
                message: 'Here is a draft.',
                question: 'When did you build it?',
                bullets: [
                  { text: 'Built a school club website.', evidence: background.answers[0].text },
                ],
              }),
            },
          },
        ],
      });
    };
    const result = await coach(input, undefined, fake);
    assert.equal(result.bullets.length, 1);
    assert.ok(sent.includes('school club'));
    assert.ok(!sent.includes('Aruzhan'));
    assert.equal(background.resume, undefined);
    const bad: typeof fetch = async () =>
      Response.json({
        choices: [
          {
            finish_reason: 'stop',
            message: {
              content: JSON.stringify({
                message: 'Draft',
                question: '',
                bullets: [{ text: 'Won a national award.', evidence: 'Won a national award.' }],
              }),
            },
          },
        ],
      });
    await assert.rejects(coach(input, undefined, bad), /UNAVAILABLE/);
  } finally {
    if (old === undefined) delete process.env.CLOSEROUTER_API_KEY;
    else process.env.CLOSEROUTER_API_KEY = old;
  }
});

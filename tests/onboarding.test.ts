import test from 'node:test';
import assert from 'node:assert/strict';
import { newAccountProfile, restoreOnboardingDraft } from '../src/lib/onboarding';
import { profileSchema } from '../src/lib/profile';
test('new account does not inherit synthetic identity, grades, destinations or budget', () => {
  const profile = newAccountProfile('New applicant');
  assert.equal(profile.name, 'New applicant');
  assert.equal(profile.citizenship, '');
  assert.equal(profile.age, 0);
  assert.equal(profile.curriculum, '');
  assert.deepEqual(profile.countries, []);
  assert.deepEqual(profile.shortlist, []);
  assert.equal(profile.ib_total, null);
  assert.equal(profile.ielts.overall, null);
  assert.deepEqual(profile.budgets, { USD: null, CAD: null, GBP: null });
  assert.equal(profileSchema.safeParse(profile).success, false);
  profile.ielts.overall = 9;
  assert.equal(newAccountProfile('Other').ielts.overall, null);
});
test('onboarding restores unfinished drafts, rejecting corrupt and invalid academic data', () => {
  const fallback = newAccountProfile('Applicant');
  const draft = { ...fallback, name: 'Draft name' };
  assert.deepEqual(
    restoreOnboardingDraft(JSON.stringify({ profile: draft }), fallback),
    JSON.parse(JSON.stringify(draft)),
  );
  for (const raw of [
    'invalid',
    '{}',
    JSON.stringify({ profile: { ...draft, age: -4 } }),
    JSON.stringify({ profile: { ...draft, name: 'x'.repeat(61) } }),
    JSON.stringify({ profile: { ...draft, citizenship: 'x'.repeat(81) } }),
    JSON.stringify({ profile: { ...draft, ielts: { ...draft.ielts, overall: 500 } } }),
  ]) {
    assert.deepEqual(restoreOnboardingDraft(raw, fallback), fallback);
  }
});

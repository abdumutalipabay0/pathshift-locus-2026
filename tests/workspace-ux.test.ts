import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taskProfileStep } from '../src/lib/workspace-ux';
test('missing values route to the section where the applicant can actually enter them', () => {
  assert.equal(
    taskProfileStep({ id: 'english', title: 'Plan your next English result', type: 'SCORE' }),
    2,
  );
  assert.equal(
    taskProfileStep({
      id: 'verify-ielts-overall',
      title: 'Complete profile: IELTS overall',
      type: 'VERIFY',
    }),
    2,
  );
  assert.equal(
    taskProfileStep({
      id: 'documents-uw',
      title: 'Prepare your application records',
      type: 'DOCUMENT',
    }),
    3,
  );
  assert.equal(
    taskProfileStep({ id: 'verify-ib', title: 'Complete profile: IB total', type: 'VERIFY' }),
    1,
  );
  assert.equal(
    taskProfileStep({
      id: 'verify-citizenship',
      title: 'Complete profile: Citizenship',
      type: 'VERIFY',
    }),
    0,
  );
});

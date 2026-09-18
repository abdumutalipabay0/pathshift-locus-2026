import { blankProfile, profileSchema } from './profile';
import type { Profile } from './types';
export function newAccountProfile(name: string): Profile {
  return {
    ...structuredClone(blankProfile),
    name,
    age: 0,
    citizenship: '',
    countries: [],
    curriculum: '',
  };
}
export function restoreOnboardingDraft(raw: string | null, fallback: Profile): Profile {
  try {
    const profile = JSON.parse(raw || 'null')?.profile;
    if (
      profile &&
      typeof profile.name === 'string' &&
      typeof profile.age === 'number' &&
      typeof profile.citizenship === 'string' &&
      profileSchema.safeParse({ ...profile, name: 'Draft', age: 17, citizenship: 'Draft' }).success
    )
      return profile;
  } catch {
    /* Invalid local data never blocks a new account. */
  }
  return fallback;
}

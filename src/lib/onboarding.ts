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
      profile.name.length <= 60 &&
      typeof profile.age === 'number' &&
      Number.isInteger(profile.age) &&
      (profile.age === 0 || (profile.age >= 10 && profile.age <= 100)) &&
      typeof profile.citizenship === 'string' &&
      profile.citizenship.length <= 80 &&
      profileSchema.safeParse({ ...profile, name: 'Draft', age: 17, citizenship: 'Draft' }).success
    )
      return {
        ...profile,
        countries: profile.countries.filter((country: string) =>
          ['US', 'Canada'].includes(country),
        ),
      };
  } catch {
    /* Invalid local data never blocks a new account. */
  }
  return fallback;
}

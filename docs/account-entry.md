# Account entry release

## Behavior

- `/`: public English/Russian/Kazakh landing. Query parameters no longer bypass entry.
- `/demo`: explicitly labelled synthetic applicant; existing admissions features remain available for judging.
- `/auth/sign-up`, `/auth/sign-in`: Neon Auth email/password forms, verification response, show/hide password. Password recovery pages included.
- `/app`: verified server session required, then a persisted profile required.
- `/onboarding`: verified session required; one short setup screen followed by optional profile editing, no inherited age, citizenship, scores or country selections. Missing test scores remain unanswered.
- `/api/account/profile`: server-only Postgres access keyed exclusively by verified session user ID. No client-supplied user ID. PUT validates origin, size and full profile schema.
- Existing admissions evaluation APIs remain stateless and public for the explicit demo. They expose no account records.
- Actual account profile updates are persisted before showing success. Drafts/scenarios/comparison selections remain per-account browser data, with existing local-save labels. Demo browser state cannot populate an account profile.

## Initial activation blocker (resolved)

Attempted Vercel native Neon provisioning with `--plan free_v3`, region `fra1`, auth enabled, no env-file overwrite. CLI returned `integration_terms_acceptance_required`, `userActionRequired: true`. At that stage no database or live account provider had been created; activation is recorded below.

Owner acceptance URL: https://vercel.com/mutalip-s-projects/~/integrations/accept-terms/neon?source=cli

After acceptance:
1. Retry `npx vercel integration add neon --name pathshift-accounts --plan free_v3 -m region=fra1 -m auth=true --no-env-pull --scope mutalip-s-projects`.
2. Obtain `DATABASE_URL` and `NEON_AUTH_BASE_URL` from the integration; generate a random secret of at least 32 characters as `NEON_AUTH_COOKIE_SECRET`. Store only in ignored environment files and Vercel secrets. Preserve CloseRouter variables.
3. Configure the production domain and localhost as trusted auth origins in Neon; verify email/password, verification and password reset delivery settings.
4. Run `node --env-file=.env.local scripts/init-accounts.mjs`.
5. Deploy and test actual registration, email verification if enabled, sign-in, mandatory onboarding, profile persistence across browsers, account separation, sign-out, password reset and expired sessions.

Without configured infrastructure, forms are visibly disabled and APIs fail closed. Never report live registration as working until the actual provider lifecycle passes. No mock sessions or browser-only accounts are implemented.

## References

- https://vercel.com/docs/cli/integration
- https://github.com/neondatabase/neon-js/blob/main/packages/auth/NEXT-JS.md
- Installed Next.js authentication guide in node_modules/next/dist/docs/01-app/02-guides/authentication.md

## Verification before provider activation

73 domain/localization/onboarding unit tests passed. All 41 browser tests passed locally, including anonymous route/API guards, explicit demo entry, full original journey, three-language mobile layout and axe WCAG A/AA checks. TypeScript, ESLint, Prettier and production build passed. Desktop/mobile landing and Kazakh registration screenshots were visually reviewed. These checks do not establish successful live registration, email delivery, signed-in database persistence or account separation against the real provider; those remain activation gates above.

## Published verification

Code commit `697bbac` deployed successfully as `dpl_DudyrQbdAA8d4Ri4hHRn5fyXVqq3` and aliased to https://pathshift-locus-2026.vercel.app/. All six production smoke tests passed: public entry, anonymous route/API protection, mobile accessibility in English/Russian/Kazakh, and the full golden demo journey. At that deployment registration remained disabled pending Neon owner acceptance; the activation release below supersedes it.

## Activation — 18 September 2026

Owner accepted Neon terms. Provisioned `pathshift-accounts` on `free_v3` in Frankfurt with Neon Auth and connected the project. Initialized `pathshift_profiles`; DATABASE_URL and NEON_AUTH_BASE_URL are integration-managed; the cookie signing secret is server-only. Fixed SDK validation: sessionDataTtl must be positive (60 seconds). Local real-provider lifecycle passed, including profile creation, fresh-browser login, logout denial and second-account isolation. Email/password registration currently starts a session without mandatory email verification; do not present email addresses as verified. Email delivery itself has not been verified with a real mailbox.

`RUN_ACCOUNT_E2E=1` opts into `e2e/accounts.spec.ts`. It creates reserved example.com QA accounts with random credentials, disables traces/videos and removes only those test accounts and profiles afterward.

## Production activation verified

Deployment `dpl_2W2qzmqmyecYDGyoFBPmwyfT4EUX` (application commit `332622f`) is live at https://pathshift-locus-2026.vercel.app/. Native integration left `neon_auth.project_config.trusted_origins` empty, causing INVALID_CALLBACK_URL only in production. Added exactly `https://pathshift-locus-2026.vercel.app` to that existing JSONB list with a parameterized SQL update, preserving other settings and updating updated_at; no wildcard trust was added.

All 41 existing production browser checks passed. The real account lifecycle then passed on production after the origin fix: registration, mandatory blank onboarding, profile creation, profile editing, logout access denial, fresh-browser sign-in, reload persistence and separate-account isolation. Reserved QA accounts and their profile rows were removed. 73 unit tests, TypeScript/build, ESLint and formatting passed. Registration is now enabled; the historical setup blocker above is closed.

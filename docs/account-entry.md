# Account entry release

## Behavior

- `/`: public English/Russian/Kazakh landing. Query parameters no longer bypass entry.
- `/demo`: explicitly labelled synthetic applicant; existing admissions features remain available for judging.
- `/auth/sign-up`, `/auth/sign-in`: Neon Auth email/password forms, verification response, show/hide password. Password recovery pages included.
- `/app`: verified server session required, then a persisted profile required.
- `/onboarding`: verified session required; four sequential steps, no inherited age, citizenship, scores or country selections. Missing test scores remain unanswered.
- `/api/account/profile`: server-only Postgres access keyed exclusively by verified session user ID. No client-supplied user ID. PUT validates origin, size and full profile schema.
- Existing admissions evaluation APIs remain stateless and public for the explicit demo. They expose no account records.
- Actual account profile updates are persisted before showing success. Drafts/scenarios/comparison selections remain per-account browser data, with existing local-save labels. Demo browser state cannot populate an account profile.

## Infrastructure activation blocker

Attempted Vercel native Neon provisioning with `--plan free_v3`, region `fra1`, auth enabled, no env-file overwrite. CLI returned `integration_terms_acceptance_required`, `userActionRequired: true`. No database or live account provider was created.

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

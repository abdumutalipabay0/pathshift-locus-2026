# Validation log — 17 September 2026

Local: Windows, Node 24.17.0, Chrome, Next.js 16.3.5.

- Final domain run: 36 tests passed.
- Final type check and production build: passed; UI prerendered and API Route Handlers generated.
- Final lint: clean, no warnings. Prettier check: passed.
- Final browser run: seven tests passed, including a three-ready-route golden journey, evidence dialogs, compare, actual profile save, progress/reload, budget-only mutation, API validation, mobile, empty-state recovery and accessibility.
- Dataset regeneration produced an identical SHA-256 hash.
- axe WCAG A/AA on the main map: zero violations after contrast/semantic fixes; no audit rules disabled.
- Desktop 1440px and mobile 390px screenshots inspected; mobile quick links added to What-if and next action.

## Production verification

- Deployed successfully to https://pathshift-locus-2026.vercel.app on Vercel.
- Anonymous HTTP request returned 200; public API returned all 12 programs and the expected supplemented dataset version.
- All seven Playwright tests passed again against the public production URL (20.9 seconds), including the complete golden journey and accessibility audit.
- Original source whitespace is intentionally preserved. `git diff --check` flagged trailing spaces only inside the supplied reports/master prompt; application code was clean.
- Repository: https://github.com/abdumutalipabay0/pathshift-locus-2026 (private). Actual team members, organizer repository access, video and slides remain team submission tasks.

## Three-language update — 17 September 2026

- Added 561 complete English-source / Russian / Kazakh catalog entries and parameterized messages. Source-data values and decision rules are unchanged.
- 43 domain/localization tests passed, covering translated source summaries, rule explanations, tasks, UI messages, parameters, locale selection and preservation of identity values.
- All 12 browser tests passed locally (31.5 seconds), including the original English golden journey and Russian/Kazakh flows, form/scenario preservation, error messages, source dialogs, localized export, reload and initial server language.
- Mobile overflow checks passed at 320, 390 and 768 pixels. Desktop and mobile translated screenshots were inspected; untranslated roadmap prerequisites were corrected.
- Automated WCAG A/AA checks passed on the English, Russian and Kazakh opportunity maps. Language picker is keyboard-operable; document language and accessible names change with the selection.
- Production build, TypeScript check, lint and formatting checks passed. Translation catalog regeneration produced an identical hash.
- Deployed the three-language update to the existing public Vercel URL. All 12 browser tests passed again against production in 40.1 seconds, including both localized journeys and server-rendered locale selection.

## Case revalidation and three quality cycles — 17 September 2026

1. Source/case review and user-journey repairs: separate scenario persistence, institution-scoped documents, chronological application dependencies, draft recovery, hard-budget ordering and synchronized country restrictions.
2. Local integration: 49 unit/domain/localization tests passed; all 16 Playwright tests passed in 51 seconds. Fixed failures discovered during iteration, including roadmap contrast and an exact-label selector; a test run during hot edits was discarded and rerun on the stable tree. TypeScript, ESLint, Prettier and production build passed. Russian calendar screenshot and live page inspected manually.
3. Production: Vercel deployment `dpl_GRscqQB5zoZDMCzGhPeTiEdg9P75` READY, aliased to the existing public URL. All 16 tests passed again against production in 1.1 minutes, including golden-path demo, saved scenarios, calendar/question export, reset recovery, draft persistence, keyboard mobile menu and translated journeys.

Catalog: 621 complete RU/KK entries. Automated axe checks passed for the screens/states exercised by the tests, without disabling rules. This does not claim exhaustive accessibility or correctness for every possible input.

Application facts and original frozen research were not modified in this update. See [case review and remaining work](case-review-2026-09-17.md). The README demo was updated to distinguish hypothetical scenarios from achieved results.

## Final presentation release — 17 September 2026

- 52 domain/localization/validation tests passed. New coverage: IELTS rounding and incomplete components, explicit IB scale consistency, personal-plan persistence and eligibility independence, duplicate task IDs and invalid dates.
- All 21 local browser tests passed (1.2 minutes). Added study/activity creation, editing, completion, reload/export and mobile axe checks in EN/RU/KK; profile import rejects malformed JSON, requires preview confirmation and supports restoration of the preceding profile.
- All 21 browser tests passed on the public Vercel URL (1.4 minutes), including the additional imported-plan preservation assertion and complete golden demo.
- TypeScript, ESLint, Prettier, `git diff --check` and production build passed. Source dataset and original research have no changes.
- Production deployment: `dpl_6GQSikbnUACYcPYKxKu3Lvebq2PA`, READY, aliased to https://pathshift-locus-2026.vercel.app. An initial CLI authorization error was resolved by retrying with the existing team scope; no permissions were broadened.
- Manual review: Russian desktop planner, Kazakh mobile layout at 390px, public import control, and no recorded browser error logs in the final public check. Temporary viewport override was reset.
- Catalog contains 663 complete RU/KK translations. Automated checks cover exercised states, not every assistive technology or possible input.
- Freeze tag: `hackathon-final-2026-09-17`. [Final scope and presentation freeze](final-release.md).

## Product simplification requested after freeze

- Focus cohort is explicit: UW–Madison, Waterloo, Georgia Tech. Incomplete research is opt-in; original dataset unchanged. Secondary profile tools and roadmap helpers are collapsed.
- 52 unit/domain/localization tests passed. 22 browser scenarios passed locally (1.1 minutes) and on production (1.4 minutes); new assertion verifies the three-program initial view, opt-in research and hidden secondary controls.
- TypeScript, ESLint, production build, formatting and diff whitespace checks passed. Russian desktop screenshot inspected; public header manually confirmed.
- Production deployment `dpl_AucuLvceFrEZ53aWJpRSAtfEaZcV` READY at the existing public URL.
- The prior release tag remains unchanged. This user-requested revision reopens the earlier freeze. Plan B is documented as a proposed concept, not a shipped complete workflow.


## Deep research and comparison remediation — 17 September 2026

- Dataset version `freeze-2026-09-17+deep-research-2`: six default universities, 25 new research records, 78 evidence records total. Original frozen markdown/PDF sources unchanged. Rebuilding the dataset preserves its SHA-256.
- 59 unit/domain/localization tests pass. Added arithmetic/source coverage for six cost references, input-vs-policy uncertainty, RIT conditional academic gates, ASU international GPA independence, Waterloo subject points and English B, and immutable simulation inputs.
- Full local browser run passed 26/27; the new immediate-reload profile test exposed a real initialization race. Profile edit controls now wait for loaded data; all five research browser tests subsequently passed, including that regression. Budget-test expectations now cover eight reference-cost changes instead of four, without academic changes.
- TypeScript, ESLint (no warnings), Prettier, production build and diff whitespace checks passed. Manual Russian desktop/mobile comparison checked; mobile columns narrowed and university names repeated in cells to keep context while scrolling.
- Published references preserve USD/CAD and 2026–27, including specific costs and exclusions. Purdue/RIT recurring dates are displayed but not manufactured into calendar timestamps. Other English tests are documented as official alternatives; automatic score evaluation remains focused on the implemented IELTS branches. ASU GPA equivalency is not guessed from IB or national grades.
- Production verification follows deployment below.

- Initial production deployment `dpl_6QkvxqfzEisY8J48Qh9JZdFbszUa`: all 27 browser tests passed on the public URL in 1.8 minutes.
- Manual public reload exposed a legacy-demo presentation issue: the saved synthetic demo predated the new school/IB fields. A narrowly scoped demo migration now fills only missing fields for the matching synthetic profile. Real profiles are explicitly excluded, covered by a separate regression. No actual applicant record is supplemented from demo values.

- Final production deployment `dpl_At3ReMu4duyxCaUUmDTwLKuxvM8y`, code commit `2af4d81`, READY at the public URL. **All 29 browser tests passed on production (1.8 minutes)**, including both legacy-demo and real-profile regressions. The 59 unit/domain/localization tests passed; production compilation and TypeScript passed. Manual public Russian map shows all six universities and their amounts, and the existing synthetic profile recovers correctly. Temporary browser viewport override reset and local audit tab closed.


## Future Lab production — 18 September 2026

71 unit/domain/localization tests, TypeScript, ESLint, Prettier and build passed. Production deployment dpl_ACeGfUB9HymPBZZmCneRGzT69uno (code d2d8c94): 36/36 browser tests passed in 2.8m. Genuine CloseRouter GPT-5.5 extraction passed RU/KK/EN schema checks; production parse → explicit preview → simulation returned 200 and preserved the actual baseline. See future-lab-release.md for scope, fixes and limits.


## Product consistency and UX audit — 18 September 2026

- Release code `17b8baf`, production deployment `dpl_5Q3fW2KJ1WDx4VVNAKpGfuh27mUs` READY at the existing public URL.
- 74 unit/domain/localization tests passed. TypeScript, ESLint, Prettier, diff whitespace and production build passed.
- Full production Playwright suite: **49/49 passed in 4.5 minutes**, with RUN_ACCOUNT_E2E=1. Includes reserved-account signup/onboarding/persistence/logout/login/isolation and automatic QA cleanup.
- Added five browser regressions for shortlist-country independence, safe draft editing, accurate status counters, empty calendar feedback, and stale scenario response isolation. Added task-editor routing cases and corrupt onboarding-draft checks.
- Local full pass exposed a 320 px Kazakh status overflow; wrapping fixed and confirmed both by browser inspection and the final production suite.
- See product-audit-2026-09-18.md for changes and explicit verification limits.

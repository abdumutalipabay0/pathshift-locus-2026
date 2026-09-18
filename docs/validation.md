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

## Case journey closeout — 18 September 2026

- Application commit `e8d63b3`; production deployment `dpl_4Mhb8fpHsNQaFJFYxeCVdXKhuVDy` READY and aliased to https://pathshift-locus-2026.vercel.app.
- 79 unit/domain/localization tests passed, including five new guidance tests for blank profiles, country/hard-budget constraints, three supported prepared-demo candidates, interest-specific activities and translations.
- Full local suite passed 49/49 before the three new diagnosis tests were added. The final focused audit passed 8/8, including EN/RU/KK diagnosis at 320 px with axe and no page errors.
- Final full production suite: **52/52 passed in 3.7 minutes**, with `RUN_ACCOUNT_E2E=1`, including real signup/onboarding, server persistence, logout, fresh-browser login and isolation. QA accounts were cleaned up by the existing test workflow.
- TypeScript, ESLint, Prettier, diff whitespace checks and production build passed. Final production deployment also compiled and typechecked successfully. Existing third-party Neon Auth dependency peer warnings remain; they did not prevent build or the real authentication lifecycle test.
- Manual review: current Kazakh local and Russian production diagnosis, profile facts, recommendation actions and roadmap entry. Narrow-screen checks cover all three languages. Temporary audit tab closed.
- 1069 complete RU/KK catalog entries. Original admissions dataset and source documents unchanged. Re-supplied PDFs verified identical by SHA-256.
- Dedicated synthetic judge account created separately; fresh login and server profile read verified. Credentials remain in local `outputs/jury-access.md` outside this Git repository, not in logs or source code.
- See case-closeout-2026-09-18.md and submission-demo.md for explicit limits and outstanding submission materials. Tests do not establish exhaustive correctness, a guaranteed jury score, team eligibility or completed submission.

## Grounded admission assistant — 18 September 2026

- Application `50ff1d5`; production `dpl_GBm545hadBCpBAq15EPYC8jkwfxC` READY at the existing public URL. The assistant has its own sidebar entry for accounts and synthetic demo.
- 85 unit/domain/localization tests passed. TypeScript, ESLint, final formatting and production build passed. The catalog has 1097 complete RU/KK entries, with static-message checks now including both new profile summary and assistant components.
- Local full browser suite passed 56/56; after the exact-pair comparison addition, final assistant-specific suite passed 5/5. One initial new test used an outdated comparison heading; its locator was corrected to the actual visible title.
- Full production run: **56/57 passed in 3.9 minutes**, including all five assistant scenarios and the real account lifecycle. The existing landing resize check saw a momentary overflow during immediate viewport measurement. Manual English/Russian 320 px inspection showed no overflow; the same no-overflow assertion was changed to auto-retry during layout settlement. The affected production test then passed **3/3 consecutive runs** across EN/RU/KK and 320/768/1440 px. No application/CSS change was made to hide overflow. All 57 distinct scenarios therefore have passing production coverage, but this was not one uninterrupted 57/57 run.
- Real CloseRouter calls returned validated RU/KK/EN answers, and an adversarial prompt requesting a fabricated guarantee/fake source was refused. Public API comparison returned HTTP 200 in 6.2 seconds, canonical evidence and the exact requested Waterloo/Georgia Tech pair. UI tests use controlled provider responses; real-provider checks are recorded separately to avoid claiming mocks prove model quality.
- Manual inspection covered the Russian live answer with evidence/action controls, Kazakh entry, and published English mobile assistant at 320 px. Temporary viewport reset and audit tab closed.
- Model default is GPT-5.4 Mini via CloseRouter, distinct from the existing scenario parser. Canonical source-ID/action validation does not prove every generated sentence is correct. See assistant-release.md for privacy, model-selection evidence, failure handling and remaining limits.

## UX simplification — 18 September 2026
Removed repeated landing process, map journey graphic/step rail, decorative section labels and assistant sidebar. Profile diagnosis uses native disclosure; compact profile summary keeps editing and next actions available. Alternative English results are now included in AI context; user-history references resolve follow-up targets; curriculum-specific grade presence drives personalization. Existing eligibility policy is unchanged.

Executed: 88/88 unit tests; typecheck, ESLint, Prettier and production build passed. Local browser suite: 56 passed, real-account test skipped unless RUN_ACCOUNT_E2E=1. Manual Russian desktop inspection confirmed compact map, assistant layout and working profile disclosure. Browser tests covered EN/RU/KK, 320px, accessibility and golden path. One early browser run exposed Undo-import tools being removed from the roadmap; restored availability and complete rerun passed.

Live provider: first call timed out; repeat completed in RU/KK/EN with canonical citations and comparison targets. The model still sometimes repeats explanations, uses English terms in translated replies and overstates conditional/readiness language despite instructions. These are unresolved generative quality limitations; source-ID validation is not semantic fact verification. Do not describe the assistant as infallible or the entire product as bug-free.

Production deployment dpl_8ahoEm3pXxqynA9tjyLLiQazWQZq: targeted published-site suite passed 21/21, including real account lifecycle, assistant actions, entry, three-language mobile/accessibility and profile diagnosis. Manual published assistant inspection confirmed updated layout. App commit 6fedbcc.


## University discovery and AI release — 19 September 2026

- Application commit `821da40`; production deployment `dpl_H14nzX2dhSU5FhnC7JNCTCVo2sHY` READY and aliased to https://pathshift-locus-2026.vercel.app.
- 94 unit/domain/localization tests passed. TypeScript, ESLint, Prettier and local production build passed; Vercel build also passed.
- Final full production browser suite: **62/62 passed in 4.1 minutes**, with `RUN_ACCOUNT_E2E=1`. Includes real registration, mandatory onboarding, server persistence, fresh-browser login, isolation and QA-account cleanup; EN/RU/KK, 320 px layouts, automated accessibility, golden journey, scenarios, comparison and all five new university-discovery tests.
- Manual Russian desktop and 390 px review confirmed the university identity panel, fact cards, tabs and next actions. Temporary browser tab closed and viewport reset.
- Live production model configuration confirmed `google/gemini-3.7-flash`. Actual assistant request returned HTTP 200 in 10.392 seconds with university overview/deadline citations and a canonical university action. Actual scenario request returned HTTP 200 in 7.522 seconds and correctly decoded IELTS overall 7, CAD budget +5000 and SAT willingness false. Existing financial-flexibility gating remained active; parsing did not modify the real profile.
- Browser assistant tests use controlled responses; the live-provider checks above are separate evidence. Latency is a small sample, not an SLA. Targeted guards and canonical references do not prove every generated sentence correct.
- 1183 complete catalog entries in Russian and Kazakh alongside English. Frozen admissions policy unchanged. See university-discovery-release.md for official sources, design decisions, model comparison and reliability limits.

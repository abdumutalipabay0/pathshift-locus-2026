# PathShift

**Change an input. See what opens up. Make your next move with a reason.**

LOCUS Startup Hackathon 2026, Case 2. PathShift connects a student's profile to explicit requirements, explains the gaps, calculates the effect of a change and builds a next-action roadmap.

**Live:** https://pathshift-locus-2026.vercel.app · **Repository:** https://github.com/abdumutalipabay0/pathshift-locus-2026 (private).

## Run

Node.js 22+ and npm. No API key, database or paid service required.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Production: `npm run build`, then `npm start`.

## Three-minute golden demo

1. Open `/demo?view=map`, then **Reset demo → View diagnosis.** Aruzhan has a strong synthetic IB profile, IELTS 6.0, SAT planned, documents and AIF incomplete.
2. **Waterloo → Explore path → Source proof.** Show academic, English, AIF and document branches separately. Close the dialogs.
3. **What if?** Enable English, use overall **6.5**, reading/listening **6.0**, writing/speaking **6.5**. Explore, name and **Save scenario**. Actual results remain unchanged.
4. **Compare paths:** Waterloo versus Georgia Tech. Explain direct English versus the required SAT/ACT. Up to three programs can be compared without silently replacing a selection.
5. Discard the scenario. **My profile → Tests & language:** for this synthetic demo, enter IELTS overall **6.5** with the bands above, SAT **VALID / 1450 / 2026-08-15**. Confirm AIF and documents for the shortlisted demo institutions, including Georgia Tech, then save. Three supported routes are ready: Waterloo, UW–Madison and Georgia Tech. 1450 is illustrative, not an admission cutoff. Only enter achieved results in a real profile.
6. **My roadmap:** complete the next review task, reload and show retained progress. Expand verified deadlines, export the calendar, and prepare an editable UBC verification question.
7. **Saved scenarios:** reopen the named scenario against the current profile. Show that it never changes actual results. Reset demo, confirm, then demonstrate Undo demo reset.
8. Bonus: explore a budget-only change. Historical cost comparisons change; academic rules do not.

The demo's component scores, dates, course counts and expected completion date (20 November 2026) are synthetic profile inputs, not university facts. Documents/AIF are not pre-assumed complete. Saved scenarios retain only hypothetical changes and are re-evaluated against the latest actual profile.

## Product focus

The default map focuses on UW–Madison, Waterloo, Georgia Tech, Purdue, RIT and Arizona State. Other research programs can be included explicitly; the full dataset still has 12 programs. This is a supported starting cohort, not a personalized global ranking. Program-specific missing inputs, uncertain costs and sources remain visible. File tools and optional roadmap helpers are collapsed by default. See [product focus and concept brainstorm](docs/product-focus.md).

## Features and architecture

Four-step profile, diagnosis, 12 CS programs, nested requirement explanations, source sheets, independent admission/evidence/timeline/cost states, conditional routes, bounded recourse, causal What-if, three named saved scenarios, shortlist, comparison, deterministic next action, task dependencies and export. Profiles, drafts, comparison selections and progress persist on this browser/device. Verified-deadline calendar export and editable verification questions connect uncertainty to practical next steps. A personal study/activity planner supports dates, notes, editing, completion and export. Versioned profile backups can be imported after validation and preview; the prior profile remains recoverable. IELTS overall and complete component sets are checked for consistency.

Next.js App Router, React, TypeScript, Zod and a pure server decision engine. The client never imports the engine. Facts/rule trees are versioned JSON. Radix manages dialogs; Lucide supplies icons. Manrope and DM Sans are self-hosted. Core evaluation requires no LLM or scraping. The optional Scenario Composer uses GPT-5.5 through CloseRouter, followed by strict server-side validation and explicit preview confirmation.

The initial Django/PostgreSQL architecture was replaced under the user's authorization to improve engineering decisions; the case permits local persistence. See [architecture](docs/architecture.md), [validated plan](docs/implementation-plan.md), [limitations](docs/limitations.md).

Modules: `src/lib/engine.ts`, `src/lib/profile.ts`, `src/lib/types.ts`, `src/app/api/v1/[...path]/route.ts`, `src/components/workspace.tsx`, `src/components/profile-wizard.tsx`, `src/app/globals.css`.

## Languages

Use the language selector in the top bar for **Қазақша / Русский / English**. The choice persists after reload and leaves the profile, unsaved form values and active scenario intact. Navigation, forms, explanations, source summaries, roadmap, errors and downloaded plans are localized. See [localization](docs/localization.md). Rebuild translation catalogs with `npm run i18n:build`.

## Evidence

Both official PDFs and both original research reports are preserved in `docs/`. The [official supplement](docs/research/supplement-2026-09-17.md) is separate. Forum reports were discovery leads only. Critical UNKNOWN remains UNKNOWN. No GPA conversion, admission probability, scholarship guarantee or unverified retrieval timestamp is invented.

Rebuild predictably: `npm run data:build` runs the normalizer followed by the supplement. Do not run the supplement alone repeatedly. Tests check uniqueness and references.

Some complete academic mappings remain unresolved. All Fall 2027 annual totals remain unknown; six dated 2026–27 references are shown separately. See [fixture contract](docs/fixture-contract.md).

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Browser tests use installed Google Chrome (`channel: chrome`). Set `PLAYWRIGHT_BASE_URL` to test a deployment. See [executed checks](docs/validation.md).

## Deployment and hackathon submission

Vercel detects Next.js; no environment variables are needed. CLI: `npx vercel --prod`. `.vercelignore` excludes PDFs/research and test artifacts from deployment uploads. The public UI/API exposes normalized evidence, not the original files or private profiles.

The actual team must supply its name/member roles, organizer-required repository access, its own demo video (up to three minutes) and slides (up to eight, PDF), following the supplied regulations. These personal/team materials are not fabricated here; the walkthrough above is ready to record.

## Credits / AI disclosure

Built under the user's direction with OpenAI Codex assistance for research follow-up, architecture, code, design and tests. The supplied Deep Research reports are preserved inputs. Runtime decisions are deterministic. Libraries: Next.js, React, Zod, Radix UI, Lucide, TypeScript, Playwright, axe-core, ESLint, Prettier; fonts Manrope/DM Sans. Initials are interface marks, not university crests.

## Future Lab — 18 September 2026

The root URL opens the multilingual landing page. The explicitly labelled demo opens Future Lab at `/demo`; the map is `/demo?view=map`. Personal accounts enter through `/auth/sign-up` → `/onboarding` → `/app`. Account activation status and setup are documented in [account-entry.md](docs/account-entry.md).

- Adaptive questions rank supported missing student inputs by simulated rule/program changes.
- Up to three paths with at most two actions, explicit conditional outcomes and source-backed timing. Unknown timing stays separate; verified conditional admissions routes remain distinct from direct entry.
- Dependency X-ray follows evaluated inputs, nested rules, programs and generated tasks. Receipts show inputs, facts, predicates and outcomes.
- Keep Doors Open counts verified failed checks improved across current and valid saved scenarios. Test refusals, geographic and financial locks are respected.
- AI composer parses text into a discriminated Zod operation union. Only scenario text is sent to the provider. Users preview and confirm before simulation; actual results never change automatically.
- RU/KK/EN, keyboard controls and mobile stacked paths.

Server-only setup: copy `.env.example` to `.env.local`, provide `CLOSEROUTER_API_KEY`, and optionally override `SCENARIO_MODEL` (tested `openai/gpt-5.5`). Never put the key in NEXT_PUBLIC or a tracked file. Production configuration lives in Vercel environment variables. No credential is required for deterministic paths.

Hero demo: open Future Lab → inspect the next question → select Waterloo → compare the supported conditional route with the 6.5 IELTS branch → inspect IELTS dependencies and source receipt → save the hypothetical route. Show that the actual score remains unchanged. Composer example: “IELTS 6.5, no SAT”. Unspecified bands stay unknown. Budget increases require financial flexibility to be enabled in the real profile.

See `docs/future-lab-plan.md` and `docs/future-lab-release.md` for design, validation and limitations.

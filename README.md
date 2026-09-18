# PathShift

A personal admissions route: understand your starting point, review supported university options, compare requirements and costs, and follow a concrete next action.

**LOCUS Hackathon 2026 — Case 2 (`LOCUSCASE2`).**

- Product: https://pathshift-locus-2026.vercel.app/
- Explicit synthetic demo: https://pathshift-locus-2026.vercel.app/demo
- Repository: https://github.com/abdumutalipabay0/pathshift-locus-2026
- Audience: international first-year applicants exploring Computer Science in the US and Canada, Fall 2027. The strongest automated academic mapping is IB. Other credentials can retain unresolved checks.

## User journey

1. Read the landing page, then register or explicitly explore the synthetic demo.
2. Registration uses Neon Auth. Initial setup asks age, citizenship and destinations; grades and budget can be added later.
3. The account home shows a diagnosis grounded in evaluated rules: confirmed requirements, known gaps and missing information. An incomplete profile is labelled exploration.
4. Review up to three candidates from the six supported universities, with reasons and cautions. Selection follows the existing server ordering and respects country constraints, missed deadlines and hard reference-budget limits. The app does not invent matches to fill three slots.
5. Compare up to three universities. Saving a university to the shortlist creates its application tasks; comparison selection is separate.
6. Follow exam, document, date, academic-preparation and interest-based activity tasks. One next task is highlighted. Completion records progress and never supplies a test score or verifies a university fact.
7. Try hypothetical changes without overwriting actual results. Return to the real profile to record achieved results.

The supported cohort is UW–Madison, Waterloo, Georgia Tech, Purdue, RIT and Arizona State. Six additional research programs are opt-in. These are not a global ranking. The interface supports English, Russian and Kazakh.

## Run locally

Node.js 22+ and npm; browser tests use installed Google Chrome.

```sh
npm ci
npm run dev
```

The public landing and `/demo` work without an account database or LLM key. For **real accounts**, copy `.env.example` to `.env.local` and configure `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET`. Initialize storage with `node --env-file=.env.local scripts/init-accounts.mjs`. Configure localhost and the production origin in Neon Auth. The deployed service is already configured.

For the optional AI Scenario Composer, set server-only `CLOSEROUTER_API_KEY`; `SCENARIO_MODEL` selects the model (tested: `openai/gpt-5.5`). Without it, deterministic evaluation and scenario controls still work. Never put secrets in `NEXT_PUBLIC_*`, source files or Git.

Production commands: `npm run build`, then `npm start`. Deploy with Vercel after setting the server environment. Git push alone does not publish this project; its deployment uses the Vercel CLI.

## Architecture and technical disclosure

Next.js App Router, React, TypeScript and a pure server-side rules engine. Zod validates profile updates and AI operations. Versioned JSON separates source facts, rules and UI. The browser never imports the admissions engine. Evaluation and simulations use the same pipeline.

Neon Auth manages email/password sessions. Neon Postgres stores profiles by verified session user ID. Actual profiles, shortlisted universities and task progress are account-backed; unfinished drafts, saved scenarios and comparison selections remain browser-local and scoped per account. The explicit demo uses local browser storage and never populates a real account.

CloseRouter/GPT-5.5 parses only explicitly submitted scenario text. The server validates an operation allowlist and requires user preview/confirmation. The model does not decide admission eligibility, invent requirements or receive the full stored profile. Core admissions checks are deterministic.

The separate **AI admission assistant** (`/app?view=assistant`, public synthetic `/demo?view=assistant`) explains the saved profile, requirements, comparisons and preparation, with canonical evidence links and a next-action button. It uses CloseRouter with `ASSISTANT_MODEL` (default `openai/gpt-5.4-mini`). Each explicit question sends selected academic profile fields, computed results and the latest three conversation turns. Name, account email, citizenship, raw grade text and personal-plan notes are excluded automatically; users must not type private documents into questions. The assistant cannot edit records, submit applications or mark progress. Conversation is held only in page memory and resets on navigation, locale change or profile update. The privacy page and request form disclose this transfer.

Assistant source IDs and program destinations are constrained by the current server context and revalidated. Source URLs come from the dataset, never the model. This guards references and actions but cannot prove every generated sentence is faithful; the interface asks users to verify evidence. No live web search or admissions probability model is included. Provider failures preserve the profile and leave the ordinary roadmap usable. The six-request/minute IP limit is process-local, not a distributed abuse-control system.

Components and tools: Radix Dialog, Lucide icons, self-hosted Manrope/DM Sans/Noto Sans, Playwright, axe-core, ESLint and Prettier. Neon is a managed external auth/database service; Vercel hosts the application. OpenAI Codex assisted research follow-up, implementation, design and testing under the project owner's direction. User-supplied research is preserved. Generated campus illustrations are decorative, not photos or evidence about actual universities. University initials are interface marks, not official crests.

## Three-minute demo

See [the timed script](docs/submission-demo.md). All applicant values below are **synthetic demo data**.

1. Open `/demo?view=map`, reset the demo, then open profile diagnosis. Explain confirmed checks, known requirements and missing evidence.
2. Inspect a suggested university and its official source, then compare Waterloo with Georgia Tech.
3. In the real **demo** profile, enter IELTS overall 6.5 with reading/listening 6 and writing/speaking 6.5; SAT VALID, 1450, 2026-08-15. Confirm AIF and documents for Waterloo, UW–Madison and Georgia Tech after selecting those institutions. These three routes pass the implemented checks. 1450 is not an admissions cutoff.
4. Save the universities, open tasks and complete one review step. Reload to show persistence. Show an optional study/activity task and its planning-only label.
5. Demonstrate a hypothetical budget or test change; explain that actual data and admissions rules remain separate.

For a fresh-user walkthrough: sign up → short setup → initial diagnosis → add grades/budget → explained candidates → save → tasks. If using a shared judge account, use only synthetic data. Credentials must be shared privately in the submission form, never committed.

## Sources and honest limitations

Four authoritative documents are in `docs/case/` and `docs/research/`. Supplements preserve source URLs and provenance. Forum reports were discovery leads, not admissions evidence. Unknown facts remain unknown. No admission probabilities, GPA conversions, guaranteed aid or invented deadline dates.

Published 2026–27 cost references are separate from unconfirmed Fall 2027 totals. Not all credentials, TOEFL/DET branches or academic equivalencies are automated. Matching is limited to the supported cohort; interests inform preparation activities rather than unverified claims about university specializations. Reference affordability is not a confirmed all-in cost for the intended intake.

The app does not submit applications, send admission-office questions or deliver automatic deadline reminders. Calendar export includes sourced dates. Email verification is not enforced; mailbox delivery and password-recovery delivery are not verified. Concurrent editing across multiple devices has no conflict-resolution UI.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:e2e
```

`PLAYWRIGHT_BASE_URL` targets a deployment. `RUN_ACCOUNT_E2E=1` enables real-provider QA signup/login/isolation tests; these remove only their reserved test accounts. See [validation](docs/validation.md) for executed results. Rebuild translations using `npm run i18n:build`; regenerate the dataset using `npm run data:build`.

## Team, access and submission

The repository is currently private. The captain must grant access to the organizer/jury or explicitly authorize publication. No repository visibility was changed automatically.

**Owner-provided information pending:** registered team name, actual participants and roles, and intended jury GitHub identities. These are intentionally not fabricated. Add the confirmed information before submission.

The captain submits through AIstartify with code **LOCUSCASE2**. According to the supplied case, the deadline is **19 September 2026, 12:00 Astana time**. Required materials include a working URL, accessible GitHub/history, this README, a demo video up to three minutes, and a PDF presentation up to eight slides. The source documents remain authoritative; check organizer announcements for changes.

See [submission checklist and material outline](docs/submission-demo.md). Working software is not evidence that the project has been officially submitted.

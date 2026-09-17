# PathShift Future Lab — release record, 18 September 2026

## Delivered

Future Lab is the root screen. Existing map, six focus universities, source comparison and roadmap remain available. New server-side analysis ranks supported unanswered profile fields, searches up to three paths with two actions, traces actual rule dependencies, exposes decision receipts and compares action usefulness across the actual profile and up to three saved scenarios. Paths separate explicit outcome assumptions from achieved results, retain remaining requirements, and link deadline evidence. Conditional and direct English alternatives are not combined into an artificial higher threshold.

Test willingness is an optional persisted profile preference. It controls generated paths and validated simulations without erasing an already achieved score. Planning date is an explicit user assumption for availability of planned outcomes. Hypothetical scenarios never overwrite actual profile results.

Scenario Composer uses GPT-5.5 through CloseRouter. Actual RU/KK/EN requests were tested. Input is limited to scenario text; profile identity/documents are not sent to the provider. Strict operation validation, semantic checks, hard constraints and confirmation precede deterministic simulation. Unknown currencies require clarification; an overall IELTS target leaves unspecified bands unknown. Invalid provider outputs are rejected. Provider availability can vary; non-AI paths remain usable.

## Validation before deployment

- 71 unit/domain/localization tests passed.
- TypeScript, ESLint, formatting and production build passed.
- Full local browser run: 35/36 passed; the remaining test exposed a controlled-checkbox feedback delay. Fixed optimistic visual feedback with server persistence/rollback; targeted regression passed.
- Desktop and RU/KK/EN mobile views reviewed; mobile keyboard and automated WCAG checks passed.
- Key-value scan: no matches in tracked/unignored files or browser bundles. Local env ignored; production key stored as a Vercel secret.

## Production verification

Deployment `dpl_ACeGfUB9HymPBZZmCneRGzT69uno`, code commit `d2d8c94`, is READY and aliased to https://pathshift-locus-2026.vercel.app/.

- Full production browser suite: **36/36 passed**, 2.8 minutes.
- Includes the repaired immediate checkbox feedback, actual-answer persistence, route saving, source receipts, scenario confirmation, all original golden paths, mobile accessibility and all three locales.
- Live production `/api/lab` reported GPT-5.5 enabled. Real Russian scenario extraction returned the requested IELTS 6.5 and SAT refusal, then explicit preview returned HTTP 200: baseline IELTS 6, hypothetical IELTS 6.5, unspecified writing score null, 69 decision receipts.
- Real RU/KK/EN provider extraction passed strict schema and semantic validation. An ambiguous “3000 dollars” request asked for currency rather than guessing.
- Production mobile and desktop route-board screenshots were visually inspected. No page overflow; source explanations and conditional outcomes remain readable.

No implementation blocker remains. Provider availability and the documented bounded planning/model assumptions still apply.

## Boundaries

The question selector supports numeric/boolean rule inputs; it does not infer unknown institutional policies. Future paths are bounded searches, not mathematical global optima or admission predictions. Retake score targets and delivery dates are assumptions; no probability of achieving them is invented. Timing may remain unknown. Official facts and the frozen research were not rewritten. Broader curriculum equivalence, live university compiler and automatic application submission remain outside P0.

The public AI endpoint has a per-instance IP rate limit, request/token limits and timeout. Before broad commercial launch use distributed quotas/authentication and a provider spend cap. No account billing settings were changed.

## Demo

1. Open Future Lab and answer a real missing profile question; show the graph recalculating.
2. Select Waterloo: compare the currently supported conditional route with a direct-English improvement. Neither waives academic or document requirements.
3. Inspect IELTS: the English rules and related tasks are connected; SAT rules are not. Open the official source in the receipt.
4. Save a path; actual IELTS remains 6 in the demo.
5. Describe “IELTS 6.5, no SAT”, review the extracted draft, then confirm. Unspecified band scores stay unknown.
6. Open the existing comparison/roadmap to continue the application journey.

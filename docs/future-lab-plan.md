# Future Lab — implementation contract, 18 September 2026

User-authorized P0: one hero surface combining next best question, bounded future paths, dependency X-ray, cross-scenario action usefulness, typed AI scenario preview and decision receipts. Existing catalog/comparison/roadmap remain supporting screens. No generic chat; admissions compiler is P1, not part of this release.

## Reuse

- `engine.ts`: evidence resolver, recursive evaluator, recourse mutations, evaluation, simulation validation/diff and roadmap dependencies. All eligibility computation stays on the server.
- `profile.ts`: Zod validation and separate real/demo profiles; extend only optional test willingness.
- `journey.ts`: saved hypothetical scenarios. Keep real profile changes separate from planned outcomes.
- `workspace.tsx`: navigation, profile persistence, sources, saved scenarios and roadmap.
- Current RU/KK/EN catalog, typography and source-backed six-university dataset. Original sources remain untouched.

## New modules and contracts

1. `lab-types.ts`: serializable questions, branch impacts, traced graph, actions, future paths, receipts and lab response.
2. `future-lab.ts`: server-side question ranking from supported missing input branches; real rule traversal; depth-two search from existing recourse candidates; per-step timing and hard-lock checks; Pareto-style non-dominated paths (no admission score); action usefulness across current and validated saved scenarios.
3. `scenario-composer.ts`: strict allowlisted Zod mutations; text-to-mutations via OpenAI Responses structured output. Explicit preview, no institution facts or decision-setting operations. No invented currency, band scores or completion dates. Provider unavailable is an explicit state.
4. API endpoints: lab analysis, question answer, future preview and composer status/parse. Bound request size, scenarios, action depth and model output; reject unsupported or contradictory mutations. No profile names/documents sent to model; only supplied scenario text. Server-only credentials.
5. `future-lab.tsx`: hero graph of current → conditional actions → outcomes; one-question interaction; target selector; variable/action X-ray; receipts; option-preservation comparison; scenario composer preview. Keyboard-accessible buttons and compact stacked mobile graph.

## Design

Retain Manrope display / DM Sans body / tabular utility numerals. Palette: ink #19243b, blue #3559db, teal #137b69, pale blue #eef3ff, white #ffffff, slate #586780. Signature: an interactive branching route board whose lines encode actual transitions, with a linked rule inspector. Avoid six new tabs or a decorative network. Current and hypothetical state are clearly distinguished. Focus, reduced motion and 360px layouts are required.

## Invariants and acceptance

- Questions use missing student values, never missing institutional policy; relevant questions outrank irrelevant ones. Branch values are illustrations, not defaults or answers.
- Unknown timing stays unknown; only verified applicable deadlines can establish feasibility. Missed actions and refusal/hard-lock violations are excluded. No guaranteed exam improvement; each score branch has explicit IF conditions and score/date assumptions.
- No synthetic alternate admission routes. At most two actions and three suggested paths; unchanged/remaining blockers and costs stay visible.
- Graph is derived from evaluated rules, with hidden dependencies (test status/date, IB subject total) represented. IELTS must not highlight SAT rules. Receipts retain official facts separate from inference.
- Action usefulness counts actual verified failures resolved across current/saved scenarios; no arbitrary score or effort-hours.
- AI schema cannot set eligibility, rules or source facts. Refusals, malformed output, unsupported request and missing credentials are handled; simulation runs only after preview confirmation. No false claim of live AI without credentials.
- Tests: ranking/irrelevance, graph reachability/isolation, depth/pruning/locks/deadlines, saved scenario robustness, no profile mutation, receipt provenance, composer validation/injection/unknown currency/bands, API failures, RU/KK/EN, desktop/mobile, keyboard/axe, golden journey and all existing regressions.

## Execution and release

Implement core and tests → hero UI and localization → browser/visual review → full suite/build → Vercel deploy and production smoke. Document actual limits and results. Local and production have no OPENAI_API_KEY as of initial inspection; implement and test adapter with explicit provider-disabled UI, leaving live composer activation blocked until authorized credentials are configured.

## Execution update

User supplied CloseRouter credentials after the initial missing-key finding. The secret is configured server-side in local ignored environment and Vercel production. GPT-5.4 mini returned upstream 502; GPT-5.5 passed real RU/KK/EN extraction checks. Use Chat Completions with requested strict response_format, exact schema included in the prompt, and independent discriminated-union validation because provider schema adherence alone was insufficient in live tests. No runtime extraction becomes an admissions fact.

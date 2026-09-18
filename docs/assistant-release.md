# Admission assistant — 18 September 2026

## Delivered workflow

The workspace sidebar includes an AI admission assistant. Four starting questions cover priorities, university options, missing application inputs and preparation. A free-form question can continue the conversation. Responses include a short introduction, up to four explanatory points, expandable canonical evidence and one next action. Follow-up questions are clickable. Comparison actions select the exact two or three programs discussed, preserving them across reload; other actions open the profile, roadmap, university details or existing hypothetical-scenario tools.

The assistant is available for the real account profile and the explicitly synthetic public demo. It explains saved inputs and does not silently apply hypothetical scores. It cannot edit a profile, complete tasks, submit an application, send email or change an institutional rule.

## Grounding and privacy

- `/api/assistant` validates origin, body size, profile, language, question length and bounded conversation roles. It recomputes the evaluation on the server, rather than trusting client-supplied verdicts.
- Named-university questions select relevant context using complete names/aliases, avoiding substring matches such as RIT inside “prioritize”. General questions retain the scoped evaluation. Source facts preserve evidence labels and intake periods.
- CloseRouter receives a selected academic profile, server-generated checks, applicable source summaries, the question and at most three previous turns. Identity, account email, citizenship, raw grade text and personal-plan notes are excluded automatically. User-entered question text can still contain personal information; the form and privacy page explain the transfer and ask users not to enter private documents.
- Structured output restricts source IDs and program IDs to current context. The server revalidates them and obtains all source URLs from the canonical dataset. Unknown sources, invalid actions and malformed responses fail closed. Comparison navigation requires two or three actual program IDs.
- Rendering uses ordinary React text, not model-generated HTML. The client shows pending, stop and recoverable-error states. Conversation is page-local, with no added database or localStorage transcript; navigation, language changes and profile changes reset it and abort obsolete display requests.
- Timeout: 35 seconds upstream, 45 seconds in the UI. Six requests/minute/IP is a process-local prototype limit, not distributed abuse prevention. A cancelled display request can already have consumed upstream work.

## Model and limitations

Default: `openai/gpt-5.4-mini` through the existing CloseRouter integration, configurable by server-only `ASSISTANT_MODEL`. The provider's model listing was checked directly. [Official model documentation](https://developers.openai.com/api/docs/models/gpt-5.4-mini) lists structured outputs and reasoning-effort support. Actual provider calls, not model documentation alone, were used to verify this integration.

Initial tests exposed slow/unavailable transport, model-produced invalid evidence identifiers, verbose answers and imprecise currency comparisons. The final implementation uses a bounded introduction, context-specific source enumerations, explicit schema instructions, separate intake/currency guidance and a faster default model. It also distinguishes IB subject points from the total including bonus points. The existing scenario parser retains its own model setting.

There is no live web research in the assistant, no admission-probability model and no guarantee that every generated sentence accurately reflects its citations. Reference validation proves that a source exists, not that a whole paragraph is entailed by it. Generated wording can still be imperfect, including terminology and emphasis. The UI exposes the underlying sources and retains deterministic university checks as the authoritative results. This feature is an explanation and planning aid, not a replacement for institutional confirmation.

## Verification

- 85 unit/domain/localization tests pass, including six new assistant tests: targeted retrieval, privacy projection, fabricated references/actions, canonical citations, bounded history and provider failure handling.
- Full local browser suite passed 56/56 before the exact-pair comparison regression was added. Final focused assistant suite passed 5/5, covering the pair and reload, EN/RU/KK, 320 px layout, axe, source expansion, roadmap navigation, conversation reset, API input rejection, stop and recovery.
- Live CloseRouter calls in RU/KK/EN returned validated responses. A live adversarial question requesting invented 99% certainty and a fake source was refused; only canonical source URLs were returned. This is sample-based evaluation, not proof of universal prompt-injection resistance.
- Manual desktop inspection covered the real Russian response and source/next-step layout; the Kazakh entry layout was also inspected.
- Application commit `50ff1d5`, production deployment `dpl_GBm545hadBCpBAq15EPYC8jkwfxC`. A real public API comparison returned HTTP 200 in 6.2 seconds with Waterloo/Georgia Tech as the exact comparison targets and canonical evidence IDs. This is one observed response time, not a latency guarantee.
- Final production browser result is recorded in `validation.md`.

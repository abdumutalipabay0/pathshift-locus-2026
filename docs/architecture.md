# Architecture decision, 2026-09-17

The user authorized independent engineering choices and requested Vercel deployment. Use Next.js App Router + a pure TypeScript server decision engine, Zod validation, Radix Dialog and Lucide. This supersedes the original Django/PostgreSQL scaffold plan. The official Case 2 explicitly permits local persistence when the full journey works. Version-controlled JSON is the evidence store; browser localStorage persists anonymous profiles, shortlist and progress. No authentication, shared server state or external AI service is needed. Server Route Handlers are the only evaluation authority. The client imports types, never the engine.

Sources read: all four supplied documents. Research is authoritative as a frozen research artifact, not newly retrieved official pages. Explicit university URLs are preserved. Retrieval precision is a date only, as recorded by the research. Normalized statements are paraphrases, not fabricated quotations/page titles. Editorial notes are retained separately.

Evidence contract supersedes contradictory example state matrices. Known failures remain visible beside unknown rules. Critical UNKNOWN prevents READY/WITHIN_REACH/CONDITIONAL; a conclusively missed application deadline blocks this intake separately. A completed immutable prerequisite failure can be BLOCKED. Missing recourse timing produces UNKNOWN feasibility, never a fabricated plan. Conditional existence alone is not verified applicability. All alternative routes retain their academic gates.

IELTS overall and components are independent inputs. An overall-only change cannot silently improve bands. The demo offers a clearly labeled scenario changing overall and specified bands together, with an independent toggle for English. Synthetic profile completion values are product assumptions, not admission evidence. Default Aruzhan preserves incomplete documents/AIF declarations and adds an explicitly synthetic expected completion date of 20 November 2026. No missing documents or AIF submission is silently asserted.

Cost has two outputs: target-intake total (UNKNOWN in this freeze) and explicitly dated reference comparison. A subtotal can prove a reference exceeds budget but cannot prove the full annual total is within budget. Ranges crossing the budget produce UNKNOWN; competitive scholarships never reduce cost.

Timeline uses date/time/timezone facts. If time or timezone is missing, dates well away from the boundary can be classified; boundary-day precision stays UNKNOWN. Admission academic predicates are independent of budget/geography. Country locks restrict candidate inclusion and permitted simulation mutations without rewriting test scores.

Design: white/slate workspace (#F6F8FB), ink (#18243A), cobalt (#3559DB), pale blue (#EDF2FF), teal (#137B69), amber (#936A17). Manrope for headings, DM Sans for reading and controls, tabular numerals for inputs. The signature is a branching path diagram and a live causal comparison, not a decorative hero photograph. Dashboard: quiet left navigation, wide opportunity workspace, compact scenario rail. Mobile: top navigation, stacked cards, sheet dialogs.

Technical references consulted: https://nextjs.org/docs/app/getting-started/server-and-client-components ; https://nextjs.org/docs/app/getting-started/deploying ; https://vercel.com/docs/frameworks/full-stack/nextjs ; https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md .


## Future Lab and optional AI, 18 September 2026

`future-lab.ts` runs only behind `/api/lab`. It reuses evaluate, recourse candidates, simulation validation, diff and roadmap generation. No evaluation module is bundled into the client. Numeric/boolean question branches are validated hypothetical input values, never inferred actual data. English alternatives are enumerated separately; an OR is not flattened into a combined higher threshold. Future simulations evaluate at the explicitly entered completion date while retaining the actual baseline at the current date. The planning date is a user assumption, not evidence that preparation or delivery is guaranteed.

CloseRouter chat/completions uses server-only credentials and `openai/gpt-5.5`. GPT-5.4 mini returned an upstream availability error and was not retained. The provider advertises response_format, but live testing showed schema-inconsistent output when relying on it alone. The exact JSON schema is therefore also included in the parser instruction, and every output is independently validated by a discriminated Zod union, semantic checks, profile validation and existing hard constraints. Invalid output is rejected, never silently repaired into admission facts. Users see the parsed draft and confirm before calculation. Only scenario text is transmitted to the provider.

The endpoint bounds text/output size, timeout, operations and three saved scenarios. An in-memory six-per-minute per-IP limiter protects a single runtime instance; it is not a distributed production quota. For a larger public launch add persistent rate limits/authentication and a provider spend cap. No account settings were altered.

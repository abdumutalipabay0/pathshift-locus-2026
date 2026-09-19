# What if + AI demo release

## Product change

- `What if?` is now a dedicated four-step decision check: saved profile → assumption → verified diff → next step.
- The simulation uses the existing backend evaluator and never persists the hypothetical mutation. Baseline and hypothetical values are visibly separated.
- IELTS scenarios require a separate assumed result date. Four supplied bands must round to the entered overall under the official IELTS rule; inconsistent combinations block comparison. Blank components remain unknown.
- Result cards show each affected university, rule-level before/after verdicts, the evaluated reason and canonical evidence links where the rule has evidence. Cost and timeline changes stay separate from admission rules.
- Recalculation uses native CSS opacity/transform motion, without an artificial delay or a new runtime dependency. `prefers-reduced-motion` removes the effect.
- Ask AI starts from a real demo question about UW–Madison and Waterloo. The response remains live provider output, constrained to profile facts, evaluated checks, canonical sources and supported actions.

## Truth boundaries

- A scenario is an assumption, not a completed exam or a saved profile update.
- Passing one verified rule is not an admission prediction and does not satisfy unrelated requirements.
- Missing applicant values and missing institutional evidence remain `UNKNOWN`.
- Admissions data and frozen research were not changed in this release.

## Verification

- Unit/domain/localization: 100 passed.
- Local Playwright: 71 passed, 1 real-account lifecycle skipped by default.
- TypeScript, ESLint and production build passed.
- EN/RU/KK, 390 px mobile, keyboard flow, WCAG A/AA automated checks and reduced motion are covered by the new What-if tests.
- The repository-wide Prettier check still reports pre-existing formatting drift in untouched files; every file changed by this release is formatted.

Recording instructions: [demo-video-silent.md](demo-video-silent.md).

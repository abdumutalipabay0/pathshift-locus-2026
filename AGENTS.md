# PathShift

- Start with docs/implementation-plan.md and docs/master-prompt.txt.
- Authoritative competition documents are in docs/case/; frozen research is in docs/research/. All four documents were supplied on 2026-09-17. Read them fully before implementation; initial missing-source status in the plan is historical.
- Never invent admissions facts, source URLs, retrieval dates, fixture expectations or admissions probabilities. UNKNOWN is valid.
- Keep facts, rules and frontend rendering separate. Eligibility is computed only by the backend.
- Preserve independent admission, evidence, timeline and cost states.
- Simulation must use the same evaluation pipeline as a real profile update.
- Do not propose immutable profile changes or treat task completion as a new test score.
- Keep this file concise; detailed contracts and decisions belong in docs/.
- Commands: npm test, npm run typecheck, npm run lint, npm run build, npm run test:e2e. See docs/validation.md for executed results. Use npm run data:build to regenerate the dataset predictably.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# University discovery and AI release — 19 September 2026

The university name now opens an introduction rather than assuming applicants already know the institution. Six focus institutions each have a concise identity, two official-source highlights, an explicitly editorial fit prompt and a practical consideration. About → My profile → Applying separates discovery, calculated requirements and the application route. Requirements buttons still open the profile checks directly. Save-and-plan persists the university before opening its roadmap. Comparing an existing selection no longer toggles it off. Section changes restore scroll position and keyboard focus.

The visual design retains the existing Manrope/DM Sans and navy/blue/paper system: a distinctive university identity panel, quiet source links and a single next-step strip. Mobile uses one column. There are no fabricated rankings, success rates, campus photos or claims that everyone chooses a university.

## Sources, checked 19 September 2026

- UW–Madison: [undergraduate programme, projects, research and major declaration](https://www.cs.wisc.edu/undergraduate/undergrad-program-cs/).
- Waterloo: [Computer Science and Hack the North](https://uwaterloo.ca/future-students/programs/computer-science), [co-op and regular routes](https://uwaterloo.ca/computer-science/future-undergraduate-students/co-op-and-regular).
- Georgia Tech: [Threads curriculum](https://www.cc.gatech.edu/threads-better-way-learn-computing).
- Purdue: [CS foundation and tracks](https://www.cs.purdue.edu/undergraduate/curriculum/bachelor.html).
- RIT: [computing co-op and study sequence](https://www.rit.edu/computing-co-op).
- ASU: [CS BS, concentrations, Tempe and major maps](https://scai.engineering.asu.edu/computer-science-bs/).

Descriptive content is stored in university-stories.ts and the EN/RU/KK catalog. It does not rewrite frozen eligibility rules. Choosing guidance is editorial, not a measured ranking or admission prediction. University overviews are not claims about confirmed Fall 2027 tuition or admission policy.

## Model and reliability

Selected the provider-listed identifier google/gemini-3.7-flash for assistant and scenario parser. The CloseRouter model list was queried live. These are provider identifiers, not independently authenticated model identities.

Same-question initial sample: Gemini Flash 4.773 seconds, Claude Sonnet 4.6 25.226 seconds, GPT-5.4 29.822 seconds. This is a small comparison, not a general benchmark. Subsequent final multilingual discovery/adversarial calls took 9.180, 10.057 and 10.725 seconds; the mixed scenario took 6.737 seconds. Earlier calls included network timeouts. No response-time SLA is claimed.

One bounded repair attempt, 18 seconds per attempt and 38 seconds total; 401/403/429 and refusals are not retried. User cancellation reaches the assistant's upstream request. Invalid data is never replaced with fabricated university facts. Claims and follow-ups are length-limited; identical points merge citations. Sources resolve against server-owned records, including the new university introductions. Explicit admission promises, invented percentage claims, observed one-term/year mistranslation and unsupported blocked language have regression guards. These targeted guards are not a complete semantic proof system.

The scenario provider mishandled discriminated unions and nullable unused fields in live tests. Transport now uses type/field/value strings; a deterministic adapter converts these into the original strict operation union. IELTS bounds, currency validation, willingness, duplicate conflicts and preview-before-apply are preserved. A live mixed request correctly produced IELTS overall 7.0, CAD +5000 and SAT willingness false.

Assistant answers link to the current university and expose independently calculated profile checks. Context excludes account identity and personal notes. Overview questions are editable drafts; the user sends them explicitly. Retries reuse the failed question. Model answers remain advisory: source IDs cannot prove that every paraphrase is correct.

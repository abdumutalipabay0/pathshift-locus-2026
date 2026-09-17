# English, Russian and Kazakh

The interface supports `en`, `ru` and `kk`. The visible selector uses native names: English, Русский, Қазақша. It remains available on mobile. A one-year, same-site locale cookie preserves the choice. Initial server rendering uses that cookie, then supported browser language preferences; unsupported values fall back to English. `html.lang`, page title, dates and numeric displays follow the active locale.

Translation is presentation-only. Profiles, rule/fact IDs, option values, numeric inputs and server verdicts retain canonical values. Changing locale does not remount the wizard, clear unsaved form fields, rerun eligibility or discard a scenario. Applicant-entered names are preserved; official institution names, source page titles, source URLs, qualification acronyms and IB course names retain their identifiers. Source summaries and notes are translated; the evidence panel explains that the official page is in its original language.

## Catalog maintenance

- `scripts/catalog.tsv`: interface/forms and shared copy. Columns: English source, Russian, Kazakh.
- `scripts/domain-catalog.tsv`: source summaries, domain messages, templates and evidence labels.
- `npm run i18n:build`: validates rows and creates `src/lib/messages.json`.
- `src/lib/i18n.ts`: whole-message lookup, parameterized domain messages, locale validation, number/date formatting. Templates are compiled once, with specific messages ahead of generic patterns. Protected identity placeholders are never translated.
- `src/components/locale-provider.tsx`: React context and accessible native language selector. No DOM text replacement, machine-translation service or additional admission rules.
- Full sentences are used for variable requirement counts; Russian/Kazakh phrasing avoids incorrect numeric declensions. Date-only admission deadlines remain date-only, without timezone drift.

Manrope includes self-hosted Cyrillic/extended Cyrillic for headings. Noto Sans supplies corresponding body glyphs, including Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ, І. Translated layouts permit longer labels, wrapped buttons and narrow mobile widths.

## Verification

Catalog tests check completeness, interpolation variables, active source summaries, rule explanations, roadmap messages and static UI labels. Browser tests cover both added languages: profile form preservation during language switches, unchanged scenario counts, translated source dialogs, validation errors, localized plan downloads, cookie persistence and language selection in the first HTML response. English golden-path regression tests remain enabled. Mobile checks cover 320, 390 and 768 pixels; automated WCAG checks run for all three language variants.

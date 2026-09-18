# Route atlas design refresh

Direction: midnight indigo / cobalt / sky blue / warm coral, existing Manrope and DM Sans. The signature interaction is a branching route atlas whose controls explain the real Explore, Compare and Plan capabilities. No invented admission predictions, decorative statistics or partner claims.

Audit: landing illustration was static; lab routes appeared below a lengthy question block; sidebar repeated motivational copy; profile editing was duplicated in the lab header; receipts exposed raw statuses and dataset identifiers; composer displayed implementation vendor/model names.

Changes: interactive accessible atlas, stronger hero hierarchy, finite transition on deliberate selection, routes before questions, shorter question heading, remove redundant sidebar/header copy, human-readable receipt labels, expandable calculation expressions. Keep evidence, constraints, demo disclosure and account behavior.

References consulted: https://linear.app/ (product-led presentation), https://animations.dev/ (purposeful motion), https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md (semantics, motion preferences, responsive accessibility). Community discussions about generic generated interfaces were treated as design opinions, not technical authority.

Validation: run existing unit, localization, accessibility, browser and account checks plus a route-atlas keyboard/link/reduced-motion regression. Review actual desktop/mobile render before deployment.

## Verified release

Production deployment `dpl_6FZDHY3UpvwNdZSbgdX96MCGe7ag` from commit `539c8c9`. All 73 unit/localization/data tests and all 43 browser tests passed; the complete browser suite ran against the production domain, including the real account lifecycle and account isolation. Typecheck, lint, format check and production build passed. Desktop and mobile renders were visually inspected. One development-server import-navigation timeout did not reproduce in three isolated repeats or the full production suite.

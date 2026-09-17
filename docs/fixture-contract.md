# Fixture interpretation

Raw F_READY, F_REACH, F_CONDITIONAL, F_BLOCKED, F_INDETERMINATE and F_MIXED descriptions remain in the supplied freeze. They omit some components, dates and declarations and contain acknowledged contradictions. Tests assert source-supported invariants rather than inventing a full historical expected matrix.

| Scenario | Executable invariant |
| --- | --- |
| Strong IB/IELTS/SAT | With explicit document/AIF declarations, GT, UW and Waterloo have no blocker in supported rules; other critical gaps persist |
| IELTS 6, SAT planned | Required SAT fails; English branches retain actual results; no within-reach claim without completion timing |
| Conditional English | Waterloo BASE still requires common academic/application gates; RIT still has an academic gap |
| Completed immutable Math deficiency; February 20, 2027 | Known missed application dates and immutable prerequisite failures block the corresponding intake |
| Kazakhstan 4.8/5.0 | Original scale retained, no invented equivalent GPA |
| Low budget / missing SAT | Four dated references exceed budget; academic results do not change with budget |

Test helpers explicitly provide synthetic scores, dates, course counts and declarations. Default demo keeps documents/AIF incomplete and adds a synthetic expected completion date of November 20, 2026. These inputs are not official admission facts.

36 domain tests cover rule/evidence semantics, source integrity, supplemented branches, costs, dates, scope, raw grades, recourse restrictions and pipeline equivalence. Browser tests separately cover the full golden journey, budget-only changes, API rejection, persistence, mobile sizing, empty states and automated accessibility.

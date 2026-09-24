# Changelog

## 1.1.0 — 2026-09-24

- New **focus view** (`app/focus.html`), built from the same source with an extra stylesheet (`src/styles/focus.css`). It has identical content, numbers and features, the same palette, a lower visual load and exactly three font sizes. The header button switches between the standard and focus views.
- `tests/e2e/font-audit.mjs` measures rendered font sizes (chart text included) on every tab, in both languages, in the normal and presenter layouts.
- Trigger rows stack to one column on narrow screens.

## 1.0.0 — 2026-09-24

First release for the class of 30 October 2026.

- Engine (`engine/`): bond pricing (DCF with fractional exponents, clean/dirty, durations, convexity), decomposition into rates / spread / liquidity, holding-period and funded return, ECL (scenario-weighted, optional discounting), recognition under AC / FVOCI / FVTPL, China five-category classification vs IFRS 9 stage, decision economics (break-even probability, extension PV cost vs modification loss), spread anatomy and sizing, IRB corporate risk weight, illustrative escalation rule.
- Acceptance tests reproducing every figure of the class deck; CI fails on drift.
- Fifteen tabs following the class: Home, Position, Mechanisms, Repricing lab, Spread anatomy, Ratings, Timeline, Structure, Portfolio, Recognition, Capital, Controls, Decision, The answer, Glossary.
- Instructor mode (presenter layout, reveal shortcuts, manual tallies, session timer, jump to stop) and Participant mode (hints, check-my-answer, local progress).
- Full English / 简体中文 parity with a CI check; single-file offline build; GitHub Pages deployment.

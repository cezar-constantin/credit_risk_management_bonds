# Slide-to-module map

Each class slide and where the app implements it: which tab, and which control or output. Tab numbers match the tab bar (0 Home … 14 Glossary).

> **Numbering note.** The class deck itself is not stored in this repository. This map was rebuilt from the class specification: 33 main slides in teaching order, plus Appendix A1–A9. Glossary = A7 and acronyms = A9, as in the deck. If your final deck numbers slides differently, renumber the left-hand column. The tab and control columns stay valid.

## Main slides

| # | Slide | Tab | Control / output that implements it |
|---|---|---|---|
| 1 | Title, disclaimer | 0 Home | Disclaimer card and footer on every screen, in both languages |
| 2 | The central question | 0 Home | Question banner; “Back to the question” strip on every tab |
| 3 | Opening poll: “A bond has paid every coupon on time…” | 0 Home | Options A–F with **Reveal** buttons; instructor tally for hand counts; takeaway |
| 4 | Agenda and the four stops | 0 Home · left panel | “Four stops” card; **Jump to stop** navigator; session timer (10:00–12:30 blocks) |
| 5 | The position: term sheet | 1 Position | Term sheet (fictional badge); Free-play editor; **Print case fact sheet** |
| 6 | FY2024 issuer profile | 1 Position | FY2024 table (revenue, sales, debt, ratios, cash cover, operating cash flow vs profit) |
| 7 | Six loss mechanisms while payments continue | 2 Mechanisms | Six toggle cards: where each appears (economic value / P&L / OCI / capital / realised), credit or not |
| 8 | Three accounting lenses | 2 Mechanisms · 9 Recognition | Lens switch (AC/FVOCI/FVTPL) redraws the matrix; business model + SPPI table |
| 9 | Stop 1 (Sep 2025): market repricing | 3 Repricing | **Stop 1** preset; tiles at Sep 2025 |
| 10 | Duration approximation vs DCF: three shocks | 3 Repricing | Vote-first **three-shock exercise**; “Duration approximation vs full DCF” table; Show workings |
| 11 | Stop 2 (Mar 2026): benchmark vs spread decomposition | 3 Repricing | **Stop 2** preset; decomposition bars (rates / spread / liquidity) |
| 12 | Holding-period result and first decision | 3 Repricing | Holding-period table (coupon, price, gross, funding, funded); instantaneous vs holding-period toggle; clean/dirty toggle; price-path chart |
| 13 | What a spread pays for | 4 Spread anatomy | Stacked bar: expected loss + credit-risk premium + liquidity premium |
| 14 | Break-even PD; physical vs risk-neutral PD | 4 Spread anatomy | Break-even calculator (spread ÷ LGD); explainer with reveal |
| 15 | Sizing: one default vs spread income | 4 Spread anatomy | Sizing calculator (weight, LGD, rest-of-portfolio spread) |
| 16 | Ratings: national vs global scales; termination | 5 Ratings | Scale explainer (no mapping table); **rating terminated** event that changes nothing until a reason is recorded and the grade refreshed |
| 17 | Stop 3: dated facts while every coupon is paid | 6 Timeline | Facts revealed one at a time; “thesis still stands?” vote/tally |
| 18 | Issuer tools: funnel and four ratios with operating cash flow | 6 Timeline | Analysis funnel; FY2024 vs FY2025 ratio table with alarm colouring |
| 19 | Missing-information list | 6 Timeline | Missing-information checklist |
| 20 | Support scoring: importance / linkage / capacity and will | 6 Timeline | Three sliders → qualitative score, with workings |
| 21 | Counterfactuals A and B (Jul 2026) | 6 Timeline · left panel | A/B switch that feeds spread → price into the tiles and the Decision tab |
| 22 | Structure and claims: parent MTN vs keepwell SPV vs bank Tier-2 | 7 Structure | Comparison table; “Default or not?” quiz (non-call ≠ default; write-down) |
| 23 | Precedents: Founder, Baoshang, 2026 Tier-2 non-call | 7 Structure | Precedent notes |
| 24 | Portfolio contrasts: five lines × four questions | 8 Portfolio | Pick mechanism and control, then reveal the model answer; benchmark and currency per line |
| 25 | Recognising April 2026 under AC / FVOCI / FVTPL | 9 Recognition | Three-lens table (carrying, P&L, OCI, equity) |
| 26 | ECL scenarios and the SICR judgement | 9 Recognition | Scenario inputs (up to 3, weights, discount toggle); SICR evidence checklist; Stage 1/2 toggle; POCI note |
| 27 | Five-category classification vs IFRS 9 stages | 9 Recognition | Five-category panel (dpd 90/270/360, credit-impaired, ECL ratio, restructured, 10% debtor rule, group note) next to the IFRS stage |
| 28 | Capital: risk weights, IRB vs weighted, OCI into CET1, G-SIB/TLAC | 10 Capital | Illustrative risk-weight table; approach toggle; OCI → CET1; static facts; “what capital does not do” |
| 29 | Controls mapped to the case dates; four lenses | 11 Controls | Four steps on the timeline; editable **illustrative** escalation rule; four functional lenses |
| 30 | Stop 4 (Jun 2026): proceeds vs holding value | 12 Decision | Value ladder; probability slider with break-even marker; capital and liquidity costs |
| 31 | Extension branch and hedge feasibility | 12 Decision | Extension calculator (PV cost vs modification loss); hedge note |
| 32 | Writing the decision | 12 Decision | Decision form with validation; print/PDF; JSON export/import; replay against A or B |
| 33 | The answer; ZKB visit questions | 13 The answer | Five statements with live numbers and links back; “what the answer is not”; ZKB questions |

## Appendix

| # | Appendix slide | Tab | Control / output |
|---|---|---|---|
| A1 | Pricing formulas and conventions | 1 Position · 3 Repricing | Tie-out table; **Show workings** on every calculation |
| A2 | ECL formulas, discounting, scenario weighting | 9 Recognition | ECL workings |
| A3 | Five-category rules (summary) | 9 Recognition | Rules applied; workings |
| A4 | Illustrative standardised risk weights | 10 Capital | Risk-weight table with references to verify |
| A5 | IRB risk-weight formula | 10 Capital | IRB workings |
| A6 | Illustrative escalation rule | 11 Controls | Editable thresholds; first-trigger date |
| A7 | Glossary | 14 Glossary | Bilingual, searchable terms |
| A8 | Nine-line reference list | 8 Portfolio | Reference table (currency, benchmark, mechanism, control) |
| A9 | Acronyms | 14 Glossary | Bilingual acronym list |

## Figures and tests

Every figure in class specification §2 is:

1. asserted by `tests/engine.test.js` (CI fails on drift);
2. listed in `data/case.json` → `tieOut`;
3. shown live, with its status, in **1 Position → Tie-out to the class deck** under Class defaults.

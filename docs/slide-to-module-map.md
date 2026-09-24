# Slide-to-module map (v3 deck)

The v3 deck (`Credit_Risk_in_Bond_Investment_Training_Deck_ICBC_v3`) has 35 main slides and 11 appendix slides. The instructor route in the app follows this order: left panel → **Slide route** (instructor mode), and Home → **Slide route**. Each question ID refers to `data/questions.json`, the class question bank loaded unchanged. The screen that answers a question is taken from the question's `app` field.

> Slide titles come from the update prompt. The deck file was not available when this map was written. Slides 6, 11, 18, 19, 26 and 35 are marked as transition slides. The appendix has 11 slides; A1–A9 are listed below. Check the titles and the two remaining appendix slides against the deck.

## Main slides

| Slide | Title | Questions | Screen | Control / output |
|---|---|---|---|---|
| 1 | Cover | — | Home | Cover; disclaimer on every screen |
| 2 | The question and opening poll | Q02 | Home | Question banner; Q02 choose-one panel; opening poll tallies |
| 3 | Reveal: six answers | Q03 | Home | Six-alternative reveal (A–F); Q03 panel |
| 4 | The bank's bond, your client | Q04 | Bond & client | Term sheet, FY2024 profile, "ICBC lens — two books, one obligor"; Q04 panel |
| 5 | Route: four stops | — | Home | Route card (35 slides) and "Jump to stop" |
| 6 | Transition slide | — | Home | Transition slide in the deck — no separate control |
| 7 | Six loss mechanisms | Q07 | Mechanisms | Six mechanism cards and where-it-appears matrix; Q07 panel |
| 8 | Bonds vs loans | Q08 | Bonds vs loans | Six-row loan vs bond flip table, Art. 7 callout; Q08 panel |
| 9 | Three accounting lenses | Q09 | Mechanisms | Accounting-lens switch (AC / FVOCI / FVTPL); Q09 panel |
| 10 | ICBC context: two books, one obligor | Q10 | Bond & client | ICBC lens callout; Q10 panel |
| 11 | Transition slide | — | Repricing | Transition slide in the deck — no separate control |
| 12 | Sensitivity: duration and DCF | Q12 | Repricing | Duration approximation vs DCF; Q12 (engine: −0.84 each → C) |
| 13 | Three shocks | Q13 | Repricing | Three-shock exercise, decomposition bars; Q13 (engine: −0.57 / −4.36 → B) |
| 14 | Holding-period result | Q14 | Repricing | Holding-period table; Q14 (engine: −3.33 → C) |
| 15 | What a spread pays for | Q15 | Spread anatomy | Break-even PD; Q15 (engine: 3.5% → B) |
| 16 | Ratings and evidence | Q16 | Ratings | Rating-termination event, Yongcheng example; Q16 panel |
| 17 | First decision (Stop 2) | V17, Q17 | Repricing | Stop 2 preset, executable bid 94.35 (engine check); V17 vote, Q17 panel |
| 18 | Transition slide | — | Timeline | Transition slide in the deck — no separate control |
| 19 | Transition slide | — | Timeline | Transition slide in the deck — no separate control |
| 20 | Timeline: deterioration while paying | V20, Q20 | Timeline | Dated facts with thesis votes; V20 vote, Q20 panel |
| 21 | Ratios | Q21 | Timeline | Ratios before/after with alarms; Q21 (engine: 0.43× → A) |
| 22 | Support scoring | Q22 | Timeline | Support scoring (20% provincial SOE, no board seat, one RMB 5 bn loan in 2024); Q22 panel |
| 23 | LGFV: score two profiles | Q23 | Timeline | LGFV — score two fictional profiles, room tally; Q23 panel |
| 24 | Structure and claims | Q24 | Structure | Parent MTN vs keepwell SPV vs bank Tier-2; Q24 panel |
| 25 | Portfolio contrasts | Q25 | Portfolio | Five lines × four questions (keepwell: FX and governing law; Tier-2 shortened); Q25 panel |
| 26 | Transition slide | — | Recognition | Transition slide in the deck — no separate control |
| 27 | Recognition | Q27 | Recognition | AC / FVOCI / FVTPL recognition, ECL scenarios, SICR; Q27 (engine: 5.40 → B); CECL callout for New York |
| 28 | Five-category classification | Q28 | Recognition | Five-category panel (Art. 7 more-than-10% rule) vs IFRS 9 stage; Q28 panel |
| 29 | Capital | Q29 | Capital | Risk weights, IRB vs weighted, OCI into CET1 (AT1/Tier-2 holdings note in Show workings); Q29 panel |
| 30 | Controls and five lenses | Q30 | Controls | Four control steps, illustrative escalation rule, five functional lenses (FMD HO, branch/relationship, risk, audit, operations); Q30 panel |
| 31 | Decision economics | Q31 | Decision | Value ladder, break-even marker on the probability slider; Q31 (engine: ≈ 8% → A) |
| 32 | Final decision (Stop 4) | V32, Q32 | Decision | Decision record, replay A/B; V32 vote, Q32 panel |
| 33 | ZKB visit questions | Q33 | The answer | ZKB visit questions; Q33 panel |
| 34 | The answer | — | The answer | Five statements with links; score; question sheet and answer key print |
| 35 | Transition slide | — | The answer | Transition slide in the deck — no separate control |

## Appendix (reference screens)

| Slide | Title | Screen |
|---|---|---|
| A1 | Pricing formulas | Bond & client |
| A2 | Sensitivity and decomposition workings | Repricing |
| A3 | ECL formulas | Recognition |
| A4 | Five-category rules | Recognition |
| A5 | CECL for New York | Recognition |
| A6 | Risk weights and IRB | Capital |
| A7 | Glossary | Glossary |
| A8 | Nine-line reference list | Portfolio |
| A9 | Acronyms | Glossary |

## Engine questions (checked in CI)

The engine computes the answers to Q12, Q13, Q14, Q15, Q21, Q27 and Q31 at runtime. `tests/questions.test.js` recomputes each value and asserts that it selects the option marked `answer` in `data/questions.json`. The Q17 executable bid (94.35 = price at 6.70% with two years remaining) is checked in the same file.

## Session blocks (instructor timer)

| Block | Time | Slides |
|---|---|---|
| Question, poll, the bank's bond | 10:00–10:10 | 1–5 |
| Mechanisms, bonds vs loans, three lenses | 10:10–10:30 | 6–10 |
| Stops 1–2: sensitivity, shocks, holding period, spread, ratings | 10:30–10:55 | 11–17 |
| Break | 10:55–11:10 | — |
| Stop 3: timeline, ratios, support, LGFV, structure, contrasts | 11:10–11:40 | 18–25 |
| Recognition, classification, capital, controls | 11:40–12:05 | 26–30 |
| Stop 4: the decision | 12:05–12:20 | 31–32 |
| ZKB questions and the answer | 12:20–12:30 | 33–35 |

# Slide-to-module map (v5 deck)

The v5 deck (`Credit_Risk_in_Bond_Investment_Training_Deck_ICBC_v5_EN`) has 27 main slides and the appendix A1–A14. The instructor route in the app follows this order (left panel → **Slide route** in instructor mode). Question IDs refer to `data/questions.json`. Class-tier questions (Q1–Q6, votes D1–D3) are on the participant sheet. Instructor-tier questions (Appendix A12) are shown in brackets; they appear only in instructor mode and in the answer key. Case figures follow `Case_Ledger_v5.md`.

## Main slides

| Slide | Title | Questions | Screen |
|---|---|---|---|
| 1 | Cover | — | Home |
| 2 | The opening question | Q1 | Home |
| 3 | Six mechanisms — five can hurt while every coupon is paid | (Q03), (Q07) | Mechanisms |
| 4 | The route: one bond, three committee decisions, six questions | — | Home |
| 5 | Same obligor, two instruments: bond vs loan | (Q08) | Bonds vs loans |
| 6 | One economic value, three accounting lenses | Q2 | Mechanisms |
| 7 | ICBC’s book: the credit slice is measured differently | (Q10) | Bond & client |
| 8 | Decision 1 · 15 Mar 2025: approve the purchase? | D1, (Q04) | Bond & client |
| 9 | How much value moves: one formula | Q3 | Repricing |
| 10 | What a spread pays for; what a rating does and does not tell you | (Q15), (Q16) | Spread anatomy |
| 11 | Break | — | Home |
| 12 | 15 Mar 2026, one year later: what the market did and what was known | Q4, (Q13), (Q14) | Repricing |
| 13 | Decision 2 · 15 Mar 2026: vote | D2, (Q17) | Repricing |
| 14 | 14 Apr 2026: the audited results — four ratios | (Q21) | Timeline |
| 15 | Support: who is protected, which debt, how enforceable | (Q22) | Timeline |
| 16 | LGFVs: score two profiles | (Q23) | Timeline |
| 17 | Where you stand in the claim | (Q24) | Structure |
| 18 | Recognition: three lenses, opening and closing balances | Q5, (Q27) | Recognition |
| 19 | Stage 2, credit-impaired, default, non-performing | (Q28) | Recognition |
| 20 | The portfolio view: one group, one support provider | — | Portfolio |
| 21 | Decision rights: an illustrative map | (Q30) | Controls |
| 22 | Executable proceeds versus hold value on one date | Q6, (Q31) | Decision |
| 23 | Decision 3 · 15 Jun 2026: the committee memo | D3, (Q32) | Decision |
| 24 | If support fails: the recovery decision | — | Workout |
| 25 | Own book and wealth-management product | — | Workout |
| 26 | The answer · four observable control measures | — | The answer |
| 27 | Discussion | — | The answer |

## Appendix (reference, not presented)

| Slide | Title | Questions | Screen |
|---|---|---|---|
| A1 | ICBC financial investments — detail with denominators | — | Bond & client |
| A2 | China bond market — reference statistics | — | Bond & client |
| A3 | Capital: approach, standardised weights, G-SIB and TLAC | (Q29) | Capital (reference) |
| A4 | Historical cases referred to in the session | — | Structure |
| A5 | IFRS 9 / CAS 22 versus US CECL | — | Recognition |
| A6 | Nine illustrative positions | (Q25) | Portfolio |
| A7 | Duration, spread anatomy and sizing | — | Spread anatomy |
| A8 | Extended calculations: quotes, hold/sell models, ECL, extension | — | Decision |
| A9 | Optional: ZKB — an explicit guarantee, a different accounting frame | (Q33) | The answer |
| A10 | Glossary for the interpreter | — | Glossary |
| A11 | Sources | — | Glossary |
| A12 | Additional instructor questions | — | The answer |
| A13 | Acronyms | — | Glossary |
| A14 | The case timeline: occurrence, disclosure, knowledge, decision | — | Timeline |

## Engine questions (checked in CI)

The engine computes Q3 (= Q12 logic: −0.84 each → C), Q5 (period charge −4.80 → B), Q6 and Q31 (same-date break-even ≈ 17% → B), Q13 (credit part −4.36 → B), Q14 (−3.33 → C), Q15 (3.5% → B), Q21 (0.43× → A) and Q27 (5.40 → B) at runtime. `tests/questions.test.js` asserts that each computed value selects the stored answer. The Q17 executable bid of 94.37 is checked in the same file.

## Session blocks (instructor timer)

| Block | Time | Slides | Screens |
|---|---|---|---|
| Opening question · six mechanisms · the route | 10:00–10:11 | 1–4 | Home, Mechanisms |
| Bonds vs loans · three accounting lenses · ICBC’s book | 10:11–10:26 | 5–7 | Bonds vs loans, Mechanisms, Bond & client |
| Decision 1 · 15 Mar 2025 — approve the purchase? | 10:26–10:38 | 8 | Bond & client |
| Sizing the risk · duration · what a spread pays for · ratings | 10:38–10:55 | 9–10 | Repricing, Spread anatomy, Ratings |
| Break | 10:55–11:10 | 11 | — |
| Decision 2 · 15 Mar 2026 — what the market did, what you knew | 11:10–11:24 | 12–13 | Repricing, Timeline |
| Deterioration · results and ratios · support · LGFVs · structure | 11:24–11:44 | 14–17 | Timeline, Structure |
| Recognition · bridge · categories vs stages · portfolio · decision rights | 11:44–12:04 | 18–21 | Recognition, Portfolio, Controls |
| Decision 3 · 15 Jun 2026 — memo · recovery · own book vs WM | 12:04–12:21 | 22–25 | Decision, Workout |
| The answer · four control measures · discussion | 12:21–12:30 | 26–27 | The answer, Controls |

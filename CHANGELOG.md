# Changelog

## 1.3.0 — 2026-10-01 — v5 case numbers (partial; see "Not yet applied")

- Quote convention: `width`, mid-to-bid = width ÷ 2, block concession = width ÷ 2 at every stop; executable bid on 15 Mar 2026 = **94.37** (exact, mid + 20 bp + 20 bp). The Repricing lab shows the three parts and a panel of what was known by 15 Mar 2026 (head office vs branch only).
- ECL path 0.60 → **1.20** (15 Mar 2026, Stage 1 remeasured at PD 2%) → 6.00 (15 Apr 2026, Stage 2); 12-month alternative 3.60, discounted illustration 5.79.
- Recognition: the single-period table is replaced by the **accounting bridge**. It covers three dates and three lenses, plus the 15 Mar → 15 Apr period: AC net 99.40 → 98.80 → 94.00; FVOCI 100.00 → 95.07 → 93.59, with OCI +0.60 → −3.73 → −0.41 and equity 0 → −4.93 → −6.41; FVTPL 0 → −4.93 → −6.41. Period: AC P&L −4.80; FVOCI P&L −4.80, OCI +3.32, equity −1.48; FVTPL −1.48.
- Counterfactuals are valued on **15 Jun 2026**, the same date as the 91.32 bid: A 98.11, B 89.91, break-even ≈ 17.2%. A forward-horizon model to 15 Sep 2026 sits behind a toggle: sell and reinvest 91.78; A 99.39 / 98.56; B 92.25 / 90.45; break-even 16.3% at bid, negative at mid. Second-tranche bid 90.61.
- Decision: same-date ladder (100.89 / 92.76 / 91.32 / 98.11 / 89.91) and the class model decision record (30 Jun, 31 Jul, 15 Aug, 31 Aug; floor 91.3 with a one-time 50 bp fallback; impairment assessed on the day; sizing rationale).
- Timeline: four date columns per event (occurrence / disclosure / head office / branch / decision). The trust-loan extensions are branch-only (12 Mar 2026), results are dated 14 Apr 2026 and the rating termination 12 Jun 2026.
- Capital is now a reference screen (after The answer), with Art. 32 (OCI in CET1) added and "zero issuer credit" on CGBs labelled a case assumption. Home subtitle and disclaimer updated; glossary gains the A10 terms.
- Engine questions: Q3 = old Q12, Q6 = old Q31 (≈ 17% → B), new Q5 (period charge −4.80 → B), and Q17 bid 94.37 exact. The question-bank shape test now expects 31 items.

### Not yet applied (source files not supplied)
`case_ledger_v5.json` and its §3, §8 and §9, the v5 question bank, the slide-23 memo, the seven pre-purchase questions, the decision-rights map and four measures, the workout and WM-vs-own-book content, and Capital Rules Art. 58 and Art. 70.

## 1.2.0 — 2026-09-24 — aligned with the v3 class materials

- Huaxing is de-identified: a top-30 developer in a tier-2 city; a provincial SOE holds 20% with no board seat; one RMB 5 bn shareholder loan in 2024. Counterfactual A is now a registered guarantee plus a new RMB 5 bn loan. Prices, spreads, ratios, ECL figures and all acceptance tests are unchanged. `scripts/check-content.mjs` fails CI if the old profile appears in the build.
- New framing, "the bank's bond, your client": the bond sits in the head-office book and the obligor is a branch client. The Position screen gains an "ICBC lens — two books, one obligor" callout.
- New screen, **Bonds vs loans** (slide 8): six flippable rows, each tied to its loss mechanism, with the Art. 7 callout. The five-category engine now applies "more than 10%", as in Art. 7.
- Timeline: **LGFV — score two profiles** (slide 23): two fictional platforms, 1–5 scoring and a room tally.
- Controls: five functional lenses. Financial Markets Department (HO) replaces Investment, and Branch / relationship is added. The escalation rule is labelled "neither ICBC policy nor a regulatory requirement".
- Recognition: a CECL callout for the New York branch (FFIEC 002, ASU 2016-13), with the day-one order of magnitude 1.80 vs IFRS 9's 0.60.
- Portfolio: the keepwell line now carries FX and governing law; the Tier-2 line is shortened. Ratings: Yongcheng example added. Capital: the AT1/Tier-2 holdings note moved into "Show workings".
- **Choose-one questions**: one identical panel design on every screen, driven by `data/questions.json` (the class question bank, loaded unchanged). Engine questions Q12, Q13, Q14, Q15, Q21, Q27 and Q31 are answered by the engine at runtime and checked in CI, together with the Q17 bid. Participants' answers and score stay in the browser. The question sheet and answer key can be printed. `scripts/question-shots.mjs` checks reachability and writes the screenshots to `docs/questions/`.
- **Guided / Full** screen detail: Guided is the default for participants and shows only the table the class uses plus the questions.
- Instructor route in v3 slide order (35 slides, appendix A1–A9), with new session blocks at 10:10 / 10:30 / 10:55 break / 11:10 / 11:40 / 12:05 / 12:20. `docs/slide-to-module-map.md` uses the v3 numbering.

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

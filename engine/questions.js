// Engine questions — the class questions whose answer is a number the engine computes at runtime.
// For each question the engine returns the computed value(s), a one-line workings trace and the
// numbers (or, where the answer is a comparison, the keywords) that identify the correct option.
// `selectOption` picks the option from the question bank's option texts; CI asserts that this
// selection equals the `answer` stored in data/questions.json (tests/questions.test.js).

import { caseFigures } from './case.js';
import { shockCompare, cashflows } from './pricing.js';
import { purchaseYield } from './case.js';

const f2 = (x) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(2);

/** Engine answers for the seven engine questions (+ the Q17 bid check), computed from case data. */
export function engineAnswers(data, { position = data.position } = {}) {
  const F = caseFigures(data, { position });
  const scale = position.nominal / 100;
  const flows0 = cashflows({ coupon: position.coupon, tenor: position.tenor }, 0);
  const y0 = purchaseYield(position);
  const bench = shockCompare(flows0, y0, 0.003, scale);
  const spread = shockCompare(flows0, y0, 0.003, scale);
  const fy = data.financials.fy2025;
  const cover = fy.cash / fy.std;
  const hp = F.mar26;

  return {
    Q12: {
      values: { benchmark: bench.approx, spread: spread.approx, modifiedDuration: F.t0.modified },
      workings: `benchmark +30 bp: −MV × D_mod × Δy = −${(bench.p0).toFixed(2)} × ${F.t0.modified.toFixed(2)} × 0.0030 = ${f2(bench.approx)}; spread +30 bp: ${f2(spread.approx)} → identical`,
      display: `${f2(bench.approx)} = ${f2(spread.approx)}`,
      // The answer is a comparison: the option that says the two effects are the same.
      keywords: ['identical', 'same', 'equal', 'no difference', '相同', '一样', '相等', '无差别'],
      targets: [Math.abs(bench.approx)],
      expectedLetter: 'C',
    },
    Q13: {
      values: { rates: hp.benchmarkEffect, spread: hp.spreadEffect, total: hp.totalPriceEffect },
      workings: `rates ${f2(hp.benchmarkEffect)} + spread ${f2(hp.spreadEffect)} = ${f2(hp.totalPriceEffect)} (price 99.43 at 3.90%, 95.07 at 6.30%)`,
      display: `${f2(hp.benchmarkEffect)} / ${f2(hp.spreadEffect)} / ${f2(hp.totalPriceEffect)}`,
      targets: [Math.abs(hp.benchmarkEffect), Math.abs(hp.spreadEffect)],
      ordered: true,
      expectedLetter: 'B',
    },
    Q14: {
      values: { coupon: hp.coupon, price: hp.totalPriceEffect, gross: hp.gross, funding: -hp.funding, funded: hp.funded },
      workings: `funded return = ${hp.coupon.toFixed(2)} − ${Math.abs(hp.totalPriceEffect).toFixed(2)} − ${hp.funding.toFixed(2)} = ${f2(hp.funded)} (gross ${f2(hp.gross)})`,
      display: f2(hp.funded),
      targets: [Math.abs(hp.funded)],
      expectedLetter: 'C',
    },
    Q15: {
      values: { breakEvenPD: F.spread.breakEvenPD },
      workings: `break-even default rate = ${position.spread} bp ÷ ${position.lgd}% = ${(F.spread.breakEvenPD * 100).toFixed(1)}% p.a.`,
      display: `${(F.spread.breakEvenPD * 100).toFixed(1)}%`,
      targets: [F.spread.breakEvenPD * 100],
      tol: 0.05,
      expectedLetter: 'B',
    },
    Q21: {
      values: { cashCover: cover },
      workings: `unrestricted cash ÷ short-term debt = ${fy.cash} ÷ ${fy.std} = ${cover.toFixed(2)}× (< 1× alarm)`,
      display: `${cover.toFixed(2)}×`,
      targets: [cover],
      expectedLetter: 'A',
    },
    Q27: {
      values: { stage2Charge: F.ecl.stage2Charge, stage1Charge: F.ecl.stage1Charge, fvtpl: F.recognition.fvtpl.pnlPeriod },
      workings: `Stage 2 charge = lifetime ${F.ecl.aprLifetime.toFixed(2)} − 12-month at T0 ${F.ecl.t0.toFixed(2)} = ${F.ecl.stage2Charge.toFixed(2)} (Stage 1 would be ${F.ecl.stage1Charge.toFixed(2)}; FVTPL shows ${f2(F.recognition.fvtpl.pnlPeriod)})`,
      display: F.ecl.stage2Charge.toFixed(2),
      targets: [F.ecl.stage2Charge],
      expectedLetter: 'B',
    },
    Q31: {
      values: { breakEven: F.jul26.breakEven, sale: F.jun26.bid, A: F.jul26.A, B: F.jul26.B },
      workings: `break-even support probability = (${F.jun26.bid.toFixed(2)} − ${F.jul26.B.toFixed(2)}) ÷ (${F.jul26.A.toFixed(2)} − ${F.jul26.B.toFixed(2)}) = ${(F.jul26.breakEven * 100).toFixed(1)}% ≈ ${Math.round(F.jul26.breakEven * 100)}%`,
      display: `≈ ${Math.round(F.jul26.breakEven * 100)}%`,
      targets: [F.jul26.breakEven * 100],
      tol: 0.5,
      expectedLetter: 'A',
    },
    Q17bid: {
      values: { bid: F.mar26.bid },
      workings: `price at 6.70% (6.30% + 40 bp) with two years remaining = ${F.mar26.bid.toFixed(2)} (class figure ≈ 94.35)`,
      display: F.mar26.bid.toFixed(2),
      targets: [94.35],
      tol: 0.05,
    },
  };
}

export const ENGINE_QUESTION_IDS = ['Q12', 'Q13', 'Q14', 'Q15', 'Q21', 'Q27', 'Q31'];

/** Numbers appearing in an option text (signs ignored; thousands separators removed). */
export function numbersIn(text) {
  return (String(text).replace(/(\d),(\d{3})/g, '$1$2').match(/\d+(?:\.\d+)?/g) || []).map(Number);
}

/**
 * Picks the option identified by an engine answer. Keywords first (comparisons), then numbers:
 * an option matches when every target number appears in it (in order if `ordered`).
 * Returns the option index, or null when no single option matches.
 */
export function selectOption(ans, options) {
  const texts = options.map((o) => String(o).toLowerCase());
  if (ans.keywords) {
    const hits = texts.map((tx, i) => (ans.keywords.some((k) => tx.includes(k.toLowerCase())) ? i : -1)).filter((i) => i >= 0);
    if (hits.length === 1) return hits[0];
  }
  const tol = ans.tol ?? 0.005;
  const hits = texts.map((tx, i) => {
    const nums = numbersIn(tx);
    let from = 0;
    for (const target of ans.targets) {
      const j = nums.findIndex((n, k) => k >= (ans.ordered ? from : 0) && Math.abs(n - target) <= tol + 1e-9);
      if (j < 0) return -1;
      from = j + 1;
    }
    return i;
  }).filter((i) => i >= 0);
  return hits.length === 1 ? hits[0] : null;
}

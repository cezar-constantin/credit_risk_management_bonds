// Acceptance tests — the engine must reproduce the class numbers exactly (spec §2).
// Values are hard-coded here, independently of data/case.json, so that any drift in the
// engine or in the case data fails CI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  caseFigures, figureAt, cashflows, pv, shockCompare, holdingPeriod, decompose,
  ecl, lifetimeEcl, weightedEcl, recognition, fiveCategory, ifrsStage,
  breakEvenProbability, extensionBranch, breakEvenPD, sizing, spreadAnatomy,
  irbCorporateRW, evaluateEscalation, accrued, cleanPrice,
} from '../engine/index.js';

const data = JSON.parse(readFileSync(new URL('../data/case.json', import.meta.url), 'utf8'));
const F = caseFigures(data);
const r2 = (x) => Math.round(x * 100) / 100;
const eq2 = (actual, expected, msg) => assert.equal(r2(actual).toFixed(2), expected.toFixed(2), msg);

test('T0: 3 years at 3.60 % — price, Macaulay and modified duration', () => {
  eq2(F.t0.price, 100.0, 'price');
  eq2(F.t0.macaulay, 2.9, 'Macaulay duration');
  eq2(F.t0.modified, 2.8, 'modified duration');
});

test('T0 instantaneous shocks — approximation vs DCF (RMB m)', () => {
  const [s120, s50, b30] = F.shocks;
  eq2(s120.approx, -3.36, '+120 bp approx');
  eq2(s120.dcf, -3.28, '+120 bp DCF');
  eq2(s50.approx, -1.40, '+50 bp approx');
  eq2(s50.dcf, -1.38, '+50 bp DCF');
  eq2(b30.approx, -0.84, 'benchmark +30 bp approx');
  eq2(b30.dcf, -0.83, 'benchmark +30 bp DCF');
});

test('15 Mar 2026, 2 years remaining — decomposition and holding-period result', () => {
  eq2(F.mar26.priceAfterBenchmark, 99.43, 'price at 3.90 %');
  eq2(F.mar26.benchmarkEffect, -0.57, 'benchmark effect');
  eq2(F.mar26.price, 95.07, 'price at 6.30 %');
  eq2(F.mar26.spreadEffect, -4.36, 'spread effect');
  eq2(F.mar26.totalPriceEffect, -4.93, 'total price effect');
  eq2(F.mar26.coupon, 3.60, 'coupon');
  eq2(F.mar26.gross, -1.33, 'gross total return');
  eq2(F.mar26.funded, -3.33, 'funded return');
  assert.ok(Math.abs(F.mar26.bid - 94.35) < 0.05, `executable bid ≈ 94.35 (got ${F.mar26.bid.toFixed(4)})`);
});

test('15 Apr 2026, 1.917 years remaining — dirty value, mid, executable bid', () => {
  const flows = cashflows({ coupon: 3.6, tenor: 3 }, 13 / 12);
  assert.deepEqual(flows.map((f) => f.t.toFixed(3)), ['0.917', '1.917']);
  eq2(F.apr26.amortisedCost, 100.30, 'dirty value at 3.60 %');
  eq2(F.apr26.accrued, 0.30, 'accrued');
  eq2(F.apr26.mid, 93.89, 'mid at 7.30 %');
  eq2(F.apr26.economic, -6.41, 'economic change');
  eq2(F.apr26.bid, 92.91, 'executable bid at +60 bp');
  eq2(F.apr26.realised, -7.39, 'realised if sold');
});

test('ECL at T0 and April 2026', () => {
  eq2(F.ecl.t0, 0.60, '12-month ECL at T0');
  eq2(F.ecl.apr12, 3.60, '12-month ECL Apr 2026');
  eq2(F.ecl.aprLifetime, 6.00, 'lifetime ECL Apr 2026');
  eq2(F.ecl.aprLifetimeDiscounted, 5.79, 'lifetime ECL discounted one year at 3.60 %');
  eq2(F.ecl.stage2Charge, 5.40, 'Stage 2 charge');
  eq2(F.ecl.stage1Charge, 3.00, 'Stage 1 alternative');
});

test('Recognition of the April 2026 position under AC / FVOCI / FVTPL', () => {
  const R = F.recognition;
  eq2(R.ac.carrying, 94.30, 'AC carrying');
  eq2(R.ac.pnlPeriod, -5.40, 'AC P&L');
  eq2(R.fvoci.carrying, 93.89, 'FVOCI carrying');
  eq2(R.fvoci.pnlPeriod, -5.40, 'FVOCI P&L');
  eq2(R.fvoci.ociCumulative, -0.41, 'FVOCI OCI cumulative');
  eq2(R.fvoci.equityCumulative, -6.41, 'FVOCI equity');
  eq2(R.fvtpl.pnlPeriod, -6.41, 'FVTPL P&L');
});

test('15 Jun 2026, 1.75 years remaining', () => {
  eq2(F.jun26.remaining, 1.75, 'remaining life');
  eq2(F.jun26.amortisedCost, 100.89, 'dirty at 3.60 %');
  eq2(F.jun26.mid, 92.76, 'mid at 8.80 %');
  eq2(F.jun26.economic, -8.12, 'economic change');
  eq2(F.jun26.bid, 91.32, 'executable bid at +100 bp');
  eq2(F.jun26.realised, -9.57, 'realised if sold');
});

test('Jul 2026 counterfactuals and break-even probability', () => {
  assert.equal(F.jul26.remaining.toFixed(3), '1.667');
  eq2(F.jul26.A, 98.53, 'counterfactual A at 5.30 %');
  eq2(F.jul26.B, 90.68, 'counterfactual B at 10.80 %');
  assert.equal(Math.round(F.jul26.breakEven * 100), 8, 'break-even probability ≈ 8 %');
});

test('Extension branch — PV cost vs modification loss at the original EIR', () => {
  eq2(F.extension.pvCost, 2.87, 'PV cost at 8.80 %');
  eq2(F.extension.modificationLoss, 0.0, 'modification loss at 3.60 %');
});

test('Spread anatomy and sizing', () => {
  assert.equal(F.spread.breakEvenPD.toFixed(4), '0.0350', 'break-even PD 3.5 %');
  assert.equal((F.spread.sizingLoss * 100).toFixed(2), '0.60', 'loss 0.60 % of portfolio');
  assert.equal((F.spread.restIncome[0] * 100).toFixed(3), '0.396', 'rest at 40 bp');
  assert.equal((F.spread.restIncome[1] * 100).toFixed(3), '1.485', 'rest at 150 bp');
});

test('Tie-out table in data/case.json agrees with the engine', () => {
  for (const row of data.tieOut) {
    const v = figureAt(F, row.path);
    const tol = row.tol ?? 0.5 * 10 ** -row.dp + 1e-9;
    assert.ok(Math.abs(v - row.expected) <= tol, `${row.id}: ${v} vs ${row.expected}`);
  }
});

// --- Unit tests of the building blocks --------------------------------------------------------

test('pricing primitives', () => {
  const bond = { coupon: 3.6, tenor: 3 };
  assert.equal(r2(pv(cashflows(bond, 0), 0.036)), 100);
  assert.equal(accrued(bond, 0), 0);
  assert.equal(accrued(bond, 1), 0);
  assert.ok(Math.abs(accrued(bond, 1.5) - 1.8) < 1e-9);
  assert.ok(Math.abs(cleanPrice(bond, 0.5, 0.036) - 100) < 0.02, 'clean ≈ par at the coupon yield');
  const s = shockCompare(cashflows(bond, 0), 0.036, 0.01);
  assert.ok(s.dcf > s.approx, 'convexity: DCF loss smaller than the duration approximation');
  const hp = holdingPeriod(bond, 1, { purchasePrice: 100, y: 0.036, fundingRate: 0.02 });
  assert.ok(Math.abs(hp.gross - 3.6) < 1e-9);
  const d = decompose(bond, 1, { y0: 0.036, dBench: 0.003, dSpread: 0.024, bidAsk: 0.004 });
  assert.ok(Math.abs(d.rates + d.spread + d.liquidity - d.realised) < 1e-12);
});

test('ECL helpers', () => {
  assert.equal(r2(ecl(0.01, 0.6, 100)), 0.6);
  assert.equal(r2(lifetimeEcl(0.1, 0.6, 100, { discount: true, eir: 0.036 })), 5.79);
  const w = weightedEcl([{ weight: 1, pd12: 0.06, pdLife: 0.1, lgd: 0.6 }, { weight: 1, pd12: 0.02, pdLife: 0.04, lgd: 0.6 }], 100);
  assert.equal(r2(w.ecl12), 2.4);
  assert.equal(r2(w.eclLifetime), 4.2);
  const rec = recognition({ grossAmortisedCost: 100, fairValue: 90, allowancePrev: 0, allowanceNew: 5 });
  assert.equal(rec.fvoci.ociCumulative, -5);
  assert.equal(rec.fvoci.pnlCumulative + rec.fvoci.ociCumulative, rec.fvtpl.pnlCumulative);
});

test('five-category classification vs IFRS stage', () => {
  assert.equal(fiveCategory({}).category, 'normal');
  assert.equal(fiveCategory({ dpd: 10 }).category, 'specialMention');
  assert.equal(fiveCategory({ restructured: true }).category, 'specialMention');
  assert.equal(fiveCategory({ dpd: 91 }).category, 'substandard');
  assert.equal(fiveCategory({ npShare: 0.1 }).category, 'normal', 'exactly 10 % is not “more than 10 %”');
  assert.equal(fiveCategory({ npShare: 0.11 }).category, 'substandard');
  assert.equal(fiveCategory({ dpd: 271 }).category, 'doubtful');
  assert.equal(fiveCategory({ creditImpaired: true, eclRatio: 0.5 }).category, 'doubtful');
  assert.equal(fiveCategory({ dpd: 361 }).category, 'loss');
  assert.equal(fiveCategory({ eclRatio: 0.9 }).category, 'loss');
  assert.equal(ifrsStage({ sicr: true }).stage, 2);
  assert.equal(ifrsStage({ dpd: 31 }).stage, 2);
  assert.equal(ifrsStage({ creditImpaired: true }).stage, 3);
  // A Stage 2 bond that is current can remain "normal" — the two systems answer different questions.
  assert.equal(fiveCategory({ dpd: 0 }).category, 'normal');
});

test('decision helpers', () => {
  const be = breakEvenProbability({ saleProceeds: 95, valueA: 100, valueB: 90 });
  assert.equal(be.raw, 0.5);
  const ext = extensionBranch({ paidShare: 0.4, delayYears: 1, coupon: 0.036, marketRate: 0.088, eir: 0.036 });
  assert.equal(r2(ext.pvCost), 2.87);
  assert.equal(r2(ext.modificationLoss), 0);
  assert.equal(breakEvenPD(0.021, 0.6).toFixed(3), '0.035');
  const sz = sizing({ weight: 0.01, lgd: 0.6, restSpread: 0.004 });
  assert.equal(sz.loss, 0.006);
  const an = spreadAnatomy({ spread: 0.021, pdPhysical: 0.01, lgd: 0.6, liquidityPremium: 0.004 });
  assert.ok(Math.abs(an.expectedLoss + an.liquidityPremium + an.creditRiskPremium - 0.021) < 1e-12);
});

test('IRB corporate risk weight is in the textbook range', () => {
  const rw = irbCorporateRW({ pd: 0.01, lgd: 0.45, maturity: 2.5 }).rw;
  assert.ok(rw > 0.9 && rw < 1.05, `RW for PD 1 %, LGD 45 %, M 2.5 ≈ 92 % (got ${rw})`);
});

test('illustrative escalation rule', () => {
  const rule = { spreadLevel: 500, spreadWidening: 250, priceFloor: 95, cashCover: 1, minHits: 2 };
  const res = evaluateEscalation(rule, [
    { id: 'a', spread: 330, price: 98, cashCover: 1.07, event: false },
    { id: 'b', spread: 550, price: 93.6, cashCover: 0.43, event: true },
  ], 210);
  assert.equal(res.firstTrigger, 'b');
  assert.equal(res.rows[0].count, 0);
});

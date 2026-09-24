// Case layer: turns the Huaxing case data (data/case.json) into every figure used in class.
// All money values are in RMB m for the stated nominal (per-100 values × nominal / 100).

import { cashflows, pv, macaulayDuration, modifiedDuration, shockCompare, decompose, holdingPeriod, yieldFromPrice } from './pricing.js';
import { ecl, lifetimeEcl, recognition } from './ecl.js';
import { breakEvenProbability, extensionBranch, breakEvenPD, sizing } from './decision.js';

export const bp = (x) => x / 10000;
export const pct = (x) => x / 100;

/** Bond object used by the pricing engine. */
export function bondOf(position) {
  return { coupon: position.coupon, tenor: position.tenor, face: 100 };
}

/** Purchase (issue) yield = benchmark + spread at purchase, as a decimal. */
export function purchaseYield(position) {
  return pct(position.benchmark) + bp(position.spread);
}

/** Purchase price per 100 at the purchase yield (100.00 when coupon = yield). */
export function purchasePrice(position) {
  return pv(cashflows(bondOf(position), 0), purchaseYield(position));
}

/** Market state of a stop: benchmark (%), spread (bp), bid–ask (bp), applying a counterfactual if set. */
export function stopMarket(position, stop, cf = 'none') {
  const over = cf !== 'none' && stop.counterfactuals ? stop.counterfactuals[cf] : null;
  const dBench = stop.dBenchmark;
  const dSpread = over ? over.dSpread : stop.dSpread;
  const bidAsk = over ? over.bidAsk : stop.bidAsk;
  const benchmark = position.benchmark + dBench / 100;
  const spread = position.spread + dSpread;
  return { dBench, dSpread, bidAsk, benchmark, spread, yield: benchmark / 100 + bp(spread) };
}

/** Full valuation of the position at a stop (per 100 and money). */
export function valueAtStop(position, stop, cf = 'none') {
  const bond = bondOf(position);
  const elapsed = stop.months / 12;
  const y0 = purchaseYield(position);
  const mkt = stopMarket(position, stop, cf);
  const d = decompose(bond, elapsed, { y0, dBench: bp(mkt.dBench), dSpread: bp(mkt.dSpread), bidAsk: bp(mkt.bidAsk) });
  const scale = position.nominal / 100;
  return {
    elapsed,
    remaining: position.tenor - elapsed,
    market: mkt,
    perHundred: d,
    scale,
    amortisedCost: d.base * scale,
    mid: d.mid * scale,
    bid: d.bid * scale,
    economic: d.economic * scale,
    realised: d.realised * scale,
    rates: d.rates * scale,
    spreadEffect: d.spread * scale,
    liquidity: d.liquidity * scale,
  };
}

/** Every acceptance figure of the class deck, computed from case data. */
export function caseFigures(data, { position = data.position } = {}) {
  const bond = bondOf(position);
  const scale = position.nominal / 100;
  const y0 = purchaseYield(position);
  const stops = Object.fromEntries(data.stops.map((s) => [s.id, s]));
  const flows0 = cashflows(bond, 0);

  const t0 = {
    price: pv(flows0, y0),
    macaulay: macaulayDuration(flows0, y0),
    modified: modifiedDuration(flows0, y0),
  };
  const shocks = data.shocks.map((s) => ({ id: s.id, ...shockCompare(flows0, y0, bp(s.bp), scale) }));

  const s2 = valueAtStop(position, stops.mar26);
  const hp = holdingPeriod(bond, 1, { purchasePrice: purchasePrice(position), y: s2.market.yield, fundingRate: pct(position.funding) });
  const mar26 = {
    priceAfterBenchmark: s2.perHundred.afterRates,
    price: s2.perHundred.mid,
    benchmarkEffect: s2.rates,
    spreadEffect: s2.spreadEffect,
    totalPriceEffect: s2.rates + s2.spreadEffect,
    coupon: hp.couponIncome * scale,
    gross: hp.gross * scale,
    funding: hp.funding * scale,
    funded: hp.funded * scale,
    bid: s2.perHundred.bid,
  };

  const a = valueAtStop(position, stops.apr26);
  const apr26 = {
    remaining: a.remaining,
    amortisedCost: a.amortisedCost,
    accrued: a.amortisedCost - 100 * scale,
    mid: a.mid,
    economic: a.economic,
    bid: a.bid,
    realised: a.realised,
  };

  const E = data.ecl;
  const ead = position.nominal;
  const eclT0 = ecl(pct(position.pd12), pct(position.lgd), ead);
  const ecl12 = ecl(pct(E.pd12), pct(E.lgd), ead);
  const eclLife = lifetimeEcl(pct(E.pdLife), pct(E.lgd), ead);
  const eclLifeDisc = lifetimeEcl(pct(E.pdLife), pct(E.lgd), ead, { discount: true, eir: y0, years: 1 });
  const eclFig = {
    t0: eclT0,
    apr12: ecl12,
    aprLifetime: eclLife,
    aprLifetimeDiscounted: eclLifeDisc,
    stage2Charge: eclLife - eclT0,
    stage1Charge: ecl12 - eclT0,
  };
  const rec = recognition({ grossAmortisedCost: a.amortisedCost, fairValue: a.mid, allowancePrev: eclT0, allowanceNew: eclLife });

  const j = valueAtStop(position, stops.jun26);
  const jun26 = { remaining: j.remaining, amortisedCost: j.amortisedCost, mid: j.mid, economic: j.economic, bid: j.bid, realised: j.realised };

  const A = valueAtStop(position, stops.jul26, 'A');
  const B = valueAtStop(position, stops.jul26, 'B');
  const be = breakEvenProbability({ saleProceeds: j.bid, valueA: A.mid, valueB: B.mid });
  const jul26 = { remaining: A.remaining, A: A.mid, B: B.mid, breakEven: be.raw };

  const X = data.extension;
  const ext = extensionBranch({
    face: 100,
    paidShare: pct(X.paidShare),
    delayYears: X.delayYears,
    coupon: pct(position.coupon),
    marketRate: j.market.yield,
    eir: y0,
  });
  const extension = { pvCost: ext.pvCost * scale, modificationLoss: ext.modificationLoss * scale };

  const S = data.sizing;
  const spread = {
    breakEvenPD: breakEvenPD(bp(position.spread), pct(position.lgd)),
    sizingLoss: sizing({ weight: pct(S.weight), lgd: pct(S.lgd), restSpread: bp(S.restSpreads[0]) }).loss,
    restIncome: S.restSpreads.map((r) => sizing({ weight: pct(S.weight), lgd: pct(S.lgd), restSpread: bp(r) }).restIncome),
  };

  return { t0, shocks, mar26, apr26, ecl: eclFig, recognition: rec, jun26, jul26, extension, spread };
}

/** Reads a dotted path such as "mar26.price" or "shocks.0.dcf" from the figures object. */
export function figureAt(figures, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), figures);
}

export { yieldFromPrice };

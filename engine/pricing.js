// Bond pricing engine — pure functions, no DOM, no framework.
// Conventions (teaching simplifications, see README "How the numbers tie to the deck"):
//   * annual coupon, bullet repayment, prices per 100 nominal;
//   * discounting with annual compounding and fractional exponents: PV = CF / (1 + y)^t;
//   * "dirty" value = PV of all remaining cash flows (includes accrued interest);
//   * "clean" price = dirty value − accrued interest (linear accrual since the last coupon);
//   * yields and spreads are passed as decimals (0.036 = 3.60 %, 0.021 = 210 bp).

const EPS = 1e-9;

/** Remaining cash flows at time `elapsed` (years since issue) for a bullet bond. */
export function cashflows({ coupon, tenor, face = 100 }, elapsed = 0) {
  const flows = [];
  for (let k = 1; k <= tenor; k += 1) {
    const t = k - elapsed;
    if (t > EPS) flows.push({ t, amount: coupon * face / 100 + (k === tenor ? face : 0) });
  }
  return flows;
}

/** Present value of a list of cash flows at yield y (decimal). */
export function pv(flows, y) {
  return flows.reduce((sum, f) => sum + f.amount / Math.pow(1 + y, f.t), 0);
}

/** Accrued interest at time `elapsed` (linear since the last annual coupon). */
export function accrued({ coupon, tenor, face = 100 }, elapsed = 0) {
  if (elapsed <= EPS || elapsed >= tenor - EPS) return 0;
  const frac = elapsed - Math.floor(elapsed + EPS);
  return coupon * face / 100 * (frac < EPS ? 0 : frac);
}

/** Dirty value (PV of remaining cash flows) at `elapsed` years and yield y. */
export function dirtyPrice(bond, elapsed, y) {
  return pv(cashflows(bond, elapsed), y);
}

/** Clean price = dirty value − accrued interest. */
export function cleanPrice(bond, elapsed, y) {
  return dirtyPrice(bond, elapsed, y) - accrued(bond, elapsed);
}

/** Macaulay duration (years) of the remaining cash flows at yield y. */
export function macaulayDuration(flows, y) {
  const p = pv(flows, y);
  return flows.reduce((s, f) => s + f.t * f.amount / Math.pow(1 + y, f.t), 0) / p;
}

/** Modified duration = Macaulay / (1 + y) (annual compounding). */
export function modifiedDuration(flows, y) {
  return macaulayDuration(flows, y) / (1 + y);
}

/** Convexity (years²), annual compounding. */
export function convexity(flows, y) {
  const p = pv(flows, y);
  return flows.reduce((s, f) => s + f.amount * f.t * (f.t + 1) / Math.pow(1 + y, f.t + 2), 0) / p;
}

/**
 * Instantaneous shock: first-order approximation (−MV × modified duration × Δy)
 * versus full DCF repricing. `scale` converts per-100 values to money (nominal / 100).
 */
export function shockCompare(flows, y, dy, scale = 1) {
  const p0 = pv(flows, y);
  const md = modifiedDuration(flows, y);
  const approx = -p0 * md * dy * scale;
  const dcf = (pv(flows, y + dy) - p0) * scale;
  return { p0: p0 * scale, md, approx, dcf, gap: dcf - approx };
}

/** Yield solver (bisection) for a dirty value — used for "what yield does this price imply". */
export function yieldFromPrice(flows, price, lo = -0.5, hi = 2) {
  let a = lo;
  let b = hi;
  for (let i = 0; i < 200; i += 1) {
    const m = (a + b) / 2;
    if (pv(flows, m) > price) a = m; else b = m;
  }
  return (a + b) / 2;
}

/**
 * Value decomposition at `elapsed` years between the original yield and a new
 * benchmark / spread / bid–ask. Returns dirty values and the three effects:
 *   rates     = P(y0 + Δbenchmark) − P(y0)
 *   spread    = P(y0 + Δbenchmark + Δspread) − P(y0 + Δbenchmark)
 *   liquidity = P(mid + bid–ask) − P(mid)  (executable bid at the full quoted width)
 */
export function decompose(bond, elapsed, { y0, dBench = 0, dSpread = 0, bidAsk = 0 }) {
  const flows = cashflows(bond, elapsed);
  const base = pv(flows, y0);
  const afterRates = pv(flows, y0 + dBench);
  const mid = pv(flows, y0 + dBench + dSpread);
  const bid = pv(flows, y0 + dBench + dSpread + bidAsk);
  return {
    flows,
    base,
    afterRates,
    mid,
    bid,
    rates: afterRates - base,
    spread: mid - afterRates,
    liquidity: bid - mid,
    economic: mid - base,
    realised: bid - base,
    yMid: y0 + dBench + dSpread,
    yBid: y0 + dBench + dSpread + bidAsk,
  };
}

/**
 * Holding-period result from purchase to `elapsed` years (per 100 nominal).
 *   coupons received + accrued + clean price change = gross total return
 *   funded return = gross − funding cost (simple interest on the purchase price).
 */
export function holdingPeriod(bond, elapsed, { purchasePrice = 100, y, fundingRate = 0 }) {
  const couponsPaid = Math.floor(elapsed + EPS);
  const couponIncome = Math.min(couponsPaid, bond.tenor) * bond.coupon * (bond.face ?? 100) / 100;
  const dirty = dirtyPrice(bond, elapsed, y);
  const acc = accrued(bond, elapsed);
  const clean = dirty - acc;
  const priceChange = clean - purchasePrice;
  const gross = couponIncome + acc + priceChange;
  const funding = purchasePrice * fundingRate * elapsed;
  return { couponIncome, accrued: acc, dirty, clean, priceChange, gross, funding, funded: gross - funding };
}

/** Price path (clean or dirty) over months 0..tenor×12 at a constant yield. */
export function pricePath(bond, y, { dirty = false, stepMonths = 1 } = {}) {
  const pts = [];
  for (let m = 0; m <= bond.tenor * 12; m += stepMonths) {
    const e = m / 12;
    if (e >= bond.tenor - EPS) {
      pts.push({ m, v: dirty ? 0 : (bond.face ?? 100) });
      continue;
    }
    pts.push({ m, v: dirty ? dirtyPrice(bond, e, y) : cleanPrice(bond, e, y) });
  }
  return pts;
}

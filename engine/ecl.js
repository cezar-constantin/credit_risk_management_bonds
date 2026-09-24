// Expected credit loss and recognition under three accounting lenses — teaching simplification.
// ECL = PD × LGD × EAD (single period, no term structure); lifetime ECL optionally discounted
// one year at the effective interest rate (EIR) to illustrate the effect of discounting.
// PD, LGD are decimals (0.06 = 6 %); EAD in money (per 100 nominal or RMB m).

/** Single-scenario ECL: PD × LGD × EAD. */
export function ecl(pd, lgd, ead) {
  return pd * lgd * ead;
}

/** Lifetime ECL, optionally discounted `years` at the EIR. */
export function lifetimeEcl(pdLife, lgd, ead, { discount = false, eir = 0, years = 1 } = {}) {
  const raw = ecl(pdLife, lgd, ead);
  return discount ? raw / Math.pow(1 + eir, years) : raw;
}

/**
 * Probability-weighted ECL across up to three scenarios.
 * scenarios: [{ weight, pd12, pdLife, lgd }] — weights are normalised to sum to 1.
 */
export function weightedEcl(scenarios, ead, { discount = false, eir = 0, years = 1 } = {}) {
  const active = scenarios.filter((s) => s && s.weight > 0);
  const wsum = active.reduce((s, x) => s + x.weight, 0) || 1;
  let e12 = 0;
  let eLife = 0;
  for (const s of active) {
    const w = s.weight / wsum;
    e12 += w * ecl(s.pd12, s.lgd, ead);
    eLife += w * lifetimeEcl(s.pdLife, s.lgd, ead, { discount, eir, years });
  }
  return { ecl12: e12, eclLifetime: eLife, weights: active.map((s) => s.weight / wsum) };
}

/** Allowance under the chosen stage (1 → 12-month ECL; 2 or 3 → lifetime ECL). */
export function allowanceForStage(stage, ecl12, eclLife) {
  return Number(stage) === 1 ? ecl12 : eclLife;
}

/**
 * Recognition of the same position under AC / FVOCI / FVTPL.
 *   grossAmortisedCost — gross carrying amount at the EIR (dirty, incl. accrued)
 *   fairValue          — mid dirty value
 *   allowancePrev      — allowance carried before this date (e.g. 12-month ECL at purchase)
 *   allowanceNew       — allowance required now
 * Interest income at the EIR is excluded from the comparison (teaching simplification).
 */
export function recognition({ grossAmortisedCost, fairValue, allowancePrev, allowanceNew }) {
  const charge = allowanceNew - allowancePrev;
  const ac = {
    carrying: grossAmortisedCost - allowanceNew,
    pnlPeriod: -charge,
    pnlCumulative: -allowanceNew,
    ociCumulative: 0,
    equityCumulative: -allowanceNew,
  };
  const ociCum = fairValue - grossAmortisedCost + allowanceNew;
  const fvoci = {
    carrying: fairValue,
    pnlPeriod: -charge,
    pnlCumulative: -allowanceNew,
    ociCumulative: ociCum,
    allowanceInOci: allowanceNew,
    equityCumulative: fairValue - grossAmortisedCost,
  };
  const fvtpl = {
    carrying: fairValue,
    pnlPeriod: fairValue - grossAmortisedCost,
    pnlCumulative: fairValue - grossAmortisedCost,
    ociCumulative: 0,
    equityCumulative: fairValue - grossAmortisedCost,
  };
  return { charge, ac, fvoci, fvtpl };
}

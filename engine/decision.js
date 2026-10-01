// Decision economics, spread anatomy, sizing and capital helpers — teaching simplifications.

/** Expected holding value across two counterfactuals, net of capital and liquidity costs. */
export function holdValue({ pA, valueA, valueB, capitalCost = 0, liquidityCost = 0 }) {
  return pA * valueA + (1 - pA) * valueB - capitalCost - liquidityCost;
}

/**
 * Break-even probability of counterfactual A at which holding equals selling now.
 * p* = (sale + costs − B) / (A − B), clipped to [0, 1] for display (raw value also returned).
 */
export function breakEvenProbability({ saleProceeds, valueA, valueB, capitalCost = 0, liquidityCost = 0 }) {
  const raw = (saleProceeds + capitalCost + liquidityCost - valueB) / (valueA - valueB);
  return { raw, clipped: Math.min(1, Math.max(0, raw)) };
}

/**
 * Distressed-extension branch: `delayedShare` of principal (per 100) is paid `delayYears`
 * later, carrying `coupon` annually; values measured at the original payment date.
 *   pvCost           = delayed principal − PV(delayed cash flows) at the market rate
 *   modificationLoss = delayed principal − PV(delayed cash flows) at the original EIR
 * With coupon = EIR the modification loss is nil although the economic cost is not.
 */
export function extensionBranch({ face = 100, paidShare = 0.4, delayYears = 1, coupon, marketRate, eir }) {
  const delayed = face * (1 - paidShare);
  const flows = [];
  for (let k = 1; k <= delayYears; k += 1) {
    flows.push({ t: k, amount: delayed * coupon + (k === delayYears ? delayed : 0) });
  }
  const pvAt = (r) => flows.reduce((s, f) => s + f.amount / Math.pow(1 + r, f.t), 0);
  return {
    delayed,
    flows,
    pvMarket: pvAt(marketRate),
    pvEir: pvAt(eir),
    pvCost: delayed - pvAt(marketRate),
    modificationLoss: delayed - pvAt(eir),
  };
}

/** Simplified break-even annual default probability: spread ÷ LGD (not a PD estimate). */
export function breakEvenPD(spread, lgd) {
  return spread / lgd;
}

/**
 * Spread anatomy: expected loss (physical PD × LGD) + liquidity premium + credit-risk premium (residual).
 * Risk-neutral PD ≈ (spread − liquidity premium) / LGD.
 */
export function spreadAnatomy({ spread, pdPhysical, lgd, liquidityPremium }) {
  const expectedLoss = pdPhysical * lgd;
  const creditRiskPremium = spread - expectedLoss - liquidityPremium;
  return {
    expectedLoss,
    liquidityPremium,
    creditRiskPremium,
    riskNeutralPD: (spread - liquidityPremium) / lgd,
    breakEvenPD: breakEvenPD(spread, lgd),
  };
}

/**
 * Sizing: loss from one position defaulting vs one year of spread income on the rest of the portfolio.
 * All inputs as decimals of the portfolio (weight 0.01 = 1 %).
 */
export function sizing({ weight, lgd, restSpread }) {
  const loss = weight * lgd;
  const restIncome = (1 - weight) * restSpread;
  return { loss, restIncome, yearsToRecover: restIncome > 0 ? loss / restIncome : Infinity };
}

/**
 * Expected return after costs at purchase (Decision 1), in bp a year: carry = yield − funding;
 * minus expected loss (PD × LGD), capital cost (RW × capital ratio × cost of capital) and a liquidity reserve.
 */
export function expectedReturnAfterCosts({ yieldPct, fundingPct, pd, lgd, rw, capitalRatio, costOfCapital, liquidityBp }) {
  const carry = (yieldPct - fundingPct) * 100;
  const el = pd * lgd * 1e4;
  const capital = rw * capitalRatio * costOfCapital * 1e4;
  return { carry, el, capital, liquidity: liquidityBp, net: carry - el - capital - liquidityBp };
}

/** Group exposure by legal obligor: on-balance, with off-balance items, excluding non-bank and memo lines. */
export function groupExposure(rows, group) {
  const mine = rows.filter((r) => r.group === group && r.bank);
  const onBalance = mine.filter((r) => !r.offBalance).reduce((n, r) => n + r.amount, 0);
  const withOff = mine.reduce((n, r) => n + r.amount, 0);
  return { onBalance, withOff };
}

/**
 * Illustrative joint stress: spread shock on the bond (fair value), PD multiple on the loans (lifetime ECL)
 * and a wider bid–ask on the bond (extra exit cost). All amounts in the units of the inputs.
 */
export function jointStress({ bond, spreadDuration, spreadShockBp, loans, pdFrom, pdTo, lgd, extraWidthBp }) {
  const bondFV = bond * spreadDuration * spreadShockBp / 1e4;
  const loanEcl = (pdTo - pdFrom) * lgd * loans;
  const exit = bond * spreadDuration * extraWidthBp / 1e4;
  const total = bondFV + loanEcl + exit;
  return { bondFV, loanEcl, exit, total, loanShare: loanEcl / total };
}

/**
 * Date n working days (Mon–Fri) before an ISO date. Public holidays are not modelled — a teaching
 * simplification; the issue documents and the NAFMII calendar govern in practice.
 */
export function workingDaysBefore(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left -= 1;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * NAFMII holders' meeting rules (revised 7 Dec 2023, effective 1 Apr 2024): notice at least 10 working
 * days before the meeting (Art. 16), agenda at least 7 (Art. 17); a special resolution (Art. 5 matters,
 * e.g. changing principal, interest, timing or credit enhancement) needs ≥ 2/3 of the votes present AND
 * > 50% of the issue's total votes (Art. 30).
 */
export function holdersMeeting({ meetingDate, totalVotes, presentVotes, votesFor }) {
  const shareOfPresent = presentVotes > 0 ? votesFor / presentVotes : 0;
  const shareOfTotal = totalVotes > 0 ? votesFor / totalVotes : 0;
  const presentOk = shareOfPresent >= 2 / 3 - 1e-12;
  const totalOk = shareOfTotal > 0.5;
  return {
    noticeBy: meetingDate ? workingDaysBefore(meetingDate, 10) : null,
    agendaBy: meetingDate ? workingDaysBefore(meetingDate, 7) : null,
    shareOfPresent, shareOfTotal, presentOk, totalOk, passes: presentOk && totalOk,
  };
}

// --- Capital -------------------------------------------------------------------------------------

function normCdf(x) {
  // Abramowitz–Stegun 7.1.26 via erf
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + sign * y);
}

function normInv(p) {
  // Acklam's rational approximation
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Basel IRB corporate risk weight (no SME adjustment, no scaling factor) — illustrative.
 * RW = K × 12.5, K = LGD × [N((G(PD) + √R·G(0.999)) / √(1−R)) − PD] × maturity adjustment.
 */
export function irbCorporateRW({ pd, lgd, maturity = 2.5 }) {
  const p = Math.max(pd, 0.0005);
  const w = (1 - Math.exp(-50 * p)) / (1 - Math.exp(-50));
  const R = 0.12 * w + 0.24 * (1 - w);
  const b = Math.pow(0.11852 - 0.05478 * Math.log(p), 2);
  const K = lgd * (normCdf((normInv(p) + Math.sqrt(R) * normInv(0.999)) / Math.sqrt(1 - R)) - p)
    * (1 + (maturity - 2.5) * b) / (1 - 1.5 * b);
  return { R, b, K, rw: K * 12.5 };
}

/** Capital requirement = exposure × RW × capital ratio. */
export function capitalCharge({ exposure, rw, ratio }) {
  return { rwa: exposure * rw, capital: exposure * rw * ratio };
}

// --- Illustrative escalation rule -----------------------------------------------------------------

/**
 * Evaluates the illustrative escalation rule on a list of dated observations.
 * rule: { spreadLevel (bp), spreadWidening (bp vs purchase), priceFloor, cashCover, minHits }
 * obs:  [{ id, spread, price, cashCover, event }]  (event: true for a qualitative red flag)
 * Returns per-date hits and the first date at which the rule triggers.
 */
export function evaluateEscalation(rule, obs, purchaseSpread) {
  const rows = obs.map((o) => {
    const hits = {
      spreadLevel: o.spread != null && o.spread >= rule.spreadLevel,
      spreadWidening: o.spread != null && o.spread - purchaseSpread >= rule.spreadWidening,
      price: o.price != null && o.price < rule.priceFloor,
      cashCover: o.cashCover != null && o.cashCover < rule.cashCover,
      event: Boolean(o.event),
    };
    const count = Object.values(hits).filter(Boolean).length;
    return { id: o.id, hits, count, triggered: count >= rule.minHits };
  });
  const first = rows.find((r) => r.triggered);
  return { rows, firstTrigger: first ? first.id : null };
}

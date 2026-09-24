// China five-category risk classification vs IFRS 9 / CAS 22 stages — teaching simplification of the
// 2023 Measures for the Risk Classification of Financial Assets of Commercial Banks. Not a regulatory tool.

export const CATEGORIES = ['normal', 'specialMention', 'substandard', 'doubtful', 'loss'];

const rank = (c) => CATEGORIES.indexOf(c);
const atLeast = (cur, floor) => (rank(floor) > rank(cur) ? floor : cur);

/**
 * Five-category classification. Inputs:
 *   dpd            days past due (principal, interest or return)
 *   creditImpaired credit-impaired flag (IFRS 9 Stage 3 evidence)
 *   eclRatio       ECL / gross carrying amount (decimal)
 *   restructured   restructured because of the debtor's financial difficulty
 *   npShare        share of the debtor's exposures at this bank already non-performing (decimal);
 *                  more than 10 % makes all of them non-performing (2023 Measures, Art. 7)
 *   adverse        other factors that may adversely affect repayment (watchlist, SICR evidence)
 * Returns the category and the rules that fired (keys for i18n).
 */
export function fiveCategory({ dpd = 0, creditImpaired = false, eclRatio = 0, restructured = false, npShare = 0, adverse = false }) {
  let cat = 'normal';
  const fired = [];
  const apply = (cond, floor, rule) => {
    if (cond) {
      cat = atLeast(cat, floor);
      fired.push(rule);
    }
  };
  apply(dpd > 0, 'specialMention', 'dpdAny');
  apply(adverse, 'specialMention', 'adverse');
  apply(restructured, 'specialMention', 'restructured');
  apply(dpd > 90, 'substandard', 'dpd90');
  apply(creditImpaired, 'substandard', 'impaired');
  apply(npShare > 0.1, 'substandard', 'debtor10'); // Measures Art. 7: more than 10 % non-performing
  apply(dpd > 270, 'doubtful', 'dpd270');
  apply(creditImpaired && eclRatio >= 0.5, 'doubtful', 'ecl50');
  apply(dpd > 360, 'loss', 'dpd360');
  apply(eclRatio >= 0.9, 'loss', 'ecl90');
  return { category: cat, nonPerforming: rank(cat) >= rank('substandard'), fired };
}

/**
 * IFRS 9 stage from evidence. `sicr` is the analyst's significant-increase judgement;
 * the 30-days-past-due presumption and 90-days default presumption are rebuttable.
 */
export function ifrsStage({ dpd = 0, creditImpaired = false, sicr = false }) {
  if (creditImpaired || dpd > 90) return { stage: 3, reason: creditImpaired ? 'impaired' : 'dpd90' };
  if (sicr || dpd > 30) return { stage: 2, reason: sicr ? 'sicr' : 'dpd30' };
  return { stage: 1, reason: 'none' };
}

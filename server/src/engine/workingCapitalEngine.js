/**
 * Bank Working Capital & Cash Credit (CC) Eligibility Engine
 * Implements RBI-recognized dual assessment:
 * 1. Nayak Committee Turnover Method (Mandated benchmark for MSME WC limits up to ₹5 Cr)
 * 2. MPBF Method (Working Capital Gap based on Stock, Debtors, Creditors & 25% margin)
 */

export const NAYAK_RBI_CAP_RUPEES = 50000000; // ₹5 Crore RBI statutory cap for turnover method

const toSafePositiveNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
};

/**
 * Calculates working capital requirements and bank CC limit eligibility.
 * 
 * @param {Object} params
 * @param {number} params.projectedTurnover - Projected annual turnover / revenue in Rupees
 * @param {number} [params.stock=0] - Projected closing inventory/stock
 * @param {number} [params.debtors=0] - Projected trade debtors / receivables
 * @param {number} [params.creditors=0] - Projected trade creditors / current liabilities
 * @param {number} [params.ccAppliedFor=0] - Amount of CC limit requested by borrower (if 0, no CC interest charged)
 * @param {number} [params.ccInterestRatePct=12.0] - Cash credit interest rate p.a.
 * @returns {Object} { nayak, mpbf, ccAppliedFor, annualCcInterest, recommendedLimit }
 */
export function calculateWorkingCapitalEligibility({
  projectedTurnover,
  stock = 0,
  debtors = 0,
  creditors = 0,
  ccAppliedFor = 0,
  ccInterestRatePct = 12.0
}) {
  const turnover = toSafePositiveNumber(projectedTurnover, 0);
  const curStock = toSafePositiveNumber(stock, 0);
  const curDebtors = toSafePositiveNumber(debtors, 0);
  const curCreditors = toSafePositiveNumber(creditors, 0);
  const requestedCc = toSafePositiveNumber(ccAppliedFor, 0);
  const ccRate = toSafePositiveNumber(ccInterestRatePct, 12.0);

  // ----------------------------------------------------
  // 1. Nayak Committee (Turnover Method)
  // Total Requirement = 25% of turnover
  // Margin (Borrower) = 5% of turnover
  // Bank Limit (Min)  = 20% of turnover (capped at ₹5 Cr statutory MSME ceiling)
  // ----------------------------------------------------
  const nayakTotalWc = turnover * 0.25;
  const nayakMargin = turnover * 0.05;
  const uncappedNayakLimit = turnover * 0.20;
  const nayakEligibleLimit = Math.min(uncappedNayakLimit, NAYAK_RBI_CAP_RUPEES);
  const isNayakCapExceeded = uncappedNayakLimit > NAYAK_RBI_CAP_RUPEES;

  // ----------------------------------------------------
  // 2. MPBF Method (Working Capital Gap Method)
  // Gross WC = Stock + Debtors
  // Net WC Gap = Gross WC - Creditors
  // Margin = 25% of Net WC Gap
  // Eligible Limit = Net WC Gap - Margin
  // ----------------------------------------------------
  const grossWc = curStock + curDebtors;
  const netWcGap = grossWc - curCreditors;
  const mpbfMargin = Math.max(0, netWcGap * 0.25);
  const mpbfEligibleLimit = Math.max(0, netWcGap - mpbfMargin);

  // Recommended limit: Higher of Nayak or MPBF
  const recommendedLimit = Math.max(nayakEligibleLimit, mpbfEligibleLimit);

  // CC Interest Calculation:
  // If borrower requested/holds an active CC facility (> 0), interest is charged.
  // If zero CC active/requested (requestedCc === 0), ZERO CC interest is charged.
  const annualCcInterest = requestedCc > 0
    ? (requestedCc * (ccRate / 100))
    : 0;

  return {
    turnover: Math.round(turnover * 100) / 100,
    nayak: {
      totalWcRequirement: Math.round(nayakTotalWc * 100) / 100,
      marginRequired: Math.round(nayakMargin * 100) / 100,
      eligibleLimit: Math.round(nayakEligibleLimit * 100) / 100,
      uncappedLimit: Math.round(uncappedNayakLimit * 100) / 100,
      isCapApplied: isNayakCapExceeded
    },
    mpbf: {
      stock: Math.round(curStock * 100) / 100,
      debtors: Math.round(curDebtors * 100) / 100,
      grossWc: Math.round(grossWc * 100) / 100,
      creditors: Math.round(curCreditors * 100) / 100,
      netWcGap: Math.round(netWcGap * 100) / 100,
      marginRequired: Math.round(mpbfMargin * 100) / 100,
      eligibleLimit: Math.round(mpbfEligibleLimit * 100) / 100
    },
    recommendedLimit: Math.round(recommendedLimit * 100) / 100,
    ccAppliedFor: Math.round(requestedCc * 100) / 100,
    ccInterestRatePct: ccRate,
    annualCcInterest: Math.round(annualCcInterest * 100) / 100
  };
}

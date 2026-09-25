/**
 * Debt Service Coverage Ratio (DSCR) & Solvency Ratios Engine
 * Implements statutory Indian banking credit appraisal benchmarks:
 * - DSCR (Annual & Average tenure DSCR; institutional benchmark >= 1.50)
 * - Interest Coverage Ratio (ICR)
 * - Current Ratio (Liquidity)
 * - TOL / TNW (Total Outside Liabilities to Tangible Net Worth)
 * - CGTMSE Guarantee Eligibility (up to ₹10 Crore ceiling effective April 1, 2025)
 */

const toSafePositiveNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
};

/**
 * Calculates multi-year credit ratios and bank viability indicators.
 * 
 * @param {Object} params
 * @param {Array} params.pnlProjections - Projected P&L statements
 * @param {Array} params.balanceSheets - Projected Balance Sheets
 * @param {Array} params.emiAnnualSchedule - Term loan amortization schedule
 * @param {number} [params.loanAmount=0] - Total term loan amount requested
 * @returns {Object} { annualRatios: Array, summary: Object, cgtmseEligibility: Object }
 */
export function calculateSolvencyRatios({
  pnlProjections = [],
  balanceSheets = [],
  emiAnnualSchedule = [],
  loanAmount = 0
}) {
  const principal = toSafePositiveNumber(loanAmount, 0);
  const annualRatios = [];
  let dscrSum = 0;
  let dscrCount = 0;

  pnlProjections.forEach((pnl, idx) => {
    const y = pnl.year;
    const emiYear = emiAnnualSchedule.find(e => e.year === y) ?? {
      interestPaid: 0,
      principalRepaid: 0,
      totalInstallment: 0
    };
    const bsYear = balanceSheets.find(b => b.year === y) ?? {
      sourcesOfFunds: {},
      applicationOfFunds: {}
    };

    // 1. Debt Service Coverage Ratio (DSCR)
    // Numerator: PAT + Depreciation + Term Loan Interest
    const cashAccrualForDebt = (Number(pnl.pat) || 0) + (Number(pnl.depreciation) || 0) + (Number(emiYear.interestPaid) || 0);
    // Denominator: Principal Repayment + Term Loan Interest (Total Term Debt Obligation)
    const annualDebtObligation = (Number(emiYear.principalRepaid) || 0) + (Number(emiYear.interestPaid) || 0);

    let dscr = null;
    let isDebtFree = false;

    if (annualDebtObligation > 0) {
      dscr = Math.round((cashAccrualForDebt / annualDebtObligation) * 100) / 100;
      dscrSum += dscr;
      dscrCount++;
    } else {
      isDebtFree = true;
    }

    // 2. Interest Coverage Ratio (ICR) = EBITDA / Total Interest
    const totalInterest = Number(pnl.financeCosts?.total) || 0;
    let icr = null;
    if (totalInterest > 0) {
      icr = Math.round(((Number(pnl.ebitda) || 0) / totalInterest) * 100) / 100;
    }

    // 3. Current Ratio = Current Assets / Current Liabilities
    const ca = Number(bsYear.applicationOfFunds?.totalCurrentAssets) || 0;
    const cl = Number(bsYear.sourcesOfFunds?.totalCurrentLiabilities) || 0;
    let currentRatio = null;
    if (cl > 0) {
      currentRatio = Math.round((ca / cl) * 100) / 100;
    }

    // 4. Total Outside Liabilities to Tangible Net Worth (TOL / TNW)
    const netWorth = Number(bsYear.sourcesOfFunds?.totalNetWorth) || 0;
    const totalOutsideLiabilities = (Number(bsYear.sourcesOfFunds?.totalSecuredLoans) || 0) +
      (Number(bsYear.sourcesOfFunds?.totalUnsecuredLoans) || 0) +
      (Number(bsYear.sourcesOfFunds?.totalCurrentLiabilities) || 0);

    let tolTnw = null;
    let isInsolvent = false;

    if (netWorth > 0) {
      tolTnw = Math.round((totalOutsideLiabilities / netWorth) * 100) / 100;
    } else {
      isInsolvent = true; // Negative or zero net worth signals technical insolvency
    }

    // Risk classification for annual DSCR
    let dscrRating = 'GREEN';
    if (dscr !== null) {
      if (dscr >= 1.50) dscrRating = 'GREEN';
      else if (dscr >= 1.20) dscrRating = 'AMBER';
      else dscrRating = 'RED';
    }

    annualRatios.push({
      year: y,
      cashAccrualForDebt: Math.round(cashAccrualForDebt * 100) / 100,
      annualDebtObligation: Math.round(annualDebtObligation * 100) / 100,
      dscr,
      isDebtFree,
      dscrRating,
      icr,
      currentRatio,
      tolTnw,
      isInsolvent
    });
  });

  const averageDscr = dscrCount > 0
    ? Math.round((dscrSum / dscrCount) * 100) / 100
    : null;

  let overallRating = 'GREEN';
  let ratingMessage = 'Debt Free / Zero Term Debt Obligation.';

  if (averageDscr !== null) {
    if (averageDscr >= 1.50) {
      overallRating = 'GREEN';
      ratingMessage = 'Bankable: Average DSCR satisfies institutional benchmark of >= 1.50.';
    } else if (averageDscr >= 1.20) {
      overallRating = 'AMBER';
      ratingMessage = 'Marginal: Average DSCR is between 1.20 and 1.50. Additional collateral or promoter equity may be requested.';
    } else {
      overallRating = 'RED';
      ratingMessage = 'High Risk: Average DSCR is below 1.20. Project may face debt servicing stress.';
    }
  }

  // CGTMSE (Credit Guarantee Fund Trust for Micro and Small Enterprises) Eligibility
  // Enhanced ceiling: ₹10 Crore effective April 1, 2025
  const isCgtmseEligible = principal <= 100000000 && principal > 0;
  const cgtmseEligibility = {
    isEligible: isCgtmseEligible,
    maxGuaranteeCeilingRupees: 100000000, // ₹10 Crore
    coverageStandardPct: principal > 5000000 ? 75 : 85, // 75% for > ₹50L standard loans
    coverageSpecialPct: 90, // Women-led, SC/ST, PwD, ZED certified
    annualGuaranteeFeeMinPct: 0.37,
    notes: isCgtmseEligible
      ? `Eligible for collateral-free credit guarantee under revised CGTMSE ceiling (up to ₹10 Crore).`
      : `Loan amount exceeds ₹10 Crore CGTMSE ceiling; standard bank tangible collateral required.`
  };

  return {
    annualRatios,
    summary: {
      averageDscr,
      overallRating,
      ratingMessage,
      minAcceptableDscr: 1.50
    },
    cgtmseEligibility
  };
}

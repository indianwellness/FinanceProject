/**
 * Multi-Year Projected Profit & Loss (P&L) Engine
 * Models forward-looking revenue, cost of goods, operating expenses, depreciation,
 * finance charges (term loan EMI + CC interest), and statutory tax across N years.
 */

import { calculateTax } from './taxEngine.js';

export const DEFAULT_REVENUE_GROWTH_PCT = 10.0;
export const DEFAULT_OPEX_GROWTH_PCT = 8.0;

const toSafePositiveNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
};

/**
 * Projects multi-year Profit & Loss statements.
 * 
 * @param {Object} params
 * @param {Object} params.baseline - Most recent audited/provisional year figures
 * @param {Object} [params.growthAssumptions={}] - Growth rates { revenueGrowthPct: 10, gpMarginPct: null, opexGrowthPct: 8 }
 * @param {Array} params.emiAnnualSchedule - Annual term loan interest schedule from emiEngine
 * @param {Array} params.depreciationSchedule - Annual depreciation schedule from depreciationEngine
 * @param {Array|number} [params.ccAnnualInterest=0] - Annual CC interest (or array per year)
 * @param {string} [params.entityType='proprietorship'] - Entity type for tax calculation
 * @param {boolean} [params.isSection115BAA=false] - Corporate tax regime election
 * @param {number} [params.horizonYears=5] - Number of projection years
 * @returns {Array} Multi-year projected P&L statements
 */
export function projectPnlStatements({
  baseline = {},
  growthAssumptions = {},
  emiAnnualSchedule = [],
  depreciationSchedule = [],
  ccAnnualInterest = 0,
  entityType = 'proprietorship',
  isSection115BAA = false,
  horizonYears = 5
}) {
  const baseTurnover = toSafePositiveNumber(baseline.netTurnover ?? baseline.grossTurnover ?? baseline.turnover, 0);
  const baseCogs = toSafePositiveNumber(baseline.cogs, baseTurnover - toSafePositiveNumber(baseline.grossProfit, 0));
  const baseGrossProfit = baseTurnover > 0 ? (baseTurnover - baseCogs) : 0;
  const baseGpMargin = baseTurnover > 0 ? (baseGrossProfit / baseTurnover) : 0.30;

  // Growth rates with nullish coalescing to preserve legitimate 0% growth
  const revGrowth = toSafePositiveNumber(growthAssumptions.revenueGrowthPct ?? DEFAULT_REVENUE_GROWTH_PCT, DEFAULT_REVENUE_GROWTH_PCT) / 100;
  const opexGrowth = toSafePositiveNumber(growthAssumptions.opexGrowthPct ?? DEFAULT_OPEX_GROWTH_PCT, DEFAULT_OPEX_GROWTH_PCT) / 100;
  const targetGpMargin = growthAssumptions.gpMarginPct != null
    ? toSafePositiveNumber(growthAssumptions.gpMarginPct, baseGpMargin * 100) / 100
    : baseGpMargin;

  // Baseline opex handling: support both primitive numbers and objects (Gap 5 fix)
  let currentOpexTotal = 0;
  if (typeof baseline.opex === 'number' && Number.isFinite(baseline.opex)) {
    currentOpexTotal = Math.max(0, baseline.opex);
  } else if (typeof baseline.opex === 'object' && baseline.opex !== null) {
    currentOpexTotal = toSafePositiveNumber(
      baseline.opex.total ?? baseline.opex.operatingExpenses,
      baseTurnover * 0.12
    );
  } else {
    currentOpexTotal = baseTurnover * 0.12;
  }

  let prevTurnover = baseTurnover;
  const projections = [];

  for (let y = 1; y <= horizonYears; y++) {
    // 1. Projected Turnover
    const turnover = Math.round(prevTurnover * (1 + revGrowth) * 100) / 100;

    // 2. Projected COGS & Gross Profit
    const grossProfit = Math.round(turnover * targetGpMargin * 100) / 100;
    const cogs = Math.round((turnover - grossProfit) * 100) / 100;

    // 3. Projected Operating Expenses (adjusted for inflation)
    currentOpexTotal = Math.round(currentOpexTotal * (1 + opexGrowth) * 100) / 100;

    // 4. Operating Profit (EBITDA)
    const ebitda = Math.round((grossProfit - currentOpexTotal) * 100) / 100;

    // 5. Depreciation (from depreciation schedule)
    const depYear = depreciationSchedule.find(d => d.year === y);
    const depreciation = depYear ? toSafePositiveNumber(depYear.totalDepreciation, 0) : 0;

    // 6. Finance Costs
    const emiYear = emiAnnualSchedule.find(e => e.year === y);
    const interestTermLoan = emiYear ? toSafePositiveNumber(emiYear.interestPaid, 0) : 0;
    const interestCc = Array.isArray(ccAnnualInterest)
      ? toSafePositiveNumber(ccAnnualInterest[y - 1] ?? ccAnnualInterest[0], 0)
      : toSafePositiveNumber(ccAnnualInterest, 0);
    const totalFinanceCosts = Math.round((interestTermLoan + interestCc) * 100) / 100;

    // 7. Earnings Before Tax (EBT)
    const otherIncome = toSafePositiveNumber(baseline.otherIncome, 0);
    const ebt = Math.round((ebitda - depreciation - totalFinanceCosts + otherIncome) * 100) / 100;

    // 8. Tax & PAT (using Tax Engine with verified Indian slabs/rates and 115BAA forwarding)
    const taxResult = calculateTax({
      taxableIncome: ebt,
      entityType,
      isSection115BAA
    });

    projections.push({
      year: y,
      turnover,
      cogs,
      grossProfit,
      gpMarginPct: Math.round(targetGpMargin * 1000) / 10,
      opex: {
        total: currentOpexTotal
      },
      ebitda,
      ebitdaMarginPct: turnover > 0 ? Math.round((ebitda / turnover) * 1000) / 10 : 0,
      depreciation,
      financeCosts: {
        interestTermLoan,
        interestCc,
        total: totalFinanceCosts
      },
      otherIncome,
      ebt,
      taxProvision: taxResult.taxProvision,
      effectiveTaxRatePct: taxResult.effectiveRatePct,
      pat: taxResult.pat,
      patMarginPct: turnover > 0 ? Math.round((taxResult.pat / turnover) * 1000) / 10 : 0
    });

    prevTurnover = turnover;
  }

  return projections;
}

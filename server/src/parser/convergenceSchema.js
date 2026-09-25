/**
 * DPR Convergence Point Schema & Guardrails
 * 
 * This is the single contract between ANY input parser (Excel, Tally XML, Manual Form, OCR)
 * and the Phase 1 Math Engine.
 * 
 * Rules:
 * - Engine NEVER knows or cares where the data originated.
 * - All monetary values MUST be normalized to absolute Indian Rupees.
 * - PAT is NEVER populated by the parser; it is computed by the engine based on entity tax rules.
 */

export const ENTITY_TYPES = ['proprietorship', 'partnership', 'llp', 'pvt_ltd'];

export const ASSUMPTION_GUARDRAILS = {
  revenueGrowthPct: { min: 0, max: 35, warningThreshold: 20 },
  gpMarginPct: { min: 3, max: 85, warningThreshold: 60 },
  opexGrowthPct: { min: 0, max: 25, warningThreshold: 15 },
  interestRate: { min: 6.0, max: 24.0, warningThreshold: 16.0 },
  tenureMonths: { min: 6, max: 180, warningThreshold: 120 }
};

/**
 * Validates and normalizes raw parsed input into the convergence contract.
 * Returns { isValid, normalizedData, errors, warnings, confidenceScore }
 * 
 * @param {Object} rawData - Data extracted from source parser
 * @returns {Object} Validation & normalization result
 */
export function validateAndNormalizeConvergenceData(rawData = {}) {
  const errors = [];
  const warnings = [];
  let confidenceScore = 1.0;

  // 1. Metadata
  const entityName = String(rawData.entityName ?? rawData.borrowerName ?? 'UNNAMED MSME BORROWER').trim();
  let entityType = String(rawData.entityType ?? 'proprietorship').toLowerCase().trim();

  // Normalize entity type aliases
  if (['individual', 'sole_proprietorship', 'proprietor', 'sole proprietorship'].includes(entityType)) {
    entityType = 'proprietorship';
  } else if (['firm', 'partnership_firm', 'partnership firm'].includes(entityType)) {
    entityType = 'partnership';
  } else if (['llp', 'limited liability partnership'].includes(entityType)) {
    entityType = 'llp';
  } else if (['company', 'private_limited', 'pvt ltd', 'pvt. ltd.', 'pvt ltd.', 'private limited'].includes(entityType)) {
    entityType = 'pvt_ltd';
  }

  if (!ENTITY_TYPES.includes(entityType)) {
    warnings.push(`Unrecognized entity type "${entityType}". Defaulting to "proprietorship".`);
    entityType = 'proprietorship';
    confidenceScore -= 0.05;
  }

  // 2. Base Financials (P&L)
  const netTurnover = Number(rawData.netTurnover ?? rawData.grossTurnover ?? 0);
  if (!Number.isFinite(netTurnover) || netTurnover <= 0) {
    errors.push('Turnover must be greater than zero.');
    confidenceScore = 0.0;
  }

  let grossProfit = Number(rawData.grossProfit ?? 0);
  let cogs = Number(rawData.cogs ?? 0);

  if (grossProfit <= 0 && cogs > 0 && netTurnover > cogs) {
    grossProfit = netTurnover - cogs;
  } else if (grossProfit <= 0 && cogs <= 0 && netTurnover > 0) {
    // If neither GP nor COGS was parsed, fallback to 25% GP margin
    grossProfit = netTurnover * 0.25;
    cogs = netTurnover * 0.75;
    warnings.push('Gross Profit and COGS not found; estimated at 25% GP margin.');
    confidenceScore -= 0.15;
  } else if (cogs <= 0 && netTurnover > grossProfit) {
    cogs = netTurnover - grossProfit;
  }

  // OpEx normalization (handles object or number with reliable fallback)
  let opex = 0;
  const rawOpexVal = typeof rawData.opex === 'number'
    ? rawData.opex
    : (typeof rawData.opex === 'object' && rawData.opex !== null
        ? Number(rawData.opex.total ?? rawData.opex.operatingExpenses ?? 0)
        : 0);

  if (rawOpexVal > 0) {
    opex = rawOpexVal;
  } else {
    opex = netTurnover > 0 ? netTurnover * 0.12 : 0;
    warnings.push('Baseline OpEx not explicitly found; estimated at 12% of turnover.');
    confidenceScore -= 0.10;
  }

  // 3. Balance Sheet Items
  const capital = Number(rawData.capital ?? rawData.shareCapital ?? 1000000);
  const reservesSurplus = Number(rawData.reservesSurplus ?? 0);
  const tradeDebtors = Number(rawData.tradeDebtors ?? 0);
  const inventories = Number(rawData.inventories ?? rawData.stock ?? 0);
  const tradeCreditors = Number(rawData.tradeCreditors ?? 0);
  const cashBank = Number(rawData.cashBank ?? rawData.cashAndBank ?? 0);
  const fixedAssets = rawData.fixedAssets ?? {};

  // 4. Loan & Facility Parameters
  const loanAmount = Number(rawData.loanAmount ?? 0);
  if (loanAmount <= 0) {
    warnings.push('No Term Loan amount specified (loanAmount is 0).');
  }

  const interestRate = Number(rawData.interestRate ?? 12.0);
  if (interestRate < ASSUMPTION_GUARDRAILS.interestRate.min || interestRate > ASSUMPTION_GUARDRAILS.interestRate.max) {
    warnings.push(`Interest rate (${interestRate}%) is outside typical lending bounds (${ASSUMPTION_GUARDRAILS.interestRate.min}% - ${ASSUMPTION_GUARDRAILS.interestRate.max}%).`);
  } else if (interestRate > ASSUMPTION_GUARDRAILS.interestRate.warningThreshold) {
    warnings.push(`Interest rate (${interestRate}%) is high — above typical benchmark (${ASSUMPTION_GUARDRAILS.interestRate.warningThreshold}%).`);
  }

  const tenureMonths = Math.max(ASSUMPTION_GUARDRAILS.tenureMonths.min, Number(rawData.tenureMonths ?? 60));
  if (tenureMonths > ASSUMPTION_GUARDRAILS.tenureMonths.warningThreshold) {
    warnings.push(`Tenure of ${tenureMonths} months exceeds standard MSME norm (120 months).`);
  }

  const moratoriumMonths = Math.max(0, Number(rawData.moratoriumMonths ?? 0));
  const ccAppliedFor = Number(rawData.ccAppliedFor ?? 0);
  const ccOdOutstanding = Number(rawData.ccOdOutstanding ?? 0);
  const ccInterestRatePct = Number(rawData.ccInterestRatePct ?? interestRate);

  // 5. Growth Assumptions & Guardrails
  const revenueGrowthPct = Number(rawData.revenueGrowthPct ?? 10.0);
  if (revenueGrowthPct < ASSUMPTION_GUARDRAILS.revenueGrowthPct.min || revenueGrowthPct > ASSUMPTION_GUARDRAILS.revenueGrowthPct.max) {
    warnings.push(`Revenue growth rate (${revenueGrowthPct}%) is outside standard range (0-35%).`);
  }
  if (revenueGrowthPct > ASSUMPTION_GUARDRAILS.revenueGrowthPct.warningThreshold) {
    warnings.push(`High revenue growth (${revenueGrowthPct}% p.a.) — institutional bank scrutiny likely.`);
  }

  const opexGrowthPct = Number(rawData.opexGrowthPct ?? 8.0);
  if (opexGrowthPct < ASSUMPTION_GUARDRAILS.opexGrowthPct.min || opexGrowthPct > ASSUMPTION_GUARDRAILS.opexGrowthPct.max) {
    warnings.push(`OpEx growth rate (${opexGrowthPct}%) is outside expected range (0-25%).`);
  }
  if (opexGrowthPct > ASSUMPTION_GUARDRAILS.opexGrowthPct.warningThreshold) {
    warnings.push(`High OpEx growth (${opexGrowthPct}%) — may depress projected margins.`);
  }

  const gpMarginPct = rawData.gpMarginPct != null
    ? Number(rawData.gpMarginPct)
    : (netTurnover > 0 ? (grossProfit / netTurnover) * 100 : 30.0);

  if (gpMarginPct < ASSUMPTION_GUARDRAILS.gpMarginPct.min || gpMarginPct > ASSUMPTION_GUARDRAILS.gpMarginPct.max) {
    warnings.push(`Gross profit margin (${gpMarginPct.toFixed(1)}%) is unusual for commercial enterprises.`);
  } else if (gpMarginPct > ASSUMPTION_GUARDRAILS.gpMarginPct.warningThreshold) {
    warnings.push(`Very high gross profit margin (${gpMarginPct.toFixed(1)}%) — bank scrutiny likely.`);
  }

  // 6. Working Capital Cycle Days
  // Avoid 0-days collapse when tradeDebtors or inventories are 0 or unparsed:
  const debtorDays = (tradeDebtors > 0 && netTurnover > 0)
    ? Math.max(15, Math.min(180, Math.round((tradeDebtors / netTurnover) * 365)))
    : Number(rawData.debtorDays ?? 45);

  const inventoryDays = (inventories > 0 && cogs > 0)
    ? Math.max(10, Math.min(180, Math.round((inventories / cogs) * 365)))
    : Number(rawData.inventoryDays ?? 30);

  const creditorDays = (tradeCreditors > 0 && cogs > 0)
    ? Math.max(10, Math.min(180, Math.round((tradeCreditors / cogs) * 365)))
    : Number(rawData.creditorDays ?? 30);

  confidenceScore = Math.max(0.0, Math.min(1.0, Math.round(confidenceScore * 100) / 100));

  const normalizedData = {
    // Identity
    entityName,
    entityType,
    horizonYears: Math.min(10, Math.max(1, Number(rawData.horizonYears ?? 5))),
    amountsUnit: rawData.amountsUnit ?? 'absolute',

    // P&L Baseline
    netTurnover,
    grossTurnover: Number(rawData.grossTurnover ?? netTurnover),
    cogs,
    grossProfit,
    opex: {
      total: opex
    },
    otherIncome: Number(rawData.otherIncome ?? 0),

    // Balance Sheet Baseline
    capital,
    reservesSurplus,
    unsecuredLoansQuasiEquity: Number(rawData.unsecuredLoansQuasiEquity ?? 0),
    unsecuredLoansExternal: Number(rawData.unsecuredLoansExternal ?? 0),
    ccOdOutstanding,
    tradeCreditors,
    otherCurrentLiabilities: Number(rawData.otherCurrentLiabilities ?? 0),
    fixedAssets,
    newAssetAdditions: rawData.newAssetAdditions ?? {},
    newAssetAdditionsPerYear: rawData.newAssetAdditionsPerYear,
    tradeDebtors,
    inventories,
    cashBank,
    loansAdvancesCurrent: Number(rawData.loansAdvancesCurrent ?? 0),

    // DPR Facilities
    loanAmount,
    interestRate,
    tenureMonths,
    moratoriumMonths,
    ccAppliedFor,
    ccInterestRatePct,

    // Projections & Cycle
    revenueGrowthPct,
    gpMarginPct,
    opexGrowthPct,
    debtorDays,
    inventoryDays,
    creditorDays,
    promoterDrawingsPct: Number(rawData.promoterDrawingsPct ?? 0.15),
    isAdditionsUnder180Days: rawData.isAdditionsUnder180Days ?? false,
    isSection115BAA: Boolean(rawData.isSection115BAA),

    // Metadata
    parserConfidence: confidenceScore,
    flags: [...warnings, ...errors]
  };

  return {
    isValid: errors.length === 0,
    normalizedData,
    errors,
    warnings,
    confidenceScore
  };
}

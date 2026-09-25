/**
 * Master DPR (Detailed Project Report) & CMA Projection Engine
 * Coordinates all modular financial engines into a unified multi-year bank model:
 * 1. Term Loan Amortization (EMI)
 * 2. WDV Depreciation (IT Act Block Rates)
 * 3. Working Capital & Bank Cash Credit (CC) Eligibility (Nayak & MPBF)
 * 4. Multi-Year Projected Profit & Loss (P&L) with entity tax branching
 * 5. Projected Balance Sheets (strictly reconciled with WC and double-entry balanced)
 * 6. Solvency & Debt Service Coverage Ratios (DSCR + CGTMSE eligibility)
 */

import { calculateEmiSchedule } from './emiEngine.js';
import { calculateDepreciationSchedule } from './depreciationEngine.js';
import { calculateWorkingCapitalEligibility } from './workingCapitalEngine.js';
import { projectPnlStatements, DEFAULT_REVENUE_GROWTH_PCT, DEFAULT_OPEX_GROWTH_PCT } from './pnlProjectionEngine.js';
import { projectBalanceSheets } from './balanceSheetEngine.js';
import { calculateSolvencyRatios } from './dscrEngine.js';

const toSafePositiveNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
};

/**
 * Generates full multi-year DPR projections from a normalized input object.
 * 
 * @param {Object} input - Normalized convergence point data object
 * @returns {Object} Complete bank-ready DPR model
 */
export function generateDprProjections(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('generateDprProjections requires a valid normalized input object');
  }

  const horizonYears = Math.min(10, Math.max(1, Math.round(toSafePositiveNumber(input.horizonYears, 5))));
  const entityType = String(input.entityType ?? 'proprietorship').toLowerCase().trim();
  const isSection115BAA = Boolean(input.isSection115BAA);

  // ----------------------------------------------------
  // Step 1: Term Loan EMI & Amortization
  // ----------------------------------------------------
  const loanAmount = toSafePositiveNumber(input.loanAmount, 0);
  const interestRate = toSafePositiveNumber(input.interestRate, 12.0);
  const tenureMonths = toSafePositiveNumber(input.tenureMonths, horizonYears * 12);
  const moratoriumMonths = toSafePositiveNumber(input.moratoriumMonths, 0);

  const emiSchedule = calculateEmiSchedule({
    loanAmount,
    annualRatePct: interestRate,
    tenureMonths,
    moratoriumMonths
  });

  // ----------------------------------------------------
  // Step 2: Fixed Asset Depreciation (WDV Block Rates)
  // ----------------------------------------------------
  const initialNewAdditions = input.newAssetAdditionsPerYear?.[1] ?? input.newAssetAdditions ?? {};
  // Compute total initial project capex across asset blocks
  const projectCapex = Object.values(initialNewAdditions).reduce((sum, val) => sum + toSafePositiveNumber(val, 0), 0);

  const depreciationSchedule = calculateDepreciationSchedule({
    initialAssets: input.fixedAssets ?? input.baselineAssets ?? {},
    additionsPerYear: input.newAssetAdditionsPerYear ?? {
      1: initialNewAdditions
    },
    horizonYears,
    isAdditionsUnder180Days: input.isAdditionsUnder180Days ?? false,
    customRates: input.customDepreciationRates ?? {}
  });

  // ----------------------------------------------------
  // Step 3: Working Capital & CC Limit Schedule
  // ----------------------------------------------------
  const baseTurnover = toSafePositiveNumber(input.netTurnover ?? input.grossTurnover, 0);
  const revGrowth = toSafePositiveNumber(input.revenueGrowthPct ?? DEFAULT_REVENUE_GROWTH_PCT, DEFAULT_REVENUE_GROWTH_PCT) / 100;
  const ccRate = toSafePositiveNumber(input.ccInterestRatePct, 12.0);

  // Bug 2 Fix: If borrower has existing CC debt and doesn't specify a new applied limit,
  // interest is charged on the active existing facility.
  const existingCc = toSafePositiveNumber(input.ccOdOutstanding, 0);
  const ccAppliedFor = toSafePositiveNumber(input.ccAppliedFor, 0);
  const activeCcFacility = ccAppliedFor > 0 ? ccAppliedFor : existingCc;

  // Working capital days parameters
  const debtorDays = toSafePositiveNumber(input.debtorDays, 45);
  const inventoryDays = toSafePositiveNumber(input.inventoryDays, 30);
  const creditorDays = toSafePositiveNumber(input.creditorDays, 30);
  const targetGpMargin = input.gpMarginPct != null
    ? toSafePositiveNumber(input.gpMarginPct, 30) / 100
    : (baseTurnover > 0 ? (toSafePositiveNumber(input.grossProfit, baseTurnover * 0.3) / baseTurnover) : 0.30);

  const baseStock = toSafePositiveNumber(input.inventories, 0);
  const baseDebtors = toSafePositiveNumber(input.tradeDebtors, 0);
  const baseCreditors = toSafePositiveNumber(input.tradeCreditors, 0);

  const workingCapitalSchedule = [];
  const ccAnnualInterestList = [];
  let currentTurnover = baseTurnover;

  for (let y = 1; y <= horizonYears; y++) {
    // Synchronize rounded turnover with P&L to avoid floating-point drift
    currentTurnover = Math.round(currentTurnover * (1 + revGrowth) * 100) / 100;
    const projectedCogs = Math.round(currentTurnover * (1 - targetGpMargin) * 100) / 100;

    // Gap 4 Fix (Greenfield support):
    // If baseline stock/debtors/creditors are provided, compound them by revenue growth;
    // If baseline is 0 (new startup / greenfield), derive them from the days parameters and projected turnover/COGS!
    const stock = baseStock > 0
      ? Math.round(baseStock * Math.pow(1 + revGrowth, y) * 100) / 100
      : Math.round((projectedCogs / 365) * inventoryDays * 100) / 100;

    const debtors = baseDebtors > 0
      ? Math.round(baseDebtors * Math.pow(1 + revGrowth, y) * 100) / 100
      : Math.round((currentTurnover / 365) * debtorDays * 100) / 100;

    const creditors = baseCreditors > 0
      ? Math.round(baseCreditors * Math.pow(1 + revGrowth, y) * 100) / 100
      : Math.round((projectedCogs / 365) * creditorDays * 100) / 100;

    const wcResult = calculateWorkingCapitalEligibility({
      projectedTurnover: currentTurnover,
      stock,
      debtors,
      creditors,
      ccAppliedFor: activeCcFacility,
      ccInterestRatePct: ccRate
    });

    workingCapitalSchedule.push({
      year: y,
      ...wcResult
    });
    ccAnnualInterestList.push(wcResult.annualCcInterest);
  }

  // ----------------------------------------------------
  // Step 4: Multi-Year Projected P&L Statements
  // ----------------------------------------------------
  const pnlProjections = projectPnlStatements({
    baseline: {
      netTurnover: baseTurnover,
      grossTurnover: toSafePositiveNumber(input.grossTurnover, baseTurnover),
      cogs: input.cogs,
      grossProfit: input.grossProfit,
      opex: input.opex,
      otherIncome: input.otherIncome
    },
    growthAssumptions: {
      revenueGrowthPct: input.revenueGrowthPct ?? DEFAULT_REVENUE_GROWTH_PCT,
      gpMarginPct: input.gpMarginPct,
      opexGrowthPct: input.opexGrowthPct ?? DEFAULT_OPEX_GROWTH_PCT
    },
    emiAnnualSchedule: emiSchedule.annual,
    depreciationSchedule,
    ccAnnualInterest: ccAnnualInterestList,
    entityType,
    isSection115BAA,
    horizonYears
  });

  // ----------------------------------------------------
  // Step 5: Multi-Year Projected Balance Sheets
  // ----------------------------------------------------
  const balanceSheets = projectBalanceSheets({
    baseline: {
      capital: input.capital,
      shareCapital: input.shareCapital,
      reservesSurplus: input.reservesSurplus,
      unsecuredLoansQuasiEquity: input.unsecuredLoansQuasiEquity,
      unsecuredLoansExternal: input.unsecuredLoansExternal,
      ccOdOutstanding: activeCcFacility,
      otherCurrentLiabilities: input.otherCurrentLiabilities,
      loansAdvancesCurrent: input.loansAdvancesCurrent
    },
    pnlProjections,
    emiAnnualSchedule: emiSchedule.annual,
    depreciationSchedule,
    workingCapitalSchedule, // Reconciled 1:1 with Working Capital schedule
    ccOutstanding: activeCcFacility,
    projectCapex,
    loanAmount,
    workingCapitalParams: {
      debtorDays,
      inventoryDays,
      creditorDays
    },
    promoterDrawingsPct: toSafePositiveNumber(input.promoterDrawingsPct, 0.15)
  });

  // ----------------------------------------------------
  // Step 6: Solvency Ratios & DSCR Assessment
  // ----------------------------------------------------
  const solvencyAnalysis = calculateSolvencyRatios({
    pnlProjections,
    balanceSheets,
    emiAnnualSchedule: emiSchedule.annual,
    loanAmount
  });

  return {
    metadata: {
      entityName: input.entityName ?? 'PROSPECTIVE MSME BORROWER',
      entityType,
      horizonYears,
      generatedAt: new Date().toISOString(),
      amountsUnit: input.amountsUnit ?? 'absolute'
    },
    termLoan: {
      loanAmount,
      interestRate,
      tenureMonths,
      moratoriumMonths,
      emiSchedule: emiSchedule.summary,
      annualAmortization: emiSchedule.annual,
      monthlySchedule: emiSchedule.monthly
    },
    depreciation: {
      annualSchedule: depreciationSchedule
    },
    workingCapital: {
      annualSchedule: workingCapitalSchedule
    },
    projectedPnl: pnlProjections,
    projectedBalanceSheet: balanceSheets,
    solvencyRatios: solvencyAnalysis
  };
}

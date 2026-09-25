/**
 * Multi-Year Projected Balance Sheet Engine
 * Enforces rigorous double-entry accounting integrity:
 * Total Sources of Funds (Liabilities) === Total Application of Funds (Assets)
 * Reconciled 1:1 with the Working Capital schedule, handles project capex promoter equity,
 * and eliminates negative drawings during loss years.
 */

const toSafePositiveNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
};

/**
 * Projects multi-year Balance Sheets ensuring zero discrepancy.
 * 
 * @param {Object} params
 * @param {Object} params.baseline - Baseline Balance Sheet figures
 * @param {Array} params.pnlProjections - Multi-year P&L projections from pnlProjectionEngine
 * @param {Array} params.emiAnnualSchedule - Term loan closing principal balances per year
 * @param {Array} params.depreciationSchedule - Net fixed asset closing WDV values per year
 * @param {Array} [params.workingCapitalSchedule] - Synchronized working capital figures (stock, debtors, creditors)
 * @param {number} [params.ccOutstanding=0] - Active Bank Cash Credit limit / utilization
 * @param {number} [params.projectCapex=0] - Total initial capex (e.g. machinery purchase)
 * @param {number} [params.loanAmount=0] - Term loan disbursed for project capex
 * @param {Object} [params.workingCapitalParams={}] - Fallback working capital days
 * @param {number} [params.promoterDrawingsPct=0.15] - % of annual PAT drawn by owner/partners
 * @returns {Array} Multi-year projected Balance Sheets with integrity checksums
 */
export function projectBalanceSheets({
  baseline,
  pnlProjections = [],
  emiAnnualSchedule = [],
  depreciationSchedule = [],
  workingCapitalSchedule = [],
  ccOutstanding = 0,
  projectCapex = 0,
  loanAmount = 0,
  workingCapitalParams = {},
  promoterDrawingsPct = 0.15
}) {
  let runningCapital = toSafePositiveNumber(baseline?.capital ?? baseline?.shareCapital, 1000000);
  let runningReserves = Number.isFinite(Number(baseline?.reservesSurplus)) ? Number(baseline.reservesSurplus) : 0;
  const unsecuredLoansQuasi = toSafePositiveNumber(baseline?.unsecuredLoansQuasiEquity, 0);
  const unsecuredLoansExternal = toSafePositiveNumber(baseline?.unsecuredLoansExternal, 0);
  const activeCc = toSafePositiveNumber(ccOutstanding ?? baseline?.ccOdOutstanding, 0);

  // Capex Promoter Equity Contribution:
  // If new project capex exceeds term loan disbursed, promoter contributes the margin into Capital in Year 1
  const capexAmount = toSafePositiveNumber(projectCapex, 0);
  const loanDisbursed = toSafePositiveNumber(loanAmount, 0);
  const promoterCapexMargin = Math.max(0, capexAmount - loanDisbursed);

  // Fallback Working capital cycle parameters (in days) if schedule not provided
  const debtorDays = toSafePositiveNumber(workingCapitalParams.debtorDays, 45);
  const inventoryDays = toSafePositiveNumber(workingCapitalParams.inventoryDays, 30);
  const creditorDays = toSafePositiveNumber(workingCapitalParams.creditorDays, 30);

  const sheets = [];

  pnlProjections.forEach((pnl, idx) => {
    const y = pnl.year;

    // 1. Capital & Reserves Accumulation
    // In Year 1, credit promoter's equity margin for capex into Capital Account
    if (y === 1 && promoterCapexMargin > 0) {
      runningCapital += promoterCapexMargin;
    }

    const annualPat = Number.isFinite(Number(pnl.pat)) ? Number(pnl.pat) : 0;

    // Bug 3 Fix: Drawings only occur when there are positive profits.
    // If the business is in a net loss, drawings = 0, and the full loss reduces reserves.
    const drawings = annualPat > 0
      ? Math.round(annualPat * promoterDrawingsPct * 100) / 100
      : 0;

    const retainedPat = annualPat > 0
      ? Math.round((annualPat - drawings) * 100) / 100
      : annualPat;

    runningReserves += retainedPat;
    const totalNetWorth = Math.round((runningCapital + runningReserves) * 100) / 100;
    // Adjusted Tangible Net Worth (ATNW) includes subordinated promoter Quasi-Equity (RBI/CMA benchmark)
    const adjustedTangibleNetWorth = Math.round((totalNetWorth + unsecuredLoansQuasi) * 100) / 100;

    // 2. Secured Borrowings
    const emiYear = emiAnnualSchedule.find(e => e.year === y);
    const termLoanClosing = emiYear ? toSafePositiveNumber(emiYear.closingPrincipal, 0) : 0;
    const totalSecuredLoans = Math.round((termLoanClosing + activeCc) * 100) / 100;

    // 3. Unsecured Borrowings
    const totalUnsecuredLoans = Math.round((unsecuredLoansQuasi + unsecuredLoansExternal) * 100) / 100;

    // 4. Working Capital Reconciliation:
    const wcYear = workingCapitalSchedule.find(w => w.year === y);
    let projectedCreditors = 0;
    let projectedDebtors = 0;
    let projectedStock = 0;

    if (wcYear?.mpbf) {
      projectedStock = toSafePositiveNumber(wcYear.mpbf.stock, 0);
      projectedDebtors = toSafePositiveNumber(wcYear.mpbf.debtors, 0);
      projectedCreditors = toSafePositiveNumber(wcYear.mpbf.creditors, 0);
    } else {
      projectedCreditors = Math.round((pnl.cogs / 365) * creditorDays * 100) / 100;
      projectedDebtors = Math.round((pnl.turnover / 365) * debtorDays * 100) / 100;
      projectedStock = Math.round((pnl.cogs / 365) * inventoryDays * 100) / 100;
    }

    const otherCurrentLiabilities = toSafePositiveNumber(baseline?.otherCurrentLiabilities, 0);
    const totalCurrentLiabilities = Math.round((projectedCreditors + otherCurrentLiabilities) * 100) / 100;

    // 5. Fixed Assets (Application)
    const depYear = depreciationSchedule.find(d => d.year === y);
    const netFixedAssets = depYear ? toSafePositiveNumber(depYear.totalClosingWdv, 0) : 0;
    const grossFixedAssets = depYear ? toSafePositiveNumber(depYear.totalGrossBlock, netFixedAssets) : netFixedAssets;

    const loansAndAdvances = toSafePositiveNumber(baseline?.loansAdvancesCurrent, 0);

    // 6. Dynamic Cash & Bank Balancing Plug Figure:
    const baseSources = totalNetWorth + totalSecuredLoans + totalUnsecuredLoans + totalCurrentLiabilities;
    const nonCashAssets = netFixedAssets + projectedDebtors + projectedStock + loansAndAdvances;
    const rawCash = baseSources - nonCashAssets;

    let cashAndBank = 0;
    let bridgeDeficitFunding = 0;
    let isCashDeficit = false;

    if (rawCash >= 0) {
      cashAndBank = Math.round(rawCash * 100) / 100;
    } else {
      isCashDeficit = true;
      cashAndBank = 0;
      bridgeDeficitFunding = Math.round(Math.abs(rawCash) * 100) / 100;
    }

    // --- TOTAL SOURCES OF FUNDS (LIABILITIES) ---
    const totalSources = Math.round((baseSources + bridgeDeficitFunding) * 100) / 100;

    // --- TOTAL APPLICATION OF FUNDS (ASSETS) ---
    const totalCurrentAssets = Math.round(
      (projectedStock + projectedDebtors + loansAndAdvances + cashAndBank) * 100
    ) / 100;
    const totalApplication = Math.round((netFixedAssets + totalCurrentAssets) * 100) / 100;

    // Double-entry checksum verification
    const discrepancy = Math.round(Math.abs(totalSources - totalApplication) * 100) / 100;
    const isBalanced = discrepancy <= 0.05;

    sheets.push({
      year: y,
      sourcesOfFunds: {
        proprietorCapital: runningCapital,
        reservesAndSurplus: runningReserves,
        totalNetWorth,
        adjustedTangibleNetWorth,
        termLoanClosing,
        bankCcOutstanding: activeCc,
        totalSecuredLoans,
        unsecuredLoansQuasi,
        unsecuredLoansExternal,
        totalUnsecuredLoans,
        tradeCreditors: projectedCreditors,
        otherCurrentLiabilities,
        bridgeDeficitFunding,
        totalCurrentLiabilities: Math.round((totalCurrentLiabilities + bridgeDeficitFunding) * 100) / 100,
        totalSources
      },
      applicationOfFunds: {
        grossFixedAssets,
        netFixedAssets,
        inventories: projectedStock,
        tradeDebtors: projectedDebtors,
        loansAndAdvances,
        cashAndBank,
        totalCurrentAssets,
        totalApplication
      },
      integrityCheck: {
        isBalanced,
        discrepancy,
        isCashDeficit,
        deficitAmount: bridgeDeficitFunding
      }
    });
  });

  return sheets;
}

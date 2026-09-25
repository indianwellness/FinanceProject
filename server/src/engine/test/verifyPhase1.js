/**
 * Phase 1 Math Engine Verification Suite (Post-Audit 2 Complete Remediation)
 * Exhaustively tests all 13 initial remediations PLUS the 3 high-severity bugs
 * and 5 boundary fuzzing edge cases identified in the follow-up audit.
 */

import { calculateEmiSchedule } from '../emiEngine.js';
import { calculateDepreciationSchedule } from '../depreciationEngine.js';
import { calculateTax } from '../taxEngine.js';
import { calculateWorkingCapitalEligibility } from '../workingCapitalEngine.js';
import { projectPnlStatements } from '../pnlProjectionEngine.js';
import { projectBalanceSheets } from '../balanceSheetEngine.js';
import { calculateSolvencyRatios } from '../dscrEngine.js';
import { generateDprProjections } from '../dprEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? '-- ' + details : ''}`);
    failed++;
  }
}

console.log('====================================================');
console.log('   PHASE 1 COMPLETE MATH ENGINE VERIFICATION         ');
console.log('====================================================\n');

// ---------------------------------------------------------
// TEST 1: EMI ENGINE & ZERO-RATE / SUBSIDY HANDLING
// ---------------------------------------------------------
console.log('TEST SUITE 1: Term Loan EMI & Amortization Engine');
const emiResult = calculateEmiSchedule({
  loanAmount: 3500000,
  annualRatePct: 12.0,
  tenureMonths: 60,
  moratoriumMonths: 6
});

assert(emiResult.monthly.length === 60, 'Monthly schedule contains 60 installments');
assert(emiResult.annual.length === 5, 'Annual schedule contains 5 fiscal years');

const moratMonths = emiResult.monthly.slice(0, 6);
const moratPrincipalRepaid = moratMonths.reduce((sum, m) => sum + m.principalRepaid, 0);
assert(moratPrincipalRepaid === 0, 'Months 1-6 moratorium has zero principal repayment');

const finalMonth = emiResult.monthly[59];
assert(finalMonth.closingPrincipal === 0, 'Closing principal at month 60 is exactly 0', `Got ${finalMonth.closingPrincipal}`);

const totalPrincipalRepaid = emiResult.annual.reduce((sum, a) => sum + a.principalRepaid, 0);
assert(Math.abs(totalPrincipalRepaid - 3500000) < 0.05, 'Total annual principal repaid equals ₹35,00,000 exactly', `Got ${totalPrincipalRepaid}`);

// Test 1.B: Zero-Rate Loan
const zeroRateLoan = calculateEmiSchedule({
  loanAmount: 600000,
  annualRatePct: 0,
  tenureMonths: 12
});
assert(zeroRateLoan.monthly.length === 12, 'Zero-rate loan generates full 12 months schedule');
assert(zeroRateLoan.summary.totalInterest === 0, 'Zero-rate loan total interest is 0');
assert(zeroRateLoan.monthly[0].installment === 50000, 'Zero-rate monthly installment is equal principal (₹50,000)');
console.log('');

// ---------------------------------------------------------
// TEST 2: DEPRECIATION ENGINE (CUSTOM ASSET BLOCKS & 180 DAYS)
// ---------------------------------------------------------
console.log('TEST SUITE 2: Fixed Asset Depreciation Engine (IT Act Section 32)');
const depSchedule = calculateDepreciationSchedule({
  initialAssets: {
    furniture: { net: 100000, gross: 150000 },
    computers: 100000,
    machinery: 200000
  },
  additionsPerYear: {
    1: { machinery: 100000, solar_plant: 2500000 }, // solar_plant is a custom block not in initialAssets
    2: { machinery: 100000 }
  },
  horizonYears: 2,
  isAdditionsUnder180Days: true
});

assert(depSchedule.length === 2, 'Depreciation schedule computes 2 years');
assert(depSchedule[0].blocks.furniture.grossBlock === 150000, 'Gross block preserved from initial assets (₹1,50,000)');

// Re-Audit Bug 1 Verification: Custom block (solar_plant) must NOT be dropped!
assert(depSchedule[0].blocks.solar_plant !== undefined, 'Custom asset block (solar_plant) in additions is captured');
assert(depSchedule[0].blocks.solar_plant.additions === 2500000, 'solar_plant additions recorded as ₹25,00,000');
assert(depSchedule[0].blocks.solar_plant.closingWdv > 0, 'solar_plant closing WDV is positive and calculated');

// 180-day rule check
assert(depSchedule[0].blocks.machinery.depreciation === 37500, 'Year 1 additions under 180-days get half rate (7.5%)');
assert(depSchedule[1].blocks.machinery.depreciation === 54375, 'Year 2 additions receive full rate (not penalized by Y1 flag)');
console.log('');

// ---------------------------------------------------------
// TEST 3: INDIAN TAX ENGINE (BUDGET 2025 REBATE & ALIASES)
// ---------------------------------------------------------
console.log('TEST SUITE 3: Indian Income Tax Engine (Entity-Type Branching)');
// 3.1 Proprietorship with Budget 2025 rebate <= 12L
const taxProp10L = calculateTax({ taxableIncome: 1000000, entityType: 'proprietorship' });
assert(taxProp10L.taxProvision === 0, 'Proprietorship EBT ₹10,00,000 has ZERO tax under Budget 2025 Section 87A rebate');

// Re-Audit Gap 6 Verification: Entity alias 'sole_proprietorship' / 'individual'
const taxAlias = calculateTax({ taxableIncome: 1000000, entityType: 'sole_proprietorship' });
assert(taxAlias.taxProvision === 0, "Alias 'sole_proprietorship' recognized as individual and receives Section 87A rebate");

// 3.2 Marginal relief: EBT ₹12,10,000
const taxPropMarginal = calculateTax({ taxableIncome: 1210000, entityType: 'proprietorship' });
assert(taxPropMarginal.baseTax === 10000, 'Marginal relief caps basic tax at excess income over ₹12 Lakhs (₹10,000)');

// 3.3 Partnership Firm (Flat 30% + 4% cess = 31.2%)
const taxPartnership = calculateTax({ taxableIncome: 1000000, entityType: 'partnership' });
assert(taxPartnership.taxProvision === 312000, 'Partnership EBT ₹10,00,000 flat tax is ₹3,12,000 (31.2%)');

// 3.4 Private Limited Company (Flat 25% + 4% cess = 26%)
const taxPvtLtd = calculateTax({ taxableIncome: 1000000, entityType: 'pvt_ltd' });
assert(taxPvtLtd.taxProvision === 260000, 'Pvt Ltd EBT ₹10,00,000 corporate tax is ₹2,60,000 (26.0%)');

// 3.5 Section 115BAA corporate election
const tax115BAA = calculateTax({ taxableIncome: 1000000, entityType: 'pvt_ltd', isSection115BAA: true });
assert(tax115BAA.taxProvision === 251680, 'Section 115BAA corporate tax is ₹2,51,680 (25.168%)');
console.log('');

// ---------------------------------------------------------
// TEST 4: WORKING CAPITAL & CC ELIGIBILITY
// ---------------------------------------------------------
console.log('TEST SUITE 4: Working Capital & CC Eligibility Engine');
const wcZeroCc = calculateWorkingCapitalEligibility({
  projectedTurnover: 10000000,
  ccAppliedFor: 0
});
assert(wcZeroCc.annualCcInterest === 0, 'No CC requested (ccAppliedFor = 0) charges ZERO interest');

const wcLargeTurnover = calculateWorkingCapitalEligibility({
  projectedTurnover: 300000000,
  ccAppliedFor: 50000000
});
assert(wcLargeTurnover.nayak.eligibleLimit === 50000000, 'Nayak CC limit capped at ₹5 Crore statutory MSME ceiling');
assert(wcLargeTurnover.nayak.isCapApplied === true, 'Nayak ceiling cap flag set to true');
console.log('');

// ---------------------------------------------------------
// TEST 5: P&L PROJECTION ENGINE & PRIMITIVE OPEX HANDLING
// ---------------------------------------------------------
console.log('TEST SUITE 5: P&L Projection Engine');
// Re-Audit Gap 5 Verification: Primitive numeric opex
const pnlPrimitiveOpex = projectPnlStatements({
  baseline: { netTurnover: 1000000, grossProfit: 300000, opex: 50000 },
  growthAssumptions: { revenueGrowthPct: 10, opexGrowthPct: 5 },
  horizonYears: 1
});
// Year 1 opex = 50,000 * 1.05 = 52,500 (NOT defaulted to 12% = 120,000)
assert(pnlPrimitiveOpex[0].opex.total === 52500, 'Primitive numeric baseline.opex = 50000 respected (Year 1 opex = ₹52,500)');
console.log('');

// ---------------------------------------------------------
// TEST 6: BALANCE SHEET DRAWINGS DURING LOSS YEARS
// ---------------------------------------------------------
console.log('TEST SUITE 6: Balance Sheet Net Worth & Loss Handling');
// Re-Audit Bug 3 Verification: Negative PAT produces 0 drawings and full loss hit
const lossBalanceSheet = projectBalanceSheets({
  baseline: { capital: 1000000, reservesSurplus: 100000 },
  pnlProjections: [{ year: 1, pat: -200000, cogs: 500000, turnover: 600000 }],
  emiAnnualSchedule: [{ year: 1, closingPrincipal: 0 }],
  depreciationSchedule: [{ year: 1, totalClosingWdv: 200000, totalGrossBlock: 200000 }],
  promoterDrawingsPct: 0.15
});

// Reserves should be exactly 100k + (-200k) = -100k (NO negative drawings reducing the loss to -170k!)
assert(lossBalanceSheet[0].sourcesOfFunds.reservesAndSurplus === -100000, 'During net loss, drawings are 0 and full loss of -₹2,00,000 is reflected in reserves (-100,000)');
console.log('');

// ---------------------------------------------------------
// TEST 7: MASTER DPR ENGINE WITH EXISTING CC FACILITY & GREENFIELD
// ---------------------------------------------------------
console.log('TEST SUITE 7: Master DPR Engine (Existing CC & Greenfield Testing)');

// Re-Audit Bug 2 Verification: Existing CC facility interest charged even when ccAppliedFor is 0
const existingCcDpr = generateDprProjections({
  entityName: 'EXISTING CC BORROWER',
  netTurnover: 10000000,
  grossProfit: 3000000,
  cogs: 7000000,
  ccOdOutstanding: 2000000, // Existing ₹20L facility
  ccAppliedFor: 0,          // No new limit applied
  ccInterestRatePct: 12.0,
  loanAmount: 1000000,
  horizonYears: 1
});
assert(existingCcDpr.projectedPnl[0].financeCosts.interestCc === 240000, 'Active existing CC facility (₹20L) incurs 12% interest (₹2,40,000) when ccAppliedFor = 0');
assert(existingCcDpr.projectedBalanceSheet[0].sourcesOfFunds.bankCcOutstanding === 2000000, 'Balance Sheet carries the ₹20L active CC facility');

// Re-Audit Gap 4 Verification: Greenfield / Startup with 0 baseline inventories & debtors
const greenfieldDpr = generateDprProjections({
  entityName: 'STARTUP GREENFIELD ENTERPRISE',
  netTurnover: 12000000, // ₹1.2 Cr projected Year 1
  grossProfit: 3600000,
  cogs: 8400000,
  inventories: 0,        // Zero baseline stock
  tradeDebtors: 0,       // Zero baseline debtors
  tradeCreditors: 0,     // Zero baseline creditors
  inventoryDays: 30,
  debtorDays: 45,
  creditorDays: 30,
  revenueGrowthPct: 10,
  loanAmount: 2000000,
  horizonYears: 1
});
assert(greenfieldDpr.workingCapital.annualSchedule[0].mpbf.stock > 0, 'Greenfield project with 0 baseline generates working capital stock from inventoryDays (30 days)');
assert(greenfieldDpr.workingCapital.annualSchedule[0].mpbf.debtors > 0, 'Greenfield project generates debtors from debtorDays (45 days)');
assert(greenfieldDpr.projectedBalanceSheet[0].applicationOfFunds.inventories === greenfieldDpr.workingCapital.annualSchedule[0].mpbf.stock, 'Greenfield Balance Sheet matches Working Capital stock 1:1');

// Check 7.3: M/S PHARMACY EXPRESS Full Master Verification
const pharmacyNormalizedInput = {
  entityName: 'M/S PHARMACY EXPRESS',
  entityType: 'proprietorship',
  horizonYears: 5,
  amountsUnit: 'absolute',
  loanAmount: 3500000,
  interestRate: 12.0,
  tenureMonths: 60,
  moratoriumMonths: 6,
  ccAppliedFor: 2000000,
  ccInterestRatePct: 12.0,
  netTurnover: 57919067,
  grossProfit: 22009246,
  cogs: 35909821,
  opex: { total: 2413055 },
  capital: 1200000,
  reservesSurplus: 400000,
  ccOdOutstanding: 2000000,
  tradeCreditors: 74132,
  tradeDebtors: 9689299,
  inventories: 10893912,
  fixedAssets: { furniture: 150000, machinery: 425000, computers: 48000 },
  newAssetAdditions: { machinery: 4000000 },
  revenueGrowthPct: 10.0,
  opexGrowthPct: 8.0,
  promoterDrawingsPct: 0.15
};

const dpr = generateDprProjections(pharmacyNormalizedInput);

// Check double-entry balance for ALL 5 years
let allBalanced = true;
dpr.projectedBalanceSheet.forEach(bs => {
  if (!bs.integrityCheck.isBalanced) {
    allBalanced = false;
    console.error(`  Year ${bs.year} Unbalanced: Discrepancy = ₹${bs.integrityCheck.discrepancy}`);
  }
});
assert(allBalanced, 'Projected Balance Sheet balances to zero discrepancy (Assets == Liabilities) for ALL 5 years');

// Check turnover synchronization between P&L and Working Capital (no float drift)
let turnoverSynced = true;
dpr.projectedPnl.forEach((p, i) => {
  const wc = dpr.workingCapital.annualSchedule[i];
  if (p.turnover !== wc.turnover) {
    turnoverSynced = false;
    console.error(`  Year ${p.year} Drift: P&L=${p.turnover} vs WC=${wc.turnover}`);
  }
});
assert(turnoverSynced, 'Projected P&L and Working Capital turnover are synchronized to the exact paisa across all years');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================');

if (failed === 0) {
  console.log('\n>>> ALL RE-AUDIT ISSUES FIXED & VERIFIED WITH 100% PASS RATE <<<\n');
  process.exit(0);
} else {
  console.error('\n>>> VERIFICATION FAILED <<<\n');
  process.exit(1);
}

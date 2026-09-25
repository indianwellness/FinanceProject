/**
 * Run engine against Sir's pharmacy file data and print formatted DPR output
 */
import { generateDprProjections } from '../dprEngine.js';

const input = {
  entityName: 'M/S PHARMACY EXPRESS',
  entityType: 'proprietorship',
  horizonYears: 5,

  // Loan as per Sir's file
  loanAmount: 3500000,       // ₹35 Lakhs Term Loan
  interestRate: 12.0,
  tenureMonths: 60,
  moratoriumMonths: 6,

  // CC as per Sir's file
  ccAppliedFor: 2000000,     // ₹20 Lakhs CC
  ccInterestRatePct: 12.0,

  // Baseline financials from Sir's FINAL REPORT sheet
  netTurnover: 57919067,
  grossProfit: 22009246,
  cogs: 35909821,
  opex: { total: 2413055 },

  // Balance Sheet baseline from Sir's file
  capital: 1200000,
  reservesSurplus: 400000,
  ccOdOutstanding: 2000000,
  tradeCreditors: 74132,
  tradeDebtors: 9689299,
  inventories: 10893912,

  // Fixed Assets (from Sir's SCH 2 sheet)
  fixedAssets: {
    furniture: 150000,
    machinery: 425000,
    computers: 48000
  },

  // New project assets (₹40L machinery, ₹35L funded by loan + ₹5L promoter margin)
  newAssetAdditions: { machinery: 4000000 },

  revenueGrowthPct: 10.0,
  opexGrowthPct: 8.0,
  promoterDrawingsPct: 0.15
};

const L = (n) => '₹' + (n / 100000).toFixed(2) + ' L';
const pct = (n) => n.toFixed(2) + '%';

const dpr = generateDprProjections(input);

console.log('\n============================================================');
console.log('    DPR OUTPUT — M/S PHARMACY EXPRESS, THANE');
console.log('    (Benchmarked against Sir\'s submitted CA report)');
console.log('============================================================\n');

// --- MEANS OF FINANCE ---
const capex = 4000000 + 150000 + 425000 + 48000;
console.log('1. PROJECT COST & MEANS OF FINANCE');
console.log('   Total Project Cost   : ' + L(capex));
console.log('   Term Loan (Bank)     : ' + L(3500000));
console.log('   Promoter Margin      : ' + L(capex - 3500000));
console.log('   Bank CC (WC)         : ' + L(2000000));
console.log('');

// --- CC ELIGIBILITY ---
const wc1 = dpr.workingCapital.annualSchedule[0];
console.log('2. BANK CC ELIGIBILITY (Year 1)');
console.log('   Projected Turnover   : ' + L(wc1.turnover));
console.log('   Nayak Method (20%)   : ' + L(wc1.nayak.eligibleLimit));
console.log('   MPBF Method          : ' + L(wc1.mpbf.eligibleLimit));
console.log('   Recommended CC Limit : ' + L(wc1.recommendedLimit));
console.log('   CC Applied For       : ' + L(wc1.ccAppliedFor));
console.log('');

// --- PROJECTED P&L ---
console.log('3. PROJECTED P&L STATEMENT (₹ in Lakhs)');
console.log('   ' + ['Year', 'Turnover', 'GP%', 'EBITDA', 'Dep', 'Interest', 'PAT'].join('\t\t').substring(0,80));
dpr.projectedPnl.forEach(p => {
  console.log(`   Y${p.year}\t${L(p.turnover)}\t${pct(p.gpMarginPct)}\t${L(p.ebitda)}\t${L(p.depreciation)}\t${L(p.financeCosts.total)}\t${L(p.pat)}`);
});
console.log('');

// --- BALANCE SHEET ---
console.log('4. PROJECTED BALANCE SHEET (₹ in Lakhs)');
console.log('   Year | Net Worth | Term Loan | Net FA  | Debtors | Stock   | Cash    | Balanced?');
dpr.projectedBalanceSheet.forEach(bs => {
  const sf = bs.sourcesOfFunds;
  const af = bs.applicationOfFunds;
  console.log(`   Y${bs.year}   | ${L(sf.totalNetWorth)}\t| ${L(sf.termLoanClosing)}\t| ${L(af.netFixedAssets)}\t| ${L(af.tradeDebtors)}\t| ${L(af.inventories)}\t| ${L(af.cashAndBank)}\t| ${bs.integrityCheck.isBalanced ? 'YES ✓' : 'NO ✗'}`);
});
console.log('');

// --- EMI TABLE ---
console.log('5. TERM LOAN AMORTIZATION (Annual, ₹ in Lakhs)');
console.log('   Year | Opening   | Interest  | Principal | Installmt | Closing');
dpr.termLoan.annualAmortization.forEach(e => {
  console.log(`   Y${e.year}   | ${L(e.openingPrincipal)}\t| ${L(e.interestPaid)}\t| ${L(e.principalRepaid)}\t| ${L(e.totalInstallment)}\t| ${L(e.closingPrincipal)}`);
});
console.log('');

// --- DEPRECIATION ---
console.log('6. DEPRECIATION SCHEDULE — SECTION 32 WDV (₹ in Lakhs)');
dpr.depreciation.annualSchedule.forEach(d => {
  console.log(`   Year ${d.year}: Dep = ${L(d.totalDepreciation)}  |  Closing WDV = ${L(d.totalClosingWdv)}  |  Gross Block = ${L(d.totalGrossBlock)}`);
});
console.log('');

// --- DSCR & RATIOS ---
console.log('7. KEY RATIOS');
console.log('   Year | DSCR  | ICR    | Current Ratio | TOL/TNW | Rating');
dpr.solvencyRatios.annualRatios.forEach(r => {
  console.log(`   Y${r.year}   | ${r.dscr ?? 'N/A'}\t| ${r.icr ?? 'N/A'}\t| ${r.currentRatio ?? 'N/A'}\t\t| ${r.tolTnw ?? 'N/A'}\t| ${r.dscrRating}`);
});
console.log(`\n   Average DSCR  : ${dpr.solvencyRatios.summary.averageDscr}`);
console.log(`   Overall Rating: ${dpr.solvencyRatios.summary.overallRating}`);
console.log(`   CGTMSE        : ${dpr.solvencyRatios.cgtmseEligibility.isEligible ? 'ELIGIBLE (up to ₹10 Cr ceiling)' : 'NOT ELIGIBLE'}`);

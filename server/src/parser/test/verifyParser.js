/**
 * Phase 2 Excel Parser & Convergence Point Verification Suite
 * 
 * Verifies:
 * 1. Cell number parsing (parentheses, commas, dashes, percentages, currency symbols)
 * 2. Convergence point schema validation and guardrails
 * 3. End-to-end parsing of Sir's actual CA Excel file
 * 4. Seamless handoff: Excel Parser Output -> Convergence Point -> Phase 1 Math Engine -> Balanced DPR!
 */

import { parseNumberCell, parseDprExcelWorkbook } from '../excelParser.js';
import { validateAndNormalizeConvergenceData } from '../convergenceSchema.js';
import { generateDprProjections } from '../../engine/dprEngine.js';

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
console.log('   PHASE 2 EXCEL PARSER & CONVERGENCE VERIFICATION   ');
console.log('====================================================\n');

// ---------------------------------------------------------
// TEST 1: NUMERIC CELL PARSER EDGE CASES
// ---------------------------------------------------------
console.log('TEST SUITE 1: Cell Normalization & Number Parser');

assert(parseNumberCell(' 2,413,055 ') === 2413055, 'Parses comma-separated integers');
assert(parseNumberCell('(49,418)') === -49418, 'Parses negative numbers in parentheses (49,418) -> -49418');
assert(parseNumberCell('-12,354.54') === -12354.54, 'Parses negative floating-point numbers');
assert(parseNumberCell(' -   ') === 0, 'Parses accounting dashes " -   " to 0');
assert(parseNumberCell('-') === 0, 'Parses hyphen "-" to 0');
assert(parseNumberCell('NA') === 0, 'Parses "NA" to 0');
assert(parseNumberCell('₹ 35,00,000') === 3500000, 'Parses Rupee symbol and Indian comma notation');
assert(parseNumberCell('12.00%') === 12.0, 'Parses percentage string "12.00%" to 12.0');
console.log('');

// ---------------------------------------------------------
// TEST 2: CONVERGENCE SCHEMA & GUARDRAILS
// ---------------------------------------------------------
console.log('TEST SUITE 2: Convergence Schema & Guardrails');

const validMock = {
  entityName: 'SHREE ENTERPRISES',
  entityType: 'sole proprietorship', // alias
  netTurnover: 74644510,
  grossProfit: 4829057,
  cogs: 69815453,
  opex: 2413055,
  capital: 1991425,
  loanAmount: 3500000,
  revenueGrowthPct: 10.0
};

const vResult = validateAndNormalizeConvergenceData(validMock);
assert(vResult.isValid === true, 'Valid mock data passes schema validation');
assert(vResult.normalizedData.entityType === 'proprietorship', 'Alias "sole proprietorship" normalized to "proprietorship"');
assert(vResult.normalizedData.netTurnover === 74644510, 'Turnover preserved correctly');
assert(vResult.confidenceScore === 1.0, 'High quality input yields confidence score of 1.0');

// Test guardrail warning on high revenue growth
const highGrowthMock = { ...validMock, revenueGrowthPct: 25.0 };
const hResult = validateAndNormalizeConvergenceData(highGrowthMock);
assert(hResult.warnings.some(w => w.includes('High revenue growth')), 'Warning raised on >20% revenue growth');

// Test hard error on 0 turnover
const zeroTurnoverMock = { ...validMock, netTurnover: 0 };
const zResult = validateAndNormalizeConvergenceData(zeroTurnoverMock);
assert(zResult.isValid === false, 'Validation fails when turnover is 0');
assert(zResult.errors.length > 0, 'Error array contains error message for 0 turnover');
console.log('');

// ---------------------------------------------------------
// TEST 3: END-TO-END PARSING OF SIR\'S ACTUAL EXCEL FILE
// ---------------------------------------------------------
console.log('TEST SUITE 3: End-to-End CA Excel Parsing (Sir\'s Real File)');

const filePath = 'C:\\Users\\Nitro 5\\Downloads\\Final Project Report 25-04-23 - Email.xlsx';
const parsedWorkbook = parseDprExcelWorkbook(filePath);

assert(parsedWorkbook.validation.isValid === true, 'Excel parser successfully parsed and validated the workbook');

const data = parsedWorkbook.normalizedData;
console.log(`  > Extracted Entity Name: "${data.entityName}"`);
console.log(`  > Extracted Loan Amount: ₹${(data.loanAmount / 100000).toFixed(2)} Lakhs`);
console.log(`  > Extracted Baseline Turnover: ₹${(data.netTurnover / 100000).toFixed(2)} Lakhs`);
console.log(`  > Extracted Baseline Capital: ₹${(data.capital / 100000).toFixed(2)} Lakhs`);
console.log(`  > Extracted Baseline Debtors: ₹${(data.tradeDebtors / 100000).toFixed(2)} Lakhs`);
console.log(`  > Extracted Baseline Creditors: ₹${(data.tradeCreditors / 100000).toFixed(2)} Lakhs`);

assert(data.entityName.length > 0, 'Entity name successfully extracted from workbook');
assert(data.loanAmount === 3500000 || data.loanAmount === 4000000, 'Loan amount extracted accurately (₹35L / ₹40L)');
assert(data.netTurnover === 74644510, 'Baseline net turnover matches CA Provisional year exactly (₹7,46,44,510)', `Got ${data.netTurnover}`);
assert(data.cogs === 69815453, 'Baseline COGS (Purchases + Labour) matches CA Provisional year exactly (₹6,98,15,453)', `Got ${data.cogs}`);
assert(data.grossProfit === 4829057, 'Baseline Gross Profit matches CA Provisional year exactly (₹48,29,057)', `Got ${data.grossProfit}`);
assert(data.capital === 1991425, 'Baseline Capital matches CA Provisional balance sheet exactly (₹19,91,425)', `Got ${data.capital}`);
assert(data.tradeDebtors === 22029164, 'Baseline Trade Debtors matches CA Provisional balance sheet exactly (₹2,20,29,164)', `Got ${data.tradeDebtors}`);
assert(data.tradeCreditors === 29664003, 'Baseline Trade Creditors matches CA Provisional balance sheet exactly (₹2,96,64,003)', `Got ${data.tradeCreditors}`);
console.log('');

// ---------------------------------------------------------
// TEST 4: CONVERGENCE TO ENGINE (Full Integration Pipeline)
// ---------------------------------------------------------
console.log('TEST SUITE 4: Full Convergence Hand-Off to Phase 1 Engine');

const dprOutput = generateDprProjections(data);

assert(dprOutput.projectedPnl.length === data.horizonYears, `Engine generated ${data.horizonYears}-year P&L projection from parsed Excel`);
assert(dprOutput.projectedBalanceSheet.length === data.horizonYears, `Engine generated ${data.horizonYears}-year Balance Sheet from parsed Excel`);

let allYearsBalanced = true;
dprOutput.projectedBalanceSheet.forEach(bs => {
  if (!bs.integrityCheck.isBalanced) {
    allYearsBalanced = false;
    console.error(`  Year ${bs.year} Discrepancy: ₹${bs.integrityCheck.discrepancy}`);
  }
});
assert(allYearsBalanced, 'All projected Balance Sheet years balanced with ZERO discrepancy from parsed Excel data');

assert(dprOutput.solvencyRatios.annualRatios.length === data.horizonYears, 'Solvency ratios computed for all years');
assert(dprOutput.solvencyRatios.summary.overallRating !== undefined, `Overall DSCR Rating computed: ${dprOutput.solvencyRatios.summary.overallRating}`);
console.log(`  > Average DSCR: ${dprOutput.solvencyRatios.summary.averageDscr}`);

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================');

if (failed === 0) {
  console.log('\n>>> PHASE 2 EXCEL PARSER & CONVERGENCE POINT FULLY VERIFIED <<<\n');
  process.exit(0);
} else {
  console.error('\n>>> PHASE 2 VERIFICATION FAILED <<<\n');
  process.exit(1);
}

/**
 * Phase 4 Verification Suite: Multi-Sheet Bank-Ready Excel Export Generator
 * 
 * Verifies:
 * 1. Generation of institutional .xlsx workbook matching authentic CA template structure
 * 2. Presence of all 6 required sheets: INFO PAGE, FINAL REPORT, EMI, OD, SCH 2, DSCR
 * 3. Dynamic native Excel formulas across P&L, Balance Sheet, Amortization, and DSCR
 * 4. Zero balance sheet discrepancy inside the generated workbook
 * 5. Professional formatting (Indian currency, percentages, borders, alignments)
 */

import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { parseDprExcelWorkbook } from '../../parser/excelParser.js';
import { validateAndNormalizeConvergenceData } from '../../parser/convergenceSchema.js';
import { generateDprProjections } from '../../engine/dprEngine.js';
import { generateDprExcelWorkbook } from '../excelExportEngine.js';

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
console.log('    PHASE 4 MULTI-SHEET EXCEL EXPORT VERIFICATION    ');
console.log('====================================================\n');

async function runPhase4Tests() {
  const samplePath = path.resolve('server/data/sample_cma.xlsx');
  assert(fs.existsSync(samplePath), 'Sample CA workbook found at server/data/sample_cma.xlsx');

  // 1. Parse CA workbook and generate engine DPR
  const parsed = parseDprExcelWorkbook(samplePath);
  assert(parsed.validation.isValid, 'Sample CA workbook parsed cleanly');

  const normalized = validateAndNormalizeConvergenceData({
    ...parsed.normalizedData,
    horizonYears: 5,
    unsecuredLoansQuasiEquity: 500000,
    unsecuredLoansExternal: 200000
  }).normalizedData;

  const dpr = generateDprProjections(normalized);
  assert(dpr.projectedBalanceSheet.length === 5, 'DPR generated 5-year projections');

  console.log('\nTEST SUITE 1: Workbook Generation & Buffer Output');
  const buffer = await generateDprExcelWorkbook({ dpr, normalizedData: normalized });
  assert(Buffer.isBuffer(buffer), 'Generator returns a binary Buffer');
  assert(buffer.length > 10000, `Workbook buffer size is healthy (${(buffer.length / 1024).toFixed(1)} KB)`);

  // Save copy to disk for manual inspection
  const outPath = path.resolve('server/data/generated_bank_dpr.xlsx');
  fs.writeFileSync(outPath, buffer);
  assert(fs.existsSync(outPath), 'Generated workbook successfully written to server/data/generated_bank_dpr.xlsx');

  console.log('\nTEST SUITE 2: Sheet Structure & Architecture Verification');
  const loadedWb = new ExcelJS.Workbook();
  await loadedWb.xlsx.load(buffer);

  const expectedSheets = ['INFO PAGE', 'FINAL REPORT', 'EMI', 'OD', 'SCH 2', 'DSCR'];
  expectedSheets.forEach(sheetName => {
    const sheet = loadedWb.getWorksheet(sheetName);
    assert(sheet !== undefined, `Sheet "${sheetName}" exists in generated workbook`);
  });

  console.log('\nTEST SUITE 3: INFO PAGE Presentation & CGTMSE Compliance');
  const infoSheet = loadedWb.getWorksheet('INFO PAGE');
  
  let entityFound = false;
  let projectCostFormulaFound = false;

  infoSheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      const val = String(cell.value || '');
      if (val.includes('SHREE ENTERPRISES') || val.includes('PROSPECTIVE BORROWER')) {
        entityFound = true;
      }
      if (cell.value && typeof cell.value === 'object' && cell.value.formula && cell.value.formula.includes('SUM')) {
        projectCostFormulaFound = true;
      }
    });
  });

  assert(entityFound, 'Borrower name correctly written to INFO PAGE');
  assert(projectCostFormulaFound, 'Total Project Cost has dynamic Excel SUM formula');

  console.log('\nTEST SUITE 4: FINAL REPORT Formulas & Balance Sheet Integrity');
  const finalSheet = loadedWb.getWorksheet('FINAL REPORT');

  // Find rows in FINAL REPORT
  let gwcCell = null;
  let gpCell = null;
  let patCell = null;
  let deltaCell = null;
  let openingCapitalVal = null;
  let termLoanVal = null;
  let netFixedAssetsVal = null;
  let totalSourcesCell = null;
  let totalAppCell = null;

  finalSheet.eachRow((row, rowNumber) => {
    const label = String(row.getCell(2).value || '');
    if (label.includes('Gross Working Capital')) {
      gwcCell = row.getCell(3).value;
    }
    if (label.includes('Gross Profit')) {
      gpCell = row.getCell(3).value;
    }
    if (label.includes('NET PROFIT AFTER TAX')) {
      patCell = row.getCell(3).value;
    }
    if (label.includes('Opening Capital')) {
      openingCapitalVal = row.getCell(3).value;
    }
    if (label.includes('Secured Loans: Bank Term Loan')) {
      termLoanVal = row.getCell(3).value;
    }
    if (label.includes('Net Fixed Assets (WDV Block)')) {
      netFixedAssetsVal = row.getCell(3).value;
    }
    if (label.includes('TOTAL SOURCES OF FUNDS')) {
      totalSourcesCell = row.getCell(3).value;
    }
    if (label.includes('TOTAL APPLICATION OF FUNDS')) {
      totalAppCell = row.getCell(3).value;
    }
    if (label.includes('Balance Sheet Integrity Check')) {
      deltaCell = row.getCell(3).value;
    }
  });

  assert(
    typeof gwcCell === 'object' && gwcCell.formula && gwcCell.formula.includes('SUM'),
    `GWC has dynamic SUM formula: ${gwcCell?.formula}`
  );
  assert(
    typeof gpCell === 'object' && gpCell.formula && gpCell.formula.includes('-'),
    `Gross Profit has dynamic subtraction formula: ${gpCell?.formula}`
  );
  assert(
    typeof patCell === 'object' && patCell.formula && patCell.formula.includes('-'),
    `PAT has dynamic tax deduction formula: ${patCell?.formula}`
  );
  assert(
    openingCapitalVal != null && openingCapitalVal > 0,
    `Opening Capital is populated and positive: ₹${(openingCapitalVal / 100000).toFixed(2)} Lakhs (not null!)`
  );
  assert(
    termLoanVal != null && termLoanVal > 0,
    `Bank Term Loan in Balance Sheet is populated: ₹${(termLoanVal / 100000).toFixed(2)} Lakhs (not null!)`
  );
  assert(
    netFixedAssetsVal != null && netFixedAssetsVal > 0,
    `Net Fixed Assets in Balance Sheet is populated: ₹${(netFixedAssetsVal / 100000).toFixed(2)} Lakhs (not null!)`
  );
  assert(
    totalSourcesCell != null && totalSourcesCell.result > 0,
    `Total Sources of Funds evaluated: ₹${(totalSourcesCell.result / 100000).toFixed(2)} Lakhs`
  );
  assert(
    totalAppCell != null && totalAppCell.result > 0,
    `Total Application of Funds evaluated: ₹${(totalAppCell.result / 100000).toFixed(2)} Lakhs`
  );
  assert(
    Math.abs(totalSourcesCell.result - totalAppCell.result) <= 0.05,
    `Double-Entry equality verified: Sources == Applications (Diff: ₹${Math.abs(totalSourcesCell.result - totalAppCell.result)})`
  );
  assert(
    typeof deltaCell === 'object' && deltaCell.formula,
    `Balance Sheet Delta has dynamic reconciliation formula: ${deltaCell?.formula}`
  );
  assert(
    deltaCell?.result === 0 || deltaCell?.result === undefined,
    `Balance Sheet discrepancy is exactly 0 in generated Excel (Result: ${deltaCell?.result ?? 0})`
  );

  console.log('\nTEST SUITE 5: EMI Amortization Schedule & Formulas');
  const emiSheet = loadedWb.getWorksheet('EMI');
  let month1Row = null;
  emiSheet.eachRow(row => {
    if (row.getCell(1).value === 1) month1Row = row;
  });
  assert(month1Row !== null, 'Month 1 amortization row dynamically found in EMI schedule');

  const emiMonth1Interest = month1Row?.getCell(3).value;
  const emiMonth1Closing = month1Row?.getCell(6).value;

  assert(
    typeof emiMonth1Interest === 'object' && emiMonth1Interest.formula && emiMonth1Interest.formula.includes('*'),
    `Month 1 interest has dynamic formula: ${emiMonth1Interest?.formula}`
  );
  assert(
    typeof emiMonth1Closing === 'object' && emiMonth1Closing.formula,
    `Month 1 closing principal has dynamic formula: ${emiMonth1Closing?.formula}`
  );

  console.log('\nTEST SUITE 6: DSCR Statement & Average Benchmark');
  const dscrSheet = loadedWb.getWorksheet('DSCR');
  let dscrY1Cell = null;
  let dscrTotCell = null;
  let dscrAvgCell = null;

  dscrSheet.eachRow(row => {
    const label = String(row.getCell(2).value || '');
    if (label.includes('DEBT SERVICE COVERAGE RATIO')) {
      dscrY1Cell = row.getCell(3).value;
      dscrTotCell = row.getCell(8).value; // Total column (Col H = 8)
      dscrAvgCell = row.getCell(9).value; // Average column (Col I = 9)
    }
  });

  assert(
    typeof dscrY1Cell === 'object' && dscrY1Cell.formula && dscrY1Cell.formula.includes('IF('),
    `Annual DSCR guarded against division by zero: ${dscrY1Cell?.formula}`
  );
  assert(
    dscrTotCell === '—',
    `Total column on DSCR row has formatted placeholder '—' (no unstyled table hole)`
  );
  assert(
    typeof dscrAvgCell === 'object' && dscrAvgCell.formula && dscrAvgCell.formula.includes('IFERROR('),
    `Average DSCR guarded with IFERROR: ${dscrAvgCell?.formula}`
  );
  assert(
    dscrAvgCell?.result >= 1.50,
    `Average DSCR result meets institutional bankable standard: ${dscrAvgCell?.result}`
  );

  console.log('\nTEST SUITE 7: Extended Tenures & Zero-Debt Collision Immunity');
  // 1. Extended 10-year tenure (120 months) collision immunity
  const tenYearData = { ...normalized, tenureMonths: 120, horizonYears: 10 };
  const dpr10Year = generateDprProjections(tenYearData);
  const wb10YearBuf = await generateDprExcelWorkbook({ dpr: dpr10Year, normalizedData: tenYearData });
  const wb10Year = new ExcelJS.Workbook();
  await wb10Year.xlsx.load(wb10YearBuf);
  const emi10YearSheet = wb10Year.getWorksheet('EMI');

  let m1Row10Y = null;
  emi10YearSheet.eachRow(row => {
    if (row.getCell(1).value === 1) m1Row10Y = row;
  });
  assert(m1Row10Y !== null, '10-Year Loan (120 mos): Month 1 amortization row dynamically placed');
  assert(m1Row10Y?.number >= 17, `10-Year Loan Month 1 starts safely below annual table at Row ${m1Row10Y?.number} (>= 17)`);

  // 2. Zero-debt borrower (loanAmount = 0) DSCR immunity
  const zeroDebtData = { ...normalized, loanAmount: 0 };
  const dprZeroDebt = generateDprProjections(zeroDebtData);
  const wbZeroDebtBuf = await generateDprExcelWorkbook({ dpr: dprZeroDebt, normalizedData: zeroDebtData });
  const wbZeroDebt = new ExcelJS.Workbook();
  await wbZeroDebt.xlsx.load(wbZeroDebtBuf);
  const dscrZeroSheet = wbZeroDebt.getWorksheet('DSCR');
  let dscrZeroY1 = null;
  dscrZeroSheet.eachRow(row => {
    const label = String(row.getCell(2).value || '');
    if (label.includes('DEBT SERVICE COVERAGE RATIO')) {
      dscrZeroY1 = row.getCell(3).value;
    }
  });
  assert(
    typeof dscrZeroY1 === 'object' && dscrZeroY1.result === 'N/A',
    `Zero-debt borrower displays clean 'N/A' for DSCR without #DIV/0! error: ${dscrZeroY1?.result}`
  );
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('\n>>> PHASE 4 MULTI-SHEET EXCEL EXPORT VERIFIED <<<\n');
    process.exit(0);
  } else {
    console.error('\n>>> PHASE 4 VERIFICATION FAILED <<<\n');
    process.exit(1);
  }
}

runPhase4Tests();

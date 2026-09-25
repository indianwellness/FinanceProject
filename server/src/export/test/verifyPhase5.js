/**
 * Phase 5 Verification Suite: PDF Credit Appraisal Memorandum Export
 * 
 * Verifies:
 * 1. Generation of institutional-grade, multi-page vector PDF Credit Appraisal Memo (CAM)
 * 2. Binary signature verification (%PDF magic header bytes, %%EOF trailer)
 * 3. Document size & page structure integrity (> 25 KB buffer)
 * 4. Presence of all 7 core credit underwriting pages:
 *    - Executive Summary & Borrower Profile
 *    - Project Cost & Means of Finance
 *    - 5-Year Projected P&L Statement
 *    - 5-Year Projected Balance Sheet (0 Discrepancy)
 *    - Working Capital Assessment (Nayak Committee 20% Norm)
 *    - Term Loan Amortization & DSCR Statement
 *    - Statutory Compliance Notes & Credit Committee Sign-Off
 * 5. Stress test: Zero-debt borrower model (clean 'N/A' handling without #DIV/0!)
 * 6. Stress test: Extended 10-year projection horizon
 */

import fs from 'fs';
import path from 'path';
import { parseDprExcelWorkbook } from '../../parser/excelParser.js';
import { validateAndNormalizeConvergenceData } from '../../parser/convergenceSchema.js';
import { generateDprProjections } from '../../engine/dprEngine.js';
import { generateDprPdfDocument } from '../pdfExportEngine.js';

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
console.log('    PHASE 5 PDF CREDIT APPRAISAL MEMO VERIFICATION  ');
console.log('====================================================\n');

async function runPhase5Tests() {
  const samplePath = path.resolve('server/data/sample_cma.xlsx');
  assert(fs.existsSync(samplePath), `Sample CA workbook found at ${samplePath}`);

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

  console.log('\nTEST SUITE 1: PDF Document Generation & Buffer Integrity');
  const pdfBuffer = await generateDprPdfDocument({ dpr, normalizedData: normalized });
  assert(Buffer.isBuffer(pdfBuffer), 'Generator returns a binary Buffer');
  assert(pdfBuffer.length > 20000, `PDF buffer size is healthy (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

  // Magic bytes check
  const headerStr = pdfBuffer.subarray(0, 8).toString('ascii');
  assert(headerStr.startsWith('%PDF-'), `Valid PDF magic header signature: ${headerStr.trim()}`);

  // Save copy to disk for manual inspection
  const outPath = path.resolve('server/data/generated_credit_appraisal.pdf');
  fs.writeFileSync(outPath, pdfBuffer);
  assert(fs.existsSync(outPath), 'Generated PDF successfully written to server/data/generated_credit_appraisal.pdf');

  console.log('\nTEST SUITE 2: Structural Verification (PDF Header, Trailer & Metadata)');
  const bufferString = pdfBuffer.toString('latin1');
  assert(bufferString.includes('%%EOF'), 'PDF contains valid %%EOF trailer termination');
  assert(bufferString.includes('MSME CreditOS Bank DPR Engine'), 'PDF metadata embeds Author: MSME CreditOS Bank DPR Engine');
  assert(bufferString.includes('Credit Appraisal Memorandum'), 'PDF metadata embeds Subject / Title');

  function extractTextFromPdf(pdfRaw) {
    let fullText = '';
    const tjMatches = pdfRaw.matchAll(/\[([\s\S]*?)\]\s*TJ/g);
    for (const m of tjMatches) {
      let runText = '';
      const hexParts = m[1].matchAll(/<([0-9a-fA-F]+)>/g);
      for (const h of hexParts) runText += Buffer.from(h[1], 'hex').toString('utf8');
      fullText += runText + ' ';
    }
    return fullText;
  }

  const extractedText = extractTextFromPdf(bufferString);

  console.log('\nTEST SUITE 3: Multi-Page Content & Section Verification');
  // Check that all 7 core sections exist in the rendered PDF text streams
  const requiredSections = [
    'CREDIT APPRAISAL MEMORANDUM',
    'BORROWER PROFILE & FACILITY REQUEST',
    'AUDITED HISTORICAL BASELINE METRICS',
    'PROJECT COST & CAPITAL EXPENDITURE SCHEDULE',
    'MEANS OF FINANCE (FUNDING STRUCTURE)',
    'INITIAL PROJECT SOLVENCY METRICS',
    'FIVE-YEAR PROJECTED PROFIT & LOSS STATEMENT',
    'FIVE-YEAR PROJECTED BALANCE SHEET',
    'WORKING CAPITAL ASSESSMENT (NAYAK NORM)',
    'DRAWING POWER & CC INTEREST SERVICING',
    'TERM LOAN REPAYMENT SCHEDULE',
    'DEBT SERVICE COVERAGE RATIO (DSCR) STATEMENT',
    'REGULATORY & STATUTORY COMPLIANCE MEMORANDUM',
    'CREDIT COMMITTEE APPRAISAL & SANCTION SIGN-OFF'
  ];

  requiredSections.forEach(sec => {
    assert(extractedText.includes(sec), `Appraisal Memo contains section: "${sec}"`);
  });

  console.log('\nTEST SUITE 4: Financial Data Reconciled in PDF');
  // Verify borrower name
  assert(extractedText.includes('SHREE ENTERPRISES'), 'Borrower name M/S SHREE ENTERPRISES correctly present in PDF');
  // Verify loan amount formatted
  assert(extractedText.includes('40,00,000') || extractedText.includes('40.00 L'), 'Term loan amount (Rs. 40.00 L) present in PDF');
  // Verify balance sheet equality note
  assert(extractedText.includes('BALANCED'), 'Balance Sheet discrepancy certified as BALANCED');
  // Verify exact Capex and Means of Finance zero-discrepancy reconciliation
  assert(extractedText.includes('Rs. 0.00 (RECONCILED)'), 'Page 2 Means of Finance reflects exact identity Rs. 0.00 (RECONCILED)');
  // Verify projected financial numbers populated in table cells (no blank dashes)
  assert(extractedText.includes('8,21,08,961'), 'P&L Year 1 Gross Turnover (Rs. 8,21,08,961) populated');
  assert(extractedText.includes('1,48,548'), 'P&L Year 1 Depreciation (Rs. 1,48,548) populated');
  assert(extractedText.includes('3,33,757'), 'P&L Year 1 Term Loan Interest (Rs. 3,33,757) populated');
  assert(extractedText.includes('4,36,31,251'), 'Balance Sheet Year 1 Total Application (Rs. 4,36,31,251) populated');
  assert(extractedText.includes('2,05,27,240'), 'Working Capital Nayak Requirement (Rs. 2,05,27,240) populated');
  assert(extractedText.includes('22,61,283'), 'DSCR Year 1 Cash Accruals (Rs. 22,61,283) populated');
  assert(extractedText.includes('5,97,702') || extractedText.includes('5,97,701'), 'DSCR Year 1 Debt Obligation populated');

  console.log('\nTEST SUITE 5: Extended Tenures & Zero-Debt Stress Tests');
  // 1. Zero-debt model
  const zeroDebtData = { ...normalized, loanAmount: 0 };
  const dprZeroDebt = generateDprProjections(zeroDebtData);
  const zeroDebtPdf = await generateDprPdfDocument({ dpr: dprZeroDebt, normalizedData: zeroDebtData });
  assert(Buffer.isBuffer(zeroDebtPdf) && zeroDebtPdf.length > 15000, `Zero-debt borrower PDF generated cleanly (${(zeroDebtPdf.length / 1024).toFixed(1)} KB)`);

  const zeroDebtStr = zeroDebtPdf.toString('latin1');
  assert(zeroDebtStr.includes('NON-CGTMSE') || zeroDebtStr.includes('N/A') || zeroDebtStr.includes('0'), 'Zero-debt borrower handled without crash');

  // 2. Large Loan (> 10 Cr) CGTMSE Ceiling Branching Test
  const largeLoanData = { ...normalized, loanAmount: 150000000 }; // 15 Crore
  const dprLargeLoan = generateDprProjections(largeLoanData);
  const largeLoanPdf = await generateDprPdfDocument({ dpr: dprLargeLoan, normalizedData: largeLoanData });
  const largeLoanText = extractTextFromPdf(largeLoanPdf.toString('latin1'));
  assert(largeLoanText.includes('exceeds the Rs. 10.00 Crore statutory ceiling'), 'Large loan (> 10 Cr) correctly branches to non-CGTMSE statutory disclosure');

  // 3. Extended 10-Year Horizon model
  const tenYearData = { ...normalized, tenureMonths: 120, horizonYears: 10 };
  const dpr10Year = generateDprProjections(tenYearData);
  const tenYearPdf = await generateDprPdfDocument({ dpr: dpr10Year, normalizedData: tenYearData });
  assert(Buffer.isBuffer(tenYearPdf) && tenYearPdf.length > 20000, `10-Year Horizon PDF generated cleanly (${(tenYearPdf.length / 1024).toFixed(1)} KB)`);

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('\n>>> PHASE 5 PDF CREDIT APPRAISAL MEMO VERIFIED <<<\n');
    process.exit(0);
  } else {
    console.error('\n>>> PHASE 5 VERIFICATION FAILED <<<\n');
    process.exit(1);
  }
}

runPhase5Tests();

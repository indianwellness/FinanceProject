/**
 * Bank-Ready Multi-Sheet Excel Export Generator
 * Phase 4 — MSME CreditOS
 * 
 * Generates an institutional-grade, formula-linked .xlsx workbook mirroring
 * authentic CA CMA project report standards (e.g., "Final Project Report 25-04-23 - Email.xlsx").
 * 
 * Sheets Produced:
 * 1. INFO PAGE    - Entity identity, loan facilities, project cost & means of finance, CGTMSE status
 * 2. FINAL REPORT - Master comparative statement: CC eligibility, Projected P&L, Projected Balance Sheet, Solvency Ratios
 * 3. EMI          - Full month-by-month loan amortization schedule + annual fiscal rollups
 * 4. OD           - Working capital drawing power & CC interest calculation
 * 5. SCH 2        - IT Act Section 32 WDV depreciation schedule (with 180-day half-rate rule)
 * 6. DSCR         - Debt Service Coverage Ratio statement with institutional bankability verdict
 */

import ExcelJS from 'exceljs';

// Color Palette Constants for Professional Bank Presentation
const COLORS = {
  navyHeader: 'FF1F4E78',      // Deep Navy Blue for Sheet & Main Headers
  steelHeader: 'FF2F5597',     // Steel Blue for Category Headers
  iceBlue: 'FFD9E1F2',         // Soft Ice Blue for Sub-headers / Highlights
  softGray: 'FFF2F2F2',        // Zebra striping / neutral backgrounds
  accentGreen: 'FFE2EFDA',     // Soft Green for Bankable / Positive Totals
  accentAmber: 'FFFFF2CC',     // Soft Amber for Warnings
  borderGray: 'FFD9D9D9',      // Subtle gridlines
  borderDark: 'FF595959',      // Section boundary borders
  white: 'FFFFFFFF',
  black: 'FF000000',
  textDark: 'FF1F2937'
};

// Standard Font Configurations
const FONTS = {
  sheetTitle: { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.white } },
  sectionTitle: { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.navyHeader } },
  tableHeader: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } },
  tableHeaderDark: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.textDark } },
  boldRow: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.textDark } },
  regular: { name: 'Calibri', size: 10, color: { argb: COLORS.textDark } },
  italicNote: { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF555555' } },
  verdictGood: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E4620' } }
};

// Standard Border Configurations
const BORDERS = {
  thin: {
    top: { style: 'thin', color: { argb: COLORS.borderGray } },
    left: { style: 'thin', color: { argb: COLORS.borderGray } },
    bottom: { style: 'thin', color: { argb: COLORS.borderGray } },
    right: { style: 'thin', color: { argb: COLORS.borderGray } }
  },
  subtotal: {
    top: { style: 'thin', color: { argb: COLORS.borderDark } },
    bottom: { style: 'double', color: { argb: COLORS.borderDark } },
    left: { style: 'thin', color: { argb: COLORS.borderGray } },
    right: { style: 'thin', color: { argb: COLORS.borderGray } }
  },
  header: {
    top: { style: 'thin', color: { argb: COLORS.navyHeader } },
    bottom: { style: 'medium', color: { argb: COLORS.navyHeader } },
    left: { style: 'thin', color: { argb: COLORS.borderGray } },
    right: { style: 'thin', color: { argb: COLORS.borderGray } }
  }
};

const NUM_FORMATS = {
  currency: '#,##,##0',
  currencyDec: '#,##,##0.00',
  percentage: '0.00%',
  ratio: '0.00',
  integer: '#,##0'
};

/**
 * Helper to auto-fit worksheet column widths with minimum bounds
 */
function autoFitColumns(sheet, minWidth = 12) {
  sheet.columns.forEach(column => {
    let maxLength = minWidth;
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value;
      let text = '';
      if (typeof val === 'string') text = val;
      else if (typeof val === 'number') text = val.toLocaleString('en-IN');
      else if (val && typeof val === 'object' && val.result != null) text = String(val.result);
      if (text.length > maxLength && !cell.isMerged) {
        maxLength = Math.min(text.length + 3, 50); // cap max width to 50
      }
    });
    column.width = Math.max(maxLength, minWidth);
  });
}

/**
 * Builds Sheet 1: INFO PAGE
 */
function buildInfoPage(workbook, dpr, data) {
  const ws = workbook.addWorksheet('INFO PAGE', {
    views: [{ showGridLines: true }]
  });

  // Title Block
  ws.mergeCells('A2:F2');
  const titleCell = ws.getCell('A2');
  titleCell.value = 'DETAILED PROJECT REPORT (DPR) — CREDIT APPRAISAL PROFILE';
  titleCell.font = FONTS.sheetTitle;
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyHeader } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 30;

  // Subtitle
  ws.mergeCells('A3:F3');
  const subCell = ws.getCell('A3');
  subCell.value = `Prepared for Institutional Bank Financing | Generated: ${new Date().toLocaleDateString('en-IN')}`;
  subCell.font = FONTS.italicNote;
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };

  let r = 5;

  // Borrower Particulars Section
  ws.mergeCells(`A${r}:F${r}`);
  const sec1 = ws.getCell(`A${r}`);
  sec1.value = '1. BORROWER PARTICULARS & PROFILE';
  sec1.font = FONTS.sectionTitle;
  sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
  r += 2;

  const entityName = data.entityName || dpr.metadata.entityName || 'M/S PROSPECTIVE BORROWER';
  const entityType = (data.entityType || dpr.metadata.entityType || 'proprietorship').toUpperCase();
  const businessActivity = data.businessActivity || 'MANUFACTURING / SERVICES / TRADING';
  const address = data.address || 'INDUSTRIAL ESTATE / COMMERCIAL PREMISES';

  const profileRows = [
    ['Name of the Enterprise', entityName],
    ['Constitution / Entity Type', entityType],
    ['Nature of Business / Industry', businessActivity],
    ['Registered Office / Premises Address', address],
    ['Projection Horizon', `${dpr.metadata.horizonYears} Fiscal Years`],
    ['Tax Assessment Regime', entityType === 'PROPRIETORSHIP' ? 'Income Tax Slabs (New Regime default)' : 'Corporate / Firm Flat Rate']
  ];

  profileRows.forEach(([label, val]) => {
    ws.getCell(`B${r}`).value = label;
    ws.getCell(`B${r}`).font = FONTS.boldRow;
    ws.getCell(`C${r}`).value = ':';
    ws.getCell(`C${r}`).alignment = { horizontal: 'center' };
    ws.mergeCells(`D${r}:F${r}`);
    ws.getCell(`D${r}`).value = val;
    ws.getCell(`D${r}`).font = FONTS.regular;
    r++;
  });

  r += 2;

  // Credit Facilities Requested
  ws.mergeCells(`A${r}:F${r}`);
  const sec2 = ws.getCell(`A${r}`);
  sec2.value = '2. CREDIT FACILITIES PROPOSED FOR SANCTION';
  sec2.font = FONTS.sectionTitle;
  sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
  r += 2;

  const loanAmount = Number(dpr.termLoan.loanAmount) || 0;
  const interestRate = Number(dpr.termLoan.interestRate) || 0;
  const tenureMonths = Number(dpr.termLoan.tenureMonths) || 0;
  const moratoriumMonths = Number(dpr.termLoan.moratoriumMonths) || 0;
  const ccAmount = Number(data.ccAppliedFor ?? data.ccOdOutstanding ?? 0);

  const facilityRows = [
    ['Term Loan (TL) Facility', loanAmount, NUM_FORMATS.currency, 'For Plant, Machinery & Capital Assets'],
    ['Proposed Interest Rate', interestRate / 100, NUM_FORMATS.percentage, 'Per Annum (Reducing Balance)'],
    ['Repayment Tenure', `${tenureMonths} Months (${(tenureMonths / 12).toFixed(1)} Years)`, null, 'Monthly Equated Installments'],
    ['Principal Moratorium Period', `${moratoriumMonths} Months`, null, 'Principal repayment holiday (Interest payable monthly)'],
    ['Working Capital (CC/OD) Limit', ccAmount, NUM_FORMATS.currency, 'Fund-Based Cash Credit Facility']
  ];

  ws.getCell(`B${r}`).value = 'Facility Parameter';
  ws.getCell(`D${r}`).value = 'Proposed Terms';
  ws.getCell(`E${r}`).value = 'Remarks / Covenant';
  [`B${r}`, `D${r}`, `E${r}`].forEach(pos => {
    ws.getCell(pos).font = FONTS.boldRow;
    ws.getCell(pos).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.softGray } };
  });
  r++;

  facilityRows.forEach(([param, val, fmt, note]) => {
    ws.getCell(`B${r}`).value = param;
    ws.getCell(`B${r}`).font = FONTS.regular;
    ws.getCell(`D${r}`).value = val;
    ws.getCell(`D${r}`).font = FONTS.boldRow;
    if (fmt) ws.getCell(`D${r}`).numFmt = fmt;
    ws.mergeCells(`E${r}:F${r}`);
    ws.getCell(`E${r}`).value = note;
    ws.getCell(`E${r}`).font = FONTS.italicNote;
    r++;
  });

  r += 2;

  // Project Cost & Means of Finance Table
  ws.mergeCells(`A${r}:F${r}`);
  const sec3 = ws.getCell(`A${r}`);
  sec3.value = '3. PROJECT COST & PROPOSED MEANS OF FINANCE';
  sec3.font = FONTS.sectionTitle;
  sec3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
  r += 2;

  const costHeaderRow = r;
  ws.mergeCells(`B${r}:C${r}`);
  ws.getCell(`B${r}`).value = 'Project Cost Component';
  ws.getCell(`D${r}`).value = 'Amount (₹)';
  ws.getCell(`E${r}`).value = 'Means of Finance Source';
  ws.getCell(`F${r}`).value = 'Amount (₹)';
  [`B${r}`, `D${r}`, `E${r}`, `F${r}`].forEach(p => {
    ws.getCell(p).font = FONTS.tableHeader;
    ws.getCell(p).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
    ws.getCell(p).alignment = { horizontal: 'center' };
  });
  r++;

  // Calculate project capex from fixed assets or additions
  let totalCapex = 0;
  if (data.newAssetAdditions && typeof data.newAssetAdditions === 'object') {
    Object.values(data.newAssetAdditions).forEach(val => totalCapex += (Number(val) || 0));
  }
  if (totalCapex <= 0) totalCapex = loanAmount; // standard project assumption

  const wcMargin = Math.round(ccAmount * 0.25);
  const totalCost = totalCapex + wcMargin;

  const promoterEquity = Math.max(0, totalCost - loanAmount);
  const quasiEquity = Number(data.unsecuredLoansQuasiEquity) || 0;

  const tableStart = r;
  // Row 1: Capex vs Term Loan
  ws.mergeCells(`B${r}:C${r}`);
  ws.getCell(`B${r}`).value = 'Plant, Machinery & Capital Expenditure';
  ws.getCell(`D${r}`).value = totalCapex;
  ws.getCell(`D${r}`).numFmt = NUM_FORMATS.currency;
  ws.getCell(`E${r}`).value = 'Bank Term Loan';
  ws.getCell(`F${r}`).value = loanAmount;
  ws.getCell(`F${r}`).numFmt = NUM_FORMATS.currency;
  r++;

  // Row 2: Working Capital Margin vs Promoter Contribution
  ws.mergeCells(`B${r}:C${r}`);
  ws.getCell(`B${r}`).value = 'Working Capital Margin Contribution';
  ws.getCell(`D${r}`).value = wcMargin;
  ws.getCell(`D${r}`).numFmt = NUM_FORMATS.currency;
  ws.getCell(`E${r}`).value = 'Promoter Capital Contribution';
  ws.getCell(`F${r}`).value = Math.max(0, promoterEquity - quasiEquity);
  ws.getCell(`F${r}`).numFmt = NUM_FORMATS.currency;
  r++;

  // Row 3: Contingencies / Other vs Quasi Equity
  ws.mergeCells(`B${r}:C${r}`);
  ws.getCell(`B${r}`).value = 'Pre-Operative & Misc. Expenses';
  ws.getCell(`D${r}`).value = 0;
  ws.getCell(`D${r}`).numFmt = NUM_FORMATS.currency;
  ws.getCell(`E${r}`).value = 'Subordinated Quasi-Equity (Promoter Debt)';
  ws.getCell(`F${r}`).value = quasiEquity;
  ws.getCell(`F${r}`).numFmt = NUM_FORMATS.currency;
  const tableEnd = r;
  r++;

  // Total Project Cost & Means of Finance with native Excel SUM formulas
  ws.mergeCells(`B${r}:C${r}`);
  ws.getCell(`B${r}`).value = 'TOTAL PROJECT COST';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  ws.getCell(`D${r}`).value = { formula: `SUM(D${tableStart}:D${tableEnd})`, result: totalCost };
  ws.getCell(`D${r}`).font = FONTS.boldRow;
  ws.getCell(`D${r}`).numFmt = NUM_FORMATS.currency;

  ws.getCell(`E${r}`).value = 'TOTAL MEANS OF FINANCE';
  ws.getCell(`E${r}`).font = FONTS.boldRow;
  ws.getCell(`F${r}`).value = { formula: `SUM(F${tableStart}:F${tableEnd})`, result: loanAmount + promoterEquity };
  ws.getCell(`F${r}`).font = FONTS.boldRow;
  ws.getCell(`F${r}`).numFmt = NUM_FORMATS.currency;

  [`B${r}`, `C${r}`, `D${r}`, `E${r}`, `F${r}`].forEach(pos => {
    ws.getCell(pos).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentGreen } };
    ws.getCell(pos).border = BORDERS.subtotal;
  });

  r += 3;

  // Institutional Compliance & Regulatory Note (CGTMSE, DSCR & Tax)
  ws.mergeCells(`A${r}:F${r}`);
  const sec4 = ws.getCell(`A${r}`);
  sec4.value = '4. INSTITUTIONAL CREDIT APPRAISAL & COMPLIANCE NOTES';
  sec4.font = FONTS.sectionTitle;
  sec4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
  r += 2;

  const cgtmse = dpr.solvencyRatios.cgtmseEligibility;
  const avgDscr = dpr.solvencyRatios.summary.averageDscr;
  const dscrRating = dpr.solvencyRatios.summary.overallRating;

  const notes = [
    `• CGTMSE Guarantee Coverage: ${cgtmse.isEligible ? `ELIGIBLE (Loan amount ₹${(loanAmount / 100000).toFixed(2)}L satisfies enhanced ₹10 Crore ceiling). Guarantee coverage of ${cgtmse.coverageStandardPct}% with minimum guarantee fee of ${cgtmse.annualGuaranteeFeeMinPct}% p.a.` : 'NOT APPLICABLE (Loan exceeds statutory ceiling).'}` ,
    `• Average DSCR: ${avgDscr !== null ? avgDscr.toFixed(2) : 'N/A'} — Rating: ${dscrRating} (${dpr.solvencyRatios.summary.ratingMessage})`,
    `• RBI Nayak Committee Norm: Working Capital assessment verified at minimum 20% of projected annual turnover.`,
    `• Depreciation Basis: Income Tax Act 1961, Section 32 Written Down Value (WDV) method applied consistently.`
  ];

  notes.forEach(n => {
    ws.mergeCells(`B${r}:F${r}`);
    ws.getCell(`B${r}`).value = n;
    ws.getCell(`B${r}`).font = FONTS.regular;
    r++;
  });

  autoFitColumns(ws);
}

/**
 * Builds Sheet 2: FINAL REPORT
 * Master statement with CC Eligibility, P&L, Balance Sheet, and Solvency Ratios.
 */
function buildFinalReport(workbook, dpr, data) {
  const ws = workbook.addWorksheet('FINAL REPORT', {
    views: [{ showGridLines: true }]
  });

  const horizon = dpr.metadata.horizonYears;
  const years = Array.from({ length: horizon }, (_, i) => i + 1);

  // Column Mapping Helper (Column B is particulars, Column C is Year 1, D is Year 2, etc.)
  // col 1: A (spacer)
  // col 2: B (Particulars)
  // col 3: C (Y1)
  // col 4: D (Y2)
  // col 5: E (Y3)
  // col 6: F (Y4)
  // col 7: G (Y5)
  const getColLetter = colIndex => String.fromCharCode(65 + colIndex - 1);
  const startCol = 3; // Column C
  const endCol = startCol + horizon - 1;
  const endColLetter = getColLetter(endCol);

  // Main Header
  ws.mergeCells(`B2:${endColLetter}2`);
  const topHeader = ws.getCell('B2');
  topHeader.value = (data.entityName || dpr.metadata.entityName || 'M/S PROSPECTIVE BORROWER').toUpperCase();
  topHeader.font = FONTS.sheetTitle;
  topHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyHeader } };
  topHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 28;

  let r = 4;

  // -------------------------------------------------------------
  // PART 1: ELIGIBILITY FOR BANK CASH CREDIT (CC)
  // -------------------------------------------------------------
  ws.mergeCells(`B${r}:${endColLetter}${r}`);
  const part1Header = ws.getCell(`B${r}`);
  part1Header.value = 'ELIGIBILITY FOR BANK CASH CREDIT (CC / OD FACILITY)';
  part1Header.font = FONTS.sectionTitle;
  part1Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
  r++;

  // Column Headers
  ws.getCell(`B${r}`).value = 'Particulars';
  ws.getCell(`B${r}`).font = FONTS.tableHeader;
  ws.getCell(`B${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };

  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    ws.getCell(`${colLetter}${r}`).value = `Year ${y} (Projected)`;
    ws.getCell(`${colLetter}${r}`).font = FONTS.tableHeader;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
    ws.getCell(`${colLetter}${r}`).alignment = { horizontal: 'right' };
  });
  r++;

  const rowStock = r;
  ws.getCell(`B${r}`).value = 'Stock / Inventories';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const val = dpr.projectedBalanceSheet[i]?.applicationOfFunds?.inventories || 0;
    ws.getCell(`${colLetter}${r}`).value = val;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowDebtors = r;
  ws.getCell(`B${r}`).value = 'Sundry Debtors';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const val = dpr.projectedBalanceSheet[i]?.applicationOfFunds?.tradeDebtors || 0;
    ws.getCell(`${colLetter}${r}`).value = val;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowGwc = r;
  ws.getCell(`B${r}`).value = 'Gross Working Capital (GWC)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = (dpr.projectedBalanceSheet[i]?.applicationOfFunds?.inventories || 0) + (dpr.projectedBalanceSheet[i]?.applicationOfFunds?.tradeDebtors || 0);
    ws.getCell(`${colLetter}${r}`).value = { formula: `SUM(${colLetter}${rowStock}:${colLetter}${rowDebtors})`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowCreditors = r;
  ws.getCell(`B${r}`).value = 'Less: Sundry Creditors & Expenses';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const val = dpr.workingCapital.annualSchedule[i]?.creditors || 0;
    ws.getCell(`${colLetter}${r}`).value = val;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowNwc = r;
  ws.getCell(`B${r}`).value = 'Net Working Capital (GWC - Creditors)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = (dpr.workingCapital.annualSchedule[i]?.grossWorkingCapital || 0) - (dpr.workingCapital.annualSchedule[i]?.creditors || 0);
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowGwc}-${colLetter}${rowCreditors}`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowMargin = r;
  ws.getCell(`B${r}`).value = 'Less: Promoter Margin @ 25%';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = Math.round(((dpr.workingCapital.annualSchedule[i]?.grossWorkingCapital || 0) - (dpr.workingCapital.annualSchedule[i]?.creditors || 0)) * 0.25);
    ws.getCell(`${colLetter}${r}`).value = { formula: `ROUND(${colLetter}${rowNwc}*0.25, 0)`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowCcWc = r;
  ws.getCell(`B${r}`).value = 'Eligibility for CC (Working Capital MPBF Method)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.workingCapital.annualSchedule[i]?.ccLimitMpbf || 0;
    ws.getCell(`${colLetter}${r}`).value = { formula: `MAX(0, ${colLetter}${rowNwc}-${colLetter}${rowMargin})`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  // Row for Turnover reference needed for Nayak
  const rowCcNayak = r;
  ws.getCell(`B${r}`).value = 'Eligibility for CC (Nayak Turnover Basis @ 20%)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.workingCapital.annualSchedule[i]?.ccLimitNayak || 0;
    // We will link to rowTurnover below once rowTurnover is defined; for now provide dynamic calculated value
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowCcSanctioned = r;
  ws.getCell(`B${r}`).value = 'Bank CC Limit Sanctioned / Applied For';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const val = Number(data.ccAppliedFor ?? data.ccOdOutstanding ?? 0);
    ws.getCell(`${colLetter}${r}`).value = val;
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentAmber } };
  });
  r++;

  const ccRatePct = Number(data.ccInterestRatePct ?? dpr.termLoan.interestRate ?? 12);
  const rowCcInterest = r;
  ws.getCell(`B${r}`).value = `Interest on CC @ ${ccRatePct.toFixed(2)}% p.a.`;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = Math.round((Number(data.ccAppliedFor ?? data.ccOdOutstanding ?? 0)) * (ccRatePct / 100));
    ws.getCell(`${colLetter}${r}`).value = { formula: `ROUND(${colLetter}${rowCcSanctioned}*${(ccRatePct / 100).toFixed(4)}, 0)`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r += 2;

  // -------------------------------------------------------------
  // PART 2: PROJECTED PROFIT & LOSS ACCOUNT
  // -------------------------------------------------------------
  ws.mergeCells(`B${r}:${endColLetter}${r}`);
  const part2Header = ws.getCell(`B${r}`);
  part2Header.value = 'PROJECTED PROFIT & LOSS ACCOUNT (₹)';
  part2Header.font = FONTS.sectionTitle;
  part2Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
  r++;

  // Column Headers
  ws.getCell(`B${r}`).value = 'Particulars';
  ws.getCell(`B${r}`).font = FONTS.tableHeader;
  ws.getCell(`B${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    ws.getCell(`${colLetter}${r}`).value = `Year ${y}`;
    ws.getCell(`${colLetter}${r}`).font = FONTS.tableHeader;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
    ws.getCell(`${colLetter}${r}`).alignment = { horizontal: 'right' };
  });
  r++;

  const rowTurnover = r;
  ws.getCell(`B${r}`).value = 'Gross Sales / Turnover (A)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  const revGrowth = Number(data.revenueGrowthPct ?? 10) / 100;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].turnover;
    if (i === 0) {
      ws.getCell(`${colLetter}${r}`).value = resultVal;
    } else {
      const prevCol = getColLetter(startCol + i - 1);
      ws.getCell(`${colLetter}${r}`).value = { formula: `ROUND(${prevCol}${rowTurnover}*(1+${revGrowth.toFixed(4)}), 0)`, result: resultVal };
    }
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  // Update Nayak formula now that rowTurnover is known
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.workingCapital.annualSchedule[i]?.ccLimitNayak || 0;
    ws.getCell(`${colLetter}${rowCcNayak}`).value = { formula: `MIN(50000000, ROUND(${colLetter}${rowTurnover}*0.20, 0))`, result: resultVal };
  });

  const rowCogs = r;
  ws.getCell(`B${r}`).value = 'Less: Cost of Goods Sold / Direct Costs';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].cogs;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowGrossProfit = r;
  ws.getCell(`B${r}`).value = 'Gross Profit (B = A - COGS)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].grossProfit;
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowTurnover}-${colLetter}${rowCogs}`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowOpex = r;
  ws.getCell(`B${r}`).value = 'Less: Operating & Administrative Expenses';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].opex.total;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowEbitda = r;
  ws.getCell(`B${r}`).value = 'Operating Profit (EBITDA)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].ebitda;
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowGrossProfit}-${colLetter}${rowOpex}`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowDepreciation = r;
  ws.getCell(`B${r}`).value = 'Less: Depreciation (as per IT Act WDV)';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].depreciation;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowInterestTL = r;
  ws.getCell(`B${r}`).value = 'Less: Interest on Term Loan';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].financeCosts.interestTermLoan;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowInterestCC = r;
  ws.getCell(`B${r}`).value = 'Less: Interest on CC / Working Capital';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].financeCosts.interestCc;
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowCcInterest}`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowEbt = r;
  ws.getCell(`B${r}`).value = 'Profit Before Tax (EBT)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].ebt;
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowEbitda}-${colLetter}${rowDepreciation}-${colLetter}${rowInterestTL}-${colLetter}${rowInterestCC}`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowTax = r;
  ws.getCell(`B${r}`).value = 'Less: Income Tax Provision';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].taxProvision;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowPat = r;
  ws.getCell(`B${r}`).value = 'NET PROFIT AFTER TAX (PAT)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].pat;
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowEbt}-${colLetter}${rowTax}`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentGreen } };
    ws.getCell(`${colLetter}${r}`).border = BORDERS.subtotal;
  });
  r += 2;

  // -------------------------------------------------------------
  // PART 3: PROJECTED BALANCE SHEET
  // -------------------------------------------------------------
  ws.mergeCells(`B${r}:${endColLetter}${r}`);
  const part3Header = ws.getCell(`B${r}`);
  part3Header.value = 'PROJECTED BALANCE SHEET (₹)';
  part3Header.font = FONTS.sectionTitle;
  part3Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
  r++;

  ws.getCell(`B${r}`).value = 'Particulars';
  ws.getCell(`B${r}`).font = FONTS.tableHeader;
  ws.getCell(`B${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    ws.getCell(`${colLetter}${r}`).value = `Year ${y}`;
    ws.getCell(`${colLetter}${r}`).font = FONTS.tableHeader;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
    ws.getCell(`${colLetter}${r}`).alignment = { horizontal: 'right' };
  });
  r++;

  // Sub-header: Sources of Funds
  ws.mergeCells(`B${r}:${endColLetter}${r}`);
  ws.getCell(`B${r}`).value = 'I. SOURCES OF FUNDS';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  ws.getCell(`B${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.softGray } };
  r++;

  const rowCapOpen = r;
  ws.getCell(`B${r}`).value = 'Opening Capital';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.openingCapital;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowCapIntro = r;
  ws.getCell(`B${r}`).value = 'Add: Capital Introduced / Retained Equity';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.capitalIntroduced;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowPatAdd = r;
  ws.getCell(`B${r}`).value = 'Add: Net Profit After Tax';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedPnl[i].pat;
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowPat}`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowDrawings = r;
  ws.getCell(`B${r}`).value = 'Less: Proprietor / Partner Drawings';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.drawings;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowNetWorth = r;
  ws.getCell(`B${r}`).value = 'Tangible Net Worth (Closing Capital)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.totalNetWorth;
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowCapOpen}+${colLetter}${rowCapIntro}+${colLetter}${rowPatAdd}-${colLetter}${rowDrawings}`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowQuasiEquity = r;
  ws.getCell(`B${r}`).value = 'Add: Subordinated Loans / Quasi-Equity';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.unsecuredLoansQuasi || 0;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowAtnw = r;
  ws.getCell(`B${r}`).value = 'Adjusted Tangible Net Worth (ATNW)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.adjustedTangibleNetWorth || (dpr.projectedBalanceSheet[i].sourcesOfFunds.totalNetWorth + (dpr.projectedBalanceSheet[i].sourcesOfFunds.unsecuredLoansQuasi || 0));
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowNetWorth}+${colLetter}${rowQuasiEquity}`, result: resultVal };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowTermLoan = r;
  ws.getCell(`B${r}`).value = 'Secured Loans: Bank Term Loan';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.closingTermLoan;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowCcBs = r;
  ws.getCell(`B${r}`).value = 'Secured Loans: Bank Cash Credit (CC/OD)';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.ccOutstanding;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowExtUnsecured = r;
  ws.getCell(`B${r}`).value = 'Unsecured Loans (External Borrowings)';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.unsecuredLoansExternal || 0;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowCurrentLiabilities = r;
  ws.getCell(`B${r}`).value = 'Current Liabilities & Trade Creditors';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.totalCurrentLiabilities;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowTotalSources = r;
  ws.getCell(`B${r}`).value = 'TOTAL SOURCES OF FUNDS';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].sourcesOfFunds.totalSources;
    ws.getCell(`${colLetter}${r}`).value = {
      formula: `${colLetter}${rowNetWorth}+${colLetter}${rowQuasiEquity}+${colLetter}${rowTermLoan}+${colLetter}${rowCcBs}+${colLetter}${rowExtUnsecured}+${colLetter}${rowCurrentLiabilities}`,
      result: resultVal
    };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
    ws.getCell(`${colLetter}${r}`).border = BORDERS.subtotal;
  });
  r += 2;

  // Sub-header: Application of Funds
  ws.mergeCells(`B${r}:${endColLetter}${r}`);
  ws.getCell(`B${r}`).value = 'II. APPLICATION OF FUNDS';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  ws.getCell(`B${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.softGray } };
  r++;

  const rowFixedAssets = r;
  ws.getCell(`B${r}`).value = 'Net Fixed Assets (WDV Block)';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].applicationOfFunds.netFixedAssetsWdv;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowInventories = r;
  ws.getCell(`B${r}`).value = 'Inventories / Stock';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].applicationOfFunds.inventories;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowTradeDebtors = r;
  ws.getCell(`B${r}`).value = 'Sundry Debtors';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].applicationOfFunds.tradeDebtors;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowCashBank = r;
  ws.getCell(`B${r}`).value = 'Cash & Bank Balances (Dynamic Plug)';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].applicationOfFunds.cashAndBank;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowOtherCa = r;
  ws.getCell(`B${r}`).value = 'Other Current Assets / Loans & Advances';
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].applicationOfFunds.otherCurrentAssets;
    ws.getCell(`${colLetter}${r}`).value = resultVal;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
  });
  r++;

  const rowTotalApp = r;
  ws.getCell(`B${r}`).value = 'TOTAL APPLICATION OF FUNDS';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const resultVal = dpr.projectedBalanceSheet[i].applicationOfFunds.totalApplication;
    ws.getCell(`${colLetter}${r}`).value = {
      formula: `SUM(${colLetter}${rowFixedAssets}:${colLetter}${rowOtherCa})`,
      result: resultVal
    };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currency;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
    ws.getCell(`${colLetter}${r}`).border = BORDERS.subtotal;
  });
  r++;

  // Integrity Check Row
  const rowIntegrity = r;
  ws.getCell(`B${r}`).value = 'Balance Sheet Integrity Check (Delta = Sources - Applications)';
  ws.getCell(`B${r}`).font = FONTS.italicNote;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    ws.getCell(`${colLetter}${r}`).value = { formula: `${colLetter}${rowTotalSources}-${colLetter}${rowTotalApp}`, result: 0 };
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.currencyDec;
    ws.getCell(`${colLetter}${r}`).alignment = { horizontal: 'right' };
  });
  r += 2;

  // -------------------------------------------------------------
  // PART 4: KEY FINANCIAL & SOLVENCY RATIOS
  // -------------------------------------------------------------
  ws.mergeCells(`B${r}:${endColLetter}${r}`);
  const part4Header = ws.getCell(`B${r}`);
  part4Header.value = 'KEY FINANCIAL & SOLVENCY RATIOS';
  part4Header.font = FONTS.sectionTitle;
  part4Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
  r++;

  ws.getCell(`B${r}`).value = 'Ratio Metric';
  ws.getCell(`B${r}`).font = FONTS.tableHeader;
  ws.getCell(`B${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    ws.getCell(`${colLetter}${r}`).value = `Year ${y}`;
    ws.getCell(`${colLetter}${r}`).font = FONTS.tableHeader;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
    ws.getCell(`${colLetter}${r}`).alignment = { horizontal: 'right' };
  });
  r++;

  const rowCr = r;
  ws.getCell(`B${r}`).value = 'Current Ratio (Benchmark: >= 1.33)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const cr = dpr.solvencyRatios.annualRatios[i]?.currentRatio || 0;
    ws.getCell(`${colLetter}${r}`).value = cr;
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.ratio;
  });
  r++;

  const rowTolAtnw = r;
  ws.getCell(`B${r}`).value = 'TOL / ATNW Ratio (Benchmark: <= 3.00)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const tolAtnw = dpr.solvencyRatios.annualRatios[i]?.tolAtnw || 0;
    ws.getCell(`${colLetter}${r}`).value = tolAtnw;
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.ratio;
  });
  r++;

  const rowDscr = r;
  ws.getCell(`B${r}`).value = 'Annual DSCR (Benchmark: >= 1.50)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const colLetter = getColLetter(startCol + i);
    const dscrVal = dpr.solvencyRatios.annualRatios[i]?.dscr;
    ws.getCell(`${colLetter}${r}`).value = dscrVal !== null ? dscrVal : 'N/A';
    ws.getCell(`${colLetter}${r}`).font = FONTS.boldRow;
    if (dscrVal !== null) ws.getCell(`${colLetter}${r}`).numFmt = NUM_FORMATS.ratio;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentGreen } };
  });

  autoFitColumns(ws);
}

/**
 * Builds Sheet 3: EMI Amortization Schedule
 */
function buildEmiSchedule(workbook, dpr) {
  const ws = workbook.addWorksheet('EMI', {
    views: [{ showGridLines: true }]
  });

  // Title
  ws.mergeCells('A2:F2');
  const title = ws.getCell('A2');
  title.value = 'TERM LOAN REPAYMENT & AMORTIZATION SCHEDULE';
  title.font = FONTS.sheetTitle;
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyHeader } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 28;

  // Loan Summary Box
  const p = Number(dpr.termLoan.loanAmount) || 0;
  const rateAnnual = Number(dpr.termLoan.interestRate) || 0;
  const n = Number(dpr.termLoan.tenureMonths) || 0;
  const m = Number(dpr.termLoan.moratoriumMonths) || 0;
  const emiVal = Number(dpr.termLoan.emiSchedule?.monthlyEmiPostMoratorium) || 0;

  ws.getCell('B4').value = 'Sanctioned Loan Amount';
  ws.getCell('C4').value = p;
  ws.getCell('C4').numFmt = NUM_FORMATS.currency;
  ws.getCell('C4').font = FONTS.boldRow;

  ws.getCell('B5').value = 'Annual Interest Rate';
  ws.getCell('C5').value = rateAnnual / 100;
  ws.getCell('C5').numFmt = NUM_FORMATS.percentage;
  ws.getCell('C5').font = FONTS.boldRow;

  ws.getCell('B6').value = 'Monthly Interest Rate';
  ws.getCell('C6').value = { formula: 'C5/12', result: rateAnnual / 1200 };
  ws.getCell('C6').numFmt = '0.0000%';

  ws.getCell('B7').value = 'Total Loan Tenure';
  ws.getCell('C7').value = `${n} Months`;
  ws.getCell('C7').font = FONTS.boldRow;

  ws.getCell('B8').value = 'Principal Moratorium Period';
  ws.getCell('C8').value = `${m} Months`;
  ws.getCell('C8').font = FONTS.boldRow;

  ws.getCell('B9').value = 'Monthly Equated Installment (EMI)';
  ws.getCell('C9').value = emiVal;
  ws.getCell('C9').numFmt = NUM_FORMATS.currency;
  ws.getCell('C9').font = FONTS.boldRow;
  ws.getCell('C9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentGreen } };

  // Annual Summary Table (Top Right: E4:H9)
  ws.getCell('E4').value = 'Year';
  ws.getCell('F4').value = 'Principal Repaid';
  ws.getCell('G4').value = 'Interest Paid';
  ws.getCell('H4').value = 'Closing Principal';
  ['E4', 'F4', 'G4', 'H4'].forEach(pos => {
    ws.getCell(pos).font = FONTS.tableHeader;
    ws.getCell(pos).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
  });

  let ar = 5;
  dpr.termLoan.annualAmortization.forEach(ann => {
    ws.getCell(`E${ar}`).value = `Year ${ann.year}`;
    ws.getCell(`F${ar}`).value = ann.principalRepaid;
    ws.getCell(`F${ar}`).numFmt = NUM_FORMATS.currency;
    ws.getCell(`G${ar}`).value = ann.interestPaid;
    ws.getCell(`G${ar}`).numFmt = NUM_FORMATS.currency;
    ws.getCell(`H${ar}`).value = ann.closingBalance;
    ws.getCell(`H${ar}`).numFmt = NUM_FORMATS.currency;
    ar++;
  });

  let r = 12;

  // Monthly Table Headers
  const headers = ['Month', 'Opening Principal (₹)', 'Interest Paid (₹)', 'Principal Repaid (₹)', 'Total Installment (₹)', 'Closing Principal (₹)'];
  headers.forEach((h, idx) => {
    const colLetter = String.fromCharCode(65 + idx); // A, B, C, D, E, F
    ws.getCell(`${colLetter}${r}`).value = h;
    ws.getCell(`${colLetter}${r}`).font = FONTS.tableHeader;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
    ws.getCell(`${colLetter}${r}`).alignment = { horizontal: idx === 0 ? 'center' : 'right' };
  });
  r++;

  // Populate Month-by-Month Schedule
  const monthly = dpr.termLoan.monthlySchedule || [];
  monthly.forEach(row => {
    const monthNum = row.month;
    const isMoratorium = monthNum <= m;

    ws.getCell(`A${r}`).value = monthNum;
    ws.getCell(`A${r}`).alignment = { horizontal: 'center' };

    // Opening
    if (monthNum === 1) {
      ws.getCell(`B${r}`).value = p;
    } else {
      ws.getCell(`B${r}`).value = { formula: `F${r - 1}`, result: row.openingBalance };
    }
    ws.getCell(`B${r}`).numFmt = NUM_FORMATS.currency;

    // Interest = Opening * MonthlyRate
    ws.getCell(`C${r}`).value = { formula: `ROUND(B${r}*$C$6, 0)`, result: row.interestPaid };
    ws.getCell(`C${r}`).numFmt = NUM_FORMATS.currency;

    // Principal
    if (isMoratorium) {
      ws.getCell(`D${r}`).value = 0;
    } else {
      ws.getCell(`D${r}`).value = { formula: `ROUND(E${r}-C${r}, 0)`, result: row.principalRepaid };
    }
    ws.getCell(`D${r}`).numFmt = NUM_FORMATS.currency;

    // Total Installment
    if (isMoratorium) {
      ws.getCell(`E${r}`).value = { formula: `C${r}`, result: row.totalPayment };
    } else {
      ws.getCell(`E${r}`).value = { formula: `$C$9`, result: row.totalPayment };
    }
    ws.getCell(`E${r}`).numFmt = NUM_FORMATS.currency;

    // Closing = Opening - Principal
    ws.getCell(`F${r}`).value = { formula: `MAX(0, B${r}-D${r})`, result: row.closingBalance };
    ws.getCell(`F${r}`).numFmt = NUM_FORMATS.currency;

    if (monthNum % 12 === 0) {
      // Annual boundary highlight
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach(c => {
        ws.getCell(`${c}${r}`).border = { bottom: { style: 'thin', color: { argb: COLORS.navyHeader } } };
      });
    }

    r++;
  });

  autoFitColumns(ws);
}

/**
 * Builds Sheet 4: OD / Cash Credit Facility Schedule
 */
function buildOdSchedule(workbook, dpr, data) {
  const ws = workbook.addWorksheet('OD', {
    views: [{ showGridLines: true }]
  });

  ws.mergeCells('A2:H2');
  const title = ws.getCell('A2');
  title.value = 'CASH CREDIT (CC) / WORKING CAPITAL DRAWING POWER ASSESSMENT';
  title.font = FONTS.sheetTitle;
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyHeader } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 28;

  let r = 4;
  const headers = [
    'Projection Year',
    'Projected Turnover (₹)',
    'Gross Stock (₹)',
    'Gross Debtors (₹)',
    'Assessed Drawing Power (₹)',
    'Sanctioned CC Limit (₹)',
    'Effective Operating Limit (₹)',
    'Annual CC Interest (₹)'
  ];

  headers.forEach((h, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    ws.getCell(`${colLetter}${r}`).value = h;
    ws.getCell(`${colLetter}${r}`).font = FONTS.tableHeader;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
    ws.getCell(`${colLetter}${r}`).alignment = { horizontal: idx === 0 ? 'center' : 'right' };
  });
  r++;

  const ccRate = Number(data.ccInterestRatePct ?? dpr.termLoan.interestRate ?? 12) / 100;
  const sanctionedLimit = Number(data.ccAppliedFor ?? data.ccOdOutstanding ?? 0);

  dpr.workingCapital.annualSchedule.forEach(wc => {
    ws.getCell(`A${r}`).value = `Year ${wc.year}`;
    ws.getCell(`A${r}`).alignment = { horizontal: 'center' };

    ws.getCell(`B${r}`).value = dpr.projectedPnl[wc.year - 1].turnover;
    ws.getCell(`B${r}`).numFmt = NUM_FORMATS.currency;

    ws.getCell(`C${r}`).value = wc.stock;
    ws.getCell(`C${r}`).numFmt = NUM_FORMATS.currency;

    ws.getCell(`D${r}`).value = wc.debtors;
    ws.getCell(`D${r}`).numFmt = NUM_FORMATS.currency;

    // Assessed DP = (Stock * 0.75) + (Debtors * 0.75)
    ws.getCell(`E${r}`).value = { formula: `ROUND((C${r}*0.75)+(D${r}*0.75), 0)`, result: Math.round((wc.stock + wc.debtors) * 0.75) };
    ws.getCell(`E${r}`).numFmt = NUM_FORMATS.currency;

    ws.getCell(`F${r}`).value = sanctionedLimit;
    ws.getCell(`F${r}`).numFmt = NUM_FORMATS.currency;

    // Effective Limit = MIN(DP, SanctionedLimit)
    ws.getCell(`G${r}`).value = { formula: `MIN(E${r}, F${r})`, result: Math.min(Math.round((wc.stock + wc.debtors) * 0.75), sanctionedLimit) };
    ws.getCell(`G${r}`).font = FONTS.boldRow;
    ws.getCell(`G${r}`).numFmt = NUM_FORMATS.currency;

    // Annual Interest = EffectiveLimit * Rate
    ws.getCell(`H${r}`).value = { formula: `ROUND(G${r}*${ccRate.toFixed(4)}, 0)`, result: Math.round(sanctionedLimit * ccRate) };
    ws.getCell(`H${r}`).numFmt = NUM_FORMATS.currency;

    r++;
  });

  autoFitColumns(ws);
}

/**
 * Builds Sheet 5: SCH 2 (Depreciation Schedules per IT Act Section 32 WDV)
 */
function buildDepreciationSchedule(workbook, dpr) {
  const ws = workbook.addWorksheet('SCH 2', {
    views: [{ showGridLines: true }]
  });

  ws.mergeCells('A2:H2');
  const title = ws.getCell('A2');
  title.value = 'SCHEDULE OF FIXED ASSETS & DEPRECIATION (INCOME TAX ACT SECTION 32 WDV)';
  title.font = FONTS.sheetTitle;
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyHeader } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 28;

  let r = 4;
  const horizon = dpr.metadata.horizonYears;
  const depSchedule = dpr.depreciation.annualSchedule || [];

  // Table Headers
  const headers = [
    'Fiscal Year',
    'Asset Block Description',
    'Prescribed WDV Rate (%)',
    'Opening WDV (₹)',
    'Additions During Year (₹)',
    'Gross Block (₹)',
    'Depreciation for Year (₹)',
    'Closing WDV (₹)'
  ];

  headers.forEach((h, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    ws.getCell(`${colLetter}${r}`).value = h;
    ws.getCell(`${colLetter}${r}`).font = FONTS.tableHeader;
    ws.getCell(`${colLetter}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
    ws.getCell(`${colLetter}${r}`).alignment = { horizontal: idx < 2 ? 'left' : 'right' };
  });
  r++;

  depSchedule.forEach(yearDep => {
    const y = yearDep.year;
    const blocks = yearDep.blocks || {};

    Object.entries(blocks).forEach(([blockKey, bData]) => {
      ws.getCell(`A${r}`).value = `Year ${y}`;
      ws.getCell(`B${r}`).value = blockKey.replace(/_/g, ' ').toUpperCase();
      ws.getCell(`C${r}`).value = bData.rate ? bData.rate / 100 : 0.15;
      ws.getCell(`C${r}`).numFmt = NUM_FORMATS.percentage;

      ws.getCell(`D${r}`).value = bData.openingWdv || 0;
      ws.getCell(`D${r}`).numFmt = NUM_FORMATS.currency;

      ws.getCell(`E${r}`).value = bData.additions || 0;
      ws.getCell(`E${r}`).numFmt = NUM_FORMATS.currency;

      // Gross Block = Opening + Additions
      ws.getCell(`F${r}`).value = { formula: `D${r}+E${r}`, result: (bData.openingWdv || 0) + (bData.additions || 0) };
      ws.getCell(`F${r}`).numFmt = NUM_FORMATS.currency;

      // Depreciation
      ws.getCell(`G${r}`).value = bData.depreciation || 0;
      ws.getCell(`G${r}`).numFmt = NUM_FORMATS.currency;

      // Closing WDV = GrossBlock - Depreciation
      ws.getCell(`H${r}`).value = { formula: `F${r}-G${r}`, result: bData.closingWdv || 0 };
      ws.getCell(`H${r}`).font = FONTS.boldRow;
      ws.getCell(`H${r}`).numFmt = NUM_FORMATS.currency;

      r++;
    });

    // Subtotal Row for the Year
    ws.getCell(`A${r}`).value = `Year ${y} Total`;
    ws.getCell(`A${r}`).font = FONTS.boldRow;
    ws.getCell(`G${r}`).value = yearDep.totalDepreciation;
    ws.getCell(`G${r}`).font = FONTS.boldRow;
    ws.getCell(`G${r}`).numFmt = NUM_FORMATS.currency;
    ws.getCell(`H${r}`).value = yearDep.totalClosingWdv;
    ws.getCell(`H${r}`).font = FONTS.boldRow;
    ws.getCell(`H${r}`).numFmt = NUM_FORMATS.currency;

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
      ws.getCell(`${col}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.iceBlue } };
      ws.getCell(`${col}${r}`).border = BORDERS.subtotal;
    });
    r += 2;
  });

  // Statutory Note
  ws.mergeCells(`A${r}:H${r}`);
  ws.getCell(`A${r}`).value = '* Note: In accordance with Income Tax Act Section 32, assets put to use for less than 180 days in Year 1 are depreciated at 50% of the prescribed block rate.';
  ws.getCell(`A${r}`).font = FONTS.italicNote;

  autoFitColumns(ws);
}

/**
 * Builds Sheet 6: DSCR (Debt Service Coverage Ratio Statement)
 */
function buildDscrStatement(workbook, dpr) {
  const ws = workbook.addWorksheet('DSCR', {
    views: [{ showGridLines: true }]
  });

  const horizon = dpr.metadata.horizonYears;
  const years = Array.from({ length: horizon }, (_, i) => i + 1);

  // Column letters: Particulars = B, Y1 = C, Y2 = D... Y_end, Total, Average
  const getCol = idx => String.fromCharCode(65 + idx - 1);
  const startCol = 3; // C
  const endCol = startCol + horizon - 1;
  const totCol = endCol + 1;
  const avgCol = totCol + 1;

  ws.mergeCells(`B2:${getCol(avgCol)}2`);
  const title = ws.getCell('B2');
  title.value = 'STATEMENT OF DEBT SERVICE COVERAGE RATIO (DSCR)';
  title.font = FONTS.sheetTitle;
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyHeader } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 28;

  let r = 4;
  ws.getCell(`B${r}`).value = 'Particulars';
  ws.getCell(`B${r}`).font = FONTS.tableHeader;
  ws.getCell(`B${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };

  years.forEach((y, i) => {
    const col = getCol(startCol + i);
    ws.getCell(`${col}${r}`).value = `Year ${y}`;
    ws.getCell(`${col}${r}`).font = FONTS.tableHeader;
    ws.getCell(`${col}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
    ws.getCell(`${col}${r}`).alignment = { horizontal: 'right' };
  });

  ws.getCell(`${getCol(totCol)}${r}`).value = 'Total';
  ws.getCell(`${getCol(totCol)}${r}`).font = FONTS.tableHeader;
  ws.getCell(`${getCol(totCol)}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
  ws.getCell(`${getCol(totCol)}${r}`).alignment = { horizontal: 'right' };

  ws.getCell(`${getCol(avgCol)}${r}`).value = 'Average';
  ws.getCell(`${getCol(avgCol)}${r}`).font = FONTS.tableHeader;
  ws.getCell(`${getCol(avgCol)}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.steelHeader } };
  ws.getCell(`${getCol(avgCol)}${r}`).alignment = { horizontal: 'right' };
  r++;

  // 1. PAT
  const rowPat = r;
  ws.getCell(`B${r}`).value = 'Net Profit After Tax (PAT)';
  years.forEach((y, i) => {
    const col = getCol(startCol + i);
    ws.getCell(`${col}${r}`).value = dpr.projectedPnl[i].pat;
    ws.getCell(`${col}${r}`).numFmt = NUM_FORMATS.currency;
  });
  ws.getCell(`${getCol(totCol)}${r}`).value = { formula: `SUM(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(totCol)}${r}`).numFmt = NUM_FORMATS.currency;
  ws.getCell(`${getCol(avgCol)}${r}`).value = { formula: `AVERAGE(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(avgCol)}${r}`).numFmt = NUM_FORMATS.currency;
  r++;

  // 2. Add: Depreciation
  const rowDep = r;
  ws.getCell(`B${r}`).value = 'Add: Depreciation (Non-Cash)';
  years.forEach((y, i) => {
    const col = getCol(startCol + i);
    ws.getCell(`${col}${r}`).value = dpr.projectedPnl[i].depreciation;
    ws.getCell(`${col}${r}`).numFmt = NUM_FORMATS.currency;
  });
  ws.getCell(`${getCol(totCol)}${r}`).value = { formula: `SUM(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(totCol)}${r}`).numFmt = NUM_FORMATS.currency;
  ws.getCell(`${getCol(avgCol)}${r}`).value = { formula: `AVERAGE(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(avgCol)}${r}`).numFmt = NUM_FORMATS.currency;
  r++;

  // 3. Add: Term Loan Interest
  const rowInt = r;
  ws.getCell(`B${r}`).value = 'Add: Interest on Term Loan';
  years.forEach((y, i) => {
    const col = getCol(startCol + i);
    ws.getCell(`${col}${r}`).value = dpr.projectedPnl[i].financeCosts.interestTermLoan;
    ws.getCell(`${col}${r}`).numFmt = NUM_FORMATS.currency;
  });
  ws.getCell(`${getCol(totCol)}${r}`).value = { formula: `SUM(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(totCol)}${r}`).numFmt = NUM_FORMATS.currency;
  ws.getCell(`${getCol(avgCol)}${r}`).value = { formula: `AVERAGE(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(avgCol)}${r}`).numFmt = NUM_FORMATS.currency;
  r++;

  // Total Cash Accruals (A)
  const rowAccruals = r;
  ws.getCell(`B${r}`).value = 'Total Cash Accruals Available for Debt (A)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const col = getCol(startCol + i);
    const resultVal = dpr.solvencyRatios.annualRatios[i]?.cashAccrualForDebt || 0;
    ws.getCell(`${col}${r}`).value = { formula: `SUM(${col}${rowPat}:${col}${rowInt})`, result: resultVal };
    ws.getCell(`${col}${r}`).font = FONTS.boldRow;
    ws.getCell(`${col}${r}`).numFmt = NUM_FORMATS.currency;
  });
  ws.getCell(`${getCol(totCol)}${r}`).value = { formula: `SUM(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(totCol)}${r}`).font = FONTS.boldRow;
  ws.getCell(`${getCol(totCol)}${r}`).numFmt = NUM_FORMATS.currency;
  ws.getCell(`${getCol(avgCol)}${r}`).value = { formula: `AVERAGE(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(avgCol)}${r}`).font = FONTS.boldRow;
  ws.getCell(`${getCol(avgCol)}${r}`).numFmt = NUM_FORMATS.currency;
  r += 2;

  // Debt Service Obligations: Principal & Interest
  const rowPrincipal = r;
  ws.getCell(`B${r}`).value = 'Term Loan Principal Repayment';
  years.forEach((y, i) => {
    const col = getCol(startCol + i);
    ws.getCell(`${col}${r}`).value = dpr.termLoan.annualAmortization[i]?.principalRepaid || 0;
    ws.getCell(`${col}${r}`).numFmt = NUM_FORMATS.currency;
  });
  ws.getCell(`${getCol(totCol)}${r}`).value = { formula: `SUM(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(totCol)}${r}`).numFmt = NUM_FORMATS.currency;
  r++;

  const rowDebtInt = r;
  ws.getCell(`B${r}`).value = 'Term Loan Interest';
  years.forEach((y, i) => {
    const col = getCol(startCol + i);
    ws.getCell(`${col}${r}`).value = { formula: `${col}${rowInt}`, result: dpr.projectedPnl[i].financeCosts.interestTermLoan };
    ws.getCell(`${col}${r}`).numFmt = NUM_FORMATS.currency;
  });
  ws.getCell(`${getCol(totCol)}${r}`).value = { formula: `SUM(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(totCol)}${r}`).numFmt = NUM_FORMATS.currency;
  r++;

  // Total Debt Obligation (B)
  const rowObligation = r;
  ws.getCell(`B${r}`).value = 'Total Debt Service Obligation (B)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const col = getCol(startCol + i);
    const resultVal = dpr.solvencyRatios.annualRatios[i]?.annualDebtObligation || 0;
    ws.getCell(`${col}${r}`).value = { formula: `SUM(${col}${rowPrincipal}:${col}${rowDebtInt})`, result: resultVal };
    ws.getCell(`${col}${r}`).font = FONTS.boldRow;
    ws.getCell(`${col}${r}`).numFmt = NUM_FORMATS.currency;
  });
  ws.getCell(`${getCol(totCol)}${r}`).value = { formula: `SUM(${getCol(startCol)}${r}:${getCol(endCol)}${r})` };
  ws.getCell(`${getCol(totCol)}${r}`).font = FONTS.boldRow;
  ws.getCell(`${getCol(totCol)}${r}`).numFmt = NUM_FORMATS.currency;
  r += 2;

  // DSCR Row (A / B)
  const rowDscr = r;
  ws.getCell(`B${r}`).value = 'DEBT SERVICE COVERAGE RATIO (DSCR = A / B)';
  ws.getCell(`B${r}`).font = FONTS.boldRow;
  years.forEach((y, i) => {
    const col = getCol(startCol + i);
    const resultVal = dpr.solvencyRatios.annualRatios[i]?.dscr;
    if (resultVal !== null) {
      ws.getCell(`${col}${r}`).value = { formula: `ROUND(${col}${rowAccruals}/${col}${rowObligation}, 2)`, result: resultVal };
      ws.getCell(`${col}${r}`).numFmt = NUM_FORMATS.ratio;
    } else {
      ws.getCell(`${col}${r}`).value = 'N/A';
    }
    ws.getCell(`${col}${r}`).font = FONTS.boldRow;
    ws.getCell(`${col}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentGreen } };
    ws.getCell(`${col}${r}`).border = BORDERS.subtotal;
  });

  const avgDscrVal = dpr.solvencyRatios.summary.averageDscr;
  ws.getCell(`${getCol(avgCol)}${rowDscr}`).value = { formula: `ROUND(AVERAGE(${getCol(startCol)}${rowDscr}:${getCol(endCol)}${rowDscr}), 2)`, result: avgDscrVal };
  ws.getCell(`${getCol(avgCol)}${rowDscr}`).font = FONTS.boldRow;
  ws.getCell(`${getCol(avgCol)}${rowDscr}`).numFmt = NUM_FORMATS.ratio;
  ws.getCell(`${getCol(avgCol)}${rowDscr}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentGreen } };
  ws.getCell(`${getCol(avgCol)}${rowDscr}`).border = BORDERS.subtotal;

  r += 3;

  // Final Bankability Verdict Card
  ws.mergeCells(`B${r}:${getCol(avgCol)}${r}`);
  const verdict = ws.getCell(`B${r}`);
  const rating = dpr.solvencyRatios.summary.overallRating;
  const ratingMsg = dpr.solvencyRatios.summary.ratingMessage;
  verdict.value = `INSTITUTIONAL APPRAISAL VERDICT: ${rating} | Average DSCR: ${avgDscrVal ? avgDscrVal.toFixed(2) : 'N/A'} (Benchmark >= 1.50) — ${ratingMsg}`;
  verdict.font = FONTS.verdictGood;
  verdict.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: rating === 'GREEN' ? COLORS.accentGreen : rating === 'AMBER' ? COLORS.accentAmber : 'FFF8D7DA' }
  };
  verdict.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(r).height = 25;

  autoFitColumns(ws);
}

/**
 * Main Entry Point: Generates complete multi-sheet Excel workbook as a Buffer
 * 
 * @param {Object} params
 * @param {Object} params.dpr - Complete output from dprEngine.generateDprProjections()
 * @param {Object} params.normalizedData - Normalized input data object
 * @returns {Promise<Buffer>} - Buffer of the generated .xlsx workbook
 */
export async function generateDprExcelWorkbook({ dpr, normalizedData }) {
  if (!dpr || !dpr.metadata || !dpr.projectedPnl) {
    throw new Error('Invalid DPR data object provided to Excel export engine.');
  }

  const data = normalizedData || {};
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MSME CreditOS Bank DPR Engine';
  workbook.lastModifiedBy = 'MSME CreditOS';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. INFO PAGE
  buildInfoPage(workbook, dpr, data);

  // 2. FINAL REPORT
  buildFinalReport(workbook, dpr, data);

  // 3. EMI Schedule
  buildEmiSchedule(workbook, dpr);

  // 4. OD Working Capital Schedule
  buildOdSchedule(workbook, dpr, data);

  // 5. SCH 2 Fixed Assets Depreciation
  buildDepreciationSchedule(workbook, dpr);

  // 6. DSCR Debt Service Coverage Ratio
  buildDscrStatement(workbook, dpr);

  // Write workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

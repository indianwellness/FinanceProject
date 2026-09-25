/**
 * CA-Prepared MSME DPR & CMA Excel Parser
 * 
 * Ingests financial projection workbooks (e.g. CA CMA templates, bank project reports),
 * parses sheets and schedules, normalizes currency representations, extracts baseline figures,
 * and compiles into the normalized Convergence Point data object.
 */

import xlsx from 'xlsx';
import { validateAndNormalizeConvergenceData } from './convergenceSchema.js';

/**
 * Normalizes any Excel cell value into a clean number.
 * Handles commas, spaces, currency symbols, percentages, and bracketed negative numbers like "(49,418)".
 * 
 * @param {*} val - Raw cell value
 * @returns {number} Clean numerical value
 */
export function parseNumberCell(val) {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;

  let str = String(val).trim();
  if (str === '' || str === '-' || str === '-   ' || str === 'NA' || str === 'N/A') {
    return 0;
  }

  // Handle percentages
  if (str.endsWith('%')) {
    const num = parseFloat(str.replace('%', '').trim());
    return Number.isFinite(num) ? num : 0;
  }

  // Check for negative numbers in brackets e.g. "(49,418)" or "-12,354.54"
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1);
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1);
  }

  // Strip commas, spaces, and currency symbols
  const cleaned = str.replace(/[₹$,\s]/g, '');
  const parsed = parseFloat(cleaned);

  if (!Number.isFinite(parsed)) return 0;
  return isNegative ? -parsed : parsed;
}

/**
 * Cleans a label string for fuzzy semantic matching.
 */
function normalizeLabel(label) {
  return String(label ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds a row by matching any of the candidate keywords.
 */
function findRowByKeywords(rows, keywords = []) {
  return rows.find(row => {
    if (!row || !row[0]) return false;
    const label = normalizeLabel(row[0]);
    return keywords.some(k => label.includes(k));
  });
}

/**
 * Parses an uploaded Excel workbook buffer or file path.
 * 
 * @param {Buffer|string} input - Excel file Buffer or file path string
 * @param {Object} [options={}] - Optional parsing overrides
 * @returns {Object} { rawExtracted, normalizedData, validation }
 */
export function parseDprExcelWorkbook(input, options = {}) {
  const workbook = typeof input === 'string'
    ? xlsx.readFile(input, { cellFormula: true, cellDates: true })
    : xlsx.read(input, { type: 'buffer', cellFormula: true, cellDates: true });

  const rawExtracted = {
    entityName: '',
    entityType: 'proprietorship',
    loanAmount: 0,
    interestRate: 12.0,
    tenureMonths: 60,
    moratoriumMonths: 0,
    ccAppliedFor: 0,
    ccOdOutstanding: 0,
    ccInterestRatePct: 12.0,
    netTurnover: 0,
    grossProfit: 0,
    cogs: 0,
    opex: 0,
    otherIncome: 0,
    capital: 0,
    reservesSurplus: 0,
    fixedAssets: {},
    newAssetAdditions: {},
    tradeDebtors: 0,
    inventories: 0,
    tradeCreditors: 0,
    cashBank: 0,
    otherCurrentLiabilities: 0,
    loansAdvancesCurrent: 0,
    unsecuredLoansQuasiEquity: 0,
    unsecuredLoansExternal: 0,
    revenueGrowthPct: 10.0,
    opexGrowthPct: 8.0,
    gpMarginPct: null,
    horizonYears: 5
  };

  const sheets = workbook.Sheets;
  const sheetNames = workbook.SheetNames;

  // ---------------------------------------------------------
  // 1. PARSE INFO PAGE (Metadata & Facilities)
  // ---------------------------------------------------------
  const infoSheetName = sheetNames.find(s => normalizeLabel(s).includes('info')) ?? sheetNames[0];
  if (infoSheetName && sheets[infoSheetName]) {
    const infoData = xlsx.utils.sheet_to_json(sheets[infoSheetName], { header: 1, raw: false });
    infoData.forEach(row => {
      if (!row || row.length < 2) return;
      const fullRowText = row.map(c => String(c ?? '').trim()).join(' ');
      const normText = normalizeLabel(fullRowText);

      // Borrower / Business name
      if (normText.includes('name of business') || normText.includes('business name') || normText.includes('company name')) {
        const namePart = row.slice(2).find(c => String(c ?? '').trim().length > 2) ?? row[1];
        if (namePart) rawExtracted.entityName = String(namePart).trim();
      }

      // Facility requested
      if (normText.includes('facilities required') || normText.includes('term loan of')) {
        const text = String(fullRowText);
        const lacsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lacs|lakhs|lakh|lac)/i);
        const crMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i);
        const absMatch = text.match(/rs\.?\s*([\d,]+)/i);

        if (lacsMatch) {
          rawExtracted.loanAmount = parseFloat(lacsMatch[1]) * 100000;
        } else if (crMatch) {
          rawExtracted.loanAmount = parseFloat(crMatch[1]) * 10000000;
        } else if (absMatch) {
          rawExtracted.loanAmount = parseNumberCell(absMatch[1]);
        }
      }

      // Entity type inference from text
      if (normText.includes('proprietor') || normText.includes('proprietorship')) {
        rawExtracted.entityType = 'proprietorship';
      } else if (normText.includes('partnership') || normText.includes('llp')) {
        rawExtracted.entityType = 'partnership';
      } else if (normText.includes('pvt ltd') || normText.includes('limited') || normText.includes('corporate')) {
        rawExtracted.entityType = 'pvt_ltd';
      }
    });
  }

  // ---------------------------------------------------------
  // 2. PARSE EMI SHEET (Loan Schedule Parameters)
  // ---------------------------------------------------------
  const emiSheetName = sheetNames.find(s => normalizeLabel(s) === 'emi');
  if (emiSheetName && sheets[emiSheetName]) {
    const emiData = xlsx.utils.sheet_to_json(sheets[emiSheetName], { header: 1, raw: false });
    emiData.forEach(row => {
      if (!row || row.length < 2) return;
      const label = normalizeLabel(row[0] ?? row[1]);
      const val = row[2] ?? row[1];

      if (label.includes('loan amount')) {
        const amt = parseNumberCell(val);
        if (amt > 0) rawExtracted.loanAmount = amt;
      }
      if (label.includes('rate of interest per annum') || label.includes('interest rate')) {
        const rate = parseNumberCell(val);
        if (rate > 0) rawExtracted.interestRate = rate;
      }
      if (label.includes('no of installment') || label.includes('tenure') || label.includes('installments')) {
        const inst = parseNumberCell(val);
        if (inst > 0) rawExtracted.tenureMonths = inst;
      }
    });
  }

  // ---------------------------------------------------------
  // 3. PARSE FINAL REPORT / MASTER SHEET (P&L, Balance Sheet, CC)
  // ---------------------------------------------------------
  const masterSheetName = sheetNames.find(s => {
    const n = normalizeLabel(s);
    return n.includes('final') || n.includes('cma') || n.includes('report') || n.includes('master');
  }) ?? sheetNames[0];

  if (masterSheetName && sheets[masterSheetName]) {
    const rows = xlsx.utils.sheet_to_json(sheets[masterSheetName], { header: 1, raw: false });

    // Identify Baseline column:
    // Look for header row that has "provisional" or "audited"
    let baselineColIdx = 1; // Default to Column B
    let projectedColIndices = [];

    for (let r = 0; r < Math.min(30, rows.length); r++) {
      const row = rows[r];
      if (!row) continue;
      for (let c = 1; c < row.length; c++) {
        const cell = normalizeLabel(row[c]);
        if (cell.includes('provisional') || cell.includes('audited') || cell.includes('actual')) {
          baselineColIdx = c;
        } else if (cell.includes('projected')) {
          projectedColIndices.push(c);
        }
      }
      if (projectedColIndices.length > 0) break;
    }

    if (projectedColIndices.length > 0) {
      rawExtracted.horizonYears = projectedColIndices.length;
    }

    // Extract Entity Name from Sheet Header if not yet found
    if (!rawExtracted.entityName) {
      for (let r = 0; r < 5; r++) {
        const candidate = String(rows[r]?.[0] ?? '').trim();
        if (candidate.startsWith('M/S') || candidate.startsWith('M/s')) {
          rawExtracted.entityName = candidate;
          break;
        }
      }
    }

    // Section slicing to prevent collisions between CC table, P&L, and Balance Sheet
    const pnlHeaderIdx = rows.findIndex(r => r && r[0] && normalizeLabel(r[0]).includes('projected profit'));
    const bsHeaderIdx = rows.findIndex(r => r && r[0] && normalizeLabel(r[0]).includes('projected balance sheet'));

    const pnlRows = pnlHeaderIdx !== -1
      ? rows.slice(pnlHeaderIdx, bsHeaderIdx !== -1 ? bsHeaderIdx : undefined)
      : rows;

    const bsRows = bsHeaderIdx !== -1
      ? rows.slice(bsHeaderIdx)
      : rows;

    // --- P&L EXTRACTION (from pnlRows) ---
    const turnoverRow = findRowByKeywords(pnlRows, ['sale of', 'turnover', 'gross sales', 'revenue from']);
    if (turnoverRow) {
      rawExtracted.netTurnover = parseNumberCell(turnoverRow[baselineColIdx]);
    }

    const purchasesRow = findRowByKeywords(pnlRows, ['purchases of goods', 'purchases']);
    const labourRow = findRowByKeywords(pnlRows, ['labour charges', 'direct wages', 'direct expenses']);
    if (purchasesRow) {
      const purch = parseNumberCell(purchasesRow[baselineColIdx]);
      const labour = labourRow ? parseNumberCell(labourRow[baselineColIdx]) : 0;
      rawExtracted.cogs = purch + labour;
    }

    const gpRow = findRowByKeywords(pnlRows, ['gross profit']);
    if (gpRow) {
      rawExtracted.grossProfit = parseNumberCell(gpRow[baselineColIdx]);
    } else if (rawExtracted.netTurnover > 0 && rawExtracted.cogs > 0) {
      rawExtracted.grossProfit = rawExtracted.netTurnover - rawExtracted.cogs;
    }

    const opexRow = findRowByKeywords(pnlRows, ['administration selling', 'operating expenses', 'total operating']);
    if (opexRow) {
      rawExtracted.opex = parseNumberCell(opexRow[baselineColIdx]);
    }

    // Growth Rate detection across projected columns
    const growthRow = findRowByKeywords(rows, ['growth']);
    if (growthRow && projectedColIndices.length > 0) {
      const gVal = parseNumberCell(growthRow[projectedColIndices[0]]);
      if (gVal > 0) rawExtracted.revenueGrowthPct = gVal;
    }

    // --- BALANCE SHEET EXTRACTION (from bsRows) ---
    const capitalRow = findRowByKeywords(bsRows, ['capital account', 'proprietor capital', 'share capital']);
    if (capitalRow) {
      rawExtracted.capital = parseNumberCell(capitalRow[baselineColIdx]);
    }

    const tlRow = findRowByKeywords(bsRows, ['bank term loan', 'term loan']);
    if (tlRow) {
      const tl = parseNumberCell(tlRow[baselineColIdx]);
      if (tl > 0 && rawExtracted.loanAmount === 0) rawExtracted.loanAmount = tl;
    }

    const faRow = findRowByKeywords(bsRows, ['fixed assets']);
    if (faRow) {
      const netFa = parseNumberCell(faRow[baselineColIdx]);
      rawExtracted.fixedAssets.general = netFa;
    }

    const debtorsRow = findRowByKeywords(bsRows, ['debtors', 'sundry debtors', 'trade receivables']);
    if (debtorsRow) {
      rawExtracted.tradeDebtors = parseNumberCell(debtorsRow[baselineColIdx]);
    }

    const stockRow = findRowByKeywords(bsRows, ['stock finished', 'stock in trade', 'inventories', 'closing stock']);
    if (stockRow) {
      rawExtracted.inventories = parseNumberCell(stockRow[baselineColIdx]);
    }

    const cashRow = findRowByKeywords(bsRows, ['cash bank', 'cash and bank', 'bank balance']);
    if (cashRow) {
      rawExtracted.cashBank = parseNumberCell(cashRow[baselineColIdx]);
    }

    const otherAssetsRow = findRowByKeywords(bsRows, ['other current assets', 'loans advances']);
    if (otherAssetsRow) {
      rawExtracted.loansAdvancesCurrent = parseNumberCell(otherAssetsRow[baselineColIdx]);
    }

    const creditorsRow = findRowByKeywords(bsRows, ['sundry creditors', 'trade creditors']);
    if (creditorsRow) {
      rawExtracted.tradeCreditors = parseNumberCell(creditorsRow[baselineColIdx]);
    }

    const otherLiabRow = findRowByKeywords(bsRows, ['total current liabilities', 'duties taxes']);
    if (otherLiabRow) {
      const totCl = parseNumberCell(otherLiabRow[baselineColIdx]);
      if (totCl > rawExtracted.tradeCreditors) {
        rawExtracted.otherCurrentLiabilities = totCl - rawExtracted.tradeCreditors;
      }
    }

    // --- CC ELIGIBILITY ROW EXTRACTION ---
    const ccAppliedRow = findRowByKeywords(rows, ['cc applied for']);
    if (ccAppliedRow) {
      const cc = parseNumberCell(ccAppliedRow[projectedColIndices[0] ?? baselineColIdx + 1]);
      if (cc > 0) rawExtracted.ccAppliedFor = cc;
    }
  }

  // ---------------------------------------------------------
  // 4. PARSE DEPRECIATION SCHEDULE (Block Breakdown & Additions)
  // ---------------------------------------------------------
  const depSheetName = sheetNames.find(s => {
    const n = normalizeLabel(s);
    return n.includes('depreciation') || n.includes('sch 2') || n.includes('schedule 2');
  });

  if (depSheetName && sheets[depSheetName]) {
    const depData = xlsx.utils.sheet_to_json(sheets[depSheetName], { header: 1, raw: false });
    const blockTypes = ['furniture', 'machinery', 'equipments', 'computers', 'software', 'vehicles', 'buildings'];

    let currentBlock = null;

    depData.forEach(row => {
      if (!row || !row[0]) return;
      const text = normalizeLabel(row[0]);

      // Check if row declares a new asset block
      const foundBlock = blockTypes.find(b => text.includes(b));
      if (foundBlock) {
        currentBlock = foundBlock === 'equipments' ? 'machinery' : foundBlock;
        if (!rawExtracted.fixedAssets[currentBlock]) {
          rawExtracted.fixedAssets[currentBlock] = 0;
        }
        if (!rawExtracted.newAssetAdditions[currentBlock]) {
          rawExtracted.newAssetAdditions[currentBlock] = 0;
        }
      }

      if (currentBlock) {
        if (text.includes('opening balance') || text.includes('written down value')) {
          const opening = parseNumberCell(row[1]);
          if (opening > 0 && !rawExtracted.fixedAssets[currentBlock]) {
            rawExtracted.fixedAssets[currentBlock] = opening;
          }
        }
        if (text.includes('additions during the year') || text.includes('additions')) {
          const add = parseNumberCell(row[2] ?? row[1]);
          if (add > 0) {
            rawExtracted.newAssetAdditions[currentBlock] = add;
          }
        }
      }
    });
  }

  // ---------------------------------------------------------
  // 5. VALIDATE & NORMALIZE INTO CONVERGENCE DATA OBJECT
  // ---------------------------------------------------------
  const validation = validateAndNormalizeConvergenceData(rawExtracted);

  return {
    rawExtracted,
    normalizedData: validation.normalizedData,
    validation
  };
}

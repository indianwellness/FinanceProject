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
 * Robust against Indian accounting conventions:
 * - Currency prefixes: '₹', '$', 'Rs.', 'Rs', 'INR', 'inr'
 * - Accounting brackets: '(49,418)', '₹ (50,000)', 'Rs. (50,000)'
 * - Dashes, empty strings, percentages, and commas
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

  // 1. Strip currency prefixes first
  str = str.replace(/^(?:₹|\$|rs\.?|inr)\s*/i, '').trim();

  // 2. Check for negative numbers in brackets e.g. "(49,418)" or "-12,354.54"
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1).trim();
  }

  // 3. Strip remaining currency markers, commas, and whitespace
  const cleaned = str.replace(/[₹$,\s]|(?:rs\.?|inr)/gi, '');
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
 * Checks if a given row contains any of the target keywords in its leading columns (Col 0, 1, or 2).
 * Supports sheets that use Column A for Serial Numbers (e.g. 1, 2, (i)).
 */
function rowHasKeywords(row, keywords = []) {
  if (!row || !Array.isArray(row)) return false;
  for (let c = 0; c <= Math.min(2, row.length - 1); c++) {
    if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
      const label = normalizeLabel(row[c]);
      if (keywords.some(k => label.includes(k))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Finds a row by matching keywords across leading columns.
 */
function findRowByKeywords(rows, keywords = []) {
  if (!rows || !Array.isArray(rows)) return null;
  return rows.find(row => rowHasKeywords(row, keywords)) ?? null;
}

/**
 * Detects unit scale from header texts or numerical magnitude.
 * E.g. "(₹ in Lakhs)", "(Rs. in Lacs)", "(in Crores)" or low numeric turnover.
 */
function detectScaleAndMultiplier(rows, initialTurnover) {
  let multiplier = 1;
  let unit = 'absolute';

  // 1. Textual inspection in header rows
  for (let r = 0; r < Math.min(25, rows.length); r++) {
    const row = rows[r];
    if (!row) continue;
    const fullText = row.map(c => String(c ?? '')).join(' ').toLowerCase();

    if (fullText.includes('in lakh') || fullText.includes('in lac') || fullText.includes('rs in lac') || fullText.includes('rs. in lac')) {
      return { multiplier: 100000, unit: 'lakhs' };
    }
    if (fullText.includes('in crore') || fullText.includes('in cr') || fullText.includes('rs. in cr')) {
      return { multiplier: 10000000, unit: 'crores' };
    }
    if (fullText.includes('in thousand') || fullText.includes('in th.')) {
      return { multiplier: 1000, unit: 'thousands' };
    }
  }

  // 2. Magnitude heuristic:
  // If commercial turnover is between 1 and 10,000, it is virtually guaranteed to be in Lakhs (e.g. 746.45 = ₹7.46 Cr)
  if (initialTurnover > 0 && initialTurnover < 10000) {
    return { multiplier: 100000, unit: 'lakhs' };
  }

  return { multiplier, unit };
}

/**
 * Parses an uploaded Excel workbook buffer or file path.
 * 
 * @param {Buffer|string} input - Excel file Buffer or file path string
 * @param {Object} [options={}] - Optional parsing overrides
 * @returns {Object} { rawExtracted, normalizedData, validation }
 */
export function parseDprExcelWorkbook(input, options = {}) {
  try {
    if (!input) {
      throw new Error('No input provided to Excel parser.');
    }

    const workbook = typeof input === 'string'
      ? xlsx.readFile(input, { cellFormula: true, cellDates: true })
      : xlsx.read(input, { type: 'buffer', cellFormula: true, cellDates: true });

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Corrupted or empty Excel workbook: No sheets detected.');
    }

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
      horizonYears: 5,
      amountsUnit: 'absolute'
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
        } else if (normText.includes('llp')) {
          rawExtracted.entityType = 'llp';
        } else if (normText.includes('partnership')) {
          rawExtracted.entityType = 'partnership';
        } else if (normText.includes('pvt ltd') || normText.includes('limited') || normText.includes('corporate')) {
          rawExtracted.entityType = 'pvt_ltd';
        }
      });
    }

    // ---------------------------------------------------------
    // 2. PARSE EMI SHEET (Loan Schedule Parameters)
    // ---------------------------------------------------------
    const emiSheetName = sheetNames.find(s => {
      const n = normalizeLabel(s);
      return n.includes('emi') || n.includes('amort') || n.includes('repay');
    });
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
            if (!projectedColIndices.includes(c)) projectedColIndices.push(c);
          }
        }
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

      // Safe section slicing (prevents inverted slice bugs if Balance Sheet precedes P&L)
      const pnlHeaderIdx = rows.findIndex(r => rowHasKeywords(r, ['projected profit', 'profit and loss', 'p&l', 'trading account']));
      const bsHeaderIdx = rows.findIndex(r => rowHasKeywords(r, ['projected balance sheet', 'balance sheet']));

      let pnlRows = rows;
      let bsRows = rows;

      if (pnlHeaderIdx !== -1 && bsHeaderIdx !== -1) {
        if (pnlHeaderIdx < bsHeaderIdx) {
          pnlRows = rows.slice(pnlHeaderIdx, bsHeaderIdx);
          bsRows = rows.slice(bsHeaderIdx);
        } else {
          // Balance Sheet precedes P&L
          bsRows = rows.slice(bsHeaderIdx, pnlHeaderIdx);
          pnlRows = rows.slice(pnlHeaderIdx);
        }
      } else if (pnlHeaderIdx !== -1) {
        pnlRows = rows.slice(pnlHeaderIdx);
      } else if (bsHeaderIdx !== -1) {
        bsRows = rows.slice(bsHeaderIdx);
      }

      // --- P&L EXTRACTION ---
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

      // --- BALANCE SHEET EXTRACTION ---
      const capitalRow = findRowByKeywords(bsRows, ['capital account', 'proprietor capital', 'share capital']);
      if (capitalRow) {
        rawExtracted.capital = parseNumberCell(capitalRow[baselineColIdx]);
      }

      const tlRow = findRowByKeywords(bsRows, ['bank term loan', 'term loan']);
      if (tlRow) {
        const tl = parseNumberCell(tlRow[baselineColIdx]);
        if (tl > 0 && rawExtracted.loanAmount === 0) rawExtracted.loanAmount = tl;
      }

      const faRow = findRowByKeywords(bsRows, ['fixed assets', 'net fixed assets', 'net block']);
      if (faRow) {
        const netFa = parseNumberCell(faRow[baselineColIdx]);
        if (netFa > 0) rawExtracted.fixedAssets.general = netFa;
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

      const totClRow = findRowByKeywords(bsRows, ['total current liabilities']);
      if (totClRow) {
        const totCl = parseNumberCell(totClRow[baselineColIdx]);
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

      // ---------------------------------------------------------
      // 4. PARSE DEPRECIATION SCHEDULE (Block Breakdown & Additions)
      // ---------------------------------------------------------
      // Check for standalone depreciation sheet (avoiding capital account sheets)
      const depSheetName = sheetNames.find(s => {
        const n = normalizeLabel(s);
        return (n.includes('depreciation') || n.includes('fixed asset')) && !n.includes('cap');
      });

      // Data source for depreciation schedule: separate sheet or master sheet rows
      const depRows = depSheetName && sheets[depSheetName]
        ? xlsx.utils.sheet_to_json(sheets[depSheetName], { header: 1, raw: false })
        : rows;

      const blockTypes = ['furniture', 'machinery', 'equipments', 'computers', 'software', 'vehicles', 'buildings'];
      let currentBlock = null;
      let parsedSpecificBlocksCount = 0;

      depRows.forEach(row => {
        if (!row || !Array.isArray(row)) return;
        const text = normalizeLabel(row[0] ?? row[1] ?? '');

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
            const opening = parseNumberCell(row[1] ?? row[2]);
            if (opening > 0 && !rawExtracted.fixedAssets[currentBlock]) {
              rawExtracted.fixedAssets[currentBlock] = opening;
              parsedSpecificBlocksCount++;
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

      // Avoid Fixed Asset Double-Counting:
      // If specific asset blocks were successfully parsed from schedule, remove the generic balance sheet entry!
      if (parsedSpecificBlocksCount > 0 && rawExtracted.fixedAssets.general !== undefined) {
        delete rawExtracted.fixedAssets.general;
      }

      // ---------------------------------------------------------
      // 5. UNIT SCALE DETECTION & MULTIPLIER NORMALIZATION
      // ---------------------------------------------------------
      const scaleInfo = detectScaleAndMultiplier(rows, rawExtracted.netTurnover);
      rawExtracted.amountsUnit = scaleInfo.unit;

      if (scaleInfo.multiplier > 1) {
        const m = scaleInfo.multiplier;
        rawExtracted.netTurnover *= m;
        rawExtracted.cogs *= m;
        rawExtracted.grossProfit *= m;
        rawExtracted.opex *= m;
        rawExtracted.capital *= m;
        rawExtracted.reservesSurplus *= m;
        rawExtracted.tradeDebtors *= m;
        rawExtracted.inventories *= m;
        rawExtracted.tradeCreditors *= m;
        rawExtracted.cashBank *= m;
        rawExtracted.loansAdvancesCurrent *= m;
        rawExtracted.otherCurrentLiabilities *= m;

        if (rawExtracted.loanAmount > 0 && rawExtracted.loanAmount < 1000) {
          rawExtracted.loanAmount *= m;
        }
        if (rawExtracted.ccAppliedFor > 0 && rawExtracted.ccAppliedFor < 1000) {
          rawExtracted.ccAppliedFor *= m;
        }

        Object.keys(rawExtracted.fixedAssets).forEach(k => {
          rawExtracted.fixedAssets[k] *= m;
        });
        Object.keys(rawExtracted.newAssetAdditions).forEach(k => {
          rawExtracted.newAssetAdditions[k] *= m;
        });
      }
    }

    // ---------------------------------------------------------
    // 6. VALIDATE & NORMALIZE INTO CONVERGENCE DATA OBJECT
    // ---------------------------------------------------------
    const validation = validateAndNormalizeConvergenceData(rawExtracted);

    if (rawExtracted.amountsUnit !== 'absolute') {
      validation.warnings.push(`Amounts detected in ${rawExtracted.amountsUnit.toUpperCase()} and normalized to absolute Rupees.`);
    }

    return {
      rawExtracted,
      normalizedData: validation.normalizedData,
      validation
    };
  } catch (err) {
    return {
      rawExtracted: null,
      normalizedData: null,
      validation: {
        isValid: false,
        normalizedData: null,
        errors: [`Excel parsing failed: ${err.message}`],
        warnings: [],
        confidenceScore: 0.0
      }
    };
  }
}

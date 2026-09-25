/**
 * Indian Income Tax Engine (FY 2025-26)
 * Implements entity-type branching:
 * - Sole Proprietorship: Individual New Regime progressive slabs (Budget 2025)
 *   with Section 87A rebate up to ₹12,00,000 and marginal relief.
 * - Partnership / LLP: Flat 30% + 4% Cess (+ 12% surcharge > 1 Cr)
 * - Private Limited: Flat 25% standard (+ 4% Cess) or 22% under Section 115BAA (+ 10% surcharge + 4% Cess)
 */

const toSafePositiveNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
};

const PROPRIETORSHIP_ALIASES = [
  'proprietorship',
  'individual',
  'sole_proprietorship',
  'proprietor',
  'sole proprietorship',
  'sole-proprietorship'
];

/**
 * Computes individual progressive tax under the FY 2025-26 New Tax Regime.
 * Budget 2025 Slabs:
 * - Up to ₹4,00,000: Nil
 * - ₹4,00,001 to ₹8,00,000: 5%
 * - ₹8,00,001 to ₹12,00,000: 10%
 * - ₹12,00,001 to ₹16,00,000: 15%
 * - ₹16,00,001 to ₹20,00,000: 20%
 * - ₹20,00,001 to ₹24,00,000: 25%
 * - Above ₹24,00,000: 30%
 * 
 * Section 87A Rebate:
 * Taxable income up to ₹12,00,000 qualifies for full tax rebate (Zero tax).
 * Marginal relief applies if income slightly exceeds ₹12,00,000.
 * 
 * @param {number} income - Net taxable business income
 * @returns {number} Basic tax before cess
 */
function computeProprietorshipSlabs(income) {
  if (income <= 400000) return 0;

  // Full rebate under Section 87A for income up to ₹12 Lakhs in Budget 2025 New Regime
  if (income <= 1200000) {
    return 0;
  }

  let rawTax = 0;

  if (income > 2400000) {
    rawTax += (income - 2400000) * 0.30;
    rawTax += (2400000 - 2000000) * 0.25;
    rawTax += (2000000 - 1600000) * 0.20;
    rawTax += (1600000 - 1200000) * 0.15;
    rawTax += (1200000 - 800000) * 0.10;
    rawTax += (800000 - 400000) * 0.05;
  } else if (income > 2000000) {
    rawTax += (income - 2000000) * 0.25;
    rawTax += (2000000 - 1600000) * 0.20;
    rawTax += (1600000 - 1200000) * 0.15;
    rawTax += (1200000 - 800000) * 0.10;
    rawTax += (800000 - 400000) * 0.05;
  } else if (income > 1600000) {
    rawTax += (income - 1600000) * 0.20;
    rawTax += (1600000 - 1200000) * 0.15;
    rawTax += (1200000 - 800000) * 0.10;
    rawTax += (800000 - 400000) * 0.05;
  } else if (income > 1200000) {
    rawTax += (income - 1200000) * 0.15;
    rawTax += (1200000 - 800000) * 0.10;
    rawTax += (800000 - 400000) * 0.05;
  }

  // Section 87A Marginal Relief Check:
  // Tax payable cannot exceed the income exceeding ₹12,00,000
  const excessOver12L = income - 1200000;
  if (excessOver12L > 0 && rawTax > excessOver12L) {
    return excessOver12L;
  }

  return rawTax;
}

/**
 * Calculates corporate, partnership, or proprietorship tax and Profit After Tax (PAT).
 * 
 * @param {Object} params
 * @param {number} params.taxableIncome - Earnings Before Tax (EBT)
 * @param {string} [params.entityType='proprietorship'] - 'proprietorship' | 'partnership' | 'llp' | 'pvt_ltd'
 * @param {boolean} [params.isSection115BAA=false] - If true, 22% corporate base rate applies
 * @returns {Object} { taxableIncome, baseTax, surcharge, cess, taxProvision, pat, effectiveRatePct }
 */
export function calculateTax({
  taxableIncome,
  entityType = 'proprietorship',
  isSection115BAA = false
}) {
  const rawEbt = Number(taxableIncome);
  const ebt = toSafePositiveNumber(rawEbt, 0);

  if (ebt <= 0) {
    return {
      taxableIncome: ebt,
      baseTax: 0,
      surcharge: 0,
      cess: 0,
      taxProvision: 0,
      pat: Number.isFinite(rawEbt) ? rawEbt : 0, // preserve losses if negative
      effectiveRatePct: 0
    };
  }

  const type = String(entityType ?? 'proprietorship').toLowerCase().trim();
  let baseTax = 0;
  let surcharge = 0;

  // Gap 6 Fix: Check all proprietorship / individual aliases
  if (PROPRIETORSHIP_ALIASES.includes(type)) {
    baseTax = computeProprietorshipSlabs(ebt);

    // Individual Surcharge Ladder (New Regime capped at 25%):
    if (ebt > 20000000) {
      surcharge = baseTax * 0.25;
    } else if (ebt > 10000000) {
      surcharge = baseTax * 0.15;
    } else if (ebt > 5000000) {
      surcharge = baseTax * 0.10;
    }
  } else if (type === 'partnership' || type === 'llp') {
    // Partnership firms: flat 30%
    baseTax = ebt * 0.30;
    if (ebt > 10000000) {
      surcharge = baseTax * 0.12;
    }
  } else if (type === 'pvt_ltd' || type === 'corporate' || type === 'company') {
    if (isSection115BAA) {
      // Section 115BAA: 22% base + mandatory 10% surcharge
      baseTax = ebt * 0.22;
      surcharge = baseTax * 0.10;
    } else {
      // Standard MSME company: 25% (turnover < ₹400 Cr)
      baseTax = ebt * 0.25;
      if (ebt > 100000000) {
        surcharge = baseTax * 0.12;
      } else if (ebt > 10000000) {
        surcharge = baseTax * 0.07;
      }
    }
  } else {
    // Default fallback: 25% standard corporate rate
    baseTax = ebt * 0.25;
  }

  // Mandatory 4% Health & Education Cess on (Tax + Surcharge)
  const cess = (baseTax + surcharge) * 0.04;
  const totalTax = Math.round((baseTax + surcharge + cess) * 100) / 100;
  const pat = Math.round((ebt - totalTax) * 100) / 100;
  const effectiveRate = ebt > 0 ? (totalTax / ebt) * 100 : 0;

  return {
    taxableIncome: Math.round(ebt * 100) / 100,
    baseTax: Math.round(baseTax * 100) / 100,
    surcharge: Math.round(surcharge * 100) / 100,
    cess: Math.round(cess * 100) / 100,
    taxProvision: totalTax,
    pat,
    effectiveRatePct: Math.round(effectiveRate * 100) / 100
  };
}

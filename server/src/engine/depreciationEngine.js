/**
 * Fixed Asset Depreciation Engine
 * Implements Income Tax Act 2025 (Section 32) Written Down Value (WDV) Block of Assets Method,
 * including statutory rates and the 180-day half-rate rule on asset additions.
 */

export const STANDARD_WDV_RATES = {
  furniture: 0.10,    // 10% Furniture & Fittings (including electrical)
  machinery: 0.15,    // 15% General Plant & Machinery
  vehicles: 0.15,     // 15% Motor Vehicles (not for hire)
  computers: 0.40,    // 40% Computers, Laptops & Software
  intangibles: 0.25,  // 25% Patents, Trademarks, Licenses
  buildings: 0.10     // 10% Commercial Non-Residential Buildings
};

const toSafeNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Calculates multi-year WDV depreciation schedule across statutory asset blocks.
 * 
 * @param {Object} params
 * @param {Object} params.initialAssets - Initial WDV / gross values per block { furniture: { net: 150000, gross: 200000 }, machinery: 425000 }
 * @param {Object} [params.additionsPerYear={}] - Asset additions per year { 1: { machinery: 3000000 }, 2: { ... } }
 * @param {number} [params.horizonYears=5] - Number of projection years (e.g. 5 or 10)
 * @param {boolean|Object} [params.isAdditionsUnder180Days=false] - If true, 50% rate applies to Year 1 additions; or an object per year { 1: true, 2: false }
 * @param {Object} [params.customRates={}] - Optional override for block rates
 * @returns {Array} Annual depreciation breakdown [{ year, blocks, totalDepreciation, totalClosingWdv, totalGrossBlock }]
 */
export function calculateDepreciationSchedule({
  initialAssets = {},
  additionsPerYear = {},
  horizonYears = 5,
  isAdditionsUnder180Days = false,
  customRates = {}
}) {
  const rates = { ...STANDARD_WDV_RATES, ...customRates };

  // Collect all block keys from rates, initial assets, AND additionsPerYear (Bug 1 fix)
  const additionBlocks = Object.values(additionsPerYear ?? {}).flatMap(yearObj => 
    typeof yearObj === 'object' && yearObj !== null ? Object.keys(yearObj) : []
  );

  const allBlocks = Array.from(new Set([
    ...Object.keys(rates),
    ...Object.keys(initialAssets ?? {}),
    ...additionBlocks
  ]));

  // Track running WDV and Gross Block per asset class
  const currentWdv = {};
  const currentGross = {};

  allBlocks.forEach(block => {
    const asset = initialAssets?.[block];
    if (typeof asset === 'object' && asset !== null) {
      currentWdv[block] = toSafeNumber(asset.net ?? asset.wdv ?? asset.gross, 0);
      currentGross[block] = toSafeNumber(asset.gross ?? asset.cost ?? currentWdv[block], currentWdv[block]);
    } else {
      currentWdv[block] = toSafeNumber(asset, 0);
      currentGross[block] = currentWdv[block];
    }
  });

  const years = [];

  for (let y = 1; y <= horizonYears; y++) {
    const yearAdditions = additionsPerYear[y] ?? additionsPerYear[String(y)] ?? {};
    const yearBlocks = {};
    let totalYearDep = 0;
    let totalYearClosingWdv = 0;
    let totalYearGross = 0;

    // Determine if additions in THIS specific year fall under 180 days:
    const isThisYearUnder180Days = typeof isAdditionsUnder180Days === 'object' && isAdditionsUnder180Days !== null
      ? Boolean(isAdditionsUnder180Days[y] ?? isAdditionsUnder180Days[String(y)])
      : (Boolean(isAdditionsUnder180Days) && y === 1);

    allBlocks.forEach(block => {
      const opening = currentWdv[block] ?? 0;
      const addition = toSafeNumber(yearAdditions[block], 0);
      const rate = rates[block] ?? 0.15; // default to 15% if unknown/custom block

      // Update gross block tracking
      currentGross[block] = (currentGross[block] ?? 0) + addition;

      // Section 32 180-day rule:
      // Half-rate applies only to additions in the year of acquisition if put to use < 180 days
      const depOnOpening = opening * rate;
      const depOnAddition = addition * (isThisYearUnder180Days ? (rate / 2) : rate);
      let totalBlockDep = depOnOpening + depOnAddition;

      // Statutory safeguard: Depreciation cannot exceed opening WDV + additions
      totalBlockDep = Math.min(opening + addition, totalBlockDep);

      const closingWdv = Math.max(0, (opening + addition) - totalBlockDep);

      yearBlocks[block] = {
        openingWdv: Math.round(opening * 100) / 100,
        additions: Math.round(addition * 100) / 100,
        ratePct: Math.round(rate * 100),
        depreciation: Math.round(totalBlockDep * 100) / 100,
        closingWdv: Math.round(closingWdv * 100) / 100,
        grossBlock: Math.round(currentGross[block] * 100) / 100
      };

      totalYearDep += totalBlockDep;
      totalYearClosingWdv += closingWdv;
      totalYearGross += currentGross[block];

      // Advance opening WDV for next fiscal year
      currentWdv[block] = closingWdv;
    });

    years.push({
      year: y,
      blocks: yearBlocks,
      totalDepreciation: Math.round(totalYearDep * 100) / 100,
      totalClosingWdv: Math.round(totalYearClosingWdv * 100) / 100,
      totalGrossBlock: Math.round(totalYearGross * 100) / 100
    });
  }

  return years;
}

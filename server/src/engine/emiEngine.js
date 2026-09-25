/**
 * Term Loan EMI & Amortization Engine
 * Implements Indian banking reducing balance amortization with optional moratorium support
 * and zero-rate loan / subsidy handling.
 */

/**
 * Calculates month-by-month and annual aggregated loan repayment schedules.
 * 
 * @param {Object} params
 * @param {number} params.loanAmount - Principal loan amount in Rupees (e.g. 3500000)
 * @param {number} params.annualRatePct - Annual interest rate in percent (e.g. 12.0)
 * @param {number} params.tenureMonths - Total tenure including moratorium (e.g. 60)
 * @param {number} [params.moratoriumMonths=0] - Principal holiday months (interest served monthly)
 * @returns {Object} { monthly: Array, annual: Array, summary: Object }
 */
export function calculateEmiSchedule({
  loanAmount,
  annualRatePct,
  tenureMonths,
  moratoriumMonths = 0
}) {
  const principal = Math.max(0, Number(loanAmount ?? 0));
  const annualRate = Math.max(0, Number(annualRatePct ?? 0));
  const totalMonths = Math.max(1, Math.round(Number(tenureMonths ?? 12)));
  const moratMonths = Math.max(0, Math.min(totalMonths - 1, Math.round(Number(moratoriumMonths ?? 0))));

  if (principal <= 0) {
    return {
      monthly: [],
      annual: [],
      summary: { totalInterest: 0, totalPayment: 0, monthlyEmi: 0 }
    };
  }

  const repaymentMonths = totalMonths - moratMonths;
  const monthlyRate = (annualRate / 100) / 12;

  // Monthly EMI calculation:
  // If annualRate === 0 (interest-free loan or capital subsidy), equal straight-line principal repayments
  let monthlyEmi = 0;
  if (repaymentMonths > 0) {
    if (annualRate > 0) {
      const factor = Math.pow(1 + monthlyRate, repaymentMonths);
      monthlyEmi = (principal * monthlyRate * factor) / (factor - 1);
    } else {
      monthlyEmi = principal / repaymentMonths;
    }
  }

  let currentPrincipal = principal;
  const monthly = [];

  for (let m = 1; m <= totalMonths; m++) {
    const opening = currentPrincipal;
    const isMoratorium = m <= moratMonths;
    const interest = annualRate > 0 ? (opening * monthlyRate) : 0;

    let principalRepaid = 0;
    let installment = 0;

    if (isMoratorium) {
      installment = interest;
      principalRepaid = 0;
    } else {
      if (annualRate > 0) {
        installment = monthlyEmi;
        principalRepaid = Math.min(opening, installment - interest);
      } else {
        principalRepaid = Math.min(opening, monthlyEmi);
        installment = principalRepaid;
      }
    }

    // Exact precision closing for final month to avoid penny drift
    if (m === totalMonths) {
      principalRepaid = opening;
      installment = principalRepaid + interest;
      currentPrincipal = 0;
    } else {
      currentPrincipal = Math.max(0, opening - principalRepaid);
    }

    monthly.push({
      month: m,
      isMoratorium,
      openingPrincipal: Math.round(opening * 100) / 100,
      interestPaid: Math.round(interest * 100) / 100,
      principalRepaid: Math.round(principalRepaid * 100) / 100,
      installment: Math.round(installment * 100) / 100,
      closingPrincipal: Math.round(currentPrincipal * 100) / 100
    });
  }

  // Aggregate into Annual buckets (Year 1 to Year N)
  const totalYears = Math.ceil(totalMonths / 12);
  const annual = [];

  for (let y = 1; y <= totalYears; y++) {
    const startM = (y - 1) * 12 + 1;
    const endM = Math.min(totalMonths, y * 12);
    const yearMonths = monthly.filter(m => m.month >= startM && m.month <= endM);

    if (yearMonths.length === 0) continue;

    const openingPrincipal = yearMonths[0].openingPrincipal;
    const closingPrincipal = yearMonths[yearMonths.length - 1].closingPrincipal;
    const interestPaid = yearMonths.reduce((sum, m) => sum + m.interestPaid, 0);
    const principalRepaid = yearMonths.reduce((sum, m) => sum + m.principalRepaid, 0);
    const totalInstallment = yearMonths.reduce((sum, m) => sum + m.installment, 0);

    annual.push({
      year: y,
      monthsCount: yearMonths.length,
      openingPrincipal: Math.round(openingPrincipal * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
      principalRepaid: Math.round(principalRepaid * 100) / 100,
      totalInstallment: Math.round(totalInstallment * 100) / 100,
      closingPrincipal: Math.round(closingPrincipal * 100) / 100
    });
  }

  const totalInterest = monthly.reduce((sum, m) => sum + m.interestPaid, 0);
  const totalPayment = principal + totalInterest;

  return {
    monthly,
    annual,
    summary: {
      principal,
      annualRatePct: annualRate,
      tenureMonths: totalMonths,
      moratoriumMonths: moratMonths,
      monthlyEmi: Math.round(monthlyEmi * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100
    }
  };
}

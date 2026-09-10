export const mockMSMEData = {
  businessProfile: {
    businessName: "Apex Precision Gears Pvt Ltd",
    industry: "Auto Components & Light Engineering",
    turnoverRange: "₹1Cr – ₹5Cr",
    annualRevenue: "₹4.80 Crore",
    vintage: "6 Years",
    constitution: "Private Limited",
    state: "Maharashtra",
    assessmentDate: "08 Sep 2026",
    status: "Verified Accounting Data"
  },
  scores: {
    financialHealth: {
      score: 82,
      max: 100,
      rating: "Good",
      description: "Sound gross margins, consistent cash generation, and comfortable debt service coverage."
    },
    creditReadiness: {
      score: 76,
      max: 100,
      rating: "Moderate",
      description: "Clean banking records and manageable leverage; debtor collection cycle requires active monitoring."
    },
    borrowingCapacity: {
      min: "₹60 Lakh",
      max: "₹75 Lakh",
      rangeText: "₹60L – ₹75L",
      basis: "Based on 1.62x DSCR and projected operating cash flows"
    }
  },
  workingCapital: {
    requirement: "₹78.0 Lakh",
    existingLimit: "₹52.0 Lakh",
    gap: "₹26.0 Lakh",
    hasGap: true,
    gapNote: "Working capital shortfall identified due to 68-day customer credit cycle."
  },
  ratios: [
    {
      id: "dso",
      name: "Debtor Days (DSO)",
      value: "68 Days",
      benchmark: "Benchmark: < 60 days",
      status: "watch",
      statusLabel: "Watch",
      formula: "(Total Debtors / Annual Revenue) × 365"
    },
    {
      id: "dpo",
      name: "Creditor Days (DPO)",
      value: "29 Days",
      benchmark: "Benchmark: 30–45 days",
      status: "good",
      statusLabel: "Good",
      formula: "(Total Creditors / COGS) × 365"
    },
    {
      id: "dio",
      name: "Inventory Days",
      value: "42 Days",
      benchmark: "Benchmark: < 50 days",
      status: "good",
      statusLabel: "Good",
      formula: "(Inventory / COGS) × 365"
    },
    {
      id: "ccc",
      name: "Cash Conversion Cycle",
      value: "81 Days",
      benchmark: "Benchmark: < 75 days",
      status: "watch",
      statusLabel: "Watch",
      formula: "DSO + Inventory Days − DPO"
    },
    {
      id: "dscr",
      name: "Debt Service Coverage (DSCR)",
      value: "1.62x",
      benchmark: "Benchmark: > 1.30x",
      status: "good",
      statusLabel: "Good",
      formula: "EBITDA / Annual Repayment Obligations"
    },
    {
      id: "icr",
      name: "Interest Coverage Ratio",
      value: "3.40x",
      benchmark: "Benchmark: > 2.50x",
      status: "good",
      statusLabel: "Good",
      formula: "EBITDA / Interest Paid"
    },
    {
      id: "de",
      name: "Debt-to-Equity Ratio",
      value: "0.85",
      benchmark: "Benchmark: < 1.50",
      status: "good",
      statusLabel: "Good",
      formula: "Total Debt / Net Worth"
    }
  ],
  receivablesAgeing: [
    { bucket: "0–30 Days", amount: "₹48.5L", percentage: 54, isRisk: false },
    { bucket: "31–60 Days", amount: "₹23.8L", percentage: 27, isRisk: false },
    { bucket: "61–90 Days", amount: "₹11.2L", percentage: 12, isRisk: false },
    { bucket: "90+ Days", amount: "₹6.1L", percentage: 7, isRisk: true }
  ],
  recommendations: [
    {
      id: "cc_enhancement",
      title: "Cash Credit / OD Enhancement",
      tag: "High Match",
      tagType: "good",
      rationale: [
        "Identified working capital gap of ₹26 Lakh against existing ₹52 Lakh limit.",
        "YoY sales growth of 18.5% with healthy EBITDA margins supports higher drawing power."
      ],
      nextStep: "Submit bank stock statement and renewal application citing WC gap assessment."
    },
    {
      id: "invoice_discounting",
      title: "Invoice Discounting / TReDS Route",
      tag: "Medium Match",
      tagType: "watch",
      rationale: [
        "Debtor days stand at 68 days; ₹35L locked in 30+ day corporate receivables.",
        "Applicable for discounting receivables against tier-1 auto OEM and corporate buyers."
      ],
      nextStep: "Onboard on RXIL/M1xchange platform with GST-verified buyer invoices."
    },
    {
      id: "cgtmse_term_loan",
      title: "CGTMSE Collateral-Free Term Loan",
      tag: "High Match",
      tagType: "good",
      rationale: [
        "Eligible for up to ₹5 Crore guarantee coverage without physical property mortgage.",
        "DSCR of 1.62x comfortably qualifies under credit guarantee trust underwriting thresholds."
      ],
      nextStep: "Approach scheduled commercial bank for machinery expansion under CGTMSE."
    }
  ]
};

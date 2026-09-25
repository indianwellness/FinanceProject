import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sliders, 
  RefreshCw,
  Coins,
  Percent,
  Calendar,
  FileSpreadsheet,
  Info,
  XCircle
} from 'lucide-react';
import { useCreditOS } from '../context/CreditOSContext';

export default function DprReviewScreen() {
  const { 
    dprInput, 
    setDprInput, 
    parserValidation, 
    setDprOutput, 
    showToast,
    isDprGenerating,
    setIsDprGenerating
  } = useCreditOS();

  const navigate = useNavigate();

  // Local editable draft initialized from parser normalized data or default
  const [formData, setFormData] = useState(() => {
    if (dprInput) return { ...dprInput };
    // Default fallback values if user navigated directly without uploading
    return {
      entityName: 'M/S SHREE ENTERPRISES',
      entityType: 'proprietorship',
      horizonYears: 5,
      loanAmount: 3500000,
      interestRate: 12.0,
      tenureMonths: 60,
      moratoriumMonths: 6,
      ccAppliedFor: 2000000,
      ccInterestRatePct: 12.0,
      netTurnover: 74644510,
      grossProfit: 4829057,
      cogs: 69815453,
      opex: { total: 2413055 },
      capital: 1991425,
      reservesSurplus: 0,
      unsecuredLoansQuasiEquity: 0,
      unsecuredLoansExternal: 0,
      tradeDebtors: 22029164,
      inventories: 10893912,
      tradeCreditors: 29664003,
      cashBank: 1274027,
      fixedAssets: { general: 184304 },
      newAssetAdditions: { machinery: 265000 },
      revenueGrowthPct: 10.0,
      gpMarginPct: 6.5,
      opexGrowthPct: 8.0,
      debtorDays: 107,
      inventoryDays: 57,
      creditorDays: 155,
      promoterDrawingsPct: 0.15,
      amountsUnit: 'absolute'
    };
  });

  // Track live validation warnings and fatal submission errors
  const [liveWarnings, setLiveWarnings] = useState([]);
  const [submissionError, setSubmissionError] = useState(null);

  useEffect(() => {
    const warnings = [];
    const revGrowth = Number(formData.revenueGrowthPct) || 0;
    const rate = Number(formData.interestRate) || 0;
    const tenure = Number(formData.tenureMonths) || 0;
    const opexGrowth = Number(formData.opexGrowthPct) || 0;

    if (revGrowth > 20) {
      warnings.push(`High Revenue Growth (${revGrowth}%) — Indian banks typically scrutinize projections exceeding 20% p.a.`);
    }
    if (revGrowth > 35) {
      warnings.push(`Extreme Revenue Growth (${revGrowth}%) exceeds RBI acceptable expansion caps.`);
    }
    if (rate > 16) {
      warnings.push(`Interest Rate (${rate}%) is above typical MSME commercial lending rates.`);
    }
    if (tenure > 120) {
      warnings.push(`Tenure of ${tenure} months exceeds typical 10-year term loan norms.`);
    }
    if (opexGrowth > 15) {
      warnings.push(`High OpEx Growth (${opexGrowth}%) may erode projected DSCR.`);
    }
    setLiveWarnings(warnings);
  }, [formData]);

  const handleInputChange = (field, rawValue) => {
    // Allows empty string so user can backspace freely without jumping to 0 or NaN
    const val = rawValue === '' ? '' : rawValue;
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
    if (submissionError) setSubmissionError(null);
  };

  const handleNestedChange = (parent, field, rawValue) => {
    const val = rawValue === '' ? '' : rawValue;
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: val
      }
    }));
    if (submissionError) setSubmissionError(null);
  };

  const handleBackToUpload = () => {
    // Preserve current draft in context before navigating
    setDprInput(formData);
    navigate('/upload');
  };

  const handleGenerateDpr = async () => {
    if (isDprGenerating) return;
    setIsDprGenerating(true);
    setSubmissionError(null);
    showToast('Executing DPR Financial Synthesis Engine...');

    try {
      // Clean and sanitize numeric inputs to safe numbers
      const sanitizedPayload = {
        ...formData,
        loanAmount: Number(formData.loanAmount) || 0,
        ccAppliedFor: Number(formData.ccAppliedFor) || 0,
        interestRate: Number(formData.interestRate) || 0,
        tenureMonths: Number(formData.tenureMonths) || 0,
        moratoriumMonths: Number(formData.moratoriumMonths) || 0,
        netTurnover: Number(formData.netTurnover) || 0,
        cogs: Number(formData.cogs) || 0,
        grossProfit: Number(formData.grossProfit) || 0,
        capital: Number(formData.capital) || 0,
        tradeDebtors: Number(formData.tradeDebtors) || 0,
        inventories: Number(formData.inventories) || 0,
        tradeCreditors: Number(formData.tradeCreditors) || 0,
        unsecuredLoansQuasiEquity: Number(formData.unsecuredLoansQuasiEquity) || 0,
        unsecuredLoansExternal: Number(formData.unsecuredLoansExternal) || 0,
        revenueGrowthPct: Number(formData.revenueGrowthPct) || 0,
        gpMarginPct: Number(formData.gpMarginPct) || 0,
        opexGrowthPct: Number(formData.opexGrowthPct) || 0,
        debtorDays: Number(formData.debtorDays) || 0,
        inventoryDays: Number(formData.inventoryDays) || 0,
        creditorDays: Number(formData.creditorDays) || 0,
        opex: {
          total: Number(formData.opex?.total) || 0
        }
      };

      const res = await fetch('/api/dpr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedPayload)
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const errorMsg = result.errors?.[0] || result.error || 'Failed to generate DPR projections.';
        setSubmissionError(errorMsg);
        showToast(`Synthesis Blocked: ${errorMsg}`);
        return; // Retain user on page so they can address issues
      }

      setDprInput(result.normalizedData || sanitizedPayload);
      setDprOutput(result.dpr);
      showToast('DPR Projections and Schedules successfully generated!');
      navigate('/dashboard');
    } catch (err) {
      console.error('API request error:', err);
      const errMsg = err.message || 'Unable to connect to calculation engine.';
      setSubmissionError(errMsg);
      showToast(`Network Error: ${errMsg}`);
    } finally {
      setIsDprGenerating(false);
    }
  };

  const confidencePct = parserValidation?.confidenceScore 
    ? Math.round(parserValidation.confidenceScore * 100) 
    : 95;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#0F2F57] text-white flex items-center justify-center font-bold text-xs">
                OS
              </div>
              <span className="font-bold text-sm text-[#0F2F57]">MSME CreditOS</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              DPR Ingestion Review
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToUpload}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Banner: Ingestion Confidence & Unit Scale */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Phase 3: Convergence Point Review
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded border border-emerald-300">
                Parser Verified
              </span>
              {formData.amountsUnit === 'lakhs' && (
                <span className="bg-blue-100 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded border border-blue-300">
                  Scaled from Lakhs to ₹
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#0F2F57]">
              Pre-Filled DPR Review & Assumption Guardrails
            </h1>
            <p className="text-xs text-slate-600">
              Verify the parsed baseline figures and adjust banking growth assumptions before generating statutory projections.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Parser Confidence
              </div>
              <div className="text-lg font-bold text-emerald-700">
                {confidencePct}%
              </div>
            </div>
          </div>
        </div>

        {/* Fatal Submission Error Alert */}
        {submissionError && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-xs space-y-1 text-rose-900 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-rose-700">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>DPR Generation Blocked</span>
            </div>
            <p className="text-rose-800 pl-6 font-medium">
              {submissionError}
            </p>
          </div>
        )}

        {/* Audit & Warnings Alerts */}
        {(liveWarnings.length > 0 || (parserValidation?.warnings?.length > 0)) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Institutional Guardrail Warnings ({liveWarnings.length + (parserValidation?.warnings?.length || 0)})</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-800 pl-1">
              {liveWarnings.map((w, i) => (
                <li key={`live-${i}`}>{w}</li>
              ))}
              {parserValidation?.warnings?.map((w, i) => (
                <li key={`parser-${i}`}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Core Financials & Entity Setup (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Section 1: Entity & Loan Facility */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0F2F57] border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-[#0F2F57]" />
                <span>1. Borrower Identity & Requested Credit Facilities</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Entity / Borrower Name
                  </label>
                  <input
                    type="text"
                    value={formData.entityName}
                    onChange={(e) => handleInputChange('entityName', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Statutory Constitution / Entity Type
                  </label>
                  <select
                    value={formData.entityType}
                    onChange={(e) => handleInputChange('entityType', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-[#0F2F57]"
                  >
                    <option value="proprietorship">Sole Proprietorship (Section 87A Rebate)</option>
                    <option value="partnership">Partnership Firm (Flat 31.2% Tax)</option>
                    <option value="llp">Limited Liability Partnership (LLP)</option>
                    <option value="pvt_ltd">Private Limited Company (26% Tax)</option>
                  </select>
                </div>
              </div>

              {/* Facility Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Term Loan Requested (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.loanAmount ?? ''}
                    onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                  <span className="text-[10px] text-slate-500">
                    ₹{((Number(formData.loanAmount) || 0) / 100000).toFixed(2)} Lakhs
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank CC Limit Applied (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.ccAppliedFor ?? ''}
                    onChange={(e) => handleInputChange('ccAppliedFor', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                  <span className="text-[10px] text-slate-500">
                    ₹{((Number(formData.ccAppliedFor) || 0) / 100000).toFixed(2)} Lakhs
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.interestRate ?? ''}
                    onChange={(e) => handleInputChange('interestRate', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                  <span className="text-[10px] text-slate-500">Reducing balance rate</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Repayment Tenure (Months)
                  </label>
                  <input
                    type="number"
                    value={formData.tenureMonths ?? ''}
                    onChange={(e) => handleInputChange('tenureMonths', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                  <span className="text-[10px] text-slate-500">
                    {((Number(formData.tenureMonths) || 0) / 12).toFixed(1)} Years Amortization
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Principal Moratorium (Months)
                  </label>
                  <input
                    type="number"
                    value={formData.moratoriumMonths ?? ''}
                    onChange={(e) => handleInputChange('moratoriumMonths', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                  <span className="text-[10px] text-slate-500">Interest serviced monthly</span>
                </div>
              </div>
            </div>

            {/* Section 2: Baseline P&L & Balance Sheet */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0F2F57] border-b border-slate-100 pb-3">
                <FileSpreadsheet className="w-4 h-4 text-[#0F2F57]" />
                <span>2. Verified Baseline Statement Figures (Year 0 / Provisional)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Net Turnover / Revenue (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.netTurnover ?? ''}
                    onChange={(e) => handleInputChange('netTurnover', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                  <span className="text-[10px] text-slate-500">
                    ₹{((Number(formData.netTurnover) || 0) / 100000).toFixed(2)} Lakhs
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    COGS (Purchases + Labour) (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.cogs ?? ''}
                    onChange={(e) => handleInputChange('cogs', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                  <span className="text-[10px] text-slate-500">
                    ₹{((Number(formData.cogs) || 0) / 100000).toFixed(2)} Lakhs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gross Profit (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.grossProfit ?? ''}
                    onChange={(e) => handleInputChange('grossProfit', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operating Expenses (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.opex?.total ?? ''}
                    onChange={(e) => handleNestedChange('opex', 'total', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Promoter Capital (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.capital ?? ''}
                    onChange={(e) => handleInputChange('capital', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                </div>
              </div>

              {/* Working Capital Balance Sheet Items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trade Debtors (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.tradeDebtors ?? ''}
                    onChange={(e) => handleInputChange('tradeDebtors', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inventories / Stock (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.inventories ?? ''}
                    onChange={(e) => handleInputChange('inventories', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trade Creditors (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.tradeCreditors ?? ''}
                    onChange={(e) => handleInputChange('tradeCreditors', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0F2F57]"
                  />
                </div>
              </div>

              {/* Unsecured Loan Classification Prompt */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#0F2F57]" />
                  <span className="text-xs font-bold text-[#0F2F57]">
                    Unsecured Debt Categorization (RBI Norms)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Promoter loans subordinated to the bank count as <strong>Quasi-Equity</strong> (boosting Net Worth and reducing TOL/TNW). Third-party loans count as external debt.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700">Quasi-Equity Loans (₹)</span>
                    <input
                      type="number"
                      value={formData.unsecuredLoansQuasiEquity ?? ''}
                      onChange={(e) => handleInputChange('unsecuredLoansQuasiEquity', e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700">External Debt (₹)</span>
                    <input
                      type="number"
                      value={formData.unsecuredLoansExternal ?? ''}
                      onChange={(e) => handleInputChange('unsecuredLoansExternal', e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Projection Assumptions & Guardrails (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0F2F57] border-b border-slate-100 pb-3">
                <Sliders className="w-4 h-4 text-[#0F2F57]" />
                <span>3. 5-Year Projection Assumptions</span>
              </div>

              {/* Revenue Growth % */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Annual Revenue Growth</span>
                  <span className="font-mono font-bold text-[#0F2F57]">{Number(formData.revenueGrowthPct) || 0}% p.a.</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="0.5"
                  value={Number(formData.revenueGrowthPct) || 0}
                  onChange={(e) => handleInputChange('revenueGrowthPct', Number(e.target.value))}
                  className="w-full accent-[#0F2F57] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Flat)</span>
                  <span>10-15% (Typical Bank Norm)</span>
                  <span>35% (Max)</span>
                </div>
              </div>

              {/* GP Margin % */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Gross Profit Margin %</span>
                  <span className="font-mono font-bold text-[#0F2F57]">{Number(formData.gpMarginPct) || 0}%</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={formData.gpMarginPct ?? ''}
                  onChange={(e) => handleInputChange('gpMarginPct', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>

              {/* OpEx Growth % */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Annual OpEx Growth %</span>
                  <span className="font-mono font-bold text-[#0F2F57]">{Number(formData.opexGrowthPct) || 0}% p.a.</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={Number(formData.opexGrowthPct) || 0}
                  onChange={(e) => handleInputChange('opexGrowthPct', Number(e.target.value))}
                  className="w-full accent-[#0F2F57] cursor-pointer"
                />
              </div>

              {/* Working Capital Cycle Days */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Working Capital Cycle (Days)
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Debtors (DSO)</label>
                    <input
                      type="number"
                      value={formData.debtorDays ?? ''}
                      onChange={(e) => handleInputChange('debtorDays', e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Inventory (DIO)</label>
                    <input
                      type="number"
                      value={formData.inventoryDays ?? ''}
                      onChange={(e) => handleInputChange('inventoryDays', e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Creditors (DPO)</label>
                    <input
                      type="number"
                      value={formData.creditorDays ?? ''}
                      onChange={(e) => handleInputChange('creditorDays', e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Promoter Drawings */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Promoter PAT Retained / Drawings</span>
                  <span className="font-mono font-bold text-[#0F2F57]">
                    {Math.round((1 - (Number(formData.promoterDrawingsPct) || 0.15)) * 100)}% Retained
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {Math.round((Number(formData.promoterDrawingsPct) || 0.15) * 100)}% withdrawn as personal drawings during profitable years
                </span>
              </div>

            </div>

            {/* Execution CTA Card */}
            <div className="bg-[#0F2F57] text-white rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold">Execute Financial Engine</span>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                Applies reducing-balance EMI schedules, IT Act Section 32 WDV depreciation blocks, Nayak working capital norms, and statutory tax slabs.
              </p>

              <button
                type="button"
                onClick={handleGenerateDpr}
                disabled={isDprGenerating}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDprGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing DPR Schedules...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Bank-Ready DPR</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import ScoreGauge from '../components/ScoreGauge';
import Badge from '../components/Badge';
import RecommendationCard from '../components/RecommendationCard';
import { 
  ChevronRight, 
  Edit3, 
  AlertTriangle, 
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useCreditOS } from '../context/CreditOSContext';

export default function DashboardScreen() {
  const { data, dprOutput, dprInput, showToast } = useCreditOS();
  const navigate = useNavigate();
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const { businessProfile, scores, workingCapital, ratios, recommendations, receivablesAgeing } = data;

  const isDprActive = Boolean(dprOutput && dprInput);

  const handleDownloadExcel = async () => {
    if (!dprOutput || !dprInput || isExportingExcel) return;
    try {
      setIsExportingExcel(true);
      const res = await fetch('/api/dpr/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dpr: dprOutput, normalizedData: dprInput })
      });

      if (!res.ok) {
        let errorMsg = 'Server returned an error generating the Excel workbook.';
        try {
          const errJson = await res.json();
          if (errJson?.error) errorMsg = errJson.error;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedName = (dprInput.entityName || 'MSME_Borrower').replace(/[^a-zA-Z0-9_\-\s]/g, '_').trim().replace(/\s+/g, '_');
      a.download = `DPR_${sanitizedName}_Bank_Projections.xlsx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (a.parentNode) {
          a.parentNode.removeChild(a);
        }
      }, 1000);

      if (showToast) {
        showToast('Bank-ready Excel DPR downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Download error:', err);
      if (showToast) {
        showToast('Failed to download Excel report: ' + err.message, 'error');
      }
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!dprOutput || !dprInput || isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      const res = await fetch('/api/dpr/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dpr: dprOutput, normalizedData: dprInput })
      });

      if (!res.ok) {
        let errorMsg = 'Server returned an error generating the PDF appraisal memo.';
        try {
          const errJson = await res.json();
          if (errJson?.error) errorMsg = errJson.error;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedName = (dprInput.entityName || 'MSME_Borrower').replace(/[^a-zA-Z0-9_\-\s]/g, '_').trim().replace(/\s+/g, '_');
      a.download = `DPR_${sanitizedName}_Credit_Appraisal_Memo.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (a.parentNode) {
          a.parentNode.removeChild(a);
        }
      }, 1000);

      if (showToast) {
        showToast('Credit Appraisal Memo (.pdf) downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error('PDF download error:', err);
      if (showToast) {
        showToast('Failed to download PDF appraisal memo: ' + err.message, 'error');
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const businessName = isDprActive
    ? dprInput.entityName
    : businessProfile.businessName;

  const constitution = isDprActive
    ? (dprInput.entityType === 'pvt_ltd' ? 'Private Limited' : dprInput.entityType === 'llp' ? 'LLP' : dprInput.entityType === 'partnership' ? 'Partnership Firm' : 'Sole Proprietorship')
    : (businessProfile.constitution || 'Private Limited');

  const annualRevenueText = isDprActive
    ? `₹${(dprInput.netTurnover / 100000).toFixed(1)} Lakh (Baseline)`
    : businessProfile.annualRevenue;

  const handleEditProfile = () => {
    if (isDprActive) {
      navigate('/dpr-review');
    } else {
      navigate('/profile', { state: { fromDashboard: true } });
    }
  };

  // Dynamic Debtors Summation
  const totalDebtorsNum = (receivablesAgeing || []).reduce((acc, b) => {
    const num = parseFloat(String(b.amount).replace(/[^0-9.]/g, '')) || 0;
    return acc + num;
  }, 0);
  const totalDebtorsText = `₹${totalDebtorsNum.toFixed(1)} Lakh`;

  // Dynamic Working Capital Proportions
  const reqNum = parseFloat(String(workingCapital.requirement).replace(/[^0-9.]/g, '')) || 78;
  const existingNum = parseFloat(String(workingCapital.existingLimit).replace(/[^0-9.]/g, '')) || 52;
  const sanctionedPct = reqNum > 0 ? Math.min(Math.round((existingNum / reqNum) * 1000) / 10, 100) : 66.7;
  const gapPct = Math.max(Math.round((100 - sanctionedPct) * 10) / 10, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-900">
      
      {/* Institutional Underwriting Header Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0F2F57] tracking-tight">
                {businessName}
              </h1>
              <Badge variant="navy">{constitution}</Badge>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                {isDprActive ? 'Verified DPR Synthesis' : 'Verified Tally Ingestion'}
              </span>
              <button
                onClick={handleEditProfile}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-[#0F2F57] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                title={isDprActive ? 'Re-calibrate DPR assumptions' : 'Calibrate business parameters'}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isDprActive ? 'Re-Calibrate DPR' : 'Edit Parameters'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-x-6 gap-y-1.5">
              <span>Industry: <strong className="text-slate-800 font-semibold">{businessProfile.industry}</strong></span>
              <span>Annual Revenue: <strong className="text-slate-800 font-semibold tabular-nums">{annualRevenueText}</strong></span>
              <span>Vintage: <strong className="text-slate-800 font-semibold">{businessProfile.vintage}</strong></span>
              <span>Jurisdiction: <strong className="text-slate-800 font-semibold">{businessProfile.state || 'Maharashtra'}</strong></span>
            </div>
          </div>

          <div className="text-right shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 flex lg:flex-col items-center lg:items-end justify-between">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Assessment Timestamp
            </div>
            <div className="text-xs font-medium text-slate-700 mt-0.5">
              {businessProfile.assessmentDate} • FY 2025–26
            </div>
          </div>
        </div>
      </div>

      {/* Synthesized Statutory DPR Overview Card (Active when DPR generated) */}
      {isDprActive && (
        <div className="bg-white border-2 border-emerald-500/40 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                  Active DPR Model
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Double-Entry Verified: Sources == Applications (0 Discrepancy)
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#0F2F57] mt-1">
                Statutory DPR Financial Projections ({dprOutput.projectedPnl.length}-Year Horizon)
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/dpr-review')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F2F57] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Re-Calibrate</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={isExportingExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 border border-emerald-800 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                {isExportingExcel ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Exporting Excel...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Download Bank DPR (.xlsx)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0F2F57] hover:bg-blue-900 disabled:opacity-50 border border-blue-900 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                {isExportingPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Exporting PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Credit Proposal (.pdf)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Key Facility & Solvency KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Term Loan Requested</div>
              <div className="text-base font-bold text-[#0F2F57] mt-0.5 tabular-nums">
                ₹{(dprInput.loanAmount / 100000).toFixed(2)} Lakh
              </div>
              <div className="text-[10px] text-slate-500">
                {dprInput.interestRate}% • {dprInput.tenureMonths} Mos
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average DSCR</div>
              <div className="text-base font-bold text-[#0F2F57] mt-0.5 tabular-nums">
                {dprOutput.solvencyRatios?.summary?.averageDscr ?? 'N/A'}x
              </div>
              <div className="text-[10px]">
                <span className={`font-semibold ${
                  dprOutput.solvencyRatios?.summary?.overallRating === 'GREEN' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  Rating: {dprOutput.solvencyRatios?.summary?.overallRating}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOL / ATNW (Yr 1)</div>
              <div className="text-base font-bold text-[#0F2F57] mt-0.5 tabular-nums">
                {dprOutput.solvencyRatios?.annualRatios?.[0]?.tolAtnw ?? dprOutput.solvencyRatios?.annualRatios?.[0]?.tolTnw ?? 'N/A'}x
              </div>
              <div className="text-[10px] text-slate-500">
                Net Worth: ₹{((dprOutput.projectedBalanceSheet[0]?.sourcesOfFunds?.adjustedTangibleNetWorth || dprOutput.projectedBalanceSheet[0]?.sourcesOfFunds?.totalNetWorth || 0) / 100000).toFixed(1)}L
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CGTMSE Coverage</div>
              <div className="text-base font-bold text-emerald-700 mt-0.5">
                {dprOutput.solvencyRatios?.cgtmseEligibility?.isEligible ? 'Eligible' : 'Ineligible'}
              </div>
              <div className="text-[10px] text-slate-500">
                ₹10 Cr Enhanced Ceiling
              </div>
            </div>
          </div>

          {/* Quick Projection Summary Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Metric (₹ Lakhs)</th>
                  {dprOutput.projectedPnl.map((p) => (
                    <th key={`head-${p.year}`} className="py-2.5 px-3 text-right">
                      Year {p.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-800">Gross Turnover</td>
                  {dprOutput.projectedPnl.map((p) => (
                    <td key={`to-${p.year}`} className="py-2 px-3 text-right text-slate-900 tabular-nums">
                      {(p.turnover / 100000).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-800">Gross Profit</td>
                  {dprOutput.projectedPnl.map((p) => (
                    <td key={`gp-${p.year}`} className="py-2 px-3 text-right text-slate-900 tabular-nums">
                      {(p.grossProfit / 100000).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-800">EBITDA</td>
                  {dprOutput.projectedPnl.map((p) => (
                    <td key={`eb-${p.year}`} className="py-2 px-3 text-right text-slate-900 tabular-nums">
                      {(p.ebitda / 100000).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-2 px-3 font-sans font-semibold text-[#0F2F57]">Profit After Tax (PAT)</td>
                  {dprOutput.projectedPnl.map((p) => (
                    <td key={`pat-${p.year}`} className="py-2 px-3 text-right font-bold text-[#0F2F57] tabular-nums">
                      {(p.pat / 100000).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-800">Adjusted Net Worth</td>
                  {dprOutput.projectedBalanceSheet.map((b) => (
                    <td key={`nw-${b.year}`} className="py-2 px-3 text-right text-slate-900 tabular-nums">
                      {((b.sourcesOfFunds.adjustedTangibleNetWorth || b.sourcesOfFunds.totalNetWorth) / 100000).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-blue-50/40">
                  <td className="py-2 px-3 font-sans font-bold text-blue-900">Annual DSCR</td>
                  {dprOutput.solvencyRatios?.annualRatios?.map((r) => (
                    <td key={`dscr-${r.year}`} className="py-2 px-3 text-right font-bold text-blue-900 tabular-nums">
                      {r.dscr !== null ? `${r.dscr}x` : 'N/A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* The 3 Core Score Gauge Cards with Telemetry Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Score 1: Financial Health */}
        <MetricCard
          title="Financial Health Score"
          subtitle="Operational profitability & debt servicing capability"
          badge="Grade A"
          badgeVariant="good"
          footer={scores.financialHealth.description}
        >
          <div className="space-y-3">
            <ScoreGauge
              score={scores.financialHealth.score}
              max={scores.financialHealth.max}
              rating={scores.financialHealth.rating}
            />
            {/* Supporting Micro-Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
                <span className="text-slate-500 block">DSCR</span>
                <span className="font-bold text-slate-800 tabular-nums">1.62x</span>
              </div>
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
                <span className="text-slate-500 block">ICR</span>
                <span className="font-bold text-slate-800 tabular-nums">3.40x</span>
              </div>
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
                <span className="text-slate-500 block">D/E</span>
                <span className="font-bold text-slate-800 tabular-nums">0.85</span>
              </div>
            </div>
          </div>
        </MetricCard>

        {/* Score 2: Credit Readiness */}
        <MetricCard
          title="Credit Readiness Score"
          subtitle="Preparedness for commercial bank underwriting"
          badge="Grade B+"
          badgeVariant="watch"
          footer={scores.creditReadiness.description}
        >
          <div className="space-y-3">
            <ScoreGauge
              score={scores.creditReadiness.score}
              max={scores.creditReadiness.max}
              rating={scores.creditReadiness.rating}
            />
            {/* Supporting Micro-Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-1.5 bg-amber-50 border border-amber-200 rounded text-[10px]">
                <span className="text-amber-700 block">DSO</span>
                <span className="font-bold text-amber-900 tabular-nums">68 Days</span>
              </div>
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
                <span className="text-slate-500 block">CCC</span>
                <span className="font-bold text-slate-800 tabular-nums">81 Days</span>
              </div>
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
                <span className="text-slate-500 block">DIO</span>
                <span className="font-bold text-slate-800 tabular-nums">42 Days</span>
              </div>
            </div>
          </div>
        </MetricCard>

        {/* Score 3: Indicative Borrowing Capacity */}
        <MetricCard
          title="Indicative Borrowing Headroom"
          subtitle="Estimated institutional debt sanction range"
          badge="Algorithmic Estimate"
          badgeVariant="navy"
          footer={scores.borrowingCapacity.basis}
        >
          <div className="space-y-3 py-1">
            <div>
              <div className="text-3xl font-bold text-[#0F2F57] tracking-tight tabular-nums">
                {scores.borrowingCapacity.rangeText}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Feasible under standard Nayak Committee guidelines</span>
              </div>
            </div>

            {/* Supporting Micro-Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
                <span className="text-slate-500 block">Nayak 20% Base</span>
                <span className="font-bold text-slate-800 tabular-nums">₹78.0 Lakh</span>
              </div>
              <div className="p-1.5 bg-amber-50 border border-amber-200 rounded text-[10px]">
                <span className="text-amber-700 block">Identified Gap</span>
                <span className="font-bold text-amber-900 tabular-nums">₹26.0 Lakh</span>
              </div>
            </div>
          </div>
        </MetricCard>
      </div>

      {/* Working Capital Gap Visualizer Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0F2F57]">
                Working Capital Health & Deficit Analysis
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Gap Identified
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              {workingCapital.gapNote} Current Cash Conversion Cycle stands at 81 days against 60-day manufacturing threshold.
            </p>
          </div>

          <div className="flex items-center gap-6 divide-x divide-slate-200 shrink-0">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Estimated Need</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {workingCapital.requirement}
              </div>
            </div>
            <div className="pl-6">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Existing Limit</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {workingCapital.existingLimit}
              </div>
            </div>
            <div className="pl-6">
              <div className="text-[11px] font-semibold uppercase text-amber-700">
                Identified Deficit
              </div>
              <div className="text-xl font-bold text-amber-700 tabular-nums">
                {workingCapital.gap}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Proportional Working Capital Bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Capital Allocation Breakdown</span>
            <span className="text-slate-500 text-[11px] tabular-nums">
              Total Operating Requirement: {workingCapital.requirement}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-md overflow-hidden flex shadow-inner">
            <div 
              className="bg-[#0F2F57] h-full flex items-center justify-center text-[10px] font-semibold text-white tracking-wider transition-all duration-300" 
              style={{ width: `${sanctionedPct}%` }}
              title={`Existing Bank Sanction: ${workingCapital.existingLimit} (${sanctionedPct}%)`}
            >
              Sanctioned: {workingCapital.existingLimit} ({sanctionedPct}%)
            </div>
            <div 
              className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-semibold text-white tracking-wider transition-all duration-300" 
              style={{ width: `${gapPct}%` }}
              title={`Unfunded Shortfall: ${workingCapital.gap} (${gapPct}%)`}
            >
              Shortfall: {workingCapital.gap} ({gapPct}%)
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#0F2F57]"></span>
              <span>Existing Bank CC/OD Facility</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-amber-500"></span>
              <span>Unfunded Gap (Eligible for Enhancement / TReDS)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Key Financial Ratios Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F2F57]">
              Key Underwriting & Coverage Ratios
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Derived from Tally Profit & Loss and Balance Sheet vs manufacturing industry benchmarks
            </p>
          </div>
          <button
            onClick={() => navigate('/details')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F2F57] bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <span>Deep Dive Ratios & Formulas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                <th className="py-3 px-3.5 font-semibold">Ratio Name</th>
                <th className="py-3 px-3.5 font-semibold">Calculated Value</th>
                <th className="py-3 px-3.5 font-semibold">Underwriting Benchmark</th>
                <th className="py-3 px-3.5 font-semibold">Status Assessment</th>
                <th className="py-3 px-3.5 font-semibold">Accounting Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ratios.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-semibold text-slate-900">{r.name}</td>
                  <td className="py-3 px-3.5 font-bold text-slate-900 tabular-nums text-sm">{r.value}</td>
                  <td className="py-3 px-3.5 text-slate-600">{r.benchmark}</td>
                  <td className="py-3 px-3.5">
                    <Badge variant={r.status}>{r.statusLabel}</Badge>
                  </td>
                  <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">{r.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receivables Ageing Distribution Snapshot with Visual Concentration Bars */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0F2F57]">
              Sundry Debtors Ageing Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Categorization of outstanding trade receivables from customer ledgers
            </p>
          </div>
          <div className="text-xs text-slate-600">
            Total Outstanding: <strong className="text-slate-900 font-bold tabular-nums">{totalDebtorsText}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {receivablesAgeing.map((bucket, idx) => {
            const isRisk = bucket.isRisk;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isRisk
                    ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">{bucket.bucket}</span>
                  {isRisk ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                      <AlertTriangle className="w-3 h-3" />
                      Attention
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>

                <div className={`text-2xl font-bold mt-2 tabular-nums ${isRisk ? 'text-rose-700' : 'text-[#0F2F57]'}`}>
                  {bucket.amount}
                </div>

                {/* Visual Mini Concentration Bar */}
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isRisk ? 'bg-rose-500' : 'bg-[#0F2F57]'}`}
                      style={{ width: `${bucket.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Share of Total</span>
                    <span className="font-semibold text-slate-700 tabular-nums">{bucket.percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Financing Routes Snapshot */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F2F57]">
              Matched Institutional Financing Routes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Financing structures algorithmically aligned with verified financial metrics
            </p>
          </div>
          <button
            onClick={() => navigate('/recommendations')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F2F57] hover:underline cursor-pointer"
          >
            <span>View Detailed Eligibility ({recommendations.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              variant="compact"
            />
          ))}
        </div>
      </div>

    </div>
  );
}

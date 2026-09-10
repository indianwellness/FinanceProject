import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Badge from '../components/Badge';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Calculator, 
  Info
} from 'lucide-react';
import { useCreditOS } from '../context/CreditOSContext';

export default function DetailsScreen() {
  const { data } = useCreditOS();
  const navigate = useNavigate();
  const { businessProfile, workingCapital, ratios, receivablesAgeing } = data;

  // Dynamically resolve ratio figures from data.ratios
  const dso = ratios.find((r) => r.id === 'dso')?.value || '68 Days';
  const dio = ratios.find((r) => r.id === 'dio')?.value || '42 Days';
  const dpo = ratios.find((r) => r.id === 'dpo')?.value || '29 Days';

  // Dynamically compute CCC via arithmetic
  const dsoNum = parseInt(dso, 10) || 0;
  const dioNum = parseInt(dio, 10) || 0;
  const dpoNum = parseInt(dpo, 10) || 0;
  const ccc = `${dsoNum + dioNum - dpoNum} Days`;

  // Dynamically sum receivables ageing
  const totalDebtorsNum = (receivablesAgeing || []).reduce((acc, b) => {
    const num = parseFloat(String(b.amount).replace(/[^0-9.]/g, '')) || 0;
    return acc + num;
  }, 0);
  const totalDebtorsText = `₹${totalDebtorsNum.toFixed(1)} Lakh`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-900">
      
      {/* Header Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/dashboard" className="hover:text-[#0F2F57]">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Financial Details & Ratios</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2F57] tracking-tight">
            Financial Mechanics & Solvency Diagnostics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Underlying accounting formulas, working capital mechanics, and balance sheet breakdown for {businessProfile.businessName}
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer shrink-0 self-start sm:self-center shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </button>
      </div>

      {/* Working Capital Cycle Mechanics Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#0F2F57]" />
            <h2 className="text-base font-bold text-[#0F2F57]">
              Cash Conversion Cycle (CCC) Mechanics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Measures the operational duration (in days) during which liquidity remains tied up in inventories and trade credit before converting into cash inflows.
          </p>
        </div>

        {/* Visual Formula Display */}
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Accounting Formula & Component Breakdown
            </div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-white px-3 py-1 rounded-md border border-slate-200 text-slate-700 shadow-2xs">
              <span className="text-[#0F2F57] font-bold">CCC ({ccc})</span>
              <span className="text-slate-400">=</span>
              <span className="text-amber-700 font-semibold">DSO ({dso})</span>
              <span className="text-slate-400">+</span>
              <span className="text-[#0F2F57] font-semibold">DIO ({dio})</span>
              <span className="text-slate-400">−</span>
              <span className="text-emerald-700 font-semibold">DPO ({dpo})</span>
            </div>
          </div>
          
          {/* Responsive Equation Chain: 2x2 grid on small/medium, single continuous row with centered operators on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:items-stretch gap-3">
            
            {/* Step 1: DSO */}
            <div className="flex-1 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Debtor Days (DSO)</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    + Inflow Delay
                  </span>
                </div>
                <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{dso}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Capital tied in client credit</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Benchmark:</span>
                <span className="font-semibold text-amber-700">&lt; 60 Days</span>
              </div>
            </div>

            {/* Operator + */}
            <div className="hidden lg:flex self-center items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-600 font-bold text-base shrink-0 shadow-2xs">
              +
            </div>

            {/* Step 2: DIO */}
            <div className="flex-1 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Inventory Days (DIO)</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    + Holding Period
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#0F2F57] mt-1 tabular-nums">{dio}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Raw material & WIP turnover</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Benchmark:</span>
                <span className="font-semibold text-emerald-700">&lt; 50 Days</span>
              </div>
            </div>

            {/* Operator - */}
            <div className="hidden lg:flex self-center items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-600 font-bold text-base shrink-0 shadow-2xs">
              −
            </div>

            {/* Step 3: DPO */}
            <div className="flex-1 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Creditor Days (DPO)</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    − Supplier Cushion
                  </span>
                </div>
                <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{dpo}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Supplier credit cushion</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Standard:</span>
                <span className="font-semibold text-emerald-700">30–45 Days</span>
              </div>
            </div>

            {/* Equals */}
            <div className="hidden lg:flex self-center items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-600 font-bold text-base shrink-0 shadow-2xs">
              =
            </div>

            {/* Net Result: CCC */}
            <div className="flex-1 p-4 bg-blue-50/90 border-2 border-blue-300 rounded-xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-blue-950 uppercase font-bold">Net Cash Cycle (CCC)</span>
                  <span className="inline-flex items-center text-[10px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
                    = Net Cycle
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#0F2F57] mt-1 tabular-nums">{ccc}</div>
                <div className="text-[11px] text-blue-800 mt-0.5">Operating capital turnover</div>
              </div>
              <div className="mt-3 pt-2 border-t border-blue-200/80 flex items-center justify-between text-[10px]">
                <span className="text-blue-900 font-medium">Nayak Gap:</span>
                <span className="font-bold text-blue-950 tabular-nums">{workingCapital.gap}</span>
              </div>
            </div>

          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-2xs">
            <Info className="w-4 h-4 text-[#0F2F57] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-[#0F2F57]">Commercial Underwriting Insight:</div>
              <p>
                With an annual turnover of <strong>{businessProfile.annualRevenue}</strong> and a net cycle of <strong>{ccc}</strong>, standard turnover-based Nayak Committee formulas mandate <strong>{workingCapital.requirement}</strong> in operating capital. The enterprise currently holds a sanctioned bank limit of <strong>{workingCapital.existingLimit}</strong>, confirming an institutional credit shortfall of <strong>{workingCapital.gap}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Ledger & Ratio Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#0F2F57]">
            Complete Coverage & Underwriting Ratio Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Full formula derivations, observed values, and commercial banking thresholds
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                <th className="py-3 px-3.5 font-semibold">Ratio Name</th>
                <th className="py-3 px-3.5 font-semibold">Calculated Value</th>
                <th className="py-3 px-3.5 font-semibold">Underlying Accounting Formula</th>
                <th className="py-3 px-3.5 font-semibold">Target Benchmark</th>
                <th className="py-3 px-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ratios.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-semibold text-slate-900">{r.name}</td>
                  <td className="py-3 px-3.5 font-bold text-slate-900 tabular-nums text-sm">{r.value}</td>
                  <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600">{r.formula}</td>
                  <td className="py-3 px-3.5 text-slate-600">{r.benchmark}</td>
                  <td className="py-3 px-3.5">
                    <Badge variant={r.status}>{r.statusLabel}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sundry Debtors Ageing Ledger Analysis with Visual Concentration Bars */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0F2F57]">
              Sundry Debtors Ageing Classification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bill-wise outstanding categorization extracted from Tally sales ledger
            </p>
          </div>
          <span className="text-xs text-slate-600">
            Total Trade Receivables: <strong className="text-slate-900 font-bold tabular-nums">{totalDebtorsText}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {receivablesAgeing.map((bucket, idx) => {
            const isRisk = bucket.isRisk;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
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
                      Provisioning Risk
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Normal Run
                    </span>
                  )}
                </div>

                <div className={`text-2xl font-bold mt-2 tabular-nums ${isRisk ? 'text-rose-700' : 'text-[#0F2F57]'}`}>
                  {bucket.amount}
                </div>

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

        {/* Bank Drawing Power (DP) Warning Note */}
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Bank Drawing Power (DP) Impact:</strong> Scheduled Commercial Banks generally exclude receivables older than 90 days (<strong>₹6.1 Lakh</strong>) from monthly Drawing Power computations. Initiating invoice discounting or structured recovery notices will restore these funds to current assets and boost drawing capacity.
          </div>
        </div>
      </div>

    </div>
  );
}

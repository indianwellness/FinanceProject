import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Badge from '../components/Badge';
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2,
  Building2,
  Clock,
  Banknote,
  FileCheck,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useCreditOS } from '../context/CreditOSContext';

export default function RecommendationsScreen() {
  const { data, showToast } = useCreditOS();
  const navigate = useNavigate();
  const { recommendations, businessProfile, workingCapital } = data;

  const [filterType, setFilterType] = useState('all');

  const handleApplyAction = (productTitle) => {
    showToast(`Application dossier initialized for ${productTitle}. Bank export ready in Phase 4.`);
  };

  const productMetadata = {
    cc_enhancement: {
      category: 'bank',
      institutionType: 'Scheduled Commercial Bank',
      turnaround: '10–14 Working Days',
      collateral: 'Hypothecation of stocks & book debts',
      interestRange: '8.85% – 10.25% p.a.',
      badgeLabel: 'Primary Bank Line'
    },
    invoice_discounting: {
      category: 'treds',
      institutionType: 'TReDS Platform (RXIL / M1xchange)',
      turnaround: '24–48 Hours per invoice',
      collateral: 'Clean / Unsecured (Backed by Buyer Acceptance)',
      interestRange: '7.50% – 9.00% p.a.',
      badgeLabel: 'Off-Balance Sheet'
    },
    cgtmse_term_loan: {
      category: 'guaranteed',
      institutionType: 'PSU / Private Commercial Bank',
      turnaround: '15–21 Working Days',
      collateral: 'Nil (100% CGTMSE Guarantee Coverage)',
      interestRange: '9.25% – 11.00% p.a.',
      badgeLabel: 'Zero Collateral'
    }
  };

  const filteredRecs = recommendations.filter((rec) => {
    if (filterType === 'all') return true;
    const meta = productMetadata[rec.id];
    return meta && meta.category === filterType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-900">
      
      {/* Header Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/dashboard" className="hover:text-[#0F2F57]">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Financing Routes</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2F57] tracking-tight">
            Matched Institutional Financing Pathways
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit facilities algorithmically evaluated against {businessProfile.businessName}'s cash flows and RBI priority sector guidelines
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

      {/* Overview Diagnostic Summary Banner */}
      <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0F2F57] uppercase tracking-wider">
            Diagnostic Underwriting Strategy
          </div>
          <div className="text-xs text-slate-700 mt-1 max-w-2xl leading-relaxed">
            Targeting the identified <strong>{workingCapital.gap}</strong> working capital deficit. Financing options are prioritized by approval probability, lowest cost of capital, and turnaround time.
          </div>
        </div>
        <div className="text-xs font-semibold text-blue-950 bg-white px-3 py-1.5 border border-blue-200 rounded-lg shadow-xs shrink-0">
          3 Qualified Financing Routes
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Matched Routes (3)' },
          { id: 'bank', label: 'Bank CC/OD Limits' },
          { id: 'treds', label: 'TReDS Invoice Discounting' },
          { id: 'guaranteed', label: 'CGTMSE Collateral-Free' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterType === tab.id
                ? 'bg-[#0F2F57] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-5">
        {filteredRecs.map((rec) => {
          const meta = productMetadata[rec.id] || {
            category: 'general',
            institutionType: 'Institutional Lender',
            turnaround: '7–14 Days',
            collateral: 'As per bank policy',
            interestRange: 'Competitive',
            badgeLabel: 'Institutional'
          };

          return (
            <div 
              key={rec.id} 
              className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-[#0F2F57]">{rec.title}</h3>
                    <Badge variant={rec.tagType}>{rec.tag}</Badge>
                    <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {meta.badgeLabel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Lender Category: <strong className="text-slate-700">{meta.institutionType}</strong></span>
                    <span>•</span>
                    <span>Expected Turnaround: <strong className="text-slate-700">{meta.turnaround}</strong></span>
                    <span>•</span>
                    <span>Indicative Rate: <strong className="text-slate-700">{meta.interestRange}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyAction(rec.title)}
                  className="px-4 py-2 bg-[#0F2F57] text-white text-xs font-semibold rounded-lg hover:bg-blue-900 transition-colors shrink-0 shadow-xs cursor-pointer whitespace-nowrap"
                >
                  Prepare Bank Dossier →
                </button>
              </div>

              {/* Rationale Bullet Points */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Algorithmic Underwriting Justification
                </div>
                <div className="space-y-2">
                  {rec.rationale.map((line, idx) => (
                    <div key={idx} className="text-xs text-slate-700 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collateral & Structure Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="text-slate-500 font-medium">Security / Collateral Required:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{meta.collateral}</div>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="text-slate-500 font-medium">Eligibility Underwriting Basis:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">DSCR 1.62x & Nayak Norms Validated</div>
                </div>
              </div>

              {/* Recommended Next Action */}
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-[#0F2F57] flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#0F2F57] text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                  →
                </div>
                <div className="leading-relaxed">
                  <span className="font-bold">Next Operational Step: </span>
                  <span>{rec.nextStep}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standard Underwriting Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#0F2F57]">
          Standard Bank Underwriting Dossier Checklist
        </h3>
        <p className="text-xs text-slate-500">
          Gather these documents before meeting your bank branch manager to accelerate sanction turnaround
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {[
            'Audited Balance Sheet & P&L (FY24 & FY25)',
            'Provisional Financials & CA Certificate (FY26)',
            'Last 12 Months Current Account Bank Statements',
            'Monthly Stock & Book Debts Statement',
            'GST Returns (GSTR-3B & GSTR-1 Reconciliation)',
            'Valid Udyam MSME Registration Certificate'
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2.5 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-blue-800 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Regulatory Disclaimer */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-800">Mandatory Regulatory Disclaimer (RBI Digital Lending Directions 2025):</strong>
          <p>
            MSME CreditOS operates strictly as a technology evaluation and diagnostic decision-support system. It does not issue formal sanction letters, approve credit limits, or act as a regulated lending institution. Final sanction, terms, and interest rates remain subject to independent credit appraisal, KYC verification, and underwriting criteria of individual Scheduled Commercial Banks and NBFCs.
          </p>
        </div>
      </div>

    </div>
  );
}

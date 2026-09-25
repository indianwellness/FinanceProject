import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCode,
  FileSpreadsheet,
  Sliders,
  TrendingUp,
  Building2,
  Cpu,
  ArrowUpRight,
  Shield,
  Layers,
  Banknote,
  Check
} from 'lucide-react';
import { useCreditOS } from '../context/CreditOSContext';
import Footer from '../components/Footer';

export default function LandingScreen() {
  const { loadDemoData } = useCreditOS();
  const navigate = useNavigate();

  // State for interactive Working Capital Calculator widget
  const [calcTurnover, setCalcTurnover] = useState(5.0); // in Crores
  const [calcDSO, setCalcDSO] = useState(60); // debtor days

  // State for FAQ Accordion
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleDemoClick = () => {
    loadDemoData();
    navigate('/dashboard');
  };

  // Mathematical Nayak Committee Working Capital Formula Calculation
  // Operating capital requirement = 25% of turnover
  // Promoter margin = 5% of turnover
  // Permissible Bank Finance (PBF) = 20% of turnover
  const requiredWC = (calcTurnover * 0.25).toFixed(2);
  const promoterMargin = (calcTurnover * 0.05).toFixed(2);
  const bankPBF = (calcTurnover * 0.20).toFixed(2);
  const lockedReceivables = ((calcTurnover * (calcDSO / 365))).toFixed(2);

  const faqs = [
    {
      q: 'Do I need to install any software or connect Tally to the internet?',
      a: 'Zero installation required. CreditOS operates entirely through standard Tally XML or Excel exports generated via the native Alt + E shortcut in TallyPrime or Tally.ERP 9. No credentials, ODBC drivers, or background agents are installed.'
    },
    {
      q: 'Will running an assessment trigger a hard inquiry on my commercial credit score?',
      a: 'No. MSME CreditOS is an independent technology pre-appraisal engine. It analyzes self-reported accounting statements locally in your browser session without contacting CIBIL, Experian, or CRIF High Mark.'
    },
    {
      q: 'How does CreditOS calculate borrowing capacity and working capital limits?',
      a: 'The engine implements Reserve Bank of India (RBI) approved underwriting models, specifically the Nayak Committee turnover method (mandating 20% Permissible Bank Finance) combined with cash conversion cycle analysis, Debt Service Coverage Ratio (DSCR), and bill-wise receivables quality.'
    },
    {
      q: 'What Tally versions and accounting statement formats are supported?',
      a: 'CreditOS natively supports TallyPrime (all releases), Tally.ERP 9, and standard Excel balance sheet formats exported by Chartered Accountants, including Schedule III P&L and Balance Sheet formats.'
    },
    {
      q: 'Can I use this report when negotiating with our bank branch manager?',
      a: 'Yes. The synthesized output structures your financials into standard commercial underwriting credit notes (CMA format equivalents), highlighting debt coverage, inventory velocity, and justified credit headroom.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 selection:bg-blue-100">
      
      {/* =========================================================================
          NAVBAR: N1b Canonical SaaS Three-Section Archetype
          Wordmark hard-left · Centered link cluster · Actions hard-right
          ========================================================================= */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Hard-Left: Brand & Engine Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded bg-[#0F2F57] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
                OS
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#0F2F57] tracking-tight whitespace-nowrap">
                  MSME CreditOS
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 whitespace-nowrap">
                  Tally Intelligence
                </span>
              </div>
            </div>

            {/* Centered Navigation Cluster (Anchor links with clean hover states) */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
              <a href="#how-it-works" className="hover:text-[#0F2F57] transition-colors whitespace-nowrap">
                How It Works
              </a>
              <a href="#calculator" className="hover:text-[#0F2F57] transition-colors whitespace-nowrap">
                WC Calculator
              </a>
              <a href="#benchmarks" className="hover:text-[#0F2F57] transition-colors whitespace-nowrap">
                Underwriting Norms
              </a>
              <a href="#comparison" className="hover:text-[#0F2F57] transition-colors whitespace-nowrap">
                The Advantage
              </a>
              <a href="#faqs" className="hover:text-[#0F2F57] transition-colors whitespace-nowrap">
                FAQs
              </a>
            </nav>

            {/* Hard-Right: Ghost CTA + Primary Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDemoClick}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#0F2F57] px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Try Demo</span>
              </button>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2F57] text-white text-xs font-semibold rounded-md hover:bg-blue-900 transition-colors shadow-xs whitespace-nowrap"
              >
                <span>Start Free Assessment</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION: Welcoming, Authoritative, Centered Fintech Hero
          Spacious layout, clear human narrative, and an intuitive 3-stage visual path
          ========================================================================= */}
      <section className="pt-14 pb-16 lg:pt-20 lg:pb-24 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Welcoming Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0F2F57] border border-blue-200 mx-auto shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>Autonomous Credit Intelligence Engine for Indian MSMEs</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F2F57] leading-tight sm:leading-tight max-w-4xl mx-auto">
            Know your exact borrowing capacity before meeting your bank.
          </h1>

          {/* Lede Paragraph */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Export your standard Tally accounting records in 30 seconds. CreditOS analyzes your working capital cycle, debt service coverage, and Nayak Committee norms to reveal your bankable headroom before branch managers review your file.
          </p>

          {/* Action Button Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/profile"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#0F2F57] text-white font-semibold text-sm rounded-lg hover:bg-blue-900 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <span>Launch Free Assessment</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
            <button
              onClick={handleDemoClick}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Explore Sample Assessment</span>
            </button>
          </div>

          {/* Reassurance Trust Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Native Tally Alt + E export</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero credit bureau inquiry</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% private browser session</span>
            </div>
          </div>

          {/* Welcoming 3-Step Transformation Card (Clean & Digestible Visual Journey) */}
          <div className="pt-6 max-w-4xl mx-auto text-left">
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
              
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center sm:text-left">
                How MSME CreditOS Transforms Your Balance Sheet:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Step 1 */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 relative shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-[#0F2F57] text-xs font-bold flex items-center justify-center border border-blue-200">
                      1
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">30 Seconds</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Export from TallyPrime</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Export Profit & Loss and Balance Sheet using standard <code className="text-[#0F2F57] font-semibold">Alt + E</code> into XML or Excel.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>No cloud API access needed</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 relative shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-[#0F2F57] text-xs font-bold flex items-center justify-center border border-blue-200">
                      2
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Automated</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Underwriting Diagnostics</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Evaluates your Cash Conversion Cycle (DSO/DPO), DSCR debt coverage, and Nayak Committee norms.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] font-medium text-blue-700">
                    <Sliders className="w-3 h-3" />
                    <span>Pinpoints working capital gap</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 relative shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-[#0F2F57] text-xs font-bold flex items-center justify-center border border-blue-200">
                      3
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 font-bold uppercase">Bankable</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Verified Credit Dossier</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Discover your exact borrowing headroom and pre-match with Bank CC/OD, CGTMSE, or TReDS.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] font-medium text-[#0F2F57]">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Ready for bank meetings</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SUPPORTED ECOSYSTEM & TRUST BANNER
          ========================================================================= */}
      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Compatible With Your Accounting Stack & Lending Schemes:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['TallyPrime (All Releases)', 'Tally.ERP 9', 'Busy Accounting', 'Zoho Books', 'CGTMSE Trust', 'TReDS (RXIL/M1xchange)', 'SBI SME Norms', 'Nayak Committee'].map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 shadow-2xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE WORKING CAPITAL & BORROWING CALCULATOR WIDGET
          ========================================================================= */}
      <section id="calculator" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Interactive Diagnostic Tool
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F2F57] mt-3">
              Estimate Your Nayak Committee Borrowing Headroom
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Commercial banks in India evaluate working capital limits using Reserve Bank of India Nayak Committee guidelines. Test your business numbers below:
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Left Input Sliders / Controls */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Annual Business Turnover</span>
                    <span className="text-[#0F2F57] text-sm tabular-nums">₹{calcTurnover.toFixed(1)} Crore</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[0.5, 1.0, 2.5, 5.0, 10.0, 25.0].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCalcTurnover(t)}
                        className={`py-2 rounded border text-xs font-bold transition-all cursor-pointer ${
                          calcTurnover === t
                            ? 'bg-[#0F2F57] text-white border-[#0F2F57] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ₹{t}Cr
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Customer Credit Period (Debtor Days / DSO)</span>
                    <span className="text-[#0F2F57] text-sm tabular-nums">{calcDSO} Days</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[30, 45, 60, 75, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCalcDSO(d)}
                        className={`py-2 rounded border text-xs font-bold transition-all cursor-pointer ${
                          calcDSO === d
                            ? 'bg-[#0F2F57] text-white border-[#0F2F57] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Note: Indian banks penalize receivables exceeding 90 days during monthly drawing power audits.
                  </p>
                </div>
              </div>

              {/* Right Output Calculated Metrics */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Regulatory Formula Breakdown (Nayak Committee)
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total Working Capital Needed (25%):</span>
                    <strong className="text-slate-900 font-bold tabular-nums">₹{requiredWC} Lakh</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Permissible Bank Finance (PBF 20%):</span>
                    <strong className="text-emerald-700 font-bold tabular-nums">₹{bankPBF} Lakh</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Minimum Promoter Margin (5%):</span>
                    <strong className="text-slate-900 font-bold tabular-nums">₹{promoterMargin} Lakh</strong>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-amber-800 font-semibold">Capital Locked in Receivables:</span>
                    <strong className="text-amber-800 font-bold tabular-nums">₹{lockedReceivables} Lakh</strong>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="w-full mt-2 py-2.5 px-4 bg-[#0F2F57] text-white font-semibold text-xs rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Run Exact Tally Ingestion for Your Business →</span>
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          UNDERWRITING ARCHITECTURE: Asymmetric Bento Feature Grid
          ========================================================================= */}
      <section id="how-it-works" className="py-16 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F2F57]">
              Engine Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F2F57] mt-1">
              Engineered specifically for Indian manufacturing and trading MSMEs
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              CreditOS combines ledger-level accounting verification with the credit assessment frameworks used by SBI, HDFC, and leading commercial banks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature Tile 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0F2F57] flex items-center justify-center font-bold">
                <FileCode className="w-5 h-5 text-[#0F2F57]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                1. Native Tally Ingestion
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export standard Profit & Loss, Balance Sheet, and Debtor ledgers via native Alt + E. CreditOS parses XML structures in real time without accessing your cloud or third-party servers.
              </p>
              <div className="text-[11px] font-semibold text-[#0F2F57] pt-2">
                • Zero API setup • Zero IT integration
              </div>
            </div>

            {/* Feature Tile 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0F2F57] flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5 text-[#0F2F57]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                2. Cash Conversion Cycle Mechanics
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computes debtor velocity (DSO), inventory holding days (DIO), and creditor repayment periods (DPO) to calculate the exact net days your operating cash remains trapped.
              </p>
              <div className="text-[11px] font-semibold text-[#0F2F57] pt-2">
                • Identifies drawing power shortfalls
              </div>
            </div>

            {/* Feature Tile 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0F2F57] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-[#0F2F57]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                3. Matched Institutional Pathways
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Matches qualifying credit structures: Bank Cash Credit (CC/OD) enhancement, CGTMSE collateral-free term loans up to ₹5 Crore, or TReDS platform invoice discounting.
              </p>
              <div className="text-[11px] font-semibold text-[#0F2F57] pt-2">
                • Turnaround time & pricing guidance
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          THE ADVANTAGE: Traditional Loan Process vs MSME CreditOS
          ========================================================================= */}
      <section id="comparison" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F2F57]">
              Why Proactive Pre-Underwriting Matters
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Most MSME loan rejections occur because business owners don’t see what bank credit committees see in their ledger statements.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-3 px-4 font-bold w-1/4">Evaluation Dimension</th>
                  <th className="py-3 px-4 font-bold w-3/8 text-rose-800 bg-rose-50/50">
                    Traditional Bank Application Route
                  </th>
                  <th className="py-3 px-4 font-bold w-3/8 text-[#0F2F57] bg-blue-50/50">
                    MSME CreditOS Pre-Appraisal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">Turnaround Time</td>
                  <td className="py-3 px-4 text-slate-600">3 to 6 weeks of branch follow-ups</td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">Under 3 minutes autonomous diagnosis</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">Drawing Power Discovery</td>
                  <td className="py-3 px-4 text-slate-600">Sudden limits blocked due to 90+ day debtors</td>
                  <td className="py-3 px-4 font-semibold text-[#0F2F57]">Automatic aging isolation & recovery advice</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">Underwriting Standards</td>
                  <td className="py-3 px-4 text-slate-600">Opaque bank rules; unexplained rejection letters</td>
                  <td className="py-3 px-4 font-semibold text-[#0F2F57]">Nayak Committee & DSCR formulas fully exposed</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">Financing Match</td>
                  <td className="py-3 px-4 text-slate-600">Restricted to the single branch's quota</td>
                  <td className="py-3 px-4 font-semibold text-[#0F2F57]">Multi-product matching: CC, CGTMSE, TReDS</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* =========================================================================
          UNDERWRITING BENCHMARKS MATRIX
          ========================================================================= */}
      <section id="benchmarks" className="py-16 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F2F57]">
                Regulatory Rules
              </span>
              <h2 className="text-2xl font-bold text-[#0F2F57] mt-1">
                Commercial Bank Underwriting Benchmarks
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Calibrated for Scheduled Commercial Banks & NBFCs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
              <div className="text-[11px] uppercase font-bold text-slate-500">Nayak Committee Norm</div>
              <div className="text-lg font-bold text-[#0F2F57]">Min 20% PBF</div>
              <p className="text-[11px] text-slate-600">
                Banks must provide minimum 20% of projected annual turnover as working capital for limits up to ₹5 Crore.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
              <div className="text-[11px] uppercase font-bold text-slate-500">Debt Service Coverage (DSCR)</div>
              <div className="text-lg font-bold text-emerald-700">&gt; 1.30x Threshold</div>
              <p className="text-[11px] text-slate-600">
                Operating EBITDA must exceed annual debt repayment obligations by at least 1.30x to qualify for term credit.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
              <div className="text-[11px] uppercase font-bold text-slate-500">Debtor Aging Limit</div>
              <div className="text-lg font-bold text-amber-700">&lt; 90 Days Rule</div>
              <p className="text-[11px] text-slate-600">
                Receivables overdue beyond 90 days are stripped from Drawing Power computations and require special provisioning.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
              <div className="text-[11px] uppercase font-bold text-slate-500">Current Ratio Norm</div>
              <div className="text-lg font-bold text-[#0F2F57]">&gt; 1.33x Liquidity</div>
              <p className="text-[11px] text-slate-600">
                Current assets should comfortably exceed current liabilities by 1.33x to ensure trade solvency.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          FAQ ACCORDION SECTION
          ========================================================================= */}
      <section id="faqs" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F2F57]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Clear answers regarding privacy, Tally exports, and bank eligibility
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50 shadow-xs">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className="p-4 sm:p-5 transition-colors">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-[#0F2F57]">{faq.q}</span>
                    <span className="text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="text-xs text-slate-600 mt-2.5 leading-relaxed pt-2 border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* =========================================================================
          CLOSING ACTION STRIP
          ========================================================================= */}
      <section className="py-16 bg-[#0F2F57] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            See what banks see in your balance sheet before submitting.
          </h2>
          <p className="text-sm text-blue-200 max-w-xl mx-auto leading-relaxed">
            Run an autonomous credit readiness check using standard TallyPrime statements in under 3 minutes. Zero setup, 100% private.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/profile"
              className="px-6 py-3.5 bg-white text-[#0F2F57] font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
            >
              Start Free Business Assessment →
            </Link>
            <button
              onClick={handleDemoClick}
              className="px-5 py-3.5 bg-blue-900/60 border border-blue-400/30 text-white font-semibold text-xs rounded-lg hover:bg-blue-900 transition-colors cursor-pointer"
            >
              Explore Sample MSME (Apex Gears)
            </button>
          </div>
        </div>
      </section>

      {/* Institutional Global Footer */}
      <Footer />

    </div>
  );
}

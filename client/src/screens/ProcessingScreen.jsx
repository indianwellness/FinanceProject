import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  ShieldCheck,
  Terminal,
  Activity
} from 'lucide-react';

const STEPS = [
  {
    title: 'Ingesting Tally accounting data structures',
    detail: 'Parsing XML masters, trial balance, and profit & loss ledgers...',
    log: '[00:00.4] Ingested 1,248 XML ledger nodes · Trial balance zero-balanced'
  },
  {
    title: 'Evaluating working capital cycle mechanics',
    detail: 'Computing DSO (68 days), DPO (29 days), and Cash Conversion Cycle...',
    log: '[00:01.1] DSO: 68d · DPO: 29d · Net Cash Cycle established at 81 days'
  },
  {
    title: 'Analyzing debt service coverage & leverage',
    detail: 'Cross-checking EBITDA to repayment obligations (DSCR: 1.62x)...',
    log: '[00:01.8] EBITDA margin: 18.5% · DSCR: 1.62x · Interest Cover: 3.40x'
  },
  {
    title: 'Synthesizing Credit Readiness & Financial Health scores',
    detail: 'Calibrating Nayak Committee turnover benchmarks and scoring algorithms...',
    log: '[00:02.3] Nayak Committee 20% PBF requirement calibrated: ₹78.0 Lakh'
  },
  {
    title: 'Matching institutional lender underwriting rules',
    detail: 'Screening eligibility across PSU Banks, CGTMSE coverage, and TReDS discount...',
    log: '[00:02.9] Matched 3 credit facilities · Bank CC/OD, CGTMSE, TReDS'
  }
];

export default function ProcessingScreen() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  // Step progression timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= STEPS.length - 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return prev;
        }
        return prev + 1;
      });
    }, 550);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Completion trigger effect when final step is reached
  useEffect(() => {
    if (activeStep === STEPS.length - 1) {
      timeoutRef.current = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 700);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeStep, navigate]);

  const handleSkip = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    navigate('/dashboard', { replace: true });
  };

  const progressPercent = Math.min(Math.round(((activeStep + 1) / STEPS.length) * 100), 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-900">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#0F2F57] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
              OS
            </div>
            <span className="font-bold text-sm text-[#0F2F57] tracking-tight">
              MSME CreditOS
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-[#0F2F57] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Skip to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Diagnostic Terminal Console */}
      <div className="max-w-2xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Engine Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0F2F57] flex items-center justify-center mx-auto border border-blue-200 shadow-2xs">
              <Cpu className="w-6 h-6 animate-pulse text-[#0F2F57]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F2F57] tracking-tight">
              Synthesizing Credit Diagnostic
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Evaluating financial statements against commercial underwriting benchmarks and RBI guidelines.
            </p>
          </div>

          {/* Progress Bar with Live Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Synthesizing Statements...</span>
              </span>
              <span className="font-mono tabular-nums text-[#0F2F57]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-[#0F2F57] h-full transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Step-by-Step Diagnostic Verification Card */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50 overflow-hidden">
            {STEPS.map((step, idx) => {
              const isDone = idx < activeStep;
              const isCurrent = idx === activeStep;

              return (
                <div 
                  key={idx} 
                  className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors ${
                    isCurrent ? 'bg-blue-50/70' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#0F2F57] border-t-transparent animate-spin"></div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className={`text-xs font-semibold ${
                      isDone 
                        ? 'text-slate-800' 
                        : isCurrent 
                          ? 'text-[#0F2F57] font-bold' 
                          : 'text-slate-400'
                    }`}>
                      {step.title}
                    </div>
                    {isCurrent && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        {step.detail}
                      </div>
                    )}
                  </div>

                  {isDone && (
                    <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      VERIFIED
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Real-time Telemetry Log Bar */}
          <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-[11px] flex items-center gap-2 overflow-x-auto shadow-inner">
            <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{STEPS[activeStep].log}</span>
          </div>

          {/* Diagnostic Console Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero external transmission • In-memory compute</span>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-colors cursor-pointer"
            >
              Skip Diagnostics →
            </button>
          </div>

        </div>
      </div>

      {/* Footer Minimal Notice */}
      <div className="py-6 text-center text-xs text-slate-400">
        CreditOS Diagnostic Engine v2.4 • Nayak Committee Norms • RBI Digital Lending Compliance
      </div>
    </div>
  );
}

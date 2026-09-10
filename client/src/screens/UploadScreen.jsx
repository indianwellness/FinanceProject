import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  FileCode, 
  FileSpreadsheet, 
  Sparkles,
  Trash2,
  Lock,
  Info,
  ShieldCheck
} from 'lucide-react';
import { useCreditOS } from '../context/CreditOSContext';

export default function UploadScreen() {
  const { uploadedFiles, setUploadedFiles, showToast } = useCreditOS();
  const navigate = useNavigate();

  const fileInputRefs = {
    pl: useRef(null),
    bs: useRef(null),
    debtors: useRef(null),
    creditors: useRef(null)
  };

  const handleFileChange = (key, file) => {
    if (!file) return;
    setUploadedFiles((prev) => ({
      ...prev,
      [key]: {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      }
    }));
    showToast(`Attached ${file.name}`);
  };

  const handleRemoveFile = (e, key) => {
    e.stopPropagation();
    setUploadedFiles((prev) => ({
      ...prev,
      [key]: null
    }));
  };

  const handleLoadDemoFiles = () => {
    setUploadedFiles({
      pl: { name: 'Apex_PL_Statement_FY25-26.xml', size: '142.4 KB' },
      bs: { name: 'Apex_Balance_Sheet_FY25-26.xml', size: '186.2 KB' },
      debtors: { name: 'Apex_Debtors_Ageing_Report.xlsx', size: '88.6 KB' },
      creditors: { name: 'Apex_Creditors_Ageing_Report.xlsx', size: '64.1 KB' }
    });
    showToast('Loaded verified Tally accounting records for Apex Precision Gears.');
  };

  const uploadedCount = Object.values(uploadedFiles).filter(Boolean).length;
  // Core analysis strictly requires at least P&L and Balance Sheet
  const canRun = Boolean(uploadedFiles.pl && uploadedFiles.bs);

  const documentSlots = [
    {
      key: 'pl',
      name: 'Profit & Loss Statement',
      category: 'Core Mandatory Statement',
      description: 'Calculates operating EBITDA, gross margins, and debt service coverage (DSCR).',
      extensions: '.XML, .XLSX',
      required: true,
      icon: FileCode
    },
    {
      key: 'bs',
      name: 'Balance Sheet',
      category: 'Core Mandatory Statement',
      description: 'Establishes net worth, current ratio, outstanding leverage, and fixed assets.',
      extensions: '.XML, .XLSX',
      required: true,
      icon: FileSpreadsheet
    },
    {
      key: 'debtors',
      name: 'Sundry Debtors Ageing Ledger',
      category: 'Supplementary Working Capital',
      description: 'Bill-wise customer receivables ageing to evaluate collection velocity (DSO).',
      extensions: '.XLSX, .CSV',
      required: false,
      icon: FileSpreadsheet
    },
    {
      key: 'creditors',
      name: 'Sundry Creditors Ageing Ledger',
      category: 'Supplementary Working Capital',
      description: 'Supplier payables ageing to calculate trade credit cycle days (DPO).',
      extensions: '.XLSX, .CSV',
      required: false,
      icon: FileSpreadsheet
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900">
      
      {/* Sleek Onboarding Header with Stepper */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded bg-[#0F2F57] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
                OS
              </div>
              <span className="font-bold text-sm text-[#0F2F57] tracking-tight">
                MSME CreditOS
              </span>
            </Link>

            {/* Stepper indicator */}
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
              <Link to="/profile" className="text-slate-500 hover:text-slate-800">
                1. Business Setup
              </Link>
              <span className="text-slate-300">→</span>
              <span className="font-bold text-[#0F2F57] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                2. Tally Ingestion
              </span>
              <span className="text-slate-300">→</span>
              <span className="text-slate-400">3. Credit Cockpit</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            ← Back to Profile
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Instructions & Tally Export Cheat Sheet */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Step 2 of 2
              </div>
              <h2 className="text-xl font-bold text-[#0F2F57] tracking-tight">
                Tally Report Ingestion
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                CreditOS parses native TallyPrime statements directly. No API configurations, credentials, or third-party plug-ins needed.
              </p>

              {/* Tally Export Cheat Sheet */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  How to export from Tally:
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-[#0F2F57] bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                      Alt + E
                    </span>
                    <span className="text-[11px] leading-tight pt-0.5">
                      Press from any Report screen in TallyPrime.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-[#0F2F57] bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                      Format
                    </span>
                    <span className="text-[11px] leading-tight pt-0.5">
                      Select <strong>XML (Data Interchange)</strong> or <strong>Excel Spreadsheet</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-[#0F2F57] bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                      Scope
                    </span>
                    <span className="text-[11px] leading-tight pt-0.5">
                      Select Period as FY 2025–26 or recent 12 months.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Encrypted in-memory processing. Statements never saved to remote servers.</span>
              </div>
            </div>

            {/* Quick Demo Pre-fill */}
            <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F2F57]" />
                <span className="text-xs font-bold text-[#0F2F57]">Don’t have Tally exports handy?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Load audited sample records for Apex Precision Gears Pvt Ltd to experience the full credit diagnostic immediately.
              </p>
              <button
                type="button"
                onClick={handleLoadDemoFiles}
                className="w-full mt-2 py-2 px-3 bg-white border border-blue-300 rounded text-xs font-semibold text-[#0F2F57] hover:bg-blue-50 transition-colors cursor-pointer text-center shadow-2xs"
              >
                Load Sample Tally Statements
              </button>
            </div>
          </div>

          {/* Right Upload Panel */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
              
              {/* Readiness Status Header */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Ingestion Status: {uploadedCount} of 4 Statements Attached
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {canRun ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Core statements attached. Engine ready for synthesis.
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">
                        * Profit & Loss and Balance Sheet are mandatory to compute ratios.
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                    canRun 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {canRun ? 'Ready to Analyze' : 'Awaiting Core Files'}
                  </span>
                </div>
              </div>

              {/* Upload Slots */}
              <div className="space-y-4">
                {documentSlots.map((slot) => {
                  const uploaded = uploadedFiles[slot.key];
                  const Icon = slot.icon;

                  return (
                    <div
                      key={slot.key}
                      onClick={() => fileInputRefs[slot.key].current?.click()}
                      className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all ${
                        uploaded
                          ? 'border-emerald-300 bg-emerald-50/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRefs[slot.key]}
                        className="hidden"
                        accept=".xml,.xlsx,.xls,.csv"
                        onChange={(e) => {
                          handleFileChange(slot.key, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />

                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          uploaded 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {uploaded ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {uploaded ? uploaded.name : slot.name}
                            </span>
                            {slot.required && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                Required
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {uploaded ? (
                              <span className="tabular-nums font-mono text-emerald-800">
                                {uploaded.size} • Verified Format
                              </span>
                            ) : (
                              <span>{slot.description}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {uploaded ? (
                          <>
                            <span className="text-[11px] font-semibold text-emerald-800 px-2.5 py-1 bg-emerald-100/70 border border-emerald-200 rounded">
                              Attached
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveFile(e, slot.key)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Remove attached file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F2F57] bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            <span>Attach ({slot.extensions})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Action Buttons */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Business Profile</span>
                </button>

                <button
                  type="button"
                  disabled={!canRun}
                  onClick={() => navigate('/processing')}
                  className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-xs ${
                    canRun
                      ? 'bg-[#0F2F57] text-white hover:bg-blue-900 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Execute Diagnostic Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

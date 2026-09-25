import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  BarChart2,
  Building,
  Factory,
  Layers,
  Truck,
  FlaskConical,
  Scissors,
  CheckCircle2
} from 'lucide-react';
import { useCreditOS } from '../context/CreditOSContext';

export default function ProfileScreen() {
  const { data, updateProfile, showToast } = useCreditOS();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if routed in edit mode from dashboard
  const isEditingMode = location.state?.fromDashboard === true;

  // Local draft state to ensure Cancel rolls back unsaved edits
  const [formData, setFormData] = useState({ ...data.businessProfile });

  useEffect(() => {
    setFormData({ ...data.businessProfile });
  }, [data.businessProfile]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTurnoverSelect = (range, revenue) => {
    setFormData((prev) => ({
      ...prev,
      turnoverRange: range,
      annualRevenue: revenue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    if (isEditingMode) {
      showToast('Business parameters updated successfully.');
      navigate('/dashboard');
    } else {
      navigate('/upload');
    }
  };

  const handleCancel = () => {
    setFormData({ ...data.businessProfile });
    if (isEditingMode) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const industries = [
    { name: 'Auto Components & Light Engineering', icon: Factory, note: 'Tighter DSO norms (60 days)' },
    { name: 'Manufacturing & Fabrication', icon: Building, note: 'Capital intensive capex norms' },
    { name: 'Wholesale & B2B Trading', icon: Layers, note: 'Higher inventory turnover cycle' },
    { name: 'Distribution & Logistics', icon: Truck, note: 'Working capital driven receivables' },
    { name: 'Chemicals & Pharmaceuticals', icon: FlaskConical, note: 'Extended batch holding cycles' },
    { name: 'Textiles & Garments', icon: Scissors, note: 'Seasonal peak working capital' }
  ];

  const turnoverOptions = [
    { range: '₹10L – ₹50L', label: 'Nano Enterprise', revenue: '₹30 Lakh', pbf: 'MUDRA / PBF up to ₹10L' },
    { range: '₹50L – ₹1Cr', label: 'Micro Enterprise', revenue: '₹85 Lakh', pbf: 'PBF up to ₹20L' },
    { range: '₹1Cr – ₹5Cr', label: 'Small Enterprise', revenue: '₹4.80 Crore', pbf: 'PBF up to ₹1.0Cr' },
    { range: '₹5Cr – ₹25Cr', label: 'Medium Enterprise', revenue: '₹14.50 Crore', pbf: 'PBF up to ₹5.0Cr' },
    { range: '₹25Cr+', label: 'Mid-Market Enterprise', revenue: '₹32.00 Crore', pbf: 'PBF up to ₹8.0Cr+' }
  ];

  const vintageOptions = ['Less than 1 Year', '1–3 Years', '3–5 Years', '6 Years'];

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
            {!isEditingMode && (
              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
                <span className="font-bold text-[#0F2F57] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  1. Business Setup
                </span>
                <span className="text-slate-300">→</span>
                <span className="text-slate-400">2. Tally Ingestion</span>
                <span className="text-slate-300">→</span>
                <span className="text-slate-400">3. Credit Cockpit</span>
              </div>
            )}
          </div>

          <button
            onClick={handleCancel}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {isEditingMode ? 'Cancel & Return to Dashboard' : 'Cancel & Exit'}
          </button>
        </div>
      </header>

      {/* Main Guided Form Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Context & Guidance Rail */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isEditingMode ? 'Parameter Calibration' : 'Step 1 of 2'}
              </div>
              <h2 className="text-xl font-bold text-[#0F2F57] tracking-tight">
                {isEditingMode ? 'Calibrate Underwriting Norms' : 'Tell us about your business'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Indian commercial banks apply sector-specific benchmarks when underwriting working capital limits. These initial parameters calibrate acceptable debtor days and debt service ratios.
              </p>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <BarChart2 className="w-4 h-4 text-[#0F2F57] shrink-0 mt-0.5" />
                  <span>Calibrates Nayak Committee working capital norms (minimum 20% margin).</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Session-only memory. Zero permanent database records retained.</span>
                </div>
              </div>
            </div>

            {/* Micro Demo Card */}
            <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F2F57]" />
                <span className="text-xs font-bold text-[#0F2F57]">Sample Company Available</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skip manual entry and explore with verified manufacturing records for Apex Precision Gears.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    businessName: 'Apex Precision Gears Pvt Ltd',
                    industry: 'Auto Components & Light Engineering',
                    turnoverRange: '₹1Cr – ₹5Cr',
                    annualRevenue: '₹4.80 Crore',
                    vintage: '6 Years',
                    constitution: 'Private Limited',
                    state: 'Maharashtra',
                    assessmentDate: '09 Sep 2026',
                    status: 'Verified Accounting Data'
                  });
                }}
                className="w-full mt-2 py-2 px-3 bg-white border border-blue-300 rounded text-xs font-semibold text-[#0F2F57] hover:bg-blue-50 transition-colors cursor-pointer text-center shadow-2xs"
              >
                Pre-fill with Demo Data →
              </button>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
              
              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Company / Legal Business Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName || ''}
                  onChange={(e) => handleFieldChange('businessName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2F57]/20 focus:border-[#0F2F57] text-sm shadow-2xs"
                  placeholder="e.g. Apex Precision Gears Pvt Ltd"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Name as registered in your Tally company master.
                </p>
              </div>

              {/* Industry Selection with Category Icons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Primary Sector / Industry
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {industries.map((ind) => {
                    const isSelected = formData.industry === ind.name;
                    const Icon = ind.icon;
                    return (
                      <button
                        type="button"
                        key={ind.name}
                        onClick={() => handleFieldChange('industry', ind.name)}
                        className={`text-left p-3 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-[#0F2F57] text-white border-[#0F2F57] shadow-xs'
                            : 'bg-slate-50/50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                        <div className="min-w-0">
                          <div className="font-semibold">{ind.name}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                            {ind.note}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Turnover Range with Headroom Guidance */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Annual Turnover Bracket (FY 2025–26)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {turnoverOptions.map((opt) => {
                    const isSelected = formData.turnoverRange === opt.range;
                    return (
                      <button
                        type="button"
                        key={opt.range}
                        onClick={() => handleTurnoverSelect(opt.range, opt.revenue)}
                        className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F2F57] text-white border-[#0F2F57] shadow-xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{opt.range}</div>
                        <div className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                          {opt.label}
                        </div>
                        <div className={`text-[9px] mt-1 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {opt.pbf}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operating Vintage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Operating Vintage (Years in Business)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {vintageOptions.map((vin) => {
                    const isSelected = formData.vintage === vin;
                    const label = vin === '6 Years' ? '5+ Years' : vin;
                    return (
                      <button
                        type="button"
                        key={vin}
                        onClick={() => handleFieldChange('vintage', vin)}
                        className={`p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#0F2F57] text-white border-[#0F2F57] shadow-xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isEditingMode ? 'Cancel Changes' : 'Back to Home'}</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0F2F57] text-white text-xs font-semibold rounded-lg hover:bg-blue-900 transition-colors flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {isEditingMode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Return to Dashboard</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Ingest Tally Statements</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

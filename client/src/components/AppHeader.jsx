import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Download, Building2, BarChart3, Sliders, ShieldCheck, PlusCircle } from 'lucide-react';
import { useCreditOS } from '../context/CreditOSContext';

export default function AppHeader() {
  const { data, dprInput, showToast, resetSession } = useCreditOS();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/dpr-review', label: 'DPR Review', icon: Sliders },
    { to: '/details', label: 'Financial Details', icon: Sliders },
    { to: '/recommendations', label: 'Financing Routes', icon: ShieldCheck }
  ];

  const handleDownloadReport = () => {
    showToast('Report generation initiated. Full PDF export is scheduled for Phase 4.');
  };

  const handleNewAnalysis = () => {
    resetSession();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand & Left Segment */}
          <div className="flex items-center gap-5 shrink-0">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
              title="Return to Dashboard"
            >
              <div className="w-7 h-7 rounded bg-[#0F2F57] text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-xs">
                OS
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#0F2F57] tracking-tight whitespace-nowrap">
                  MSME CreditOS
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider whitespace-nowrap">
                  v2.4
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Tabs: Explicit whitespace-nowrap prevents multi-line text wrapping */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-[#0F2F57] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Action Group */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Active Company Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 whitespace-nowrap">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium max-w-[170px] truncate">
                {dprInput?.entityName || data.businessProfile.businessName}
              </span>
            </div>

            {/* New Analysis Button */}
            <button
              onClick={handleNewAnalysis}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              title="Start a new analysis for another business"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">New Analysis</span>
            </button>

            {/* Download Report Button */}
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#0F2F57] text-white hover:bg-blue-900 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Export Dossier</span>
            </button>

          </div>
        </div>

        {/* Mobile Sub-Navigation Row */}
        <div className="md:hidden flex items-center justify-between pb-2 overflow-x-auto border-t border-slate-100 pt-2 gap-2">
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0F2F57] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <button
            onClick={handleNewAnalysis}
            className="px-2 py-1 text-xs font-medium text-slate-700 border border-slate-200 rounded shrink-0 cursor-pointer whitespace-nowrap"
          >
            + New
          </button>
        </div>

      </div>
    </header>
  );
}

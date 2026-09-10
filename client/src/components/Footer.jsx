import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#0F2F57] text-white flex items-center justify-center font-bold text-xs tracking-wider">
                OS
              </div>
              <span className="font-bold text-sm text-[#0F2F57] tracking-tight">
                MSME CreditOS
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                Tally Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              Autonomous financial intelligence platform transforming raw Tally accounting ledgers into institutional credit readiness metrics and bank borrowing assessments.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Compliant with RBI Digital Lending Directions (2025) • Zero Data Retention</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider">
              Assessment Flow
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-[#0F2F57] transition-colors">
                  Overview & Landing
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-[#0F2F57] transition-colors">
                  Business Profile Setup
                </Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-[#0F2F57] transition-colors">
                  Tally Report Ingestion
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#0F2F57] transition-colors">
                  Executive Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider">
              Credit Diagnostics
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/details" className="hover:text-[#0F2F57] transition-colors">
                  Ratio & CCC Breakdown
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="hover:text-[#0F2F57] transition-colors">
                  Financing Products Match
                </Link>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">
                  CIBIL / Experian Connector (Roadmap)
                </span>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">
                  Account Aggregator (Roadmap)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} MSME CreditOS. Built for Indian Micro, Small & Medium Enterprises.
          </div>
          <div className="flex items-center gap-4">
            <span>256-Bit SSL Security</span>
            <span>•</span>
            <span>Non-Lender Technology Assessment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

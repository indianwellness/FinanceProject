import React from 'react';

const VARIANTS = {
  good: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  watch: 'bg-amber-50 text-amber-800 border-amber-300',
  risk: 'bg-rose-50 text-rose-800 border-rose-300',
  navy: 'bg-blue-50 text-[#0F2F57] border-blue-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-300'
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variantClass = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantClass} ${className}`}>
      {children}
    </span>
  );
}

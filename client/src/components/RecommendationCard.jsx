import React from 'react';
import Badge from './Badge';

export default function RecommendationCard({ recommendation, variant = 'full' }) {
  const { title, tag, tagType, rationale = [], nextStep } = recommendation;

  if (variant === 'compact') {
    return (
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-xs font-bold text-slate-900">{title}</h4>
            <Badge variant={tagType}>{tag}</Badge>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            {rationale[0] || ''}
          </p>
        </div>
        <div className="text-[11px] text-[#0F2F57] font-medium pt-2 border-t border-slate-200/60">
          Next Step: {nextStep}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-[#0F2F57]">{title}</h3>
        <Badge variant={tagType}>{tag}</Badge>
      </div>
      <div className="space-y-2 mb-4">
        {rationale.map((line, i) => (
          <div key={i} className="text-xs text-slate-700 flex items-start gap-2">
            <span className="text-[#0F2F57] font-bold">•</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded text-xs text-[#0F2F57]">
        <strong>Recommended Next Step:</strong> {nextStep}
      </div>
    </div>
  );
}

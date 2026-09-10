import React from 'react';

export default function ScoreGauge({
  score = 0,
  max = 100,
  size = 110,
  strokeWidth = 10,
  rating = '',
  ratingColor
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(Math.max(score / (max || 100), 0), 1);
  const strokeDashoffset = circumference - ratio * circumference;
  const pct = ratio * 100;

  // Solid stroke and text color dynamically synced based on normalized percentage
  let strokeColor = '#059669'; // emerald
  let defaultTextColor = 'text-emerald-700';

  if (pct >= 80) {
    strokeColor = '#059669';
    defaultTextColor = 'text-emerald-700';
  } else if (pct >= 65) {
    strokeColor = '#D97706'; // amber
    defaultTextColor = 'text-amber-700';
  } else {
    strokeColor = '#DC2626'; // rose / crimson
    defaultTextColor = 'text-rose-700';
  }

  const finalRatingColor = ratingColor || defaultTextColor;

  return (
    <div className="flex items-center gap-4">
      <div className="relative inline-flex items-center justify-center shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />
          {/* Active value track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {score}
          </span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">
            /{max}
          </span>
        </div>
      </div>
      {rating && (
        <div>
          <div className={`text-base font-semibold ${finalRatingColor}`}>
            {rating}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Credit Assessment
          </div>
        </div>
      )}
    </div>
  );
}

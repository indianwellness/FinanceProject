import React from 'react';
import Badge from './Badge';

export default function MetricCard({
  title,
  subtitle,
  badge,
  badgeVariant = 'neutral',
  children,
  footer,
  className = ''
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {badge && (
            <div>
              {typeof badge === 'string' ? (
                <Badge variant={badgeVariant}>{badge}</Badge>
              ) : (
                badge
              )}
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mb-3">{subtitle}</p>
        )}
        <div className="mt-1">
          {children}
        </div>
      </div>
      {footer && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}

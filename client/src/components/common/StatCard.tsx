import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subvalue?: string;
  icon?: React.ReactNode;
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlight?: 'default' | 'accent' | 'attention' | 'danger' | 'success';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subvalue,
  icon,
  badge,
  trend,
  highlight = 'default',
  onClick,
  className = '',
}) => {
  const isClickable = Boolean(onClick);

  const highlightStyles = {
    default: 'border-line bg-paper-light hover:border-line-dark',
    accent: 'border-primary/30 bg-primary-soft/40 hover:border-primary/60',
    attention: 'border-warning/30 bg-warning-soft/40 hover:border-warning/60',
    danger: 'border-danger/30 bg-danger-soft/40 hover:border-danger/60',
    success: 'border-success/30 bg-success-soft/40 hover:border-success/60',
  }[highlight];

  const valueColorStyles = {
    default: 'text-ink',
    accent: 'text-primary',
    attention: 'text-warning',
    danger: 'text-danger',
    success: 'text-success',
  }[highlight];

  return (
    <div
      onClick={onClick}
      className={`border rounded-md p-4 sm:p-5 transition-all duration-200 shadow-2xs space-y-2.5 ${highlightStyles} ${
        isClickable ? 'cursor-pointer hover:-translate-y-[2px] hover:shadow-card-hover active:translate-y-0' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-muted uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div className="w-6 h-6 rounded-xs flex items-center justify-center text-muted shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className={`font-display text-2xl sm:text-3xl font-black tracking-tight leading-none ${valueColorStyles}`}>
          {value}
        </div>
        {badge && (
          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase bg-paper-dark text-muted border border-line">
            {badge}
          </span>
        )}
      </div>

      {(subvalue || trend) && (
        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
          {subvalue && (
            <span className="font-mono text-[11px] text-muted truncate">
              {subvalue}
            </span>
          )}
          {trend && (
            <span
              className={`font-mono text-[10px] font-bold shrink-0 ${
                trend.isPositive ? 'text-success' : 'text-danger'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

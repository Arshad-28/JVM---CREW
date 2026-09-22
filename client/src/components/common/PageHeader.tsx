import React from 'react';

interface PageHeaderProps {
  kicker?: string;
  kickerBadge?: string;
  kickerIcon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  kicker,
  kickerBadge,
  kickerIcon,
  title,
  description,
  actions,
  meta,
  className = '',
}) => {
  return (
    <div className={`border border-line bg-paper-light p-4 sm:p-6 rounded-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs ${className}`}>
      <div className="space-y-1.5 min-w-0 flex-1">
        {/* Kicker Row */}
        {(kicker || kickerBadge || kickerIcon || meta) && (
          <div className="flex flex-wrap items-center gap-2">
            {kickerIcon && <span className="text-accent shrink-0">{kickerIcon}</span>}
            {kicker && (
              <span className="font-mono text-[10px] sm:text-xs text-muted font-semibold uppercase tracking-wider">
                {kicker}
              </span>
            )}
            {kickerBadge && (
              <span className="font-mono text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase bg-accent-subtle text-accent border border-accent/30">
                {kickerBadge}
              </span>
            )}
            {meta}
          </div>
        )}

        {/* Title */}
        <h1 className="font-display text-xl sm:text-2xl font-black text-ink uppercase tracking-tight truncate leading-tight">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-xs sm:text-sm text-muted font-normal leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {/* Actions Slot */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

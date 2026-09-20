import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`border border-dashed border-line rounded-sm bg-paper/60 text-center flex flex-col items-center justify-center ${
        compact ? 'p-6 space-y-2' : 'p-10 sm:p-14 space-y-3'
      } ${className}`}
    >
      {icon && (
        <div className="w-10 h-10 rounded-full bg-paper-dark border border-line flex items-center justify-center text-muted mb-1 shadow-2xs">
          {icon}
        </div>
      )}

      <div className="space-y-1 max-w-sm">
        <h3 className="font-display text-sm sm:text-base font-bold text-ink">
          {title}
        </h3>
        {description && (
          <p className="font-sans text-xs text-muted leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

import React from 'react';

interface MetricBoxProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  isAttention?: boolean;
}

export const MetricBox: React.FC<MetricBoxProps> = ({
  label,
  value,
  subtext,
  badge,
  isAttention = false,
}) => {
  return (
    <div
      className={`p-4 bg-paper border rounded-sm transition-all duration-200 hover:-translate-y-0.5 ${
        isAttention
          ? 'border-attention/40 bg-attention-subtle/30 shadow-none'
          : 'border-line hover:border-line-dark shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted">{label}</span>
        {badge && (
          <span
            className={`font-mono text-[10px] px-1.5 py-0.2 rounded-sm border ${
              isAttention
                ? 'bg-attention-subtle text-attention border-attention/30 font-medium'
                : 'bg-paper-dark border-line text-ink-light'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span
          className={`font-mono text-2xl font-bold tracking-tight ${
            isAttention ? 'text-attention' : 'text-ink'
          }`}
        >
          {value}
        </span>
        {subtext && (
          <span className="font-mono text-xs text-muted truncate">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

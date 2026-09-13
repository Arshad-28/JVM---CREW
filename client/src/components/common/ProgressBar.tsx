import React from 'react';

interface ProgressBarProps {
  progressPct: number;
  className?: string;
  isAttention?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPct,
  className = '',
  isAttention = false,
}) => {
  const clamped = Math.min(100, Math.max(0, progressPct));

  return (
    <div className={`w-full h-[2px] bg-line overflow-hidden rounded-none ${className}`}>
      <div
        className={`h-full transition-all duration-300 ${
          isAttention ? 'bg-attention' : 'bg-accent'
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

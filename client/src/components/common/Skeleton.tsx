import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantStyles = {
    rectangular: 'rounded-sm',
    circular: 'rounded-full',
    text: 'rounded-xs h-4 my-1',
  }[variant];

  const style: React.CSSProperties = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      style={style}
      className={`skeleton-shimmer bg-paper-dark border border-line/40 ${variantStyles} ${className}`}
      aria-hidden="true"
    />
  );
};

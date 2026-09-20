import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'subtle' | 'warning' | 'accent' | 'danger';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-paper border-line text-ink',
    elevated: 'bg-paper-light border-line shadow-xs text-ink',
    subtle: 'bg-paper-dark/30 border-line text-ink',
    warning: 'bg-attention-subtle/30 border-attention/30 text-ink',
    accent: 'bg-accent-subtle/40 border-accent/30 text-ink',
    danger: 'bg-red-500/5 border-red-500/30 text-ink',
  }[variant];

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-2.5 sm:p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }[padding];

  const hoverStyles = hoverable
    ? 'hover:border-ink transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs'
    : 'shadow-2xs';

  return (
    <div
      className={`border rounded-sm ${variantStyles} ${paddingStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

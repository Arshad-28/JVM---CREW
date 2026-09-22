import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'subtle' | 'warning' | 'accent' | 'danger' | 'ghost';

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
    default: 'bg-paper-light border-line text-ink shadow-2xs',
    elevated: 'bg-surface-raised border-line shadow-card text-ink',
    subtle: 'bg-paper-dark/50 border-line text-ink',
    warning: 'bg-warning-soft/50 border-warning/30 text-ink',
    accent: 'bg-primary-soft/50 border-primary/30 text-ink',
    danger: 'bg-danger-soft/50 border-danger/30 text-ink',
    ghost: 'bg-transparent border-transparent text-ink shadow-none',
  }[variant];

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding];

  const hoverStyles = hoverable
    ? 'hover:-translate-y-[2px] hover:border-line-dark hover:shadow-card-hover transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      className={`border rounded-md ${variantStyles} ${paddingStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

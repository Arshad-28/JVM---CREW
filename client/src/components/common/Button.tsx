import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'success' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-hover border-primary shadow-xs hover:-translate-y-[1px] active:translate-y-0',
    secondary: 'bg-paper-light text-ink hover:bg-primary-soft hover:text-primary hover:border-primary/40 border-line shadow-2xs hover:-translate-y-[1px] active:translate-y-0',
    accent: 'bg-ochre text-white hover:bg-[#B57A24] border-ochre shadow-xs hover:-translate-y-[1px] active:translate-y-0',
    ghost: 'bg-transparent text-muted hover:text-ink hover:bg-paper-dark/60 border-transparent',
    danger: 'bg-danger text-white hover:bg-danger-hover border-danger shadow-xs hover:-translate-y-[1px] active:translate-y-0',
    success: 'bg-success text-white hover:bg-success-hover border-success shadow-xs hover:-translate-y-[1px] active:translate-y-0',
    outline: 'bg-transparent text-ink hover:bg-paper-light border-line hover:border-ink hover:-translate-y-[1px] active:translate-y-0',
  }[variant];

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-mono font-semibold min-h-[32px] space-x-1.5',
    md: 'px-4 py-2 text-xs font-mono font-bold min-h-[38px] space-x-2',
    lg: 'px-5 py-2.5 text-sm font-mono font-bold min-h-[44px] space-x-2.5',
  }[size];

  const disabledStyles = (disabled || loading)
    ? 'opacity-50 cursor-not-allowed pointer-events-none transform-none'
    : 'cursor-pointer';

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center border rounded-sm font-sans transition-all duration-160 select-none focus-ring ${variantStyles} ${sizeStyles} ${disabledStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      
      {children && <span className="truncate">{children}</span>}

      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};

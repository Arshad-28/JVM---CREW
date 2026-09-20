import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'outline';
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
    primary: 'bg-ink text-paper hover:bg-ink-light border-ink shadow-xs',
    secondary: 'bg-paper text-ink hover:bg-paper-dark border-line hover:border-ink shadow-2xs',
    accent: 'bg-accent text-paper hover:bg-accent-hover border-accent shadow-xs',
    ghost: 'bg-transparent text-muted hover:text-ink hover:bg-paper-dark border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600 shadow-xs',
    outline: 'bg-transparent text-ink hover:bg-paper-dark border-line hover:border-ink',
  }[variant];

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs font-mono font-semibold min-h-[30px] space-x-1.5',
    md: 'px-3.5 py-2 text-xs font-mono font-bold min-h-[36px] space-x-2',
    lg: 'px-4 py-2.5 text-sm font-mono font-bold min-h-[42px] space-x-2',
  }[size];

  const disabledStyles = (disabled || loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'active:scale-[0.98]';

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center border rounded-sm transition-all select-none ${variantStyles} ${sizeStyles} ${disabledStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      
      {children && <span className="truncate">{children}</span>}

      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};

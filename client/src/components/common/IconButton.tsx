import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'ghost' | 'accent' | 'danger' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'default',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-paper-light hover:bg-primary-soft text-ink hover:text-primary border-line hover:border-primary/40 shadow-2xs hover:-translate-y-[1px] active:translate-y-0',
    primary: 'bg-primary text-white hover:bg-primary-hover border-primary shadow-xs hover:-translate-y-[1px] active:translate-y-0',
    ghost: 'bg-transparent hover:bg-paper-dark/60 border-transparent text-muted hover:text-ink',
    accent: 'bg-primary-soft hover:bg-primary hover:text-white border-primary/30 text-primary',
    danger: 'bg-danger-soft hover:bg-danger hover:text-white border-danger/30 text-danger',
  }[variant];

  const sizeStyles = {
    sm: 'w-7 h-7 p-1 text-xs',
    md: 'w-9 h-9 p-1.5 text-sm',
    lg: 'w-11 h-11 p-2 text-base',
  }[size];

  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center border rounded-sm transition-all duration-160 focus-ring ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};

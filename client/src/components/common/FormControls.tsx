import React from 'react';

interface FormFieldProps {
  label?: string;
  labelRight?: React.ReactNode;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  labelRight,
  error,
  helperText,
  required,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 font-sans ${className}`}>
      {(label || labelRight) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider">
              {label} {required && <span className="text-danger">*</span>}
            </label>
          )}
          {labelRight && <div className="text-xs text-muted">{labelRight}</div>}
        </div>
      )}

      {children}

      {error ? (
        <p className="text-xs font-mono text-danger font-medium animate-fade-in flex items-center gap-1">
          <span>•</span>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] font-mono text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftIcon, rightIcon, className = '', disabled, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-muted pointer-events-none shrink-0 flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full bg-paper-light border rounded-sm font-sans text-xs text-ink placeholder:text-muted transition-colors duration-160 focus-ring min-h-[42px] sm:min-h-[44px] ${
            leftIcon ? 'pl-9' : 'pl-3.5'
          } ${rightIcon ? 'pr-9' : 'pr-3.5'} py-2 ${
            error
              ? 'border-danger/60 focus-visible:ring-danger/30'
              : 'border-line hover:border-line-dark focus-visible:ring-primary/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-paper-dark/60' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-muted shrink-0 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={`w-full bg-paper-light border rounded-sm font-sans text-xs text-ink placeholder:text-muted transition-colors duration-160 focus-ring p-3.5 ${
          error
            ? 'border-danger/60 focus-visible:ring-danger/30'
            : 'border-line hover:border-line-dark focus-visible:ring-primary/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-paper-dark/60' : ''} ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = '', disabled, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        disabled={disabled}
        className={`w-full bg-paper-light border rounded-sm font-sans text-xs text-ink transition-colors duration-160 focus-ring px-3.5 py-2 min-h-[42px] sm:min-h-[44px] cursor-pointer ${
          error
            ? 'border-danger/60 focus-visible:ring-danger/30'
            : 'border-line hover:border-line-dark focus-visible:ring-primary/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-paper-dark/60' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

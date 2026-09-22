import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  kicker?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  kicker,
  children,
  footer,
  size = 'md',
  className = '',
  closeOnBackdropClick = true,
}) => {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    '2xl': 'sm:max-w-5xl',
    full: 'sm:max-w-[95vw]',
  }[size];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-x-hidden font-sans"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal Dialog Box */}
      <div
        className={`relative w-full ${sizeClasses} bg-paper-light border border-line rounded-t-2xl sm:rounded-2xl shadow-modal flex flex-col max-h-[92vh] sm:max-h-[90vh] z-10 animate-scale-in pb-safe overflow-hidden ${className}`}
      >
        {/* Header */}
        {(title || kicker) && (
          <div className="px-5 sm:px-6 py-4 border-b border-line bg-paper/70 flex items-start justify-between gap-3 shrink-0">
            <div className="space-y-1 min-w-0 flex-1">
              {kicker && (
                <span className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block">
                  {kicker}
                </span>
              )}
              {typeof title === 'string' ? (
                <h2 className="font-display text-base sm:text-lg font-bold text-ink truncate">
                  {title}
                </h2>
              ) : (
                title
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 -mr-1.5 -mt-1 text-muted hover:text-ink hover:bg-paper-dark/60 rounded-sm transition-colors shrink-0 focus-ring"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-4">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-line bg-paper/70 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

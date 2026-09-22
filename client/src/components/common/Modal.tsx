import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
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
  subtitle,
  kicker,
  children,
  footer,
  size = 'md',
  className = '',
  closeOnBackdropClick = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key press & return focus on close
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Lock body scroll with scrollbar layout-shift compensation
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const sizeClasses = {
    sm: 'max-w-sm w-[calc(100vw-24px)] sm:w-[calc(100vw-40px)]',
    md: 'max-w-lg w-[calc(100vw-24px)] sm:w-[calc(100vw-40px)]',
    lg: 'max-w-[760px] w-[calc(100vw-24px)] sm:w-[calc(100vw-40px)]',
    xl: 'max-w-4xl w-[calc(100vw-24px)] sm:w-[calc(100vw-40px)]',
    '2xl': 'max-w-5xl w-[calc(100vw-24px)] sm:w-[calc(100vw-40px)]',
    full: 'max-w-[96vw] w-[calc(100vw-20px)]',
  }[size];

  return createPortal(
    <div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={typeof title === 'string' ? 'modal-dialog-title' : undefined}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-x-hidden font-sans outline-none"
    >
      {/* 1. Backdrop Overlay (Translucent Ink with 5px Optical Blur) */}
      <div
        className="fixed inset-0 z-[100] transition-opacity duration-200 animate-fade-in cursor-pointer"
        style={{
          backgroundColor: 'rgba(15, 23, 20, 0.38)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* 2. Modal Dialog Box (100% Opaque, Layered at z-[110]) */}
      <div
        className={`relative z-[110] ${sizeClasses} bg-paper-light border border-line rounded-2xl shadow-modal flex flex-col max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-48px)] animate-scale-in pb-safe overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || kicker || subtitle) && (
          <div className="px-5 sm:px-6 py-4 border-b border-line bg-paper/80 flex items-start justify-between gap-3 shrink-0">
            <div className="space-y-1 min-w-0 flex-1">
              {kicker && (
                <span className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block">
                  {kicker}
                </span>
              )}
              {typeof title === 'string' ? (
                <h2 id="modal-dialog-title" className="font-display text-base sm:text-lg font-bold text-ink tracking-tight truncate">
                  {title}
                </h2>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-xs text-muted leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] -mr-2 -mt-1 flex items-center justify-center text-muted hover:text-ink hover:bg-paper-dark/70 rounded-xl transition-all shrink-0 focus-ring cursor-pointer active:scale-95"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-4 text-ink">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-line bg-paper/80 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

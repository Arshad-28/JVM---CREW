import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export const showToast = (type: ToastType, title: string, description?: string) => {
  const id = Math.random().toString(36).substring(2, 9);
  if (toastListener) {
    toastListener({ id, type, title, description });
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (newToast: ToastMessage) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  const handleRemove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full font-sans pointer-events-none p-2 sm:p-0">
      {toasts.map((toast) => {
        const typeConfig = {
          success: {
            icon: CheckCircle2,
            style: 'bg-paper-light border-success/40 text-ink shadow-elevated',
            iconColor: 'text-success',
          },
          warning: {
            icon: AlertTriangle,
            style: 'bg-paper-light border-warning/40 text-ink shadow-elevated',
            iconColor: 'text-warning',
          },
          error: {
            icon: AlertCircle,
            style: 'bg-paper-light border-danger/40 text-ink shadow-elevated',
            iconColor: 'text-danger',
          },
          info: {
            icon: Info,
            style: 'bg-paper-light border-primary/40 text-ink shadow-elevated',
            iconColor: 'text-primary',
          },
        }[toast.type];

        const IconComponent = typeConfig.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-md p-3.5 flex items-start space-x-3 animate-slide-up ${typeConfig.style}`}
          >
            <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${typeConfig.iconColor}`} />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-bold text-xs text-ink truncate">{toast.title}</p>
              {toast.description && (
                <p className="text-[11px] text-muted font-normal leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => handleRemove(toast.id)}
              className="p-1 text-muted hover:text-ink rounded-xs transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

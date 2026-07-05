import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  /**
   * Show a toast message.
   *
   * @param message  Text to display.
   * @param type     Visual style. Defaults to `'info'`.
   * @param duration Auto-dismiss delay in ms. Defaults to 5000.
   *                 Pass `0` for a persistent toast that must be dismissed
   *                 manually via `removeToast`.
   * @param id       Optional stable ID. If omitted, a random one is generated.
   *                 Supply a known ID when you need to dismiss the toast
   *                 programmatically later (e.g. the offline banner).
   */
  showToast: (message: string, type?: ToastType, duration?: number, id?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 5000, id?: string) => {
      const toastId = id ?? Math.random().toString(36).slice(2);

      setToasts((prev) => {
        // If a toast with this ID already exists, replace it in place so we
        // don't stack duplicate offline banners.
        const exists = prev.some((t) => t.id === toastId);
        if (exists) {
          return prev.map((t) =>
            t.id === toastId ? { ...t, message, type, duration } : t,
          );
        }
        return [...prev, { id: toastId, message, type, duration }];
      });

      // Only schedule auto-dismiss when duration > 0.
      if (duration > 0) {
        setTimeout(() => removeToast(toastId), duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

import {createContext, use} from 'react';

export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

export type ToastAction = {label: string; onClick: () => void};

export type ShowToast = (
  message: string,
  options?: {
    severity?: ToastSeverity;
    /** A single inline action, e.g. "Retry" or "Undo". */
    action?: ToastAction;
    /** Null keeps the toast up until dismissed. Errors default to null. */
    autoHideMs?: number | null;
  },
) => void;

export const ToastContext = createContext<ShowToast | undefined>(undefined);

/**
 * Feedback for saves, deletes, and failures. Replaces the native `alert()` that used to
 * fire from every failed query (ISSUES #9, #25, #27).
 */
export const useToast = () => {
  const showToast = use(ToastContext);
  if (!showToast) {
    throw new Error('useToast must be used inside a <ToastProvider>');
  }
  return showToast;
};

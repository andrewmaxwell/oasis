import {createContext, useContext} from 'react';

export type ConfirmOptions = {
  title: string;
  message: string;
  /** Defaults to "Confirm". */
  confirmLabel?: string;
  /** Renders the confirm button in the error color. */
  destructive?: boolean;
};

export type Confirm = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<Confirm | undefined>(undefined);

/**
 * Promise-based replacement for the native `confirm()` (ISSUES #27), which is unstyled,
 * blocks the main thread, and on mobile looks like the browser has malfunctioned.
 */
export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used inside a <ConfirmProvider>');
  }
  return confirm;
};

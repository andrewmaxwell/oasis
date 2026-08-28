import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {useCallback, useRef, useState} from 'react';
import {Confirm, ConfirmContext, ConfirmOptions} from '../hooks/useConfirm.ts';

export const ConfirmProvider = ({children}: {children: React.ReactNode}) => {
  const [options, setOptions] = useState<ConfirmOptions>();
  const resolveRef = useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback<Confirm>(
    (next) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const close = (result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = undefined;
    setOptions(undefined);
  };

  return (
    <ConfirmContext value={confirm}>
      {children}
      <Dialog
        open={!!options}
        onClose={() => close(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{options?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{options?.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => close(false)}>Cancel</Button>
          <Button
            onClick={() => close(true)}
            variant="contained"
            color={options?.destructive ? 'error' : 'primary'}
            autoFocus
          >
            {options?.confirmLabel ?? 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext>
  );
};

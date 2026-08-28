import {Alert, Button, IconButton, Snackbar} from '@mui/material';
import {Close} from '@mui/icons-material';
import {useCallback, useState} from 'react';
import {
  ShowToast,
  ToastAction,
  ToastContext,
  ToastSeverity,
} from '../hooks/useToast.ts';

type Toast = {
  key: number;
  message: string;
  severity: ToastSeverity;
  action?: ToastAction;
  autoHideMs: number | null;
};

export const ToastProvider = ({children}: {children: React.ReactNode}) => {
  const [queue, setQueue] = useState<Toast[]>([]);
  const [current] = queue;

  const showToast = useCallback<ShowToast>((message, options = {}) => {
    const {severity = 'success', action, autoHideMs} = options;
    setQueue((q) => [
      ...q,
      {
        key: Date.now() + Math.random(),
        message,
        severity,
        action,
        autoHideMs:
          // Errors stay until dismissed; a volunteer mid-task shouldn't have to catch
          // the one moment the failure was on screen.
          autoHideMs !== undefined
            ? autoHideMs
            : severity === 'error'
              ? null
              : 4000,
      },
    ]);
  }, []);

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);

  return (
    <ToastContext value={showToast}>
      {children}
      <Snackbar
        key={current?.key}
        open={!!current}
        autoHideDuration={current?.autoHideMs ?? null}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') dismiss();
        }}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
      >
        <Alert
          severity={current?.severity ?? 'info'}
          variant="filled"
          sx={{width: '100%'}}
          action={
            // MUI's Alert drops its own close button as soon as `action` is set, so the
            // dismiss control has to be rendered here too — errors never auto-hide.
            <>
              {current?.action && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    current.action?.onClick();
                    dismiss();
                  }}
                >
                  {current.action.label}
                </Button>
              )}
              <IconButton
                size="small"
                color="inherit"
                aria-label="Dismiss"
                onClick={dismiss}
              >
                <Close fontSize="small" />
              </IconButton>
            </>
          }
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </ToastContext>
  );
};

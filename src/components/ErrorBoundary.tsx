import {Alert, AlertTitle, Box, Button, Typography} from '@mui/material';
import {Component, ReactNode} from 'react';

type ErrorBoundaryProps = {children: ReactNode};
type ErrorBoundaryState = {error?: Error};

/**
 * Without this a render-time throw anywhere in the tree leaves a blank white page with no
 * way forward — the failure mode volunteers describe as "the app is broken".
 *
 * Has to be a class: React has no hook equivalent of componentDidCatch.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error};
  }

  componentDidCatch(error: Error, info: {componentStack?: string | null}) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    const {error} = this.state;
    if (!error) return this.props.children;

    return (
      <Box sx={{maxWidth: 600, mx: 'auto', p: 4}}>
        <Alert severity="error" sx={{mb: 2}}>
          <AlertTitle>Something went wrong</AlertTitle>
          The page couldn&apos;t be displayed. Reloading usually fixes it. If it
          keeps happening, tell an administrator what you were doing.
        </Alert>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{mb: 2, fontFamily: 'monospace', wordBreak: 'break-word'}}
        >
          {error.message}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </Box>
    );
  }
}

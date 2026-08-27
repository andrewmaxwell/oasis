import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App.tsx';
import {ThemeProvider, CssBaseline} from '@mui/material';
import {QueryClientProvider} from '@tanstack/react-query';
import {theme} from './theme.ts';
import {queryClient} from './queryClient.ts';
import {ToastProvider} from './components/ToastProvider.tsx';
import {ConfirmProvider} from './components/ConfirmProvider.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Outside the boundary's reach on purpose: the boundary's own fallback needs the
          theme, and a toast about a failure is useless if the failure unmounted it. */}
      <ToastProvider>
        <ConfirmProvider>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </QueryClientProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);

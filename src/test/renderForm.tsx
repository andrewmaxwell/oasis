import {ThemeProvider} from '@mui/material';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {render} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Link, RouterProvider, createMemoryRouter} from 'react-router-dom';
import {ConfirmProvider} from '../components/ConfirmProvider.tsx';
import {OasisForm} from '../components/OasisForm.tsx';
import {theme} from '../theme.ts';
import {FormField} from '../types.ts';

/**
 * A fresh client per render, so no option cache leaks between tests. Retries off: the app
 * default is two with backoff, which would turn a failing query into a multi-second test.
 */
const testQueryClient = () =>
  new QueryClient({defaultOptions: {queries: {retry: false}}});

type RenderFormOptions<T> = {
  fields: FormField<T>[];
  origData?: Partial<T>;
  onSubmit?: (formData: Partial<T>) => Promise<void> | void;
  disabled?: boolean;
  submitting?: boolean;
};

/**
 * Mounts `OasisForm` with the providers it actually reaches for, and nothing else:
 *
 * - A **data** router (`createMemoryRouter`, not `MemoryRouter`) because
 *   `useUnsavedChangesPrompt` calls `useBlocker`, which throws without one.
 * - `ConfirmProvider` because the blocker resolves through `useConfirm()`.
 * - A `QueryClient` because `OasisSelect` loads async options through `useOptions`.
 *
 * The second route and its "Go elsewhere" link exist so a test can trigger a real in-app
 * navigation and watch the blocker catch it.
 */
export const renderForm = <T extends Record<string, unknown>>({
  fields,
  origData = {},
  onSubmit = () => {},
  disabled,
  submitting,
}: RenderFormOptions<T>) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            <OasisForm<T>
              fields={fields}
              origData={origData}
              onSubmit={(data) => onSubmit(data)}
              disabled={disabled}
              submitting={submitting}
            />
            <Link to="/elsewhere">Go elsewhere</Link>
          </>
        ),
      },
      {path: '/elsewhere', element: <h1>Elsewhere</h1>},
    ],
    {initialEntries: ['/']},
  );

  const result = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={testQueryClient()}>
        <ConfirmProvider>
          <RouterProvider router={router} />
        </ConfirmProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );

  return {...result, router, user: userEvent.setup()};
};

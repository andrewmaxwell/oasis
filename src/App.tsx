import {useSessionState} from './hooks/useSession.ts';
import {createHashRouter, Link, RouterProvider} from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import {lazy, Suspense, useEffect} from 'react';
import {OasisToolbar} from './components/OasisToolbar.tsx';
import {SignInForm} from './components/SignInForm.tsx';
import {consumePasswordSetupRedirect} from './supabase.ts';

const routeMap = {
  '': () => import('./components/pages/LandingPage.tsx'),
  '/parents': () => import('./components/pages/ParentTablePage.tsx'),
  '/parent/:id': () => import('./components/pages/ParentPage.tsx'),
  '/kid/:id': () => import('./components/pages/KidPage.tsx'),
  '/deliverers': () => import('./components/pages/DelivererTablePage.tsx'),
  '/deliverer/:id': () => import('./components/pages/DelivererPage.tsx'),
  '/orders': () => import('./components/pages/OrderTablePage.tsx'),
  '/order/new': () =>
    import('./components/pages/NewOrderPage/NewOrderPage.tsx'),
  '/order/:id': () =>
    import('./components/pages/FinishedOrderPage/FinishedOrderPage.tsx'),
  '/changePassword': () => import('./components/pages/ChangePasswordPage.tsx'),
  '/kids': () => import('./components/pages/KidTablePage.tsx'),
  '/users': () => import('./components/pages/UserTablePage.tsx'),
  '/user/:id': () => import('./components/pages/UserPage.tsx'),
};

const LabelPage = lazy(() => import('./components/pages/LabelPage.tsx')); // special route, doesn't get toolbar or container

const withChrome = (children: React.ReactNode) => (
  <Box sx={{flexGrow: 1}}>
    <OasisToolbar />
    <Container sx={{pb: 10}} maxWidth="xl">
      <Suspense fallback={<CircularProgress />}>{children}</Suspense>
    </Container>
  </Box>
);

const NotFound = () => (
  <>
    <Typography variant="h5" gutterBottom>
      Page not found
    </Typography>
    <Button component={Link} to="/" variant="contained">
      Go to Dashboard
    </Button>
  </>
);

const router = createHashRouter([
  ...Object.entries(routeMap).map(([path, load]) => {
    const PageElement = lazy(load);
    return {path, element: withChrome(<PageElement />)};
  }),
  {
    path: '/labels/:id',
    element: (
      <Suspense>
        <LabelPage />
      </Suspense>
    ),
  },
  // Catch-all. Also absorbs the moment after an invite redirect when the fragment still
  // holds Supabase's auth params and matches no route.
  {path: '*', element: withChrome(<NotFound />)},
]);

export const App = () => {
  const {session, loaded} = useSessionState();

  // An invite or recovery link signs the user in without a password being set. Send them
  // straight to the password form rather than the dashboard.
  useEffect(() => {
    if (session && consumePasswordSetupRedirect()) {
      window.location.hash = '/changePassword';
    }
  }, [session]);

  // Without the `loaded` check the sign-in form flashes on every load for a signed-in user.
  if (!loaded) return <CircularProgress />;

  return session ? <RouterProvider router={router} /> : <SignInForm />;
};

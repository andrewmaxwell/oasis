import {useSession} from './hooks/useSession.ts';
import {createHashRouter, RouterProvider} from 'react-router-dom';
import {Box, CircularProgress, Container} from '@mui/material';
import {lazy, Suspense} from 'react';
import {OasisToolbar} from './components/OasisToolbar.tsx';
import {SignInForm} from './components/SignInForm.tsx';

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

const router = createHashRouter([
  ...Object.entries(routeMap).map(([path, load]) => {
    const PageElement = lazy(load);
    return {
      path,
      element: (
        <Box sx={{flexGrow: 1}}>
          <OasisToolbar />
          <Container sx={{pb: 10}} maxWidth="xl">
            <Suspense fallback={<CircularProgress />}>
              <PageElement />
            </Suspense>
          </Container>
        </Box>
      ),
    };
  }),
  {
    path: '/labels/:id',
    element: (
      <Suspense>
        <LabelPage />
      </Suspense>
    ),
  },
]);

export const App = () => {
  const session = useSession();
  return session ? <RouterProvider router={router} /> : <SignInForm />;
};

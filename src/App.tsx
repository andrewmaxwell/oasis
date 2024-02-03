import {useSession} from './utils/useSession.ts';
import {SignInForm} from './components/SignInForm.tsx';
import {ParentTablePage} from './components/pages/ParentTablePage.tsx';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import {ParentPage} from './components/pages/ParentPage.tsx';
import {KidPage} from './components/pages/KidPage.tsx';
import {DelivererTablePage} from './components/pages/DelivererTablePage.tsx';
import {OasisToolbar} from './components/OasisToolbar.tsx';
import {Box, Container} from '@mui/material';
import {LandingPage} from './components/pages/LandingPage.tsx';
import {DelivererPage} from './components/pages/DelivererPage.tsx';
import {OrderTablePage} from './components/pages/OrderTablePage.tsx';
import {FinishedOrderPage} from './components/pages/FinishedOrderPage.tsx';
import {NewOrderPage} from './components/pages/NewOrderPage/NewOrderPage.tsx';
import {ChangePasswordPage} from './components/pages/ChangePasswordPage.tsx';

const PageWrapper = ({children}: {children: JSX.Element}) => (
  <Box sx={{flexGrow: 1}}>
    <OasisToolbar />
    <Container sx={{pb: 10}}>{children}</Container>
  </Box>
);

const base = 'oasis';
const router = createBrowserRouter(
  [
    {
      path: base,
      element: <LandingPage />,
    },
    {
      path: `${base}/parents`,
      element: <ParentTablePage />,
    },
    {
      path: `${base}/parent/:id`,
      element: <ParentPage />,
    },
    {
      path: `${base}/kid/:id`,
      element: <KidPage />,
    },
    {
      path: `${base}/deliverers`,
      element: <DelivererTablePage />,
    },
    {
      path: `${base}/deliverer/:id`,
      element: <DelivererPage />,
    },
    {
      path: `${base}/orders`,
      element: <OrderTablePage />,
    },
    {
      path: `${base}/order/new`,
      element: <NewOrderPage />,
    },
    {
      path: `${base}/order/:id`,
      element: <FinishedOrderPage />,
    },
    {
      path: `${base}/changePassword`,
      element: <ChangePasswordPage />,
    },
  ].map((r) => ({...r, element: <PageWrapper>{r.element}</PageWrapper>})),
);

export const App = () =>
  useSession() ? <RouterProvider router={router} /> : <SignInForm />;

import {useSession} from './utils/useSession.ts';
import {SignInForm} from './components/SignInForm.tsx';
import {ParentTablePage} from './components/pages/ParentTablePage.tsx';
import {createHashRouter, RouterProvider} from 'react-router-dom';
import {ParentPage} from './components/pages/ParentPage.tsx';
import {KidPage} from './components/pages/KidPage.tsx';
import {DelivererTablePage} from './components/pages/DelivererTablePage.tsx';
import {OasisToolbar} from './components/OasisToolbar.tsx';
import {Box, Container} from '@mui/material';
import {LandingPage} from './components/pages/LandingPage.tsx';
import {DelivererPage} from './components/pages/DelivererPage.tsx';
import {OrderTablePage} from './components/pages/OrderTablePage.tsx';
import {FinishedOrderPage} from './components/pages/FinishedOrderPage/FinishedOrderPage.tsx';
import {NewOrderPage} from './components/pages/NewOrderPage/NewOrderPage.tsx';
import {ChangePasswordPage} from './components/pages/ChangePasswordPage.tsx';
import {LabelPage} from './components/pages/LabelPage.tsx';
import {KidTablePage} from './components/pages/KidTablePage.tsx';

const PageWrapper = ({children}: {children: JSX.Element}) => (
  <Box sx={{flexGrow: 1}}>
    <OasisToolbar />
    <Container sx={{pb: 10}} maxWidth="xl">
      {children}
    </Container>
  </Box>
);

const routes = [
  {
    path: '',
    element: <LandingPage />,
  },
  {
    path: `/parents`,
    element: <ParentTablePage />,
  },
  {
    path: `/parent/:id`,
    element: <ParentPage />,
  },
  {
    path: `/kid/:id`,
    element: <KidPage />,
  },
  {
    path: `/deliverers`,
    element: <DelivererTablePage />,
  },
  {
    path: `/deliverer/:id`,
    element: <DelivererPage />,
  },
  {
    path: `/orders`,
    element: <OrderTablePage />,
  },
  {
    path: `/order/new`,
    element: <NewOrderPage />,
  },
  {
    path: `/order/:id`,
    element: <FinishedOrderPage />,
  },
  {
    path: `/changePassword`,
    element: <ChangePasswordPage />,
  },
  {
    path: '/kids',
    element: <KidTablePage />,
  },
].map((r) => ({
  ...r,
  element: <PageWrapper>{r.element}</PageWrapper>,
}));

routes.push({
  path: '/labels/:id',
  element: <LabelPage />,
});

const router = createHashRouter(routes);

export const App = () =>
  useSession() ? <RouterProvider router={router} /> : <SignInForm />;

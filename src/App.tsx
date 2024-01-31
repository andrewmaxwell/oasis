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

const PageWrapper = ({children}: {children: JSX.Element}) => (
  <Box sx={{flexGrow: 1}}>
    <OasisToolbar />
    <Container sx={{pb: 10}}>{children}</Container>
  </Box>
);

const base = 'oasis';
const router = createBrowserRouter([
  {
    path: base,
    element: (
      <PageWrapper>
        <LandingPage />
      </PageWrapper>
    ),
  },
  {
    path: `${base}/parents`,
    element: (
      <PageWrapper>
        <ParentTablePage />
      </PageWrapper>
    ),
  },
  {
    path: `${base}/parent/:id`,
    element: (
      <PageWrapper>
        <ParentPage />
      </PageWrapper>
    ),
  },
  {
    path: `${base}/kid/:id`,
    element: (
      <PageWrapper>
        <KidPage />
      </PageWrapper>
    ),
  },
  {
    path: `${base}/deliverers`,
    element: (
      <PageWrapper>
        <DelivererTablePage />
      </PageWrapper>
    ),
  },
]);

export const App = () => {
  const session = useSession();
  if (!session) return <SignInForm />;

  return <RouterProvider router={router} />;
};

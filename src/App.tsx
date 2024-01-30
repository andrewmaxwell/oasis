import {useSession} from './utils/useSession.ts';
import {SignInForm} from './components/SignInForm.tsx';
import {PersonSearch} from './components/PersonSearch.tsx';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import {ParentPage} from './components/ParentPage.tsx';

const base = 'oasis';
const router = createBrowserRouter([
  {
    path: `${base}/`,
    element: <PersonSearch />,
  },
  {
    path: `${base}/parent/:id`,
    element: <ParentPage />,
  },
]);

export const App = () => {
  const session = useSession();
  if (!session) return <SignInForm />;

  return <RouterProvider router={router} />;
};

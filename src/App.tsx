import {useSession} from './utils/useSession.ts';
import {SignInForm} from './components/SignInForm.tsx';
import {PersonSearch} from './components/PersonSearch.tsx';

export const App = () => {
  const session = useSession();

  if (!session) return <SignInForm />;
  return <PersonSearch />;
};

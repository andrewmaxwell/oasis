import {useSession} from './supabase.ts';
import {SignInForm} from './components/SignInForm.tsx';

export const App = () => {
  const session = useSession();

  if (!session) return <SignInForm />;
  return <div>Logged in!</div>;
};

import {AppBar, Toolbar, Typography} from '@mui/material';
import {useSession} from '../utils/useSession.ts';
import {AccountMenu} from './AccountMenu.tsx';

export const OasisToolbar = () => {
  const session = useSession();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{flexGrow: 1}}>
          Oasis Diaper Ministry Manager
        </Typography>
        {session && <AccountMenu email={session.user.email} />}
      </Toolbar>
    </AppBar>
  );
};

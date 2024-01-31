import {AppBar, Toolbar, Typography} from '@mui/material';
import {useSession} from '../utils/useSession.ts';
import {AccountMenu} from './AccountMenu.tsx';

export const OasisToolbar = () => {
  const session = useSession();

  return (
    <AppBar position="static" sx={{marginBottom: 2}}>
      <Toolbar>
        <img src="/oasis/favicon.png" height="50px" style={{marginRight: 10}} />
        <Typography variant="h6" sx={{flexGrow: 1}}>
          Oasis Diaper Ministry Manager
        </Typography>

        {session && <AccountMenu email={session.user.email} />}
      </Toolbar>
    </AppBar>
  );
};

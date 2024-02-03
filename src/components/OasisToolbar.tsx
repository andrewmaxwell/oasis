import {AppBar, Toolbar, Typography} from '@mui/material';
import {useSession} from '../utils/useSession.ts';
import {AccountMenu} from './AccountMenu.tsx';
import {Link} from 'react-router-dom';

export const OasisToolbar = () => {
  const session = useSession();

  return (
    <AppBar position="static" sx={{marginBottom: 2}}>
      <Toolbar>
        <Link to={'/oasis/'}>
          <img
            src="/oasis/favicon.png"
            height="50px"
            style={{marginRight: 10}}
          />
        </Link>

        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          Oasis Diaper Ministry Manager
        </Typography>

        {session && <AccountMenu email={session.user.email} />}
      </Toolbar>
    </AppBar>
  );
};

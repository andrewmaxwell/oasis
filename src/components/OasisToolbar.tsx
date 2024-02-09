import {AppBar, Toolbar, Typography} from '@mui/material';
import {useSession} from '../utils/useSession.ts';
import {AccountMenu} from './AccountMenu.tsx';
import {Link, useNavigate} from 'react-router-dom';

export const OasisToolbar = () => {
  const session = useSession();
  const navigate = useNavigate();

  return (
    <AppBar position="static" sx={{marginBottom: 2}}>
      <Toolbar>
        <Link to={'/'}>
          <img
            src="/oasis/favicon.png"
            height="50px"
            style={{marginRight: 10}}
            title="Go home"
            alt="logo"
          />
        </Link>

        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
          title="Go home"
        >
          Oasis Diaper Ministry Manager
        </Typography>

        {session && <AccountMenu email={session.user.email} />}
      </Toolbar>
    </AppBar>
  );
};

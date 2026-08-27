import {AppBar, Box, Divider, Toolbar, Typography} from '@mui/material';
import {useSession} from '../hooks/useSession.ts';
import {AccountMenu} from './AccountMenu.tsx';
import {DesktopNav, MobileNav} from './OasisNav.tsx';
import {Link} from 'react-router-dom';

export const OasisToolbar = () => {
  const session = useSession();

  return (
    <AppBar position="sticky" sx={{marginBottom: 3}}>
      <Toolbar sx={{gap: 1}}>
        <MobileNav />

        <Box
          component={Link}
          to="/"
          title="Go home"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            color: 'inherit',
            textDecoration: 'none',
            minWidth: 0,
            borderRadius: 2,
            py: 0.5,
          }}
        >
          <Box
            component="img"
            src="/oasis/favicon.png"
            alt="Oasis logo"
            sx={{height: 40, width: 40, borderRadius: '50%'}}
          />

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
              display: {xs: 'none', sm: 'block'},
            }}
          >
            Oasis
            <Box
              component="span"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                display: {xs: 'none', lg: 'inline'},
              }}
            >
              {' '}
              Diaper Ministry Manager
            </Box>
          </Typography>
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{my: 1.5, mx: 1, display: {xs: 'none', md: 'block'}}}
        />

        <DesktopNav />

        <Box sx={{flexGrow: 1}} />

        {session && <AccountMenu email={session.user.email} />}
      </Toolbar>
    </AppBar>
  );
};

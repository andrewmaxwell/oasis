import {AppBar, Button, Toolbar, Typography} from '@mui/material';
import {logOut, updatePassword, useSession} from '../supabase.ts';

export const OasisToolbar = () => {
  const session = useSession();
  console.log('session', session);

  const changePassword = async () => {
    const pw = prompt('Enter a new password', '');
    if (pw) {
      await updatePassword(pw);
      alert('Password updated');
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{flexGrow: 1}}>
          Oasis Manager
        </Typography>
        {session && (
          <Typography>
            {session.user.email}
            <Button onClick={logOut}>log out</Button>
            <Button onClick={changePassword}>change pw</Button>
          </Typography>
        )}
      </Toolbar>
    </AppBar>
  );
};

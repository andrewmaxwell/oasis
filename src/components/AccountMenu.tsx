import {MouseEvent, useState} from 'react';
import {Menu, MenuItem, Button} from '@mui/material';
import {logOut, updatePassword} from '../supabase.ts';
import {ArrowDropDown} from '@mui/icons-material';

type AccountMenuProps = {
  email: string | undefined;
};

const changePassword = async () => {
  const pw = prompt('Enter a new password', '');
  if (pw) {
    await updatePassword(pw);
    alert('Password updated');
  }
};

export const AccountMenu = ({email}: AccountMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Button
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={(event: MouseEvent<HTMLButtonElement>) =>
          setAnchorEl(event.currentTarget)
        }
        endIcon={<ArrowDropDown />}
      >
        {email}
      </Button>

      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => {
            changePassword;
            handleClose();
          }}
        >
          Change Password
        </MenuItem>

        <MenuItem
          onClick={() => {
            logOut();
            handleClose();
          }}
        >
          Log Out
        </MenuItem>
      </Menu>
    </>
  );
};

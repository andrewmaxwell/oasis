import {MouseEvent, useState} from 'react';
import {Menu, MenuItem, Button, Typography} from '@mui/material';
import {logOut} from '../supabase.ts';
import {ArrowDropDown} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';

type AccountMenuProps = {
  email: string | undefined;
};

export const AccountMenu = ({email}: AccountMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

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
        <Typography
          sx={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {email}
        </Typography>
      </Button>

      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            navigate('/changePassword');
            setAnchorEl(null);
          }}
        >
          Change Password
        </MenuItem>

        <MenuItem
          onClick={() => {
            logOut();
            setAnchorEl(null);
          }}
        >
          Log Out
        </MenuItem>
      </Menu>
    </>
  );
};

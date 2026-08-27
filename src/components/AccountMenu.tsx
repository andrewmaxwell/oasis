import {MouseEvent, useState} from 'react';
import {
  Avatar,
  Button,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {logOut} from '../supabase.ts';
import {ArrowDropDown, Logout, Password} from '@mui/icons-material';
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
        color="inherit"
        startIcon={
          <Avatar
            sx={{width: 28, height: 28, fontSize: 14, bgcolor: 'primary.dark'}}
          >
            {email?.[0]?.toUpperCase()}
          </Avatar>
        }
        sx={{
          borderRadius: 2,
          pl: 1,
          color: 'text.secondary',
          maxWidth: {xs: 140, sm: 280},
          '&:hover': {color: 'text.primary'},
        }}
      >
        <Typography
          variant="body2"
          sx={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            display: {xs: 'none', sm: 'block'},
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
        slotProps={{paper: {sx: {minWidth: 220, mt: 1}}}}
      >
        {/* The button truncates the address on narrow screens, so repeat it in full here. */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{px: 2, py: 1}}
          noWrap
        >
          {email}
        </Typography>
        <Divider />

        <MenuItem
          onClick={() => {
            navigate('/changePassword');
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Password fontSize="small" />
          </ListItemIcon>
          Change Password
        </MenuItem>

        <MenuItem
          onClick={() => {
            logOut();
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Log Out
        </MenuItem>
      </Menu>
    </>
  );
};

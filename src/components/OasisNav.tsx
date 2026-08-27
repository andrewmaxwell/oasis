import {useState} from 'react';
import {
  alpha,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  Article,
  ChildCare,
  Dashboard,
  FamilyRestroom,
  LocalShipping,
  Menu as MenuIcon,
  People,
} from '@mui/icons-material';
import {Link, useLocation} from 'react-router-dom';
import {useIsAdmin} from '../hooks/useAccessLevel.ts';

type NavItem = {
  label: string;
  to: string;
  Icon: React.ElementType;
  /** Path prefixes that also count as "on" this section, e.g. /parent/:id for Families. */
  match: string[];
  adminOnly?: boolean;
};

// Module-level constant: the icons and prefixes never change per render.
const navItems: NavItem[] = [
  {label: 'Dashboard', to: '/', Icon: Dashboard, match: []},
  {
    label: 'Families',
    to: '/parents',
    Icon: FamilyRestroom,
    match: ['/parents', '/parent/'],
  },
  {label: 'Kids', to: '/kids', Icon: ChildCare, match: ['/kids', '/kid/']},
  {
    label: 'Deliverers',
    to: '/deliverers',
    Icon: LocalShipping,
    match: ['/deliverers', '/deliverer/'],
  },
  {
    label: 'Orders',
    to: '/orders',
    Icon: Article,
    match: ['/orders', '/order/'],
  },
  {
    label: 'Users',
    to: '/users',
    Icon: People,
    match: ['/users', '/user/'],
    adminOnly: true,
  },
];

/**
 * The dashboard is the only item with no sub-routes, so it matches exactly; every other
 * item claims its table page plus its detail pages.
 */
const isActive = (item: NavItem, pathname: string) =>
  item.match.length
    ? item.match.some((prefix) => pathname.startsWith(prefix))
    : pathname === '/' || pathname === '';

const useVisibleItems = () => {
  const isAdmin = useIsAdmin();
  return navItems.filter((item) => !item.adminOnly || isAdmin);
};

/** Inline links in the AppBar. Hidden below the md breakpoint in favor of the drawer. */
export const DesktopNav = () => {
  const {pathname} = useLocation();
  const items = useVisibleItems();

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{display: {xs: 'none', md: 'flex'}, gap: 0.5, ml: 1}}
    >
      {items.map((item) => {
        const active = isActive(item, pathname);
        return (
          <Button
            key={item.to}
            component={Link}
            to={item.to}
            color="inherit"
            startIcon={<item.Icon sx={{fontSize: 20}} />}
            aria-current={active ? 'page' : undefined}
            sx={{
              whiteSpace: 'nowrap',
              px: 1.5,
              borderRadius: 2,
              color: active ? 'text.primary' : 'text.secondary',
              bgcolor: (t) =>
                active ? alpha(t.palette.common.white, 0.09) : 'transparent',
              '& .MuiButton-startIcon': {mr: 0.75},
              '&:hover': {
                color: 'text.primary',
                bgcolor: (t) => alpha(t.palette.common.white, 0.06),
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
};

/** Hamburger + Drawer for phones and tablets. Hidden at md and up. */
export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const {pathname} = useLocation();
  const items = useVisibleItems();

  return (
    <Box sx={{display: {xs: 'flex', md: 'none'}}}>
      <IconButton
        color="inherit"
        edge="start"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </IconButton>

      <Drawer open={open} onClose={() => setOpen(false)}>
        <Box
          component="nav"
          aria-label="Main"
          sx={{width: 260}}
          onClick={() => setOpen(false)}
        >
          <Toolbar sx={{gap: 1.5}}>
            <img src="/oasis/favicon.png" height="32px" alt="" />
            <Typography variant="h6" noWrap fontWeight={700}>
              Oasis
            </Typography>
          </Toolbar>
          <Divider />
          <List sx={{px: 1, py: 1.5}}>
            {items.map((item) => {
              const active = isActive(item, pathname);
              return (
                <ListItemButton
                  key={item.to}
                  component={Link}
                  to={item.to}
                  selected={active}
                  aria-current={active ? 'page' : undefined}
                  sx={{borderRadius: 2, mb: 0.5}}
                >
                  <ListItemIcon sx={{minWidth: 40}}>
                    <item.Icon
                      sx={{color: active ? 'primary.light' : 'text.secondary'}}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {fontWeight: active ? 700 : 500},
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

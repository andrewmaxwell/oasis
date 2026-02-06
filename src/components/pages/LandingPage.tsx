import {
  Article,
  ChildCare,
  FamilyRestroom,
  LocalShipping,
  People,
} from '@mui/icons-material';
import {Button, Grid} from '@mui/material';
import {Link} from 'react-router-dom';
import {useIsAdmin} from '../../hooks/useAccessLevel';

const sections = [
  {label: 'Parents', url: 'parents', Icon: FamilyRestroom},
  {label: 'Kids', url: 'kids', Icon: ChildCare},
  {label: 'Orders', url: 'orders', Icon: Article},
  {label: 'Deliverers', url: 'deliverers', Icon: LocalShipping},
  {label: 'Users', url: 'users', Icon: People, isAdminOnly: true},
];

const LandingPage = () => {
  const isAdmin = useIsAdmin();
  return (
    <Grid container spacing={2}>
      {sections
        .filter((s) => !s.isAdminOnly || isAdmin)
        .map(({label, url, Icon}) => (
          <Grid key={label} size={{xs: 12, md: 4}}>
            <Button
              component={Link}
              to={url}
              variant="outlined"
              size="large"
              fullWidth
              sx={{height: 200, fontSize: 18}}
            >
              <Icon sx={{fontSize: 72, mr: 1}} />
              {label}
            </Button>
          </Grid>
        ))}
    </Grid>
  );
};

export default LandingPage;

import {Article, FamilyRestroom, LocalShipping} from '@mui/icons-material';
import {Button, Grid} from '@mui/material';
import {Link} from 'react-router-dom';

const sections = [
  {label: 'Parents & Kids', url: 'parents', Icon: FamilyRestroom},
  {label: 'Orders', url: 'orders', Icon: Article},
  {label: 'Deliverers', url: 'deliverers', Icon: LocalShipping},
];

export const LandingPage = () => (
  <Grid container spacing={2}>
    {sections.map(({label, url, Icon}) => (
      <Grid key="label" item xs={4}>
        <Button
          component={Link}
          to={`/oasis/${url}`}
          variant="outlined"
          size="large"
          fullWidth
          sx={{height: 200, fontSize: 18}}
        >
          <Icon sx={{fontSize: 100}} />
          {label}
        </Button>
      </Grid>
    ))}
  </Grid>
);

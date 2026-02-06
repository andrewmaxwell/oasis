import {
  Article,
  ChildCare,
  FamilyRestroom,
  LocalShipping,
  People,
  TrendingFlat,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import {Link} from 'react-router-dom';
import {useIsAdmin} from '../../hooks/useAccessLevel';
import {useEffect, useState} from 'react';
import {getTableCount} from '../../supabase';

type Stat = {
  label: string;
  value: number | null;
  icon: React.ElementType;
  url: string;
  color: string;
};

const StatCard = ({stat}: {stat: Stat}) => (
  <Card sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
    <CardActionArea
      component={Link}
      to={stat.url}
      sx={{flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2}}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          mb: 2,
        }}
      >
        <Box
          sx={{
            bgcolor: `${stat.color}20`,
            p: 1.5,
            borderRadius: '50%',
            color: stat.color,
            display: 'flex',
          }}
        >
          <stat.icon sx={{fontSize: 32}} />
        </Box>
        {stat.value === null ? (
          <Skeleton variant="text" width={40} height={60} />
        ) : (
          <Typography variant="h3" fontWeight="bold" color="text.primary">
            {stat.value}
          </Typography>
        )}
      </Box>
      <Box sx={{alignSelf: 'flex-start'}}>
        <Typography variant="h6" color="text.secondary" fontWeight={500}>
          {stat.label}
        </Typography>
        <Typography
          variant="body2"
          color="primary"
          sx={{display: 'flex', alignItems: 'center', mt: 0.5}}
        >
          View All <TrendingFlat sx={{ml: 0.5, fontSize: 16}} />
        </Typography>
      </Box>
    </CardActionArea>
  </Card>
);

const ActionCard = ({
  action,
}: {
  action: {label: string; url: string; Icon: React.ElementType; desc: string};
}) => (
  <Card sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
    <CardActionArea
      component={Link}
      to={action.url}
      sx={{
        flexGrow: 1,
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.main',
          p: 2,
          borderRadius: '50%',
          color: 'white',
          mr: 3,
          display: 'flex',
        }}
      >
        <action.Icon sx={{fontSize: 40}} />
      </Box>
      <Box>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          {action.label}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {action.desc}
        </Typography>
      </Box>
    </CardActionArea>
  </Card>
);

const LandingPage = () => {
  const isAdmin = useIsAdmin();
  const [counts, setCounts] = useState<{
    parents: number | null;
    kids: number | null;
    deliverers: number | null;
  }>({parents: null, kids: null, deliverers: null});

  useEffect(() => {
    const fetchCounts = async () => {
      const [p, k, d] = await Promise.all([
        getTableCount('parent'),
        getTableCount('kid'),
        getTableCount('deliverer'),
      ]);
      setCounts({parents: p, kids: k, deliverers: d});
    };
    fetchCounts();
  }, []);

  const stats: Stat[] = [
    {
      label: 'Active Families',
      value: counts.parents,
      icon: FamilyRestroom,
      url: '/parents',
      color: '#2196f3',
    },
    {
      label: 'Active Kids',
      value: counts.kids,
      icon: ChildCare,
      url: '/kids',
      color: '#4caf50',
    },
    {
      label: 'Active Deliverers',
      value: counts.deliverers,
      icon: LocalShipping,
      url: '/deliverers',
      color: '#ff9800',
    },
  ];

  const actions = [
    {
      label: 'Manage Orders',
      url: 'orders',
      Icon: Article,
      desc: 'Create & View',
    },
    {
      label: 'Manage Users',
      url: 'users',
      Icon: People,
      isAdminOnly: true,
      desc: 'Admin access',
    },
  ];

  const visibleActions = actions.filter((a) => !a.isAdminOnly || isAdmin);

  return (
    <Box sx={{maxWidth: 1200, mx: 'auto', p: {xs: 2, md: 4}}}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{mb: 4}}>
        Dashboard
      </Typography>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{mb: 6}}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{xs: 12, sm: 6, md: 4}}>
            <StatCard stat={stat} />
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions Section */}
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{mb: 2}}>
        Quick Actions
      </Typography>
      <Grid
        container
        spacing={3}
        justifyContent={visibleActions.length === 1 ? 'center' : 'flex-start'}
      >
        {visibleActions.map((action) => (
          <Grid key={action.label} size={{xs: 12, md: 6}}>
            <ActionCard action={action} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LandingPage;

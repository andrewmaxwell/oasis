import {
  Article,
  ChildCare,
  FamilyRestroom,
  LocalShipping,
  People,
  TrendingFlat,
} from '@mui/icons-material';
import {
  alpha,
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
  /** A palette key, not a hex string — so a theme change carries through (ROADMAP §9). */
  color: 'info' | 'success' | 'warning';
};

const StatCard = ({stat}: {stat: Stat}) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      '&:hover .viewAllArrow': {transform: 'translateX(4px)'},
    }}
  >
    <CardActionArea
      component={Link}
      to={stat.url}
      sx={{flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5}}
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
            bgcolor: (t) => alpha(t.palette[stat.color].main, 0.15),
            p: 1.5,
            borderRadius: '50%',
            color: `${stat.color}.main`,
            display: 'flex',
          }}
        >
          <stat.icon sx={{fontSize: 28}} />
        </Box>
        {stat.value === null ? (
          <Skeleton variant="text" width={40} height={60} />
        ) : (
          <Typography
            variant="h3"
            fontWeight={700}
            color="text.primary"
            sx={{letterSpacing: '-0.03em', lineHeight: 1}}
          >
            {stat.value}
          </Typography>
        )}
      </Box>
      <Box sx={{alignSelf: 'flex-start'}}>
        <Typography variant="h6" color="text.primary" fontWeight={600}>
          {stat.label}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{display: 'flex', alignItems: 'center', mt: 0.5}}
        >
          View all
          <TrendingFlat
            className="viewAllArrow"
            sx={{
              ml: 0.5,
              fontSize: 16,
              transition: (t) => t.transitions.create('transform'),
            }}
          />
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
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <Box
        sx={{
          bgcolor: (t) => alpha(t.palette.primary.main, 0.15),
          p: 1.5,
          borderRadius: '50%',
          color: 'primary.light',
          mr: 2,
          display: 'flex',
        }}
      >
        <action.Icon sx={{fontSize: 28}} />
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={600} color="text.primary">
          {action.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
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
      color: 'info',
    },
    {
      label: 'Active Kids',
      value: counts.kids,
      icon: ChildCare,
      url: '/kids',
      color: 'success',
    },
    {
      label: 'Active Deliverers',
      value: counts.deliverers,
      icon: LocalShipping,
      url: '/deliverers',
      color: 'warning',
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
      <Typography variant="h4" gutterBottom sx={{mb: 4}}>
        Dashboard
      </Typography>

      {/* Stats Section */}
      <Grid container spacing={2.5} sx={{mb: 6}}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{xs: 12, sm: 6, md: 4}}>
            <StatCard stat={stat} />
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions Section */}
      <Typography variant="h5" gutterBottom sx={{mb: 2}}>
        Quick Actions
      </Typography>
      <Grid
        container
        spacing={2.5}
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

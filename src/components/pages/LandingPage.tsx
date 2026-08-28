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
import {useQueries} from '@tanstack/react-query';
import {getTableCount, TableWithActiveFlag} from '../../supabase';
import {queryKeys} from '../../queryClient';
import {combineQueries} from '../../hooks/combineQueries';
import {ErrorState} from '../PageStates';

type Stat = {
  label: string;
  /** Null while loading — the card shows a Skeleton in its place. */
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
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {stat.value}
          </Typography>
        )}
      </Box>
      <Box sx={{alignSelf: 'flex-start'}}>
        <Typography variant="h6" sx={{color: 'text.primary', fontWeight: 600}}>
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
        <Typography variant="h6" sx={{fontWeight: 600, color: 'text.primary'}}>
          {action.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {action.desc}
        </Typography>
      </Box>
    </CardActionArea>
  </Card>
);

const COUNTED_TABLES: {
  table: TableWithActiveFlag;
  label: string;
  icon: React.ElementType;
  url: string;
  color: Stat['color'];
}[] = [
  {
    table: 'parent',
    label: 'Active Families',
    icon: FamilyRestroom,
    url: '/parents',
    color: 'info',
  },
  {
    table: 'kid',
    label: 'Active Kids',
    icon: ChildCare,
    url: '/kids',
    color: 'success',
  },
  {
    table: 'deliverer',
    label: 'Active Deliverers',
    icon: LocalShipping,
    url: '/deliverers',
    color: 'warning',
  },
];

const LandingPage = () => {
  const isAdmin = useIsAdmin();

  const countQueries = useQueries({
    queries: COUNTED_TABLES.map(({table}) => ({
      queryKey: queryKeys.count(table),
      queryFn: () => getTableCount(table),
    })),
  });

  const {error: countsError, refetch: refetchCounts} = combineQueries(
    ...countQueries,
  );

  const stats: Stat[] = COUNTED_TABLES.map(({label, icon, url, color}, i) => ({
    label,
    value: countQueries[i].data ?? null,
    icon,
    url,
    color,
  }));

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
      {countsError && (
        <ErrorState
          error={countsError}
          onRetry={refetchCounts}
          title="Could not load the roster counts"
        />
      )}
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
        sx={{
          justifyContent: visibleActions.length === 1 ? 'center' : 'flex-start',
        }}
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

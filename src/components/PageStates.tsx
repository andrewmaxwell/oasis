import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Grid,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';
import {Refresh} from '@mui/icons-material';

/**
 * The replacement for "spinner forever behind a native alert" (ISSUES #9). Every page that
 * loads data renders this when the query has exhausted its retries, so the user can see
 * what happened and try again without reloading the app.
 */
export const ErrorState = ({
  error,
  onRetry,
  title = 'Could not load this page',
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) => (
  <Alert
    severity="error"
    sx={{my: 2}}
    action={
      onRetry && (
        <Button
          color="inherit"
          size="small"
          startIcon={<Refresh />}
          onClick={onRetry}
        >
          Retry
        </Button>
      )
    }
  >
    <AlertTitle>{title}</AlertTitle>
    {error instanceof Error ? error.message : 'Something went wrong.'}
  </Alert>
);

/** Shown while a record loads, so the form doesn't pop in and shift the layout. */
export const FormSkeleton = ({rows = 4}: {rows?: number}) => (
  <Paper sx={{p: 2}}>
    <Skeleton variant="text" width={180} height={40} sx={{mb: 2}} />
    <Grid container spacing={2}>
      {Array.from({length: rows * 3}, (_, i) => (
        <Grid key={i} size={{xs: 12, md: 4}}>
          <Skeleton variant="rounded" height={56} />
        </Grid>
      ))}
    </Grid>
  </Paper>
);

/** Placeholder for a whole page of content that isn't a form or a table. */
export const BlockSkeleton = ({height = 200}: {height?: number}) => (
  <Skeleton variant="rounded" height={height} sx={{my: 2}} />
);

/** Renders in an otherwise-empty table. "No families yet" beats a blank grid. */
export const EmptyState = ({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      height: '100%',
      p: 4,
    }}
  >
    <Typography color="text.secondary">{message}</Typography>
    {action}
  </Box>
);

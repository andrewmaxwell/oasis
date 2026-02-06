import {
  Button,
  CircularProgress,
  Paper,
  Typography,
  Grid,
  Box,
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Add, Search} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridValidRowModel,
  QuickFilter,
  QuickFilterControl,
} from '@mui/x-data-grid';
import {useCanWrite} from '../hooks/useAccessLevel';

type CustomToolbarProps = {
  label: string;
  newItemUrl?: string;
  secondaryLabel: string;
};
const CustomToolbar = ({
  label,
  newItemUrl,
  secondaryLabel = '',
}: CustomToolbarProps) => {
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  return (
    <Box
      sx={{
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Grid container justifyContent="space-between" width="100%">
        <Grid>
          <Typography variant="h5">
            {label}s{secondaryLabel}
          </Typography>
        </Grid>
        <Grid sx={{display: 'flex', alignItems: 'center', gap: 1}}>
          {canWrite && newItemUrl && (
            <Button
              variant="contained"
              onClick={() => navigate(newItemUrl)}
              startIcon={<Add />}
            >
              {label}
            </Button>
          )}
          <QuickFilter>
            <QuickFilterControl
              size="small"
              placeholder="Search..."
              slotProps={{
                input: {
                  startAdornment: (
                    <Search
                      fontSize="small"
                      sx={{mr: 1, color: 'text.secondary'}}
                    />
                  ),
                },
              }}
            />
          </QuickFilter>
        </Grid>
      </Grid>
    </Box>
  );
};

type OasisTableProps<T extends GridValidRowModel> = {
  data: T[] | undefined;
  label: string;
  columns: readonly GridColDef<T>[];
  newItemUrl?: string;
  secondaryLabel?: string;
};

export const OasisTable = <T extends {id: string}>({
  data,
  label,
  columns,
  newItemUrl,
  secondaryLabel,
}: OasisTableProps<T>) => {
  if (!data) return <CircularProgress />;
  return (
    <Paper sx={{mt: 2, p: 2}}>
      <DataGrid
        style={{border: 0}}
        rows={data}
        columns={columns}
        showToolbar
        slots={{toolbar: CustomToolbar as any}}
        slotProps={{toolbar: {label, newItemUrl, secondaryLabel} as any}}
      />
    </Paper>
  );
};

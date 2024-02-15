import {Button, CircularProgress, Grid, Paper, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Add} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridToolbarQuickFilter,
  GridValidRowModel,
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
    <Grid container justifyContent="space-between" p={1}>
      <Grid item>
        <Typography variant="h5">
          {label}s{secondaryLabel}
        </Typography>
      </Grid>
      <Grid item>
        {canWrite && newItemUrl && (
          <Button
            variant="contained"
            onClick={() => navigate(newItemUrl)}
            startIcon={<Add />}
            sx={{transform: 'translate(-10px, -3px)'}}
          >
            {label}
          </Button>
        )}
        <GridToolbarQuickFilter />
      </Grid>
    </Grid>
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
        slots={{toolbar: CustomToolbar}}
        slotProps={{toolbar: {label, newItemUrl, secondaryLabel}}}
      />
    </Paper>
  );
};

import {Button, CircularProgress, Grid, Paper, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Add} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridToolbarQuickFilter,
  GridValidRowModel,
} from '@mui/x-data-grid';

type CustomToolbarProps = {label: string; newItemUrl?: string};
const CustomToolbar = ({label, newItemUrl}: CustomToolbarProps) => {
  const navigate = useNavigate();
  return (
    <Grid container justifyContent="space-between" p={1}>
      <Grid item>
        <Typography variant="h5">{label}s</Typography>
      </Grid>
      <Grid item>
        {newItemUrl && (
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
};

export const OasisTable = <T extends {id: string}>({
  data,
  label,
  columns,
  newItemUrl,
}: OasisTableProps<T>) => {
  if (!data) return <CircularProgress />;
  return (
    <Paper sx={{mt: 2, p: 2}}>
      <DataGrid
        style={{border: 0}}
        rows={data}
        columns={columns}
        slots={{toolbar: CustomToolbar}}
        slotProps={{toolbar: {label, newItemUrl}}}
      />
    </Paper>
  );
};

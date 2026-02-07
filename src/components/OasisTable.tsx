import {Button, Paper, Typography, Box, InputAdornment} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Add, Search} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridToolbarProps,
  GridValidRowModel,
  QuickFilter,
  QuickFilterControl,
  Toolbar,
} from '@mui/x-data-grid';
import {useCanWrite} from '../hooks/useAccessLevel';

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    label: string;
    newItemUrl?: string;
    secondaryLabel?: string;
  }
}

interface CustomToolbarProps extends GridToolbarProps {
  label: string;
  newItemUrl?: string;
  secondaryLabel?: string;
}

const CustomToolbar = ({
  label,
  newItemUrl,
  secondaryLabel = '',
}: CustomToolbarProps) => {
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  return (
    <Toolbar style={{padding: '0 0 10px 0'}}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          width: '100%',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {label}s
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {secondaryLabel}
          </Typography>
        </Box>
        <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
          <Box>
            <QuickFilter>
              <QuickFilterControl
                // @ts-expect-error: variant/size passed to TextField
                variant="outlined"
                size="small"
                placeholder="Search..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </QuickFilter>
          </Box>
          {canWrite && newItemUrl && (
            <Button
              variant="contained"
              onClick={() => newItemUrl && navigate(newItemUrl)}
              startIcon={<Add />}
              disableElevation
            >
              Add {label}
            </Button>
          )}
        </Box>
      </Box>
    </Toolbar>
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
}: OasisTableProps<T>) => (
  <Paper sx={{mt: 2, p: 2}}>
    <DataGrid
      sx={{border: 0}}
      loading={!data}
      rows={data || []}
      columns={columns}
      showToolbar
      slots={{toolbar: CustomToolbar}}
      slotProps={{toolbar: {label, newItemUrl, secondaryLabel}}}
    />
  </Paper>
);

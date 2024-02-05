import {useState} from 'react';
import {Box, Button, CircularProgress, Paper, TextField} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Add} from '@mui/icons-material';
import {DataGrid, GridColDef, GridValidRowModel} from '@mui/x-data-grid';

type OasisTableProps<T extends GridValidRowModel> = {
  data: T[] | undefined;
  label?: string;
  columns: readonly GridColDef<T>[];
  fieldsToSearch?: (keyof T)[];
  newItemUrl?: string;
};

export const OasisTable = <T extends {id: string}>({
  data,
  label,
  columns,
  fieldsToSearch,
  newItemUrl,
}: OasisTableProps<T>) => {
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  if (!data) return <CircularProgress />;
  return (
    <Paper sx={{p: 2, mt: 2}}>
      {(fieldsToSearch || newItemUrl) && (
        <Box display="flex" mb={2}>
          {fieldsToSearch && (
            <TextField
              type="search"
              label={`Search ${label}s`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              sx={{mr: 1}}
            />
          )}

          {newItemUrl && (
            <Button
              variant="contained"
              onClick={() => navigate(newItemUrl)}
              startIcon={<Add />}
            >
              {label}
            </Button>
          )}
        </Box>
      )}

      <DataGrid rows={data} columns={columns} density="compact" />
    </Paper>
  );
};

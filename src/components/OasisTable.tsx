import {useState} from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {searchSorter} from '../utils/searchSorter.ts';
import {useNavigate} from 'react-router-dom';
import {Add} from '@mui/icons-material';
import {TableColumn} from '../types.ts';

type OasisTableProps<T> = {
  data: T[] | undefined;
  label?: string;
  columns: TableColumn<T>[];
  fieldsToSearch?: (keyof T)[];
  newItemUrl?: string;
  setState?: React.Dispatch<React.SetStateAction<T[] | undefined>>;
};

export const OasisTable = <T extends {id: string}>({
  data,
  label,
  columns,
  fieldsToSearch,
  newItemUrl,
  setState,
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

      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.label}>{c.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {(fieldsToSearch
            ? searchSorter(data, search, fieldsToSearch)
            : data
          ).map((p) => (
            <TableRow key={p.id}>
              {columns.map((c) => (
                <TableCell key={c.label} width={c.width}>
                  {c.render(p, setState)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

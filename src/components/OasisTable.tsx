import {useEffect, useState} from 'react';
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

type OasisTableProps<T> = {
  dataGetter: () => T[] | Promise<T[]>;
  label: string;
  columns: {
    label: string;
    render: (record: T) => string | number | JSX.Element;
  }[];
  fieldsToSearch: (keyof T)[];
  newItemUrl: string;
};

export const OasisTable = <T extends {id: string}>({
  dataGetter,
  label,
  columns,
  fieldsToSearch,
  newItemUrl,
}: OasisTableProps<T>) => {
  const [data, setData] = useState<T[]>();
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.resolve(dataGetter()).then(setData);
  }, [dataGetter]);

  const navigate = useNavigate();

  if (!data) return <CircularProgress />;

  return (
    <Paper sx={{p: 2, mt: 2}}>
      <Box display="flex" mb={2}>
        <TextField
          type="search"
          label={`Search ${label}s`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          sx={{mr: 1}}
        />

        <Button
          variant="contained"
          onClick={() => navigate(newItemUrl)}
          startIcon={<Add />}
        >
          {label}
        </Button>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.label}>{c.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {searchSorter(data, search, fieldsToSearch).map((p) => (
            <TableRow key={p.id}>
              {columns.map((c) => (
                <TableCell key={c.label}>{c.render(p)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

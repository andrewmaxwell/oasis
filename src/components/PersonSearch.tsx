import {useEffect, useState} from 'react';
import {getParentsWithChildren} from '../supabase.ts';
import {
  Button,
  CircularProgress,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {Parent} from '../types.ts';
import {searchSorter} from '../utils/searchSorter.ts';
import {Link, useNavigate} from 'react-router-dom';
import {Add} from '@mui/icons-material';

const parentFieldsToSearch: (keyof Parent)[] = [
  'last_name',
  'first_name',
  'phone_number',
  'zip',
  'city',
  'address',
];

export const PersonSearch = () => {
  const [data, setData] = useState<Parent[]>();
  const [search, setSearch] = useState('');

  useEffect(() => {
    getParentsWithChildren().then(setData);
  }, []);

  const navigate = useNavigate();

  if (!data) return <CircularProgress />;

  return (
    <>
      <TextField
        type="search"
        label="Search Parents"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{marginBottom: 2}}
      />

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Phone #</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {searchSorter(data, search, parentFieldsToSearch).map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Button component={Link} to={`parent/${p.id}`}>
                  {p.first_name} {p.last_name}
                </Button>
              </TableCell>
              <TableCell>
                {p.address}, {p.city}, {p.zip}
              </TableCell>
              <TableCell>{p.phone_number}</TableCell>
              <TableCell>{p.is_active ? 'Y' : 'N'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Fab
        color="primary"
        aria-label="add"
        variant="extended"
        style={{position: 'fixed', bottom: 16, right: 16}}
        onClick={() => navigate('parent/new')}
      >
        <Add />
        Parent
      </Fab>
    </>
  );
};

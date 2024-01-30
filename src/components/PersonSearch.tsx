import {useEffect, useState} from 'react';
import {getParentsWithChildren} from '../supabase.ts';
import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {Parent} from '../types.ts';
import {searchSorter} from '../utils/searchSorter.ts';

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

  if (!data) return <CircularProgress />;

  return (
    <>
      <TextField
        type="search"
        label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{margin: '10px 0'}}
      />

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Phone #</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {searchSorter(data, search, parentFieldsToSearch).map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                {p.first_name} {p.last_name}
              </TableCell>
              <TableCell>
                {p.address}, {p.city}, {p.zip}
              </TableCell>
              <TableCell>{p.phone_number}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

import {Button} from '@mui/material';
import {getParentsAndKids} from '../../supabase.ts';
import {Parent} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {Link} from 'react-router-dom';
import {useData} from '../../utils/useData.ts';

const parentFieldsToSearch: (keyof Parent)[] = [
  'last_name',
  'first_name',
  'phone_number',
  'zip',
  'city',
  'address',
];

const columns = [
  {
    label: 'Name',
    render: (p: Parent) => (
      <Button component={Link} to={`/oasis/parent/${p.id}`}>
        {p.first_name} {p.last_name}
      </Button>
    ),
  },
  {
    label: 'Address',
    render: (p: Parent) => `${p.address}, ${p.city}, ${p.zip}`,
  },
  {label: 'Phone', render: (p: Parent) => p.phone_number},
  {label: 'Kids', render: (p: Parent) => p.kid.length},
  {label: 'Active', render: (p: Parent) => (p.is_active ? 'Y' : 'N')},
];

export const ParentTablePage = () => (
  <OasisTable
    data={useData(getParentsAndKids)}
    label="Parent"
    columns={columns}
    fieldsToSearch={parentFieldsToSearch}
    newItemUrl="/oasis/parent/new"
  />
);

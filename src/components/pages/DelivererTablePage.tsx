import {Link} from 'react-router-dom';
import {getAllRecords} from '../../supabase.ts';
import {Deliverer} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {Button} from '@mui/material';
import {useData} from '../../utils/useData.ts';

const getDeliverers = async () =>
  (await getAllRecords('deliverer')) as Deliverer[];

const delivererFieldsToSearch: (keyof Deliverer)[] = ['name', 'email'];

const columns = [
  {
    label: 'Name',
    render: (d: Deliverer) => (
      <Button component={Link} to={`/oasis/deliverer/${d.id}`}>
        {d.name}
      </Button>
    ),
  },
  {label: 'Email', render: (d: Deliverer) => d.email},
  {label: 'Phone Number', render: (d: Deliverer) => d.phone_number},
  {label: 'Active', render: (d: Deliverer) => (d.is_active ? 'Y' : 'N')},
];

export const DelivererTablePage = () => (
  <OasisTable
    data={useData(getDeliverers)}
    label="Deliverer"
    columns={columns}
    fieldsToSearch={delivererFieldsToSearch}
    newItemUrl="/oasis/deliverer/new"
  />
);

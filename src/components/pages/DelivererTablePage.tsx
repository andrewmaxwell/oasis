import {getAllRecords} from '../../supabase.ts';
import {Deliverer} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {useData} from '../../utils/useData.ts';
import {GridColDef} from '@mui/x-data-grid';
import {anchor, bool, linkButton} from '../cellRenderers.tsx';

const getDeliverers = async () =>
  ((await getAllRecords('deliverer')) as Deliverer[]).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

const delivererFieldsToSearch: (keyof Deliverer)[] = ['name', 'email'];

const columns: GridColDef<Deliverer>[] = [
  {
    field: 'name',
    headerName: 'Name',
    width: 250,
    renderCell: linkButton('deliverer'),
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 250,
    renderCell: anchor('email'),
  },
  {
    field: 'phone_number',
    headerName: 'Phone Number',
    width: 200,
    renderCell: anchor('tel'),
  },
  {field: 'is_active', headerName: 'Active', width: 100, renderCell: bool},
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

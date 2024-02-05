import {Parent} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {useData} from '../../utils/useData.ts';
import {getAllRecords} from '../../supabase.ts';
import {GridColDef} from '@mui/x-data-grid';
import {anchor, bool, linkButton, mapAnchor} from '../cellRenderers.tsx';

const columns: GridColDef<Parent>[] = [
  {
    field: 'name',
    headerName: 'Name',
    valueGetter: ({row}) => `${row.first_name} ${row.last_name}`,
    renderCell: linkButton('parent'),
    width: 250,
  },
  {field: 'address', headerName: 'Address', width: 250, renderCell: mapAnchor},
  {field: 'city', headerName: 'City', width: 150},
  {field: 'zip', headerName: 'Zip', width: 100},
  {
    field: 'phone_number',
    headerName: 'Phone',
    renderCell: anchor('tel'),
    width: 150,
  },
  {field: 'is_active', headerName: 'Active', renderCell: bool, width: 100},
];

const getParents = async () =>
  ((await getAllRecords('parent')) as Parent[]).sort(
    (a, b) =>
      Number(b.is_active) - Number(a.is_active) ||
      a.first_name.localeCompare(b.first_name) ||
      a.last_name.localeCompare(b.last_name),
  );

export const ParentTablePage = () => (
  <OasisTable
    data={useData(getParents)}
    label="Parent"
    columns={columns}
    newItemUrl="/oasis/parent/new"
  />
);

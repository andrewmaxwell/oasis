import {getAllRecords} from '../../supabase.ts';
import {Deliverer} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {useData} from '../../hooks/useData.ts';
import {GridColDef} from '@mui/x-data-grid';
import {anchor, bool, linkButton} from '../cellRenderers.tsx';
import {queryKeys} from '../../queryClient.ts';

const getDeliverers = async () =>
  ((await getAllRecords('deliverer')) as Deliverer[]).sort(
    (a, b) =>
      Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name),
  );

const columns: GridColDef<Deliverer>[] = [
  {field: 'is_active', headerName: 'Active', width: 90, renderCell: bool},
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
    renderCell: anchor('mailto'),
  },
  {
    field: 'phone_number',
    headerName: 'Phone Number',
    width: 200,
    renderCell: anchor('tel'),
  },
];

const DelivererTablePage = () => {
  const {
    data: deliverers,
    error,
    refetch,
  } = useData(queryKeys.table('deliverer'), getDeliverers);

  return (
    <OasisTable
      data={deliverers}
      label="Deliverer"
      columns={columns}
      newItemUrl="/deliverer/new"
      emptyMessage="No deliverers yet — add your first one."
      error={error}
      onRetry={refetch}
    />
  );
};

export default DelivererTablePage;

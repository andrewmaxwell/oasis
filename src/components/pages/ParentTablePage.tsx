import {OasisTable} from '../OasisTable.tsx';
import {useData} from '../../hooks/useData.ts';
import {getView} from '../../supabase.ts';
import {GridColDef} from '@mui/x-data-grid';
import {anchor, bool, linkButton, mapAnchor} from '../cellRenderers.tsx';
import {getDiaperQuantity} from '../../utils/calcDiaperSizes.ts';
import {consolidateOrderKids} from '../../utils/consolidateOrderKids.ts';
import {DiaperSize} from '../../types.ts';

type ParentViewRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  phone_number: string;
  deliverer_id: string;
  deliverer_name: string;
  is_active: boolean;
  diaper_sizes: DiaperSize[];
};

const columns: GridColDef<ParentViewRow>[] = [
  {field: 'is_active', headerName: 'Active', renderCell: bool, width: 50},
  {
    field: 'name',
    headerName: 'Name',
    renderCell: linkButton('parent'),
    width: 200,
  },
  {field: 'address', headerName: 'Address', width: 200, renderCell: mapAnchor},
  {field: 'city', headerName: 'City', width: 150},
  {field: 'zip', headerName: 'Zip', width: 100},
  {
    field: 'phone_number',
    headerName: 'Phone',
    renderCell: anchor('tel'),
    width: 120,
  },
  {
    field: 'activeKids',
    headerName: 'Kids',
    valueGetter: (_, row) => row.diaper_sizes.length,
    width: 50,
  },
  {
    field: 'deliverer_name',
    headerName: 'Deliverer',
    renderCell: linkButton('deliverer', 'deliverer_id'),
    width: 150,
  },
  {
    field: 'diaper_sizes',
    headerName: 'Quantities',
    valueGetter: (_, row) =>
      consolidateOrderKids(
        row.diaper_sizes.map((diaper_size) => ({
          diaper_size,
          diaper_quantity: getDiaperQuantity(diaper_size),
        })),
      ),
    width: 400,
  },
];

const getParents = async () =>
  (await getView('parent_view')) as ParentViewRow[];

const ParentTablePage = () => {
  const parents = useData(getParents);
  const activeParents = parents?.filter((p) => p.is_active);
  const numKids = activeParents?.flatMap((p) => p.diaper_sizes).length;
  return (
    <OasisTable
      data={parents}
      label="Parent"
      secondaryLabel={` (${activeParents?.length} active parents, ${numKids} kids)`}
      columns={columns}
      newItemUrl="/parent/new"
    />
  );
};

export default ParentTablePage;

import {OasisTable} from '../OasisTable.tsx';
import {useData} from '../../utils/useData.ts';
import {getView} from '../../supabase.ts';
import {GridColDef} from '@mui/x-data-grid';
import {anchor, bool, linkButton, mapAnchor} from '../cellRenderers.tsx';
import {getDiaperQuantity} from '../../utils/calcDiaperSizes.ts';
import {consolidateOrderKids} from '../../utils/consolidateOrderKids.ts';

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
  diaper_sizes: string[];
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
    width: 100,
  },
  {
    field: 'activeKids',
    headerName: 'Kids',
    renderCell: ({row}) => row.diaper_sizes.length,
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
    renderCell: ({row}) =>
      consolidateOrderKids(
        row.diaper_sizes
          .filter((s) => s)
          .map((diaper_size) => ({
            diaper_size,
            diaper_quantity: getDiaperQuantity(diaper_size),
          })),
      ),
    width: 400,
  },
];

const getParents = async () =>
  (await getView('parent_view')) as ParentViewRow[];

export const ParentTablePage = () => (
  <OasisTable
    data={useData(getParents)}
    label="Parent"
    columns={columns}
    newItemUrl="/parent/new"
  />
);

import {getAllRecords} from '../../supabase.ts';
import {OrderRecord} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {useData} from '../../hooks/useData.ts';
import {GridColDef} from '@mui/x-data-grid';
import {linkButton} from '../cellRenderers.tsx';

const columns: GridColDef<OrderRecord>[] = [
  {
    field: 'date_of_order',
    headerName: 'Date of Order',
    width: 200,
    renderCell: linkButton('order'),
  },
  {
    field: 'date_of_pickup',
    width: 200,
    headerName: 'Pickup',
  },
  {
    field: 'notes',
    width: 400,
    headerName: 'Notes',
  },
];

const getOrders = async () =>
  ((await getAllRecords('order_record')) as OrderRecord[]).sort((a, b) =>
    b.date_of_order.localeCompare(a.date_of_order),
  );

const OrderTablePage = () => (
  <OasisTable
    data={useData(getOrders)}
    label="Order"
    columns={columns}
    newItemUrl="/order/new"
  />
);

export default OrderTablePage;

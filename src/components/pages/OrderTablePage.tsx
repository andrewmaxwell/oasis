import {getAllRecords} from '../../supabase.ts';
import {OrderRecord} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {useData} from '../../utils/useData.ts';
import {GridColDef} from '@mui/x-data-grid';
import {linkButton} from '../cellRenderers.tsx';

const orderFieldsToSearch: (keyof OrderRecord)[] = ['date_of_order'];

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
];

const getOrders = async () =>
  ((await getAllRecords('order_record')) as OrderRecord[]).sort((a, b) =>
    b.date_of_order.localeCompare(a.date_of_order),
  );

export const OrderTablePage = () => (
  <OasisTable
    data={useData(getOrders)}
    label="Order"
    columns={columns}
    fieldsToSearch={orderFieldsToSearch}
    newItemUrl="/oasis/order/new"
  />
);

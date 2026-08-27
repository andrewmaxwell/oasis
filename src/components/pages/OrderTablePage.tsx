import {getAllRecords} from '../../supabase.ts';
import {OrderRecord} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {useData} from '../../hooks/useData.ts';
import {GridColDef} from '@mui/x-data-grid';
import {linkButton} from '../cellRenderers.tsx';
import {queryKeys} from '../../queryClient.ts';

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

const OrderTablePage = () => {
  const {
    data: orders,
    error,
    refetch,
  } = useData(queryKeys.table('order_record'), getOrders);

  return (
    <OasisTable
      data={orders}
      label="Order"
      columns={columns}
      newItemUrl="/order/new"
      emptyMessage="No orders yet — create this month's order to get started."
      error={error}
      onRetry={refetch}
    />
  );
};

export default OrderTablePage;

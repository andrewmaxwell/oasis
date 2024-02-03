import {Button} from '@mui/material';
import {getAllRecords} from '../../supabase.ts';
import {OrderRecord} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {Link} from 'react-router-dom';
import {useData} from '../../utils/useData.ts';

const orderFieldsToSearch: (keyof OrderRecord)[] = ['date_of_order'];

const columns = [
  {
    label: 'Date of Order',
    render: (o: OrderRecord) => (
      <Button component={Link} to={`/oasis/order/${o.id}`}>
        {o.date_of_order}
      </Button>
    ),
  },
  {
    label: 'Pickup',
    render: (o: OrderRecord) => o.date_of_pickup,
  },
];

const getOrders = async () =>
  (await getAllRecords('order_record')) as OrderRecord[];

export const OrderTablePage = () => (
  <OasisTable
    data={useData(getOrders)}
    label="Order"
    columns={columns}
    fieldsToSearch={orderFieldsToSearch}
    newItemUrl="/oasis/order/new"
  />
);

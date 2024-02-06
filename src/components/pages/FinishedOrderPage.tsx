import {Fragment, useEffect, useState} from 'react';
import {Deliverer, OrderKid, OrderRecord, Parent} from '../../types.ts';
import {useNavigate, useParams} from 'react-router-dom';
import {
  deleteRecord,
  getOrderKids,
  getOrderParents,
  getRecord,
} from '../../supabase.ts';
import {
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import {groupBy} from '../../utils/groupBy.ts';
import {formatCounts} from './NewOrderPage/calcDiaperSizes.ts';

type OrderParent = Parent & {orderKids: OrderKid[]};
type OrderDeliverer = Deliverer & {orderParents: OrderParent[]};
type FinishedOrder = OrderRecord & {deliverers: OrderDeliverer[]};

const getData = async (orderId: string): Promise<FinishedOrder | undefined> => {
  const [orderRecord, orderParents, orderKids] = await Promise.all([
    getRecord('order_record', orderId) as Promise<OrderRecord>,
    getOrderParents(orderId),
    getOrderKids(orderId),
  ]);

  if (!orderRecord || !orderParents || !orderKids) return;

  const groupedParents = groupBy(orderParents, (p) => p.deliverer.id);
  const kidIndex = groupBy(orderKids, (k) => k.kid.parent_id);

  return {
    ...orderRecord,
    deliverers: Object.values(groupedParents)
      .map((arr) => ({
        ...arr[0].deliverer,
        orderParents: arr
          .map((a) => ({
            ...a.parent,
            orderKids: kidIndex[a.parent.id] || [],
          }))
          .sort(
            (a, b) =>
              a.first_name.localeCompare(b.first_name) ||
              a.last_name.localeCompare(b.last_name),
          ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

const consolidate = (orderKids: OrderKid[]) => {
  const counts: {[key: string]: number} = {};
  for (const {diaper_quantity, diaper_size} of orderKids) {
    counts[diaper_size] = (counts[diaper_size] || 0) + diaper_quantity;
  }
  return formatCounts(counts);
};

const formatParents = (orderParents: OrderParent[]) =>
  orderParents.map((p) => (
    <TableRow key={p.id}>
      <TableCell>
        {p.first_name} {p.last_name}
      </TableCell>
      <TableCell>{p.address}</TableCell>
      <TableCell>{p.city}</TableCell>
      <TableCell>{p.zip}</TableCell>
      <TableCell>{p.phone_number}</TableCell>
      <TableCell>{consolidate(p.orderKids)}</TableCell>
    </TableRow>
  ));

const formatDeliverers = (deliverers: OrderDeliverer[]) =>
  deliverers.map((d) => (
    <Fragment key={d.id}>
      <h4>Deliverer: {d.name}</h4>
      <Table size="small">
        <TableBody>{formatParents(d.orderParents)}</TableBody>
      </Table>
    </Fragment>
  ));

const formatOrderData = (o: FinishedOrder) => {
  const totals = consolidate(
    o.deliverers.flatMap((d) => d.orderParents.flatMap((p) => p.orderKids)),
  )
    .split(', ')
    .map((r) => <div key={r}>{r}</div>);

  const families = formatParents(
    o.deliverers
      .flatMap((d) => d.orderParents)
      .sort(
        (a, b) =>
          a.first_name.localeCompare(b.first_name) ||
          a.last_name.localeCompare(b.last_name),
      ),
  );

  return (
    <>
      <div>Date of Order: {o.date_of_order}</div>
      <div>Date of Pickup: {o.date_of_pickup}</div>
      <div>
        Notes: <pre>{o.notes}</pre>
      </div>
      <div>Totals: {totals}</div>
      <h3>Sorted by Deliverer:</h3>
      {formatDeliverers(o.deliverers)}
      <h3>Sorted by Family:</h3>
      <Table size="small">
        <TableBody>{families}</TableBody>
      </Table>
    </>
  );
};

export const FinishedOrderPage = () => {
  const [orderData, setOrderData] = useState<FinishedOrder>();
  const {id: orderId} = useParams();

  useEffect(() => {
    if (orderId) getData(orderId).then(setOrderData);
  }, [orderId]);

  const navigate = useNavigate();

  const deleteOrder = async () => {
    const msg = `Are you sure you want to delete this order? This cannot be undone.`;
    if (!orderId || !confirm(msg)) return;
    await deleteRecord('order_record', orderId);
    navigate(`/orders`);
  };

  if (!orderData) return <CircularProgress />;

  return (
    <>
      {formatOrderData(orderData)}
      <Button color="error" sx={{mt: 4}} onClick={deleteOrder}>
        Delete Order
      </Button>
    </>
  );
};

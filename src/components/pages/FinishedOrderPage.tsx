import {useEffect, useState} from 'react';
import {Deliverer, OrderKid, OrderRecord, Parent} from '../../types.ts';
import {useNavigate, useParams} from 'react-router-dom';
import {
  deleteRecord,
  getOrderKids,
  getOrderParents,
  getRecord,
} from '../../supabase.ts';
import {Button, CircularProgress} from '@mui/material';
import {groupBy} from '../../utils/groupBy.ts';

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
    deliverers: Object.values(groupedParents).map((arr) => ({
      ...arr[0].deliverer,
      orderParents: arr.map((a) => ({
        ...a.parent,
        orderKids: kidIndex[a.parent.id] || [],
      })),
    })),
  };
};

// TODO: consolidate by size
const formatKids = (orderKids: OrderKid[]) =>
  orderKids
    .map((k) => `${k.diaper_quantity}x Size ${k.diaper_size}`)
    .join(', ');

const formatParents = (orderParents: OrderParent[]) =>
  orderParents
    .map(
      (p) =>
        `${p.first_name} ${p.last_name} | ${p.address}, ${p.city}, ${p.zip} | ${p.phone_number} | ${formatKids(p.orderKids)}`,
    )
    .join('\n');

const formatDeliverers = (deliverers: OrderDeliverer[]) =>
  deliverers
    .map((d) => `Deliverer: ${d.name}\n${formatParents(d.orderParents)}`)
    .join('\n\n');

const formatOrderData = (o: FinishedOrder) => `Date of Order: ${o.date_of_order}
Date of Pickup: ${o.date_of_pickup}
Notes:
${o.notes}



${formatDeliverers(o.deliverers)}`;

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
    navigate(`/oasis/orders`);
  };

  if (!orderData) return <CircularProgress />;

  return (
    <>
      <pre>{formatOrderData(orderData)}</pre>
      <Button color="error" sx={{mt: 4}} onClick={deleteOrder}>
        Delete Order
      </Button>
    </>
  );
};

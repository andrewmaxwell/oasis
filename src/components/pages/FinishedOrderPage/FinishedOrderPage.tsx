import {Fragment, useEffect, useState} from 'react';
import {FinishedOrder, OrderParent} from '../../../types.ts';
import {useNavigate, useParams} from 'react-router-dom';
import {deleteRecord} from '../../../supabase.ts';
import {
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {getOrderData} from './getOrderData.ts';
import {consolidateOrderKids} from '../../../utils/consolidateOrderKids.ts';

const makeParentTable = (orderParents: OrderParent[]) => (
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Address</TableCell>
        <TableCell>City</TableCell>
        <TableCell>Zip</TableCell>
        <TableCell>Phone</TableCell>
        <TableCell>Deliverer</TableCell>
        <TableCell>Diapers</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {orderParents.map((p) => (
        <TableRow key={p.id}>
          <TableCell>
            {p.first_name} {p.last_name}
          </TableCell>
          <TableCell>{p.address}</TableCell>
          <TableCell>{p.city}</TableCell>
          <TableCell>{p.zip}</TableCell>
          <TableCell>{p.phone_number}</TableCell>
          <TableCell>{p.deliverer.name}</TableCell>
          <TableCell>{consolidateOrderKids(p.orderKids)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export const FinishedOrderPage = () => {
  const [orderData, setOrderData] = useState<FinishedOrder>();
  const {id: orderId} = useParams();

  useEffect(() => {
    if (orderId) getOrderData(orderId).then(setOrderData);
  }, [orderId]);

  const navigate = useNavigate();

  const deleteOrder = async () => {
    const msg = `Are you sure you want to delete this order? This cannot be undone.`;
    if (!orderId || !confirm(msg)) return;
    await deleteRecord('order_record', orderId);
    navigate(`/orders`);
  };

  if (!orderData) return <CircularProgress />;
  const {deliverers, date_of_order, date_of_pickup, notes} = orderData;

  const totals = consolidateOrderKids(
    deliverers.flatMap((d) => d.orderParents.flatMap((p) => p.orderKids)),
  )
    .split(', ')
    .map((r) => <div key={r}>{r}</div>);

  const families = deliverers
    .flatMap((d) => d.orderParents)
    .sort(
      (a, b) =>
        a.first_name.localeCompare(b.first_name) ||
        a.last_name.localeCompare(b.last_name),
    );

  return (
    <>
      <Button
        variant="contained"
        onClick={() => navigate(`/labels/${orderId}`)}
        style={{float: 'right'}}
      >
        Generate Labels
      </Button>
      <div>Date of Order: {date_of_order}</div>
      <div>Date of Pickup: {date_of_pickup}</div>
      <div>
        Notes: <pre>{notes}</pre>
      </div>
      <div>Totals: {totals}</div>

      <h3>Families:</h3>
      {makeParentTable(families)}

      <h3>Sorted by Deliverer:</h3>
      {deliverers.map((d) => (
        <Fragment key={d.id}>
          <h4>Deliverer: {d.name}</h4>
          {makeParentTable(d.orderParents)}
        </Fragment>
      ))}

      <Button color="error" sx={{mt: 4}} onClick={deleteOrder}>
        Delete Order
      </Button>
    </>
  );
};

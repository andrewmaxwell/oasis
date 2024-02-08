import {useEffect, useMemo, useState} from 'react';
import {OrderParent, OrderRecord} from '../../types.ts';
import {useNavigate, useParams} from 'react-router-dom';
import {
  deleteRecord,
  getOrderParents,
  getRecord,
  updateRecord,
} from '../../supabase.ts';
import {
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {consolidateOrderKids} from '../../utils/consolidateOrderKids.ts';
import {OasisForm} from '../OasisForm.tsx';
import {getDifference} from '../../utils/getDifference.ts';
import {orderFields} from './NewOrderPage/orderFields.ts';
import {groupBy} from '../../utils/groupBy.ts';

// Date of next diaper pickup day
// Who they will be picking up for (Name, address, phone, Size)
// When they can pick up
// Contact info of Selia for questions
// Invite to provide size feedback for next month

const generateEmails = (
  orderRecord: OrderRecord,
  orderParents: OrderParent[],
) => {
  const grouped = groupBy(orderParents, (p) => p.deliverer_email);

  for (const [email, orderParents] of Object.entries(grouped)) {
    const parentDetails = orderParents.map(
      (p) => `Name: ${p.parent_name}
Address: ${p.address}, ${p.city} ${p.zip}
Phone: ${p.phone_number}
Diapers: ${consolidateOrderKids(p.order_kids)}`,
    );

    const body = `Date of Next Pickup: ${orderRecord.date_of_pickup}

${parentDetails.join('\n\n')}

If you have questions, please contact Selia Buss at (952) 388-3057 or Brennan.seliabuss@gmail.com

Please provide feedback on diaper sizes for next month.

Thank you for your service!`;

    window.open(
      `mailto:${email}?subject=Oasis Diaper Ministry Delivery Details&body=${encodeURIComponent(body)}`,
      '_blank',
    );
  }
};

const ParentTable = ({orderParents}: {orderParents: OrderParent[]}) => (
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
        <TableRow key={p.parent_id}>
          <TableCell>{p.parent_name}</TableCell>
          <TableCell>{p.address}</TableCell>
          <TableCell>{p.city}</TableCell>
          <TableCell>{p.zip}</TableCell>
          <TableCell>{p.phone_number}</TableCell>
          <TableCell>{p.deliverer_name}</TableCell>
          <TableCell>{consolidateOrderKids(p.order_kids)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export const FinishedOrderPage = () => {
  const [orderRecord, setOrderRecord] = useState<OrderRecord>();
  const [orderParents, setOrderParents] = useState<OrderParent[]>();
  const {id: orderId} = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      getRecord('order_record', orderId).then(setOrderRecord);
      getOrderParents(orderId).then(setOrderParents);
    }
  }, [orderId]);

  const sortedByDeliverer = useMemo(
    () =>
      orderParents?.toSorted((a, b) =>
        a.deliverer_name.localeCompare(b.deliverer_name),
      ),
    [orderParents],
  );

  const deleteOrder = async () => {
    const msg = `Are you sure you want to delete this order? This cannot be undone.`;
    if (!orderId || !confirm(msg)) return;
    await deleteRecord('order_record', orderId);
    navigate(`/orders`);
  };

  const totals =
    orderParents &&
    consolidateOrderKids(orderParents.flatMap((p) => p.order_kids))
      .split(', ')
      .map((r) => <div key={r}>{r}</div>);

  return (
    <>
      <Grid item xs={12} sx={{display: 'flex', justifyContent: 'flex-end'}}>
        <Button
          variant="contained"
          onClick={() => navigate(`/labels/${orderId}`)}
          sx={{mr: 1}}
        >
          Generate Labels
        </Button>
        {orderRecord && orderParents && (
          <Button
            variant="contained"
            onClick={() => generateEmails(orderRecord, orderParents)}
          >
            Generate Deliverer Emails
          </Button>
        )}
      </Grid>

      {orderRecord && (
        <Paper sx={{p: 2, mt: 2}}>
          <Typography variant="h5" mb={2}>
            Order Info
          </Typography>

          <OasisForm
            origData={orderRecord}
            onSubmit={(formData) =>
              updateRecord(
                'order_record',
                orderRecord.id,
                getDifference(formData, orderRecord),
              )
            }
            fields={orderFields}
          />
        </Paper>
      )}

      <Paper sx={{p: 2, mt: 2}}>
        <Typography variant="h5">Totals</Typography>
        {totals}
      </Paper>

      {orderParents && (
        <Paper sx={{p: 2, mt: 2}}>
          <Typography variant="h5">Sorted By Family</Typography>
          <ParentTable orderParents={orderParents} />
        </Paper>
      )}

      {sortedByDeliverer && (
        <Paper sx={{p: 2, mt: 2}}>
          <Typography variant="h5">Sorted By Deliverer</Typography>
          <ParentTable orderParents={sortedByDeliverer} />
        </Paper>
      )}

      <Button color="error" sx={{mt: 4}} onClick={deleteOrder}>
        Delete Order
      </Button>
    </>
  );
};

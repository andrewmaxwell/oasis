import {OrderParentViewRow} from '../../../types.ts';
import {useNavigate, useParams} from 'react-router-dom';
import {softDelete, updateRecord} from '../../../supabase.ts';
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {consolidateOrderKids} from '../../../utils/consolidateOrderKids.ts';
import {OasisForm} from '../../OasisForm.tsx';
import {getDifference} from '../../../utils/getDifference.ts';
import {orderFields} from '../NewOrderPage/orderFields.ts';
import {generateEmails} from './generateEmails.ts';
import {useCanWrite} from '../../../hooks/useAccessLevel.ts';
import {useOrderRecordWithParents} from '../../../hooks/useOrderRecordWithParents.ts';

// Date of next diaper pickup day
// Who they will be picking up for (Name, address, phone, Size)
// When they can pick up
// Contact info of Selia for questions
// Invite to provide size feedback for next month

const ParentTable = ({orderParents}: {orderParents: OrderParentViewRow[]}) => (
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

const FinishedOrderPage = () => {
  const {id: orderId} = useParams();
  const {orderRecord, orderParents, sortedByDeliverer, groupedByZip} =
    useOrderRecordWithParents(orderId);
  const navigate = useNavigate();
  const canWrite = useCanWrite();

  if (!orderRecord || !orderParents || !sortedByDeliverer)
    return <CircularProgress />;

  const totals = consolidateOrderKids(orderParents.flatMap((p) => p.order_kids))
    .split(', ')
    .map((r) => <div key={r}>{r}</div>);

  const deleteOrder = async () => {
    const msg = `Are you sure you want to delete this order? This cannot be undone.`;
    if (!orderId || !confirm(msg)) return;
    await softDelete('order_record', orderId);
    navigate(`/orders`);
  };

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

        {canWrite && (
          <Button
            variant="contained"
            onClick={() => generateEmails(orderRecord, orderParents)}
          >
            Generate Deliverer Emails
          </Button>
        )}
      </Grid>

      <Paper sx={{p: 2, mt: 2}}>
        <Typography variant="h5" mb={2}>
          Order Info
        </Typography>

        <OasisForm
          origData={orderRecord}
          onSubmit={(formData) => {
            updateRecord(
              'order_record',
              orderRecord.id,
              getDifference(formData, orderRecord),
            );
          }}
          fields={orderFields}
          disabled={!canWrite}
        />
      </Paper>

      <Paper sx={{p: 2, mt: 2}}>
        <Typography variant="h5">Totals</Typography>
        {totals}
      </Paper>

      <Paper sx={{p: 2, mt: 2}}>
        <Typography variant="h5">Summary by Zip Code</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Zip</TableCell>
              <TableCell>Deliveries</TableCell>
              <TableCell>Kids</TableCell>
              <TableCell>Diapers</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupedByZip?.map((p) => (
              <TableRow key={p.zip}>
                <TableCell>{p.zip}</TableCell>
                <TableCell>{p.parents}</TableCell>
                <TableCell>{p.kids}</TableCell>
                <TableCell>{consolidateOrderKids(p.order_kids)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{p: 2, mt: 2}}>
        <Typography variant="h5">Sorted By Family</Typography>
        <ParentTable orderParents={orderParents} />
      </Paper>

      <Paper sx={{p: 2, mt: 2}}>
        <Typography variant="h5">Sorted By Deliverer</Typography>
        <ParentTable orderParents={sortedByDeliverer} />
      </Paper>

      {canWrite && (
        <Button color="error" sx={{mt: 4}} onClick={deleteOrder}>
          Delete Order
        </Button>
      )}
    </>
  );
};

export default FinishedOrderPage;

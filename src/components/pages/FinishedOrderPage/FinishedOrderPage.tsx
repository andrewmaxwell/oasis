import {OrderParentViewRow, OrderRecord} from '../../../types.ts';
import {useNavigate, useParams} from 'react-router-dom';
import {softDelete, updateRecord} from '../../../supabase.ts';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../../../queryClient.ts';
import {useToast} from '../../../hooks/useToast.ts';
import {useConfirm} from '../../../hooks/useConfirm.ts';
import {BlockSkeleton, ErrorState} from '../../PageStates.tsx';
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
import {consolidateOrderKids} from '../../../utils/consolidateOrderKids.ts';
import {OasisForm} from '../../OasisForm.tsx';
import {UseFormReset} from 'react-hook-form';
import {getDifference} from '../../../utils/getDifference.ts';
import {orderFields} from '../NewOrderPage/orderFields.ts';
import {generateEmails} from './generateEmails.ts';
import {useCanWrite} from '../../../hooks/useAccessLevel.ts';
import {useOrderRecordWithParents} from '../../../hooks/useOrderRecordWithParents.ts';
import {allowNextNavigation} from '../../../hooks/useUnsavedChangesPrompt.ts';

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
  const {
    orderRecord,
    orderParents,
    sortedByDeliverer,
    groupedByZip,
    error,
    refetch,
  } = useOrderRecordWithParents(orderId);
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  const showToast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const saveOrder = useMutation({
    mutationFn: ({
      formData,
    }: {
      formData: Partial<OrderRecord>;
      reset: UseFormReset<Partial<OrderRecord>>;
    }) => {
      // Only reachable from the form below, which renders after orderRecord has loaded.
      if (!orderRecord) throw new Error('The order has not finished loading');
      return updateRecord(
        'order_record',
        orderRecord.id,
        getDifference(formData, orderRecord),
      );
    },
    onSuccess: (_, {formData, reset}) => {
      // Clear the dirty state without a round-trip: what was saved is what's on screen.
      reset(formData);
      queryClient.invalidateQueries({
        queryKey: queryKeys.table('order_record'),
      });
      if (orderId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.record('order_record', orderId),
        });
      }
      showToast('Order saved');
    },
    onError: (e: Error) =>
      showToast(`Could not save this order: ${e.message}`, {severity: 'error'}),
  });

  const deleteOrder = useMutation({
    mutationFn: (id: string) => softDelete('order_record', id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.table('order_record'),
      });
      showToast('Order deleted');
      allowNextNavigation();
      navigate('/orders');
    },
    onError: (e: Error) =>
      showToast(`Could not delete this order: ${e.message}`, {
        severity: 'error',
      }),
  });

  const onDeleteClick = async () => {
    if (!orderId) return;
    const ok = await confirm({
      title: 'Delete this order?',
      message:
        'This order and its record of who received what will be removed from the app. An administrator can restore it.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) deleteOrder.mutate(orderId);
  };

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
        title="Could not load this order"
      />
    );
  }

  if (!orderRecord || !orderParents || !sortedByDeliverer) {
    return (
      <>
        <BlockSkeleton height={120} />
        <BlockSkeleton height={280} />
        <BlockSkeleton height={280} />
      </>
    );
  }

  const totals = consolidateOrderKids(orderParents.flatMap((p) => p.order_kids))
    .split(', ')
    .map((r) => <div key={r}>{r}</div>);

  return (
    <>
      <Grid container spacing={2} sx={{p: 2}}>
        <Grid size={12} sx={{display: 'flex', justifyContent: 'flex-end'}}>
          {canWrite && (
            <Button
              variant="contained"
              color="error"
              onClick={onDeleteClick}
              disabled={deleteOrder.isPending}
              sx={{mr: 2}}
            >
              Delete Order
            </Button>
          )}
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
              sx={{ml: 1}}
            >
              Generate Deliverer Emails
            </Button>
          )}
        </Grid>
      </Grid>

      <Paper sx={{p: 2, mt: 2}}>
        <Typography variant="h5" mb={2}>
          Order Info
        </Typography>

        <OasisForm
          origData={orderRecord}
          onSubmit={(formData, reset) => saveOrder.mutate({formData, reset})}
          fields={orderFields}
          disabled={!canWrite}
          submitting={saveOrder.isPending}
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
        <Button
          color="error"
          sx={{mt: 4}}
          onClick={onDeleteClick}
          disabled={deleteOrder.isPending}
        >
          Delete Order
        </Button>
      )}
    </>
  );
};

export default FinishedOrderPage;

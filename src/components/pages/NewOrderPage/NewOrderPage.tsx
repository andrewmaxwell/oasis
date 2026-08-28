import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {useData} from '../../../hooks/useData.ts';
import {useParentsWithAtLeastOneKid} from './useParentsWithAtLeastOneKid.ts';
import {
  calcDiaperSizes,
  getDiaperQuantity,
} from '../../../utils/calcDiaperSizes.ts';
import {getAllRecords, insertRecord} from '../../../supabase.ts';
import {Database, Deliverer, OrderRecord, Parent} from '../../../types.ts';
import {Link, useNavigate} from 'react-router-dom';
import {OasisForm} from '../../OasisForm.tsx';
import {orderFields} from './orderFields.ts';
import {useCanWrite} from '../../../hooks/useAccessLevel.ts';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../../../queryClient.ts';
import {useToast} from '../../../hooks/useToast.ts';
import {ErrorState} from '../../PageStates.tsx';
import {combineQueries} from '../../../hooks/combineQueries.ts';
import {allowNextNavigation} from '../../../hooks/useUnsavedChangesPrompt.ts';

const getDeliverers = async () =>
  ((await getAllRecords('deliverer')) as Deliverer[]).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

const finishOrder = async (
  formData: Partial<OrderRecord>,
  parents: Parent[] | undefined,
) => {
  if (!parents) throw new Error('The roster has not finished loading');

  const filteredParents = parents.filter(
    (p) => p.is_active && p.kid.some((k) => k.is_active),
  );

  // Checked before the order_record is created: an order with nobody in it is never what
  // the user meant, and creating it first would leave an empty order behind.
  if (!filteredParents.length) {
    throw new Error(
      'No active families with an active child were found, so there is nothing to order',
    );
  }

  const orderRecord = await insertRecord(
    'order_record',
    formData as unknown as Database['public']['Tables']['order_record']['Insert'],
  );
  const {id: orderId} = orderRecord;

  await Promise.all([
    insertRecord(
      'order_parent',
      filteredParents.map((p) => ({
        order_id: orderId,
        parent_id: p.id,
        deliverer_id: p.deliverer_id,
      })) as unknown as Database['public']['Tables']['order_parent']['Insert'][],
    ),
    insertRecord(
      'order_kid',
      filteredParents.flatMap((p) =>
        p.kid
          .filter((k) => k.is_active)
          .map((k) => ({
            order_id: orderId,
            kid_id: k.id,
            diaper_size: k.diaper_size,
            diaper_quantity: getDiaperQuantity(k.diaper_size),
          })),
      ) as unknown as Database['public']['Tables']['order_kid']['Insert'][],
    ),
  ]);

  return orderId;
};

/** Module-level so react-hook-form's `values` doesn't see a new object every render. */
const blankOrder = {};

const NewOrderPage = () => {
  const navigate = useNavigate();
  const parentsResult = useParentsWithAtLeastOneKid();
  const deliverersQuery = useData(queryKeys.table('deliverer'), getDeliverers);
  const {parents} = parentsResult;
  const {data: deliverers} = deliverersQuery;
  const {error, refetch} = combineQueries(parentsResult, deliverersQuery);
  const canWrite = useCanWrite();
  const showToast = useToast();
  const queryClient = useQueryClient();

  const createOrder = useMutation({
    mutationFn: (formData: Partial<OrderRecord>) =>
      finishOrder(formData, parents),
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.table('order_record'),
      });
      showToast('Order created');
      allowNextNavigation();
      navigate(`/order/${orderId}`);
    },
    onError: (e: Error) =>
      // The snapshot is three inserts and is not transactional (ISSUES #13), so a partial
      // failure can leave a half-built order — say so rather than failing silently.
      showToast(
        `Could not finish this order: ${e.message}. Check the Orders list before trying again.`,
        {severity: 'error'},
      ),
  });

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
        title="Could not load the roster"
      />
    );
  }

  return (
    <>
      <Typography sx={{mb: 2}}>
        Review the data on the <Link to="/parents">Parents & Kids</Link> and{' '}
        <Link to="/deliverers">Deliverers</Link> pages closely. When you save
        this order, the number of diapers in the specified sizes for all active
        children of active parents and deliverer assignments will be saved into
        this order.
      </Typography>

      {parents && (
        <Paper sx={{p: 2, mt: 2}}>
          <Typography variant="h5">Totals:</Typography>
          {calcDiaperSizes(parents)
            .split(', ')
            .map((r) => (
              <div key={r}>{r}</div>
            ))}
        </Paper>
      )}

      {parents && deliverers && (
        <Paper sx={{p: 2, mt: 2}}>
          <Typography variant="h5" sx={{mb: 2}}>
            Deliverer Assignment Summary
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Deliverer</TableCell>
                <TableCell>Diapers</TableCell>
                <TableCell>Families</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliverers
                // hide inactive deliverers who don't have any active families
                .filter(
                  (d) =>
                    d.is_active ||
                    parents.some((p) => p.is_active && p.deliverer_id === d.id),
                )
                .map((d) => {
                  const families = parents.filter(
                    (p) => p.is_active && p.deliverer_id === d.id,
                  );
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link to={`/deliverer/${d.id}`}>
                          {d.name + (d.is_active ? '' : ' (INACTIVE)')}
                        </Link>
                      </TableCell>
                      <TableCell>{calcDiaperSizes(families)}</TableCell>
                      <TableCell>{families.length}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Paper sx={{p: 2, mt: 2}}>
        <Typography variant="h5" sx={{mb: 2}}>
          Order Info
        </Typography>

        <OasisForm
          origData={blankOrder}
          onSubmit={(formData) => createOrder.mutate(formData)}
          fields={orderFields}
          disabled={!canWrite || !parents}
          submitting={createOrder.isPending}
        />
      </Paper>
    </>
  );
};

export default NewOrderPage;

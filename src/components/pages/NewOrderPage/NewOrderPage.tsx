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
import {Link, NavigateFunction, useNavigate} from 'react-router-dom';
import {OasisForm} from '../../OasisForm.tsx';
import {orderFields} from './orderFields.ts';
import {useCanWrite} from '../../../hooks/useAccessLevel.ts';

const getDeliverers = async () =>
  ((await getAllRecords('deliverer')) as Deliverer[]).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

const finishOrder = async (
  formData: Partial<OrderRecord>,
  parents: Parent[] | undefined,
  navigate: NavigateFunction,
) => {
  if (!parents) return;

  const orderRecord = await insertRecord(
    'order_record',
    formData as unknown as Database['public']['Tables']['order_record']['Insert'],
  );
  if (!orderRecord) return;
  const {id: orderId} = orderRecord;

  const filteredParents = parents.filter(
    (p) => p.is_active && p.kid.some((k) => k.is_active),
  );

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
      filteredParents?.flatMap((p) =>
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

  navigate(`/order/${orderId}`);
};

const NewOrderPage = () => {
  const navigate = useNavigate();
  const parents = useParentsWithAtLeastOneKid();
  const deliverers = useData(getDeliverers);
  const canWrite = useCanWrite();

  return (
    <>
      <Typography mb={2}>
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
          <Typography variant="h5" mb={2}>
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
              {deliverers.map((d) => {
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
        <Typography variant="h5" mb={2}>
          Order Info
        </Typography>

        <OasisForm
          origData={{}}
          onSubmit={(formData) => finishOrder(formData, parents, navigate)}
          fields={orderFields}
          disabled={!canWrite}
        />
      </Paper>
    </>
  );
};

export default NewOrderPage;

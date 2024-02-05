import {Paper, Typography} from '@mui/material';
import {useData} from '../../../utils/useData.ts';
import {OrderSetupTable} from './OrderSetupTable.tsx';
import {useParentsWithAtLeastOneKid} from './useParentsWithAtLeastOneKid.ts';
import {validateOrder} from './validateOrder.ts';
import {calcDiaperSizes, getDiaperQuantity} from './calcDiaperSizes.ts';
import {getAllRecords, insertRecord} from '../../../supabase.ts';
import {Deliverer, FormField, OrderRecord, Parent} from '../../../types.ts';
import {NavigateFunction, useNavigate} from 'react-router-dom';
import {OasisForm} from '../../OasisForm.tsx';

const orderFields: FormField<OrderRecord>[] = [
  {
    id: 'date_of_order',
    label: 'Date of Order',
    required: true,
    type: 'date',
    width: 6,
  },
  {
    id: 'date_of_pickup',
    label: 'Date of Pickup',
    required: true,
    type: 'date',
    width: 6,
  },
];

const getDeliverers = async () =>
  (await getAllRecords('deliverer')) as Deliverer[];

const finishOrder = async (
  formData: Partial<OrderRecord>,
  parents: Parent[] | undefined,
  navigate: NavigateFunction,
) => {
  if (!parents) return;

  const {id: orderId} = await insertRecord('order_record', formData);

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
      })),
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
      ),
    ),
  ]);

  navigate(`/oasis/order/${orderId}`);
};

export const NewOrderPage = () => {
  const navigate = useNavigate();
  const parents = useParentsWithAtLeastOneKid();
  const deliverers = useData(getDeliverers);

  const validationMessage = validateOrder(parents, deliverers);
  return (
    <>
      <OrderSetupTable parents={parents} />

      {parents && deliverers && (
        <Paper sx={{p: 2, mt: 2}}>
          <Typography variant="h5">Order Summary</Typography>
          {deliverers
            .filter((d) => d.is_active)
            .map((d) => {
              const families = parents.filter(
                (p) => p.is_active && p.deliverer_id === d.id,
              );
              return (
                <Typography key={d.id}>
                  <strong>{d.name}:</strong>
                  {` ${calcDiaperSizes(families)} (${families.length} ${families.length === 1 ? 'family' : 'families'})`}
                </Typography>
              );
            })}
          <Typography>
            <strong>Total:</strong> {calcDiaperSizes(parents)}
          </Typography>

          {validationMessage && (
            <Typography variant="h5" color="error">
              {validationMessage}
            </Typography>
          )}
        </Paper>
      )}

      <Paper sx={{p: 2, mt: 2}}>
        <Typography variant="h5" pb={2}>
          Order Info
        </Typography>

        <OasisForm
          origData={{}}
          onSubmit={(formData) => {
            finishOrder(formData, parents, navigate);
          }}
          fields={orderFields}
          disableSave={!!validationMessage}
        />
      </Paper>
    </>
  );
};

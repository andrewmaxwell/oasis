import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Switch,
  Typography,
} from '@mui/material';
import {Fragment, useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  deleteRecord,
  getParentsAndKids,
  getRecord,
  insertRecord,
  updateRecord,
} from '../../../supabase.ts';
import {FormField, OrderRecord, Parent, TableColumn} from '../../../types.ts';
import {getDifference} from '../../../utils/getDifference.ts';
import {OasisForm} from '../../OasisForm.tsx';
import {OasisTable} from '../../OasisTable.tsx';
import {DelivererSelect} from './DelivererSelect.tsx';
import {dateToAge} from '../../../utils/dateToAge.ts';

const getParentsWithAtLeastOneKid = async () =>
  (await getParentsAndKids()).filter((p) => p.kid.length > 0);

// const calcDiaperSizes = (parent: Parent) => {
//   const counts: {[key: string]: number} = {};
//   for (const {is_active, diaper_size} of parent.kid) {
//     if (!is_active) continue;
//     if (!counts[diaper_size]) counts[diaper_size] = 0;
//     counts[diaper_size] += diaper_size === 'N' || diaper_size === '1' ? 75 : 50;
//   }
//   return Object.entries(counts)
//     .map((p) => p.join(': '))
//     .sort(
//       (a, b) =>
//         Number(b[0] === 'N') - Number(a[0] === 'N') || a.localeCompare(b),
//     )
//     .join(', ');
// };

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

const parentColumns: TableColumn<Parent>[] = [
  {
    label: 'Name',
    render: (p: Parent, setState) => (
      <Grid container alignItems="center" justifyContent="center">
        <Grid item xs={12}>
          <Button component={Link} to={`/oasis/parent/${p.id}`}>
            {p.first_name} {p.last_name}
          </Button>
        </Grid>
        {p.is_active &&
          p.kid.map((k) => (
            <Fragment key={k.id}>
              <Grid item xs={6}>
                <Button component={Link} to={`/oasis/kid/${k.id}`}>
                  {k.first_name} {k.last_name}
                </Button>
              </Grid>
              <Grid item xs={2}>
                {dateToAge(k.birth_date)}
              </Grid>
              <Grid item xs={2}>
                Size {k.diaper_size}
              </Grid>
              <Grid item xs={2}>
                <Switch
                  defaultChecked={k.is_active}
                  onChange={(e) => {
                    updateRecord('kid', k.id, {is_active: e.target.checked});
                    setState?.((parents) =>
                      parents?.map((parent) =>
                        parent === p
                          ? {
                              ...p,
                              kid: parent.kid.map((kid) =>
                                kid === k
                                  ? {...k, is_active: e.target.checked}
                                  : kid,
                              ),
                            }
                          : parent,
                      ),
                    );
                  }}
                />
              </Grid>
            </Fragment>
          ))}
      </Grid>
    ),
  },
  // {
  //   label: 'Diapers',
  //   render: (p: Parent) => p.is_active && calcDiaperSizes(p),
  // },
  {
    label: 'Deliverer',
    render: (p: Parent, setState) =>
      p.is_active && (
        <DelivererSelect
          parent={p}
          onChange={(e) => {
            updateRecord('parent', p.id, {deliverer_id: e.target.value});
            setState?.((parents) =>
              parents?.map((p2) =>
                p === p2 ? {...p, deliverer_id: e.target.value} : p2,
              ),
            );
          }}
        />
      ),
  },
  {
    label: 'Active',
    render: (p: Parent, setState) => (
      <Switch
        defaultChecked={p.is_active}
        onChange={(e) => {
          updateRecord('parent', p.id, {is_active: e.target.checked});
          setState?.((parents) =>
            parents?.map((p2) =>
              p === p2 ? {...p, is_active: e.target.checked} : p2,
            ),
          );
        }}
      />
    ),
  },
];

export const OrderPage = () => {
  const [origData, setOrigData] = useState<Partial<OrderRecord> | undefined>();
  const {id} = useParams();

  useEffect(() => {
    if (id && id !== 'new') {
      getRecord('order_record', id).then(setOrigData);
    } else {
      setOrigData({is_completed: false});
    }
  }, [id]);

  const navigate = useNavigate();
  const [parents, setParents] = useState<Parent[]>();

  useEffect(() => {
    getParentsWithAtLeastOneKid().then(setParents);
  }, []);

  if (!origData) return <CircularProgress />;

  const onSubmit = async (formData: Partial<OrderRecord>) => {
    if (formData.id) {
      await updateRecord(
        'order_record',
        formData.id,
        getDifference(formData, origData),
      );
    } else {
      const {id} = await insertRecord('order_record', formData);
      navigate(`/oasis/order/${id}`, {replace: true});
    }
  };

  const deleteOrder = async () => {
    const msg = `Are you sure you want to delete this order? This cannot be undone.`;
    if (!origData.id || !confirm(msg)) return;
    await deleteRecord('order_record', origData.id);
    navigate(`/oasis/orders`);
  };

  return (
    <>
      <Paper sx={{p: 2}}>
        <Typography variant="h5" pb={2}>
          Order Info
        </Typography>

        <OasisForm
          origData={origData}
          onSubmit={onSubmit}
          fields={orderFields}
        />
      </Paper>

      {origData.id && (
        <Paper sx={{p: 2, mt: 2}}>
          <Typography variant="h5" pb={2}>
            Order Details
          </Typography>
          <OasisTable
            data={parents}
            columns={parentColumns}
            setState={setParents}
          />
        </Paper>
      )}

      {origData.id && (
        <Button color="error" sx={{mt: 4}} onClick={deleteOrder}>
          Delete Order
        </Button>
      )}
    </>
  );
};

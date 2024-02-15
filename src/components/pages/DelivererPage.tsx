import {Button, CircularProgress, Paper, Typography} from '@mui/material';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {softDelete, insertRecord, updateRecord} from '../../supabase.ts';
import {FormField, Deliverer, Parent} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';
import {OasisTable} from '../OasisTable.tsx';
import {linkButton, mapAnchor} from '../cellRenderers.tsx';
import {GridColDef} from '@mui/x-data-grid';
import {useCanWrite} from '../../hooks/useAccessLevel.ts';
import {useDelivererWithParents} from '../../hooks/useDelivererWithParents.ts';

const delivererFields: FormField<Deliverer>[] = [
  {id: 'name', label: 'Name', required: true, width: 6},
  {id: 'email', label: 'Email', required: true, width: 6},
  {id: 'phone_number', label: 'Phone Number', width: 3},
  {id: 'is_active', label: 'Active', type: 'switch', width: 3},
  {id: 'notes', label: 'Notes', width: 12, multiline: true},
];

const columns: GridColDef<Parent>[] = [
  {
    field: 'name',
    headerName: 'Name',
    valueGetter: ({row}) => `${row.first_name} ${row.last_name}`,
    renderCell: linkButton('parent'),
    width: 250,
  },
  {field: 'address', headerName: 'Address', width: 250, renderCell: mapAnchor},
  {field: 'city', headerName: 'City', width: 150},
  {field: 'zip', headerName: 'Zip', width: 100},
];

export const DelivererPage = () => {
  const {id} = useParams();
  const {deliverer, delivererParents} = useDelivererWithParents(id);
  const canWrite = useCanWrite();

  const navigate = useNavigate();

  if (!deliverer) return <CircularProgress />;

  const onSubmit = async (formData: Partial<Deliverer>) => {
    if (formData.id) {
      await updateRecord(
        'deliverer',
        formData.id,
        getDifference(formData, deliverer),
      );
    } else {
      await insertRecord('deliverer', formData);
    }
    navigate(`/deliverers`, {replace: true});
  };

  const deleteDeliverer = async () => {
    const msg = `Are you sure you want to delete ${deliverer.name}? This cannot be undone.`;
    if (!deliverer.id || !confirm(msg)) return;
    await softDelete('deliverer', deliverer.id);
    navigate(`/deliverers`);
  };

  return (
    <>
      <Button component={Link} to={'/deliverers'} sx={{mb: 1}}>
        Back to Deliverers
      </Button>

      <Paper sx={{p: 2, mb: 2}}>
        <Typography variant="h5" pb={2}>
          Deliverer Info
        </Typography>
        <OasisForm
          origData={deliverer}
          onSubmit={onSubmit}
          fields={delivererFields}
          disabled={!canWrite}
        />
      </Paper>

      {delivererParents?.length ? (
        <OasisTable
          label="Assigned To Parent"
          data={delivererParents}
          columns={columns}
        />
      ) : deliverer.id ? (
        <Typography>No families assigned for delivery</Typography>
      ) : null}

      {canWrite && deliverer.id && (
        <Button color="error" sx={{mt: 2}} onClick={deleteDeliverer}>
          Delete {deliverer.name}
        </Button>
      )}
    </>
  );
};

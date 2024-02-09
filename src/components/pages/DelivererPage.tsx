import {Button, CircularProgress, Paper, Typography} from '@mui/material';
import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  deleteRecord,
  getDelivererParents,
  getRecord,
  insertRecord,
  updateRecord,
} from '../../supabase.ts';
import {FormField, Deliverer, Parent} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';
import {OasisTable} from '../OasisTable.tsx';
import {linkButton, mapAnchor} from '../cellRenderers.tsx';
import {GridColDef} from '@mui/x-data-grid';

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
  const [origData, setOrigData] = useState<Partial<Deliverer> | undefined>();
  const [delivererParents, setDelivererParents] = useState<
    Parent[] | undefined
  >();
  const {id} = useParams();

  useEffect(() => {
    if (id && id !== 'new') {
      getRecord('deliverer', id).then(setOrigData);
      getDelivererParents(id).then(setDelivererParents);
    } else {
      setOrigData({is_active: true});
    }
  }, [id]);

  const navigate = useNavigate();

  if (!origData) return <CircularProgress />;

  const onSubmit = async (formData: Partial<Deliverer>) => {
    if (formData.id) {
      await updateRecord(
        'deliverer',
        formData.id,
        getDifference(formData, origData),
      );
    } else {
      await insertRecord('deliverer', formData);
    }
    navigate(`/deliverers`, {replace: true});
  };

  const deleteDeliverer = async () => {
    const msg = `Are you sure you want to delete ${origData.name}? This cannot be undone.`;
    if (!origData.id || !confirm(msg)) return;
    await deleteRecord('deliverer', origData.id);
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
          origData={origData}
          onSubmit={onSubmit}
          fields={delivererFields}
        />
      </Paper>

      {delivererParents?.length ? (
        <OasisTable
          label="Assigned To Parent"
          data={delivererParents}
          columns={columns}
        />
      ) : (
        <Typography>No families assigned for delivery</Typography>
      )}

      {origData.id && (
        <Button color="error" sx={{mt: 2}} onClick={deleteDeliverer}>
          Delete {origData.name}
        </Button>
      )}
    </>
  );
};

import {Button, CircularProgress, Paper, Typography} from '@mui/material';
import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
  deleteRecord,
  getRecord,
  insertRecord,
  updateRecord,
} from '../../supabase.ts';
import {FormField, Deliverer} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';

const delivererFields: FormField<Deliverer>[] = [
  {id: 'name', label: 'Name', required: true, width: 6},
  {id: 'email', label: 'Email', required: true, width: 6},
  {
    id: 'phone_number',
    label: 'Phone Number',
    required: true,
    width: 3,
  },
  {id: 'is_active', label: 'Active', type: 'switch', width: 3},
];

export const DelivererPage = () => {
  const [origData, setOrigData] = useState<Partial<Deliverer> | undefined>();
  const {id} = useParams();

  useEffect(() => {
    if (id && id !== 'new') {
      getRecord('deliverer', id).then(setOrigData);
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
    navigate(`/oasis/deliverers`, {replace: true});
  };

  const deleteDeliverer = async () => {
    const msg = `Are you sure you want to delete ${origData.name}? This cannot be undone.`;
    if (!origData.id || !confirm(msg)) return;
    await deleteRecord('deliverer', origData.id);
    navigate(`/oasis/deliverers`);
  };

  return (
    <>
      <Paper sx={{p: 2}}>
        <Typography variant="h5" pb={2}>
          Deliverer Info
        </Typography>
        <OasisForm
          origData={origData}
          onSubmit={onSubmit}
          fields={delivererFields}
        />
      </Paper>

      {origData.id && (
        <Button color="error" sx={{mt: 4}} onClick={deleteDeliverer}>
          Delete {origData.name}
        </Button>
      )}
    </>
  );
};

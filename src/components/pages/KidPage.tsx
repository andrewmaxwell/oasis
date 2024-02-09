import {Button, CircularProgress, Paper, Typography} from '@mui/material';
import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {
  deleteRecord,
  getAllRecords,
  getRecord,
  insertRecord,
  updateRecord,
} from '../../supabase.ts';
import {FormField, Kid} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';

const kidFields: FormField<Kid>[] = [
  {id: 'first_name', label: 'First Name', required: true, width: 4},
  {id: 'last_name', label: 'Last Name', required: true, width: 4},
  {
    id: 'parent_id',
    label: 'Parent',
    required: true,
    width: 4,
    type: 'select',
    options: async () =>
      (await getAllRecords('parent'))!.map((p) => ({
        value: p.id,
        label: `${p.first_name} ${p.last_name}`,
      })),
  },
  {
    id: 'gender',
    label: 'Gender',
    required: true,
    width: 3,
    type: 'select',
    options: [
      {value: 'M', label: 'M'},
      {value: 'F', label: 'F'},
    ],
  },
  {
    id: 'birth_date',
    label: 'Birth Date',
    required: true,
    width: 3,
    type: 'date',
  },
  {
    id: 'diaper_size',
    label: 'Diaper Size',
    required: true,
    width: 3,
    type: 'select',
    options: 'N1234567'.split('').map((s) => ({label: s, value: s})),
  },
  {id: 'is_active', label: 'Active', type: 'switch', width: 3},
  {id: 'notes', label: 'Notes', width: 12, multiline: true},
];

export const KidPage = () => {
  const [origData, setOrigData] = useState<Partial<Kid> | undefined>();
  const {id} = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (id && id !== 'new') {
      getRecord('kid', id).then(setOrigData);
    } else {
      setOrigData({
        is_active: true,
        diaper_size: '',
        parent_id: searchParams.get('parent_id') ?? undefined,
        last_name: searchParams.get('last_name') ?? undefined,
      });
    }
  }, [id, searchParams]);

  const navigate = useNavigate();

  if (!origData) return <CircularProgress />;

  const onSubmit = async (formData: Partial<Kid>) => {
    if (formData.id) {
      await updateRecord('kid', formData.id, getDifference(formData, origData));
    } else {
      await insertRecord('kid', formData);
    }
    navigate(`/parent/${formData.parent_id}`, {replace: true});
  };

  const deleteKid = async () => {
    const msg = `Are you sure you want to delete ${origData.first_name} ${origData.last_name}? This cannot be undone.`;
    if (!origData.id || !confirm(msg)) return;
    await deleteRecord('kid', origData.id);
    navigate(`/parent/${origData.parent_id}`);
  };

  return (
    <>
      <Button
        component={Link}
        to={`/parent/${origData.parent_id}`}
        sx={{mb: 1}}
      >
        Back to Parent
      </Button>
      <Paper sx={{p: 2}}>
        <Typography variant="h5" pb={2}>
          Kid Info
        </Typography>
        <OasisForm origData={origData} onSubmit={onSubmit} fields={kidFields} />
      </Paper>

      {origData.id && (
        <Button color="error" sx={{mt: 4}} onClick={deleteKid}>
          Delete {origData.first_name} {origData.last_name}
        </Button>
      )}
    </>
  );
};

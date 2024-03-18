import {Button, CircularProgress, Paper, Typography} from '@mui/material';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  softDelete,
  getView,
  insertRecord,
  updateRecord,
} from '../../supabase.ts';
import {FormField, Kid, Option} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';
import {useCanWrite} from '../../hooks/useAccessLevel.ts';
import {useKid} from '../../hooks/useKid.ts';

const kidFields: FormField<Kid>[] = [
  {id: 'first_name', label: 'First Name', required: true, width: 4},
  {id: 'last_name', label: 'Last Name', required: true, width: 4},
  {
    id: 'parent_id',
    label: 'Parent',
    required: true,
    width: 4,
    type: 'select',
    options: async () => (await getView('parent_options')) as Option[],
  },
  {
    id: 'gender',
    label: 'Gender',
    width: 3,
    type: 'select',
    options: [
      {value: 'M', label: 'M'},
      {value: 'F', label: 'F'},
    ],
  },
  {id: 'birth_date', label: 'Birth Date', width: 3, type: 'date'},
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

const KidPage = () => {
  const {id} = useParams();
  const kid = useKid(id);
  const canWrite = useCanWrite();

  const navigate = useNavigate();

  if (!kid) return <CircularProgress />;

  const onSubmit = async (formData: Partial<Kid>) => {
    if (!formData.birth_date) {
      formData.birth_date = null; // birth date can't be ''
    }
    const success = formData.id
      ? await updateRecord('kid', formData.id, getDifference(formData, kid))
      : await insertRecord('kid', formData);

    if (success) {
      navigate(`/parent/${formData.parent_id}`, {replace: true});
    }
  };

  const deleteKid = async () => {
    const msg = `Are you sure you want to delete ${kid.first_name} ${kid.last_name}? This cannot be undone.`;
    if (!id || !confirm(msg)) return;
    await softDelete('kid', id);
    navigate(`/parent/${kid.parent_id}`);
  };

  return (
    <>
      {id && (
        <Button component={Link} to={`/parent/${kid.parent_id}`} sx={{mb: 1}}>
          Back to Parent
        </Button>
      )}

      <Paper sx={{p: 2}}>
        <Typography variant="h5" pb={2}>
          Kid Info
        </Typography>
        <OasisForm
          origData={kid}
          onSubmit={onSubmit}
          fields={kidFields}
          disabled={!canWrite}
        />
      </Paper>

      {canWrite && id && (
        <Button color="error" sx={{mt: 4}} onClick={deleteKid}>
          Delete {kid.first_name} {kid.last_name}
        </Button>
      )}
    </>
  );
};

export default KidPage;

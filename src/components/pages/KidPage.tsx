import {Button, CircularProgress, Paper, Typography} from '@mui/material';
import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {
  deleteRecord,
  getRecord,
  getView,
  insertRecord,
  updateRecord,
} from '../../supabase.ts';
import {FormField, Kid, Option} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';
import {useCanWrite} from '../../utils/useAccessLevel.ts';

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

export const KidPage = () => {
  const [origData, setOrigData] = useState<Partial<Kid> | undefined>();
  const {id} = useParams();
  const [searchParams] = useSearchParams();
  const canWrite = useCanWrite();

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
    if (!formData.birth_date) {
      formData.birth_date = null; // birth date can't be ''
    }
    const success = formData.id
      ? await updateRecord(
          'kid',
          formData.id,
          getDifference(formData, origData),
        )
      : await insertRecord('kid', formData);

    if (success) {
      navigate(`/parent/${formData.parent_id}`, {replace: true});
    }
  };

  const deleteKid = async () => {
    const msg = `Are you sure you want to delete ${origData.first_name} ${origData.last_name}? This cannot be undone.`;
    if (!origData.id || !confirm(msg)) return;
    await deleteRecord('kid', origData.id);
    navigate(`/parent/${origData.parent_id}`);
  };

  return (
    <>
      {origData.id && (
        <Button
          component={Link}
          to={`/parent/${origData.parent_id}`}
          sx={{mb: 1}}
        >
          Back to Parent
        </Button>
      )}

      <Paper sx={{p: 2}}>
        <Typography variant="h5" pb={2}>
          Kid Info
        </Typography>
        <OasisForm
          origData={origData}
          onSubmit={onSubmit}
          fields={kidFields}
          disabled={!canWrite}
        />
      </Paper>

      {canWrite && origData.id && (
        <Button color="error" sx={{mt: 4}} onClick={deleteKid}>
          Delete {origData.first_name} {origData.last_name}
        </Button>
      )}
    </>
  );
};

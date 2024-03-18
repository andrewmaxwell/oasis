import {Button, CircularProgress, Paper, Typography} from '@mui/material';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  softDelete,
  getRecord,
  insertRecord,
  updateRecord,
} from '../../supabase.ts';
import {FormField, Kid, Parent} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';
import {UseFormReset} from 'react-hook-form';
import {OasisTable} from '../OasisTable.tsx';
import {getDelivererOptions} from '../../utils/getDelivererOptions.ts';
import {GridColDef} from '@mui/x-data-grid';
import {birthDate, bool, linkButton} from '../cellRenderers.tsx';
import {useCanWrite} from '../../hooks/useAccessLevel.ts';
import {useParent} from '../../hooks/useParent.ts';

const parentFields: FormField<Parent>[] = [
  {id: 'first_name', label: 'First Name', required: true, width: 4},
  {id: 'last_name', label: 'Last Name', required: true, width: 4},
  {id: 'phone_number', label: 'Phone Number', required: true, width: 4},
  {id: 'address', label: 'Address', required: true, width: 6},
  {id: 'city', label: 'City', required: true, width: 3},
  {id: 'zip', label: 'Zip Code', required: true, width: 3},
  {
    id: 'country_of_origin',
    label: 'Country of Origin',
    width: 3,
  },
  {
    id: 'rough_family_income',
    label: 'Rough Family Income',
    type: 'number',
    width: 2,
  },
  {
    id: 'deliverer_id',
    label: 'Planned Deliverer',
    type: 'select',
    options: getDelivererOptions,
    required: true,
    width: 4,
  },
  {id: 'is_active', label: 'Active', type: 'switch', width: 3},
  {id: 'notes', label: 'Notes', width: 12, multiline: true},
];

const kidColumns: GridColDef<Kid>[] = [
  {
    field: 'name',
    headerName: 'Name',
    renderCell: linkButton('kid'),
    valueGetter: ({row}) => `${row.first_name} ${row.last_name}`,
    width: 250,
  },
  {
    field: 'birth_date',
    headerName: 'Birth Date',
    width: 150,
    renderCell: birthDate,
  },
  {field: 'diaper_size', headerName: 'Diaper Size', width: 100},
  {field: 'is_active', headerName: 'Active', renderCell: bool, width: 100},
];

const ParentPage = () => {
  const {id} = useParams();
  const parentData = useParent(id);
  const canWrite = useCanWrite();

  const navigate = useNavigate();

  if (!parentData) return <CircularProgress />;

  const onSubmit = async (
    formData: Partial<Parent>,
    reset: UseFormReset<Partial<Parent>>,
  ) => {
    if (!formData.rough_family_income) {
      formData.rough_family_income = null; // value can't be ''
    }
    if (formData.id) {
      await updateRecord('parent', formData.id, {
        ...getDifference(formData, parentData),
        kid: undefined,
      });
      reset(await getRecord('parent', formData.id));
    } else {
      const {id} = await insertRecord('parent', formData);
      navigate(`/parent/${id}`, {replace: true});
    }
  };

  const deleteParent = async () => {
    const msg = `Are you sure you want to delete ${parentData.first_name} ${parentData.last_name} and their kids forever? This cannot be undone.`;
    if (!parentData.id || !confirm(msg)) return;
    await softDelete('parent', parentData.id);
    navigate('/parents');
  };

  return (
    <>
      <Button component={Link} to={'/parents'} sx={{mb: 1}}>
        Back to Parents
      </Button>

      <Paper sx={{p: 2}}>
        <Typography variant="h5" pb={2}>
          Parent Info
        </Typography>
        <OasisForm
          origData={parentData}
          onSubmit={onSubmit}
          fields={parentFields}
          disabled={!canWrite}
        />
      </Paper>

      {parentData.kid && (
        <OasisTable
          data={parentData.kid}
          label="Kid"
          columns={kidColumns}
          newItemUrl={`/kid/new?parent_id=${parentData.id}&last_name=${parentData.last_name}`}
        />
      )}

      {canWrite && parentData.id && (
        <Button color="error" sx={{mt: 4}} onClick={deleteParent}>
          Delete {parentData.first_name} {parentData.last_name}
        </Button>
      )}
    </>
  );
};

export default ParentPage;

import {Button, CircularProgress, Paper, Typography} from '@mui/material';
import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  deleteRecord,
  getKidsForParent,
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
    required: true,
    width: 3,
  },
  {
    id: 'rough_family_income',
    label: 'Rough Family Income',
    required: true,
    type: 'number',
    width: 2,
  },
  {
    id: 'deliverer_id',
    label: 'Planned Deliverer',
    type: 'select',
    options: getDelivererOptions,
    width: 4,
  },
  {id: 'is_active', label: 'Active', type: 'switch', width: 3},
];

const kidColumns = [
  {
    label: 'Name',
    render: (k: Kid) => (
      <Button component={Link} to={`/oasis/kid/${k.id}`}>
        {k.first_name} {k.last_name}
      </Button>
    ),
  },
  {label: 'Birth Date', render: (k: Kid) => k.birth_date},
  {label: 'Diaper Size', render: (k: Kid) => k.diaper_size},
  {label: 'Active', render: (k: Kid) => (k.is_active ? 'Y' : 'N')},
];

const kidFieldsToSearch: (keyof Kid)[] = ['first_name', 'last_name'];

const getParent = async (parentId: string) => {
  const [parent, kid] = await Promise.all([
    getRecord('parent', parentId) as Promise<Parent>,
    getKidsForParent(parentId),
  ]);

  parent.kid = kid;
  return parent;
};

export const ParentPage = () => {
  const [parentData, setParentData] = useState<Partial<Parent> | undefined>();
  const {id} = useParams();

  useEffect(() => {
    if (id && id !== 'new') {
      getParent(id).then(setParentData);
    } else {
      setParentData({is_active: true});
    }
  }, [id]);

  const navigate = useNavigate();

  if (!parentData) return <CircularProgress />;

  const onSubmit = async (
    formData: Partial<Parent>,
    reset: UseFormReset<Partial<Parent>>,
  ) => {
    if (formData.id) {
      await updateRecord('parent', formData.id, {
        ...getDifference(formData, parentData),
        kid: undefined,
      });
      reset(await getRecord('parent', formData.id));
    } else {
      const {id} = await insertRecord('parent', formData);
      navigate(`/oasis/parent/${id}`, {replace: true});
    }
  };

  const deleteParent = async () => {
    const msg = `Are you sure you want to delete ${parentData.first_name} ${parentData.last_name} and their kids forever? This cannot be undone.`;
    if (!parentData.id || !confirm(msg)) return;
    await deleteRecord('parent', parentData.id);
    navigate('/oasis/parents');
  };

  return (
    <>
      <Paper sx={{p: 2}}>
        <Typography variant="h5" pb={2}>
          Parent Info
        </Typography>
        <OasisForm
          origData={parentData}
          onSubmit={onSubmit}
          fields={parentFields}
        />
      </Paper>

      {parentData.kid && (
        <OasisTable
          data={parentData.kid}
          label="Kid"
          columns={kidColumns}
          fieldsToSearch={kidFieldsToSearch}
          newItemUrl={`/oasis/kid/new?parentId=${parentData.id}&last_name=${parentData.last_name}`}
        />
      )}

      <Button color="error" sx={{mt: 4}} onClick={deleteParent}>
        Delete {parentData.first_name} {parentData.last_name}
      </Button>
    </>
  );
};

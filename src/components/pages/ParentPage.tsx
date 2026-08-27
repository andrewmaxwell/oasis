import {Button, Paper, Typography} from '@mui/material';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {softDelete, insertRecord, updateRecord} from '../../supabase.ts';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../../queryClient.ts';
import {useToast} from '../../hooks/useToast.ts';
import {useConfirm} from '../../hooks/useConfirm.ts';
import {ErrorState, FormSkeleton} from '../PageStates.tsx';
import {Database, FormField, Kid, Parent, ParentOrderRow} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';
import {UseFormReset} from 'react-hook-form';
import {OasisTable} from '../OasisTable.tsx';
import {delivererOptions} from '../../utils/delivererOptions.ts';
import {GridColDef} from '@mui/x-data-grid';
import {birthDate, bool, linkButton} from '../cellRenderers.tsx';
import {useCanWrite} from '../../hooks/useAccessLevel.ts';
import {useParent} from '../../hooks/useParent.ts';
import {consolidateOrderKids} from '../../utils/consolidateOrderKids.ts';

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
    options: delivererOptions,
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
    valueGetter: (_, row) => `${row.first_name} ${row.last_name}`,
    width: 250,
  },
  {
    field: 'birth_date',
    headerName: 'Birth Date',
    width: 150,
    renderCell: birthDate,
  },
  {field: 'diaper_size', headerName: 'Diaper Size', width: 100},
  {field: 'is_active', headerName: 'Active', renderCell: bool, width: 90},
];

const parentOrderColumns: GridColDef<ParentOrderRow>[] = [
  {
    field: 'date_of_order',
    headerName: 'Order Date',
    renderCell: linkButton('order', 'id'),
    width: 150,
  },
  {
    field: 'deliverer_name',
    headerName: 'Deliverer',
    renderCell: linkButton('deliverer', 'deliverer_id'),
    width: 150,
  },
  {field: 'order_notes', headerName: 'Order Notes', width: 400},
  {
    field: 'diaper_sizes',
    headerName: 'Quantities',
    valueGetter: (_, row) => consolidateOrderKids(row.order_kids),
    width: 400,
  },
];

const ParentPage = () => {
  const {id} = useParams();
  const {parent, parentOrders, error, refetch} = useParent(id);
  const canWrite = useCanWrite();
  const showToast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const saveParent = useMutation({
    mutationFn: async ({
      formData,
    }: {
      formData: Partial<Parent>;
      reset: UseFormReset<Partial<Parent>>;
    }) => {
      if (!formData.rough_family_income) {
        formData.rough_family_income = null; // value can't be ''
      }
      if (formData.id) {
        await updateRecord('parent', formData.id, {
          ...getDifference(formData, parent ?? {}),
          kid: undefined,
        });
        return {id: formData.id, isNew: false};
      }
      const newParent = await insertRecord(
        'parent',
        formData as unknown as Database['public']['Tables']['parent']['Insert'],
      );
      return {id: newParent.id, isNew: true};
    },
    onSuccess: ({id: parentId, isNew}, {formData, reset}) => {
      // Clear the dirty state without a second round-trip: the values just saved are the
      // values on the server.
      reset(formData);
      queryClient.invalidateQueries({queryKey: queryKeys.view('parent_view')});
      queryClient.invalidateQueries({
        queryKey: queryKeys.record('parent', parentId),
      });
      queryClient.invalidateQueries({queryKey: queryKeys.count('parent')});
      showToast('Family saved');
      if (isNew) navigate(`/parent/${parentId}`, {replace: true});
    },
    onError: (e: Error) =>
      showToast(`Could not save this family: ${e.message}`, {
        severity: 'error',
      }),
  });

  const deleteParent = useMutation({
    mutationFn: (parentId: string) => softDelete('parent', parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.view('parent_view')});
      queryClient.invalidateQueries({queryKey: queryKeys.count('parent')});
      showToast('Family deleted');
      navigate('/parents');
    },
    onError: (e: Error) =>
      showToast(`Could not delete this family: ${e.message}`, {
        severity: 'error',
      }),
  });

  const onDeleteClick = async () => {
    if (!parent?.id) return;
    const ok = await confirm({
      title: 'Delete this family?',
      // Not "cannot be undone": softDelete only flips a flag (ISSUES #28).
      message: `${parent.first_name} ${parent.last_name} and their kids will be removed from the app. Past orders keep their own copy of the data, and an administrator can restore the record.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) deleteParent.mutate(parent.id);
  };

  if (error) {
    return (
      <>
        <Button component={Link} to={'/parents'} sx={{mb: 1}}>
          Back to Parents
        </Button>
        <ErrorState
          error={error}
          onRetry={refetch}
          title="Could not load this family"
        />
      </>
    );
  }

  if (!parent) return <FormSkeleton rows={4} />;

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
          origData={parent}
          onSubmit={(formData, reset) => saveParent.mutate({formData, reset})}
          fields={parentFields}
          disabled={!canWrite}
          submitting={saveParent.isPending}
        />
      </Paper>

      {parent.kid && (
        <OasisTable
          data={parent.kid}
          label="Kid"
          columns={kidColumns}
          emptyMessage="No kids on this family yet."
          newItemUrl={`/kid/new?parent_id=${parent.id}&last_name=${parent.last_name}`}
        />
      )}

      {parentOrders && (
        <OasisTable
          data={parentOrders}
          label="Past Order"
          columns={parentOrderColumns}
          emptyMessage="This family hasn't been in an order yet."
        />
      )}

      {canWrite && parent.id && (
        <Button
          color="error"
          sx={{mt: 4}}
          onClick={onDeleteClick}
          disabled={deleteParent.isPending}
        >
          Delete {parent.first_name} {parent.last_name}
        </Button>
      )}
    </>
  );
};

export default ParentPage;

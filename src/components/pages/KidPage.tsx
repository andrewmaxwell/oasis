import {Button, Paper, Typography} from '@mui/material';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  softDelete,
  getView,
  insertRecord,
  updateRecord,
} from '../../supabase.ts';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../../queryClient.ts';
import {useToast} from '../../hooks/useToast.ts';
import {useConfirm} from '../../hooks/useConfirm.ts';
import {ErrorState, FormSkeleton} from '../PageStates.tsx';
import {
  Database,
  DIAPER_SIZES,
  FormField,
  Kid,
  KidOrderRow,
  Option,
  OptionSource,
} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';
import {useCanWrite} from '../../hooks/useAccessLevel.ts';
import {useKid} from '../../hooks/useKid.ts';
import {OasisTable} from '../OasisTable.tsx';
import {GridColDef} from '@mui/x-data-grid';
import {linkButton} from '../cellRenderers.tsx';

const parentOptions: OptionSource = {
  key: 'parent_options',
  load: async () => (await getView('parent_options')) as Option[],
};

const kidFields: FormField<Kid>[] = [
  {id: 'first_name', label: 'First Name', required: true, width: 4},
  {id: 'last_name', label: 'Last Name', required: true, width: 4},
  {
    id: 'parent_id',
    label: 'Parent',
    required: true,
    width: 4,
    type: 'select',
    options: parentOptions,
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
    options: DIAPER_SIZES.map((s) => ({label: s, value: s})),
  },
  {id: 'is_active', label: 'Active', type: 'switch', width: 3},
  {id: 'notes', label: 'Notes', width: 12, multiline: true},
];

const kidOrderColumns: GridColDef<KidOrderRow>[] = [
  {
    field: 'date_of_order',
    headerName: 'Order Date',
    renderCell: linkButton('order', 'id'),
    width: 150,
  },
  {field: 'diaper_size', headerName: 'Size', width: 100},
  {field: 'diaper_quantity', headerName: 'Quantity', width: 100},
  {field: 'order_notes', headerName: 'Order Notes', width: 400},
];

const KidPage = () => {
  const {id} = useParams();
  const {kid, kidOrders, error, refetch} = useKid(id);
  const canWrite = useCanWrite();
  const showToast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const invalidateKid = (parentId?: string) => {
    queryClient.invalidateQueries({queryKey: queryKeys.view('kid_view')});
    queryClient.invalidateQueries({queryKey: queryKeys.count('kid')});
    if (parentId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.record('parent', parentId),
      });
    }
    if (id && id !== 'new') {
      queryClient.invalidateQueries({queryKey: queryKeys.record('kid', id)});
    }
  };

  const saveKid = useMutation({
    mutationFn: async (formData: Partial<Kid>) => {
      if (!formData.birth_date) {
        formData.birth_date = null; // birth date can't be ''
      }
      if (formData.id) {
        await updateRecord(
          'kid',
          formData.id,
          getDifference(formData, kid ?? {}),
        );
      } else {
        await insertRecord(
          'kid',
          formData as unknown as Database['public']['Tables']['kid']['Insert'],
        );
      }
      return formData.parent_id;
    },
    onSuccess: (parentId) => {
      invalidateKid(parentId);
      showToast('Child saved');
      navigate(`/parent/${parentId}`, {replace: true});
    },
    onError: (e: Error) =>
      showToast(`Could not save this child: ${e.message}`, {severity: 'error'}),
  });

  const deleteKid = useMutation({
    mutationFn: (kidId: string) => softDelete('kid', kidId),
    onSuccess: () => {
      invalidateKid(kid?.parent_id);
      showToast('Child deleted');
      navigate(`/parent/${kid?.parent_id}`);
    },
    onError: (e: Error) =>
      showToast(`Could not delete this child: ${e.message}`, {
        severity: 'error',
      }),
  });

  const onDeleteClick = async () => {
    if (!id || id === 'new') return;
    const ok = await confirm({
      title: 'Delete this child?',
      message: `${kid?.first_name} ${kid?.last_name} will be removed from the app and from future orders. Past orders keep their own copy, and an administrator can restore the record.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) deleteKid.mutate(id);
  };

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
        title="Could not load this child"
      />
    );
  }

  if (!kid) return <FormSkeleton rows={3} />;

  return (
    <>
      {kid.parent_id && (
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
          onSubmit={(formData) => saveKid.mutate(formData)}
          fields={kidFields}
          disabled={!canWrite}
          submitting={saveKid.isPending}
        />
      </Paper>

      {kidOrders && (
        <OasisTable
          data={kidOrders}
          label="Past Order"
          columns={kidOrderColumns}
          emptyMessage="This child hasn't been in an order yet."
        />
      )}

      {canWrite && id && id !== 'new' && (
        <Button
          color="error"
          sx={{mt: 4}}
          onClick={onDeleteClick}
          disabled={deleteKid.isPending}
        >
          Delete {kid.first_name} {kid.last_name}
        </Button>
      )}
    </>
  );
};

export default KidPage;

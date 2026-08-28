import {Button, Paper, Typography} from '@mui/material';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {softDelete, insertRecord, updateRecord} from '../../supabase.ts';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../../queryClient.ts';
import {useToast} from '../../hooks/useToast.ts';
import {useConfirm} from '../../hooks/useConfirm.ts';
import {ErrorState, FormSkeleton} from '../PageStates.tsx';
import {Database, FormField, Deliverer, Parent} from '../../types.ts';
import {getDifference} from '../../utils/getDifference.ts';
import {OasisForm} from '../OasisForm.tsx';
import {OasisTable} from '../OasisTable.tsx';
import {linkButton, mapAnchor} from '../cellRenderers.tsx';
import {GridColDef} from '@mui/x-data-grid';
import {useCanWrite} from '../../hooks/useAccessLevel.ts';
import {useDelivererWithParents} from '../../hooks/useDelivererWithParents.ts';
import {allowNextNavigation} from '../../hooks/useUnsavedChangesPrompt.ts';

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
    valueGetter: (_, row) => `${row.first_name} ${row.last_name}`,
    renderCell: linkButton('parent'),
    width: 250,
  },
  {field: 'address', headerName: 'Address', width: 250, renderCell: mapAnchor},
  {field: 'city', headerName: 'City', width: 150},
  {field: 'zip', headerName: 'Zip', width: 100},
];

const DelivererPage = () => {
  const {id} = useParams();
  const {deliverer, delivererParents, error, refetch} =
    useDelivererWithParents(id);
  const canWrite = useCanWrite();
  const showToast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const invalidateDeliverer = () => {
    queryClient.invalidateQueries({queryKey: queryKeys.table('deliverer')});
    queryClient.invalidateQueries({queryKey: queryKeys.count('deliverer')});
    // The parent form's dropdown reads this; invalidating it is what makes a new
    // deliverer selectable immediately instead of after a memoized TTL.
    queryClient.invalidateQueries({
      queryKey: queryKeys.options('deliverer_options'),
    });
    if (id && id !== 'new') {
      queryClient.invalidateQueries({
        queryKey: queryKeys.record('deliverer', id),
      });
    }
  };

  const saveDeliverer = useMutation({
    mutationFn: async (formData: Partial<Deliverer>) => {
      if (formData.id) {
        await updateRecord(
          'deliverer',
          formData.id,
          getDifference(formData, deliverer ?? {}),
        );
      } else {
        await insertRecord(
          'deliverer',
          formData as unknown as Database['public']['Tables']['deliverer']['Insert'],
        );
      }
    },
    onSuccess: () => {
      invalidateDeliverer();
      showToast('Deliverer saved');
      allowNextNavigation();
      navigate('/deliverers', {replace: true});
    },
    onError: (e: Error) =>
      showToast(`Could not save this deliverer: ${e.message}`, {
        severity: 'error',
      }),
  });

  const deleteDeliverer = useMutation({
    mutationFn: (delivererId: string) => softDelete('deliverer', delivererId),
    onSuccess: () => {
      invalidateDeliverer();
      showToast('Deliverer deleted');
      allowNextNavigation();
      navigate('/deliverers');
    },
    onError: (e: Error) =>
      showToast(`Could not delete this deliverer: ${e.message}`, {
        severity: 'error',
      }),
  });

  const onDeleteClick = async () => {
    if (!deliverer?.id) return;
    const assigned = delivererParents?.length ?? 0;
    const ok = await confirm({
      title: 'Delete this deliverer?',
      message:
        `${deliverer.name} will be removed from the app.` +
        (assigned
          ? ` ${assigned} ${assigned === 1 ? 'family is' : 'families are'} still assigned to them and will be left without a deliverer.`
          : '') +
        ' An administrator can restore the record.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) deleteDeliverer.mutate(deliverer.id);
  };

  if (error) {
    return (
      <>
        <Button component={Link} to={'/deliverers'} sx={{mb: 1}}>
          Back to Deliverers
        </Button>
        <ErrorState
          error={error}
          onRetry={refetch}
          title="Could not load this deliverer"
        />
      </>
    );
  }

  if (!deliverer) return <FormSkeleton rows={2} />;

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
          onSubmit={(formData) => saveDeliverer.mutate(formData)}
          fields={delivererFields}
          disabled={!canWrite}
          submitting={saveDeliverer.isPending}
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
        <Button
          color="error"
          sx={{mt: 2}}
          onClick={onDeleteClick}
          disabled={deleteDeliverer.isPending}
        >
          Delete {deliverer.name}
        </Button>
      )}
    </>
  );
};

export default DelivererPage;

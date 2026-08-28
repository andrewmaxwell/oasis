import {Box, Button, CircularProgress, Paper, Typography} from '@mui/material';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../../queryClient.ts';
import {useToast} from '../../hooks/useToast.ts';
import {useConfirm} from '../../hooks/useConfirm.ts';
import {ErrorState, FormSkeleton} from '../PageStates.tsx';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {userManagement} from '../../supabase.ts';
import {
  FormField,
  AppUser,
  ACCESS_LEVELS,
  ACCESS_LEVEL_LABELS,
} from '../../types.ts';
import {OasisForm} from '../OasisForm.tsx';
import {useSessionState} from '../../hooks/useSession.ts';
import {useIsAdmin} from '../../hooks/useAccessLevel.ts';
import {useUser} from '../../hooks/useUser.ts';
import {allowNextNavigation} from '../../hooks/useUnsavedChangesPrompt.ts';

const userFields: FormField<AppUser>[] = [
  {id: 'name', label: 'Name', required: true, width: 4},
  {id: 'email', label: 'Email', required: true, width: 4},
  {
    id: 'access_level',
    label: 'Access Level',
    required: true,
    width: 4,
    type: 'select',
    options: ACCESS_LEVELS.map((value) => ({
      value,
      label: ACCESS_LEVEL_LABELS[value],
    })),
  },
  {id: 'notes', label: 'Notes', width: 12, multiline: true},
];

const UserPage = () => {
  const {id} = useParams();
  const {session, loaded} = useSessionState();
  const isAdmin = useIsAdmin();
  const {user, error, refetch} = useUser(
    id,
    isAdmin ? session?.access_token : undefined,
  );
  const showToast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const saveUser = useMutation({
    mutationFn: async (formData: Partial<AppUser>) => {
      if (!session?.access_token) throw new Error('Not signed in');

      // The edge function decides which bucket each field lands in: `access_level` goes to
      // app_metadata (service-role only), name/notes to user_metadata.
      const profile = {
        email: formData.email,
        name: formData.name,
        access_level: formData.access_level,
        notes: formData.notes,
      };

      const {error: fnError} = await userManagement(
        session.access_token,
        formData.id
          ? {action: 'updateUserById', args: [formData.id, profile]}
          : // Sends an invite email and creates the account with NO password, so it can
            // only be signed into once the invitee sets one via the link.
            {action: 'inviteUser', args: [profile]},
      );
      if (fnError) throw new Error(fnError);
      return !formData.id;
    },
    onSuccess: (wasInvite) => {
      queryClient.invalidateQueries({queryKey: queryKeys.users()});
      if (id) queryClient.invalidateQueries({queryKey: queryKeys.user(id)});
      showToast(wasInvite ? 'Invitation sent' : 'User saved');
      allowNextNavigation();
      navigate('/users');
    },
    onError: (e: Error) =>
      showToast(`Could not save this user: ${e.message}`, {severity: 'error'}),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!session?.access_token) throw new Error('Not signed in');
      const {error: fnError} = await userManagement(session.access_token, {
        action: 'deleteUser',
        args: [userId],
      });
      if (fnError) throw new Error(fnError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.users()});
      showToast('User deleted');
      allowNextNavigation();
      navigate('/users');
    },
    onError: (e: Error) =>
      showToast(`Could not delete this user: ${e.message}`, {
        severity: 'error',
      }),
  });

  const onDeleteClick = async () => {
    if (!user?.id) return;
    const ok = await confirm({
      title: 'Delete this user?',
      // Unlike the domain tables, this really is permanent — it's an auth account.
      message: `${user.name || user.email} will lose access immediately. Deleting an account cannot be undone; they would have to be invited again.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) deleteUser.mutate(user.id);
  };

  if (!loaded) return <CircularProgress />;

  if (!isAdmin) return <p>Access Denied</p>;

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
        title="Could not load this user"
      />
    );
  }

  if (!user) return <FormSkeleton rows={2} />;

  return (
    <>
      {user.id && (
        <Button component={Link} to={`/users`} sx={{mb: 1}}>
          Back to Users
        </Button>
      )}

      <Paper sx={{p: 2}}>
        <Typography variant="h5" pb={2}>
          User Info
        </Typography>
        <OasisForm
          origData={user}
          onSubmit={(formData) => saveUser.mutate(formData)}
          fields={userFields}
          submitting={saveUser.isPending}
        />
      </Paper>

      <ul>
        <li>
          <strong>Read Only: </strong> can not change any data.
        </li>
        <li>
          <strong>Read-Write: </strong> can change parents, kids, orders, and
          deliverers.
        </li>
        <li>
          <strong>Admin: </strong> same as Read-Write but can also manage app
          users.
        </li>
      </ul>

      {user.id && (
        <Box mt={4}>
          <Button
            color="error"
            onClick={onDeleteClick}
            disabled={deleteUser.isPending}
          >
            Delete {user.name}
          </Button>
        </Box>
      )}
    </>
  );
};

export default UserPage;

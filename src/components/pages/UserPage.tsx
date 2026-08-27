import {Box, Button, CircularProgress, Paper, Typography} from '@mui/material';
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
  const user = useUser(id, isAdmin ? session?.access_token : undefined);

  const navigate = useNavigate();

  if (!loaded) return <CircularProgress />;

  if (!isAdmin) return <p>Access Denied</p>;

  if (!user) return <CircularProgress />;

  const onSubmit = async (formData: Partial<AppUser>) => {
    if (!session?.access_token) return;

    // The edge function decides which bucket each field lands in: `access_level` goes to
    // app_metadata (service-role only), name/notes to user_metadata.
    const profile = {
      email: formData.email,
      name: formData.name,
      access_level: formData.access_level,
      notes: formData.notes,
    };

    const {error} = await userManagement(
      session.access_token,
      formData.id
        ? {action: 'updateUserById', args: [formData.id, profile]}
        : // Sends an invite email and creates the account with NO password, so it can
          // only be signed into once the invitee sets one via the link.
          {action: 'inviteUser', args: [profile]},
    );

    if (error) {
      alert(error);
      return;
    }
    navigate(`/users`);
  };

  const deleteUser = async () => {
    const msg = `Are you sure you want to delete this user? This cannot be undone.`;
    if (!user.id || !session?.access_token || !confirm(msg)) return;
    const {error} = await userManagement(session.access_token, {
      action: 'deleteUser',
      args: [user.id],
    });
    if (error) {
      alert(error);
      return;
    }
    navigate(`/users`);
  };

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
        <OasisForm origData={user} onSubmit={onSubmit} fields={userFields} />
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
          <Button color="error" onClick={deleteUser}>
            Delete {user.name}
          </Button>
        </Box>
      )}
    </>
  );
};

export default UserPage;

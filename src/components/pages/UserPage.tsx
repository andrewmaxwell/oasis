import {Box, Button, CircularProgress, Paper, Typography} from '@mui/material';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {userManagement} from '../../supabase.ts';
import {FormField, AppUser} from '../../types.ts';
import {OasisForm} from '../OasisForm.tsx';
import {useSession} from '../../hooks/useSession.ts';
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
    options: [
      {label: 'Read Only', value: 'readOnly'},
      {label: 'Read+Write', value: 'readWrite'},
      {label: 'Admin', value: 'admin'},
    ],
  },
  {id: 'notes', label: 'Notes', width: 12, multiline: true},
];

const UserPage = () => {
  const {id} = useParams();
  const session = useSession();
  const user = useUser(id, session?.access_token);
  const isAdmin = useIsAdmin();

  const navigate = useNavigate();

  if (!user) return <CircularProgress />;

  if (!isAdmin) return <p>Access Denied</p>;

  const onSubmit = async (formData: Partial<AppUser>) => {
    if (!session?.access_token) return;

    if (formData.id) {
      await userManagement(session.access_token, {
        action: 'updateUserById',
        args: [
          formData.id,
          {
            email: formData.email,
            user_metadata: {
              name: formData.name,
              access_level: formData.access_level,
              notes: formData.notes,
            },
          },
        ],
      });
      navigate(`/users`);
    } else if (session?.access_token) {
      await userManagement(session.access_token, {
        action: 'createUser',
        args: [
          {
            email: formData.email,
            password: 'abcdefg',
            user_metadata: {
              name: formData.name,
              access_level: formData.access_level,
              notes: formData.notes,
            },
          },
        ],
      });
      await userManagement(session.access_token, {
        action: 'inviteUserByEmail',
        args: [formData.email],
      });
      navigate(`/users`);
    }
  };

  const deleteUser = async () => {
    const msg = `Are you sure you want to delete this user? This cannot be undone.`;
    if (!user.id || !session?.access_token || !confirm(msg)) return;
    await userManagement(session.access_token, {
      action: 'deleteUser',
      args: [user.id],
    });
    navigate(`/users`);
  };

  // const sendPasswordReset = async () => {
  //   if (!session?.access_token) return;
  //   await userManagement(session.access_token, {
  //     action: 'generateLink',
  //     args: [{type: 'recovery', email: origData.email}],
  //   });
  // };

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

          {/* <Button onClick={sendPasswordReset}>Send Password Reset</Button> */}
        </Box>
      )}
    </>
  );
};

export default UserPage;

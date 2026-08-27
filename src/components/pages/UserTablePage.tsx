import {AppUser, ACCESS_LEVEL_LABELS} from '../../types.ts';
import {CircularProgress} from '@mui/material';
import {OasisTable} from '../OasisTable.tsx';
import {GridColDef} from '@mui/x-data-grid';
import {anchor, linkButton} from '../cellRenderers.tsx';
import {useSessionState} from '../../hooks/useSession.ts';
import {useIsAdmin} from '../../hooks/useAccessLevel.ts';
import {useUserList} from '../../hooks/useUserList.ts';

const columns: GridColDef<AppUser>[] = [
  {
    field: 'name',
    headerName: 'Name',
    width: 200,
    renderCell: linkButton('user'),
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 300,
    renderCell: anchor('mailto'),
  },
  {
    field: 'access_level',
    headerName: 'Access Level',
    width: 150,
    valueGetter: (value: AppUser['access_level']) =>
      value ? ACCESS_LEVEL_LABELS[value] : '',
  },
  {
    field: 'notes',
    headerName: 'Notes',
    width: 400,
  },
];

const UserTablePage = () => {
  const {session, loaded} = useSessionState();
  const isAdmin = useIsAdmin();
  // Only send the token once we believe the caller is an admin; the edge function
  // rejects everyone else with a 403 anyway.
  const userList = useUserList(isAdmin ? session?.access_token : undefined);

  if (!loaded) return <CircularProgress />;

  if (!isAdmin) return <p>Access Denied</p>;

  return (
    <OasisTable
      data={userList}
      label="User"
      columns={columns}
      newItemUrl="/user/new"
    />
  );
};

export default UserTablePage;

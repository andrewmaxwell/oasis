import {AppUser} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {GridColDef} from '@mui/x-data-grid';
import {anchor, linkButton} from '../cellRenderers.tsx';
import {useSession} from '../../hooks/useSession.ts';
import {useIsAdmin} from '../../hooks/useAccessLevel.ts';
import {useUserList} from '../../hooks/useUserList.ts';

const accessLevels = {
  admin: 'Admin',
  readWrite: 'Read+Write',
  readOnly: 'Read Only',
};

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
    valueGetter: (value) => accessLevels[value] || value,
  },
  {
    field: 'notes',
    headerName: 'Notes',
    width: 400,
  },
];

const UserTablePage = () => {
  const session = useSession();
  const userList = useUserList(session?.access_token);
  const isAdmin = useIsAdmin();

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

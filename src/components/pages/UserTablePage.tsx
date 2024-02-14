import {userManagement} from '../../supabase.ts';
import {AppUser} from '../../types.ts';
import {OasisTable} from '../OasisTable.tsx';
import {GridColDef} from '@mui/x-data-grid';
import {anchor, linkButton} from '../cellRenderers.tsx';
import {useEffect, useState} from 'react';
import {useSession} from '../../utils/useSession.ts';
import {useIsAdmin} from '../../utils/useAccessLevel.ts';

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
    valueGetter: ({value}) =>
      (
        ({
          admin: 'Admin',
          readWrite: 'Read+Write',
          readOnly: 'Read Only',
        }) as any
      )[value] || value,
  },
  {
    field: 'notes',
    headerName: 'Notes',
    width: 400,
  },
];

export const UserTablePage = () => {
  const [users, setUsers] = useState<AppUser[]>();
  const session = useSession();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!session?.access_token) return;
    userManagement(session?.access_token, {action: 'listUsers'}).then(
      ({users}) =>
        setUsers(users.map((u: any) => ({...u, ...u.user_metadata}))),
    );
  }, [session?.access_token]);

  if (!isAdmin) return <p>Access Denied</p>;

  return (
    <OasisTable
      data={users}
      label="User"
      columns={columns}
      newItemUrl="/user/new"
    />
  );
};

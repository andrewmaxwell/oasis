import {getView} from '../../supabase.ts';
import {OasisTable} from '../OasisTable.tsx';
import {useData} from '../../utils/useData.ts';
import {GridColDef} from '@mui/x-data-grid';
import {birthDate, bool, linkButton} from '../cellRenderers.tsx';

type KidViewRow = {
  id: string;
  name: string;
  gender: string;
  birth_date?: string;
  diaper_size: string;
  is_active: boolean;
  notes?: string;
  parent_id: string;
  parent_name: string;
};

const getKids = async () => (await getView('kid_view')) as KidViewRow[];

const columns: GridColDef<KidViewRow>[] = [
  {field: 'is_active', headerName: 'Active', width: 50, renderCell: bool},
  {
    field: 'name',
    headerName: 'Name',
    width: 250,
    renderCell: linkButton('kid'),
  },
  {field: 'gender', headerName: 'Gender', width: 100},
  {
    field: 'birth_date',
    headerName: 'Birth Date',
    width: 150,
    renderCell: birthDate,
  },
  {field: 'diaper_size', headerName: 'Diaper Size', width: 100},
  {
    field: 'parent_name',
    headerName: 'Parent',
    width: 250,
    renderCell: linkButton('parent', 'parent_id'),
  },
  {field: 'notes', headerName: 'notes', width: 400},
];

export const KidTablePage = () => (
  <OasisTable
    data={useData(getKids)}
    label="Kid"
    columns={columns}
    newItemUrl="/kid/new"
  />
);

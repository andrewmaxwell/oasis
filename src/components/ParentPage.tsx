import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  deleteRecord,
  getParent,
  insertRecord,
  updateRecord,
} from '../supabase.ts';
import {FormField, Parent} from '../types.ts';
import {getDifference} from '../utils/getDifference.ts';
import {OasisForm} from './OasisForm.tsx';
import {UseFormReset} from 'react-hook-form';
import {Add} from '@mui/icons-material';

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
    required: true,
    width: 3,
  },
  {
    id: 'rough_family_income',
    label: 'Rough Family Income',
    required: true,
    type: 'number',
    width: 3,
  },
  {id: 'is_active', label: 'Active', type: 'switch', width: 3},
];

export const ParentPage = () => {
  const [origData, setOrigData] = useState<Partial<Parent> | undefined>();
  const {id} = useParams();

  useEffect(() => {
    if (id && id !== 'new') {
      getParent(id).then(setOrigData);
    } else {
      setOrigData({is_active: true});
    }
  }, [id]);

  const navigate = useNavigate();

  if (!origData) return <CircularProgress />;

  const onSubmit = async (
    formData: Partial<Parent>,
    reset: UseFormReset<Partial<Parent>>,
  ) => {
    if (formData.id) {
      await updateRecord('parent', formData.id, {
        ...getDifference(formData, origData),
        kid: undefined,
      });
      reset(await getParent(formData.id));
    } else {
      const {id} = await insertRecord('parent', formData);
      navigate(`/oasis/parent/${id}`, {replace: true});
    }
  };

  const deleteParent = async () => {
    const msg = `Are you sure you want to delete ${origData.first_name} ${origData.last_name} and their kids forever? This cannot be undone.`;
    if (!origData.id || !confirm(msg)) return;
    await deleteRecord('parent', origData.id);
    navigate('/oasis/');
  };

  return (
    <>
      <Paper sx={{p: 2}}>
        <Typography variant="h5" pb={2}>
          Parent Info
        </Typography>
        <OasisForm
          origData={origData}
          onSubmit={onSubmit}
          fields={parentFields}
        />
      </Paper>

      {origData.kid && (
        <Paper sx={{p: 2, mt: 2}}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5">Kids</Typography>
            <Button
              variant="contained"
              onClick={() => navigate(`/oasis/kid/new?parentId=${origData.id}`)}
              startIcon={<Add />}
            >
              Kid
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Birth Date</TableCell>
                <TableCell>Diaper Size</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {origData.kid
                .sort((a, b) => b.birth_date.localeCompare(a.birth_date))
                .map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>
                      <Button component={Link} to={`/oasis/kid/${k.id}`}>
                        {k.first_name} {k.last_name}
                      </Button>
                    </TableCell>
                    <TableCell>{k.birth_date}</TableCell>
                    <TableCell>{k.diaper_size}</TableCell>
                    <TableCell>{k.is_active ? 'Y' : 'N'}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Button color="error" sx={{mt: 4}} onClick={deleteParent}>
        Delete {origData.first_name} {origData.last_name}
      </Button>
    </>
  );
};

import {Button, CircularProgress, Grid, Paper} from '@mui/material';
import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {getParent, insertRecord, updateRecord} from '../supabase.ts';
import {Parent} from '../types.ts';
import {useForm} from 'react-hook-form';
import {OasisTextField} from './OasisTextField.tsx';
import {getDifference} from '../utils/getDifference.ts';
import {OasisSwitch} from './OasisSwitch.tsx';

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

  const {
    register,
    handleSubmit,
    formState: {errors, isDirty},
    control,
    reset,
  } = useForm({values: {...origData, kid: undefined}});

  const navigate = useNavigate();

  if (!origData) return <CircularProgress />;

  const onSubmit = async (formData: Partial<Parent>) => {
    if (formData.id) {
      const updated = await updateRecord(
        'parent',
        formData.id,
        getDifference(formData, origData),
      );
      reset(updated);
    } else {
      const {id} = await insertRecord('parent', formData);
      navigate(`/oasis/parent/${id}`, {replace: true});
    }
  };

  return (
    <Paper sx={{p: 2}}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container alignItems="flex-start" spacing={2}>
          <Grid item xs={4}>
            <OasisTextField
              label="First Name"
              props={register('first_name', {required: true})}
              error={errors.first_name}
            />
          </Grid>
          <Grid item xs={4}>
            <OasisTextField
              label="Last Name"
              props={register('last_name', {required: true})}
              error={errors.last_name}
            />
          </Grid>
          <Grid item xs={4}>
            <OasisTextField
              label="Phone Number"
              props={register('phone_number', {required: true})}
              error={errors.phone_number}
              type="tel"
            />
          </Grid>
          <Grid item xs={6}>
            <OasisTextField
              label="Address"
              props={register('address', {required: true})}
              error={errors.address}
            />
          </Grid>
          <Grid item xs={3}>
            <OasisTextField
              label="City"
              props={register('city', {required: true})}
              error={errors.city}
            />
          </Grid>
          <Grid item xs={3}>
            <OasisTextField
              label="Zip Code"
              props={register('zip', {required: true})}
              error={errors.zip}
            />
          </Grid>
          <Grid item xs={3}>
            <OasisTextField
              label="Country of Origin"
              props={register('country_of_origin', {required: true})}
              error={errors.country_of_origin}
            />
          </Grid>
          <Grid item xs={3}>
            <OasisTextField
              label="Rough Family Income"
              props={register('rough_family_income', {required: true})}
              error={errors.rough_family_income}
              type="number"
            />
          </Grid>
          <Grid item xs={3}>
            <OasisSwitch name="is_active" label="Active" control={control} />
          </Grid>

          <Grid item xs={12} sx={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button type="submit" variant="contained" disabled={!isDirty}>
              {origData.id ? 'Update' : 'Save'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

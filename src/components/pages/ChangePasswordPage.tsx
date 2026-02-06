import {Button, Box, Typography} from '@mui/material';
import {updatePassword} from '../../supabase.ts';
import {FieldError, useForm} from 'react-hook-form';
import {OasisTextField} from '../OasisTextField.tsx';
import {useNavigate} from 'react-router-dom';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const {
    handleSubmit,
    register,
    getValues,
    formState: {errors},
  } = useForm();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(async ({password}) => {
        if (await updatePassword(password)) navigate('/');
      })}
      sx={{
        '& .MuiTextField-root': {m: 1, width: '25ch'},
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>
      <OasisTextField
        label="New Password"
        type="password"
        {...register('password', {required: true})}
        error={errors.password as FieldError}
      />
      <OasisTextField
        label="Confirm New Password"
        type="password"
        {...register('confirmPassword', {
          required: true,
          validate: (val: string) => {
            if (getValues('password') != val) {
              return 'Your passwords do not match.';
            }
          },
        })}
        error={errors.confirmPassword as FieldError}
      />
      <Button type="submit" variant="contained" sx={{mt: 3, mb: 2}}>
        Submit
      </Button>
    </Box>
  );
};

export default ChangePasswordPage;

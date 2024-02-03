import {Button, Box, Typography} from '@mui/material';
import {signIn} from '../supabase.ts';
import {FieldError, useForm} from 'react-hook-form';
import {OasisTextField} from './OasisTextField.tsx';

export const SignInForm = () => {
  const {
    handleSubmit,
    register,
    formState: {errors},
  } = useForm();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(({email, password}) => signIn(email, password))}
      sx={{
        '& .MuiTextField-root': {m: 1, width: '25ch'},
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Sign In
      </Typography>
      <OasisTextField
        label="Email Address"
        type="email"
        props={register('email', {required: true})}
        error={errors.email as FieldError}
      />
      <OasisTextField
        label="Password"
        type="password"
        props={register('password', {required: true})}
        error={errors.password as FieldError}
      />
      <Button type="submit" variant="contained" sx={{mt: 3, mb: 2}}>
        Sign In
      </Button>
    </Box>
  );
};

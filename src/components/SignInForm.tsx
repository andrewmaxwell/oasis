import {Button, Box, Typography} from '@mui/material';
import {signIn} from '../supabase.ts';
import {FieldError, useForm} from 'react-hook-form';
import {OasisTextField} from './OasisTextField.tsx';
import {useToast} from '../hooks/useToast.ts';

export const SignInForm = () => {
  const showToast = useToast();
  const {
    handleSubmit,
    register,
    formState: {errors, isSubmitting},
  } = useForm();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(async ({email, password}) => {
        try {
          await signIn(email, password);
        } catch (e) {
          // Supabase says "Invalid login credentials" for both a wrong password and an
          // unknown address; don't dress that up as anything more specific.
          showToast((e as Error).message, {severity: 'error'});
        }
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
        Sign In
      </Typography>
      <OasisTextField
        label="Email Address"
        type="email"
        autoComplete="username"
        {...register('email', {required: true})}
        error={errors.email as FieldError}
      />
      <OasisTextField
        label="Password"
        type="password"
        autoComplete="current-password"
        {...register('password', {required: true})}
        error={errors.password as FieldError}
      />
      <Button
        type="submit"
        variant="contained"
        sx={{mt: 3, mb: 2}}
        disabled={isSubmitting}
      >
        Sign In
      </Button>
    </Box>
  );
};

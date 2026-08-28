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
      // This route renders outside the router's Container, so it carries its own page
      // padding — without it the form sits flush against the top-left edge of a phone.
      sx={{
        '& .MuiTextField-root': {width: '100%'},
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        maxWidth: 360,
        mx: 'auto',
        px: 3,
        py: {xs: 6, sm: 10},
      }}
    >
      <Box
        component="img"
        src="/oasis/favicon.png"
        alt=""
        sx={{height: 64, width: 64, borderRadius: '50%', alignSelf: 'center'}}
      />
      <Typography variant="h5" sx={{textAlign: 'center', fontWeight: 700}}>
        Oasis
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
        size="large"
        sx={{mt: 1}}
        disabled={isSubmitting}
      >
        Sign In
      </Button>
    </Box>
  );
};

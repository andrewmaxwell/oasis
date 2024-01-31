import {TextField} from '@mui/material';
import {HTMLInputTypeAttribute} from 'react';
import {FieldError, UseFormRegisterReturn} from 'react-hook-form';

type OasisTextFieldProps<T extends string> = {
  label: string;
  props: UseFormRegisterReturn<T>;
  error: FieldError | undefined;
  type?: HTMLInputTypeAttribute;
};

export const OasisTextField = <T extends string>({
  label,
  props,
  error,
  type,
}: OasisTextFieldProps<T>) => (
  <TextField
    label={label}
    fullWidth
    type={type}
    error={!!error}
    helperText={String(error?.message || '')}
    InputLabelProps={type === 'date' ? {shrink: true} : {}}
    {...props}
  />
);

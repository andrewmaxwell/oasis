import {TextField} from '@mui/material';
import {HTMLInputTypeAttribute} from 'react';
import {FieldError} from 'react-hook-form';

type OasisTextFieldProps = {
  label: string;
  error: FieldError | undefined;
  type?: HTMLInputTypeAttribute;
  multiline?: boolean;
  disabled?: boolean;
};

export const OasisTextField = ({
  label,
  error,
  type,
  multiline,
  disabled,
  ...props
}: OasisTextFieldProps) => (
  <TextField
    label={label}
    fullWidth
    type={type}
    error={!!error}
    helperText={String(error?.message || '')}
    InputLabelProps={type === 'date' ? {shrink: true} : {}}
    multiline={multiline}
    disabled={disabled}
    {...props}
  />
);

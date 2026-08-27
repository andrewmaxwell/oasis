import {TextField} from '@mui/material';
import {HTMLInputTypeAttribute} from 'react';
import {FieldError} from 'react-hook-form';

type OasisTextFieldProps = {
  label: string;
  error: FieldError | undefined;
  type?: HTMLInputTypeAttribute;
  multiline?: boolean;
  disabled?: boolean;
  /** Passed through so password managers behave on the sign-in and password forms. */
  autoComplete?: string;
};

export const OasisTextField = ({
  label,
  error,
  type,
  multiline,
  disabled,
  autoComplete,
  ...props
}: OasisTextFieldProps) => (
  <TextField
    label={label}
    fullWidth
    type={type}
    error={!!error}
    helperText={String(error?.message || '')}
    slotProps={type === 'date' ? {inputLabel: {shrink: true}} : {}}
    autoComplete={autoComplete}
    multiline={multiline}
    disabled={disabled}
    {...props}
  />
);

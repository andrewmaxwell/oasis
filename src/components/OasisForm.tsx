import {Button, CircularProgress, Grid} from '@mui/material';
import {FieldError, FieldValues, UseFormReset, useForm} from 'react-hook-form';
import {OasisTextField} from './OasisTextField.tsx';
import {OasisSwitch} from './OasisSwitch.tsx';
import {FormField} from '../types.ts';
import {OasisSelect} from './OasisSelect.tsx';

type OasisFormProps<T> = {
  origData: Partial<T>;
  onSubmit: (
    formData: Partial<T>,
    reset: UseFormReset<Partial<T>>,
  ) => Promise<void> | void;
  fields: FormField<T>[];
  disabled?: boolean;
};
export const OasisForm = <T extends FieldValues>({
  origData,
  onSubmit,
  fields,
  disabled,
}: OasisFormProps<T>) => {
  const {
    register,
    handleSubmit,
    formState: {errors, isDirty, isSubmitting},
    control,
    reset,
  } = useForm({values: origData});

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, reset))}>
      <Grid container alignItems="flex-start" spacing={2}>
        {fields.map(
          ({id, label, required, type, width, options, multiline}) => (
            <Grid key={id} size={{xs: 12, md: width}}>
              {type === 'switch' ? (
                <OasisSwitch
                  name={id}
                  label={label}
                  control={control}
                  disabled={disabled}
                />
              ) : type === 'select' && options ? (
                <OasisSelect
                  name={id}
                  label={label}
                  control={control}
                  options={options}
                  required={required}
                  error={(id ? errors[id] : undefined) as FieldError}
                  disabled={disabled}
                />
              ) : (
                <OasisTextField
                  label={label}
                  {...register(id, {required})}
                  error={errors[id] as FieldError}
                  type={type}
                  multiline={multiline}
                  disabled={disabled}
                />
              )}
            </Grid>
          ),
        )}

        {!disabled && (
          <Grid size={12} sx={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button
              type="submit"
              variant="contained"
              disabled={!isDirty || isSubmitting}
            >
              {isSubmitting ? <CircularProgress /> : 'Save'}
            </Button>
          </Grid>
        )}
      </Grid>
    </form>
  );
};

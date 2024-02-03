import {Button, Grid} from '@mui/material';
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
  disableSave?: boolean;
};
export const OasisForm = <T extends FieldValues>({
  origData,
  onSubmit,
  fields,
  disableSave,
}: OasisFormProps<T>) => {
  const {
    register,
    handleSubmit,
    formState: {errors, isDirty},
    control,
    reset,
  } = useForm({values: origData});

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, reset))}>
      <Grid container alignItems="flex-start" spacing={2}>
        {fields.map(({id, label, required, type, width, options}) => (
          <Grid key={id} item xs={width}>
            {type === 'switch' ? (
              <OasisSwitch name={id} label={label} control={control} />
            ) : type === 'select' && options ? (
              <OasisSelect
                name={id}
                label={label}
                control={control}
                options={options}
              />
            ) : (
              <OasisTextField
                label={label}
                props={register(id, {required})}
                error={errors[id] as FieldError}
                type={type}
              />
            )}
          </Grid>
        ))}

        <Grid item xs={12} sx={{display: 'flex', justifyContent: 'flex-end'}}>
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || disableSave}
          >
            Save
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

import {Button, CircularProgress, Grid} from '@mui/material';
import {FieldError, FieldValues, UseFormReset, useForm} from 'react-hook-form';
import {OasisTextField} from './OasisTextField.tsx';
import {OasisSwitch} from './OasisSwitch.tsx';
import {FormField} from '../types.ts';
import {OasisSelect} from './OasisSelect.tsx';
import {useUnsavedChangesPrompt} from '../hooks/useUnsavedChangesPrompt.ts';

type OasisFormProps<T> = {
  origData: Partial<T>;
  onSubmit: (
    formData: Partial<T>,
    reset: UseFormReset<Partial<T>>,
  ) => Promise<void> | void;
  fields: FormField<T>[];
  disabled?: boolean;
  /**
   * True while a save is in flight. Pages submit through a react-query mutation, which
   * returns immediately and reports its outcome via a toast, so react-hook-form's own
   * `isSubmitting` goes false straight away — this is what actually keeps Save disabled.
   */
  submitting?: boolean;
};
export const OasisForm = <T extends FieldValues>({
  origData,
  onSubmit,
  fields,
  disabled,
  submitting,
}: OasisFormProps<T>) => {
  const {
    register,
    handleSubmit,
    formState: {errors, isDirty, isSubmitting},
    control,
    reset,
  } = useForm({values: origData});

  // ISSUES #26: navigating away from a dirty form used to discard the edits silently.
  // A save in flight is excluded — the page navigates itself once it succeeds, and calls
  // `allowNextNavigation()` when it does.
  useUnsavedChangesPrompt(isDirty && !isSubmitting && !submitting);

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
              disabled={!isDirty || isSubmitting || submitting}
            >
              {isSubmitting || submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Save'
              )}
            </Button>
          </Grid>
        )}
      </Grid>
    </form>
  );
};

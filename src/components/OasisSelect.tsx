import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
} from '@mui/material';
import {
  Control,
  Controller,
  FieldError,
  FieldValues,
  Path,
} from 'react-hook-form';
import {Option, OptionSource} from '../types.ts';
import {useOptions} from '../hooks/useOptions.ts';

type OasisSelectProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  control: Control<T>;
  options: Option[] | OptionSource;
  required?: boolean;
  error?: FieldError;
  disabled?: boolean;
};
export const OasisSelect = <T extends FieldValues>({
  name,
  label,
  control,
  options: optionsOrSource,
  required = false,
  error,
  disabled,
}: OasisSelectProps<T>) => {
  const options = useOptions(optionsOrSource);

  // A field-shaped placeholder, not a spinner: the select sits in a grid with text fields
  // and a smaller element here shifts everything below it when the options land.
  if (!options) return <Skeleton variant="rounded" height={56} />;
  const labelId = `${name}-label`;
  return (
    <FormControl fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Controller
        name={name}
        control={control}
        rules={{required}}
        render={({field}) => (
          <Select
            labelId={labelId}
            label={label}
            fullWidth
            error={!!error}
            disabled={disabled}
            {...field}
          >
            {/* A valueless MenuItem renders a zero-height blank row and makes MUI warn
                about an out-of-range value. A required field needs no empty choice. */}
            {!required && (
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
            )}
            {options.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        )}
      />
    </FormControl>
  );
};

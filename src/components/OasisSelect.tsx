import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import {
  Control,
  Controller,
  FieldError,
  FieldValues,
  Path,
} from 'react-hook-form';
import {Option} from '../types.ts';
import {useOptions} from '../hooks/useOptions.ts';

type OasisSelectProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  control: Control<T>;
  options: Option[] | (() => Promise<Option[]>);
  required?: boolean;
  error?: FieldError;
  disabled?: boolean;
};
export const OasisSelect = <T extends FieldValues>({
  name,
  label,
  control,
  options: optsOrGetOpts,
  required = false,
  error,
  disabled,
}: OasisSelectProps<T>) => {
  const options = useOptions(optsOrGetOpts);

  if (!options) return <CircularProgress />;
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
            <MenuItem></MenuItem>
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

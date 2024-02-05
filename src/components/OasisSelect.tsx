import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import {Control, Controller, FieldValues, Path} from 'react-hook-form';
import {Option} from '../types.ts';
import {useEffect, useState} from 'react';

type OasisSelectProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  control: Control<T>;
  options: Option[] | (() => Promise<Option[]>);
  required?: boolean;
};
export const OasisSelect = <T extends FieldValues>({
  name,
  label,
  control,
  options: optsOrGetOpts,
  required = false,
}: OasisSelectProps<T>) => {
  const [options, setOptions] = useState<Option[]>();

  useEffect(() => {
    if (Array.isArray(optsOrGetOpts)) {
      setOptions(optsOrGetOpts);
    } else {
      optsOrGetOpts().then(setOptions);
    }
  }, [optsOrGetOpts]);

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
          <Select labelId={labelId} label={label} fullWidth {...field}>
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

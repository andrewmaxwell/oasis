import {FormControlLabel, Switch} from '@mui/material';
import {Control, Controller, FieldValues, Path} from 'react-hook-form';

type OasisSwitchProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  control: Control<T>;
  disabled?: boolean;
};
export const OasisSwitch = <T extends FieldValues>({
  name,
  label,
  control,
  disabled,
}: OasisSwitchProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({field: {onChange, value}}) => (
      <FormControlLabel
        sx={{p: 1}}
        control={
          <Switch checked={!!value} onChange={onChange} disabled={disabled} />
        }
        label={label}
      />
    )}
  />
);

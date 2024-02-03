import {ChangeEventHandler} from 'react';
import {Parent} from '../../../types.ts';
import {getDelivererOptions} from '../../../utils/getDelivererOptions.ts';
import {CircularProgress, MenuItem, TextField} from '@mui/material';
import {useData} from '../../../utils/useData.ts';

type DelivererSelectProps = {
  parent: Parent;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};
export const DelivererSelect = ({parent, onChange}: DelivererSelectProps) => {
  const options = useData(getDelivererOptions);

  if (!options) return <CircularProgress />;

  const selectedOption = options.find((o) => o.value === parent.deliverer_id);
  const valid = selectedOption && !selectedOption.label.includes('INACTIVE');

  return (
    <TextField
      select
      label="Deliverer"
      fullWidth
      value={parent.deliverer_id || ''}
      onChange={onChange}
      error={!valid}
    >
      <MenuItem></MenuItem>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

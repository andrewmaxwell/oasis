import {Button, CircularProgress, Grid, Switch} from '@mui/material';
import {Fragment} from 'react';
import {Link} from 'react-router-dom';
import {updateRecord} from '../../../supabase.ts';
import {Parent, TableColumn} from '../../../types.ts';
import {OasisTable} from '../../OasisTable.tsx';
import {DelivererSelect} from './DelivererSelect.tsx';
import {dateToAge} from '../../../utils/dateToAge.ts';
import {calcDiaperSizes} from './calcDiaperSizes.ts';

const parentColumns: TableColumn<Parent>[] = [
  {
    label: 'Families',
    render: (p: Parent) => (
      <Grid container alignItems="center" justifyContent="center">
        <Grid item xs={6}>
          <Button component={Link} to={`/oasis/parent/${p.id}`}>
            {p.first_name} {p.last_name}
          </Button>
        </Grid>
        <Grid item xs={6}>
          {p.is_active && calcDiaperSizes([p])}
        </Grid>
        {p.is_active &&
          p.kid.map((k) => (
            <Fragment key={k.id}>
              <Grid item xs={6}>
                <Button component={Link} to={`/oasis/kid/${k.id}`}>
                  {k.first_name} {k.last_name}
                </Button>
              </Grid>
              <Grid item xs={2}>
                {dateToAge(k.birth_date)}
              </Grid>
              <Grid item xs={2}>
                Size {k.diaper_size}
              </Grid>
              <Grid item xs={2}>
                <Switch
                  checked={k.is_active || false}
                  onChange={(e) => {
                    updateRecord('kid', k.id, {is_active: e.target.checked});
                  }}
                />
              </Grid>
            </Fragment>
          ))}
      </Grid>
    ),
  },
  {
    label: 'Deliverer',
    render: (p: Parent) =>
      p.is_active && (
        <DelivererSelect
          parent={p}
          onChange={(e) => {
            updateRecord('parent', p.id, {deliverer_id: e.target.value});
          }}
        />
      ),
  },
  {
    label: 'Active',
    render: (p: Parent) => (
      <Switch
        checked={p.is_active}
        onChange={(e) => {
          updateRecord('parent', p.id, {is_active: e.target.checked});
        }}
      />
    ),
  },
];

export const OrderSetupTable = ({parents}: {parents: Parent[] | undefined}) => {
  if (!parents) return <CircularProgress />;
  return <OasisTable data={parents} columns={parentColumns} />;
};

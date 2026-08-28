import {Box, Chip, Link, Typography} from '@mui/material';
import {GridRenderCellParams} from '@mui/x-data-grid';
import {Link as RouterLink} from 'react-router-dom';

// ISSUES #29: these were bare <Link>/<a>, which on the dark theme render as the browser
// default blue turning visited-purple — poor contrast, and inconsistent with every MUI
// control around them. MUI's Link keeps them on the palette in every visited state.

export const linkButton = (type: string, key = 'id') =>
  function LinkButton({row, value}: GridRenderCellParams) {
    return (
      <Link component={RouterLink} to={`/${type}/${row[key]}`}>
        {value}
      </Link>
    );
  };

export const anchor = (type: string) =>
  function Anchor({value}: GridRenderCellParams) {
    return (
      <Link href={`${type}:${value}`} target="_blank" rel="noreferrer">
        {value}
      </Link>
    );
  };

export const mapAnchor = ({value, row}: GridRenderCellParams) => (
  <Link
    href={`https://www.google.com/maps/place/${row.address} ${row.zip}`}
    target="_blank"
    rel="noreferrer"
  >
    {value}
  </Link>
);

export const bool = ({value}: GridRenderCellParams) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      height: '100%',
    }}
  >
    <Chip
      label={value ? 'Active' : 'Inactive'}
      color={value ? 'success' : 'default'}
      size="small"
      variant="outlined"
    />
  </Box>
);

const isMoreThanThreeYearsAgo = (dateString: string) => {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  return new Date(dateString) <= threeYearsAgo;
};

export const birthDate = ({value}: GridRenderCellParams) =>
  // Guard first: new Date(null) is the 1970 epoch, so a missing birth date would always
  // test as "more than three years ago" and render as an empty cell in error red.
  value && isMoreThanThreeYearsAgo(value) ? (
    <Typography color="error" component="span">
      {value}
    </Typography>
  ) : (
    value
  );

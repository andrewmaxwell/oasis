import {GridRenderCellParams} from '@mui/x-data-grid';
import {Link} from 'react-router-dom';

export const linkButton = (type: string, key = 'id') =>
  function LinkButton({row, value}: GridRenderCellParams) {
    return <Link to={`/${type}/${row[key]}`}>{value}</Link>;
  };

export const anchor = (type: string) =>
  function Anchor({value}: GridRenderCellParams) {
    return (
      <a href={`${type}:${value}`} target="_blank" rel="noreferrer">
        {value}
      </a>
    );
  };

export const mapAnchor = ({value, row}: GridRenderCellParams) => (
  <a
    href={`https://www.google.com/maps/place/${row.address} ${row.zip}`}
    target="_blank"
    rel="noreferrer"
  >
    {value}
  </a>
);

export const bool = ({value}: GridRenderCellParams) => (value ? 'Y' : 'N');

import {TableCell, TableRow} from '@mui/material';
import {memo} from 'react';
import {TableColumn} from '../types.ts';

type RowProps<T> = {data: T; columns: TableColumn<T>[]};

const Row = <T extends {id: string}>({data, columns}: RowProps<T>) => (
  <TableRow key={data.id}>
    {columns.map((c) => (
      <TableCell key={c.label} width={c.width}>
        {c.render(data)}
      </TableCell>
    ))}
  </TableRow>
);

export const OasisTableRow = memo(Row) as typeof Row;

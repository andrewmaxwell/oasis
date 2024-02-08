export const valuesToSQL = (rows) =>
  rows
    .map((row) => {
      const vals = row
        .map((val) =>
          typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : '' + val,
        )
        .join(',');
      return `(${vals})`;
    })
    .join(',\n');

import {valuesToSQL} from './valuesToSQL.js';
import fs from 'fs';
import crypto from 'crypto';

const data = fs.readFileSync('scripts/prodData.txt', 'utf-8');

const makeInsert = (tableName, rows) => {
  const cols = Object.keys(rows[0]);
  const items = valuesToSQL(rows.map((r) => cols.map((col) => r[col])));
  return `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES ${items};`;
};

const zipToCity = Object.fromEntries(
  fs
    .readFileSync('scripts/zipCodes.txt', 'utf-8')
    .split('\n')
    .map((r) => r.split('\t')),
);

const kids = [];

const addKid = (id, first_name, last_name, bd, size) => {
  kids.push({
    parent_id: id,
    first_name,
    last_name,
    gender: '',
    birth_date: /^[/0-9]+$/.test(bd) ? bd : null,
    diaper_size: size,
    is_active: true,
  });
};

const deliverer = {
  id: crypto.randomUUID(),
  name: 'Unassigned',
  email: '',
  phone_number: '',
  is_active: true,
};
const parents = data.split('\n').map((r) => {
  const [
    first_name,
    last_name,
    address,
    zip,
    phone_number,
    phone2,
    ,
    ,
    bd1,
    size1,
    bd2,
    size2,
  ] = r.split('\t').map((s) => s.trim());

  const id = crypto.randomUUID();

  if (size1) addKid(id, 'Child 1', last_name, bd1, size1);
  if (size2) addKid(id, 'Child 2', last_name, bd2, size2);

  return {
    id,
    first_name,
    last_name,
    address,
    city: zipToCity[zip] || '???',
    zip,
    phone_number,
    notes: phone2 ? `Secondary phone: ${phone2}` : '',
    deliverer_id: deliverer.id,
  };
});

fs.writeFileSync(
  'scripts/temp.sql',
  `
DELETE FROM order_record;
DELETE FROM deliverer;
DELETE FROM parent;
DELETE FROM kid;

${makeInsert('deliverer', [deliverer])}

${makeInsert('parent', parents)}

${makeInsert('kid', kids)}
`,
);

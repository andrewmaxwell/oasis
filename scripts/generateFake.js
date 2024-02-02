// nodemon scripts/generateFake

import casual from 'casual'; // https://www.npmjs.com/package/casual
import {writeFileSync} from 'fs';

const numParents = 50;
const minKidsPerParent = 1;
const maxKidsPerParent = 5;

const randEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

const valuesToSQL = (rows) =>
  rows
    .map((row) => {
      const vals = row
        .map((val) =>
          typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val,
        )
        .join(',');
      return `(${vals})`;
    })
    .join(',\n');

const delivererValues = Array.from({length: 10}, () => [
  casual.uuid,
  casual.name,
  casual.email,
  casual.phone,
  Math.random() > 0.25,
]);

const parents = [];
const parentValues = Array.from({length: numParents}, () => {
  const id = casual.uuid;
  const lastName = casual.last_name;
  parents.push({parentId: id, lastName});
  return [
    id,
    casual.first_name,
    lastName,
    casual.address1,
    casual.city,
    casual.zip(6),
    casual.phone,
    casual.country,
    10000 + 5000 * Math.round(Math.random() * 10),
    Math.random() > 0.25,
    randEl(delivererValues)[0],
  ];
});

const kidValues = [];
for (const {parentId, lastName} of parents) {
  const numKids =
    minKidsPerParent +
    Math.floor(Math.random() * (maxKidsPerParent - minKidsPerParent));

  for (let i = 0; i < numKids; i++) {
    kidValues.push([
      casual.uuid,
      parentId,
      casual.first_name,
      lastName,
      casual.moment.format(),
      randEl(['N', '1', '2', '3', '4', '5', '6', '7']),
      Math.random() > 0.25,
    ]);
  }
}

const sql = `
DELETE FROM kid;
DELETE FROM parent;
DELETE FROM deliverer;

INSERT INTO deliverer (id, name, email, phone_number, is_active) VALUES
${valuesToSQL(delivererValues)}

INSERT INTO parent (id, first_name, last_name, address, city, zip, phone_number, country_of_origin, rough_family_income, is_active, deliverer_id) VALUES
${valuesToSQL(parentValues)};

INSERT INTO kid (id, parent_id, first_name, last_name, birth_date, diaper_size, is_active) VALUES
${valuesToSQL(kidValues)}
`;

writeFileSync('dummy.sql', sql);

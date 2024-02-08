// nodemon scripts/generateFake

import casual from 'casual'; // https://www.npmjs.com/package/casual
import {writeFileSync} from 'fs';
import {valuesToSQL} from './valuesToSql';

const numParents = 50;
const numDeliverers = 20;
const minKidsPerParent = 1;
const maxKidsPerParent = 5;

const randEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

const delivererIds = [];
const delivererValues = Array.from({length: numDeliverers}, () => {
  const active = Math.random() > 0.25;
  const id = casual.uuid;
  if (active) delivererIds.push(id);
  return [
    id,
    casual.first_name + ' ' + casual.last_name,
    casual.email,
    casual.phone,
    active,
  ];
});

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
    5000 * Math.round(Math.random() * 10),
    Math.random() > 0.25,
    randEl(delivererIds),
  ];
});

const kidValues = [];
for (const {parentId, lastName} of parents) {
  const numKids =
    minKidsPerParent +
    Math.floor(Math.random() * (maxKidsPerParent - minKidsPerParent));

  for (let i = 0; i < numKids; i++) {
    const birthTime = Date.now() - Math.random() * (2.5 * 365 * 24 * 3600000); // born in past 2.5 years
    kidValues.push([
      casual.uuid,
      parentId,
      casual.first_name,
      lastName,
      randEl('MF'),
      new Date(birthTime).toISOString(),
      randEl('N1234567'),
      Math.random() > 0.25,
    ]);
  }
}

const sql = `
DELETE FROM order_record;
DELETE FROM deliverer;
DELETE FROM parent;
DELETE FROM kid;

INSERT INTO deliverer (id, name, email, phone_number, is_active) VALUES
${valuesToSQL(delivererValues)};

INSERT INTO parent (id, first_name, last_name, address, city, zip, phone_number, country_of_origin, rough_family_income, is_active, deliverer_id) VALUES
${valuesToSQL(parentValues)};

INSERT INTO kid (id, parent_id, first_name, last_name, gender, birth_date, diaper_size, is_active) VALUES
${valuesToSQL(kidValues)};
`;

writeFileSync('dummy.sql', sql);

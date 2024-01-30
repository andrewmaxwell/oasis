const casual = require('casual');

// Define a custom generator for phone numbers if needed
casual.define('phone_number', function () {
  return `${casual.country_code}-${casual.phone}`;
});

const generateFakeData = () => {
  let sql =
    'INSERT INTO parent (first_name, last_name, address, city, zip, phone_number, country_of_origin, rough_family_income, is_active, created_at, modified_at) VALUES\n';

  for (let i = 0; i < 50; i++) {
    const firstName = casual.first_name;
    const lastName = casual.last_name;
    const address = casual.address1;
    const city = casual.city;
    const zip = casual.zip(6);
    const phoneNumber = casual.phone_number;
    const countryOfOrigin = casual.country;
    const roughFamilyIncome = Math.round(Math.random() * 100000);
    const isActive = Math.random() > 0.5;
    const createdAt = casual.moment.format();
    const modifiedAt = casual.moment.format();

    sql += `('${firstName}', '${lastName}', '${address}', '${city}', '${zip}', '${phoneNumber}', '${countryOfOrigin}', ${roughFamilyIncome}, ${isActive}, '${createdAt}', '${modifiedAt}')`;
    if (i < 49) sql += ',\n';
  }

  sql += ';';
  return sql;
};
console.log(generateFakeData());

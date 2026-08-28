import {expect, test} from '@playwright/test';
import {mockSupabase, signIn} from './fixtures/supabaseMock.ts';
import {PARENT_ID} from './fixtures/database.ts';

/**
 * Ordering lives in the database — `ORDER BY` in the views, `.order()` in `getAllRecords`
 * — not in the pages. These assertions pin the shape of it: retired kids and volunteers
 * sort below the ones the roster is actually made of, alphabetically within each group.
 *
 * Caveat that comes with this whole suite: the fixture reimplements the views in
 * TypeScript, so this proves the app renders what the database hands back in the order it
 * hands it back, not that the SQL itself is right. Keep `views` in database.ts in step
 * with dataModel.sql.
 */

const rowText = (page: import('@playwright/test').Page) =>
  page.locator('.MuiDataGrid-row').allInnerTexts();

test('inactive kids and deliverers sort below the active ones', async ({
  page,
}) => {
  const {db} = await mockSupabase(page);

  const addKid = (first: string, is_active: boolean) =>
    db.kid.push({
      id: `kid-${first}`,
      parent_id: PARENT_ID,
      first_name: first,
      last_name: 'Okafor',
      gender: 'F',
      birth_date: '2024-01-01',
      diaper_size: '2',
      is_active,
      is_deleted: false,
      notes: null,
    });
  // Seeded deliberately out of order, and the two inactive kids are alphabetically first:
  // insertion order and name order both differ from the answer.
  addKid('Zara', true);
  addKid('Bilal', false);
  addKid('Amina', true);

  // Unshifted, so insertion order alone would put the retired volunteer first: the
  // assertion below only passes if the `order=` on the query actually took effect.
  db.deliverer.unshift({
    id: 'deliverer-abe',
    name: 'Abe Retired',
    email: 'abe@example.org',
    phone_number: '555-0199',
    is_active: false,
    is_deleted: false,
    notes: null,
  });

  await signIn(page);

  await page.goto('/oasis/#/kids');
  await expect(page.getByRole('link', {name: 'Amina Okafor'})).toBeVisible();
  expect((await rowText(page)).map((row) => row.split('\n')[1])).toEqual([
    'Amina Okafor',
    'Chidi Okafor',
    'Zara Okafor',
    'Bilal Okafor',
  ]);

  // Below `sm` the Active chip is one of the hidden columns, so the dimmed row class is
  // the only thing left saying a kid has aged out.
  await expect(page.locator('.oasis-row--inactive')).toHaveCount(1);

  await page.goto('/oasis/#/deliverers');
  await expect(page.getByRole('link', {name: 'Rosa Delgado'})).toBeVisible();
  expect((await rowText(page)).map((row) => row.split('\n')[1])).toEqual([
    'Rosa Delgado',
    'Abe Retired',
  ]);

  // The same rule in the family form's deliverer dropdown, which reads deliverer_options.
  await page.goto('/oasis/#/parent/new');
  await page.getByLabel('Planned Deliverer').click();
  expect(await page.getByRole('option').allInnerTexts()).toEqual([
    'Rosa Delgado',
    'Abe Retired (INACTIVE)',
  ]);
});

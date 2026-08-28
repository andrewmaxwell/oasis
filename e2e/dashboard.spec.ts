import {expect, test} from '@playwright/test';
import {mockSupabase, signIn} from './fixtures/supabaseMock.ts';
import {PARENT_ID} from './fixtures/database.ts';

/**
 * The dashboard's counts have to agree with the rest of the app. "Active Kids" used to
 * count the `kid` table on the kid's own flags alone, so a child whose family had been
 * deactivated or deleted stayed on the front page as active while the Kids list hid them
 * and the monthly order skipped them. The count reads `rostered_kid_view` now.
 */

/** The number rendered above a stat card's label. */
const statValue = (page: import('@playwright/test').Page, label: string) =>
  page.locator('.MuiCard-root', {hasText: label}).locator('h3').first();

test('active kid count excludes kids whose family is gone or inactive', async ({
  page,
}) => {
  const {db} = await mockSupabase(page);

  const addFamily = (id: string, is_active: boolean, is_deleted: boolean) => {
    db.parent.push({
      id,
      first_name: id,
      last_name: 'Test',
      address: '1 Test St',
      city: 'Springfield',
      zip: '62704',
      phone_number: '555-0000',
      country_of_origin: 'Nigeria',
      rough_family_income: 20000,
      deliverer_id: null,
      is_active,
      is_deleted,
      notes: null,
    });
    db.kid.push({
      id: `kid-${id}`,
      parent_id: id,
      first_name: `Child of ${id}`,
      last_name: 'Test',
      gender: 'F',
      birth_date: '2024-01-01',
      diaper_size: '2',
      // Active children in every case: the only thing disqualifying them is the family.
      is_active: true,
      is_deleted: false,
      notes: null,
    });
  };

  addFamily('inactive-family', false, false);
  addFamily('deleted-family', true, true);

  await signIn(page);

  // Three active kid rows in the table, but only the seed family is still on the roster.
  await expect(statValue(page, 'Active Kids')).toHaveText('1');
  await expect(statValue(page, 'Active Families')).toHaveText('1');

  // And a kid of a family that is merely inactive still belongs in the Kids list — the
  // count is narrower than the list on purpose.
  await page.goto('/oasis/#/kids');
  await expect(
    page.locator('.MuiDataGrid-row', {hasText: 'Child of inactive-family'}),
  ).toBeVisible();
  await expect(
    page.locator('.MuiDataGrid-row', {hasText: 'Child of deleted-family'}),
  ).toHaveCount(0);

  // The seed family's own child is untouched by any of this.
  expect(db.kid.filter((k) => k.parent_id === PARENT_ID)).toHaveLength(1);
});

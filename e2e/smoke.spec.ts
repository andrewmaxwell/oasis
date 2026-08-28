import {expect, test} from '@playwright/test';
import {mockSupabase, signIn} from './fixtures/supabaseMock.ts';

/**
 * The core flow, end to end: sign in → add a family → add a child → create the monthly
 * order → check the totals it froze (ROADMAP §6.3).
 *
 * This is the regression net the `react-router` bump was waiting on (ISSUES #44): it walks
 * five routes, a redirect after save, two hash-router navigations, and the unsaved-changes
 * blocker, so a routing break cannot pass silently.
 */

test('sign in, add a family and a child, then create the monthly order', async ({
  page,
}) => {
  const {db} = await mockSupabase(page);
  await signIn(page);

  // --- The dashboard renders once the session lands ------------------------------------
  await expect(
    page.getByRole('link', {name: 'Families'}).first(),
  ).toBeVisible();

  // --- The roster shows what the fixture seeded ----------------------------------------
  await page.getByRole('link', {name: 'Families'}).first().click();
  await expect(page.getByRole('link', {name: 'Amara Okafor'})).toBeVisible();
  await expect(page.getByText('(1 active parents, 1 kids)')).toBeVisible();

  // --- Add a family --------------------------------------------------------------------
  await page.getByRole('button', {name: 'Add Parent'}).click();
  await page.getByLabel('First Name').fill('Fatima');
  await page.getByLabel('Last Name').fill('Hassan');
  await page.getByLabel('Phone Number').fill('555-0122');
  await page.getByLabel('Address').fill('88 Cedar Ave');
  await page.getByLabel('City').fill('Springfield');
  await page.getByLabel('Zip Code').fill('62704');
  await page.getByLabel('Planned Deliverer').click();
  await page.getByRole('option', {name: 'Rosa Delgado'}).click();
  await page.getByRole('button', {name: 'Save'}).click();

  await expect(page.getByText('Family saved')).toBeVisible();
  // Saving a new family redirects to its own page, which is where the kid is added from.
  await expect(page).toHaveURL(/#\/parent\/[0-9a-f-]+$/);
  expect(db.parent).toHaveLength(2);

  // --- Add a child to that family ------------------------------------------------------
  await page.getByRole('button', {name: 'Add Kid'}).click();
  // Wait for the route before touching any field: the parent form has a "Last Name" too,
  // so asserting on the field alone matches the page being navigated away from and the
  // typing lands on the wrong form.
  await expect(page).toHaveURL(/#\/kid\/new\?/);
  await expect(page.getByRole('heading', {name: 'Kid Info'})).toBeVisible();
  // The link pre-fills parent and surname from the query string; only the rest is typed.
  await expect(page.getByLabel('Last Name')).toHaveValue('Hassan');
  await page.getByLabel('First Name').fill('Yusuf');
  await page.getByLabel('Birth Date').fill('2025-01-15');
  await page.getByLabel('Diaper Size').click();
  // Size 1 is one of the 75-diaper sizes; the seeded child is a size 3, worth 50.
  await page.getByRole('option', {name: '1', exact: true}).click();
  await page.getByRole('button', {name: 'Save'}).click();

  await expect(page.getByText('Child saved')).toBeVisible();
  expect(db.kid).toHaveLength(2);

  // --- Create the order ----------------------------------------------------------------
  await page.getByRole('link', {name: 'Orders'}).first().click();
  await page.getByRole('button', {name: 'Add Order'}).click();

  // The new-order page previews the totals before anything is written. `exact` matters:
  // the per-deliverer table below carries the same numbers in one combined cell.
  await expect(page.getByText('75 of size 1', {exact: true})).toBeVisible();
  await expect(page.getByText('50 of size 3', {exact: true})).toBeVisible();
  // Both families are Rosa's, so her row is the combined total.
  await expect(
    page.getByRole('cell', {name: '75 of size 1, 50 of size 3'}),
  ).toBeVisible();

  await page.getByLabel('Date of Order').fill('2026-09-01');
  await page.getByLabel('Date of Pickup').fill('2026-09-08');
  await page.getByRole('button', {name: 'Save'}).click();

  await expect(page.getByText('Order created')).toBeVisible();
  await expect(page).toHaveURL(/#\/order\/[0-9a-f-]+$/);

  // --- The snapshot froze the right numbers --------------------------------------------
  // Scoped to the Totals panel: this page also lists the same numbers per family and per
  // zip, so an unscoped match would be ambiguous and would not prove it is the total.
  const totalsPanel = page
    .locator('.MuiPaper-root')
    .filter({has: page.getByRole('heading', {name: 'Totals', exact: true})});
  await expect(
    totalsPanel.getByText('75 of size 1', {exact: true}),
  ).toBeVisible();
  await expect(
    totalsPanel.getByText('50 of size 3', {exact: true}),
  ).toBeVisible();

  // Both families were snapshotted, each with its child's size and quantity copied in —
  // the denormalization that keeps a past order stable when a size changes later.
  expect(db.order_record).toHaveLength(1);
  expect(db.order_parent).toHaveLength(2);
  expect(db.order_kid).toEqual([
    expect.objectContaining({diaper_size: '3', diaper_quantity: 50}),
    expect.objectContaining({diaper_size: '1', diaper_quantity: 75}),
  ]);
});

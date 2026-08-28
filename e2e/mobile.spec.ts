import {expect, test} from '@playwright/test';
import {mockSupabase, signIn} from './fixtures/supabaseMock.ts';

/**
 * The phone case (ISSUES #30). Volunteers read this roster in a car, and the two ways it
 * used to fail there were silent: the grid's fixed-height toolbar slot clipped the search
 * box and the Add button behind the column headers, and fixed pixel column widths pushed
 * the table wider than the screen.
 */

test.use({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});

test('the roster is usable on a phone', async ({page}) => {
  await mockSupabase(page);
  await signIn(page);
  await page.goto('/oasis/#/parents');

  const addButton = page.getByRole('button', {name: 'Add Parent'});
  const search = page.getByPlaceholder('Search...');
  await expect(addButton).toBeVisible();
  await expect(search).toBeVisible();

  // "Visible" is not enough: the old bug left both painted but sliced off by the column
  // headers, so pin that they are wholly on screen and not underneath anything else.
  for (const control of [addButton, search]) {
    const box = (await control.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  const headerTop = (await page.getByText('Name', {exact: true}).boundingBox())!
    .y;
  expect((await addButton.boundingBox())!.y).toBeLessThan(headerTop);

  // Only the mobileColumns survive, so the table fits without a sideways scroll.
  await expect(page.getByText('Address', {exact: true})).toBeVisible();
  await expect(page.getByText('City', {exact: true})).toBeHidden();
  await expect(page.getByRole('link', {name: 'Amara Okafor'})).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);

  // The search box drives the grid now that it lives outside the toolbar slot.
  await search.fill('Okafor');
  await expect(page.getByRole('link', {name: 'Amara Okafor'})).toBeVisible();
  // And it still searches the columns a phone hides — the grid excludes those from quick
  // filtering by default, which would leave a volunteer unable to look a family up by zip
  // or phone number, which is most of why anyone searches from a car.
  await search.fill('62704');
  await expect(page.getByRole('link', {name: 'Amara Okafor'})).toBeVisible();
  await search.fill('zzz');
  await expect(page.getByText('No parents match “zzz”.')).toBeVisible();
});

const { test, expect } = require('@playwright/test');
const { combineVia } = require('./helpers');

test.describe('workshop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('starts with 4 shelf items and 0 / 20', async ({ page }) => {
    await expect(page.locator('#shelf [data-item]')).toHaveCount(4);
    await expect(page.locator('#found-count')).toHaveText('0 / 20');
    await expect(page.locator('#combine')).toBeDisabled();
  });

  test('valid combine adds an item, a book entry, and flavor text', async ({ page }) => {
    await combineVia(page, 'brass', 'ember');
    await expect(page.locator('#shelf [data-item="molten_brass"]')).toBeVisible();
    await expect(page.locator('#found-count')).toHaveText('1 / 20');
    await expect(page.locator('#recipe-book li')).toHaveText(['Brass + Ember → Molten Brass']);
    await expect(page.locator('#message')).toContainText('Liquid sunset');
    await expect(page.locator('#slot-a')).not.toHaveAttribute('data-filled', /.+/);
    await expect(page.locator('#slot-b')).not.toHaveAttribute('data-filled', /.+/);
  });

  test('reversed order and self-combine work', async ({ page }) => {
    await combineVia(page, 'ember', 'brass');
    await expect(page.locator('#shelf [data-item="molten_brass"]')).toBeVisible();
    await combineVia(page, 'brass', 'brass');
    await expect(page.locator('#shelf [data-item="gear"]')).toBeVisible();
    await expect(page.locator('#found-count')).toHaveText('2 / 20');
  });

  test('dud shows smoke and adds nothing', async ({ page }) => {
    await combineVia(page, 'brass', 'quicksilver');
    await expect(page.locator('#crucible')).toHaveClass(/smoke/);
    await expect(page.locator('#shelf [data-item]')).toHaveCount(4);
    await expect(page.locator('#message')).toContainText('Nothing');
    await expect(page.locator('#found-count')).toHaveText('0 / 20');
  });

  test('known pair says already known', async ({ page }) => {
    await combineVia(page, 'brass', 'ember');
    await combineVia(page, 'brass', 'ember');
    await expect(page.locator('#message')).toContainText('already');
    await expect(page.locator('#found-count')).toHaveText('1 / 20');
  });

  test('hint appears after 3 duds and clears after a discovery', async ({ page }) => {
    await expect(page.locator('#hint')).toBeHidden();
    for (let i = 0; i < 3; i++) await combineVia(page, 'brass', 'quicksilver');
    await expect(page.locator('#hint')).toBeVisible();
    await expect(page.locator('#hint')).not.toHaveText('');
    await combineVia(page, 'brass', 'ember');
    await expect(page.locator('#hint')).toBeHidden();
  });

  test('combine with one slot empty is impossible', async ({ page }) => {
    await page.locator('#shelf [data-item="brass"]').click();
    await expect(page.locator('#slot-a')).toHaveAttribute('data-filled', 'brass');
    await expect(page.locator('#slot-b')).not.toHaveAttribute('data-filled', /.+/);
    await expect(page.locator('#combine')).toBeDisabled();
  });

  test('one click fills the next empty slot, and clicking a filled slot empties it', async ({ page }) => {
    await page.locator('#shelf [data-item="brass"]').click();
    await expect(page.locator('#slot-a')).toHaveAttribute('data-filled', 'brass');
    await page.locator('#shelf [data-item="ember"]').click();
    await expect(page.locator('#slot-b')).toHaveAttribute('data-filled', 'ember');
    await page.locator('#shelf [data-item="quicksilver"]').click();
    await expect(page.locator('#slot-b')).toHaveAttribute('data-filled', 'quicksilver');
    await expect(page.locator('#slot-a')).toHaveAttribute('data-filled', 'brass');
    await page.locator('#slot-a').click();
    await expect(page.locator('#slot-a')).not.toHaveAttribute('data-filled', /.+/);
  });

  test('self-combine with two clicks on the same item', async ({ page }) => {
    const brass = page.locator('#shelf [data-item="brass"]');
    await brass.click();
    await brass.click();
    await expect(page.locator('#slot-a')).toHaveAttribute('data-filled', 'brass');
    await expect(page.locator('#slot-b')).toHaveAttribute('data-filled', 'brass');
    await page.locator('#combine').click();
    await expect(page.locator('#shelf [data-item="gear"]')).toBeVisible();
  });

  test('double-clicking Combine discovers once', async ({ page }) => {
    await page.locator('#shelf [data-item="brass"]').click();
    await page.locator('#shelf [data-item="ember"]').click();
    await page.locator('#combine').dblclick();
    await expect(page.locator('#shelf [data-item]')).toHaveCount(5);
    await expect(page.locator('#found-count')).toHaveText('1 / 20');
    await expect(page.locator('#crucible')).not.toHaveClass(/smoke/);
  });
});

// Regression guard: a deployed game must never open to a finished run.
// No beforeEach here: no clearing, no reload, just Playwright's fresh context.
test.describe('first visit', () => {
  test('a first-time visitor starts a fresh game', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => localStorage.getItem('tinheart.v1'))).toBeNull();
    await expect(page.locator('#found-count')).toHaveText('0 / 20');
    await expect(page.locator('#shelf [data-item]')).toHaveCount(4);
    await expect(page.locator('#recipe-book li')).toHaveCount(0);
    await expect(page.locator('#ending')).toBeHidden();
    await expect(page.locator('#companion')).not.toHaveClass(/\balive\b/);
  });
});

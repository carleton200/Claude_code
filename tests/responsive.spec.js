const { test, expect } = require('@playwright/test');
const { combineVia, playToEnd } = require('./helpers');

async function resetStorage(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

test('drag-and-drop combines and installs', async ({ page }) => {
  await resetStorage(page);
  await expect(page.locator('#shelf [data-item="brass"]')).toHaveAttribute('draggable', 'true');

  await page.locator('#shelf [data-item="brass"]').dragTo(page.locator('#slot-a'));
  await expect(page.locator('#slot-a')).toHaveAttribute('data-filled', 'brass');
  await page.locator('#shelf [data-item="ember"]').dragTo(page.locator('#slot-b'));
  await expect(page.locator('#slot-b')).toHaveAttribute('data-filled', 'ember');
  await page.locator('#combine').click();
  await expect(page.locator('#shelf [data-item="molten_brass"]')).toBeVisible();
  await expect(page.locator('#found-count')).toHaveText('1 / 20');

  for (const [a, b] of [['brass', 'brass'], ['molten_brass', 'gear'], ['ember', 'quicksilver'],
    ['living_vapor', 'moth_wing'], ['cog_shell', 'breath']]) {
    await combineVia(page, a, b);
  }
  await expect(page.locator('#shelf [data-item="left_chamber"]')).toBeVisible();

  // A wrong socket rejects the dropped part, the matching one accepts it.
  await page.locator('#shelf [data-item="left_chamber"]').dragTo(page.locator('#chest [data-slot="right_chamber"]'));
  await expect(page.locator('#chest [data-slot="right_chamber"]')).not.toHaveAttribute('data-installed', /.+/);
  await page.locator('#shelf [data-item="left_chamber"]').dragTo(page.locator('#chest [data-slot="left_chamber"]'));
  await expect(page.locator('#chest [data-slot="left_chamber"]')).toHaveAttribute('data-installed', 'left_chamber');
  await expect(page.locator('#shelf [data-item="left_chamber"]')).toHaveClass(/installed/);
});

test('phone width: panels stack and a full playthrough works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await resetStorage(page);
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(w).toBeLessThanOrEqual(375);
  const [s, c, p] = await Promise.all(['#shelf', '#crucible', '#companion-panel'].map(sel => page.locator(sel).boundingBox()));
  expect(c.y).toBeGreaterThan(s.y + s.height - 1);
  expect(p.y).toBeGreaterThan(c.y + c.height - 1);
  await playToEnd(page);
  await expect(page.locator('#ending')).toBeVisible();
  const wEnd = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(wEnd).toBeLessThanOrEqual(375);
});

test('works when opened from file://', async ({ page }) => {
  const url = require('url').pathToFileURL(require('path').resolve(__dirname, '..', 'index.html')).href;
  await page.goto(url);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* file:// storage may be blocked */ } });
  await page.reload();
  await combineVia(page, 'brass', 'ember');
  await expect(page.locator('#found-count')).toHaveText('1 / 20');
});

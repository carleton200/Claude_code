const { test, expect } = require('@playwright/test');
const { combineVia, dismissIntro, playToEnd } = require('./helpers');

// Each test gets Playwright's fresh context: no save, so the first load is a new game.
test.describe('opening message', () => {
  test('first visit shows the opening message', async ({ page }) => {
    await page.goto('/');
    const intro = page.locator('#intro');
    await expect(intro).toBeVisible();
    await expect(intro).toContainText('The old clockmaker left one job unfinished.');
    await expect(intro).toContainText('Build it a heart.');
    await expect(page.locator('#intro-start')).toHaveText('Light the forge');
    await expect(page.locator('#intro-start')).toBeFocused();
  });

  test('Light the forge closes it and the workshop works', async ({ page }) => {
    await page.goto('/');
    await page.locator('#intro-start').click();
    await expect(page.locator('#intro')).toBeHidden();
    await combineVia(page, 'brass', 'ember');
    await expect(page.locator('#found-count')).toHaveText('1 / 20');
  });

  test('Escape closes it', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#intro')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#intro')).toBeHidden();
  });

  test('it blocks the workshop while open', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#intro')).toBeVisible();
    const brass = page.locator('#shelf [data-item="brass"]');
    // The topmost element at the shelf item's center belongs to the card's overlay.
    const box = await brass.boundingBox();
    const onTop = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y).closest('#intro'),
      [box.x + box.width / 2, box.y + box.height / 2]);
    expect(onTop).toBe(true);
    // Playwright sees the click intercepted and never performs it.
    await expect(brass.click({ trial: true, timeout: 1500 })).rejects.toThrow(/Timeout/);
    await expect(page.locator('#slot-a')).not.toHaveAttribute('data-filled', /.+/);
  });

  test('returning to a game in progress skips it', async ({ page }) => {
    await page.goto('/');
    await dismissIntro(page);
    await combineVia(page, 'brass', 'ember');
    await page.reload();
    await expect(page.locator('#found-count')).toHaveText('1 / 20');
    await expect(page.locator('#intro')).toHaveCount(1); // present in the page, just closed
    await expect(page.locator('#intro')).toBeHidden();
  });

  test('Play again shows it again', async ({ page }) => {
    await page.goto('/');
    await dismissIntro(page);
    await playToEnd(page);
    await page.locator('#play-again').click();
    await expect(page.locator('#intro')).toBeVisible();
    await expect(page.locator('#intro-start')).toBeFocused();
  });
});

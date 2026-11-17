const { test, expect } = require('@playwright/test');
const { combineVia, installVia, dismissIntro, playToEnd } = require('./helpers');

test.describe('companion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await dismissIntro(page);
  });

  async function craftLeftChamber(page) {
    for (const [a, b] of [['brass', 'ember'], ['brass', 'brass'], ['molten_brass', 'gear'],
      ['ember', 'quicksilver'], ['living_vapor', 'moth_wing'], ['cog_shell', 'breath']]) {
      await combineVia(page, a, b);
    }
    await expect(page.locator('#shelf [data-item="left_chamber"]')).toBeVisible();
  }

  test('chest shows 5 empty slots', async ({ page }) => {
    await expect(page.locator('#chest [data-slot]')).toHaveCount(5);
    await expect(page.locator('#chest [data-installed]')).toHaveCount(0);
  });

  test('wrong part is rejected with a shake', async ({ page }) => {
    await craftLeftChamber(page);
    const slot = page.locator('#chest [data-slot="right_chamber"]');
    await page.locator('#shelf [data-item="left_chamber"]').dragTo(slot);
    await expect(slot).toHaveClass(/shake/);
    await expect(slot).not.toHaveAttribute('data-installed', /.+/);
  });

  test('one click on a crafted heart part installs it', async ({ page }) => {
    await craftLeftChamber(page);
    await page.locator('#shelf [data-item="left_chamber"]').click();
    await expect(page.locator('#chest [data-slot="left_chamber"]')).toHaveAttribute('data-installed', 'left_chamber');
    await expect(page.locator('#slot-a')).not.toHaveAttribute('data-filled', /.+/);
  });

  test('clicking an installed part says already installed', async ({ page }) => {
    await craftLeftChamber(page);
    const part = page.locator('#shelf [data-item="left_chamber"]');
    await part.click();
    await expect(page.locator('#chest [data-slot="left_chamber"]')).toHaveAttribute('data-installed', 'left_chamber');
    await part.click();
    await expect(page.locator('#message')).toContainText('already installed');
    await expect(page.locator('#slot-a')).not.toHaveAttribute('data-filled', /.+/);
    await expect(page.locator('#slot-b')).not.toHaveAttribute('data-filled', /.+/);
    await expect(page.locator('#chest [data-installed]')).toHaveCount(1);
  });

  test('correct part installs and greys out on the shelf', async ({ page }) => {
    await craftLeftChamber(page);
    await installVia(page, 'left_chamber');
    const slot = page.locator('#chest [data-slot="left_chamber"]');
    await expect(slot).toHaveAttribute('data-installed', 'left_chamber');
    await expect(page.locator('#shelf [data-item="left_chamber"]')).toHaveClass(/installed/);
    await installVia(page, 'left_chamber');
    await expect(slot).toHaveAttribute('data-installed', 'left_chamber');
    await expect(page.locator('#chest [data-installed]')).toHaveCount(1);
  });

  test('progress survives a reload', async ({ page }) => {
    await combineVia(page, 'brass', 'ember');
    await page.reload();
    await expect(page.locator('#found-count')).toHaveText('1 / 20');
    await expect(page.locator('#shelf [data-item="molten_brass"]')).toBeVisible();
  });

  test('full playthrough reaches the ending', async ({ page }) => {
    await playToEnd(page);
    await expect(page.locator('#companion')).toHaveClass(/alive/);
    await expect(page.locator('#ending')).toBeVisible();
    await expect(page.locator('#found-count')).toHaveText('18 / 20');
  });

  test('reload after ending shows finished state without replaying', async ({ page }) => {
    await playToEnd(page);
    await page.reload();
    await expect(page.locator('#companion')).toHaveClass(/alive/);
    await expect(page.locator('#ending')).toBeVisible();
    await expect(page.locator('#ending')).not.toHaveClass(/intro/);
  });

  test('Play again resets everything', async ({ page }) => {
    await playToEnd(page);
    await page.locator('#play-again').click();
    await expect(page.locator('#shelf [data-item]')).toHaveCount(4);
    await expect(page.locator('#found-count')).toHaveText('0 / 20');
    await expect(page.locator('#ending')).toBeHidden();
    await page.reload();
    await expect(page.locator('#found-count')).toHaveText('0 / 20');
  });
});

test.describe('blocked storage', () => {
  test('game is playable when storage throws', async ({ page }) => {
    await page.addInitScript(() => {
      const boom = () => { throw new Error('blocked'); };
      Storage.prototype.getItem = boom; Storage.prototype.setItem = boom; Storage.prototype.removeItem = boom;
    });
    const errors = []; page.on('pageerror', e => errors.push(e));
    await page.goto('/');
    // Storage throws, so every load is a new game and the opening card shows each time.
    await dismissIntro(page);
    await combineVia(page, 'brass', 'ember');
    await expect(page.locator('#found-count')).toHaveText('1 / 20');
    expect(errors).toEqual([]);
  });
});

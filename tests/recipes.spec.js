const { test, expect } = require('@playwright/test');
const data = page => page.evaluate(() => {
  const T = window.TinHeart;
  return { ITEMS: T.ITEMS, RECIPES: T.RECIPES, START: T.STARTING_ITEMS, SLOTS: T.HEART_SLOTS };
});

test('exactly 20 recipes with distinct results', async ({ page }) => {
  await page.goto('/');
  const { RECIPES } = await data(page);
  expect(RECIPES).toHaveLength(20);
  expect(new Set(RECIPES.map(r => r.result)).size).toBe(20);
});

test('no duplicate input pairs (order-independent)', async ({ page }) => {
  await page.goto('/');
  const { RECIPES } = await data(page);
  const keys = RECIPES.map(r => [r.a, r.b].sort().join('+'));
  expect(new Set(keys).size).toBe(keys.length);
});

test('every recipe input and result is a defined item', async ({ page }) => {
  await page.goto('/');
  const { ITEMS, RECIPES } = await data(page);
  for (const r of RECIPES) for (const id of [r.a, r.b, r.result]) expect(ITEMS[id], id).toBeTruthy();
});

test('every heart part is reachable from the starting items', async ({ page }) => {
  await page.goto('/');
  const { RECIPES, START, SLOTS } = await data(page);
  const have = new Set(START);
  let grew = true;
  while (grew) { grew = false;
    for (const r of RECIPES) if (have.has(r.a) && have.has(r.b) && !have.has(r.result)) { have.add(r.result); grew = true; } }
  for (const s of SLOTS) expect(have.has(s), s).toBe(true);
  expect(have.size).toBe(24);
});

test('findRecipe is order-independent and null for duds', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const T = window.TinHeart;
    return [T.findRecipe('brass','ember')?.result, T.findRecipe('ember','brass')?.result, T.findRecipe('brass','quicksilver')];
  });
  expect(r).toEqual(['molten_brass', 'molten_brass', null]);
});

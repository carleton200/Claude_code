const { expect } = require('@playwright/test');

async function combineVia(page, a, b) {
  await page.locator(`#shelf [data-item="${a}"]`).click();
  await page.locator('#slot-a').click();
  await page.locator(`#shelf [data-item="${b}"]`).click();
  await page.locator('#slot-b').click();
  await page.locator('#combine').click();
}

module.exports = { combineVia, expect };

const { expect } = require('@playwright/test');

async function combineVia(page, a, b) {
  await page.locator(`#shelf [data-item="${a}"]`).click();
  await page.locator(`#shelf [data-item="${b}"]`).click();
  await page.locator('#combine').click();
}

async function installVia(page, part) {
  await page.locator(`#shelf [data-item="${part}"]`).click();
}

const PLAYTHROUGH = [
  ['brass', 'ember'], ['brass', 'brass'], ['molten_brass', 'gear'], ['ember', 'quicksilver'],
  ['living_vapor', 'moth_wing'], ['cog_shell', 'breath'], ['cog_shell', 'living_vapor'],
  ['quicksilver', 'moth_wing'], ['brass', 'moth_wing'], ['silver_feather', 'gilded_wing'],
  ['flutter_membrane', 'gear'], ['ember', 'ember'], ['spark', 'quicksilver'],
  ['quicksilver', 'quicksilver'], ['mirror_drop', 'ember'], ['lightning_bead', 'glow_glass'],
  ['gear', 'spark'], ['ticking_gear', 'silver_feather']
];

async function playToEnd(page, { combine = combineVia, install = installVia } = {}) {
  for (const [a, b] of PLAYTHROUGH) await combine(page, a, b);
  for (const part of ['left_chamber', 'right_chamber', 'flutter_valve', 'spark_core', 'rhythm_spring']) {
    await install(page, part);
  }
}

module.exports = { combineVia, installVia, PLAYTHROUGH, playToEnd, expect };

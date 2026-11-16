const { test, expect } = require('@playwright/test');

const KEY = 'tinheart.v1';
const ALL = ['brass', 'ember', 'quicksilver', 'moth_wing', 'molten_brass', 'living_vapor', 'silver_feather', 'gilded_wing', 'spark', 'gear', 'mirror_drop', 'cog_shell', 'ticking_gear', 'breath', 'flutter_membrane', 'glow_glass', 'lightning_bead', 'left_chamber', 'right_chamber', 'flutter_valve', 'spark_core', 'rhythm_spring', 'ash', 'firefly'];

test('newState starts with the 4 base items and nothing found', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const T = window.TinHeart; const s = T.newState();
    return { s, found: T.foundCount(s) };
  });
  expect(r.s.discovered).toEqual(['brass', 'ember', 'quicksilver', 'moth_wing']);
  expect(r.s.installed).toEqual({});
  expect(r.found).toBe(0);
  expect(r.s.failStreak).toBe(0);
  expect(r.s.hint).toBeNull();
  expect(r.s.finished).toBe(false);
});

test('combine: new discovery adds result and resets failStreak', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const T = window.TinHeart;
    const s = { ...T.newState(), failStreak: 2, hint: 'old' };
    const out = T.combine(s, 'brass', 'ember');
    return { outcome: out.outcome, result: out.result, d: out.state.discovered, fs: out.state.failStreak, hint: out.state.hint, found: T.foundCount(out.state) };
  });
  expect(r.outcome).toBe('new');
  expect(r.result).toBe('molten_brass');
  expect(r.d).toContain('molten_brass');
  expect(r.fs).toBe(0);
  expect(r.hint).toBeNull();
  expect(r.found).toBe(1);
});

test('combine: known recipe does not change discovered or failStreak', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const T = window.TinHeart;
    let s = T.combine(T.newState(), 'brass', 'ember').state;
    s = { ...s, failStreak: 2 };
    const out = T.combine(s, 'ember', 'brass');
    return { outcome: out.outcome, result: out.result, before: s.discovered.length, after: out.state.discovered.length, fs: out.state.failStreak };
  });
  expect(r.outcome).toBe('known');
  expect(r.result).toBe('molten_brass');
  expect(r.after).toBe(r.before);
  expect(r.fs).toBe(2);
});

test('combine: dud increments failStreak; third dud sets a hint', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const T = window.TinHeart; let s = T.newState(); const log = [];
    for (let i = 0; i < 3; i++) {
      const out = T.combine(s, 'brass', 'quicksilver'); s = out.state;
      log.push({ o: out.outcome, res: out.result, fs: s.failStreak, hint: s.hint });
    }
    return log;
  });
  expect(r.map(x => x.o)).toEqual(['dud', 'dud', 'dud']);
  expect(r.map(x => x.res)).toEqual([null, null, null]);
  expect(r.map(x => x.fs)).toEqual([1, 2, 3]);
  expect(r[0].hint).toBeNull();
  expect(r[1].hint).toBeNull();
  expect(typeof r[2].hint).toBe('string');
  expect(r[2].hint.length).toBeGreaterThan(0);
});

test('combine: self-combine works', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => { const T = window.TinHeart; const out = T.combine(T.newState(), 'brass', 'brass'); return { o: out.outcome, res: out.result }; });
  expect(r).toEqual({ o: 'new', res: 'gear' });
});

test('combine with an undiscovered input changes nothing', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => { const T = window.TinHeart; const s = T.newState(); const out = T.combine(s, 'gear', 'brass'); return { same: out.state === s, result: out.result }; });
  expect(r).toEqual({ same: true, result: null });
});

test('combine with an undiscovered input is a dud outcome with no failStreak change', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => { const T = window.TinHeart; const s = T.newState(); const out = T.combine(s, 'gear', 'brass'); return { o: out.outcome, fs: out.state.failStreak }; });
  expect(r).toEqual({ o: 'dud', fs: 0 });
});

test('combine does not mutate the input state', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const T = window.TinHeart; const s = T.newState();
    const before = JSON.stringify(s);
    T.combine(s, 'brass', 'ember'); T.combine(s, 'brass', 'quicksilver'); T.combine(s, 'brass', 'brass');
    return { same: JSON.stringify(s) === before };
  });
  expect(r.same).toBe(true);
});

test('install accepts only the matching discovered part into an empty slot', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const T = window.TinHeart;
    const s = { ...T.newState(), discovered: [...T.newState().discovered, 'left_chamber'] };
    const wrong = T.install(s, 'left_chamber', 'right_chamber');
    const right = T.install(s, 'left_chamber', 'left_chamber');
    const again = T.install(right.state, 'left_chamber', 'left_chamber');
    const undisc = T.install(T.newState(), 'spark_core', 'spark_core');
    return { wrong: wrong.ok, right: right.ok, installed: right.state.installed, again: again.ok, undisc: undisc.ok, orig: s.installed };
  });
  expect(r.wrong).toBe(false);
  expect(r.right).toBe(true);
  expect(r.installed).toEqual({ left_chamber: 'left_chamber' });
  expect(r.again).toBe(false);
  expect(r.undisc).toBe(false);
  expect(r.orig).toEqual({});
});

test('install of all 5 sets finished', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate((ALL) => {
    const T = window.TinHeart; let s = { ...T.newState(), discovered: ALL.slice() }; const fin = [];
    for (const p of T.HEART_SLOTS) { const out = T.install(s, p, p); s = out.state; fin.push(s.finished); }
    const after = T.install(s, 'left_chamber', 'left_chamber').ok;
    return { fin, after };
  }, ALL);
  expect(r.fin).toEqual([false, false, false, false, true]);
  expect(r.after).toBe(false);
});

test('pickHint prefers an unfound, currently craftable recipe on a heart-part path', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const T = window.TinHeart;
    const hint = T.pickHint({ ...T.newState(), failStreak: 3 });
    const ok = T.RECIPES.slice(0, 7).map(x => x.hint);
    return { hint, ok, ash: T.RECIPES[18].hint };
  });
  expect(r.ok).toContain(r.hint);
  expect(r.hint).not.toBe(r.ash);
});

test('pickHint when nothing new is craftable but parts are uninstalled', async ({ page }) => {
  await page.goto('/');
  const hint = await page.evaluate((ALL) => {
    const T = window.TinHeart;
    return T.pickHint({ ...T.newState(), discovered: ALL.slice(), failStreak: 3 });
  }, ALL);
  expect(hint).toContain('install');
});

test('save/load round-trips', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(() => {
    const T = window.TinHeart;
    let s = T.combine(T.newState(), 'brass', 'ember').state;
    s = { ...s, failStreak: 2, hint: 'x' };
    T.saveState(s);
    return { s, loaded: T.loadState() };
  });
  expect(r.loaded).toEqual(r.s);
});

test('loadState returns null for corrupted or foreign data', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate((KEY) => {
    const T = window.TinHeart; const out = {};
    out.empty = T.loadState();
    for (const v of ['{oops', '{"discovered":5}', '{}', 'null', '{"discovered":["brass","ember","quicksilver","moth_wing","bogus"],"installed":{},"failStreak":0}', '{"discovered":["brass"],"installed":{},"failStreak":0}']) {
      localStorage.setItem(KEY, v); out[v] = T.loadState();
    }
    localStorage.removeItem(KEY);
    return out;
  }, KEY);
  for (const v of Object.values(r)) expect(v).toBeNull();
});

test('clearSave removes the key', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate((KEY) => {
    const T = window.TinHeart; T.saveState(T.newState());
    const had = localStorage.getItem(KEY) !== null;
    T.clearSave();
    return { had, gone: localStorage.getItem(KEY) === null };
  }, KEY);
  expect(r).toEqual({ had: true, gone: true });
});

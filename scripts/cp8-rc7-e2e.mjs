// cp8-rc7 e2e: P0 auto-alloc school-specific + armour lock through the real 建立新角色 UI → 出發前整備; small bugs (hotkey after 4x / 跳過動畫,
// skip persistence across reload and &fresh preset); P1 item 5 death screen lists last turns.  Usage: node scripts/cp8-rc7-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
const U = BASE + '?cp6&cp8&debug';
async function newChar(sc, setup) {
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(U, { waitUntil: 'networkidle0' }); await pg.evaluate(() => localStorage.clear());
  await pg.goto(U, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300);
  await pg.click('[data-newgame]'); await w(250); await pg.select('[data-newlean]', sc); await pg.click('[data-modal-ok]'); await w(300);
  const base = await pg.evaluate(() => ({ ...window.hv.p.attrs }));
  await pg.evaluate(setup); await w(200);
  await pg.click('[data-start]'); await w(400);
  return { pg, base };
}
for (const sc of ['blade', 'oc', 'bulwark', 'arcane']) {
  const { pg, base } = await newChar(sc, () => { const p = window.hv.p; p.exp = 20000; p.prog ??= { trips: 1, unlocked: [] }; p.prog.unlocked ??= []; p.prog.unlocked.push('alloc'); window.hv.render(); });
  const has = !!(await pg.$('[data-prep="alloc"]')); if (has) { await pg.click('[data-prep="alloc"]'); await w(300); }
  const a = await pg.evaluate(() => ({ ...window.hv.p.attrs })); R[sc] = { has, base, a };
  if (!has) fail.push(`${sc} no alloc row`);
  if (sc !== 'arcane' && sc !== 'oc' && (a.int >= a.str || a.wis >= a.end) /* cp8-rc9 P1-8: leftover EXP may go to the cheapest attr; INT/WIS must stay below STR/END */) fail.push(`${sc} bought INT/WIS`);
  if (sc === 'arcane' && !(a.int > a.end && a.int > a.str)) fail.push('arcane INT not top');
  if (sc === 'bulwark' && !(a.end > a.str)) fail.push('bulwark END<=STR');
  await pg.close();
}
{ // armour lock: arcane wearing heavy legs-equivalent body with an allowed cloth one in the bag
  const { pg } = await newChar('arcane', () => { const p = window.hv.p, e = p.equipped.body; p.equipped.body = { ...e, id: 'x-heavy', group: 'heavy', base: 'plate' }; p.inventory.push({ ...e, id: 'x-cloth', group: 'cloth', base: 'cotton' }); window.hv.render(); });
  const has = !!(await pg.$('[data-prep="equip"]')); if (has) { await pg.click('[data-prep="equip"]'); await w(300); }
  R.lock = { has, body: await pg.evaluate(() => window.hv.p.equipped.body?.group) };
  if (R.lock.body !== 'cloth') fail.push('arcane kept heavy');
  await pg.close();
}
{ // focus + skip persistence + death turns, via the &fresh preset path
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(U, { waitUntil: 'networkidle0' }); await pg.evaluate(() => localStorage.clear());
  await pg.goto(U + '&fresh&preset=postF20-bulwark', { waitUntil: 'networkidle0' }); await w(300);
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  const i = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${i}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
  const press = async () => { await pg.evaluate(() => { const s = window.hv.battle; s.hp = s.d.hp; }); const n0 = await pg.evaluate(() => window.hv.log.length); await pg.keyboard.press('KeyA'); await w(1500); return (await pg.evaluate(() => window.hv.log.length)) > n0; };
  await pg.click('[data-speed="4"]'); await w(200); R.afterSpeed = await press();
  await pg.click('[data-skip]'); await w(200); R.afterSkip = await press();
  if (!R.afterSpeed) fail.push('A dead after 4x'); if (!R.afterSkip) fail.push('A dead after skip');
  await pg.reload({ waitUntil: 'networkidle0' }); await w(400);
  R.reload = await pg.evaluate(() => window.hv.data.settings);
  await pg.goto(U + '&fresh&preset=postF20-bulwark', { waitUntil: 'networkidle0' }); await w(400);
  R.afterFresh = await pg.evaluate(() => window.hv.data.settings);
  for (const [k, v] of [['reload', R.reload], ['fresh', R.afterFresh]]) if (!(v.skipAnim && v.speed === 4)) fail.push(`settings lost on ${k}`);
  // death screen: re-enter a battle, make the enemy lethal, keep attacking
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  const j = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${j}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
  await pg.evaluate(() => { const s = window.hv.battle; for (const m of s.monsters) { m.adb *= 50; m.hp = m.maxHp = 1e7; } });
  for (let k = 0; k < 12 && !(await pg.$('[data-deathturns]')); k++) { await pg.keyboard.press('KeyA'); await w(500); const c = await pg.$('[data-modal-ok]'); if (c && !(await pg.$('[data-deathturns]'))) { /* keep */ } }
  R.death = await pg.evaluate(() => document.querySelector('[data-deathturns]')?.textContent ?? null);
  if (!R.death) fail.push('no death turns');
  await pg.close();
}
R.fail = fail; R.errs = errs; console.log(JSON.stringify(R));
const ok = !fail.length && !errs.length; console.log(ok ? 'CP8 RC7 E2E PASS' : 'CP8 RC7 E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

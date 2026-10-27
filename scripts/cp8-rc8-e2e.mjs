// cp8-rc8 e2e: P2-1 bulwark 防禦 gets +1 block-counter (自訂，非原版，暫定); P2-2 blade/oc see a turn-1 skill hint every fight.
// Usage: node scripts/cp8-rc8-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
async function battle(pg) {
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  const i = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${i}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
  return !!(await pg.$('.cmdbar'));
}
async function page(preset) {
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + `?cp6&cp8&debug&fresh&preset=${preset}`, { waitUntil: 'networkidle0' }); await w(300);
  await pg.evaluate(() => { window.hv.data.settings.skipAnim = true; window.hv.stage.skip = true; });
  return pg;
}
{ // bulwark (1H + shield): 3 always-blocked attackers, counter chance at its 0.75 cap, wprof 0 (cap 1/turn). Defending → up to 2, attacking → ≤1.
  const pg = await page('postF20-bulwark'); R.bwBattle = await battle(pg);
  const round = async (key) => {
    await pg.evaluate(() => { const s = window.hv.battle; const m = s.monsters.find((x) => x.hp > 0); s.monsters = [0, 1, 2].map(() => ({ ...m, hp: 1e7, maxHp: 1e7, charge: 0, pulseNext: false, drainNext: false })); s.d.block = 1e6; s.d.parry = 0; s.d.evade = 0; s.d.wprof = 0; s.d.attrs = { ...s.d.attrs, str: 1e5 }; s.hp = s.d.hp; s.defendTurns = 0; s.over = false; window.hv.render(); });
    const n0 = await pg.evaluate(() => window.hv.log.length);
    await pg.keyboard.press(key); await w(1200);
    return pg.evaluate((n0) => window.hv.log.slice(n0).filter((l) => /反擊（單手）/.test(l)).length, n0);
  };
  R.bwAttack = []; R.bwDefend = [];
  for (let k = 0; k < 6; k++) R.bwAttack.push(await round('KeyA'));
  for (let k = 0; k < 6; k++) R.bwDefend.push(await round('KeyD'));
  if (Math.max(...R.bwAttack) > 1 || Math.max(...R.bwDefend) !== 2) fail.push(`bulwark counters attack ${R.bwAttack} defend ${R.bwDefend}`);
  await pg.close();
}
for (const sc of ['blade', 'oc', 'bulwark']) {
  const pg = await page(`postF20-${sc}`); await battle(pg);
  const t1 = await pg.evaluate(() => document.querySelector('[data-skillhint]')?.textContent ?? null);
  await pg.keyboard.press('KeyA'); await w(2000);
  const t2 = await pg.evaluate(() => !!document.querySelector('[data-skillhint]'));
  R[sc] = { t1, t2 };
  if (sc !== 'bulwark' && (!t1 || t2)) fail.push(`${sc} hint`); if (sc === 'bulwark' && t1) fail.push('bulwark has hint');
  await pg.close();
}
R.fail = fail; R.errs = errs; console.log(JSON.stringify(R));
const ok = !fail.length && !errs.length; console.log(ok ? 'CP8 RC8 E2E PASS' : 'CP8 RC8 E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

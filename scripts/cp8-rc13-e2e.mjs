// cp8-rc13 e2e (real UI): items 1 (HP danger + potion unusable → only S / attack in every decide-panel line), 3 (敵人蓄力中), 4 (no pothint at full HP).
// Usage: node scripts/cp8-rc13-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
const idle = (pg) => pg.waitForFunction(() => !window.hv.busy, { timeout: 5000 }).catch(() => {});
async function open(preset) {
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(preset + ': ' + String(e)));
  await pg.goto(BASE + `?cp6&cp8&debug&fresh&preset=${preset}`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300);
  await pg.evaluate(() => { const h = window.hv; h.data.settings.speed = 4; h.data.settings.skipAnim = true; h.stage.speed = 4; h.stage.skip = true; h.render(); });
  return pg;
}
async function fight(pg) {
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  const ni = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${ni}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
}
const zText = (pg) => pg.evaluate(() => document.querySelector('[data-act="item:health"] small')?.textContent ?? '');

// rc13 item 1/3/4 through the real UI: a normal fight in the bulwark preset; force a telegraph + HP danger + potion cooldown.
{ const pg = await open('postF20-bulwark'); await fight(pg);
  const snap = () => pg.evaluate(() => ({ dec: document.querySelector('[data-decide]')?.textContent ?? '', st: document.querySelector('[data-chargestatus]')?.textContent ?? '',
    dSug: document.querySelector('[data-act="defend"]')?.classList.contains('suggest') ?? null, sSug: !!document.querySelector('[data-act="spirit"].suggest'), pot: !!document.querySelector('[data-pothint]'), boss: window.hv.battle.monsters.some((m) => m.rank === 'boss') }));
  const set = (hpF, cd, oc, pots) => pg.evaluate((hpF, cd, oc, pots) => { const h = window.hv, b = h.battle; const m = b.monsters.find((x) => x.hp > 0); m.charge = 1; b.hp = Math.max(1, Math.round(b.d.hp * hpF)); b.itemCd.health = cd; b.potions.health = pots; b.oc = oc; b.spirit = false; h.render(); }, hpF, cd, oc, pots);
  await set(0.05, 2, 120, 3); R.s = await snap();
  if (!/S·靈動架勢/.test(R.s.dec) || /D·防禦 或|改用 D/.test(R.s.dec) || R.s.dSug || !R.s.sSug) fail.push('1 danger+cd: only S');
  if (!R.s.boss && !/敵人蓄力中/.test(R.s.st)) fail.push('3 normal fight status says 敵人'); if (/首領/.test(R.s.st) && !R.s.boss) fail.push('3 首領 on normal fight');
  await set(0.05, 2, 0, 3); R.n = await snap();
  if (/D·防禦 或|改用 D/.test(R.n.dec) || R.n.dSug || R.n.sSug || !/繼續攻擊|A·攻擊/.test(R.n.dec)) fail.push('1 danger+cd, S unusable: attack, no D');
  await set(0.05, 0, 0, 0); R.e = await snap();
  if (/D·防禦 或|改用 D/.test(R.e.dec) || R.e.dSug) fail.push('1 danger+no potions: no D');
  await set(1, 0, 0, 3); R.f = await snap();
  if (R.f.pot) fail.push('4 pothint at full HP');
  await pg.close(); }
console.log(JSON.stringify({ R, errs, fail }, null, 1));
console.log(fail.length || errs.length ? 'CP8-RC13 E2E FAIL' : 'CP8-RC13 E2E PASS');
await b.close(); process.exit(fail.length || errs.length ? 1 : 0);

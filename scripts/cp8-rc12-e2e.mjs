// cp8-rc12 e2e (real UI). Usage: node scripts/cp8-rc12-e2e.mjs [base]
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
// cp8-rc12 e2e: item 4 potion button shows 「冷卻 N｜剩 M」 during cooldown; item 5 pothint never lit during cooldown, and with HP in
// danger + potion on cooldown the D button is suggested (data-guardhint); Q/W/E follow the style kit (blade 2H → Q = 巨力劈砍).
{ const pg = await open('postF20-blade'); await fight(pg);
  await pg.evaluate(() => { const h = window.hv, s = h.battle, m = s.monsters.find((x) => x.hp > 0); s.monsters = [{ ...m, hp: 1e9, maxHp: 1e9, adb: 1 }]; s.hp = Math.round(s.d.hp * 0.2); h.target = 0; h.render(); });
  await w(200); R.before = await pg.evaluate(() => ({ pot: !!document.querySelector('[data-pothint]'), z: document.querySelector('[data-act="item:health"] small')?.textContent }));
  if (!R.before.pot) fail.push('pothint not lit at 20% HP before drinking');
  await pg.keyboard.press('KeyZ'); await w(1200); await idle(pg);
  await pg.evaluate(() => { const h = window.hv, s = h.battle; s.hp = Math.round(s.d.hp * 0.2); h.render(); }); await w(200);
  R.cd = await pg.evaluate(() => ({ n: window.hv.battle.potions.health, cd: window.hv.battle.itemCd.health, z: document.querySelector('[data-act="item:health"] small')?.textContent, pot: !!document.querySelector('[data-pothint]'), guardS: !!document.querySelector('[data-act="spirit"][data-guardhint].suggest'), canS: window.hv.battle.oc }));
  if (!(R.cd.cd > 0) || R.cd.z !== `冷卻 ${R.cd.cd}｜剩 ${R.cd.n}`) fail.push('item 4 label ' + R.cd.z);
  if (R.cd.pot) fail.push('item 5 pothint lit during cooldown');

  await pg.evaluate(() => { const h = window.hv, s = h.battle; s.oc = 999; s.spirit = false; s.hp = Math.round(s.d.hp * 0.2); h.render(); }); await w(200);
  R.guard = await pg.evaluate(() => ({ cd: window.hv.battle.itemCd.health, s: !!document.querySelector('[data-act="spirit"][data-guardhint].suggest'), pot: !!document.querySelector('[data-pothint]') }));
  if (R.guard.cd > 0 && !R.guard.s) fail.push('item 5 S not hinted (HP danger, potion on cooldown, OC full)');
  if (R.guard.pot) fail.push('item 5 pothint lit during cooldown (2)');
  await pg.evaluate(() => { const h = window.hv, s = h.battle; s.oc = 999; for (const k of Object.keys(s.cooldowns)) s.cooldowns[k] = 0; s.hp = s.d.hp; h.render(); });
  await pg.keyboard.press('KeyQ'); await w(1200); await idle(pg);
  R.q = await pg.evaluate(() => window.hv.battle?.cooldowns);
  if (!(R.q?.greatCleave > 0)) fail.push('Q did not fire the 2H kit skill: ' + JSON.stringify(R.q));
  await pg.close(); }
if (errs.length) fail.push('errs');
console.log(JSON.stringify({ R, errs }));
console.log(fail.length ? `CP8-RC12 E2E FAIL ${fail.join(' | ')}` : 'CP8-RC12 E2E PASS'); await b.close(); process.exit(fail.length ? 1 : 0);

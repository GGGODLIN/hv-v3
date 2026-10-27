// cp8-rc9 e2e: the 蓄力 / 大招 decide panel under 4x + 跳過動畫. A player tapping / holding A must still see the panel and get time
// to react (D / Z) before the charged hit lands. Usage: node scripts/cp8-rc9-charge-e2e.mjs [base] [--measure]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const MEASURE = process.argv.includes('--measure');
const MIN_MS = 500; // 暫定: panel must stay ≥ this long even while A is being spammed
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
await pg.goto(BASE + '?cp6&cp8&debug&fresh&preset=postF20-blade', { waitUntil: 'networkidle0' }); await w(300);
await pg.evaluate(() => { const h = window.hv; h.data.settings.speed = 4; h.data.settings.skipAnim = true; h.stage.speed = 4; h.stage.skip = true; h.save?.(); h.render(); });
await pg.click('[data-abyss]'); await w(300);
for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
const ni = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
await pg.click(`button[data-node="${ni}"]`); await w(600);
for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
R.battle = !!(await pg.$('.cmdbar'));
R.ui = await pg.evaluate(() => ({ speed: window.hv.stage.speed, skip: window.hv.stage.skip }));
// one immortal boss that charges every 4th turn; immortal player so the run never ends
await pg.evaluate(() => {
  const s = window.hv.battle; const m = s.monsters.find((x) => x.hp > 0);
  s.monsters = [{ ...m, rank: 'boss', hp: 1e9, maxHp: 1e9, charge: 0, pulseNext: false, drainNext: false, phases: 0, sig: undefined }];
  s.d.hp = 1e9; s.hp = 1e9; window.hv.target = 0; window.hv.render();
  window.__dec = []; let on = 0;
  const tick = () => { const v = !!document.querySelector('[data-decide]'); const t = performance.now(); if (v && !on) on = t; if (!v && on) { window.__dec.push(t - on); on = 0; } requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
// spam A every 60 ms for 8 s (tapping / key-repeat)
const t0 = Date.now(); let presses = 0;
while (Date.now() - t0 < 8000) { await pg.keyboard.press('KeyA'); presses++; await w(60); }
await w(1500);
R.spam = await pg.evaluate(() => window.__dec.map((x) => Math.round(x)));
R.presses = presses;
// single deliberate press: once the panel is up it must stay until the player acts, and D must be accepted
await pg.evaluate(() => { const s = window.hv.battle; s.monsters[0].charge = 1; window.hv.render(); });
await w(2000);
R.stays = await pg.evaluate(() => !!document.querySelector('[data-decide]'));
const hp0 = await pg.evaluate(() => window.hv.battle.defendTurns);
await pg.keyboard.press('KeyD'); await w(800);
R.defended = await pg.evaluate(() => window.hv.log.slice(-8).some((l) => /重擊/.test(l))) && hp0 === 0;
if (!R.battle) fail.push('no battle');
if (R.ui.speed !== 4 || !R.ui.skip) fail.push('not 4x+skip');
if (!MEASURE) {
  if (!R.spam.length) fail.push('panel never seen while spamming');
  if (R.spam.some((x) => x < MIN_MS)) fail.push(`panel flashed: ${R.spam}`);
  if (!R.stays) fail.push('panel does not stay');
  if (!R.defended) fail.push('D not accepted during charge');
}
R.fail = fail; R.errs = errs; console.log(JSON.stringify(R));
const ok = !fail.length && !errs.length; console.log(ok ? 'CP8 RC9 CHARGE E2E PASS' : 'CP8 RC9 CHARGE E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

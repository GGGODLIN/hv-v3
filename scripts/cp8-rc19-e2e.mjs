// cp8-rc19 e2e (c): a key pressed during the charge hold is queued and runs when the hold ends (A alone, and D then A).
// Usage: node scripts/cp8-rc19-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
await pg.goto(BASE + '?cp6&cp8&debug&fresh&preset=postF20-oc', { waitUntil: 'networkidle0' }); await w(300);
await pg.evaluate(() => { const h = window.hv; h.data.settings.speed = 4; h.data.settings.skipAnim = true; h.stage.speed = 4; h.stage.skip = true; h.render(); });
await pg.click('[data-abyss]'); await w(300);
for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
const ni = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
await pg.click(`button[data-node="${ni}"]`); await w(600);
for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
const idle = () => pg.waitForFunction(() => !window.hv.busy, { timeout: 5000 }).catch(() => {});
const setup = () => pg.evaluate(() => { const h = window.hv, s = h.battle; for (const m of s.monsters) { m.hp = m.maxHp = 1e7; m.adb = 1; } s.hp = s.d.hp; h.chargeHoldUntil = performance.now() + 700; h.render(); return s.turn; });
// 1) A alone during the hold
let t0 = await setup(); await pg.keyboard.press('a'); await w(100);
R.queuedMsg = await pg.evaluate(() => document.querySelector('[data-refused]')?.textContent ?? '');
R.turnDuring = await pg.evaluate(() => window.hv.battle.turn);
await w(900); await idle(); await w(300);
R.a = { t0, t1: await pg.evaluate(() => window.hv.battle.turn) };
if (R.turnDuring !== t0) fail.push('A ran during the hold'); if (!/已排隊/.test(R.queuedMsg)) fail.push('no queued note');
if (R.a.t1 !== t0 + 1) fail.push(`A not run after hold ${JSON.stringify(R.a)}`);
// 2) D then A during the hold
t0 = await setup(); await pg.keyboard.press('d'); await w(30); await pg.keyboard.press('a');
await w(1200); await idle(); await w(500); await idle(); await w(300);
R.da = { t0, t1: await pg.evaluate(() => window.hv.battle.turn) };
if (R.da.t1 !== t0 + 2) fail.push(`D then A: expected 2 turns ${JSON.stringify(R.da)}`);
console.log(JSON.stringify({ R, errs, fail }));
await b.close(); process.exit(fail.length || errs.length ? 1 : 0);

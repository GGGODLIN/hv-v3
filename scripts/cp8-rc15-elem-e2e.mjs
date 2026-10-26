// CP8 rc15 element-hint e2e (UI only, no value changes): (1) panel title 「建議：k·冰封（弱冰）」 + highlighted key,
// (2) enemy weak/resist in the enemy info (encounter log line, stage label, weakbox), (3) a resisted spell logs 「抗性，傷害降低」.
// Usage: node scripts/cp8-rc15-elem-e2e.mjs [base=http://127.0.0.1:5199/]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const errs = []; const R = {}; const fail = [];
const idle = (pg) => pg.waitForFunction(() => !window.hv.busy, { timeout: 5000 }).catch(() => {});
const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
await pg.goto(BASE + '?cp6&cp8&debug&fresh&preset=postF20-arcane', { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300);
await pg.evaluate(() => { const h = window.hv; h.data.settings.speed = 4; h.data.settings.skipAnim = true; h.stage.speed = 4; h.stage.skip = true; h.render(); });
await pg.click('[data-abyss]'); await w(300);
for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
const ni = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
await pg.click(`button[data-node="${ni}"]`); await w(600);
for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
// (2) encounter log + stage label, from the real fight's monsters.json rows
R.enc = await pg.evaluate(() => { const s = window.hv.battle; const any = s.monsters.some((m) => Object.values(m.spec).some((v) => v !== 0));
  return { any, lines: [...document.querySelectorAll('[data-enemyelem]')].map((x) => x.textContent), labels: (window.hv.stage.mons ?? []).map((v) => v.label.text) }; });
if (R.enc.any && !R.enc.lines.length) fail.push('(2) encounter weak/resist line missing');
if (R.enc.any && !R.enc.labels.some((t) => /\n.*[弱抗]/.test(t))) fail.push('(2) stage label weak/resist missing');
// one tough foe: cold weakness, fire resistance
await pg.evaluate(() => { const h = window.hv, s = h.battle, m = s.monsters.find((x) => x.hp > 0);
  s.monsters = [{ ...m, hp: 1e9, maxHp: 1e9, adb: 1, evade: 0, resist: 0, spec: { piercing: 0, crushing: 0, slashing: 0, cold: -50, wind: 0, elec: 0, fire: 60, dark: 0, holy: 0 } }];
  h.target = 0; s.mp = s.d.mp; h.render(); });
await w(200); await idle(pg);
R.t1 = await pg.evaluate(() => ({ title: document.querySelector('[data-sugtitle]')?.textContent ?? '', lit: document.querySelector('button.suggest[data-sugbtn]')?.getAttribute('data-act') ?? '',
  res: [...document.querySelectorAll('[data-res]')].map((x) => x.getAttribute('data-res')), wk: [...document.querySelectorAll('[data-wk]')].map((x) => x.getAttribute('data-wk')) }));
if (!/^建議：\d·冰封（弱冰）$/.test(R.t1.title)) fail.push('(1) title ' + R.t1.title);
if (R.t1.lit !== 'spell:freeze') fail.push('(1) highlighted key ' + R.t1.lit);
if (!R.t1.res.some((x) => /fire/.test(x))) fail.push('(2) weakbox resist fire missing');
if (!R.t1.wk.some((x) => /cold/.test(x))) fail.push('(2) weakbox weak cold missing');
// (3) real click on the resisted element's spell button
R.t3 = '';
for (let k = 0; k < 6 && !R.t3; k++) {
  await pg.evaluate(() => { const h = window.hv; h.battle.mp = h.battle.d.mp; h.battle.hp = h.battle.d.hp; h.render(); }); await w(100);
  await pg.click('button[data-act="spell:fiery"]'); await w(900); await idle(pg);
  R.t3 = await pg.evaluate(() => [...document.querySelectorAll('[data-resisthit]')].map((x) => x.textContent).join(' | '));
}
if (!/抗性，傷害降低/.test(R.t3) || !/抗火 60%/.test(R.t3)) fail.push('(3) resist log ' + R.t3);
// no resist line for the weak element (the log shows the latest turn)
await pg.evaluate(() => { const h = window.hv; h.battle.mp = h.battle.d.mp; h.render(); });
const before = await pg.$$eval('[data-resisthit]', (n) => n.length);
await pg.click('button[data-act="spell:freeze"]'); await w(900); await idle(pg);
R.after = [before, await pg.$$eval('[data-resisthit]', (n) => n.length)];
if (R.after[1] !== 0) fail.push('(3) resist line on a weak-element spell');
R.errs = errs; R.fail = fail; console.log(JSON.stringify(R, null, 1)); const ok = !fail.length && !errs.length; console.log(ok ? 'PASS' : 'FAIL'); await b.close(); process.exit(ok ? 0 : 1);

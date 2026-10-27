// cp8-rc16 e2e: items 1–2. Charge turn with safe HP must not suggest D / Z anywhere (panel, status bar, urgent line);
// danger (crit estimate ≥ HP) does; the death screen repeats the battle panel's keys. Usage: node scripts/cp8-rc16-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
async function battle(school) {
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + `?cp6&cp8&debug&fresh&preset=postF20-${school}`, { waitUntil: 'networkidle0' }); await w(300);
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  const ni = await pg.$$eval('button[data-node]', (n) => Math.max(0, n.findIndex((x) => /n-battle/.test(x.className))));
  await pg.click(`button[data-node="${ni}"]`); await w(600);
  for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (c) await c.click(); await w(400); }
  return pg;
}
// set a charging boss and HP; read every hint surface
const probe = (pg, hp, max) => pg.evaluate((hp, max) => {
  const s = window.hv.battle; const m = s.monsters.find((x) => x.hp > 0);
  s.monsters = [{ ...m, rank: 'boss', hp: 1e6, maxHp: 1e6, charge: 1 }];
  s.d.hp = max; s.hp = hp; window.hv.target = 0; window.hv.render();
  const t = (q) => [...document.querySelectorAll(q)].map((e) => e.textContent).join(' | ');
  const k = document.querySelector('span[data-keys]');
  return { keys: k?.dataset.keys, decide: k?.dataset.decide, panel: t('[data-decide]'), urgent: !!document.querySelector('[data-urgent]'), body: [...(document.querySelector('.cmdbar')?.parentElement?.children ?? [])].filter((e) => !e.matches('.cmdbar')).map((e) => e.textContent).join(' ') };
}, hp, max);
const DZ = /D·防禦|Z·生命藥水|Z·喝藥|建議防禦|先喝藥|先防禦/;
for (const [name, school, hp, max] of [['arcaneFull', 'arcane', 724, 724], ['bulwark62', 'bulwark', 456, 736]]) {
  const pg = await battle(school); const r = await probe(pg, hp, max); R[name] = { keys: r.keys, decide: r.decide, urgent: r.urgent, panel: r.panel.slice(0, 200) };
  if (r.decide !== 'safe' || /D|Z/.test(r.keys ?? 'D')) fail.push(`${name}: keys ${r.keys}`);
  if (r.urgent || DZ.test(r.body)) fail.push(`${name}: D/Z text shown: ${r.body.match(DZ)?.[0]} @ ${r.body.slice(Math.max(0, r.body.search(DZ) - 40), r.body.search(DZ) + 20)}`);
  // danger case: same fight, HP 1 → D or Z
  const d = await probe(pg, 1, max); R[name + 'Danger'] = d.keys;
  if (d.decide !== 'danger') fail.push(`${name}: danger not flagged`);
  // death screen repeats the panel keys (item 2)
  if (name === 'arcaneFull') {
    await pg.evaluate(() => { const s = window.hv.battle; s.potions.health = 0; window.hv.render(); });
    const keys = await pg.$eval('span[data-keys]', (e) => e.dataset.keys);
    await pg.keyboard.press('KeyA'); await w(2500);
    for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(400); }
    const dk = await pg.$eval('[data-deathadvice]', (e) => e.dataset.deathadvice).catch(() => null);
    R.death = { keys, dk }; if (!dk || dk !== keys) fail.push(`death advice ${dk} != panel ${keys}`);
  }
  await pg.close();
}
// item 7: Z then A pressed during one animation -> both run (A used to be swallowed)
{
  const pg = await battle('blade');
  await pg.evaluate(() => { const s = window.hv.battle; const m = s.monsters.find((x) => x.hp > 0); s.monsters = [{ ...m, hp: 1e6, maxHp: 1e6, charge: 0 }]; s.hp = 100; s.potions.health = 3; s.itemCd.health = 0; window.hv.target = 0; window.hv.render(); });
  const t0 = await pg.evaluate(() => window.hv.battle.turn);
  await pg.keyboard.press('KeyF'); await w(20); await pg.keyboard.press('KeyZ'); await w(20); await pg.keyboard.press('KeyA');
  await pg.waitForFunction(() => !window.hv.busy && !window.hv.queued && !window.hv.queued2, { timeout: 15000 }).catch(() => {}); await w(300);
  const r = await pg.evaluate(() => ({ turn: window.hv.battle?.turn, pots: window.hv.battle?.potions.health }));
  R.queue = { t0, ...r }; if (r.turn - t0 < 3 || r.pots !== 2) fail.push(`queue: ${JSON.stringify(R.queue)}`);
  await pg.close();
}
{ // item 3: map potion + low-HP warning (map before the first fight)
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + '?cp6&cp8&debug&fresh&preset=postF20-blade', { waitUntil: 'networkidle0' }); await w(300);
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  await pg.evaluate(() => { window.hv.run.hp = 10; window.hv.render(); });
  const warn = !!(await pg.$('[data-lowhp]')); const p0 = await pg.evaluate(() => window.hv.p.potions.health);
  await pg.keyboard.press('KeyZ'); await w(200);
  const after = await pg.evaluate(() => ({ hp: window.hv.run.hp, pots: window.hv.p.potions.health }));
  R.map = { warn, p0, ...after }; if (!warn || after.hp <= 10 || after.pots !== p0 - 1) fail.push(`map potion: ${JSON.stringify(R.map)}`);
  await pg.close();
}
R.fail = fail; R.errs = errs; console.log(JSON.stringify(R));
const ok = !fail.length && !errs.length; console.log(ok ? 'CP8 RC16 E2E PASS' : 'CP8 RC16 E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

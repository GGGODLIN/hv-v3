// CP8 rc5 e2e (item 2): clicking a node during the start-buff picks keeps the unpicked buffs as 「待選」 in the right column;
// they can be picked later in the trip (after the node is done), one by one, until none are owed.
// Usage: node scripts/cp8-rc5-held-e2e.mjs [base=http://127.0.0.1:5198/]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5198/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = []; const R = {};
const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e))); pg.on('dialog', (d) => d.accept());
await pg.goto(BASE + '?cp6&cp8&debug&preset=abyss20', { waitUntil: 'networkidle0' });
await pg.evaluate(() => { const k = 'hv-v3-abyss'; const r = JSON.parse(localStorage.getItem(k) || '{}'); r.best = 24; localStorage.setItem(k, JSON.stringify(r)); });
await pg.goto(BASE + '?cp6&cp8&debug', { waitUntil: 'networkidle0' }); await w(300);
await pg.select('[data-abyss-start]', '21'); await pg.click('[data-abyss]'); await w(300);
for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
const st = () => pg.evaluate(() => { const r = hv.run; return { buffs: (r.buffs ?? []).length, held: r.held?.ids?.length ?? 0, heldLeft: r.heldLeft ?? 0, offer: !!r.offer, startPick: !!r.startPick }; });
R.start = await st(); R.owed0 = (R.start.offer ? 1 : 0) + (await pg.evaluate(() => hv.run.offersLeft ?? 0));
await pg.click('[data-startpick] [data-buff]'); await w(200);
R.afterPick = await st();
await pg.click('button[data-node]'); await w(400);
R.afterNode = await st();
// finish the node: win a battle via the debug hook, or press 繼續.
for (let k = 0; k < 12 && !(await pg.$('[data-heldpick]')); k++) {
  await pg.evaluate(async () => { hv.data.settings.skipAnim = true; for (let n = 0; n < 20 && hv.screen === 'battle'; n++) { for (const m of hv.battle.monsters) if (m.hp > 1) m.hp = 1; hv.battle.hp = hv.battle.d.hp; await hv.command('attack'); await new Promise((r) => setTimeout(r, 300)); } });
  await w(500); const sk = await pg.$('[data-buffskip]'); if (sk) { await sk.click(); await w(300); }
  await pg.evaluate(() => document.querySelector('[data-continue]:not([disabled])')?.click()); await w(400);
}
R.heldShown = !!(await pg.$('[data-heldpick]'));
R.label = await pg.evaluate(() => document.querySelector('[data-heldpick] h3')?.textContent ?? '');
R.inRight = await pg.evaluate(() => { const h = document.querySelector('[data-heldpick]'), t = document.querySelector('.tower'); return !!h && !!t && h.getBoundingClientRect().x > t.getBoundingClientRect().x; });
R.picks = 0;
for (let k = 0; k < 10 && (await pg.$('[data-heldbuff]')); k++) { await pg.click('[data-heldbuff]'); await w(200); R.picks++; }
R.end = await st(); R.errs = errs; console.log(JSON.stringify(R));
const ok = R.afterPick.buffs === R.start.buffs + 1 && R.afterNode.held > 0 && R.heldShown && R.label.includes('待選') && R.inRight
  && R.picks === R.owed0 - 1 && R.end.buffs === R.start.buffs + R.owed0 && R.end.held === 0 && !errs.length;
console.log(ok ? 'CP8 RC5 HELD E2E PASS' : 'CP8 RC5 HELD E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

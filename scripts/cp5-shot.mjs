// CP5 UI e2e + screenshots (flag on via ?cp5). Usage: node scripts/cp5-shot.mjs [url] [outdir]
import puppeteer from 'puppeteer-core';
const url = process.argv[2] ?? 'http://127.0.0.1:5198/';
const out = process.argv[3] ?? '/workspace/hv-v3-shots/cp5';
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const pg = await br.newPage();
await pg.setViewport({ width: 1280, height: 900 });
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e)));
await pg.goto(url + '?debug&cp5', { waitUntil: 'networkidle0' });
await pg.waitForFunction(() => window.hv);
await pg.evaluate(() => localStorage.clear());
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (sel) => pg.evaluate((s) => [...document.querySelectorAll(s)].map((x) => x.textContent.trim()), sel);
const res = {};
// 1. map: theme title, block separators, boss titles
await pg.evaluate(() => { const hv = window.hv; hv.startRun(); hv.run.floor = 6; hv.go('map'); });
await wait(300); await pg.screenshot({ path: `${out}/cp5-map-theme.png`, fullPage: true });
res.map = { theme: await q('[data-theme]'), seps: (await q('[data-themesep]')).length, bosses: await q('[data-bosstitle]'), badge: await pg.evaluate(() => document.getElementById('build')?.textContent) };
// 2. F5 boss: play until the summon telegraph shows
const fight = async (floor, type, stopSel, max = 30) => {
  await pg.evaluate(async (f, t) => { const hv = window.hv; hv.stage.speed = 20; hv.run.floor = f; hv.run.hp = 99999; hv.run.current = { type: t, option: 0 }; await hv.startBattle(t); }, floor, type);
  await wait(500);
  for (let i = 0; i < max; i++) {
    if (await pg.$(stopSel)) return true;
    const over = await pg.evaluate(async () => { const hv = window.hv; const b = hv.battle; if (!b || b.over) return true; b.hp = b.d.hp; await hv.command('defend'); return !!hv.battle?.over; });
    if (over) return false;
  }
  return !!(await pg.$(stopSel));
};
res.b5 = { tele: await fight(5, 'boss', '[data-tele="summon-on"]'), tip: await q('[data-cp5tip]'), plate: await q('.plate') };
await pg.screenshot({ path: `${out}/cp5-boss5-telegraph.png` });
// 3. F10 boss: shield state in the nameplate
res.b10 = { shield: await fight(10, 'boss', '[data-tele^="shield"]', 2), plate: await q('.plate'), sigLog: (await q('[data-sig]')).slice(-2) };
await pg.screenshot({ path: `${out}/cp5-boss10-shield.png` });
// 4. F9 elite: affix nameplates; player DoT display and clearing by defend
await pg.evaluate(async () => { const hv = window.hv; hv.run.floor = 9; hv.run.current = { type: 'elite', option: 0 }; await hv.startBattle('elite'); });
await wait(500);
res.elite = { affixes: await pg.evaluate(() => [...document.querySelectorAll('[data-affix]')].map((x) => x.dataset.affix)), tips: await q('[data-cp5tip]') };
await pg.evaluate(() => { const hv = window.hv; hv.battle.cp5.pdot = { burn: 12, burnTurns: 2, bleed: 8, bleedTurns: 3 }; hv.render(); });
await wait(200);
res.dot = await q('[data-pdotbox]');
await pg.screenshot({ path: `${out}/cp5-elite-affix-dot.png` });
await pg.evaluate(async () => { const hv = window.hv; hv.battle.hp = hv.battle.d.hp; await hv.command('defend'); });
await wait(300);
res.dotAfterDefend = await q('[data-pdotbox]');
console.log(JSON.stringify({ res, errs }, null, 1));
await br.close();
const ok = !errs.length && res.map.theme.length && res.map.seps >= 3 && res.map.bosses.length === 4 && res.b5.tele && res.b5.tip.length && res.b10.shield && res.elite.affixes.length && res.dot.length && !res.dotAfterDefend.length;
if (!ok) { console.log('CP5 SHOT FAIL'); process.exit(1); }
console.log('CP5 SHOT OK');

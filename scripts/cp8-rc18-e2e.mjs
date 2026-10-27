// rc18 e2e: (1) elite head label carries affixes after the name 「名【詞綴】」; (2) map low-HP box with 「喝藥再出發」 at <=50% (incl. exactly 50%), absent at 60%, button drinks.
// Usage: node scripts/cp8-rc18-e2e.mjs <base>
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'] }); const pg = await b.newPage(); await pg.setViewport({ width: 1280, height: 900 });
const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const fails = [];
await pg.goto(BASE + '?debug&cp5', { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await pg.evaluate(() => localStorage.clear());
await pg.evaluate(() => { const hv = window.hv; hv.startRun(); hv.go('map'); }); await w(300);
const st = async (f) => pg.evaluate((f) => { const hv = window.hv; const max = parseInt(document.querySelector('.bar.hp span').textContent.split('/')[1]); hv.p.potions.health = Math.max(hv.p.potions.health, 2); hv.run.hp = Math.floor(max * f); hv.render();
  return { hp: hv.run.hp, max, pots: hv.p.potions.health, low: !!document.querySelector('[data-lowhp]'), go: document.querySelector('[data-potgo]')?.textContent ?? '' }; }, f);
const r60 = await st(0.6), r50 = await st(0.5), r30 = await st(0.3);
if (r60.low || r60.go) fails.push('60% should have no low-hp box');
if (!r50.low || !r50.go.includes('喝藥再出發')) fails.push('exactly 50% must show 喝藥再出發');
if (!r30.go.includes('喝藥再出發')) fails.push('30% must show 喝藥再出發');
await pg.click('[data-potgo]'); await w(200);
const after = await pg.evaluate(() => ({ hp: window.hv.run.hp, pots: window.hv.p.potions.health }));
if (!(after.hp > r30.hp && after.pots === r30.pots - 1)) fails.push('potgo did not drink ' + JSON.stringify(after));
await pg.evaluate(() => { const hv = window.hv; hv.p.potions.health = 0; hv.run.hp = 1; hv.render(); });
if (await pg.$('[data-potgo]')) fails.push('no potions: button should be hidden');
// elite affix head label
await pg.evaluate(async () => { const hv = window.hv; hv.run.hp = 99999; hv.run.floor = 9; hv.run.current = { type: 'elite', option: 0 }; await hv.startBattle('elite'); }); await w(600);
const lab = await pg.evaluate(() => (window.hv.battle?.monsters ?? []).map((m, i) => ({ name: m.name, aff: m.affixes ?? [], label: window.hv.stage.mons?.[i]?.label?.text ?? '' })));
const el = lab.filter((x) => x.aff.length);
if (!el.length) fails.push('no affixed elite spawned');
for (const x of el) if (!/【.+】/.test(x.label) || x.label.indexOf(x.name) > x.label.indexOf('【')) fails.push('affix not after name: ' + x.label);
console.log(JSON.stringify({ r60, r50, r30, after, lab, errs }));
await b.close();
if (fails.length || errs.length) { console.log('RC18 FAIL', fails); process.exit(1); } console.log('RC18 OK');

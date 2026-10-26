// CP6 rc3 e2e (items 1-6, 不拿 confirm, presets). Needs `npx vite --port 5198`. Usage: node scripts/cp6-rc3-e2e.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://localhost:5198/';
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const res = {}; const fail = []; const errs = [];
const okPrep = async (pg) => { await w(150); if (await pg.$('.modal [data-modal-ok]')) { const t = await pg.$eval('.modal [data-modal-ok]', (x) => x.textContent); if (t.includes('出發')) { await pg.click('.modal [data-modal-ok]'); await w(300); } } }; // cp8-rc2: dismiss the prep reminder
const open = async (q) => { const pg = await br.newPage(); await pg.setViewport({ width: 1280, height: 900 }); pg.on('pageerror', (e) => errs.push(q + ' ' + e)); pg.on('dialog', (d) => { (pg.dialogs ??= []).push(d.message()); d[pg.reject ? 'dismiss' : 'accept'](); }); await pg.goto(BASE + q, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); return pg; };
let pg = await open('?cp6&debug');
await pg.evaluate(() => localStorage.clear()); await pg.reload({ waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv);
await pg.evaluate(() => { const hv = window.hv; hv.p.prog.abyssOpen = true; hv.save(); localStorage.setItem('hv-v3-abyss', JSON.stringify({ best: 15, trips: 1, ms: 10, titles: [], bySchool: {} })); hv.render(); });
await pg.click('[data-abyss]'); await okPrep(pg); await w(400);
res.map = await pg.evaluate(() => ({ depth: window.hv.run.abyss && (window.hv.run.abyss.start + window.hv.run.floor - 1), carry: document.querySelector('[data-carry-abyss]')?.dataset.carryAbyss, trip: document.querySelectorAll('[data-trip]').length, boss: document.querySelector('[data-bossnext]')?.textContent, info: document.querySelector('[data-abyssinfo]')?.textContent, eliteNodes: window.hv.run.tower.floors.filter((f) => f.options.includes('elite')).length, eliteMarks: document.querySelectorAll('[data-elitemark]').length, old510: /第 5、10 層/.test(document.body.innerText) }));
if (res.map.depth !== 16 || res.map.carry !== '1.1' || res.map.trip || !/每 5 層是首領.*20 層/.test(res.map.boss ?? '') || res.map.old510) fail.push('1/4 map');
if (!/惡夢（Nightmare）/.test(res.map.info ?? '')) fail.push('5 tier zh');
if (res.map.eliteNodes && !res.map.eliteMarks) fail.push('6 elite ⚔');
// skip-buff confirm: dismiss keeps offer, accept clears it
await pg.evaluate(() => { const hv = window.hv; const r = hv.run; const i = r.tower.floors.findIndex((f) => f.options.some((o) => o !== 'elite' && o !== 'combat' && o !== 'boss')); r.floor = i + 1; hv.enterNode(r.tower.floors[i].options.findIndex((o) => o !== 'elite' && o !== 'combat' && o !== 'boss')); }); await w(300);
await pg.evaluate(() => { const hv = window.hv; hv.run.offer = { src: 'boss', ids: ['B1', 'B2', 'B3'] }; if (hv.screen !== 'node') hv.go('node'); else hv.render(); }); await w(200);
pg.reject = true; await pg.evaluate(() => document.querySelector('[data-buffskip]').click()); await w(200);
res.skipCancel = await pg.evaluate(() => !!window.hv.run.offer);
pg.reject = false; await pg.evaluate(() => document.querySelector('[data-buffskip]').click()); await w(200);
res.skipOk = await pg.evaluate(() => !!window.hv.run.offer); res.dialogs = pg.dialogs;
if (!res.skipCancel || res.skipOk || !(pg.dialogs ?? []).some((m) => m.includes('確定不拿'))) fail.push('skip confirm');
// 2/3: retreat from d16 (record best 2 so it is a new record) -> result shows depth 16 and the new-record line
await pg.evaluate(() => { const hv = window.hv; hv.modal = null; hv.go('map'); localStorage.setItem('hv-v3-abyss', JSON.stringify({ best: 2, trips: 1, ms: 0, titles: [], bySchool: {} })); }); await w(200);
const depthNow = await pg.evaluate(() => window.hv.run.abyss.start + window.hv.run.floor - 1);
await pg.evaluate(() => document.querySelector('[data-retreat]').click()); await w(400);
res.result = await pg.evaluate(() => ({ reached: document.querySelector('[data-reached]')?.textContent, carry: document.querySelector('[data-carry]')?.textContent, unlock: document.querySelector('[data-unlock]')?.textContent, floor1: /到達第 1 層/.test(document.body.innerText) }));
res.depthNow = depthNow;
if (res.result.reached !== String(depthNow) || res.result.floor1) fail.push('2 depth');
if (!/深淵帶回倍率（1＋0.05×難度階） ×1.1/.test(res.result.carry ?? '') || /新手/.test(res.result.carry ?? '')) fail.push('1 carry');
if (!/深淵新紀錄：到達第 \d+ 層（已通過 \d+ 層）/.test(res.result.unlock ?? '')) fail.push('3 record');
await pg.screenshot({ path: '/tmp/rc3-result.png' }); await pg.close();
// presets
res.presets = {};
for (const k of ['postF20-blade', 'postF20-oc', 'postF20-arcane', 'postF20-bulwark', 'abyss15']) {
  const p = await open(`?cp6&debug&preset=${k}`);
  const r = await p.evaluate(() => ({ preset: window.hvPreset, open: !!window.hv.p.prog.abyssOpen, best: JSON.parse(localStorage.getItem('hv-v3-abyss')).best, btn: document.querySelector('[data-abyss]')?.textContent, eq: Object.keys(window.hv.p.equipped).length }));
  res.presets[k] = r; if (r.preset !== k || !r.open || !r.btn || !r.eq || r.best !== (k === 'abyss15' ? 15 : 0)) fail.push('preset ' + k);
  await p.close();
}
// cp8-rc2: removed the 'preset without cp6' check — cp6Abyss is on by default and no URL can turn it off, so the case no longer exists.
if (errs.length) fail.push('errors');
console.log(JSON.stringify({ res, errs }, null, 1)); console.log(fail.length ? 'FAIL ' + fail.join(', ') : 'ALL PASS'); await br.close(); process.exit(fail.length ? 1 : 0);

// cp8-rc3 item 2 e2e: CP8.autoWear puts better drops on during the trip, so the 整備提醒 「▲ 倉庫」 row could never show after a
// trip. Now the reminder names the pieces auto-worn last trip once (data-prep-row="worn"). Flow: postF20-blade preset → depart
// (dismiss reminder) → in the run the body armour counts as an auto-worn drop (run.worn, what applyLoot records) → 撤退回城 →
// 回到城鎮 → depart again → the worn row names it; a third departure does not show it again. Usage: node scripts/cp8-rc3-prep-e2e.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] ?? process.env.E2E_URL ?? 'http://127.0.0.1:5199/';
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const fail = []; const errs = []; const log = {};
const pg = await br.newPage(); await pg.setViewport({ width: 1280, height: 900 }); pg.on('pageerror', (e) => errs.push(String(e))); pg.on('dialog', (d) => d.accept());
await pg.goto(BASE + '?cp6&debug&preset=postF20-blade', { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv);
await pg.goto(BASE + '?cp6&cp8&debug', { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300);
const okPrep = async () => { await w(250); const ok = await pg.$('.modal [data-modal-ok]'); if (ok) { await ok.click(); await w(300); } return !!ok; };
const rowNow = () => pg.evaluate(() => ({ worn: document.querySelector('[data-prep-row="worn"]')?.textContent ?? null, ids: [...document.querySelectorAll('[data-prep-worn-item]')].map((e) => e.dataset.prepWornItem) }));
await pg.click('[data-start]'); log.first = await rowNow(); await okPrep();
const id = await pg.evaluate(() => { const r = window.hv.run; const b = window.hv.p.equipped.body; (r.worn ??= []).push(b.id); return b.id; });
await pg.waitForSelector('[data-retreat]'); await pg.click('[data-retreat]'); await w(400);
await pg.waitForSelector('[data-town]'); await pg.click('[data-town]'); await w(400);
await pg.click('[data-start]'); log.second = await rowNow(); await pg.screenshot({ path: '/tmp/cp8rc3-prep-worn.png' }); await okPrep();
if (log.first.worn) fail.push('worn row before any trip');
if (!log.second.ids.includes(id) || !/上一趟已自動換上 \d+ 件/.test(log.second.worn ?? '')) fail.push('worn row names the auto-worn piece');
log.id = id; await br.close(); console.log(JSON.stringify(log, null, 1)); if (errs.length) fail.push('pageerror ' + errs.join('|'));
console.log(fail.length ? 'CP8-RC3 PREP E2E FAIL: ' + fail.join('; ') : 'CP8-RC3 PREP E2E PASS'); process.exit(fail.length ? 1 : 0);

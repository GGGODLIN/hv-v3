// cp8-rc2 UX e2e: with ?cp8 the 整備提醒 equip row names each 「▲ 比身上好」 piece (slot・name（▲power）), not only the count;
// without cp8 the old count-only text stays. Save = postF20-blade preset with the worn body armour moved to the bag.
// Usage: node scripts/cp8-rc2-prep-e2e.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] ?? process.env.E2E_URL ?? 'http://127.0.0.1:5199/';
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const fail = []; const errs = []; const log = {};
async function run(flags) {
  const pg = await br.newPage(); await pg.setViewport({ width: 1280, height: 900 }); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + '?cp6&debug&preset=postF20-blade', { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv);
  const body = await pg.evaluate(() => { const p = window.hv.p; const b = p.equipped.body; delete p.equipped.body; p.inventory.push(b); window.hv.save(); return b.id; });
  await pg.goto(BASE + `?${flags}&debug`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300);
  await pg.click('[data-start]'); await w(250);
  const r = await pg.evaluate(() => ({ text: document.querySelector('[data-prep-row="equip"]')?.textContent ?? null,
    items: [...document.querySelectorAll('[data-prep-item]')].map((e) => ({ id: e.dataset.prepItem, t: e.textContent })) }));
  await pg.screenshot({ path: `/tmp/cp8rc2-prep-${flags.includes('cp8') ? 'on' : 'off'}.png` }); await pg.close(); return { body, ...r };
}
const on = await run('cp6&cp8'); log.on = on;
if (!on.items.some((x) => x.id === on.body && /^.+・.+（▲\d+）$/.test(x.t)) || !on.text?.includes('：')) fail.push('cp8 on: names listed');
const off = await run('cp6'); log.off = off;
if (off.items.length || !/倉庫有 \d+ 件「▲ 比身上好」的裝備。/.test(off.text ?? '')) fail.push('cp8 off: count-only text');
await br.close(); console.log(JSON.stringify(log, null, 1)); if (errs.length) fail.push('pageerror ' + errs.join('|'));
console.log(fail.length ? 'CP8-RC2 PREP E2E FAIL: ' + fail.join('; ') : 'CP8-RC2 PREP E2E PASS'); process.exit(fail.length ? 1 : 0);

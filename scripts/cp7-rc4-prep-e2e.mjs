// cp7-rc4 e2e: 出發前整備提醒 on the real build. Save = postF20-blade preset + huge unspent EXP, 0 HP potions, worn body armour moved
// to the inventory (so the bag holds a 「▲ 比身上好」 piece). Checks: reminder shows all 3 rows; 全部處理 fixes all three; 忽略並出發
// departs untouched (main + abyss); no issues → no reminder; cp7 off → no reminder. Usage: node scripts/cp7-rc4-prep-e2e.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://localhost:5199/';
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const fail = []; const errs = []; const log = {};
const check = (name, ok, info) => { log[name] = { ok, ...(info ? { info } : {}) }; if (!ok) fail.push(name); };
async function page(flags) {
  const pg = await br.newPage(); await pg.setViewport({ width: 1280, height: 900 }); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + `?cp6&debug&preset=postF20-blade`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv);
  await pg.evaluate(() => { const p = window.hv.p; p.exp += 5_000_000; p.potions.health = 0; p.credits = 10_000; const b = p.equipped.body; delete p.equipped.body; p.inventory.push(b); window.hv.save(); });
  await pg.goto(BASE + `?${flags}&debug`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300);
  return pg;
}
const st = (pg) => pg.evaluate(() => { const hv = window.hv, p = hv.p; return { attrs: Object.values(p.attrs).reduce((a, b) => a + b, 0), hp: p.potions.health, credits: p.credits, body: p.equipped.body?.id ?? null, inv: p.inventory.length,
  modal: !!document.querySelector('[data-prepbox]'), rows: [...document.querySelectorAll('[data-prep-row]')].map((e) => e.dataset.prepRow), done: !!document.querySelector('[data-prep-done]'),
  ok: document.querySelector('[data-modal-ok]')?.textContent ?? null, all: !!document.querySelector('[data-prep="all"]'), run: hv.data.run ? (hv.data.run.abyss ? 'abyss' : 'main') : null }; });

// 1. main tower: reminder → 全部處理 → 出發
{ const pg = await page('cp6&cp7'); const s0 = await st(pg);
  await pg.click('[data-start]'); await w(200); const s1 = await st(pg);
  check('main: reminder with 3 rows + 全部處理 + 忽略並出發', s1.modal && JSON.stringify(s1.rows) === '["alloc","potion","equip"]' && s1.all && s1.ok === '忽略並出發' && s1.run === null, s1);
  await pg.screenshot({ path: '/tmp/rc4-prep-reminder.png' });
  await pg.click('[data-prep="all"]'); await w(200); const s2 = await st(pg);
  check('全部處理: attrs allocated', s2.attrs > s0.attrs, { before: s0.attrs, after: s2.attrs });
  check('全部處理: 3 HP potions bought', s2.hp === 3 && s2.credits === s0.credits - 150, { hp: s2.hp, credits: [s0.credits, s2.credits] });
  check('全部處理: body armour worn again', s2.body !== null && s2.inv === s0.inv - 1, { body: s2.body, inv: [s0.inv, s2.inv] });
  check('全部處理: no row left, 整備完成 + 出發', s2.done && !s2.rows.length && s2.ok === '出發', s2);
  await pg.screenshot({ path: '/tmp/rc4-prep-done.png' });
  await pg.click('[data-modal-ok]'); await w(300); const s3 = await st(pg);
  check('main: departs after 全部處理', s3.run === 'main', s3);
  await pg.close(); }
// 2. 忽略並出發 (main + abyss): departs with state unchanged
for (const [kind, btn] of [['main', '[data-start]'], ['abyss', '[data-abyss]']]) {
  const pg = await page('cp6&cp7'); const s0 = await st(pg);
  await pg.click(btn); await w(200); const s1 = await st(pg);
  check(`${kind}: reminder shows`, s1.modal && s1.rows.length === 3, s1.rows);
  await pg.click('[data-modal-ok]'); await w(300); const s2 = await st(pg);
  check(`${kind}: 忽略並出發 departs, nothing changed`, s2.run === kind && s2.hp === 0 && s2.attrs === s0.attrs && s2.body === null, s2);
  await pg.close(); }
// 3. one-click per row, then no reminder on the next departure
{ const pg = await page('cp6&cp7');
  await pg.click('[data-start]'); await w(200);
  for (const k of ['potion', 'alloc', 'equip']) { await pg.click(`[data-prep="${k}"]`); await w(150); const s = await st(pg); check(`one-click ${k} removes its row`, !s.rows.includes(k), s.rows); }
  await pg.click('[data-modal-cancel]'); await w(150);
  await pg.click('[data-start]'); await w(300); const s = await st(pg);
  check('all fixed → no reminder, departs at once', !s.modal && s.run === 'main', s);
  await pg.close(); }
// 4. cp7 off → no reminder
{ const pg = await page('cp6'); await pg.click('[data-start]'); await w(300); const s = await st(pg);
  check('cp7 off: no reminder, departs at once', !s.modal && s.run === 'main', s); await pg.close(); }
await br.close();
console.log(JSON.stringify(log, null, 1));
if (errs.length) fail.push('pageerror: ' + errs.join(' | '));
console.log(fail.length ? `CP7-RC4 PREP E2E FAIL: ${fail.join('; ')}` : 'CP7-RC4 PREP E2E ALL PASS');
process.exit(fail.length ? 1 : 0);

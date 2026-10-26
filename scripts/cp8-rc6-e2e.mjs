// cp8-rc6 e2e (producer items, ?cp6&cp8): bug 1 bulwark preset 1H+shield / lean; bug 3 arcane preset INT > STR; bug 2 全部處理 tops up
// health + mana + spirit to 3 (暫定); item 2 rest offered on F9 / F19 (floor before boss); item 5 blade never wears an injected staff;
// items 3+6 charging box shows 預估傷害 and, with the potion on cooldown, the 防禦/靈動 hint; death screen 死因 line; item 7 「格擋！-N」 log.
// Usage: node scripts/cp8-rc6-e2e.mjs [base=http://127.0.0.1:5199/]
import p from 'puppeteer-core';
import { readFileSync } from 'node:fs';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const PRE = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8'));
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = []; const R = {}; const fail = [];
const page = async (preset) => { const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + `?cp6&cp8&debug&preset=${preset}`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300); return pg; };
const okModal = async (pg) => { for (let i = 0; i < 4 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(250); } };
const toBattle = async (pg) => { await pg.click('[data-start]'); await w(300); await okModal(pg);
  for (let f = 0; f < 6 && !(await pg.$('.cmdbar')); f++) {
    const i = await pg.$$eval('button[data-node]', (n) => n.findIndex((x) => /n-(battle|elite|boss)/.test(x.className)));
    if (i >= 0) await pg.click(`button[data-node="${i}"]`); else { const c = await pg.$('button[data-node]'); if (c) await c.click(); }
    await w(500); for (let k = 0; k < 3 && !(await pg.$('.cmdbar')); k++) { const c = await pg.$('[data-continue],[data-fight],[data-modal-ok]'); if (!c) break; await c.click(); await w(300); } }
  return !!(await pg.$('.cmdbar')); };

// bug 1 + item 5 (bulwark side)
let pg = await page('postF20-bulwark');
R.bulwark = await pg.evaluate(() => { const q = window.hv.p; return { lean: q.lean, main: q.equipped.mainHand?.group, off: q.equipped.offHand?.group, mainBase: q.equipped.mainHand?.base, offBase: q.equipped.offHand?.base }; });
if (R.bulwark.lean !== 'bulwark' || R.bulwark.main !== 'oneHand' || R.bulwark.off !== 'shield' || R.bulwark.mainBase !== 'axe' || R.bulwark.offBase !== 'tower') fail.push('bug1 bulwark preset');
await pg.close();
// bug 3
pg = await page('postF20-arcane');
R.arcane = await pg.evaluate(() => { const q = window.hv.p; return { lean: q.lean, attrs: q.attrs, main: q.equipped.mainHand?.group }; });
if (R.arcane.attrs.int <= R.arcane.attrs.str || R.arcane.main !== 'staff') fail.push('bug3 arcane attrs');
await pg.close();
// bug 2 + item 5 (blade) + item 2 + items 3/6/7
pg = await page('postF20-blade');
const staff = { ...PRE['postF20-arcane'].player.equipped.mainHand, id: 'rc6staff', quality: 'legendary', level: 60 };
R.bladeBefore = await pg.evaluate((st) => { const a = window.hv, q = a.p; q.inventory.push(st); q.potions = { health: 1, mana: 0, spirit: 0 }; q.credits = 100000; a.save(); a.render();
  return { main: q.equipped.mainHand?.group }; }, staff);
await pg.click('[data-start]'); await w(300);
R.prepRow = await pg.evaluate(() => document.querySelector('[data-prep-row="potion"]')?.textContent ?? null);
R.staffListed = !!(await pg.$('[data-prep-item="rc6staff"]'));
if (await pg.$('[data-prep="all"]')) { await pg.click('[data-prep="all"]'); await w(300); }
R.after = await pg.evaluate(() => { const q = window.hv.p; return { pots: q.potions, main: q.equipped.mainHand?.group }; });
if (JSON.stringify(R.after.pots) !== JSON.stringify({ health: 3, mana: 3, spirit: 3 })) fail.push('bug2 potions');
if (R.after.main !== 'twoHand' || R.staffListed) fail.push('item5 blade wore/listed staff');
await okModal(pg); await w(300);
R.rest = await pg.evaluate(() => { const t = window.hv.run.tower; return [9, 19].map((f) => t.floors[f - 1].options); });
if (!R.rest.every((o) => o.includes('rest'))) fail.push('item2 rest before boss');
await pg.close();

pg = await page('postF20-blade');
R.inBattle = await toBattle(pg);
R.charge = await pg.evaluate(() => { const a = window.hv, s = a.battle; s.itemCd.health = 7; s.potions.health = 2; const m = s.monsters.find((x) => x.hp > 0); m.charge = 1; a.render();
  return { est: document.querySelector('[data-chargeest]')?.textContent ?? null, cd: document.querySelector('[data-cdhint]')?.textContent ?? null }; });
if (!/預估傷害 一般–暴擊 約 \d+–\d+（佔最大 HP \d+–\d+%）/.test(R.charge.est ?? '') || !/冷卻中.*(S·靈動架勢|繼續攻擊).*不建議/.test(R.charge.cd ?? '')) fail.push('items3/6 charge box');
R.noCd = await pg.evaluate(() => { const a = window.hv, s = a.battle; s.itemCd.health = 0; a.render(); return !!document.querySelector('[data-cdhint]'); });
if (R.noCd) fail.push('cd hint shown without cooldown');
// item 7: force blocks (evade/parry off, block 1), keep both sides alive
R.block = null;
for (let t = 0; t < 12 && !R.block; t++) {
  await pg.evaluate(() => { const s = window.hv.battle; s.d.evade = 0; s.d.parry = 0; s.d.block = 1; s.hp = s.d.hp; s.monsters.forEach((m) => { if (m.hp > 0) { m.maxHp = 1e7; m.hp = 1e7; m.charge = 0; } }); });
  await pg.click('[data-act="defend"]'); await w(900);
  R.block = await pg.evaluate(() => document.querySelector('[data-blockfb]')?.textContent ?? null);
}
if (!/^格擋！-\d+$/.test(R.block ?? '')) fail.push('item7 block feedback');
// item 6: die
for (let t = 0; t < 15 && !(await pg.$('.panel.result')); t++) {
  await pg.evaluate(() => { const s = window.hv.battle; if (!s) return; s.d.block = 0; s.d.evade = 0; s.d.parry = 0; s.hp = 1; s.potions.health = 0; });
  const btn = await pg.$('[data-act="attack"]'); if (btn) await btn.click(); await w(900);
  const c = await pg.$('[data-continue],[data-modal-ok]'); if (c && !(await pg.$('.panel.result'))) { await c.click(); await w(300); }
}
R.death = await pg.evaluate(() => document.querySelector('[data-deathcause]')?.textContent ?? null);
if (!/死因：.+ 造成 \d+ 傷害.*建議：/.test(R.death ?? '')) fail.push('item6 死因');
await pg.screenshot({ path: '/tmp/cp8rc6-death.png' });
R.errs = errs; if (errs.length) fail.push('pageerror');
console.log(JSON.stringify(R, null, 1));
console.log(fail.length ? 'CP8 RC6 E2E FAIL: ' + fail.join('; ') : 'CP8 RC6 E2E PASS'); await b.close(); process.exit(fail.length ? 1 : 0);

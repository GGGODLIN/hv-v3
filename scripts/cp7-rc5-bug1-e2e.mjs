// cp7-rc5 bug 1 e2e on the real build: postF20-bulwark preset + 優良・浣熊之棍棒 in storage (from scripts/cp7-rc5-bug1-save.ts → /tmp/rc5-bug1.json).
// (1) ▲9 club (1.9% < betterMargin): storage shows 小幅提升 note, no 「▲ 比身上好」, abyss reminder has no equip row.
// (2) ▲36 club (>2%): storage shows 「▲ 比身上好」, abyss reminder lists 換上, clicking it wears the club (shield kept). Also build badge · CP7.
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
const BASE = process.argv[2] ?? 'http://localhost:5199/';
const clubs = JSON.parse(readFileSync('/tmp/rc5-bug1.json', 'utf8'));
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const fail = []; const errs = []; const log = {};
const check = (name, ok, info) => { log[name] = { ok, ...(info ? { info } : {}) }; if (!ok) fail.push(name); };
async function page(club) {
  const pg = await br.newPage(); await pg.setViewport({ width: 1280, height: 900 }); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + `?cp6&debug&preset=postF20-bulwark`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv);
  await pg.evaluate((c) => { const p = window.hv.p; p.inventory = [c]; window.hv.save(); }, club);
  await pg.goto(BASE + `?cp6&cp7&debug`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300);
  return pg;
}
const st = (pg) => pg.evaluate(() => { const p = window.hv.p; return { mh: p.equipped.mainHand?.id, oh: p.equipped.offHand?.group ?? null, modal: !!document.querySelector('[data-prepbox]'),
  rows: [...document.querySelectorAll('[data-prep-row]')].map((e) => e.dataset.prepRow), equipBtn: document.querySelector('[data-prep="equip"]')?.textContent ?? null,
  better: !!document.querySelector('.inv [data-better]'), small: !!document.querySelector('.inv [data-small-gain]'), badge: document.getElementById('build')?.textContent ?? '' }; });
const gear = async (pg) => { await pg.click('[data-tab="gear"]'); await w(200); };
for (const [k, club] of [['▲9', clubs.d9], ['▲36', clubs.big]]) {
  const pg = await page(club); await gear(pg); const s0 = await st(pg);
  check(`${k}: build badge has CP7`, s0.badge.includes('· CP7'), s0.badge);
  if (k === '▲9') check('▲9: storage says 小幅提升, no ▲ 比身上好', s0.small && !s0.better, s0);
  else check('▲36: storage shows ▲ 比身上好', s0.better && !s0.small, s0);
  await pg.click('[data-abyss]'); await w(250); const s1 = await st(pg);
  if (k === '▲9') check('▲9: abyss reminder has no equip row (consistent with storage)', !s1.rows.includes('equip'), s1);
  else {
    check('▲36: abyss reminder lists 換上', s1.modal && s1.rows.includes('equip') && s1.equipBtn === '換上', s1);
    await pg.screenshot({ path: '/tmp/rc5-bug1-reminder.png' });
    await pg.click('[data-prep="equip"]'); await w(250); const s2 = await st(pg);
    check('▲36: 換上 wears the club, shield kept, row gone', s2.mh === club.id && s2.oh === 'shield' && !s2.rows.includes('equip'), s2);
  }
  await pg.close();
}
await br.close();
console.log(JSON.stringify(log, null, 1));
if (errs.length) fail.push('pageerror: ' + errs.join(' | '));
console.log(fail.length ? `CP7-RC5 BUG1 E2E FAIL: ${fail.join('; ')}` : 'CP7-RC5 BUG1 E2E ALL PASS');
process.exit(fail.length ? 1 : 0);

// cp8-rc6 Part A 1 e2e (?cp6&cp8): 建立新角色 for each school → App.fresh passes the school as lean → that school's cp8 starter kit
// (src/core/auto.ts starterKit: bulwark = 1H axe + buckler + leather body; other schools = 1H axe + leather body; lean kept).
// Usage: node scripts/cp8-rc6-fresh-e2e.mjs [base=http://127.0.0.1:5199/]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = []; const R = {}; const fail = [];
const KIT = { blade: { mainHand: 'oneHand:axe', body: 'light:leather' }, oc: { mainHand: 'oneHand:axe', body: 'light:leather' }, arcane: { mainHand: 'oneHand:axe', body: 'light:leather' }, bulwark: { mainHand: 'oneHand:axe', offHand: 'shield:buckler', body: 'heavy:plate' /* cp8-rc9 P1-5 */ } };
for (const sc of Object.keys(KIT)) {
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + '?cp6&cp8&debug', { waitUntil: 'networkidle0' }); await pg.evaluate(() => localStorage.clear());
  await pg.goto(BASE + '?cp6&cp8&debug', { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await w(300);
  await pg.click('[data-newgame]'); await w(250);
  await pg.select('[data-newlean]', sc); await pg.click('[data-modal-ok]'); await w(300);
  const got = await pg.evaluate(() => { const q = window.hv.p; const eq = {}; for (const [s, e] of Object.entries(q.equipped)) if (e) eq[s] = `${e.group}:${e.base}`; const saved = JSON.parse(localStorage.getItem('hv-v3-save')).player.lean; return { lean: q.lean, saved, eq, lv: q.exp ?? 0 }; });
  R[sc] = got;
  if (got.lean !== sc || got.saved !== sc) fail.push(`${sc} lean`);
  if (JSON.stringify(Object.fromEntries(Object.entries(got.eq).sort())) !== JSON.stringify(Object.fromEntries(Object.entries(KIT[sc]).sort()))) fail.push(`${sc} kit`);
  await pg.close();
}
R.fail = fail; R.errs = errs; console.log(JSON.stringify(R));
const ok = !fail.length && !errs.length;
console.log(ok ? 'CP8 RC6 FRESH E2E PASS' : 'CP8 RC6 FRESH E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

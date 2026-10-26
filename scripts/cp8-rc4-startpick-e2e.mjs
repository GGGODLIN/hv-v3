// CP8 rc4 e2e (item 4a): during the start-buff picks the map nodes do not shift (rc3: +4px after the first pick, the buff strip grew)
// and stay clickable; clicking a node mid-pick forgoes the rest and enters the node.
// Usage: node scripts/cp8-rc4-startpick-e2e.mjs [base=http://127.0.0.1:5199/]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = []; const R = {};
async function open() {
  const pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + '?cp6&cp8&debug&preset=abyss20', { waitUntil: 'networkidle0' });
  await pg.evaluate(() => { const k = 'hv-v3-abyss'; const r = JSON.parse(localStorage.getItem(k) || '{}'); r.best = 24; localStorage.setItem(k, JSON.stringify(r)); });
  await pg.goto(BASE + '?cp6&cp8&debug', { waitUntil: 'networkidle0' }); await w(300);
  await pg.select('[data-abyss-start]', '21'); await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  return pg;
}
const top = (pg) => pg.evaluate(() => { const e = document.querySelector('button[data-node]'); return e ? [Math.round(e.getBoundingClientRect().y * 10) / 10, e.disabled] : null; });
// A: pick all, record node top before every pick and after the last.
let pg = await open(); R.ys = [];
for (let k = 0; k < 10 && (await pg.$('[data-startpick] [data-buff]')); k++) { R.ys.push(await top(pg)); await pg.click('[data-startpick] [data-buff]'); await w(200); }
R.ys.push(await top(pg)); await pg.close();
const ys = R.ys.map((x) => x[0]); R.maxJump = Math.max(...ys.map((y) => Math.abs(y - ys[0]))); R.disabledDuring = R.ys.slice(0, -1).some((x) => x[1]);
// B: click a node in the middle of the picks.
pg = await open(); await pg.click('[data-startpick] [data-buff]'); await w(200);
R.midPick = !!(await pg.$('[data-startpick] [data-buff]'));
const box = await pg.evaluate(() => { const r = document.querySelector('button[data-node]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
await pg.mouse.click(box[0], box[1]); await w(400);
R.entered = !!(await pg.$('.cmdbar')) || !(await pg.$('[data-startpick]'));
R.errs = errs; console.log(JSON.stringify(R));
const ok = R.ys.length >= 3 && R.maxJump <= 1 && !R.disabledDuring && R.midPick && R.entered && !errs.length;
console.log(ok ? 'CP8 RC4 STARTPICK E2E PASS' : 'CP8 RC4 STARTPICK E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

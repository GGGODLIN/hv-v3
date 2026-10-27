// CP8 rc3 e2e (item 4): start from d21 → start-buff pick lives in the right column, so the map nodes do not jump
// (rc2: node top moved ~400px when the pick panel vanished, reading as 'nodes briefly unclickable'); first real click enters battle.
// Usage: node scripts/cp8-rc3-startpick-e2e.mjs [base=http://127.0.0.1:5199/]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const pg = await b.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
const R = {}; const U = BASE + '?cp6&cp8&debug&preset=' + 'abyss20';
await pg.goto(U, { waitUntil: 'networkidle0' });
await pg.evaluate(() => { const k = 'hv-v3-abyss'; const r = JSON.parse(localStorage.getItem(k) || '{}'); r.best = 24; localStorage.setItem(k, JSON.stringify(r)); });
await pg.goto(BASE + '?cp6&cp8&debug', { waitUntil: 'networkidle0' }); await w(300);
const opts = await pg.$$eval('[data-abyss-start] option', (o) => o.map((x) => Number(x.value))); R.opts = opts;
if (opts.length) await pg.select('[data-abyss-start]', String(Math.max(...opts)));
await pg.click('[data-abyss]'); await w(300);
for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
let picks = 0; while ((await pg.$('[data-startpick] [data-buff]')) && picks < 10) { (R.ys ??= []).push(await pg.evaluate(() => { const e = document.querySelector('button[data-node]'); return e ? Math.round(e.getBoundingClientRect().y) : null; })); await pg.click('[data-startpick] [data-buff]'); picks++; if (await pg.$('[data-startpick] [data-buff]')) await w(200); }
R.picks = picks;
R.state = await pg.evaluate(() => ({ nodes: [...document.querySelectorAll('[data-node]')].map((x) => x.disabled + ':' + x.textContent), sp: !!document.querySelector('[data-startpick]'), offer: !!document.querySelector('[data-buff]'), modal: !!document.querySelector('[data-modal-ok]'), body: document.querySelector('.panel')?.innerText.slice(0, 400) }));
const t0 = Date.now(); let entered = -1;
for (let k = 0; k < 30; k++) { const box = await pg.evaluate(() => { const e = document.querySelector('button[data-node]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, e.disabled]; }); (R.boxes ??= []).push(box); if (box) await pg.mouse.click(box[0], box[1]); await w(50); if (await pg.$('.cmdbar')) { entered = Date.now() - t0; break; } }
R.enteredMs = entered; R.errs = errs; delete R.state.body;
R.afterTop = Math.round(R.boxes[0][1] - 0); const ys = R.ys ?? []; R.maxJump = Math.max(...ys.map((y, i) => Math.abs((ys[i + 1] ?? (R.boxes[0][1] - 21)) - y)));
console.log(JSON.stringify(R));
const ok = R.opts.includes(21) && R.picks >= 1 && R.maxJump < 80 && R.enteredMs >= 0 && R.boxes.length === 1 && !errs.length;
console.log(ok ? 'CP8 RC3 STARTPICK E2E PASS' : 'CP8 RC3 STARTPICK E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

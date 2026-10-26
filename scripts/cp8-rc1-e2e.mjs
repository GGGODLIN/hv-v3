// CP8 e2e: `?cp8&preset=abyss20` → depart abyss from the deepest checkpoint → start-buff pick shown, map nodes locked until picked.
// Usage: node scripts/cp8-rc1-e2e.mjs [base=http://127.0.0.1:5199/]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const pg = await b.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
const R = {};
await pg.goto(BASE + '?cp6&cp8&debug&preset=abyss20', { waitUntil: 'networkidle0' }); await w(300);
const opts = await pg.$$eval('[data-abyss-start] option', (o) => o.map((x) => Number(x.value))); R.opts = opts;
if (opts.length) await pg.select('[data-abyss-start]', String(Math.max(...opts)));
await pg.click('[data-abyss]'); await w(300);
for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
R.startpick = !!(await pg.$('[data-startpick]'));
R.nodesLocked = await pg.$$eval('[data-node]', (n) => n.length > 0 && n.every((x) => x.disabled));
let picks = 0; while ((await pg.$('[data-startpick] [data-buff]')) && picks < 10) { await pg.click('[data-startpick] [data-buff]'); await w(200); picks++; }
R.picks = picks; R.startpickGone = !(await pg.$('[data-startpick]'));
R.nodesFree = await pg.$$eval('[data-node]', (n) => n.some((x) => !x.disabled));
R.errs = errs;
console.log(JSON.stringify(R, null, 1));
const ok = R.startpick && R.nodesLocked && R.picks >= 1 && R.startpickGone && R.nodesFree && !errs.length;
console.log(ok ? 'CP8 E2E PASS' : 'CP8 E2E FAIL'); await b.close(); process.exit(ok ? 0 : 1);

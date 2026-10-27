// rc18 route map e2e (presentation only): SVG overlay edges match the map rule (all-to-all between floors),
// past = chosen→chosen, next = last chosen → every current option, and endpoints sit on the nodes (1280 + 913).
// Usage: node scripts/cp8-rc18-route-e2e.mjs <base>
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const fails = []; const errs = [];
for (const W of [1280, 913]) {
  const pg = await b.newPage(); await pg.setViewport({ width: W, height: 900 }); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + '?debug&cp5', { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv); await pg.evaluate(() => localStorage.clear());
  await pg.evaluate(() => { const hv = window.hv; hv.startRun(); hv.go('map'); const r = hv.run; r.path = [0, 1, 0]; r.floor = 4; hv.render(); }); await w(500);
  const res = await pg.evaluate(() => {
    const r = window.hv.run, fl = r.tower.floors, svg = document.querySelector('.tower svg.routes'); if (!svg) return { none: true };
    const cnt = (c) => svg.querySelectorAll('path.' + c).length;
    let exp = 0; for (let n = 4; n < fl.length; n++) exp += fl[n - 1].options.length * fl[n].options.length;
    const sr = svg.getBoundingClientRect(), k = svg.width.baseVal.value / sr.width; let off = 0;
    for (const e of svg.querySelectorAll('path')) { const [a, c] = e.dataset.edge.split('-'); const m = e.getAttribute('d').match(/-?[\d.]+/g).map(Number);
      const na = document.querySelector(`.tower .node[data-f="${a.split('.')[0]}"][data-i="${a.split('.')[1]}"]`).getBoundingClientRect();
      off = Math.max(off, Math.abs((na.left + na.width / 2 - sr.left) * k - m[0]), Math.abs((na.top - sr.top) * k - m[1])); }
    const pastOk = [...svg.querySelectorAll('path.e-past')].every((e) => { const [a, c] = e.dataset.edge.split('-').map((x) => x.split('.').map(Number)); return r.path[a[0] - 1] === a[1] && r.path[c[0] - 1] === c[1]; });
    return { past: cnt('e-past'), next: cnt('e-next'), future: cnt('e-future'), expFuture: exp, nextExp: fl[3].options.length, pastOk, off };
  });
  if (res.none) fails.push(W + ': no svg'); else {
    if (res.past !== 2 || !res.pastOk) fails.push(W + ': past edges ' + res.past);
    if (res.next !== res.nextExp) fails.push(W + ': next edges');
    if (res.future !== res.expFuture) fails.push(W + ': future edges');
    if (res.off > 3) fails.push(W + ': endpoints off by ' + res.off);
  }
  console.log(W, JSON.stringify(res)); await pg.close();
}
await b.close();
if (fails.length || errs.length) { console.log('RC18 ROUTE FAIL', fails, errs); process.exit(1); } console.log('RC18 ROUTE OK');

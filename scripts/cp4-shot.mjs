// CP4 buff-choice screenshots (flag on via ?cp4). Usage: node scripts/cp4-shot.mjs [url] [outdir]
import puppeteer from 'puppeteer-core';
const url = process.argv[2] ?? 'http://127.0.0.1:5199/';
const out = process.argv[3] ?? '/workspace/hv-v3-shots';
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const pg = await br.newPage();
await pg.setViewport({ width: 1280, height: 900 });
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e)));
await pg.goto(url + '?debug&cp4', { waitUntil: 'networkidle0' });
await pg.waitForFunction(() => window.hv);
await pg.evaluate(() => localStorage.clear());
const shot = async (name, setup) => {
  await pg.evaluate(setup);
  await new Promise((r) => setTimeout(r, 400));
  await pg.screenshot({ path: `${out}/${name}.png` });
  return pg.evaluate(() => ({ cards: document.querySelectorAll('.buffcard').length, risk: !!document.querySelector('[data-riskbox]'), badge: document.getElementById('build')?.textContent }));
};
const r1 = await shot('cp4-buff-choice-elite', () => {
  const hv = window.hv; hv.startRun();
  const r = hv.run; r.buffs = ['B2', 'B3']; r.current = { type: 'elite', option: 0 };
  r.offer = { src: 'elite', ids: ['B1', 'B6', 'W2'] }; r.offersLeft = 0; hv.pending = {}; hv.go('node');
});
const r2 = await shot('cp4-buff-choice-shrine', () => {
  const hv = window.hv; const r = hv.run; r.current = { type: 'shrine', option: 0 };
  r.offer = { src: 'shrine', ids: ['O2', 'S-might', 'N1'] }; r.risk = 'curse'; hv.pending = {}; hv.go('node');
});
// Click a card: the choice must land in run.buffs.
await pg.click('[data-buff="S-might"]');
const held = await pg.evaluate(() => window.hv.run.buffs);
const r3 = await shot('cp4-map-buffs', () => { const hv = window.hv; hv.run.risk = null; hv.go('map'); });
console.log(JSON.stringify({ r1, r2, r3, held, errs }, null, 1));
await br.close();
if (errs.length || r1.cards !== 3 || !r2.risk || !held.includes('S-might')) process.exit(1);

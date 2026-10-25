// CP6 rc2 (e): burn/bleed do not carry into the next battle, through the real App flow (tower + abyss). Needs `npx vite --port 5198`.
import puppeteer from 'puppeteer-core';
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const pg = await br.newPage(); await pg.setViewport({ width: 1280, height: 900 });
const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
await pg.goto('http://localhost:5198/?debug', { waitUntil: 'networkidle0' });
await pg.waitForFunction(() => window.hv); await pg.evaluate(() => localStorage.clear()); await pg.reload({ waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv);
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; let ok = true;
const fightOnce = async () => {
  const i = await pg.evaluate(() => { const r = window.hv.run; const f = r.tower.floors[r.floor - 1]; const i = f.options.findIndex((t) => t === 'battle' || t === 'elite'); window.hv.enterNode(i); return i; });
  await w(700); return i;
};
for (const mode of ['tower', 'abyss']) {
  await pg.evaluate((m) => { const hv = window.hv; if (m === 'abyss') { hv.p.abyssBest = Math.max(hv.p.abyssBest ?? 0, 1); hv.startAbyss(); } else hv.startRun(); }, mode);
  await w(300);
  await pg.evaluate(() => { const r = window.hv.run; const i = r.tower.floors.findIndex((f) => f.options.some((t) => t === 'battle' || t === 'elite')); r.floor = i + 1; });
  const i1 = await fightOnce();
  const mid = await pg.evaluate(() => { const b = window.hv.battle; if (!b?.cp5) return null; b.cp5.pdot = { ...b.cp5.pdot, burn: 9, burnTurns: 4, bleed: 6, bleedTurns: 3 }; window.hv.run.pdot = { ...b.cp5.pdot }; /* worst case: the run also holds the DoT (old carry path) */ b.hp = b.d.hp; for (const m of b.monsters) m.hp = 1; window.hv.render(); return { dotShown: !!document.querySelector('.pdot') }; });
  await pg.evaluate(async () => { const hv = window.hv; hv.data.settings.skipAnim = true; for (let k = 0; k < 20 && hv.screen === 'battle'; k++) { for (const m of hv.battle.monsters) if (m.hp > 1) m.hp = 1; hv.battle.hp = hv.battle.d.hp; await hv.command('attack'); await new Promise((r) => setTimeout(r, 300)); } });
  await w(800);
  const after = await pg.evaluate(() => ({ screen: window.hv.screen, pdot: window.hv.run.pdot ?? null, done: window.hv.run.done ?? null }));
  await pg.evaluate(() => document.querySelector('[data-continue]')?.click()); await w(400);
  await pg.evaluate(() => { const r = window.hv.run; const j = r.tower.floors.findIndex((f, k) => k >= r.floor - 1 && f.options.some((t) => t === 'battle' || t === 'elite')); r.floor = (j >= 0 ? j : r.tower.floors.findIndex((f) => f.options.some((t) => t === 'battle' || t === 'elite'))) + 1; window.hv.go('map'); });
  await fightOnce();
  const next = await pg.evaluate(() => { const p = window.hv.battle?.cp5?.pdot; return { burnTurns: p?.burnTurns, bleedTurns: p?.bleedTurns, dotUi: !!document.querySelector('.hud .pdot .dot-burn, .hud .pdot .dot-bleed') }; });
  out[mode] = { i1, mid, after, next };
  if (!mid?.dotShown || after.screen !== 'node' || after.pdot || after.done || next.burnTurns !== 0 || next.bleedTurns !== 0 || next.dotUi) ok = false;
}
out.errs = errs; if (errs.length) ok = false;
console.log(JSON.stringify(out)); console.log(ok ? 'E2E PASS (e)' : 'E2E FAIL (e)'); await br.close(); process.exit(ok ? 0 : 1);

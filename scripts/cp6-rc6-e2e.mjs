// rc6 e2e item 2: the battle panel lists every live monster's weaknesses AND resistances, value for value against its spec.
// Needs a server (vite / vite preview). Usage: node scripts/cp6-rc6-e2e.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://localhost:5198/';
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const w = (ms) => new Promise((r) => setTimeout(r, ms)); const fail = []; const errs = []; const res = {};
for (const [k, type] of [['abyss15', 'battle'], ['abyss15', 'elite'], ['postF20-blade', 'boss']]) {
  const pg = await br.newPage(); await pg.setViewport({ width: 1280, height: 900 }); pg.on('pageerror', (e) => errs.push(k + ' ' + e));
  await pg.goto(BASE + `?cp6&preset=${k}`, { waitUntil: 'networkidle0' }); await pg.waitForFunction(() => window.hv);
  await pg.click('[data-abyss]'); await w(400);
  await pg.evaluate((t) => window.hv.startBattle(t), type); await w(600);
  const r = await pg.evaluate(() => {
    const hv = window.hv, out = [];
    hv.battle.monsters.forEach((m, i) => {
      if (m.hp <= 0) return;
      const row = document.querySelector(`[data-weak="${i}"]`);
      const shown = [...(row?.querySelectorAll('[data-wk],[data-res]') ?? [])].map((e) => e.dataset.wk ? `${e.dataset.wk.split(':')[0]}:-${e.dataset.wk.split(':')[1]}` : e.dataset.res).sort();
      const want = Object.entries(m.spec).filter(([, v]) => v !== 0).map(([t, v]) => `${t}:${v}`).sort();
      out.push({ i, name: m.name, row: !!row, resLabel: !!row?.querySelector('[data-resl]'), ok: JSON.stringify(shown) === JSON.stringify(want), shown, want });
    });
    return out;
  });
  res[`${k}/${type}`] = r;
  if (!r.length || r.some((x) => !x.row || !x.resLabel || !x.ok)) fail.push(`${k}/${type}`);
  if (type === 'battle') await pg.screenshot({ path: '/tmp/rc6-panel.png' });
  await pg.close();
}
if (errs.length) fail.push('errors');
console.log(JSON.stringify({ res, errs }, null, 1)); console.log(fail.length ? 'FAIL ' + fail.join(', ') : 'ALL PASS'); await br.close(); process.exit(fail.length ? 1 : 0);

// rc12c e2e: every battle turn shows exactly ONE ★ key — the ★ button, the status bar 「建議 ★X·…」 and the 決策 line agree, no 💡 「可以用了」,
// and no non-💡 line containing 建議/決策 names another key. Plays each school by pressing only the ★ button (what QA's driver should do).
// Usage: node scripts/rc12c-primary-e2e.mjs [base]
import p from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5199/';
const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader'], defaultViewport: { width: 1280, height: 900 } });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [], fail = [], R = {};
const check = () => pg.evaluate(() => {
  const btn = [...document.querySelectorAll('.cmdbar button[data-primary]')], stars = [...document.querySelectorAll('.cmdbar button')].filter((x) => x.textContent.includes('★'));
  const bar = document.querySelector('[data-primarybar]'), dec = document.querySelector('[data-primarykey]');
  const lines = document.querySelector('.hud').innerText.split('\n').filter((l) => /建議|決策/.test(l) && !/💡/.test(l));
  const keys = lines.flatMap((l) => [...l.replace(/^.*?(建議|決策)/, '').matchAll(/([0-9A-Z])\s*·/g)].map((x) => x[1]));
  return { n: btn.length, nStar: stars.length, k: btn[0]?.dataset.primary, bar: bar?.dataset.primarybar, dec: dec?.dataset.primarykey, keys: [...new Set(keys)], ready: !!document.querySelector('[data-skillready],[data-readybtn],[data-sugbtn],[data-spellhint]'), over: !!window.hv.battle?.over, turn: window.hv.battle?.turn, oc: window.hv.battle?.oc };
});
let pg;
for (const school of ['blade', 'bulwark', 'oc', 'arcane']) {
  pg = await b.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(BASE + `?cp6&cp8&debug&fresh&preset=postF20-${school}`, { waitUntil: 'networkidle0' }); await w(300);
  await pg.evaluate(() => { const h = window.hv; h.data.settings.speed = 4; h.data.settings.skipAnim = true; h.stage.speed = 4; h.stage.skip = true; h.render(); });
  await pg.click('[data-abyss]'); await w(300);
  for (let i = 0; i < 3 && (await pg.$('[data-modal-ok]')); i++) { await pg.click('[data-modal-ok]'); await w(300); }
  for (let i = 0; i < 6 && (await pg.$('[data-startpick] [data-buff],[data-heldskip]')); i++) { const c = await pg.$('[data-startpick] [data-buff],[data-heldskip]'); await c.click(); await w(150); }
  // enter the first battle node through the app's own handler (map click timing is not what this e2e checks)
  await pg.evaluate(async () => { const h = window.hv, n = [...document.querySelectorAll('button[data-node]')].find((x) => /n-battle/.test(x.className)) ?? document.querySelector('button[data-node]'); await h.enterNode(+n.dataset.node); });
  await w(1500);
  if (!(await pg.evaluate(() => !!window.hv.battle))) { fail.push(`${school}: no battle; ${await pg.evaluate(() => document.body.innerText.slice(0, 300))}`); await pg.close(); continue; }
  await pg.evaluate(() => { const s = window.hv.battle; for (const m of s.monsters) { m.hp = m.maxHp = 1e6; } window.hv.render(); });
  const idle = () => pg.waitForFunction(() => !window.hv.busy, { timeout: 8000 }).catch(() => {});
  const seen = {}; let turns = 0;
  for (let t = 0; t < 24; t++) {
    // vary the state: OC for skills, a telegraph, low HP
    await pg.evaluate((t) => { const h = window.hv, s = h.battle; if (!s || s.over) return; h.chargeHoldUntil = 0; if (t % 6 === 2) s.oc = Math.max(s.oc, 200); if (t % 6 === 4) { const m = s.monsters.find((x) => x.hp > 0); if (m) m.charge = 1; } if (t % 6 === 5) s.hp = Math.max(1, Math.round(s.d.hp * 0.15)); h.render(); }, t);
    await w(80); const c = await check(); if (c.over || c.turn === undefined) break;
    turns++; seen[c.k] = (seen[c.k] ?? 0) + 1;
    const bad = [c.n !== 1 && `★button×${c.n}`, c.nStar !== 1 && `★text×${c.nStar}`, c.bar !== c.k && `bar ${c.bar}≠${c.k}`, c.dec !== c.k && `決策 ${c.dec}≠${c.k}`, c.keys.some((k) => k !== c.k) && `lines ${c.keys}`, c.ready && 'old hint'].filter(Boolean);
    if (bad.length) fail.push(`${school} t${c.turn}: ${bad.join(', ')}`);
    await pg.$eval('.cmdbar button[data-primary]', (x) => x.click()).catch(() => fail.push(`${school}: no ★ to click`));
    await w(150); await idle(); await w(150);
    for (let k = 0; k < 3; k++) { const s = await pg.evaluate(() => window.hv.battle?.monsters.some((m) => m.charge > 0) && window.hv.busy); if (!s) break; await w(400); }
  }
  R[school] = { turns, keys: seen };
  await pg.close();
}
await b.close();
console.log(JSON.stringify({ R, fail, errs }, null, 1));
process.exit(fail.length || errs.length ? 1 : 0);
